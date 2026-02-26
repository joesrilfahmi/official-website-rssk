// app/sections/home/kamar-inap.tsx
"use client";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Bed, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const KamarInap = () => {
  const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const sortedKamarList = useMemo(() => {
    if (kamarList.length === 0) return [];
    const recommended = kamarList.filter((k) => k.is_recommended);
    const notRecommended = kamarList.filter((k) => !k.is_recommended);
    if (recommended.length > 0) {
      if (notRecommended.length === 0) return recommended;
      if (notRecommended.length === 1)
        return [notRecommended[0], ...recommended];
      return [notRecommended[0], ...recommended, ...notRecommended.slice(1)];
    }
    return kamarList;
  }, [kamarList]);

  useEffect(() => {
    const fetchKamar = async () => {
      try {
        const { data, error } = await supabase
          .from("kamar_inap")
          .select("*")
          .limit(3);
        if (error) throw error;
        setKamarList(data || []);
      } catch (error) {
        console.error("Error fetching kamar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKamar();

    const channel = supabase
      .channel("kamar_inap_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kamar_inap" },
        () => fetchKamar(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("IDR", "Rp");

  const renderKamarCard = (kamar: KamarInapType) => (
    <div
      className={`relative bg-white rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-300
            ${
              kamar.is_recommended
                ? "ring-2 ring-greenfresh-500 shadow-xl shadow-greenfresh-100"
                : "ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1"
            }`}
    >
      {/* Recommended top accent */}
      {kamar.is_recommended && (
        <div className="h-1 w-full bg-linear-to-r from-greenfresh-400 to-greenfresh-600" />
      )}

      {/* Recommended badge */}
      {kamar.is_recommended && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-greenfresh-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Disarankan
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8 flex flex-col grow">
        {/* Room Name */}
        <h3
          className={`text-xl sm:text-2xl font-extrabold mb-1 line-clamp-1 ${kamar.is_recommended ? "text-greenfresh-600" : "text-mariner-500"}`}
        >
          {kamar.title}
        </h3>

        {/* Recommended sub-label */}
        <div className="min-h-5 mb-3">
          {kamar.is_recommended && (
            <p className="text-greenfresh-500 text-xs font-semibold tracking-wide uppercase">
              Pilihan Terbaik
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-6">
          {kamar.description}
        </p>

        {/* Price */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-widest">
            Harga / malam
          </p>
          <p
            className={`text-3xl sm:text-4xl font-extrabold ${kamar.is_recommended ? "text-greenfresh-600" : "text-mariner-500"}`}
          >
            {formatPrice(kamar.price)}
          </p>
        </div>

        {/* Facilities */}
        <div className="grow">
          <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
            <span
              className={`inline-block w-1 h-4 rounded-full ${kamar.is_recommended ? "bg-greenfresh-500" : "bg-mariner-400"}`}
            />
            Fasilitas
          </h4>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-modern">
            {kamar.facilities?.map((facility: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${kamar.is_recommended ? "text-greenfresh-500" : "text-mariner-400"}`}
                />
                <span className="text-gray-600 text-sm">{facility}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-6 sm:p-8 animate-pulse">
      <div className="h-7 w-40 bg-gray-100 rounded mb-3" />
      <div className="h-4 w-full bg-gray-100 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-100 rounded mb-6" />
      <div className="h-10 w-44 bg-gray-100 rounded mb-6" />
      <div className="space-y-3">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="h-4 w-full bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Title
            badge="Kamar Inap"
            title="Kamar Inap"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </div>

        {/* Loading */}
        {loading && (
          <>
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="lg:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-[0_0_85%] md:flex-[0_0_45%]">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty */}
        {!loading && kamarList.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <Bed className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Kamar
            </h3>
            <p className="text-gray-500">
              Informasi kamar inap belum tersedia saat ini.
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && sortedKamarList.length > 0 && (
          <>
            {/* Desktop grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12 items-start">
              {sortedKamarList.slice(0, 3).map((kamar) => (
                <div key={kamar.id}>{renderKamarCard(kamar)}</div>
              ))}
            </div>

            {/* Mobile / Tablet carousel */}
            <div className="lg:hidden mb-12">
              <div className="-mx-4">
                <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                  <div className="flex gap-4 md:gap-6">
                    {sortedKamarList.slice(0, 3).map((kamar) => (
                      <div
                        key={kamar.id}
                        className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                      >
                        {renderKamarCard(kamar)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link href="/sections/home/kamar-inap/informasi">
                <Button variant="primary" size="lg" className="group shadow-lg">
                  Selengkapnya
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default KamarInap;
