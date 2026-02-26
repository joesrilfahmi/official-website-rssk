"use client";
import Badge from "@/components/ui/custom/badge";
import Button from "@/components/ui/custom/button";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Promo {
  id: string;
  picture: string | null;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const Hero: React.FC = () => {
  const [promoImages, setPromoImages] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!isHovered && !isDragging && promoImages.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered, isDragging, nextSlide, promoImages.length]);

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

  return (
    <div
      id="hero"
      className="min-h-screen bg-easternblue-500 relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Subtle background shapes */}
      <div className="absolute -top-56 -right-56 w-[480px] h-[480px] bg-blue-900/60 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-easternblue-700/40 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-20 items-center min-h-[calc(100vh-9rem)]">
          {/* ── LEFT: Copy ── */}
          <div className="w-full lg:w-1/2 space-y-7 text-center lg:text-left">
            <Badge variant="default">YOUR HEALTH IS OUR PRIORITY</Badge>

            <div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
                RS {Profile.name}
              </h1>
              <h2 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white/80 leading-tight tracking-tight mt-1">
                {Profile.subtitle}
              </h2>
            </div>

            {/* Thin accent divider */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="h-0.5 w-10 bg-white rounded-full" />
              <div className="h-0.5 w-4 bg-white/40 rounded-full" />
            </div>

            <p className="text-lg text-white/80 leading-relaxed max-w-md mx-auto lg:mx-0">
              Selamat Datang di Rumah Sakit {Profile.name} {Profile.subtitle}.
              Kami memastikan layanan eksekutif yang bermanfaat bagi masyarakat.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
              <Link href="#pendaftaran">
                <Button variant="primary" size="lg" className="group">
                  Buat Janji
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/sections/kontak">
                <Button variant="outline" size="lg">
                  Kontak Kami
                </Button>
              </Link>
            </div>

            {/* Quick trust indicators */}
            <div className="flex flex-wrap gap-6 pt-2 justify-center lg:justify-start">
              {[
                {
                  num: `${new Date().getFullYear() - Profile.since}`,
                  label: "Tahun Pengalaman",
                },
                { num: "KARS", label: "Akreditasi Paripurna" },
                { num: "24/7", label: "Layanan Darurat" },
              ].map(({ num, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="text-white font-extrabold text-xl leading-none">
                    {num}
                  </p>
                  <p className="text-white/55 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Carousel ── */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              if (isDragging) handleDragEnd();
            }}
          >
            {/* Outer glow ring */}
            <div className="relative w-full max-w-[360px] sm:max-w-[400px]">
              <div className="absolute -inset-3 bg-white/10 rounded-[2.25rem] blur-xl" />

              {/* White frame */}
              <div className="relative bg-white p-2.5 rounded-4xl shadow-2xl">
                {/* Carousel viewport — portrait 3:4 */}
                <div
                  ref={containerRef}
                  className="relative rounded-[1.6rem] overflow-hidden aspect-3/4 cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onMouseMove={(e) => handleDragMove(e.clientX)}
                  onMouseUp={handleDragEnd}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                  onTouchEnd={handleDragEnd}
                >
                  {/* Loading */}
                  {loading && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                  )}

                  {/* Empty */}
                  {!loading && promoImages.length === 0 && (
                    <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <p className="text-gray-400 text-sm font-medium">
                        Belum ada promo aktif
                      </p>
                    </div>
                  )}

                  {/* Slides */}
                  {!loading &&
                    promoImages.length > 0 &&
                    promoImages.map((promo, index) => (
                      <div
                        key={promo.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          index === currentSlide
                            ? "opacity-100 translate-x-0"
                            : index < currentSlide
                              ? "opacity-0 -translate-x-full"
                              : "opacity-0 translate-x-full"
                        }`}
                        style={{
                          transform:
                            isDragging && index === currentSlide
                              ? `translateX(${translateX}px)`
                              : undefined,
                          transition: isDragging ? "none" : undefined,
                        }}
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
                          <div className="absolute inset-0 bg-linear-to-br from-easternblue-400 to-easternblue-600" />
                        )}

                        {/* Bottom overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-5 pt-10 pb-5">
                          <span className="text-white/70 text-[11px] font-bold uppercase tracking-widest">
                            Promo Spesial
                          </span>
                          <h3 className="text-white font-bold text-lg leading-snug mt-0.5">
                            {promo.title}
                          </h3>
                          <p className="text-white/65 text-sm mt-1 line-clamp-2">
                            {promo.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Bottom controls row */}
                {!loading && promoImages.length > 1 && (
                  <div className="flex items-center justify-between px-2 pt-3 pb-1">
                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                      {promoImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          aria-label={`Slide ${idx + 1}`}
                          className={`rounded-full transition-all duration-300 ${
                            idx === currentSlide
                              ? "bg-easternblue-500 w-6 h-2"
                              : "bg-gray-300 w-2 h-2 hover:bg-easternblue-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevSlide}
                        aria-label="Slide sebelumnya"
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-easternblue-50 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={nextSlide}
                        aria-label="Slide berikutnya"
                        className="w-8 h-8 rounded-full bg-easternblue-500 hover:bg-easternblue-600 flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* "PROMO TERBARU" top badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 bg-white/20 backdrop-blur-md px-5 py-1.5 rounded-full border border-white/30 shadow-lg">
                <span className="text-white text-xs font-bold tracking-widest uppercase">
                  Promo Terbaru
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
