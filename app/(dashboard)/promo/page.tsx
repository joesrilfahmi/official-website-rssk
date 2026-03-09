// app/(dashboard)/promo/page.tsx
"use client";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AccessDeniedDialog } from "@/components/access-denied-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { deleteFile, getFilePathFromUrl, uploadFile } from "@/lib/upload";
import { formatDateTime } from "@/lib/utils";
import { validateImage } from "@/lib/validasi/validasiImage";
import { PromoStatus, PromoWithCreator } from "@/types/index";
import {
  Calendar, Clock, Eye, File, Loader2, Pencil, Plus, Search, Trash2, Upload, X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface FormDataType {
  title: string;
  description: string;
  picture: string;
  status: PromoStatus;
  pictureFile: File | null;
  pictureDeleted: boolean;
  start_date: string;
  end_date: string;
}

interface FormErrorsType {
  title: string;
  description: string;
  picture: string;
  start_date: string;
  end_date: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  picture: "",
  status: "active",
  pictureFile: null,
  pictureDeleted: false,
  start_date: "",
  end_date: "",
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  title: "",
  description: "",
  picture: "",
  start_date: "",
  end_date: "",
};

/* ─────────────────────────────────────────
   Helper — status tanggal
───────────────────────────────────────── */
type DateStatus = "active" | "upcoming" | "expired" | "no_date";

function getDateStatus(
  start_date: string | null | undefined,
  end_date: string | null | undefined,
): DateStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = start_date ? new Date(start_date) : null;
  const end = end_date ? new Date(end_date) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (!start && !end) return "no_date";
  if (start && today < start) return "upcoming";
  if (end && today > end) return "expired";
  return "active";
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_OPTIONS: { value: PromoStatus; label: string; color: string }[] = [
  {
    value: "active",
    label: "Aktif",
    color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700",
  },
  {
    value: "non_active",
    label: "Tidak Aktif",
    color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700",
  },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
] as const;

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function PromoPage() {
  const [promo, setPromo] = useState<PromoWithCreator[]>([]);
  const [filteredPromo, setFilteredPromo] = useState<PromoWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoWithCreator | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromoStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  /* ── Init ── */
  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUserId(user.id);
    };
    initUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ── Fetch ── */
  const fetchPromo = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("promo")
        .select(`
          *,
          created_by_user:users!promo_created_by_fkey(id, nama, username, avatar),
          updated_by_user:users!promo_updated_by_fkey(id, nama, username, avatar)
        `)
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

  useEffect(() => { fetchPromo(); }, [fetchPromo]);

  /* ── Filter & sort ── */
  useEffect(() => {
    let filtered = [...promo];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.description.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "a-z": return a.title.localeCompare(b.title, "id");
        case "z-a": return b.title.localeCompare(a.title, "id");
        default: return 0;
      }
    });

    setFilteredPromo(filtered);
    setCurrentPage(1);
  }, [promo, debouncedSearch, statusFilter, sortBy]);

  /* ── Pagination ── */
  const paginatedPromo = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPromo.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPromo, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPromo.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Selection ── */
  const handleSelectItem = (id: string) =>
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSelectAll = (checked: boolean) =>
    setSelectedItems(checked ? paginatedPromo.map((item) => item.id) : []);

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedItems) {
        const item = filteredPromo.find((p) => p.id === id);
        if (item?.picture) {
          const path = getFilePathFromUrl(item.picture, "promo");
          if (path) await deleteFile("promo", path);
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

  /* ── Dialog helpers ── */
  const handleOpenDialog = (item?: PromoWithCreator) => {
    if (item) {
      setSelectedPromo(item);
      setFormData({
        title: item.title,
        description: item.description,
        picture: item.picture || "",
        status: item.status,
        pictureFile: null,
        pictureDeleted: false,
        start_date: item.start_date || "",
        end_date: item.end_date || "",
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

  const handleOpenDetailDialog = (item: PromoWithCreator) => {
    setSelectedPromo(item);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => setSelectedPromo(null), 200);
  };

  const handleOpenDeleteDialog = (item: PromoWithCreator) => {
    setSelectedPromo(item);
    setDeleteDialogOpen(true);
  };

  /* ── Validation ── */
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
    if (!formData.start_date) {
      errors.start_date = "Tanggal mulai wajib diisi";
      isValid = false;
    }
    if (!formData.end_date) {
      errors.end_date = "Tanggal berakhir wajib diisi";
      isValid = false;
    }
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      errors.end_date = "Tanggal berakhir tidak boleh sebelum tanggal mulai";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Mohon lengkapi semua field yang wajib diisi"); return; }
    setSubmitting(true);

    try {
      let pictureUrl = formData.picture;

      if (formData.pictureDeleted && selectedPromo?.picture) {
        const oldPath = getFilePathFromUrl(selectedPromo.picture, "promo");
        if (oldPath) await deleteFile("promo", oldPath);
        pictureUrl = "";
      }

      if (formData.pictureFile) {
        if (selectedPromo?.picture) {
          const oldPath = getFilePathFromUrl(selectedPromo.picture, "promo");
          if (oldPath) await deleteFile("promo", oldPath);
        }
        const uploadResult = await uploadFile({ bucket: "promo", folder: "images", file: formData.pictureFile });
        if (!uploadResult.success) throw new Error(uploadResult.error || "Gagal mengupload gambar");
        pictureUrl = uploadResult.url || "";
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        picture: pictureUrl,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (selectedPromo) {
        const { error } = await supabase
          .from("promo")
          .update({ ...payload, updated_by: currentUserId, updated_at: new Date().toISOString() })
          .eq("id", selectedPromo.id);
        if (error) throw error;
        toast.success("Promo berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("promo")
          .insert({ ...payload, status: "active", created_by: currentUserId });
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

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selectedPromo) return;
    setSubmitting(true);
    try {
      if (selectedPromo.picture) {
        const path = getFilePathFromUrl(selectedPromo.picture, "promo");
        if (path) await deleteFile("promo", path);
      }
      const { error } = await supabase.from("promo").delete().eq("id", selectedPromo.id);
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

  /* ── Badge helpers ── */
  const getStatusBadge = (item: PromoWithCreator) => {
    if (item.status === "non_active") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700">
          Tidak Aktif
        </Badge>
      );
    }
    const ds = getDateStatus(item.start_date, item.end_date);
    if (ds === "upcoming") {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
          Belum Mulai
        </Badge>
      );
    }
    if (ds === "expired") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
          Kadaluarsa
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700">
        Aktif
      </Badge>
    );
  };

  /* ── Card dimming helper ── */
  const isCardDimmed = (item: PromoWithCreator) => {
    if (item.status === "non_active") return true;
    const ds = getDateStatus(item.start_date, item.end_date);
    return ds === "upcoming" || ds === "expired";
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
            <BreadcrumbPage>Promo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Promo</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
              Kelola promo dan penawaran spesial
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
                <span className="hidden sm:inline">({selectedItems.length})</span>
              </Button>
            )}
            <Button size="sm" onClick={() => handleOpenDialog()} className="flex-1 sm:flex-initial min-w-0">
              <Plus className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">Tambah Promo</span>
              <span className="sm:hidden truncate">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {paginatedPromo.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === paginatedPromo.length && paginatedPromo.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">All</Label>
            </div>
          )}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Urutan" /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PromoStatus | "all")}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari promo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
        </div>

        {/* Mobile filters */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Urutan" /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PromoStatus | "all")}>
              <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari promo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
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
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2"><Skeleton className="h-6 w-20" /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPromo.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-16">
              <div className="rounded-full bg-muted p-3 mb-3 sm:mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">Tidak ada promo ditemukan</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" ? "Coba ubah filter pencarian" : "Mulai dengan menambahkan promo baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPromo.map((item) => {
                const dimmed = isCardDimmed(item);
                return (
                  <Card
                    key={item.id}
                    className={`group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative ${dimmed ? "opacity-60 grayscale" : ""}`}
                    onClick={() => handleOpenDetailDialog(item)}
                  >
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                        className="shadow-md h-5 w-5"
                      />
                    </div>
                    <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                      {item.picture ? (
                        <Image src={item.picture} alt={item.title} fill
                          className="object-cover transition-transform group-hover:scale-105"
                          style={{ objectPosition: "center 30%" }}
                          sizes="(max-width: 640px) 100vw, 512px" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Eye className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div>
                        <div className="flex gap-2 flex-wrap mb-2">{getStatusBadge(item)}</div>
                        <h3 className="font-semibold text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.description}</p>
                        {(item.start_date || item.end_date) && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                              {item.start_date && item.end_date
                                ? `${new Date(item.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(item.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                                : item.start_date
                                ? `Mulai ${new Date(item.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                                : `Hingga ${new Date(item.end_date!).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={item.created_by_user?.avatar} alt={item.created_by_user?.nama || "User"} />
                            <AvatarFallback className="text-xs">{item.created_by_user?.nama?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs text-muted-foreground">{item.created_by_user?.nama}</span>
                          <span className="text-muted-foreground hidden sm:inline">•</span>
                          <Calendar className="h-3 w-3 shrink-0 hidden sm:block" />
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md"
                                  onClick={(e) => { e.stopPropagation(); handleOpenDialog(item); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8 shadow-md"
                                  onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(item); }}>
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
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6">
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPromo.length)} dari {filteredPromo.length} data promo
                  </div>
                  <div className="flex-1" />
                  <div className="shrink-0">
                    <Pagination>
                      <PaginationContent className="gap-1">
                        <PaginationItem>
                          <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={`h-9 px-3 text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
                        </PaginationItem>
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
                            {page === "ellipsis" ? <PaginationEllipsis /> : (
                              <PaginationLink onClick={() => handlePageChange(page as number)} isActive={currentPage === page} className="cursor-pointer h-9">{page}</PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={`h-9 px-3 text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
                <div className="flex sm:hidden flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground text-center px-2">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPromo.length)} dari {filteredPromo.length} data promo
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`h-8 px-2 text-xs ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
                      </PaginationItem>
                      <PaginationItem>
                        <div className="h-8 px-2 flex items-center justify-center text-xs font-medium min-w-[60px]">
                          {currentPage} / {totalPages}
                        </div>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={`h-8 px-2 text-xs ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
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
              {selectedPromo ? "Edit Promo" : "Tambah Promo Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedPromo ? "Perbarui informasi promo" : "Isi form di bawah untuk menambahkan promo baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

            {/* Gambar */}
            <div className="space-y-2">
              <Label htmlFor="picture" className="text-sm">Gambar Promo</Label>
              {(formData.picture || formData.pictureFile) && !formData.pictureDeleted ? (
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <Image
                    src={formData.pictureFile ? URL.createObjectURL(formData.pictureFile) : formData.picture}
                    alt="Preview" fill className="object-cover" unoptimized
                  />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setFormData({ ...formData, pictureFile: null, pictureDeleted: true })}
                    disabled={submitting}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (!file) return;
                      const validation = validateImage(file);
                      if (!validation.valid) { setFormErrors({ ...formErrors, picture: validation.error || "" }); toast.error(validation.error || "File tidak valid"); return; }
                      setFormData({ ...formData, pictureFile: file, pictureDeleted: false });
                      setFormErrors({ ...formErrors, picture: "" });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Input id="picture" type="file" accept="image/webp" onChange={handlePictureChange} disabled={submitting} className="hidden" />
                    <label htmlFor="picture" className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="rounded-full bg-muted p-3 mb-2"><Upload className="h-6 w-6 text-muted-foreground" /></div>
                      <p className="text-sm font-medium mb-1">Klik untuk upload atau drag & drop</p>
                      <p className="text-xs text-muted-foreground">Format: WebP, Max: 300KB</p>
                    </label>
                  </div>
                  {formErrors.picture && <p className="text-sm text-red-500">{formErrors.picture}</p>}
                </>
              )}
            </div>

            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Judul Promo <span className="text-red-500">*</span></Label>
              <Input id="title" value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (formErrors.title) setFormErrors({ ...formErrors, title: "" }); }}
                disabled={submitting} placeholder="Masukkan judul promo" className={formErrors.title ? "border-red-500" : ""} />
              {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Deskripsi <span className="text-red-500">*</span></Label>
              <Textarea id="description" value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (formErrors.description) setFormErrors({ ...formErrors, description: "" }); }}
                disabled={submitting} placeholder="Masukkan deskripsi promo"
                className={`min-h-[150px] resize-y ${formErrors.description ? "border-red-500" : ""}`} />
              {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
            </div>

            {/* Tanggal mulai & berakhir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Tanggal Mulai <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" disabled={submitting}
                      className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground", formErrors.start_date && "border-red-500")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.start_date
                        ? new Date(formData.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Pilih tanggal mulai"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) => {
                        setFormData({ ...formData, start_date: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "" });
                        if (formErrors.start_date) setFormErrors({ ...formErrors, start_date: "" });
                      }} />
                  </PopoverContent>
                </Popover>
                {formErrors.start_date && <p className="text-sm text-red-500">{formErrors.start_date}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tanggal Berakhir <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" disabled={submitting}
                      className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground", formErrors.end_date && "border-red-500")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.end_date
                        ? new Date(formData.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Pilih tanggal berakhir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      disabled={(date) => formData.start_date ? date < new Date(formData.start_date) : false}
                      onSelect={(date) => {
                        setFormData({ ...formData, end_date: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "" });
                        if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: "" });
                      }} />
                  </PopoverContent>
                </Popover>
                {formErrors.end_date && <p className="text-sm text-red-500">{formErrors.end_date}</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground -mt-1">
              Promo akan otomatis tampil abu-abu jika belum mencapai tanggal mulai atau sudah melewati tanggal berakhir.
            </p>

            {/* Status (edit only) */}
            {selectedPromo && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status <span className="text-red-500">*</span></Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as PromoStatus })} disabled={submitting}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detail Promo</DialogTitle>
          </DialogHeader>
          {selectedPromo && (
            <div className="space-y-4">
              {/* Gambar */}
              {selectedPromo.picture && (
                <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden">
                  <Image src={selectedPromo.picture} alt={selectedPromo.title} fill
                    className="object-cover" sizes="(max-width: 768px) 100vw, 800px" priority unoptimized />
                </div>
              )}

              {/* Judul + Badge + Audit box — struktur identik dengan jadwal dokter */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{selectedPromo.title}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedPromo)}
                </div>

                {/* Rentang tanggal */}
                {(selectedPromo.start_date || selectedPromo.end_date) && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedPromo.start_date && selectedPromo.end_date
                        ? `${new Date(selectedPromo.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} – ${new Date(selectedPromo.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                        : selectedPromo.start_date
                        ? `Mulai ${new Date(selectedPromo.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                        : `Hingga ${new Date(selectedPromo.end_date!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                      }
                    </span>
                  </div>
                )}

                {/* ── Audit box — persis sama dengan jadwal dokter ── */}
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  {/* Dibuat oleh */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={selectedPromo.created_by_user?.avatar} alt={selectedPromo.created_by_user?.nama || "User"} />
                      <AvatarFallback className="text-[10px]">
                        {selectedPromo.created_by_user?.nama?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Dibuat oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedPromo.created_by_user?.nama ?? "-"}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(selectedPromo.created_at)}</span>
                  </div>

                  {/* Diperbarui oleh — hanya tampil jika ada, identik jadwal dokter */}
                  {selectedPromo.updated_by_user && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={selectedPromo.updated_by_user.avatar} alt={selectedPromo.updated_by_user.nama || "User"} />
                        <AvatarFallback className="text-[10px]">
                          {selectedPromo.updated_by_user.nama?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Diperbarui oleh{" "}
                        <span className="font-medium text-foreground">
                          {selectedPromo.updated_by_user.nama}
                        </span>
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatDateTime(selectedPromo.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm sm:text-base">{selectedPromo.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailDialog}>Tutup</Button>
            {selectedPromo && (
              <Button
                onClick={() => {
                  handleCloseDetailDialog();
                  setTimeout(() => handleOpenDialog(selectedPromo), 200);
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
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Promo?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus promo <strong>{selectedPromo?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Dialog ── */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Beberapa Promo?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus <strong>{selectedItems.length} promo</strong> yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : `Hapus ${selectedItems.length} Promo`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
}