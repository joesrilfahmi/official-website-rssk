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
import { Skeleton } from "@/components/ui/skeleton";
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
import { KamarInap } from "@/types/index";
import {
  Calendar,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  facilities: string;
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
  facilities: "",
  image: "",
};

const COMMON_FACILITIES = [
  "AC",
  "TV",
  "Kamar Mandi Dalam",
  "Wi-Fi",
  "Tempat Tidur Elektrik",
  "Lemari Es",
  "Telepon",
  "Meja dan Kursi",
  "Sofa",
  "Kulkas",
  "Ruang Tamu",
  "Pantry",
];

export default function KamarInapPage() {
  const [kamarInap, setKamarInap] = useState<KamarInap[]>([]);
  const [filteredKamarInap, setFilteredKamarInap] = useState<KamarInap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedKamarInap, setSelectedKamarInap] = useState<KamarInap | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
  const [facilityInput, setFacilityInput] = useState("");

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
          item.facilities?.some((facility) =>
            facility.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
      );
    }

    setFilteredKamarInap(filtered);
  }, [kamarInap, debouncedSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchKamarInap();
    setRefreshing(false);
    toast.success("Data berhasil diperbarui");
  };

  const handleOpenDialog = (kamarInap?: KamarInap) => {
    if (kamarInap) {
      setSelectedKamarInap(kamarInap);
      setFormData({
        title: kamarInap.title,
        description: kamarInap.description,
        price: kamarInap.price.toString(),
        facilities: kamarInap.facilities || [],
        is_recommended: kamarInap.is_recommended,
        image: kamarInap.image || "",
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

  const handleOpenDetailDialog = (kamarInap: KamarInap) => {
    setSelectedKamarInap(kamarInap);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => {
      setSelectedKamarInap(null);
    }, 200);
  };

  const handleOpenDeleteDialog = (kamarInap: KamarInap) => {
    setSelectedKamarInap(kamarInap);
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
      errors.description = "Deskripsi wajib diisi";
      isValid = false;
    }

    if (!formData.price.trim()) {
      errors.price = "Harga wajib diisi";
      isValid = false;
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = "Harga harus berupa angka positif";
      isValid = false;
    }

    if (formData.facilities.length === 0) {
      errors.facilities = "Minimal 1 fasilitas harus ditambahkan";
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

  const handleAddFacility = () => {
    const trimmedFacility = facilityInput.trim();
    if (trimmedFacility && !formData.facilities.includes(trimmedFacility)) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, trimmedFacility],
      });
      setFacilityInput("");
      if (formErrors.facilities) {
        setFormErrors({ ...formErrors, facilities: "" });
      }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setFormErrors({
          ...formErrors,
          image: validation.error || "File tidak valid",
        });
        e.target.value = "";
        return;
      }

      setFormData({
        ...formData,
        imageFile: file,
        imageDeleted: false,
      });
      setFormErrors({ ...formErrors, image: "" });
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: "",
      imageFile: null,
      imageDeleted: true,
    });
  };

  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kamar Inap</h1>
          <p className="text-muted-foreground">
            Kelola informasi kamar rawat inap
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kamar Inap
        </Button>
      </div>

      <div>
        <div className="flex justify-end pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kamar inap..."
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        ) : filteredKamarInap.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-semibold text-muted-foreground">
              Tidak ada kamar inap ditemukan
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Coba ubah filter pencarian"
                : "Mulai dengan menambahkan kamar inap baru"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredKamarInap.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                onClick={() => handleOpenDetailDialog(item)}
              >
                <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                  {item.is_recommended && (
                    <Badge className="absolute top-2 left-2 z-10 bg-amber-500 hover:bg-amber-600">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Rekomendasi
                    </Badge>
                  )}
                  {item.image ? (
                    <Image
                      src={item.image}
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
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatRupiah(item.price)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /hari
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.facilities.slice(0, 3).map((facility, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {facility}
                        </Badge>
                      ))}
                      {item.facilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.facilities.length - 3} lainnya
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedKamarInap ? "Edit Kamar Inap" : "Tambah Kamar Inap Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedKamarInap
                ? "Perbarui informasi kamar inap"
                : "Isi form di bawah untuk menambahkan kamar inap baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Nama Kamar <span className="text-red-500">*</span>
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
                placeholder="Masukkan nama kamar"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Harga (per hari) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) {
                    setFormErrors({ ...formErrors, price: "" });
                  }
                }}
                disabled={submitting}
                placeholder="Masukkan harga"
                className={formErrors.price ? "border-red-500" : ""}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500">{formErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Deskripsi <span className="text-red-500">*</span>
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
                placeholder="Masukkan deskripsi kamar"
                className={`w-full min-h-[120px] p-3 rounded-md border ${
                  formErrors.description ? "border-red-500" : "border-input"
                } bg-background resize-y`}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Fasilitas <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFacility();
                    }
                  }}
                  placeholder="Tambah fasilitas"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFacility}
                  disabled={submitting}
                >
                  Tambah
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_FACILITIES.map((facility) => {
                  const isSelected = formData.facilities.includes(facility);
                  return (
                    <Badge
                      key={facility}
                      variant={isSelected ? "default" : "outline"}
                      className={
                        isSelected
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      }
                      onClick={() => {
                        if (!isSelected) {
                          setFormData({
                            ...formData,
                            facilities: [...formData.facilities, facility],
                          });
                          if (formErrors.facilities) {
                            setFormErrors({ ...formErrors, facilities: "" });
                          }
                        }
                      }}
                    >
                      {facility}
                    </Badge>
                  );
                })}
              </div>
              {formData.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 ">
                  {formData.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="default">
                      {facility}
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(facility)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {formErrors.facilities && (
                <p className="text-sm text-red-500">{formErrors.facilities}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Gambar Kamar</Label>
              <Input
                id="image"
                type="file"
                accept="image/webp"
                onChange={handleImageChange}
                disabled={submitting}
                className={formErrors.image ? "border-red-500" : ""}
              />
              {formErrors.image && (
                <p className="text-sm text-red-500">{formErrors.image}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: WebP, Max: 300KB
              </p>

              {(formData.image || formData.imageFile) &&
                !formData.imageDeleted && (
                  <div className="relative w-full h-48 mt-2 rounded-md overflow-hidden border">
                    <Image
                      src={
                        formData.imageFile
                          ? URL.createObjectURL(formData.imageFile)
                          : formData.image
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
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
            </div>

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
              <Label htmlFor="is_recommended" className="cursor-pointer">
                Tandai sebagai Rekomendasi
              </Label>
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Kamar Inap</DialogTitle>
          </DialogHeader>
          {selectedKamarInap && (
            <div className="space-y-4">
              {selectedKamarInap.image && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
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
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedKamarInap.title}
                    </h2>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {formatRupiah(selectedKamarInap.price)}
                      <span className="text-base text-muted-foreground font-normal">
                        /hari
                      </span>
                    </p>
                  </div>
                  {selectedKamarInap.is_recommended && (
                    <Badge className="bg-amber-500 hover:bg-amber-600">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Rekomendasi
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-3 whitespace-pre-wrap">
                  {selectedKamarInap.description}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fasilitas:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedKamarInap.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="secondary">
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Dibuat: {formatDateTime(selectedKamarInap.created_at)}</p>
                <p>
                  Diperbarui: {formatDateTime(selectedKamarInap.updated_at)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kamar Inap?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kamar inap{" "}
              <strong>{selectedKamarInap?.title}</strong>? Tindakan ini tidak
              dapat dibatalkan.
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
