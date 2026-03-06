// ============================================
// FILE: src/app/(dashboard)/users/page.tsx
// ============================================
"use client";

import { AccessDeniedDialog } from "@/components/access-denied-dialog";
import { TablePagination } from "@/components/table/TablePagination";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { validasiPassword } from "@/lib/validasi/validasiPassword";
import { validasiUsername } from "@/lib/validasi/validasiUsername";
import { User } from "@/types";
import bcrypt from "bcryptjs";
import * as Icons from "lucide-react";
import {
  ArrowUpDown,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SortField = "nama" | "username" | "role" | "created_at";
type SortOrder = "asc" | "desc";

interface FormDataType {
  nama: string;
  username: string;
  password: string;
  email: string;
  nomor_telepon: string;
  id_telegram: string;
  role: "administrator" | "user";
  status_users: "active" | "inactive";
}

interface FormErrorsType {
  nama: string;
  username: string;
  password: string;
  email: string;
  nomor_telepon: string;
  id_telegram: string;
  role: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  nama: "",
  username: "",
  password: "",
  email: "",
  nomor_telepon: "",
  id_telegram: "",
  role: "user",
  status_users: "active",
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  nama: "",
  username: "",
  password: "",
  email: "",
  nomor_telepon: "",
  id_telegram: "",
  role: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Access control state
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "administrator" | "user"
  >("all");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("nama");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<
    typeof validasiPassword
  > | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply filters and sorting
  const applyFilters = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nama.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.nomor_telepon?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status_users === statusFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "nama") {
        compareValue = a.nama.localeCompare(b.nama, "id");
      } else if (sortField === "username") {
        compareValue = a.username.localeCompare(b.username, "id");
      } else if (sortField === "role") {
        compareValue = a.role.localeCompare(b.role, "id");
      } else if (sortField === "created_at") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareValue = dateA - dateB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, statusFilter, roleFilter, users, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data users");
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);

        // Check user access
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== "administrator") {
          setShowAccessDenied(true);
          return;
        }

        await fetchUsers();
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Real-time subscription
    const channel = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const getSortLabel = () => {
    if (sortField === "nama") {
      return sortOrder === "asc" ? "Nama (A-Z)" : "Nama (Z-A)";
    } else if (sortField === "username") {
      return sortOrder === "asc" ? "Username (A-Z)" : "Username (Z-A)";
    } else if (sortField === "role") {
      return sortOrder === "asc" ? "Role (A-Z)" : "Role (Z-A)";
    } else {
      return sortOrder === "asc" ? "Terlama" : "Terbaru";
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setSortField("nama");
    setSortOrder("asc");
    setSearchQuery("");
  };

  const totalItems = filteredUsers.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentUsers.map((u) => u.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    currentUsers.length > 0 && currentUsers.every((u) => selectedIds.has(u.id));

  const isSomeSelected =
    currentUsers.some((u) => selectedIds.has(u.id)) && !isAllSelected;

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        nama: user.nama,
        username: user.username,
        password: "",
        email: user.email || "",
        nomor_telepon: user.nomor_telepon || "",
        id_telegram: user.id_telegram || "",
        role: user.role as "administrator" | "user",
        status_users: user.status_users as "active" | "inactive",
      });
    } else {
      setSelectedUser(null);
      setFormData({ ...DEFAULT_FORM_DATA });
    }
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
    setPasswordValidation(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormData({ ...DEFAULT_FORM_DATA });
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
    setPasswordValidation(null);
  };

  const validateForm = () => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.nama.trim()) {
      errors.nama = "Nama lengkap harus diisi";
      isValid = false;
    } else if (formData.nama.trim().length < 3) {
      errors.nama = "Nama lengkap minimal 3 karakter";
      isValid = false;
    }

    const usernameValidation = validasiUsername(formData.username);
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.errors.join(", ");
      isValid = false;
    }

    if (!selectedUser) {
      const passwordValidation = validasiPassword(formData.password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors.join(", ");
        isValid = false;
      }
    }

    if (formData.email && formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Format email tidak valid";
        isValid = false;
      }
    }

    if (formData.nomor_telepon && formData.nomor_telepon.trim() !== "") {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.nomor_telepon.replace(/[\s-]/g, ""))) {
        errors.nomor_telepon = "Nomor telepon harus 10-15 digit";
        isValid = false;
      }
    }

    if (formData.id_telegram && formData.id_telegram.trim() !== "") {
      const telegramRegex = /^[0-9]{7,15}$/;
      if (!telegramRegex.test(formData.id_telegram)) {
        errors.id_telegram = "ID Telegram harus 7-15 digit";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    const validation = validasiPassword(value);
    setPasswordValidation(validation);
    if (formErrors.password && validation.valid) {
      setFormErrors({ ...formErrors, password: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading(
      selectedUser ? "Mengupdate user..." : "Menambahkan user...",
    );

    try {
      const userData: Partial<User> = {
        nama: formData.nama.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() || undefined,
        nomor_telepon: formData.nomor_telepon.trim() || undefined,
        id_telegram: formData.id_telegram.trim() || undefined,
        role: formData.role,
        status_users: formData.status_users,
      };

      if (selectedUser) {
        const { error } = await supabase
          .from("users")
          .update(userData)
          .eq("id", selectedUser.id);

        if (error) throw error;

        toast.success("User berhasil diupdate!", {
          id: loadingToast,
        });
      } else {
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        userData.password = hashedPassword;

        const { error } = await supabase.from("users").insert([userData]);

        if (error) throw error;

        toast.success("User berhasil ditambahkan!", {
          id: loadingToast,
        });
      }

      handleCloseDialog();
      await fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menyimpan user";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Menghapus user...");

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User berhasil dihapus!", {
        id: loadingToast,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus user";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    const loadingToast = toast.loading(`Menghapus ${selectedIds.size} user...`);

    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase
        .from("users")
        .delete()
        .in("id", idsArray);

      if (error) throw error;

      toast.success(`Berhasil menghapus ${selectedIds.size} user!`, {
        id: loadingToast,
      });

      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await fetchUsers();
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus user";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Mereset password...");

    try {
      const newPassword = `${selectedUser.username.charAt(0).toUpperCase() + selectedUser.username.slice(1)}1234#`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(
        <>
          Password berhasil direset!
          <br />
          Password baru: <strong>{newPassword}</strong>
        </>,
        {
          id: loadingToast,
          duration: 6000,
        },
      );

      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mereset password";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Sort options
  const sortOptions = [
    { value: "nama-asc", label: "Nama (A-Z)" },
    { value: "nama-desc", label: "Nama (Z-A)" },
    { value: "username-asc", label: "Username (A-Z)" },
    { value: "username-desc", label: "Username (Z-A)" },
    { value: "role-asc", label: "Role (A-Z)" },
    { value: "role-desc", label: "Role (Z-A)" },
    { value: "created_at-desc", label: "Terbaru" },
    { value: "created_at-asc", label: "Terlama" },
  ];

  const showReset =
    statusFilter !== "all" ||
    roleFilter !== "all" ||
    sortField !== "nama" ||
    sortOrder !== "asc" ||
    searchQuery !== "";

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
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data pengguna sistem
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah User
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Title and Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Users ({totalItems})</CardTitle>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama, username, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              {/* Sort Filter */}
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{getSortLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Icons.Filter className="h-4 w-4" />
                    <span>
                      {statusFilter === "all"
                        ? "Semua Status"
                        : statusFilter === "active"
                          ? "Aktif"
                          : "Nonaktif"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select
                value={roleFilter}
                onValueChange={(value: "all" | "administrator" | "user") =>
                  setRoleFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Icons.Users className="h-4 w-4" />
                    <span>
                      {roleFilter === "all"
                        ? "Semua Role"
                        : roleFilter === "administrator"
                          ? "Administrator"
                          : "User"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Button */}
              {showReset && (
                <Button variant="outline" onClick={handleResetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={
                        isSomeSelected
                          ? "data-[state=checked]:bg-primary/50"
                          : ""
                      }
                    />
                  </TableHead>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24">Role</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-[180px]">Dibuat</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data user"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user, index) => {
                    const rowNumber = startIndex + index + 1;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(user.id, checked as boolean)
                            }
                            aria-label={`Select ${user.nama}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>{user.nama}</div>
                          {user.id_telegram && (
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id_telegram}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === "administrator"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                            }
                          >
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status_users === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700"
                                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700"
                            }
                          >
                            {user.status_users === "active"
                              ? "Aktif"
                              : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.created_at
                            ? formatDateTime(user.created_at)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleOpenResetPasswordDialog(user)
                                    }
                                    className="h-8 w-8"
                                    disabled={submitting}
                                  >
                                    <KeyRound className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset Password</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleOpenDialog(user)}
                                    className="h-8 w-8"
                                    disabled={submitting}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleOpenDeleteDialog(user)}
                                    className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                    disabled={submitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Hapus</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Tambah User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? "Update informasi user" : "Tambah user baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => {
                    setFormData({ ...formData, nama: e.target.value });
                    if (formErrors.nama) {
                      setFormErrors({ ...formErrors, nama: "" });
                    }
                  }}
                  placeholder="Masukkan nama lengkap"
                  disabled={submitting}
                  className={formErrors.nama ? "border-red-500" : ""}
                />
                {formErrors.nama && (
                  <p className="text-sm text-red-500">{formErrors.nama}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      username: e.target.value.toLowerCase(),
                    });
                    if (formErrors.username) {
                      setFormErrors({ ...formErrors, username: "" });
                    }
                  }}
                  placeholder="Pilih username (min 3-20 karakter)"
                  disabled={submitting}
                  className={formErrors.username ? "border-red-500" : ""}
                />
                {formErrors.username && (
                  <p className="text-sm text-red-500">{formErrors.username}</p>
                )}
              </div>

              {/* Password - Hanya untuk User Baru */}
              {!selectedUser && (
                <div className="space-y-2">
                  <PasswordInput
                    id="password"
                    name="password"
                    label="Password"
                    placeholder="Minimal 8 karakter dengan kombinasi huruf, angka, dan simbol"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    disabled={submitting}
                    error={formErrors.password}
                    required
                  />

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <PasswordStrengthIndicator
                      password={formData.password}
                      validationResult={passwordValidation || undefined}
                      showRequirements={true}
                      showStrengthBar={true}
                    />
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: "" });
                    }
                  }}
                  placeholder="Masukkan email"
                  disabled={submitting}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-2">
                <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                <Input
                  id="nomor_telepon"
                  type="tel"
                  value={formData.nomor_telepon}
                  onChange={(e) => {
                    setFormData({ ...formData, nomor_telepon: e.target.value });
                    if (formErrors.nomor_telepon) {
                      setFormErrors({ ...formErrors, nomor_telepon: "" });
                    }
                  }}
                  placeholder="08xxxxxxxxxx"
                  disabled={submitting}
                  className={formErrors.nomor_telepon ? "border-red-500" : ""}
                />
                {formErrors.nomor_telepon && (
                  <p className="text-sm text-red-500">
                    {formErrors.nomor_telepon}
                  </p>
                )}
              </div>

              {/* ID Telegram */}
              <div className="space-y-2">
                <Label htmlFor="id_telegram">ID Telegram</Label>
                <Input
                  id="id_telegram"
                  type="tel"
                  value={formData.id_telegram}
                  onChange={(e) => {
                    setFormData({ ...formData, id_telegram: e.target.value });
                    if (formErrors.id_telegram) {
                      setFormErrors({ ...formErrors, id_telegram: "" });
                    }
                  }}
                  placeholder="Contoh: 1234567890"
                  disabled={submitting}
                  className={formErrors.id_telegram ? "border-red-500" : ""}
                />
                {formErrors.id_telegram && (
                  <p className="text-sm text-red-500">
                    {formErrors.id_telegram}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "administrator" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger
                    className={formErrors.role ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>

              {/* Status - Hanya untuk Edit */}
              {selectedUser && (
                <div className="space-y-2">
                  <Label htmlFor="status_users">Status</Label>
                  <Select
                    value={formData.status_users}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status_users: value })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user{" "}
              <strong>{selectedUser?.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} User?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} user yang
              dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mereset password user{" "}
              <strong>{selectedUser?.nama}</strong>?
              <br />
              <br />
              Password akan direset menjadi:{" "}
              <strong>
                {selectedUser
                  ? `${selectedUser.username.charAt(0).toUpperCase() + selectedUser.username.slice(1)}1234#`
                  : ""}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white dark:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Mereset..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Denied Dialog */}
      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
