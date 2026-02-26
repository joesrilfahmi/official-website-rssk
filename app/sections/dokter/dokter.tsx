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
import { Calendar, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
interface JadwalGroup {
  reguler: JadwalDokter[];
  eksekutif: JadwalDokter[];
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

const DokterSpesialis = () => {
  const [poliList, setPoliList] = useState<Poli[]>([]);
  const [dokterList, setDokterList] = useState<Dokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);
  const [selectedPoli, setSelectedPoli] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedHari, setSelectedHari] = useState<string>("all");

  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    slidesToScroll: 1,
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    document.body.style.overflow = selectedDokter ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDokter]);

  useEffect(() => {
    fetchData();
    const dokterChannel = supabase
      .channel("dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dokter" },
        () => fetchData(),
      )
      .subscribe();
    const jadwalChannel = supabase
      .channel("jadwal_dokter_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jadwal_dokter" },
        () => fetchData(),
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
      const { data: dokterData, error } = await supabase
        .from("dokter")
        .select(
          `*, poli:poli_id (id, nama_poli), jadwal_dokter (id, hari, jam_mulai, jam_selesai, tipe_jadwal)`,
        )
        .eq("status", "active");
      if (error) throw error;
      const sorted = (dokterData || []).sort((a, b) =>
        (a.nama?.toLowerCase() || "").localeCompare(
          b.nama?.toLowerCase() || "",
          "id",
        ),
      );
      setDokterList(sorted);
      const seen = new Set<string>();
      const uniquePoli: Poli[] = [];
      sorted.forEach((d) => {
        if (d.poli && !seen.has(d.poli.id)) {
          seen.add(d.poli.id);
          uniquePoli.push(d.poli);
        }
      });
      uniquePoli.sort((a, b) =>
        a.nama_poli.toLowerCase().localeCompare(b.nama_poli.toLowerCase()),
      );
      setPoliList(uniquePoli);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchFilteredDokter = useMemo(
    () =>
      dokterList.filter((d) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          d.nama.toLowerCase().includes(q) ||
          (d.poli?.nama_poli?.toLowerCase() || "").includes(q)
        );
      }),
    [dokterList, searchQuery],
  );

  const relevantPoliList = useMemo(() => {
    if (!searchQuery) return poliList;
    return poliList.filter((p) =>
      searchFilteredDokter.some((d) => d.poli_id === p.id),
    );
  }, [searchQuery, poliList, searchFilteredDokter]);

  const filteredDokter = useMemo(
    () =>
      dokterList.filter((d) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !d.nama.toLowerCase().includes(q) &&
            !(d.poli?.nama_poli?.toLowerCase() || "").includes(q)
          )
            return false;
        }
        if (selectedPoli !== "all" && d.poli_id !== selectedPoli) return false;
        if (
          selectedHari !== "all" &&
          !d.jadwal_dokter.some((j) => j.hari === selectedHari)
        )
          return false;
        return true;
      }),
    [dokterList, searchQuery, selectedPoli, selectedHari],
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSelectedPoli("all");
      setSelectedHari("all");
    }
  };

  const handlePoliChange = (poliId: string) => {
    setSelectedPoli(poliId);
    if (poliId !== "all") setSearchQuery("");
  };

  const formatTime = (t: string) => (t.includes(".") ? t.replace(".", ":") : t);

  const renderJadwalTable = (jadwalList: JadwalDokter[]) => {
    if (jadwalList.length === 0) return null;
    const byHari: Record<string, JadwalGroup> = {};
    jadwalList.forEach((j) => {
      if (!byHari[j.hari]) byHari[j.hari] = { reguler: [], eksekutif: [] };
      byHari[j.hari][
        j.tipe_jadwal === "reguler" ? "reguler" : "eksekutif"
      ].push(j);
    });
    const sortedHari = Object.keys(byHari).sort(
      (a, b) => (HARI_ORDER[a] || 999) - (HARI_ORDER[b] || 999),
    );
    return (
      <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 w-32">
                Hari
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">
                Jadwal BPJS
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">
                Jadwal Eksekutif
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHari.map((hari) => {
              const { reguler, eksekutif } = byHari[hari];
              const maxRows = Math.max(reguler.length, eksekutif.length, 1);
              return Array.from({ length: maxRows }).map((_, i) => (
                <tr
                  key={`${hari}-${i}`}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {i === 0 ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-mariner-500 shrink-0" />
                        <span>{hari}</span>
                      </div>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {reguler[i] ? (
                      <span className="font-medium text-gray-800">
                        {formatTime(reguler[i].jam_mulai)} –{" "}
                        {formatTime(reguler[i].jam_selesai)}
                      </span>
                    ) : (
                      <span className="text-gray-300">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {eksekutif[i] ? (
                      <span className="font-medium text-gray-800">
                        {formatTime(eksekutif[i].jam_mulai)} –{" "}
                        {formatTime(eksekutif[i].jam_selesai)}
                      </span>
                    ) : (
                      <span className="text-gray-300">–</span>
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

  const renderDokterCard = (dokter: Dokter) => (
    <div
      onClick={() => setSelectedDokter(dokter)}
      className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center h-full overflow-hidden relative"
    >
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-mariner-400 to-mariner-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

      {/* Profile image — diperbesar */}
      <div className="relative w-36 h-36 mb-4 shrink-0">
        {dokter.profile ? (
          <Image
            src={dokter.profile}
            alt={dokter.nama}
            fill
            className="object-cover rounded-full ring-4 ring-mariner-50"
            sizes="144px"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center ring-4 ring-mariner-50">
            <UserRound className="w-16 h-16 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-base font-bold text-mariner-500 mb-1 group-hover:text-mariner-600 transition-colors line-clamp-2 leading-snug">
        {dokter.nama}
      </h3>

      {/* Specialization pill */}
      <span className="text-xs font-medium text-mariner-600 bg-mariner-50 px-3 py-1 rounded-full mt-1">
        {dokter.poli?.nama_poli || "–"}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Dokter Spesialis Kami"
          subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
        />

        <div className="text-center mt-10 mb-12">
          <Title
            title="Daftar Dokter Spesialis"
            align="center"
            subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-5">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-3">
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
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
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

          {/* Pills carousel */}
          {!loading && poliList.length > 0 && (
            <div className="relative -mx-4 px-4">
              <div className="overflow-hidden px-4 py-2" ref={emblaRef}>
                <div className="flex gap-2.5">
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
                  {relevantPoliList.map((poli) => (
                    <Pills
                      key={poli.id}
                      label={poli.nama_poli}
                      count={
                        searchFilteredDokter.filter(
                          (d) => d.poli_id === poli.id,
                        ).length
                      }
                      variant={selectedPoli === poli.id ? "active" : "default"}
                      onClick={() => handlePoliChange(poli.id)}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 animate-pulse flex flex-col items-center"
              >
                <div className="w-36 h-36 bg-gray-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredDokter.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <UserRound className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tidak Ada Dokter Ditemukan
            </h3>
            <p className="text-gray-500">
              Coba ubah filter atau kata kunci pencarian Anda.
            </p>
          </div>
        )}

        {/* Grid — 4 kolom di desktop */}
        {!loading && filteredDokter.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {filteredDokter.map((dokter) => (
              <div key={dokter.id}>{renderDokterCard(dokter)}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedDokter && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-start justify-center p-4 overflow-y-auto pt-20"
          onClick={() => setSelectedDokter(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header accent */}
            <div className="h-1.5 w-full bg-linear-to-r from-mariner-400 to-mariner-600" />

            <div className="p-8">
              {/* Close */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSelectedDokter(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative w-32 h-32 mb-5">
                  {selectedDokter.profile ? (
                    <Image
                      src={selectedDokter.profile}
                      alt={selectedDokter.nama}
                      fill
                      className="rounded-full object-cover ring-4 ring-mariner-100"
                      sizes="128px"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center ring-4 ring-mariner-100">
                      <UserRound className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-extrabold text-mariner-600 mb-1">
                  {selectedDokter.nama}
                </h3>
                <span className="text-sm font-medium text-mariner-600 bg-mariner-50 px-4 py-1.5 rounded-full mb-3">
                  {selectedDokter.poli?.nama_poli || "–"}
                </span>
                <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
                  {selectedDokter.status === "active"
                    ? "Aktif"
                    : selectedDokter.status}
                </span>
              </div>

              {/* Jadwal */}
              {selectedDokter.jadwal_dokter.length > 0 ? (
                <>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center mb-5">
                    Jadwal Praktik
                  </h4>
                  {renderJadwalTable(selectedDokter.jadwal_dokter)}
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="primary"
                      onClick={() => setSelectedDokter(null)}
                    >
                      Tutup
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-6">
                    Jadwal praktik belum tersedia
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setSelectedDokter(null)}
                  >
                    Tutup
                  </Button>
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
