// app/sections/home/klinik-spesialis.tsx
"use client";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Poli {
  id: string;
  nama_poli: string;
  icon: string;
  description: string;
  status: string;
  urutan: number;
  created_at: string;
  updated_at: string;
}

const LayananUnggulan = () => {
  const [layananList, setLayananList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);

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
          .from("poli")
          .select("*")
          .eq("status", "active")
          .order("urutan", { ascending: true })
          .limit(6);
        if (error) throw error;
        setLayananList(data || []);
      } catch (error) {
        console.error("Error fetching poli:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayanan();

    const channel = supabase
      .channel("poli_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poli" },
        () => fetchLayanan(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderLayananCard = (layanan: Poli, index: number) => {
    const IconComponent = Icons[
      layanan.icon as keyof typeof Icons
    ] as React.ElementType;
    const numberString = (index + 1).toString().padStart(2, "0");

    return (
      <div className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden">
        {/* Subtle top accent bar on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-bittersweet-400 to-bittersweet-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

        {/* Decorative Number — top right, same as original */}
        <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
          {numberString}
        </div>

        {/* Icon Badge */}
        <div className="relative z-10 inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 self-start group-hover:bg-bittersweet-100 group-hover:scale-110 transition-all duration-300">
          {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
        </div>

        {/* Text */}
        <div className="relative z-10 flex flex-col grow">
          <h3 className="text-xl sm:text-2xl font-bold text-mariner-500 mb-3 sm:mb-4 line-clamp-2 min-h-14">
            {layanan.nama_poli}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 grow">
            {layanan.description}
          </p>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 animate-pulse">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-6" />
      <div className="h-6 w-3/4 bg-gray-100 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>
    </div>
  );

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Title
            badge="Layanan"
            title="Klinik Spesialis"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </div>

        {/* Loading */}
        {loading && (
          <>
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="lg:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-[0_0_85%] md:flex-[0_0_45%] animate-pulse"
                  >
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty */}
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

        {/* Content */}
        {!loading && layananList.length > 0 && (
          <>
            {/* Desktop grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
              {layananList.map((layanan, index) => (
                <div key={layanan.id}>{renderLayananCard(layanan, index)}</div>
              ))}
            </div>

            {/* Mobile / Tablet carousel */}
            <div className="lg:hidden mb-12">
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

            {/* View All Button — center bottom, same as original */}
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
    </section>
  );
};

export default LayananUnggulan;
