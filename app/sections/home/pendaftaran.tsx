"use client";

import Badge from "@/components/ui/custom/badge";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, AtSign, Mail, Phone, User } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface Poli {
  id: string;
  nama_poli: string;
  status: string;
}

interface Dokter {
  id: string;
  gelar_depan: string | null;
  nama: string;
  gelar_belakang: string | null;
  poli_id: string;
  status: string;
}

interface JadwalDokter {
  id: string;
  dokter_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
}

export default function PendaftaranSection() {
  const [loading, setLoading] = useState(false);
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [filteredDokter, setFilteredDokter] = useState<Dokter[]>([]);
  const [jadwalDokter, setJadwalDokter] = useState<JadwalDokter[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const [loadingPoli, setLoadingPoli] = useState(true);
  const [loadingDokter, setLoadingDokter] = useState(false);
  const [loadingJadwal, setLoadingJadwal] = useState(false);

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
    fetchPoli();
    fetchAllDokter();
  }, []);

  const generateAvailableTimes = useCallback(
    (selectedDate: string, jadwal: JadwalDokter[]) => {
      const date = new Date(selectedDate + "T00:00:00");
      const dayOfWeek = date.getDay();

      const hariMap: { [key: number]: string } = {
        0: "Minggu",
        1: "Senin",
        2: "Selasa",
        3: "Rabu",
        4: "Kamis",
        5: "Jumat",
        6: "Sabtu",
      };

      const hariName = hariMap[dayOfWeek];
      const jadwalHariIni = jadwal.filter((j) => j.hari === hariName);

      if (jadwalHariIni.length === 0) {
        setAvailableTimes([]);
        return;
      }

      const times: string[] = [];
      jadwalHariIni.forEach((jadwalItem) => {
        if (!jadwalItem.jam_mulai || !jadwalItem.jam_selesai) return;
        const formatTime = (timeStr: string) => {
          const parts = timeStr.split(":");
          if (parts.length >= 2)
            return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
          return timeStr;
        };
        times.push(
          `${formatTime(jadwalItem.jam_mulai)} - ${formatTime(jadwalItem.jam_selesai)}`,
        );
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

    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (availableHari.includes(date.getDay())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
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
          .order("hari", { ascending: true });
        if (error) throw error;
        const jadwalData = data || [];
        setJadwalDokter(jadwalData);
        generateAvailableDates(jadwalData);
        setAvailableTimes([]);
      } catch (error) {
        console.error("Error fetching jadwal:", error);
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

  const fetchPoli = async () => {
    setLoadingPoli(true);
    try {
      const { data, error } = await supabase
        .from("poli")
        .select("*")
        .eq("status", "active")
        .order("nama_poli", { ascending: true });
      if (error) throw error;
      setPoliList(data || []);
    } catch (error) {
      console.error("Error fetching poli:", error);
    } finally {
      setLoadingPoli(false);
    }
  };

  const fetchAllDokter = async () => {
    try {
      const { data, error } = await supabase
        .from("dokter")
        .select("*")
        .eq("status", "active")
        .order("nama", { ascending: true });
      if (error) throw error;
      setDokterList(data || []);
    } catch (error) {
      console.error("Error fetching dokter:", error);
    }
  };

  const handlePoliChange = (poliId: string) => {
    setFormData({ ...formData, poli: poliId, doctor: "", date: "", time: "" });
    setErrors({ ...errors, poli: "", doctor: "", date: "", time: "" });
    if (poliId) {
      setLoadingDokter(true);
      setFilteredDokter(dokterList.filter((doc) => doc.poli_id === poliId));
      setLoadingDokter(false);
    } else setFilteredDokter([]);
    setJadwalDokter([]);
    setAvailableDates([]);
    setAvailableTimes([]);
  };

  const handleDoctorChange = (doctorId: string) => {
    setFormData({ ...formData, doctor: doctorId, date: "", time: "" });
    setErrors({ ...errors, doctor: "", date: "", time: "" });
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date: date, time: "" });
    setErrors({ ...errors, date: "", time: "" });
  };

  const formatDoctorName = (doctor: Dokter) => {
    const parts = [];
    if (doctor.gelar_depan) parts.push(doctor.gelar_depan);
    parts.push(doctor.nama);
    if (doctor.gelar_belakang) parts.push(doctor.gelar_belakang);
    return parts.join(" ");
  };

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

    const message = `*PENDAFTARAN JANJI TEMU*
┌────────────────────┐

*Nama:* ${formData.name}
*Email:* ${formData.email}
*No. Telepon:* ${formData.phone}

*Poli:* ${selectedPoli?.nama_poli || "-"}
*Dokter:* ${selectedDokter ? formatDoctorName(selectedDokter) : "-"}
*Tanggal:* ${new Date(formData.date + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
*Waktu:* ${formData.time}

*Keluhan:*
${formData.description}

└────────────────────┘
_Mohon konfirmasi ketersediaan jadwal._`;

    const whatsappNumber = Profile.whatsapp.replace(/\D/g, "");
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert([
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
      if (error)
        console.warn("Data tidak tersimpan ke database:", error.message);
    } catch (error) {
      console.error("Error submitting form:", error);
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

  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-mariner-600 via-mariner-500 to-mariner-700">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-start">
          {/* ── LEFT: Form Card ── */}
          <div className="w-full bg-white rounded-3xl shadow-2xl p-5 sm:p-8 lg:p-10">
            <Badge>Buat Janji</Badge>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-mariner-500 mb-6 leading-tight">
              Konsultasi Dokter Lebih Mudah, dan Buat Janji Temu Kamu Disini
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Phone */}
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

              {/* Poli & Dokter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Keluhan */}
              <Textarea
                label="Deskripsi Keluhan Anda"
                rows={4}
                placeholder="Tuliskan keluhan Anda secara detail..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description)
                    setErrors({ ...errors, description: "" });
                }}
                error={errors.description}
                showCharCount
                maxLength={500}
                required
              />

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg bg-bittersweet-500 hover:bg-bittersweet-600"
                disabled={loading}
              >
                {loading ? "Mengirim..." : "Kirim ke WhatsApp"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </div>

          {/* ── RIGHT: Info Panel ── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-8">
            {/* Header */}
            <div>
              <Badge>Kontak</Badge>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                Informasi Pendaftaran
              </h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed">
                Kini pendaftaran layanan kesehatan di {Profile.shortName}{" "}
                semakin mudah melalui website kami. Cukup dengan beberapa
                langkah sederhana, Anda dapat memilih jadwal dokter, jenis
                layanan. Nikmati kemudahan ini kapan saja dan di mana saja,
                langsung dari perangkat Anda!
              </p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 gap-4">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bittersweet-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                    WhatsApp
                  </p>
                  <p className="text-white text-lg sm:text-xl font-bold group-hover:text-teal-300 transition-colors truncate">
                    {Profile.whatsapp}
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${Profile.email}`}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <p className="text-white text-base sm:text-lg font-bold group-hover:text-teal-300 transition-colors truncate">
                    {Profile.email}
                  </p>
                </div>
              </a>

              {/* Pusat Panggilan */}
              <a
                href={`tel:${Profile.pusatPanggilan}`}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-mariner-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                    Pusat Panggilan
                  </p>
                  <p className="text-white text-lg sm:text-xl font-bold group-hover:text-teal-300 transition-colors truncate">
                    {Profile.pusatPanggilan}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
