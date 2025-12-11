// app/sections/home/kamar-inap.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight, CheckCircle2, Bed } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';
import { KamarInap as KamarInapType } from '@/types/index';
import Link from 'next/link';

const KamarInap = () => {
    const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
    const [loading, setLoading] = useState(true);

    // Embla Carousel - untuk mobile (tanpa loop dan navigation buttons)
    const [emblaRef] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: true,
    });

    // Sort kamar: recommended di tengah
    const sortedKamarList = useMemo(() => {
        if (kamarList.length === 0) return [];

        const recommended = kamarList.filter(k => k.is_recommended);
        const notRecommended = kamarList.filter(k => !k.is_recommended);

        // Jika ada recommended, taruh di tengah
        if (recommended.length > 0) {
            if (notRecommended.length === 0) {
                return recommended;
            } else if (notRecommended.length === 1) {
                return [notRecommended[0], ...recommended];
            } else {
                // Taruh recommended di tengah
                return [notRecommended[0], ...recommended, ...notRecommended.slice(1)];
            }
        }

        return kamarList;
    }, [kamarList]);

    useEffect(() => {
        const fetchKamar = async () => {
            try {
                const { data, error } = await supabase
                    .from('kamar_inap')
                    .select('*')
                    .limit(3);

                if (error) throw error;

                setKamarList(data || []);
            } catch (error) {
                console.error('Error fetching kamar:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchKamar();

        // Real-time subscription
        const channel = supabase
            .channel('kamar_inap_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'kamar_inap' },
                () => {
                    fetchKamar();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price).replace('IDR', 'Rp');
    };

    const renderKamarCard = (kamar: KamarInapType, isMobile: boolean = false) => (
        <div
            className={`bg-white rounded-2xl border-2 p-6 ${isMobile ? '' : 'sm:p-8'} hover:shadow-xl transition-all duration-300 group ${kamar.is_recommended
                    ? 'border-mariner-400 shadow-lg relative'
                    : 'border-gray-200'
                } h-full`}
        >
            {/* Recommended Badge */}
            {kamar.is_recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-teal-400 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                        <span>Disarankan</span>
                    </div>
                </div>
            )}

            {/* Room Name */}
            <h3 className={`${isMobile ? 'text-xl' : 'text-xl sm:text-2xl'} font-bold text-mariner-500 mb-2`}>
                {kamar.title}
            </h3>

            {/* Recommendation Text (if recommended) */}
            {kamar.is_recommended && (
                <p className={`text-teal-500 ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium mb-3`}>
                    (Recommended)
                </p>
            )}

            {/* Description */}
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'} leading-relaxed mb-6`}>
                {kamar.description}
            </p>

            {/* Price */}
            <div className="mb-6">
                <p className={`${isMobile ? 'text-3xl' : 'text-3xl sm:text-4xl'} font-bold text-mariner-500`}>
                    {formatPrice(kamar.price)}
                </p>
            </div>

            {/* Facilities Title */}
            <h4 className={`text-mariner-500 font-semibold ${isMobile ? 'text-sm' : 'text-sm sm:text-base'} mb-4`}>
                Fasilitas
            </h4>

            {/* Facilities List */}
            <div className="space-y-3 mb-6">
                {kamar.facilities && kamar.facilities.map((facility: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                        <span className={`text-gray-700 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}>
                            {facility}
                        </span>
                    </div>
                ))}
            </div>

            {/* Details Button */}
            <Button
                variant='outline'
                size="sm"
                className="w-full mb-3 border-bittersweet-400 text-bittersweet-500 hover:bg-bittersweet-50"
            >
                Lihat Selengkapnya
                <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
            </Button>

            {/* Book Now Button */}
            <Button
                variant='primary'
                size={isMobile ? "sm" : "md"}
                className="w-full shadow-md"
            >
                Pesan Sekarang
                <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} group-hover:translate-x-1 transition-transform`} />
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <Title
                        title="Kamar Inap"
                        badgeVariant="default"
                        containerClassName="items-center"
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <>
                        {/* Desktop & Tablet: Grid View */}
                        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 animate-pulse">
                                    <div className="h-8 w-32 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-6"></div>
                                    <div className="h-10 w-40 bg-gray-200 rounded mb-6"></div>
                                    <div className="space-y-3 mb-6">
                                        {[...Array(4)].map((_, j) => (
                                            <div key={j} className="h-4 w-full bg-gray-200 rounded"></div>
                                        ))}
                                    </div>
                                    <div className="h-10 w-full bg-gray-200 rounded mb-3"></div>
                                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile: Carousel View */}
                        <div className="md:hidden">
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex-[0_0_85%] min-w-0 snap-start">
                                        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
                                            <div className="h-8 w-32 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 rounded mb-6"></div>
                                            <div className="h-10 w-40 bg-gray-200 rounded mb-6"></div>
                                            <div className="space-y-3 mb-6">
                                                {[...Array(4)].map((_, j) => (
                                                    <div key={j} className="h-4 w-full bg-gray-200 rounded"></div>
                                                ))}
                                            </div>
                                            <div className="h-10 w-full bg-gray-200 rounded mb-3"></div>
                                            <div className="h-10 w-full bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && kamarList.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                            <Bed className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Belum Ada Kamar
                        </h3>
                        <p className="text-gray-500">
                            Informasi kamar inap belum tersedia saat ini.
                        </p>
                    </div>
                )}

                {/* Content - Tampil saat ada data */}
                {!loading && sortedKamarList.length > 0 && (
                    <>
                        {/* Desktop & Tablet: Grid View (md and up) */}
                        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                            {sortedKamarList.slice(0, 3).map((kamar) => (
                                <div key={kamar.id}>
                                    {renderKamarCard(kamar, false)}
                                </div>
                            ))}
                        </div>

                        {/* Mobile Only: Carousel View (below md breakpoint) */}
                        <div className="md:hidden mb-12">
                            <div className="overflow-hidden" ref={emblaRef}>
                                <div className="flex gap-4 px-1">
                                    {sortedKamarList.slice(0, 3).map((kamar) => (
                                        <div
                                            key={kamar.id}
                                            className="flex-[0_0_85%] min-w-0"
                                        >
                                            {renderKamarCard(kamar, true)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* View All Button */}
                        <div className="text-center">
                            <Link href="/kamar-inap">
                                <Button variant="primary" size="lg" className="group shadow-lg">
                                    Selengkapnya
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default KamarInap;