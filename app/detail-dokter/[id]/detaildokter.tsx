// app/detail-dokter/[id]/detaildokter.tsx
"use client";

import Animate from "@/components/animations/animate";
import DialogPendaftaran, {
  type PendaftaranPrefill,
} from "@/components/ui/custom/dialog-pendaftaran";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

interface PendidikanDokter {
  id: string;
  tahun: string;
  institusi: string;
  deskripsi?: string | null;
}

interface OrganisasiDokter {
  id: string;
  tahun: string;
  title: string;
}

interface PublikasiDokter {
  id: string;
  tahun: string;
  title: string;
}

interface DokterDetail {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: string;
  poli: Poli;
  jadwal_dokter: JadwalDokter[];
  pendidikan_dokter: PendidikanDokter[];
  organisasi_dokter: OrganisasiDokter[];
  publikasi_dokter: PublikasiDokter[];
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

/* ─────────────────────────────────────────
   IMAGE LIGHTBOX
───────────────────────────────────────── */
const ImageLightbox: React.FC<{
  src: string;
  alt: string;
  onClose: () => void;
}> = ({ src, alt, onClose }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 } satisfies Transition}
      className="fixed inset-0 z-110 flex items-center justify-center bg-black/95 backdrop-blur-lg cursor-zoom-out"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.4, ease } satisfies Transition}
        className="relative max-w-[90vw] max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          aria-label="Tutup gambar"
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>
        <div className="relative max-w-[88vw] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1600}
            className="object-contain max-w-[88vw] max-h-[85vh]"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   SECTION CARD
───────────────────────────────────────── */
const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="text-gray-800 font-semibold text-sm tracking-wide">
        {title}
      </h3>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

/* ─────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────── */
const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-sm text-gray-400 py-3 text-center">{label}</p>
);

/* ─────────────────────────────────────────
   JADWAL TABLE
───────────────────────────────────────── */
interface JadwalTableProps {
  groups: JadwalGroup[];
  type: "reguler" | "eksekutif";
  onDaftar?: (j: {
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
  }) => void;
}

