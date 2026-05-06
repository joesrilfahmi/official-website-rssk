// app/jadwal/dokter.tsx
"use client";
import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import CachedImage from "@/components/ui/custom/cached-image";
import Input from "@/components/ui/custom/input";
import Pagination from "@/components/ui/custom/pagination";
import Select from "@/components/ui/custom/select";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

const ITEMS_PER_PAGE = 12;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function useScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);
  return { ref, canScrollUp, canScrollDown };
}

interface ScrollFadeWrapperProps {
  children: React.ReactNode;
  maxHeight: number;
  className?: string;
}

const ScrollFadeWrapper: React.FC<ScrollFadeWrapperProps> = ({
  children,
  maxHeight,
  className = "",
}) => {
  const { ref, canScrollUp, canScrollDown } = useScrollIndicator();
  useEffect(() => {
    const id = "dokter-scrollbar-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .dokter-scroll::-webkit-scrollbar { width: 4px; }
      .dokter-scroll::-webkit-scrollbar-track { background: transparent; }
      .dokter-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      .dokter-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    `;
    document.head.appendChild(style);
  }, []);
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute top-0 inset-x-0 z-10 transition-opacity duration-300"
        style={{
          height: "36px",
          opacity: canScrollUp ? 1 : 0,
          background: "linear-gradient(to bottom, white 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-10 transition-opacity duration-300"
        style={{
          height: "52px",
          opacity: canScrollDown ? 1 : 0,
          background: "linear-gradient(to top, white 0%, transparent 100%)",
        }}
      >
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <ChevronDown className="w-4 h-4 text-mariner-400 opacity-80" />
            <ChevronDown className="w-3 h-3 text-mariner-300 opacity-50 -mt-2" />
          </motion.div>
        </div>
      </div>
      <div
        ref={ref}
        className={`dokter-scroll overflow-y-auto scroll-smooth ${className}`}
        style={{
          maxHeight,
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD5E1 transparent",
        }}
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface Poli {
  id: string;
  nama_poli: string;
}
interface JadwalDokter {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: "reguler" | "eksekutif";
  updated_at: string;
}
interface Dokter {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: string;
  updated_at: string;
  poli: Poli;
  jadwal_dokter: JadwalDokter[];
}
interface JadwalGroup {
  hari: string;
  slots: {
    id: string;
    jam_mulai: string;
    jam_selesai: string;
    tipe_jadwal: "reguler" | "eksekutif";
  }[];
}

const formatTime = (t: string) => (t.includes(".") ? t.replace(".", ":") : t);
const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

function groupJadwalByHari(jadwalList: JadwalDokter[]): JadwalGroup[] {
  const map = new Map<string, JadwalGroup>();
  const sorted = [...jadwalList].sort(
    (a, b) => (HARI_ORDER[a.hari] ?? 99) - (HARI_ORDER[b.hari] ?? 99),
  );
  for (const j of sorted) {
    if (!map.has(j.hari)) map.set(j.hari, { hari: j.hari, slots: [] });
    map.get(j.hari)!.slots.push({
      id: j.id,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      tipe_jadwal: j.tipe_jadwal,
    });
  }
  return Array.from(map.values());
}

function getGlobalLastUpdated(dokterList: Dokter[]): string | null {
  if (dokterList.length === 0) return null;
  const allDates: Date[] = [];
  for (const dokter of dokterList) {
    if (dokter.updated_at) allDates.push(new Date(dokter.updated_at));
    for (const jadwal of dokter.jadwal_dokter) {
      if (jadwal.updated_at) allDates.push(new Date(jadwal.updated_at));
    }
  }
  if (allDates.length === 0) return null;
  const latest = new Date(Math.max(...allDates.map((d) => d.getTime())));
  return latest.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const INACTIVE_STATUSES = new Set(["inactive", "cuti", "libur"]);
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-emerald-500 text-white" },
  inactive: { label: "Tidak Aktif", className: "bg-red-500 text-white" },
  cuti: { label: "Cuti", className: "bg-red-500 text-white" },
  libur: { label: "Libur", className: "bg-red-500 text-white" },
};
const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-red-500 text-white",
  };

const HARI_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "Senin", label: "Senin" },
  { value: "Selasa", label: "Selasa" },
  { value: "Rabu", label: "Rabu" },
  { value: "Kamis", label: "Kamis" },
  { value: "Jumat", label: "Jumat" },
  { value: "Sabtu", label: "Sabtu" },
  { value: "Minggu", label: "Minggu" },
];

// ── JadwalDialog ────────────────────────────────────────────────────────────

interface JadwalDialogProps {
  dokter: Dokter;
  onClose: () => void;
}

const JadwalDialog: React.FC<JadwalDialogProps> = ({ dokter, onClose }) => {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const jadwalReguler = dokter.jadwal_dokter.filter(
    (j) => j.tipe_jadwal === "reguler",
  );
  const jadwalEksekutif = dokter.jadwal_dokter.filter(
    (j) => j.tipe_jadwal === "eksekutif",
  );
  const groupedReguler = groupJadwalByHari(jadwalReguler as JadwalDokter[]);
  const groupedEksekutif = groupJadwalByHari(jadwalEksekutif as JadwalDokter[]);

  const handleDaftar = (hari: string, jamMulai: string, jamSelesai: string) => {
    const params = new URLSearchParams({
      poliId: dokter.poli_id,
      poliNama: dokter.poli?.nama_poli || "-",
      dokterId: dokter.id,
      dokterNama: dokter.nama,
      hari,
      jamMulai,
      jamSelesai,
    });
    if (dokter.profile) params.set("dokterProfile", dokter.profile);
    onClose();
    router.push(`/pendaftaran?${params.toString()}`);
  };

  const handleNavigateToDetail = () => {
    onClose();
    router.push(`/detail-dokter/${dokter.id}`);
  };

  const renderGrouped = (
    groups: JadwalGroup[],
    type: "reguler" | "eksekutif",
  ) =>
    groups.map((group) => (
      <motion.div
        key={group.hari}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease } satisfies Transition}
        className={`rounded-2xl px-4 py-3.5 ring-1 ${
          type === "eksekutif"
            ? "bg-mariner-50/60 ring-mariner-100"
            : "bg-gray-50 ring-gray-100"
        }`}
      >
        <div className="flex gap-3">
          <div className="flex items-start gap-2 w-18 shrink-0 pt-0.5">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-mariner-400" />
            <span className="text-gray-700 font-semibold text-sm">
              {group.hari}
            </span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {group.slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>
                    {formatTime(slot.jam_mulai)} –{" "}
                    {formatTime(slot.jam_selesai)}
                  </span>
                </div>
                {type === "eksekutif" && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.16 } satisfies Transition}
                    onClick={() =>
                      handleDaftar(group.hari, slot.jam_mulai, slot.jam_selesai)
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-bittersweet-500 hover:bg-bittersweet-600 px-3 py-1.5 rounded-full shadow-sm shadow-bittersweet-500/20 transition-colors duration-150 shrink-0"
                  >
                    Daftar <ArrowRight className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    ));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: easeOut } satisfies Transition}
      className="fixed inset-0 z-120 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease } satisfies Transition}
        className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          key="jadwal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease } satisfies Transition}
          className="flex flex-col max-h-[85vh]"
        >
          {/* Hero image */}
          <div className="relative shrink-0 overflow-hidden">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                { delay: 0.3, duration: 0.4, ease } satisfies Transition
              }
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255,255,255,0.28)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigateToDetail}
              aria-label="Lihat profil lengkap"
              className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 bg-black/40 hover:bg-black/60 border border-white/15 text-white text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full transition-colors duration-150 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> Lihat Profil
            </motion.button>

            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/45 active:bg-black/60 border border-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <motion.div
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease } satisfies Transition}
              className="relative w-full"
              style={{ paddingBottom: "min(56%, 280px)" }}
            >
              {/* ── DIUBAH: pakai CachedImage ── */}
              <div className="absolute inset-0 bg-gray-100">
                <CachedImage
                  src={dokter.profile}
                  bucket="dokter"
                  alt={dokter.nama}
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 55%" }}
                  sizes="(max-width: 640px) 100vw, 512px"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-mariner-50">
                      <UserRound className="w-24 h-24 text-mariner-200" />
                    </div>
                  }
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                { delay: 0.2, duration: 0.45, ease } satisfies Transition
              }
              className="absolute bottom-0 inset-x-0 px-6 pb-4 text-center"
            >
              <p className="text-white/65 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                Jadwal Praktek
              </p>
              <p className="text-white font-bold text-xl leading-snug drop-shadow-sm">
                {dokter.nama}
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-block text-xs font-medium text-mariner-200 bg-mariner-900/40 px-3 py-0.5 rounded-full">
                  {dokter.poli?.nama_poli || "–"}
                </span>
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusConfig(dokter.status).className}`}
                >
                  {getStatusConfig(dokter.status).label}
                </span>
              </div>
            </motion.div>
          </div>

          <ScrollFadeWrapper maxHeight={320} className="px-6 py-5 space-y-5">
            {dokter.jadwal_dokter.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex p-4 rounded-full bg-gray-100 mb-3">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  Belum ada jadwal tersedia
                </p>
              </div>
            ) : (
              <>
                {groupedReguler.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-mariner-600 bg-mariner-50 px-3 py-1 rounded-full">
                        BPJS / Reguler
                      </span>
                    </div>
                    <div className="space-y-2">
                      {renderGrouped(groupedReguler, "reguler")}
                    </div>
                  </div>
                )}
                {groupedEksekutif.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-bittersweet-600 bg-bittersweet-50 px-3 py-1 rounded-full">
                        Eksekutif
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Klik{" "}
                        <span className="font-semibold text-bittersweet-500">
                          Daftar
                        </span>{" "}
                        untuk membuat janji
                      </span>
                    </div>
                    <div className="space-y-2">
                      {renderGrouped(groupedEksekutif, "eksekutif")}
                    </div>
                  </div>
                )}
              </>
            )}
          </ScrollFadeWrapper>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ── DokterCard ──────────────────────────────────────────────────────────────

const cardWrapVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease } satisfies Transition,
  },
};

const DokterCard: React.FC<{
  dokter: Dokter;
  onClick: (d: Dokter) => void;
}> = ({ dokter, onClick }) => {
  const hariList = [...new Set(dokter.jadwal_dokter.map((j) => j.hari))].sort(
    (a, b) => (HARI_ORDER[a] ?? 99) - (HARI_ORDER[b] ?? 99),
  );
  const isInactive = INACTIVE_STATUSES.has(dokter.status);

  return (
    <motion.div
      variants={cardWrapVariants}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.22, ease } satisfies Transition,
      }}
      onClick={() => onClick(dokter)}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-xl hover:ring-mariner-100 transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: "115%" }}
      >
        <div
          className={`absolute inset-0 bg-linear-to-br from-mariner-100 to-mariner-200 transition-all duration-300 ${isInactive ? "grayscale brightness-75" : ""}`}
        >
          {/* ── DIUBAH: pakai CachedImage ── */}
          <CachedImage
            src={dokter.profile}
            bucket="dokter"
            alt={dokter.nama}
            fill
            className={`object-cover object-top transition-all duration-500 group-hover:scale-105 ${isInactive ? "opacity-70" : ""}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <UserRound
                  className={`w-16 h-16 ${isInactive ? "text-gray-300" : "text-mariner-400"}`}
                />
              </div>
            }
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <span
              className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full leading-none ${getStatusConfig(dokter.status).className}`}
            >
              {getStatusConfig(dokter.status).label}
            </span>
            <span className="inline-block text-[10px] font-bold text-white bg-mariner-600/75 px-2.5 py-1 rounded-full leading-none text-right">
              {dokter.poli?.nama_poli || "–"}
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
            <div className="bg-white text-mariner-600 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
              Lihat Jadwal <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
            <h3 className="text-white font-bold text-sm leading-snug drop-shadow-sm line-clamp-2 group-hover:text-mariner-100 transition-colors duration-200">
              {dokter.nama}
            </h3>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 flex items-center justify-between gap-2 min-h-11">
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {hariList.length === 0 ? (
            <span className="text-[10px] text-gray-400 italic">
              Belum ada jadwal
            </span>
          ) : (
            hariList.map((hari) => (
              <span
                key={hari}
                className="text-[10px] font-semibold text-mariner-600 bg-mariner-50 px-2 py-0.5 rounded-full leading-none whitespace-nowrap"
              >
                {hari.slice(0, 3)}
              </span>
            ))
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-mariner-400 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </motion.div>
  );
};

