// ============================================
// FILE: src/components/auth/auth-footer.tsx
// ============================================

'use client';

import Link from 'next/link';

export function AuthFooter() {
    return (
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            Dengan menggunakan layanan ini, Anda menyetujui{' '}
            <Link href="#">Syarat & Ketentuan</Link> dan{' '}
            <Link href="#">Kebijakan Privasi</Link> kami.
        </div>
    );
}