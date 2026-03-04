"use client";

import Animate, { ease } from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Heart,
  MessageSquare,
  Send,
  Star,
  User2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────
   VARIANTS
───────────────────────────────────────── */
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
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.52, ease } satisfies Transition,
  },
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
    transition: { duration: 0.45, ease } satisfies Transition,
  },
};

const successVariants: Variants = {
  hidden: { opacity: 0, scale: 0.82, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease } satisfies Transition,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 12,
    transition: { duration: 0.28, ease: [0.0, 0.0, 0.2, 1] },
  },
};

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface UnitPelayanan {
  id: string;
  title: string;
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const KritikSaran = () => {
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    no_hp: "",
    unit_pelayanan_id: "",
    pesan: "",
    rating: 0,
    is_anonymus: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ratingLabels = [
    "",
    "Sangat Buruk",
    "Buruk",
    "Cukup",
    "Baik",
    "Sangat Baik",
  ];

  useEffect(() => {
    const fetchUnitPelayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("unit_pelayanan")
          .select("*")
          .order("title", { ascending: true });
        if (error) throw error;
        setUnitPelayananList(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 80);
      }
    };
    fetchUnitPelayanan();
    const channel = supabase
      .channel("unit_pelayanan_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unit_pelayanan" },
        () => fetchUnitPelayanan(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.is_anonymus) {
      if (!formData.nama.trim()) newErrors.nama = "Nama wajib diisi";
      if (!formData.no_hp.trim()) newErrors.no_hp = "No HP wajib diisi";
      else if (!/^[0-9]{10,15}$/.test(formData.no_hp))
        newErrors.no_hp = "No HP tidak valid (10-15 digit)";
    }
    if (!formData.unit_pelayanan_id)
      newErrors.unit_pelayanan_id = "Unit pelayanan wajib dipilih";
    if (!formData.pesan.trim()) newErrors.pesan = "Pesan wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    // 1. Tutup dialog konfirmasi dulu
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("kritik_saran").insert([
        {
          nama: formData.is_anonymus ? "Anonim" : formData.nama.trim(),
          no_hp: formData.is_anonymus ? "000000000000" : formData.no_hp.trim(),
          unit_pelayanan_id: formData.unit_pelayanan_id,
          pesan: formData.pesan.trim(),
          rating: formData.rating > 0 ? formData.rating : null,
          is_anonymus: formData.is_anonymus,
          status: "unread",
          is_readed: false,
        },
      ]);
      if (error) throw error;

      // Reset form
      setFormData({
        nama: "",
        no_hp: "",
        unit_pelayanan_id: "",
        pesan: "",
        rating: 0,
        is_anonymus: false,
      });

      // 2. Tampilkan dialog sukses setelah exit animation selesai (~320ms)
      setTimeout(() => setShowSuccessDialog(true), 320);
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim kritik & saran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUnitLabel =
    unitPelayananList.find((u) => u.id === formData.unit_pelayanan_id)?.title ??
    "-";

  return (
    <>
      {/* ══════════════════════
          DIALOG KONFIRMASI
      ══════════════════════ */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            key="confirm-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-9998 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              key="confirm-dialog"
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
                  transition={
                    { delay: 0.15, duration: 0.4, ease } satisfies Transition
                  }
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-mariner-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-[18px] h-[18px] text-mariner-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-greenfresh-600">
                      Konfirmasi Pengiriman
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

              {/* Body */}
              <motion.div
                variants={dialogRowVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pb-4 space-y-3"
              >
                {/* Identitas */}
                {!formData.is_anonymus ? (
                  <motion.div variants={dialogItemVariants}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <User2 className="w-3 h-3" /> Identitas Pengirim
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                      {[
                        ["Nama", formData.nama],
                        ["No HP", formData.no_hp],
                      ].map(([label, val], i) => (
                        <React.Fragment key={label}>
                          {i > 0 && <div className="h-px bg-gray-100" />}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-500 shrink-0">
                              {label}
                            </span>
                            <span className="text-xs font-semibold text-gray-900 text-right truncate">
                              {val}
                            </span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div variants={dialogItemVariants}>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-3">
                      <User2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500">
                        Dikirim sebagai{" "}
                        <span className="font-semibold text-gray-700">
                          Anonim
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Detail */}
                <motion.div variants={dialogItemVariants}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> Detail Kritik & Saran
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500 shrink-0">
                        Unit Pelayanan
                      </span>
                      <span className="text-xs font-semibold text-gray-900 text-right truncate">
                        {selectedUnitLabel}
                      </span>
                    </div>
                    {formData.rating > 0 && (
                      <>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-gray-500 shrink-0">
                            Rating
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                            {"★".repeat(formData.rating)}{" "}
                            {ratingLabels[formData.rating]}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Pesan */}
                <motion.div variants={dialogItemVariants}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Pesan
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                      {formData.pesan}
                    </p>
                  </div>
                </motion.div>

                <motion.p
                  variants={dialogItemVariants}
                  className="text-[10px] text-gray-400 text-center leading-relaxed"
                >
                  Pastikan data sudah benar sebelum mengirim.
                </motion.p>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  { delay: 0.45, duration: 0.4, ease } satisfies Transition
                }
                className="px-6 pb-5 flex gap-2.5"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 } satisfies Transition}
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-4 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Periksa Lagi
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 } satisfies Transition}
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-2 px-5 py-4 rounded-full bg-mariner-500 hover:bg-mariner-600 text-white text-xs font-bold shadow-md shadow-mariner-500/20 flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    "Mengirim..."
                  ) : (
                    <>
                      Ya, Kirim Sekarang <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════
          DIALOG TERIMA KASIH
      ══════════════════════ */}
      <AnimatePresence>
        {showSuccessDialog && (
          <motion.div
            key="success-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuccessDialog(false)}
          >
            <motion.div
              key="success-dialog"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient top */}
              <div className="h-2 w-full bg-linear-to-r from-greenfresh-400 via-mariner-400 to-greenfresh-500" />

              {/* Close */}
              <motion.button
                whileHover={{
                  scale: 1.08,
                  backgroundColor: "rgba(0,0,0,0.06)",
                }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowSuccessDialog(false)}
                aria-label="Tutup"
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </motion.button>

              <div className="px-8 pt-8 pb-8 flex flex-col items-center text-center">
                {/* Animated icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={
                    { delay: 0.1, duration: 0.6, ease } satisfies Transition
                  }
                  className="relative mb-6"
                >
                  <div className="w-24 h-24 rounded-full bg-greenfresh-50 ring-8 ring-greenfresh-100 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={
                        {
                          delay: 0.28,
                          duration: 0.45,
                          ease,
                        } satisfies Transition
                      }
                    >
                      <CheckCircle2 className="w-12 h-12 text-greenfresh-500" />
                    </motion.div>
                  </div>
                  {/* Heart accent bubble */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0, x: 10, y: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    transition={
                      { delay: 0.48, duration: 0.4, ease } satisfies Transition
                    }
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-bittersweet-50 ring-2 ring-white flex items-center justify-center"
                  >
                    <Heart className="w-3.5 h-3.5 text-bittersweet-400 fill-bittersweet-400" />
                  </motion.div>
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.28, duration: 0.5, ease } satisfies Transition
                  }
                  className="space-y-2 mb-6"
                >
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    Terima Kasih! 🎉
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    Kritik dan saran Anda telah berhasil terkirim. Masukan Anda
                    sangat berarti untuk meningkatkan kualitas layanan kami.
                  </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={
                    { delay: 0.42, duration: 0.5, ease } satisfies Transition
                  }
                  className="w-full h-px bg-gray-100 mb-6"
                  style={{ originX: 0.5 }}
                />

                {/* Info badge */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.5, duration: 0.4, ease } satisfies Transition
                  }
                  className="flex items-start gap-2.5 bg-mariner-50 border border-mariner-100 rounded-2xl px-4 py-3 mb-6 w-full text-left"
                >
                  <Send className="w-3.5 h-3.5 text-mariner-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-mariner-700 leading-relaxed">
                    Tim kami akan meninjau dan menindaklanjuti masukan Anda
                    sesegera mungkin.
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.58, duration: 0.4, ease } satisfies Transition
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSuccessDialog(false)}
                  className="w-full py-3.5 rounded-full bg-greenfresh-500 hover:bg-greenfresh-600 text-white text-sm font-bold shadow-lg shadow-greenfresh-500/25 transition-all duration-200"
                >
                  Selesai
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════
          MAIN PAGE
      ══════════════════════ */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Animate type="fadein" ready={dataReady}>
            <Banner
              title="Kritik & Saran"
              subtitle="Suara Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan"
            />
          </Animate>

          <div className="mt-12 max-w-2xl mx-auto">
            <Animate type="slideup" ready={dataReady} delay={0.05}>
              <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                <div className="p-7 sm:p-10">
                  {/* Loading skeleton */}
                  {loading && (
                    <div className="animate-pulse space-y-6">
                      <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
                      <div className="h-8 w-56 bg-gray-100 rounded mx-auto" />
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
                      ))}
                      <div className="h-28 bg-gray-100 rounded-xl" />
                      <div className="h-12 bg-gray-100 rounded-xl" />
                    </div>
                  )}

                  {/* Form */}
                  {!loading && (
                    <>
                      <Animate
                        type="stagger"
                        staggerChildren={0.08}
                        delayChildren={0.1}
                        ready={dataReady}
                        className="space-y-0"
                      >
                        <Animate type="fielditem" className="text-center mb-8">
                          <Title
                            badge="Formulir"
                            title="Formulir Kritik & Saran"
                            badgeVariant="default"
                            align="center"
                          />
                        </Animate>
                      </Animate>

                      <Animate
                        type="stagger"
                        staggerChildren={0.08}
                        delayChildren={0.15}
                        ready={dataReady}
                        className="space-y-5"
                      >
                        {/* Anonymous toggle */}
                        <Animate type="fielditem">
                          <label
                            htmlFor="is_anonymus"
                            className="flex items-center gap-3 p-4 bg-mariner-50 rounded-xl cursor-pointer ring-1 ring-mariner-100 hover:ring-mariner-300 transition-all"
                          >
                            <input
                              type="checkbox"
                              id="is_anonymus"
                              name="is_anonymus"
                              checked={formData.is_anonymus}
                              onChange={handleInputChange}
                              disabled={isSubmitting}
                              className="w-4 h-4 rounded text-mariner-600 focus:ring-mariner-400 shrink-0"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Kirim sebagai anonim{" "}
                              <span className="text-gray-400 font-normal">
                                (nama & nomor HP tidak diperlukan)
                              </span>
                            </span>
                          </label>
                        </Animate>

                        {/* Name + phone */}
                        {!formData.is_anonymus && (
                          <Animate type="fielditem">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                label="Nama Lengkap"
                                name="nama"
                                placeholder="Masukkan nama lengkap"
                                value={formData.nama}
                                onChange={handleInputChange}
                                error={errors.nama}
                                required
                                disabled={isSubmitting}
                              />
                              <Input
                                label="No HP"
                                name="no_hp"
                                type="tel"
                                placeholder="08123456789"
                                value={formData.no_hp}
                                onChange={handleInputChange}
                                error={errors.no_hp}
                                required
                                disabled={isSubmitting}
                              />
                            </div>
                          </Animate>
                        )}

                        {/* Unit pelayanan */}
                        <Animate type="fielditem">
                          <Select
                            label="Unit Pelayanan"
                            placeholder="Pilih Unit Pelayanan"
                            value={formData.unit_pelayanan_id}
                            onChange={(value) =>
                              handleSelectChange("unit_pelayanan_id", value)
                            }
                            options={unitPelayananList.map((u) => ({
                              value: u.id,
                              label: u.title,
                            }))}
                            error={errors.unit_pelayanan_id}
                            required
                            disabled={isSubmitting}
                            searchable
                          />
                        </Animate>

                        {/* Rating */}
                        <Animate type="fielditem">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Rating Kepuasan{" "}
                              <span className="text-gray-400 font-normal">
                                (opsional)
                              </span>
                            </label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    setFormData((p) => ({
                                      ...p,
                                      rating: p.rating === star ? 0 : star,
                                    }))
                                  }
                                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                  <Star
                                    className={`w-9 h-9 transition-colors ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`}
                                  />
                                </button>
                              ))}
                              {formData.rating > 0 && (
                                <span className="ml-2 self-center text-sm text-gray-400">
                                  {ratingLabels[formData.rating]}
                                </span>
                              )}
                            </div>
                          </div>
                        </Animate>

                        {/* Message */}
                        <Animate type="fielditem">
                          <Textarea
                            label="Kritik & Saran"
                            name="pesan"
                            placeholder="Tuliskan kritik dan saran Anda di sini..."
                            value={formData.pesan}
                            onChange={handleInputChange}
                            error={errors.pesan}
                            required
                            rows={5}
                            disabled={isSubmitting}
                          />
                        </Animate>

                        {/* Submit */}
                        <Animate type="fielditem">
                          <Button
                            variant="primary"
                            size="lg"
                            className="w-full justify-center bg-mariner-500 hover:bg-mariner-600"
                            onClick={handleSubmitClick}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              "Mengirim..."
                            ) : (
                              <>
                                {" "}
                                Kirim Kritik & Saran{" "}
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </Button>
                        </Animate>
                      </Animate>
                    </>
                  )}
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </div>
    </>
  );
};

export default KritikSaran;
