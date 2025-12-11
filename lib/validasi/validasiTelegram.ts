// ============================================
// FILE: src/lib/validasi/validasiTelegram.ts
// ============================================

export interface ValidationResult {
    isValid: boolean;
    message: string;
}

export const validasiIdTelegram = (id_telegram: string): ValidationResult => {
    // Jika kosong, itu valid (field optional)
    if (!id_telegram.trim()) {
        return { isValid: true, message: '' };
    }

    // Cek apakah hanya berisi angka
    if (!/^\d+$/.test(id_telegram)) {
        return {
            isValid: false,
            message: 'ID Telegram harus berupa angka saja'
        };
    }

    // Cek panjang digit
    if (id_telegram.length < 5) {
        return {
            isValid: false,
            message: 'ID Telegram minimal 5 digit'
        };
    }

    if (id_telegram.length > 20) {
        return {
            isValid: false,
            message: 'ID Telegram maksimal 20 digit'
        };
    }

    return { isValid: true, message: '' };
};

export interface ValidasiTelegramOptions {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
}

export const validasiIdTelegramWithOptions = (
    id_telegram: string,
    options: ValidasiTelegramOptions = {}
): ValidationResult => {
    const {
        required = false,
        minLength = 5,
        maxLength = 20
    } = options;

    // Cek apakah field required
    if (required && !id_telegram.trim()) {
        return {
            isValid: false,
            message: 'ID Telegram wajib diisi'
        };
    }

    // Jika kosong dan tidak required
    if (!id_telegram.trim()) {
        return { isValid: true, message: '' };
    }

    // Cek apakah hanya berisi angka
    if (!/^\d+$/.test(id_telegram)) {
        return {
            isValid: false,
            message: 'ID Telegram harus berupa angka saja'
        };
    }

    // Cek minimum length
    if (id_telegram.length < minLength) {
        return {
            isValid: false,
            message: `ID Telegram minimal ${minLength} digit`
        };
    }

    // Cek maximum length
    if (id_telegram.length > maxLength) {
        return {
            isValid: false,
            message: `ID Telegram maksimal ${maxLength} digit`
        };
    }

    return { isValid: true, message: '' };
};