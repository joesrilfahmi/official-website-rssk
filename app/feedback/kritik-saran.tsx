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
  ExternalLink,
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

const pageVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.45, ease } satisfies Transition,
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] },
  },
};

const choiceCardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12 + 0.2,
      duration: 0.5,
      ease,
    } satisfies Transition,
  }),
};

/* ─────────────────────────────────────────
   EMOJI ANIMATION VARIANTS
───────────────────────────────────────── */
const emojiIdleVariants: Variants = {
  idle: { rotate: 0, scale: 1, y: 0 },
  hover: {
    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
    scale: [1, 1.25, 1.15, 1.22, 1.18, 1.2],
    y: [0, -8, -4, -10, -6, -8],
    transition: {
      duration: 0.7,
      ease: "easeInOut",
      times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    },
  },
};

const emojiHappyVariants: Variants = {
  idle: { rotate: 0, scale: 1, y: 0 },
  hover: {
    rotate: [0, 12, -12, 8, -8, 4, 0],
    scale: [1, 1.3, 1.15, 1.28, 1.2, 1.25],
    y: [0, -12, -5, -14, -8, -10],
    transition: {
      duration: 0.65,
      ease: "easeInOut",
      times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
    },
  },
};

/* Floating particle that pops out on hover */
const particles = ["✨", "⭐", "💫", "🌟"];
const sadParticles = ["💬", "📝", "✍️", "💡"];

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type Step = "choice" | "form";

interface UnitPelayanan {
  id: string;
  title: string;
}

/* ─────────────────────────────────────────
   GOOGLE REVIEW URL
───────────────────────────────────────── */
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJcf3PP4nk1y0RBSul7-dymak";

