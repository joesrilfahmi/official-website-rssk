"use client";

import Animate, { ease, easeOut } from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CachedImage from "@/components/ui/custom/cached-image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface Berita {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string | null;
  status: string;
  created_at: string;
}

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-16 w-16 bg-gray-100 rounded mb-3" />
    <div className="h-3.5 w-36 bg-gray-100 rounded mb-3" />
    <div className="h-5 w-full bg-gray-100 rounded mb-1" />
    <div className="h-5 w-4/5 bg-gray-100 rounded mb-4" />
    {/* Skeleton image menggunakan aspect ratio yang sama: 16/10 */}
    <div className="w-full bg-gray-100 rounded-xl aspect-4/3 sm:aspect-video lg:aspect-16/10" />
  </div>
);

/* ─────────────────────────────────────────
   ANIMASI
───────────────────────────────────────── */
const cardWrapVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease } satisfies Transition,
  },
};

const INNER_DELAY = 0.35;

/* ─────────────────────────────────────────
   BERITA CARD
───────────────────────────────────────── */
interface BeritaCardProps {
  berita: Berita;
  index: number;
}

const BeritaCard: React.FC<BeritaCardProps> = ({ berita, index }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <motion.div variants={cardWrapVariants} className="h-full">
      <Link href={`/blog/detail/${berita.id}`} className="block h-full group">
        <div className="h-full flex flex-col">
          {/* Number watermark */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: 0.5,
                  ease,
                  delay: INNER_DELAY,
                } satisfies Transition,
              },
            }}
            className="text-4xl sm:text-5xl lg:text-8xl font-black text-gray-100 leading-none mb-1 sm:mb-2 select-none"
          >
            {String(index + 1).padStart(2, "0")}
          </motion.div>

          {/* Meta: date + category */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.38,
                  ease,
                  delay: INNER_DELAY + 0.06,
                } satisfies Transition,
              },
            }}
            className="flex flex-wrap items-center gap-1.5 mb-2 sm:mb-3"
          >
            <span className="text-bittersweet-500 text-xs font-semibold">
              {formatDate(berita.created_at)}
            </span>
            <span className="text-gray-300 text-xs">•</span>
            <span className="text-mariner-500 text-xs font-semibold capitalize bg-mariner-50 px-2 py-0.5 rounded-full">
              {berita.category}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h3
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.4,
                  ease,
                  delay: INNER_DELAY + 0.13,
                } satisfies Transition,
              },
            }}
            className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 mb-2 sm:mb-3 line-clamp-2 leading-snug grow"
          >
            {berita.title}
          </motion.h3>

          {/* ─────────────────────────────────────────
              THUMBNAIL IMAGE — perbaikan utama
              • Hapus minHeight hardcoded (tidak responsif)
              • Ganti aspectRatio dari "4/3" → "16/10"
                16/10 lebih lebar & proporsional untuk
                thumbnail berita di semua ukuran layar.
              • w-full memastikan gambar selalu mengisi
                lebar kolom carousel sepenuhnya.
          ───────────────────────────────────────── */}
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.97 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 0.5,
                  ease,
                  delay: INNER_DELAY + 0.2,
                } satisfies Transition,
              },
            }}
            className="relative w-full rounded-xl overflow-hidden bg-gray-100 aspect-4/3 sm:aspect-video lg:aspect-16/10"
          >
            {berita.thumbnail ? (
              <CachedImage
                src={berita.thumbnail}
                alt={berita.title}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
                bucket={""}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-mariner-900/0 group-hover:bg-mariner-900/20 transition-all duration-300" />
            <div className="absolute bottom-3 left-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:bg-mariner-500 transition-colors duration-300">
                <ArrowUpRight className="w-4 h-4 text-mariner-500 group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function BeritaSection() {
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const { data, error } = await supabase
          .from("berita")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setBeritaList(data || []);
      } catch (error) {
        console.error("Error fetching berita:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 120);
      }
    };

    fetchBerita();

    const channel = supabase
      .channel("berita_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "berita" },
        () => fetchBerita(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ── LEFT: header + CTA ── */}
          <Animate
            type="stagger"
            staggerChildren={0.11}
            delayChildren={0.08}
            ready={dataReady}
            margin="-60px"
            className="lg:col-span-4 lg:sticky lg:top-10 space-y-6"
          >
            <Animate type="fadein">
              <Title
                badge="INFORMASI"
                badgeVariant="default"
                title="Berita Kesehatan"
                containerClassName=""
              />
            </Animate>

            <Animate type="fadein">
              <p className="text-gray-500 text-base leading-relaxed">
                Temukan berbagai informasi yang Anda butuhkan untuk hidup lebih
                sehat.
              </p>
            </Animate>

            <Animate
              type="growx"
              originX={0}
              className="flex items-center gap-3"
            >
              <div className="h-0.5 w-8 bg-mariner-400 rounded-full" />
              <div className="h-0.5 w-4 bg-mariner-200 rounded-full" />
            </Animate>

            <Animate type="fadein">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 } satisfies Transition}
                className="inline-block"
              >
                <Link href="/blog">
                  <Button
                    variant="primary"
                    size="lg"
                    className="group shadow-md"
                  >
                    Lihat Semua Berita
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </Animate>

            {/* Prev / Next controls — desktop */}
            <AnimatePresence>
              {!loading && beritaList.length > 0 && dataReady && (
                <Animate
                  type="fadein"
                  className="hidden lg:flex items-center gap-2 pt-4"
                >
                  <button
                    onClick={scrollPrev}
                    disabled={!prevBtnEnabled}
                    aria-label="Sebelumnya"
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200
                      ${
                        prevBtnEnabled
                          ? "border-mariner-400 text-mariner-500 hover:bg-mariner-50"
                          : "border-gray-200 text-gray-300 cursor-not-allowed"
                      }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={scrollNext}
                    disabled={!nextBtnEnabled}
                    aria-label="Berikutnya"
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200
                      ${
                        nextBtnEnabled
                          ? "border-mariner-400 text-mariner-500 hover:bg-mariner-50"
                          : "border-gray-200 text-gray-300 cursor-not-allowed"
                      }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Animate>
              )}
            </AnimatePresence>
          </Animate>

          {/* ── RIGHT: berita carousel ── */}
          <div className="lg:col-span-8">
            {/* Loading skeletons */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={
                    { duration: 0.45, ease: easeOut } satisfies Transition
                  }
                  className="-mx-4 px-4"
                >
                  <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-[0_0_48%] sm:flex-[0_0_44%] md:flex-[0_0_40%] lg:flex-[0_0_31%] shrink-0"
                      >
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!loading && beritaList.length === 0 && (
              <Animate
                type="slideup"
                ready={dataReady}
                className="text-center py-12"
              >
                <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Belum Ada Berita
                </h3>
                <p className="text-gray-500">
                  Berita kesehatan belum tersedia saat ini.
                </p>
              </Animate>
            )}

            {/* Carousel */}
            {!loading && beritaList.length > 0 && (
              <>
                <Animate
                  type="stagger"
                  staggerChildren={0.14}
                  delayChildren={0.06}
                  ready={dataReady}
                  margin="-40px"
                  className="-mx-4"
                >
                  <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                    <div className="flex gap-5 md:gap-6">
                      {beritaList.map((berita, index) => (
                        <div
                          key={berita.id}
                          className="flex-[0_0_48%] sm:flex-[0_0_44%] md:flex-[0_0_40%] lg:flex-[0_0_31%] min-w-0"
                        >
                          <BeritaCard berita={berita} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Animate>

                {/* Mobile prev/next */}
                <AnimatePresence>
                  {dataReady && (
                    <Animate
                      type="fadein"
                      className="flex lg:hidden items-center gap-2 mt-6"
                    >
                      <button
                        onClick={scrollPrev}
                        disabled={!prevBtnEnabled}
                        aria-label="Sebelumnya"
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200
                          ${
                            prevBtnEnabled
                              ? "border-mariner-400 text-mariner-500 hover:bg-mariner-50"
                              : "border-gray-200 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={scrollNext}
                        disabled={!nextBtnEnabled}
                        aria-label="Berikutnya"
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200
                          ${
                            nextBtnEnabled
                              ? "border-mariner-400 text-mariner-500 hover:bg-mariner-50"
                              : "border-gray-200 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </Animate>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
