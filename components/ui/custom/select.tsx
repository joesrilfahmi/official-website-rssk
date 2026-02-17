import {
  Check,
  ChevronDown,
  Loader2,
  LucideIcon,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
  maxHeight = "320px",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const sizeClasses = {
    sm: "py-2 text-sm",
    md: "py-3 text-base",
    lg: "py-4 text-lg",
  };

  const dropdownRoundedClasses = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    full: "rounded-2xl",
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase().trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions =
    searchable && debouncedSearch
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(debouncedSearch),
        )
      : options;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
      ref={dropdownRef}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          ${fullWidth ? "w-full" : ""}
          ${Icon ? "pl-12" : "pl-4"}
          pr-10
          ${sizeClasses[selectSize]}
          ${roundedClasses[rounded]}
          border
          ${error ? "border-red-500" : "border-gray-300"}
          ${disabled || loading ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"}
          focus:outline-none focus:ring-2 focus:ring-mariner-500
          transition-all duration-200
          text-left relative flex items-center
        `}
      >
        {Icon && (
          <Icon className="absolute left-4 text-gray-400 w-5 h-5 shrink-0 pointer-events-none" />
        )}
        <span
          className={`block truncate pr-2 ${
            selectedOption ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {loading
            ? "Memuat..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>
        <div className="absolute right-4 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          )}
        </div>
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !loading && !disabled && (
        <div
          className={`
            absolute z-50 w-full mt-2 bg-white border border-gray-200
            ${dropdownRoundedClasses[rounded]}
            shadow-lg overflow-hidden
          `}
          style={{ maxHeight }}
        >
          {searchable && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`
                    w-full pl-10 pr-8 py-2 border border-gray-300
                    ${roundedClasses[rounded === "full" ? "lg" : rounded]}
                    focus:outline-none focus:ring-2 focus:ring-mariner-500
                    text-sm
                  `}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            className="py-1 overflow-y-hidden"
            style={{ maxHeight: searchable ? "256px" : "280px" }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                <p>Tidak ada hasil</p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                const isDisabled = option.disabled;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors
                      flex items-center justify-between
                      ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                      ${
                        isSelected
                          ? "bg-mariner-50 text-mariner-700 font-medium"
                          : isDisabled
                            ? "text-gray-400"
                            : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="truncate pr-2">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-mariner-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
