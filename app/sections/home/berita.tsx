"use client";

import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

export default function BeritaSection() {
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const renderBeritaCard = (berita: Berita, index: number) => (
    <Link
      href={`/sections/blog/detail/${berita.id}`}
      className="block h-full group"
    >
      <div className="h-full flex flex-col">
        {/* Number watermark */}
        <div className="text-7xl sm:text-8xl font-black text-gray-100 leading-none mb-3 select-none">
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Meta: date · category */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-bittersweet-500 text-xs font-semibold">
            {formatDate(berita.created_at)}
          </span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-mariner-500 text-xs font-semibold capitalize bg-mariner-50 px-2 py-0.5 rounded-full">
            {berita.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 line-clamp-2 leading-snug grow">
          {berita.title}
        </h3>

        {/* Thumbnail */}
        <div
          className="relative rounded-2xl overflow-hidden bg-gray-100"
          style={{ minHeight: "180px", aspectRatio: "4/3" }}
        >
          {berita.thumbnail ? (
            <Image
              src={berita.thumbnail}
              alt={berita.title}
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-mariner-900/0 group-hover:bg-mariner-900/20 transition-all duration-300" />
          {/* Arrow badge */}
          <div className="absolute bottom-3 left-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:bg-mariner-500 transition-colors duration-300">
              <ArrowUpRight className="w-4 h-4 text-mariner-500 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-16 w-16 bg-gray-100 rounded mb-3" />
      <div className="h-3.5 w-36 bg-gray-100 rounded mb-3" />
      <div className="h-5 w-full bg-gray-100 rounded mb-1" />
      <div className="h-5 w-4/5 bg-gray-100 rounded mb-4" />
      <div
        className="w-full bg-gray-100 rounded-2xl"
        style={{ aspectRatio: "4/3" }}
      />
    </div>
  );

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ── LEFT: header + CTA ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-6">
            <Title
              badge="INFORMASI"
              badgeVariant="default"
              title="Berita Kesehatan"
              containerClassName=""
            />

            <p className="text-gray-500 text-base leading-relaxed">
              Temukan berbagai informasi yang Anda butuhkan untuk hidup lebih
              sehat.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 bg-mariner-400 rounded-full" />
              <div className="h-0.5 w-4 bg-mariner-200 rounded-full" />
            </div>

            <Link href="/sections/blog">
              <Button variant="primary" size="md" className="group shadow-md">
                Lihat Semua Berita
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {/* Prev / Next controls — shown on desktop alongside left column */}
            {!loading && beritaList.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 pt-4">
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

          {/* ── RIGHT: berita carousel ── */}
          <div className="lg:col-span-8">
            {/* Loading */}
            {loading && (
              <div className="-mx-4 px-4">
                <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_31%] shrink-0"
                    >
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading && beritaList.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Belum Ada Berita
                </h3>
                <p className="text-gray-500">
                  Berita kesehatan belum tersedia saat ini.
                </p>
              </div>
            )}

            {/* Carousel */}
            {!loading && beritaList.length > 0 && (
              <>
                <div className="-mx-4">
                  <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                    <div className="flex gap-5 md:gap-6">
                      {beritaList.map((berita, index) => (
                        <div
                          key={berita.id}
                          className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0"
                        >
                          {renderBeritaCard(berita, index)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile prev/next */}
                <div className="flex lg:hidden items-center gap-2 mt-6">
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
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
