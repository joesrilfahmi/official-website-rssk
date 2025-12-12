'use client'

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, AlertCircle, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import { supabase } from '@/lib/supabase/client';

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

export default function BeritaPage() {
    const [beritaList, setBeritaList] = useState<Berita[]>([]);
    const [filteredBerita, setFilteredBerita] = useState<Berita[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('semua');
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchBerita = async () => {
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setBeritaList(data || []);
                setFilteredBerita(data || []);

                // Extract unique categories
                const uniqueCategories = Array.from(
                    new Set(data?.map(item => item.category) || [])
                );
                setCategories(uniqueCategories);

            } catch (error) {
                console.error('Error fetching berita:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBerita();

        // Real-time subscription
        const channel = supabase
            .channel('berita_list')
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

    useEffect(() => {
        let filtered = beritaList;

        // Filter by category
        if (selectedCategory !== 'semua') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredBerita(filtered);
    }, [searchQuery, selectedCategory, beritaList]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('id-ID', options);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <section className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <Title
                        badge="INFORMASI"
                        badgeVariant="default"
                        title="Berita Kesehatan"
                        containerClassName="items-center"
                    />
                    <p className="text-center text-gray-600 mt-4 max-w-2xl mx-auto">
                        Temukan berbagai informasi kesehatan terkini, tips hidup sehat, dan berita terbaru dari RS Siti Khodijah
                    </p>
                </div>
            </section>

            {/* Filter & Search Section */}
            <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari berita..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mariner-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
                            <button
                                onClick={() => setSelectedCategory('semua')}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'semua'
                                    ? 'bg-mariner-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Semua
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${selectedCategory === category
                                        ? 'bg-mariner-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Loading State */}
                    {loading && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                    <div className="w-full h-64 bg-gray-200"></div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-full bg-gray-200 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredBerita.length === 0 && (
                        <div className="text-center py-20">
                            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                                <AlertCircle className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Tidak Ada Berita
                            </h3>
                            <p className="text-gray-500">
                                {searchQuery || selectedCategory !== 'semua'
                                    ? 'Tidak ada berita yang sesuai dengan pencarian Anda.'
                                    : 'Belum ada berita yang tersedia saat ini.'}
                            </p>
                        </div>
                    )}

                    {/* Berita Grid */}
                    {!loading && filteredBerita.length > 0 && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredBerita.map((berita) => (
                                <Link
                                    key={berita.id}
                                    href={`/berita/${berita.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                                        {berita.thumbnail ? (
                                            <Image
                                                src={berita.thumbnail}
                                                alt={berita.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                                                <ArrowUpRight className="w-6 h-6 text-mariner-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Category & Date */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-semibold text-mariner-600 uppercase tracking-wide">
                                                {berita.category}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(berita.created_at)}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-mariner-600 transition-colors">
                                            {berita.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                                            {berita.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Results Count */}
                    {!loading && filteredBerita.length > 0 && (
                        <div className="text-center mt-12 text-gray-600">
                            Menampilkan {filteredBerita.length} dari {beritaList.length} berita
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}