// app/components/ui/custom/pagination.tsx
"use client";

import { motion, type Transition } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

const ease = [0.25, 0.1, 0.25, 1] as const;

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export interface PaginationProps {
  /** Halaman aktif saat ini (1-based) */
  currentPage: number;
  /** Total halaman */
  totalPages: number;
  /** Callback saat halaman berubah */
  onPageChange: (page: number) => void;
  /** Total item keseluruhan (untuk label info) */
  totalItems: number;
  /** Jumlah item per halaman (untuk label info) */
  itemsPerPage: number;
  /** Label satuan item, default "item" */
  itemLabel?: string;
  /** Tampilkan label info "Menampilkan X–Y dari Z", default true */
  showInfo?: boolean;
  /** Class tambahan untuk wrapper */
  className?: string;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) pages.push("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemLabel = "item",
  showInfo = true,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const btnBase =
    "w-9 h-9 rounded-full flex items-center justify-center ring-1 ring-gray-200 bg-white text-gray-500 transition-colors duration-150 hover:ring-mariner-300 hover:text-mariner-600 hover:bg-mariner-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:ring-gray-200 disabled:hover:text-gray-500 disabled:hover:bg-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease } satisfies Transition}
      className={`flex flex-col items-center gap-4 ${className}`}
    >
      {/* Info label */}
      {showInfo && (
        <p className="text-xs text-gray-400 font-medium">
          Menampilkan{" "}
          <span className="text-gray-600 font-semibold">
            {startItem}–{endItem}
          </span>{" "}
          dari{" "}
          <span className="text-gray-600 font-semibold">{totalItems}</span>{" "}
          {itemLabel}
        </p>
      )}

      {/* Navigasi */}
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.14 } satisfies Transition}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Halaman sebelumnya"
          className={btnBase}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Nomor halaman */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none"
              >
                ···
              </span>
            ) : (
              <motion.button
                key={page}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.14 } satisfies Transition}
                onClick={() => onPageChange(page)}
                aria-label={`Halaman ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={`w-9 h-9 rounded-full text-sm font-semibold transition-all duration-200 ${
                  currentPage === page
                    ? "bg-mariner-600 text-white shadow-sm shadow-mariner-500/30 ring-2 ring-mariner-600/20"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-mariner-300 hover:text-mariner-600 hover:bg-mariner-50"
                }`}
              >
                {page}
              </motion.button>
            ),
          )}
        </div>

        {/* Next */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.14 } satisfies Transition}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Halaman berikutnya"
          className={btnBase}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Pagination;