// app/components/layout/navbar.tsx
"use client";
import { Profile } from "@/config/profile";
import { ChevronDown, LogIn, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../ui/custom/button";

/* ─────────────────────────────────────────
   TYPE DEFINITIONS
───────────────────────────────────────── */
interface NavItem {
  label: string;
  href?: string;
  dropdown?: { label: string; href: string }[];
}

/* ─────────────────────────────────────────
   DROPDOWN COMPONENT
───────────────────────────────────────── */
interface DropdownMenuProps {
  items: { label: string; href: string }[];
  isScrolled: boolean;
  onNavigate: (href: string) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, onNavigate }) => (
  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-80">
    <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden min-w-[180px] py-1">
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => onNavigate(item.href)}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN NAVBAR
───────────────────────────────────────── */
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bersihkan nomor telepon agar valid untuk link tel:
  const telHref = `tel:${Profile.phone.replace(/[^\d+]/g, "")}`;

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Beranda", href: "/" },
      { label: "Rumah Sakit", href: "/rumah-sakit" },
      { label: "Dokter", href: "/jadwal" },
      {
        label: "Informasi",
        dropdown: [
          { label: "Blog", href: "/blog" },
          { label: "Formulir", href: "/formulir" },
          { label: "Kamar Inap", href: "/kamar-inap/informasi" },
          { label: "Klinik Spesialis", href: "/klinik-spesialis" },
          { label: "Layanan Unggulan", href: "/layanan" },
          { label: "Indikator Mutu", href: "/indikator-mutu" },
        ],
      },
      {
        label: "Pendaftaran",
        href: "https://app.e-rssk.com/",
      },
      { label: "Kritik & Saran", href: "/feedback-qr-code" },
      { label: "Kontak", href: "/kontak" },
    ],
    [],
  );

  const hasHeroSection = pathname === "/";

  const activePage = useMemo(() => {
    for (const item of navItems) {
      if (item.href && item.href === pathname) return item.label;
      if (item.dropdown) {
        for (const sub of item.dropdown) {
          if (sub.href === pathname) return item.label;
        }
      }
    }
    return "Beranda";
  }, [pathname, navItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (hasHeroSection) {
        const heroSection = document.getElementById("hero");
        if (heroSection) {
          setIsScrolled(window.scrollY > heroSection.offsetHeight - 100);
        } else {
          setIsScrolled(window.scrollY > 500);
        }
      } else {
        setIsScrolled(true);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasHeroSection]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shouldUseDarkText = isScrolled || isMenuOpen;

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleLoginClick = () => {
    router.push("/login");
    setIsMenuOpen(false);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  const toggleMobileDropdown = (label: string) => {
    setOpenMobileDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-70 transition-all duration-300
        ${
          shouldUseDarkText
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        {/* Top bar: alamat & kontak (semua ukuran layar, selalu tampil) */}
        <div className="bg-mariner-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-6 text-[11px] sm:text-xs">
            {/* Alamat: disembunyikan di mobile (tampil lengkap di menu) */}
            <div className="hidden md:flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{Profile.address}</span>
            </div>

            {/* Kontak */}
            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-5 w-full md:w-auto min-w-0">
              <a
                href={telHref}
                className="flex items-center gap-1.5 shrink-0 hover:text-white/80 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{Profile.phone}</span>
              </a>
              <a
                href={`mailto:${Profile.email}`}
                className="flex items-center gap-1.5 min-w-0 hover:text-white/80 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{Profile.email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Navbar utama */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={dropdownRef}>
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="w-10 h-10 overflow-hidden bg-white rounded-full shadow-sm flex items-center justify-center">
                <Image
                  src={Profile.logo}
                  alt={Profile.name}
                  width={40}
                  height={40}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div
                className={`transition-colors duration-300 text-left ${shouldUseDarkText ? "text-gray-800" : "text-white"}`}
              >
                <div className="text-[11px] font-semibold tracking-widest uppercase opacity-70 leading-none mb-0.5">
                  {Profile.institusi}
                </div>
                <div className="text-sm font-extrabold tracking-wide leading-none">
                  {Profile.name}
                </div>
              </div>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => {
                if (item.dropdown) {
                  const isOpen = openDropdown === item.label;
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`relative inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                          ${
                            shouldUseDarkText
                              ? "text-gray-800 hover:text-gray-600"
                              : "text-white hover:text-white/80"
                          }
                          ${activePage === item.label ? "font-semibold" : ""}
                        `}
                      >
                        {item.label}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                        {activePage === item.label && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                      </button>

                      {isOpen && (
                        <DropdownMenu
                          items={item.dropdown}
                          isScrolled={shouldUseDarkText}
                          onNavigate={handleNavClick}
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.href!)}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                      ${
                        shouldUseDarkText
                          ? "text-gray-800 hover:text-gray-600"
                          : "text-white hover:text-white/80"
                      }`}
                  >
                    {item.label}
                    {activePage === item.label && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                );
              })}

              <div className="ml-3 pl-3 border-l border-gray-200/40">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleLoginClick}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors duration-200
                ${shouldUseDarkText ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
              aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay (pt-10 = tinggi top bar, agar konten tidak tertutup navbar) */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-60 overflow-y-auto pt-10">
          {/* Header strip */}
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 border-b border-gray-100">
            <button
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-mariner-50 flex items-center justify-center">
                <Image
                  src={Profile.logo}
                  alt={Profile.name}
                  width={40}
                  height={40}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider leading-none">
                  {Profile.institusi}
                </p>
                <p className="text-sm font-extrabold text-gray-800">
                  {Profile.name}
                </p>
              </div>
            </button>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <div className="px-4 sm:px-6 py-6 space-y-1">
            {navItems.map((item, index) => {
              if (item.dropdown) {
                const isOpen = openMobileDropdown === item.label;
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleMobileDropdown(item.label)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-between
                        ${
                          activePage === item.label
                            ? "text-orange-500 bg-orange-50 font-semibold"
                            : "text-gray-800 hover:text-orange-500"
                        }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Mobile sub-items */}
                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.dropdown.map((sub) => (
                          <button
                            key={sub.href}
                            onClick={() => handleNavClick(sub.href)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                              ${
                                pathname === sub.href
                                  ? "text-orange-500 bg-orange-50 font-semibold"
                                  : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                              }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.href!)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-between
                    ${
                      activePage === item.label
                        ? "text-orange-500 bg-orange-50 font-semibold"
                        : "text-gray-800 hover:text-orange-500"
                    }`}
                >
                  {item.label}
                  {activePage === item.label && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-4 sm:px-6 pt-2 pb-8">
            <div className="h-px bg-gray-100 mb-6" />

            {/* Alamat & kontak lengkap (mobile) */}
            <div className="mb-6 space-y-3 rounded-xl bg-mariner-50 p-4 text-sm text-gray-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-mariner-500" />
                <span>{Profile.address}</span>
              </div>
              <a href={telHref} className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-mariner-500" />
                <span>{Profile.phone}</span>
              </a>
              <a
                href={`mailto:${Profile.email}`}
                className="flex items-center gap-2.5 break-all"
              >
                <Mail className="w-4 h-4 shrink-0 text-mariner-500" />
                <span>{Profile.email}</span>
              </a>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center gap-2"
              onClick={handleLoginClick}
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
