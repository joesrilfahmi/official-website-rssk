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

/* ─── Easing constants ─── */
const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

const T = {
  fast: { duration: 0.25, ease } as Transition,
  pop: { duration: 0.5, ease } as Transition,
  slow: { duration: 1.2, ease } as Transition,
  shimmer: {
    repeat: Infinity,
    duration: 1.6,
    ease: "linear",
    repeatDelay: 0.4,
  } as Transition,
} as const;

/* ─── useCountUp ─── */
function useCountUp(
  target: number,
  options: { duration?: number; delay?: number; enabled?: boolean } = {},
) {
  const { duration = 1600, delay = 0, enabled = true } = options;
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled, started, delay]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── Data ─── */
const HIGHLIGHTS = [
  "Fasilitas medis modern dan lengkap",
  "Tenaga kesehatan bersertifikasi nasional",
  "Pelayanan berbasis nilai Islami",
] as const;

/* ─── ImageSkeleton ─── */
const ImageSkeleton = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        key="skeleton"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
      >
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-200" />
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={T.shimmer}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-12"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─── StatCard ─── */
interface StatCardProps {
  icon: React.ElementType;
  staticValue: string;
  label: string;
  counter?: { target: number; delay?: number };
}

const StatCard = ({
  icon: Icon,
  staticValue,
  label,
  counter,
}: StatCardProps) => {
  const { count, ref } = useCountUp(counter?.target ?? 0, {
    delay: counter?.delay,
    enabled: !!counter,
  });

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.03, transition: T.fast }}
      className="flex flex-col items-center text-center bg-white rounded-2xl py-4 px-2 shadow-sm ring-1 ring-gray-100 cursor-default select-none"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...T.pop, delay: 0.1 }}
        className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2"
      >
        <Icon className="w-4 h-4 text-blue-500" aria-hidden />
      </motion.div>

      <span
        ref={counter ? ref : undefined}
        className="text-base font-extrabold text-gray-900 leading-none tabular-nums"
      >
        {counter ? count : staticValue}
      </span>

      <span className="text-[11px] text-gray-500 mt-1 leading-tight">
        {label}
      </span>
    </motion.div>
  );
};

