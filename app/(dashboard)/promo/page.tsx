// app/(dashboard)/promo/page.tsx
"use client";

import { AccessDeniedDialog } from "@/components/access-denied-dialog";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { deleteFile, getFilePathFromUrl, uploadFile } from "@/lib/upload";
import { formatDateTime } from "@/lib/utils";
import { validateImage } from "@/lib/validasi/validasiImage";
import { PromoStatus, PromoWithCreator } from "@/types/index";
import {
  Calendar,
  Eye,
  File,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface FormDataType {
  title: string;
  description: string;
  picture: string;
  status: PromoStatus;
  pictureFile: File | null;
  pictureDeleted: boolean;
}

interface FormErrorsType {
  title: string;
  description: string;
  picture: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  picture: "",
  status: "active",
  pictureFile: null,
  pictureDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  title: "",
  description: "",
  picture: "",
};

const STATUS_OPTIONS: { value: PromoStatus; label: string; color: string }[] = [
  {
    value: "active",
    label: "Aktif",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700",
  },
  {
    value: "non_active",
    label: "Tidak Aktif",
    color:
      "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700",
  },
];

const ITEMS_PER_PAGE_OPTIONS = [8, 12, 16, 24, 32];

export default function PromoPage() {
  const [promo, setPromo] = useState<PromoWithCreator[]>([]);
  const [filteredPromo, setFilteredPromo] = useState<PromoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoWithCreator | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromoStatus | "all">("all");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPromo = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("promo")
        .select(
          `
                    *,
                    created_by_user:users!promo_created_by_fkey(
                        id,
                        nama,
                        username,
                        avatar
                    ),
                    updated_by_user:users!promo_updated_by_fkey(
                        id,
                        nama,
                        username,
                        avatar
                    )
                `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPromo(data || []);
      setFilteredPromo(data || []);
    } catch (error) {
      console.error("Error fetching promo:", error);
      toast.error("Gagal memuat data promo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromo();
  }, [fetchPromo]);

  useEffect(() => {
    let filtered = [...promo];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.description
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredPromo(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [promo, debouncedSearch, statusFilter]);

  // Pagination calculations
  const paginatedPromo = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPromo.slice(startIndex, endIndex);
  }, [filteredPromo, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPromo.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPromo();
    setRefreshing(false);
    toast.success("Data berhasil diperbarui");
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedPromo.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setSubmitting(true);

    try {
      for (const id of selectedItems) {
        const promo = filteredPromo.find((item) => item.id === id);
        if (promo?.picture) {
          const path = getFilePathFromUrl(promo.picture, "promo");
          if (path) {
            await deleteFile("promo", path);
          }
        }

        const { error } = await supabase.from("promo").delete().eq("id", id);

        if (error) throw error;
      }

      toast.success(`${selectedItems.length} promo berhasil dihapus`);
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      fetchPromo();
    } catch (error) {
      console.error("Error deleting promos:", error);
      toast.error("Gagal menghapus promo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDialog = (promo?: PromoWithCreator) => {
    if (promo) {
      setSelectedPromo(promo);
      setFormData({
        title: promo.title,
        description: promo.description,
        picture: promo.picture || "",
        status: promo.status,
        pictureFile: null,
        pictureDeleted: false,
      });
    } else {
      setSelectedPromo(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedPromo(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
    }, 200);
  };

  const handleOpenDetailDialog = (promo: PromoWithCreator) => {
    setSelectedPromo(promo);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => {
      setSelectedPromo(null);
    }, 200);
  };

  const handleOpenDeleteDialog = (promo: PromoWithCreator) => {
    setSelectedPromo(promo);
    setDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = "Judul promo wajib diisi";
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = "Deskripsi promo wajib diisi";
      isValid = false;
    }

    if (formData.pictureFile) {
      const validation = validateImage(formData.pictureFile);
      if (!validation.valid) {
        errors.picture = validation.error || "File tidak valid";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);

    try {
      let pictureUrl = formData.picture;

      if (formData.pictureDeleted && selectedPromo?.picture) {
        const oldPath = getFilePathFromUrl(selectedPromo.picture, "promo");
        if (oldPath) {
          await deleteFile("promo", oldPath);
        }
        pictureUrl = "";
      }

      if (formData.pictureFile) {
        if (selectedPromo?.picture) {
          const oldPath = getFilePathFromUrl(selectedPromo.picture, "promo");
          if (oldPath) {
            await deleteFile("promo", oldPath);
          }
        }

        const uploadResult = await uploadFile({
          bucket: "promo",
          folder: "images",
          file: formData.pictureFile,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Gagal mengupload gambar");
        }

        pictureUrl = uploadResult.url || "";
      }

      if (selectedPromo) {
        const { error } = await supabase
          .from("promo")
          .update({
            title: formData.title,
            description: formData.description,
            picture: pictureUrl,
            status: formData.status,
            updated_by: currentUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedPromo.id);

        if (error) throw error;

        toast.success("Promo berhasil diperbarui");
      } else {
        const { error } = await supabase.from("promo").insert({
          title: formData.title,
          description: formData.description,
          picture: pictureUrl,
          status: "active",
          created_by: currentUserId,
        });

        if (error) throw error;

        toast.success("Promo berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchPromo();
    } catch (error) {
      console.error("Error saving promo:", error);
      toast.error("Gagal menyimpan promo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPromo) return;

    setSubmitting(true);

    try {
      if (selectedPromo.picture) {
        const path = getFilePathFromUrl(selectedPromo.picture, "promo");
        if (path) {
          await deleteFile("promo", path);
        }
      }

      const { error } = await supabase
        .from("promo")
        .delete()
        .eq("id", selectedPromo.id);

      if (error) throw error;

      toast.success("Promo berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedPromo(null);
      fetchPromo();
    } catch (error) {
      console.error("Error deleting promo:", error);
      toast.error("Gagal menghapus promo");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setFormErrors({
          ...formErrors,
          picture: validation.error || "File tidak valid",
        });
        e.target.value = "";
        return;
      }

      setFormData({
        ...formData,
        pictureFile: file,
        pictureDeleted: false,
      });
      setFormErrors({ ...formErrors, picture: "" });
    }
  };

  const handleRemovePicture = () => {
    setFormData({
      ...formData,
      picture: "",
      pictureFile: null,
      pictureDeleted: true,
    });
  };

  const getStatusBadge = (status: PromoStatus) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return (
      <Badge variant="outline" className={statusOption?.color}>
        {statusOption?.label}
      </Badge>
    );
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Promo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Promo</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Kelola promo dan penawaran spesial
            </p>
          </div>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Hapus</span>
                <span className="sm:hidden">({selectedItems.length})</span>
                <span className="hidden sm:inline">
                  ({selectedItems.length})
                </span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tambah Promo</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="space-y-3">
        {/* Row 1: Select All & Items Per Page (Mobile) / Full Controls (Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Select All - Left side */}
          {paginatedPromo.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedItems.length === paginatedPromo.length &&
                  paginatedPromo.length > 0
                }
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label
                htmlFor="select-all"
                className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
              >
                Pilih Semua
              </Label>
            </div>
          )}

          {/* Desktop: All filters in one row */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            {/* Items per page */}
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PromoStatus | "all")
              }
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari promo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Refresh Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-9 w-9"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Mobile: Filters in separate rows */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex gap-2">
            {/* Items per page */}
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="flex-1 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PromoStatus | "all")
              }
            >
              <SelectTrigger className="flex-1 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Search - Full Width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPromo.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="rounded-full bg-muted p-3 mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                Tidak ada promo ditemukan
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Mulai dengan menambahkan promo baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPromo.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative"
                  onClick={() => handleOpenDetailDialog(item)}
                >
                  {/* Checkbox - Top Left */}
                  <div
                    className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                      className="bg-white dark:bg-gray-800 shadow-md h-4 w-4 sm:h-5 sm:w-5"
                    />
                  </div>

                  {/* Image */}
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.picture ? (
                      <Image
                        src={item.picture}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Eye className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div>
                      <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-1.5 sm:mb-2">
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 sm:mt-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      {/* User info & Date */}
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <Avatar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0">
                          <AvatarImage
                            src={item.created_by_user?.avatar}
                            alt={item.created_by_user?.nama || "User"}
                          />
                          <AvatarFallback className="text-[10px] sm:text-xs">
                            {item.created_by_user?.nama
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[10px] sm:text-xs text-muted-foreground">
                          {item.created_by_user?.nama}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                          •
                        </span>
                        <Calendar className="h-3 w-3 shrink-0 hidden sm:block" />
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8 shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog(item);
                                }}
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8 shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteDialog(item);
                                }}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hapus</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 sm:gap-3 mt-4">
                {/* Pagination - Tengah */}
                <Pagination>
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 && handlePageChange(currentPage - 1)
                        }
                        className={`h-8 sm:h-9 px-2 sm:px-3 ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }`}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index} className="hidden sm:block">
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page as number)}
                            isActive={currentPage === page}
                            className="cursor-pointer h-9"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    {/* Mobile only */}
                    <PaginationItem className="sm:hidden">
                      <div className="h-8 px-3 flex items-center justify-center text-sm font-medium">
                        {currentPage} / {totalPages}
                      </div>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          handlePageChange(currentPage + 1)
                        }
                        className={`h-8 sm:h-9 px-2 sm:px-3 ${
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                {/* Info Text - Bawah */}
                <div className="text-xs sm:text-sm text-muted-foreground text-center">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredPromo.length)}{" "}
                  dari {filteredPromo.length} data promo
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedPromo ? "Edit Promo" : "Tambah Promo Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedPromo
                ? "Perbarui informasi promo"
                : "Isi form di bawah untuk menambahkan promo baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs sm:text-sm">
                Judul Promo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: "" });
                  }
                }}
                disabled={submitting}
                placeholder="Masukkan judul promo"
                className={`text-sm ${formErrors.title ? "border-red-500" : ""}`}
              />
              {formErrors.title && (
                <p className="text-xs sm:text-sm text-red-500">
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: "" });
                  }
                }}
                disabled={submitting}
                placeholder="Masukkan deskripsi promo"
                className={`min-h-[120px] sm:min-h-[150px] resize-y text-sm ${
                  formErrors.description ? "border-red-500" : ""
                }`}
              />
              {formErrors.description && (
                <p className="text-xs sm:text-sm text-red-500">
                  {formErrors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="picture" className="text-xs sm:text-sm">
                Gambar Promo
              </Label>

              {(formData.picture || formData.pictureFile) &&
              !formData.pictureDeleted ? (
                <div className="relative w-full h-40 sm:h-48 rounded-md overflow-hidden border">
                  <Image
                    src={
                      formData.pictureFile
                        ? URL.createObjectURL(formData.pictureFile)
                        : formData.picture
                    }
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8"
                    onClick={handleRemovePicture}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 transition-colors ${
                      formErrors.picture
                        ? "border-red-500"
                        : "border-muted-foreground/25"
                    } hover:border-muted-foreground/50`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add(
                        "border-primary",
                        "bg-primary/5",
                      );
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        "border-primary",
                        "bg-primary/5",
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        "border-primary",
                        "bg-primary/5",
                      );
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const validation = validateImage(file);
                        if (!validation.valid) {
                          setFormErrors({
                            ...formErrors,
                            picture: validation.error || "File tidak valid",
                          });
                          return;
                        }
                        setFormData({
                          ...formData,
                          pictureFile: file,
                          pictureDeleted: false,
                        });
                        setFormErrors({ ...formErrors, picture: "" });
                      }
                    }}
                  >
                    <Input
                      id="picture"
                      type="file"
                      accept="image/webp"
                      onChange={handlePictureChange}
                      disabled={submitting}
                      className="hidden"
                    />
                    <label
                      htmlFor="picture"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <div className="rounded-full bg-muted p-2 sm:p-3 mb-2">
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium mb-1">
                        Klik untuk upload atau drag & drop
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Format: WebP, Max: 300KB
                      </p>
                    </label>
                  </div>
                  {formErrors.picture && (
                    <p className="text-xs sm:text-sm text-red-500">
                      {formErrors.picture}
                    </p>
                  )}
                </>
              )}
            </div>

            {selectedPromo && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    setFormData({ ...formData, status: value as PromoStatus });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                )}
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Detail Promo
            </DialogTitle>
          </DialogHeader>
          {selectedPromo && (
            <div className="space-y-3 sm:space-y-4">
              {selectedPromo.picture && (
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedPromo.picture}
                    alt={selectedPromo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    priority
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {selectedPromo.title}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedPromo.status)}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarImage
                      src={selectedPromo.created_by_user?.avatar}
                      alt={selectedPromo.created_by_user?.nama || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {selectedPromo.created_by_user?.nama
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Dibuat oleh {selectedPromo.created_by_user?.nama} •{" "}
                    {formatDateTime(selectedPromo.created_at)}
                  </span>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm sm:text-base">
                  {selectedPromo.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDetailDialog}
              size="sm"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Promo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus promo{" "}
              <strong>{selectedPromo?.title}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white flex-1 sm:flex-none"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Beberapa Promo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} promo</strong> yang dipilih?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white flex-1 sm:flex-none"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting
                ? "Menghapus..."
                : `Hapus ${selectedItems.length} Promo`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
