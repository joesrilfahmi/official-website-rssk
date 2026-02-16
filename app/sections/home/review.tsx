"use client";

import Button from "@/components/ui/custom/button";
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

  // Embla Carousel - untuk semua ukuran layar
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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

  // Fetch data dari Supabase
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("kritik_saran")
          .select("id, nama, pesan, rating")
          .gt("rating", 3) // Rating lebih dari 3
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

    // Real-time subscription
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
        () => {
          fetchReviews();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: Review) => {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Quote Icon */}
        <div className="mb-4">
          <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-mariner-500" />
        </div>

        {/* Star Rating */}
        {renderStars(review.rating)}

        {/* Review Text */}
        <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6 grow">
          {review.pesan}
        </p>

        {/* Divider */}
        <div className="w-full h-0.5 bg-greenfresh-500 to-transparent mb-6"></div>

        {/* Reviewer Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-mariner-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
            {review.nama.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <div>
            <h4 className="font-semibold text-mariner-500 text-base sm:text-lg">
              {review.nama}
            </h4>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Title
            badge="ULASAN"
            title="Review Kami"
            align="center"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="-mx-4 px-4">
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] animate-pulse"
                >
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
                    <div className="h-10 w-10 bg-gray-200 rounded mb-4"></div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-0.5 w-full bg-gray-200 rounded mb-6"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
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

        {/* Content - Carousel */}
        {!loading && reviews.length > 0 && (
          <>
            {/* Carousel Container */}
            <div className="-mx-4">
              <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                <div className="flex gap-4 md:gap-6">
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

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                className={
                  !prevBtnEnabled ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                <ChevronLeft className="w-5 h-5" />
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                className={
                  !nextBtnEnabled ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
