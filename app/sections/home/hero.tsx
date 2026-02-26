"use client";
import Badge from "@/components/ui/custom/badge";
import Button from "@/components/ui/custom/button";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import {
  AnimatePresence,
  motion,
  useInView as useFramerInView,
} from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  X,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS — ultra-smooth, film-quality
───────────────────────────────────────── */

const ease = [0.16, 1, 0.3, 1] as const; // spring-like easing
const easeOut = [0.0, 0.0, 0.2, 1] as const;

// Stagger container — orchestrates children in sequence
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// Primary item reveal — natural lift + fade with spring feel
const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease },
  },
};

// Carousel reveal from the right — smooth slide in
const carouselVariants = {
  hidden: { opacity: 0, x: 48, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1.1, ease, delay: 0.3 },
  },
};

/* ─────────────────────────────────────────
   FADE IN WRAPPER — respects load state
───────────────────────────────────────── */
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  variant?: "item" | "carousel";
  ready?: boolean;
}
const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  variant = "item",
  ready = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useFramerInView(ref, { once: true, margin: "-40px" });
  const vars = variant === "carousel" ? carouselVariants : itemVariants;
  const shouldAnimate = inView && ready;

  return (
    <motion.div
      ref={ref}
      variants={vars}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   useCountUp — smooth counter animation
───────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, delay = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setTimeout(() => setStarted(true), delay);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started, delay]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─────────────────────────────────────────
   TRUST INDICATORS
