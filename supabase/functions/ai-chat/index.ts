import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Route = "primary" | "deepAnalysis" | "safety";
const MODEL_ENV: Record<Route, { key: string; model: string }> = {
  primary: { key: "NVIDIA_NIM_API_KEY", model: "NVIDIA_NIM_MODEL" },
  deepAnalysis: { key: "NVIDIA_GLM_API_KEY", model: "NVIDIA_GLM_MODEL_ID" },
  safety: { key: "NVIDIA_SAFETY_API_KEY", model: "NVIDIA_SAFETY_MODEL_ID" },
};
const nimUrl = Deno.env.get("NVIDIA_NIM_BASE_URL") ?? "https://integrate.api.nvidia.com/v1/chat/completions";
const maxMessageLength = 4000;
const maxContextItems = 50;
const requestWindowMs = 60_000;
const maxRequestsPerWindow = 10;
const requestWindows = new Map<string, number[]>();

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function routeFor(message: string, requestedRoute?: unknown): Route {
  if (requestedRoute === "deepAnalysis") return "deepAnalysis";
  const normalized = message.toLowerCase();
  if (/90|60|30|long[- ]term|journal history|analy[sz]e my|pattern/.test(normalized)) return "deepAnalysis";
  return "primary";
}

function needsSafety(message: string) {
  return /sexual|porn|urge|relapse|harm|suicid|self[- ]?harm|explicit|abuse|crisis/i.test(message);
}

function isSafeClassification(content: string) {
  const normalized = content.trim().toUpperCase();
  return normalized.startsWith("SAFE") && !normalized.startsWith("UNSAFE");
}

async function callNim(route: Route, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, temperature = 0.35) {
  const config = MODEL_ENV[route];
  const apiKey = Deno.env.get(config.key);
  const model = Deno.env.get(config.model);
  if (!apiKey || !model) throw new Error(`AI route ${route} is not configured`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), route === "deepAnalysis" ? 30000 : 25000);
  try {
    const response = await fetch(nimUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ model, messages, temperature, max_tokens: route === "deepAnalysis" ? 1200 : 600 }),
    });
    if (!response.ok) throw new Error(`NIM request failed with status ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("NIM returned an empty response");
    return { content: content.trim(), model, usage: payload.usage ?? null };
  } finally {
    clearTimeout(timeout);
  }
}

async function loadContext(userId: string, supabase: ReturnType<typeof createClient>, deep: boolean) {
  const [profile, checkIns, urges, relapses, goals] = await Promise.all([
    supabase.from("profiles").select("display_name, goal_days, timezone, primary_goal, preferred_approach, common_triggers, ai_storage_enabled").eq("id", userId).maybeSingle(),
    supabase.from("check_ins").select("date, mood, energy, urge_level, confidence, triggers").eq("user_id", userId).order("date", { ascending: false }).limit(deep ? 30 : 3),
    supabase.from("urges").select("occurred_at, intensity, trigger, action_taken, outcome").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(deep ? maxContextItems : 5),
    deep ? supabase.from("relapses").select("occurred_at, trigger, mood, environment, reflection").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
    supabase.from("goals").select("title, target, current, status").eq("user_id", userId).limit(10),
  ]);
  return { profile: profile.data, checkIns: checkIns.data ?? [], urges: urges.data ?? [], relapses: relapses.data ?? [], goals: goals.data ?? [] };
}

async function storeConversation(supabase: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>, response: { content: string; model: string }) {
  if (body.storeConversation !== true || body.aiStorageEnabled !== true) return;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  let id = conversationId;
  if (id) {
    const { data } = await supabase.from("ai_conversations").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
    if (!data) id = null;
  }
  if (!id) {
    const created = await supabase.from("ai_conversations").insert({ user_id: userId, title: "Recovery coaching" }).select("id").single();
    id = created.data?.id ?? null;
  }
  if (!id) return;
  const message = typeof body.message === "string" ? body.message : "";
  await supabase.from("ai_messages").insert([
    { conversation_id: id, user_id: userId, role: "user", content: message },
    { conversation_id: id, user_id: userId, role: "assistant", content: response.content, model: response.model },
  ]);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Authentication required" }, 401);
    const body = await request.json() as Record<string, unknown>;
    const now = Date.now();
    const recentRequests = (requestWindows.get(user.id) ?? []).filter((timestamp) => now - timestamp < requestWindowMs);
    if (recentRequests.length >= maxRequestsPerWindow) return json({ error: "The coach is taking a short pause. Try again in a minute." }, 429);
    requestWindows.set(user.id, [...recentRequests, now]);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > maxMessageLength) return json({ error: "Message must be between 1 and 4000 characters" }, 400);
    const route = routeFor(message, body.route);
    const context = await loadContext(user.id, supabase, route === "deepAnalysis");
    const aiStorageEnabled = context.profile?.ai_storage_enabled === true;
    const system = "You are FapLess, a calm, direct, practical recovery coach. Be supportive and nonjudgmental. Never shame, diagnose, claim to be a clinician, encourage dependency, or generate explicit sexual content. Give small actionable next steps. Encourage qualified professional support for medical, psychiatric, abuse, or crisis concerns. For immediate danger, encourage local emergency services or a crisis line. Distinguish observations from facts. Context is private and only for this authenticated user.";
    if (needsSafety(message)) {
      try {
        const safety = await callNim("safety", [{ role: "system", content: "Classify this request for a recovery coaching assistant. Return exactly SAFE or UNSAFE. Mark UNSAFE for explicit sexual generation, self-harm instructions, dangerous medical advice, exploitation, or requests that cannot be answered safely." }, { role: "user", content: message }], 0);
        if (!isSafeClassification(safety.content)) return json({ error: "I can help with recovery support, but I cannot help with that request." }, 400);
      } catch {
        return json({ error: "Safety review is temporarily unavailable. Please try again shortly." }, 503);
      }
    }
    const contextMessage = JSON.stringify(context);
    let result;
    try {
      result = await callNim(route, [{ role: "system", content: system }, { role: "system", content: `Minimal recovery context: ${contextMessage}` }, { role: "user", content: message }]);
    } catch {
      if (route !== "primary") result = await callNim("primary", [{ role: "system", content: system }, { role: "user", content: message }]);
      else throw new Error("AI unavailable");
    }
    await storeConversation(supabase, user.id, { ...body, aiStorageEnabled }, result);
    return json({ message: result.content, model: result.model, route, usage: result.usage });
  } catch (error) {
    console.error("ai-chat request failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "The AI coach is temporarily unavailable. Your existing progress is unaffected." }, 503);
  }
});
