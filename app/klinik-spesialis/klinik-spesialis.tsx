// app/sections/klinik-spesialis/klinik-spesialis.tsx
"use client";
import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Pagination from "@/components/ui/custom/pagination";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import * as Icons from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Search,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "bg-emerald-500 text-white",
  },
  inactive: {
    label: "Tidak Aktif",
    className: "bg-gray-400 text-white",
  },
  cuti: {
    label: "Cuti",
    className: "bg-amber-500 text-white",
  },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-400 text-white",
  };

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface Poli {
  id: string;
  nama_poli: string;
  icon: string;
  description: string;
  status: string;
  urutan: number;
  created_at: string;
  updated_at: string;
}

interface Dokter {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: string;
}

interface JadwalDokter {
  id: string;
  dokter_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: string;
}

interface GroupedJadwal {
  hari: string;
  slots: {
    id: string;
    jam_mulai: string;
    jam_selesai: string;
    tipe_jadwal: string;
  }[];
}

const HARI_ORDER = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const ITEMS_PER_PAGE = 9;

/* ─────────────────────────────────────────
   useScrollIndicator
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   ScrollFadeWrapper
───────────────────────────────────────── */
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
    const id = "klinik-scrollbar-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .klinik-scroll::-webkit-scrollbar { width: 4px; }
      .klinik-scroll::-webkit-scrollbar-track { background: transparent; }
      .klinik-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      .klinik-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
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
            <ChevronDown className="w-4 h-4 text-bittersweet-400 opacity-80" />
            <ChevronDown className="w-3 h-3 text-bittersweet-300 opacity-50 -mt-2" />
          </motion.div>
        </div>
      </div>
      <div
        ref={ref}
        className={`klinik-scroll overflow-y-auto scroll-smooth ${className}`}
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

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function groupJadwalByHari(jadwalList: JadwalDokter[]): GroupedJadwal[] {
  const map = new Map<string, GroupedJadwal>();
  const sorted = [...jadwalList].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari),
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

/* ─────────────────────────────────────────
   JADWAL DIALOG
   PERUBAHAN:
   - Tombol "Daftar" eksekutif → redirect ke /sections/pendaftaran
     dengan query params (poliId, dokterId, hari, jamMulai, jamSelesai)
───────────────────────────────────────── */
interface JadwalDialogProps {
  dokter: Dokter;
  poliNama: string;
  poliId: string;
  jadwalList: JadwalDokter[];
  loading: boolean;
  onClose: () => void;
}