const JadwalTable: React.FC<JadwalTableProps> = ({
  groups,
  type,
  onDaftar,
}) => {
  if (groups.length === 0) return null;

  // Flatten all rows for stagger indexing
  const allRows = groups.flatMap((group) =>
    group.slots.map((slot) => ({ group, slot })),
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md ${
            type === "eksekutif"
              ? "text-bittersweet-600 bg-bittersweet-50 border border-bittersweet-100"
              : "text-gray-600 bg-gray-50 border border-gray-200"
          }`}
        >
          {type === "eksekutif" ? "Eksekutif" : "BPJS / Reguler"}
        </span>
        {type === "eksekutif" && (
          <span className="text-[10px] text-gray-400">
            Klik{" "}
            <span className="font-semibold text-bittersweet-500">Daftar</span>{" "}
            untuk membuat janji
          </span>
        )}
      </div>

      <div
        className={`grid text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 mb-1 ${
          type === "eksekutif" ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        <span>Hari</span>
        <span>Jam Praktik</span>
        {type === "eksekutif" && <span>Buat Janji</span>}
      </div>

      <div className="divide-y divide-gray-50">
        {allRows.map(({ group, slot }, idx) => (
          <Animate
            key={slot.id}
            type="fielditem"
            delay={idx * 0.06}
            margin="-20px"
          >
            <div
              className={`grid items-center py-2.5 text-sm ${
                type === "eksekutif" ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <span className="text-gray-700 font-medium">{group.hari}</span>
              <span className="text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {formatTime(slot.jam_mulai)} – {formatTime(slot.jam_selesai)}
              </span>
              {type === "eksekutif" && (
                <div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      onDaftar?.({
                        hari: group.hari,
                        jam_mulai: slot.jam_mulai,
                        jam_selesai: slot.jam_selesai,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-bittersweet-500 hover:bg-bittersweet-600 px-3 py-1.5 rounded-full shadow-sm transition-colors duration-150"
                  >
                    Daftar
                    <ArrowRight className="w-3 h-3" />
                  </motion.button>
                </div>
              )}
            </div>
          </Animate>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   TIMELINE ITEM
───────────────────────────────────────── */
const TimelineItem: React.FC<{
  tahun: string;
  title: string;
  subtitle?: string | null;
  isLast: boolean;
  index: number;
}> = ({ tahun, title, subtitle, isLast, index }) => (
  <Animate type="slideleftitem" delay={index * 0.07} margin="-20px">
    <div className="flex gap-4">
      <div
        className="flex flex-col items-center"
        style={{ width: "14px", minWidth: "14px" }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 ring-2 ring-white shadow-sm mt-[5px] shrink-0" />
        <div
          className={`w-0 flex-1 mt-1.5 border-l-2 border-dashed border-gray-200 ${
            isLast ? "opacity-0" : "opacity-100"
          }`}
          style={{ minHeight: "20px" }}
        />
      </div>
      <div className="pb-5 min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] font-semibold tabular-nums text-gray-500 shrink-0">
            {tahun}
          </span>
          <span className="text-sm font-medium text-gray-800 leading-snug">
            {title}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </Animate>
);

/* ─────────────────────────────────────────
   STICKY LEFT PANEL
───────────────────────────────────────── */
const DokterProfile: React.FC<{
  dokter: DokterDetail;
  onZoom: () => void;
}> = ({ dokter, onZoom }) => (
  <div className="lg:sticky lg:top-28 flex flex-col gap-4">
    {/* Foto */}
    <Animate type="popin" delay={0.1}>
      <div
        className={`relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm group ${
          dokter.profile ? "cursor-zoom-in" : "cursor-default"
        }`}
        onClick={() => dokter.profile && onZoom()}
      >
        {dokter.profile ? (
          <>
            <Image
              src={dokter.profile}
              alt={dokter.nama}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: "center 20%" }}
              sizes="(max-width: 1024px) 80vw, 320px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserRound className="w-20 h-20 text-gray-300" />
          </div>
        )}
      </div>
    </Animate>

    {/* Info box */}
    <Animate type="fadein" delay={0.22}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-1.5">
        <h2 className="text-base font-bold text-gray-800 leading-snug">
          {dokter.nama}
        </h2>
        <p className="text-xs text-gray-500">
          Klinik {dokter.poli?.nama_poli || "–"}
        </p>
        <div className="pt-1">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              dokter.status === "active"
                ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                : "text-gray-500 bg-gray-50 border border-gray-200"
            }`}
          >
            {dokter.status === "active" ? "Aktif Praktik" : dokter.status}
          </span>
        </div>
      </div>
    </Animate>
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function DetailDokter() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [dokter, setDokter] = useState<DokterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendaftaranPrefill, setPendaftaranPrefill] =
    useState<PendaftaranPrefill | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchDokter = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dokter")
        .select(
          `
          *,
          poli:poli_id (id, nama_poli),
          jadwal_dokter (id, hari, jam_mulai, jam_selesai, tipe_jadwal),
          pendidikan_dokter (id, tahun, institusi, deskripsi),
          organisasi_dokter (id, tahun, title),
          publikasi_dokter (id, tahun, title)
          `,
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      setDokter(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDokter();
  }, [fetchDokter]);

  const jadwalReguler = (dokter?.jadwal_dokter ?? []).filter(
    (j) => j.tipe_jadwal === "reguler",
  );
  const jadwalEksekutif = (dokter?.jadwal_dokter ?? []).filter(
    (j) => j.tipe_jadwal === "eksekutif",
  );
  const groupedReguler = groupJadwalByHari(jadwalReguler);
  const groupedEksekutif = groupJadwalByHari(jadwalEksekutif);

  const sortedPendidikan = [...(dokter?.pendidikan_dokter ?? [])].sort(
    (a, b) => Number(b.tahun) - Number(a.tahun),
  );
  const sortedOrganisasi = [...(dokter?.organisasi_dokter ?? [])].sort(
    (a, b) => Number(b.tahun) - Number(a.tahun),
  );
  const sortedPublikasi = [...(dokter?.publikasi_dokter ?? [])].sort(
    (a, b) => Number(b.tahun) - Number(a.tahun),
  );

  const handleDaftar = (j: {
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
  }) => {
    if (!dokter) return;
    setPendaftaranPrefill({
      poliId: dokter.poli_id,
      poliNama: dokter.poli?.nama_poli || "-",
      dokterId: dokter.id,
      dokterNama: dokter.nama,
      dokterProfile: dokter.profile,
      hari: j.hari,
      jamMulai: j.jam_mulai,
      jamSelesai: j.jam_selesai,
    });
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10 pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="aspect-3/4 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dokter) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UserRound className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Dokter tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-mariner-500 text-sm font-semibold hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {lightboxOpen && dokter.profile && (
          <ImageLightbox
            src={dokter.profile}
            alt={dokter.nama}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="bg-gray-50 min-h-screen py-10 pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <Animate type="fadein" delay={0}>
            <motion.button
              onClick={() => router.back()}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors duration-150 mb-7 group"
            >
              <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-all duration-150 shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </span>
              Kembali
            </motion.button>
          </Animate>

          {/* Title */}
          <Animate type="fadein" delay={0.08}>
            <div className="mb-8">
              <Title
                badge="Dokter"
                title="Profil Dokter"
                subtitle="Informasi lengkap jadwal dan profil dokter spesialis"
                badgeVariant="primary"
              />
            </div>
          </Animate>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            {/* ── Left column ── */}
            <DokterProfile
              dokter={dokter}
              onZoom={() => setLightboxOpen(true)}
            />

            {/* ── Right column ── */}
            <div className="space-y-4">
              {/* Jadwal */}
              <Animate type="slideup" delay={0.15}>
                <SectionCard
                  title="Jadwal Praktik"
                  icon={<Calendar className="w-4 h-4 text-gray-500" />}
                >
                  {dokter.jadwal_dokter.length === 0 ? (
                    <div className="flex items-center gap-2.5 py-5 justify-center text-gray-400">
                      <Calendar className="w-5 h-5 shrink-0" />
                      <span className="text-sm">Belum ada jadwal tersedia</span>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <JadwalTable groups={groupedReguler} type="reguler" />
                      {groupedReguler.length > 0 &&
                        groupedEksekutif.length > 0 && (
                          <Animate type="growx" delay={0.1}>
                            <hr className="border-gray-100" />
                          </Animate>
                        )}
                      <JadwalTable
                        groups={groupedEksekutif}
                        type="eksekutif"
                        onDaftar={handleDaftar}
                      />
                    </div>
                  )}
                </SectionCard>
              </Animate>

              {/* Pendidikan */}
              <Animate type="slideup" delay={0.22}>
                <SectionCard
                  title="Pendidikan"
                  icon={<GraduationCap className="w-4 h-4 text-gray-500" />}
                >
                  {sortedPendidikan.length === 0 ? (
                    <EmptyState label="Belum ada data pendidikan" />
                  ) : (
                    <div className="pt-1">
                      {sortedPendidikan.map((p, i) => (
                        <TimelineItem
                          key={p.id}
                          tahun={p.tahun}
                          title={p.institusi}
                          subtitle={p.deskripsi}
                          isLast={i === sortedPendidikan.length - 1}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              </Animate>

              {/* Organisasi */}
              <Animate type="slideup" delay={0.29}>
                <SectionCard
                  title="Organisasi"
                  icon={<Briefcase className="w-4 h-4 text-gray-500" />}
                >
                  {sortedOrganisasi.length === 0 ? (
                    <EmptyState label="Belum ada data organisasi" />
                  ) : (
                    <div className="pt-1">
                      {sortedOrganisasi.map((o, i) => (
                        <TimelineItem
                          key={o.id}
                          tahun={o.tahun}
                          title={o.title}
                          isLast={i === sortedOrganisasi.length - 1}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              </Animate>

              {/* Publikasi */}
              <Animate type="slideup" delay={0.36}>
                <SectionCard
                  title="Publikasi"
                  icon={<BookOpen className="w-4 h-4 text-gray-500" />}
                >
                  {sortedPublikasi.length === 0 ? (
                    <EmptyState label="Belum ada data publikasi" />
                  ) : (
                    <div className="pt-1">
                      {sortedPublikasi.map((p, i) => (
                        <TimelineItem
                          key={p.id}
                          tahun={p.tahun}
                          title={p.title}
                          isLast={i === sortedPublikasi.length - 1}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              </Animate>
            </div>
          </div>
        </div>
      </div>

      {pendaftaranPrefill && (
        <DialogPendaftaran
          open={!!pendaftaranPrefill}
          onClose={() => setPendaftaranPrefill(null)}
          prefill={pendaftaranPrefill}
        />
      )}
    </>
  );
}
