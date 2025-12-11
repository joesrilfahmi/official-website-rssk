// app/sections/home/layanan-unggulan.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';
import { LayananUnggulan as LayananUnggulanType } from '@/types/index';
import Link from 'next/link';

const LayananUnggulan = () => {
    const [layananList, setLayananList] = useState<LayananUnggulanType[]>([]);
    const [loading, setLoading] = useState(true);

    // Embla Carousel - untuk mobile (tanpa loop dan navigation buttons)
    const [emblaRef] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: true,
    });

    useEffect(() => {
        const fetchLayanan = async () => {
            try {
                const { data, error } = await supabase
                    .from('layanan_unggulan')
                    .select('*')
                    .order('urutan', { ascending: true })
                    .limit(6);

                if (error) throw error;

                setLayananList(data || []);
            } catch (error) {
                console.error('Error fetching layanan:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLayanan();

        // Real-time subscription
        const channel = supabase
            .channel('layanan_unggulan_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'layanan_unggulan' },
                () => {
                    fetchLayanan();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const renderLayananCard = (layanan: LayananUnggulanType, index: number, isMobile: boolean = false) => {
        const IconComponent = Icons[layanan.icon as keyof typeof Icons] as React.ElementType;
        const numberString = (index + 1).toString().padStart(2, '0');

        return (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-full">
                {/* Decorative Number Background */}
                <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 select-none pointer-events-none">
                    {numberString}
                </div>

                {/* Icon Badge */}
                <div className={`inline-flex ${isMobile ? 'p-4' : 'p-4 sm:p-5'} rounded-2xl bg-bittersweet-100 text-bittersweet-500 ${isMobile ? 'mb-4' : 'mb-4 sm:mb-6'} relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                    {IconComponent && <IconComponent className={`${isMobile ? 'w-7 h-7' : 'w-7 h-7 sm:w-8 sm:h-8'}`} />}
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className={`${isMobile ? 'text-xl' : 'text-xl sm:text-2xl'} font-bold text-mariner-500 ${isMobile ? 'mb-3' : 'mb-3 sm:mb-4'}`}>
                        {layanan.title}
                    </h3>
                    <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'} leading-relaxed ${isMobile ? 'mb-4' : 'mb-4 sm:mb-6'}`}>
                        {layanan.description}
                    </p>

                    {/* Explore Button */}
                    <Button variant='secondary' size="sm">
                        Explore More
                        <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} group-hover:translate-x-1 transition-transform`} />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <Title
                        badge="SPESIALIS KAMI"
                        title="Layanan Unggulan"
                        badgeVariant="default"
                        containerClassName="items-center"
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <>
                        {/* Desktop & Tablet: Grid View */}
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg animate-pulse">
                                    <div className="h-16 w-16 bg-gray-200 rounded-2xl mb-4"></div>
                                    <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile: Carousel View */}
                        <div className="md:hidden">
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex-[0_0_85%] min-w-0 snap-start">
                                        <div className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                                            <div className="h-16 w-16 bg-gray-200 rounded-2xl mb-4"></div>
                                            <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && layananList.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                            <Icons.AlertCircle className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Belum Ada Layanan
                        </h3>
                        <p className="text-gray-500">
                            Layanan unggulan belum tersedia saat ini.
                        </p>
                    </div>
                )}

                {/* Content - Tampil saat ada data */}
                {!loading && layananList.length > 0 && (
                    <>
                        {/* Desktop & Tablet: Grid View (md and up) */}
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                            {layananList.map((layanan, index) => (
                                <div key={layanan.id}>
                                    {renderLayananCard(layanan, index, false)}
                                </div>
                            ))}
                        </div>

                        {/* Mobile Only: Carousel View (below md breakpoint) */}
                        <div className="md:hidden mb-12">
                            <div className="overflow-hidden" ref={emblaRef}>
                                <div className="flex gap-4 px-1">
                                    {layananList.map((layanan, index) => (
                                        <div
                                            key={layanan.id}
                                            className="flex-[0_0_85%] min-w-0"
                                        >
                                            {renderLayananCard(layanan, index, true)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* View All Button - Only show if there might be more services */}
                        {layananList.length >= 6 && (
                            <div className="text-center">
                                <Link href="/layanan">
                                    <Button variant="primary" size="lg" className="group shadow-lg">
                                        Selengkapnya
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LayananUnggulan;