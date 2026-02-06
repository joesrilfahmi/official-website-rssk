// ============================================
// FILE: src/lib/validasi/validasiUsername.ts
// ============================================

export interface UsernameValidationResult {
  valid: boolean;
  errors: string[];
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
export function validasiUsername(username: string): UsernameValidationResult {
  const errors: string[] = [];

  // Konversi ke lowercase
  const normalizedUsername = username.toLowerCase().trim();

  // Cek jika kosong
  if (!normalizedUsername) {
    errors.push("Username wajib diisi");
    return { valid: false, errors };
  }

  // Cek panjang karakter
  if (normalizedUsername.length < 3) {
    errors.push("Username minimal 3 karakter");
  }

  if (normalizedUsername.length > 20) {
    errors.push("Username maksimal 20 karakter");
  }

  // Cek mengandung spasi
  if (normalizedUsername.includes(" ")) {
    errors.push("Username tidak boleh mengandung spasi");
  }

  // Cek karakter yang diizinkan (a-z, 0-9, _)
  const validCharPattern = /^[a-z0-9_]+$/;
  if (!validCharPattern.test(normalizedUsername)) {
    errors.push(
      "Username hanya boleh menggunakan huruf (a-z), angka (0-9), dan underscore (_)",
    );
  }

  // Cek tidak boleh dimulai dengan angka
  if (/^[0-9]/.test(normalizedUsername)) {
    errors.push("Username tidak boleh dimulai dengan angka");
  }

  // Cek karakter non-ASCII
  if (!/^[\x00-\x7F]*$/.test(normalizedUsername)) {
    errors.push("Username tidak boleh mengandung karakter non-ASCII");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Cek apakah username sudah digunakan
 * (Fungsi ini perlu diintegrasikan dengan API backend)
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameValidationResult> {
  try {
    const response = await fetch("/api/auth/check-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username.toLowerCase() }),
    });

    const data = await response.json();

    if (!data.available) {
      return {
        valid: false,
        errors: ["Username sudah digunakan"],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  } catch {
    return {
      valid: false,
      errors: ["Gagal memeriksa ketersediaan username"],
    };
  }
}
