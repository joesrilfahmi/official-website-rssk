// app/components/ui/custom/datepicker.tsx

import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DatePickerProps {
  label?: string;
  placeholder?: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  selectSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  required?: boolean;
  className?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
}

/* ── helpers ── */
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(str: string): string {
  const d = parseDate(str);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ── year range for year picker ── */
function buildYearRange(selected: number): number[] {
  const start = selected - 60;
  const end = selected + 10;
  const years: number[] = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  placeholder = "Pilih tanggal",
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  rounded = "xl",
  selectSize = "md",
  fullWidth = true,
  required = false,
  className = "",
  minDate,
  maxDate,
}) => {
  const today = new Date();
  const selectedDate = parseDate(value);

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "month" | "year">("calendar");

  // Navigate cursor
  const [cursorYear, setCursorYear] = useState(
    selectedDate?.getFullYear() ?? today.getFullYear()
  );
  const [cursorMonth, setCursorMonth] = useState(
    selectedDate?.getMonth() ?? today.getMonth()
  );

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({ display: "none" });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  /* ── style maps ── */
  const roundedMap: Record<string, string> = {
    sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full",
  };
  const sizeMap: Record<string, string> = {
    sm: "py-2 text-sm", md: "py-3 text-base", lg: "py-4 text-lg",
  };
  const dropdownRoundedMap: Record<string, string> = {
    sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", xl: "rounded-2xl", full: "rounded-2xl",
  };

  /* ── position ── */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 340 && spaceAbove > spaceBelow;
    setDropdownStyle({
      position: "fixed",
      left: Math.min(r.left, window.innerWidth - 296),
      width: Math.max(r.width, 280),
      zIndex: 99999,
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true, capture: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  /* ── sync cursor when value changes ── */
  useEffect(() => {
    if (selectedDate) {
      setCursorYear(selectedDate.getFullYear());
      setCursorMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  /* ── auto-scroll year into view ── */
  useEffect(() => {
    if (view === "year" && yearScrollRef.current) {
      const el = yearScrollRef.current.querySelector("[data-selected-year]") as HTMLElement | null;
      if (el) el.scrollIntoView({ block: "center" });
    }
  }, [view]);

  /* ── outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setIsOpen(false);
      setView("calendar");
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen]);

  /* ── escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsOpen(false); setView("calendar"); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen((p) => {
      if (!p) setView("calendar");
      return !p;
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(cursorYear, cursorMonth, day);
    const str = toDateStr(d);
    if (minDate && str < minDate) return;
    if (maxDate && str > maxDate) return;
    onChange(str);
    setIsOpen(false);
    setView("calendar");
  };

  const prevMonth = () => {
    if (cursorMonth === 0) { setCursorMonth(11); setCursorYear((y) => y - 1); }
    else setCursorMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (cursorMonth === 11) { setCursorMonth(0); setCursorYear((y) => y + 1); }
    else setCursorMonth((m) => m + 1);
  };

  const isDayDisabled = (day: number) => {
    const str = toDateStr(new Date(cursorYear, cursorMonth, day));
    if (minDate && str < minDate) return true;
    if (maxDate && str > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === cursorYear &&
      today.getMonth() === cursorMonth &&
      today.getDate() === day;
  };

  const isSelected = (day: number) => {
    return selectedDate?.getFullYear() === cursorYear &&
      selectedDate?.getMonth() === cursorMonth &&
      selectedDate?.getDate() === day;
  };

  const weeks = buildCalendarWeeks(cursorYear, cursorMonth);
  const years = buildYearRange(cursorYear);

  /* ── Dropdown content ── */
  const dropdown = isOpen && !disabled ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className={`bg-white border border-gray-200 ${dropdownRoundedMap[rounded]} shadow-2xl overflow-hidden`}
    >
      {/* Header: nav */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-white">
        {view === "calendar" && (
          <>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); prevMonth(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setView("month"); }}
                className="text-sm font-semibold text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {MONTHS_ID[cursorMonth]}
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setView("year"); }}
                className="text-sm font-semibold text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {cursorYear}
              </button>
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); nextMonth(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        {view === "month" && (
          <>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setView("calendar"); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800">{cursorYear}</span>
            <div className="w-7" />
          </>
        )}
        {view === "year" && (
          <>
            <div className="w-7" />
            <span className="text-sm font-semibold text-gray-800">Pilih Tahun</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setView("calendar"); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="p-2.5">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ID.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                if (day === null) return <div key={di} />;
                const sel = isSelected(day);
                const tod = isToday(day);
                const dis = isDayDisabled(day);
                return (
                  <button
                    key={di}
                    type="button"
                    disabled={dis}
                    onMouseDown={(e) => { e.preventDefault(); if (!dis) handleSelectDay(day); }}
                    className={[
                      "w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-100",
                      dis
                        ? "text-gray-300 cursor-not-allowed"
                        : sel
                          ? "bg-mariner-600 text-white font-semibold shadow-sm cursor-pointer"
                          : tod
                            ? "text-mariner-600 font-semibold ring-1 ring-mariner-300 hover:bg-mariner-50 cursor-pointer"
                            : "text-gray-700 hover:bg-gray-100 cursor-pointer",
                    ].join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ))}
          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelectDay(today.getDate()); setCursorMonth(today.getMonth()); setCursorYear(today.getFullYear()); }}
              className="w-full text-xs text-mariner-600 font-medium py-1.5 rounded-lg hover:bg-mariner-50 transition-colors"
            >
              Hari ini
            </button>
          </div>
        </div>
      )}

      {/* Month picker */}
      {view === "month" && (
        <div className="p-2.5 grid grid-cols-3 gap-1.5">
          {MONTHS_ID.map((m, i) => (
            <button
              key={m}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setCursorMonth(i); setView("calendar"); }}
              className={[
                "py-2 text-sm rounded-lg transition-colors font-medium",
                cursorMonth === i
                  ? "bg-mariner-600 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Year picker */}
      {view === "year" && (
        <div
          ref={yearScrollRef}
          className="overflow-y-auto py-2"
          style={{ maxHeight: 240, scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {years.map((y) => (
            <button
              key={y}
              type="button"
              data-selected-year={y === cursorYear ? true : undefined}
              onMouseDown={(e) => { e.preventDefault(); setCursorYear(y); setView("month"); }}
              className={[
                "w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors",
                y === cursorYear
                  ? "bg-mariner-50 text-mariner-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {y}
              {y === cursorYear && <span className="w-1.5 h-1.5 rounded-full bg-mariner-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className={`relative ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={[
          fullWidth ? "w-full" : "",
          "pl-4 pr-10",
          sizeMap[selectSize],
          roundedMap[rounded],
          "border",
          error
            ? "border-red-500"
            : isOpen
              ? "border-mariner-500 ring-2 ring-mariner-500/20"
              : "border-gray-300",
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 cursor-pointer",
          "focus:outline-none transition-all duration-200",
          "text-left relative flex items-center gap-2",
        ].filter(Boolean).join(" ")}
      >
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
        <span className={`block truncate pr-2 text-sm flex-1 ${value ? "text-gray-800" : "text-gray-400"}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="absolute right-3 flex items-center gap-1 pointer-events-none">
          {value && !disabled && (
            <span
              className="pointer-events-auto"
              onMouseDown={(e) => { e.stopPropagation(); handleClear(e); }}
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
};

export default DatePicker;