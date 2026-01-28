// lib/validasi/validasiImage.ts

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE_KB = 300;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024; // 300KB in bytes
const ALLOWED_TYPES = ["image/webp"];
const ALLOWED_EXTENSIONS = [".webp"];

/**
 * Validasi file gambar
 * @param file - File yang akan divalidasi
 * @returns ImageValidationResult
 */
export function validateImage(file: File): ImageValidationResult {
  // Validasi apakah file ada
  if (!file) {
    return {
      valid: false,
      error: "File tidak ditemukan",
    };
  }

  // Validasi ukuran file
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi ${MAX_FILE_SIZE_KB}KB. Ukuran file: ${(file.size / 1024).toFixed(2)}KB`,
    };
  }

  // Validasi tipe MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung. Hanya diperbolehkan: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Validasi ekstensi file
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext),
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Ekstensi file tidak valid. Hanya diperbolehkan: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validasi multiple files
 * @param files - Array of files
 * @returns ImageValidationResult
 */
export function validateImages(files: File[]): ImageValidationResult {
  if (!files || files.length === 0) {
    return {
      valid: false,
      error: "Tidak ada file yang dipilih",
    };
  }

  for (const file of files) {
    const result = validateImage(file);
    if (!result.valid) {
      return result;
    }
  }

  return {
    valid: true,
  };
}

/**
 * Get max file size in KB
 */
export function getMaxFileSizeKB(): number {
  return MAX_FILE_SIZE_KB;
}

/**
 * Get allowed file types
 */
export function getAllowedTypes(): string[] {
  return [...ALLOWED_TYPES];
}

/**
 * Get allowed file extensions
 */
export function getAllowedExtensions(): string[] {
  return [...ALLOWED_EXTENSIONS];
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
