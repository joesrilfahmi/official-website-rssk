// app/(dashboard)/jadwal-dokter/page.tsx
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { deleteFile, getFilePathFromUrl, uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { validateImage } from "@/lib/validasi/validasiImage";
import type {
  DokterFormData,
  DokterFormErrors,
  DokterStatus,
  DokterWithRelations,
  HariType,
  JadwalDokter,
  JadwalType,
  Poli,
} from "@/types";
import {
  Calendar,
  Check,
  ChevronsUpDown,
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

const DEFAULT_FORM_DATA: DokterFormData = {
  nama: "",
  poli_id: "",
  profile: "",
  status: "active",
  profileFile: null,
  profileDeleted: false,
  jadwal: [],
};

const DEFAULT_FORM_ERRORS: DokterFormErrors = {
  nama: "",
  poli_id: "",
  jadwal: "",
};

const STATUS_OPTIONS: { value: DokterStatus; label: string; color: string }[] =
  [
    {
      value: "active",
      label: "Aktif",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700",
    },
    {
      value: "inactive",
      label: "Tidak Aktif",
      color:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700",
    },
    {
      value: "cuti",
      label: "Cuti",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700",
    },
    {
      value: "libur",
      label: "Libur",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
    },
  ];

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
] as const;

const HARI_OPTIONS: HariType[] = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

// const generateTimeOptions = () => {
//   const options = [];
//   for (let hour = 0; hour < 24; hour++) {
//     for (let minute = 0; minute < 60; minute += 30) {
//       const hourStr = hour.toString().padStart(2, "0");
//       const minuteStr = minute.toString().padStart(2, "0");
//       options.push(`${hourStr}.${minuteStr}`);
//     }
//   }
//   return options;
// };

// const TIME_OPTIONS = generateTimeOptions();

export default function JadwalDokterPage() {
  const [dokterList, setDokterList] = useState<DokterWithRelations[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<DokterWithRelations[]>(
    [],
  );
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDokter, setSelectedDokter] =
    useState<DokterWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DokterStatus | "all">("all");
  const [poliFilter, setPoliFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">(
    "newest",
  );

  const [formData, setFormData] = useState<DokterFormData>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] =
    useState<DokterFormErrors>(DEFAULT_FORM_ERRORS);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [poliPopoverOpen, setPoliPopoverOpen] = useState(false);
  const [hariPopoverOpen, setHariPopoverOpen] = useState<
    Record<string, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const toggleHariPopover = (tempId: string, open: boolean) => {
    setHariPopoverOpen((prev) => ({ ...prev, [tempId]: open }));
  };
  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setShowAccessDenied(true);
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

  const fetchDokter = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dokter")
        .select(
          `
          *,
          poli_detail:poli_id (id, nama_poli, status),
          jadwal:jadwal_dokter (id, dokter_id, hari, jam_mulai, jam_selesai, tipe_jadwal, created_at, updated_at),
          created_by_user:created_by (id, nama, username, avatar),
          updated_by_user:updated_by (id, nama, username, avatar)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDokterList(data || []);
      setFilteredDokter(data || []);
    } catch (error) {
      console.error("Error fetching dokter:", error);
      toast.error("Gagal memuat data dokter");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPoli = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("poli")
        .select("*")
        .eq("status", "active")
        .order("nama_poli");
      if (error) throw error;
      setPoliList(data || []);
    } catch (error) {
      console.error("Error fetching poli:", error);
    }
  }, []);

  useEffect(() => {
    fetchDokter();
    fetchPoli();
  }, [fetchDokter, fetchPoli]);

  useEffect(() => {
    let filtered = [...dokterList];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.poli_detail?.nama_poli
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (poliFilter !== "all") {
      filtered = filtered.filter((item) => item.poli_id === poliFilter);
    }

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
          return a.nama.localeCompare(b.nama, "id");
        case "z-a":
          return b.nama.localeCompare(a.nama, "id");
        default:
          return 0;
      }
    });

    setFilteredDokter(filtered);
    setCurrentPage(1);
  }, [dokterList, debouncedSearch, statusFilter, poliFilter, sortBy]);

  const paginatedDokter = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDokter.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDokter, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDokter.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
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
    }
    return pages;
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedDokter.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const getStatusBadge = (status: DokterStatus) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    if (!statusOption) return null;
    return (
      <Badge variant="outline" className={statusOption.color}>
        {statusOption.label}
      </Badge>
    );
  };

  const handleOpenDialog = (item?: DokterWithRelations) => {
    if (item) {
      setSelectedDokter(item);
      setFormData({
        nama: item.nama,
        poli_id: item.poli_id,
        profile: item.profile || "",
        status: item.status,
        profileFile: null,
        profileDeleted: false,
        jadwal: (item.jadwal || []).map((j) => ({
          id: j.id,
          hari: j.hari,
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
          tipe_jadwal: j.tipe_jadwal,
          _temp_id: j.id,
        })),
      });
    } else {
      setSelectedDokter(null);
      setFormData({ ...DEFAULT_FORM_DATA });
    }
    setFormErrors({ ...DEFAULT_FORM_ERRORS });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedDokter(null);
      setFormData({ ...DEFAULT_FORM_DATA });
      setFormErrors({ ...DEFAULT_FORM_ERRORS });
    }, 200);
  };

  const handleOpenDetailDialog = (item: DokterWithRelations) => {
    setSelectedDokter(item);
    setDetailDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: DokterWithRelations) => {
    setSelectedDokter(item);
    setDeleteDialogOpen(true);
  };

  const handleAddJadwal = (tipe: JadwalType) => {
    setFormData({
      ...formData,
      jadwal: [
        ...formData.jadwal,
        {
          hari: "",
          jam_mulai: "",
          jam_selesai: "",
          tipe_jadwal: tipe,
          _temp_id: `temp_${Date.now()}`,
        },
      ],
    });
  };

  const handleRemoveJadwal = (tempId: string) => {
    setFormData({
      ...formData,
      jadwal: formData.jadwal.filter((j) => j._temp_id !== tempId),
    });
  };

  const handleJadwalChange = (tempId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      jadwal: formData.jadwal.map((j) =>
        j._temp_id === tempId ? { ...j, [field]: value } : j,
      ),
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || "File tidak valid");
      return;
    }
    setFormData({ ...formData, profileFile: file, profileDeleted: false });
  };

  const validateForm = () => {
    const errors: DokterFormErrors = { ...DEFAULT_FORM_ERRORS };
    let isValid = true;

    if (!formData.nama.trim()) {
      errors.nama = "Nama dokter wajib diisi";
      isValid = false;
    }
    if (!formData.poli_id) {
      errors.poli_id = "Poli wajib dipilih";
      isValid = false;
    }

    if (formData.jadwal.length > 0) {
      const timeFormatRegex = /^\d{2}\.\d{2}$/;
      for (const j of formData.jadwal) {
        if (!j.hari || !j.jam_mulai || !j.jam_selesai || !j.tipe_jadwal) {
          errors.jadwal = "Semua field jadwal harus diisi";
          isValid = false;
          break;
        }
        if (
          !timeFormatRegex.test(j.jam_mulai) ||
          !timeFormatRegex.test(j.jam_selesai)
        ) {
          errors.jadwal = "Format jam harus 00.00";
          isValid = false;
          break;
        }
        const [mH, mM] = j.jam_mulai.split(".").map(Number);
        const [sH, sM] = j.jam_selesai.split(".").map(Number);
        if (sH * 60 + sM <= mH * 60 + mM) {
          errors.jadwal = "Jam selesai harus lebih besar dari jam mulai";
          isValid = false;
          break;
        }
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
    let newUploadedPath: string | null = null;

    try {
      let finalProfileUrl: string | null = null;

      if (formData.profileFile) {
        const uploadResult = await uploadFile({
          bucket: "dokter",
          folder: currentUserId,
          file: formData.profileFile,
        });
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Gagal mengupload profile");
        }
        finalProfileUrl = uploadResult.url || null;
        newUploadedPath = uploadResult.path || null;
      } else if (formData.profileDeleted) {
        finalProfileUrl = null;
      } else {
        finalProfileUrl = selectedDokter?.profile || null;
      }

      const dokterData = {
        nama: formData.nama,
        poli_id: formData.poli_id,
        profile: finalProfileUrl,
        status: formData.status,
        ...(selectedDokter
          ? { updated_by: currentUserId }
          : { created_by: currentUserId }),
      };

      let dokterId: string;

      if (selectedDokter) {
        const { data, error } = await supabase
          .from("dokter")
          .update(dokterData)
          .eq("id", selectedDokter.id)
          .select()
          .single();
        if (error) throw error;
        dokterId = data.id;
        await supabase.from("jadwal_dokter").delete().eq("dokter_id", dokterId);
      } else {
        const { data, error } = await supabase
          .from("dokter")
          .insert([dokterData])
          .select()
          .single();
        if (error) throw error;
        dokterId = data.id;
      }

      if (formData.jadwal.length > 0) {
        const jadwalToInsert = formData.jadwal.map((j) => ({
          dokter_id: dokterId,
          hari: j.hari as HariType,
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
          tipe_jadwal: j.tipe_jadwal as JadwalType,
          created_by: currentUserId,
        }));
        const { error: jadwalError } = await supabase
          .from("jadwal_dokter")
          .insert(jadwalToInsert);
        if (jadwalError) throw jadwalError;
      }

      if (
        selectedDokter?.profile &&
        (formData.profileFile || formData.profileDeleted)
      ) {
        const oldPath = getFilePathFromUrl(
          selectedDokter.profile,
          "dokter-profiles",
        );
        if (oldPath) await deleteFile("dokter-profiles", oldPath);
      }

      toast.success(
        selectedDokter
          ? "Dokter berhasil diperbarui"
          : "Dokter berhasil ditambahkan",
      );
      handleCloseDialog();
      fetchDokter();
    } catch (error) {
      console.error("Error saving dokter:", error);
      if (newUploadedPath) await deleteFile("dokter-profiles", newUploadedPath);
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan data dokter",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDokter) return;
    setSubmitting(true);

    try {
      if (selectedDokter.profile) {
        const path = getFilePathFromUrl(
          selectedDokter.profile,
          "dokter-profiles",
        );
        if (path) await deleteFile("dokter-profiles", path);
      }
      const { error } = await supabase
        .from("dokter")
        .delete()
        .eq("id", selectedDokter.id);
      if (error) throw error;

      toast.success("Dokter berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedDokter(null);
      fetchDokter();
    } catch (error) {
      console.error("Error deleting dokter:", error);
      toast.error("Gagal menghapus dokter");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);

    try {
      for (const id of selectedItems) {
        const item = dokterList.find((d) => d.id === id);
        if (item?.profile) {
          const path = getFilePathFromUrl(item.profile, "dokter-profiles");
          if (path) await deleteFile("dokter-profiles", path);
        }
        const { error } = await supabase.from("dokter").delete().eq("id", id);
        if (error) throw error;
      }

      toast.success(`${selectedItems.length} dokter berhasil dihapus`);
      setSelectedItems([]);
      setBulkDeleteDialogOpen(false);
      fetchDokter();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Gagal menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const HariSelect = ({
    jadwal,
    disabled,
  }: {
    jadwal: (typeof formData.jadwal)[0];
    disabled: boolean;
  }) => (
    <Popover
      open={!!hariPopoverOpen[jadwal._temp_id]}
      onOpenChange={(open) => toggleHariPopover(jadwal._temp_id, open)}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full h-8 justify-between font-normal text-xs px-2",
            !jadwal.hari && "text-muted-foreground",
          )}
        >
          <span className="truncate">{jadwal.hari || "Pilih hari"}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari hari..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-2 text-center">
              Hari tidak ditemukan.
            </CommandEmpty>
            <CommandGroup>
              {HARI_OPTIONS.map((h) => (
                <CommandItem
                  key={h}
                  value={h}
                  onSelect={() => {
                    handleJadwalChange(jadwal._temp_id, "hari", h);
                    toggleHariPopover(jadwal._temp_id, false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      jadwal.hari === h ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {h}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

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
            <BreadcrumbPage>Jadwal Dokter</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Jadwal Dokter
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
              Kelola data dokter dan jadwal praktik
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
              <span className="hidden sm:inline truncate">Tambah Dokter</span>
              <span className="sm:hidden truncate">Tambah</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {paginatedDokter.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedItems.length === paginatedDokter.length &&
                  paginatedDokter.length > 0
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

          {/* Desktop filters */}
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
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

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as DokterStatus | "all")
              }
            >
              <SelectTrigger className="w-[140px] h-9">
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

            <Select value={poliFilter} onValueChange={setPoliFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Semua Poli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>
                {poliList.map((poli) => (
                  <SelectItem key={poli.id} value={poli.id}>
                    {poli.nama_poli}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-[200px] lg:w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari dokter, poli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>

        {/* Mobile filters */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex gap-2">
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

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as DokterStatus | "all")
              }
            >
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={poliFilter} onValueChange={setPoliFilter}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Poli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>
                {poliList.map((poli) => (
                  <SelectItem key={poli.id} value={poli.id}>
                    {poli.nama_poli}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari dokter, poli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        ) : filteredDokter.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 lg:py-16">
              <div className="rounded-full bg-muted p-3 mb-3 sm:mb-4">
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground">
                Tidak ada dokter ditemukan
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" || poliFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Mulai dengan menambahkan dokter baru"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedDokter.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer relative"
                  onClick={() => handleOpenDetailDialog(item)}
                >
                  {/* Checkbox */}
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

                  {/* Foto Dokter */}
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.profile ? (
                      <Image
                        src={item.profile}
                        alt={item.nama}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-24 w-24 text-muted-foreground/30"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {getStatusBadge(item.status)}
                        <Badge variant="outline" className="text-xs">
                          {item.poli_detail?.nama_poli || "-"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base lg:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {item.nama}
                      </h3>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage
                            src={item.created_by_user?.avatar}
                            alt={item.created_by_user?.nama || "User"}
                          />
                          <AvatarFallback className="text-xs">
                            {item.created_by_user?.nama
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.created_by_user?.nama}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                          •
                        </span>
                        <Calendar className="h-3 w-3 shrink-0 hidden sm:block" />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
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

                      {/* Action Buttons */}
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
                {/* Desktop */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredDokter.length,
                    )}{" "}
                    dari {filteredDokter.length} dokter
                  </div>
                  <div className="flex-1" />
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

                {/* Mobile */}
                <div className="flex sm:hidden flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground text-center">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredDokter.length,
                    )}{" "}
                    dari {filteredDokter.length} dokter
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={`h-8 px-2 text-xs ${
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }`}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <div className="h-8 px-2 flex items-center justify-center text-xs font-medium min-w-[60px]">
                          {currentPage} / {totalPages}
                        </div>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={`h-8 px-2 text-xs ${
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

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedDokter ? "Edit Dokter" : "Tambah Dokter Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedDokter
                ? "Perbarui informasi dokter"
                : "Isi form di bawah untuk menambahkan dokter baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Upload Foto */}
            <div className="space-y-2">
              <Label className="text-sm">Foto Profile</Label>
              {(formData.profile || formData.profileFile) &&
              !formData.profileDeleted ? (
                <div className="relative w-full h-48 rounded-md overflow-hidden border">
                  <Image
                    src={
                      formData.profileFile
                        ? URL.createObjectURL(formData.profileFile)
                        : formData.profile
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
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        profileFile: null,
                        profileDeleted: true,
                      });
                    }}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      const validation = validateImage(file);
                      if (!validation.valid) {
                        toast.error(validation.error || "File tidak valid");
                        return;
                      }
                      setFormData({
                        ...formData,
                        profileFile: file,
                        profileDeleted: false,
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Input
                    id="profile-upload"
                    type="file"
                    accept="image/webp"
                    onChange={handleProfileChange}
                    disabled={submitting}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-upload"
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
              )}
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-sm">
                Nama Dokter <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => {
                  setFormData({ ...formData, nama: e.target.value });
                  if (formErrors.nama)
                    setFormErrors({ ...formErrors, nama: "" });
                }}
                disabled={submitting}
                placeholder="Masukkan nama dokter"
                className={formErrors.nama ? "border-red-500" : ""}
              />
              {formErrors.nama && (
                <p className="text-sm text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Poli & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">
                  Poli <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={poliPopoverOpen}
                  onOpenChange={setPoliPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={poliPopoverOpen}
                      disabled={submitting}
                      className={cn(
                        "w-full justify-between font-normal",
                        formErrors.poli_id && "border-red-500",
                        !formData.poli_id && "text-muted-foreground",
                      )}
                    >
                      {formData.poli_id
                        ? poliList.find((p) => p.id === formData.poli_id)
                            ?.nama_poli
                        : "Pilih poli"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari poli..." />
                      <CommandList>
                        <CommandEmpty>Poli tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {poliList.map((poli) => (
                            <CommandItem
                              key={poli.id}
                              value={poli.nama_poli}
                              onSelect={() => {
                                setFormData({ ...formData, poli_id: poli.id });
                                if (formErrors.poli_id)
                                  setFormErrors({ ...formErrors, poli_id: "" });
                                setPoliPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.poli_id === poli.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {poli.nama_poli}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.poli_id && (
                  <p className="text-sm text-red-500">{formErrors.poli_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as DokterStatus })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            {/* Jadwal */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-semibold">Jadwal Praktik</Label>
              {formErrors.jadwal && (
                <p className="text-sm text-red-500">{formErrors.jadwal}</p>
              )}

              {/* Jadwal Reguler */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Reguler
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddJadwal("reguler")}
                    disabled={submitting}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {formData.jadwal.filter((j) => j.tipe_jadwal === "reguler")
                  .length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Belum ada jadwal reguler
                    </p>
                  </div>
                ) : (
                  formData.jadwal
                    .filter((j) => j.tipe_jadwal === "reguler")
                    .map((jadwal, index) => (
                      <div
                        key={jadwal._temp_id}
                        className="p-3 border rounded-lg space-y-2 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Reguler #{index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveJadwal(jadwal._temp_id)}
                            disabled={submitting}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Hari</Label>
                            <HariSelect jadwal={jadwal} disabled={submitting} />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Jam Mulai</Label>
                            <Input
                              value={jadwal.jam_mulai}
                              onChange={(e) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_mulai",
                                  e.target.value,
                                )
                              }
                              disabled={submitting}
                              placeholder="09.00"
                              maxLength={5}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Jam Selesai</Label>
                            <Input
                              value={jadwal.jam_selesai}
                              onChange={(e) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_selesai",
                                  e.target.value,
                                )
                              }
                              disabled={submitting}
                              placeholder="17.00"
                              maxLength={5}
                              className="h-8 text-xs"
                            />
                          </div>

                          {/* <div className="space-y-1">
                            <Label className="text-xs">Jam Mulai</Label>
                            <Select
                              value={jadwal.jam_mulai}
                              onValueChange={(value) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_mulai",
                                  value,
                                )
                              }
                              disabled={submitting}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih jam" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Jam Selesai</Label>
                            <Select
                              value={jadwal.jam_selesai}
                              onValueChange={(value) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_selesai",
                                  value,
                                )
                              }
                              disabled={submitting}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih jam" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div> */}
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Jadwal Eksekutif */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Eksekutif
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddJadwal("eksekutif")}
                    disabled={submitting}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {formData.jadwal.filter((j) => j.tipe_jadwal === "eksekutif")
                  .length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Belum ada jadwal eksekutif
                    </p>
                  </div>
                ) : (
                  formData.jadwal
                    .filter((j) => j.tipe_jadwal === "eksekutif")
                    .map((jadwal, index) => (
                      <div
                        key={jadwal._temp_id}
                        className="p-3 border rounded-lg space-y-2 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Eksekutif #{index + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveJadwal(jadwal._temp_id)}
                            disabled={submitting}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Hari</Label>
                            <HariSelect jadwal={jadwal} disabled={submitting} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Jam Mulai</Label>
                            <Input
                              value={jadwal.jam_mulai}
                              onChange={(e) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_mulai",
                                  e.target.value,
                                )
                              }
                              disabled={submitting}
                              placeholder="09.00"
                              maxLength={5}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Jam Selesai</Label>
                            <Input
                              value={jadwal.jam_selesai}
                              onChange={(e) =>
                                handleJadwalChange(
                                  jadwal._temp_id,
                                  "jam_selesai",
                                  e.target.value,
                                )
                              }
                              disabled={submitting}
                              placeholder="17.00"
                              maxLength={5}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Detail Dokter
            </DialogTitle>
          </DialogHeader>
          {selectedDokter && (
            <div className="space-y-3 sm:space-y-4">
              <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {selectedDokter.profile ? (
                  <Image
                    src={selectedDokter.profile}
                    alt={selectedDokter.nama}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-28 w-28 text-muted-foreground/30"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {selectedDokter.nama}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedDokter.status)}
                  <Badge variant="outline">
                    {selectedDokter.poli_detail?.nama_poli}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarImage
                      src={selectedDokter.created_by_user?.avatar}
                      alt={selectedDokter.created_by_user?.nama || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {selectedDokter.created_by_user?.nama
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Dibuat oleh {selectedDokter.created_by_user?.nama} •{" "}
                    {new Date(selectedDokter.created_at).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
              </div>

              {/* Detail Jadwal */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Jadwal Praktik</Label>
                {(selectedDokter.jadwal ?? []).length > 0 ? (
                  (() => {
                    const jadwal = selectedDokter.jadwal ?? [];
                    const allRows: {
                      hari: HariType;
                      isFirst: boolean;
                      reguler: JadwalDokter | null;
                      eksekutif: JadwalDokter | null;
                    }[] = [];

                    HARI_OPTIONS.forEach((hari) => {
                      const regulerList = jadwal.filter(
                        (j) => j.hari === hari && j.tipe_jadwal === "reguler",
                      );
                      const eksekutifList = jadwal.filter(
                        (j) => j.hari === hari && j.tipe_jadwal === "eksekutif",
                      );

                      if (
                        regulerList.length === 0 &&
                        eksekutifList.length === 0
                      )
                        return;

                      const maxRows = Math.max(
                        regulerList.length,
                        eksekutifList.length,
                      );
                      for (let i = 0; i < maxRows; i++) {
                        allRows.push({
                          hari,
                          isFirst: i === 0,
                          reguler: regulerList[i] ?? null,
                          eksekutif: eksekutifList[i] ?? null,
                        });
                      }
                    });

                    return (
                      <div className="rounded-lg border overflow-hidden text-sm">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                                Hari
                              </th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                                Jadwal BPJS
                              </th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                                Jadwal Eksekutif
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allRows.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b last:border-b-0"
                              >
                                <td className="px-4 py-2.5">
                                  {row.isFirst ? (
                                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                      <Calendar className="w-4 h-4 shrink-0" />
                                      <span>{row.hari}</span>
                                    </div>
                                  ) : (
                                    <span />
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {row.reguler ? (
                                    `${row.reguler.jam_mulai} - ${row.reguler.jam_selesai}`
                                  ) : (
                                    <span className="text-muted-foreground/40">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {row.eksekutif ? (
                                    `${row.eksekutif.jam_mulai} - ${row.eksekutif.jam_selesai}`
                                  ) : (
                                    <span className="text-muted-foreground/40">
                                      -
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                    Belum ada jadwal praktik
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Tutup
            </Button>
            {selectedDokter && (
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenDialog(selectedDokter);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Hapus Dokter?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus dokter{" "}
              <strong>{selectedDokter?.nama}</strong>? Semua jadwal praktik juga
              akan terhapus. Tindakan ini tidak dapat dibatalkan.
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
              Hapus Beberapa Dokter?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} dokter</strong> yang dipilih?
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
                : `Hapus ${selectedItems.length} Dokter`}
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
