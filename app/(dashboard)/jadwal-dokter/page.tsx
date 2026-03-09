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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  ChevronsUpDown,
  Clock,
  File,
  GraduationCap,
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

// ── Konstanta ────────────────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: DokterFormData = {
  nama: "",
  poli_id: "",
  profile: "",
  status: "active",
  profileFile: null,
  profileDeleted: false,
  jadwal: [],
  pendidikan: [],
  organisasi: [],
  publikasi: [],
  pelatihan: [],
};

const DEFAULT_FORM_ERRORS: DokterFormErrors = {
  nama: "",
  poli_id: "",
  jadwal: "",
  pendidikan: "",
  organisasi: "",
  publikasi: "",
  pelatihan: "",
};

const STATUS_OPTIONS: { value: DokterStatus; label: string; color: string }[] = [
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

// ── Helper format tanggal ────────────────────────────────────────────────────

function formatDate(
  dateStr: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", opts);
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── AuditFooter: reusable footer audit di bawah setiap tabel relasi ──────────

// type AuditItem = {
//   created_at?: string | null;
//   updated_at?: string | null;
//   created_by_user?: { nama?: string | null; avatar?: string | null } | null;
//   updated_by_user?: { nama?: string | null; avatar?: string | null } | null;
// };

// function AuditFooter({ items }: { items: AuditItem[] }) {
//   const last = [...items]
//     .filter((i) => i.updated_by_user || i.created_by_user)
//     .sort(
//       (a, b) =>
//         new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
//         new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
//     )[0];

//   if (!last) return null;

//   const isUpdated = !!last.updated_by_user;
//   const user = isUpdated ? last.updated_by_user : last.created_by_user;
//   const date = last.updated_at ?? last.created_at;

//   return (
//     <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
//       <Avatar className="h-4 w-4 shrink-0">
//         <AvatarImage src={user?.avatar ?? undefined} alt={user?.nama ?? ""} />
//         <AvatarFallback className="text-[9px]">
//           {user?.nama?.charAt(0).toUpperCase()}
//         </AvatarFallback>
//       </Avatar>
//       <span>
//         {isUpdated ? "Diperbarui" : "Dibuat"} oleh{" "}
//         <span className="font-medium text-foreground">{user?.nama ?? "-"}</span>
//       </span>
//       <span className="text-muted-foreground/50">•</span>
//       <Clock className="h-3 w-3 shrink-0" />
//       <span>{formatDateTime(date)}</span>
//     </div>
//   );
// }

// ── Sub-komponen JADWAL di luar komponen utama ───────────────────────────────
// Wajib di luar agar React tidak unmount/remount input saat state berubah

type JadwalItem = DokterFormData["jadwal"][0];

interface HariSelectProps {
  jadwal: JadwalItem;
  disabled: boolean;
  hariPopoverOpen: Record<string, boolean>;
  toggleHariPopover: (tempId: string, open: boolean) => void;
  handleJadwalChange: (tempId: string, field: string, value: string) => void;
}

const HariSelect = ({
  jadwal,
  disabled,
  hariPopoverOpen,
  toggleHariPopover,
  handleJadwalChange,
}: HariSelectProps) => (
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

interface JadwalTabContentProps {
  tipe: JadwalType;
  jadwalList: JadwalItem[];
  submitting: boolean;
  hariPopoverOpen: Record<string, boolean>;
  toggleHariPopover: (tempId: string, open: boolean) => void;
  handleJadwalChange: (tempId: string, field: string, value: string) => void;
  handleAddJadwal: (tipe: JadwalType) => void;
  handleRemoveJadwal: (tempId: string) => void;
}

const JadwalTabContent = ({
  tipe,
  jadwalList,
  submitting,
  hariPopoverOpen,
  toggleHariPopover,
  handleJadwalChange,
  handleAddJadwal,
  handleRemoveJadwal,
}: JadwalTabContentProps) => {
  const filtered = jadwalList.filter((j) => j.tipe_jadwal === tipe);

  return (
    <TabsContent value={tipe} className="space-y-2 mt-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddJadwal(tipe)}
          disabled={submitting}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Tambah
        </Button>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <p className="text-xs text-muted-foreground">Belum ada jadwal {tipe}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((jadwal, index) => (
            <div
              key={jadwal._temp_id}
              className="p-3 border rounded-lg space-y-2 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium capitalize">
                  {tipe} #{index + 1}
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
                  <HariSelect
                    jadwal={jadwal}
                    disabled={submitting}
                    hariPopoverOpen={hariPopoverOpen}
                    toggleHariPopover={toggleHariPopover}
                    handleJadwalChange={handleJadwalChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Jam Mulai</Label>
                  {/* defaultValue + onBlur: kursor tidak hilang saat mengetik */}
                  <Input
                    key={`mulai-${jadwal._temp_id}`}
                    defaultValue={jadwal.jam_mulai}
                    onBlur={(e) =>
                      handleJadwalChange(jadwal._temp_id, "jam_mulai", e.target.value)
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
                    key={`selesai-${jadwal._temp_id}`}
                    defaultValue={jadwal.jam_selesai}
                    onBlur={(e) =>
                      handleJadwalChange(jadwal._temp_id, "jam_selesai", e.target.value)
                    }
                    disabled={submitting}
                    placeholder="17.00"
                    maxLength={5}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TabsContent>
  );
};

// ── Komponen Utama ───────────────────────────────────────────────────────────

export default function JadwalDokterPage() {
  const [dokterList, setDokterList] = useState<DokterWithRelations[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<DokterWithRelations[]>([]);
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDokter, setSelectedDokter] = useState<DokterWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DokterStatus | "all">("all");
  const [poliFilter, setPoliFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  const [formData, setFormData] = useState<DokterFormData>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<DokterFormErrors>(DEFAULT_FORM_ERRORS);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [poliPopoverOpen, setPoliPopoverOpen] = useState(false);
  const [hariPopoverOpen, setHariPopoverOpen] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const toggleHariPopover = useCallback((tempId: string, open: boolean) => {
    setHariPopoverOpen((prev) => ({ ...prev, [tempId]: open }));
  }, []);

  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUserId(user.id);
      else setShowAccessDenied(true);
    };
    initUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch ────────────────────────────────────────────────────

  const fetchDokter = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dokter")
        .select(
          `
          *,
          poli_detail:poli_id (id, nama_poli, status),
          jadwal:jadwal_dokter (
            id, dokter_id, hari, jam_mulai, jam_selesai, tipe_jadwal,
            created_at, updated_at,
            created_by_user:created_by (id, nama, username, avatar),
            updated_by_user:updated_by (id, nama, username, avatar)
          ),
          pendidikan:pendidikan_dokter (
            id, tahun, institusi, deskripsi,
            created_at, updated_at,
            created_by_user:created_by (id, nama, username, avatar),
            updated_by_user:updated_by (id, nama, username, avatar)
          ),
          organisasi:organisasi_dokter (
            id, tahun, title,
            created_at, updated_at,
            created_by_user:created_by (id, nama, username, avatar),
            updated_by_user:updated_by (id, nama, username, avatar)
          ),
          publikasi:publikasi_dokter (
            id, tahun, title,
            created_at, updated_at,
            created_by_user:created_by (id, nama, username, avatar),
            updated_by_user:updated_by (id, nama, username, avatar)
          ),
          pelatihan:pelatihan_dokter (
            id, tahun, institusi, deskripsi,
            created_at, updated_at,
            created_by_user:created_by (id, nama, username, avatar),
            updated_by_user:updated_by (id, nama, username, avatar)
          ),
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

  // ── Filter & Sort ────────────────────────────────────────────

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
    if (statusFilter !== "all") filtered = filtered.filter((item) => item.status === statusFilter);
    if (poliFilter !== "all") filtered = filtered.filter((item) => item.poli_id === poliFilter);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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

  // ── Select ───────────────────────────────────────────────────

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? paginatedDokter.map((item) => item.id) : []);
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

  // ── Dialog ───────────────────────────────────────────────────

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
        pendidikan: (item.pendidikan || []).map((p) => ({
          id: p.id,
          tahun: p.tahun,
          institusi: p.institusi,
          deskripsi: p.deskripsi || "",
          _temp_id: p.id!,
        })),
        organisasi: (item.organisasi || []).map((o) => ({
          id: o.id,
          tahun: o.tahun,
          title: o.title,
          _temp_id: o.id!,
        })),
        publikasi: (item.publikasi || []).map((p) => ({
          id: p.id,
          tahun: p.tahun,
          title: p.title,
          _temp_id: p.id!,
        })),
        pelatihan: (item.pelatihan || []).map((p) => ({
          id: p.id,
          tahun: p.tahun,
          institusi: p.institusi,
          deskripsi: p.deskripsi || "",
          _temp_id: p.id!,
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

  // ── Jadwal handlers (useCallback agar referensi stabil) ──────

  const handleAddJadwal = useCallback((tipe: JadwalType) => {
    setFormData((prev) => ({
      ...prev,
      jadwal: [
        ...prev.jadwal,
        {
          hari: "",
          jam_mulai: "",
          jam_selesai: "",
          tipe_jadwal: tipe,
          _temp_id: `temp_${Date.now()}`,
        },
      ],
    }));
  }, []);

  const handleRemoveJadwal = useCallback((tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      jadwal: prev.jadwal.filter((j) => j._temp_id !== tempId),
    }));
  }, []);

  const handleJadwalChange = useCallback((tempId: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      jadwal: prev.jadwal.map((j) =>
        j._temp_id === tempId ? { ...j, [field]: value } : j,
      ),
    }));
  }, []);

  // ── Pendidikan handlers ──────────────────────────────────────

  const handleAddPendidikan = () =>
    setFormData((prev) => ({
      ...prev,
      pendidikan: [
        ...prev.pendidikan,
        { tahun: "", institusi: "", deskripsi: "", _temp_id: `temp_${Date.now()}` },
      ],
    }));

  const handleRemovePendidikan = (tempId: string) =>
    setFormData((prev) => ({
      ...prev,
      pendidikan: prev.pendidikan.filter((p) => p._temp_id !== tempId),
    }));

  const handlePendidikanChange = (tempId: string, field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      pendidikan: prev.pendidikan.map((p) =>
        p._temp_id === tempId ? { ...p, [field]: value } : p,
      ),
    }));

  // ── Organisasi handlers ──────────────────────────────────────

  const handleAddOrganisasi = () =>
    setFormData((prev) => ({
      ...prev,
      organisasi: [
        ...prev.organisasi,
        { tahun: "", title: "", _temp_id: `temp_${Date.now()}` },
      ],
    }));

  const handleRemoveOrganisasi = (tempId: string) =>
    setFormData((prev) => ({
      ...prev,
      organisasi: prev.organisasi.filter((o) => o._temp_id !== tempId),
    }));

  const handleOrganisasiChange = (tempId: string, field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      organisasi: prev.organisasi.map((o) =>
        o._temp_id === tempId ? { ...o, [field]: value } : o,
      ),
    }));

  // ── Publikasi handlers ───────────────────────────────────────

  const handleAddPublikasi = () =>
    setFormData((prev) => ({
      ...prev,
      publikasi: [
        ...prev.publikasi,
        { tahun: "", title: "", _temp_id: `temp_${Date.now()}` },
      ],
    }));

  const handleRemovePublikasi = (tempId: string) =>
    setFormData((prev) => ({
      ...prev,
      publikasi: prev.publikasi.filter((p) => p._temp_id !== tempId),
    }));

  const handlePublikasiChange = (tempId: string, field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      publikasi: prev.publikasi.map((p) =>
        p._temp_id === tempId ? { ...p, [field]: value } : p,
      ),
    }));

  // ── Pelatihan handlers ───────────────────────────────────────

  const handleAddPelatihan = () =>
    setFormData((prev) => ({
      ...prev,
      pelatihan: [
        ...prev.pelatihan,
        { tahun: "", institusi: "", deskripsi: "", _temp_id: `temp_${Date.now()}` },
      ],
    }));

  const handleRemovePelatihan = (tempId: string) =>
    setFormData((prev) => ({
      ...prev,
      pelatihan: prev.pelatihan.filter((p) => p._temp_id !== tempId),
    }));

  const handlePelatihanChange = (tempId: string, field: string, value: string) =>
    setFormData((prev) => ({
      ...prev,
      pelatihan: prev.pelatihan.map((p) =>
        p._temp_id === tempId ? { ...p, [field]: value } : p,
      ),
    }));

  // ── Profile ──────────────────────────────────────────────────

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || "File tidak valid");
      return;
    }
    setFormData((prev) => ({ ...prev, profileFile: file, profileDeleted: false }));
  };

  // ── Validate ─────────────────────────────────────────────────

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
        if (!timeFormatRegex.test(j.jam_mulai) || !timeFormatRegex.test(j.jam_selesai)) {
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

    for (const p of formData.pendidikan) {
      if (!p.tahun.trim() || !p.institusi.trim()) {
        errors.pendidikan = "Tahun dan institusi pendidikan harus diisi";
        isValid = false;
        break;
      }
    }
    for (const o of formData.organisasi) {
      if (!o.tahun.trim() || !o.title.trim()) {
        errors.organisasi = "Tahun dan jabatan organisasi harus diisi";
        isValid = false;
        break;
      }
    }
    for (const p of formData.publikasi) {
      if (!p.tahun.trim() || !p.title.trim()) {
        errors.publikasi = "Tahun dan judul publikasi harus diisi";
        isValid = false;
        break;
      }
    }
    for (const p of formData.pelatihan) {
      if (!p.tahun.trim() || !p.institusi.trim()) {
        errors.pelatihan = "Tahun dan nama institusi pelatihan harus diisi";
        isValid = false;
        break;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // ── Submit ───────────────────────────────────────────────────

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
          folder: "images",
          file: formData.profileFile,
        });
        if (!uploadResult.success)
          throw new Error(uploadResult.error || "Gagal mengupload profile");
        finalProfileUrl = uploadResult.url || null;
        newUploadedPath = uploadResult.path || null;
      } else if (formData.profileDeleted) {
        finalProfileUrl = null;
      } else {
        finalProfileUrl = selectedDokter?.profile || null;
      }

      const isEdit = !!selectedDokter;

      const dokterData = {
        nama: formData.nama,
        poli_id: formData.poli_id,
        profile: finalProfileUrl,
        status: formData.status,
        ...(isEdit
          ? { updated_by: currentUserId }
          : { created_by: currentUserId }),
      };

      let dokterId: string;

      if (isEdit) {
        const { data, error } = await supabase
          .from("dokter")
          .update(dokterData)
          .eq("id", selectedDokter.id)
          .select()
          .single();
        if (error) throw error;
        dokterId = data.id;

        // Hapus semua relasi lama sebelum re-insert
        await supabase.from("jadwal_dokter").delete().eq("dokter_id", dokterId);
        await supabase.from("pendidikan_dokter").delete().eq("dokter_id", dokterId);
        await supabase.from("organisasi_dokter").delete().eq("dokter_id", dokterId);
        await supabase.from("publikasi_dokter").delete().eq("dokter_id", dokterId);
        await supabase.from("pelatihan_dokter").delete().eq("dokter_id", dokterId);
      } else {
        const { data, error } = await supabase
          .from("dokter")
          .insert([dokterData])
          .select()
          .single();
        if (error) throw error;
        dokterId = data.id;
      }

      // Saat edit: set created_by = currentUser & updated_by = currentUser
      // Saat create: set created_by = currentUser saja
      const relationBase = isEdit
        ? { created_by: currentUserId, updated_by: currentUserId }
        : { created_by: currentUserId };

      if (formData.jadwal.length > 0) {
        const { error } = await supabase.from("jadwal_dokter").insert(
          formData.jadwal.map((j) => ({
            dokter_id: dokterId,
            hari: j.hari as HariType,
            jam_mulai: j.jam_mulai,
            jam_selesai: j.jam_selesai,
            tipe_jadwal: j.tipe_jadwal as JadwalType,
            ...relationBase,
          })),
        );
        if (error) throw error;
      }

      if (formData.pendidikan.length > 0) {
        const { error } = await supabase.from("pendidikan_dokter").insert(
          formData.pendidikan.map((p) => ({
            dokter_id: dokterId,
            tahun: p.tahun,
            institusi: p.institusi,
            deskripsi: p.deskripsi || null,
            ...relationBase,
          })),
        );
        if (error) throw error;
      }

      if (formData.organisasi.length > 0) {
        const { error } = await supabase.from("organisasi_dokter").insert(
          formData.organisasi.map((o) => ({
            dokter_id: dokterId,
            tahun: o.tahun,
            title: o.title,
            ...relationBase,
          })),
        );
        if (error) throw error;
      }

      if (formData.publikasi.length > 0) {
        const { error } = await supabase.from("publikasi_dokter").insert(
          formData.publikasi.map((p) => ({
            dokter_id: dokterId,
            tahun: p.tahun,
            title: p.title,
            ...relationBase,
          })),
        );
        if (error) throw error;
      }

      if (formData.pelatihan.length > 0) {
        const { error } = await supabase.from("pelatihan_dokter").insert(
          formData.pelatihan.map((p) => ({
            dokter_id: dokterId,
            tahun: p.tahun,
            institusi: p.institusi,
            deskripsi: p.deskripsi || null,
            ...relationBase,
          })),
        );
        if (error) throw error;
      }

      if (selectedDokter?.profile && (formData.profileFile || formData.profileDeleted)) {
        const oldPath = getFilePathFromUrl(selectedDokter.profile, "dokter");
        if (oldPath) await deleteFile("dokter", oldPath);
      }

      toast.success(isEdit ? "Dokter berhasil diperbarui" : "Dokter berhasil ditambahkan");
      handleCloseDialog();
      fetchDokter();
    } catch (error) {
      console.error("Error saving dokter:", error);
      if (newUploadedPath) await deleteFile("dokter", newUploadedPath);
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
        const path = getFilePathFromUrl(selectedDokter.profile, "dokter");
        if (path) await deleteFile("dokter", path);
      }
      const { error } = await supabase.from("dokter").delete().eq("id", selectedDokter.id);
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
          const path = getFilePathFromUrl(item.profile, "dokter");
          if (path) await deleteFile("dokter", path);
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

  // ── Render ───────────────────────────────────────────────────

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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Jadwal Dokter</h1>
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
                <span className="hidden sm:inline">({selectedItems.length})</span>
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
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-auto">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
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
              onValueChange={(value) => setStatusFilter(value as DokterStatus | "all")}
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
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
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
              onValueChange={(value) => setStatusFilter(value as DokterStatus | "all")}
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
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                      className="shadow-md h-5 w-5"
                    />
                  </div>
                  <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl -mt-6">
                    {item.profile ? (
                      <Image
                        src={item.profile}
                        alt={item.nama}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        style={{ objectPosition: "center 30%" }}
                        sizes="(max-width: 640px) 100vw, 512px"
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
                    <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Tampilkan updated_by jika ada, fallback ke created_by */}
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage
                            src={
                              item.updated_by_user?.avatar ??
                              item.created_by_user?.avatar
                            }
                            alt={
                              item.updated_by_user?.nama ??
                              item.created_by_user?.nama ??
                              "User"
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {(
                              item.updated_by_user?.nama ??
                              item.created_by_user?.nama ??
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.updated_by_user?.nama ?? item.created_by_user?.nama}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">•</span>
                        <Calendar className="h-3 w-3 shrink-0 hidden sm:block" />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {formatDate(item.updated_at ?? item.created_at)}
                        </span>
                      </div>
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
                <div className="hidden sm:flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground shrink-0">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(currentPage * itemsPerPage, filteredDokter.length)} dari{" "}
                    {filteredDokter.length} dokter
                  </div>
                  <div className="flex-1" />
                  <div className="shrink-0">
                    <Pagination>
                      <PaginationContent className="gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              currentPage > 1 && handlePageChange(currentPage - 1)
                            }
                            className={`h-9 px-3 text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                              currentPage < totalPages && handlePageChange(currentPage + 1)
                            }
                            className={`h-9 px-3 text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
                <div className="flex sm:hidden flex-col items-center gap-3">
                  <div className="text-xs text-muted-foreground text-center">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(currentPage * itemsPerPage, filteredDokter.length)} dari{" "}
                    {filteredDokter.length} dokter
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={`h-8 px-2 text-xs ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                            currentPage < totalPages && handlePageChange(currentPage + 1)
                          }
                          className={`h-8 px-2 text-xs ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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

      {/* ══════════════════════════════════════════════════════
          FORM DIALOG
      ══════════════════════════════════════════════════════ */}
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
              {(formData.profile || formData.profileFile) && !formData.profileDeleted ? (
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
                    style={{ objectPosition: "center 30%" }}
                    sizes="(max-width: 640px) 100vw, 512px"
                    unoptimized
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        profileFile: null,
                        profileDeleted: true,
                      }))
                    }
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
                      setFormData((prev) => ({
                        ...prev,
                        profileFile: file,
                        profileDeleted: false,
                      }));
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
                    <p className="text-xs text-muted-foreground">Format: WebP, Max: 300KB</p>
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
                  setFormData((prev) => ({ ...prev, nama: e.target.value }));
                  if (formErrors.nama) setFormErrors((prev) => ({ ...prev, nama: "" }));
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
                <Popover open={poliPopoverOpen} onOpenChange={setPoliPopoverOpen}>
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
                        ? poliList.find((p) => p.id === formData.poli_id)?.nama_poli
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
                                setFormData((prev) => ({ ...prev, poli_id: poli.id }));
                                if (formErrors.poli_id)
                                  setFormErrors((prev) => ({ ...prev, poli_id: "" }));
                                setPoliPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.poli_id === poli.id ? "opacity-100" : "opacity-0",
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
                    setFormData((prev) => ({ ...prev, status: value as DokterStatus }))
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

            {/* ── Jadwal ── */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-semibold">Jadwal Praktik</Label>
              {formErrors.jadwal && (
                <p className="text-sm text-red-500">{formErrors.jadwal}</p>
              )}
              <Tabs defaultValue="reguler">
                <TabsList className="w-full">
                  <TabsTrigger value="reguler" className="flex-1">
                    Reguler
                    {formData.jadwal.filter((j) => j.tipe_jadwal === "reguler").length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                        {formData.jadwal.filter((j) => j.tipe_jadwal === "reguler").length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="eksekutif" className="flex-1">
                    Eksekutif
                    {formData.jadwal.filter((j) => j.tipe_jadwal === "eksekutif").length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                        {formData.jadwal.filter((j) => j.tipe_jadwal === "eksekutif").length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <JadwalTabContent
                  tipe="reguler"
                  jadwalList={formData.jadwal}
                  submitting={submitting}
                  hariPopoverOpen={hariPopoverOpen}
                  toggleHariPopover={toggleHariPopover}
                  handleJadwalChange={handleJadwalChange}
                  handleAddJadwal={handleAddJadwal}
                  handleRemoveJadwal={handleRemoveJadwal}
                />
                <JadwalTabContent
                  tipe="eksekutif"
                  jadwalList={formData.jadwal}
                  submitting={submitting}
                  hariPopoverOpen={hariPopoverOpen}
                  toggleHariPopover={toggleHariPopover}
                  handleJadwalChange={handleJadwalChange}
                  handleAddJadwal={handleAddJadwal}
                  handleRemoveJadwal={handleRemoveJadwal}
                />
              </Tabs>
            </div>

            {/* ── Pendidikan ── */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Pendidikan
                  {formData.pendidikan.length > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.pendidikan.length}
                    </span>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPendidikan} disabled={submitting} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Tambah
                </Button>
              </div>
              {formErrors.pendidikan && <p className="text-sm text-red-500">{formErrors.pendidikan}</p>}
              {formData.pendidikan.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">Belum ada data pendidikan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.pendidikan.map((p, index) => (
                    <div key={p._temp_id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Pendidikan #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePendidikan(p._temp_id)} disabled={submitting} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tahun <span className="text-red-500">*</span></Label>
                          <Input value={p.tahun} onChange={(e) => handlePendidikanChange(p._temp_id, "tahun", e.target.value)} disabled={submitting} placeholder="2010" maxLength={4} className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Institusi <span className="text-red-500">*</span></Label>
                          <Input value={p.institusi} onChange={(e) => handlePendidikanChange(p._temp_id, "institusi", e.target.value)} disabled={submitting} placeholder="Nama universitas / institusi" className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deskripsi</Label>
                        <Input value={p.deskripsi} onChange={(e) => handlePendidikanChange(p._temp_id, "deskripsi", e.target.value)} disabled={submitting} placeholder="Contoh: S1 Kedokteran Umum" className="h-8 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Organisasi ── */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Organisasi
                  {formData.organisasi.length > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.organisasi.length}
                    </span>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOrganisasi} disabled={submitting} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Tambah
                </Button>
              </div>
              {formErrors.organisasi && <p className="text-sm text-red-500">{formErrors.organisasi}</p>}
              {formData.organisasi.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">Belum ada data organisasi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.organisasi.map((o, index) => (
                    <div key={o._temp_id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Organisasi #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOrganisasi(o._temp_id)} disabled={submitting} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tahun <span className="text-red-500">*</span></Label>
                          <Input value={o.tahun} onChange={(e) => handleOrganisasiChange(o._temp_id, "tahun", e.target.value)} disabled={submitting} placeholder="2015" maxLength={4} className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Jabatan / Title <span className="text-red-500">*</span></Label>
                          <Input value={o.title} onChange={(e) => handleOrganisasiChange(o._temp_id, "title", e.target.value)} disabled={submitting} placeholder="Ketua IDI Cabang..." className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Pelatihan ── */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" /> Pelatihan
                  {formData.pelatihan.length > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.pelatihan.length}
                    </span>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPelatihan} disabled={submitting} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Tambah
                </Button>
              </div>
              {formErrors.pelatihan && <p className="text-sm text-red-500">{formErrors.pelatihan}</p>}
              {formData.pelatihan.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">Belum ada data pelatihan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.pelatihan.map((p, index) => (
                    <div key={p._temp_id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Pelatihan #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePelatihan(p._temp_id)} disabled={submitting} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tahun <span className="text-red-500">*</span></Label>
                          <Input value={p.tahun} onChange={(e) => handlePelatihanChange(p._temp_id, "tahun", e.target.value)} disabled={submitting} placeholder="2020" maxLength={4} className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Institusi <span className="text-red-500">*</span></Label>
                          <Input value={p.institusi} onChange={(e) => handlePelatihanChange(p._temp_id, "institusi", e.target.value)} disabled={submitting} placeholder="Nama institusi / penyelenggara" className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deskripsi</Label>
                        <Input value={p.deskripsi} onChange={(e) => handlePelatihanChange(p._temp_id, "deskripsi", e.target.value)} disabled={submitting} placeholder="Contoh: Pelatihan ACLS, Sertifikasi BLS, dll" className="h-8 text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Publikasi ── */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Publikasi
                  {formData.publikasi.length > 0 && (
                    <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                      {formData.publikasi.length}
                    </span>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPublikasi} disabled={submitting} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Tambah
                </Button>
              </div>
              {formErrors.publikasi && <p className="text-sm text-red-500">{formErrors.publikasi}</p>}
              {formData.publikasi.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">Belum ada data publikasi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.publikasi.map((p, index) => (
                    <div key={p._temp_id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Publikasi #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePublikasi(p._temp_id)} disabled={submitting} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tahun <span className="text-red-500">*</span></Label>
                          <Input value={p.tahun} onChange={(e) => handlePublikasiChange(p._temp_id, "tahun", e.target.value)} disabled={submitting} placeholder="2022" maxLength={4} className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Judul <span className="text-red-500">*</span></Label>
                          <Input value={p.title} onChange={(e) => handlePublikasiChange(p._temp_id, "title", e.target.value)} disabled={submitting} placeholder="Judul artikel / jurnal" className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
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

      {/* ══════════════════════════════════════════════════════
          DETAIL DIALOG
      ══════════════════════════════════════════════════════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detail Dokter</DialogTitle>
          </DialogHeader>
          {selectedDokter && (
            <div className="space-y-4">
              {/* Foto */}
              <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {selectedDokter.profile ? (
                  <Image
                    src={selectedDokter.profile}
                    alt={selectedDokter.nama}
                    fill
                    className="object-cover"
                    style={{ objectPosition: "center 30%" }}
                    sizes="(max-width: 640px) 100vw, 512px"
                    unoptimized
                    priority
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-28 w-28 text-muted-foreground/30">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Info + Audit */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{selectedDokter.nama}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedDokter.status)}
                  <Badge variant="outline">{selectedDokter.poli_detail?.nama_poli}</Badge>
                </div>

                {/* ── Audit box dokter ── */}
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  {/* Dibuat oleh */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={selectedDokter.created_by_user?.avatar} alt={selectedDokter.created_by_user?.nama || "User"} />
                      <AvatarFallback className="text-[10px]">
                        {selectedDokter.created_by_user?.nama?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Dibuat oleh{" "}
                      <span className="font-medium text-foreground">
                        {selectedDokter.created_by_user?.nama ?? "-"}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(selectedDokter.created_at)}</span>
                  </div>
                  {/* Diperbarui oleh — hanya tampil jika ada */}
                  {selectedDokter.updated_by_user && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={selectedDokter.updated_by_user.avatar} alt={selectedDokter.updated_by_user.nama || "User"} />
                        <AvatarFallback className="text-[10px]">
                          {selectedDokter.updated_by_user.nama?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Diperbarui oleh{" "}
                        <span className="font-medium text-foreground">
                          {selectedDokter.updated_by_user.nama}
                        </span>
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatDateTime(selectedDokter.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Jadwal ── */}
              {(selectedDokter.jadwal ?? []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Jadwal Praktik
                  </Label>
                  {(() => {
                    const jadwal = selectedDokter.jadwal ?? [];
                    const allRows: {
                      hari: HariType;
                      isFirst: boolean;
                      reguler: JadwalDokter | null;
                      eksekutif: JadwalDokter | null;
                    }[] = [];
                    HARI_OPTIONS.forEach((hari) => {
                      const regulerList = jadwal.filter((j) => j.hari === hari && j.tipe_jadwal === "reguler");
                      const eksekutifList = jadwal.filter((j) => j.hari === hari && j.tipe_jadwal === "eksekutif");
                      if (regulerList.length === 0 && eksekutifList.length === 0) return;
                      const maxRows = Math.max(regulerList.length, eksekutifList.length);
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
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Hari</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Jadwal BPJS</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Jadwal Eksekutif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allRows.map((row, idx) => (
                              <tr key={idx} className="border-b last:border-b-0">
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
                                  {row.reguler
                                    ? `${row.reguler.jam_mulai} - ${row.reguler.jam_selesai}`
                                    : <span className="text-muted-foreground/40">-</span>}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {row.eksekutif
                                    ? `${row.eksekutif.jam_mulai} - ${row.eksekutif.jam_selesai}`
                                    : <span className="text-muted-foreground/40">-</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── Pendidikan ── */}
              {(selectedDokter.pendidikan ?? []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Pendidikan
                  </Label>
                  <div className="rounded-lg border overflow-hidden text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground w-20">Tahun</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Institusi</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedDokter.pendidikan ?? [])
                          .slice()
                          .sort((a, b) => Number(b.tahun) - Number(a.tahun))
                          .map((p, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2.5 text-muted-foreground font-medium">{p.tahun}</td>
                              <td className="px-4 py-2.5 text-foreground">{p.institusi}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {p.deskripsi || <span className="text-muted-foreground/40">-</span>}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Organisasi ── */}
              {(selectedDokter.organisasi ?? []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Organisasi
                  </Label>
                  <div className="rounded-lg border overflow-hidden text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground w-20">Tahun</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Jabatan / Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedDokter.organisasi ?? [])
                          .slice()
                          .sort((a, b) => Number(b.tahun) - Number(a.tahun))
                          .map((o, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2.5 text-muted-foreground font-medium">{o.tahun}</td>
                              <td className="px-4 py-2.5 text-foreground">{o.title}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Pelatihan ── */}
              {(selectedDokter.pelatihan ?? []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" /> Pelatihan
                  </Label>
                  <div className="rounded-lg border overflow-hidden text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground w-20">Tahun</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Institusi</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedDokter.pelatihan ?? [])
                          .slice()
                          .sort((a, b) => Number(b.tahun) - Number(a.tahun))
                          .map((p, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2.5 text-muted-foreground font-medium">{p.tahun}</td>
                              <td className="px-4 py-2.5 text-foreground">{p.institusi}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {p.deskripsi || <span className="text-muted-foreground/40">-</span>}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Publikasi ── */}
              {(selectedDokter.publikasi ?? []).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Publikasi
                  </Label>
                  <div className="rounded-lg border overflow-hidden text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground w-20">Tahun</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Judul</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedDokter.publikasi ?? [])
                          .slice()
                          .sort((a, b) => Number(b.tahun) - Number(a.tahun))
                          .map((p, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-4 py-2.5 text-muted-foreground font-medium">{p.tahun}</td>
                              <td className="px-4 py-2.5 text-foreground">{p.title}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
            {selectedDokter && (
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenDialog(selectedDokter);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Dokter?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus dokter{" "}
              <strong>{selectedDokter?.nama}</strong>? Semua jadwal, pendidikan, organisasi,
              pelatihan, dan publikasi juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">
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
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Hapus Beberapa Dokter?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{selectedItems.length} dokter</strong> yang dipilih? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={submitting} className="w-full sm:w-auto">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : `Hapus ${selectedItems.length} Dokter`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
}