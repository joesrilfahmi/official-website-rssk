// ============================================
// FILE: src/lib/validasi/validasiPassword.ts
// ============================================

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noSpaces: boolean;
  };
  strength: "weak" | "fair" | "good" | "strong";
}

/**
 * Validasi Password dengan aturan:
 * - Minimal 8 karakter
 * - Harus mengandung huruf besar (A-Z)
 * - Harus mengandung huruf kecil (a-z)
 * - Harus mengandung angka (0-9)
 * - Harus mengandung simbol / karakter khusus
 * - Tidak boleh mengandung spasi
 */
export function validasiPassword(password: string): PasswordValidationResult {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password),
  };

  const errors: string[] = [];

  // Cek jika kosong
  if (!password) {
    errors.push("Password wajib diisi");
    return {
      valid: false,
      errors,
      requirements,
      strength: "weak",
    };
  }

  // Cek setiap requirement
  if (!requirements.minLength) {
    errors.push("Password minimal 8 karakter");
  }

  if (!requirements.hasUpperCase) {
    errors.push("Password harus mengandung huruf besar (A-Z)");
  }

  if (!requirements.hasLowerCase) {
    errors.push("Password harus mengandung huruf kecil (a-z)");
  }

  if (!requirements.hasNumber) {
    errors.push("Password harus mengandung angka (0-9)");
  }

  if (!requirements.hasSpecialChar) {
    errors.push(
      "Password harus mengandung simbol / karakter khusus (!@#$%^&*()_+...)",
    );
  }

  if (!requirements.noSpaces) {
    errors.push("Password tidak boleh mengandung spasi");
  }

  // Hitung strength berdasarkan requirements yang terpenuhi
  const metRequirements = Object.values(requirements).filter(
    (req) => req === true,
  ).length;
  let strength: "weak" | "fair" | "good" | "strong";

  if (metRequirements <= 2) {
    strength = "weak";
  } else if (metRequirements <= 4) {
    strength = "fair";
  } else if (metRequirements === 5) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements,
    strength,
  };
}

/**
 * Validasi konfirmasi password
 */
export function validasiKonfirmasiPassword(
  password: string,
  confirmPassword: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push("Konfirmasi password wajib diisi");
  } else if (password !== confirmPassword) {
    errors.push("Password dan konfirmasi password tidak cocok");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
