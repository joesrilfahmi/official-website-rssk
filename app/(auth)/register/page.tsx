// ============================================
// FILE: src/app/(auth)/register/page.tsx
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validasiIdTelegram } from '@/lib/validasi/validasiTelegram';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { register } from '@/lib/auth';
import { validasiUsername } from '@/lib/validasi/validasiUsername';
import { validasiPassword, validasiKonfirmasiPassword } from '@/lib/validasi/validasiPassword';
import { toast } from 'sonner';

interface FormData {
    nama: string;
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    nomor_telepon: string;
    id_telegram: string;
}

interface FormErrors {
    nama: string;
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    nomor_telepon: string;
    id_telegram: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showTelegramDialog, setShowTelegramDialog] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        nama: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        nomor_telepon: '',
        id_telegram: '',
    });

    const [errors, setErrors] = useState<FormErrors>({
        nama: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        nomor_telepon: '',
        id_telegram: '',
    });

    const passwordValidation = useMemo(() => {
        return validasiPassword(formData.password);
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'username' ? value.toLowerCase() : value,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {
            nama: '',
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            nomor_telepon: '',
            id_telegram: '',
        };
        let isValid = true;

        if (!formData.nama.trim()) {
            newErrors.nama = 'Nama lengkap wajib diisi';
            isValid = false;
        }

        const usernameValidation = validasiUsername(formData.username);
        if (!usernameValidation.isValid) {
            newErrors.username = usernameValidation.message;
            isValid = false;
        }

        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
            isValid = false;
        }

        const confirmPasswordValidation = validasiKonfirmasiPassword(
            formData.password,
            formData.confirmPassword
        );
        if (!confirmPasswordValidation.isValid) {
            newErrors.confirmPassword = confirmPasswordValidation.message;
            isValid = false;
        }

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email tidak valid';
            isValid = false;
        }

        if (formData.nomor_telepon.trim() && !/^(\+62|62|0)[0-9]{9,12}$/.test(formData.nomor_telepon)) {
            newErrors.nomor_telepon = 'Nomor telepon tidak valid';
            isValid = false;
        }

        const idTelegramValidation = validasiIdTelegram(formData.id_telegram);
        if (!idTelegramValidation.isValid) {
            newErrors.id_telegram = idTelegramValidation.message;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!formData.id_telegram.trim()) {
            setShowTelegramDialog(true);
            return;
        }

        await performRegistration();
    };

    const performRegistration = async () => {
        setLoading(true);

        try {
            if (!validateForm()) {
                setLoading(false);
                return;
            }

            const registrationData = {
                nama: formData.nama.trim(),
                username: formData.username.toLowerCase().trim(),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                email: formData.email.trim(),
                nomor_telepon: formData.nomor_telepon.trim(),
                id_telegram: formData.id_telegram.trim(),
            };

            await register(registrationData);
            toast.success('Registrasi berhasil! Silakan login.');
            router.push('/login');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat registrasi';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
                <div className="flex w-full max-w-sm flex-col gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
                            <CardDescription>
                                Lengkapi form untuk membuat akun
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                    {/* Nama Lengkap */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="nama">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="nama"
                                            name="nama"
                                            type="text"
                                            placeholder="Masukkan nama lengkap"
                                            value={formData.nama}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.nama ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.nama && (
                                            <p className="text-sm text-red-500">{errors.nama}</p>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="username">
                                            Username <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Pilih username (3-20 karakter)"
                                            value={formData.username}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.username ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-red-500">{errors.username}</p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="flex flex-col gap-2">
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            label="Password"
                                            placeholder="Minimal 8 karakter"
                                            value={formData.password}
                                            onChange={handleChange}
                                            disabled={loading}
                                            error={errors.password}
                                            required
                                        />

                                        <PasswordStrengthIndicator
                                            password={formData.password}
                                            validationResult={passwordValidation}
                                            showRequirements={true}
                                            showStrengthBar={true}
                                        />
                                    </div>

                                    {/* Konfirmasi Password */}
                                    <div className="flex flex-col gap-2">
                                        <PasswordInput
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            label="Konfirmasi Password"
                                            placeholder="Ulangi password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            disabled={loading}
                                            error={errors.confirmPassword}
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Nomor Telepon */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                                        <Input
                                            id="nomor_telepon"
                                            name="nomor_telepon"
                                            type="tel"
                                            placeholder="08xxxxxxxxxx"
                                            value={formData.nomor_telepon}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.nomor_telepon ? 'border-red-500' : ''}
                                        />
                                        {errors.nomor_telepon && (
                                            <p className="text-sm text-red-500">{errors.nomor_telepon}</p>
                                        )}
                                    </div>

                                    {/* ID Telegram */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="id_telegram">ID Telegram (angka saja)</Label>
                                        <Input
                                            id="id_telegram"
                                            name="id_telegram"
                                            type="text"
                                            placeholder="Contoh: 1234567890"
                                            value={formData.id_telegram}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.id_telegram ? 'border-red-500' : ''}
                                        />
                                        {errors.id_telegram && (
                                            <p className="text-sm text-red-500">{errors.id_telegram}</p>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? 'Memproses...' : 'Daftar'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center text-sm">
                                Sudah punya akun?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium underline underline-offset-4"
                                >
                                    Login
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                        Dengan mendaftar, Anda menyetujui{' '}
                        <a href="#">Syarat & Ketentuan</a> dan{' '}
                        <a href="#">Kebijakan Privasi</a> kami.
                    </div>
                </div>
            </div>

            {/* Telegram ID Dialog */}
            <AlertDialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ID Telegram Kosong</AlertDialogTitle>
                        <AlertDialogDescription>
                            Jika Anda tidak mengisi ID Telegram, Anda tidak akan mendapatkan notifikasi dari sistem.
                            Apakah Anda yakin ingin melanjutkan tanpa mengisi ID Telegram?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowTelegramDialog(false)}>
                            Isi ID Telegram
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowTelegramDialog(false);
                                performRegistration();
                            }}
                        >
                            Lanjutkan Tanpa ID Telegram
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}