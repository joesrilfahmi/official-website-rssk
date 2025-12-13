'use client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '@/components/ui/custom/badge';
import Button from '@/components/ui/custom/button';

// Data promo dummy
const promoImages = [
    {
        id: 1,
        src: '/mario.jpg',
        alt: 'Promo 1 - Diskon Check Up',
        title: 'Diskon 20% Medical Check Up',
    },
    {
        id: 2,
        src: '/mario.jpg',
        alt: 'Promo 2 - Paket Keluarga',
        title: 'Paket Kesehatan Keluarga',
    },
    {
        id: 3,
        src: '/mario.jpg',
        alt: 'Promo 3 - Vaksinasi',
        title: 'Program Vaksinasi Gratis',
    },
    {
        id: 4,
        src: '/mario.jpg',
        alt: 'Promo 4 - Konsultasi',
        title: 'Konsultasi Dokter Spesialis',
    },
];

const Hero: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fungsi untuk pindah ke slide berikutnya
    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % promoImages.length);
    }, []);

    // Auto-scroll carousel setiap 5 detik
    useEffect(() => {
        if (!isHovered && !isDragging) {
            const interval = setInterval(nextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [isHovered, isDragging, nextSlide]);

    // Fungsi untuk pindah ke slide tertentu
    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    // Touch/Mouse handlers untuk swipe
    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        setStartX(clientX);
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const diff = clientX - startX;
        setTranslateX(diff);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;
        if (translateX > threshold) {
            // Swipe right - previous slide
            setCurrentSlide((prev) => (prev - 1 + promoImages.length) % promoImages.length);
        } else if (translateX < -threshold) {
            // Swipe left - next slide
            setCurrentSlide((prev) => (prev + 1) % promoImages.length);
        }

        setTranslateX(0);
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            handleDragEnd();
        }
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    return (
        <div className="min-h-screen bg-easternblue-500 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
            {/* Purple Circle - Top Right */}
            <div className="absolute -top-64 -right-64 w-96 h-96 bg-blue-900 rounded-full opacity-80"></div>

            <div className='max-w-7xl mx-auto'>
                {/* Content */}
                <div className="relative z-10 container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12 items-center justify-center min-h-[calc(100vh-8rem)]">

                        <div className="space-y-8 w-full lg:w-1/2">
                            <Badge variant="default">
                                YOUR HEALTH IS OUR PRIORITY
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                    RS Siti Khodijah Muhammadiyah Cabang Sepanjang
                                </h1>
                            </div>

                            <p className="text-xl text-white/90 leading-relaxed max-w-xl">
                                Memilih rumah sakit yang tepat untuk kesehatan Anda dan keluarga merupakan keputusan yang sangat penting.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button variant="primary" size="lg" className='group'>
                                    Buat Janji
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button variant="outline" size="lg">
                                    Kontak Kami
                                </Button>
                            </div>
                        </div>

                        {/* Right Side - Carousel Promo Portrait dengan Swipe */}
                        <div
                            className="w-full lg:w-1/2 flex items-center justify-center"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => {
                                setIsHovered(false);
                                handleMouseLeave();
                            }}
                        >
                            <div className="relative w-full max-w-md">
                                {/* Modern decorative elements */}
                                <div className="absolute -inset-8 bg-linear-to-br from-white/20 via-white/10 to-transparent rounded-[2.5rem] backdrop-blur-md transform rotate-1 animate-pulse"></div>
                                <div className="absolute -inset-6 bg-linear-to-tl from-white/15 via-transparent to-white/10 rounded-[2.5rem] backdrop-blur-sm transform -rotate-1"></div>

                                {/* Main carousel container with modern frame */}
                                <div className="relative">
                                    {/* Outer glow effect */}
                                    <div className="absolute -inset-4 bg-linear-to-br from-white/40 via-white/20 to-white/30 rounded-4xl blur-xl"></div>

                                    {/* Main frame with premium border */}
                                    <div className="absolute -inset-2 bg-linear-to-br from-white via-white/95 to-white/90 rounded-4xl shadow-2xl"></div>

                                    {/* Main carousel area - Portrait aspect ratio */}
                                    <div
                                        ref={containerRef}
                                        className="relative rounded-[1.75rem] overflow-hidden shadow-2xl aspect-3/4 border-[6px] border-white cursor-grab active:cursor-grabbing select-none"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        {/* Carousel slides */}
                                        <div className="relative w-full h-full">
                                            {promoImages.map((promo, index) => (
                                                <div
                                                    key={promo.id}
                                                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide
                                                        ? 'opacity-100 translate-x-0'
                                                        : index < currentSlide
                                                            ? 'opacity-0 -translate-x-full'
                                                            : 'opacity-0 translate-x-full'
                                                        }`}
                                                    style={{
                                                        transform: isDragging && index === currentSlide
                                                            ? `translateX(${translateX}px)`
                                                            : undefined,
                                                        transition: isDragging ? 'none' : undefined
                                                    }}
                                                >
                                                    {/* Image */}
                                                    <Image
                                                        src={promo.src}
                                                        alt={promo.alt}
                                                        fill
                                                        className="object-cover pointer-events-none"
                                                        priority={index === 0}
                                                        draggable={false}
                                                    />

                                                    {/* Overlay dengan title promo - Modern gradient */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/85 via-black/60 to-transparent p-5 sm:p-7 pb-3 sm:pb-4">
                                                        <div className="flex items-start gap-3 mb-4">
                                                            <div className="w-1.5 h-16 sm:h-20 bg-linear-to-b from-white to-white/60 rounded-full shadow-lg"></div>
                                                            <div className="flex-1">
                                                                <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-wider uppercase block mb-2">
                                                                    Promo Spesial
                                                                </span>
                                                                <h3 className="text-white text-xl sm:text-2xl font-bold leading-tight mb-1">
                                                                    {promo.title}
                                                                </h3>
                                                                <p className="text-white/70 text-sm">Terbatas untuk Anda</p>
                                                            </div>
                                                        </div>

                                                        {/* Dots Indicator di dalam overlay - di bawah title */}
                                                        {index === currentSlide && (
                                                            <div className="flex justify-center gap-2.5 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full w-fit mx-auto border border-white/20 shadow-xl">
                                                                {promoImages.map((_, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => goToSlide(idx)}
                                                                        className={`transition-all duration-300 rounded-full ${idx === currentSlide
                                                                            ? 'bg-white w-10 h-3 shadow-lg'
                                                                            : 'bg-white/50 w-3 h-3 hover:bg-white/80 hover:scale-110'
                                                                            }`}
                                                                        aria-label={`Go to slide ${idx + 1}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Swipe hint indicator */}
                                        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                                            <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modern floating decorative elements - Enhanced */}
                                <div className="absolute -top-16 -right-16 w-48 h-48 bg-linear-to-br from-white/35 to-transparent rounded-full blur-3xl animate-pulse"></div>
                                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-linear-to-tl from-white/30 to-transparent rounded-full blur-3xl"></div>
                                <div className="absolute top-1/4 -right-10 w-28 h-28 bg-linear-to-br from-white/25 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                <div className="absolute bottom-1/3 -left-10 w-36 h-36 bg-linear-to-tl from-white/20 to-transparent rounded-full blur-2xl"></div>

                                {/* Premium accent elements - Multiple layers */}
                                <div className="absolute top-10 right-10 w-5 h-5 bg-white rounded-full shadow-2xl animate-pulse"></div>
                                <div className="absolute top-20 right-20 w-3 h-3 bg-white/70 rounded-full shadow-lg"></div>
                                <div className="absolute top-14 right-24 w-2 h-2 bg-white/50 rounded-full shadow-md"></div>

                                <div className="absolute bottom-20 right-12 w-4 h-4 bg-white/80 rounded-full shadow-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                                <div className="absolute bottom-28 right-16 w-2.5 h-2.5 bg-white/60 rounded-full shadow-lg"></div>

                                <div className="absolute top-24 left-10 w-3.5 h-3.5 bg-white/75 rounded-full shadow-lg"></div>
                                <div className="absolute top-32 left-16 w-2 h-2 bg-white/50 rounded-full shadow-md animate-pulse" style={{ animationDelay: '1.5s' }}></div>

                                <div className="absolute bottom-32 left-14 w-5 h-5 bg-white/85 rounded-full shadow-xl"></div>
                                <div className="absolute bottom-40 left-8 w-2.5 h-2.5 bg-white/60 rounded-full shadow-md"></div>

                                {/* Corner accent lines - Enhanced with gradient */}
                                <div className="absolute top-0 right-0 w-24 h-24 border-r-[3px] border-t-[3px] border-white/40 rounded-tr-4xl"></div>
                                <div className="absolute top-2 right-2 w-20 h-20 border-r-2 border-t-2 border-white/20 rounded-tr-3xl"></div>

                                <div className="absolute bottom-0 left-0 w-24 h-24 border-l-[3px] border-b-[3px] border-white/40 rounded-bl-4xl"></div>
                                <div className="absolute bottom-2 left-2 w-20 h-20 border-l-2 border-b-2 border-white/20 rounded-bl-3xl"></div>

                                {/* Diagonal decorative lines */}
                                <div className="absolute top-1/4 right-0 w-16 h-0.5 bg-linear-to-l from-white/40 to-transparent rotate-45 shadow-lg"></div>
                                <div className="absolute bottom-1/4 left-0 w-16 h-0.5 bg-linear-to-r from-white/40 to-transparent -rotate-45 shadow-lg"></div>

                                {/* Premium badge accent */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 shadow-xl">
                                    <span className="text-white text-xs font-semibold tracking-wide">PROMO TERBARU</span>
                                </div>

                                {/* Side accent bars */}
                                <div className="absolute top-1/3 -left-1 w-1 h-20 bg-linear-to-b from-white/50 via-white/30 to-transparent rounded-full shadow-lg"></div>
                                <div className="absolute bottom-1/3 -right-1 w-1 h-20 bg-linear-to-t from-white/50 via-white/30 to-transparent rounded-full shadow-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
    );
};

export default Hero;