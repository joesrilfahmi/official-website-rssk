"use client";

import Animate from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { animate, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   INTERFACES
───────────────────────────────────────── */
interface Partner {
  id: string;
  nama: string;
  picture: string | null;
}

/* ─────────────────────────────────────────
   SKELETON — centered
───────────────────────────────────────── */
const SkeletonRow = ({ count = 5 }: { count?: number }) => (
  <div className="flex items-center justify-center gap-5 overflow-hidden py-1">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="shrink-0 w-44 sm:w-56 h-32 sm:h-40 rounded-2xl bg-gray-200 animate-pulse"
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────
   PARTNER CARD
───────────────────────────────────────── */
const PartnerCard = ({ partner }: { partner: Partner }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const initial = partner.nama.charAt(0).toUpperCase();

  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateX.set(-dy * 7);
    rotateY.set(dx * 7);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 900,
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="shrink-0 relative cursor-default select-none"
    >
      <motion.div
        className="relative w-44 sm:w-56 h-32 sm:h-40 rounded-2xl border border-gray-200/80 bg-white shadow-sm flex items-center justify-center overflow-hidden p-4"
        whileHover={{
          boxShadow:
            "0 20px 56px -10px rgba(0,0,0,0.16), 0 6px 20px -4px rgba(0,0,0,0.09)",
          borderColor: "rgba(209,213,219,1)",
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Shine overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 55%)",
          }}
        />

        {partner.picture ? (
          <Image
            src={partner.picture}
            alt={partner.nama}
            width={200}
            height={120}
            className="w-full h-full object-contain relative z-10"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-14 h-14 rounded-xl bg-mariner-50 flex items-center justify-center text-mariner-600 font-bold text-xl">
              {initial}
            </div>
            <span className="text-[11px] text-gray-500 font-medium text-center leading-tight line-clamp-2 max-w-[130px]">
              {partner.nama}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   TICKER ROW
───────────────────────────────────────── */
interface TickerRowProps {
  partners: Partner[];
  direction?: 1 | -1;
  duration?: number;
}

function TickerRow({ partners, direction = 1, duration = 20 }: TickerRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);

  const looped = [...partners, ...partners, ...partners];

  const startLoop = (fromX: number, segmentWidth: number) => {
    const to = direction === 1 ? -segmentWidth : 0;
    const totalDistance = Math.abs(to - fromX);
    const remaining = duration * (totalDistance / segmentWidth || 1);

    animRef.current = animate(x, to, {
      duration: remaining,
      ease: "linear",
      onComplete: () => {
        const resetX = direction === 1 ? 0 : -segmentWidth;
        x.set(resetX);
        startLoop(resetX, segmentWidth);
      },
    });
  };

  useEffect(() => {
    if (!trackRef.current || partners.length === 0) return;
    const raf = requestAnimationFrame(() => {
      if (!trackRef.current) return;
      const segmentWidth = trackRef.current.scrollWidth / 3;
      const initX = direction === 1 ? 0 : -segmentWidth;
      x.set(initX);
      startLoop(initX, segmentWidth);
    });
    return () => {
      cancelAnimationFrame(raf);
      animRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partners]);

  const pause = () => animRef.current?.stop();
  const resume = () => {
    if (!trackRef.current) return;
    const segmentWidth = trackRef.current.scrollWidth / 3;
    startLoop(x.get(), segmentWidth);
  };

  return (
    <div className="overflow-hidden" onMouseEnter={pause} onMouseLeave={resume}>
      <motion.div
        ref={trackRef}
        className="flex gap-5 w-max py-2"
        style={{ x }}
      >
        {looped.map((partner, i) => (
          <PartnerCard key={`${partner.id}-${i}`} partner={partner} />
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FADE EDGES
───────────────────────────────────────── */
const FadeEdges = () => (
  <>
    <div className="pointer-events-none absolute left-0 top-0 h-full w-16 sm:w-32 z-10 bg-linear-to-r from-gray-50 to-transparent" />
    <div className="pointer-events-none absolute right-0 top-0 h-full w-16 sm:w-32 z-10 bg-linear-to-l from-gray-50 to-transparent" />
  </>
);

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function PartnerSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("partner")
          .select("id, nama, picture")
          .order("nama", { ascending: true });
        if (error) throw error;
        setPartners(data || []);
      } catch (err) {
        console.error("Error fetching partners:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setDataReady(true), 120);
      }
    };

    fetchPartners();

    const channel = supabase
      .channel("partner_logos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner" },
        () => fetchPartners(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const third = Math.ceil(partners.length / 3);
  const row1 = partners.slice(0, third);
  const row2 = partners.slice(third, third * 2);
  const row3 = partners.slice(third * 2);

  const safeRow2 = row2.length > 0 ? row2 : [...partners];
  const safeRow3 = row3.length > 0 ? row3 : [...partners];

  return (
    <section className="bg-gray-50 py-24 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Animate
          type="stagger"
          staggerChildren={0.11}
          delayChildren={0.08}
          ready={dataReady}
          margin="-60px"
          className="flex flex-col items-center text-center mb-16"
        >
          <Animate type="fadein">
            <Title
              badge="MITRA"
              title="Partner Kami"
              badgeVariant="default"
              containerClassName="items-center"
            />
          </Animate>

          <Animate type="fadein">
            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-md leading-relaxed">
              Kami bangga bermitra dengan berbagai perusahaan terpercaya di
              seluruh Indonesia.
            </p>
          </Animate>
        </Animate>
      </div>

      {/* Skeletons — centered */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 space-y-5 mt-4">
          <SkeletonRow count={5} />
          <SkeletonRow count={5} />
          <SkeletonRow count={5} />
        </div>
      )}

      {/* Empty */}
      {!loading && partners.length === 0 && (
        <Animate type="slideup" ready={dataReady} className="text-center py-12">
          <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Belum Ada Partner
          </h3>
          <p className="text-gray-500">Data partner belum tersedia saat ini.</p>
        </Animate>
      )}

      {/* 3-row ticker */}
      {!loading && partners.length > 0 && (
        <Animate type="fadein" ready={dataReady} margin="-40px">
          <div className="relative space-y-5 mt-4">
            <FadeEdges />
            <TickerRow partners={row1} direction={1} duration={22} />
            <TickerRow partners={safeRow2} direction={-1} duration={18} />
            <TickerRow partners={safeRow3} direction={1} duration={25} />
          </div>
        </Animate>
      )}

      {/* Tombol Selengkapnya */}
      {!loading && partners.length > 0 && (
        <Animate
          type="fadein"
          ready={dataReady}
          margin="-20px"
          className="flex justify-center mt-12"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            <Link href="/sections/partner">
              <Button variant="primary" size="lg" className="group shadow-lg">
                Selengkapnya
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </Animate>
      )}
    </section>
  );
}
