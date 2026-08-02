import type { createClient } from "./supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const keyCandidates = ["key", "setting_key", "name", "setting_name", "slug"];
const valueCandidates = ["value", "setting_value", "data", "content", "settings"];

async function findColumn(supabase: SupabaseClient, candidates: string[]) {
  for (const candidate of candidates) {
    const { error } = await supabase.from("site_settings").select(candidate).limit(0);
    if (!error) return candidate;
  }
  return null;
}

export async function getSettingColumns(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1);
  if (error) return { keyColumn: null, valueColumn: null, error };

  const existingColumns = data?.[0] ? Object.keys(data[0]) : [];
  const keyColumn = keyCandidates.find((column) => existingColumns.includes(column))
    || await findColumn(supabase, keyCandidates);
  const valueColumn = valueCandidates.find((column) => existingColumns.includes(column))
    || await findColumn(supabase, valueCandidates);

  return { keyColumn, valueColumn, error: null };
}

export async function readSiteSetting(supabase: SupabaseClient, settingName: string) {
  const { keyColumn, valueColumn, error } = await getSettingColumns(supabase);
  if (error || !keyColumn || !valueColumn) {
    return { value: null, error: error || new Error("Site ayarları tablosunun sütunları bulunamadı.") };
  }

  const result = await supabase
    .from("site_settings")
    .select(valueColumn)
    .eq(keyColumn, settingName)
    .maybeSingle();

  const row = result.data as Record<string, unknown> | null;
  return { value: row?.[valueColumn] ?? null, error: result.error };
}

export async function writeSiteSetting(
  supabase: SupabaseClient,
  settingName: string,
  value: unknown,
) {
  const { keyColumn, valueColumn, error } = await getSettingColumns(supabase);
  if (error || !keyColumn || !valueColumn) {
    return { error: error || new Error("Site ayarları tablosunun sütunları bulunamadı.") };
  }

  const existing = await supabase
    .from("site_settings")
    .select(keyColumn)
    .eq(keyColumn, settingName)
    .maybeSingle();
  if (existing.error) return { error: existing.error };

  if (existing.data) {
    const result = await supabase
      .from("site_settings")
      .update({ [valueColumn]: value })
      .eq(keyColumn, settingName);
    return { error: result.error };
  }

  const result = await supabase
    .from("site_settings")
    .insert({ [keyColumn]: settingName, [valueColumn]: value });
  return { error: result.error };
}

