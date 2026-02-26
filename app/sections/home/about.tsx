"use client";

import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { Profile } from "@/config/profile";
import {
  AnimatePresence,
  motion,
  useInView as useFramerInView,
  type Transition,
} from "framer-motion";
import { ArrowRight, Award, CheckCircle2, Heart, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS — ultra-smooth, film-quality
   Identical easing philosophy to Hero
───────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const; // spring-like, natural
const easeOut = [0.0, 0.0, 0.2, 1] as const;

// Stagger container
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

// Text/content items — lift + fade + unblur
const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease },
  },
};

// Image composition — slide from left
const imageVariants = {
  hidden: { opacity: 0, x: -44, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1.05, ease },
  },
};

// Individual floating cards
const floatingCardVariants = {
  hidden: { opacity: 0, scale: 0.86, y: 12 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.65, ease, delay },
  }),
};

// Highlight list items — staggered cascade
const listContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -16, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease },
  },
};

// Stat cards — staggered pop-in
const statsContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease },
  },
};

/* ─────────────────────────────────────────
   FadeIn WRAPPER — respects ready state
───────────────────────────────────────── */
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  variant?: "item" | "image";
  ready?: boolean;
  delay?: number;
}
const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  variant = "item",
  ready = true,
  delay,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useFramerInView(ref, { once: true, margin: "-60px" });
  const baseVars = variant === "image" ? imageVariants : itemVariants;

  // Inject optional delay override
  const baseTransition: Transition =
    "transition" in baseVars.visible
      ? (baseVars.visible.transition as Transition)
      : {};
  const vars =
    delay != null
      ? {
          ...baseVars,
          visible: {
            ...baseVars.visible,
            transition: { ...baseTransition, delay },
          },
        }
      : baseVars;

  return (
    <motion.div
      ref={ref}
      variants={vars}
      initial="hidden"
      animate={inView && ready ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   useCountUp — smooth cubic ease-out
───────────────────────────────────────── */
function useCountUp(target: number, duration = 1600, delay = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setTimeout(() => setStarted(true), delay);
        }
      },
      { threshold: 0.5 },
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const highlights = [
  "Fasilitas medis modern & lengkap",
  "Tenaga kesehatan bersertifikasi",
  "Pelayanan berbasis nilai Islami",
];

/* ─────────────────────────────────────────
   ANIMATED STAT CARD
───────────────────────────────────────── */
interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  useCounter?: boolean;
  counterTarget?: number;
  counterDelay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  useCounter = false,
  counterTarget,
  counterDelay = 0,
}) => {
  const { count, ref: countRef } = useCountUp(
    counterTarget ?? 0,
    1600,
    counterDelay,
  );

  return (
    <motion.div
      variants={statCardVariants}
      whileHover={{ y: -3, scale: 1.03, transition: { duration: 0.28, ease } }}
      className="flex flex-col items-center text-center bg-white rounded-2xl py-4 px-2 shadow-sm ring-1 ring-gray-100 cursor-default"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2"
      >
        <Icon className="w-4 h-4 text-blue-500" />
      </motion.div>
      <span
        ref={useCounter ? countRef : undefined}
        className="text-base font-extrabold text-gray-900 leading-none tabular-nums"
      >
        {useCounter ? count : value}
      </span>
      <span className="text-[11px] text-gray-500 mt-1 leading-tight">
        {label}
      </span>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   IMAGE SKELETON
───────────────────────────────────────── */
const ImageSkeleton: React.FC<{ show: boolean }> = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        key="skeleton"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="absolute inset-0 rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-200" />
        {/* shimmer sweep */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: "linear",
            repeatDelay: 0.4,
          }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-12"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────
   ABOUT
───────────────────────────────────────── */
const About = () => {
  const [backImageLoaded, setBackImageLoaded] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  // Both images must be loaded before animations start
  const imagesReady = backImageLoaded && mainImageLoaded;

  const sinceTarget = Profile.since;
  const { count: sinceCount, ref: sinceRef } = useCountUp(
    sinceTarget,
    1800,
    200,
  );
  const yearsTarget = new Date().getFullYear() - Profile.since;

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* ══ LEFT — image composition (waits for images) ══ */}
          <FadeIn
            variant="image"
            className="relative w-full aspect-[4/3.6] max-w-[540px] mx-auto lg:mx-0"
            ready={imagesReady}
          >
            {/* Background fill */}
            <div className="absolute inset-0 bg-blue-50 rounded-4xl" />

            {/* Dot-grid accent */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5, ease }}
              className="absolute top-4 left-4 w-24 h-24"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Back image — top-right */}
            <motion.div
              className="absolute top-6 right-6 w-[58%] h-[52%] rounded-2xl overflow-hidden shadow-lg"
              custom={0.15}
              variants={floatingCardVariants}
              initial="hidden"
              animate={imagesReady ? "visible" : "hidden"}
              whileInView={imagesReady ? "visible" : undefined}
              viewport={{ once: true, margin: "-80px" }}
            >
              <ImageSkeleton show={!backImageLoaded} />
              <Image
                src="/gedung-rssk.webp"
                alt="Gedung RS Siti Khodijah"
                fill
                className={`object-cover transition-opacity duration-600 ${backImageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                onLoadingComplete={() => setBackImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-linear-to-br from-transparent to-blue-900/15" />
            </motion.div>

            {/* Main image — bottom-left */}
            <motion.div
              className="absolute bottom-6 left-6 w-[65%] h-[62%] rounded-2xl overflow-hidden shadow-2xl z-20 ring-4 ring-white"
              custom={0.3}
              variants={floatingCardVariants}
              initial="hidden"
              animate={imagesReady ? "visible" : "hidden"}
              whileInView={imagesReady ? "visible" : undefined}
              viewport={{ once: true, margin: "-80px" }}
            >
              <ImageSkeleton show={!mainImageLoaded} />
              <Image
                src="/gedung-rssk2.webp"
                alt="Interior RS Siti Khodijah"
                fill
                className={`object-cover transition-opacity duration-600 ${mainImageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                onLoadingComplete={() => setMainImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
            </motion.div>

            {/* Floating "Melayani Sejak" badge — animates after both images load */}
            <motion.div
              className="absolute bottom-[28%] right-4 z-30 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 ring-1 ring-blue-100"
              custom={0.5}
              variants={floatingCardVariants}
              initial="hidden"
              animate={imagesReady ? "visible" : "hidden"}
              whileHover={{
                y: -2,
                scale: 1.04,
                transition: { duration: 0.25, ease },
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-blue-500" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-gray-400 font-medium">
                  Melayani Sejak
                </p>
                <p className="text-sm font-bold text-gray-800 tabular-nums">
                  <span ref={sinceRef}>{sinceCount || Profile.since}</span>
                </p>
              </div>
            </motion.div>
          </FadeIn>

          {/* ══ RIGHT — content stagger (waits for images too) ══ */}
          <motion.div
            className="flex flex-col justify-center max-w-lg mx-auto lg:mx-0 w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView={imagesReady ? "visible" : "hidden"}
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Title */}
            <motion.div variants={itemVariants}>
              <Title
                badge="Profil"
                title={"RS" + " " + Profile.name + " " + Profile.subtitle}
                badgeVariant="default"
              />
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-gray-600 text-base sm:text-[17px] leading-relaxed mt-5"
            >
              Rumah Sakit {Profile.name} adalah rumah sakit tipe B dan merupakan
              salah satu amal usaha kesehatan milik Persyarikatan Muhammadiyah
              dibawah naungan Pimpinan Cabang Muhammadiyah Sepanjang yang
              didukung dengan fasilitas yang modern dan sumber daya insani yang
              profesional dan islami.
            </motion.p>

            {/* Divider — animated grow */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scaleX: 0 },
                visible: {
                  opacity: 1,
                  scaleX: 1,
                  transition: { duration: 0.7, ease },
                },
              }}
              style={{ originX: 0 }}
              className="my-6 h-px bg-gray-200"
            />

            {/* Highlight checklist — each item staggered */}
            <motion.ul variants={listContainerVariants} className="space-y-2.5">
              {highlights.map((item) => (
                <motion.li
                  key={item}
                  variants={listItemVariants}
                  className="flex items-center gap-3 text-gray-700 text-sm sm:text-base"
                >
                  <motion.div
                    whileInView={{ scale: [0.6, 1.15, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, ease }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  </motion.div>
                  {item}
                </motion.li>
              ))}
            </motion.ul>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="my-7 h-px bg-gray-200"
            />

            {/* Stats row — staggered pop-in */}
            <motion.div
              variants={statsContainerVariants}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              <StatCard
                icon={Heart}
                value={yearsTarget}
                label="Tahun Melayani"
                useCounter
                counterTarget={yearsTarget}
                counterDelay={0}
              />
              <StatCard
                icon={Shield}
                value="Tipe B"
                label="Akreditasi RS"
                counterDelay={100}
              />
              <StatCard
                icon={Award}
                value="Islami"
                label="& Profesional"
                counterDelay={200}
              />
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants} className="mt-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                <Link href="/sections/rumah-sakit">
                  <Button variant="primary" size="lg" className="group gap-2">
                    Selengkapnya
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
