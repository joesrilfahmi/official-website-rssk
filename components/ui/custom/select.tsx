// app/components/ui/custom/select.tsx

import {
  Check,
  ChevronDown,
  Loader2,
  LucideIcon,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  selectSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  required?: boolean;
  maxHeight?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Pilih opsi",
  value,
  onChange,
  options,
  error,
  helperText,
  icon: Icon,
  searchable = false,
  disabled = false,
  loading = false,
  rounded = "xl",
  selectSize = "md",
  fullWidth = true,
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    display: "none",
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── style maps ── */
  const roundedMap: Record<string, string> = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  const sizeMap: Record<string, string> = {
    sm: "py-2 text-sm",
    md: "py-3 text-base",
    lg: "py-4 text-lg",
  };
  const dropdownRoundedMap: Record<string, string> = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-2xl",
  };

  /* ── compute & update fixed position ── */
  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: "fixed",
      left: r.left,
      width: r.width,
      zIndex: 99999,
      ...(openUp
        ? { bottom: window.innerHeight - r.top + 4 }
        : { top: r.bottom + 4 }),
    });
  };

  /* ── on open: compute position, attach scroll+resize to keep it in sync ── */
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    // Update position on every scroll (any container) and resize
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  /* ── auto-focus search ── */
  useEffect(() => {
    if (isOpen && searchable) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen, searchable]);

  /* ── debounce ── */
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(searchQuery.toLowerCase().trim()),
      200,
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ── close on outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t) || dropdownRef.current?.contains(t))
        return;
      setIsOpen(false);
      setSearchQuery("");
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen]);

  /* ── close on Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const filteredOptions =
    searchable && debouncedSearch
      ? options.filter((o) => o.label.toLowerCase().includes(debouncedSearch))
      : options;

  const selectedOption = options.find((o) => o.value === value);

  const handleOpen = () => {
    if (disabled || loading) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  /* ── portal dropdown ── */
  const dropdown =
    isOpen && !loading && !disabled ? (
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className={`bg-white border border-gray-200 ${dropdownRoundedMap[rounded]} shadow-2xl`}
      >
        {/* Search bar */}
        {searchable && (
          <div className="p-2.5 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                autoComplete="off"
                onChange={(e) => setSearchQuery(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className={[
                  "w-full pl-9 pr-8 py-2",
                  "border border-gray-300",
                  roundedMap[rounded === "full" ? "lg" : rounded],
                  "text-sm text-gray-800 placeholder:text-gray-400 bg-white",
                  "focus:outline-none focus:ring-2 focus:ring-mariner-500 focus:border-mariner-500",
                  "transition-all duration-150",
                ].join(" ")}
              />
              {searchQuery && (
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Options — fade-masked elegant scroll */}
        <div className="relative">
          {/* top fade mask */}
          <div
            className="pointer-events-none absolute top-0 inset-x-0 h-5 z-10"
            style={{
              background:
                "linear-gradient(to bottom, white 0%, transparent 100%)",
            }}
          />
          {/* bottom fade mask */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-8 z-10"
            style={{
              background: "linear-gradient(to top, white 0%, transparent 100%)",
            }}
          />

          <div
            className="overflow-y-auto py-2"
            style={{
              maxHeight: "240px",
              scrollbarWidth: "none" /* Firefox */,
              msOverflowStyle: "none" /* IE/Edge */,
            }}
            onScroll={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* hide webkit scrollbar via inline style trick */}
            <style>{`.select-list::-webkit-scrollbar { display: none; }`}</style>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                Tidak ada hasil
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                const isDisabled = option.disabled;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isDisabled}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDisabled) handleSelect(option.value);
                    }}
                    className={[
                      "w-full px-4 py-2.5 text-left text-sm",
                      "flex items-center justify-between gap-2",
                      "transition-colors duration-100",
                      isDisabled
                        ? "cursor-not-allowed opacity-40 text-gray-400"
                        : isSelected
                          ? "bg-mariner-50 text-mariner-700 font-medium cursor-pointer"
                          : "text-gray-700 hover:bg-gray-50 cursor-pointer",
                    ].join(" ")}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-mariner-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
    >
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
        disabled={disabled || loading}
        className={[
          fullWidth ? "w-full" : "",
          Icon ? "pl-12" : "pl-4",
          "pr-10",
          sizeMap[selectSize],
          roundedMap[rounded],
          "border",
          error
            ? "border-red-500"
            : isOpen
              ? "border-mariner-500 ring-2 ring-mariner-500/20"
              : "border-gray-300",
          disabled || loading
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 cursor-pointer",
          "focus:outline-none transition-all duration-200",
          "text-left relative flex items-center",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {Icon && (
          <Icon className="absolute left-4 text-gray-400 w-5 h-5 shrink-0 pointer-events-none" />
        )}
        <span
          className={`block truncate pr-2 text-sm ${selectedOption ? "text-gray-800" : "text-gray-400"}`}
        >
          {loading
            ? "Memuat..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>
        <span className="absolute right-4 pointer-events-none flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
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

export default Select;
