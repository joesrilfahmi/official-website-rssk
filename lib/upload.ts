// lib/upload.ts
import { supabase } from '@/lib/supabase/client';

export interface UploadOptions {
  bucket: string;
  folder?: string;
  file: File;
  maxSizeInMB?: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Convert image to WebP format
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Gunakan ukuran asli tanpa resize
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not convert to WebP'));
              return;
            }
            resolve(blob);
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, maxSizeInMB: number = 5): { valid: boolean; error?: string } {
  // Support berbagai MIME type untuk WebP
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'image/x-webp' // Alternative WebP MIME type
  ];
  
  // Check by MIME type
  let isValidType = allowedTypes.includes(file.type);
  
  // Jika MIME type tidak dikenali, cek by extension
  if (!isValidType) {
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    isValidType = validExtensions.some(ext => fileName.endsWith(ext));
  }
  
  if (!isValidType) {
    console.log('Invalid file type:', file.type, 'for file:', file.name);
    return {
      valid: false,
      error: `Format file tidak didukung. Gunakan JPG, PNG, atau WebP. File type: ${file.type}`
    };
  }
  
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Check if file is already WebP
 */
function isWebP(file: File): boolean {
  return file.type === 'image/webp' || 
         file.type === 'image/x-webp' || 
         file.name.toLowerCase().endsWith('.webp');
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, folder = '', file, maxSizeInMB = 5 } = options;
    
    console.log('Starting upload process...', { 
      bucket, 
      folder, 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });
    
    const validation = validateImageFile(file, maxSizeInMB);
    if (!validation.valid) {
      console.error('Validation failed:', validation.error);
      return { success: false, error: validation.error };
    }
    
    // Convert to WebP only if not already WebP
    let blobToUpload: Blob;
    try {
      if (isWebP(file)) {
        console.log('File is already WebP, skipping conversion');
        blobToUpload = file;
      } else {
        console.log('Converting to WebP...');
        blobToUpload = await convertToWebP(file);
        console.log('WebP conversion successful, size:', blobToUpload.size);
      }
    } catch (error) {
      console.error('Error converting to WebP:', error);
      return { success: false, error: 'Gagal mengkonversi gambar ke format WebP' };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}.webp`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    console.log('Uploading to Supabase Storage...', { filePath, bucketName: bucket });
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blobToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp'
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message || 'Gagal mengupload file' };
    }
    
    console.log('Upload successful:', data);
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log('Public URL generated:', publicUrl);
    
    return { success: true, url: publicUrl, path: data.path };
    
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat upload'
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Deleting file:', { bucket, path });
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message || 'Gagal menghapus file' };
    }
    console.log('File deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus file'
    };
  }
}

/**
 * Get file path from public URL
 */
export function getFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    // Use non-regex approach to avoid ES2018 flag requirement
    const bucketPath = `${bucket}/`;
    const index = url.indexOf(bucketPath);
    if (index === -1) return null;
    return url.substring(index + bucketPath.length);
  } catch (error) {
    console.error('Error extracting path:', error);
    return null;
  }
}