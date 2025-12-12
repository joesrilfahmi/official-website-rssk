'use client'

import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

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

    // Embla Carousel - untuk mobile saja (seperti layanan-unggulan)
    const [emblaRef] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: true,
    });

    useEffect(() => {
        const fetchBerita = async () => {
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(6);

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
                <div className="h-full">
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

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 h-14 sm:h-16 line-clamp-2 flex items-start">
                        <span className="line-clamp-2">{berita.title}</span>
                    </h3>

                    {/* Image */}
                    <div
                        className="relative bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden group cursor-pointer"
                        style={{ aspectRatio: '4/3' }}
                    >
                        {berita.thumbnail ? (
                            <img
                                src={berita.thumbnail}
                                alt={berita.title}
                                className="w-full h-full object-cover"
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
        <section className="min-h-screen bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className='max-w-7xl mx-auto'>
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
                            <>
                                {/* Desktop & Tablet: Grid View */}
                                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-20 w-20 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-6 w-full bg-gray-200 rounded mb-4"></div>
                                            <div className="w-full bg-gray-200 rounded-2xl" style={{ aspectRatio: '4/3' }}></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile: Carousel View */}
                                <div className="md:hidden">
                                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex-[0_0_85%] animate-pulse">
                                                <div className="h-20 w-20 bg-gray-200 rounded mb-3"></div>
                                                <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                                                <div className="h-6 w-full bg-gray-200 rounded mb-4"></div>
                                                <div className="w-full bg-gray-200 rounded-2xl" style={{ aspectRatio: '4/3' }}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
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

                        {/* Content - Tampil saat ada data */}
                        {!loading && beritaList.length > 0 && (
                            <>
                                {/* Desktop & Tablet: Grid View (md and up) */}
                                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {beritaList.slice(0, 3).map((berita, index) => (
                                        <div key={berita.id}>
                                            {renderBeritaCard(berita, index)}
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Only: Carousel View (below md breakpoint) */}
                                <div className="md:hidden">
                                    <div className="overflow-hidden" ref={emblaRef}>
                                        <div className="flex gap-4 px-1">
                                            {beritaList.map((berita, index) => (
                                                <div
                                                    key={berita.id}
                                                    className="flex-[0_0_85%] min-w-0"
                                                >
                                                    {renderBeritaCard(berita, index)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}