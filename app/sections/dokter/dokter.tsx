// app/sections/dokter/dokter.tsx
"use client";
import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import DialogPendaftaran, {
  type PendaftaranPrefill,
} from "@/components/ui/custom/dialog-pendaftaran";
import Input from "@/components/ui/custom/input";
import Pills from "@/components/ui/custom/pills";
import Select from "@/components/ui/custom/select";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  UserRound,
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
   useScrollIndicator — vertical scroll tracking
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
   ScrollFadeWrapper — reusable scroll area
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

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
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
}
interface Dokter {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: string;
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

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   JADWAL DIALOG
───────────────────────────────────────── */
interface JadwalDialogProps {
  dokter: Dokter;
  onClose: () => void;
}

const JadwalDialog: React.FC<JadwalDialogProps> = ({ dokter, onClose }) => {
  const router = useRouter();
  const [pendaftaranPrefill, setPendaftaranPrefill] =
    useState<PendaftaranPrefill | null>(null);

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
    setPendaftaranPrefill({
      poliId: dokter.poli_id,
      poliNama: dokter.poli?.nama_poli || "-",
      dokterId: dokter.id,
      dokterNama: dokter.nama,
      dokterProfile: dokter.profile,
      hari,
      jamMulai,
      jamSelesai,
    });
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
    <>
      {/* ── Dialog jadwal dokter ── */}
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
          {/* Jadwal view */}
          <motion.div
            key="jadwal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease } satisfies Transition}
            className="flex flex-col max-h-[85vh]"
          >
            {/* Hero image */}
            <div className="relative shrink-0 overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center bg-mariner-50">
                      <UserRound className="w-24 h-24 text-mariner-200" />
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
                {/* ── Nama dokter — klik untuk ke halaman detail ── */}
                <button
                  onClick={handleNavigateToDetail}
                  className="text-white font-bold text-xl leading-snug drop-shadow-sm hover:underline underline-offset-2 cursor-pointer transition-all group inline-flex items-center gap-1.5 justify-center"
                >
                  {dokter.nama}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                </button>
                <div className="mt-1">
                  <span className="inline-block text-xs font-medium text-mariner-200 bg-mariner-900/40 px-3 py-0.5 rounded-full">
                    {dokter.poli?.nama_poli || "–"}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Jadwal content */}
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

                  {/* ── Link ke halaman detail ── */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.16 } satisfies Transition}
                    onClick={handleNavigateToDetail}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl ring-1 ring-mariner-200 text-mariner-600 text-sm font-semibold hover:bg-mariner-50 transition-colors duration-150"
                  >
                    Lihat Profil Lengkap
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </>
              )}
            </ScrollFadeWrapper>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── DialogPendaftaran — terpisah, muncul di atas dialog jadwal ── */}
      {pendaftaranPrefill && (
        <DialogPendaftaran
          open={!!pendaftaranPrefill}
          onClose={() => setPendaftaranPrefill(null)}
          prefill={pendaftaranPrefill}
        />
      )}
    </>
  );
};

/* ─────────────────────────────────────────
   DOKTER CARD (stagger variants)
───────────────────────────────────────── */
const cardWrapVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease } satisfies Transition,
  },
};

