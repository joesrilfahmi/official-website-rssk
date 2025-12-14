// ============================================
// FILE: app/(auth)/login/page.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/lib/auth';
import { toast } from 'sonner';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthBranding } from '@/components/auth/auth-branding';

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

        if (!formData.username.trim()) {
            newErrors.username = 'Username wajib diisi';
            isValid = false;
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password wajib diisi';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <AuthHeader />

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Login ke Akun Anda</h1>
                                <p className="text-balance text-sm text-muted-foreground">
                                    Masukkan username dan password untuk melanjutkan
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-6">
                                <div className="grid gap-2">
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
                                        required
                                    />
                                    {errors.username && (
                                        <p className="text-sm text-red-500">{errors.username}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            Password <span className="text-red-500">*</span>
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="ml-auto text-sm underline-offset-4 hover:underline"
                                        >
                                            Lupa password?
                                        </Link>
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
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
                            </div>

                            <div className="text-center text-sm">
                                Belum punya akun?{' '}
                                <Link href="/register" className="underline underline-offset-4">
                                    Daftar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding */}
            <AuthBranding />
        </div>
    );
}