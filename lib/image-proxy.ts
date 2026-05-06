// ============================================
// FILE: src/lib/image-proxy.ts
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Regex untuk parse Supabase Storage URL
const STORAGE_URL_REGEX =
  /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/;

/**
 * Ekstrak bucket dan path dari full Supabase Storage URL.
 * Return null jika bukan URL Supabase Storage.
 */
export function parseStorageUrl(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const match = url.match(STORAGE_URL_REGEX);
    if (!match) return null;
    return { bucket: match[1], path: match[2].split("?")[0] }; // buang query string
  } catch {
    return null;
  }
}

/**
 * Generate URL proxy untuk gambar Supabase Storage.
 *
 * @param bucket    - nama bucket ("dokter", "berita", "avatars", dll)
 *                    Pass null jika pathOrUrl sudah full URL
 * @param pathOrUrl - path relatif ("foto.jpg") atau full Supabase URL
 * @returns URL proxy string atau null jika tidak valid
 *
 * @example
 * proxyUrl("dokter", "foto.jpg")          → "/api/image/dokter/foto.jpg"
 * proxyUrl("dokter", null)                → null
 * proxyUrl(null, "https://xxx.co/...")    → "/api/image/dokter/foto.jpg"
 * proxyUrl("dokter", "https://cdn.io/x")  → "https://cdn.io/x" (bukan Supabase, passthrough)
 */
export function proxyUrl(
  bucket: string | null,
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) return null;

  // Kalau sudah full URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    // Cek apakah ini URL Supabase Storage milik kita
    if (SUPABASE_URL && pathOrUrl.startsWith(SUPABASE_URL)) {
      const parsed = parseStorageUrl(pathOrUrl);
      if (parsed) {
        return `/api/image/${parsed.bucket}/${parsed.path}`;
      }
    }
    // Bukan Supabase Storage → passthrough (external URL)
    return pathOrUrl;
  }

  // Path relatif — butuh bucket
  if (!bucket) return null;
  // Bersihkan leading slash
  const cleanPath = pathOrUrl.replace(/^\/+/, "");
  return `/api/image/${bucket}/${cleanPath}`;
}

/**
 * Versi array — batch convert banyak URL sekaligus.
 * Berguna untuk list/grid dokter.
 */
export function proxyUrls(
  items: Array<{
    bucket: string | null;
    pathOrUrl: string | null | undefined;
  }>,
): Array<string | null> {
  return items.map(({ bucket, pathOrUrl }) => proxyUrl(bucket, pathOrUrl));
}
