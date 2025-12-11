'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccessDeniedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    redirectTo?: string;
}

export function AccessDeniedDialog({
    open,
    onOpenChange,
    title = 'Akses Ditolak',
    description = 'Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda memerlukan akses.',
    redirectTo = '/dashboard'
}: AccessDeniedDialogProps) {
    const router = useRouter();

    const handleClose = () => {
        onOpenChange(false);
        router.push(redirectTo);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-500" />
                        </div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={handleClose}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Kembali ke Dashboard
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}