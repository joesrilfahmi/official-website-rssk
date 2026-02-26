// app/sections/home/kamar-inap.tsx
"use client";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, Bed, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS — identical to About
───────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;
const easeOut = [0.0, 0.0, 0.2, 1] as const;

// Stagger container
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

// Text/content items — lift + fade + unblur
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease },
  },
};

// Card items — staggered pop-in
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease },
  },
};

// Empty state
const emptyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface KamarCardProps {
  kamar: KamarInapType;
}

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   KAMAR CARD — motion wrapper
───────────────────────────────────────── */
const KamarCard: React.FC<KamarCardProps> = ({ kamar }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("IDR", "Rp");

  return (
    <motion.div
      variants={cardVariants}
      whileHover={
        !kamar.is_recommended
          ? { y: -3, scale: 1.02, transition: { duration: 0.28, ease } }
          : {}
      }
      className={`relative bg-white rounded-2xl flex flex-col h-full overflow-hidden transition-shadow duration-300
        ${
          kamar.is_recommended
            ? "ring-2 ring-greenfresh-500 shadow-xl shadow-greenfresh-100"
            : "ring-1 ring-gray-200 shadow-sm hover:shadow-md"
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
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease, delay: 0.05 * index }}
                className="flex items-start gap-2"
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${kamar.is_recommended ? "text-greenfresh-500" : "text-mariner-400"}`}
                />
                <span className="text-gray-600 text-sm">{facility}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const KamarInap = () => {
  const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

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
        // Small delay so skeleton exit finishes before cards animate in
        setTimeout(() => setDataReady(true), 120);
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

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <Title
            badge="Kamar Inap"
            title="Kamar Inap"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </motion.div>

        {/* ── Loading skeletons ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
              {/* Mobile */}
              <div className="lg:hidden -mx-4 px-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-[0_0_85%] md:flex-[0_0_45%]">
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        <AnimatePresence>
          {!loading && kamarList.length === 0 && (
            <motion.div
              key="empty"
              variants={emptyVariants}
              initial="hidden"
              animate={dataReady ? "visible" : "hidden"}
              className="text-center py-12"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <Bed className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Belum Ada Kamar
              </h3>
              <p className="text-gray-500">
                Informasi kamar inap belum tersedia saat ini.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        {!loading && sortedKamarList.length > 0 && (
          <>
            {/* Desktop — stagger container + card children */}
            <motion.div
              className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12 items-stretch"
              variants={containerVariants}
              initial="hidden"
              whileInView={dataReady ? "visible" : "hidden"}
              viewport={{ once: true, margin: "-60px" }}
            >
              {sortedKamarList.slice(0, 3).map((kamar) => (
                <KamarCard key={kamar.id} kamar={kamar} />
              ))}
            </motion.div>

            {/* Mobile / Tablet carousel */}
            <AnimatePresence>
              {dataReady && (
                <motion.div
                  key="carousel"
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  className="lg:hidden mb-12"
                >
                  <div className="-mx-4">
                    <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                      <div className="flex gap-4 md:gap-6">
                        {sortedKamarList.slice(0, 3).map((kamar) => (
                          <div
                            key={kamar.id}
                            className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                          >
                            <KamarCard kamar={kamar} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.div
              className="text-center"
              variants={itemVariants}
              initial="hidden"
              whileInView={dataReady ? "visible" : "hidden"}
              viewport={{ once: true, margin: "-40px" }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                <Link href="/sections/home/kamar-inap/informasi">
                  <Button
                    variant="primary"
                    size="lg"
                    className="group shadow-lg"
                  >
                    Selengkapnya
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default KamarInap;