const JadwalDialog: React.FC<JadwalDialogProps> = ({
  dokter,
  poliNama,
  poliId,
  jadwalList,
  loading,
  onClose,
}) => {
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

  const jadwalReguler = jadwalList.filter((j) => j.tipe_jadwal === "reguler");
  const jadwalEksekutif = jadwalList.filter(
    (j) => j.tipe_jadwal === "eksekutif",
  );
  const groupedReguler = groupJadwalByHari(jadwalReguler);
  const groupedEksekutif = groupJadwalByHari(jadwalEksekutif);

  /* ── PERUBAHAN: redirect ke /sections/pendaftaran ── */
  const handleDaftar = (hari: string, jamMulai: string, jamSelesai: string) => {
    const params = new URLSearchParams({
      poliId,
      poliNama,
      dokterId: dokter.id,
      dokterNama: dokter.nama,
      hari,
      jamMulai,
      jamSelesai,
    });
    if (dokter.profile) params.set("dokterProfile", dokter.profile);
    onClose();
    router.push(`/sections/pendaftaran?${params.toString()}`);
  };

  const handleNavigateToDetail = () => {
    onClose();
    router.push(`/detail-dokter/${dokter.id}`);
  };

  const renderGrouped = (
    groups: GroupedJadwal[],
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
            ? "bg-bittersweet-50/60 ring-bittersweet-100"
            : "bg-gray-50 ring-gray-100"
        }`}
      >
        <div className="flex gap-3">
          <div className="flex items-start gap-2 w-18 shrink-0 pt-0.5">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-bittersweet-400" />
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
                    {slot.jam_mulai} – {slot.jam_selesai}
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
                    Daftar
                    <ArrowRight className="w-3 h-3" />
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
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.45, ease } satisfies Transition}
        className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero foto */}
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
            <ExternalLink className="w-3 h-3" />
            Lihat Profil
          </motion.button>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/45 active:bg-black/60 border border-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease } satisfies Transition}
            className="relative w-full"
            style={{ paddingBottom: "min(56%, 280px)" }}
          >
            <div className="absolute inset-0 bg-gray-100">
              {dokter.profile ? (
                <Image
                  src={dokter.profile}
                  alt={dokter.nama}
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 55%" }}
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bittersweet-50">
                  <User className="w-24 h-24 text-bittersweet-200" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              { delay: 0.2, duration: 0.45, ease } satisfies Transition
            }
            className="absolute bottom-0 inset-x-0 px-6 pb-4 text-center"
          >
            <p className="text-white/65 text-[10px] font-bold uppercase tracking-widest mb-0.5">
              Jadwal Praktek
            </p>
            <h3 className="text-white font-bold text-xl leading-snug drop-shadow-sm">
              {dokter.nama}
            </h3>
            <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-medium text-bittersweet-200 bg-bittersweet-900/40 px-3 py-0.5 rounded-full">
                {poliNama}
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
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : jadwalList.length === 0 ? (
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
                    <span className="text-xs font-bold uppercase tracking-widest text-bittersweet-600 bg-bittersweet-50 px-3 py-1 rounded-full">
                      Reguler
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
  );
};

/* ─────────────────────────────────────────
   DOKTER ROW
   PERUBAHAN: tampilkan foto dokter jika ada,
   fallback ke icon User
───────────────────────────────────────── */
const DokterRow: React.FC<{
  dokter: Dokter;
  onLihatJadwal: (d: Dokter) => void;
}> = ({ dokter, onLihatJadwal }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease } satisfies Transition}
    className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 ring-1 ring-gray-100"
  >
    {/* Avatar: foto dokter jika ada, fallback icon */}
    <div className="w-10 h-10 rounded-full ring-2 ring-bittersweet-100 shrink-0 overflow-hidden bg-bittersweet-50 flex items-center justify-center">
      {dokter.profile ? (
        <Image
          src={dokter.profile}
          alt={dokter.nama}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="w-5 h-5 text-bittersweet-400" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-gray-800 font-semibold text-sm truncate">
        {dokter.nama}
      </p>
      <span
        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${getStatusConfig(dokter.status).className}`}
      >
        {getStatusConfig(dokter.status).label}
      </span>
    </div>
    <Button
      variant="primary"
      size="sm"
      onClick={() => onLihatJadwal(dokter)}
      className="shrink-0"
    >
      <Calendar className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Jadwal</span>
    </Button>
  </motion.div>
);

