"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  User2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import Animate, { ease } from "@/components/animations/animate";
import Input from "@/components/ui/custom/input";
import Textarea from "@/components/ui/custom/textarea";
import Select from "@/components/ui/custom/select";
import DatePicker from "@/components/ui/custom/datepicker";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import {
  getAllProvinces,
  getRegenciesOfProvinceCode,
  getDistrictsOfCityCode,
  getVillagesOfDistrictCode,
} from "indonesia-nodejs";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Poli {
  id: string;
  nama_poli: string;
  status: string;
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
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PasienData {
  no_rm: string;
  nama: string;
  email?: string;
  no_telp?: string;
}

interface FormData {
  noRm: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  statusPernikahan: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  ortuPriaSuami: string;
  noTelp: string;
  email: string;
  alamat: string;
  rt: string;
  rw: string;
  provinsi: string;
  provinsiCode: number;
  kabupaten: string;
  kabupatenCode: number;
  kecamatan: string;
  kecamatanCode: number;
  kelurahan: string;
  kelurahanCode: number;
  poli: string;
  dokter: string;
  tglBerkunjung: string;
  waktuBerkunjung: string;
  keluhan: string;
}

/* ─────────────────────────────────────────
   STATIC OPTIONS
───────────────────────────────────────── */
const JENIS_KELAMIN_OPTIONS: SelectOption[] = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];
const AGAMA_OPTIONS: SelectOption[] = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Konghucu", label: "Konghucu" },
  { value: "Lainnya", label: "Lainnya" },
];
const STATUS_PERNIKAHAN_OPTIONS: SelectOption[] = [
  { value: "Belum Menikah", label: "Belum Menikah" },
  { value: "Menikah", label: "Menikah" },
  { value: "Cerai Hidup", label: "Cerai Hidup" },
  { value: "Cerai Mati", label: "Cerai Mati" },
];
const PENDIDIKAN_OPTIONS: SelectOption[] = [
  { value: "Tidak Sekolah", label: "Tidak Sekolah" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA/SMK", label: "SMA/SMK" },
  { value: "D1/D2/D3", label: "D1/D2/D3" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
];
const PEKERJAAN_OPTIONS: SelectOption[] = [
  { value: "Tidak Bekerja", label: "Tidak Bekerja" },
  { value: "PNS", label: "PNS" },
  { value: "TNI/POLRI", label: "TNI/POLRI" },
  { value: "Pegawai Swasta", label: "Pegawai Swasta" },
  { value: "Wiraswasta", label: "Wiraswasta" },
  { value: "Petani", label: "Petani" },
  { value: "Nelayan", label: "Nelayan" },
  { value: "Buruh", label: "Buruh" },
  { value: "Pelajar/Mahasiswa", label: "Pelajar/Mahasiswa" },
  { value: "Ibu Rumah Tangga", label: "Ibu Rumah Tangga" },
  { value: "Pensiunan", label: "Pensiunan" },
  { value: "Lainnya", label: "Lainnya" },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function formatTanggal(d: string): string {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function isDateToday(dateStr: string): boolean {
  const n = new Date();
  return (
    dateStr ===
    `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
  );
}
function parseMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function fmtTime(t: string): string {
  const p = t.split(":");
  return p.length >= 2
    ? `${p[0].padStart(2, "0")}:${p[1].padStart(2, "0")}`
    : t;
}
function toSelectOptions(
  list: { code: number; name: string }[],
): SelectOption[] {
  return list.map((x) => ({ value: String(x.code), label: x.name }));
}

const HARI_MAP: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

const EMPTY_KUNJUNGAN = {
  poli: "",
  dokter: "",
  tglBerkunjung: "",
  waktuBerkunjung: "",
  keluhan: "",
};
const EMPTY: FormData = {
  noRm: "",
  nik: "",
  nama: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  agama: "",
  statusPernikahan: "",
  pendidikanTerakhir: "",
  pekerjaan: "",
  ortuPriaSuami: "",
  noTelp: "",
  email: "",
  alamat: "",
  rt: "",
  rw: "",
  provinsi: "",
  provinsiCode: 0,
  kabupaten: "",
  kabupatenCode: 0,
  kecamatan: "",
  kecamatanCode: 0,
  kelurahan: "",
  kelurahanCode: 0,
  ...EMPTY_KUNJUNGAN,
};

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease },
  },
  exit: { opacity: 0, y: 40, scale: 0.97, transition: { duration: 0.3 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease },
  },
};
const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/* ─────────────────────────────────────────
   SECTION DIVIDER
───────────────────────────────────────── */
function SectionDivider({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-mariner-500">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-mariner-600">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-mariner-100" />
    </div>
  );
}

/* ─────────────────────────────────────────
   CONFIRM ROW
───────────────────────────────────────── */
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-gray-500 shrink-0 w-32">{label}</span>
      <span className="text-xs font-semibold text-gray-900 text-right">
        {value || "-"}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   BACK BUTTON (styled like KritikSaran)
───────────────────────────────────────── */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.35, ease }}
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-6 group"
    >
      <svg
        className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
      Kembali
    </motion.button>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function PendaftaranSection() {
  const [mode, setMode] = useState<null | "lama" | "baru">(null);
  const [choiceReady, setChoiceReady] = useState(false);

  const [searchNik, setSearchNik] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PasienData | null>(null);
  const [searchError, setSearchError] = useState("");

  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTimeExpired, setShowTimeExpired] = useState(false);

  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<Dokter[]>([]);
  const [jadwalDokter, setJadwalDokter] = useState<JadwalDokter[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingPoli, setLoadingPoli] = useState(true);
  const [loadingDokter, setLoadingDokter] = useState(false);
  const [loadingJadwal, setLoadingJadwal] = useState(false);

  const [provinsiOpts, setProvinsiOpts] = useState<SelectOption[]>([]);
  const [kabupatenOpts, setKabupatenOpts] = useState<SelectOption[]>([]);
  const [kecamatanOpts, setKecamatanOpts] = useState<SelectOption[]>([]);
  const [kelurahanOpts, setKelurahanOpts] = useState<SelectOption[]>([]);
  const [loadingKab, setLoadingKab] = useState(false);
  const [loadingKec, setLoadingKec] = useState(false);
  const [loadingKel, setLoadingKel] = useState(false);
  const [regionError, setRegionError] = useState("");

  /* ── Today for DatePicker min ── */
  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  useEffect(() => {
    setTimeout(() => setChoiceReady(true), 80);
    getAllProvinces()
      .then((list) => setProvinsiOpts(toSelectOptions(list)))
      .catch(() => setRegionError("Gagal memuat data wilayah."));
    fetchPoliList();
  }, []);

  const fetchPoliList = async () => {
    setLoadingPoli(true);
    try {
      const { data, error } = await supabase
        .from("poli")
        .select("id, nama_poli, status")
        .eq("status", "active")
        .order("nama_poli", { ascending: true });
      if (error) throw error;
      setPoliList(data || []);
    } catch {
      setPoliList([]);
    } finally {
      setLoadingPoli(false);
    }
  };

  const fetchDokterByPoli = async (poliId: string) => {
    setLoadingDokter(true);
    try {
      const { data, error } = await supabase
        .from("dokter")
        .select("id, nama, poli_id, profile, status")
        .eq("status", "active")
        .eq("poli_id", poliId)
        .order("nama", { ascending: true });
      if (error) throw error;
      setFilteredDokter(data || []);
    } catch {
      setFilteredDokter([]);
    } finally {
      setLoadingDokter(false);
    }
  };

  const generateAvailableDates = useCallback((jadwal: JadwalDokter[]) => {
    if (jadwal.length === 0) {
      setAvailableDates([]);
      return;
    }
    const HARI_IDX: Record<string, number> = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    };
    const available = jadwal.map((j) => HARI_IDX[j.hari]);
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (available.includes(d.getDay())) {
        dates.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        );
      }
    }
    setAvailableDates(dates);
  }, []);

  const generateAvailableTimes = useCallback(
    (selectedDate: string, jadwal: JadwalDokter[]) => {
      const date = new Date(selectedDate + "T00:00:00");
      const jadwalHari = jadwal.filter(
        (j) => j.hari === HARI_MAP[date.getDay()],
      );
      if (jadwalHari.length === 0) {
        setAvailableTimes([]);
        return;
      }
      const isTodayDate = isDateToday(selectedDate);
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      const times: string[] = [];
      jadwalHari.forEach((j) => {
        if (!j.jam_mulai || !j.jam_selesai) return;
        const start = fmtTime(j.jam_mulai);
        const end = fmtTime(j.jam_selesai);
        if (isTodayDate && parseMinutes(start) <= current) return;
        times.push(`${start} - ${end}`);
      });
      setAvailableTimes(times);
    },
    [],
  );

  const fetchJadwalDokter = useCallback(
    async (dokterId: string) => {
      setLoadingJadwal(true);
      try {
        const { data, error } = await supabase
          .from("jadwal_dokter")
          .select("*")
          .eq("dokter_id", dokterId)
          .order("hari", { ascending: true });
        if (error) throw error;
        const jadwal = data || [];
        setJadwalDokter(jadwal);
        generateAvailableDates(jadwal);
        setAvailableTimes([]);
      } catch {
        setJadwalDokter([]);
        setAvailableDates([]);
        setAvailableTimes([]);
      } finally {
        setLoadingJadwal(false);
      }
    },
    [generateAvailableDates],
  );

  useEffect(() => {
    if (form.dokter) fetchJadwalDokter(form.dokter);
    else {
      setJadwalDokter([]);
      setAvailableDates([]);
      setAvailableTimes([]);
    }
  }, [form.dokter, fetchJadwalDokter]);

  useEffect(() => {
    if (form.tglBerkunjung && jadwalDokter.length > 0)
      generateAvailableTimes(form.tglBerkunjung, jadwalDokter);
    else setAvailableTimes([]);
  }, [form.tglBerkunjung, jadwalDokter, generateAvailableTimes]);

  /* ─────────────────────────────────────────
     SEARCH PASIEN
  ───────────────────────────────────────── */
  const handleSearch = async () => {
    if (!searchNik.trim() || !/^\d{16}$/.test(searchNik.trim())) {
      setSearchError("Masukkan NIK yang valid (16 digit angka).");
      return;
    }
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_EHOS_MASTER_PASIEN;
      if (!apiUrl)
        throw new Error("NEXT_PUBLIC_API_EHOS_MASTER_PASIEN tidak dikonfigurasi");
      const res = await fetch(`${apiUrl}&px_noktp=${searchNik.trim()}`);
      if (!res.ok) throw new Error("Gagal menghubungi server");
      const json = await res.json();

      /*
       * Format API: { status: true, data: [{ px_norm: "...", px_name: "..." }] }
       * Fallback   : objek langsung { no_rm, nama } (format lama)
       */
      let rawItem: Record<string, string> | null = null;

      if (json?.status === true && Array.isArray(json?.data) && json.data.length > 0) {
        // Format baru
        rawItem = json.data[0];
      } else if (Array.isArray(json) && json.length > 0) {
        // Array langsung
        rawItem = json[0];
      } else if (json && typeof json === "object" && !Array.isArray(json)) {
        // Objek tunggal (format lama)
        rawItem = json;
      }

      // Normalise field names: px_norm → no_rm, px_name → nama
      const noRm  = rawItem?.px_norm ?? rawItem?.no_rm  ?? "";
      const nama  = rawItem?.px_name ?? rawItem?.nama   ?? "";
      const email = rawItem?.email   ?? "";
      const noTelp = rawItem?.no_telp ?? rawItem?.telepon ?? "";

      if (!noRm) {
        setSearchError(
          "Pasien dengan NIK tersebut tidak ditemukan. Silakan daftar sebagai pasien baru.",
        );
        return;
      }

      const pasien: PasienData = { no_rm: noRm, nama, email, no_telp: noTelp };
      setSearchResult(pasien);
      setForm((p) => ({
        ...p,
        noRm:   pasien.no_rm,
        nik:    searchNik.trim(),
        nama:   pasien.nama,
        email:  pasien.email  ?? "",
        noTelp: pasien.no_telp ?? "",
      }));
    } catch {
      setSearchError(
        "Gagal menghubungi server. Periksa koneksi atau coba beberapa saat lagi.",
      );
    } finally {
      setSearching(false);
    }
  };

  /* ─────────────────────────────────────────
     FIELD HELPERS
  ───────────────────────────────────────── */
  const setField = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  };

  const handlePoliChange = (poliId: string) => {
    setForm((p) => ({
      ...p,
      poli: poliId,
      dokter: "",
      tglBerkunjung: "",
      waktuBerkunjung: "",
    }));
    setErrors((p) => {
      const n = { ...p };
      delete n.poli;
      delete n.dokter;
      delete n.tglBerkunjung;
      delete n.waktuBerkunjung;
      return n;
    });
    setFilteredDokter([]);
    setJadwalDokter([]);
    setAvailableDates([]);
    setAvailableTimes([]);
    if (poliId) fetchDokterByPoli(poliId);
  };
  const handleDokterChange = (dokterId: string) => {
    setForm((p) => ({
      ...p,
      dokter: dokterId,
      tglBerkunjung: "",
      waktuBerkunjung: "",
    }));
    setErrors((p) => {
      const n = { ...p };
      delete n.dokter;
      delete n.tglBerkunjung;
      delete n.waktuBerkunjung;
      return n;
    });
  };
  const handleDateChange = (date: string) => {
    setForm((p) => ({ ...p, tglBerkunjung: date, waktuBerkunjung: "" }));
    setErrors((p) => {
      const n = { ...p };
      delete n.tglBerkunjung;
      delete n.waktuBerkunjung;
      return n;
    });
  };
  const handleTimeChange = (time: string) => {
    if (time && form.tglBerkunjung && isDateToday(form.tglBerkunjung)) {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      if (parseMinutes(time.split(" - ")[0]) <= current) {
        setShowTimeExpired(true);
        setForm((p) => ({ ...p, waktuBerkunjung: "", tglBerkunjung: "" }));
        setAvailableTimes([]);
        return;
      }
    }
    setField("waktuBerkunjung", time);
  };

  const handleProvinsi = async (val: string) => {
    const code = Number(val);
    const name = provinsiOpts.find((o) => o.value === val)?.label ?? "";
    setForm((p) => ({
      ...p,
      provinsiCode: code,
      provinsi: name,
      kabupatenCode: 0,
      kabupaten: "",
      kecamatanCode: 0,
      kecamatan: "",
      kelurahanCode: 0,
      kelurahan: "",
    }));
    setErrors((p) => {
      const n = { ...p };
      delete n.provinsi;
      return n;
    });
    setKabupatenOpts([]);
    setKecamatanOpts([]);
    setKelurahanOpts([]);
    setLoadingKab(true);
    try {
      setKabupatenOpts(
        toSelectOptions(await getRegenciesOfProvinceCode(code)),
      );
    } catch {
      setRegionError("Gagal memuat data kabupaten.");
    } finally {
      setLoadingKab(false);
    }
  };
  const handleKabupaten = async (val: string) => {
    const code = Number(val);
    const name = kabupatenOpts.find((o) => o.value === val)?.label ?? "";
    setForm((p) => ({
      ...p,
      kabupatenCode: code,
      kabupaten: name,
      kecamatanCode: 0,
      kecamatan: "",
      kelurahanCode: 0,
      kelurahan: "",
    }));
    setErrors((p) => {
      const n = { ...p };
      delete n.kabupaten;
      return n;
    });
    setKecamatanOpts([]);
    setKelurahanOpts([]);
    setLoadingKec(true);
    try {
      setKecamatanOpts(toSelectOptions(await getDistrictsOfCityCode(code)));
    } catch {
      setRegionError("Gagal memuat data kecamatan.");
    } finally {
      setLoadingKec(false);
    }
  };
  const handleKecamatan = async (val: string) => {
    const code = Number(val);
    const name = kecamatanOpts.find((o) => o.value === val)?.label ?? "";
    setForm((p) => ({
      ...p,
      kecamatanCode: code,
      kecamatan: name,
      kelurahanCode: 0,
      kelurahan: "",
    }));
    setErrors((p) => {
      const n = { ...p };
      delete n.kecamatan;
      return n;
    });
    setKelurahanOpts([]);
    setLoadingKel(true);
    try {
      setKelurahanOpts(
        toSelectOptions(await getVillagesOfDistrictCode(code)),
      );
    } catch {
      setRegionError("Gagal memuat data kelurahan.");
    } finally {
      setLoadingKel(false);
    }
  };
  const handleKelurahan = (val: string) => {
    const code = Number(val);
    const name = kelurahanOpts.find((o) => o.value === val)?.label ?? "";
    setForm((p) => ({ ...p, kelurahanCode: code, kelurahan: name }));
    setErrors((p) => {
      const n = { ...p };
      delete n.kelurahan;
      return n;
    });
  };

  /* ─────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────── */
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (mode === "lama") {
      if (!form.poli) e.poli = "Poli wajib dipilih";
      if (!form.dokter) e.dokter = "Dokter wajib dipilih";
      if (!form.tglBerkunjung)
        e.tglBerkunjung = "Tanggal berkunjung wajib diisi";
      if (!form.waktuBerkunjung)
        e.waktuBerkunjung = "Waktu kunjungan wajib dipilih";
      if (!form.keluhan.trim()) e.keluhan = "Keluhan wajib diisi";
    } else {
      const req: Array<[keyof FormData, string]> = [
        ["nik", "NIK"],
        ["nama", "Nama"],
        ["tempatLahir", "Tempat lahir"],
        ["tanggalLahir", "Tanggal lahir"],
        ["jenisKelamin", "Jenis kelamin"],
        ["agama", "Agama"],
        ["statusPernikahan", "Status pernikahan"],
        ["pendidikanTerakhir", "Pendidikan"],
        ["pekerjaan", "Pekerjaan"],
        ["noTelp", "Nomor telepon"],
        ["alamat", "Alamat"],
        ["rt", "RT"],
        ["rw", "RW"],
        ["provinsi", "Provinsi"],
        ["kabupaten", "Kabupaten/Kota"],
        ["kecamatan", "Kecamatan"],
        ["kelurahan", "Kelurahan"],
        ["poli", "Poli"],
        ["dokter", "Dokter"],
        ["tglBerkunjung", "Tanggal berkunjung"],
        ["waktuBerkunjung", "Waktu kunjungan"],
        ["keluhan", "Keluhan"],
      ];
      for (const [k, l] of req) {
        if (!form[k]?.toString().trim()) e[k] = `${l} wajib diisi`;
      }
      if (form.nik && !/^\d{16}$/.test(form.nik.trim()))
        e.nik = "NIK harus 16 digit angka";
      if (form.noTelp && !/^[\d\s\-+()]+$/.test(form.noTelp))
        e.noTelp = "Format nomor telepon tidak valid";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Format email tidak valid";
    }

    if (
      form.waktuBerkunjung &&
      form.tglBerkunjung &&
      isDateToday(form.tglBerkunjung)
    ) {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      if (parseMinutes(form.waktuBerkunjung.split(" - ")[0]) <= current) {
        setShowTimeExpired(true);
        setForm((p) => ({ ...p, waktuBerkunjung: "", tglBerkunjung: "" }));
        setAvailableTimes([]);
        return false;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) setShowConfirm(true);
  };

  /* ─────────────────────────────────────────
     CONFIRM & SEND
  ───────────────────────────────────────── */
  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const selectedPoli = poliList.find((p) => p.id === form.poli);
      const selectedDokter = filteredDokter.find((d) => d.id === form.dokter);
      const waNum = Profile.whatsapp.replace(/\D/g, "");

      const msgHeader = `*PENDAFTARAN PASIEN — ${Profile.shortName}*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      const msgIdentitas =
        mode === "lama"
          ? `*DATA PASIEN*\n• No. RM: ${form.noRm}\n• NIK: ${form.nik}\n• Nama: ${form.nama}\n• No. HP: ${form.noTelp}\n\n`
          : `*DATA IDENTITAS*\n• NIK: ${form.nik}\n• Nama: ${form.nama}\n` +
            `• TTL: ${form.tempatLahir}, ${formatTanggal(form.tanggalLahir)}\n` +
            `• Jenis Kelamin: ${form.jenisKelamin}\n• Agama: ${form.agama}\n` +
            `• Status: ${form.statusPernikahan}\n• Pendidikan: ${form.pendidikanTerakhir}\n` +
            `• Pekerjaan: ${form.pekerjaan}\n• Ortu/Suami: ${form.ortuPriaSuami || "-"}\n` +
            `• No. HP: ${form.noTelp}\n• Email: ${form.email || "-"}\n\n` +
            `*ALAMAT*\n• ${form.alamat}, RT ${form.rt}/RW ${form.rw}\n` +
            `• ${form.kelurahan}, ${form.kecamatan}\n• ${form.kabupaten}, ${form.provinsi}\n\n`;
      const msgKunjungan =
        `*KUNJUNGAN*\n• Poli: ${selectedPoli?.nama_poli || "-"}\n` +
        `• Dokter: ${selectedDokter?.nama || "-"}\n` +
        `• Tanggal: ${formatTanggal(form.tglBerkunjung)}\n` +
        `• Waktu: ${form.waktuBerkunjung}\n\n` +
        `*KELUHAN*\n${form.keluhan}\n\n━━━━━━━━━━━━━━━━━━━━━━\n_Mohon konfirmasi pendaftaran ini._`;

      const msg = msgHeader + msgIdentitas + msgKunjungan;

      await supabase.from("pendaftaran_pasien").insert([
        {
          no_rm: form.noRm || null,
          nik: form.nik,
          nama: form.nama,
          no_telp: form.noTelp,
          email: form.email || null,
          ...(mode === "baru"
            ? {
                tempat_lahir: form.tempatLahir,
                tanggal_lahir: form.tanggalLahir,
                jenis_kelamin: form.jenisKelamin,
                agama: form.agama,
                status_pernikahan: form.statusPernikahan,
                pendidikan_terakhir: form.pendidikanTerakhir,
                pekerjaan: form.pekerjaan,
                ortu_pria_suami: form.ortuPriaSuami || null,
                alamat: form.alamat,
                rt: form.rt,
                rw: form.rw,
                kelurahan: form.kelurahan,
                kecamatan: form.kecamatan,
                kabupaten: form.kabupaten,
                provinsi: form.provinsi,
              }
            : {}),
          poli_id: form.poli,
          dokter_id: form.dokter,
          tgl_berkunjung: form.tglBerkunjung,
          waktu_berkunjung: form.waktuBerkunjung,
          keluhan: form.keluhan,
          tipe: mode,
          status: "pending",
        },
      ]);

      window.open(
        `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } catch {
      /* silent — WA still opens */
    } finally {
      setForm({ ...EMPTY });
      setSearchNik("");
      setSearchResult(null);
      setSearchError("");
      setFilteredDokter([]);
      setJadwalDokter([]);
      setAvailableDates([]);
      setAvailableTimes([]);
      setErrors({});
      setLoading(false);
      setMode(null);
    }
  };

  /* ── Derived options ── */
  const poliOptions: SelectOption[] = poliList.map((p) => ({
    value: p.id,
    label: p.nama_poli,
  }));
  const dokterOptions: SelectOption[] = filteredDokter.map((d) => ({
    value: d.id,
    label: d.nama,
  }));
  const timeOptions: SelectOption[] = availableTimes.map((t) => ({
    value: t,
    label: t,
  }));

  /* ── Available dates as min/max for DatePicker ── */
  const minAvailableDate =
    availableDates.length > 0 ? availableDates[0] : undefined;
  const maxAvailableDate =
    availableDates.length > 0
      ? availableDates[availableDates.length - 1]
      : undefined;

  const selectedPoliLabel =
    poliList.find((p) => p.id === form.poli)?.nama_poli ?? "-";
  const selectedDokterLabel =
    filteredDokter.find((d) => d.id === form.dokter)?.nama ?? "-";

  /* ─────────────────────────────────────────
     KUNJUNGAN FIELDS (shared between lama & baru)
  ───────────────────────────────────────── */
  const KunjunganFields = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Poli Tujuan"
          placeholder="Pilih poli"
          value={form.poli}
          onChange={handlePoliChange}
          options={poliOptions}
          searchable
          loading={loadingPoli}
          error={errors.poli}
          required
        />
        <Select
          label="Nama Dokter"
          placeholder="Pilih dokter"
          value={form.dokter}
          onChange={handleDokterChange}
          options={dokterOptions}
          searchable
          disabled={!form.poli}
          loading={loadingDokter}
          error={errors.dokter}
          helperText={!form.poli ? "Pilih poli terlebih dahulu" : ""}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* DatePicker — hanya tampilkan tanggal yang ada jadwal */}
        <div>
          <DatePicker
            label="Tanggal Berkunjung"
            placeholder="Pilih tanggal"
            value={form.tglBerkunjung}
            onChange={(date) => {
              // Hanya izinkan tanggal yang ada di availableDates
              if (date && availableDates.length > 0 && !availableDates.includes(date)) return;
              handleDateChange(date);
            }}
            minDate={minAvailableDate ?? todayStr}
            maxDate={maxAvailableDate}
            disabled={!form.dokter || loadingJadwal}
            error={errors.tglBerkunjung}
            helperText={
              !form.dokter
                ? "Pilih dokter terlebih dahulu"
                : loadingJadwal
                  ? "Memuat jadwal..."
                  : availableDates.length === 0 && form.dokter
                    ? "Tidak ada jadwal tersedia"
                    : ""
            }
            required
          />
          {loadingJadwal && (
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 className="w-3 h-3 text-mariner-400 animate-spin" />
              <span className="text-xs text-gray-400">Memuat jadwal...</span>
            </div>
          )}
        </div>
        <Select
          label="Waktu Kunjungan"
          placeholder="Pilih waktu"
          value={form.waktuBerkunjung}
          onChange={handleTimeChange}
          options={timeOptions}
          icon={Clock}
          searchable={false}
          disabled={!form.tglBerkunjung}
          error={errors.waktuBerkunjung}
          helperText={
            !form.tglBerkunjung
              ? "Pilih tanggal terlebih dahulu"
              : availableTimes.length === 0 && form.tglBerkunjung
                ? "Tidak ada waktu tersedia"
                : ""
          }
          required
        />
      </div>

      <Textarea
        label="Keluhan"
        placeholder="Tuliskan keluhan secara detail..."
        rows={3}
        value={form.keluhan}
        onChange={(e) => setField("keluhan", e.target.value)}
        error={errors.keluhan}
        showCharCount
        maxLength={500}
        required
      />
    </>
  );

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <>
      {/* ── TIME EXPIRED DIALOG ── */}
      <AnimatePresence>
        {showTimeExpired && (
          <motion.div
            key="te-bd"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTimeExpired(false)}
          >
            <motion.div
              key="te-dlg"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl"
            >
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-bittersweet-500" />
              <div className="px-6 pt-5 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <button
                    onClick={() => setShowTimeExpired(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-base font-extrabold text-gray-900 mb-1">
                  Waktu Sudah Lewat
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Slot waktu yang dipilih sudah tidak tersedia. Silakan pilih{" "}
                  <span className="font-semibold text-gray-700">
                    tanggal atau waktu lain
                  </span>
                  .
                </p>
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/70 rounded-xl px-3.5 py-3 mb-4">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Hanya slot waktu yang belum lewat yang ditampilkan untuk
                    hari ini.
                  </p>
                </div>
                <button
                  onClick={() => setShowTimeExpired(false)}
                  className="w-full py-3 rounded-full bg-bittersweet-500 hover:bg-bittersweet-600 text-white text-sm font-bold transition-all"
                >
                  Pilih Jadwal Lain
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DIALOG ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="bd"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              key="dlg"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mariner-50 flex items-center justify-center">
                    <CheckCircle2 className="w-[18px] h-[18px] text-mariner-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-bittersweet-500">
                      Konfirmasi
                    </p>
                    <h2 className="text-base font-extrabold text-gray-900">
                      Periksa Data Pendaftaran
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <motion.div
                  variants={staggerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {/* Identitas */}
                  <motion.div variants={itemVariants}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <User2 className="w-3 h-3" />
                      Identitas Pasien
                    </p>
                    <div className="bg-gray-50 rounded-xl px-4 py-2 divide-y divide-gray-100">
                      {mode === "lama" ? (
                        <>
                          <ConfirmRow label="No. RM" value={form.noRm} />
                          <ConfirmRow label="NIK" value={form.nik} />
                          <ConfirmRow label="Nama" value={form.nama} />
                          <ConfirmRow label="No. HP" value={form.noTelp} />
                        </>
                      ) : (
                        <>
                          <ConfirmRow label="NIK" value={form.nik} />
                          <ConfirmRow label="Nama" value={form.nama} />
                          <ConfirmRow
                            label="Tempat Lahir"
                            value={form.tempatLahir}
                          />
                          <ConfirmRow
                            label="Tanggal Lahir"
                            value={formatTanggal(form.tanggalLahir)}
                          />
                          <ConfirmRow
                            label="Jenis Kelamin"
                            value={form.jenisKelamin}
                          />
                          <ConfirmRow label="Agama" value={form.agama} />
                          <ConfirmRow
                            label="Status"
                            value={form.statusPernikahan}
                          />
                          <ConfirmRow
                            label="Pendidikan"
                            value={form.pendidikanTerakhir}
                          />
                          <ConfirmRow
                            label="Pekerjaan"
                            value={form.pekerjaan}
                          />
                          <ConfirmRow
                            label="Ortu/Suami"
                            value={form.ortuPriaSuami}
                          />
                          <ConfirmRow label="No. HP" value={form.noTelp} />
                          <ConfirmRow label="Email" value={form.email} />
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Alamat — only for pasien baru */}
                  {mode === "baru" && (
                    <motion.div variants={itemVariants}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Alamat
                      </p>
                      <div className="bg-gray-50 rounded-xl px-4 py-2 divide-y divide-gray-100">
                        <ConfirmRow label="Alamat" value={form.alamat} />
                        <ConfirmRow
                          label="RT/RW"
                          value={`${form.rt}/${form.rw}`}
                        />
                        <ConfirmRow
                          label="Kelurahan"
                          value={form.kelurahan}
                        />
                        <ConfirmRow
                          label="Kecamatan"
                          value={form.kecamatan}
                        />
                        <ConfirmRow
                          label="Kabupaten/Kota"
                          value={form.kabupaten}
                        />
                        <ConfirmRow label="Provinsi" value={form.provinsi} />
                      </div>
                    </motion.div>
                  )}

                  {/* Kunjungan */}
                  <motion.div variants={itemVariants}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3" />
                      Data Kunjungan
                    </p>
                    <div className="bg-gray-50 rounded-xl px-4 py-2 divide-y divide-gray-100">
                      <ConfirmRow label="Poli" value={selectedPoliLabel} />
                      <ConfirmRow
                        label="Dokter"
                        value={selectedDokterLabel}
                      />
                      <ConfirmRow
                        label="Tgl Berkunjung"
                        value={formatTanggal(form.tglBerkunjung)}
                      />
                      <ConfirmRow
                        label="Waktu"
                        value={form.waktuBerkunjung}
                      />
                    </div>
                  </motion.div>

                  {/* Keluhan */}
                  <motion.div variants={itemVariants}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Keluhan
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5">
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                        {form.keluhan}
                      </p>
                    </div>
                  </motion.div>

                  <motion.p
                    variants={itemVariants}
                    className="text-[10px] text-gray-400 text-center"
                  >
                    Data akan dikirim melalui WhatsApp ke {Profile.whatsapp}{" "}
                    untuk konfirmasi.
                  </motion.p>
                </motion.div>
              </div>

              <div className="px-6 pb-5 pt-3 flex gap-2.5 shrink-0 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all"
                >
                  Periksa Lagi
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 rounded-full bg-bittersweet-500 hover:bg-bittersweet-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  Ya, Kirim via WA
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN SECTION ── */}
      <section
        id="pendaftaran"
        className="relative w-full overflow-hidden bg-gray-50 pb-16 sm:pb-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-6 sm:space-y-8">
          {/* ── BANNER ── */}
          <Animate type="fadein" ready={choiceReady}>
            <Banner
              title="Pendaftaran Pasien"
              subtitle={`Daftarkan diri Anda dengan mudah dan cepat di ${Profile.shortName}. Pilih poli, dokter, dan jadwal kunjungan Anda secara online.`}
            />
          </Animate>

          {/* ── STEP 0: Pilih Mode ── */}
          <AnimatePresence mode="wait">
            {mode === null && (
              <motion.div
                key="mode-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-8 lg:p-10">
                    <Animate type="fadein" ready={choiceReady}>
                      <div className="text-center mb-8 sm:mb-10">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mariner-500 mb-2">
                          Langkah Pertama
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                          Sudah punya Nomor RM?
                        </h2>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
                          Nomor Rekam Medis didapat saat pertama kali berobat di{" "}
                          {Profile.shortName}.
                        </p>
                      </div>
                    </Animate>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Sudah Punya RM */}
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 32, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.2, duration: 0.5, ease } }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMode("lama")}
                        className="group relative flex flex-col items-center justify-center gap-4 p-7 sm:p-8 rounded-2xl border-2 border-mariner-200 hover:border-mariner-400 cursor-pointer text-center overflow-hidden transition-colors duration-300"
                        style={{ background: "linear-gradient(160deg, #f0f7ff 0%, #e4efff 100%)" }}
                      >
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          whileHover={{ background: "rgba(59,130,246,0.06)" }}
                          transition={{ duration: 0.3 }}
                        />
                        <div className="w-16 h-16 rounded-2xl bg-mariner-100 group-hover:bg-mariner-200 flex items-center justify-center transition-colors duration-200 relative z-10 shadow-sm">
                          <UserCheck className="w-8 h-8 text-mariner-600" />
                        </div>
                        <div className="space-y-1.5 relative z-10">
                          <p className="text-lg font-extrabold text-gray-900">
                            Sudah Punya RM
                          </p>
                          <p className="text-xs leading-relaxed text-gray-500 max-w-[10rem] mx-auto">
                            Pernah berobat di {Profile.shortName} dan sudah memiliki nomor rekam medis.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 shadow-sm border border-mariner-100 relative z-10 group-hover:border-mariner-300 group-hover:shadow-md transition-all duration-200">
                          <UserCheck className="w-3 h-3 text-mariner-500" />
                          <span className="text-[10px] font-bold text-mariner-600">
                            Cari data saya
                          </span>
                          <ArrowRight className="w-3 h-3 text-mariner-400" />
                        </div>
                      </motion.button>

                      {/* Pasien Baru */}
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 32, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.32, duration: 0.5, ease } }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMode("baru")}
                        className="group relative flex flex-col items-center justify-center gap-4 p-7 sm:p-8 rounded-2xl border-2 border-bittersweet-200 hover:border-bittersweet-400 cursor-pointer text-center overflow-hidden transition-colors duration-300"
                        style={{ background: "linear-gradient(160deg, #fff5f3 0%, #ffede9 100%)" }}
                      >
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          whileHover={{ background: "rgba(239,68,68,0.05)" }}
                          transition={{ duration: 0.3 }}
                        />
                        <div className="w-16 h-16 rounded-2xl bg-bittersweet-100 group-hover:bg-bittersweet-200 flex items-center justify-center transition-colors duration-200 relative z-10 shadow-sm">
                          <UserPlus className="w-8 h-8 text-bittersweet-600" />
                        </div>
                        <div className="space-y-1.5 relative z-10">
                          <p className="text-lg font-extrabold text-gray-900">
                            Pasien Baru
                          </p>
                          <p className="text-xs leading-relaxed text-gray-500 max-w-[10rem] mx-auto">
                            Belum pernah berobat di {Profile.shortName} dan belum punya nomor rekam medis.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 shadow-sm border border-bittersweet-100 relative z-10 group-hover:border-bittersweet-300 group-hover:shadow-md transition-all duration-200">
                          <UserPlus className="w-3 h-3 text-bittersweet-500" />
                          <span className="text-[10px] font-bold text-bittersweet-600">
                            Daftar sekarang
                          </span>
                          <ArrowRight className="w-3 h-3 text-bittersweet-400" />
                        </div>
                      </motion.button>
                    </div>

                    <Animate type="fadein" delay={0.45} ready={choiceReady}>
                      <p className="text-center text-[11px] text-gray-400 mt-7 leading-relaxed">
                        Pilih sesuai status kunjungan Anda di {Profile.shortName}
                      </p>
                    </Animate>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1 (LAMA): Cari Pasien by NIK ── */}
            {mode === "lama" && (
              <motion.div
                key="lama-flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease }}
              >
                {/* Desktop: 2-col [form | panel], Tablet/Mobile: single col centered */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-6 lg:gap-8 items-start">

                  {/* Left column: search + kunjungan stacked */}
                  <div className="space-y-5">
                    {/* Search card */}
                    <Animate type="slideup" ready>
                      <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 sm:p-8">
                          <BackButton
                            onClick={() => {
                              setMode(null);
                              setSearchResult(null);
                              setSearchError("");
                              setSearchNik("");
                              setForm({ ...EMPTY });
                            }}
                          />

                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-mariner-50 flex items-center justify-center shrink-0">
                              <Search className="w-5 h-5 text-mariner-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-mariner-400">
                                Pasien Lama
                              </p>
                              <h2 className="text-lg font-extrabold text-gray-900">
                                Cari Data dengan NIK
                              </h2>
                            </div>
                          </div>

                          {/* Input full-width on mobile, inline on sm+ */}
                          <div className="space-y-3">
                            <Input
                              label="Nomor Induk Kependudukan (NIK)"
                              icon={CreditCard}
                              placeholder="Masukkan 16 digit NIK"
                              value={searchNik}
                              onChange={(e) => {
                                setSearchNik(
                                  e.target.value.replace(/\D/g, "").slice(0, 16),
                                );
                                setSearchError("");
                              }}
                              error={searchError}
                              maxLength={16}
                              inputMode="numeric"
                              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <button
                              type="button"
                              onClick={handleSearch}
                              disabled={searching}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-mariner-500 hover:bg-mariner-600 active:bg-mariner-700 text-white font-bold text-sm transition-all disabled:opacity-60"
                            >
                              {searching ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Search className="w-4 h-4" />
                              )}
                              {searching ? "Mencari..." : "Cari Pasien"}
                            </button>
                          </div>

                          <AnimatePresence>
                            {searchResult && (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.3, ease }}
                                className="mt-4 bg-mariner-50 border border-mariner-200 rounded-2xl p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-mariner-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-5 h-5 text-mariner-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-bold text-mariner-800 truncate">
                                        {searchResult.nama}
                                      </p>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                                        Ditemukan
                                      </span>
                                    </div>
                                    <p className="text-xs text-mariner-500 mt-0.5">
                                      No. RM: <span className="font-semibold">{searchResult.no_rm}</span>
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Animate>

                    {/* Kunjungan form — only shown after patient found */}
                    <AnimatePresence>
                      {searchResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.4, ease }}
                        >
                          <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 sm:p-8">
                              <div className="flex items-start gap-3 bg-bittersweet-50 border border-bittersweet-200/70 rounded-xl px-4 py-3 mb-6">
                                <ShieldCheck className="w-4 h-4 text-bittersweet-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-bittersweet-700 leading-relaxed">
                                  Data pasien berhasil ditemukan. Lengkapi detail kunjungan di bawah ini.
                                </p>
                              </div>

                              <form onSubmit={handleSubmit} className="space-y-4">
                                <Animate type="stagger" staggerChildren={0.07} delayChildren={0.08} ready>
                                  <Animate type="fielditem">
                                    <SectionDivider
                                      icon={<Stethoscope className="w-3.5 h-3.5" />}
                                      label="Data Kunjungan"
                                    />
                                  </Animate>
                                  <Animate type="fielditem">
                                    <KunjunganFields />
                                  </Animate>
                                </Animate>

                                <div className="flex justify-end pt-2">
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={loading}
                                    className="justify-center"
                                  >
                                    {loading ? "Mengirim..." : "Daftar via WhatsApp"}
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right column: info panel (sticky on desktop) */}
                  <Animate type="slideright" delay={0.1} ready>
                    <div className="flex flex-col gap-4 lg:sticky lg:top-8">
                      {/* Cara daftar */}
                      <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                          Cara Daftar
                        </p>
                        <div className="space-y-3">
                          {[
                            { num: "01", title: "Cari NIK", desc: "Masukkan NIK 16 digit Anda", color: "bg-mariner-500" },
                            { num: "02", title: "Pilih Jadwal", desc: "Tentukan poli, dokter & waktu kunjungan", color: "bg-teal-500" },
                            { num: "03", title: "Kirim via WA", desc: "Data pendaftaran dikirim ke WhatsApp", color: "bg-bittersweet-500" },
                          ].map((step, i) => (
                            <motion.div
                              key={step.num}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.12 + 0.08 * i, ease }}
                              className="flex items-center gap-3"
                            >
                              <div className={`w-9 h-9 ${step.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                                <span className="text-white text-[10px] font-extrabold">{step.num}</span>
                              </div>
                              <div>
                                <p className="text-gray-800 font-semibold text-xs">{step.title}</p>
                                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">{step.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Kontak */}
                      <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                          Hubungi Kami
                        </p>
                        <div className="space-y-1">
                          {[
                            { icon: Phone, label: "WhatsApp", value: Profile.whatsapp, href: `https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`, color: "bg-bittersweet-500" },
                            { icon: Mail, label: "Email", value: Profile.email, href: `mailto:${Profile.email}`, color: "bg-teal-500" },
                            { icon: Phone, label: "Telepon", value: Profile.pusatPanggilan, href: `tel:${Profile.pusatPanggilan}`, color: "bg-mariner-500" },
                          ].map((c) => (
                            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                              className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                              <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <c.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{c.label}</p>
                                <p className="text-gray-800 font-semibold text-xs group-hover:text-mariner-500 transition-colors truncate">{c.value}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Jam pelayanan */}
                      <div className="bg-mariner-50 rounded-2xl p-5 ring-1 ring-mariner-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-mariner-400 mb-3">
                          Jam Pelayanan
                        </p>
                        <div className="space-y-2">
                          {[
                            ["Senin – Jumat", "07.00 – 16.00", false],
                            ["Sabtu", "07.00 – 13.00", false],
                            ["UGD", "24 jam", true],
                          ].map(([hari, jam, isUgd]) => (
                            <div key={String(hari)} className="flex items-center justify-between">
                              <span className="text-xs text-mariner-600">{hari}</span>
                              <span className={`text-xs font-bold ${isUgd ? "text-bittersweet-500" : "text-mariner-700"}`}>
                                {jam}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Animate>

                </div>
              </motion.div>
            )}

            {/* ── STEP 1 (BARU): Form Lengkap ── */}
            {mode === "baru" && (
              <motion.div
                key="baru-flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-6 lg:gap-8 items-start">
                  {/* ── FORM CARD ── */}
                  <Animate type="slideup" ready>
                    <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                      <div className="p-5 sm:p-8 lg:p-8">
                        {/* Back button inside card */}
                        <BackButton
                          onClick={() => {
                            setMode(null);
                            setForm({ ...EMPTY });
                            setErrors({});
                          }}
                        />

                        <Animate type="fadein" ready>
                          <div className="mb-7">
                            <div className="inline-flex items-center gap-2 bg-mariner-50 text-mariner-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
                              <span className="w-1 h-1 rounded-full bg-mariner-500 inline-block" />
                              Pasien Baru
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">
                              Data Pasien Baru
                            </h2>
                            <div className="mt-2 mb-5 h-0.5 w-10 bg-mariner-500 rounded-full" />
                            <div className="flex items-start gap-2.5 bg-bittersweet-50 border border-bittersweet-200/70 rounded-xl px-3.5 py-2.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-bittersweet-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-bittersweet-700 leading-relaxed">
                                <span className="font-bold">Data bersifat rahasia</span>{" "}
                                — hanya untuk keperluan administrasi medis.
                              </p>
                            </div>
                          </div>
                        </Animate>

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Animate
                            type="stagger"
                            staggerChildren={0.055}
                            delayChildren={0.1}
                            ready
                          >
                            {/* ══ IDENTITAS ══ */}
                            <Animate type="fielditem">
                              <SectionDivider
                                icon={<User2 className="w-3.5 h-3.5" />}
                                label="Identitas Diri"
                              />
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                  label="NIK"
                                  icon={CreditCard}
                                  placeholder="16 digit NIK"
                                  value={form.nik}
                                  onChange={(e) =>
                                    setField("nik", e.target.value.replace(/\D/g, "").slice(0, 16))
                                  }
                                  error={errors.nik}
                                  maxLength={16}
                                  required
                                />
                                <Input
                                  label="Nama Lengkap"
                                  icon={User}
                                  placeholder="Sesuai KTP"
                                  value={form.nama}
                                  onChange={(e) => setField("nama", e.target.value)}
                                  error={errors.nama}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                  label="Tempat Lahir"
                                  icon={MapPin}
                                  placeholder="Kota tempat lahir"
                                  value={form.tempatLahir}
                                  onChange={(e) => setField("tempatLahir", e.target.value)}
                                  error={errors.tempatLahir}
                                  required
                                />
                                <DatePicker
                                  label="Tanggal Lahir"
                                  placeholder="Pilih tanggal lahir"
                                  value={form.tanggalLahir}
                                  onChange={(v) => setField("tanggalLahir", v)}
                                  maxDate={todayStr}
                                  error={errors.tanggalLahir}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                  label="Jenis Kelamin"
                                  placeholder="Pilih jenis kelamin"
                                  value={form.jenisKelamin}
                                  onChange={(v) => setField("jenisKelamin", v)}
                                  options={JENIS_KELAMIN_OPTIONS}
                                  error={errors.jenisKelamin}
                                  required
                                />
                                <Select
                                  label="Agama"
                                  placeholder="Pilih agama"
                                  value={form.agama}
                                  onChange={(v) => setField("agama", v)}
                                  options={AGAMA_OPTIONS}
                                  error={errors.agama}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                  label="Status Pernikahan"
                                  placeholder="Pilih status"
                                  value={form.statusPernikahan}
                                  onChange={(v) => setField("statusPernikahan", v)}
                                  options={STATUS_PERNIKAHAN_OPTIONS}
                                  error={errors.statusPernikahan}
                                  required
                                />
                                <Select
                                  label="Pendidikan Terakhir"
                                  placeholder="Pilih pendidikan"
                                  value={form.pendidikanTerakhir}
                                  onChange={(v) => setField("pendidikanTerakhir", v)}
                                  options={PENDIDIKAN_OPTIONS}
                                  error={errors.pendidikanTerakhir}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                  label="Pekerjaan"
                                  placeholder="Pilih pekerjaan"
                                  value={form.pekerjaan}
                                  onChange={(v) => setField("pekerjaan", v)}
                                  options={PEKERJAAN_OPTIONS}
                                  searchable
                                  error={errors.pekerjaan}
                                  required
                                />
                                <Input
                                  label="Nama Ortu Pria / Suami"
                                  icon={Users}
                                  placeholder="Opsional"
                                  value={form.ortuPriaSuami}
                                  onChange={(e) => setField("ortuPriaSuami", e.target.value)}
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                  label="Nomor Telepon"
                                  icon={Phone}
                                  type="tel"
                                  placeholder="08xx-xxxx-xxxx"
                                  value={form.noTelp}
                                  onChange={(e) => setField("noTelp", e.target.value)}
                                  error={errors.noTelp}
                                  required
                                />
                                <Input
                                  label="Email"
                                  icon={Mail}
                                  type="email"
                                  placeholder="nama@email.com"
                                  value={form.email}
                                  onChange={(e) => setField("email", e.target.value)}
                                  error={errors.email}
                                />
                              </div>
                            </Animate>

                            {/* ══ ALAMAT ══ */}
                            <Animate type="fielditem">
                              <SectionDivider
                                icon={<Home className="w-3.5 h-3.5" />}
                                label="Alamat Domisili"
                              />
                            </Animate>

                            {regionError && (
                              <Animate type="fielditem">
                                <div className="flex items-start gap-2 bg-bittersweet-50 border border-bittersweet-200 rounded-xl px-3 py-2.5">
                                  <X className="w-3.5 h-3.5 text-bittersweet-500 shrink-0 mt-0.5" />
                                  <p className="text-xs text-bittersweet-700 flex-1">{regionError}</p>
                                  <button type="button" onClick={() => setRegionError("")}>
                                    <X className="w-3 h-3 text-bittersweet-400" />
                                  </button>
                                </div>
                              </Animate>
                            )}

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                  label="Provinsi"
                                  placeholder="Pilih provinsi"
                                  value={form.provinsiCode ? String(form.provinsiCode) : ""}
                                  onChange={handleProvinsi}
                                  options={provinsiOpts}
                                  searchable
                                  error={errors.provinsi}
                                  required
                                />
                                <Select
                                  label="Kabupaten / Kota"
                                  placeholder={form.provinsiCode ? "Pilih kabupaten/kota" : "— pilih provinsi dulu —"}
                                  value={form.kabupatenCode ? String(form.kabupatenCode) : ""}
                                  onChange={handleKabupaten}
                                  options={kabupatenOpts}
                                  searchable
                                  disabled={!form.provinsiCode}
                                  loading={loadingKab}
                                  error={errors.kabupaten}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                  label="Kecamatan"
                                  placeholder={form.kabupatenCode ? "Pilih kecamatan" : "— pilih kabupaten dulu —"}
                                  value={form.kecamatanCode ? String(form.kecamatanCode) : ""}
                                  onChange={handleKecamatan}
                                  options={kecamatanOpts}
                                  searchable
                                  disabled={!form.kabupatenCode}
                                  loading={loadingKec}
                                  error={errors.kecamatan}
                                  required
                                />
                                <Select
                                  label="Kelurahan / Desa"
                                  placeholder={form.kecamatanCode ? "Pilih kelurahan/desa" : "— pilih kecamatan dulu —"}
                                  value={form.kelurahanCode ? String(form.kelurahanCode) : ""}
                                  onChange={handleKelurahan}
                                  options={kelurahanOpts}
                                  searchable
                                  disabled={!form.kecamatanCode}
                                  loading={loadingKel}
                                  error={errors.kelurahan}
                                  required
                                />
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_72px_72px] gap-3">
                                <Input
                                  label="Alamat"
                                  icon={Home}
                                  placeholder="Nama jalan, nomor rumah"
                                  value={form.alamat}
                                  onChange={(e) => setField("alamat", e.target.value)}
                                  error={errors.alamat}
                                  required
                                />
                                <Input
                                  label="RT"
                                  placeholder="001"
                                  value={form.rt}
                                  onChange={(e) => setField("rt", e.target.value)}
                                  error={errors.rt}
                                  required
                                />
                                <Input
                                  label="RW"
                                  placeholder="002"
                                  value={form.rw}
                                  onChange={(e) => setField("rw", e.target.value)}
                                  error={errors.rw}
                                  required
                                />
                              </div>
                            </Animate>

                            {/* ══ KUNJUNGAN ══ */}
                            <Animate type="fielditem">
                              <SectionDivider
                                icon={<Stethoscope className="w-3.5 h-3.5" />}
                                label="Data Kunjungan"
                              />
                            </Animate>

                            <Animate type="fielditem">
                              <KunjunganFields />
                            </Animate>
                          </Animate>

                          <div className="flex justify-end pt-2">
                            <Button
                              type="submit"
                              variant="primary"
                              size="lg"
                              disabled={loading}
                              className="justify-center"
                            >
                              {loading ? "Mengirim..." : "Daftar via WhatsApp"}
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Animate>

                  {/* ── INFO PANEL ── */}
                  <Animate type="slideright" delay={0.1} ready>
                    <div className="flex flex-col gap-4 lg:sticky lg:top-8">
                      {/* Cara daftar */}
                      <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                          Cara Daftar
                        </p>
                        <div className="space-y-3">
                          {[
                            { num: "01", title: "Isi Data Diri", desc: "Lengkapi formulir sesuai KTP", color: "bg-bittersweet-500" },
                            { num: "02", title: "Pilih Poli & Dokter", desc: "Tentukan poli, dokter & jadwal", color: "bg-teal-500" },
                            { num: "03", title: "Konfirmasi via WA", desc: "Data dikirim otomatis ke WhatsApp", color: "bg-mariner-500" },
                          ].map((step, i) => (
                            <motion.div
                              key={step.num}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.1 + 0.08 * i, ease }}
                              className="flex items-center gap-3"
                            >
                              <div className={`w-9 h-9 ${step.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                                <span className="text-white text-[10px] font-extrabold">{step.num}</span>
                              </div>
                              <div>
                                <p className="text-gray-800 font-semibold text-xs">{step.title}</p>
                                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">{step.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Kontak */}
                      <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                          Hubungi Kami
                        </p>
                        <div className="space-y-1">
                          {[
                            { icon: Phone, label: "WhatsApp", value: Profile.whatsapp, href: `https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`, color: "bg-bittersweet-500" },
                            { icon: Mail, label: "Email", value: Profile.email, href: `mailto:${Profile.email}`, color: "bg-teal-500" },
                            { icon: Phone, label: "Telepon", value: Profile.pusatPanggilan, href: `tel:${Profile.pusatPanggilan}`, color: "bg-mariner-500" },
                          ].map((c) => (
                            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                              className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                              <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <c.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{c.label}</p>
                                <p className="text-gray-800 font-semibold text-xs group-hover:text-mariner-500 transition-colors truncate">{c.value}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Jam pelayanan */}
                      <div className="bg-mariner-50 rounded-2xl p-5 ring-1 ring-mariner-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-mariner-400 mb-3">
                          Jam Pelayanan
                        </p>
                        <div className="space-y-2">
                          {[
                            ["Senin – Jumat", "07.00 – 16.00", false],
                            ["Sabtu", "07.00 – 13.00", false],
                            ["UGD", "24 jam", true],
                          ].map(([hari, jam, isUgd]) => (
                            <div key={String(hari)} className="flex items-center justify-between">
                              <span className="text-xs text-mariner-600">{hari}</span>
                              <span className={`text-xs font-bold ${isUgd ? "text-bittersweet-500" : "text-mariner-700"}`}>
                                {jam}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Animate>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}