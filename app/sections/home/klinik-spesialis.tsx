"use client";
import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import * as Icons from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

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

const HARI_ORDER = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

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
   HELPERS
───────────────────────────────────────── */
interface GroupedJadwal {
  hari: string;
  slots: { id: string; jam_mulai: string; jam_selesai: string }[];
}

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
    });
  }
  return Array.from(map.values());
}

/* ─────────────────────────────────────────
   JADWAL DIALOG
───────────────────────────────────────── */
interface JadwalDialogProps {
  dokter: Dokter;
  jadwalList: JadwalDokter[];
  loading: boolean;
  onClose: () => void;
}

const JadwalDialog: React.FC<JadwalDialogProps> = ({
  dokter,
  jadwalList,
  loading,
  onClose,
}) => {
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
          <div className="flex flex-col gap-1 flex-1">
            {group.slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-1.5 text-gray-500 text-sm"
              >
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  {slot.jam_mulai} – {slot.jam_selesai}
                </span>
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
                  style={{ objectPosition: "center 30%" }}
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
          </motion.div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-5 z-10"
            style={{
              background:
                "linear-gradient(to bottom, white 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-8 z-10"
            style={{
              background: "linear-gradient(to top, white 0%, transparent 100%)",
            }}
          />
          <div
            className="overflow-y-auto px-6 py-5 space-y-5"
            style={{
              maxHeight: "320px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onScroll={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
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
                    </div>
                    <div className="space-y-2">
                      {renderGrouped(groupedEksekutif, "eksekutif")}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   DOKTER ROW
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
    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-bittersweet-100 shrink-0 bg-bittersweet-50 flex items-center justify-center">
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
                  {poli.nama_poli}
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

          <div className="relative">
            <div
              className="pointer-events-none absolute top-0 inset-x-0 h-5 z-10"
              style={{
                background:
                  "linear-gradient(to bottom, white 0%, transparent 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute bottom-0 inset-x-0 h-8 z-10"
              style={{
                background:
                  "linear-gradient(to top, white 0%, transparent 100%)",
              }}
            />
            <div
              className="overflow-y-auto px-6 py-5"
              style={{
                maxHeight: "360px",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              onScroll={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

/* ─────────────────────────────────────────
   LAYANAN CARD
───────────────────────────────────────── */
interface LayananCardProps {
  layanan: Poli;
  index: number;
  onClick: (poli: Poli) => void;
}

const LayananCard: React.FC<LayananCardProps> = ({
  layanan,
  index,
  onClick,
}) => {
  const IconComponent = Icons[
    layanan.icon as keyof typeof Icons
  ] as React.ElementType;
  const numberString = (index + 1).toString().padStart(2, "0");

  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.02,
        transition: { duration: 0.28, ease } satisfies Transition,
      }}
      onClick={() => onClick(layanan)}
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col overflow-hidden cursor-pointer"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-bittersweet-400 to-bittersweet-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />
      <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
        {numberString}
      </div>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={
          {
            duration: 0.5,
            ease,
            delay: 0.1 + index * 0.05,
          } satisfies Transition
        }
        className="relative z-10 inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 self-start group-hover:scale-110 transition-transform duration-300"
      >
        {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
      </motion.div>
      <div className="relative z-10 flex flex-col grow">
        <h3 className="text-xl sm:text-2xl font-bold text-bittersweet-500 mb-3 sm:mb-4 line-clamp-2 min-h-14">
          {layanan.nama_poli}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 grow">
          {layanan.description}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-bittersweet-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span>Lihat Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const KlinikSpesiali = () => {
  const [layananList, setLayananList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [selectedPoli, setSelectedPoli] = useState<Poli | null>(null);

  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    const fetchLayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("poli")
          .select("*")
          .eq("status", "active")
          .order("urutan", { ascending: true })
          .limit(6);
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

      <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Section title — waits for data */}
          <Animate
            type="fadein"
            ready={dataReady}
            margin="-60px"
            className="text-center mb-12 sm:mb-16"
          >
            <Title
              badge="Layanan"
              title="Klinik Spesialis"
              badgeVariant="default"
              containerClassName="items-center"
            />
          </Animate>

          {/* Skeleton */}
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
                <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <div className="lg:hidden -mx-4 px-4">
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex-[0_0_85%] md:flex-[0_0_45%]">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!loading && layananList.length === 0 && (
            <Animate
              type="slideup"
              ready={dataReady}
              className="text-center py-12"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Belum Ada Layanan
              </h3>
              <p className="text-gray-500">
                Layanan unggulan belum tersedia saat ini.
              </p>
            </Animate>
          )}

          {!loading && layananList.length > 0 && (
            <>
              {/* Desktop grid — each card slides up one by one */}
              <Animate
                type="stagger"
                staggerChildren={0.13}
                delayChildren={0.05}
                ready={dataReady}
                margin="-60px"
                className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12"
              >
                {layananList.map((layanan, index) => (
                  <Animate key={layanan.id} type="slideup">
                    <LayananCard
                      layanan={layanan}
                      index={index}
                      onClick={setSelectedPoli}
                    />
                  </Animate>
                ))}
              </Animate>

              {/* Mobile carousel */}
              <Animate
                type="fadein"
                ready={dataReady}
                margin="-40px"
                className="lg:hidden mb-12"
              >
                <div className="-mx-4">
                  <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                    <div className="flex gap-4 md:gap-6">
                      {layananList.map((layanan, index) => (
                        <div
                          key={layanan.id}
                          className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                        >
                          <LayananCard
                            layanan={layanan}
                            index={index}
                            onClick={setSelectedPoli}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Animate>

              {/* See more CTA */}
              {layananList.length >= 6 && (
                <Animate
                  type="fadein"
                  ready={dataReady}
                  margin="-40px"
                  className="text-center mt-12"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 } satisfies Transition}
                    className="inline-block"
                  >
                    <Link href="/sections/klinik-spesialis">
                      <Button
                        variant="primary"
                        size="lg"
                        className="group shadow-lg"
                      >
                        Selengkapnya
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                </Animate>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default KlinikSpesiali;
