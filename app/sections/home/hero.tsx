'use client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '@/components/ui/custom/badge';
import Button from '@/components/ui/custom/button';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/config/profile';


interface Promo {
    id: string;
    picture: string | null;
    title: string;
    description: string;
    status: string;
    created_at: string;
}

const Hero: React.FC = () => {
    const [promoImages, setPromoImages] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch active promos from Supabase
    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const { data, error } = await supabase
                    .from('promo')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setPromoImages(data || []);
            } catch (error) {
                console.error('Error fetching promos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromos();

        // Real-time subscription for promo changes
        const channel = supabase
            .channel('promo_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'promo' },
                () => {
                    fetchPromos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fungsi untuk pindah ke slide berikutnya
    const nextSlide = useCallback(() => {
        if (promoImages.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % promoImages.length);
        }
    }, [promoImages.length]);

    // Auto-scroll carousel setiap 5 detik
    useEffect(() => {
        if (!isHovered && !isDragging && promoImages.length > 1) {
            const interval = setInterval(nextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [isHovered, isDragging, nextSlide, promoImages.length]);

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
            setCurrentSlide((prev) => (prev - 1 + promoImages.length) % promoImages.length);
        } else if (translateX < -threshold) {
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
        <div id="hero" className="min-h-screen bg-easternblue-500 relative overflow-hidden pt-32 pb-16 px-4 sm:px-6 lg:px-8">
            {/* Purple Circle - Top Right */}
            <div className="absolute -top-64 -right-64 w-96 h-96 bg-blue-900 rounded-full opacity-80"></div>

            <div className='max-w-7xl mx-auto'>
                {/* Content */}
                <div className="relative z-10 container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12 items-center justify-center min-h-[calc(100vh-12rem)]">

                        <div className="space-y-8 w-full lg:w-1/2">
                            <Badge variant="default">
                                YOUR HEALTH IS OUR PRIORITY
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                    RS {Profile.name}
                                </h1>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                    {Profile.subtitle}
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
                                        {/* Loading State */}
                                        {loading && (
                                            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                                <div className="text-gray-400 text-lg">Loading...</div>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {!loading && promoImages.length === 0 && (
                                            <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
                                                <div className="text-center">
                                                    <div className="text-gray-400 text-lg font-semibold mb-2">
                                                        Tidak Ada Promo
                                                    </div>
                                                    <div className="text-gray-500 text-sm">
                                                        Belum ada promo aktif saat ini
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Carousel slides */}
                                        {!loading && promoImages.length > 0 && (
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
                                                        {promo.picture ? (
                                                            <Image
                                                                src={promo.picture}
                                                                alt={promo.title}
                                                                fill
                                                                className="object-cover pointer-events-none"
                                                                priority={index === 0}
                                                                draggable={false}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-linear-to-br from-easternblue-400 to-easternblue-600 flex items-center justify-center">
                                                                <div className="text-white text-6xl font-bold opacity-20">
                                                                    No Image
                                                                </div>
                                                            </div>
                                                        )}

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
                                                                    <p className="text-white/70 text-sm line-clamp-2">
                                                                        {promo.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Dots Indicator di dalam overlay - di bawah title */}
                                                            {index === currentSlide && promoImages.length > 1 && (
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
                                        )}

                                        {/* Swipe hint indicator */}
                                        {promoImages.length > 1 && (
                                            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                                                <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modern floating decorative elements - Enhanced */}
                                <div className="absolute -top-16 -right-16 w-48 h-48 bg-linear-to-br from-white/35 to-transparent rounded-full blur-3xl animate-pulse"></div>
                                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-linear-to-tl from-white/30 to-transparent rounded-full blur-3xl"></div>
                                <div className="absolute top-1/4 -right-10 w-28 h-28 bg-linear-to-br from-white/25 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                <div className="absolute bottom-1/3 -left-10 w-36 h-36 bg-linear-to-tl from-white/20 to-transparent rounded-full blur-2xl"></div>

                                {/* Corner accent lines - Enhanced with gradient */}
                                <div className="absolute top-0 right-0 w-24 h-24 border-r-[3px] border-t-[3px] border-white/40 rounded-tr-4xl"></div>
                                <div className="absolute top-2 right-2 w-20 h-20 border-r-2 border-t-2 border-white/20 rounded-tr-3xl"></div>

                                <div className="absolute bottom-0 left-0 w-24 h-24 border-l-[3px] border-b-[3px] border-white/40 rounded-bl-4xl"></div>
                                <div className="absolute bottom-2 left-2 w-20 h-20 border-l-2 border-b-2 border-white/20 rounded-bl-3xl"></div>

                                {/* Diagonal decorative lines */}
                                <div className="absolute top-1/4 right-0 w-16 h-0.5 bg-linear-to-l from-white/40 to-transparent rotate-45 shadow-lg"></div>
                                <div className="absolute bottom-1/4 left-0 w-16 h-0.5 bg-linear-to-r from-white/40 to-transparent -rotate-45 shadow-lg"></div>

                                {/* Premium badge accent */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-greenfresh-500/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-greenfresh-500/30 shadow-xl">
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