"use client";

import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { Profile } from "@/config/profile";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { ArrowRight, Award, CheckCircle2, Heart, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* easeOut reused locally */
const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

/* ─────────────────────────────────────────
   useCountUp
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
        if (entry.isIntersecting && !started)
          setTimeout(() => setStarted(true), delay);
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
   STAT CARD
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
      whileHover={{
        y: -3,
        scale: 1.03,
        transition: { duration: 0.28, ease } satisfies Transition,
      }}
      className="flex flex-col items-center text-center bg-white rounded-2xl py-4 px-2 shadow-sm ring-1 ring-gray-100 cursor-default"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease, delay: 0.1 } satisfies Transition}
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
        transition={{ duration: 0.5, ease: easeOut } satisfies Transition}
        className="absolute inset-0 rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-200" />
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={
            {
              repeat: Infinity,
              duration: 1.6,
              ease: "linear",
              repeatDelay: 0.4,
            } satisfies Transition
          }
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

  // All animations gated behind both images being loaded
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
          {/* ══ LEFT — image composition ══ */}
          <Animate
            type="slideleft"
            className="relative w-full aspect-[4/3.6] max-w-[540px] mx-auto lg:mx-0"
            ready={imagesReady}
            margin="-80px"
          >
            {/* Background fill */}
            <div className="absolute inset-0 bg-blue-50 rounded-4xl" />

            {/* Dot-grid accent */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.3 }}
              viewport={{ once: true }}
              transition={
                { duration: 1.2, delay: 0.5, ease } satisfies Transition
              }
              className="absolute top-4 left-4 w-24 h-24"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Back image — top-right */}
            <Animate
              type="popin"
              delay={0.15}
              ready={imagesReady}
              margin="-80px"
              className="absolute top-6 right-6 w-[58%] h-[52%] rounded-2xl overflow-hidden shadow-lg"
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
            </Animate>

            {/* Main image — bottom-left */}
            <Animate
              type="popin"
              delay={0.3}
              ready={imagesReady}
              margin="-80px"
              className="absolute bottom-6 left-6 w-[65%] h-[62%] rounded-2xl overflow-hidden shadow-2xl z-20 ring-4 ring-white"
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
            </Animate>

            {/* Floating "Melayani Sejak" badge */}
            <Animate
              type="popin"
              delay={0.5}
              ready={imagesReady}
              className="absolute bottom-[28%] right-4 z-30"
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 ring-1 ring-blue-100"
                whileHover={{
                  y: -2,
                  scale: 1.04,
                  transition: { duration: 0.25, ease } satisfies Transition,
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
            </Animate>
          </Animate>

          {/* ══ RIGHT — stagger content column ══ */}
          <Animate
            type="stagger"
            staggerChildren={0.11}
            delayChildren={0.08}
            ready={imagesReady}
            className="flex flex-col justify-center max-w-lg mx-auto lg:mx-0 w-full"
          >
            {/* Title */}
            <Animate type="fadein">
              <Title
                badge="Profil"
                title={"RS" + " " + Profile.name + " " + Profile.subtitle}
                badgeVariant="default"
              />
            </Animate>

            {/* Description */}
            <Animate type="fadein" className="mt-5">
              <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed">
                Rumah Sakit {Profile.name} adalah rumah sakit tipe B dan
                merupakan salah satu amal usaha kesehatan milik Persyarikatan
                Muhammadiyah dibawah naungan Pimpinan Cabang Muhammadiyah
                Sepanjang yang didukung dengan fasilitas yang modern dan sumber
                daya insani yang profesional dan islami.
              </p>
            </Animate>

            {/* Divider — grows from left */}
            <Animate
              type="growx"
              originX={0}
              className="my-6 h-px bg-gray-200"
            />

            {/* Checklist — stagger items */}
            <Animate
              type="stagger"
              staggerChildren={0.09}
              className="space-y-2.5"
            >
              {highlights.map((item) => (
                <Animate key={item} type="slideleftitem">
                  <div className="flex items-center gap-3 text-gray-700 text-sm sm:text-base">
                    <motion.div
                      whileInView={{ scale: [0.6, 1.15, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, ease } satisfies Transition}
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    </motion.div>
                    {item}
                  </div>
                </Animate>
              ))}
            </Animate>

            {/* Divider */}
            <Animate type="fadein" className="my-7 h-px bg-gray-200" />

            {/* Stats row — stagger cards */}
            <Animate
              type="stagger"
              staggerChildren={0.1}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              <Animate type="slideup">
                <StatCard
                  icon={Heart}
                  value={yearsTarget}
                  label="Tahun Melayani"
                  useCounter
                  counterTarget={yearsTarget}
                />
              </Animate>
              <Animate type="slideup">
                <StatCard
                  icon={Shield}
                  value="Tipe B"
                  label="Akreditasi RS"
                  counterDelay={100}
                />
              </Animate>
              <Animate type="slideup">
                <StatCard
                  icon={Award}
                  value="Islami"
                  label="& Profesional"
                  counterDelay={200}
                />
              </Animate>
            </Animate>

            {/* CTA */}
            <Animate type="fadein" className="mt-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 } satisfies Transition}
                className="inline-block"
              >
                <Link href="/sections/rumah-sakit">
                  <Button variant="primary" size="lg" className="group gap-2">
                    Selengkapnya
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </motion.div>
            </Animate>
          </Animate>
        </div>
      </div>
    </section>
  );
};

export default About;
