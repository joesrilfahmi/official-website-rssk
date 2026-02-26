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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import type {
  KritikSaranFormData,
  KritikSaranFormErrors,
  KritikSaranSortField,
  KritikSaranSortOrder,
  KritikSaranWithRelations,
  UnitPelayanan,
} from "@/types";
import {
  ArrowUpDown,
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type KritikSaran = KritikSaranWithRelations;
type SortField = KritikSaranSortField;
type SortOrder = KritikSaranSortOrder;

const DEFAULT_FORM_DATA: KritikSaranFormData = {
  nama: "",
  no_hp: "",
  unit_pelayanan_id: "",
  pesan: "",
  rating: null,
  is_anonymus: false,
};

const DEFAULT_FORM_ERRORS: KritikSaranFormErrors = {
  nama: "",
  no_hp: "",
  unit_pelayanan_id: "",
  pesan: "",
  rating: "",
};

export default function KritikSaranPage() {
  const [data, setData] = useState<KritikSaran[]>([]);
  const [filteredData, setFilteredData] = useState<KritikSaran[]>([]);
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KritikSaran | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">(
    "all",
  );
  const [unitFilter, setUnitFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  // Date range filter
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [formData, setFormData] =
    useState<KritikSaranFormData>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<KritikSaranFormErrors>(DEFAULT_FORM_ERRORS);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Unit Pelayanan
  const fetchUnitPelayanan = useCallback(async () => {
    try {
      const { data: unitData, error } = await supabase
        .from("unit_pelayanan")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      setUnitPelayananList(unitData || []);
    } catch (error) {
      console.error("Error fetching unit pelayanan:", error);
      toast.error("Gagal memuat data unit pelayanan");
    }
  }, []);

  // Fetch Kritik Saran
  const fetchKritikSaran = useCallback(async () => {
    try {
      const { data: kritikData, error } = await supabase
        .from("kritik_saran")
        .select(
          `
                    *,
                    unit_pelayanan:unit_pelayanan_id(id, title)
                `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(kritikData || []);
    } catch (error) {
      console.error("Error fetching kritik saran:", error);
      toast.error("Gagal memuat data kritik & saran");
    }
  }, []);

  // Apply filters and sorting
  const applyFilters = useCallback(() => {
    let filtered = [...data];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(query) ||
          item.no_hp.includes(query) ||
          item.pesan.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Unit filter
    if (unitFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.unit_pelayanan_id === unitFilter,
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((item) => item.rating === rating);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (item) => new Date(item.created_at) >= dateFrom,
      );
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (item) => new Date(item.created_at) <= endDate,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "nama") {
        compareValue = a.nama.localeCompare(b.nama, "id");
      } else if (sortField === "unit_pelayanan") {
        const aUnit = a.unit_pelayanan?.title || "";
        const bUnit = b.unit_pelayanan?.title || "";
        compareValue = aUnit.localeCompare(bUnit, "id");
      } else if (sortField === "status") {
        compareValue = a.status.localeCompare(b.status, "id");
      } else if (sortField === "rating") {
        compareValue = (a.rating || 0) - (b.rating || 0);
      } else if (sortField === "created_at") {
        compareValue =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [
    debouncedSearch,
    statusFilter,
    unitFilter,
    ratingFilter,
    dateFrom,
    dateTo,
    data,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

        // Set admin status
        setIsAdmin(currentUser.role === "administrator");

        await Promise.all([fetchUnitPelayanan(), fetchKritikSaran()]);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    // Real-time subscription
    const channel = supabase
      .channel("kritik_saran_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kritik_saran" },
        () => {
          fetchKritikSaran();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnitPelayanan, fetchKritikSaran]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const loadingToast = toast.loading("Memperbarui data...");

    try {
      await Promise.all([fetchUnitPelayanan(), fetchKritikSaran()]);
      toast.success("Data berhasil diperbarui!", { id: loadingToast });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Gagal memperbarui data", { id: loadingToast });
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setUnitFilter("all");
    setRatingFilter("all");
    setSortField("created_at");
    setSortOrder("desc");
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const totalItems = filteredData.length;
  const totalPages =
    itemsPerPage === "all"
      ? 1
      : Math.ceil(totalItems / (itemsPerPage as number));
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + (itemsPerPage as number);
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (!isAdmin) return;
    if (checked) {
      setSelectedIds(new Set(currentData.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!isAdmin) return;
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    currentData.length > 0 &&
    currentData.every((item) => selectedIds.has(item.id));
  const isSomeSelected =
    currentData.some((item) => selectedIds.has(item.id)) && !isAllSelected;

  const handleOpenDialog = (item: KritikSaran | null = null) => {
    if (!isAdmin) {
      toast.error(
        "Akses ditolak. Hanya administrator yang dapat mengakses fitur ini.",
      );
      return;
    }

    if (item) {
      setSelectedItem(item);
      setFormData({
        nama: item.is_anonymus ? "" : item.nama,
        no_hp: item.is_anonymus ? "" : item.no_hp,
        unit_pelayanan_id: item.unit_pelayanan_id,
        pesan: item.pesan,
        rating: item.rating,
        is_anonymus: item.is_anonymus,
      });
    } else {
      setSelectedItem(null);
      setFormData({ ...DEFAULT_FORM_DATA });
    }
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
    setDialogOpen(true);
  };

  const handleViewDetail = async (item: KritikSaran) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);

    // Mark as read (all users can mark as read)
    if (!item.is_readed) {
      try {
        const { error } = await supabase
          .from("kritik_saran")
          .update({ is_readed: true, status: "read" })
          .eq("id", item.id);

        if (error) throw error;
        await fetchKritikSaran();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const validateForm = () => {
    const errors = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.is_anonymus) {
      if (!formData.nama.trim()) {
        errors.nama = "Nama wajib diisi";
        isValid = false;
      }

      if (!formData.no_hp.trim()) {
        errors.no_hp = "No HP wajib diisi";
        isValid = false;
      } else if (!/^[0-9]{10,15}$/.test(formData.no_hp)) {
        errors.no_hp = "No HP tidak valid (10-15 digit)";
        isValid = false;
      }
    }

    if (!formData.unit_pelayanan_id) {
      errors.unit_pelayanan_id = "Unit pelayanan wajib dipilih";
      isValid = false;
    }

    if (!formData.pesan.trim()) {
      errors.pesan = "Pesan wajib diisi";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error(
        "Akses ditolak. Hanya administrator yang dapat mengakses fitur ini.",
      );
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    const loadingToast = toast.loading(
      selectedItem ? "Mengupdate data..." : "Menambahkan data...",
    );

    try {
      const dataToSubmit = {
        nama: formData.is_anonymus ? "Anonim" : formData.nama.trim(),
        no_hp: formData.is_anonymus ? "000000000000" : formData.no_hp.trim(),
        unit_pelayanan_id: formData.unit_pelayanan_id,
        pesan: formData.pesan.trim(),
        rating: formData.rating,
        is_anonymus: formData.is_anonymus,
      };

      if (selectedItem) {
        const { error } = await supabase
          .from("kritik_saran")
          .update(dataToSubmit)
          .eq("id", selectedItem.id);

        if (error) throw error;
        toast.success("Data berhasil diupdate", { id: loadingToast });
      } else {
        const { error } = await supabase
          .from("kritik_saran")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Data berhasil ditambahkan", { id: loadingToast });
      }

      await fetchKritikSaran();
      setDialogOpen(false);
      setSelectedItem(null);
      setFormData({ ...DEFAULT_FORM_DATA });
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error(
        "Akses ditolak. Hanya administrator yang dapat mengakses fitur ini.",
      );
      return;
    }

    if (!selectedItem) return;
    setSubmitting(true);
    const loadingToast = toast.loading("Menghapus data...");

    try {
      const { error } = await supabase
        .from("kritik_saran")
        .delete()
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Data berhasil dihapus", { id: loadingToast });
      await fetchKritikSaran();
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus data", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast.error(
        "Akses ditolak. Hanya administrator yang dapat mengakses fitur ini.",
      );
      return;
    }

    if (selectedIds.size === 0) return;
    setSubmitting(true);
    const loadingToast = toast.loading(`Menghapus ${selectedIds.size} data...`);

    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase
        .from("kritik_saran")
        .delete()
        .in("id", idsArray);

      if (error) throw error;

      toast.success(`${idsArray.length} data berhasil dihapus`, {
        id: loadingToast,
      });
      setSelectedIds(new Set());
      await fetchKritikSaran();
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Gagal menghapus data", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number | null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= (rating || 0)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const showReset =
    statusFilter !== "all" ||
    unitFilter !== "all" ||
    ratingFilter !== "all" ||
    sortField !== "created_at" ||
    sortOrder !== "desc" ||
    searchQuery !== "" ||
    dateFrom !== undefined ||
    dateTo !== undefined;

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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Kritik & Saran
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola kritik dan saran dari pasien
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          {isAdmin && selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Title and Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Kritik & Saran</CardTitle>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama, no hp, pesan..."
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
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "read" | "unread") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="read">Sudah Dibaca</SelectItem>
                  <SelectItem value="unread">Belum Dibaca</SelectItem>
                </SelectContent>
              </Select>

              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Unit Pelayanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {unitPelayananList.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rating</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="3">⭐⭐⭐</SelectItem>
                  <SelectItem value="2">⭐⭐</SelectItem>
                  <SelectItem value="1">⭐</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range and Sort */}
            <div className="flex flex-wrap gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom
                      ? dateFrom.toLocaleDateString("id-ID")
                      : "Dari Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo
                      ? dateTo.toLocaleDateString("id-ID")
                      : "Sampai Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-") as [
                    SortField,
                    SortOrder,
                  ];
                  setSortField(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Terbaru</SelectItem>
                  <SelectItem value="created_at-asc">Terlama</SelectItem>
                  <SelectItem value="nama-asc">Nama (A-Z)</SelectItem>
                  <SelectItem value="nama-desc">Nama (Z-A)</SelectItem>
                  <SelectItem value="rating-desc">Rating Tertinggi</SelectItem>
                  <SelectItem value="rating-asc">Rating Terendah</SelectItem>
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
                  {isAdmin && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className={
                          isSomeSelected
                            ? "data-[state=checked]:bg-primary/50"
                            : ""
                        }
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>No HP</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 9 : 8}
                      className="text-center text-muted-foreground h-32"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={
                        !item.is_readed ? "bg-blue-50 dark:bg-blue-950/20" : ""
                      }
                    >
                      {isAdmin && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(item.id, checked as boolean)
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{item.no_hp}</TableCell>
                      <TableCell>{item.unit_pelayanan?.title || "-"}</TableCell>
                      <TableCell>{renderStars(item.rating)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "read"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300"
                          }
                        >
                          {item.status === "read" ? "Dibaca" : "Belum Dibaca"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleViewDetail(item)}
                                  className="h-8 w-8 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white dark:text-white hover:text-white"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Detail</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {isAdmin && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleOpenDialog(item)}
                                      className="h-8 w-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white hover:text-white"
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
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Hapus</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Kritik & Saran</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nama</Label>
                  <p className="font-medium">{selectedItem.nama}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">No HP</Label>
                  <p className="font-medium">{selectedItem.no_hp}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Unit Pelayanan
                  </Label>
                  <p className="font-medium">
                    {selectedItem.unit_pelayanan?.title || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <div>{renderStars(selectedItem.rating)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal</Label>
                  <p className="font-medium">
                    {formatDateTime(selectedItem.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Pesan</Label>
                <p className="mt-2 p-4 bg-muted rounded-md">
                  {selectedItem.pesan}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit" : "Tambah"} Kritik & Saran
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                <Checkbox
                  id="anonymus"
                  checked={formData.is_anonymus}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      is_anonymus: checked as boolean,
                      nama: checked ? "" : formData.nama,
                      no_hp: checked ? "" : formData.no_hp,
                    });
                    if (checked) {
                      setFormErrors({ ...formErrors, nama: "", no_hp: "" });
                    }
                  }}
                  disabled={submitting}
                />
                <Label htmlFor="anonymus" className="cursor-pointer">
                  Kirim sebagai anonim
                </Label>
              </div>

              {!formData.is_anonymus && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Nama <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.nama}
                      onChange={(e) => {
                        setFormData({ ...formData, nama: e.target.value });
                        if (formErrors.nama)
                          setFormErrors({ ...formErrors, nama: "" });
                      }}
                      placeholder="Nama lengkap"
                      disabled={submitting}
                      className={formErrors.nama ? "border-red-500" : ""}
                    />
                    {formErrors.nama && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.nama}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      No HP <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.no_hp}
                      onChange={(e) => {
                        setFormData({ ...formData, no_hp: e.target.value });
                        if (formErrors.no_hp)
                          setFormErrors({ ...formErrors, no_hp: "" });
                      }}
                      placeholder="08123456789"
                      disabled={submitting}
                      className={formErrors.no_hp ? "border-red-500" : ""}
                    />
                    {formErrors.no_hp && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.no_hp}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>
                  Unit Pelayanan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.unit_pelayanan_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, unit_pelayanan_id: value });
                    if (formErrors.unit_pelayanan_id)
                      setFormErrors({ ...formErrors, unit_pelayanan_id: "" });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger
                    className={
                      formErrors.unit_pelayanan_id ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitPelayananList.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.unit_pelayanan_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.unit_pelayanan_id}
                  </p>
                )}
              </div>

              <div>
                <Label>Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                      disabled={submitting}
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                          star <= (formData.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>
                  Pesan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.pesan}
                  onChange={(e) => {
                    setFormData({ ...formData, pesan: e.target.value });
                    if (formErrors.pesan)
                      setFormErrors({ ...formErrors, pesan: "" });
                  }}
                  placeholder="Tulis kritik atau saran Anda..."
                  rows={4}
                  disabled={submitting}
                  className={formErrors.pesan ? "border-red-500" : ""}
                />
                {formErrors.pesan && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.pesan}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} data yang
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

      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
