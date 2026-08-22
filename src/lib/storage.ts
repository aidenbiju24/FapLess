import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecoveryState } from "@/types/recovery";
import { normalizeState } from "@/lib/state";

const LEGACY_KEY = "fapless-recovery-state-v1";

function scopeHash(scope: string): string {
  let hash = 2166136261;
  for (let index = 0; index < scope.length; index += 1) {
    hash ^= scope.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36);
}

function storageKey(scope: string): string {
  return `fapless-recovery-state-v2-${scopeHash(scope)}`;
}

function webStorage(): Storage | null {
  return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
}

let storageQueue = Promise.resolve();

export async function loadState(scope = "demo-user"): Promise<RecoveryState | null> {
  const key = storageKey(scope);
  try {
    const stored = webStorage()?.getItem(key) ?? (await AsyncStorage.getItem(key));
    if (stored) return normalizeState(JSON.parse(stored) as Partial<RecoveryState>);
    if (scope === "demo-user") {
      const legacy = webStorage()?.getItem(LEGACY_KEY) ?? (await AsyncStorage.getItem(LEGACY_KEY));
      return legacy ? normalizeState(JSON.parse(legacy) as Partial<RecoveryState>) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveState(state: RecoveryState, scope = "demo-user"): Promise<void> {
  const serialized = JSON.stringify(state);
  storageQueue = storageQueue.then(async () => {
    try {
      webStorage()?.setItem(storageKey(scope), serialized);
      await AsyncStorage.setItem(storageKey(scope), serialized);
    } catch {
      // Local persistence is best effort; the UI remains usable if storage is unavailable.
    }
  });
  await storageQueue;
}

export async function clearState(scope = "demo-user"): Promise<void> {
  storageQueue = storageQueue.then(async () => {
    try {
      webStorage()?.removeItem(storageKey(scope));
      await AsyncStorage.removeItem(storageKey(scope));
    } catch {
      // Clearing is best effort when a platform storage provider is unavailable.
    }
  });
  await storageQueue;
}
