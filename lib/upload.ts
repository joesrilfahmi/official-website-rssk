// lib/upload.ts

import { supabase } from "@/lib/supabase/client";

export interface UploadOptions {
  bucket: string;
  folder: string;
  file: File;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// lib/upload.ts
export async function uploadFile({
  bucket,
  folder,
  file,
}: {
  bucket: string;
  folder: string;
  file: File;
}) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { success: true, url: publicUrl, path: filePath };
  } catch (error) {
    console.error("Upload exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete file dari Supabase Storage
 * @param bucket - Bucket name
 * @param path - File path
 * @returns boolean
 */
export async function deleteFile(
  bucket: string,
  path: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Delete multiple files dari Supabase Storage
 * @param bucket - Bucket name
 * @param paths - Array of file paths
 * @returns boolean
 */
export async function deleteFiles(
  bucket: string,
  paths: string[],
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error("Delete multiple files error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete multiple files error:", error);
    return false;
  }
}

/**
 * Extract file path from public URL
 * @param url - Public URL dari Supabase Storage
 * @param bucket - Bucket name
 * @returns File path atau null
 */
export function getFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    if (!url) return null;

    // Format URL Supabase: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const urlParts = url.split(`/object/public/${bucket}/`);

    if (urlParts.length === 2) {
      return urlParts[1];
    }

    return null;
  } catch (error) {
    console.error("Error extracting path from URL:", error);
    return null;
  }
}

/**
 * Replace file - delete old and upload new
 * @param bucket - Bucket name
 * @param oldUrl - Old file URL (to be deleted)
 * @param newFile - New file to upload
 * @param folder - Folder path
 * @returns UploadResult
 */
export async function replaceFile(
  bucket: string,
  oldUrl: string | null,
  newFile: File,
  folder: string,
): Promise<UploadResult> {
  try {
    // Delete old file if exists
    if (oldUrl) {
      const oldPath = getFilePathFromUrl(oldUrl, bucket);
      if (oldPath) {
        await deleteFile(bucket, oldPath);
      }
    }

    // Upload new file
    return await uploadFile({
      bucket,
      folder,
      file: newFile,
    });
  } catch (error) {
    console.error("Replace file error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengganti file",
    };
  }
}

/**
 * Get file info from storage
 * @param bucket - Bucket name
 * @param path - File path
 */
export async function getFileInfo(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      console.error("Get file info error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get file info error:", error);
    return null;
  }
}

/**
 * Check if file exists
 * @param bucket - Bucket name
 * @param path - File path
 * @returns boolean
 */
export async function fileExists(
  bucket: string,
  path: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("File exists check error:", error);
    return false;
  }
}

/**
 * Get public URL for a file
 * @param bucket - Bucket name
 * @param path - File path
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download file
 * @param bucket - Bucket name
 * @param path - File path
 */
export async function downloadFile(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      console.error("Download error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Download error:", error);
    return null;
  }
}

/**
 * Create signed URL (for private files)
 * @param bucket - Bucket name
 * @param path - File path
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Create signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Create signed URL error:", error);
    return null;
  }
}

/**
 * Copy file to another location
 * @param bucket - Bucket name
 * @param fromPath - Source path
 * @param toPath - Destination path
 */
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) {
      console.error("Copy file error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Copy file error:", error);
    return false;
  }
}

/**
 * Move file to another location
 * @param bucket - Bucket name
 * @param fromPath - Source path
 * @param toPath - Destination path
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      console.error("Move file error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Move file error:", error);
    return false;
  }
}

/**
 * List files in a folder
 * @param bucket - Bucket name
 * @param path - Folder path (optional)
 * @param options - List options
 */
export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: string };
  },
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, options);

    if (error) {
      console.error("List files error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("List files error:", error);
    return null;
  }
}

/**
 * Get storage bucket info
 * @param bucket - Bucket name
 */
export async function getBucketInfo(bucket: string) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucket);

    if (error) {
      console.error("Get bucket info error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get bucket info error:", error);
    return null;
  }
}

/**
 * Format bytes to human readable format
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
