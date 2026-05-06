// ============================================
// FILE: src/app/api/image-url/route.ts
// ============================================
// API route untuk resolve Supabase Storage URL via Redis cache.
//
// Endpoint: GET /api/image-url?bucket=dokter&path=foto.jpg&public=true
//
// Dipakai oleh hook useCachedImage di client-side agar logika Redis
// tetap di server (tidak expose token ke browser).

import { resolveImageUrl } from "@/lib/redis/image-cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Redis perlu Node.js runtime

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const bucket = searchParams.get("bucket");
  const path = searchParams.get("path");
  const usePublic = searchParams.get("public") !== "false";

  if (!bucket || !path) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  try {
    const url = await resolveImageUrl(path, bucket as string, usePublic);
    return NextResponse.json(
      { url },
      {
        headers: {
          // Cache di browser 5 menit, di CDN 30 menit
          "Cache-Control": "public, max-age=300, s-maxage=1800",
        },
      },
    );
  } catch {
    return NextResponse.json({ url: null }, { status: 500 });
  }
}
