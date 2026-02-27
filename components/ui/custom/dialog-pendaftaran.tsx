"use client";

/**
 * DialogPendaftaran — Komponen dialog pendaftaran eksekutif yang reusable.
 *
 * Cara pakai:
 * ```tsx
 * <DialogPendaftaran
 *   open={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   prefill={{
 *     poliId: "...",
 *     poliNama: "Poli Jantung",
 *     dokterId: "...",
 *     dokterNama: "dr. Budi Santoso, Sp.JP",
 *     dokterProfile: "/foto.jpg",   // opsional
 *     hari: "Senin",
 *     jamMulai: "08:00",
 *     jamSelesai: "12:00",
 *   }}
 * />
 * ```
 */

import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Building2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Stethoscope,
  User,
  User2,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ─────────────────────────────────────────
   EASE CURVE
───────────────────────────────────────── */
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOut: [number, number, number, number] = [0.0, 0.0, 0.2, 1];

/* ─────────────────────────────────────────
   TYPES & INTERFACES
───────────────────────────────────────── */

/** Data yang wajib/opsional diisi dari luar untuk pre-fill dialog */
export interface PendaftaranPrefill {
  poliId: string;
  poliNama: string;
  dokterId: string;
  dokterNama: string;
  /** URL foto profil dokter (opsional) */
  dokterProfile?: string | null;
  /** Nama hari praktek, misal: "Senin" */
  hari: string;
  /** Format "HH:MM" atau "HH.MM" */
  jamMulai: string;
  /** Format "HH:MM" atau "HH.MM" */
  jamSelesai: string;
}

export interface DialogPendaftaranProps {
  open: boolean;
  onClose: () => void;
  prefill: PendaftaranPrefill;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  description: string;
}

type FormErrors = Record<keyof FormData | "date", string>;

/* ─────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────── */
const HARI_TO_DAY: Record<string, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

