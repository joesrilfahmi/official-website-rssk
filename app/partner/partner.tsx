"use client";
import Animate, {
  ease,
  type BezierEase,
} from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Input from "@/components/ui/custom/input";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { Search, Users, X } from "lucide-react";
import CachedImage from "@/components/ui/custom/cached-image";
import React, { useEffect, useMemo, useState } from "react";

const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

/* ─────────────────────────────────────────
   useDebounce — generic debounce hook
   Menunda pembaruan nilai selama `delay` ms
   setelah perubahan terakhir.
───────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface Partner {
  id: string;
  nama: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
}

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden ring-1 ring-gray-100 animate-pulse bg-white">
    <div className="w-full bg-gray-100" style={{ paddingBottom: "120%" }} />
  </div>
);

/* ─────────────────────────────────────────
   PARTNER CARD
───────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease } satisfies Transition,
  },
};

const PartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer ring-1 ring-gray-100 hover:ring-0 shadow-sm"
      style={{ willChange: "transform" }}
      whileHover={{ scale: 1.03, transition: { duration: 0.25, ease } }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: "56.25%" }}
      >
        <div className="absolute inset-0 bg-white">
          {partner.picture ? (
            <CachedImage
              src={partner.picture}
              alt={partner.nama}
              fill
              className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              bucket={""}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-14 h-14 text-slate-400" />
            </div>
          )}

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10"
              />
            )}
          </AnimatePresence>

          {/* Name — revealed on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28, ease }}
                className="absolute inset-x-0 bottom-0 px-4 pb-4"
              >
                <h3 className="text-white font-bold text-sm leading-snug drop-shadow text-center">
                  {partner.nama}
                </h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const PartnerSection = () => {
  const [partnerList, setPartnerList] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // ── Raw input state (langsung terupdate saat user mengetik) ──
  const [searchQuery, setSearchQuery] = useState("");

  // ── Debounced state (digunakan untuk filtering, 300 ms delay) ──
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("partner_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner" },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partner")
        .select("id, nama, picture, created_at, updated_at")
        .order("nama", { ascending: true });
      if (error) throw error;
      setPartnerList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setDataReady(true), 120);
    }
  };

  // ── Filter menggunakan nilai debounced, bukan nilai raw ──
  const filteredPartners = useMemo(
    () =>
      partnerList.filter((p) => {
        if (!debouncedSearch) return true;
        return p.nama.toLowerCase().includes(debouncedSearch.toLowerCase());
      }),
    [partnerList, debouncedSearch],
  );

  return (
    <div className="bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Mitra Kerja Sama"
            subtitle="Institusi dan organisasi terpercaya yang bersinergi dalam mendukung pelayanan kesehatan terbaik"
          />
        </Animate>

        {/* Search — input bind ke raw searchQuery agar tampilan responsif */}
        <Animate
          type="slideup"
          ready={dataReady}
          delay={0.08}
          className="mb-10 mt-10"
        >
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Cari nama mitra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                iconPosition="left"
                rounded="full"
                inputSize="md"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/*
           * Teks hasil pencarian mengacu ke debouncedSearch
           * agar angka jumlah mitra tidak berubah-ubah saat user masih mengetik.
           */}
          <AnimatePresence>
            {debouncedSearch && !loading && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-center text-sm text-gray-400 mt-3"
              >
                {filteredPartners.length === 0
                  ? "Tidak ditemukan mitra yang sesuai"
                  : `Menampilkan ${filteredPartners.length} mitra`}
              </motion.p>
            )}
          </AnimatePresence>
        </Animate>

        {/* Skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: easeOut } satisfies Transition}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {[...Array(10)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && filteredPartners.length === 0 && (
          <Animate
            type="slideup"
            ready={dataReady}
            className="text-center py-16"
          >
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Mitra Tidak Ditemukan
            </h3>
            <p className="text-gray-500">
              Silakan coba dengan kata kunci yang berbeda.
            </p>
          </Animate>
        )}

        {/* Grid
         * key menggunakan debouncedSearch — animasi stagger hanya
         * re-trigger setelah debounce selesai, bukan setiap ketukan.
         */}
        {!loading && filteredPartners.length > 0 && (
          <Animate
            key={debouncedSearch}
            type="stagger"
            staggerChildren={0.045}
            delayChildren={0.02}
            ready={true}
            margin="-60px"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12"
          >
            {filteredPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </Animate>
        )}
      </div>
    </div>
  );
};

export default PartnerSection;
