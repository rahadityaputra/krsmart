import { createClient } from "@supabase/supabase-js";


const rawUrl: unknown = import.meta.env.VITE_SUPABASE_URL;
const rawKey: unknown = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = typeof rawUrl === "string" ? rawUrl.trim() : "";
const supabaseAnonKey = typeof rawKey === "string" ? rawKey.trim() : "";

// Gagal cepat dengan pesan jelas, daripada error aneh saat Edge Function dipanggil
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diatur di file .env.local."
  );
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error("VITE_SUPABASE_URL bukan URL yang valid (contoh: https://<project-ref>.supabase.co).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Aplikasi belum memakai login, jadi tidak perlu menyimpan/refresh session
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type AppSupabaseClient = typeof supabase;