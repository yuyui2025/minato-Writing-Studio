import { supabase } from "../supabase";

interface StoredData<T> {
  value: T;
  updated_at: string;
}

function readLocal<T>(key: string): StoredData<T> | null {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) as StoredData<T> : null;
}

export async function storageGet<T = unknown>(key: string): Promise<T | null> {
  const localData = readLocal<T>(key);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Use ?? (nullish coalescing) so falsy values like "" or false are preserved
    if (!user) return localData != null ? localData.value : null;

    const { data, error } = await supabase
      .from("minato_data")
      .select("value, updated_at")
      .eq("user_id", user.id)
      .eq("key", key)
      .single();

    if (error || !data) return localData != null ? localData.value : null;

    const remoteData: StoredData<T> = { value: data.value, updated_at: data.updated_at };

    if (!localData || new Date(remoteData.updated_at) > new Date(localData.updated_at)) {
      localStorage.setItem(key, JSON.stringify(remoteData));
      return remoteData.value;
    }
    return localData.value;
  } catch {
    return localData != null ? localData.value : null;
  }
}

export async function storageGetMany(keys: string[]): Promise<Record<string, unknown>> {
  const uniqueKeys = Array.from(new Set(keys));
  const localMap = new Map<string, StoredData<unknown> | null>();
  const result: Record<string, unknown> = {};

  for (const key of uniqueKeys) {
    const localData = readLocal<unknown>(key);
    localMap.set(key, localData);
    result[key] = localData != null ? localData.value : null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || uniqueKeys.length === 0) return result;

    const { data, error } = await supabase
      .from("minato_data")
      .select("key, value, updated_at")
      .eq("user_id", user.id)
      .in("key", uniqueKeys);

    if (error || !data) return result;

    for (const row of data as Array<{ key: string; value: unknown; updated_at: string }>) {
      const localData = localMap.get(row.key);
      const remoteData: StoredData<unknown> = { value: row.value, updated_at: row.updated_at };
      if (!localData || new Date(remoteData.updated_at) > new Date(localData.updated_at)) {
        localStorage.setItem(row.key, JSON.stringify(remoteData));
        result[row.key] = remoteData.value;
      } else {
        result[row.key] = localData.value;
      }
    }
  } catch {
    // localStorage fallback already populated in result
  }

  return result;
}

export async function storageSet(key: string, value: unknown): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const data = { value, updated_at: updatedAt };

  // localStorage is the primary store. Write it first and treat its success as the save result.
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
    return false;
  }

  // Supabase sync is best-effort. Failures do not affect the return value.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("minato_data").upsert({
        user_id: user.id,
        key,
        value,
        updated_at: updatedAt,
      }, { onConflict: "user_id,key" });
    }
  } catch (e) {
    console.error(e);
  }

  return true;
}
