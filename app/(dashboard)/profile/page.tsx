"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import {
  validasiKonfirmasiPassword,
  validasiPassword,
} from "@/lib/validasi/validasiPassword";
import { validasiIdTelegram } from "@/lib/validasi/validasiTelegram";
import { validasiUsername } from "@/lib/validasi/validasiUsername";
import bcrypt from "bcryptjs";
import { Loader2, Lock, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  id_telegram: string | null;
  nomor_telepon: string | null;
  role: "administrator" | "user";
  status_users: "active" | "inactive";
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    nama: "",
    username: "",
    email: "",
    nomor_telepon: "",
    id_telegram: "",
  });

  const [editErrors, setEditErrors] = useState({
    nama: "",
    username: "",
    email: "",
    nomor_telepon: "",
    id_telegram: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password validation dengan useMemo
  const passwordValidation = useMemo(() => {
    return validasiPassword(passwordForm.newPassword);
  }, [passwordForm.newPassword]);

  // Username validation dengan useMemo
  const usernameValidation = useMemo(() => {
    return validasiUsername(editForm.username);
  }, [editForm.username]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();

      if (!currentUser) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Query tanpa join rumah_sakit
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        nama: data.nama || "",
        username: data.username || "",
        email: data.email || "",
        nomor_telepon: data.nomor_telepon || "",
        id_telegram: data.id_telegram || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat data profile");
    } finally {
      setLoading(false);
    }
  };

  const validateEditForm = async () => {
    const errors = {
      nama: "",
      username: "",
      email: "",
      nomor_telepon: "",
      id_telegram: "",
    };
    let isValid = true;

    // Validasi nama
    if (!editForm.nama.trim()) {
      errors.nama = "Nama wajib diisi";
      isValid = false;
    }

    // Fixed: Validasi username - use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.errors[0] || "Username tidak valid";
      isValid = false;
    } else if (editForm.username !== profile?.username) {
      // Cek apakah username sudah digunakan oleh user lain
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", editForm.username.toLowerCase())
        .neq("id", profile?.id || "")
        .single();

      if (existingUser) {
        errors.username = "Username sudah digunakan";
        isValid = false;
      }
    }

    // Validasi email (jika ada isi, harus valid)
    if (
      editForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)
    ) {
      errors.email = "Email tidak valid";
      isValid = false;
    } else if (editForm.email.trim() && editForm.email !== profile?.email) {
      // Cek apakah email sudah digunakan oleh user lain
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", editForm.email.toLowerCase())
        .neq("id", profile?.id || "")
        .single();

      if (existingEmail) {
        errors.email = "Email sudah digunakan";
        isValid = false;
      }
    }

    // Validasi nomor telepon (jika ada isi, harus valid)
    if (
      editForm.nomor_telepon.trim() &&
      !/^(\+62|62|0)[0-9]{9,12}$/.test(editForm.nomor_telepon)
    ) {
      errors.nomor_telepon = "Nomor telepon tidak valid";
      isValid = false;
    }

    // Fixed: Validasi ID Telegram - use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    const idTelegramValidation = validasiIdTelegram(editForm.id_telegram);
    if (!idTelegramValidation.valid) {
      errors.id_telegram =
        idTelegramValidation.errors[0] || "ID Telegram tidak valid";
      isValid = false;
    }

    setEditErrors(errors);
    return isValid;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateEditForm();
    if (!isValid || !profile) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Mengupdate profile...");

    try {
      const { error } = await supabase
        .from("users")
        .update({
          nama: editForm.nama,
          username: editForm.username.toLowerCase(),
          email: editForm.email || null,
          nomor_telepon: editForm.nomor_telepon || null,
          id_telegram: editForm.id_telegram || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update local storage
      const updatedUser = {
        ...profile,
        nama: editForm.nama,
        username: editForm.username.toLowerCase(),
        email: editForm.email || null,
        nomor_telepon: editForm.nomor_telepon || null,
        id_telegram: editForm.id_telegram || null,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfile(updatedUser);
      toast.success("Profile berhasil diupdate", { id: loadingToast });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal mengupdate profile", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const validatePasswordForm = () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Password saat ini wajib diisi";
      isValid = false;
    }

    // Fixed: Validasi password baru - use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    if (!passwordValidation.valid) {
      errors.newPassword =
        passwordValidation.errors[0] || "Password tidak valid";
      isValid = false;
    }

    // Fixed: Validasi konfirmasi password - use 'valid' instead of 'isValid' and 'errors[0]' instead of 'message'
    const confirmPasswordValidation = validasiKonfirmasiPassword(
      passwordForm.newPassword,
      passwordForm.confirmPassword,
    );
    if (!confirmPasswordValidation.valid) {
      errors.confirmPassword =
        confirmPasswordValidation.errors[0] ||
        "Konfirmasi password tidak valid";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm() || !profile) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Mengupdate password...");

    try {
      // Ambil password yang ter-hash dari database
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("password")
        .eq("id", profile.id)
        .single();

      if (fetchError) {
        throw new Error("Gagal memverifikasi password");
      }

      // Bandingkan password menggunakan bcrypt
      const isPasswordValid = await bcrypt.compare(
        passwordForm.currentPassword,
        userData.password,
      );

      if (!isPasswordValid) {
        throw new Error("Password saat ini salah");
      }

      // Hash password baru sebelum disimpan
      const hashedNewPassword = await bcrypt.hash(passwordForm.newPassword, 10);

      // Update password dengan password yang sudah di-hash
      const { error } = await supabase
        .from("users")
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Password berhasil diupdate", { id: loadingToast });

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Tampilkan dialog logout
      setShowLogoutDialog(true);
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengupdate password";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    // Hapus data user dari localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Redirect ke halaman login
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Profile tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola informasi profile Anda
        </p>
      </div>

      <Tabs defaultValue="view" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="view">
            <User className="h-4 w-4 mr-2" />
            Lihat Profile
          </TabsTrigger>
          <TabsTrigger value="edit">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Password
          </TabsTrigger>
        </TabsList>

        {/* View Profile Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profile</CardTitle>
              <CardDescription>Detail informasi akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profile.avatar || "/avatars/default.jpg"}
                    alt={profile.nama}
                  />
                  <AvatarFallback className="text-lg bg-foreground text-background">
                    {getInitials(profile.nama)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{profile.nama}</h3>
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ID User</Label>
                  <p className="font-medium text-xs break-all">{profile.id}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">{profile.username}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{profile.email || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {profile.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge
                      className={
                        profile.status_users === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700"
                      }
                    >
                      {profile.status_users === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nomor Telepon</Label>
                  <p className="font-medium">{profile.nomor_telepon || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">ID Telegram</Label>
                  <p className="font-medium">{profile.id_telegram || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Tanggal Dibuat
                  </Label>
                  <p className="font-medium text-sm">
                    {formatDate(profile.created_at)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Terakhir Diupdate
                  </Label>
                  <p className="font-medium text-sm">
                    {formatDate(profile.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Profile Tab */}
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update informasi profile Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={editForm.nama}
                    onChange={(e) => {
                      setEditForm({ ...editForm, nama: e.target.value });
                      if (editErrors.nama) {
                        setEditErrors({ ...editErrors, nama: "" });
                      }
                    }}
                    placeholder="Masukkan nama lengkap"
                    disabled={submitting}
                    className={editErrors.nama ? "border-red-500" : ""}
                  />
                  {editErrors.nama && (
                    <p className="text-sm text-red-500">{editErrors.nama}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        username: e.target.value.toLowerCase(),
                      });
                      if (editErrors.username) {
                        setEditErrors({ ...editErrors, username: "" });
                      }
                    }}
                    placeholder="Pilih username (min 3-20 karakter)"
                    disabled={submitting}
                    className={editErrors.username ? "border-red-500" : ""}
                  />
                  {editErrors.username && (
                    <p className="text-sm text-red-500">
                      {editErrors.username}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Username hanya boleh berisi huruf, angka, underscore, dan
                    titik (3-20 karakter)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm({ ...editForm, email: e.target.value });
                      if (editErrors.email) {
                        setEditErrors({ ...editErrors, email: "" });
                      }
                    }}
                    placeholder="email@example.com"
                    disabled={submitting}
                    className={editErrors.email ? "border-red-500" : ""}
                  />
                  {editErrors.email && (
                    <p className="text-sm text-red-500">{editErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                  <Input
                    id="nomor_telepon"
                    value={editForm.nomor_telepon}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        nomor_telepon: e.target.value,
                      });
                      if (editErrors.nomor_telepon) {
                        setEditErrors({ ...editErrors, nomor_telepon: "" });
                      }
                    }}
                    placeholder="08xxxxxxxxxx"
                    disabled={submitting}
                    className={editErrors.nomor_telepon ? "border-red-500" : ""}
                  />
                  {editErrors.nomor_telepon && (
                    <p className="text-sm text-red-500">
                      {editErrors.nomor_telepon}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_telegram">ID Telegram (angka saja)</Label>
                  <Input
                    id="id_telegram"
                    value={editForm.id_telegram}
                    onChange={(e) => {
                      setEditForm({ ...editForm, id_telegram: e.target.value });
                      if (editErrors.id_telegram) {
                        setEditErrors({ ...editErrors, id_telegram: "" });
                      }
                    }}
                    placeholder="Contoh: 1234567890"
                    disabled={submitting}
                    className={editErrors.id_telegram ? "border-red-500" : ""}
                  />
                  {editErrors.id_telegram && (
                    <p className="text-sm text-red-500">
                      {editErrors.id_telegram}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika tidak ingin menerima notifikasi Telegram
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditForm({
                        nama: profile.nama,
                        username: profile.username,
                        email: profile.email || "",
                        nomor_telepon: profile.nomor_telepon || "",
                        id_telegram: profile.id_telegram || "",
                      });
                      setEditErrors({
                        nama: "",
                        username: "",
                        email: "",
                        nomor_telepon: "",
                        id_telegram: "",
                      });
                    }}
                    disabled={submitting}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Update password akun Anda untuk keamanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    label="Password Saat Ini"
                    placeholder="Masukkan password saat ini"
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      });
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors({
                          ...passwordErrors,
                          currentPassword: "",
                        });
                      }
                    }}
                    disabled={submitting}
                    error={passwordErrors.currentPassword}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    label="Password Baru"
                    placeholder="Minimal 8 karakter dengan kombinasi huruf, angka, dan simbol"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      });
                      if (passwordErrors.newPassword) {
                        setPasswordErrors({
                          ...passwordErrors,
                          newPassword: "",
                        });
                      }
                    }}
                    disabled={submitting}
                    error={passwordErrors.newPassword}
                    required
                  />

                  {/* Password Strength Indicator - Inline Version */}
                  {passwordForm.newPassword && (
                    <div className="space-y-3 mt-3">
                      {/* Strength Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Kekuatan Password:
                          </span>
                          <span
                            className={`font-medium ${
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
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
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
                      </div>

                      {/* Requirements Checklist */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Persyaratan:
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.minLength
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.minLength
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.minLength
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Minimal 8 karakter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.hasUpperCase
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.hasUpperCase
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.hasUpperCase
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Huruf besar (A-Z)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.hasLowerCase
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.hasLowerCase
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.hasLowerCase
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Huruf kecil (a-z)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.hasNumber
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.hasNumber
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.hasNumber
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Angka (0-9)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.hasSpecialChar
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.hasSpecialChar
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.hasSpecialChar
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Karakter khusus (!@#$...)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                passwordValidation.requirements.noSpaces
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }
                            >
                              {passwordValidation.requirements.noSpaces
                                ? "✓"
                                : "○"}
                            </span>
                            <span
                              className={
                                passwordValidation.requirements.noSpaces
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Tanpa spasi
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Konfirmasi Password Baru"
                    placeholder="Ulangi password baru"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      });
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors({
                          ...passwordErrors,
                          confirmPassword: "",
                        });
                      }
                    }}
                    disabled={submitting}
                    error={passwordErrors.confirmPassword}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordErrors({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    disabled={submitting}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {submitting ? "Mengupdate..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Berhasil Diubah</AlertDialogTitle>
            <AlertDialogDescription>
              Password Anda telah berhasil diubah. Untuk keamanan, Anda akan
              logout otomatis. Silakan login kembali menggunakan password baru
              Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleLogout}>
              OK, Logout Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
