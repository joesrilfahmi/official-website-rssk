// ============================================
// FILE: src/components/ui/custom/cached-image.tsx
// ============================================
// Drop-in replacement untuk <Image> yang routing gambar
// melalui proxy /api/image/[...path] untuk mengurangi
// Supabase Cached Egress.
//
// CARA PAKAI:
//
//   <CachedImage
//     src={dokter.profile}
//     bucket="dokter"
//     alt={dokter.nama}
//     fill
//     className="object-cover"
//     fallback={<UserRound className="w-16 h-16 text-gray-300" />}
//   />
//
// Props sama persis dengan next/image, tambahan:
//   - bucket: string      → nama bucket Supabase
//   - fallback: ReactNode → tampil saat src null/error

"use client";

import { proxyUrl } from "@/lib/image-proxy";
import Image, { type ImageProps } from "next/image";
import React, { useState } from "react";

export interface CachedImageProps extends Omit<ImageProps, "src"> {
  /** Path atau full URL dari kolom profile/thumbnail/avatar */
  src: string | null | undefined;
  /** Nama bucket Supabase Storage */
  bucket: string;
  /** Tampil saat src null atau gagal load */
  fallback?: React.ReactNode;
}

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  bucket,
  fallback,
  alt,
  className,
  onError,
  ...imageProps
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const url = proxyUrl(bucket, src);

  if (!url || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Image
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...imageProps}
    />
  );
};

export default CachedImage;
