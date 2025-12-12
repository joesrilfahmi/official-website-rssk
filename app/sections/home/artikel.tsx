'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';

interface Article {
    id: number;
    date: string;
    title: string;
    image?: string;
}

const articles: Article[] = [
    {
        id: 1,
        date: "January 12, 2024",
        title: "Baksos RS Siti Khodijah"
    },
    {
        id: 2,
        date: "January 13, 2024",
        title: "Medical Check Up Perusahaan"
    },
    {
        id: 3,
        date: "January 14, 2024",
        title: "MILAD Ke 57"
    },
    {
        id: 4,
        date: "January 15, 2024",
        title: "Tips Menjaga Kesehatan Jantung"
    },
    {
        id: 5,
        date: "January 16, 2024",
        title: "Pentingnya Pemeriksaan Rutin"
    }
];

export default function HealthArticles() {
    // Embla Carousel setup
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: true,
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback((api: typeof emblaApi) => {
        if (!api) return;
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        const handleSelect = () => onSelect(emblaApi);
        const handleReInit = () => onSelect(emblaApi);

        emblaApi.on('select', handleSelect);
        emblaApi.on('reInit', handleReInit);

        requestAnimationFrame(() => {
            onSelect(emblaApi);
        });

        return () => {
            emblaApi.off('select', handleSelect);
            emblaApi.off('reInit', handleReInit);
        };
    }, [emblaApi, onSelect]);

    const renderArticleCard = (article: Article, index: number) => {
        return (
            <div className="h-full">
                {/* Article Number */}
                <div className="text-7xl sm:text-8xl font-bold text-gray-100 leading-none mb-3">
                    {String(index + 1).padStart(2, '0')}
                </div>

                {/* Date */}
                <div className="text-bittersweet-500 text-sm font-medium mb-3">
                    {article.date}
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 h-14 sm:h-16 line-clamp-2 flex items-start">
                    <span className="line-clamp-2">{article.title}</span>
                </h3>

                {/* Image Placeholder */}
                <div
                    className="relative bg-linear-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden group cursor-pointer"
                    style={{ aspectRatio: '4/3' }}
                >
                    <div className="absolute inset-0 bg-mariner-600/0 group-hover:bg-mariner-600/10 transition-all duration-300"></div>
                    <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-mariner-600 transition-all duration-300">
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-mariner-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="min-h-screen bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className='max-w-7xl mx-auto'>
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Content */}
                    <div className="lg:col-span-4 space-y-6">
                        <Title
                            badge="INFORMASI"
                            badgeVariant="default"
                            title="Artikel Kesehatan"
                            containerClassName=""
                        />
                        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                            Temukan berbagai informasi kesehatan terkini, tips hidup sehat, dan berita terbaru dari RS Siti Khodijah untuk mendukung kesejahteraan Anda dan keluarga.
                        </p>

                        <Button
                            variant="primary"
                            size="md"
                        >
                            Lihat Semua Artikel
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Right Content - Articles Carousel */}
                    <div className="lg:col-span-8">
                        {/* Desktop & Tablet: Show all or grid (lg and up) */}
                        <div className="hidden lg:grid grid-cols-3 gap-6 mb-8">
                            {articles.slice(0, 3).map((article, index) => (
                                <div key={article.id}>
                                    {renderArticleCard(article, index)}
                                </div>
                            ))}
                        </div>

                        {/* Mobile & Tablet: Carousel View (below lg breakpoint) */}
                        <div className="lg:hidden mb-8">
                            <div className="overflow-hidden" ref={emblaRef}>
                                <div className="flex gap-4 sm:gap-5 px-1">
                                    {articles.map((article, index) => (
                                        <div
                                            key={article.id}
                                            className="flex-[0_0_85%] sm:flex-[0_0_calc(50%-10px)] min-w-0"
                                        >
                                            {renderArticleCard(article, index)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons - Only show on mobile/tablet */}
                        <div className="flex gap-3">
                            <Button
                                variant='secondary'
                                size='sm'
                                onClick={scrollPrev}
                                disabled={!canScrollPrev}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Prev
                            </Button>
                            <Button
                                variant='secondary'
                                size='sm'
                                onClick={scrollNext}
                                disabled={!canScrollNext}
                            >
                                Next
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}