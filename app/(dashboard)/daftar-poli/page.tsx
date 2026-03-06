// app/(dashboard)/daftar-poli/page.tsx
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
import { cn, formatDateTime } from "@/lib/utils";
import { Poli } from "@/types/index";
import * as Icons from "lucide-react";
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

type SortField = "nama_poli" | "urutan" | "created_at";
type SortOrder = "asc" | "desc";

interface PoliExtended extends Poli {
  icon: string;
  description: string;
  urutan: number;
}
interface FormDataType {
  nama_poli: string;
  description: string;
  icon: string;
  urutan: number;
}

interface FormErrorsType {
  nama_poli: string;
  description: string;
  icon: string;
  urutan: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  nama_poli: "",
  description: "",
  icon: "",
  urutan: 0,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  nama_poli: "",
  description: "",
  icon: "",
  urutan: "",
};

export default function DaftarPoliPage() {
  const [poli, setPoli] = useState<PoliExtended[]>([]);
  const [filteredPoli, setFilteredPoli] = useState<PoliExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedPoli, setSelectedPoli] = useState<PoliExtended | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

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

  const applyFilters = useCallback(() => {
    let filtered = [...poli];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nama_poli.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.icon.toLowerCase().includes(query),
      );
    }



    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        const isActive = p.status === "active";
        return statusFilter === "active" ? isActive : !isActive;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "nama_poli") {
        compareValue = a.nama_poli.localeCompare(b.nama_poli, "id");
      } else if (sortField === "urutan") {
        compareValue = a.urutan - b.urutan;
      } else if (sortField === "created_at") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareValue = dateA - dateB;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredPoli(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, poli, sortField, sortOrder, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch poli
  const fetchPoli = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("poli")
        .select("*")
        .order("urutan", { ascending: true });

      if (error) throw error;

      setPoli(data || []);
    } catch (error) {
      console.error("Error fetching poli:", error);
      if (error instanceof Error) {
        toast.error(`Gagal memuat data poli: ${error.message}`);
      } else {
        toast.error("Gagal memuat data poli");
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

        await fetchPoli();
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Real-time subscription
    const channel = supabase
      .channel("poli_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poli" },
        () => {
          fetchPoli();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPoli]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const getSortLabel = () => {
    if (sortField === "nama_poli") {
      return sortOrder === "asc" ? "Nama (A-Z)" : "Nama (Z-A)";
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

  const totalItems = filteredPoli.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + itemsPerPage;
  const currentPoli = filteredPoli.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentPoli.map((p) => p.id));
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
    currentPoli.length > 0 && currentPoli.every((p) => selectedIds.has(p.id));

  const isSomeSelected =
    currentPoli.some((p) => selectedIds.has(p.id)) && !isAllSelected;

  const handleOpenDialog = async (item?: PoliExtended) => {
    if (item) {
      setSelectedPoli(item);
      setFormData({
        nama_poli: item.nama_poli,
        description: item.description,
        icon: item.icon,
        urutan: item.urutan,
      });
    } else {
      // Get max urutan for new item
      const { data } = await supabase
        .from("poli")
        .select("urutan")
        .order("urutan", { ascending: false })
        .limit(1);

      const nextUrutan = data && data.length > 0 ? data[0].urutan + 1 : 1;

      setSelectedPoli(null);
      setFormData({
        ...DEFAULT_FORM_DATA,
        urutan: nextUrutan,
      });
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedPoli(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
    }, 200);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrorsType = {
      nama_poli: "",
      description: "",
      icon: "",
      urutan: "",
    };

    let isValid = true;

    if (!formData.nama_poli.trim()) {
      errors.nama_poli = "Nama poli wajib diisi";
      isValid = false;
    } else if (formData.nama_poli.trim().length < 3) {
      errors.nama_poli = "Nama poli minimal 3 karakter";
      isValid = false;
    } else if (formData.nama_poli.trim().length > 100) {
      errors.nama_poli = "Nama poli maksimal 100 karakter";
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = "Deskripsi wajib diisi";
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      errors.description = "Deskripsi minimal 10 karakter";
      isValid = false;
    }

    if (!formData.icon.trim()) {
      errors.icon = "Icon wajib dipilih";
      isValid = false;
    }

    if (formData.urutan < 0) {
      errors.urutan = "Urutan tidak boleh negatif";
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
      const payload = {
        nama_poli: formData.nama_poli.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim(),
        urutan: formData.urutan,
        status: "active" as const,
      };

      if (selectedPoli) {
        // Update existing poli
        const { error } = await supabase
          .from("poli")
          .update(payload)
          .eq("id", selectedPoli.id);

        if (error) throw error;

        toast.success("Poli berhasil diperbarui");
      } else {
        // Create new poli
        const { error } = await supabase.from("poli").insert([payload]);

        if (error) throw error;

        toast.success("Poli berhasil ditambahkan");
      }

      handleCloseDialog();
      await fetchPoli();
    } catch (error) {
      console.error("Error saving poli:", error);

      // Type guard untuk PostgrestError
      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23505") {
          toast.error("Nama poli sudah digunakan");
          setFormErrors({
            ...formErrors,
            nama_poli: "Nama poli sudah digunakan",
          });
        } else {
          toast.error(
            selectedPoli ? "Gagal memperbarui poli" : "Gagal menambahkan poli",
          );
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          selectedPoli ? "Gagal memperbarui poli" : "Gagal menambahkan poli",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteDialog = (item: PoliExtended) => {
    setSelectedPoli(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPoli) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("poli")
        .delete()
        .eq("id", selectedPoli.id);

      if (error) throw error;

      toast.success("Poli berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedPoli(null);
      await fetchPoli();
    } catch (error) {
      console.error("Error deleting poli:", error);

      // Type guard untuk PostgrestError
      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23503") {
          toast.error(
            "Tidak dapat menghapus poli karena masih terhubung dengan data dokter",
          );
        } else {
          toast.error("Gagal menghapus poli");
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus poli");
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
        .from("poli")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} poli berhasil dihapus`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await fetchPoli();
    } catch (error) {
      console.error("Error bulk deleting poli:", error);

      // Type guard untuk PostgrestError
      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        if (dbError.code === "23503") {
          toast.error(
            "Beberapa poli tidak dapat dihapus karena masih terhubung dengan data dokter",
          );
        } else {
          toast.error("Gagal menghapus poli");
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus poli");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sort options
  const sortOptions = [
    { value: "urutan-asc", label: "Urutan (1-9)" },
    { value: "urutan-desc", label: "Urutan (9-1)" },
    { value: "nama_poli-asc", label: "Nama (A-Z)" },
    { value: "nama_poli-desc", label: "Nama (Z-A)" },
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
            <BreadcrumbPage>Daftar Poli</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Daftar Poli
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola daftar poli untuk ditampilkan di website
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
            Tambah Poli
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Title and Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Poli ({totalItems})</CardTitle>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama poli, deskripsi..."
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
                  <TableHead>Nama Poli</TableHead>
                  <TableHead className="max-w-md">Deskripsi</TableHead>
                  <TableHead className="w-24">Urutan</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-[180px]">Dibuat</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPoli.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data poli"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPoli.map((item, index) => {
                    const IconComponent = (
                      Icons as unknown as Record<
                        string,
                        React.ComponentType<{ className?: string }>
                      >
                    )[item.icon];
                    const rowNumber = startIndex + index + 1;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(item.id, checked as boolean)
                            }
                            aria-label={`Select ${item.nama_poli}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            {IconComponent ? (
                              <IconComponent className="h-5 w-5 text-primary" />
                            ) : (
                              <Icons.HelpCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.nama_poli}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {item.urutan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700"
                                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700"
                            }
                          >
                            {item.status === "active" ? "Aktif" : "Tidak Aktif"}
                          </Badge>
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPoli ? "Edit Poli" : "Tambah Poli"}
            </DialogTitle>
            <DialogDescription>
              {selectedPoli ? "Update informasi poli" : "Tambah poli baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Nama Poli */}
              <div className="space-y-2">
                <Label htmlFor="nama_poli">
                  Nama Poli <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama_poli"
                  value={formData.nama_poli}
                  onChange={(e) => {
                    setFormData({ ...formData, nama_poli: e.target.value });
                    if (formErrors.nama_poli) {
                      setFormErrors({ ...formErrors, nama_poli: "" });
                    }
                  }}
                  placeholder="Masukkan nama poli"
                  disabled={submitting}
                  className={formErrors.nama_poli ? "border-red-500" : ""}
                />
                {formErrors.nama_poli && (
                  <p className="text-sm text-red-500">{formErrors.nama_poli}</p>
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
                  placeholder="Masukkan deskripsi poli"
                  disabled={submitting}
                  rows={4}
                  className={cn(
                    "min-h-[150px] resize-y",
                    formErrors.description &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">
                    {formErrors.description}
                  </p>
                )}
              </div>

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
            <AlertDialogTitle>Hapus Poli?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus poli{" "}
              <strong>{selectedPoli?.nama_poli}</strong>? Tindakan ini tidak
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
            <AlertDialogTitle>Hapus {selectedIds.size} Poli?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} poli yang
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
