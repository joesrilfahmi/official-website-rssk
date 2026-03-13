"use client";

import Animate, { ease } from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import Title from "@/components/ui/custom/title";
import { Profile } from "@/config/profile";
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
   PARTICLE DATA
───────────────────────────────────────── */
const happyParticleEmojis = ["🎉", "⭐", "✨", "🎊", "💛", "🌟", "🎈", "💥"];
const sadParticleEmojis = ["💧", "😢", "💧", "🥺", "💔", "😓"];

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
   RATING LABELS
───────────────────────────────────────── */
const ratingLabels = ["", "Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

/* ─────────────────────────────────────────
   WA.ME HELPER
   Membangun pesan & membuka tab WhatsApp
   langsung dari browser — tanpa API route.
───────────────────────────────────────── */
interface NotificationPayload {
  nama: string;
  no_hp: string;
  unit_pelayanan: string;
  pesan: string;
  rating: number;
  is_anonymus: boolean;
}

const openWhatsApp = ({
  nama, no_hp, unit_pelayanan, pesan, rating, is_anonymus,
}: NotificationPayload) => {
  const pengirim = is_anonymus ? "Anonim" : `${nama} (${no_hp})`;
  const ratingText =
    rating > 0 ? `${rating}/5 - ${ratingLabels[rating]}` : "Tidak diisi";

  const message = [
    `*Kritik & Saran Baru*`,
    ``,
    `*Pengirim:* ${pengirim}`,
    `*Unit Pelayanan:* ${unit_pelayanan}`,
    `*Rating:* ${ratingText}`,
    ``,
    `*Pesan:*`,
    pesan,
  ].join("\n");

  // Normalisasi nomor: hilangkan non-digit, ganti awalan 0 → 62
  const rawNumber = Profile.whatsapp.replace(/\D/g, "");
  const formattedNumber = rawNumber.startsWith("0")
    ? `62${rawNumber.slice(1)}`
    : rawNumber;

  window.open(
    `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
};

/* ─────────────────────────────────────────
   TELEGRAM NOTIFICATION (tetap via API route)
───────────────────────────────────────── */
const sendTelegramNotification = async (payload: NotificationPayload) => {
  try {
    await fetch("/api/notify-telegram-kritik-saran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
};

/* ─────────────────────────────────────────
   CANVAS CONFETTI COMPONENT
───────────────────────────────────────── */
const ConfettiCanvas = ({ active }: { active: boolean }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);
  const activeRef = React.useRef(active);
  activeRef.current = active;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    type Piece = {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rot: number; rotV: number;
      shape: "rect" | "circle"; life: number; maxLife: number;
    };

    const COLORS = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF922B","#CC5DE8","#F06595","#74C0FC"];
    let pieces: Piece[] = [];

    const spawn = () => {
      for (let i = 0; i < 32; i++) {
        const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
        const speed = 1.8 + Math.random() * 3.5;
        pieces.push({
          x: W * 0.5 + (Math.random() - 0.5) * 40, y: H * 0.35,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 4 + Math.random() * 7, rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.25,
          shape: Math.random() > 0.4 ? "rect" : "circle",
          life: 0, maxLife: 55 + Math.floor(Math.random() * 35),
        });
      }
    };

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      if (activeRef.current && frame % 22 === 0) spawn();
      frame++;
      pieces = pieces.filter((p) => p.life < p.maxLife);
      for (const p of pieces) {
        p.life++; p.x += p.vx; p.y += p.vy;
        p.vy += 0.09; p.vx *= 0.99; p.rot += p.rotV;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (active) spawn();
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); ctx.clearRect(0, 0, W, H); };
  }, [active]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20 rounded-2xl" />
  );
};

/* ─────────────────────────────────────────
   TEARDROP PARTICLE COMPONENT
───────────────────────────────────────── */
const SadParticle = ({
  emoji, index, particleKey, isVisible,
}: {
  emoji: string; index: number; particleKey: number; isVisible: boolean;
}) => {
  const spreadX = (index - (sadParticleEmojis.length - 1) / 2) * 22;
  const dropY = 60 + (index % 2) * 24;
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.span
          key={`sp-${particleKey}-${index}`}
          initial={{ opacity: 0, scale: 0.5, x: spreadX * 0.2, y: -6 }}
          animate={{ opacity: [0, 0.95, 0.8, 0], scale: [0.5, 1.1, 0.95, 0.6], x: [spreadX * 0.2, spreadX * 0.6, spreadX * 0.85, spreadX], y: [-6, dropY * 0.3, dropY * 0.65, dropY] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, delay: index * 0.1, ease: [0.3, 0, 0.5, 1] }}
          className="absolute text-sm pointer-events-none select-none z-20"
          style={{ left: "50%", top: "42%", marginLeft: -10, marginTop: -10 }}
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
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [choiceReady, setChoiceReady] = useState(false);

  const [sadHovered, setSadHovered] = useState(false);
  const [happyHovered, setHappyHovered] = useState(false);
  const [sadParticleKey, setSadParticleKey] = useState(0);
  const [happyParticleKey, setHappyParticleKey] = useState(0);

  const [formData, setFormData] = useState({
    nama: "", no_hp: "", unit_pelayanan_id: "",
    pesan: "", rating: 0, is_anonymus: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_pelayanan" }, () => fetchUnitPelayanan())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
    if (!formData.unit_pelayanan_id) newErrors.unit_pelayanan_id = "Unit pelayanan wajib dipilih";
    if (!formData.pesan.trim()) newErrors.pesan = "Pesan wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  /* ─────────────────────────────────────────
     HANDLE CONFIRM
     1. Insert ke Supabase
     2. Kirim notifikasi Telegram (fire-and-forget, via API route)
     3. Buka WhatsApp via wa.me langsung dari browser (tanpa API)
  ───────────────────────────────────────── */
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

      const unitLabel =
        unitPelayananList.find((u) => u.id === formData.unit_pelayanan_id)?.title ?? "-";

      const snapshot: NotificationPayload = {
        nama: formData.nama.trim(),
        no_hp: formData.no_hp.trim(),
        unit_pelayanan: unitLabel,
        pesan: formData.pesan.trim(),
        rating: formData.rating,
        is_anonymus: formData.is_anonymus,
      };

      // Reset form
      setFormData({ nama: "", no_hp: "", unit_pelayanan_id: "", pesan: "", rating: 0, is_anonymus: false });

      // 1. Kirim Telegram (fire-and-forget via server)
      sendTelegramNotification(snapshot);

      // 2. Buka WhatsApp langsung via wa.me (tanpa API route, tanpa token)
      openWhatsApp(snapshot);

      setTimeout(() => setShowSuccessDialog(true), 320);
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim kritik & saran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUnitLabel =
    unitPelayananList.find((u) => u.id === formData.unit_pelayanan_id)?.title ?? "-";

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
            initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 z-9998 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              key="confirm-dialog"
              variants={dialogVariants}
              initial="hidden" animate="visible" exit="exit"
              className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease } satisfies Transition}
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
                  whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.05)" }}
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
                variants={dialogRowVariants} initial="hidden" animate="visible"
                className="px-5 sm:px-6 pb-4 space-y-3"
              >
                {!formData.is_anonymus ? (
                  <motion.div variants={dialogItemVariants}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <User2 className="w-3 h-3" /> Identitas Pengirim
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5">
                      {[["Nama", formData.nama], ["No HP", formData.no_hp]].map(([label, val], i) => (
                        <React.Fragment key={label}>
                          {i > 0 && <div className="h-px bg-gray-100" />}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-500 shrink-0">{label}</span>
                            <span className="text-xs font-semibold text-gray-900 text-right truncate">{val}</span>
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
                        Dikirim sebagai <span className="font-semibold text-gray-700">Anonim</span>
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
                      <span className="text-xs text-gray-500 shrink-0">Unit Pelayanan</span>
                      <span className="text-xs font-semibold text-gray-900 text-right truncate">{selectedUnitLabel}</span>
                    </div>
                    {formData.rating > 0 && (
                      <>
                        <div className="h-px bg-gray-100" />
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-gray-500 shrink-0">Rating</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                            {"★".repeat(formData.rating)} {ratingLabels[formData.rating]}
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
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">{formData.pesan}</p>
                  </div>
                </motion.div>

                {/* Info wa.me */}
                <motion.div variants={dialogItemVariants}
                  className="flex items-start gap-2.5 bg-green-50 rounded-xl px-3.5 py-3 ring-1 ring-green-100"
                >
                  <svg className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <p className="text-[10px] text-green-700 leading-relaxed">
                    WhatsApp akan terbuka dengan pesan yang sudah terisi —{" "}
                    tekan <span className="font-bold">Kirim</span> untuk menyelesaikan.
                  </p>
                </motion.div>

                <motion.p variants={dialogItemVariants} className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Pastikan data sudah benar sebelum mengirim.
                </motion.p>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4, ease } satisfies Transition}
                className="px-5 sm:px-6 pb-5 flex gap-2.5"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 } satisfies Transition}
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-3.5 sm:py-4 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Periksa Lagi
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 } satisfies Transition}
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-2 px-5 py-3.5 sm:py-4 rounded-full bg-mariner-500 hover:bg-mariner-600 text-white text-xs font-bold shadow-md shadow-mariner-500/20 flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    "Mengirim..."
                  ) : (
                    <>Ya, Kirim Sekarang <ArrowRight className="w-3.5 h-3.5" /></>
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
            initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuccessDialog(false)}
          >
            <motion.div
              key="success-dialog"
              variants={successVariants}
              initial="hidden" animate="visible" exit="exit"
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.06)" }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowSuccessDialog(false)}
                aria-label="Tutup"
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </motion.button>

              <div className="px-6 sm:px-8 pt-8 pb-8 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.6, ease } satisfies Transition}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-greenfresh-50 ring-8 ring-greenfresh-100 flex items-center justify-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.28, duration: 0.45, ease } satisfies Transition}
                    >
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-greenfresh-500" />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0, x: 10, y: -10 }} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.48, duration: 0.4, ease } satisfies Transition}
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-bittersweet-50 ring-2 ring-white flex items-center justify-center"
                  >
                    <Heart className="w-3.5 h-3.5 text-bittersweet-400 fill-bittersweet-400" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.5, ease } satisfies Transition}
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
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.42, duration: 0.5, ease } satisfies Transition}
                  className="w-full h-px bg-gray-100 mb-6"
                  style={{ originX: 0.5 }}
                />

                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.58, duration: 0.4, ease } satisfies Transition}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowSuccessDialog(false); setStep("choice"); }}
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
            {step === "choice" && (
              <motion.div
                key="choice-step"
                variants={pageVariants} initial="hidden" animate="visible" exit="exit"
                className="mt-8 sm:mt-12 max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-7 lg:p-10">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.45, ease } satisfies Transition}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* ── TIDAK PUAS ── */}
                      <motion.button
                        type="button" custom={1} variants={choiceCardVariants} initial="hidden" animate="visible"
                        whileTap={{ scale: 0.97 }}
                        onHoverStart={() => { setSadHovered(true); setSadParticleKey((k) => k + 1); }}
                        onHoverEnd={() => setSadHovered(false)}
                        onClick={() => setStep("form")}
                        className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-6 sm:p-7 lg:p-9 rounded-2xl border-2 cursor-pointer text-center overflow-hidden transition-colors duration-500"
                        style={{ background: "linear-gradient(to bottom, #f8fafc, #eff6ff)" }}
                      >
                        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none border-2"
                          animate={sadHovered ? { borderColor: "rgba(100,116,139,0.5)", boxShadow: "0 16px 40px rgba(100,116,139,0.18)" } : { borderColor: "rgba(0,0,0,0)", boxShadow: "0 0px 0px rgba(0,0,0,0)" }}
                          transition={{ duration: 0.45 }} />
                        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                          animate={sadHovered ? { opacity: 1, background: "linear-gradient(160deg, rgba(71,85,105,0.07) 0%, rgba(51,65,85,0.12) 100%)" } : { opacity: 0, background: "linear-gradient(160deg, rgba(71,85,105,0) 0%, rgba(51,65,85,0) 100%)" }}
                          transition={{ duration: 0.5 }} />
                        {sadParticleEmojis.map((p, i) => (
                          <SadParticle key={`sad-${sadParticleKey}-${i}`} emoji={p} index={i} particleKey={sadParticleKey} isVisible={sadHovered} />
                        ))}
                        <motion.span className="select-none leading-none relative z-10"
                          animate={sadHovered ? { y: 10, scale: 0.9, rotate: [0, -3, 2, -2, 1, 0], filter: "grayscale(0.6) brightness(0.85)" } : { y: 0, scale: 1, rotate: 0, filter: "grayscale(0) brightness(1)" }}
                          transition={sadHovered ? { duration: 1.0, ease: [0.25, 0.1, 0.25, 1] } : { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                          style={{ fontSize: "clamp(2.8rem,8vw,4.5rem)", display: "inline-block" }}>😞</motion.span>
                        <div className="space-y-1 relative z-10">
                          <motion.p className="text-base sm:text-lg font-extrabold"
                            animate={sadHovered ? { color: "#64748b", filter: "grayscale(1)" } : { color: "#111827", filter: "grayscale(0)" }}
                            transition={{ duration: 0.45 }}>Tidak Puas</motion.p>
                          <motion.p className="text-[11px] leading-snug max-w-40 mx-auto"
                            animate={sadHovered ? { color: "#94a3b8" } : { color: "#9ca3af" }}
                            transition={{ duration: 0.45 }}>Sampaikan kritik & saran untuk kami perbaiki</motion.p>
                        </div>
                        <motion.div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border relative z-10"
                          animate={sadHovered ? { y: 4, scale: 0.96, borderColor: "rgba(148,163,184,0.5)", boxShadow: "0 1px 3px rgba(100,116,139,0.10)", filter: "grayscale(1)", opacity: 0.75 } : { y: 0, scale: 1, borderColor: "rgba(243,244,246,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", filter: "grayscale(0)", opacity: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}>
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-semibold text-gray-600">Isi Formulir</span>
                          <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                        </motion.div>
                      </motion.button>

                      {/* ── PUAS ── */}
                      <motion.button
                        type="button" custom={0} variants={choiceCardVariants} initial="hidden" animate="visible"
                        whileTap={{ scale: 0.97 }}
                        onHoverStart={() => { setHappyHovered(true); setHappyParticleKey((k) => k + 1); }}
                        onHoverEnd={() => setHappyHovered(false)}
                        onClick={() => window.open(GOOGLE_REVIEW_URL, "_blank")}
                        className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-6 sm:p-7 lg:p-9 rounded-2xl border-2 cursor-pointer text-center overflow-hidden"
                        style={{ background: "linear-gradient(to bottom, #fefce8, #fff7ed)" }}
                      >
                        <ConfettiCanvas active={happyHovered} />
                        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none border-2"
                          animate={happyHovered ? { borderColor: "rgba(251,191,36,0.7)", boxShadow: "0 0 0 4px rgba(251,191,36,0.12), 0 20px 50px rgba(251,146,60,0.25)" } : { borderColor: "rgba(0,0,0,0)", boxShadow: "0 0px 0px rgba(0,0,0,0)" }}
                          transition={{ duration: 0.35 }} />
                        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                          animate={happyHovered ? { opacity: [0, 0.55, 0], x: ["-100%", "100%"] } : { opacity: 0, x: "-100%" }}
                          transition={happyHovered ? { duration: 0.7, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 } : { duration: 0.2 }}
                          style={{ background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)" }} />
                        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                          animate={happyHovered ? { opacity: 1, background: "radial-gradient(ellipse at 50% 25%, rgba(255,210,50,0.35) 0%, rgba(255,160,30,0.12) 55%, transparent 80%)" } : { opacity: 0, background: "radial-gradient(ellipse at 50% 25%, rgba(255,210,50,0) 0%, transparent 80%)" }}
                          transition={{ duration: 0.4 }} />
                        <motion.span className="select-none leading-none relative z-10"
                          animate={happyHovered ? { y: [-2, -26, -18, -24, -20, -22], scale: [1, 1.45, 1.2, 1.38, 1.28, 1.32], rotate: [0, -20, 22, -14, 18, -10], filter: "brightness(1.15) saturate(1.3)" } : { y: 0, scale: 1, rotate: 0, filter: "brightness(1) saturate(1)" }}
                          transition={happyHovered ? { duration: 0.7, ease: "easeInOut", times: [0, 0.18, 0.35, 0.52, 0.72, 1] } : { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                          style={{ fontSize: "clamp(2.8rem,8vw,4.5rem)", display: "inline-block", transformOrigin: "center bottom" }}>😊</motion.span>
                        <AnimatePresence>
                          {happyHovered && happyParticleEmojis.map((emoji, i) => {
                            const angle = (-130 + (i / (happyParticleEmojis.length - 1)) * 100) * (Math.PI / 180);
                            const r = 52 + (i % 3) * 16;
                            return (
                              <motion.span key={`ep-${happyParticleKey}-${i}`}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.5, 1.2, 0.4], x: [0, Math.cos(angle) * r * 0.5, Math.cos(angle) * r], y: [0, Math.sin(angle) * r * 0.5, Math.sin(angle) * r + 10], rotate: [0, i % 2 === 0 ? 30 : -30] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.9, delay: i * 0.055, ease: [0.2, 0, 0.3, 1] }}
                                className="absolute text-base pointer-events-none select-none z-20"
                                style={{ left: "50%", top: "38%", marginLeft: -12, marginTop: -12 }}>{emoji}</motion.span>
                            );
                          })}
                        </AnimatePresence>
                        <div className="space-y-1 relative z-10">
                          <motion.p className="text-base sm:text-lg font-extrabold"
                            animate={happyHovered ? { color: "#b45309", scale: 1.04 } : { color: "#111827", scale: 1 }}
                            transition={{ duration: 0.3 }}>Puas</motion.p>
                          <motion.p className="text-[11px] leading-snug max-w-40 mx-auto"
                            animate={happyHovered ? { color: "#d97706" } : { color: "#9ca3af" }}
                            transition={{ duration: 0.3 }}>Bagikan pengalaman positif Anda di Google</motion.p>
                        </div>
                        <motion.div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 relative z-10"
                          animate={happyHovered ? { y: -6, scale: 1.08, boxShadow: "0 8px 20px rgba(251,191,36,0.3)", borderColor: "rgba(251,191,36,0.4)" } : { y: 0, scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderColor: "rgba(243,244,246,1)" }}
                          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          <span className="text-[10px] font-semibold text-gray-600">Tulis Ulasan</span>
                          <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                        </motion.div>
                      </motion.button>
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.65, duration: 0.5 }}
                      className="text-center text-[11px] text-gray-400 mt-6 sm:mt-7 leading-relaxed"
                    >
                      Masukan Anda membantu kami memberikan pelayanan yang lebih baik
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "form" && (
              <motion.div
                key="form-step"
                variants={pageVariants} initial="hidden" animate="visible" exit="exit"
                className="mt-8 sm:mt-12 max-w-2xl mx-auto"
              >
                <Animate type="slideup" ready={dataReady} delay={0.05}>
                  <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-7 lg:p-10">
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.35, ease }}
                        whileHover={{ x: -2 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setStep("choice")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-6 group"
                      >
                        <svg className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Kembali
                      </motion.button>

                      {loading && (
                        <div className="animate-pulse space-y-6">
                          <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
                          <div className="h-8 w-56 bg-gray-100 rounded mx-auto" />
                          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                          <div className="h-28 bg-gray-100 rounded-xl" />
                          <div className="h-12 bg-gray-100 rounded-xl" />
                        </div>
                      )}

                      {!loading && (
                        <>
                          <Animate type="stagger" staggerChildren={0.08} delayChildren={0.1} ready={dataReady} className="space-y-0">
                            <Animate type="fielditem" className="text-center mb-8">
                              <Title badge="Formulir" title="Formulir Kritik & Saran" badgeVariant="default" align="center" />
                            </Animate>
                          </Animate>

                          <Animate type="stagger" staggerChildren={0.08} delayChildren={0.15} ready={dataReady} className="space-y-4 sm:space-y-5">
                            <Animate type="fielditem">
                              <label htmlFor="is_anonymus" className="flex items-start sm:items-center gap-3 p-3.5 sm:p-4 bg-mariner-50 rounded-xl cursor-pointer ring-1 ring-mariner-100 hover:ring-mariner-300 transition-all">
                                <input type="checkbox" id="is_anonymus" name="is_anonymus" checked={formData.is_anonymus} onChange={handleInputChange} disabled={isSubmitting} className="w-4 h-4 rounded text-mariner-600 focus:ring-mariner-400 shrink-0 mt-0.5 sm:mt-0" />
                                <span className="text-sm font-medium text-gray-700 leading-snug">
                                  Kirim sebagai anonim{" "}
                                  <span className="text-gray-400 font-normal">(nama & nomor HP tidak diperlukan)</span>
                                </span>
                              </label>
                            </Animate>

                            {!formData.is_anonymus && (
                              <Animate type="fielditem">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <Input label="Nama Lengkap" name="nama" placeholder="Masukkan nama lengkap" value={formData.nama} onChange={handleInputChange} error={errors.nama} required disabled={isSubmitting} />
                                  <Input label="No HP" name="no_hp" type="tel" placeholder="08123456789" value={formData.no_hp} onChange={handleInputChange} error={errors.no_hp} required disabled={isSubmitting} />
                                </div>
                              </Animate>
                            )}

                            <Animate type="fielditem">
                              <Select label="Unit Pelayanan" placeholder="Pilih Unit Pelayanan" value={formData.unit_pelayanan_id} onChange={(value) => handleSelectChange("unit_pelayanan_id", value)} options={unitPelayananList.map((u) => ({ value: u.id, label: u.title }))} error={errors.unit_pelayanan_id} required disabled={isSubmitting} searchable />
                            </Animate>

                            <Animate type="fielditem">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Rating Kepuasan{" "}
                                  <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" disabled={isSubmitting} onClick={() => setFormData((p) => ({ ...p, rating: p.rating === star ? 0 : star }))} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                                      <Star className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`} />
                                    </button>
                                  ))}
                                  {formData.rating > 0 && (
                                    <span className="ml-1 self-center text-xs sm:text-sm text-gray-400">{ratingLabels[formData.rating]}</span>
                                  )}
                                </div>
                              </div>
                            </Animate>

                            <Animate type="fielditem">
                              <Textarea label="Kritik & Saran" name="pesan" placeholder="Tuliskan kritik dan saran Anda di sini..." value={formData.pesan} onChange={handleInputChange} error={errors.pesan} required rows={5} disabled={isSubmitting} />
                            </Animate>

                            <Animate type="fielditem">
                              <Button variant="primary" size="lg" className="w-full justify-center bg-mariner-500 hover:bg-mariner-600" onClick={handleSubmitClick} disabled={isSubmitting}>
                                {isSubmitting ? "Mengirim..." : (<>Kirim Kritik & Saran <ArrowRight className="w-5 h-5" /></>)}
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