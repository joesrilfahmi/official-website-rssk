// ============================================
// FILE: src/components/auth/auth-header.tsx
// ============================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Profile } from '@/config/profile';
import { ThemeToggle } from '@/components/theme-toggle';

export function AuthHeader() {
    return (
        <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 font-medium">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary">
                    <Image
                        src={Profile.logo}
                        alt={Profile.shortName}
                        fill
                        className="object-cover"
                    />
                </div>
                <span className="text-xl font-bold">{Profile.shortName}</span>
            </Link>
            <ThemeToggle />
        </div>
    );
}