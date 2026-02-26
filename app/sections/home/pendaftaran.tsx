"use client";

import Badge from "@/components/ui/custom/badge";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Building2,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  User2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease },
  },
};
const formCardVariants: Variants = {
  hidden: { opacity: 0, x: -44, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 1.05, ease } },
};
const infoPanelVariants: Variants = {
  hidden: { opacity: 0, x: 44, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1.05, ease, delay: 0.15 },
  },
};
const contactContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const contactCardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};
const fieldContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease },
  },
};
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1] },
  },
};
const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 72, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.52, ease } },
  exit: {
    opacity: 0,
    y: 48,
    scale: 0.97,
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] },
  },
};
const dialogRowVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
};
const dialogItemVariants: Variants = {
  hidden: { opacity: 0, x: -10, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease },
  },
};

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

export default function PendaftaranSection() {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<Dokter[]>([]);
  const [jadwalDokter, setJadwalDokter] = useState<JadwalDokter[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingPoli, setLoadingPoli] = useState(true);
  const [loadingDokter, setLoadingDokter] = useState(false);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    poli: "",
    doctor: "",
    date: "",
    time: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    poli: "",
    doctor: "",
    date: "",
    time: "",
    description: "",
  });

  useEffect(() => {
    const init = async () => {
      await fetchPoliWithEksekutif();
      setTimeout(() => setDataReady(true), 120);
    };
    init();
  }, []);

  const generateAvailableTimes = useCallback(
    (selectedDate: string, jadwal: JadwalDokter[]) => {
      const date = new Date(selectedDate + "T00:00:00");
      const hariMap: { [key: number]: string } = {
        0: "Minggu",
        1: "Senin",
        2: "Selasa",
        3: "Rabu",
        4: "Kamis",
        5: "Jumat",
        6: "Sabtu",
      };
      const jadwalHariIni = jadwal.filter(
        (j) => j.hari === hariMap[date.getDay()],
      );
      if (jadwalHariIni.length === 0) {
        setAvailableTimes([]);
        return;
      }
      const times: string[] = [];
      jadwalHariIni.forEach((j) => {
        if (!j.jam_mulai || !j.jam_selesai) return;
        const fmt = (t: string) => {
          const p = t.split(":");
          return p.length >= 2
            ? `${p[0].padStart(2, "0")}:${p[1].padStart(2, "0")}`
            : t;
        };
        times.push(`${fmt(j.jam_mulai)} - ${fmt(j.jam_selesai)}`);
      });
      setAvailableTimes(times);
    },
    [],
  );

  const generateAvailableDates = useCallback((jadwal: JadwalDokter[]) => {
    if (jadwal.length === 0) {
      setAvailableDates([]);
      return;
    }
    const hariMap: { [key: string]: number } = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    };
    const availableHari = jadwal.map((j) => hariMap[j.hari]);
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (availableHari.includes(date.getDay())) {
        dates.push(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        );
      }
    }
    setAvailableDates(dates);
  }, []);

  const fetchJadwalDokter = useCallback(
    async (dokterId: string) => {
      setLoadingJadwal(true);
      try {
        const { data, error } = await supabase
          .from("jadwal_dokter")
          .select("*")
          .eq("dokter_id", dokterId)
          .eq("tipe_jadwal", "eksekutif")
          .order("hari", { ascending: true });
        if (error) throw error;
        const jadwalData = data || [];
        setJadwalDokter(jadwalData);
        generateAvailableDates(jadwalData);
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
    if (formData.doctor) fetchJadwalDokter(formData.doctor);
    else {
      setJadwalDokter([]);
      setAvailableDates([]);
      setAvailableTimes([]);
    }
  }, [formData.doctor, fetchJadwalDokter]);

  useEffect(() => {
    if (formData.date && jadwalDokter.length > 0)
      generateAvailableTimes(formData.date, jadwalDokter);
    else setAvailableTimes([]);
  }, [formData.date, jadwalDokter, generateAvailableTimes]);

  /**
   * Fetch hanya poli yang memiliki minimal 1 dokter aktif dengan jadwal eksekutif.
   * Alur: jadwal_eksekutif → dokter_id → poli_id → poli
   */
  const fetchPoliWithEksekutif = async () => {
    setLoadingPoli(true);
    try {
      // 1. Semua dokter_id yang punya jadwal eksekutif
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_dokter")
        .select("dokter_id")
        .eq("tipe_jadwal", "eksekutif");
      if (jadwalError) throw jadwalError;

      const dokterIdsWithEksekutif = [
        ...new Set(
          (jadwalData || []).map((j: { dokter_id: string }) => j.dokter_id),
        ),
      ];
      if (dokterIdsWithEksekutif.length === 0) {
        setPoliList([]);
        return;
      }

      // 2. Dokter aktif dari daftar → ambil poli_id unik
      const { data: dokterData, error: dokterError } = await supabase
        .from("dokter")
        .select("poli_id")
        .eq("status", "active")
        .in("id", dokterIdsWithEksekutif);
      if (dokterError) throw dokterError;

      const poliIdsWithEksekutif = [
        ...new Set(
          (dokterData || []).map((d: { poli_id: string }) => d.poli_id),
        ),
      ];
      if (poliIdsWithEksekutif.length === 0) {
        setPoliList([]);
        return;
      }

      // 3. Fetch poli aktif yang masuk daftar
      const { data: poliData, error: poliError } = await supabase
        .from("poli")
        .select("id, nama_poli, status")
        .eq("status", "active")
        .in("id", poliIdsWithEksekutif)
        .order("nama_poli", { ascending: true });
      if (poliError) throw poliError;
      setPoliList(poliData || []);
    } catch (e) {
      console.error(e);
      setPoliList([]);
    } finally {
      setLoadingPoli(false);
    }
  };

  /**
   * Fetch dokter aktif di poli yang juga punya jadwal eksekutif
   */
  const fetchDokterByPoli = async (poliId: string) => {
    setLoadingDokter(true);
    try {
      // 1. Dokter_id yang punya jadwal eksekutif
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_dokter")
        .select("dokter_id")
        .eq("tipe_jadwal", "eksekutif");
      if (jadwalError) throw jadwalError;

      const dokterIdsWithEksekutif = [
        ...new Set(
          (jadwalData || []).map((j: { dokter_id: string }) => j.dokter_id),
        ),
      ];
      if (dokterIdsWithEksekutif.length === 0) {
        setFilteredDokter([]);
        return;
      }

      // 2. Dokter aktif di poli ini yang ada di daftar eksekutif
      const { data, error } = await supabase
        .from("dokter")
        .select("id, nama, poli_id, profile, status")
        .eq("status", "active")
        .eq("poli_id", poliId)
        .in("id", dokterIdsWithEksekutif)
        .order("nama", { ascending: true });
      if (error) throw error;
      setFilteredDokter(data || []);
    } catch (e) {
      console.error(e);
      setFilteredDokter([]);
    } finally {
      setLoadingDokter(false);
    }
  };

  const handlePoliChange = (poliId: string) => {
    setFormData({ ...formData, poli: poliId, doctor: "", date: "", time: "" });
    setErrors({ ...errors, poli: "", doctor: "", date: "", time: "" });
    setFilteredDokter([]);
    setJadwalDokter([]);
    setAvailableDates([]);
    setAvailableTimes([]);
    if (poliId) fetchDokterByPoli(poliId);
  };
  const handleDoctorChange = (doctorId: string) => {
    setFormData({ ...formData, doctor: doctorId, date: "", time: "" });
    setErrors({ ...errors, doctor: "", date: "", time: "" });
  };
  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date, time: "" });
    setErrors({ ...errors, date: "", time: "" });
  };
  const formatDoctorName = (doctor: Dokter) => doctor.nama;

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      poli: "",
      doctor: "",
      date: "",
      time: "",
      description: "",
    };
    let isValid = true;
    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
      isValid = false;
    } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
      isValid = false;
    }
    if (!formData.poli) {
      newErrors.poli = "Pilih poli terlebih dahulu";
      isValid = false;
    }
    if (!formData.doctor) {
      newErrors.doctor = "Pilih dokter terlebih dahulu";
      isValid = false;
    }
    if (!formData.date) {
      newErrors.date = "Tanggal wajib diisi";
      isValid = false;
    }
    if (!formData.time) {
      newErrors.time = "Waktu wajib diisi";
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi keluhan wajib diisi";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const sendWhatsAppMessage = () => {
    const selectedPoli = poliList.find((p) => p.id === formData.poli);
    const selectedDokter = filteredDokter.find((d) => d.id === formData.doctor);
    const message = `*PENDAFTARAN JANJI TEMU — KELAS EKSEKUTIF*\n┌──────────────────┐\n\n*Nama:* ${formData.name}\n*Email:* ${formData.email}\n*No. Telepon:* ${formData.phone}\n\n*Poli:* ${selectedPoli?.nama_poli || "-"}\n*Dokter:* ${selectedDokter ? formatDoctorName(selectedDokter) : "-"}\n*Tanggal:* ${new Date(formData.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n*Waktu:* ${formData.time}\n\n*Keluhan:*\n${formData.description}\n\n└──────────────────┘\n_Mohon konfirmasi ketersediaan jadwal._`;
    const num = Profile.whatsapp.replace(/\D/g, "");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      await supabase.from("appointments").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          poli_id: formData.poli,
          doctor_id: formData.doctor,
          appointment_date: formData.date,
          appointment_time: formData.time,
          description: formData.description,
          status: "pending",
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      sendWhatsAppMessage();
      setFormData({
        name: "",
        email: "",
        phone: "",
        poli: "",
        doctor: "",
        date: "",
        time: "",
        description: "",
      });
      setFilteredDokter([]);
      setJadwalDokter([]);
      setAvailableDates([]);
      setAvailableTimes([]);
      setErrors({
        name: "",
        email: "",
        phone: "",
        poli: "",
        doctor: "",
        date: "",
        time: "",
        description: "",
      });
      setLoading(false);
    }
  };

  const poliOptions = poliList.map((p) => ({
    value: p.id,
    label: p.nama_poli,
  }));
  const dokterOptions = filteredDokter.map((d) => ({
    value: d.id,
    label: formatDoctorName(d),
  }));
  const dateOptions = availableDates.map((date) => ({
    value: date,
    label: new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));
  const timeOptions = availableTimes.map((time) => ({
    value: time,
    label: time,
  }));

  const selectedPoliLabel =
    poliList.find((p) => p.id === formData.poli)?.nama_poli ?? "-";
  const selectedDokterLabel = filteredDokter.find(
    (d) => d.id === formData.doctor,
  )
    ? formatDoctorName(filteredDokter.find((d) => d.id === formData.doctor)!)
    : "-";
  const selectedDateLabel = formData.date
    ? new Date(formData.date + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <>
      {/* ── Confirmation Dialog ── */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-9998 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              key="dialog"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-mariner-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-[18px] h-[18px] text-mariner-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-bittersweet-500">
                      Konfirmasi Pendaftaran Eksekutif
                    </p>
                    <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                      Periksa Data Anda
                    </h2>
                  </div>
                </motion.div>
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    backgroundColor: "rgba(0,0,0,0.05)",
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowConfirmDialog(false)}
                  aria-label="Tutup"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Data Groups */}
              <motion.div
                variants={dialogRowVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pb-4 space-y-3"
              >
                {/* Group 1: Identitas */}
                <motion.div variants={dialogItemVariants}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                    <User2 className="w-3 h-3" />
                    Identitas Pasien
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Nama
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right truncate">
                        {formData.name}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Email
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right truncate">
                        {formData.email}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Telepon
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right">
                        {formData.phone}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Group 2: Detail Janji */}
                <motion.div variants={dialogItemVariants}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3" />
                    Detail Janji Temu
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Poli
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right">
                        {selectedPoliLabel}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Dokter
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right truncate">
                        {selectedDokterLabel}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Tanggal
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right">
                        {selectedDateLabel}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Waktu
                      </span>
                      <span className="text-xs font-semibold text-mariner-600 text-right font-mono">
                        {formData.time}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Layanan
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bittersweet-600 bg-bittersweet-50 px-2 py-0.5 rounded-full">
                        <Building2 className="w-2.5 h-2.5" />
                        Eksekutif
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Group 3: Keluhan */}
                <motion.div variants={dialogItemVariants}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Keluhan
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                      {formData.description}
                    </p>
                  </div>
                </motion.div>

                <motion.p
                  variants={dialogItemVariants}
                  className="text-[10px] text-gray-400 text-center leading-relaxed"
                >
                  Data ini akan dikirimkan melalui WhatsApp untuk konfirmasi
                  jadwal.
                </motion.p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4, ease }}
                className="px-6 pb-5 flex gap-2.5"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-4 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Periksa Lagi
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  onClick={handleConfirm}
                  className="flex-2 px-5 py-4 rounded-full bg-bittersweet-500 hover:bg-bittersweet-600 text-white text-xs font-bold shadow-md shadow-bittersweet-500/20 flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  Ya, Kirim Sekarang
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        id="pendaftaran"
        className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-br from-mariner-700 via-mariner-600 to-mariner-800">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-mariner-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-mariner-900/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-10 xl:gap-16 items-start">
            {/* ── LEFT: Form Card ── */}
            <motion.div
              variants={formCardVariants}
              initial="hidden"
              whileInView={dataReady ? "visible" : "hidden"}
              viewport={{ once: true, margin: "-60px" }}
              className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 lg:p-10">
                <motion.div
                  variants={fieldContainerVariants}
                  initial="hidden"
                  whileInView={dataReady ? "visible" : "hidden"}
                  viewport={{ once: true }}
                >
                  {/* Badges */}
                  <motion.div
                    variants={fieldVariants}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <Badge>Buat Janji</Badge>
                  </motion.div>

                  <motion.h2
                    variants={fieldVariants}
                    className="mt-3 text-2xl sm:text-3xl font-extrabold text-mariner-600 mb-2 leading-tight"
                  >
                    Konsultasi Dokter Lebih Mudah
                  </motion.h2>
                  <motion.p
                    variants={fieldVariants}
                    className="text-gray-500 text-sm mb-5"
                  >
                    Buat janji temu Anda dengan beberapa langkah mudah di bawah
                    ini.
                  </motion.p>

                  {/* ── Eksekutif notice banner ── */}
                  <motion.div
                    variants={fieldVariants}
                    className="mb-6 flex items-start gap-3 bg-bittersweet-50 border border-bittersweet-200/70 rounded-2xl px-4 py-3"
                  >
                    <ShieldCheck className="w-4 h-4 text-bittersweet-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-bittersweet-700 leading-relaxed">
                      <span className="font-bold">
                        Pendaftaran ini khusus untuk Layanan Eksekutif.
                      </span>{" "}
                      Hanya poli dan dokter dengan jadwal eksekutif yang
                      tersedia. Untuk layanan reguler, silakan mendaftar
                      langsung ke loket rumah sakit.
                    </p>
                  </motion.div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div
                    variants={fieldContainerVariants}
                    initial="hidden"
                    whileInView={dataReady ? "visible" : "hidden"}
                    viewport={{ once: true }}
                    className="space-y-5"
                  >
                    <motion.div
                      variants={fieldVariants}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <Input
                        label="Nama"
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: "" });
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
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        icon={AtSign}
                        error={errors.email}
                        required
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants}>
                      <Input
                        label="Nomor Telepon"
                        type="tel"
                        placeholder="08xx-xxxx-xxxx"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: "" });
                        }}
                        icon={Phone}
                        error={errors.phone}
                        required
                      />
                    </motion.div>

                    <motion.div
                      variants={fieldVariants}
                      className="h-px bg-gray-100"
                    />

                    <motion.div
                      variants={fieldVariants}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <Select
                        label="Poli"
                        placeholder="Pilih poli"
                        value={formData.poli}
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
                        value={formData.doctor}
                        onChange={handleDoctorChange}
                        options={dokterOptions}
                        searchable
                        disabled={!formData.poli}
                        loading={loadingDokter}
                        error={errors.doctor}
                        helperText={
                          !formData.poli ? "Pilih poli terlebih dahulu" : ""
                        }
                        required
                      />
                    </motion.div>

                    <motion.div
                      variants={fieldVariants}
                      className="h-px bg-gray-100"
                    />

                    <motion.div
                      variants={fieldVariants}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <Select
                        label="Tanggal"
                        placeholder="Pilih tanggal"
                        value={formData.date}
                        onChange={handleDateChange}
                        options={dateOptions}
                        searchable={false}
                        disabled={!formData.doctor || loadingJadwal}
                        loading={loadingJadwal}
                        error={errors.date}
                        helperText={
                          !formData.doctor
                            ? "Pilih dokter terlebih dahulu"
                            : loadingJadwal
                              ? "Memuat jadwal..."
                              : availableDates.length === 0 && formData.doctor
                                ? "Tidak ada jadwal tersedia"
                                : ""
                        }
                        required
                      />
                      <Select
                        label="Waktu"
                        placeholder="Pilih waktu"
                        value={formData.time}
                        onChange={(value) => {
                          setFormData({ ...formData, time: value });
                          if (errors.time) setErrors({ ...errors, time: "" });
                        }}
                        options={timeOptions}
                        searchable={false}
                        disabled={!formData.date}
                        error={errors.time}
                        helperText={
                          !formData.date
                            ? "Pilih tanggal terlebih dahulu"
                            : availableTimes.length === 0 && formData.date
                              ? "Tidak ada waktu tersedia"
                              : ""
                        }
                        required
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants}>
                      <Textarea
                        label="Deskripsi Keluhan Anda"
                        rows={4}
                        placeholder="Tuliskan keluhan Anda secara detail..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          });
                          if (errors.description)
                            setErrors({ ...errors, description: "" });
                        }}
                        error={errors.description}
                        showCharCount
                        maxLength={500}
                        required
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants}>
                      <div className="flex justify-center">
                        <div className="inline-block">
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              type="submit"
                              variant="primary"
                              size="lg"
                              className="shadow-lg bg-bittersweet-500 hover:bg-bittersweet-600 mt-2"
                              disabled={loading}
                            >
                              {loading ? "Mengirim..." : "Kirim ke WhatsApp"}
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* ── RIGHT: Info Panel ── */}
            <motion.div
              variants={infoPanelVariants}
              initial="hidden"
              whileInView={dataReady ? "visible" : "hidden"}
              viewport={{ once: true, margin: "-60px" }}
              className="flex flex-col gap-6 lg:sticky lg:top-8"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView={dataReady ? "visible" : "hidden"}
                viewport={{ once: true }}
              >
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <Badge
                    variant="primary"
                    className="border-white/30 text-white bg-white/10"
                  >
                    Kontak
                  </Badge>
                </motion.div>
                <motion.h2
                  variants={itemVariants}
                  className="mt-3 text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4"
                >
                  Informasi Pendaftaran
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-white/75 text-sm sm:text-base leading-relaxed"
                >
                  Kini pendaftaran layanan kesehatan di {Profile.shortName}{" "}
                  semakin mudah melalui website kami. Cukup dengan beberapa
                  langkah sederhana, Anda dapat memilih jadwal dokter dan jenis
                  layanan kapan saja dari perangkat Anda.
                </motion.p>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, scaleX: 0 },
                  visible: {
                    opacity: 1,
                    scaleX: 1,
                    transition: { duration: 0.7, ease },
                  },
                }}
                initial="hidden"
                whileInView={dataReady ? "visible" : "hidden"}
                viewport={{ once: true }}
                style={{ originX: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-0.5 w-8 bg-white/50 rounded-full" />
                <div className="h-0.5 w-4 bg-white/25 rounded-full" />
              </motion.div>

              <motion.div
                variants={contactContainerVariants}
                initial="hidden"
                whileInView={dataReady ? "visible" : "hidden"}
                viewport={{ once: true }}
                className="space-y-3"
              >
                <motion.a
                  variants={contactCardVariants}
                  whileHover={{
                    scale: 1.02,
                    x: 4,
                    transition: { duration: 0.25, ease },
                  }}
                  href={`https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-colors duration-300"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: 0.1 }}
                    className="w-11 h-11 bg-bittersweet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                      WhatsApp
                    </p>
                    <p className="text-white font-bold text-base group-hover:text-teal-200 transition-colors truncate">
                      {Profile.whatsapp}
                    </p>
                  </div>
                </motion.a>

                <motion.a
                  variants={contactCardVariants}
                  whileHover={{
                    scale: 1.02,
                    x: 4,
                    transition: { duration: 0.25, ease },
                  }}
                  href={`mailto:${Profile.email}`}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-colors duration-300"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: 0.2 }}
                    className="w-11 h-11 bg-teal-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                      Email
                    </p>
                    <p className="text-white font-bold text-sm group-hover:text-teal-200 transition-colors truncate">
                      {Profile.email}
                    </p>
                  </div>
                </motion.a>

                <motion.a
                  variants={contactCardVariants}
                  whileHover={{
                    scale: 1.02,
                    x: 4,
                    transition: { duration: 0.25, ease },
                  }}
                  href={`tel:${Profile.pusatPanggilan}`}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-colors duration-300"
                >
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: 0.3 }}
                    className="w-11 h-11 bg-mariner-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                      Pusat Panggilan
                    </p>
                    <p className="text-white font-bold text-base group-hover:text-teal-200 transition-colors truncate">
                      {Profile.pusatPanggilan}
                    </p>
                  </div>
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
