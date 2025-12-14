// ============================================
// FILE: src/components/auth/auth-branding.tsx
// ============================================

'use client';

import Image from 'next/image';
import { Profile } from '@/config/profile';

export function AuthBranding() {
    return (
        <div className="relative hidden bg-muted lg:block">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden">
                        <Image
                            src={Profile.logo}
                            alt={Profile.shortName}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {Profile.shortName}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            {Profile.subtitle}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}