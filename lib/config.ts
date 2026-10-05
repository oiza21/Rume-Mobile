export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const missingConfig = [
  !API_URL && "EXPO_PUBLIC_API_URL",
  !SUPABASE_URL && "EXPO_PUBLIC_SUPABASE_URL",
  !SUPABASE_ANON_KEY && "EXPO_PUBLIC_SUPABASE_ANON_KEY",
].filter(Boolean) as string[];