function generateAvailableDates(hari: string, jamSelesai: string): string[] {
  const targetDay = HARI_TO_DAY[hari];
  if (targetDay === undefined) return [];

  const now = new Date();
  const [endHour, endMinute] = formatTime(jamSelesai).split(":").map(Number);

  const dates: string[] = [];
  // Loop sampai 14 hari agar bisa kumpulkan 7 tanggal yang cocok harinya
  for (let i = 0; i < 14 && dates.length < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() !== targetDay) continue;

    // Hari ini: tampilkan selama jam sekarang belum melewati jam selesai slot
    if (i === 0) {
      const slotEnd = new Date(now);
      slotEnd.setHours(endHour, endMinute, 0, 0);
      if (now > slotEnd) continue; // jam sudah lewat jam selesai, skip hari ini
    }

    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return dates;
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(t: string): string {
  return t.includes(".") ? t.replace(".", ":") : t;
}

const EMPTY_ERRORS: FormErrors = {
  name: "",
  email: "",
  phone: "",
  description: "",
  date: "",
};

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
const ScrollFadeWrapper: React.FC<{
  children: React.ReactNode;
  maxHeight: number;
  className?: string;
}> = ({ children, maxHeight, className = "" }) => {
  const { ref, canScrollUp, canScrollDown } = useScrollIndicator();

  useEffect(() => {
    const id = "dp-scrollbar-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .dp-scroll::-webkit-scrollbar { width: 4px; }
      .dp-scroll::-webkit-scrollbar-track { background: transparent; }
      .dp-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      .dp-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute top-0 inset-x-0 z-10 transition-opacity duration-300"
        style={{
          height: 36,
          opacity: canScrollUp ? 1 : 0,
          background: "linear-gradient(to bottom, white 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-10 transition-opacity duration-300"
        style={{
          height: 52,
          opacity: canScrollDown ? 1 : 0,
          background: "linear-gradient(to top, white 0%, transparent 100%)",
        }}
      />
      <div
        ref={ref}
        className={`dp-scroll overflow-y-auto scroll-smooth ${className}`}
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
   VIEW: FORM
───────────────────────────────────────── */
interface FormViewProps {
  prefill: PendaftaranPrefill;
  fixedTime: string;
  dateOptions: { value: string; label: string }[];
  availableDates: string[];
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  loading: boolean;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const FormView: React.FC<FormViewProps> = ({
  prefill,
  fixedTime,
  dateOptions,
  availableDates,
  selectedDate,
  setSelectedDate,
  formData,
  setFormData,
  errors,
  setErrors,
  loading,
  onBack,
  onClose,
  onSubmit,
}) => (
  <motion.div
    key="form"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease } satisfies Transition}
    className="flex flex-col"
  >
    {/* Header */}
    <div className="px-6 pt-5 pb-4 flex items-center gap-3 shrink-0">
      <motion.button
        whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.05)" }}
        whileTap={{ scale: 0.92 }}
        onClick={onBack}
        aria-label="Kembali"
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </motion.button>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-bittersweet-500">
          Pendaftaran Eksekutif
        </p>
        <h2 className="text-base font-extrabold text-gray-900 leading-tight truncate">
          Buat Janji Temu
        </h2>
      </div>
      <motion.button
        whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.05)" }}
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        aria-label="Tutup"
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </motion.button>
    </div>

    {/* Dokter info banner */}
    <div className="px-6 shrink-0">
      <div className="flex gap-3 items-center bg-mariner-50 border border-mariner-100 rounded-2xl px-4 py-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-mariner-100 overflow-hidden shrink-0 ring-2 ring-mariner-200">
          {prefill.dokterProfile ? (
            <Image
              src={prefill.dokterProfile}
              alt={prefill.dokterNama}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              style={{ objectPosition: "center 20%" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserRound className="w-6 h-6 text-mariner-300" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-mariner-400 uppercase tracking-wider truncate">
            {prefill.poliNama}
          </p>
          <p className="text-sm font-bold text-mariner-700 leading-tight truncate">
            {prefill.dokterNama}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-mariner-400 shrink-0" />
            <span className="text-xs text-mariner-600 font-medium font-mono">
              {prefill.hari}, {fixedTime}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bittersweet-600 bg-white px-2 py-1 rounded-full border border-bittersweet-100 shrink-0">
          <Building2 className="w-2.5 h-2.5" />
          Eksekutif
        </span>
      </div>
    </div>

    {/* Form */}
    <ScrollFadeWrapper maxHeight={380} className="px-6 pb-4">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Data diri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={(e) => {
              setFormData((p) => ({ ...p, name: e.target.value }));
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            icon={User}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={(e) => {
              setFormData((p) => ({ ...p, email: e.target.value }));
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            icon={AtSign}
            error={errors.email}
            required
          />
        </div>

        <Input
          label="Nomor Telepon"
          type="tel"
          placeholder="08xx-xxxx-xxxx"
          value={formData.phone}
          onChange={(e) => {
            setFormData((p) => ({ ...p, phone: e.target.value }));
            if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
          }}
          icon={Phone}
          error={errors.phone}
          required
        />

        <div className="h-px bg-gray-100" />

        {/* Tanggal */}
        <Select
          label="Tanggal"
          placeholder="Pilih tanggal"
          value={selectedDate}
          onChange={(val) => {
            setSelectedDate(val);
            if (errors.date) setErrors((p) => ({ ...p, date: "" }));
          }}
          options={dateOptions}
          searchable={false}
          error={errors.date}
          helperText={
            availableDates.length === 0 ? "Tidak ada tanggal tersedia" : ""
          }
          required
        />

        {/* Keluhan */}
        <Textarea
          label="Deskripsi Keluhan"
          rows={4}
          placeholder="Tuliskan keluhan Anda secara detail..."
          value={formData.description}
          onChange={(e) => {
            setFormData((p) => ({ ...p, description: e.target.value }));
            if (errors.description)
              setErrors((p) => ({ ...p, description: "" }));
          }}
          error={errors.description}
          showCharCount
          maxLength={500}
          required
        />

        {/* Actions */}
        <div className="pb-2 flex gap-2.5">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18 } satisfies Transition}
            onClick={onBack}
            className="flex-1 py-4 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Batal
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18 } satisfies Transition}
            disabled={loading}
            className="flex-2 py-4 rounded-full bg-bittersweet-500 hover:bg-bittersweet-600 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-bittersweet-500/20 flex items-center justify-center gap-2 transition-all duration-200"
          >
            Lanjut & Konfirmasi
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </ScrollFadeWrapper>
  </motion.div>
);

/* ─────────────────────────────────────────
   VIEW: KONFIRMASI
───────────────────────────────────────── */
interface ConfirmViewProps {
  prefill: PendaftaranPrefill;
  fixedTime: string;
  selectedDateLabel: string;
  formData: FormData;
  loading: boolean;
  onBack: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmView: React.FC<ConfirmViewProps> = ({
  prefill,
  fixedTime,
  selectedDateLabel,
  formData,
  loading,
  onBack,
  onClose,
  onConfirm,
}) => (
  <motion.div
    key="confirm"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease } satisfies Transition}
    className="flex flex-col"
  >
    {/* Header */}
    <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-mariner-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-[18px] h-[18px] text-mariner-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-bittersweet-500">
            Konfirmasi Pendaftaran
          </p>
          <h2 className="text-base font-extrabold text-gray-900 leading-tight">
            Periksa Data Anda
          </h2>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Tutup"
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Content */}
    <ScrollFadeWrapper maxHeight={400} className="px-6 pb-4 space-y-3">
      {/* Detail jadwal */}
      <div className="bg-mariner-50 rounded-xl p-3.5 border border-mariner-100">
        <div className="flex items-center gap-2 mb-2.5">
          <Stethoscope className="w-3.5 h-3.5 text-mariner-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-mariner-500">
            Detail Jadwal
          </p>
        </div>
        {(
          [
            ["Poli", prefill.poliNama],
            ["Dokter", prefill.dokterNama],
            ["Tanggal", selectedDateLabel],
            ["Waktu", fixedTime],
          ] as [string, string][]
        ).map(([label, val], i) => (
          <React.Fragment key={label}>
            {i > 0 && <div className="h-px bg-mariner-100 my-2" />}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-mariner-600 shrink-0">{label}</span>
              <span
                className={`text-xs font-semibold text-right truncate ${
                  label === "Waktu"
                    ? "text-mariner-700 font-mono"
                    : "text-mariner-800"
                }`}
              >
                {val}
              </span>
            </div>
          </React.Fragment>
        ))}
        <div className="h-px bg-mariner-100 my-2" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-mariner-600">Layanan</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bittersweet-600 bg-white px-2 py-0.5 rounded-full border border-bittersweet-100">
            <Building2 className="w-2.5 h-2.5" />
            Eksekutif
          </span>
        </div>
      </div>

      {/* Identitas pasien */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
          <User2 className="w-3 h-3" />
          Identitas Pasien
        </p>
        <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
          {(
            [
              ["Nama", formData.name],
              ["Email", formData.email],
              ["Telepon", formData.phone],
            ] as [string, string][]
          ).map(([label, val], i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className="h-px bg-gray-100" />}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500 shrink-0">{label}</span>
                <span className="text-xs font-semibold text-gray-900 text-right truncate">
                  {val}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Keluhan */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          Keluhan
        </p>
        <div className="bg-gray-50 rounded-xl p-3.5">
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
            {formData.description}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed pb-1">
        Data ini akan dikirimkan melalui WhatsApp untuk konfirmasi jadwal.
      </p>
    </ScrollFadeWrapper>

    {/* Actions */}
    <div className="px-6 pb-5 pt-2 flex gap-2.5 shrink-0">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18 } satisfies Transition}
        onClick={onBack}
        className="flex-1 py-3.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
      >
        Periksa Lagi
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18 } satisfies Transition}
        onClick={onConfirm}
        disabled={loading}
        className="flex-2 px-5 py-3.5 rounded-full bg-bittersweet-500 hover:bg-bittersweet-600 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-bittersweet-500/20 flex items-center justify-center gap-1.5 transition-all duration-200"
      >
        {loading ? "Mengirim..." : "Ya, Kirim Sekarang"}
        {!loading && <ArrowRight className="w-3.5 h-3.5" />}
      </motion.button>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────
   MAIN EXPORT: DialogPendaftaran
───────────────────────────────────────── */
const DialogPendaftaran: React.FC<DialogPendaftaranProps> = ({
  open,
  onClose,
  prefill,
}) => {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({ ...EMPTY_ERRORS });

  /* Reset semua state setiap kali dialog dibuka dengan prefill baru */
  useEffect(() => {
    if (open) {
      setStep("form");
      setLoading(false);
      setSelectedDate("");
      setFormData({ name: "", email: "", phone: "", description: "" });
      setErrors({ ...EMPTY_ERRORS });
    }
  }, [open, prefill.dokterId, prefill.hari, prefill.jamMulai]);

  /* Lock body scroll */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ESC key */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "confirm") setStep("form");
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, step, onClose]);

  /* Derived */
  const fixedTime = `${formatTime(prefill.jamMulai)} - ${formatTime(prefill.jamSelesai)}`;
  const availableDates = useMemo(
    () => generateAvailableDates(prefill.hari, prefill.jamSelesai),
    [prefill.hari, prefill.jamSelesai],
  );
  const dateOptions = availableDates.map((d) => ({
    value: d,
    label: formatDateLabel(d),
  }));
  const selectedDateLabel = selectedDate ? formatDateLabel(selectedDate) : "-";

  /* Validation */
  const validate = (): boolean => {
    const next: FormErrors = { ...EMPTY_ERRORS };
    let valid = true;

    if (!formData.name.trim()) {
      next.name = "Nama wajib diisi";
      valid = false;
    }

    if (!formData.email.trim()) {
      next.email = "Email wajib diisi";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Format email tidak valid";
      valid = false;
    }

    if (!formData.phone.trim()) {
      next.phone = "Nomor telepon wajib diisi";
      valid = false;
    } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
      next.phone = "Format nomor telepon tidak valid";
      valid = false;
    }

    if (!selectedDate) {
      next.date = "Tanggal wajib dipilih";
      valid = false;
    }
    if (!formData.description.trim()) {
      next.description = "Deskripsi keluhan wajib diisi";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep("confirm");
  };

  const sendWhatsApp = () => {
    const msg =
      `*PENDAFTARAN JANJI TEMU — KELAS EKSEKUTIF*\n` +
      `┌──────────────────┐\n\n` +
      `*Nama:* ${formData.name}\n` +
      `*Email:* ${formData.email}\n` +
      `*No. Telepon:* ${formData.phone}\n\n` +
      `*Poli:* ${prefill.poliNama}\n` +
      `*Dokter:* ${prefill.dokterNama}\n` +
      `*Tanggal:* ${selectedDateLabel}\n` +
      `*Waktu:* ${fixedTime}\n\n` +
      `*Keluhan:*\n${formData.description}\n\n` +
      `└──────────────────┘\n` +
      `_Mohon konfirmasi ketersediaan jadwal._`;

    const num = Profile.whatsapp.replace(/\D/g, "");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await supabase.from("appointments").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          poli_id: prefill.poliId,
          doctor_id: prefill.dokterId,
          appointment_date: selectedDate,
          appointment_time: fixedTime,
          description: formData.description,
          status: "pending",
          tipe_jadwal: "eksekutif",
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      sendWhatsApp();
      setLoading(false);
      onClose();
    }
  };

  /* Shared sub-props */
  const sharedProps = {
    prefill,
    fixedTime,
    selectedDate,
    setSelectedDate,
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    onClose,
    availableDates,
    dateOptions,
    selectedDateLabel,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="dp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut } satisfies Transition}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (step === "confirm") setStep("form");
              else onClose();
            }}
          />

          {/* Dialog panel */}
          <motion.div
            key="dp-panel"
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.45, ease } satisfies Transition}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-9999 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <AnimatePresence mode="wait">
                {step === "form" ? (
                  <FormView
                    key="form-view"
                    {...sharedProps}
                    onBack={onClose}
                    onSubmit={handleSubmit}
                  />
                ) : (
                  <ConfirmView
                    key="confirm-view"
                    prefill={prefill}
                    fixedTime={fixedTime}
                    selectedDateLabel={selectedDateLabel}
                    formData={formData}
                    loading={loading}
                    onBack={() => setStep("form")}
                    onClose={onClose}
                    onConfirm={handleConfirm}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DialogPendaftaran;
