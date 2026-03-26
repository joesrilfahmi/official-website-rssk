"use client";

import Animate, { ease, easeOut } from "@/components/animations/animate";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface Review {
  id: string;
  nama: string;
  pesan: string;
  rating: number;
}

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 sm:p-8 ring-1 ring-gray-100 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-5">
      <div className="w-10 h-10 bg-gray-100 rounded-xl" />
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
    <div className="space-y-2 mb-6">
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-2/3 bg-gray-100 rounded" />
    </div>
    <div className="h-px bg-gray-100 mb-5" />
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-full" />
      <div className="h-4 w-28 bg-gray-100 rounded" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   ANIMASI BARU:
   cardWrapVariants — card fade satu per satu via stagger parent
   Konten di dalam card muncul berurutan setelah card visible
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

const INNER_DELAY = 0.32;

/* ─────────────────────────────────────────
   REVIEW CARD
───────────────────────────────────────── */
interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      variants={cardWrapVariants}
      whileHover={{
        y: -3,
        scale: 1.02,
        transition: { duration: 0.28, ease } satisfies Transition,
      }}
      className="bg-white rounded-2xl p-6 sm:p-8 ring-1 ring-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full flex flex-col cursor-default"
    >
      {/* Header: icon + stars — muncul setelah card */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.38,
              ease,
              delay: INNER_DELAY,
            } satisfies Transition,
          },
        }}
        className="flex items-start justify-between mb-5"
      >
        <div className="w-10 h-10 rounded-xl bg-mariner-50 flex items-center justify-center">
          <Quote className="w-5 h-5 text-mariner-500" />
        </div>
        {renderStars(review.rating)}
      </motion.div>

      {/* Review text */}
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.4,
              ease,
              delay: INNER_DELAY + 0.1,
            } satisfies Transition,
          },
        }}
        className="text-gray-600 text-sm sm:text-base leading-relaxed grow mb-6"
      >
        &quot;{review.pesan}&quot;
      </motion.p>

      <div className="h-px bg-gray-100 mb-5" />

      {/* Reviewer identity */}
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -10 },
          visible: {
            opacity: 1,
            x: 0,
            transition: {
              duration: 0.38,
              ease,
              delay: INNER_DELAY + 0.18,
            } satisfies Transition,
          },
        }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-mariner-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {review.nama.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-sm leading-none">
            {review.nama}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Pasien RS</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   NAV BUTTON
───────────────────────────────────────── */
interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
  direction: "prev" | "next";
}

const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  disabled,
  label,
  direction,
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    whileHover={!disabled ? { scale: 1.08 } : {}}
    whileTap={!disabled ? { scale: 0.92 } : {}}
    transition={{ duration: 0.2 } satisfies Transition}
    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200
      ${
        disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed"
          : "border-mariner-400 text-mariner-500 hover:bg-mariner-50"
      }`}
  >
    {direction === "prev" ? (
      <ChevronLeft className="w-5 h-5" />
    ) : (
      <ChevronRight className="w-5 h-5" />
    )}
  </motion.button>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
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
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("kritik_saran")
          .select("id, nama, pesan, rating")
          .gt("rating", 3)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 120);
      }
    };

    fetchReviews();

    const channel = supabase
      .channel("kritik_saran_reviews")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kritik_saran",
          filter: "rating=gt.3",
        },
        () => fetchReviews(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── Header row ── */}
        <Animate
          type="stagger"
          staggerChildren={0.11}
          delayChildren={0.08}
          ready={dataReady}
          margin="-60px"
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <Animate type="fadein">
            <Title
              badge="ULASAN"
              title="Review Kami"
              badgeVariant="default"
              containerClassName="items-start"
            />
          </Animate>

          <AnimatePresence>
            {!loading && reviews.length > 0 && dataReady && (
              <Animate
                type="fadein"
                className="hidden sm:flex items-center gap-2 shrink-0"
              >
                <NavButton
                  onClick={scrollPrev}
                  disabled={!prevBtnEnabled}
                  label="Sebelumnya"
                  direction="prev"
                />
                <NavButton
                  onClick={scrollNext}
                  disabled={!nextBtnEnabled}
                  label="Berikutnya"
                  direction="next"
                />
              </Animate>
            )}
          </AnimatePresence>
        </Animate>

        {/* ── Loading skeletons ── */}
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
                    className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] shrink-0"
                  >
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {!loading && reviews.length === 0 && (
          <Animate
            type="slideup"
            ready={dataReady}
            className="text-center py-12"
          >
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <Quote className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Review
            </h3>
            <p className="text-gray-500">
              Review dari pasien belum tersedia saat ini.
            </p>
          </Animate>
        )}

        {/* ── Carousel ── */}
        {!loading && reviews.length > 0 && (
          <>
            {/*
             * Stagger container — ReviewCard menggunakan cardWrapVariants
             * Card muncul satu per satu, konten di dalam muncul setelah card (INNER_DELAY)
             */}
            <Animate
              type="stagger"
              staggerChildren={0.15}
              delayChildren={0.06}
              ready={dataReady}
              margin="-40px"
              className="-mx-4"
            >
              <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                <div className="flex gap-5 md:gap-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                    >
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </div>
            </Animate>

            {/* Mobile nav */}
            <AnimatePresence>
              {dataReady && (
                <Animate
                  type="fadein"
                  className="flex sm:hidden items-center gap-2 mt-6"
                >
                  <NavButton
                    onClick={scrollPrev}
                    disabled={!prevBtnEnabled}
                    label="Sebelumnya"
                    direction="prev"
                  />
                  <NavButton
                    onClick={scrollNext}
                    disabled={!nextBtnEnabled}
                    label="Berikutnya"
                    direction="next"
                  />
                </Animate>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}
