// app/home/kamar-inap.tsx
"use client";
import Animate, { ease, easeOut } from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { KamarInap as KamarInapType } from "@/types/index";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { ArrowRight, Bed, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface KamarCardProps {
  kamar: KamarInapType;
  isFeatured?: boolean;
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
   CARD WRAPPER VARIANTS
───────────────────────────────────────── */
const cardWrapVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease } satisfies Transition,
  },
};

const INNER_DELAY = 0.38;

/* ─────────────────────────────────────────
   KAMAR CARD
───────────────────────────────────────── */
const KamarCard: React.FC<KamarCardProps> = ({ kamar, isFeatured = false }) => {
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
      variants={cardWrapVariants}
      whileHover={
        !isFeatured
          ? {
              y: -3,
              scale: 1.02,
              transition: { duration: 0.28, ease } satisfies Transition,
            }
          : {}
      }
      className={`relative bg-white rounded-2xl flex flex-col h-full overflow-hidden transition-shadow duration-300
        ${
          isFeatured
            ? "ring-2 ring-greenfresh-500 shadow-xl shadow-greenfresh-100"
            : "ring-1 ring-gray-200 shadow-sm hover:shadow-md"
        }`}
    >
      {isFeatured && (
        <div className="h-1 w-full bg-linear-to-r from-greenfresh-400 to-greenfresh-600" />
      )}
      {isFeatured && (
        <div className="absolute top-4 right-4 z-10">
          <motion.span
            variants={{
              hidden: { opacity: 0, scale: 0.7, y: -6 },
              visible: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  duration: 0.4,
                  ease,
                  delay: INNER_DELAY,
                } satisfies Transition,
              },
            }}
            className="block bg-greenfresh-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
          >
            Disarankan
          </motion.span>
        </div>
      )}

      <div className="p-6 sm:p-8 flex flex-col grow">
        {/* Title */}
        <motion.h3
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.42,
                ease,
                delay: INNER_DELAY,
              } satisfies Transition,
            },
          }}
          className={`text-xl sm:text-2xl font-extrabold mb-1 line-clamp-1 ${isFeatured ? "text-greenfresh-600" : "text-mariner-500"}`}
        >
          {kamar.title}
        </motion.h3>

        <div className="min-h-5 mb-3">
          {isFeatured && (
            <motion.p
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    duration: 0.35,
                    ease,
                    delay: INNER_DELAY + 0.06,
                  } satisfies Transition,
                },
              }}
              className="text-greenfresh-500 text-xs font-semibold tracking-wide uppercase"
            >
              Pilihan Terbaik
            </motion.p>
          )}
        </div>

        {/* Description */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease,
                delay: INNER_DELAY + 0.1,
              } satisfies Transition,
            },
          }}
          className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-6"
        >
          {kamar.description}
        </motion.p>

        {/* Price block */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.42,
                ease,
                delay: INNER_DELAY + 0.18,
              } satisfies Transition,
            },
          }}
          className="mb-6 pb-6 border-b border-gray-100"
        >
          <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-widest">
            Harga / malam
          </p>
          <p
            className={`text-3xl sm:text-4xl font-extrabold ${isFeatured ? "text-greenfresh-600" : "text-mariner-500"}`}
          >
            {formatPrice(kamar.price)}
          </p>
        </motion.div>

        {/* Facilities */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                duration: 0.35,
                ease,
                delay: INNER_DELAY + 0.24,
              } satisfies Transition,
            },
          }}
          className="grow"
        >
          <h4 className="text-gray-700 font-semibold text-sm mb-3 flex items-center gap-2">
            <span
              className={`inline-block w-1 h-4 rounded-full ${isFeatured ? "bg-greenfresh-500" : "bg-mariner-400"}`}
            />
            Fasilitas
          </h4>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-modern">
            {kamar.facilities?.map((facility: string, index: number) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: {
                      duration: 0.38,
                      ease,
                      delay: INNER_DELAY + 0.28 + 0.05 * index,
                    } satisfies Transition,
                  },
                }}
                className="flex items-start gap-2"
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${isFeatured ? "text-greenfresh-500" : "text-mariner-400"}`}
                />
                <span className="text-gray-600 text-sm">{facility}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
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

    // Pick exactly 1 recommended: the most expensive among is_recommended=true.
    // If none flagged, promote the most expensive card overall.
    const flagged = kamarList
      .filter((k) => k.is_recommended)
      .sort((a, b) => Number(b.price) - Number(a.price));

    const allByPrice = [...kamarList].sort(
      (a, b) => Number(b.price) - Number(a.price),
    );

    const featured = flagged.length > 0 ? flagged[0] : allByPrice[0];

    // The rest — everything except the single featured card, sorted price asc
    const rest = kamarList
      .filter((k) => k.id !== featured.id)
      .sort((a, b) => Number(a.price) - Number(b.price));

    // Always place featured in the center: [rest[0], featured, rest[1]]
    if (rest.length === 0) return [featured];
    if (rest.length === 1) return [rest[0], featured];
    return [rest[0], featured, rest[1]];
  }, [kamarList]);

  useEffect(() => {
    const fetchKamar = async () => {
      try {
        const { data, error } = await supabase
          .from("kamar_inap")
          .select("*")
          .order("price", { ascending: false }) // fetch sorted by price desc
          .limit(3);
        if (error) throw error;
        setKamarList(data || []);
      } catch (error) {
        console.error("Error fetching kamar:", error);
      } finally {
        setLoading(false);
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
        <Animate
          type="fadein"
          ready={dataReady}
          margin="-60px"
          className="text-center mb-12 sm:mb-16"
        >
          <Title
            badge="Kamar Inap"
            title="Kamar Inap"
            badgeVariant="default"
            containerClassName="items-center"
          />
        </Animate>

        {/* ── Loading skeletons ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                { duration: 0.45, ease: easeOut } satisfies Transition
              }
            >
              <div className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
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
        {!loading && kamarList.length === 0 && (
          <Animate
            type="slideup"
            ready={dataReady}
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
          </Animate>
        )}

        {/* ── Content ── */}
        {!loading && sortedKamarList.length > 0 && (
          <>
            <Animate
              type="stagger"
              staggerChildren={0.18}
              delayChildren={0.05}
              ready={dataReady}
              margin="-60px"
              className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12 items-stretch"
            >
              {sortedKamarList.slice(0, 3).map((kamar, index) => (
                <KamarCard
                  key={kamar.id}
                  kamar={kamar}
                  isFeatured={index === 1}
                />
              ))}
            </Animate>

            {/* Mobile carousel */}
            <Animate
              type="fadein"
              ready={dataReady}
              margin="-40px"
              className="lg:hidden mb-12"
            >
              <div className="-mx-4">
                <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                  <div className="flex gap-4 md:gap-6">
                    {sortedKamarList.slice(0, 3).map((kamar, index) => (
                      <div
                        key={kamar.id}
                        className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                      >
                        <KamarCard kamar={kamar} isFeatured={index === 1} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Animate>

            {/* CTA */}
            <Animate
              type="fadein"
              ready={dataReady}
              margin="-40px"
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 } satisfies Transition}
                className="inline-block"
              >
                <Link href="/kamar-inap/informasi">
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
            </Animate>
          </>
        )}
      </div>
    </section>
  );
};

export default KamarInap;
