// ============================================
// FILE: src/components/ui/custom/cached-image.tsx
// ============================================
// Drop-in replacement untuk <Image> dari next/image yang menggunakan
// Redis cache untuk URL Supabase Storage.
//
// Cara pakai (sama seperti <Image> biasa):
//
//   import CachedImage from "@/components/ui/custom/cached-image";
//
//   <CachedImage
//     src={dokter.profile}         // path atau full URL
//     bucket="dokter"              // nama bucket Supabase
//     alt={dokter.nama}
//     fill
//     className="object-cover"
//     fallback={<UserRound />}     // optional: tampilkan ini saat loading/error
//   />

"use client";

import { useCachedImage, type ImageBucket } from "@/hooks/useCachedImage";
import Image, { type ImageProps } from "next/image";
import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CachedImageProps extends Omit<ImageProps, "src"> {
  /** Path atau full URL gambar (dari kolom profile/thumbnail/avatar) */
  src: string | null | undefined;
  /** Nama bucket Supabase Storage */
  bucket: ImageBucket;
  /** Apakah bucket public? Default true */
  usePublic?: boolean;
  /** Fallback yang ditampilkan saat gambar tidak ada / loading */
  fallback?: React.ReactNode;
  /** Wrapper className */
  wrapperClassName?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  bucket,
  usePublic = true,
  fallback,
  wrapperClassName,
  alt,
  className,
  onError,
  ...imageProps
}) => {
  const { url, loading } = useCachedImage(src, bucket, usePublic);
  const [imgError, setImgError] = React.useState(false);

  // Reset error state saat src berubah
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  // Tampilkan fallback saat: loading, tidak ada URL, atau error load gambar
  if (loading || !url || imgError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <Image
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        setImgError(true);
        onError?.(e);
      }}
      {...imageProps}
    />
  );
};

export default CachedImage;
