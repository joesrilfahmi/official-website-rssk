// ============================================
// FILE: src/lib/supabase/client.ts
// ============================================
// Tidak ada perubahan dari versi asli.
// File ini tetap dipakai untuk fetch DATA (rows dari tabel).
//
// Untuk IMAGE URL → gunakan:
//   - Server side: resolveImageUrl() dari @/lib/redis/image-cache
//   - Client side: useCachedImage() dari @/hooks/useCachedImage
//   - Component  : <CachedImage> dari @/components/ui/custom/cached-image

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
