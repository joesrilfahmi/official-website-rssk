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
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import * as Icons from "lucide-react";
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type SortField = "title" | "created_at" | "urutan";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";

interface AuditUser {
  id: string;
  nama: string;
  username: string;
  avatar?: string;
}

interface DokterResult {
  id: string;
  nama: string;
  poli: { nama_poli: string } | null;
}

interface KondisiItem {
  id?: string;
  title: string;
  description: string;
  urutan: number;
}

interface TeknologiItem {
  id?: string;
  title: string;
  description: string;
  urutan: number;
}

interface LayananDokter {
  dokter_id: string;
  dokter: DokterResult | null;
}

interface LayananUnggulan {
  id: string;
  title: string;
  description: string;
  specializations: string[];
  additional_info: string | null;
  icon: string;
  status: string;
  urutan: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_user?: AuditUser;
  updated_by_user?: AuditUser;
  layanan_unggulan_dokter: LayananDokter[];
  layanan_unggulan_kondisi: KondisiItem[];
  layanan_unggulan_teknologi: TeknologiItem[];
}

interface SupabaseLayananRow {
  id: string;
  title: string;
  description: string;
  specializations: string[];
  additional_info: string | null;
  icon: string;
  status: string;
  urutan: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_user?: AuditUser | null;
  updated_by_user?: AuditUser | null;
  layanan_unggulan_dokter: {
    dokter_id: string;
    dokter: {
      id: string;
      nama: string;
      poli: { nama_poli: string } | null;
    } | null;
  }[];
  layanan_unggulan_kondisi: KondisiItem[];
  layanan_unggulan_teknologi: TeknologiItem[];
}

interface SupabaseDokterRow {
  id: string;
  nama: string;
  poli: { nama_poli: string }[] | null;
}

interface FormDataType {
  title: string;
  description: string;
  specializations: string[];
  additional_info: string;
  icon: string;
  status: string;
  urutan: number;
  selected_dokter_ids: string[];
  kondisi: KondisiItem[];
  teknologi: TeknologiItem[];
}

interface FormErrorsType {
  title: string;
  description: string;
  icon: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
  title: "",
  description: "",
  specializations: [],
  additional_info: "",
  icon: "",
  status: "active",
  urutan: 0,
  selected_dokter_ids: [],
  kondisi: [],
  teknologi: [],
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
  title: "",
  description: "",
  icon: "",
};

// ── Helper: render icon ────────────────────────────────────────────────────

function renderIcon(iconName: string, className = "h-5 w-5") {
  const IconComponent = (
    Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string }>
    >
  )[iconName];
  return IconComponent ? (
    <IconComponent className={cn(className, "text-primary")} />
  ) : (
    <Icons.HelpCircle className={cn(className, "text-muted-foreground")} />
  );
}

