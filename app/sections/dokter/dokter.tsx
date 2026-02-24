// app/sections/dokter/dokter.tsx
"use client";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Pills from "@/components/ui/custom/pills";
import Select from "@/components/ui/custom/select";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { Calendar, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// Types
interface Poli {
  id: string;
  nama_poli: string;
}

interface JadwalDokter {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: "reguler" | "eksekutif";
}

interface Dokter {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: string;
  poli: Poli;
  jadwal_dokter: JadwalDokter[];
}

const HARI_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "Senin", label: "Senin" },
  { value: "Selasa", label: "Selasa" },
  { value: "Rabu", label: "Rabu" },
  { value: "Kamis", label: "Kamis" },
  { value: "Jumat", label: "Jumat" },
  { value: "Sabtu", label: "Sabtu" },
  { value: "Minggu", label: "Minggu" },
];

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

interface JadwalGroup {
  reguler: JadwalDokter[];
  eksekutif: JadwalDokter[];
}

const DokterSpesialis = () => {
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);

  // Filters
  const [selectedPoli, setSelectedPoli] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedHari, setSelectedHari] = useState<string>("all");

  // Embla Carousel for categories only
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  // Effect untuk mengatur overflow body saat modal dibuka/ditutup
  useEffect(() => {
    if (selectedDokter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDokter]);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const dokterChannel = supabase
      .channel("dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dokter" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    const jadwalChannel = supabase
      .channel("jadwal_dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jadwal_dokter" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dokterChannel);
      supabase.removeChannel(jadwalChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch dokter dengan relasi
      const { data: dokterData, error: dokterError } = await supabase
        .from("dokter")
        .select(
          `
                    *,
                    poli:poli_id (
                        id,
                        nama_poli
                    ),
                    jadwal_dokter (
                        id,
                        hari,
                        jam_mulai,
                        jam_selesai,
                        tipe_jadwal
                    )
                `,
        )
        .eq("status", "active");

      if (dokterError) throw dokterError;

      // Sort by poli nama_poli ascending
      const sortedDokter = (dokterData || []).sort((a, b) => {
        const nameA = a.poli?.nama_poli?.toLowerCase() || "";
        const nameB = b.poli?.nama_poli?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      });

      setDokterList(sortedDokter);

      // Get unique poli from active doctors only
      const uniquePoliIds = new Set<string>();
      const uniquePoliList: Poli[] = [];

      sortedDokter.forEach((dokter) => {
        if (dokter.poli && !uniquePoliIds.has(dokter.poli.id)) {
          uniquePoliIds.add(dokter.poli.id);
          uniquePoliList.push(dokter.poli);
        }
      });

      // Sort poli by nama_poli
      uniquePoliList.sort((a, b) =>
        a.nama_poli.toLowerCase().localeCompare(b.nama_poli.toLowerCase()),
      );

      setPoliList(uniquePoliList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter dokter berdasarkan search query (untuk menentukan kategori yang relevan)
  const searchFilteredDokter = useMemo(() => {
    return dokterList.filter((dokter) => {
      if (!searchQuery) return true;

      const fullName = dokter.nama.toLowerCase();
      const poliName = dokter.poli?.nama_poli?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      return fullName.includes(query) || poliName.includes(query);
    });
  }, [dokterList, searchQuery]);

  // Get poli list yang relevan dengan search query
  const relevantPoliList = useMemo(() => {
    if (!searchQuery) return poliList;

    return poliList.filter((poli) => {
      return searchFilteredDokter.some((dokter) => dokter.poli_id === poli.id);
    });
  }, [searchQuery, poliList, searchFilteredDokter]);

  // Filter dokter lengkap (dengan semua filter)
  const filteredDokter = useMemo(() => {
    return dokterList.filter((dokter) => {
      // Filter by search query
      if (searchQuery) {
        const fullName = dokter.nama.toLowerCase();
        const poliName = dokter.poli?.nama_poli?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();

        if (!fullName.includes(query) && !poliName.includes(query)) {
          return false;
        }
      }

      // Filter by poli
      if (selectedPoli !== "all" && dokter.poli_id !== selectedPoli) {
        return false;
      }

      // Filter by hari
      if (selectedHari !== "all") {
        const hasSchedule = dokter.jadwal_dokter.some(
          (jadwal) => jadwal.hari === selectedHari,
        );
        if (!hasSchedule) {
          return false;
        }
      }

      return true;
    });
  }, [dokterList, searchQuery, selectedPoli, selectedHari]);

  // Handler untuk search query - reset kategori dan hari ke "all"
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSelectedPoli("all");
      setSelectedHari("all");
    }
  };

  // Handler untuk clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handler untuk pilih kategori - clear search query
  const handlePoliChange = (poliId: string) => {
    setSelectedPoli(poliId);
    if (poliId !== "all") {
      setSearchQuery("");
    }
  };

  // Function to render jadwal in table format
  const renderJadwalTable = (jadwalList: JadwalDokter[]) => {
    if (jadwalList.length === 0) return null;

    const formatTime = (time: string) => {
      if (time.includes(".")) {
        return time.replace(".", ":");
      }
      return time;
    };

    // Group jadwal by hari and tipe
    const jadwalByHari: Record<string, JadwalGroup> = {};

    jadwalList.forEach((jadwal) => {
      if (!jadwalByHari[jadwal.hari]) {
        jadwalByHari[jadwal.hari] = { reguler: [], eksekutif: [] };
      }
      if (jadwal.tipe_jadwal === "reguler") {
        jadwalByHari[jadwal.hari].reguler.push(jadwal);
      } else {
        jadwalByHari[jadwal.hari].eksekutif.push(jadwal);
      }
    });

    // Sort by hari
    const sortedHari = Object.keys(jadwalByHari).sort((a, b) => {
      const orderA = HARI_ORDER[a] || 999;
      const orderB = HARI_ORDER[b] || 999;
      return orderA - orderB;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                Hari
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                <div className="flex items-center gap-2">
                  <span>Jadwal BPJS</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                <div className="flex items-center gap-2">
                  <span>Jadwal Eksekutif</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHari.map((hari) => {
              const jadwalGroup = jadwalByHari[hari];
              const reguler = jadwalGroup.reguler;
              const eksekutif = jadwalGroup.eksekutif;
              const maxRows = Math.max(reguler.length, eksekutif.length, 1);

              return Array.from({ length: maxRows }).map((_, index) => (
                <tr
                  key={`${hari}-${index}`}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {index === 0 ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-mariner-500" />
                        <span>{hari}</span>
                      </div>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {reguler[index] ? (
                      <span className="font-medium">
                        {formatTime(reguler[index].jam_mulai)} -{" "}
                        {formatTime(reguler[index].jam_selesai)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {eksekutif[index] ? (
                      <span className="font-medium">
                        {formatTime(eksekutif[index].jam_mulai)} -{" "}
                        {formatTime(eksekutif[index].jam_selesai)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDokterCard = (dokter: Dokter) => {
    const initial = dokter.nama.charAt(0).toUpperCase();

    return (
      <div
        onClick={() => setSelectedDokter(dokter)}
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group border border-gray-100 hover:border-mariner-200 h-full"
      >
        <div className="flex flex-col items-center text-center h-full">
          {/* Profile Image */}
          <div className="relative w-56 h-56 mb-4 shrink-0">
            {dokter.profile ? (
              <div className="w-full h-full rounded-full overflow-hidden">
                <Image
                  src={dokter.profile}
                  alt={dokter.nama}
                  fill
                  className="object-cover rounded-full"
                  sizes="224px"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center text-white text-6xl font-bold">
                {initial}
              </div>
            )}
          </div>

          {/* Doctor Name */}
          <h3 className="text-xl font-bold text-mariner-500 mb-2 group-hover:text-mariner-600 transition-colors">
            {dokter.nama}
          </h3>

          {/* Specialization */}
          <p className="text-gray-600 mb-3">{dokter.poli?.nama_poli || "-"}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Dokter Spesialis Kami"
          subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
        />

        <div className="text-center mt-8 mb-12 sm:mb-16">
          <Title
            title="Daftar Dokter Spesialis"
            align="center"
            subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
          />
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto">
          {/* Filters Section */}
          <div className="mb-8 space-y-6">
            {/* Search and Day Filter - Centered */}
            <div className="flex justify-center">
              <div className="w-full max-w-3xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Cari dokter atau spesialisasi..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      icon={Search}
                      iconPosition="left"
                      rounded="full"
                      inputSize="md"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                        type="button"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Day Filter */}
                  <div className="w-full sm:w-48 shrink-0">
                    <Select
                      icon={Calendar}
                      value={selectedHari}
                      onChange={setSelectedHari}
                      options={HARI_OPTIONS}
                      placeholder="Pilih hari"
                      rounded="full"
                      searchable={false}
                      selectSize="md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Pills - Carousel */}
            {!loading && poliList.length > 0 && (
              <div className="relative -mx-4 px-4">
                <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                  <div className="flex gap-3">
                    <Pills
                      label="Semua"
                      count={
                        searchQuery
                          ? searchFilteredDokter.length
                          : dokterList.length
                      }
                      variant={selectedPoli === "all" ? "active" : "default"}
                      onClick={() => handlePoliChange("all")}
                      size="md"
                    />
                    {relevantPoliList.map((poli) => {
                      const count = searchFilteredDokter.filter(
                        (d) => d.poli_id === poli.id,
                      ).length;
                      return (
                        <Pills
                          key={poli.id}
                          label={poli.nama_poli}
                          count={count}
                          variant={
                            selectedPoli === poli.id ? "active" : "default"
                          }
                          onClick={() => handlePoliChange(poli.id)}
                          size="md"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-lg animate-pulse"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDokter.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Tidak Ada Dokter Ditemukan
              </h3>
              <p className="text-gray-500">
                Coba ubah filter atau kata kunci pencarian Anda.
              </p>
            </div>
          )}

          {/* Dokter Grid */}
          {!loading && filteredDokter.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredDokter.map((dokter) => (
                <div key={dokter.id}>{renderDokterCard(dokter)}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDokter && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-start justify-center p-4 overflow-y-auto pt-24"
          onClick={() => setSelectedDokter(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Content */}
            <div className="p-8">
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedDokter(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Doctor Profile - Centered */}
              <div className="flex flex-col items-center text-center mb-8">
                {/* Large Profile Image */}
                <div className="relative w-56 h-56 mb-6">
                  {selectedDokter.profile ? (
                    <Image
                      src={selectedDokter.profile}
                      alt={selectedDokter.nama}
                      fill
                      className="rounded-full object-cover"
                      sizes="224px"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center text-white text-6xl font-bold">
                      {selectedDokter.nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <h3 className="text-3xl font-bold text-mariner-500 mb-3">
                  {selectedDokter.nama}
                </h3>

                {/* Poli Name */}
                <p className="text-xl text-gray-600 mb-3">
                  {selectedDokter.poli?.nama_poli || "-"}
                </p>

                {/* Status Badge */}
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                  {selectedDokter.status === "active"
                    ? "Aktif"
                    : selectedDokter.status}
                </span>
              </div>

              {/* Schedule Section */}
              {selectedDokter.jadwal_dokter.length > 0 && (
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    Detail Jadwal Praktik
                  </h4>

                  {/* Jadwal Table */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-6">
                    {renderJadwalTable(selectedDokter.jadwal_dokter)}
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="primary"
                      onClick={() => setSelectedDokter(null)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              )}

              {selectedDokter.jadwal_dokter.length === 0 && (
                <div>
                  <div className="text-center py-8 mb-6">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Jadwal praktik belum tersedia
                    </p>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={() => setSelectedDokter(null)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DokterSpesialis;