/* ─────────────────────────────────────────
   POLI DIALOG
───────────────────────────────────────── */
const PoliDialog: React.FC<{ poli: Poli; onClose: () => void }> = ({
  poli,
  onClose,
}) => {
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [loadingDokter, setLoadingDokter] = useState(true);
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);
  const [jadwalList, setJadwalList] = useState<JadwalDokter[]>([]);
  const [loadingJadwal, setLoadingJadwal] = useState(false);

  const IconComponent = Icons[
    poli.icon as keyof typeof Icons
  ] as React.ElementType;

  useEffect(() => {
    const fetchDokter = async () => {
      try {
        const { data, error } = await supabase
          .from("dokter")
          .select("*")
          .eq("poli_id", poli.id)
          .order("nama", { ascending: true });
        if (error) throw error;
        setDokterList(data || []);
      } catch (err) {
        console.error("Error fetching dokter:", err);
      } finally {
        setLoadingDokter(false);
      }
    };
    fetchDokter();
  }, [poli.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedDokter) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, selectedDokter]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleLihatJadwal = useCallback(async (dokter: Dokter) => {
    setSelectedDokter(dokter);
    setLoadingJadwal(true);
    try {
      const { data, error } = await supabase
        .from("jadwal_dokter")
        .select("*")
        .eq("dokter_id", dokter.id)
        .order("tipe_jadwal", { ascending: true });
      if (error) throw error;
      setJadwalList(data || []);
    } catch (err) {
      console.error("Error fetching jadwal:", err);
      setJadwalList([]);
    } finally {
      setLoadingJadwal(false);
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {selectedDokter && (
          <JadwalDialog
            dokter={selectedDokter}
            poliNama={poli.nama_poli}
            poliId={poli.id}
            jadwalList={jadwalList}
            loading={loadingJadwal}
            onClose={() => {
              setSelectedDokter(null);
              setJadwalList([]);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: easeOut } satisfies Transition}
        className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 72, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 48, scale: 0.97 }}
          transition={{ duration: 0.5, ease } satisfies Transition}
          className="relative w-full sm:max-w-xl bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header poli */}
          <div className="relative bg-white px-6 pt-6 pb-5 shrink-0 border-b border-gray-100">
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-start gap-4 pr-12">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={
                  { duration: 0.5, ease, delay: 0.1 } satisfies Transition
                }
                className="inline-flex p-3.5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 shrink-0"
              >
                {IconComponent && <IconComponent className="w-7 h-7" />}
              </motion.div>
              <div className="pt-1 flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.15, duration: 0.45, ease } satisfies Transition
                  }
                  className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                >
                  Klinik Spesialis
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.2, duration: 0.5, ease } satisfies Transition
                  }
                  className="text-bittersweet-500 text-xl font-bold leading-snug"
                >
                  {"Klinik "} {poli.nama_poli}
                </motion.h2>
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                { delay: 0.28, duration: 0.5, ease } satisfies Transition
              }
              className="text-gray-500 text-sm leading-relaxed mt-3"
            >
              {poli.description}
            </motion.p>
          </div>

          {/* Daftar dokter */}
          <ScrollFadeWrapper maxHeight={360} className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-4 h-4 text-bittersweet-500" />
              <h3 className="text-gray-700 font-bold text-sm">
                Dokter{" "}
                {!loadingDokter && dokterList.length > 0 && (
                  <span className="text-bittersweet-500">
                    ({dokterList.length})
                  </span>
                )}
              </h3>
            </div>
            {loadingDokter ? (
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : dokterList.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex p-4 rounded-full bg-gray-100 mb-3">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">
                  Belum ada dokter terdaftar
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 pb-4">
                {dokterList.map((dokter) => (
                  <DokterRow
                    key={dokter.id}
                    dokter={dokter}
                    onLihatJadwal={handleLihatJadwal}
                  />
                ))}
              </div>
            )}
          </ScrollFadeWrapper>
        </motion.div>
      </motion.div>
    </>
  );
};

/* ─────────────────────────────────────────
   LAYANAN CARD (animated)
───────────────────────────────────────── */
const cardWrapVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease } satisfies Transition,
  },
};

interface LayananCardProps {
  layanan: Poli;
  index: number;
  globalIndex: number;
  onClick: (poli: Poli) => void;
}

