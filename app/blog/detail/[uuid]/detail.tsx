// app/blog/detail/[uuid]/page.tsx
"use client";
import Animate from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import { supabase } from "@/lib/supabase/client";
import { BeritaWithAuthor } from "@/types/index";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Facebook,
  Link as LinkIcon,
  Linkedin,
  Share2,
  Tag,
  TrendingUp,
  Twitter,
  User,
} from "lucide-react";
import CachedImage from "@/components/ui/custom/cached-image";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

const BeritaDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const uuid = params?.uuid as string;

  const [berita, setBerita] = useState<BeritaWithAuthor | null>(null);
  const [popularPosts, setPopularPosts] = useState<BeritaWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchBeritaDetail = useCallback(async () => {
    try {
      setLoading(true);
      const { data: beritaData, error } = await supabase
        .from("berita")
        .select(`*, author_detail:author (id, nama, username, avatar)`)
        .eq("id", uuid)
        .eq("status", "active")
        .single();
      if (error) throw error;
      setBerita(beritaData);

      const { data: popularData } = await supabase
        .from("berita")
        .select(`*, author_detail:author (id, nama, username, avatar)`)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
      if (popularData) setPopularPosts(popularData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) fetchBeritaDetail();
  }, [uuid, fetchBeritaDetail]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getReadingTime = (text: string) => {
    const minutes = Math.ceil(text.trim().split(/\s+/).length / 200);
    return `${minutes} menit baca`;
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = berita?.title || "";
    if (platform === "facebook")
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
      );
    else if (platform === "twitter")
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        "_blank",
      );
    else if (platform === "linkedin")
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank",
      );
    else if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowShareMenu(false);
  };

  const handleArticleClick = (id: string) => router.push(`/blog/detail/${id}`);
  const handleBackToBlog = () => router.push("/blog");

  /* ── Widget wrapper ── */
  const Widget = ({
    icon,
    title,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-mariner-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h3 className="text-xs font-extrabold text-mariner-600 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  /* ── Loading skeleton ── */
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 pt-24 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton tombol Kembali */}
          <div className="flex items-center gap-2 mb-8 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Skeleton artikel utama */}
            <div className="lg:col-span-2 animate-pulse">
              <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                {/* Hero image */}
                <div className="h-72 sm:h-96 bg-gray-200" />

                <div className="p-7 sm:p-10 space-y-5">
                  {/* Category badge */}
                  <div className="h-6 w-24 bg-gray-100 rounded-full" />

                  {/* Title — 2 baris seperti h1 artikel */}
                  <div className="space-y-3">
                    <div className="h-8 w-full bg-gray-100 rounded-lg" />
                    <div className="h-8 w-3/4 bg-gray-100 rounded-lg" />
                  </div>

                  {/* Meta bar: avatar + nama + tanggal + waktu baca + share */}
                  <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100">
                    {/* Author */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gray-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-gray-100 rounded" />
                        <div className="h-3 w-10 bg-gray-100 rounded" />
                      </div>
                    </div>
                    {/* Divider */}
                    <div className="hidden sm:block w-px h-8 bg-gray-100" />
                    {/* Date + reading time */}
                    <div className="flex items-center gap-4">
                      <div className="h-3.5 w-32 bg-gray-100 rounded" />
                      <div className="h-3.5 w-24 bg-gray-100 rounded" />
                    </div>
                    {/* Share button */}
                    <div className="ml-auto h-7 w-20 bg-gray-100 rounded-lg" />
                  </div>

                  {/* Article body — paragraf panjang */}
                  <div className="space-y-3 pt-1">
                    {[100, 100, 100, 100, 75, 100, 100, 85, 100, 60].map(
                      (w, i) => (
                        <div
                          key={i}
                          className="h-4 bg-gray-100 rounded"
                          style={{ width: `${w}%` }}
                        />
                      ),
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <div className="h-3.5 w-8 bg-gray-100 rounded" />
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-7 w-16 bg-gray-100 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton sidebar — Popular Posts */}
            <div className="lg:col-span-1 space-y-5">
              <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden animate-pulse">
                {/* Widget header */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-gray-100" />
                  <div className="h-3.5 w-28 bg-gray-100 rounded" />
                </div>
                {/* 5 post items */}
                <div className="p-5 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                      {/* Title + date */}
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-full bg-gray-100 rounded" />
                        <div className="h-3.5 w-4/5 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  /* ── Not found ── */
  if (!berita)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Artikel Tidak Ditemukan
          </h2>
          <Button onClick={handleBackToBlog} variant="primary">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
          </Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Tombol Kembali */}
        <Animate type="fadein" duration={0.5} ready={!loading}>
          <motion.button
            onClick={handleBackToBlog}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors duration-150 group mb-8"
          >
            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-all duration-150 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </span>
            Kembali
          </motion.button>
        </Animate>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main article ── */}
          <div className="lg:col-span-2">
            <Animate type="slideup" duration={0.75} ready={!loading}>
              <article className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                {/* Hero image */}
                {berita.thumbnail && (
                  <div className="relative w-full h-72 sm:h-96">
                    <CachedImage
                      src={berita.thumbnail}
                      alt={berita.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width:768px) 100vw, 896px"
                      bucket={""}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-5 left-6 px-3 py-1.5 bg-bittersweet-500 text-white text-xs font-bold rounded-full shadow">
                      {berita.category}
                    </span>
                  </div>
                )}

                <div className="p-7 sm:p-10">
                  {!berita.thumbnail && (
                    <span className="inline-block px-3 py-1.5 bg-bittersweet-50 text-bittersweet-600 rounded-full text-xs font-bold mb-4">
                      {berita.category}
                    </span>
                  )}

                  <Animate
                    type="fadein"
                    duration={0.6}
                    delay={0.1}
                    ready={!loading}
                  >
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                      {berita.title}
                    </h1>
                  </Animate>

                  <Animate
                    type="fadein"
                    duration={0.6}
                    delay={0.2}
                    ready={!loading}
                  >
                    <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-gray-100">
                      {/* Author */}
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-mariner-100 shrink-0">
                          {berita.author_detail?.avatar ? (
                            <CachedImage
                              src={berita.author_detail.avatar}
                              alt={berita.author_detail.nama}
                              fill
                              className="object-cover"
                              sizes="36px"
                              bucket={""}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 text-mariner-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-none">
                            {berita.author_detail?.nama || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Penulis
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-8 bg-gray-200" />

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(berita.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {getReadingTime(berita.description)}
                        </span>
                      </div>

                      {/* Share button */}
                      <div className="ml-auto relative">
                        <button
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:border-mariner-300 hover:text-mariner-600 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Bagikan
                        </button>
                        {showShareMenu && (
                          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-1.5 z-50 overflow-hidden">
                            {[
                              {
                                key: "facebook",
                                icon: (
                                  <Facebook className="w-4 h-4 text-blue-600" />
                                ),
                                label: "Facebook",
                              },
                              {
                                key: "twitter",
                                icon: (
                                  <Twitter className="w-4 h-4 text-sky-500" />
                                ),
                                label: "Twitter / X",
                              },
                              {
                                key: "linkedin",
                                icon: (
                                  <Linkedin className="w-4 h-4 text-blue-700" />
                                ),
                                label: "LinkedIn",
                              },
                              {
                                key: "copy",
                                icon: (
                                  <LinkIcon className="w-4 h-4 text-gray-500" />
                                ),
                                label: copySuccess ? "Tersalin!" : "Salin Link",
                              },
                            ].map((item) => (
                              <button
                                key={item.key}
                                onClick={() => handleShare(item.key)}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {item.icon}
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Animate>

                  <Animate
                    type="fadein"
                    duration={0.7}
                    delay={0.3}
                    ready={!loading}
                  >
                    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed">
                      <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                        {berita.description}
                      </p>
                    </div>
                  </Animate>

                  {berita.tags && berita.tags.length > 0 && (
                    <Animate
                      type="slideup"
                      duration={0.55}
                      delay={0.4}
                      ready={!loading}
                    >
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5" /> Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {berita.tags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-mariner-100 text-gray-600 hover:text-mariner-600 rounded-full text-xs font-medium transition-colors cursor-pointer"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Animate>
                  )}
                </div>
              </article>
            </Animate>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-5">
              <Animate
                type="slideleft"
                duration={0.8}
                delay={0.15}
                ready={!loading}
              >
                <Widget
                  icon={<TrendingUp className="w-4 h-4 text-mariner-500" />}
                  title="Popular Post"
                >
                  <div className="space-y-4">
                    {popularPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleArticleClick(post.id)}
                        className="flex gap-3 cursor-pointer group items-start"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {post.thumbnail ? (
                            <CachedImage
                              src={post.thumbnail}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                              sizes="56px"
                              bucket={""}
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-mariner-200 to-mariner-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-mariner-500 transition-colors leading-snug mb-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-bittersweet-500">
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Widget>
              </Animate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeritaDetailPage;
