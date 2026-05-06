// app/(dashboard)/partner/page.tsx
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
import CachedImage from "@/components/ui/custom/cached-image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Building2,
  Calendar,
  Clock,
  File,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface PartnerUser {
  id: string;
  nama: string;
  username: string;
  avatar?: string;
}

interface Partner {
  id: string;
  nama: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_user?: PartnerUser;
  updated_by_user?: PartnerUser;
}

interface FormDataType {
  nama: string;
  picture: string;
  pictureFile: File | null;
  pictureDeleted: boolean;
}

interface FormErrorsType {
  nama: string;
  picture: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  nama: "",
  picture: "",
  pictureFile: null,
  pictureDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  nama: "",
  picture: "",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
] as const;

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function PartnerPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">(
    "newest",
  );

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  /* ── Init user ── */
  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUserId(user.id);
    };
    initUser();
  }, []);

  /* ── Debounce search ── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ── Fetch ── */
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("partner")
        .select(
          `
          *,
          created_by_user:users!partner_created_by_fkey(
            id,
            nama,
            username,
            avatar
          ),
          updated_by_user:users!partner_updated_by_fkey(
            id,
            nama,
            username,
            avatar
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPartners(data || []);
      setFilteredPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Gagal memuat data partner");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  /* ── Filter & sort ── */
  useEffect(() => {
    let filtered = [...partners];

    if (debouncedSearch) {
      filtered = filtered.filter((item) =>
        item.nama.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "a-z":
          return a.nama.localeCompare(b.nama, "id");
        case "z-a":
          return b.nama.localeCompare(a.nama, "id");
        default:
          return 0;
      }
    });

    setFilteredPartners(filtered);
    setCurrentPage(1);
  }, [partners, debouncedSearch, sortBy]);

  /* ── Pagination ── */
  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPartners, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Selection ── */
  const handleSelectItem = (id: string) =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const handleSelectAll = (checked: boolean) =>
    setSelectedItems(checked ? paginatedPartners.map((item) => item.id) : []);

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedItems) {
        const partner = filteredPartners.find((item) => item.id === id);
        if (partner?.picture) {
          const path = getFilePathFromUrl(partner.picture, "partner");
          if (path) await deleteFile("partner", path);
        }
        const { error } = await supabase.from("partner").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success(`${selectedItems.length} partner berhasil dihapus`);
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partners:", error);
      toast.error("Gagal menghapus partner");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Dialog helpers ── */
  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setSelectedPartner(partner);
      setFormData({
        nama: partner.nama,
        picture: partner.picture || "",
        pictureFile: null,
        pictureDeleted: false,
      });
    } else {
      setSelectedPartner(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedPartner(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
    }, 200);
  };

  const handleOpenDetailDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => setSelectedPartner(null), 200);
  };

  const handleOpenDeleteDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setDeleteDialogOpen(true);
  };

  /* ── Validation ── */
  const validateForm = (): boolean => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.nama.trim()) {
      errors.nama = "Nama partner wajib diisi";
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

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    setSubmitting(true);

    try {
      let pictureUrl = formData.picture;

      if (formData.pictureDeleted && selectedPartner?.picture) {
        const oldPath = getFilePathFromUrl(selectedPartner.picture, "partner");
        if (oldPath) await deleteFile("partner", oldPath);
        pictureUrl = "";
      }

      if (formData.pictureFile) {
        if (selectedPartner?.picture) {
          const oldPath = getFilePathFromUrl(
            selectedPartner.picture,
            "partner",
          );
          if (oldPath) await deleteFile("partner", oldPath);
        }
        const uploadResult = await uploadFile({
          bucket: "partner",
          folder: "images",
          file: formData.pictureFile,
        });
        if (!uploadResult.success)
          throw new Error(uploadResult.error || "Gagal mengupload gambar");
        pictureUrl = uploadResult.url || "";
      }

      if (selectedPartner) {
        // ── UPDATE: simpan updated_by ──
        const { error } = await supabase
          .from("partner")
          .update({
            nama: formData.nama,
            picture: pictureUrl,
            updated_by: currentUserId, // ← simpan siapa yang update
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedPartner.id);
        if (error) throw error;
        toast.success("Partner berhasil diperbarui");
      } else {
        // ── INSERT: simpan created_by ──
        const { error } = await supabase.from("partner").insert({
          nama: formData.nama,
          picture: pictureUrl,
          created_by: currentUserId, // ← simpan siapa yang buat
        });
        if (error) throw error;
        toast.success("Partner berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      toast.error("Gagal menyimpan partner");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selectedPartner) return;
    setSubmitting(true);
    try {
      if (selectedPartner.picture) {
        const path = getFilePathFromUrl(selectedPartner.picture, "partner");
        if (path) await deleteFile("partner", path);
      }
      const { error } = await supabase
        .from("partner")
        .delete()
        .eq("id", selectedPartner.id);
      if (error) throw error;
      toast.success("Partner berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedPartner(null);
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Gagal menghapus partner");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Picture change ── */
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) {
      setFormErrors({ ...formErrors, picture: validation.error || "" });
      toast.error(validation.error || "File tidak valid");
      return;
    }
    setFormData({ ...formData, pictureFile: file, pictureDeleted: false });
    setFormErrors({ ...formErrors, picture: "" });
  };

  /* ── Pagination pages ── */
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  /* ── Render ── */
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
            <BreadcrumbPage>Partner</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Partner
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
              Kelola data partner
            </p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={submitting}
                className="flex-1 sm:flex-initial min-w-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline truncate">Hapus</span>
                <span className="sm:hidden">({selectedItems.length})</span>
                <span className="hidden sm:inline">
                  ({selectedItems.length})
                </span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="flex-1 sm:flex-initial min-w-0"
            >
              <Plus className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">Tambah Partner</span>
              <span className="sm:hidden truncate">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {paginatedPartners.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedItems.length === paginatedPartners.length &&
                  paginatedPartners.length > 0
                }
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label
                htmlFor="select-all"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                All
              </Label>
            </div>
          )}

          {/* Desktop */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "newest" | "oldest" | "a-z" | "z-a")
              }
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Urutan" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "newest" | "oldest" | "a-z" | "z-a")
              }
            >
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Urutan" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-16">
              <div className="rounded-full bg-muted p-3 mb-3 sm:mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                Tidak ada partner ditemukan
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Coba ubah filter pencarian"
                  : "Mulai dengan menambahkan partner baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPartners.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative"
                  onClick={() => handleOpenDetailDialog(item)}
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                      className="shadow-md h-5 w-5"
                    />
                  </div>

                  {/* Image */}
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.picture ? (
                      <CachedImage
                        src={item.picture}
                        alt={item.nama}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        style={{ objectPosition: "center 30%" }}
                        sizes="(max-width: 640px) 100vw, 512px"
                        unoptimized
                        bucket={""}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-semibold text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.nama}
                      </h3>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      {/* Creator + Date */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage
                            src={item.created_by_user?.avatar}
                            alt={item.created_by_user?.nama || "User"}
                          />
                          <AvatarFallback className="text-xs">
                            {item.created_by_user?.nama
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.created_by_user?.nama}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                          •
                        </span>
                        <Calendar className="h-3 w-3 shrink-0 hidden sm:block" />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog(item);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
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
                                className="h-8 w-8 shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteDialog(item);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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
              <div className="mt-4 sm:mt-6">
                {/* Desktop */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredPartners.length,
                    )}{" "}
                    dari {filteredPartners.length} data partner
                  </div>
                  <div className="flex-1" />
                  <div className="shrink-0">
                    <Pagination>
                      <PaginationContent className="gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              currentPage > 1 &&
                              handlePageChange(currentPage - 1)
                            }
                            className={`h-9 px-3 text-sm ${
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }`}
                          />
                        </PaginationItem>
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
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
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              currentPage < totalPages &&
                              handlePageChange(currentPage + 1)
                            }
                            className={`h-9 px-3 text-sm ${
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex sm:hidden flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground text-center px-2">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredPartners.length,
                    )}{" "}
                    dari {filteredPartners.length} data partner
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={`h-8 px-2 text-xs ${
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }`}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <div className="h-8 px-2 flex items-center justify-center text-xs font-medium min-w-[60px]">
                          {currentPage} / {totalPages}
                        </div>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={`h-8 px-2 text-xs ${
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          FORM DIALOG
      ══════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedPartner ? "Edit Partner" : "Tambah Partner Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedPartner
                ? "Perbarui informasi partner"
                : "Isi form di bawah untuk menambahkan partner baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Picture Upload */}
            <div className="space-y-2">
              <Label htmlFor="picture" className="text-sm">
                Gambar Partner
              </Label>

              {(formData.picture || formData.pictureFile) &&
              !formData.pictureDeleted ? (
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <CachedImage
                    src={
                      formData.pictureFile
                        ? URL.createObjectURL(formData.pictureFile)
                        : formData.picture
                    }
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                    bucket={""}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        pictureFile: null,
                        pictureDeleted: true,
                      })
                    }
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const validation = validateImage(file);
                        if (!validation.valid) {
                          setFormErrors({
                            ...formErrors,
                            picture: validation.error || "",
                          });
                          toast.error(validation.error || "File tidak valid");
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
                    onDragOver={(e) => e.preventDefault()}
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
                      <div className="rounded-full bg-muted p-3 mb-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Klik untuk upload atau drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format: WebP, Max: 300KB
                      </p>
                    </label>
                  </div>
                  {formErrors.picture && (
                    <p className="text-sm text-red-500">{formErrors.picture}</p>
                  )}
                </>
              )}
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-sm">
                Nama Partner <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => {
                  setFormData({ ...formData, nama: e.target.value });
                  if (formErrors.nama)
                    setFormErrors({ ...formErrors, nama: "" });
                }}
                disabled={submitting}
                placeholder="Masukkan nama partner"
                className={formErrors.nama ? "border-red-500" : ""}
              />
              {formErrors.nama && (
                <p className="text-sm text-red-500">{formErrors.nama}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
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

      {/* ══════════════════════════════════════════════════════
          DETAIL DIALOG
      ══════════════════════════════════════════════════════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Detail Partner
            </DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              {/* Image */}
              {selectedPartner.picture && (
                <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden">
                  <CachedImage
                    src={selectedPartner.picture}
                    alt={selectedPartner.nama}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    priority
                    unoptimized
                    bucket={""}
                  />
                </div>
              )}

              {/* Nama + Audit box */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {selectedPartner.nama}
                </h2>

                {/* ── Audit box — identik dengan berita & kamar inap ── */}
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  {/* Dibuat oleh */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage
                        src={selectedPartner.created_by_user?.avatar}
                        alt={selectedPartner.created_by_user?.nama || "User"}
                      />
                      <AvatarFallback className="text-[10px]">
                        {selectedPartner.created_by_user?.nama
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Dibuat oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedPartner.created_by_user?.nama ?? "-"}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(selectedPartner.created_at)}</span>
                  </div>

                  {/* Diperbarui oleh — hanya tampil jika ada */}
                  {selectedPartner.updated_by_user && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage
                          src={selectedPartner.updated_by_user.avatar}
                          alt={selectedPartner.updated_by_user.nama || "User"}
                        />
                        <AvatarFallback className="text-[10px]">
                          {selectedPartner.updated_by_user.nama
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Diperbarui oleh{" "}
                        <span className="font-medium text-foreground">
                          {selectedPartner.updated_by_user.nama}
                        </span>
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatDateTime(selectedPartner.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailDialog}>
              Tutup
            </Button>
            {selectedPartner && (
              <Button
                onClick={() => {
                  handleCloseDetailDialog();
                  setTimeout(() => handleOpenDialog(selectedPartner), 200);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Partner?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus partner{" "}
              <strong>{selectedPartner?.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Dialog ── */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Beberapa Partner?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} partner</strong> yang dipilih?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting
                ? "Menghapus..."
                : `Hapus ${selectedItems.length} Partner`}
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
