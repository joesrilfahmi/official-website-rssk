// app/(dashboard)/penjamin/page.tsx
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowUpDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SortField = "nama" | "created_at";
type SortOrder = "asc" | "desc";

interface Penjamin {
  id: string;
  nama: string;
  created_at: string;
  updated_at: string;
}

interface FormDataType {
  nama: string;
}

interface FormErrorsType {
  nama: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  nama: "",
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  nama: "",
};

export default function PenjaminPage() {
  const [penjamin, setPenjamin] = useState<Penjamin[]>([]);
  const [filteredPenjamin, setFilteredPenjamin] = useState<Penjamin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedPenjamin, setSelectedPenjamin] = useState<Penjamin | null>(
    null,
  );
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
  const [sortField, setSortField] = useState<SortField>("nama");
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

  const applyFilters = useCallback(() => {
    let filtered = [...penjamin];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) => p.nama.toLowerCase().includes(query));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "nama") {
        compareValue = a.nama.localeCompare(b.nama, "id");
      } else if (sortField === "created_at") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareValue = dateA - dateB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredPenjamin(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, penjamin, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch penjamin
  const fetchPenjamin = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("penjamin")
        .select("*")
        .order("nama", { ascending: true });

      if (error) throw error;

      setPenjamin(data || []);
    } catch (error) {
      console.error("Error fetching penjamin:", error);
      if (error instanceof Error) {
        toast.error(`Gagal memuat data penjamin: ${error.message}`);
      } else {
        toast.error("Gagal memuat data penjamin");
      }
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

        await fetchPenjamin();
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Real-time subscription
    const channel = supabase
      .channel("penjamin_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "penjamin" },
        () => {
          fetchPenjamin();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPenjamin]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const getSortLabel = () => {
    if (sortField === "nama") {
      return sortOrder === "asc" ? "Nama (A-Z)" : "Nama (Z-A)";
    } else {
      return sortOrder === "asc" ? "Terlama" : "Terbaru";
    }
  };

  const handleResetFilters = () => {
    setSortField("nama");
    setSortOrder("asc");
    setSearchQuery("");
  };

  const totalItems = filteredPenjamin.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + itemsPerPage;
  const currentPenjamin = filteredPenjamin.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentPenjamin.map((p) => p.id));
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
    currentPenjamin.length > 0 &&
    currentPenjamin.every((p) => selectedIds.has(p.id));

  const isSomeSelected =
    currentPenjamin.some((p) => selectedIds.has(p.id)) && !isAllSelected;

  const handleOpenDialog = (item?: Penjamin) => {
    if (item) {
      setSelectedPenjamin(item);
      setFormData({ nama: item.nama });
    } else {
      setSelectedPenjamin(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedPenjamin(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
    }, 200);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrorsType = { nama: "" };
    let isValid = true;

    if (!formData.nama.trim()) {
      errors.nama = "Nama penjamin wajib diisi";
      isValid = false;
    } else if (formData.nama.trim().length < 3) {
      errors.nama = "Nama penjamin minimal 3 karakter";
      isValid = false;
    } else if (formData.nama.trim().length > 150) {
      errors.nama = "Nama penjamin maksimal 150 karakter";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon periksa kembali form Anda");
      return;
    }

    setSubmitting(true);

    try {
      const payload = { nama: formData.nama.trim() };

      if (selectedPenjamin) {
        const { error } = await supabase
          .from("penjamin")
          .update(payload)
          .eq("id", selectedPenjamin.id);

        if (error) throw error;
        toast.success("Penjamin berhasil diperbarui");
      } else {
        const { error } = await supabase.from("penjamin").insert([payload]);

        if (error) throw error;
        toast.success("Penjamin berhasil ditambahkan");
      }

      handleCloseDialog();
      await fetchPenjamin();
    } catch (error) {
      console.error("Error saving penjamin:", error);

      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23505") {
          toast.error("Nama penjamin sudah digunakan");
          setFormErrors({
            ...formErrors,
            nama: "Nama penjamin sudah digunakan",
          });
        } else {
          toast.error(
            selectedPenjamin
              ? "Gagal memperbarui penjamin"
              : "Gagal menambahkan penjamin",
          );
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          selectedPenjamin
            ? "Gagal memperbarui penjamin"
            : "Gagal menambahkan penjamin",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteDialog = (item: Penjamin) => {
    setSelectedPenjamin(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPenjamin) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("penjamin")
        .delete()
        .eq("id", selectedPenjamin.id);

      if (error) throw error;

      toast.success("Penjamin berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedPenjamin(null);
      await fetchPenjamin();
    } catch (error) {
      console.error("Error deleting penjamin:", error);

      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23503") {
          toast.error(
            "Tidak dapat menghapus penjamin karena masih terhubung dengan data lain",
          );
        } else {
          toast.error("Gagal menghapus penjamin");
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus penjamin");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("penjamin")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} penjamin berhasil dihapus`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await fetchPenjamin();
    } catch (error) {
      console.error("Error bulk deleting penjamin:", error);

      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23503") {
          toast.error(
            "Beberapa penjamin tidak dapat dihapus karena masih terhubung dengan data lain",
          );
        } else {
          toast.error("Gagal menghapus penjamin");
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus penjamin");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sort options
  const sortOptions = [
    { value: "nama-asc", label: "Nama (A-Z)" },
    { value: "nama-desc", label: "Nama (Z-A)" },
    { value: "created_at-desc", label: "Terbaru" },
    { value: "created_at-asc", label: "Terlama" },
  ];

  const showReset =
    sortField !== "nama" || sortOrder !== "asc" || searchQuery !== "";

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
            <BreadcrumbPage>Penjamin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Penjamin
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola penjamin untuk sistem
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
            Tambah Penjamin
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Title and Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Penjamin ({totalItems})</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama penjamin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-3">
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
                  <TableHead>Nama Penjamin</TableHead>
                  <TableHead className="w-[180px]">Dibuat</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPenjamin.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data penjamin"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPenjamin.map((item, index) => {
                    const rowNumber = startIndex + index + 1;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(item.id, checked as boolean)
                            }
                            aria-label={`Select ${item.nama}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.nama}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleOpenDialog(item)}
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPenjamin ? "Edit Penjamin" : "Tambah Penjamin"}
            </DialogTitle>
            <DialogDescription>
              {selectedPenjamin
                ? "Update informasi penjamin"
                : "Tambah penjamin baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Penjamin <span className="text-red-500">*</span>
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
                  placeholder="Masukkan nama penjamin"
                  disabled={submitting}
                  className={formErrors.nama ? "border-red-500" : ""}
                />
                {formErrors.nama && (
                  <p className="text-sm text-red-500">{formErrors.nama}</p>
                )}
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
            <AlertDialogTitle>Hapus Penjamin?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus penjamin{" "}
              <strong>{selectedPenjamin?.nama}</strong>? Tindakan ini tidak
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
              Hapus {selectedIds.size} Penjamin?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} penjamin yang
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
