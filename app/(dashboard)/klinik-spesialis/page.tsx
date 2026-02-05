// app/(dashboard)/layanan-unggulan/page.tsx
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
import IconSelector from "@/components/ui/icon-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { LayananUnggulan } from "@/types/index";
import * as Icons from "lucide-react";
import {
  ArrowUpDown,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SortField = "title" | "urutan" | "created_at";
type SortOrder = "asc" | "desc";

interface FormDataType {
  icon: string;
  title: string;
  description: string;
  urutan: number;
}

interface FormErrorsType {
  icon: string;
  title: string;
  description: string;
  urutan: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  icon: "",
  title: "",
  description: "",
  urutan: 0,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  icon: "",
  title: "",
  description: "",
  urutan: "",
};

export default function LayananUnggulanPage() {
  const [layanan, setLayanan] = useState<LayananUnggulan[]>([]);
  const [filteredLayanan, setFilteredLayanan] = useState<LayananUnggulan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedLayanan, setSelectedLayanan] =
    useState<LayananUnggulan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Access control state
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("urutan");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

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
    let filtered = [...layanan];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.icon.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "title") {
        compareValue = a.title.localeCompare(b.title, "id");
      } else if (sortField === "urutan") {
        compareValue = a.urutan - b.urutan;
      } else if (sortField === "created_at") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareValue = dateA - dateB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredLayanan(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, layanan, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch layanan
  const fetchLayanan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("layanan_unggulan")
        .select("*")
        .order("urutan", { ascending: true });

      if (error) throw error;

      setLayanan(data || []);
    } catch (error) {
      console.error("Error fetching layanan:", error);
      toast.error("Gagal memuat data klinik spesialis");
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);

        // Check user access
        const currentUser = getCurrentUser();
        if (!currentUser) {
          setShowAccessDenied(true);
          return;
        }

        await fetchLayanan();
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Real-time subscription
    const channel = supabase
      .channel("layanan_unggulan_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layanan_unggulan" },
        () => {
          fetchLayanan();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLayanan]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const loadingToast = toast.loading("Memperbarui data...");

    try {
      await fetchLayanan();
      toast.success("Data berhasil diperbarui!", {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Gagal memperbarui data", {
        id: loadingToast,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const getSortLabel = () => {
    if (sortField === "title") {
      return sortOrder === "asc" ? "Judul (A-Z)" : "Judul (Z-A)";
    } else if (sortField === "urutan") {
      return sortOrder === "asc" ? "Urutan (1-9)" : "Urutan (9-1)";
    } else {
      return sortOrder === "asc" ? "Terlama" : "Terbaru";
    }
  };

  const handleResetFilters = () => {
    setSortField("urutan");
    setSortOrder("asc");
    setSearchQuery("");
  };

  const totalItems = filteredLayanan.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + itemsPerPage;
  const currentLayanan = filteredLayanan.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentLayanan.map((l) => l.id));
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
    currentLayanan.length > 0 &&
    currentLayanan.every((l) => selectedIds.has(l.id));

  const isSomeSelected =
    currentLayanan.some((l) => selectedIds.has(l.id)) && !isAllSelected;

  const handleOpenDialog = async (item?: LayananUnggulan) => {
    if (item) {
      setSelectedLayanan(item);
      setFormData({
        icon: item.icon,
        title: item.title,
        description: item.description,
        urutan: item.urutan,
      });
    } else {
      // Get max urutan for new item
      const { data } = await supabase
        .from("layanan_unggulan")
        .select("urutan")
        .order("urutan", { ascending: false })
        .limit(1);

      const nextUrutan = data && data.length > 0 ? data[0].urutan + 1 : 1;

      setSelectedLayanan(null);
      setFormData({ ...DEFAULT_FORM_DATA, urutan: nextUrutan });
    }
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLayanan(null);
    setFormData({ ...DEFAULT_FORM_DATA });
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
  };

  const validateForm = () => {
    const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.icon.trim()) {
      errors.icon = "Icon wajib dipilih";
      isValid = false;
    }

    if (!formData.title.trim()) {
      errors.title = "Judul wajib diisi";
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = "Deskripsi wajib diisi";
      isValid = false;
    }

    if (formData.urutan < 0) {
      errors.urutan = "Urutan harus lebih dari atau sama dengan 0";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const loadingToast = toast.loading(
      selectedLayanan ? "Mengupdate layanan..." : "Menambahkan layanan...",
    );

    try {
      const dataToSubmit = {
        icon: formData.icon,
        title: formData.title,
        description: formData.description,
        urutan: formData.urutan,
      };

      if (selectedLayanan) {
        const { error } = await supabase
          .from("layanan_unggulan")
          .update(dataToSubmit)
          .eq("id", selectedLayanan.id);

        if (error) throw error;

        toast.success("Layanan berhasil diupdate", {
          id: loadingToast,
        });
      } else {
        const { error } = await supabase
          .from("layanan_unggulan")
          .insert([dataToSubmit]);

        if (error) throw error;

        toast.success("Layanan berhasil ditambahkan", {
          id: loadingToast,
        });
      }

      await fetchLayanan();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving layanan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menyimpan data layanan";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLayanan) return;
    setSubmitting(true);

    const loadingToast = toast.loading("Menghapus layanan...");

    try {
      const { error } = await supabase
        .from("layanan_unggulan")
        .delete()
        .eq("id", selectedLayanan.id);

      if (error) throw error;

      toast.success("Layanan berhasil dihapus", {
        id: loadingToast,
      });
      await fetchLayanan();
      setDeleteDialogOpen(false);
      setSelectedLayanan(null);
    } catch (error) {
      console.error("Error deleting layanan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus layanan";
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

    const loadingToast = toast.loading(
      `Menghapus ${selectedIds.size} layanan...`,
    );

    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase
        .from("layanan_unggulan")
        .delete()
        .in("id", idsArray);

      if (error) throw error;

      setSelectedIds(new Set());

      toast.success(`${idsArray.length} layanan berhasil dihapus`, {
        id: loadingToast,
      });
      await fetchLayanan();
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error bulk deleting layanan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus layanan";
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (item: LayananUnggulan) => {
    setSelectedLayanan(item);
    setDeleteDialogOpen(true);
  };

  // Sort options
  const sortOptions = [
    { value: "urutan-asc", label: "Urutan (1-9)" },
    { value: "urutan-desc", label: "Urutan (9-1)" },
    { value: "title-asc", label: "Judul (A-Z)" },
    { value: "title-desc", label: "Judul (Z-A)" },
    { value: "created_at-desc", label: "Terbaru" },
    { value: "created_at-asc", label: "Terlama" },
  ];

  const showReset =
    sortField !== "urutan" || sortOrder !== "asc" || searchQuery !== "";

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
            <BreadcrumbPage>Klinik Spesialis</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Klinik Spesialis
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola klinik spesialis untuk ditampilkan di website
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
            Tambah Klinik Spesialis
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Title and Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Layanan ({totalItems})</CardTitle>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari judul, deskripsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="shrink-0"
                  title="Perbarui data table"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-3">
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
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="max-w-md">Deskripsi</TableHead>
                  <TableHead className="w-24">Urutan</TableHead>
                  <TableHead className="w-[180px]">Dibuat</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLayanan.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data klinik spesialis"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLayanan.map((item, index) => {
                    const IconComponent = Icons[
                      item.icon as keyof typeof Icons
                    ] as React.ElementType;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(item.id, checked as boolean)
                            }
                            aria-label={`Select ${item.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="p-2 bg-primary/10 rounded-lg inline-flex">
                            {IconComponent && (
                              <IconComponent className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.urutan}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.created_at
                            ? formatDateTime(item.created_at)
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
                                    onClick={() => handleOpenDialog(item)}
                                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white hover:text-white"
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
                                    onClick={() => handleOpenDeleteDialog(item)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLayanan ? "Edit Layanan" : "Tambah Klinik Spesialis"}
            </DialogTitle>
            <DialogDescription>
              {selectedLayanan
                ? "Update informasi klinik spesialis"
                : "Tambah klinik spesialis baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Icon Selector */}
              <IconSelector
                value={formData.icon}
                onChange={(iconName) => {
                  setFormData({ ...formData, icon: iconName });
                  if (formErrors.icon) {
                    setFormErrors({ ...formErrors, icon: "" });
                  }
                }}
                error={formErrors.icon}
                disabled={submitting}
              />

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul <span className="text-red-500">*</span>
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
                  placeholder="Masukkan judul layanan"
                  disabled={submitting}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
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
                  placeholder="Masukkan deskripsi layanan"
                  disabled={submitting}
                  className={formErrors.description ? "border-red-500" : ""}
                  rows={4}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Urutan */}
              <div className="space-y-2">
                <Label htmlFor="urutan">
                  Urutan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="urutan"
                  type="number"
                  min="0"
                  value={formData.urutan}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      urutan: parseInt(e.target.value) || 0,
                    });
                    if (formErrors.urutan) {
                      setFormErrors({ ...formErrors, urutan: "" });
                    }
                  }}
                  placeholder="Masukkan urutan tampilan"
                  disabled={submitting}
                  className={formErrors.urutan ? "border-red-500" : ""}
                />
                {formErrors.urutan && (
                  <p className="text-sm text-red-500">{formErrors.urutan}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Urutan menentukan posisi tampilan (semakin kecil angka,
                  semakin awal ditampilkan)
                </p>
              </div>
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
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus layanan{" "}
              <strong>{selectedLayanan?.title}</strong>? Tindakan ini tidak
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedIds.size} Layanan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} layanan yang
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

      {/* Access Denied Dialog */}
      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
