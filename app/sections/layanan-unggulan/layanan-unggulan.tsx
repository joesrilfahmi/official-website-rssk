"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import DialogPendaftaran, {
  type PendaftaranPrefill,
} from "@/components/ui/custom/dialog-pendaftaran";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";

import {
  Activity,
  ArrowRight,
  Baby,
  Bone,
  Brain,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOut: [number, number, number, number] = [0.0, 0.0, 0.2, 1];

// ── Types ──────────────────────────────────────────────────────────────────

interface KondisiMedis {
  id: string;
  title: string;
  description: string;
  urutan: number;
}

interface TeknologiMedis {
  id: string;
  title: string;
  description: string;
  urutan: number;
}

interface DokterItem {
  dokter_id: string;
  dokter: {
    nama: string;
    profile: string | null;
    status: string;
    poli_id: string;
    poli: { nama_poli: string } | null;
  } | null;
}

interface JadwalDokter {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: string;
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
  poli: { id: string; nama_poli: string } | null;
  layanan_unggulan_kondisi: KondisiMedis[];
  layanan_unggulan_teknologi: TeknologiMedis[];
  layanan_unggulan_dokter: DokterItem[];
}

// ── Status config ──────────────────────────────────────────────────────────

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

// ── Icon resolver ──────────────────────────────────────────────────────────

function resolveIcon(iconName: string, className = "w-5 h-5"): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    heart: <Heart className={className} />,
    bone: <Bone className={className} />,
    activity: <Activity className={className} />,
    "file-text": <FileText className={className} />,
    stethoscope: <Stethoscope className={className} />,
    brain: <Brain className={className} />,
    eye: <Eye className={className} />,
    baby: <Baby className={className} />,
  };
  return map[iconName] ?? <Stethoscope className={className} />;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="bg-gray-100 rounded-2xl p-2 space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 rounded-xl bg-white/60 animate-pulse flex items-center gap-3"
        >
          <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-4/6 bg-gray-100 rounded" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-100 rounded" />
        ))}
      </div>
      <div className="pt-6 border-t border-gray-100 space-y-3">
        <div className="h-6 w-56 bg-gray-200 rounded" />
        <div className="flex gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-4/5 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



// ── TabList — native CSS horizontal scroll on mobile ──────────────────────

const TAB_LIST = [
  { key: "kondisi" as const, label: "Kondisi Medis" },
  { key: "teknologi" as const, label: "Teknologi Medis" },
  { key: "dokter" as const, label: "Dokter Kami" },
];

interface TabCarouselProps {
  activeTab: "kondisi" | "teknologi" | "dokter";
  onTabChange: (tab: "kondisi" | "teknologi" | "dokter") => void;
}

