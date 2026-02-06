// app/(dashboard)/kamar-inap/page.tsx
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
import { supabase } from "@/lib/supabase/client";
import { deleteFile, getFilePathFromUrl, uploadFile } from "@/lib/upload";
import { formatDateTime } from "@/lib/utils";
import { validateImage } from "@/lib/validasi/validasiImage";
import {
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

interface KamarInap {
  id: string;
  title: string;
  description: string;
  price: number;
  facilities: string[];
  is_recommended: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface FormDataType {
  title: string;
  description: string;
  price: string;
  facilities: string[];
  is_recommended: boolean;
  image: string;
  imageFile: File | null;
  imageDeleted: boolean;
}

interface FormErrorsType {
  title: string;
  description: string;
  price: string;
  image: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  price: "",
  facilities: [],
  is_recommended: false,
  image: "",
  imageFile: null,
  imageDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  title: "",
  description: "",
  price: "",
  image: "",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
] as const;

const SUGGESTED_FACILITIES = [
  "AC",
  "TV",
  "WiFi",
  "Kamar Mandi Dalam",
  "Air Panas",
  "Kulkas",
  "Telepon",
  "Lemari",
  "Meja Kerja",
  "Sofa",
  "Tempat Tidur 1 Orang",
  "Tempat Tidur 2 Orang",
  "Kamar VIP",
  "Nurse Call",
  "Oksigen",
];

export default function KamarInapPage() {
  const [kamarInap, setKamarInap] = useState<KamarInap[]>([]);
  const [filteredKamarInap, setFilteredKamarInap] = useState<KamarInap[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedKamarInap, setSelectedKamarInap] = useState<KamarInap | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recommendedFilter, setRecommendedFilter] = useState<
    "all" | "recommended"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">(
    "newest",
  );

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [facilityInput, setFacilityInput] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchKamarInap = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("kamar_inap")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setKamarInap(data || []);
      setFilteredKamarInap(data || []);
    } catch (error) {
      console.error("Error fetching kamar inap:", error);
      toast.error("Gagal memuat data kamar inap");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKamarInap();
  }, [fetchKamarInap]);

  useEffect(() => {
    let filtered = [...kamarInap];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.description
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          item.facilities.some((facility: string) =>
            facility.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
      );
    }

    if (recommendedFilter === "recommended") {
      filtered = filtered.filter((item) => item.is_recommended);
    }

    // Apply sorting
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
          return a.title.localeCompare(b.title, "id");
        case "z-a":
          return b.title.localeCompare(a.title, "id");
        default:
          return 0;
      }
    });

    setFilteredKamarInap(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [kamarInap, debouncedSearch, recommendedFilter, sortBy]);

  // Pagination calculations
  const paginatedKamarInap = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredKamarInap.slice(startIndex, endIndex);
  }, [filteredKamarInap, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredKamarInap.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedKamarInap.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setSubmitting(true);

    try {
      for (const id of selectedItems) {
        const kamarItem = filteredKamarInap.find((item) => item.id === id);
        if (kamarItem?.image) {
          const path = getFilePathFromUrl(kamarItem.image, "kamar-inap");
          if (path) {
            await deleteFile("kamar-inap", path);
          }
        }

        const { error } = await supabase
          .from("kamar_inap")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      toast.success(`${selectedItems.length} kamar inap berhasil dihapus`);
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      fetchKamarInap();
    } catch (error) {
      console.error("Error deleting kamar inap:", error);
      toast.error("Gagal menghapus kamar inap");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDialog = (kamarItem?: KamarInap) => {
    if (kamarItem) {
      setSelectedKamarInap(kamarItem);
      setFormData({
        title: kamarItem.title,
        description: kamarItem.description,
        price: kamarItem.price.toString(),
        facilities: kamarItem.facilities || [],
        is_recommended: kamarItem.is_recommended,
        image: kamarItem.image || "",
        imageFile: null,
        imageDeleted: false,
      });
    } else {
      setSelectedKamarInap(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setFacilityInput("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedKamarInap(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
      setFacilityInput("");
    }, 200);
  };

  const handleOpenDetailDialog = (kamarItem: KamarInap) => {
    setSelectedKamarInap(kamarItem);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => {
      setSelectedKamarInap(null);
    }, 200);
  };

  const handleOpenDeleteDialog = (kamarItem: KamarInap) => {
    setSelectedKamarInap(kamarItem);
    setDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = "Nama kamar wajib diisi";
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = "Deskripsi kamar wajib diisi";
      isValid = false;
    }

    if (!formData.price.trim()) {
      errors.price = "Harga wajib diisi";
      isValid = false;
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = "Harga harus berupa angka yang valid";
      isValid = false;
    }

    if (formData.imageFile) {
      const validation = validateImage(formData.imageFile);
      if (!validation.valid) {
        errors.image = validation.error || "File tidak valid";
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
      let imageUrl = formData.image;

      if (formData.imageDeleted && selectedKamarInap?.image) {
        const oldPath = getFilePathFromUrl(
          selectedKamarInap.image,
          "kamar-inap",
        );
        if (oldPath) {
          await deleteFile("kamar-inap", oldPath);
        }
        imageUrl = "";
      }

      if (formData.imageFile) {
        if (selectedKamarInap?.image) {
          const oldPath = getFilePathFromUrl(
            selectedKamarInap.image,
            "kamar-inap",
          );
          if (oldPath) {
            await deleteFile("kamar-inap", oldPath);
          }
        }

        const uploadResult = await uploadFile({
          bucket: "kamar-inap",
          folder: "images",
          file: formData.imageFile,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Gagal mengupload gambar");
        }

        imageUrl = uploadResult.url || "";
      }

      if (selectedKamarInap) {
        const { error } = await supabase
          .from("kamar_inap")
          .update({
            title: formData.title,
            description: formData.description,
            price: Number(formData.price),
            facilities: formData.facilities,
            is_recommended: formData.is_recommended,
            image: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedKamarInap.id);

        if (error) throw error;

        toast.success("Kamar inap berhasil diperbarui");
      } else {
        const { error } = await supabase.from("kamar_inap").insert({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          facilities: formData.facilities,
          is_recommended: formData.is_recommended,
          image: imageUrl,
        });

        if (error) throw error;

        toast.success("Kamar inap berhasil ditambahkan");
      }

      handleCloseDialog();
      fetchKamarInap();
    } catch (error) {
      console.error("Error saving kamar inap:", error);
      toast.error("Gagal menyimpan kamar inap");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKamarInap) return;

    setSubmitting(true);

    try {
      if (selectedKamarInap.image) {
        const path = getFilePathFromUrl(selectedKamarInap.image, "kamar-inap");
        if (path) {
          await deleteFile("kamar-inap", path);
        }
      }

      const { error } = await supabase
        .from("kamar_inap")
        .delete()
        .eq("id", selectedKamarInap.id);

      if (error) throw error;

      toast.success("Kamar inap berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedKamarInap(null);
      fetchKamarInap();
    } catch (error) {
      console.error("Error deleting kamar inap:", error);
      toast.error("Gagal menghapus kamar inap");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setFormErrors({ ...formErrors, image: validation.error || "" });
      toast.error(validation.error || "File tidak valid");
      return;
    }

    setFormData({
      ...formData,
      imageFile: file,
      imageDeleted: false,
    });
    setFormErrors({ ...formErrors, image: "" });
  };

  const handleAddFacility = () => {
    const trimmedFacility = facilityInput.trim();
    if (trimmedFacility && !formData.facilities.includes(trimmedFacility)) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, trimmedFacility],
      });
      setFacilityInput("");
    }
  };

  const handleRemoveFacility = (facilityToRemove: string) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter(
        (facility) => facility !== facilityToRemove,
      ),
    });
  };

  const handleSelectSuggestedFacility = (facility: string) => {
    if (!formData.facilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facility],
      });
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
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
            <BreadcrumbPage>Kamar Inap</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Kamar Inap
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
              Kelola data kamar inap
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
              <span className="hidden sm:inline truncate">
                Tambah Kamar Inap
              </span>
              <span className="sm:hidden truncate">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="space-y-3">
        {/* Row 1: Select All & Items Per Page (Mobile) / Full Controls (Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Select All - Left side */}
          {paginatedKamarInap.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedItems.length === paginatedKamarInap.length &&
                  paginatedKamarInap.length > 0
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

          {/* Desktop: All filters in one row */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            {/* Sort Filter */}
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

            {/* Recommended Filter */}
            <Select
              value={recommendedFilter}
              onValueChange={(value) =>
                setRecommendedFilter(value as "all" | "recommended")
              }
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kamar</SelectItem>
                <SelectItem value="recommended">Rekomendasi</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kamar inap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>

        {/* Mobile: Filters in separate rows */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex gap-2">
            {/* Sort Filter */}
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

            {/* Recommended Filter */}
            <Select
              value={recommendedFilter}
              onValueChange={(value) =>
                setRecommendedFilter(value as "all" | "recommended")
              }
            >
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="recommended">Rekomendasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search - Full Width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kamar inap..."
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
          <div
            className="grid grid-cols-1 gap-4
sm:grid-cols-1
md:grid-cols-2
lg:grid-cols-3
xl:grid-cols-4
"
          >
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredKamarInap.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-16">
              <div className="rounded-full bg-muted p-3 mb-3 sm:mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                Tidak ada kamar inap ditemukan
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery || recommendedFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Mulai dengan menambahkan kamar inap baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-4
sm:grid-cols-1
md:grid-cols-2
lg:grid-cols-3
xl:grid-cols-4
"
            >
              {paginatedKamarInap.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative"
                  onClick={() => handleOpenDetailDialog(item)}
                >
                  {/* Checkbox - Top Left - ALWAYS VISIBLE */}
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                      className="bg-white dark:bg-gray-800 shadow-md h-5 w-5"
                    />
                  </div>

                  {/* Image */}
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Eye className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {item.is_recommended && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                          >
                            Rekomendasi
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {formatPrice(Number(item.price))}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base lg:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {item.description}
                      </p>
                      {item.facilities && item.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.facilities
                            .slice(0, 2)
                            .map((facility: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {facility}
                              </Badge>
                            ))}
                          {item.facilities.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.facilities.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      {/* Date info */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground">
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

                      {/* Action Buttons - ALWAYS VISIBLE */}
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
                {/* Desktop: Info Text (kiri) + Pagination (kanan) dalam satu baris */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  {/* Info Text - Kiri */}
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredKamarInap.length,
                    )}{" "}
                    dari {filteredKamarInap.length} data kamar inap
                  </div>

                  {/* Spacer untuk mendorong pagination ke kanan */}
                  <div className="flex-1"></div>

                  {/* Pagination - Kanan */}
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

                {/* Mobile: Vertical Layout */}
                <div className="flex sm:hidden flex-col gap-3">
                  {/* Info Text */}
                  <div className="text-sm text-muted-foreground text-center">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredKamarInap.length,
                    )}{" "}
                    dari {filteredKamarInap.length}
                  </div>

                  {/* Pagination */}
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={`h-9 text-sm ${
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
                              className="cursor-pointer h-9 w-9"
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
                          className={`h-9 text-sm ${
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedKamarInap ? "Edit Kamar Inap" : "Tambah Kamar Inap"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedKamarInap
                ? "Perbarui informasi kamar inap"
                : "Tambahkan kamar inap baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                Nama Kamar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Masukkan nama kamar"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: "" });
                  }
                }}
                disabled={submitting}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm">
                Harga (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="Masukkan harga kamar"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) {
                    setFormErrors({ ...formErrors, price: "" });
                  }
                }}
                disabled={submitting}
                className={formErrors.price ? "border-red-500" : ""}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500">{formErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Masukkan deskripsi kamar"
                className={`min-h-[150px] resize-y ${
                  formErrors.description ? "border-red-500" : ""
                }`}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: "" });
                  }
                }}
                disabled={submitting}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities" className="text-sm">
                Fasilitas
              </Label>

              {/* Suggested Facilities */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Pilih fasilitas yang tersedia:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_FACILITIES.map((suggestedFacility) => {
                    const isSelected =
                      formData.facilities.includes(suggestedFacility);
                    return (
                      <Badge
                        key={suggestedFacility}
                        variant="secondary"
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "opacity-50 cursor-not-allowed bg-muted"
                            : "hover:bg-secondary/80"
                        }`}
                        onClick={() => {
                          if (!isSelected && !submitting) {
                            handleSelectSuggestedFacility(suggestedFacility);
                          }
                        }}
                      >
                        {suggestedFacility}
                        {isSelected && <span className="ml-1 text-xs">✓</span>}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Manual Facility Input */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Atau tambahkan fasilitas manual:
                </p>
                <div className="flex gap-2">
                  <Input
                    id="facilities"
                    placeholder="Ketik fasilitas baru dan tekan Enter"
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFacility();
                      }
                    }}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Selected Facilities Display */}
              {formData.facilities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Fasilitas yang dipilih:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.facilities.map((facility, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {facility}
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                          onClick={() => handleRemoveFacility(facility)}
                          disabled={submitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recommended"
                  checked={formData.is_recommended}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_recommended: checked as boolean,
                    })
                  }
                  disabled={submitting}
                />
                <Label
                  htmlFor="is_recommended"
                  className="text-sm font-normal cursor-pointer"
                >
                  Tandai sebagai kamar rekomendasi
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm">
                Gambar <span className="text-red-500">*</span>
              </Label>
              {(formData.imageFile ||
                (formData.image && !formData.imageDeleted)) && (
                <>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                      src={
                        formData.imageFile
                          ? URL.createObjectURL(formData.imageFile)
                          : formData.image
                      }
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 600px"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          imageFile: null,
                          image: "",
                          imageDeleted: true,
                        })
                      }
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
              {!formData.imageFile &&
                (!formData.image || formData.imageDeleted) && (
                  <>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors ${
                        formErrors.image ? "border-red-500" : ""
                      }`}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          const validation = validateImage(file);
                          if (!validation.valid) {
                            setFormErrors({
                              ...formErrors,
                              image: validation.error || "",
                            });
                            toast.error(validation.error || "File tidak valid");
                            return;
                          }
                          setFormData({
                            ...formData,
                            imageFile: file,
                            imageDeleted: false,
                          });
                          setFormErrors({ ...formErrors, image: "" });
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <Input
                        id="image"
                        type="file"
                        accept="image/webp"
                        onChange={handleImageChange}
                        disabled={submitting}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
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
                    {formErrors.image && (
                      <p className="text-sm text-red-500">{formErrors.image}</p>
                    )}
                  </>
                )}
            </div>

            {selectedKamarInap && (
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <p className="text-xs text-muted-foreground">
                  Terakhir diperbarui:{" "}
                  {formatDateTime(selectedKamarInap.updated_at)}
                </p>
              </div>
            )}

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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Detail Kamar Inap
            </DialogTitle>
          </DialogHeader>
          {selectedKamarInap && (
            <div className="space-y-3 sm:space-y-4">
              {selectedKamarInap.image && (
                <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedKamarInap.image}
                    alt={selectedKamarInap.title}
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
                  {selectedKamarInap.title}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedKamarInap.is_recommended && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                    >
                      Rekomendasi
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {formatPrice(Number(selectedKamarInap.price))}
                  </Badge>
                </div>
                {selectedKamarInap.facilities &&
                  selectedKamarInap.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedKamarInap.facilities.map(
                        (facility: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {facility}
                          </Badge>
                        ),
                      )}
                    </div>
                  )}
                <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                  <span>
                    Ditambahkan pada{" "}
                    {formatDateTime(selectedKamarInap.created_at)}
                  </span>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm sm:text-base">
                  {selectedKamarInap.description}
                </p>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Kamar Inap?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus kamar inap{" "}
              <strong>{selectedKamarInap?.title}</strong>? Tindakan ini tidak
              dapat dibatalkan.
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

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Beberapa Kamar Inap?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} kamar inap</strong> yang dipilih?
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
                : `Hapus ${selectedItems.length} Kamar Inap`}
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
