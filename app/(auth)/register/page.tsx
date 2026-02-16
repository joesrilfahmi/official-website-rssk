// ============================================
// FILE: src/app/(auth)/register/page.tsx
// ============================================

"use client";

import { AuthBranding } from "@/components/auth/auth-branding";
import { AuthHeader } from "@/components/auth/auth-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { register } from "@/lib/auth";
import {
  validasiKonfirmasiPassword,
  validasiPassword,
} from "@/lib/validasi/validasiPassword";
import { validasiIdTelegram } from "@/lib/validasi/validasiTelegram";
import { validasiUsername } from "@/lib/validasi/validasiUsername";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
    nama: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    nomor_telepon: "",
    id_telegram: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    nama: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    nomor_telepon: "",
    id_telegram: "",
  });

  const passwordValidation = useMemo(() => {
    return validasiPassword(formData.password);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "username" ? value.toLowerCase() : value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      nama: "",
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      nomor_telepon: "",
      id_telegram: "",
    };
    let isValid = true;

    if (!formData.nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi";
      isValid = false;
    }

    // Fixed: Use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    const usernameValidation = validasiUsername(formData.username);
    if (!usernameValidation.valid) {
      newErrors.username =
        usernameValidation.errors[0] || "Username tidak valid";
      isValid = false;
    }

    // Fixed: Use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    if (!passwordValidation.valid) {
      newErrors.password =
        passwordValidation.errors[0] || "Password tidak valid";
      isValid = false;
    }

    // Fixed: Use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    const confirmPasswordValidation = validasiKonfirmasiPassword(
      formData.password,
      formData.confirmPassword,
    );
    if (!confirmPasswordValidation.valid) {
      newErrors.confirmPassword =
        confirmPasswordValidation.errors[0] ||
        "Konfirmasi password tidak valid";
      isValid = false;
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Email tidak valid";
      isValid = false;
    }

    if (
      formData.nomor_telepon.trim() &&
      !/^(\+62|62|0)[0-9]{9,12}$/.test(formData.nomor_telepon)
    ) {
      newErrors.nomor_telepon = "Nomor telepon tidak valid";
      isValid = false;
    }

    // Fixed: Use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    const idTelegramValidation = validasiIdTelegram(formData.id_telegram);
    if (!idTelegramValidation.valid) {
      newErrors.id_telegram =
        idTelegramValidation.errors[0] || "ID Telegram tidak valid";
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
      toast.success("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat registrasi";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Left Side - Form */}
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <AuthHeader />

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Daftar untuk mulai menggunakan layanan kami
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Nama Lengkap */}
                  <div className="grid gap-2">
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
                      className={errors.nama ? "border-red-500" : ""}
                      required
                    />
                    {errors.nama && (
                      <p className="text-sm text-red-500">{errors.nama}</p>
                    )}
                  </div>

                  {/* Username */}
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
                      className={errors.username ? "border-red-500" : ""}
                      required
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Username akan otomatis diubah menjadi huruf kecil
                    </p>
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
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
                    {formData.password && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                passwordValidation.strength === "weak"
                                  ? "w-1/4 bg-red-500"
                                  : passwordValidation.strength === "fair"
                                    ? "w-2/4 bg-orange-500"
                                    : passwordValidation.strength === "good"
                                      ? "w-3/4 bg-yellow-500"
                                      : "w-full bg-green-500"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              passwordValidation.strength === "weak"
                                ? "text-red-500"
                                : passwordValidation.strength === "fair"
                                  ? "text-orange-500"
                                  : passwordValidation.strength === "good"
                                    ? "text-yellow-500"
                                    : "text-green-500"
                            }`}
                          >
                            {passwordValidation.strength === "weak"
                              ? "Lemah"
                              : passwordValidation.strength === "fair"
                                ? "Cukup"
                                : passwordValidation.strength === "good"
                                  ? "Baik"
                                  : "Kuat"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p
                            className={
                              passwordValidation.requirements.minLength
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {passwordValidation.requirements.minLength
                              ? "✓"
                              : "○"}{" "}
                            Minimal 8 karakter
                          </p>
                          <p
                            className={
                              passwordValidation.requirements.hasUpperCase
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {passwordValidation.requirements.hasUpperCase
                              ? "✓"
                              : "○"}{" "}
                            Huruf besar (A-Z)
                          </p>
                          <p
                            className={
                              passwordValidation.requirements.hasLowerCase
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {passwordValidation.requirements.hasLowerCase
                              ? "✓"
                              : "○"}{" "}
                            Huruf kecil (a-z)
                          </p>
                          <p
                            className={
                              passwordValidation.requirements.hasNumber
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {passwordValidation.requirements.hasNumber
                              ? "✓"
                              : "○"}{" "}
                            Angka (0-9)
                          </p>
                          <p
                            className={
                              passwordValidation.requirements.hasSpecialChar
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {passwordValidation.requirements.hasSpecialChar
                              ? "✓"
                              : "○"}{" "}
                            Karakter khusus (!@#$...)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">
                      Konfirmasi Password{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Masukkan kembali password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      showError={false}
                      error={errors.confirmPassword}
                    />
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email (Opsional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Masukkan email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Nomor Telepon */}
                  <div className="grid gap-2">
                    <Label htmlFor="nomor_telepon">
                      Nomor Telepon (Opsional)
                    </Label>
                    <Input
                      id="nomor_telepon"
                      name="nomor_telepon"
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={formData.nomor_telepon}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.nomor_telepon ? "border-red-500" : ""}
                    />
                    {errors.nomor_telepon && (
                      <p className="text-sm text-red-500">
                        {errors.nomor_telepon}
                      </p>
                    )}
                  </div>

                  {/* ID Telegram */}
                  <div className="grid gap-2">
                    <Label htmlFor="id_telegram">ID Telegram (Opsional)</Label>
                    <Input
                      id="id_telegram"
                      name="id_telegram"
                      type="text"
                      placeholder="Masukkan ID Telegram"
                      value={formData.id_telegram}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.id_telegram ? "border-red-500" : ""}
                    />
                    {errors.id_telegram && (
                      <p className="text-sm text-red-500">
                        {errors.id_telegram}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ID Telegram hanya berupa angka (5-20 digit)
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading ? "Memproses..." : "Daftar"}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <AuthBranding />
      </div>

      {/* Telegram Confirmation Dialog */}
      <AlertDialog
        open={showTelegramDialog}
        onOpenChange={setShowTelegramDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ID Telegram Kosong</AlertDialogTitle>
            <AlertDialogDescription>
              Anda belum mengisi ID Telegram. ID Telegram sangat
              direkomendasikan untuk notifikasi penting. Apakah Anda yakin ingin
              melanjutkan tanpa ID Telegram?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={performRegistration}>
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
