// app/blog/detail/[uuid]/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
    Calendar,
    User,
    Tag,
    ArrowLeft,
    Share2,
    Clock,
    Facebook,
    Twitter,
    Linkedin,
    Link as LinkIcon,
    TrendingUp
} from 'lucide-react';
import Button from '@/components/ui/custom/button';
import { supabase } from '@/lib/supabase/client';
import { BeritaWithAuthor } from '@/types/index';

const BeritaDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const uuid = params?.uuid as string;

    const [berita, setBerita] = useState<BeritaWithAuthor | null>(null);
    const [popularPosts, setPopularPosts] = useState<BeritaWithAuthor[]>([]);
    const [relatedBerita, setRelatedBerita] = useState<BeritaWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchBeritaDetail = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch berita detail
            const { data: beritaData, error: beritaError } = await supabase
                .from('berita')
                .select(`
                    *,
                    author_detail:author (
                        id,
                        nama,
                        username,
                        avatar
                    )
                `)
                .eq('id', uuid)
                .eq('status', 'active')
                .single();

            if (beritaError) throw beritaError;

            setBerita(beritaData);

            // Fetch popular posts (5 latest posts)
            const { data: popularData, error: popularError } = await supabase
                .from('berita')
                .select(`
                    *,
                    author_detail:author (
                        id,
                        nama,
                        username,
                        avatar
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!popularError && popularData) {
                setPopularPosts(popularData);
            }

            // Fetch related berita (same category, different article)
            if (beritaData) {
                const { data: relatedData, error: relatedError } = await supabase
                    .from('berita')
                    .select(`
                        *,
                        author_detail:author (
                            id,
                            nama,
                            username,
                            avatar
                        )
                    `)
                    .eq('category', beritaData.category)
                    .eq('status', 'active')
                    .neq('id', uuid)
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (!relatedError && relatedData) {
                    setRelatedBerita(relatedData);
                }
            }
        } catch (error) {
            console.error('Error fetching berita detail:', error);
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        if (uuid) {
            fetchBeritaDetail();
        }
    }, [uuid, fetchBeritaDetail]);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const getReadingTime = (text: string) => {
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} menit baca`;
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const title = berita?.title || '';

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                break;
        }
        setShowShareMenu(false);
    };

    const handleArticleClick = (id: string) => {
        router.push(`/blog/detail/${id}`);
    };

    const handleBackToBlog = () => {
        router.push('/sections/blog');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-96 bg-gray-200 rounded-2xl mb-6"></div>
                        <div className="h-12 bg-gray-200 rounded mb-4"></div>
                        <div className="h-6 w-64 bg-gray-200 rounded mb-8"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!berita) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Artikel Tidak Ditemukan</h2>
                    <Button onClick={handleBackToBlog} variant="primary">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Blog
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Hero Image */}
                            {berita.thumbnail && (
                                <div className="relative w-full h-96">
                                    <Image
                                        src={berita.thumbnail}
                                        alt={berita.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 768px) 100vw, 896px"
                                    />
                                </div>
                            )}

                            {/* Article Content */}
                            <div className="p-8 lg:p-12">
                                {/* Category Badge */}
                                <div className="mb-4">
                                    <span className="inline-block px-4 py-2 bg-bittersweet-100 text-bittersweet-600 rounded-full text-sm font-semibold">
                                        {berita.category}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                                    {berita.title}
                                </h1>

                                {/* Meta Information */}
                                <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-gray-200">
                                    {/* Author */}
                                    <div className="flex items-center gap-3">
                                        {berita.author_detail?.avatar ? (
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                                <Image
                                                    src={berita.author_detail.avatar}
                                                    alt={berita.author_detail.nama}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-mariner-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-mariner-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {berita.author_detail?.nama || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-gray-500">Penulis</p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(berita.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{getReadingTime(berita.description)}</span>
                                        </div>
                                    </div>

                                    {/* Share Button */}
                                    <div className="ml-auto relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowShareMenu(!showShareMenu)}
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </Button>

                                        {/* Share Menu */}
                                        {showShareMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                                <button
                                                    onClick={() => handleShare('facebook')}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                                                >
                                                    <Facebook className="w-4 h-4 text-blue-600" />
                                                    Facebook
                                                </button>
                                                <button
                                                    onClick={() => handleShare('twitter')}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                                                >
                                                    <Twitter className="w-4 h-4 text-sky-500" />
                                                    Twitter
                                                </button>
                                                <button
                                                    onClick={() => handleShare('linkedin')}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                                                >
                                                    <Linkedin className="w-4 h-4 text-blue-700" />
                                                    LinkedIn
                                                </button>
                                                <button
                                                    onClick={() => handleShare('copy')}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                                                >
                                                    <LinkIcon className="w-4 h-4 text-gray-600" />
                                                    {copySuccess ? 'Link Tersalin!' : 'Salin Link'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Article Body */}
                                <div className="prose prose-lg max-w-none">
                                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                                        {berita.description}
                                    </p>
                                </div>

                                {/* Tags */}
                                {berita.tags && berita.tags.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            Tags:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {berita.tags.map((tag: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-mariner-100 text-gray-700 hover:text-mariner-600 rounded-full text-sm transition-colors cursor-pointer"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Back Button di bawah artikel */}
                                <div className="mt-8 pt-8 border-t border-gray-200 flex items-center justify-center">
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={handleBackToBlog}
                                        className="w-full sm:w-auto"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Kembali ke Semua Artikel
                                    </Button>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Popular Posts */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp className="w-5 h-5 text-mariner-500" />
                                    <h3 className="text-xl font-bold text-mariner-500">Popular Post</h3>
                                </div>

                                {loading ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex gap-4 animate-pulse">
                                                <div className="w-20 h-20 bg-gray-200 rounded-lg shrink-0"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                                    <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {popularPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                onClick={() => handleArticleClick(post.id)}
                                                className="flex gap-4 cursor-pointer group"
                                            >
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                                                    {post.thumbnail ? (
                                                        <Image
                                                            src={post.thumbnail}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-mariner-200 to-mariner-400"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-mariner-500 transition-colors">
                                                        {post.title}
                                                    </h4>
                                                    <p className="text-xs text-bittersweet-500 mb-1">
                                                        {formatDate(post.created_at)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {post.author_detail?.nama || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Related Articles */}
                            {relatedBerita.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Tag className="w-5 h-5 text-mariner-500" />
                                        <h3 className="text-lg font-bold text-mariner-500">Artikel Terkait</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {relatedBerita.map((related) => (
                                            <div
                                                key={related.id}
                                                onClick={() => handleArticleClick(related.id)}
                                                className="flex gap-3 cursor-pointer group"
                                            >
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                                                    {related.thumbnail ? (
                                                        <Image
                                                            src={related.thumbnail}
                                                            alt={related.title}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-mariner-200 to-mariner-400"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-mariner-500 transition-colors">
                                                        {related.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(related.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeritaDetailPage;