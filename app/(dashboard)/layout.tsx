// ============================================
// FILE: src/app/(dashboard)/layout.tsx
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { isAuthenticated } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    if (!isAuthenticated()) {
        return null;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="w-full min-w-0">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 px-4">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full">
                    {children}
                </div>

                <footer className="border-t py-4 px-4 bg-card">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                        <p className="text-sm text-muted-foreground text-center">
                            Copyright © {new Date().getFullYear()} joesrilfahmi. All rights
                            reserved.
                        </p>
                    </div>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
}