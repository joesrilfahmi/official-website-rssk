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
import { BeritaStatus, BeritaWithAuthor } from "@/types/index";
import {
  Calendar,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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
  tags: string;
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
  tags: "",
  thumbnail: "",
};

const STATUS_OPTIONS: { value: BeritaStatus; label: string; color: string }[] =
  [
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
    {
      value: "draft",
      label: "Draft",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700",
    },
  ];

const CATEGORY_OPTIONS = [
  "Berita",
  "Pengumuman",
  "Artikel",
  "Teknologi",
  "Kesehatan",
  "Pendidikan",
  "Olahraga",
  "Hiburan",
  "Lainnya",
];

const COMMON_TAGS = [
  "Rumah Sakit",
  "Kesehatan",
  "Pelayanan",
  "Fasilitas",
  "Dokter",
  "Pasien",
  "Medis",
  "Pengobatan",
  "Konsultasi",
  "Emergency",
  "IGD",
  "Rawat Inap",
  "Rawat Jalan",
  "Laboratorium",
  "Radiologi",
  "Apotek",
];

export default function BeritaPage() {
  const [berita, setBerita] = useState<BeritaWithAuthor[]>([]);
  const [filteredBerita, setFilteredBerita] = useState<BeritaWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState<BeritaWithAuthor | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeritaStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [tagInput, setTagInput] = useState("");

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

  const fetchBerita = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("berita")
        .select(
          `
                    *,
                    author_detail:users!berita_author_fkey(
                        id,
                        nama,
                        username,
                        avatar
                    )
                `,
        )
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
    fetchBerita();
  }, [fetchBerita]);

  useEffect(() => {
    let filtered = [...berita];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.description
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          item.tags?.some((tag) =>
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

    setFilteredBerita(filtered);
  }, [berita, debouncedSearch, statusFilter, categoryFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBerita();
    setRefreshing(false);
    toast.success("Data berhasil diperbarui");
  };

  const handleOpenDialog = (berita?: BeritaWithAuthor) => {
    if (berita) {
      setSelectedBerita(berita);
      setFormData({
        title: berita.title,
        description: berita.description,
        category: berita.category,
        tags: berita.tags || [],
        thumbnail: berita.thumbnail || "",
        status: berita.status,
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

  const handleOpenDetailDialog = (berita: BeritaWithAuthor) => {
    setSelectedBerita(berita);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => {
      setSelectedBerita(null);
    }, 200);
  };

  const handleOpenDeleteDialog = (berita: BeritaWithAuthor) => {
    setSelectedBerita(berita);
    setDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = "Judul berita wajib diisi";
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = "Konten berita wajib diisi";
      isValid = false;
    }

    if (!formData.category.trim()) {
      errors.category = "Kategori wajib dipilih";
      isValid = false;
    }

    if (formData.thumbnailFile) {
      const validation = validateImage(formData.thumbnailFile);
      if (!validation.valid) {
        errors.thumbnail = validation.error || "File tidak valid";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);

    try {
      let thumbnailUrl = formData.thumbnail;

      if (formData.thumbnailDeleted && selectedBerita?.thumbnail) {
        const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, "berita");
        if (oldPath) {
          await deleteFile("berita", oldPath);
        }
        thumbnailUrl = "";
      }

      if (formData.thumbnailFile) {
        if (selectedBerita?.thumbnail) {
          const oldPath = getFilePathFromUrl(
            selectedBerita.thumbnail,
            "berita",
          );
          if (oldPath) {
            await deleteFile("berita", oldPath);
          }
        }

        const uploadResult = await uploadFile({
          bucket: "berita",
          folder: "images",
          file: formData.thumbnailFile,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Gagal mengupload thumbnail");
        }

        thumbnailUrl = uploadResult.url || "";
      }

      const slug = generateSlug(formData.title);

      if (selectedBerita) {
        const { error } = await supabase
          .from("berita")
          .update({
            title: formData.title,
            slug: slug,
            description: formData.description,
            category: formData.category,
            tags: formData.tags,
            thumbnail: thumbnailUrl,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedBerita.id);

        if (error) throw error;

        toast.success("Berita berhasil diperbarui");
      } else {
        const { error } = await supabase.from("berita").insert({
          title: formData.title,
          slug: slug,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          thumbnail: thumbnailUrl,
          status: "draft",
          author: currentUserId,
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

  const handleDelete = async () => {
    if (!selectedBerita) return;

    setSubmitting(true);

    try {
      if (selectedBerita.thumbnail) {
        const path = getFilePathFromUrl(selectedBerita.thumbnail, "berita");
        if (path) {
          await deleteFile("berita", path);
        }
      }

      const { error } = await supabase
        .from("berita")
        .delete()
        .eq("id", selectedBerita.id);

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

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setFormErrors({
          ...formErrors,
          thumbnail: validation.error || "File tidak valid",
        });
        e.target.value = "";
        return;
      }

      setFormData({
        ...formData,
        thumbnailFile: file,
        thumbnailDeleted: false,
      });
      setFormErrors({ ...formErrors, thumbnail: "" });
    }
  };

  const handleRemoveThumbnail = () => {
    setFormData({
      ...formData,
      thumbnail: "",
      thumbnailFile: null,
      thumbnailDeleted: true,
    });
  };

  const getStatusBadge = (status: BeritaStatus) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return (
      <Badge variant="outline" className={statusOption?.color}>
        {statusOption?.label}
      </Badge>
    );
  };

  const categories = Array.from(new Set(berita.map((item) => item.category)));

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Berita</h1>
          <p className="text-muted-foreground">
            Kelola berita dan artikel rumah sakit
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Berita
        </Button>
      </div>

      <div>
        <div className="flex justify-end pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Status */}
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as BeritaStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-40">
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

            {/* Kategori */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={refreshing}
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
        </div>
      </div>

      <div>
        {loading ? (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
"
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBerita.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-semibold text-muted-foreground">
              Tidak ada berita ditemukan
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Coba ubah filter pencarian"
                : "Mulai dengan menambahkan berita baru"}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
"
          >
            {filteredBerita.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                onClick={() => handleOpenDetailDialog(item)}
              >
                <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Eye className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {item.description
                        .replace(/[#*`_~\[\]]/g, "")
                        .substring(0, 100)}
                      ...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={item.author_detail?.avatar}
                        alt={item.author_detail?.nama || "User"}
                      />
                      <AvatarFallback className="text-xs">
                        {item.author_detail?.nama?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{item.author_detail?.nama}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(item);
                      }}
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteDialog(item);
                      }}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBerita ? "Edit Berita" : "Tambah Berita Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedBerita
                ? "Perbarui informasi berita"
                : "Isi form di bawah untuk menambahkan berita baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Berita <span className="text-red-500">*</span>
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
                placeholder="Masukkan judul berita"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value });
                  if (formErrors.category) {
                    setFormErrors({ ...formErrors, category: "" });
                  }
                }}
                disabled={submitting}
              >
                <SelectTrigger
                  className={formErrors.category ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.category && (
                <p className="text-sm text-red-500">{formErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Tambah tag"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={submitting}
                >
                  Tambah
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      if (!formData.tags.includes(tag)) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, tag],
                        });
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted rounded-md">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/webp"
                onChange={handleThumbnailChange}
                disabled={submitting}
                className={formErrors.thumbnail ? "border-red-500" : ""}
              />
              {formErrors.thumbnail && (
                <p className="text-sm text-red-500">{formErrors.thumbnail}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: WebP, Max: 300KB
              </p>

              {(formData.thumbnail || formData.thumbnailFile) &&
                !formData.thumbnailDeleted && (
                  <div className="relative w-full h-48 mt-2 rounded-md overflow-hidden border">
                    <Image
                      src={
                        formData.thumbnailFile
                          ? URL.createObjectURL(formData.thumbnailFile)
                          : formData.thumbnail
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
                      className="absolute top-2 right-2"
                      onClick={handleRemoveThumbnail}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Konten Berita <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: "" });
                  }
                }}
                disabled={submitting}
                placeholder="Tulis konten berita dalam format Markdown..."
                className={`w-full min-h-[400px] p-3 rounded-md border ${
                  formErrors.description ? "border-red-500" : "border-input"
                } bg-background resize-y font-mono text-sm`}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Gunakan format Markdown untuk styling teks
              </p>
            </div>

            {selectedBerita && (
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    setFormData({ ...formData, status: value as BeritaStatus });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger>
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Berita</DialogTitle>
          </DialogHeader>
          {selectedBerita && (
            <div className="space-y-4">
              {selectedBerita.thumbnail && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedBerita.thumbnail}
                    alt={selectedBerita.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    priority
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{selectedBerita.title}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{selectedBerita.category}</Badge>
                  {getStatusBadge(selectedBerita.status)}
                  {selectedBerita.tags && selectedBerita.tags.length > 0 && (
                    <>
                      {selectedBerita.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedBerita.author_detail?.avatar}
                      alt={selectedBerita.author_detail?.nama || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {selectedBerita.author_detail?.nama
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Oleh {selectedBerita.author_detail?.nama} •{" "}
                    {formatDateTime(selectedBerita.created_at)}
                  </span>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{selectedBerita.description}</ReactMarkdown>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailDialog}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus berita{" "}
              <strong>{selectedBerita?.title}</strong>? Tindakan ini tidak dapat
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

      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
