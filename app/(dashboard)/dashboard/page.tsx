// ============================================
// FILE: src/app/(dashboard)/dashboard/page.tsx
// ============================================

'use client';

import { getCurrentUser } from '@/lib/auth';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function DashboardPage() {
    const user = getCurrentUser();

    return (
        <div className="space-y-6">
            <div>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Selamat datang kembali, {user?.nama}!
                </p>
            </div>
        </div>
    );
}