// ── SkeletonCard ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-gray-100 animate-pulse">
    <div className="w-full bg-gray-100" style={{ paddingBottom: "115%" }} />
    <div className="px-3 py-3 flex items-center gap-1.5">
      <div className="h-4 w-8 bg-gray-100 rounded-full" />
      <div className="h-4 w-8 bg-gray-100 rounded-full" />
      <div className="h-4 w-8 bg-gray-100 rounded-full" />
    </div>
  </div>
);

// ── LastUpdatedBadge ────────────────────────────────────────────────────────

interface LastUpdatedBadgeProps {
  dokterList: Dokter[];
  loading: boolean;
}

const LastUpdatedBadge: React.FC<LastUpdatedBadgeProps> = ({
  dokterList,
  loading,
}) => {
  const lastUpdated = useMemo(
    () => getGlobalLastUpdated(dokterList),
    [dokterList],
  );
  if (loading)
    return (
      <div className="flex justify-center">
        <div className="h-7 w-52 bg-gray-100 rounded-full animate-pulse" />
      </div>
    );
  if (!lastUpdated) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: easeOut } satisfies Transition}
      className="flex justify-center"
    >
      <div className="inline-flex items-center gap-2 bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full">
        <RefreshCw className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[12px] text-gray-400 leading-none">
          Jadwal diperbarui{" "}
          <span className="font-semibold text-gray-600">{lastUpdated}</span>
        </span>
      </div>
    </motion.div>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────

