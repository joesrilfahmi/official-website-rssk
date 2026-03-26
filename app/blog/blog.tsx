// app/sections/blog/blog.tsx
"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Input from "@/components/ui/custom/input";
import Pagination from "@/components/ui/custom/pagination";
import Pills from "@/components/ui/custom/pills";
import { supabase } from "@/lib/supabase/client";
import { BeritaWithAuthor } from "@/types/index";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Search,
  Tag,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 5;

const Blog = () => {
  const router = useRouter();
  const [beritaList, setBeritaList] = useState<BeritaWithAuthor[]>([]);
  const [popularPosts, setPopularPosts] = useState<BeritaWithAuthor[]>([]);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Embla carousel untuk category pills
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [pillsCanScroll, setPillsCanScroll] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => setPillsCanScroll(emblaApi.canScrollNext());
    update();
    emblaApi.on("select", update);
    emblaApi.on("resize", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("resize", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedTag]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("berita_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "berita" },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("berita")
        .select(`*, author_detail:author (id, nama, username, avatar)`)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBeritaList(data || []);
      setPopularPosts((data || []).slice(0, 5));
      setCategories(
        Array.from(new Set((data || []).map((d) => d.category))).sort(),
      );
      const tagCount: Record<string, number> = {};
      (data || []).forEach((b) =>
        b.tags?.forEach((t: string) => {
          tagCount[t] = (tagCount[t] || 0) + 1;
        }),
      );
      setAllTags(
        Object.entries(tagCount)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setDataReady(true), 120);
    }
  };

  const searchFilteredBerita = useMemo(
    () =>
      beritaList.filter((b) => {
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          (b.description?.toLowerCase() || "").includes(q)
        );
      }),
    [beritaList, debouncedSearch],
  );

  const relevantCategories = useMemo(() => {
    if (!debouncedSearch) return categories;
    return categories.filter((c) =>
      searchFilteredBerita.some((b) => b.category === c),
    );
  }, [debouncedSearch, categories, searchFilteredBerita]);

  const filteredBerita = useMemo(
    () =>
      beritaList.filter((b) => {
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          if (
            !b.title.toLowerCase().includes(q) &&
            !(b.description?.toLowerCase() || "").includes(q)
          )
            return false;
        }
        if (selectedCategory !== "all" && b.category !== selectedCategory)
          return false;
        if (selectedTag && (!b.tags || !b.tags.includes(selectedTag)))
          return false;
        return true;
      }),
    [beritaList, debouncedSearch, selectedCategory, selectedTag],
  );

  const totalPages = Math.ceil(filteredBerita.length / ITEMS_PER_PAGE);
  const paginatedBerita = filteredBerita.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSelectedCategory("all");
      setSelectedTag("");
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== "all") setSearchQuery("");
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag("");
    } else {
      setSelectedTag(tag);
      setSearchQuery("");
      setSelectedCategory("all");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBeritaClick = (b: BeritaWithAuthor) =>
    router.push(`/sections/blog/detail/${b.id}`);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  /* ── Article card ── */
  const renderBeritaCard = (berita: BeritaWithAuthor) => (
    <article
      onClick={() => handleBeritaClick(berita)}
      className="group bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      <div className="relative shrink-0 overflow-hidden bg-gray-100 h-56 w-full">
        {berita.thumbnail ? (
          <Image
            src={berita.thumbnail}
            alt={berita.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-mariner-200 to-mariner-400 flex items-center justify-center">
            <Tag className="w-10 h-10 text-white/40" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-bittersweet-500 text-white rounded-full text-xs font-semibold shadow">
          {berita.category}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-3 mb-2.5 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(berita.created_at)}
          </span>
          <span className="hidden sm:inline text-gray-200">|</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {berita.author_detail?.nama || "Unknown"}
          </span>
        </div>

        <h3
          className={`font-bold text-mariner-500 mb-2 line-clamp-2 group-hover:text-mariner-600 transition-colors leading-snug
          text-xl sm:text-2xl`}
        >
          {berita.title}
        </h3>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 grow">
          {berita.description}
        </p>

        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {berita.tags?.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {berita.tags && berita.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                +{berita.tags.length - 2}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-mariner-500 group-hover:gap-2 transition-all shrink-0">
            Baca <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );

  /* ── Sidebar widget wrapper ── */
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
        <h3 className="text-sm font-extrabold text-mariner-600 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Berita & Artikel"
            subtitle="Informasi terkini seputar kesehatan dan layanan kami"
          />
        </Animate>

        {/* ── Grid: 3 col main + 2 col sidebar on xl ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-10">
          {/* ── Main content (3/5) ── */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            {/* Search input */}
            <Animate
              type="slideright"
              duration={0.7}
              ready={dataReady}
              delay={0.05}
            >
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari artikel berdasarkan judul atau isi..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  rounded="full"
                  inputSize="md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full z-20"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </Animate>

            {/* Category pills carousel */}
            {!loading && categories.length > 0 && (
              <Animate type="fadein" ready={dataReady} delay={0.08}>
                <div className="relative -mx-4 px-4 space-y-2">
                  <div className="overflow-hidden px-4 py-1" ref={emblaRef}>
                    <div className="flex gap-2.5">
                      <Pills
                        label="Semua"
                        count={
                          debouncedSearch
                            ? searchFilteredBerita.length
                            : beritaList.length
                        }
                        variant={
                          selectedCategory === "all" ? "active" : "default"
                        }
                        onClick={() => handleCategoryChange("all")}
                        size="md"
                      />
                      {relevantCategories.map((cat) => (
                        <Pills
                          key={cat}
                          label={cat}
                          count={
                            searchFilteredBerita.filter(
                              (b) => b.category === cat,
                            ).length
                          }
                          variant={
                            selectedCategory === cat ? "active" : "default"
                          }
                          onClick={() => handleCategoryChange(cat)}
                          size="md"
                        />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {pillsCanScroll && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.6 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0.6 }}
                        transition={{ duration: 0.4 }}
                        className="mx-4 flex items-center gap-2"
                      >
                        <div className="flex-1 h-0.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full w-1/4 rounded-full bg-gray-200" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0 select-none">
                          geser
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Animate>
            )}

            {/* Active tag chip */}
            {selectedTag && (
              <Animate type="popin" duration={0.4}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Filter tag:</span>
                  <button
                    onClick={() => setSelectedTag("")}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-mariner-100 text-mariner-600 rounded-full text-xs font-medium hover:bg-mariner-200 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {selectedTag}
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </Animate>
            )}

            {/* Loading skeleton — card artikel */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl ring-1 ring-gray-100 animate-pulse overflow-hidden flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="w-full h-56 bg-gray-200" />

                      <div className="flex flex-col flex-1 p-5 space-y-3">
                        {/* Meta: tanggal | penulis */}
                        <div className="flex items-center gap-3">
                          <div className="h-3.5 w-28 bg-gray-100 rounded" />
                          <div className="h-3.5 w-px bg-gray-200" />
                          <div className="h-3.5 w-24 bg-gray-100 rounded" />
                        </div>

                        {/* Title — 2 baris */}
                        <div className="space-y-2">
                          <div className="h-6 w-full bg-gray-100 rounded" />
                          <div className="h-6 w-4/5 bg-gray-100 rounded" />
                        </div>

                        {/* Description — 2 baris */}
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-100 rounded" />
                          <div className="h-4 w-3/4 bg-gray-100 rounded" />
                        </div>

                        {/* Footer: tags + Baca */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-1.5">
                            <div className="h-6 w-16 bg-gray-100 rounded" />
                            <div className="h-6 w-16 bg-gray-100 rounded" />
                          </div>
                          <div className="h-4 w-12 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!loading && filteredBerita.length === 0 && (
              <Animate type="fadein" ready={dataReady}>
                <div className="text-center py-16">
                  <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">
                    Tidak Ada Artikel Ditemukan
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {debouncedSearch || selectedTag
                      ? "Coba ubah kata kunci atau filter Anda."
                      : "Artikel belum tersedia."}
                  </p>
                </div>
              </Animate>
            )}

            {/* Articles */}
            {!loading && paginatedBerita.length > 0 && (
              <>
                <Animate
                  type="stagger"
                  staggerChildren={0.1}
                  delayChildren={0.05}
                  ready={dataReady}
                  once={false}
                >
                  <div className="flex flex-col gap-6">
                    {paginatedBerita.map((b) => (
                      <Animate
                        key={b.id}
                        type="slideup"
                        duration={0.55}
                        ready={dataReady}
                      >
                        {renderBeritaCard(b)}
                      </Animate>
                    ))}
                  </div>
                </Animate>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredBerita.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  itemLabel="artikel"
                  className="pt-2"
                />
              </>
            )}
          </div>

          {/* ── Sidebar (2/5) ── */}
          <div className="xl:col-span-2 space-y-5 xl:sticky xl:top-8 xl:self-start">
            {/* Popular Posts */}
            <Animate
              type="slideleft"
              duration={0.8}
              delay={0.1}
              ready={dataReady}
            >
              <Widget
                icon={<TrendingUp className="w-4 h-4 text-mariner-500" />}
                title="Popular Post"
              >
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start animate-pulse"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
                        {/* Title + date */}
                        <div className="flex-1 space-y-2 pt-0.5">
                          <div className="h-3.5 w-full bg-gray-100 rounded" />
                          <div className="h-3.5 w-4/5 bg-gray-100 rounded" />
                          <div className="h-3 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {popularPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleBeritaClick(post)}
                        className="flex gap-3 cursor-pointer group items-start"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {post.thumbnail ? (
                            <Image
                              src={post.thumbnail}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                              sizes="56px"
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
                )}
              </Widget>
            </Animate>

            {/* Popular Tags */}
            <Animate
              type="slideleft"
              duration={0.8}
              delay={0.2}
              ready={dataReady}
            >
              <Widget
                icon={<Tag className="w-4 h-4 text-mariner-500" />}
                title="Popular Tags"
              >
                {loading ? (
                  <div className="flex flex-wrap gap-2">
                    {/* Lebar bervariasi menyerupai tag asli */}
                    {[20, 16, 24, 14, 18, 22, 16, 20].map((w, i) => (
                      <div
                        key={i}
                        className="h-7 bg-gray-100 rounded-full animate-pulse"
                        style={{ width: `${w * 4}px` }}
                      />
                    ))}
                  </div>
                ) : allTags.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Belum ada tag tersedia.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => handleTagClick(t.tag)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                          ${
                            selectedTag === t.tag
                              ? "bg-mariner-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-mariner-100 hover:text-mariner-600"
                          }`}
                      >
                        {t.tag}
                        <span
                          className={`${selectedTag === t.tag ? "text-white/60" : "text-gray-400"}`}
                        >
                          ({t.count})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Widget>
            </Animate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;