// app/components/layout/BackToTop.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowUp, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MAPS_URL =
  "https://www.google.com/maps/place/Siti+Khodijah+Hospital+Sepanjang/@-7.3448344,112.6988835,17z/data=!3m1!4b1!4m6!3m5!1s0x2dd7e4893fcffd71:0xa99972e7efa52b05!8m2!3d-7.3448344!4d112.6988835!16s%2Fg%2F11b6dq7yfl?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-3">
      {/* Tombol Google Maps */}
      <motion.a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="p-3 bg-bittersweet-500 text-white rounded-full shadow-lg hover:bg-bittersweet-600"
        aria-label="Lihat lokasi di Google Maps"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MapPin className="h-6 w-6" />
      </motion.a>

      {/* Tombol Kembali ke Atas */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            key="back-to-top"
            onClick={scrollToTop}
            className="p-3 bg-mariner-500 text-white rounded-full shadow-lg hover:bg-mariner-600"
            aria-label="Kembali ke atas"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
