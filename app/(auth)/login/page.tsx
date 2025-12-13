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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
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
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Login ke Akun Anda</CardTitle>
                        <CardDescription>
                            Masukkan username dan password untuk melanjutkan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
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

                                <div className="flex flex-col gap-2">
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
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? 'Memproses...' : 'Login'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={loading}
                                    onClick={() => router.push('/')}
                                >
                                    Kembali
                                </Button>
                            </div>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            Belum punya akun?{' '}
                            <Link href="/register" className="font-medium underline underline-offset-4">
                                Daftar
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                    Dengan login, Anda menyetujui{' '}
                    <a href="#">Syarat & Ketentuan</a> dan{' '}
                    <a href="#">Kebijakan Privasi</a> kami.
                </div>
            </div>
        </div>
    );
}