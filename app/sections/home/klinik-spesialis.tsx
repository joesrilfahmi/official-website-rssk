// app/sections/home/klinik-spesialis.tsx
"use client";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { LayananUnggulan as LayananUnggulanType } from "@/types/index";
import useEmblaCarousel from "embla-carousel-react";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const LayananUnggulan = () => {
  const [layananList, setLayananList] = useState<LayananUnggulanType[]>([]);
  const [loading, setLoading] = useState(true);

  // Embla Carousel - untuk tablet dan mobile
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    const fetchLayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("layanan_unggulan")
          .select("*")
          .order("urutan", { ascending: true })
          .limit(6);

        if (error) throw error;

        setLayananList(data || []);
      } catch (error) {
        console.error("Error fetching layanan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayanan();

    // Real-time subscription
    const channel = supabase
      .channel("layanan_unggulan_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layanan_unggulan" },
        () => {
          fetchLayanan();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderLayananCard = (layanan: LayananUnggulanType, index: number) => {
    const IconComponent = Icons[
      layanan.icon as keyof typeof Icons
    ] as React.ElementType;
    const numberString = (index + 1).toString().padStart(2, "0");

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
        {/* Decorative Number Background */}
        <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
          {numberString}
        </div>

        {/* Icon Badge */}
        <div className="inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 self-start">
          {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
        </div>

        {/* Content - Flex grow to push button to bottom */}
        <div className="relative z-10 flex flex-col grow">
          <h3 className="text-xl sm:text-2xl font-bold text-mariner-500 mb-3 sm:mb-4 line-clamp-2 min-h-14">
            {layanan.title}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 line-clamp-3 grow">
            {layanan.description}
          </p>

          {/* Explore Button - Always at bottom */}
          {/* <div className="mt-auto">
                        <Button variant='secondary' size="sm">
                            Explore More
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div> */}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <Title
            title="Klinik Spesialis"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <>
            {/* Desktop: Grid View */}
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg animate-pulse"
                >
                  <div className="h-16 w-16 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            {/* Tablet & Mobile: Carousel View */}
            <div className="lg:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-[0_0_85%] md:flex-[0_0_45%] animate-pulse"
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="h-16 w-16 bg-gray-200 rounded-2xl mb-4"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && layananList.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <Icons.AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Belum Ada Layanan
            </h3>
            <p className="text-gray-500">
              Layanan unggulan belum tersedia saat ini.
            </p>
          </div>
        )}

        {/* Content - Tampil saat ada data */}
        {!loading && layananList.length > 0 && (
          <>
            {/* Desktop: Grid View (lg and up) */}
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
              {layananList.map((layanan, index) => (
                <div key={layanan.id}>{renderLayananCard(layanan, index)}</div>
              ))}
            </div>

            {/* Tablet & Mobile: Carousel View (below lg breakpoint) */}
            <div className="lg:hidden mb-12">
              {/* Carousel Container */}
              <div className="-mx-4">
                <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                  <div className="flex gap-4 md:gap-6">
                    {layananList.map((layanan, index) => (
                      <div
                        key={layanan.id}
                        className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                      >
                        {renderLayananCard(layanan, index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* View All Button - Only show if there might be more services */}
            {layananList.length >= 6 && (
              <div className="text-center mt-12">
                <Link href="/sections/klinik-spesialis">
                  <Button
                    variant="primary"
                    size="lg"
                    className="group shadow-lg"
                  >
                    Selengkapnya
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LayananUnggulan;
