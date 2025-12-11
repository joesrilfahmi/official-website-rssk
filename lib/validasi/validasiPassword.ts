// ============================================
// FILE: src/lib/validasi/validasiPassword.ts
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message: string;
  requirements?: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noSpaces: boolean;
  };
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
export function validasiPassword(password: string): ValidationResult {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password),
  };

  const allRequirementsMet = Object.values(requirements).every((req) => req === true);

  if (!password) {
    return {
      isValid: false,
      message: 'Password wajib diisi',
      requirements,
    };
  }

  if (!requirements.minLength) {
    return {
      isValid: false,
      message: 'Password minimal 8 karakter',
      requirements,
    };
  }

  if (!requirements.hasUpperCase) {
    return {
      isValid: false,
      message: 'Password harus mengandung huruf besar (A-Z)',
      requirements,
    };
  }

  if (!requirements.hasLowerCase) {
    return {
      isValid: false,
      message: 'Password harus mengandung huruf kecil (a-z)',
      requirements,
    };
  }

  if (!requirements.hasNumber) {
    return {
      isValid: false,
      message: 'Password harus mengandung angka (0-9)',
      requirements,
    };
  }

  if (!requirements.hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password harus mengandung simbol / karakter khusus (!@#$%^&*()_+...)',
      requirements,
    };
  }

  if (!requirements.noSpaces) {
    return {
      isValid: false,
      message: 'Password tidak boleh mengandung spasi',
      requirements,
    };
  }

  if (allRequirementsMet) {
    return {
      isValid: true,
      message: 'Password valid',
      requirements,
    };
  }

  return {
    isValid: false,
    message: 'Password tidak memenuhi kriteria',
    requirements,
  };
}

/**
 * Validasi konfirmasi password
 */
export function validasiKonfirmasiPassword(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return {
      isValid: false,
      message: 'Konfirmasi password wajib diisi',
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Password dan konfirmasi password tidak cocok',
    };
  }

  return {
    isValid: true,
    message: 'Konfirmasi password valid',
  };
}