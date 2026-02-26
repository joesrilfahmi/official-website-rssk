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
    for (let i = 0; i < 60; i++) {
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
    } catch (e) {
      console.error(e);
    }
  };

  const handlePoliChange = (poliId: string) => {
    setFormData({ ...formData, poli: poliId, doctor: "", date: "", time: "" });
    setErrors({ ...errors, poli: "", doctor: "", date: "", time: "" });
    if (poliId) {
      setLoadingDokter(true);
      setFilteredDokter(dokterList.filter((d) => d.poli_id === poliId));
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
    setFormData({ ...formData, date, time: "" });
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
    const message = `*PENDAFTARAN JANJI TEMU*\n┌────────────────────┐\n\n*Nama:* ${formData.name}\n*Email:* ${formData.email}\n*No. Telepon:* ${formData.phone}\n\n*Poli:* ${selectedPoli?.nama_poli || "-"}\n*Dokter:* ${selectedDokter ? formatDoctorName(selectedDokter) : "-"}\n*Tanggal:* ${new Date(formData.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n*Waktu:* ${formData.time}\n\n*Keluhan:*\n${formData.description}\n\n└────────────────────┘\n_Mohon konfirmasi ketersediaan jadwal._`;
    const num = Profile.whatsapp.replace(/\D/g, "");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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

  return (
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
          <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-linear-to-r from-bittersweet-400 via-bittersweet-500 to-mariner-500" />

            <div className="p-6 sm:p-8 lg:p-10">
              <Badge>Buat Janji</Badge>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-mariner-600 mb-2 leading-tight">
                Konsultasi Dokter Lebih Mudah
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Buat janji temu Anda dengan beberapa langkah mudah di bawah ini.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Data Diri */}
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

                <div className="h-px bg-gray-100" />

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

                <div className="h-px bg-gray-100" />

                {/* Jadwal */}
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-lg bg-bittersweet-500 hover:bg-bittersweet-600 mt-2"
                  disabled={loading}
                >
                  {loading ? "Mengirim..." : "Kirim ke WhatsApp"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Info Panel ── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-8">
            <div>
              <Badge
                variant="primary"
                className="border-white/30 text-white bg-white/10"
              >
                Kontak
              </Badge>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Informasi Pendaftaran
              </h2>
              <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                Kini pendaftaran layanan kesehatan di {Profile.shortName}{" "}
                semakin mudah melalui website kami. Cukup dengan beberapa
                langkah sederhana, Anda dapat memilih jadwal dokter dan jenis
                layanan kapan saja dari perangkat Anda.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 bg-white/50 rounded-full" />
              <div className="h-0.5 w-4 bg-white/25 rounded-full" />
            </div>

            {/* Contact cards */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${Profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-bittersweet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                    WhatsApp
                  </p>
                  <p className="text-white font-bold text-base group-hover:text-teal-200 transition-colors truncate">
                    {Profile.whatsapp}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${Profile.email}`}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-teal-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-white font-bold text-sm group-hover:text-teal-200 transition-colors truncate">
                    {Profile.email}
                  </p>
                </div>
              </a>

              <a
                href={`tel:${Profile.pusatPanggilan}`}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-mariner-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest">
                    Pusat Panggilan
                  </p>
                  <p className="text-white font-bold text-base group-hover:text-teal-200 transition-colors truncate">
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
