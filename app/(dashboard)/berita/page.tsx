// app/(dashboard)/berita/page.tsx
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
import { BeritaStatus, BeritaWithAuthor, Kategori } from "@/types/index";
import {
  Calendar,
  Clock,
  Eye,
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
interface FormDataType {
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  status: BeritaStatus;
  thumbnailFile: File | null;
  thumbnailDeleted: boolean;
}

interface FormErrorsType {
  title: string;
  description: string;
  category: string;
  thumbnail: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  category: "",
  tags: [],
  thumbnail: "",
  status: "active",
  thumbnailFile: null,
  thumbnailDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  title: "",
  description: "",
  category: "",
  thumbnail: "",
};

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_OPTIONS: { value: BeritaStatus; label: string; color: string }[] = [
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

const SUGGESTED_TAGS = [
  "Kesehatan",
  "Layanan Medis",
  "Berita Terkini",
  "Pengumuman",
  "Event",
  "Edukasi Kesehatan",
  "Fasilitas",
  "Dokter",
  "Pasien",
  "Teknologi Medis",
  "Vaksinasi",
  "Rawat Inap",
  "Rawat Jalan",
  "Gawat Darurat",
  "Promosi Kesehatan",
];

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function BeritaPage() {
  const [berita, setBerita] = useState<BeritaWithAuthor[]>([]);
  const [filteredBerita, setFilteredBerita] = useState<BeritaWithAuthor[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState<BeritaWithAuthor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeritaStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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
  const fetchKategori = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("kategori")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      setKategoriList(data || []);
    } catch (error) {
      console.error("Error fetching kategori:", error);
      toast.error("Gagal memuat data kategori");
    }
  }, []);

  const fetchBerita = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("berita")
        .select(`
          *,
          author_detail:users!berita_author_fkey(id, nama, username, avatar),
          updated_by_user:users!berita_updated_by_fkey(id, nama, username, avatar)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBerita(data || []);
      setFilteredBerita(data || []);
    } catch (error) {
      console.error("Error fetching berita:", error);
      toast.error("Gagal memuat data berita");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKategori();
    fetchBerita();
  }, [fetchKategori, fetchBerita]);

  /* ── Filter & sort ── */
  useEffect(() => {
    let filtered = [...berita];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.tags.some((tag: string) =>
            tag.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
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

    setFilteredBerita(filtered);
    setCurrentPage(1);
  }, [berita, debouncedSearch, statusFilter, categoryFilter, sortBy]);

  /* ── Pagination ── */
  const paginatedBerita = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBerita.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBerita, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBerita.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Selection ── */
  const handleSelectItem = (id: string) =>
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const handleSelectAll = (checked: boolean) =>
    setSelectedItems(checked ? paginatedBerita.map((item) => item.id) : []);

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedItems) {
        const beritaItem = filteredBerita.find((item) => item.id === id);
        if (beritaItem?.thumbnail) {
          const path = getFilePathFromUrl(beritaItem.thumbnail, "berita");
          if (path) await deleteFile("berita", path);
        }
        const { error } = await supabase.from("berita").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success(`${selectedItems.length} berita berhasil dihapus`);
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      fetchBerita();
    } catch (error) {
      console.error("Error deleting berita:", error);
      toast.error("Gagal menghapus berita");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Slug generator ── */
  const generateSlug = (title: string): string =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  /* ── Dialog helpers ── */
  const handleOpenDialog = (beritaItem?: BeritaWithAuthor) => {
    if (beritaItem) {
      setSelectedBerita(beritaItem);
      setFormData({
        title: beritaItem.title,
        description: beritaItem.description,
        category: beritaItem.category,
        tags: beritaItem.tags || [],
        thumbnail: beritaItem.thumbnail || "",
        status: beritaItem.status,
        thumbnailFile: null,
        thumbnailDeleted: false,
      });
    } else {
      setSelectedBerita(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setTagInput("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedBerita(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
      setTagInput("");
    }, 200);
  };

  const handleOpenDetailDialog = (beritaItem: BeritaWithAuthor) => {
    setSelectedBerita(beritaItem);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => setSelectedBerita(null), 200);
  };

  const handleOpenDeleteDialog = (beritaItem: BeritaWithAuthor) => {
    setSelectedBerita(beritaItem);
    setDeleteDialogOpen(true);
  };

  /* ── Validation ── */
  const validateForm = (): boolean => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.title.trim()) { errors.title = "Judul berita wajib diisi"; isValid = false; }
    if (!formData.description.trim()) { errors.description = "Deskripsi berita wajib diisi"; isValid = false; }
    if (!formData.category.trim()) { errors.category = "Kategori wajib dipilih"; isValid = false; }

    if (formData.thumbnailFile) {
      const validation = validateImage(formData.thumbnailFile);
      if (!validation.valid) { errors.thumbnail = validation.error || "File tidak valid"; isValid = false; }
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
      let thumbnailUrl = formData.thumbnail;

      if (formData.thumbnailDeleted && selectedBerita?.thumbnail) {
        const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, "berita");
        if (oldPath) await deleteFile("berita", oldPath);
        thumbnailUrl = "";
      }

      if (formData.thumbnailFile) {
        if (selectedBerita?.thumbnail) {
          const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, "berita");
          if (oldPath) await deleteFile("berita", oldPath);
        }
        const uploadResult = await uploadFile({
          bucket: "berita",
          folder: "images",
          file: formData.thumbnailFile,
        });
        if (!uploadResult.success) throw new Error(uploadResult.error || "Gagal mengupload gambar");
        thumbnailUrl = uploadResult.url || "";
      }

      const slug = generateSlug(formData.title);

      if (selectedBerita) {
        // ── UPDATE: simpan updated_by ──
        const { error } = await supabase
          .from("berita")
          .update({
            title: formData.title,
            slug,
            description: formData.description,
            category: formData.category,
            tags: formData.tags,
            thumbnail: thumbnailUrl,
            status: formData.status,
            updated_by: currentUserId,        // ← simpan siapa yang update
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedBerita.id);
        if (error) throw error;
        toast.success("Berita berhasil diperbarui");
      } else {
        // ── INSERT: simpan author (created_by) ──
        const { error } = await supabase.from("berita").insert({
          title: formData.title,
          slug,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          thumbnail: thumbnailUrl,
          status: "active",
          author: currentUserId,              // ← created_by
        });
        if (error) throw error;
        toast.success("Berita berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchBerita();
    } catch (error) {
      console.error("Error saving berita:", error);
      toast.error("Gagal menyimpan berita");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selectedBerita) return;
    setSubmitting(true);
    try {
      if (selectedBerita.thumbnail) {
        const path = getFilePathFromUrl(selectedBerita.thumbnail, "berita");
        if (path) await deleteFile("berita", path);
      }
      const { error } = await supabase.from("berita").delete().eq("id", selectedBerita.id);
      if (error) throw error;
      toast.success("Berita berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedBerita(null);
      fetchBerita();
    } catch (error) {
      console.error("Error deleting berita:", error);
      toast.error("Gagal menghapus berita");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Thumbnail change ── */
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) {
      setFormErrors({ ...formErrors, thumbnail: validation.error || "" });
      toast.error(validation.error || "File tidak valid");
      return;
    }
    setFormData({ ...formData, thumbnailFile: file, thumbnailDeleted: false });
    setFormErrors({ ...formErrors, thumbnail: "" });
  };

  /* ── Tag handlers ── */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) =>
    setFormData({ ...formData, tags: formData.tags.filter((tag) => tag !== tagToRemove) });

  const handleSelectSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag))
      setFormData({ ...formData, tags: [...formData.tags, tag] });
  };

  /* ── Badge helper ── */
  const getStatusBadge = (status: BeritaStatus) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    if (!opt) return null;
    return <Badge variant="outline" className={opt.color}>{opt.label}</Badge>;
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
            <BreadcrumbPage>Berita</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Berita</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
              Kelola berita dan artikel
            </p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {selectedItems.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={submitting} className="flex-1 sm:flex-initial min-w-0">
                <Trash2 className="h-4 w-4 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline truncate">Hapus</span>
                <span className="sm:hidden">({selectedItems.length})</span>
                <span className="hidden sm:inline">({selectedItems.length})</span>
              </Button>
            )}
            <Button size="sm" onClick={() => handleOpenDialog()} className="flex-1 sm:flex-initial min-w-0">
              <Plus className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline truncate">Tambah Berita</span>
              <span className="sm:hidden truncate">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {paginatedBerita.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === paginatedBerita.length && paginatedBerita.length > 0}
                onCheckedChange={handleSelectAll} id="select-all"
              />
              <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">All</Label>
            </div>
          )}
          {/* Desktop filters */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Urutan" /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriList.map((k) => <SelectItem key={k.id} value={k.title}>{k.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BeritaStatus | "all")}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari berita..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {kategoriList.map((k) => <SelectItem key={k.id} value={k.title}>{k.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BeritaStatus | "all")}>
              <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari berita..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
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
        ) : filteredBerita.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-16">
              <div className="rounded-full bg-muted p-3 mb-3 sm:mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">Tidak ada berita ditemukan</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" ? "Coba ubah filter pencarian" : "Mulai dengan menambahkan berita baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedBerita.map((item) => (
                <Card key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative"
                  onClick={() => handleOpenDetailDialog(item)}>
                  <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)} className="shadow-md h-5 w-5" />
                  </div>
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} fill
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
                      <div className="flex gap-2 flex-wrap mb-2">
                        {getStatusBadge(item.status)}
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                      <h3 className="font-semibold text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.description}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {item.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{item.tags.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage src={item.author_detail?.avatar} alt={item.author_detail?.nama || "User"} />
                          <AvatarFallback className="text-xs">{item.author_detail?.nama?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">{item.author_detail?.nama}</span>
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
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6">
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(currentPage * itemsPerPage, filteredBerita.length)} dari {filteredBerita.length} data berita
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
                  <div className="text-xs text-muted-foreground text-center">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} –{" "}
                    {Math.min(currentPage * itemsPerPage, filteredBerita.length)} dari {filteredBerita.length}
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`h-9 px-2 text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
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
                          className={`h-9 px-2 text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`} />
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
              {selectedBerita ? "Edit Berita" : "Tambah Berita"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedBerita ? "Perbarui informasi berita" : "Tambahkan berita baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-sm">
                Thumbnail <span className="text-red-500">*</span>
              </Label>
              {(formData.thumbnailFile || (formData.thumbnail && !formData.thumbnailDeleted)) && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={formData.thumbnailFile ? URL.createObjectURL(formData.thumbnailFile) : formData.thumbnail}
                    alt="Preview" fill className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px" unoptimized
                  />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, thumbnailFile: null, thumbnail: "", thumbnailDeleted: true })}
                    disabled={submitting}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!formData.thumbnailFile && (!formData.thumbnail || formData.thumbnailDeleted) && (
                <>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors ${formErrors.thumbnail ? "border-red-500" : ""}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const validation = validateImage(file);
                        if (!validation.valid) { setFormErrors({ ...formErrors, thumbnail: validation.error || "" }); toast.error(validation.error || "File tidak valid"); return; }
                        setFormData({ ...formData, thumbnailFile: file, thumbnailDeleted: false });
                        setFormErrors({ ...formErrors, thumbnail: "" });
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}>
                    <Input id="thumbnail" type="file" accept="image/webp" onChange={handleThumbnailChange} disabled={submitting} className="hidden" />
                    <label htmlFor="thumbnail" className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="rounded-full bg-muted p-3 mb-2"><Upload className="h-6 w-6 text-muted-foreground" /></div>
                      <p className="text-sm font-medium mb-1">Klik untuk upload atau drag & drop</p>
                      <p className="text-xs text-muted-foreground">Format: WebP, Max: 300KB</p>
                    </label>
                  </div>
                  {formErrors.thumbnail && <p className="text-sm text-red-500">{formErrors.thumbnail}</p>}
                </>
              )}
            </div>

            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Judul <span className="text-red-500">*</span></Label>
              <Input id="title" placeholder="Masukkan judul berita" value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (formErrors.title) setFormErrors({ ...formErrors, title: "" }); }}
                disabled={submitting} className={formErrors.title ? "border-red-500" : ""} />
              {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Kategori <span className="text-red-500">*</span></Label>
              <Select value={formData.category}
                onValueChange={(value) => { setFormData({ ...formData, category: value }); if (formErrors.category) setFormErrors({ ...formErrors, category: "" }); }}
                disabled={submitting}>
                <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriList.map((k) => <SelectItem key={k.id} value={k.title}>{k.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Deskripsi <span className="text-red-500">*</span></Label>
              <Textarea id="description" placeholder="Masukkan deskripsi berita"
                className={`min-h-[150px] resize-y ${formErrors.description ? "border-red-500" : ""}`}
                value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (formErrors.description) setFormErrors({ ...formErrors, description: "" }); }}
                disabled={submitting} />
              {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm">Tags</Label>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Pilih tag yang tersedia:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((suggestedTag) => {
                    const isSelected = formData.tags.includes(suggestedTag);
                    return (
                      <Badge key={suggestedTag} variant="secondary"
                        className={`cursor-pointer transition-all ${isSelected ? "opacity-50 cursor-not-allowed bg-muted" : "hover:bg-secondary/80"}`}
                        onClick={() => { if (!isSelected && !submitting) handleSelectSuggestedTag(suggestedTag); }}>
                        {suggestedTag}{isSelected && <span className="ml-1 text-xs">✓</span>}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Atau tambahkan tag manual:</p>
                <div className="flex gap-2">
                  <Input id="tags" placeholder="Ketik tag baru dan tekan Enter" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                    disabled={submitting} />
                </div>
              </div>
              {formData.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Tag yang dipilih:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button type="button" className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                          onClick={() => handleRemoveTag(tag)} disabled={submitting}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status (edit only) */}
            {selectedBerita && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status <span className="text-red-500">*</span></Label>
                <Select value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as BeritaStatus })}
                  disabled={submitting}>
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detail Berita</DialogTitle>
          </DialogHeader>
          {selectedBerita && (
            <div className="space-y-4">
              {/* Thumbnail */}
              {selectedBerita.thumbnail && (
                <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden">
                  <Image src={selectedBerita.thumbnail} alt={selectedBerita.title} fill
                    className="object-cover" sizes="(max-width: 768px) 100vw, 800px" priority unoptimized />
                </div>
              )}

              {/* Judul + Badge + Tags + Audit box — identik dengan jadwal dokter */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{selectedBerita.title}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedBerita.status)}
                  <Badge variant="outline">{selectedBerita.category}</Badge>
                </div>
                {selectedBerita.tags && selectedBerita.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedBerita.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* ── Audit box — persis sama dengan jadwal dokter ── */}
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  {/* Dibuat oleh (author) */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={selectedBerita.author_detail?.avatar} alt={selectedBerita.author_detail?.nama || "User"} />
                      <AvatarFallback className="text-[10px]">
                        {selectedBerita.author_detail?.nama?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Dibuat oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedBerita.author_detail?.nama ?? "-"}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(selectedBerita.created_at)}</span>
                  </div>

                  {/* Diperbarui oleh — hanya tampil jika ada, identik jadwal dokter */}
                  {selectedBerita.updated_by_user && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={selectedBerita.updated_by_user.avatar} alt={selectedBerita.updated_by_user.nama || "User"} />
                        <AvatarFallback className="text-[10px]">
                          {selectedBerita.updated_by_user.nama?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Diperbarui oleh{" "}
                        <span className="font-medium text-foreground">
                          {selectedBerita.updated_by_user.nama}
                        </span>
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatDateTime(selectedBerita.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm sm:text-base">{selectedBerita.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailDialog}>Tutup</Button>
            {selectedBerita && (
              <Button
                onClick={() => {
                  handleCloseDetailDialog();
                  setTimeout(() => handleOpenDialog(selectedBerita), 200);
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
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus berita{" "}
              <strong>{selectedBerita?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white w-full sm:w-auto">
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
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Beberapa Berita?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} berita</strong> yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : `Hapus ${selectedItems.length} Berita`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
}