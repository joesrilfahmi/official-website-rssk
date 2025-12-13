'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';

interface Review {
    id: string;
    name: string;
    review: string;
}

const DUMMY_REVIEWS: Review[] = [
    {
        id: '1',
        name: 'Win Winarto',
        review: 'Saya sangat puas dengan pelayanan di pav Multazam, perawat nya ramah ramah, saya minta pulang pagi dengan suster nya langsung dijelaskan pengurusan berkas nya'
    },
    {
        id: '2',
        name: 'Aam Amrullah',
        review: 'Alhamdulillah terimakasih untuk tim medis RS Siti Khadijah khususnya lantai 3 pav Jabal Rahmah atas perawatan selama ibuk saya opname memberikan pelayanan terbaik di dibantu dengan sangat ramah. Alhamdulillah ibuk skrang sudah rawat jalan. Jazakallah khairan'
    },
    {
        id: '3',
        name: 'Dici Rohmah',
        review: 'Alhamdulillah kemarin September melahirkan SC ditangani dr amik yuliati Spog yang super ramah dan baik hati!🥰'
    },
    {
        id: '4',
        name: 'Ahmad Fauzi',
        review: 'Pelayanan yang sangat memuaskan, dokter dan perawat sangat profesional. Fasilitasnya juga lengkap dan modern. Terima kasih RS Siti Khadijah!'
    },
    {
        id: '5',
        name: 'Siti Nurhaliza',
        review: 'RS Siti Khadijah sangat recommended! Pelayanannya cepat, staf medis ramah, dan ruangan bersih. Alhamdulillah proses persalinan saya lancar.'
    },
    {
        id: '6',
        name: 'Budi Santoso',
        review: 'Pengalaman berobat di sini sangat menyenangkan. Dokter yang menangani sangat teliti dan sabar menjelaskan kondisi kesehatan. Sukses terus RS Siti Khadijah!'
    }
];

export default function ReviewSection() {
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

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const renderReviewCard = (review: Review) => {
        return (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {/* Quote Icon */}
                <div className="mb-4">
                    <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-mariner-500" />
                </div>

                {/* Review Text */}
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6 grow">
                    {review.review}
                </p>

                {/* Divider */}
                <div className="w-full h-0.5 bg-greenfresh-500 to-transparent mb-6"></div>

                {/* Reviewer Info */}
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-mariner-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
                        {review.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div>
                        <h4 className="font-semibold text-mariner-500 text-base sm:text-lg">
                            {review.name}
                        </h4>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 sm:mb-16">
                    <Title
                        badge="ULASAN"
                        title="Review Kami"
                        badgeVariant="default"
                        containerClassName="items-center"
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="-mx-4 px-4">
                        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] animate-pulse"
                                >
                                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
                                        <div className="h-10 w-10 bg-gray-200 rounded mb-4"></div>
                                        <div className="space-y-2 mb-6">
                                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-0.5 w-full bg-gray-200 rounded mb-6"></div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
                                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content - Carousel */}
                {!loading && (
                    <>
                        {/* Carousel Container */}
                        <div className="-mx-4">
                            <div className="overflow-hidden px-4" ref={emblaRef}>
                                <div className="flex gap-4 md:gap-6">
                                    {DUMMY_REVIEWS.map((review) => (
                                        <div
                                            key={review.id}
                                            className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                                        >
                                            {renderReviewCard(review)}
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
        </section>
    );
}