// app/components/layout/BackToTop.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    key="back-to-top"
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 z-50 p-3 bg-mariner-500 text-white rounded-full shadow-lg hover:bg-mariner-600"
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
    );
}