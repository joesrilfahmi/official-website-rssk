// app/sections/home/kamar-inap/informasi/page.tsx
"use client";
import Banner from "@/components/ui/custom/banner";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import { Bed } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const InformasiKamarInap = () => {
  const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort kamar: recommended di tengah
  const sortedKamarList = useMemo(() => {
    if (kamarList.length === 0) return [];

    const recommended = kamarList.filter((k) => k.is_recommended);
    const notRecommended = kamarList.filter((k) => !k.is_recommended);

    // Jika ada recommended, taruh di tengah
    if (recommended.length > 0) {
      if (notRecommended.length === 0) {
        return recommended;
      } else if (notRecommended.length === 1) {
        return [notRecommended[0], ...recommended];
      } else {
        // Taruh recommended di tengah
        return [notRecommended[0], ...recommended, ...notRecommended.slice(1)];
      }
    }

    return kamarList;
  }, [kamarList]);

  useEffect(() => {
    const fetchKamar = async () => {
      try {
        const { data, error } = await supabase.from("kamar_inap").select("*");

        if (error) throw error;

        setKamarList(data || []);
      } catch (error) {
        console.error("Error fetching kamar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKamar();

    // Real-time subscription
    const channel = supabase
      .channel("kamar_inap_informasi")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kamar_inap" },
        () => {
          fetchKamar();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("IDR", "Rp");
  };

  const renderKamarCard = (kamar: KamarInapType) => (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
        {/* Left Content Section */}
        <div className="flex-1">
          {/* Room Name with Badge */}
          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <h3 className="text-2xl lg:text-3xl font-bold text-mariner-600">
              {kamar.title}
            </h3>
            {kamar.is_recommended && (
              <div className="bg-greenfresh-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Disarankan
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-6 lg:mb-8">
            {kamar.description}
          </p>

          {/* Facilities Section */}
          <div className="mb-6">
            <h4 className="text-gray-800 font-semibold text-base mb-4">
              Fasilitas Kamar :
            </h4>

            {/* Facilities List */}
            <div className="space-y-1.5">
              {kamar.facilities &&
                kamar.facilities.map((facility: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                    <span className="text-gray-600 text-sm leading-relaxed">
                      {facility}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Image & Price Section */}
        <div className="w-full lg:w-[420px] bg-gray-50 rounded-2xl p-6 lg:p-8 flex flex-col">
          {/* Image Container */}
          <div className="w-full h-56 lg:h-72 mb-6 rounded-2xl overflow-hidden bg-gray-200 relative">
            {kamar.image ? (
              <Image
                src={kamar.image}
                alt={kamar.title}
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority={kamar.is_recommended}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bed className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <p className="text-gray-600 text-sm mb-2">Harga Mulai dari:</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl lg:text-5xl font-bold text-mariner-600">
                {formatPrice(kamar.price).replace(/\s/g, "")}
              </span>
              <span className="text-lg font-medium text-mariner-600 mb-1">
                /Hari
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Banner Section */}
        <Banner
          title="Kamar Inap"
          subtitle="Pilihan kamar yang nyaman dan fasilitas lengkap untuk kesembuhan Anda"
        />

        {/* Content Section */}
        <div className="py-16">
          {/* Header Section */}
          <div className="text-center mb-12 lg:mb-16">
            <Title
              badge="RUANG PERAWATAN"
              title="Informasi Kamar Inap"
              badgeVariant="default"
              align="center"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-8 lg:space-y-12">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
                    <div className="flex-1">
                      <div className="h-8 w-48 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-6"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                      <div className="space-y-2">
                        {[...Array(6)].map((_, j) => (
                          <div
                            key={j}
                            className="h-4 w-full bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full lg:w-[380px] bg-gray-50 rounded-2xl p-6 lg:p-8">
                      <div className="w-full h-56 lg:h-72 bg-gray-200 rounded-2xl mb-6"></div>
                      <div className="h-12 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && kamarList.length === 0 && (
            <div className="text-center py-16">
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

          {/* Content List - Display all data */}
          {!loading && sortedKamarList.length > 0 && (
            <div className="space-y-8 lg:space-y-12">
              {sortedKamarList.map((kamar) => (
                <div key={kamar.id}>{renderKamarCard(kamar)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformasiKamarInap;