// ── Section heading ────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
        {children}
      </p>
      <Separator className="flex-1" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LayananUnggulanPage() {
  const [data, setData] = useState<LayananUnggulan[]>([]);
  const [filteredData, setFilteredData] = useState<LayananUnggulan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LayananUnggulan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Dokter
  const [dokterList, setDokterList] = useState<DokterResult[]>([]);
  const [dokterSearch, setDokterSearch] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);
  const [sortField, setSortField] = useState<SortField>("urutan");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered dokter list
  const filteredDokterList = dokterSearch.trim()
    ? dokterList.filter(
        (d) =>
          d.nama.toLowerCase().includes(dokterSearch.toLowerCase()) ||
          (d.poli?.nama_poli ?? "")
            .toLowerCase()
            .includes(dokterSearch.toLowerCase()),
      )
    : dokterList;

  // Apply table filters
  const applyFilters = useCallback(() => {
    let filtered = [...data];

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

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

    setFilteredData(filtered);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, statusFilter, data, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const { data: result, error } = await supabase
        .from("layanan_unggulan")
        .select(
          `*,
          created_by_user:users!layanan_unggulan_created_by_fkey(id, nama, username, avatar),
          updated_by_user:users!layanan_unggulan_updated_by_fkey(id, nama, username, avatar),
          layanan_unggulan_dokter(
            dokter_id,
            dokter:dokter_id(id, nama, poli:poli_id(nama_poli))
          ),
          layanan_unggulan_kondisi(id, title, description, urutan),
          layanan_unggulan_teknologi(id, title, description, urutan)`,
        )
        .order("urutan", { ascending: true });

      if (error) throw error;

      const rows = (result ?? []) as SupabaseLayananRow[];
      const mapped: LayananUnggulan[] = rows.map((row) => ({
        ...row,
        created_by_user: row.created_by_user ?? undefined,
        updated_by_user: row.updated_by_user ?? undefined,
        layanan_unggulan_dokter: row.layanan_unggulan_dokter.map((ld) => ({
          dokter_id: ld.dokter_id,
          dokter: ld.dokter
            ? { id: ld.dokter.id, nama: ld.dokter.nama, poli: ld.dokter.poli }
            : null,
        })),
      }));

      setData(mapped);
    } catch (error) {
      console.error("Error fetching layanan unggulan:", error);
      toast.error("Gagal memuat data layanan unggulan");
    }
  }, []);

  const fetchDokter = useCallback(async () => {
    try {
      const { data: result, error } = await supabase
        .from("dokter")
        .select("id, nama, poli:poli_id(nama_poli)")
        .eq("status", "active")
        .order("nama");

      if (error) throw error;

      const rows = (result ?? []) as unknown as SupabaseDokterRow[];
      setDokterList(
        rows.map((r) => ({
          id: r.id,
          nama: r.nama,
          poli: Array.isArray(r.poli) ? (r.poli[0] ?? null) : r.poli,
        })),
      );
    } catch (error) {
      console.error("Error fetching dokter:", error);
    }
  }, []);

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
        await Promise.all([fetchData(), fetchDokter()]);
      } finally {
        setLoading(false);
      }
    };

    void loadInitial();

    const channel = supabase
      .channel("layanan_unggulan_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layanan_unggulan" },
        () => { void fetchData(); },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, fetchDokter]);

  // ── Sort helpers ───────────────────────────────────────────────────────

  const handleSortChange = (value: string) => {
    const parts = value.split("-");
    setSortField(parts[0] as SortField);
    setSortOrder(parts[1] as SortOrder);
  };

  const getSortLabel = () => {
    const map: Record<string, string> = {
      "urutan-asc": "Urutan (1-9)",
      "urutan-desc": "Urutan (9-1)",
      "title-asc": "Nama (A-Z)",
      "title-desc": "Nama (Z-A)",
      "created_at-desc": "Terbaru",
      "created_at-asc": "Terlama",
    };
    return map[`${sortField}-${sortOrder}`] ?? "Urutan (1-9)";
  };

  const handleResetFilters = () => {
    setSortField("urutan");
    setSortOrder("asc");
    setSearchQuery("");
    setStatusFilter("all");
  };

  const showReset =
    sortField !== "urutan" ||
    sortOrder !== "asc" ||
    searchQuery !== "" ||
    statusFilter !== "all";

  // ── Pagination ─────────────────────────────────────────────────────────

  const totalItems = filteredData.length;
  const perPage = itemsPerPage === "all" ? totalItems : (itemsPerPage as number);
  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(totalItems / perPage);
  const startIndex = itemsPerPage === "all" ? 0 : (currentPage - 1) * perPage;
  const endIndex = itemsPerPage === "all" ? totalItems : startIndex + perPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // ── Selection ──────────────────────────────────────────────────────────

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(
      checked ? new Set(currentData.map((item) => item.id)) : new Set(),
    );
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    checked ? newSelected.add(id) : newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    currentData.length > 0 &&
    currentData.every((item) => selectedIds.has(item.id));
  const isSomeSelected =
    currentData.some((item) => selectedIds.has(item.id)) && !isAllSelected;

  // ── Dialog helpers ─────────────────────────────────────────────────────

  const handleOpenDialog = async (item?: LayananUnggulan) => {
    setDokterSearch("");
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        specializations:
          item.specializations?.length > 0 ? item.specializations : [],
        additional_info: item.additional_info ?? "",
        icon: item.icon ?? "",
        status: item.status,
        urutan: item.urutan,
        selected_dokter_ids:
          item.layanan_unggulan_dokter?.map((d) => d.dokter_id) ?? [],
        kondisi:
          item.layanan_unggulan_kondisi?.length > 0
            ? [...item.layanan_unggulan_kondisi].sort(
                (a, b) => a.urutan - b.urutan,
              )
            : [],
        teknologi:
          item.layanan_unggulan_teknologi?.length > 0
            ? [...item.layanan_unggulan_teknologi].sort(
                (a, b) => a.urutan - b.urutan,
              )
            : [],
      });
    } else {
      setSelectedItem(null);
      const { data: urtData } = await supabase
        .from("layanan_unggulan")
        .select("urutan")
        .order("urutan", { ascending: false })
        .limit(1);
      const nextUrutan =
        urtData && urtData.length > 0 ? (urtData[0].urutan as number) + 1 : 1;
      setFormData({ ...DEFAULT_FORM_DATA, urutan: nextUrutan });
    }
    setFormErrors(DEFAULT_FORM_ERRORS);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setFormData(DEFAULT_FORM_DATA);
      setFormErrors(DEFAULT_FORM_ERRORS);
      setDokterSearch("");
    }, 200);
  };

  const handleOpenDetail = (item: LayananUnggulan) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  // ── Validation ─────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FormErrorsType = { title: "", description: "", icon: "" };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = "Judul layanan wajib diisi";
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      errors.title = "Judul minimal 3 karakter";
      isValid = false;
    }
    if (!formData.description.trim()) {
      errors.description = "Deskripsi wajib diisi";
      isValid = false;
    }
    if (!formData.icon.trim()) {
      errors.icon = "Icon wajib dipilih";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Mohon periksa kembali form Anda");
      return;
    }
    setSubmitting(true);

    try {
      const cleanedSpecializations = formData.specializations.filter(
        (s) => s.trim() !== "",
      );
      const cleanedKondisi = formData.kondisi.filter(
        (k) => k.title.trim() !== "",
      );
      const cleanedTeknologi = formData.teknologi.filter(
        (t) => t.title.trim() !== "",
      );

      let layananId: string;

      if (selectedItem) {
        // ── UPDATE: simpan updated_by ──
        const { error } = await supabase
          .from("layanan_unggulan")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            specializations: cleanedSpecializations,
            additional_info: formData.additional_info.trim() || null,
            icon: formData.icon.trim(),
            status: formData.status,
            urutan: formData.urutan,
            updated_by: currentUserId,          // ← simpan siapa yang update
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedItem.id);
        if (error) throw error;
        layananId = selectedItem.id;
        toast.success("Layanan unggulan berhasil diperbarui");
      } else {
        // ── INSERT: simpan created_by ──
        const { data: inserted, error } = await supabase
          .from("layanan_unggulan")
          .insert([{
            title: formData.title.trim(),
            description: formData.description.trim(),
            specializations: cleanedSpecializations,
            additional_info: formData.additional_info.trim() || null,
            icon: formData.icon.trim(),
            status: formData.status,
            urutan: formData.urutan,
            created_by: currentUserId,          // ← simpan siapa yang buat
          }])
          .select("id")
          .single();
        if (error) throw error;
        layananId = (inserted as { id: string }).id;
        toast.success("Layanan unggulan berhasil ditambahkan");
      }

      // Dokter
      await supabase
        .from("layanan_unggulan_dokter")
        .delete()
        .eq("layanan_unggulan_id", layananId);
      if (formData.selected_dokter_ids.length > 0) {
        const { error } = await supabase.from("layanan_unggulan_dokter").insert(
          formData.selected_dokter_ids.map((dokter_id) => ({
            layanan_unggulan_id: layananId,
            dokter_id,
          })),
        );
        if (error) throw error;
      }

      // Kondisi
      await supabase
        .from("layanan_unggulan_kondisi")
        .delete()
        .eq("layanan_unggulan_id", layananId);
      if (cleanedKondisi.length > 0) {
        const { error } = await supabase
          .from("layanan_unggulan_kondisi")
          .insert(
            cleanedKondisi.map((k, i) => ({
              layanan_unggulan_id: layananId,
              title: k.title.trim(),
              description: k.description.trim(),
              urutan: i,
            })),
          );
        if (error) throw error;
      }

      // Teknologi
      await supabase
        .from("layanan_unggulan_teknologi")
        .delete()
        .eq("layanan_unggulan_id", layananId);
      if (cleanedTeknologi.length > 0) {
        const { error } = await supabase
          .from("layanan_unggulan_teknologi")
          .insert(
            cleanedTeknologi.map((t, i) => ({
              layanan_unggulan_id: layananId,
              title: t.title.trim(),
              description: t.description.trim(),
              urutan: i,
            })),
          );
        if (error) throw error;
      }

      handleCloseDialog();
      await fetchData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : selectedItem
            ? "Gagal memperbarui layanan unggulan"
            : "Gagal menambahkan layanan unggulan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────

  const handleOpenDeleteDialog = (item: LayananUnggulan) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("layanan_unggulan")
        .delete()
        .eq("id", selectedItem.id);
      if (error) throw error;
      toast.success("Layanan unggulan berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      await fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus layanan unggulan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("layanan_unggulan")
        .delete()
        .in("id", Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} layanan unggulan berhasil dihapus`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      await fetchData();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Gagal menghapus layanan unggulan");
    } finally {
      setSubmitting(false);
    }
  };

  // ── List helpers ───────────────────────────────────────────────────────

  const addSpecialization = () =>
    setFormData((prev) => ({
      ...prev,
      specializations: [...prev.specializations, ""],
    }));

  const removeSpecialization = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));

  const updateSpecialization = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.specializations];
      updated[index] = value;
      return { ...prev, specializations: updated };
    });
  };

  const addKondisi = () =>
    setFormData((prev) => ({
      ...prev,
      kondisi: [
        ...prev.kondisi,
        { title: "", description: "", urutan: prev.kondisi.length },
      ],
    }));

  const removeKondisi = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      kondisi: prev.kondisi.filter((_, i) => i !== index),
    }));

  const updateKondisi = (
    index: number,
    field: keyof KondisiItem,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.kondisi];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, kondisi: updated };
    });
  };

  const addTeknologi = () =>
    setFormData((prev) => ({
      ...prev,
      teknologi: [
        ...prev.teknologi,
        { title: "", description: "", urutan: prev.teknologi.length },
      ],
    }));

  const removeTeknologi = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      teknologi: prev.teknologi.filter((_, i) => i !== index),
    }));

  const updateTeknologi = (
    index: number,
    field: keyof TeknologiItem,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.teknologi];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, teknologi: updated };
    });
  };

  const toggleDokter = (dokterId: string) => {
    setFormData((prev) => {
      const ids = new Set(prev.selected_dokter_ids);
      ids.has(dokterId) ? ids.delete(dokterId) : ids.add(dokterId);
      return { ...prev, selected_dokter_ids: Array.from(ids) };
    });
  };

  // ── Sort options ───────────────────────────────────────────────────────

  const sortOptions = [
    { value: "urutan-asc", label: "Urutan (1-9)" },
    { value: "urutan-desc", label: "Urutan (9-1)" },
    { value: "title-asc", label: "Nama (A-Z)" },
    { value: "title-desc", label: "Nama (Z-A)" },
    { value: "created_at-desc", label: "Terbaru" },
    { value: "created_at-asc", label: "Terlama" },
  ];

  // ── Loading ────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────

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
            <BreadcrumbPage>Layanan Unggulan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Layanan Unggulan
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola layanan unggulan rumah sakit
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => { void handleOpenDialog(); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Layanan
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Layanan Unggulan ({totalItems})</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari layanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 shrink-0" />
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

              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
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
                  <TableHead className="w-12">No</TableHead>
                  <TableHead className="w-12">Icon</TableHead>
                  <TableHead className="min-w-[150px]">Judul</TableHead>
                  <TableHead className="w-[220px]">Deskripsi</TableHead>
                  <TableHead className="w-24">Dokter</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-16">Urutan</TableHead>
                  <TableHead className="w-40">Dibuat</TableHead>
                  <TableHead className="text-right w-36">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery || statusFilter !== "all"
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data layanan unggulan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((item, index) => (
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
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          {renderIcon(item.icon)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium line-clamp-2">{item.title}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2 w-[220px]">
                          {item.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {item.layanan_unggulan_dokter?.length > 0 ? (
                          <Badge variant="secondary">
                            {item.layanan_unggulan_dokter.length} Dokter
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300"
                          }
                        >
                          {item.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {item.urutan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage
                              src={item.created_by_user?.avatar}
                              alt={item.created_by_user?.nama || "User"}
                            />
                            <AvatarFallback className="text-[10px]">
                              {item.created_by_user?.nama?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleOpenDetail(item)}
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Detail</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => { void handleOpenDialog(item); }}
                                  className="h-8 w-8"
                                  disabled={submitting}
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
                                  onClick={() => handleOpenDeleteDialog(item)}
                                  className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white hover:text-white"
                                  disabled={submitting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Hapus</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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

      {/* ═══════════════════════════
          Detail Dialog
      ═══════════════════════════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && (
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                  {renderIcon(selectedItem.icon)}
                </span>
              )}
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              Detail lengkap layanan unggulan
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2">
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    selectedItem.status === "active"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }
                >
                  {selectedItem.status === "active" ? "Aktif" : "Nonaktif"}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Urutan: {selectedItem.urutan}
                </Badge>
              </div>

              {/* ── Audit box — identik dengan berita ── */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                {/* Dibuat oleh */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage
                      src={selectedItem.created_by_user?.avatar}
                      alt={selectedItem.created_by_user?.nama || "User"}
                    />
                    <AvatarFallback className="text-[10px]">
                      {selectedItem.created_by_user?.nama?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Dibuat oleh{" "}
                    <span className="font-medium text-foreground">
                      {selectedItem.created_by_user?.nama ?? "-"}
                    </span>
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{formatDateTime(selectedItem.created_at)}</span>
                </div>

                {/* Diperbarui oleh — hanya tampil jika ada */}
                {selectedItem.updated_by_user && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage
                        src={selectedItem.updated_by_user.avatar}
                        alt={selectedItem.updated_by_user.nama || "User"}
                      />
                      <AvatarFallback className="text-[10px]">
                        {selectedItem.updated_by_user.nama?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Diperbarui oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedItem.updated_by_user.nama}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(selectedItem.updated_at)}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Deskripsi
                </p>
                <p className="text-sm leading-relaxed">{selectedItem.description}</p>
              </div>

              {selectedItem.additional_info && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Informasi Tambahan
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {selectedItem.additional_info}
                  </p>
                </div>
              )}

              {selectedItem.specializations?.length > 0 && (
                <div>
                  <Separator className="mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Layanan / Spesialisasi ({selectedItem.specializations.length})
                  </p>
                  <ul className="space-y-1">
                    {selectedItem.specializations.map((spec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.layanan_unggulan_dokter?.length > 0 && (
                <div>
                  <Separator className="mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Dokter ({selectedItem.layanan_unggulan_dokter.length})
                  </p>
                  <div className="space-y-1">
                    {selectedItem.layanan_unggulan_dokter.map((d) => (
                      <div
                        key={d.dokter_id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                      >
                        <span className="text-sm font-medium">
                          {d.dokter?.nama ?? "—"}
                        </span>
                        {d.dokter?.poli?.nama_poli && (
                          <span className="text-xs text-muted-foreground">
                            {d.dokter.poli.nama_poli}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.layanan_unggulan_kondisi?.length > 0 && (
                <div>
                  <Separator className="mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Kondisi Medis ({selectedItem.layanan_unggulan_kondisi.length})
                  </p>
                  <div className="space-y-2">
                    {[...selectedItem.layanan_unggulan_kondisi]
                      .sort((a, b) => a.urutan - b.urutan)
                      .map((k, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <p className="text-sm font-medium">{k.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {k.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedItem.layanan_unggulan_teknologi?.length > 0 && (
                <div>
                  <Separator className="mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Teknologi Medis ({selectedItem.layanan_unggulan_teknologi.length})
                  </p>
                  <div className="space-y-2">
                    {[...selectedItem.layanan_unggulan_teknologi]
                      .sort((a, b) => a.urutan - b.urutan)
                      .map((t, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setDetailDialogOpen(false);
                if (selectedItem) { void handleOpenDialog(selectedItem); }
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════
          Add / Edit Dialog
      ═══════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {selectedItem ? "Edit Layanan Unggulan" : "Tambah Layanan Unggulan"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? "Update informasi layanan unggulan"
                : "Tambah layanan unggulan baru"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => { void handleSubmit(e); }}
            className="flex flex-col flex-1 min-h-0"
          >
            <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0">
              <TabsList className="shrink-0 w-full grid grid-cols-4">
                <TabsTrigger value="info">Info Dasar</TabsTrigger>
                <TabsTrigger value="spesialisasi">
                  Spesialisasi
                  {formData.specializations.filter((s) => s.trim()).length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.specializations.filter((s) => s.trim()).length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="kondisi">
                  Kondisi
                  {formData.kondisi.filter((k) => k.title.trim()).length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.kondisi.filter((k) => k.title.trim()).length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="teknologi">
                  Teknologi
                  {formData.teknologi.filter((t) => t.title.trim()).length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.teknologi.filter((t) => t.title.trim()).length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: Info Dasar ── */}
              <TabsContent
                value="info"
                className="flex-1 overflow-y-auto mt-3 space-y-4 pr-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Judul Layanan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (formErrors.title)
                          setFormErrors({ ...formErrors, title: "" });
                      }}
                      placeholder="Contoh: Jantung Care"
                      disabled={submitting}
                      className={formErrors.title ? "border-red-500" : ""}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-red-500">{formErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urutan">
                      Urutan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="urutan"
                      type="number"
                      min={0}
                      value={formData.urutan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          urutan: parseInt(e.target.value) || 0,
                        })
                      }
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Angka lebih kecil tampil lebih awal
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Deskripsi <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description)
                        setFormErrors({ ...formErrors, description: "" });
                    }}
                    placeholder="Deskripsi singkat layanan unggulan..."
                    disabled={submitting}
                    rows={3}
                    className={cn(
                      "resize-y",
                      formErrors.description ? "border-red-500" : "",
                    )}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-red-500">{formErrors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Informasi Tambahan</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) =>
                      setFormData({ ...formData, additional_info: e.target.value })
                    }
                    placeholder="Informasi tambahan (opsional)..."
                    disabled={submitting}
                    rows={2}
                    className="resize-y"
                  />
                </div>

                {selectedItem !== null && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <IconSelector
                  value={formData.icon}
                  onChange={(iconName) => {
                    setFormData({ ...formData, icon: iconName });
                    if (formErrors.icon)
                      setFormErrors({ ...formErrors, icon: "" });
                  }}
                  error={formErrors.icon}
                  disabled={submitting}
                />

                <SectionHeading>Dokter</SectionHeading>

                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      value={dokterSearch}
                      onChange={(e) => setDokterSearch(e.target.value)}
                      placeholder="Cari nama dokter atau poli..."
                      className="pl-10"
                      disabled={submitting}
                    />
                  </div>

                  {filteredDokterList.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2 px-1">
                      {dokterSearch
                        ? "Dokter tidak ditemukan."
                        : "Tidak ada dokter aktif."}
                    </p>
                  ) : (
                    <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                      {filteredDokterList.map((dokter) => (
                        <label
                          key={dokter.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.selected_dokter_ids.includes(dokter.id)}
                            onCheckedChange={() => toggleDokter(dokter.id)}
                            disabled={submitting}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{dokter.nama}</p>
                            {dokter.poli?.nama_poli && (
                              <p className="text-xs text-muted-foreground">
                                {dokter.poli.nama_poli}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {formData.selected_dokter_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.selected_dokter_ids.length} dokter dipilih
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* ── Tab: Spesialisasi ── */}
              <TabsContent
                value="spesialisasi"
                className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecialization}
                    disabled={submitting}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {formData.specializations.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <p className="text-xs text-muted-foreground">Belum ada spesialisasi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.specializations.map((spec, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium">
                            Spesialisasi #{index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpecialization(index)}
                            disabled={submitting}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={spec}
                          onChange={(e) =>
                            updateSpecialization(index, e.target.value)
                          }
                          placeholder={`Nama spesialisasi ${index + 1}...`}
                          disabled={submitting}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Tab: Kondisi Medis ── */}
              <TabsContent
                value="kondisi"
                className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addKondisi}
                    disabled={submitting}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {formData.kondisi.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <p className="text-xs text-muted-foreground">Belum ada kondisi medis</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.kondisi.map((k, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Kondisi #{index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKondisi(index)}
                            disabled={submitting}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={k.title}
                          onChange={(e) =>
                            updateKondisi(index, "title", e.target.value)
                          }
                          placeholder="Judul kondisi medis..."
                          disabled={submitting}
                          className="h-8 text-xs"
                        />
                        <Textarea
                          value={k.description}
                          onChange={(e) =>
                            updateKondisi(index, "description", e.target.value)
                          }
                          placeholder="Deskripsi kondisi medis..."
                          disabled={submitting}
                          rows={2}
                          className="resize-y text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Tab: Teknologi Medis ── */}
              <TabsContent
                value="teknologi"
                className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTeknologi}
                    disabled={submitting}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {formData.teknologi.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <p className="text-xs text-muted-foreground">Belum ada teknologi medis</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.teknologi.map((t, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Teknologi #{index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeknologi(index)}
                            disabled={submitting}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={t.title}
                          onChange={(e) =>
                            updateTeknologi(index, "title", e.target.value)
                          }
                          placeholder="Judul teknologi medis..."
                          disabled={submitting}
                          className="h-8 text-xs"
                        />
                        <Textarea
                          value={t.description}
                          onChange={(e) =>
                            updateTeknologi(index, "description", e.target.value)
                          }
                          placeholder="Deskripsi teknologi medis..."
                          disabled={submitting}
                          rows={2}
                          className="resize-y text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="shrink-0 mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
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

      {/* ── Delete ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan Unggulan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus layanan{" "}
              <strong>{selectedItem?.title}</strong>? Semua data terkait
              (kondisi, teknologi, dokter) akan ikut terhapus. Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleDelete(); }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete ── */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedIds.size} Layanan Unggulan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} layanan
              unggulan yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleBulkDelete(); }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white hover:text-white"
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