function TabCarousel({ activeTab, onTabChange }: TabCarouselProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  return (
    <div
      className="flex mb-6 border-b border-gray-200 overflow-x-auto"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {TAB_LIST.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={isActive ? activeRef : null}
            onClick={() => onTabChange(tab.key)}
            className={`flex-none px-5 py-3 font-medium text-sm whitespace-nowrap transition-all ${
              isActive
                ? "text-mariner-600 border-b-2 border-mariner-600"
                : "text-gray-600 hover:text-mariner-600"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── JadwalDialog per dokter ────────────────────────────────────────────────

interface JadwalDialogProps {
  dokter: DokterItem["dokter"] & { id: string };
  poliId: string;
  poliNama: string;
  onClose: () => void;
}

const JadwalDialog: React.FC<JadwalDialogProps> = ({
  dokter,
  poliId,
  poliNama,
  onClose,
}) => {
  const router = useRouter();
  const [jadwalList, setJadwalList] = useState<JadwalDokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendaftaranPrefill, setPendaftaranPrefill] =
    useState<PendaftaranPrefill | null>(null);

  useEffect(() => {
    const fetchJadwal = async () => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [dokter.id]);

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

  const handleNavigateToDetail = () => {
    onClose();
    router.push(`/detail-dokter/${dokter.id}`);
  };

  const HARI_ORDER = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  interface GroupedSlot {
    id: string;
    jam_mulai: string;
    jam_selesai: string;
    tipe_jadwal: string;
  }
  interface GroupedJadwal {
    hari: string;
    slots: GroupedSlot[];
  }

  const grouped: GroupedJadwal[] = React.useMemo(() => {
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
  }, [HARI_ORDER, jadwalList]);

  const groupedReguler = grouped
    .filter((g) => g.slots.some((s) => s.tipe_jadwal === "reguler"))
    .map((g) => ({
      ...g,
      slots: g.slots.filter((s) => s.tipe_jadwal === "reguler"),
    }));

  const groupedEksekutif = grouped
    .filter((g) => g.slots.some((s) => s.tipe_jadwal === "eksekutif"))
    .map((g) => ({
      ...g,
      slots: g.slots.filter((s) => s.tipe_jadwal === "eksekutif"),
    }));

  const handleDaftar = (hari: string, jamMulai: string, jamSelesai: string) => {
    setPendaftaranPrefill({
      poliId,
      poliNama,
      dokterId: dokter.id,
      dokterNama: dokter.nama,
      dokterProfile: dokter.profile,
      hari,
      jamMulai,
      jamSelesai,
    });
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-mariner-500 hover:bg-mariner-600 px-3 py-1.5 rounded-full shadow-sm shadow-mariner-500/20 transition-colors duration-150 shrink-0"
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: easeOut } satisfies Transition}
        className="fixed inset-0 z-150 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
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
            {/* ── Tombol Lihat Profil — kiri atas ── */}
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

            {/* ── Tombol tutup — kanan atas ── */}
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
                  <div className="w-full h-full flex items-center justify-center bg-mariner-50">
                    <Stethoscope className="w-24 h-24 text-mariner-200" />
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
              {/* ── Poli + Status badges ── */}
              <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                {dokter.poli?.nama_poli && (
                  <span className="inline-block text-xs font-medium text-mariner-200 bg-mariner-900/40 px-3 py-0.5 rounded-full">
                    {dokter.poli.nama_poli}
                  </span>
                )}
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusConfig(dokter.status ?? "active").className}`}
                >
                  {getStatusConfig(dokter.status ?? "active").label}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Jadwal content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
                      <span className="text-xs font-bold uppercase tracking-widest text-mariner-600 bg-mariner-50 px-3 py-1 rounded-full">
                        Eksekutif
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Klik{" "}
                        <span className="font-semibold text-mariner-500">
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
          </div>
        </motion.div>
      </motion.div>

      {/* DialogPendaftaran */}
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

// ── DokterCard ─────────────────────────────────────────────────────────────

interface DokterCardProps {
  item: DokterItem;
  poliId: string;
  poliNama: string;
}

const DokterCard: React.FC<DokterCardProps> = ({ item, poliId, poliNama }) => {
  const [showJadwal, setShowJadwal] = useState(false);

  if (!item.dokter) return null;

  const dokterWithId = { ...item.dokter, id: item.dokter_id };

  return (
    <>
      <AnimatePresence>
        {showJadwal && (
          <JadwalDialog
            dokter={dokterWithId}
            poliId={poliId}
            poliNama={poliNama}
            onClose={() => setShowJadwal(false)}
          />
        )}
      </AnimatePresence>

      <div className="bg-mariner-50 border border-mariner-100 rounded-lg p-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-mariner-50 overflow-hidden ring-2 ring-mariner-100 shrink-0 flex items-center justify-center">
          <User className="w-5 h-5 text-mariner-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-mariner-600 text-sm truncate">
            {item.dokter.nama}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.dokter.poli?.nama_poli && (
              <p className="text-gray-500 text-xs truncate">
                {item.dokter.poli.nama_poli}
              </p>
            )}
            {/* Status badge */}
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${getStatusConfig(item.dokter.status ?? "active").className}`}
            >
              {getStatusConfig(item.dokter.status ?? "active").label}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowJadwal(true)}
          className="shrink-0"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Jadwal</span>
        </Button>
      </div>
    </>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export default function LayananUnggulanSection() {
  const [services, setServices] = useState<LayananUnggulan[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "kondisi" | "teknologi" | "dokter"
  >("kondisi");
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    setActiveTab("kondisi");
  }, [selectedId]);

  useEffect(() => {
    fetchLayanan();
    const channel = supabase
      .channel("layanan_unggulan_section")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layanan_unggulan" },
        () => {
          fetchLayanan();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLayanan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("layanan_unggulan")
        .select(
          `
          id, title, description, specializations, additional_info, icon, status, urutan,
          poli:poli_id(id, nama_poli),
          layanan_unggulan_kondisi(id, title, description, urutan),
          layanan_unggulan_teknologi(id, title, description, urutan),
          layanan_unggulan_dokter(
            dokter_id,
            dokter:dokter_id(nama, profile, status, poli_id, poli:poli_id(nama_poli))
          )
        `,
        )
        .eq("status", "active")
        .order("urutan", { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as unknown as LayananUnggulan[];
      result.forEach((s) => {
        s.layanan_unggulan_kondisi?.sort((a, b) => a.urutan - b.urutan);
        s.layanan_unggulan_teknologi?.sort((a, b) => a.urutan - b.urutan);
      });

      setServices(result);
      if (result.length > 0) setSelectedId(result[0].id);
    } catch (err) {
      console.error("Error fetching layanan unggulan:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setDataReady(true), 120);
    }
  };

  const current = services.find((s) => s.id === selectedId);
  const hasKondisi = (current?.layanan_unggulan_kondisi?.length ?? 0) > 0;
  const hasTeknologi = (current?.layanan_unggulan_teknologi?.length ?? 0) > 0;
  const hasDokter = (current?.layanan_unggulan_dokter?.length ?? 0) > 0;

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Layanan Unggulan"
            subtitle="Kami menyediakan layanan terbaik untuk memenuhi kebutuhan kesehatan Anda."
          />
        </Animate>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          {/* Sidebar */}
          <Animate type="slideleft" ready={dataReady} className="lg:col-span-1">
            {loading ? (
              <SidebarSkeleton />
            ) : services.length === 0 ? (
              <div className="bg-gray-100 rounded-2xl p-6 text-center text-gray-400 text-sm">
                Belum ada layanan tersedia.
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-2 space-y-2 sticky top-4">
                <Animate
                  type="stagger"
                  staggerChildren={0.08}
                  delayChildren={0.1}
                  ready={dataReady}
                >
                  {services.map((service) => (
                    <Animate key={service.id} type="fielditem">
                      <button
                        onClick={() => setSelectedId(service.id)}
                        className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          selectedId === service.id
                            ? "bg-white shadow-md text-mariner-600 font-semibold"
                            : "text-gray-700 hover:bg-white/50"
                        }`}
                      >
                        <span
                          className={
                            selectedId === service.id
                              ? "text-mariner-600"
                              : "text-gray-500"
                          }
                        >
                          {resolveIcon(service.icon)}
                        </span>
                        <span className="text-base">{service.title}</span>
                      </button>
                    </Animate>
                  ))}
                </Animate>
              </div>
            )}
          </Animate>

          {/* Content */}
          <Animate
            type="slideright"
            ready={dataReady}
            delay={0.1}
            className="lg:col-span-3"
          >
            {loading ? (
              <ContentSkeleton />
            ) : !current ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400">
                Pilih layanan di sebelah kiri.
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                <div className="space-y-6">
                  <Animate type="fadein" ready={dataReady}>
                    <h2 className="text-3xl font-bold text-mariner-600 mb-6">
                      {current.title}
                    </h2>
                  </Animate>

                  <Animate type="fadein" ready={dataReady} delay={0.05}>
                    <p className="text-gray-700 text-base leading-relaxed">
                      {current.description}
                    </p>
                  </Animate>

                  {current.specializations?.length > 0 && (
                    <Animate type="fadein" ready={dataReady} delay={0.1}>
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-mariner-600 mb-4">
                          Layanan yang Tersedia:
                        </h3>
                        <Animate
                          type="stagger"
                          staggerChildren={0.07}
                          delayChildren={0.05}
                          ready={dataReady}
                        >
                          {current.specializations.map((spec, index) => (
                            <Animate key={index} type="slideleftitem">
                              <li className="flex items-start list-none">
                                <span className="inline-block w-2 h-2 bg-mariner-500 rounded-full mt-2 mr-3 shrink-0" />
                                <span className="text-gray-700 text-base">
                                  {spec}
                                </span>
                              </li>
                            </Animate>
                          ))}
                        </Animate>
                      </div>
                    </Animate>
                  )}

                  {current.additional_info && (
                    <Animate type="fadein" ready={dataReady} delay={0.15}>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                          {current.additional_info}
                        </p>
                      </div>
                    </Animate>
                  )}

                  {/* Tabs Section */}
                  <Animate type="slideup" ready={dataReady} delay={0.2}>
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-2xl font-bold text-mariner-600 mb-2">
                        Jadwal Praktik Dokter RS Siti Khodijah Muhammadiyah
                        Cabang Sepanjang
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Klinik rawat jalan{" "}
                        {current.poli?.nama_poli
                          ? `Layanan ${current.poli.nama_poli}`
                          : "Layanan"}
                        , memberikan fleksibilitas bagi Anda untuk membuat janji
                        temu sesuai dengan waktu yang tersedia.
                      </p>

                      {/* Tab buttons — Embla carousel on mobile, flex on desktop */}
                      <Animate type="growx" ready={dataReady} delay={0.05}>
                        <TabCarousel
                          activeTab={activeTab}
                          onTabChange={setActiveTab}
                        />
                      </Animate>

                      {/* Tab Content */}
                      <div>
                        {/* Kondisi Medis */}
                        {activeTab === "kondisi" &&
                          (hasKondisi ? (
                            <Animate
                              key={`kondisi-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_kondisi.map((item) => (
                                <Animate
                                  key={item.id}
                                  type="slideup"
                                  once={false}
                                >
                                  <div className="bg-mariner-50 border border-mariner-100 rounded-lg p-4">
                                    <h4 className="font-semibold text-mariner-600 mb-2">
                                      {item.title}
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </Animate>
                              ))}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}

                        {/* Teknologi Medis */}
                        {activeTab === "teknologi" &&
                          (hasTeknologi ? (
                            <Animate
                              key={`teknologi-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_teknologi.map(
                                (item) => (
                                  <Animate
                                    key={item.id}
                                    type="slideup"
                                    once={false}
                                  >
                                    <div className="bg-mariner-50 border border-mariner-100 rounded-lg p-4">
                                      <h4 className="font-semibold text-mariner-600 mb-2">
                                        {item.title}
                                      </h4>
                                      <p className="text-gray-700 text-sm leading-relaxed">
                                        {item.description}
                                      </p>
                                    </div>
                                  </Animate>
                                ),
                              )}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}

                        {/* Dokter Kami */}
                        {activeTab === "dokter" &&
                          (hasDokter ? (
                            <Animate
                              key={`dokter-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_dokter.map((item) => (
                                <Animate
                                  key={item.dokter_id}
                                  type="slideup"
                                  once={false}
                                >
                                  <DokterCard
                                    item={item}
                                    poliId={current.poli?.id ?? ""}
                                    poliNama={
                                      current.poli?.nama_poli ?? current.title
                                    }
                                  />
                                </Animate>
                              ))}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}
                      </div>
                    </div>
                  </Animate>
                </div>
              </div>
            )}
          </Animate>
        </div>
      </div>
    </section>
  );
}

function EmptyTab() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Informasi tidak tersedia untuk layanan ini.
      </p>
    </div>
  );
}