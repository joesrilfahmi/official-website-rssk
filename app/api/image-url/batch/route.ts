// ============================================
// FILE: src/app/api/image-url/batch/route.ts
// ============================================
// Batch endpoint untuk resolve banyak gambar sekaligus.
// Lebih efisien dibanding N request individual untuk list/grid.
//
// POST /api/image-url/batch
// Body: { items: [{ path: string, bucket: string, usePublic?: boolean }] }
// Response: { urls: (string | null)[] }

import { resolveImageUrls } from "@/lib/redis/image-cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface BatchItem {
  path: string | null | undefined;
  bucket: string;
  usePublic?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: BatchItem[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ urls: [] });
    }

    // Batasi max 50 item per request
    const limited = items.slice(0, 50);

    const urls = await resolveImageUrls(
      limited.map((item) => ({
        pathOrUrl: item.path,
        bucket: item.bucket as string,
        usePublic: item.usePublic ?? true,
      })),
    );

    return NextResponse.json(
      { urls },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=1800",
        },
      },
    );
  } catch {
    return NextResponse.json({ urls: [] }, { status: 500 });
  }
}
