// ============================================
// FILE: src/lib/redis/image-cache.ts
// ============================================
// Helper untuk cache URL gambar Supabase Storage ke Redis.
//
// Strategi:
// - Setiap path gambar di-cache sebagai key Redis
// - TTL default 6 jam (signed URL) atau 24 jam (public URL)
// - Saat cache miss → ambil dari Supabase, simpan ke Redis
// - Mengurangi request ke Supabase Storage secara signifikan

import { createClient } from "@supabase/supabase-js";
import { redis } from "./client";

// Supabase server client (hanya dipakai di server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Constants ──────────────────────────────────────────────────────────────

/** TTL untuk signed URL (detik). Signed URL Supabase max 1 jam, jadi kita cache lebih pendek */
const SIGNED_URL_TTL = 55 * 60; // 55 menit

/** TTL untuk public URL (detik). Public URL tidak expire, cache 24 jam */
const PUBLIC_URL_TTL = 24 * 60 * 60; // 24 jam

/** Prefix key Redis untuk image cache */
const CACHE_PREFIX = "img:";

// ── Types ──────────────────────────────────────────────────────────────────

export type ImageBucket =
  | "dokter"
  | "berita"
  | "avatars"
  | "public"
  | (string & {});

// ── Helpers ────────────────────────────────────────────────────────────────

function cacheKey(bucket: string, path: string): string {
  // Sanitize path agar aman sebagai Redis key
  const safePath = path.replace(/[^a-zA-Z0-9._/-]/g, "_");
  return `${CACHE_PREFIX}${bucket}:${safePath}`;
}

/**
 * Cek apakah path adalah URL lengkap (sudah ada http/https)
 * Supabase kadang menyimpan full URL langsung sebagai value kolom `profile`
 */
function isFullUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Ekstrak bucket dan path dari full Supabase Storage URL.
 * Contoh: https://xxx.supabase.co/storage/v1/object/public/dokter/foto.jpg
 *         → { bucket: "dokter", path: "foto.jpg" }
 */
function parseSupabaseStorageUrl(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    // Path: /storage/v1/object/public/{bucket}/{path...}
    const match = parsed.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/,
    );
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch {
    return null;
  }
}

// ── Core functions ─────────────────────────────────────────────────────────

/**
 * Dapatkan public URL dari Supabase Storage (tidak perlu sign, tidak ada expiry).
 * Gunakan ini untuk bucket yang memang public.
 */
export function getPublicUrl(bucket: ImageBucket, path: string): string {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Dapatkan signed URL dari Supabase Storage dengan Redis cache.
 * Signed URL punya expiry, jadi TTL cache = 55 menit (lebih pendek dari 1 jam expiry).
 *
 * @param bucket - nama bucket di Supabase Storage
 * @param path   - path file di dalam bucket
 */
export async function getSignedUrlCached(
  bucket: ImageBucket,
  path: string,
): Promise<string | null> {
  if (!path) return null;

  const key = cacheKey(bucket, path);

  // 1. Cek cache Redis dulu
  const cached = await redis.get(key);
  if (cached) return cached;

  // 2. Cache miss → buat signed URL dari Supabase
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL + 5 * 60); // sedikit lebih panjang dari cache TTL

    if (error || !data?.signedUrl) return null;

    // 3. Simpan ke Redis
    await redis.set(key, data.signedUrl, SIGNED_URL_TTL);

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Dapatkan public URL dengan Redis cache.
 * Gunakan ini untuk bucket yang public — URL tidak expire, cache lama.
 *
 * @param bucket - nama bucket di Supabase Storage
 * @param path   - path file di dalam bucket
 */
export async function getPublicUrlCached(
  bucket: ImageBucket,
  path: string,
): Promise<string | null> {
  if (!path) return null;

  const key = cacheKey(bucket, path);

  // 1. Cek cache Redis dulu
  const cached = await redis.get(key);
  if (cached) return cached;

  // 2. Cache miss → generate public URL (tidak perlu network call ke Supabase)
  const url = getPublicUrl(bucket, path);

  // 3. Simpan ke Redis dengan TTL 24 jam
  await redis.set(key, url, PUBLIC_URL_TTL);

  return url;
}

/**
 * Fungsi utama: resolve image URL apapun bentuknya ke URL yang bisa dipakai <Image>.
 *
 * Mendukung:
 * - Full URL Supabase Storage (http://...) → extract bucket+path, cache
 * - Path relatif (foto.jpg) → generate public URL, cache
 * - null/undefined → return null
 *
 * @param pathOrUrl - nilai dari kolom `profile`, `thumbnail`, `avatar`, dll
 * @param bucket    - bucket fallback jika pathOrUrl bukan full URL
 * @param usePublic - true jika bucket public (default), false untuk signed URL
 */
export async function resolveImageUrl(
  pathOrUrl: string | null | undefined,
  bucket: ImageBucket,
  usePublic = true,
): Promise<string | null> {
  if (!pathOrUrl) return null;

  // Kalau sudah full URL Supabase Storage
  if (isFullUrl(pathOrUrl)) {
    // Parse untuk dapat bucket dan path, lalu cache
    const parsed = parseSupabaseStorageUrl(pathOrUrl);
    if (parsed) {
      const key = cacheKey(parsed.bucket, parsed.path);
      const cached = await redis.get(key);
      if (cached) return cached;

      // Simpan URL asli ke cache (URL public tidak expire)
      await redis.set(key, pathOrUrl, PUBLIC_URL_TTL);
      return pathOrUrl;
    }

    // URL bukan dari Supabase Storage, return as-is
    return pathOrUrl;
  }

  // Path relatif → generate URL
  if (usePublic) {
    return getPublicUrlCached(bucket, pathOrUrl);
  } else {
    return getSignedUrlCached(bucket, pathOrUrl);
  }
}

/**
 * Invalidate cache untuk satu gambar.
 * Panggil ini ketika gambar di-update/delete.
 */
export async function invalidateImageCache(
  bucket: ImageBucket,
  path: string,
): Promise<void> {
  const key = cacheKey(bucket, path);
  await redis.del(key);
}

/**
 * Batch resolve: resolve banyak image URL sekaligus.
 * Lebih efisien untuk list/grid yang punya banyak gambar.
 */
export async function resolveImageUrls(
  items: Array<{
    pathOrUrl: string | null | undefined;
    bucket: ImageBucket;
    usePublic?: boolean;
  }>,
): Promise<Array<string | null>> {
  return Promise.all(
    items.map(({ pathOrUrl, bucket, usePublic = true }) =>
      resolveImageUrl(pathOrUrl, bucket, usePublic),
    ),
  );
}
