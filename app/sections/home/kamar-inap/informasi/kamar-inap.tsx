// app/sections/home/kamar-inap/informasi/page.tsx
"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import { ArrowLeft, Bed } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const InformasiKamarInap = () => {
  const router = useRouter();
  const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const fetchKamar = async () => {
      try {
        const { data, error } = await supabase
          .from("kamar_inap")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        setKamarList(data || []);
      } catch (error) {
        console.error("Error fetching kamar:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 80);
      }
    };

    fetchKamar();

    const channel = supabase
      .channel("kamar_inap_informasi")
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
      <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
        {/* Left Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <h3 className="text-2xl lg:text-3xl font-bold text-mariner-600">
              {kamar.title}
            </h3>
            {kamar.is_recommended && (
              <div className="bg-greenfresh-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recommended
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-6 lg:mb-8">
            {kamar.description}
          </p>

          <div className="mb-6">
            <h4 className="text-gray-800 font-semibold text-base mb-4">
              Fasilitas Kamar :
            </h4>
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

        {/* Right Image & Price */}
        <div className="w-full lg:w-[420px] bg-gray-50 rounded-2xl p-6 lg:p-8 flex flex-col">
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
    <div className="bg-gray-50 pt-24 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Tombol Kembali */}
        <Animate type="fadein" duration={0.5} ready={!loading}>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors duration-150 group"
          >
            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-all duration-150 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </span>
            Kembali
          </button>
        </Animate>

        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Kamar Inap"
            subtitle="Pilihan kamar yang nyaman dan fasilitas lengkap untuk kesembuhan Anda"
          />
        </Animate>

        <div className="py-16">
          {/* Header */}
          <Animate type="fadein" ready={dataReady} delay={0.05}>
            <div className="text-center mb-12 lg:mb-16">
              <Title
                badge="RUANG PERAWATAN"
                title="Informasi Kamar Inap"
                badgeVariant="default"
                align="center"
              />
            </div>
          </Animate>

          {/* Loading skeleton — sesuai layout kartu asli */}
          {loading && (
            <div className="space-y-8 lg:space-y-12">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
                    {/* Left skeleton */}
                    <div className="flex-1">
                      {/* Title row */}
                      <div className="flex items-center gap-3 mb-3 lg:mb-4">
                        <div className="h-8 w-52 bg-gray-200 rounded-lg" />
                        <div className="h-6 w-24 bg-gray-200 rounded-full" />
                      </div>
                      {/* Description */}
                      <div className="space-y-2 mb-6 lg:mb-8">
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-5/6 bg-gray-200 rounded" />
                        <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      </div>
                      {/* Fasilitas label */}
                      <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
                      {/* Facilities list */}
                      <div className="space-y-2">
                        {[...Array(6)].map((_, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <div
                              className="h-4 bg-gray-200 rounded"
                              style={{ width: `${60 + (j % 3) * 15}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Right skeleton */}
                    <div className="w-full lg:w-[420px] bg-gray-50 rounded-2xl p-6 lg:p-8 flex flex-col">
                      <div className="w-full h-56 lg:h-72 bg-gray-200 rounded-2xl mb-6" />
                      <div className="mt-auto">
                        <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                        <div className="flex items-end gap-1">
                          <div className="h-12 w-48 bg-gray-200 rounded" />
                          <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && kamarList.length === 0 && (
            <Animate type="popin" ready={dataReady}>
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
            </Animate>
          )}

          {/* Cards */}
          {!loading && kamarList.length > 0 && (
            <Animate
              type="stagger"
              staggerChildren={0.12}
              delayChildren={0.05}
              ready={dataReady}
              className="space-y-8 lg:space-y-12"
            >
              {kamarList.map((kamar) => (
                <Animate key={kamar.id} type="slideup">
                  {renderKamarCard(kamar)}
                </Animate>
              ))}
            </Animate>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformasiKamarInap;
