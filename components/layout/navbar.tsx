// app/components/layout/navbar.tsx
"use client";
import { Profile } from "@/config/profile";
import { LogIn, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/custom/button";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Beranda", href: "/" },
      { label: "Rumah Sakit", href: "/sections/rumah-sakit" },
      { label: "Dokter", href: "/sections/dokter" },
      { label: "Blog", href: "/sections/blog" },
      { label: "Layanan Unggulan", href: "/sections/layanan-unggulan" },
      { label: "Informasi", href: "/sections/home/kamar-inap/informasi" },
      { label: "Formulir", href: "/sections/formulir" },
      { label: "Kritik & Saran", href: "/sections/kritik-saran" },
      { label: "Kontak", href: "/sections/kontak" },
    ],
    [],
  );

  const hasHeroSection = pathname === "/";

  const activePage = useMemo(() => {
    const currentItem = navItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Beranda";
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

  const shouldUseDarkText = isScrolled || isMenuOpen;

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };
  const handleLoginClick = () => {
    router.push("/login");
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-70 transition-all duration-300 px-4 sm:px-6
        ${
          shouldUseDarkText
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto">
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
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.href)}
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
              ))}

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

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-60 overflow-y-auto">
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
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <div className="px-4 sm:px-6 py-6 space-y-1">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item.href)}
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
            ))}
          </div>

          <div className="px-4 sm:px-6 pt-2 pb-8">
            <div className="h-px bg-gray-100 mb-6" />
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
