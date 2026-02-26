// app/sections/home/klinik-spesialis.tsx
"use client";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import * as Icons from "lucide-react";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────
   ANIMATION VARIANTS — identical to About
───────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;
const easeOut = [0.0, 0.0, 0.2, 1] as const;

// Stagger container — same as About containerVariants
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
};

// Text/content items — lift + fade + unblur (same as About itemVariants)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease },
  },
};

// Card items — staggered pop-in (same as About statCardVariants)
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

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   LAYANAN CARD — uses cardVariants (child of stagger)
───────────────────────────────────────── */
interface LayananCardProps {
  layanan: Poli;
  index: number;
}

const LayananCard: React.FC<LayananCardProps> = ({ layanan, index }) => {
  const IconComponent = Icons[
    layanan.icon as keyof typeof Icons
  ] as React.ElementType;
  const numberString = (index + 1).toString().padStart(2, "0");

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.28, ease } }}
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col overflow-hidden cursor-default"
    >
      {/* Accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-bittersweet-400 to-bittersweet-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl" />

      {/* Decorative Number */}
      <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
        {numberString}
      </div>

      {/* Icon Badge */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={
          { duration: 0.5, ease, delay: 0.1 + index * 0.05 } as Transition
        }
        className="relative z-10 inline-flex p-4 sm:p-5 rounded-2xl bg-bittersweet-100 text-bittersweet-500 mb-4 sm:mb-6 self-start group-hover:scale-110 transition-transform duration-300"
      >
        {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />}
      </motion.div>

      {/* Text */}
      <div className="relative z-10 flex flex-col grow">
        <h3 className="text-xl sm:text-2xl font-bold text-mariner-500 mb-3 sm:mb-4 line-clamp-2 min-h-14">
          {layanan.nama_poli}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 grow">
          {layanan.description}
        </p>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const LayananUnggulan = () => {
  const [layananList, setLayananList] = useState<Poli[]>([]);
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
        // Small delay so skeleton exit transition finishes before cards animate in
        setTimeout(() => setDataReady(true), 120);
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

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── Header — itemVariants, whileInView ── */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <Title
            badge="Layanan"
            title="Klinik Spesialis"
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
                {[...Array(6)].map((_, i) => (
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
          {!loading && layananList.length === 0 && (
            <motion.div
              key="empty"
              variants={emptyVariants}
              initial="hidden"
              animate={dataReady ? "visible" : "hidden"}
              className="text-center py-12"
            >
              <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Belum Ada Layanan
              </h3>
              <p className="text-gray-500">
                Layanan unggulan belum tersedia saat ini.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        {!loading && layananList.length > 0 && (
          <>
            {/* Desktop — stagger container + card children
                Same pattern as statsContainerVariants + statCardVariants in About */}
            <motion.div
              className="hidden lg:grid grid-cols-3 gap-6 sm:gap-8 mb-12"
              variants={containerVariants}
              initial="hidden"
              whileInView={dataReady ? "visible" : "hidden"}
              viewport={{ once: true, margin: "-60px" }}
            >
              {layananList.map((layanan, index) => (
                <LayananCard key={layanan.id} layanan={layanan} index={index} />
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
                        {layananList.map((layanan, index) => (
                          <div
                            key={layanan.id}
                            className="flex-[0_0_85%] md:flex-[0_0_45%] min-w-0"
                          >
                            <LayananCard layanan={layanan} index={index} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            {layananList.length >= 6 && (
              <motion.div
                className="text-center mt-12"
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
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default LayananUnggulan;
