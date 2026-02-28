import { supabase } from "../supabase";

interface StoredData<T> {
  value: T;
  updated_at: string;
}

export async function storageGet<T = unknown>(key: string): Promise<T | null> {
  const localRaw = localStorage.getItem(key);
  const localData: StoredData<T> | null = localRaw ? JSON.parse(localRaw) : null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localData?.value || null;

    const { data, error } = await supabase
      .from("minato_data")
      .select("value, updated_at")
      .eq("user_id", user.id)
      .eq("key", key)
      .single();

    if (error || !data) return localData?.value || null;

    const remoteData: StoredData<T> = { value: data.value, updated_at: data.updated_at };

    if (!localData || new Date(remoteData.updated_at) > new Date(localData.updated_at)) {
      localStorage.setItem(key, JSON.stringify(remoteData));
      return remoteData.value;
    }
    return localData.value;
  } catch {
    return localData?.value || null;
  }
}

export async function storageSet(key: string, value: unknown): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const data = { value, updated_at: updatedAt };
  
  localStorage.setItem(key, JSON.stringify(data));

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("minato_data").upsert({
      user_id: user.id,
      key,
      value,
      updated_at: updatedAt,
    }, { onConflict: "user_id,key" });

    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
}
