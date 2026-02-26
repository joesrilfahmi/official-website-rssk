// app/sections/klinik-spesialis/klinik-spesialis.tsx
"use client";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import { supabase } from "@/lib/supabase/client";
import * as Icons from "lucide-react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

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
  const router = useRouter();
  const [layananList, setLayananList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchLayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("poli")
          .select("*")
          .eq("status", "active")
          .order("urutan", { ascending: true });
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

  const filteredLayanan = useMemo(() => {
    return layananList.filter((layanan) => {
      if (!searchQuery) return true;
      const title = layanan.nama_poli?.toLowerCase() || "";
      const description = layanan.description?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [layananList, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredLayanan.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLayanan = filteredLayanan.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const renderLayananCard = (layanan: Poli, index: number) => {
    const IconComponent = Icons[
      layanan.icon as keyof typeof Icons
    ] as React.ElementType;
    const numberString = (index + 1).toString().padStart(2, "0");

    return (
      <div className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden">
        {/* Accent bar on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-bittersweet-400 to-bittersweet-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

        {/* Decorative Number — top right */}
        <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
          {numberString}
        </div>

        {/* Icon Badge */}
        <div className="relative z-10 inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 self-start group-hover:scale-110 transition-transform duration-300">
          {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
        </div>

        {/* Content */}
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
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Klinik Spesialis"
          subtitle="RS Siti Khodijah Muhammadiyah Cabang Sepanjang selalu berkomitmen menghadirkan inovasi layanan untuk pasien. Didukung oleh Dokter, Perawat, Paramedis dan Staf yang profesional dan ramah melayani pasien. Serta didukung dengan peralatan medis modern dan terbaru."
        />

        {/* Search Bar + Tombol Kembali */}
        <div className="mt-12 mb-2">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.back()}
                className="shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </Button>

              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Cari klinik spesialis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  rounded="full"
                  inputSize="md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-12">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredLayanan.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              {searchQuery ? (
                <Search className="w-12 h-12 text-gray-400" />
              ) : (
                <Icons.AlertCircle className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? "Tidak Ada Klinik Ditemukan" : "Belum Ada Layanan"}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : "Layanan unggulan belum tersedia saat ini."}
            </p>
          </div>
        )}

        {/* Content Grid */}
        {!loading && filteredLayanan.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-12">
              {currentLayanan.map((layanan, index) => (
                <div key={layanan.id}>
                  {renderLayananCard(layanan, startIndex + index)}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredLayanan.length > itemsPerPage && (
              <div className="flex items-center justify-end gap-3 mt-2 mb-8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  <ChevronLeft className="w-5 h-5" />
                  Prev
                </Button>
                <span className="text-sm text-gray-600">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LayananUnggulan;
