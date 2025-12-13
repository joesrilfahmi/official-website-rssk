// app/components/layout/navbar.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogIn } from 'lucide-react';
import Button from '../ui/custom/button';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const navItems = useMemo(() => [
        { label: 'Beranda', href: '/sections/home' },
        { label: 'Rumah Sakit', href: '/sections/rumah-sakit' },
        { label: 'Dokter', href: '/sections/dokter' },
        { label: 'Blog', href: '/sections/blog' },
        { label: 'Layanan Unggulan', href: '/sections/layanan-unggulan' },
        { label: 'Informasi', href: '/sections/informasi' },
        { label: 'Kontak', href: '/sections/kontak' }
    ], []);

    // Deteksi halaman yang memiliki hero section
    const hasHeroSection = pathname === '/sections/home';

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
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${shouldUseDarkText
                ? 'bg-white shadow-md'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <button
                            onClick={() => handleNavClick('/sections/home')}
                            className="flex items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white relative">
                                <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none">
                                    <circle cx="50" cy="50" r="48" fill="#FDB714" />
                                    <circle cx="50" cy="50" r="30" fill="#0D5C75" />
                                    <g transform="translate(50, 50)">
                                        <circle cx="0" cy="-18" r="3" fill="#FDB714" />
                                        <circle cx="0" cy="18" r="3" fill="#FDB714" />
                                        <circle cx="-18" cy="0" r="3" fill="#FDB714" />
                                        <circle cx="18" cy="0" r="3" fill="#FDB714" />
                                        <circle cx="-13" cy="-13" r="3" fill="#FDB714" />
                                        <circle cx="13" cy="-13" r="3" fill="#FDB714" />
                                        <circle cx="-13" cy="13" r="3" fill="#FDB714" />
                                        <circle cx="13" cy="13" r="3" fill="#FDB714" />
                                    </g>
                                </svg>
                            </div>
                            <div className={`transition-colors duration-300 ${shouldUseDarkText ? 'text-gray-800' : 'text-white'
                                }`}>
                                <div className="text-xs font-semibold tracking-wider uppercase">Rumah Sakit</div>
                                <div className="text-base font-bold tracking-wide">SITI KHODIJAH</div>
                            </div>
                        </button>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            {navItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleNavClick(item.href)}
                                    className={`transition-colors duration-300 flex items-center gap-1 text-sm font-medium relative pb-1 ${shouldUseDarkText
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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-white z-40 overflow-y-auto">
                    {/* Spacer untuk navbar fixed */}
                    <div className="h-20"></div>

                    <div className="flex flex-col px-6 py-8 gap-4">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleNavClick(item.href)}
                                className="text-gray-800 text-xl font-semibold hover:text-orange-500 transition-colors duration-200 py-3 border-b border-gray-100 text-left w-full"
                            >
                                <span className="inline-block relative pb-1">
                                    {item.label}
                                    {activePage === item.label && (
                                        <div className="absolute -bottom-1 left-0 w-2 h-2 bg-orange-500 rounded-full"></div>
                                    )}
                                </span>
                            </button>
                        ))}
                        <div className="mt-4">
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