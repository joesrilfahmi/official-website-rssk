// app/sections/home/kamar-inap/informasi/page.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, Bed } from 'lucide-react';
import Banner from '@/components/ui/custom/banner';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';
import { KamarInap as KamarInapType } from '@/types/index';

const InformasiKamarInap = () => {
    const [kamarList, setKamarList] = useState<KamarInapType[]>([]);
    const [loading, setLoading] = useState(true);

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
                    .select('*');

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
            .channel('kamar_inap_informasi')
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

    const renderKamarCard = (kamar: KamarInapType) => (
        <div
            className={`bg-white rounded-2xl border-2 p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group ${kamar.is_recommended
                ? 'border-greenfresh-600 shadow-lg relative'
                : 'border-gray-200'
                } h-full flex flex-col`}
        >
            {/* Recommended Badge */}
            {kamar.is_recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-greenfresh-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                        <span>Disarankan</span>
                    </div>
                </div>
            )}

            {/* Room Name - Fixed height */}
            <h3 className="text-xl sm:text-2xl font-bold text-mariner-500 mb-2 line-clamp-1 min-h-8">
                {kamar.title}
            </h3>

            {/* Recommendation Text (if recommended) - Fixed height */}
            <div className="min-h-6 mb-3">
                {kamar.is_recommended && (
                    <p className="text-greenfresh-600 text-xs sm:text-sm font-medium">
                        (Recommended)
                    </p>
                )}
            </div>

            {/* Description - Fixed height with line clamp */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-2 min-h-[2.8rem]">
                {kamar.description}
            </p>

            {/* Price - Fixed height */}
            <div className="mb-6 min-h-12">
                <p className="text-3xl sm:text-4xl font-bold text-mariner-500">
                    {formatPrice(kamar.price)}
                </p>
            </div>

            {/* Facilities Title */}
            <h4 className="text-mariner-500 font-semibold text-sm sm:text-base mb-4">
                Fasilitas
            </h4>

            {/* Facilities List - Fixed height with scroll */}
            <div className="mb-6 grow">
                <div className="space-y-3 max-h-[180px] overflow-y-auto overflow-x-hidden scrollbar-modern">
                    {kamar.facilities && kamar.facilities.map((facility: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-sm sm:text-base">
                                {facility}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8  min-h-screen">
            <div className='max-w-7xl mx-auto'>
                {/* Banner Section */}
                <Banner
                    title="Kamar Inap"
                    subtitle="Pilihan kamar yang nyaman dan fasilitas lengkap untuk kesembuhan Anda"
                />

                {/* Content Section */}
                <div className="py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="text-center mb-12 sm:mb-16">
                            <Title
                                badge="RUANG PERAWATAN"
                                title="Informasi Kamar Inap"
                                badgeVariant="default"
                                align="center"
                            />
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {[...Array(6)].map((_, i) => (
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
                                    </div>
                                ))}
                            </div>
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

                        {/* Content Grid - Display all data */}
                        {!loading && sortedKamarList.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {sortedKamarList.map((kamar) => (
                                    <div key={kamar.id}>
                                        {renderKamarCard(kamar)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InformasiKamarInap;