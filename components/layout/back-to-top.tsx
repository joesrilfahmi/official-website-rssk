// app/components/layout/BackToTop.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);

        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 z-50 p-3 bg-mariner-500 text-white rounded-full shadow-lg hover:bg-mariner-600 transition-all duration-300 hover:scale-110"
                    aria-label="Kembali ke atas"
                >
                    <ArrowUp className="h-6 w-6" />
                </button>
            )}
        </>
    );
}