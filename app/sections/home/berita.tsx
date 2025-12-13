'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, ArrowUpRight, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface Berita {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    thumbnail: string | null;
    status: string;
    created_at: string;
}

export default function BeritaSection() {
    const [beritaList, setBeritaList] = useState<Berita[]>([]);
    const [loading, setLoading] = useState(true);

    // Embla Carousel - untuk semua ukuran layar
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: false,
        containScroll: 'trimSnaps',
    });

    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevBtnEnabled(emblaApi.canScrollPrev());
        setNextBtnEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const fetchBerita = async () => {
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                setBeritaList(data || []);
            } catch (error) {
                console.error('Error fetching berita:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBerita();

        // Real-time subscription
        const channel = supabase
            .channel('berita_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'berita' },
                () => {
                    fetchBerita();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('id-ID', options);
    };

    const renderBeritaCard = (berita: Berita, index: number) => {
        return (
            <Link href={`/berita/${berita.slug}`} className="block h-full">
                <div className="h-full flex flex-col">
                    {/* Berita Number */}
                    <div className="text-7xl sm:text-8xl font-bold text-gray-100 leading-none mb-3">
                        {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Date & Category */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="text-bittersweet-500 text-sm font-medium">
                            {formatDate(berita.created_at)}
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="text-mariner-500 text-sm font-medium capitalize">
                            {berita.category}
                        </div>
                    </div>

                    {/* Title - Fixed height with line clamp */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 line-clamp-2 min-h-14 sm:min-h-16">
                        {berita.title}
                    </h3>

                    {/* Image - Flex grow to fill remaining space */}
                    <div
                        className="relative bg-linear-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden group cursor-pointer grow"
                        style={{ minHeight: '200px' }}
                    >
                        {berita.thumbnail ? (
                            <Image
                                src={berita.thumbnail}
                                alt={berita.title}
                                fill
                                sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-mariner-600/0 group-hover:bg-mariner-600/10 transition-all duration-300"></div>
                        <div className="absolute bottom-4 left-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-mariner-600 transition-all duration-300">
                                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-mariner-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <section className="bg-white py-12 sm:py-16 lg:py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Content */}
                    <div className="lg:col-span-4 space-y-6">
                        <Title
                            badge="INFORMASI"
                            badgeVariant="default"
                            title="Berita Kesehatan"
                            containerClassName=""
                        />
                        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                            Temukan berbagai informasi kesehatan terkini, tips hidup sehat, dan berita terbaru dari RS Siti Khodijah untuk mendukung kesejahteraan Anda dan keluarga.
                        </p>

                        <Link href="/berita">
                            <Button
                                variant="primary"
                                size="md"
                            >
                                Lihat Semua Berita
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Right Content - Berita */}
                    <div className="lg:col-span-8">
                        {/* Loading State */}
                        {loading && (
                            <div className="-mx-4 px-4">
                                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] animate-pulse">
                                            <div className="h-20 w-20 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-6 w-full bg-gray-200 rounded mb-4"></div>
                                            <div className="w-full bg-gray-200 rounded-2xl" style={{ aspectRatio: '4/3' }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && beritaList.length === 0 && (
                            <div className="text-center py-12">
                                <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                                    <AlertCircle className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Belum Ada Berita
                                </h3>
                                <p className="text-gray-500">
                                    Berita kesehatan belum tersedia saat ini.
                                </p>
                            </div>
                        )}

                        {/* Content - Carousel for all screen sizes */}
                        {!loading && beritaList.length > 0 && (
                            <>
                                {/* Carousel Container */}
                                <div className="-mx-4">
                                    <div className="overflow-hidden px-4" ref={emblaRef}>
                                        <div className="flex gap-4 md:gap-6">
                                            {beritaList.map((berita, index) => (
                                                <div
                                                    key={berita.id}
                                                    className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                                                >
                                                    {renderBeritaCard(berita, index)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-3 mt-8">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={scrollPrev}
                                        disabled={!prevBtnEnabled}
                                        className={!prevBtnEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Prev
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={scrollNext}
                                        disabled={!nextBtnEnabled}
                                        className={!nextBtnEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}