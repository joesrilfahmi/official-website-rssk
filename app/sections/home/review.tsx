"use client";

import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Review {
  id: string;
  nama: string;
  pesan: string;
  rating: number;
}

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderReviewCard = (review: Review) => (
    <div className="group relative bg-white rounded-2xl p-6 sm:p-8 ring-1 ring-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden">
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-mariner-400 to-mariner-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

      {/* Quote + Stars row */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-xl bg-mariner-50 flex items-center justify-center">
          <Quote className="w-5 h-5 text-mariner-500" />
        </div>
        {renderStars(review.rating)}
      </div>

      {/* Review text */}
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed grow mb-6">
        &quot;{review.pesan}&quot;
      </p>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-5" />

      {/* Reviewer */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-mariner-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {review.nama.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-sm leading-none">
            {review.nama}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Pasien RS</p>
        </div>
      </div>
    </div>
  );

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

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header — title left, nav right */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <Title
            badge="ULASAN"
            title="Review Kami"
            badgeVariant="default"
            containerClassName="items-start"
          />

          {/* Nav controls in header — desktop */}
          {!loading && reviews.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="-mx-4 px-4">
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
          </div>
        )}

        {/* Empty */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <Quote className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Review
            </h3>
            <p className="text-gray-500">
              Review dari pasien belum tersedia saat ini.
            </p>
          </div>
        )}

        {/* Carousel */}
        {!loading && reviews.length > 0 && (
          <>
            <div className="-mx-4">
              <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                <div className="flex gap-5 md:gap-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                    >
                      {renderReviewCard(review)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile nav */}
            <div className="flex sm:hidden items-center gap-2 mt-6">
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
                      : "border-gray-200 text-gray-300 cursor-not-akan"
                  }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
