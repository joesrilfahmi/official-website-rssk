// app/sections/blog/blog.tsx
"use client";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import { supabase } from "@/lib/supabase/client";
import { BeritaWithAuthor } from "@/types/index";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 5;

const Blog = () => {
  const router = useRouter();
  const [beritaList, setBeritaList] = useState<BeritaWithAuthor[]>([]);
  const [popularPosts, setPopularPosts] = useState<BeritaWithAuthor[]>([]);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedTag]);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const beritaChannel = supabase
      .channel("berita_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "berita" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(beritaChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch berita with author details
      const { data: beritaData, error: beritaError } = await supabase
        .from("berita")
        .select(
          `
                    *,
                    author_detail:author (
                        id,
                        nama,
                        username,
                        avatar
                    )
                `,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (beritaError) throw beritaError;

      setBeritaList(beritaData || []);

      // Set popular posts (5 latest posts)
      setPopularPosts((beritaData || []).slice(0, 5));

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((beritaData || []).map((item) => item.category)),
      ).sort();
      setCategories(uniqueCategories);

      // Extract and count all tags
      const tagCount: Record<string, number> = {};
      (beritaData || []).forEach((berita) => {
        if (berita.tags) {
          berita.tags.forEach((tag: string) => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      });

      // Convert to array and sort by count
      const sortedTags = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 tags

      setAllTags(sortedTags);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter berita
  const filteredBerita = beritaList.filter((berita) => {
    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const title = berita.title.toLowerCase();

      if (!title.includes(query)) {
        return false;
      }
    }

    // Filter by category
    if (selectedCategory !== "all" && berita.category !== selectedCategory) {
      return false;
    }

    // Filter by tag
    if (selectedTag && (!berita.tags || !berita.tags.includes(selectedTag))) {
      return false;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredBerita.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBerita = filteredBerita.slice(startIndex, endIndex);

  // Handler untuk clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handler untuk pilih tag
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag("");
    } else {
      setSelectedTag(tag);
      setSearchQuery("");
      setSelectedCategory("all");
    }
  };

  // Handler pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler untuk navigasi ke detail
  const handleBeritaClick = (berita: BeritaWithAuthor) => {
    router.push(`/sections/blog/detail/${berita.id}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Category options for select
  const categoryOptions = [
    { value: "all", label: "Semua Kategori" },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const renderBeritaCard = (berita: BeritaWithAuthor) => {
    return (
      <div
        onClick={() => handleBeritaClick(berita)}
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="relative h-64 w-full overflow-hidden bg-gray-200">
          {berita.thumbnail ? (
            <Image
              src={berita.thumbnail}
              alt={berita.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-mariner-200 to-mariner-400 flex items-center justify-center">
              <Tag className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(berita.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{berita.author_detail?.nama || "Unknown"}</span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-bittersweet-100 text-bittersweet-600 rounded-full text-xs font-medium">
              {berita.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-mariner-500 mb-3 line-clamp-2 group-hover:text-mariner-600 transition-colors min-h-14">
            {berita.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {berita.description}
          </p>

          {/* Tags */}
          {berita.tags && berita.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {berita.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {berita.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{berita.tags.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Banner
          title="Berita & Artikel"
          subtitle="Informasi terkini seputar kesehatan dan layanan kami"
        />

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Filters Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Cari artikel berdasarkan judul..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                    iconPosition="left"
                    rounded="full"
                    inputSize="md"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                      type="button"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="w-full sm:w-56 shrink-0">
                  <Select
                    icon={Tag}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    placeholder="Pilih kategori"
                    rounded="full"
                    searchable={false}
                    selectSize="md"
                  />
                </div>
              </div>

              {/* Active Tag Filter Display */}
              {selectedTag && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Filter aktif:</span>
                  <button
                    onClick={() => setSelectedTag("")}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-mariner-100 text-mariner-600 rounded-full text-sm hover:bg-mariner-200 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {selectedTag}
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-lg animate-pulse overflow-hidden"
                  >
                    <div className="h-64 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
                      <div className="h-6 w-full bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredBerita.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Tidak Ada Artikel Ditemukan
                </h3>
                <p className="text-gray-500">
                  {searchQuery || selectedTag
                    ? "Coba ubah kata kunci pencarian atau filter Anda."
                    : "Artikel belum tersedia saat ini."}
                </p>
              </div>
            )}

            {/* Berita Grid */}
            {!loading && paginatedBerita.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-6 mb-8">
                  {paginatedBerita.map((berita) => (
                    <div key={berita.id}>{renderBeritaCard(berita)}</div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    {/* Previous Button */}
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </Button>

                    {/* Page Info */}
                    <span className="text-bittersweet-500 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>

                    {/* Next Button */}
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Popular Post */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-mariner-500" />
                <h3 className="text-xl font-bold text-mariner-500">
                  Popular Post
                </h3>
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
                      onClick={() => handleBeritaClick(post)}
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
                          {post.author_detail?.nama || "Unknown"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {popularPosts.length > 0 && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedTag("");
                      setCurrentPage(1);
                    }}
                  >
                    See More Posts
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Tag className="w-5 h-5 text-mariner-500" />
                <h3 className="text-xl font-bold text-mariner-500">
                  Popular Tags
                </h3>
              </div>

              {loading ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tagItem, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tagItem.tag)}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm transition-colors ${
                        selectedTag === tagItem.tag
                          ? "bg-mariner-500 text-white"
                          : "bg-gray-100 hover:bg-mariner-100 text-gray-700 hover:text-mariner-600"
                      }`}
                    >
                      {tagItem.tag}
                      <span
                        className={`text-xs ${selectedTag === tagItem.tag ? "text-white/80" : "text-gray-500"}`}
                      >
                        ({tagItem.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