/* ─────────────────────────────────────────
   FLOATING PARTICLE COMPONENT
───────────────────────────────────────── */
const FloatingParticle = ({
  emoji,
  index,
  isVisible,
}: {
  emoji: string;
  index: number;
  isVisible: boolean;
}) => {
  const angle = (index / 4) * Math.PI * 2 - Math.PI / 2;
  const radius = 52 + (index % 2) * 14;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius - 16;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.span
          key={`particle-${index}`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.6],
            x: [0, x * 0.5, x],
            y: [0, y * 0.5, y],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: 0.75,
            delay: index * 0.07,
            ease: "easeOut",
          }}
          className="absolute text-base pointer-events-none select-none"
          style={{ left: "50%", top: "38%", marginLeft: -10, marginTop: -10 }}
        >
          {emoji}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const KritikSaran = () => {
  const [step, setStep] = useState<Step>("choice");
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [choiceReady, setChoiceReady] = useState(false);

  // Track hover state per card for particles
  const [sadHovered, setSadHovered] = useState(false);
  const [happyHovered, setHappyHovered] = useState(false);
  const [sadParticleKey, setSadParticleKey] = useState(0);
  const [happyParticleKey, setHappyParticleKey] = useState(0);

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
    setTimeout(() => setChoiceReady(true), 80);
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

      setFormData({
        nama: "",
        no_hp: "",
        unit_pelayanan_id: "",
        pesan: "",
        rating: 0,
        is_anonymus: false,
      });

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
            className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
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
              <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between">
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
                className="px-5 sm:px-6 pb-4 space-y-3"
              >
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
                className="px-5 sm:px-6 pb-5 flex gap-2.5"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 } satisfies Transition}
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-3.5 sm:py-4 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
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
                  className="flex-[2] px-5 py-3.5 sm:py-4 rounded-full bg-mariner-500 hover:bg-mariner-600 text-white text-xs font-bold shadow-md shadow-mariner-500/20 flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-60"
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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
              <div className="h-2 w-full bg-linear-to-r from-greenfresh-400 via-mariner-400 to-greenfresh-500" />

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

              <div className="px-6 sm:px-8 pt-8 pb-8 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={
                    { delay: 0.1, duration: 0.6, ease } satisfies Transition
                  }
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-greenfresh-50 ring-8 ring-greenfresh-100 flex items-center justify-center">
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
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-greenfresh-500" />
                    </motion.div>
                  </div>
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

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.28, duration: 0.5, ease } satisfies Transition
                  }
                  className="space-y-2 mb-6"
                >
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Terima Kasih! 🎉
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    Kritik dan saran Anda telah berhasil terkirim. Masukan Anda
                    sangat berarti untuk meningkatkan kualitas layanan kami.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={
                    { delay: 0.42, duration: 0.5, ease } satisfies Transition
                  }
                  className="w-full h-px bg-gray-100 mb-6"
                  style={{ originX: 0.5 }}
                />

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

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { delay: 0.58, duration: 0.4, ease } satisfies Transition
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowSuccessDialog(false);
                    setStep("choice");
                  }}
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
      <div className="bg-gray-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Animate type="fadein" ready={choiceReady}>
            <Banner
              title="Kritik & Saran"
              subtitle="Suara Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan"
            />
          </Animate>

          <AnimatePresence mode="wait">
            {/* ══════════════════════
                STEP: CHOICE
            ══════════════════════ */}
            {step === "choice" && (
              <motion.div
                key="choice-step"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-8 sm:mt-12 max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-7 lg:p-10">
                    {/* Heading */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        {
                          delay: 0.1,
                          duration: 0.45,
                          ease,
                        } satisfies Transition
                      }
                      className="text-center mb-7 sm:mb-10"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mariner-500 mb-2">
                        Bagaimana Pengalaman Anda?
                      </p>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
                        Ceritakan kepada kami
                      </h2>
                      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                        Pilih yang sesuai dengan pengalaman Anda
                      </p>
                    </motion.div>

                    {/* Choice Cards — stacked on mobile, side-by-side on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* TIDAK PUAS */}
                      <motion.button
                        type="button"
                        custom={1}
                        variants={choiceCardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap={{ scale: 0.97 }}
                        onHoverStart={() => {
                          setSadHovered(true);
                          setSadParticleKey((k) => k + 1);
                        }}
                        onHoverEnd={() => setSadHovered(false)}
                        onClick={() => setStep("form")}
                        className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4
                          p-6 sm:p-7 lg:p-9 rounded-2xl border-2 border-transparent
                          bg-gradient-to-b from-blue-50 to-mariner-50
                          hover:border-mariner-300 hover:shadow-xl hover:shadow-mariner-100/60
                          transition-all duration-300 cursor-pointer text-center overflow-hidden"
                      >
                        {/* Animated glow */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          initial={{ opacity: 0 }}
                          variants={{
                            hover: {
                              opacity: 1,
                              background:
                                "radial-gradient(ellipse at 50% 40%, rgba(99,130,255,0.12) 0%, transparent 70%)",
                            },
                          }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* Particles */}
                        {sadParticles.map((p, i) => (
                          <FloatingParticle
                            key={`sad-${sadParticleKey}-${i}`}
                            emoji={p}
                            index={i}
                            isVisible={sadHovered}
                          />
                        ))}

                        {/* Emoji with spring animation */}
                        <motion.span
                          className="text-5xl sm:text-6xl lg:text-7xl select-none leading-none relative z-10"
                          variants={emojiIdleVariants}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10,
                          }}
                          style={{
                            display: "inline-block",
                            transformOrigin: "center bottom",
                          }}
                        >
                          😞
                        </motion.span>

                        <div className="space-y-1 relative z-10">
                          <p className="text-base sm:text-lg font-extrabold text-gray-900">
                            Tidak Puas
                          </p>
                          <p className="text-[11px] text-gray-400 leading-snug max-w-[160px] mx-auto">
                            Sampaikan kritik & saran untuk kami perbaiki
                          </p>
                        </div>

                        {/* Badge */}
                        <motion.div
                          className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 relative z-10"
                          variants={{
                            hover: {
                              y: -2,
                              boxShadow: "0 4px 12px rgba(99,130,255,0.15)",
                            },
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <MessageSquare className="w-3 h-3 text-mariner-500" />
                          <span className="text-[10px] font-semibold text-gray-600">
                            Isi Formulir
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                        </motion.div>
                      </motion.button>

                      {/* PUAS */}
                      <motion.button
                        type="button"
                        custom={0}
                        variants={choiceCardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap={{ scale: 0.97 }}
                        onHoverStart={() => {
                          setHappyHovered(true);
                          setHappyParticleKey((k) => k + 1);
                        }}
                        onHoverEnd={() => setHappyHovered(false)}
                        onClick={() => {
                          window.open(GOOGLE_REVIEW_URL, "_blank");
                        }}
                        className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4
                          p-6 sm:p-7 lg:p-9 rounded-2xl border-2 border-transparent
                          bg-gradient-to-b from-yellow-50 to-orange-50
                          hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-100/60
                          transition-all duration-300 cursor-pointer text-center overflow-hidden"
                      >
                        {/* Animated glow */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          initial={{ opacity: 0 }}
                          variants={{
                            hover: {
                              opacity: 1,
                              background:
                                "radial-gradient(ellipse at 50% 40%, rgba(255,200,60,0.18) 0%, transparent 70%)",
                            },
                          }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* Particles */}
                        {particles.map((p, i) => (
                          <FloatingParticle
                            key={`happy-${happyParticleKey}-${i}`}
                            emoji={p}
                            index={i}
                            isVisible={happyHovered}
                          />
                        ))}

                        {/* Emoji */}
                        <motion.span
                          className="text-5xl sm:text-6xl lg:text-7xl select-none leading-none relative z-10"
                          variants={emojiHappyVariants}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10,
                          }}
                          style={{
                            display: "inline-block",
                            transformOrigin: "center bottom",
                          }}
                        >
                          😊
                        </motion.span>

                        <div className="space-y-1 relative z-10">
                          <p className="text-base sm:text-lg font-extrabold text-gray-900">
                            Puas
                          </p>
                          <p className="text-[11px] text-gray-400 leading-snug max-w-[160px] mx-auto">
                            Bagikan pengalaman positif Anda di Google
                          </p>
                        </div>

                        {/* Google badge */}
                        <motion.div
                          className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 relative z-10"
                          variants={{
                            hover: {
                              y: -2,
                              boxShadow: "0 4px 12px rgba(255,180,0,0.18)",
                            },
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          <span className="text-[10px] font-semibold text-gray-600">
                            Tulis Ulasan
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                        </motion.div>
                      </motion.button>
                    </div>

                    {/* Footer note */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.65, duration: 0.5 }}
                      className="text-center text-[11px] text-gray-400 mt-6 sm:mt-7 leading-relaxed"
                    >
                      Masukan Anda membantu kami memberikan pelayanan yang lebih
                      baik
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════
                STEP: FORM
            ══════════════════════ */}
            {step === "form" && (
              <motion.div
                key="form-step"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-8 sm:mt-12 max-w-2xl mx-auto"
              >
                <Animate type="slideup" ready={dataReady} delay={0.05}>
                  <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-7 lg:p-10">
                      {/* Back button */}
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.35, ease }}
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setStep("choice")}
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

                      {/* Loading skeleton */}
                      {loading && (
                        <div className="animate-pulse space-y-6">
                          <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
                          <div className="h-8 w-56 bg-gray-100 rounded mx-auto" />
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="h-12 bg-gray-100 rounded-xl"
                            />
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
                            <Animate
                              type="fielditem"
                              className="text-center mb-8"
                            >
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
                            className="space-y-4 sm:space-y-5"
                          >
                            {/* Anonymous toggle */}
                            <Animate type="fielditem">
                              <label
                                htmlFor="is_anonymus"
                                className="flex items-start sm:items-center gap-3 p-3.5 sm:p-4 bg-mariner-50 rounded-xl cursor-pointer ring-1 ring-mariner-100 hover:ring-mariner-300 transition-all"
                              >
                                <input
                                  type="checkbox"
                                  id="is_anonymus"
                                  name="is_anonymus"
                                  checked={formData.is_anonymus}
                                  onChange={handleInputChange}
                                  disabled={isSubmitting}
                                  className="w-4 h-4 rounded text-mariner-600 focus:ring-mariner-400 shrink-0 mt-0.5 sm:mt-0"
                                />
                                <span className="text-sm font-medium text-gray-700 leading-snug">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                <div className="flex flex-wrap gap-1.5 items-center">
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
                                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`}
                                      />
                                    </button>
                                  ))}
                                  {formData.rating > 0 && (
                                    <span className="ml-1 self-center text-xs sm:text-sm text-gray-400">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default KritikSaran;