───────────────────────────────────────── */
const TrustIndicators: React.FC = () => {
  const yearsTarget = new Date().getFullYear() - Profile.since;
  const { count: yearsCount, ref: yearsRef } = useCountUp(yearsTarget, 1600);
  const { count: emergencyCount, ref: emergencyRef } = useCountUp(
    24,
    1200,
    200,
  );

  return (
    <div className="flex flex-wrap gap-8 pt-2 justify-center lg:justify-start">
      <div ref={yearsRef} className="text-center lg:text-left">
        <p className="text-white font-extrabold text-2xl leading-none tabular-nums">
          {yearsCount}
          <span className="text-white/55 text-lg">+</span>
        </p>
        <p className="text-white/45 text-[11px] mt-1 tracking-widest uppercase">
          Tahun Pengalaman
        </p>
      </div>
      <div className="w-px bg-white/15 self-stretch hidden sm:block" />
      <div className="text-center lg:text-left">
        <p className="text-white font-extrabold text-2xl leading-none">KARS</p>
        <p className="text-white/45 text-[11px] mt-1 tracking-widest uppercase">
          Akreditasi Paripurna
        </p>
      </div>
      <div className="w-px bg-white/15 self-stretch hidden sm:block" />
      <div ref={emergencyRef} className="text-center lg:text-left">
        <p className="text-white font-extrabold text-2xl leading-none tabular-nums">
          {emergencyCount}
          <span className="text-white/55 text-lg">/7</span>
        </p>
        <p className="text-white/45 text-[11px] mt-1 tracking-widest uppercase">
          Layanan Darurat
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   PROMO INTERFACE
───────────────────────────────────────── */
interface Promo {
  id: string;
  picture: string | null;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

/* ─────────────────────────────────────────
   IMAGE LIGHTBOX — full-screen image viewer
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-110 flex items-center justify-center bg-black/95 backdrop-blur-lg cursor-zoom-out"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.4, ease }}
        className="relative max-w-[90vw] max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          aria-label="Tutup gambar"
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>

        {/* Image */}
        <div className="relative max-w-[88vw] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            className="object-contain max-w-[88vw] max-h-[85vh]"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   PROMO DETAIL DIALOG — with image lightbox support
───────────────────────────────────────── */
const PromoDialog: React.FC<{ promo: Promo; onClose: () => void }> = ({
  promo,
  onClose,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lightboxOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, lightboxOpen]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const formattedDate = new Date(promo.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Lightbox portal */}
      <AnimatePresence>
        {lightboxOpen && promo.picture && (
          <ImageLightbox
            src={promo.picture}
            alt={promo.title}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="fixed inset-0 z-90 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md"
        onClick={handleBackdrop}
      >
        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, y: 72, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 48, scale: 0.97 }}
          transition={{ duration: 0.52, ease }}
          className="relative w-full sm:max-w-xl bg-white sm:rounded-3xl rounded-t-4xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Image header with title overlay ── */}
          <div className="relative w-full h-56 sm:h-64 bg-linear-to-br from-easternblue-500 to-easternblue-700 overflow-hidden">
            {promo.picture ? (
              <>
                <Image
                  src={promo.picture}
                  alt={promo.title}
                  fill
                  className="object-cover"
                />
                {/* Clickable zoom overlay */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, duration: 0.4, ease }}
                  whileHover={{
                    scale: 1.08,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Lihat gambar penuh"
                  className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/35 backdrop-blur-sm border border-white/15 flex items-center justify-center group cursor-zoom-in"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </motion.button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white/15" />
              </div>
            )}

            {/* Scrim */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />

            {/* Badge + title */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55, ease }}
              className="absolute bottom-0 left-0 right-0 px-6 pb-5"
            >
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full mb-2.5">
                <Sparkles className="w-2.5 h-2.5" />
                Promo Spesial
              </span>
              <h2 className="text-white text-xl sm:text-2xl font-bold leading-snug">
                {promo.title}
              </h2>
            </motion.div>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.55)" }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              aria-label="Tutup"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* ── Body ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease }}
            className="px-6 pt-5 pb-6 space-y-4"
          >
            {/* Date */}
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {promo.description}
            </p>

            {/* View image hint */}
            {promo.picture && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLightboxOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-easternblue-600 text-xs font-medium py-2 rounded-xl border border-easternblue-100 bg-easternblue-50/60 hover:bg-easternblue-100/70 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Lihat Gambar Penuh
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

/* ─────────────────────────────────────────
   HERO
───────────────────────────────────────── */
const Hero: React.FC = () => {
  const [promoImages, setPromoImages] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false); // ← triggers carousel animation after load
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Data ── */
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const { data, error } = await supabase
          .from("promo")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setPromoImages(data || []);
      } catch (error) {
        console.error("Error fetching promos:", error);
      } finally {
        setLoading(false);
        // Small delay so skeleton fades before carousel animates in
        setTimeout(() => setDataReady(true), 120);
      }
    };
    fetchPromos();
    const channel = supabase
      .channel("promo_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promo" },
        () => fetchPromos(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Slide logic ── */
  const nextSlide = useCallback(() => {
    if (promoImages.length > 0)
      setCurrentSlide((prev) => (prev + 1) % promoImages.length);
  }, [promoImages.length]);

  const prevSlide = useCallback(() => {
    if (promoImages.length > 0)
      setCurrentSlide(
        (prev) => (prev - 1 + promoImages.length) % promoImages.length,
      );
  }, [promoImages.length]);

  useEffect(() => {
    if (!isHovered && !isDragging && !selectedPromo && promoImages.length > 1) {
      const interval = setInterval(nextSlide, 3500);
      return () => clearInterval(interval);
    }
  }, [isHovered, isDragging, selectedPromo, nextSlide, promoImages.length]);

  /* ── Drag ── */
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    setTranslateX(clientX - startX);
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (translateX > 50) prevSlide();
    else if (translateX < -50) nextSlide();
    setTranslateX(0);
  };

  const handleSlideClick = (promo: Promo) => {
    if (Math.abs(translateX) < 5) setSelectedPromo(promo);
  };

  return (
    <>
      <AnimatePresence>
        {selectedPromo && (
          <PromoDialog
            promo={selectedPromo}
            onClose={() => setSelectedPromo(null)}
          />
        )}
      </AnimatePresence>

      <div
        id="hero"
        className="min-h-screen bg-easternblue-500 relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8"
      >
        {/* Background shapes */}
        <div className="absolute -top-56 -right-56 w-[480px] h-[480px] bg-blue-900/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-easternblue-700/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-20 items-center min-h-[calc(100vh-9rem)]">
            {/* ── LEFT: stagger container — always starts animating on mount ── */}
            <motion.div
              className="w-full lg:w-1/2 space-y-7 text-center lg:text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Badge variant="default">YOUR HEALTH IS OUR PRIORITY</Badge>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
                  RS {Profile.name}
                </h1>
                <h2 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white/75 leading-tight tracking-tight mt-1">
                  {Profile.subtitle}
                </h2>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="h-px w-12 bg-white/60 rounded-full" />
                  <div className="h-px w-5 bg-white/25 rounded-full" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <p className="text-lg text-white/75 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Selamat Datang di Rumah Sakit {Profile.name}{" "}
                  {Profile.subtitle}. Kami memastikan layanan eksekutif yang
                  bermanfaat bagi masyarakat.
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex flex-wrap gap-3 pt-1 justify-center lg:justify-start">
                  <Link href="#pendaftaran">
                    <Button variant="primary" size="lg" className="group gap-2">
                      Buat Janji
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                  <Link href="/sections/kontak">
                    <Button variant="outline" size="lg">
                      Kontak Kami
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <TrustIndicators />
              </motion.div>
            </motion.div>

            {/* ── RIGHT: Carousel — animates only after data is ready ── */}
            <FadeIn
              variant="carousel"
              className="w-full lg:w-1/2 flex items-center justify-center"
              ready={dataReady}
            >
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                  setIsHovered(false);
                  if (isDragging) handleDragEnd();
                }}
                className="relative w-full max-w-[340px] sm:max-w-[375px]"
              >
                {/* Soft glow behind card */}
                <div className="absolute -inset-6 bg-white/8 rounded-[3rem] blur-2xl" />

                {/* Carousel card */}
                <div className="relative rounded-4xl overflow-hidden border border-white/12 shadow-2xl bg-black/10 backdrop-blur-sm">
                  {/* "PROMO TERBARU" top pill */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-easternblue-700 text-[10px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full shadow-lg shadow-black/10">
                      <Sparkles className="w-3 h-3" />
                      Promo Terbaru
                    </div>
                  </div>

                  {/* Slide viewport — portrait 3:4 */}
                  <div
                    ref={containerRef}
                    className="relative aspect-3/4 cursor-pointer select-none bg-easternblue-600/30"
                    onMouseDown={(e) => handleDragStart(e.clientX)}
                    onMouseMove={(e) => handleDragMove(e.clientX)}
                    onMouseUp={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                    onTouchEnd={handleDragEnd}
                  >
                    {/* Skeleton shimmer */}
                    <AnimatePresence>
                      {loading && (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: easeOut }}
                          className="absolute inset-0 bg-linear-to-br from-easternblue-400/20 to-easternblue-700/20"
                        >
                          {/* Shimmer sweep */}
                          <motion.div
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.6,
                              ease: "linear",
                              repeatDelay: 0.3,
                            }}
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-12"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Empty */}
                    <AnimatePresence>
                      {!loading && promoImages.length === 0 && (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                        >
                          <Sparkles className="w-10 h-10 text-white/20" />
                          <p className="text-white/40 text-sm font-medium">
                            Belum ada promo aktif
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Slides — smooth crossfade */}
                    {!loading &&
                      promoImages.length > 0 &&
                      promoImages.map((promo, index) => (
                        <AnimatePresence key={promo.id} initial={false}>
                          {index === currentSlide && (
                            <motion.div
                              key={`slide-${promo.id}`}
                              initial={{ opacity: 0, scale: 1.03 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{
                                duration: 0.75,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              className="absolute inset-0"
                              style={{
                                transform: isDragging
                                  ? `translateX(${translateX}px)`
                                  : undefined,
                                transition: isDragging ? "none" : undefined,
                              }}
                              onClick={() => handleSlideClick(promo)}
                            >
                              {promo.picture ? (
                                <Image
                                  src={promo.picture}
                                  alt={promo.title}
                                  fill
                                  className="object-cover pointer-events-none"
                                  priority={index === 0}
                                  draggable={false}
                                />
                              ) : (
                                <div className="absolute inset-0 bg-linear-to-br from-easternblue-400 to-easternblue-700" />
                              )}

                              {/* Scrim */}
                              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

                              {/* Slide content */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: 0.2,
                                  duration: 0.55,
                                  ease,
                                }}
                                className="absolute bottom-0 left-0 right-0 p-5 pt-12"
                              >
                                <p className="text-white/55 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5">
                                  Promo Spesial
                                </p>
                                <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                                  {promo.title}
                                </h3>
                                <p className="text-white/50 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                                  {promo.description}
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 text-white/50 text-[11px]">
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Tap untuk selengkapnya</span>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ))}
                  </div>

                  {/* Controls */}
                  <AnimatePresence>
                    {!loading && promoImages.length > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className="flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm border-t border-white/8"
                      >
                        {/* Animated dots */}
                        <div className="flex items-center gap-1.5">
                          {promoImages.map((_, idx) => (
                            <motion.button
                              key={idx}
                              onClick={() => setCurrentSlide(idx)}
                              aria-label={`Slide ${idx + 1}`}
                              animate={{
                                width: idx === currentSlide ? 18 : 6,
                                backgroundColor:
                                  idx === currentSlide
                                    ? "rgba(255,255,255,0.9)"
                                    : "rgba(255,255,255,0.3)",
                              }}
                              transition={{
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="h-1.5 rounded-full"
                            />
                          ))}
                        </div>

                        {/* Prev / Next */}
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prevSlide}
                            aria-label="Slide sebelumnya"
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 text-white/80" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={nextSlide}
                            aria-label="Slide berikutnya"
                            className="w-7 h-7 rounded-full bg-white/85 hover:bg-white flex items-center justify-center transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-easternblue-600" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
