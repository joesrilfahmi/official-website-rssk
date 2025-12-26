// app/components/layout/navbar.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogIn } from 'lucide-react';
import Button from '../ui/custom/button';
import { Profile } from '@/config/profile';
import Image from 'next/image';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const navItems = useMemo(() => [
        { label: 'Beranda', href: '/' },
        { label: 'Rumah Sakit', href: '/sections/rumah-sakit' },
        { label: 'Dokter', href: '/sections/dokter' },
        { label: 'Blog', href: '/sections/blog' },
        { label: 'Layanan Unggulan', href: '/sections/layanan-unggulan' },
        { label: 'Informasi', href: '/sections/home/kamar-inap/informasi' },
        { label: 'Kritik & Saran', href: '/sections/kritik-saran' }
    ], []);

    // Deteksi halaman yang memiliki hero section
    const hasHeroSection = pathname === '/';

    // Calculate active page from pathname
    const activePage = useMemo(() => {
        const currentItem = navItems.find(item => item.href === pathname);
        return currentItem ? currentItem.label : 'Beranda';
    }, [pathname, navItems]);

    useEffect(() => {
        const handleScroll = () => {
            if (hasHeroSection) {
                const heroSection = document.getElementById('hero');
                if (heroSection) {
                    const heroHeight = heroSection.offsetHeight;
                    setIsScrolled(window.scrollY > heroHeight - 100);
                } else {
                    setIsScrolled(window.scrollY > 500);
                }
            } else {
                setIsScrolled(true);
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasHeroSection]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const shouldUseDarkText = isScrolled || isMenuOpen;

    const handleNavClick = (href: string) => {
        router.push(href);
        setIsMenuOpen(false);
    };

    const handleLoginClick = () => {
        router.push('/login');
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Navbar - Fixed di atas */}
            <nav className={`fixed top-0 left-0 right-0 z-70 transition-all duration-300 px-4 sm:px-6 ${shouldUseDarkText
                ? 'bg-white'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo - Always visible */}
                        <button
                            onClick={() => handleNavClick('/')}
                            className="flex items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white relative">
                                <Image
                                    src={Profile.logo}
                                    alt={Profile.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                            <div className={`transition-colors duration-300 text-left ${shouldUseDarkText ? 'text-gray-800' : 'text-white'
                                }`}>
                                <div className="text-xs font-semibold tracking-wider uppercase">{Profile.institusi}</div>
                                <div className="text-base font-bold tracking-wide">{Profile.name}</div>
                            </div>
                        </button>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            {navItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleNavClick(item.href)}
                                    className={`transition-colors duration-300 flex items-center gap-1 text-sm font-medium relative pb-1 cursor-pointer ${shouldUseDarkText
                                        ? 'text-gray-800 hover:text-gray-600'
                                        : 'text-white hover:text-white/80'
                                        }`}
                                >
                                    <span>{item.label}</span>
                                    {activePage === item.label && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                    )}
                                </button>
                            ))}
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

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`lg:hidden p-2 rounded-lg transition-colors duration-300 ${shouldUseDarkText
                                ? 'text-gray-800 hover:bg-gray-100'
                                : 'text-white hover:bg-white/10'
                                }`}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay - Full screen covering navbar */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-white z-60 overflow-y-auto pt-20">
                    <div className="flex flex-col items-center px-6 py-8 gap-4 max-w-md mx-auto">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleNavClick(item.href)}
                                className="text-gray-800 text-xl font-semibold hover:text-orange-500 transition-colors duration-200 py-3 text-center w-full cursor-pointer"
                            >
                                <span className="inline-block relative pb-1">
                                    {item.label}
                                    {activePage === item.label && (
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full"></div>
                                    )}
                                </span>
                            </button>
                        ))}
                        <div className="mt-4 w-full max-w-30">
                            <Button
                                variant="primary"
                                size="md"
                                className="w-full justify-center"
                                onClick={handleLoginClick}
                            >
                                <LogIn className="w-5 h-5" />
                                <span>Login</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}