/* ─── About section ─── */
const About = () => {
  const [backLoaded, setBackLoaded] = useState(false);
  const [mainLoaded, setMainLoaded] = useState(false);
  const imagesReady = backLoaded && mainLoaded;

  const yearsServed = new Date().getFullYear() - Profile.since;

  const { count: sinceCount, ref: sinceRef } = useCountUp(Profile.since, {
    duration: 1800,
    delay: 200,
    enabled: imagesReady,
  });

  return (
    <section
      aria-labelledby="about-heading"
      className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* ══ LEFT — image composition ══ */}
          <Animate
            type="slideleft"
            ready={imagesReady}
            margin="-80px"
            className="relative w-full aspect-[4/3.6] max-w-[540px] mx-auto lg:mx-0"
          >
            {/* Tinted base */}
            <div
              className="absolute inset-0 bg-blue-50 rounded-4xl"
              aria-hidden
            />

            {/* Dot-grid accent */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ ...T.slow, delay: 0.5 }}
              aria-hidden
              className="absolute top-4 left-4 w-24 h-24"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Back image */}
            <Animate
              type="popin"
              delay={0.15}
              ready={imagesReady}
              margin="-80px"
              className="absolute top-6 right-6 w-[58%] h-[52%] rounded-2xl overflow-hidden shadow-lg"
            >
              <ImageSkeleton show={!backLoaded} />
              <Image
                src="/gedung-rssk.webp"
                alt="Tampak luar Gedung RS Siti Khodijah"
                fill
                priority
                className={`object-cover transition-opacity duration-500 ${
                  backLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoadingComplete={() => setBackLoaded(true)}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-br from-transparent to-blue-900/15"
              />
            </Animate>

            {/* Main image */}
            <Animate
              type="popin"
              delay={0.3}
              ready={imagesReady}
              margin="-80px"
              className="absolute bottom-6 left-6 w-[65%] h-[62%] rounded-2xl overflow-hidden shadow-2xl z-20 ring-4 ring-white"
            >
              <ImageSkeleton show={!mainLoaded} />
              <Image
                src="/gedung-rssk2.webp"
                alt="Suasana interior RS Siti Khodijah"
                fill
                priority
                className={`object-cover transition-opacity duration-500 ${
                  mainLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoadingComplete={() => setMainLoaded(true)}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent"
              />
            </Animate>

            {/* Floating badge */}
            <Animate
              type="popin"
              delay={0.5}
              ready={imagesReady}
              className="absolute bottom-[28%] right-4 z-30"
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.04, transition: T.fast }}
                className="bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 ring-1 ring-blue-100"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-blue-500" aria-hidden />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Melayani Sejak
                  </p>
                  <p className="text-sm font-bold text-gray-800 tabular-nums">
                    <span ref={sinceRef}>
                      {imagesReady
                        ? sinceCount || Profile.since
                        : Profile.since}
                    </span>
                  </p>
                </div>
              </motion.div>
            </Animate>
          </Animate>

          {/* ══ RIGHT — content column ══ */}
          <Animate
            type="stagger"
            staggerChildren={0.11}
            delayChildren={0.08}
            ready={imagesReady}
            className="flex flex-col justify-center max-w-lg mx-auto lg:mx-0 w-full"
          >
            {/* Heading */}
            <Animate type="fadein">
              <div id="about-heading">
                <Title
                  badge="Profil"
                  title={`RS ${Profile.name} ${Profile.subtitle}`}
                  badgeVariant="default"
                />
              </div>
            </Animate>

            {/* Description */}
            <Animate type="fadein" className="mt-5">
              <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed">
                Rumah Sakit {Profile.name} adalah rumah sakit tipe B dan salah
                satu amal usaha kesehatan Persyarikatan Muhammadiyah di bawah
                naungan Pimpinan Cabang Muhammadiyah Sepanjang, didukung oleh
                fasilitas modern dan sumber daya manusia yang profesional dan
                Islami.
              </p>
            </Animate>

            {/* Divider */}
            <Animate
              type="growx"
              originX={0}
              className="my-6 h-px bg-gray-200"
            />

            {/* Highlight list */}
            <Animate
              type="stagger"
              staggerChildren={0.09}
              className="space-y-2.5"
            >
              <ul className="space-y-2.5 list-none m-0 p-0">
                {HIGHLIGHTS.map((item) => (
                  <Animate key={item} type="slideleftitem">
                    <li className="flex items-center gap-3 text-gray-700 text-sm sm:text-base">
                      <motion.div
                        whileInView={{ scale: [0.6, 1.15, 1] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, ease }}
                      >
                        <CheckCircle2
                          className="w-5 h-5 text-blue-500 shrink-0"
                          aria-hidden
                        />
                      </motion.div>
                      {item}
                    </li>
                  </Animate>
                ))}
              </ul>
            </Animate>

            {/* Divider */}
            <Animate type="fadein" className="my-7 h-px bg-gray-200" />

            {/* Stat cards */}
            <Animate
              type="stagger"
              staggerChildren={0.1}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              <Animate type="slideup">
                <StatCard
                  icon={Heart}
                  staticValue={`${yearsServed}+`}
                  label="Tahun Melayani"
                  counter={{ target: yearsServed }}
                />
              </Animate>
              <Animate type="slideup">
                <StatCard
                  icon={Shield}
                  staticValue="Tipe B"
                  label="Klasifikasi RS"
                />
              </Animate>
              <Animate type="slideup">
                <StatCard
                  icon={Award}
                  staticValue="Islami"
                  label="& Profesional"
                />
              </Animate>
            </Animate>

            {/* CTA */}
            <Animate type="fadein" className="mt-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={T.fast}
                className="inline-block"
              >
                <Link
                  href="/rumah-sakit"
                  aria-label="Selengkapnya tentang RS Siti Khodijah"
                >
                  <Button variant="primary" size="lg" className="group gap-2">
                    Selengkapnya
                    <ArrowRight
                      className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200"
                      aria-hidden
                    />
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
