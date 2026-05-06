// app/home/kamar-inap/informasi/page.tsx
"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import { Bed, CheckCircle2, Star } from "lucide-react";
import CachedImage from "@/components/ui/custom/cached-image";
import { useEffect, useState } from "react";

const InformasiKamarInap = () => {
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
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
      {/* ────────────────────────────────────────────────
          MOBILE  (< md) — stacked: gambar atas, konten bawah
      ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:hidden">
        {/* Gambar */}
        <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
          {kamar.image ? (
            <CachedImage
              src={kamar.image}
              alt={kamar.title}
              fill
              sizes="100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={kamar.is_recommended}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              bucket={""}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bed className="w-14 h-14 text-gray-300" />
            </div>
          )}
          {kamar.is_recommended && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-greenfresh-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              <Star className="w-3 h-3 fill-white" />
              Recommended
            </div>
          )}
        </div>

        {/* Konten */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-mariner-600 mb-2">
            {kamar.title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            {kamar.description}
          </p>

          <h4 className="text-gray-700 font-semibold text-sm mb-3">
            Fasilitas Kamar
          </h4>
          <div
            className={
              kamar.facilities && kamar.facilities.length > 6
                ? "grid grid-cols-2 gap-x-3 gap-y-2 mb-5"
                : "flex flex-col gap-2 mb-5"
            }
          >
            {kamar.facilities?.map((facility: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-greenfresh-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 text-xs leading-relaxed">
                  {facility}
                </span>
              </div>
            ))}
          </div>

          {/* Harga */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-400 text-xs mb-0.5">Harga mulai dari</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-mariner-600">
                {formatPrice(kamar.price).replace(/\s/g, "")}
              </span>
              <span className="text-sm font-medium text-mariner-500">
                /Hari
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          TABLET  (md – lg) — gambar kiri, konten kanan
      ──────────────────────────────────────────────── */}
      <div className="hidden md:flex lg:hidden overflow-hidden">
        {/* Gambar */}
        <div className="relative w-56 shrink-0 bg-gray-100 overflow-hidden">
          {kamar.image ? (
            <CachedImage
              src={kamar.image}
              alt={kamar.title}
              fill
              sizes="224px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={kamar.is_recommended}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              bucket={""}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bed className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {kamar.is_recommended && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-greenfresh-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              <Star className="w-3 h-3 fill-white" />
              Recommended
            </div>
          )}
        </div>

        {/* Konten */}
        <div className="flex-1 p-6 flex flex-col justify-between min-h-0">
          <div>
            <h3 className="text-xl font-bold text-mariner-600 mb-2">
              {kamar.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
              {kamar.description}
            </p>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">
              Fasilitas Kamar
            </h4>
            <div
              className={
                kamar.facilities && kamar.facilities.length > 6
                  ? "grid grid-cols-2 gap-x-4 gap-y-1.5"
                  : "flex flex-col gap-1.5"
              }
            >
              {kamar.facilities?.map((facility: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-greenfresh-500 mt-0.5 shrink-0" />
                  <span className="text-gray-600 text-xs leading-relaxed">
                    {facility}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Harga */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-gray-400 text-xs mb-0.5">Harga mulai dari</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-mariner-600">
                {formatPrice(kamar.price).replace(/\s/g, "")}
              </span>
              <span className="text-sm font-medium text-mariner-500">
                /Hari
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          DESKTOP  (≥ lg) — konten kiri lebar + panel kanan
      ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex">
        {/* Konten kiri */}
        <div className="flex-1 p-8 xl:p-10 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-2xl xl:text-3xl font-bold text-mariner-600">
              {kamar.title}
            </h3>
          </div>

          <p className="text-gray-500 text-sm xl:text-base leading-relaxed mb-6">
            {kamar.description}
          </p>

          <h4 className="text-gray-700 font-semibold text-sm xl:text-base mb-4">
            Fasilitas Kamar
          </h4>
          <div
            className={
              kamar.facilities && kamar.facilities.length > 6
                ? "grid grid-cols-2 gap-x-6 gap-y-2"
                : "flex flex-col gap-2"
            }
          >
            {kamar.facilities?.map((facility: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-greenfresh-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 text-sm leading-relaxed">
                  {facility}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel kanan: gambar + harga */}
        <div className="w-[340px] xl:w-[390px] shrink-0 bg-gray-50 flex flex-col border-l border-gray-100">
          <div className="relative w-full h-64 xl:h-72 bg-gray-100 overflow-hidden">
            {kamar.image ? (
              <CachedImage
                src={kamar.image}
                alt={kamar.title}
                fill
                sizes="390px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority={kamar.is_recommended}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                bucket={""}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bed className="w-16 h-16 text-gray-300" />
              </div>
            )}
            {kamar.is_recommended && (
              <div className="absolute top-4 left-4 flex items-center gap-1 bg-greenfresh-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                <Star className="w-3 h-3 fill-white" />
                Recommended
              </div>
            )}
          </div>

          <div className="p-6 xl:p-8">
            <p className="text-gray-400 text-xs mb-1.5">Harga mulai dari</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl xl:text-4xl font-bold text-mariner-600">
                {formatPrice(kamar.price).replace(/\s/g, "")}
              </span>
              <span className="text-base font-medium text-mariner-500">
                /Hari
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Skeleton responsive ── */
  const renderSkeleton = () => (
    <div className="space-y-5 lg:space-y-8">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse border border-gray-100"
        >
          {/* Mobile skeleton */}
          <div className="flex flex-col md:hidden">
            <div className="w-full h-52 bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-6 w-44 bg-gray-200 rounded-lg" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
                    <div
                      className="h-3 bg-gray-200 rounded"
                      style={{ width: `${50 + (j % 3) * 20}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="h-7 w-36 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          {/* Tablet skeleton */}
          <div className="hidden md:flex lg:hidden" style={{ minHeight: 220 }}>
            <div className="w-56 bg-gray-200 shrink-0" />
            <div className="flex-1 p-6 space-y-3">
              <div className="h-6 w-44 bg-gray-200 rounded-lg" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
                    <div
                      className="h-3 bg-gray-200 rounded"
                      style={{ width: `${50 + (j % 3) * 20}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="h-7 w-36 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          {/* Desktop skeleton */}
          <div className="hidden lg:flex">
            <div className="flex-1 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-52 bg-gray-200 rounded-lg" />
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                    <div
                      className="h-4 bg-gray-200 rounded"
                      style={{ width: `${55 + (j % 3) * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-[340px] xl:w-[390px] bg-gray-50 flex flex-col border-l border-gray-100">
              <div className="w-full h-64 xl:h-72 bg-gray-200" />
              <div className="p-6 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-44 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 pt-20 sm:pt-24 min-h-screen pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Kamar Inap"
            subtitle="Pilihan kamar yang nyaman dan fasilitas lengkap untuk kesembuhan Anda"
          />
        </Animate>

        <div className="py-10 lg:py-16">
          {/* Header */}
          <Animate type="fadein" ready={dataReady} delay={0.05}>
            <div className="text-center mb-8 lg:mb-12">
              <Title
                badge="RUANG PERAWATAN"
                title="Informasi Kamar Inap"
                badgeVariant="default"
                align="center"
              />
            </div>
          </Animate>

          {/* Loading skeleton */}
          {loading && renderSkeleton()}

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
              className="space-y-5 lg:space-y-8"
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
