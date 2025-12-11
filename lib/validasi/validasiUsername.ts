// ============================================
// FILE: src/lib/validasi/validasiUsername.ts
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validasi Username dengan aturan:
 * - Otomatis diubah menjadi lowercase
 * - Tidak boleh menggunakan spasi
 * - Minimal 3 karakter, maksimal 20 karakter
 * - Hanya boleh menggunakan a-z, 0-9, dan _
 * - Tidak boleh dimulai dengan angka
 * - Tidak boleh menggunakan karakter non-ASCII
 */
export function validasiUsername(username: string): ValidationResult {
  // Konversi ke lowercase
  const normalizedUsername = username.toLowerCase().trim();

  // Cek jika kosong
  if (!normalizedUsername) {
    return {
      isValid: false,
      message: 'Username wajib diisi',
    };
  }

  // Cek panjang karakter
  if (normalizedUsername.length < 3) {
    return {
      isValid: false,
      message: 'Username minimal 3 karakter',
    };
  }

  if (normalizedUsername.length > 20) {
    return {
      isValid: false,
      message: 'Username maksimal 20 karakter',
    };
  }

  // Cek mengandung spasi
  if (normalizedUsername.includes(' ')) {
    return {
      isValid: false,
      message: 'Username tidak boleh mengandung spasi',
    };
  }

  // Cek karakter yang diizinkan (a-z, 0-9, _)
  const validCharPattern = /^[a-z0-9_]+$/;
  if (!validCharPattern.test(normalizedUsername)) {
    return {
      isValid: false,
      message: 'Username hanya boleh menggunakan huruf (a-z), angka (0-9), dan underscore (_)',
    };
  }

  // Cek tidak boleh dimulai dengan angka
  if (/^[0-9]/.test(normalizedUsername)) {
    return {
      isValid: false,
      message: 'Username tidak boleh dimulai dengan angka',
    };
  }

  // Cek karakter non-ASCII
  if (!/^[\x00-\x7F]*$/.test(normalizedUsername)) {
    return {
      isValid: false,
      message: 'Username tidak boleh mengandung karakter non-ASCII',
    };
  }

  return {
    isValid: true,
    message: 'Username valid',
  };
}

/**
 * Cek apakah username sudah digunakan
 * (Fungsi ini perlu diintegrasikan dengan API backend)
 */
export async function checkUsernameAvailability(
  username: string
): Promise<ValidationResult> {
  try {
    const response = await fetch('/api/auth/check-username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username.toLowerCase() }),
    });

    const data = await response.json();

    if (!data.available) {
      return {
        isValid: false,
        message: 'Username sudah digunakan',
      };
    }

    return {
      isValid: true,
      message: 'Username tersedia',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Gagal memeriksa ketersediaan username',
    };
  }
}