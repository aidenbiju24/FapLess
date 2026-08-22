# FapLess Recovery

A private, calm recovery and self-control platform for web and iOS, built with Expo Router, TypeScript, Supabase, and server-side NVIDIA NIM integration.

## What is built

- Responsive Expo Router application for web and iOS.
- Daily dashboard with current streak, longest streak, recovery progress, check-in status, phases, and data-based recommendations.
- Daily check-ins with mood, energy, confidence, urge level, sleep, triggers, wins, difficulties, and notes.
- One-tap SOS flow for intensity, trigger, immediate action, and outcome.
- Respectful relapse logging that restarts only the current streak and preserves historical progress.
- Private journal with search, tags, mood, create, and delete flows.
- Progress analytics for streaks, urges, trigger frequency, risk time, recovery score, milestones, goals, and challenges.
- Email/password auth interface with Supabase Auth when configured, plus local demo mode for UI development.
- Local-first persistence through AsyncStorage and browser localStorage, with authenticated Supabase pull/upsert reconciliation when configured.
- Supabase migrations with normalized tables, constraints, indexes, ownership RLS, profile creation trigger, cross-table ownership checks, active-streak sync, and journal deletion markers.
- Authenticated `ai-chat` and `ai-analysis` Edge Functions with minimized context, safety gate, configurable routing, timeout, and fallback behavior.
- Authenticated `delete-account` Edge Function using the server-only service role and database cascades.
- JSON export and local data reset controls.

## Run locally

```bash
npm install
npm run web
```

The app runs in local demo mode without environment variables. Demo data is stored only on the current device/browser. To enable Supabase authentication and Edge Function calls, copy `.env.example` to `.env.local` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://qrjgeuygfvlmgetlppta.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Only the Supabase URL and publishable key are client configuration. Never put a database password, service-role key, or NVIDIA key in `.env.local`, Expo public variables, the browser bundle, or an IPA.

## Supabase

The project reference is `qrjgeuygfvlmgetlppta`. Migrations live in `supabase/migrations/001_initial_schema.sql` through `005_journal_deletion_sync.sql`; apply all migrations in order with the Supabase CLI.

With the Supabase CLI authenticated:

```bash
supabase link --project-ref qrjgeuygfvlmgetlppta
supabase db push
```

Every user-owned table has RLS enabled and policies requiring `user_id = auth.uid()` (or `profiles.id = auth.uid()`). The profile trigger creates a private profile after registration. No client uses a service-role credential.

## AI architecture

The client calls only `supabase.functions.invoke("ai-chat")`. The Edge Function authenticates the bearer token, validates and limits the message, loads only task-specific context for that user, runs the safety route for sensitive recovery requests, selects a route, calls the configured NVIDIA-compatible endpoint, and returns a sanitized response. It never accepts arbitrary SQL or client-supplied credentials.

Because NIM catalog identifiers can change, the primary model ID is an Edge Function secret/configuration rather than a guessed constant. Configure these server-side variables with placeholders from `.env.example`:

- `NVIDIA_NIM_API_KEY` and `NVIDIA_NIM_MODEL` for the primary Nemotron-compatible coach route
- `NVIDIA_GLM_API_KEY` and `NVIDIA_GLM_MODEL_ID` for deep analysis
- `NVIDIA_SAFETY_API_KEY` and `NVIDIA_SAFETY_MODEL_ID` for fail-closed safety classification
- `NVIDIA_NIM_BASE_URL` when using a non-default compatible endpoint
- `SUPABASE_SERVICE_ROLE_KEY` is managed by Supabase and is used only by `delete-account`

Deploy with the Supabase CLI after setting the secrets:

```bash
supabase secrets set NVIDIA_NIM_API_KEY=... NVIDIA_NIM_MODEL=...
supabase secrets set NVIDIA_GLM_API_KEY=... NVIDIA_GLM_MODEL_ID=...
supabase secrets set NVIDIA_SAFETY_API_KEY=... NVIDIA_SAFETY_MODEL_ID=...
supabase functions deploy ai-chat
supabase functions deploy ai-analysis
supabase functions deploy delete-account
```

Do not print or commit secret values. The safety route intentionally fails closed if its configured service is unavailable.

## iOS and web

```bash
npm run ios
npm run web
```

For a native build, use the Expo workflow appropriate to the local Apple signing setup. This repository does not claim an IPA has been produced on Windows; an actual iOS build requires macOS/Xcode or an authorized EAS build environment and a valid signing identity. The app uses the same Supabase Auth/session configuration on web and iOS.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
npx expo export --platform web
```

## Privacy and limitations

There is no invasive analytics or advertising. Local-first records are stored on-device; when a user is authenticated and Supabase is configured, core records reconcile through serialized local writes, authenticated RLS-protected upserts, and journal deletion markers. Background offline queue reconciliation, push notifications, accountability sharing, content blocking, widgets, and AI conversation persistence remain deployment-stage extensions because they require platform permissions and external service configuration. Permanent account deletion is implemented as a server-side function and requires deploying it with Supabase's managed service-role secret.

This application is not medical or emergency care. For immediate danger or crisis, contact local emergency services or a qualified professional.
