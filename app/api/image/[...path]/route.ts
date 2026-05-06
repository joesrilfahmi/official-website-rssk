// ============================================
// FILE: src/app/api/image/[...path]/route.ts
// ============================================
// Proxy gambar dari Supabase Storage.
//
// Cara kerja:
// 1. Browser request ke /api/image/dokter/foto.jpg
// 2. Server fetch gambar dari Supabase Storage (1x)
// 3. Response dikirim ke browser dengan Cache-Control: 7 hari
// 4. Browser & CDN cache gambar — Supabase tidak di-hit lagi
//
// Hasil: Supabase Cached Egress hanya terhitung SEKALI per gambar,
// bukan setiap kali halaman dibuka.

import { redis } from "@/lib/redis/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Cache di browser & CDN selama 7 hari, stale-while-revalidate 1 hari
const CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400, immutable";

// TTL flag di Redis: 6 hari (lebih pendek dari browser cache)
const REDIS_FLAG_TTL = 6 * 24 * 60 * 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Content-Type berdasarkan ekstensi file
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  return map[ext] ?? "image/jpeg";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  // path = ["dokter", "foto.jpg"] atau ["berita", "sub", "thumb.png"]
  if (!pathSegments || pathSegments.length < 2) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const bucket = pathSegments[0];
  const filePath = pathSegments.slice(1).join("/");
  const redisKey = `proxy:${bucket}:${filePath}`;

  // ── Cek apakah ada di Redis (artinya sudah pernah di-proxy) ──────────────
  // Kalau ada, kita tahu file ini valid — langsung redirect ke Supabase
  // dengan Cache-Control. Browser akan cache dari Supabase langsung.
  // Ini tetap hemat karena browser tidak re-request jika cache masih valid.
  const cached = await redis.get(redisKey).catch(() => null);

  if (cached) {
    // Sudah pernah di-proxy sebelumnya — redirect ke public URL Supabase
    // Browser sudah punya cache, jadi ini jarang tercapai
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    return NextResponse.redirect(publicUrl, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }

  // ── Pertama kali: fetch gambar dari Supabase, stream ke browser ──────────
  try {
    const supabaseImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    const imageRes = await fetch(supabaseImageUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Penting: tidak cache di server — kita handle sendiri via Redis
      cache: "no-store",
    });

    if (!imageRes.ok) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Tandai di Redis bahwa gambar ini sudah valid
    await redis.set(redisKey, "1", REDIS_FLAG_TTL).catch(() => null);

    const contentType =
      imageRes.headers.get("content-type") ?? getContentType(filePath);

    // Stream gambar ke browser dengan cache header panjang
    return new NextResponse(imageRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
        // ETag untuk conditional request (browser cek apakah perlu re-download)
        ETag: `"${bucket}-${filePath.replace(/\//g, "-")}"`,
        "X-Image-Proxy": "1",
      },
    });
  } catch (err) {
    console.error("[image-proxy] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
