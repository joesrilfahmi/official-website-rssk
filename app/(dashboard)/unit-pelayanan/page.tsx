// app/(dashboard)/unit-pelayanan/page.tsx
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
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = "title" | "created_at";
type SortOrder = "asc" | "desc";

interface AuditUser {
  id: string;
  nama: string;
  username: string;
  avatar?: string;
}

interface UnitPelayanan {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_by_user?: AuditUser;
  updated_by_user?: AuditUser;
}

interface FormDataType {
  title: string;
}

interface FormErrorsType {
  title: string;
}

const DEFAULT_FORM_DATA: FormDataType = { title: "" };
const DEFAULT_FORM_ERRORS: FormErrorsType = { title: "" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnitPelayananPage() {
  const [unitPelayanan, setUnitPelayanan] = useState<UnitPelayanan[]>([]);
  const [filteredUnitPelayanan, setFilteredUnitPelayanan] = useState<UnitPelayanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedUnitPelayanan, setSelectedUnitPelayanan] = useState<UnitPelayanan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

  // ── Debounce search ───────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Filter & sort ─────────────────────────────────────────────────────────

  const applyFilters = useCallback(() => {
    let filtered = [...unitPelayanan];

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((u) => u.title.toLowerCase().includes(query));
    }

    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortField === "title") {
        compareValue = a.title.localeCompare(b.title, "id");
      } else if (sortField === "created_at") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        compareValue = dateA - dateB;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredUnitPelayanan(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, unitPelayanan, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchUnitPelayanan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("unit_pelayanan")
        .select(
          `*,
          created_by_user:users!unit_pelayanan_created_by_fkey(id, nama, username, avatar),
          updated_by_user:users!unit_pelayanan_updated_by_fkey(id, nama, username, avatar)`,
        )
        .order("title", { ascending: true });

      if (error) throw error;

      const mapped: UnitPelayanan[] = (data || []).map((row) => ({
        ...row,
        created_by_user: row.created_by_user ?? undefined,
        updated_by_user: row.updated_by_user ?? undefined,
      }));

      setUnitPelayanan(mapped);
    } catch (error) {
      console.error("Error fetching unit pelayanan:", error);
      toast.error(
        error instanceof Error
          ? `Gagal memuat data unit pelayanan: ${error.message}`
          : "Gagal memuat data unit pelayanan",
      );
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setShowAccessDenied(true);
          return;
        }
        setCurrentUserId(currentUser.id);
        await fetchUnitPelayanan();
      } finally {
        setLoading(false);
      }
    };

    void loadInitial();

    const channel = supabase
      .channel("unit_pelayanan_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_pelayanan" }, () => {
        void fetchUnitPelayanan();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [fetchUnitPelayanan]);

  // ── Sort helpers ──────────────────────────────────────────────────────────

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    setSortField(field);
    setSortOrder(order);
  };

  const getSortLabel = () => {
    if (sortField === "title") return sortOrder === "asc" ? "Nama (A-Z)" : "Nama (Z-A)";
    return sortOrder === "asc" ? "Terlama" : "Terbaru";
  };

  const handleResetFilters = () => {
    setSortField("title");
    setSortOrder("asc");
    setSearchQuery("");
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalItems = filteredUnitPelayanan.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / (itemsPerPage as number));
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + (itemsPerPage as number);
  const currentUnitPelayanan = filteredUnitPelayanan.slice(startIndex, endIndex);

  // ── Selection ─────────────────────────────────────────────────────────────

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(currentUnitPelayanan.map((u) => u.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    checked ? next.add(id) : next.delete(id);
    setSelectedIds(next);
  };

  const isAllSelected =
    currentUnitPelayanan.length > 0 &&
    currentUnitPelayanan.every((u) => selectedIds.has(u.id));
  const isSomeSelected =
    currentUnitPelayanan.some((u) => selectedIds.has(u.id)) && !isAllSelected;

  // ── Dialog ────────────────────────────────────────────────────────────────

  const handleOpenDialog = (item?: UnitPelayanan) => {
    if (item) {
      setSelectedUnitPelayanan(item);
      setFormData({ title: item.title });
    } else {
      setSelectedUnitPelayanan(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedUnitPelayanan(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
    }, 200);
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FormErrorsType = { title: "" };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = "Nama unit pelayanan wajib diisi"; isValid = false;
    } else if (formData.title.trim().length < 3) {
      errors.title = "Nama unit pelayanan minimal 3 karakter"; isValid = false;
    } else if (formData.title.trim().length > 100) {
      errors.title = "Nama unit pelayanan maksimal 100 karakter"; isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Mohon periksa kembali form Anda"); return; }
    setSubmitting(true);

    try {
      if (selectedUnitPelayanan) {
        // UPDATE — catat siapa yang mengupdate
        const { error } = await supabase
          .from("unit_pelayanan")
          .update({
            title: formData.title.trim(),
            updated_by: currentUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedUnitPelayanan.id);
        if (error) throw error;
        toast.success("Unit pelayanan berhasil diperbarui");
      } else {
        // INSERT — catat siapa yang membuat
        const { error } = await supabase.from("unit_pelayanan").insert([{
          title: formData.title.trim(),
          created_by: currentUserId,
        }]);
        if (error) throw error;
        toast.success("Unit pelayanan berhasil ditambahkan");
      }

      handleCloseDialog();
      await fetchUnitPelayanan();
    } catch (error) {
      console.error("Error saving unit pelayanan:", error);
      if (error && typeof error === "object" && "code" in error) {
        const dbErr = error as { code: string };
        if (dbErr.code === "23505") {
          toast.error("Nama unit pelayanan sudah digunakan");
          setFormErrors({ ...formErrors, title: "Nama unit pelayanan sudah digunakan" });
        } else {
          toast.error(selectedUnitPelayanan ? "Gagal memperbarui unit pelayanan" : "Gagal menambahkan unit pelayanan");
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleOpenDeleteDialog = (item: UnitPelayanan) => {
    setSelectedUnitPelayanan(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUnitPelayanan) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("unit_pelayanan")
        .delete()
        .eq("id", selectedUnitPelayanan.id);
      if (error) throw error;
      toast.success("Unit pelayanan berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedUnitPelayanan(null);
      await fetchUnitPelayanan();
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const dbErr = error as { code: string };
        toast.error(
          dbErr.code === "23503"
            ? "Tidak dapat menghapus unit pelayanan karena masih terhubung dengan data lain"
            : "Gagal menghapus unit pelayanan",
        );
      } else {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus unit pelayanan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("unit_pelayanan")
        .delete()
        .in("id", Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} unit pelayanan berhasil dihapus`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await fetchUnitPelayanan();
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const dbErr = error as { code: string };
        toast.error(
          dbErr.code === "23503"
            ? "Beberapa unit pelayanan tidak dapat dihapus karena masih terhubung dengan data lain"
            : "Gagal menghapus unit pelayanan",
        );
      } else {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus unit pelayanan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Misc ──────────────────────────────────────────────────────────────────

  const sortOptions = [
    { value: "title-asc", label: "Nama (A-Z)" },
    { value: "title-desc", label: "Nama (Z-A)" },
    { value: "created_at-desc", label: "Terbaru" },
    { value: "created_at-asc", label: "Terlama" },
  ];

  const showReset = sortField !== "title" || sortOrder !== "asc" || searchQuery !== "";

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
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

  // ── Render ────────────────────────────────────────────────────────────────

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
            <BreadcrumbPage>Unit Pelayanan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Unit Pelayanan</h1>
          <p className="text-muted-foreground mt-1">Kelola unit pelayanan untuk sistem</p>
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
            Tambah Unit Pelayanan
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Unit Pelayanan ({totalItems})</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama unit pelayanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={`${sortField}-${sortOrder}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{getSortLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                      className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                  </TableHead>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama Unit Pelayanan</TableHead>
                  {/* ── Kolom Audit ── */}
                  <TableHead className="w-52">Dibuat Oleh</TableHead>
                  <TableHead className="w-52">Diperbarui Oleh</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUnitPelayanan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data unit pelayanan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUnitPelayanan.map((item, index) => {
                    const rowNumber = startIndex + index + 1;
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
                        <TableCell className="font-medium">{rowNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                        </TableCell>

                        {/* ── Dibuat Oleh ── */}
                        <TableCell>
                          {item.created_by_user ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5 shrink-0">
                                  <AvatarImage src={item.created_by_user.avatar} alt={item.created_by_user.nama} />
                                  <AvatarFallback className="text-[10px]">
                                    {item.created_by_user.nama.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate max-w-[100px]">
                                  {item.created_by_user.nama}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground pl-6">
                                {formatDateTime(item.created_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.created_at)}
                            </span>
                          )}
                        </TableCell>

                        {/* ── Diperbarui Oleh ── */}
                        <TableCell>
                          {item.updated_by_user ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5 shrink-0">
                                  <AvatarImage src={item.updated_by_user.avatar} alt={item.updated_by_user.nama} />
                                  <AvatarFallback className="text-[10px]">
                                    {item.updated_by_user.nama.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate max-w-[100px]">
                                  {item.updated_by_user.nama}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground pl-6">
                                {item.updated_at ? formatDateTime(item.updated_at) : "-"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
                                <TooltipContent><p>Edit</p></TooltipContent>
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
                                <TooltipContent><p>Hapus</p></TooltipContent>
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

      {/* ════════════════════════════════════════════════════════════════════
          Dialog Tambah / Edit
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUnitPelayanan ? "Edit Unit Pelayanan" : "Tambah Unit Pelayanan"}
            </DialogTitle>
            <DialogDescription>
              {selectedUnitPelayanan ? "Update informasi unit pelayanan" : "Tambah unit pelayanan baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Nama Unit Pelayanan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  placeholder="Masukkan nama unit pelayanan"
                  disabled={submitting}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* ── Audit Box — hanya tampil saat mode Edit ── */}
              {selectedUnitPelayanan && (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage
                        src={selectedUnitPelayanan.created_by_user?.avatar}
                        alt={selectedUnitPelayanan.created_by_user?.nama ?? ""}
                      />
                      <AvatarFallback className="text-[10px]">
                        {(selectedUnitPelayanan.created_by_user?.nama ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Dibuat oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedUnitPelayanan.created_by_user?.nama ?? "—"}
                      </span>
                    </span>
                    {selectedUnitPelayanan.created_at && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDateTime(selectedUnitPelayanan.created_at)}</span>
                      </>
                    )}
                  </div>

                  {selectedUnitPelayanan.updated_by_user && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage
                          src={selectedUnitPelayanan.updated_by_user.avatar}
                          alt={selectedUnitPelayanan.updated_by_user.nama}
                        />
                        <AvatarFallback className="text-[10px]">
                          {selectedUnitPelayanan.updated_by_user.nama.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Diperbarui oleh{" "}
                        <span className="font-medium text-foreground">
                          {selectedUnitPelayanan.updated_by_user.nama}
                        </span>
                      </span>
                      {selectedUnitPelayanan.updated_at && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{formatDateTime(selectedUnitPelayanan.updated_at)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit Pelayanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus unit pelayanan{" "}
              <strong>{selectedUnitPelayanan?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleDelete(); }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Dialog ── */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Unit Pelayanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} unit pelayanan yang dipilih?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleBulkDelete(); }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
}