const LayananCard: React.FC<LayananCardProps> = ({
  layanan,
  globalIndex,
  onClick,
}) => {
  const IconComponent = Icons[
    layanan.icon as keyof typeof Icons
  ] as React.ElementType;
  const numberString = (globalIndex + 1).toString().padStart(2, "0");
  const cardAppearDuration = 0.65;
  const innerBaseDelay = cardAppearDuration * 0.6;

  return (
    <motion.div
      variants={cardWrapVariants}
      whileHover={{
        y: -3,
        scale: 1.02,
        transition: { duration: 0.28, ease } satisfies Transition,
      }}
      onClick={() => onClick(layanan)}
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col overflow-hidden cursor-pointer"
    >
      <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
        {numberString}
      </div>
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.6, y: 8 },
          visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              duration: 0.45,
              ease,
              delay: innerBaseDelay,
            } satisfies Transition,
          },
        }}
        className="relative z-10 inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 self-start group-hover:scale-110 transition-transform duration-300"
      >
        {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
      </motion.div>
      <div className="relative z-10 flex flex-col grow">
        <motion.h3
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease,
                delay: innerBaseDelay + 0.08,
              } satisfies Transition,
            },
          }}
          className="text-xl sm:text-2xl font-bold text-bittersweet-500 mb-3 sm:mb-4 line-clamp-2 min-h-14"
        >
          {"Klinik "}
          {layanan.nama_poli}
        </motion.h3>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease,
                delay: innerBaseDelay + 0.16,
              } satisfies Transition,
            },
          }}
          className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 grow"
        >
          {layanan.description}
        </motion.p>
        <motion.div className="mt-4 flex items-center gap-1.5 text-bittersweet-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span>Lihat Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 animate-pulse">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-6" />
    <div className="h-6 w-3/4 bg-gray-100 rounded mb-4" />
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-5/6 bg-gray-100 rounded" />
      <div className="h-4 w-2/3 bg-gray-100 rounded" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const KlinikSpesialis = () => {
  const [layananList, setLayananList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPoli, setSelectedPoli] = useState<Poli | null>(null);

  useEffect(() => {
    const fetchLayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("poli")
          .select("*")
          .eq("status", "active")
          .order("urutan", { ascending: true });
        if (error) throw error;
        setLayananList(data || []);
      } catch (error) {
        console.error("Error fetching poli:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 120);
      }
    };
    fetchLayanan();
    const channel = supabase
      .channel("poli_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poli" },
        () => fetchLayanan(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLayanan = useMemo(() => {
    return layananList.filter((layanan) => {
      if (!searchQuery) return true;
      const title = layanan.nama_poli?.toLowerCase() || "";
      const description = layanan.description?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [layananList, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredLayanan.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLayanan = filteredLayanan.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <>
      <AnimatePresence>
        {selectedPoli && (
          <PoliDialog
            poli={selectedPoli}
            onClose={() => setSelectedPoli(null)}
          />
        )}
      </AnimatePresence>

      <div className="bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <Animate type="fadein" ready={dataReady}>
            <Banner
              title="Klinik Spesialis"
              subtitle="RS Siti Khodijah Muhammadiyah Cabang Sepanjang selalu berkomitmen menghadirkan inovasi layanan untuk pasien. Didukung oleh Dokter, Perawat, Paramedis dan Staf yang profesional dan ramah melayani pasien. Serta didukung dengan peralatan medis modern dan terbaru."
            />
          </Animate>

          <Animate
            type="slideup"
            ready={dataReady}
            delay={0.05}
            className="mt-12 mb-2"
          >
            <div className="flex justify-center">
              <div className="w-full max-w-3xl flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Cari klinik spesialis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-12">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && filteredLayanan.length === 0 && (
            <Animate
              type="slideup"
              ready={dataReady}
              className="text-center py-12"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                {searchQuery ? (
                  <Search className="w-12 h-12 text-gray-400" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery
                  ? "Tidak Ada Klinik Ditemukan"
                  : "Belum Ada Layanan"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian Anda."
                  : "Layanan unggulan belum tersedia saat ini."}
              </p>
            </Animate>
          )}

          {!loading && filteredLayanan.length > 0 && (
            <>
              <Animate
                key={`${searchQuery}-page-${currentPage}`}
                type="stagger"
                staggerChildren={0.1}
                delayChildren={0.03}
                ready={dataReady}
                once={false}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-12"
              >
                {currentLayanan.map((layanan, index) => (
                  <LayananCard
                    key={layanan.id}
                    layanan={layanan}
                    index={index}
                    globalIndex={startIndex + index}
                    onClick={setSelectedPoli}
                  />
                ))}
              </Animate>

              {filteredLayanan.length > ITEMS_PER_PAGE && (
                <Animate
                  type="fadein"
                  ready={dataReady}
                  delay={0.15}
                  once={false}
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredLayanan.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemLabel="klinik"
                    className="mt-2 mb-8"
                  />
                </Animate>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default KlinikSpesialis;