const DokterSpesialis = () => {
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPoli, setSelectedPoli] = useState<string>("all");
  const [selectedHari, setSelectedHari] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedSelectedPoli = useDebounce(selectedPoli, 200);
  const debouncedSelectedHari = useDebounce(selectedHari, 200);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const dokterChannel = supabase
      .channel("dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dokter" },
        () => fetchData(),
      )
      .subscribe();
    const jadwalChannel = supabase
      .channel("jadwal_dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jadwal_dokter" },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(dokterChannel);
      supabase.removeChannel(jadwalChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: dokterData, error } = await supabase
        .from("dokter")
        .select(
          `*, poli:poli_id (id, nama_poli), jadwal_dokter (id, hari, jam_mulai, jam_selesai, tipe_jadwal, updated_at)`,
        )
        .order("nama", { ascending: true });
      if (error) throw error;
      const sorted = dokterData || [];
      setDokterList(sorted);
      const seen = new Set<string>();
      const uniquePoli: Poli[] = [];
      sorted.forEach((d) => {
        if (d.poli && !seen.has(d.poli.id)) {
          seen.add(d.poli.id);
          uniquePoli.push(d.poli);
        }
      });
      uniquePoli.sort((a, b) =>
        a.nama_poli.toLowerCase().localeCompare(b.nama_poli.toLowerCase()),
      );
      setPoliList(uniquePoli);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setDataReady(true), 120);
    }
  };

  const filteredDokter = useMemo(
    () =>
      dokterList.filter((d) => {
        if (debouncedSearchQuery) {
          const q = debouncedSearchQuery.toLowerCase();
          if (
            !d.nama.toLowerCase().includes(q) &&
            !(d.poli?.nama_poli?.toLowerCase() || "").includes(q)
          )
            return false;
        }
        if (
          debouncedSelectedPoli !== "all" &&
          d.poli_id !== debouncedSelectedPoli
        )
          return false;
        if (
          debouncedSelectedHari !== "all" &&
          !d.jadwal_dokter.some((j) => j.hari === debouncedSelectedHari)
        )
          return false;
        return true;
      }),
    [
      dokterList,
      debouncedSearchQuery,
      debouncedSelectedPoli,
      debouncedSelectedHari,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, debouncedSelectedPoli, debouncedSelectedHari]);

  const totalPages = Math.ceil(filteredDokter.length / ITEMS_PER_PAGE);
  const paginatedDokter = useMemo(
    () =>
      filteredDokter.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredDokter, currentPage],
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSelectedPoli("all");
      setSelectedHari("all");
    }
  };

  const handlePoliChange = (poliId: string) => {
    setSelectedPoli(poliId);
    if (poliId !== "all") setSearchQuery("");
  };

  const handleCardClick = useCallback((dokter: Dokter) => {
    setSelectedDokter(dokter);
  }, []);

  return (
    <>
      <AnimatePresence>
        {selectedDokter && (
          <JadwalDialog
            dokter={selectedDokter}
            onClose={() => setSelectedDokter(null)}
          />
        )}
      </AnimatePresence>

      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <Animate type="fadein" ready={dataReady}>
            <Banner
              title="Dokter Spesialis Kami"
              subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
            />
          </Animate>

          <Animate
            type="fadein"
            ready={dataReady}
            delay={0.05}
            className="text-center mt-10 mb-4"
          >
            <Title
              title="Daftar Dokter Spesialis"
              align="center"
              subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
            />
          </Animate>

          <Animate
            type="fadein"
            ready={dataReady}
            delay={0.07}
            className="mb-8"
          >
            <LastUpdatedBadge dokterList={dokterList} loading={loading} />
          </Animate>

          <Animate
            type="fadein"
            ready={dataReady}
            delay={0.1}
            className="mb-8 space-y-5"
          >
            <div className="flex justify-center">
              <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Cari dokter atau spesialisasi..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    icon={Search}
                    iconPosition="left"
                    rounded="full"
                    inputSize="md"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                      type="button"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-52 shrink-0">
                  <Select
                    icon={Stethoscope}
                    value={selectedPoli}
                    onChange={(val) => handlePoliChange(val)}
                    options={[
                      { value: "all", label: "Semua Poli" },
                      ...poliList.map((p) => ({
                        value: p.id,
                        label: p.nama_poli,
                      })),
                    ]}
                    placeholder="Pilih poli"
                    rounded="full"
                    searchable={true}
                    selectSize="md"
                    loading={loading}
                  />
                </div>
                <div className="w-full sm:w-44 shrink-0">
                  <Select
                    icon={Calendar}
                    value={selectedHari}
                    onChange={setSelectedHari}
                    options={HARI_OPTIONS}
                    placeholder="Pilih hari"
                    rounded="full"
                    searchable={false}
                    selectSize="md"
                  />
                </div>
              </div>
            </div>
          </Animate>

          <AnimatePresence>
            {loading && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  { duration: 0.45, ease: easeOut } satisfies Transition
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && filteredDokter.length === 0 && (
            <Animate
              type="fadein"
              ready={dataReady}
              className="text-center py-16"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <UserRound className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Tidak Ada Dokter Ditemukan
              </h3>
              <p className="text-gray-500">
                Coba ubah filter atau kata kunci pencarian Anda.
              </p>
            </Animate>
          )}

          {!loading && filteredDokter.length > 0 && (
            <>
              <div ref={gridRef} className="-mt-4 pt-4" />
              <Animate
                key={`${debouncedSelectedPoli}-${debouncedSelectedHari}-${debouncedSearchQuery}-${currentPage}`}
                type="stagger"
                staggerChildren={0.06}
                delayChildren={0.02}
                ready={true}
                margin="-60px"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                {paginatedDokter.map((dokter) => (
                  <DokterCard
                    key={dokter.id}
                    dokter={dokter}
                    onClick={handleCardClick}
                  />
                ))}
              </Animate>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredDokter.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="dokter"
                className="mt-10 mb-4"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DokterSpesialis;
