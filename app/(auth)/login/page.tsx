// ============================================
// FILE: src/app/(auth)/login/page.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/lib/auth';
import { toast } from 'sonner';

interface FormErrors {
    username: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState<FormErrors>({
        username: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        // Clear individual field error when user types
        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {
            username: '',
            password: '',
        };
        let isValid = true;

        // Validasi username
        if (!formData.username.trim()) {
            newErrors.username = 'Username wajib diisi';
            isValid = false;
        }

        // Validasi password
        if (!formData.password.trim()) {
            newErrors.password = 'Password wajib diisi';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi form terlebih dahulu
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await login(formData);
            toast.success('Login berhasil!');
            router.push('/dashboard');
        } catch (err) {
            // Hanya tampilkan error di Alert, tidak perlu toast
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Left side - Form */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Selamat Datang Kembali
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Masuk ke akun Anda untuk melanjutkan
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>
                                Masukkan username dan password Anda
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="username">
                                        Username <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Masukkan username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={errors.username ? 'border-red-500' : ''}
                                    />
                                    {errors.username && (
                                        <p className="text-sm text-red-500">{errors.username}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        label="Password"
                                        placeholder="Masukkan password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        showError={false}
                                        error={errors.password}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? 'Memproses...' : 'Login'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center text-sm">
                                Belum punya akun?{' '}
                                <Link href="/register" className="font-medium text-primary hover:underline">
                                    Daftar di sini
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
                        <h2 className="text-4xl font-bold tracking-tight">
                            Hospital Management System
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Sistem manajemen rumah sakit yang terintegrasi dan efisien
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}