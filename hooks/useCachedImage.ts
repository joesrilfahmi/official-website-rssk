// ============================================
// FILE: src/hooks/useCachedImage.ts
// ============================================
// React hooks untuk mengambil image URL yang sudah di-cache Redis.
// Cocok dipakai di client components Next.js.
//
// Cara pakai:
//
//   // Single image
//   const { url, loading } = useCachedImage(dokter.profile, "dokter");
//
//   // Banyak gambar sekaligus (lebih efisien)
//   const { urls, loading } = useCachedImages([
//     { path: dokter1.profile, bucket: "dokter" },
//     { path: dokter2.profile, bucket: "dokter" },
//   ]);

"use client";

import { useEffect, useRef, useState } from "react";

// ── In-memory cache di browser (mencegah refetch antar re-render) ──────────
const memCache = new Map<string, string | null>();

// ── Types ──────────────────────────────────────────────────────────────────

export type ImageBucket = "dokter" | "berita" | "avatars" | "public" | string;

export interface UseCachedImageResult {
  url: string | null;
  loading: boolean;
}

export interface BatchImageItem {
  path: string | null | undefined;
  bucket: ImageBucket;
  usePublic?: boolean;
}

export interface UseCachedImagesResult {
  urls: Array<string | null>;
  loading: boolean;
}

// ── Single image hook ──────────────────────────────────────────────────────

/**
 * Hook untuk satu gambar.
 *
 * @param pathOrUrl - nilai kolom `profile`, `thumbnail`, `avatar`, dll
 * @param bucket    - nama bucket Supabase Storage
 * @param usePublic - true (default) untuk public bucket
 *
 * @example
 * const { url, loading } = useCachedImage(dokter.profile, "dokter");
 * // <Image src={url ?? "/placeholder.png"} ... />
 */
export function useCachedImage(
  pathOrUrl: string | null | undefined,
  bucket: ImageBucket,
  usePublic = true,
): UseCachedImageResult {
  const cacheKey = pathOrUrl ? `${bucket}:${pathOrUrl}` : null;

  const [url, setUrl] = useState<string | null>(() => {
    // Inisialisasi dari in-memory cache
    if (!cacheKey) return null;
    if (memCache.has(cacheKey)) return memCache.get(cacheKey) ?? null;
    // Kalau sudah full URL, langsung pakai
    if (
      pathOrUrl &&
      (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://"))
    ) {
      memCache.set(cacheKey, pathOrUrl);
      return pathOrUrl;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!cacheKey) return false;
    if (memCache.has(cacheKey)) return false;
    if (
      pathOrUrl &&
      (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://"))
    )
      return false;
    return !!pathOrUrl;
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setUrl(null);
      setLoading(false);
      return;
    }

    // Sudah full URL → tidak perlu fetch
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
      // Tetap cache di memory dan kirim ke API untuk di-cache di Redis (fire & forget)
      setUrl(pathOrUrl);
      setLoading(false);
      return;
    }

    // Cek in-memory cache browser
    const key = `${bucket}:${pathOrUrl}`;
    if (memCache.has(key)) {
      setUrl(memCache.get(key) ?? null);
      setLoading(false);
      return;
    }

    // Fetch via API route (yang baca/tulis Redis di server)
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const params = new URLSearchParams({
      bucket,
      path: pathOrUrl,
      public: String(usePublic),
    });

    fetch(`/api/image-url?${params.toString()}`, {
      signal: abortRef.current.signal,
    })
      .then((r) => r.json())
      .then(({ url: resolvedUrl }: { url: string | null }) => {
        memCache.set(key, resolvedUrl);
        setUrl(resolvedUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setUrl(null);
          setLoading(false);
        }
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [pathOrUrl, bucket, usePublic]);

  return { url, loading };
}

// ── Batch images hook ──────────────────────────────────────────────────────

/**
 * Hook untuk banyak gambar sekaligus — satu request ke server.
 * Lebih efisien dari memanggil useCachedImage N kali untuk list/grid.
 *
 * @param items - array { path, bucket, usePublic? }
 *
 * @example
 * const { urls, loading } = useCachedImages(
 *   dokterList.map(d => ({ path: d.profile, bucket: "dokter" }))
 * );
 * // urls[0] → URL gambar dokterList[0]
 */
export function useCachedImages(
  items: BatchImageItem[],
): UseCachedImagesResult {
  // Buat stable key dari items
  const itemsKey = items
    .map((i) => `${i.bucket}:${i.path ?? ""}:${i.usePublic ?? true}`)
    .join("|");

  const [urls, setUrls] = useState<Array<string | null>>(() => {
    // Inisialisasi: cek yang sudah di in-memory cache
    return items.map((item) => {
      if (!item.path) return null;
      if (item.path.startsWith("http://") || item.path.startsWith("https://"))
        return item.path;
      const key = `${item.bucket}:${item.path}`;
      return memCache.get(key) ?? null;
    });
  });

  const [loading, setLoading] = useState<boolean>(() => {
    // Loading hanya jika ada item yang belum di-cache
    return items.some((item) => {
      if (!item.path) return false;
      if (item.path.startsWith("http://") || item.path.startsWith("https://"))
        return false;
      const key = `${item.bucket}:${item.path}`;
      return !memCache.has(key);
    });
  });

  const abortRef = useRef<AbortController | null>(null);
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    if (itemsKey === prevKeyRef.current) return;
    prevKeyRef.current = itemsKey;

    if (items.length === 0) {
      setUrls([]);
      setLoading(false);
      return;
    }

    // Pisahkan yang sudah cached dan yang belum
    const resolved = items.map((item) => {
      if (!item.path) return { cached: true, url: null as string | null };
      if (item.path.startsWith("http://") || item.path.startsWith("https://"))
        return { cached: true, url: item.path };
      const key = `${item.bucket}:${item.path}`;
      if (memCache.has(key))
        return { cached: true, url: memCache.get(key) ?? null };
      return { cached: false, url: null as string | null };
    });

    const needFetch = resolved.some((r) => !r.cached);

    if (!needFetch) {
      setUrls(resolved.map((r) => r.url));
      setLoading(false);
      return;
    }

    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    fetch("/api/image-url/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          path: item.path,
          bucket: item.bucket,
          usePublic: item.usePublic ?? true,
        })),
      }),
      signal: abortRef.current.signal,
    })
      .then((r) => r.json())
      .then(({ urls: fetchedUrls }: { urls: Array<string | null> }) => {
        // Simpan semua ke in-memory cache
        items.forEach((item, idx) => {
          if (item.path && !item.path.startsWith("http")) {
            const key = `${item.bucket}:${item.path}`;
            memCache.set(key, fetchedUrls[idx]);
          }
        });
        setUrls(fetchedUrls);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setUrls(items.map(() => null));
          setLoading(false);
        }
      });

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  return { urls, loading };
}
