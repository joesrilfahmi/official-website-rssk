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
import { Building2, Loader2 } from 'lucide-react';
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

    // Hitung validasi password untuk ditampilkan
    const passwordValidation = useMemo(() => {
        return validasiPassword(formData.password);
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'username' ? value.toLowerCase() : value,
        }));
        // Clear error when user starts typing
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

        // Validasi nama
        if (!formData.nama.trim()) {
            newErrors.nama = 'Nama lengkap wajib diisi';
            isValid = false;
        }

        // Validasi username
        const usernameValidation = validasiUsername(formData.username);
        if (!usernameValidation.isValid) {
            newErrors.username = usernameValidation.message;
            isValid = false;
        }

        // Validasi password
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
            isValid = false;
        }

        // Validasi konfirmasi password
        const confirmPasswordValidation = validasiKonfirmasiPassword(
            formData.password,
            formData.confirmPassword
        );
        if (!confirmPasswordValidation.isValid) {
            newErrors.confirmPassword = confirmPasswordValidation.message;
            isValid = false;
        }

        // Validasi email (optional tapi harus valid jika diisi)
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email tidak valid';
            isValid = false;
        }

        // Validasi nomor telepon (jika ada isi, harus valid)
        if (formData.nomor_telepon.trim() && !/^(\+62|62|0)[0-9]{9,12}$/.test(formData.nomor_telepon)) {
            newErrors.nomor_telepon = 'Nomor telepon tidak valid';
            isValid = false;
        }

        // Validasi ID Telegram
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

        // Validasi semua field terlebih dahulu
        if (!validateForm()) {
            return;
        }

        // Jika id_telegram kosong, tampilkan dialog konfirmasi
        if (!formData.id_telegram.trim()) {
            setShowTelegramDialog(true);
            return;
        }

        // Semua validasi pass, lanjutkan registrasi
        await performRegistration();
    };

    const performRegistration = async () => {
        setLoading(true);

        try {
            // Validasi ulang sebelum submit (safety check)
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
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* Left side - Form */}
                <div className="flex items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-6">
                        <div className="flex flex-col space-y-2 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Buat Akun Baru</h1>
                            <p className="text-sm text-muted-foreground">Daftar untuk menggunakan sistem</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Register</CardTitle>
                                <CardDescription>Lengkapi form di bawah untuk membuat akun</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Nama Lengkap */}
                                    <div className="space-y-2">
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
                                        />
                                        {errors.nama && (
                                            <p className="text-sm text-red-500">{errors.nama}</p>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Pilih username (min 3-20 karakter)"
                                            value={formData.username}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={errors.username ? 'border-red-500' : ''}
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-red-500">{errors.username}</p>
                                        )}
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            label="Password"
                                            placeholder="Minimal 8 karakter dengan kombinasi huruf, angka, dan simbol"
                                            value={formData.password}
                                            onChange={handleChange}
                                            disabled={loading}
                                            error={errors.password}
                                            required
                                        />

                                        {/* Password Strength Indicator */}
                                        <PasswordStrengthIndicator
                                            password={formData.password}
                                            validationResult={passwordValidation}
                                            showRequirements={true}
                                            showStrengthBar={true}
                                        />
                                    </div>

                                    {/* Konfirmasi Password */}
                                    <div className="space-y-2">
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
                                    <div className="space-y-2">
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
                                    <div className="space-y-2">
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
                                    <div className="space-y-2">
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

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loading ? 'Memproses...' : 'Daftar'}
                                    </Button>
                                </form>

                                <div className="mt-4 text-center text-sm">
                                    Sudah punya akun?{' '}
                                    <Link
                                        href="/login"
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Login di sini
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right side - Cover Image */}
                <div className="hidden bg-muted lg:block">
                    <div className="flex h-full flex-col items-center justify-center p-8">
                        <div className="space-y-6 text-center">
                            <h2 className="text-4xl font-bold tracking-tight">Bergabung dengan Kami</h2>
                            <p className="text-xl text-muted-foreground">
                                Kelola sistem dengan mudah dan efisien
                            </p>
                        </div>
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