// ============================================
// FILE: src/lib/validasi/validasiTelegram.ts
// ============================================

export interface TelegramValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validasi ID Telegram
 * - Field adalah optional (boleh kosong)
 * - Jika diisi, harus berupa angka saja
 * - Minimal 5 digit, maksimal 20 digit
 */
export const validasiIdTelegram = (
  id_telegram: string,
): TelegramValidationResult => {
  const errors: string[] = [];

  // Jika kosong, itu valid (field optional)
  if (!id_telegram.trim()) {
    return { valid: true, errors: [] };
  }

  // Cek apakah hanya berisi angka
  if (!/^\d+$/.test(id_telegram)) {
    errors.push("ID Telegram harus berupa angka saja");
  }

  // Cek panjang digit
  if (id_telegram.length < 5) {
    errors.push("ID Telegram minimal 5 digit");
  }

  if (id_telegram.length > 20) {
    errors.push("ID Telegram maksimal 20 digit");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export interface ValidasiTelegramOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

/**
 * Validasi ID Telegram dengan opsi custom
 */
export const validasiIdTelegramWithOptions = (
  id_telegram: string,
  options: ValidasiTelegramOptions = {},
): TelegramValidationResult => {
  const { required = false, minLength = 5, maxLength = 20 } = options;

  const errors: string[] = [];

  // Cek apakah field required
  if (required && !id_telegram.trim()) {
    errors.push("ID Telegram wajib diisi");
    return { valid: false, errors };
  }

  // Jika kosong dan tidak required
  if (!id_telegram.trim()) {
    return { valid: true, errors: [] };
  }

  // Cek apakah hanya berisi angka
  if (!/^\d+$/.test(id_telegram)) {
    errors.push("ID Telegram harus berupa angka saja");
  }

  // Cek minimum length
  if (id_telegram.length < minLength) {
    errors.push(`ID Telegram minimal ${minLength} digit`);
  }

  // Cek maximum length
  if (id_telegram.length > maxLength) {
    errors.push(`ID Telegram maksimal ${maxLength} digit`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