const DokterCard: React.FC<{
  dokter: Dokter;
  onClick: (d: Dokter) => void;
}> = ({ dokter, onClick }) => {
  const cardAppearDuration = 0.6;
  const innerBaseDelay = cardAppearDuration * 0.55;

  return (
    <motion.div
      variants={cardWrapVariants}
      whileHover={{
        y: -3,
        scale: 1.02,
        transition: { duration: 0.25, ease } satisfies Transition,
      }}
      onClick={() => onClick(dokter)}
      className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center h-full overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-mariner-400 to-mariner-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.7, y: 8 },
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
        className="relative w-36 h-36 mb-4 shrink-0"
      >
        {dokter.profile ? (
          <Image
            src={dokter.profile}
            alt={dokter.nama}
            fill
            className="object-cover rounded-full ring-4 ring-mariner-50"
            sizes="144px"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center ring-4 ring-mariner-50">
            <UserRound className="w-16 h-16 text-white" />
          </div>
        )}
      </motion.div>

      <motion.h3
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.38,
              ease,
              delay: innerBaseDelay + 0.08,
            } satisfies Transition,
          },
        }}
        className="text-base font-bold text-mariner-500 mb-1 group-hover:text-mariner-600 transition-colors line-clamp-2 leading-snug"
      >
        {dokter.nama}
      </motion.h3>

      <motion.span
        variants={{
          hidden: { opacity: 0, y: 6 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.35,
              ease,
              delay: innerBaseDelay + 0.15,
            } satisfies Transition,
          },
        }}
        className="text-xs font-medium text-mariner-600 bg-mariner-50 px-3 py-1 rounded-full mt-1"
      >
        {dokter.poli?.nama_poli || "–"}
      </motion.span>

      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 0,
            transition: {
              duration: 0.3,
              ease,
              delay: innerBaseDelay + 0.22,
            } satisfies Transition,
          },
        }}
        className="mt-3 flex items-center gap-1 text-mariner-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <span>Lihat Jadwal</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 animate-pulse flex flex-col items-center">
    <div className="w-36 h-36 bg-gray-100 rounded-full mb-4" />
    <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
    <div className="h-3 w-20 bg-gray-100 rounded" />
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const DokterSpesialis = () => {
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);
  const [selectedPoli, setSelectedPoli] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedHari, setSelectedHari] = useState<string>("all");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [pillsCanScroll, setPillsCanScroll] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => setPillsCanScroll(emblaApi.canScrollNext());
    update();
    emblaApi.on("select", update);
    emblaApi.on("resize", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("resize", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

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
          `*, poli:poli_id (id, nama_poli), jadwal_dokter (id, hari, jam_mulai, jam_selesai, tipe_jadwal)`,
        )
        .eq("status", "active");
      if (error) throw error;
      const sorted = (dokterData || []).sort((a, b) =>
        (a.nama?.toLowerCase() || "").localeCompare(
          b.nama?.toLowerCase() || "",
          "id",
        ),
      );
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

  const searchFilteredDokter = useMemo(
    () =>
      dokterList.filter((d) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          d.nama.toLowerCase().includes(q) ||
          (d.poli?.nama_poli?.toLowerCase() || "").includes(q)
        );
      }),
    [dokterList, searchQuery],
  );

  const relevantPoliList = useMemo(() => {
    if (!searchQuery) return poliList;
    return poliList.filter((p) =>
      searchFilteredDokter.some((d) => d.poli_id === p.id),
    );
  }, [searchQuery, poliList, searchFilteredDokter]);

  const filteredDokter = useMemo(
    () =>
      dokterList.filter((d) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !d.nama.toLowerCase().includes(q) &&
            !(d.poli?.nama_poli?.toLowerCase() || "").includes(q)
          )
            return false;
        }
        if (selectedPoli !== "all" && d.poli_id !== selectedPoli) return false;
        if (
          selectedHari !== "all" &&
          !d.jadwal_dokter.some((j) => j.hari === selectedHari)
        )
          return false;
        return true;
      }),
    [dokterList, searchQuery, selectedPoli, selectedHari],
  );

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
            className="text-center mt-10 mb-12"
          >
            <Title
              title="Daftar Dokter Spesialis"
              align="center"
              subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
            />
          </Animate>

          {/* Filters */}
          <Animate
            type="slideup"
            ready={dataReady}
            delay={0.08}
            className="mb-8 space-y-5"
          >
            <div className="flex justify-center">
              <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-3">
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
                <div className="w-full sm:w-48 shrink-0">
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

            {!loading && poliList.length > 0 && (
              <div className="relative -mx-4 px-4 space-y-2">
                <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                  <div className="flex gap-2.5">
                    <Pills
                      label="Semua"
                      count={
                        searchQuery
                          ? searchFilteredDokter.length
                          : dokterList.length
                      }
                      variant={selectedPoli === "all" ? "active" : "default"}
                      onClick={() => handlePoliChange("all")}
                      size="md"
                    />
                    {relevantPoliList.map((poli) => (
                      <Pills
                        key={poli.id}
                        label={poli.nama_poli}
                        count={
                          searchFilteredDokter.filter(
                            (d) => d.poli_id === poli.id,
                          ).length
                        }
                        variant={
                          selectedPoli === poli.id ? "active" : "default"
                        }
                        onClick={() => handlePoliChange(poli.id)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
                <AnimatePresence>
                  {pillsCanScroll && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.6 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.6 }}
                      transition={{ duration: 0.4, ease }}
                      className="mx-4 flex items-center gap-2"
                    >
                      <div className="flex-1 h-0.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full w-1/4 rounded-full bg-gray-200" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0 select-none">
                        geser
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Animate>

          {/* Loading skeleton */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!loading && filteredDokter.length === 0 && (
            <Animate
              type="slideup"
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

          {/* Grid stagger */}
          {!loading && filteredDokter.length > 0 && (
            <Animate
              key={`${selectedPoli}-${selectedHari}-${searchQuery}`}
              type="stagger"
              staggerChildren={0.08}
              delayChildren={0.02}
              ready={true}
              margin="-60px"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
            >
              {filteredDokter.map((dokter) => (
                <DokterCard
                  key={dokter.id}
                  dokter={dokter}
                  onClick={handleCardClick}
                />
              ))}
            </Animate>
          )}
        </div>
      </div>
    </>
  );
};

export default DokterSpesialis;
