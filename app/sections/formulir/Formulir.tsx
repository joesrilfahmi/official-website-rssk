"use client";

import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import Input from "@/components/ui/custom/input";
import type { LucideProps } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LogIn,
  MessageSquare,
  Search,
  ShoppingCart,
  Star,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────
   INTERFACE
───────────────────────────────────────── */
interface FormItem {
  id: number;
  title: string;
  description: string;
  link: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  category: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
}

const formList: FormItem[] = [
  {
    id: 1,
    title: "Formulir Persetujuan Pembayaran Uang Muka",
    description:
      "Formulir ini berfungsi sebagai bukti persetujuan pembayaran uang muka atas layanan yang akan diberikan. Pengisian formulir ini menandakan bahwa pihak terkait memahami dan menyetujui kewajiban pembayaran sesuai dengan ketentuan yang telah ditetapkan.",
    link: "/sections/formulir/persetujuan-pembayaran-uang-muka",
    Icon: ClipboardList,
    category: "Pembayaran",
    gradient: "from-bittersweet-500 to-bittersweet-600",
    iconBg: "bg-bittersweet-50 group-hover:bg-white/20",
    iconColor: "text-bittersweet-500",
    badgeColor: "bg-bittersweet-100 text-bittersweet-700",
  },
  {
    id: 2,
    title: "Formulir Login",
    description: "Masuk ke sistem menggunakan kredensial Anda",
    link: "/formulir/login",
    Icon: LogIn,
    category: "Akun",
    gradient: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-50 group-hover:bg-white/20",
    iconColor: "text-violet-500",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    id: 3,
    title: "Formulir Kontak",
    description: "Kirim pesan atau pertanyaan kepada tim kami",
    link: "/formulir/kontak",
    Icon: MessageSquare,
    category: "Komunikasi",
    gradient: "from-greenfresh-500 to-greenfresh-600",
    iconBg: "bg-greenfresh-50 group-hover:bg-white/20",
    iconColor: "text-greenfresh-600",
    badgeColor: "bg-greenfresh-100 text-greenfresh-700",
  },
  {
    id: 4,
    title: "Formulir Pemesanan Produk",
    description: "Pesan produk pilihan Anda dengan mudah dan cepat",
    link: "/formulir/pemesanan",
    Icon: ShoppingCart,
    category: "Pembelian",
    gradient: "from-rose-500 to-rose-600",
    iconBg: "bg-rose-50 group-hover:bg-white/20",
    iconColor: "text-rose-500",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  {
    id: 5,
    title: "Formulir Data Karyawan",
    description: "Lengkapi data diri sebagai karyawan perusahaan",
    link: "/formulir/data-karyawan",
    Icon: Users,
    category: "SDM",
    gradient: "from-mariner-500 to-mariner-600",
    iconBg: "bg-mariner-50 group-hover:bg-white/20",
    iconColor: "text-mariner-600",
    badgeColor: "bg-mariner-100 text-mariner-700",
  },
  {
    id: 6,
    title: "Formulir Data Mahasiswa",
    description: "Isi data akademik dan pribadi sebagai mahasiswa",
    link: "/formulir/data-mahasiswa",
    Icon: GraduationCap,
    category: "Pendidikan",
    gradient: "from-cyan-500 to-cyan-600",
    iconBg: "bg-cyan-50 group-hover:bg-white/20",
    iconColor: "text-cyan-600",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
  {
    id: 7,
    title: "Formulir Pengajuan Cuti",
    description: "Ajukan permohonan cuti kepada atasan Anda",
    link: "/formulir/pengajuan-cuti",
    Icon: FileText,
    category: "SDM",
    gradient: "from-orange-500 to-orange-600",
    iconBg: "bg-orange-50 group-hover:bg-white/20",
    iconColor: "text-orange-500",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: 8,
    title: "Formulir Survey Kepuasan",
    description: "Berikan penilaian dan masukan untuk layanan kami",
    link: "/formulir/survey",
    Icon: Star,
    category: "Evaluasi",
    gradient: "from-pink-500 to-pink-600",
    iconBg: "bg-pink-50 group-hover:bg-white/20",
    iconColor: "text-pink-500",
    badgeColor: "bg-pink-100 text-pink-700",
  },
];

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const Formulir = () => {
  const router = useRouter();
  const [dataReady, setDataReady] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDataReady(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return formList;
    return formList.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Daftar Formulir"
            subtitle="Temukan dan akses formulir yang Anda butuhkan dengan mudah."
          />
        </Animate>

        {/* Search — identik dengan klinik-spesialis */}
        <Animate
          type="slideup"
          ready={dataReady}
          delay={0.05}
          className="mt-12 mb-2"
        >
          <div className="flex justify-center">
            <div className="w-full max-w-3xl flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Cari formulir..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  rounded="full"
                  inputSize="md"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Animate>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Animate
            type="slideup"
            ready={dataReady}
            className="text-center py-12"
          >
            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
              {query ? (
                <Search className="w-12 h-12 text-gray-400" />
              ) : (
                <AlertCircle className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {query ? "Tidak Ada Formulir Ditemukan" : "Belum Ada Formulir"}
            </h3>
            <p className="text-gray-500">
              {query
                ? "Coba ubah kata kunci pencarian Anda."
                : "Formulir belum tersedia saat ini."}
            </p>
          </Animate>
        )}

        {/* Grid — stagger identik dengan klinik-spesialis */}
        {filtered.length > 0 && (
          <Animate
            key={query}
            type="stagger"
            staggerChildren={0.08}
            delayChildren={0.05}
            ready={dataReady}
            once={false}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-12 pb-16"
          >
            {filtered.map(
              (
                {
                  id,
                  title,
                  description,
                  link,
                  Icon,
                  category,
                  gradient,
                  iconBg,
                  iconColor,
                  badgeColor,
                },
                index,
              ) => (
                <Animate key={id} type="slideup">
                  <div
                    onClick={() => router.push(link)}
                    className="group relative bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col h-full"
                  >
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="absolute top-6 right-6 text-7xl font-bold text-gray-200/50 group-hover:text-white/10 select-none pointer-events-none transition-colors duration-300">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-4 w-fit ${badgeColor} group-hover:bg-white/20 group-hover:text-white transition-colors`}
                      >
                        {category}
                      </span>

                      <div
                        className={`${iconBg} rounded-2xl p-4 w-fit mb-4 transition-colors`}
                      >
                        <Icon
                          className={`w-7 h-7 ${iconColor} group-hover:text-white transition-colors`}
                        />
                      </div>

                      <h3 className="font-bold text-base text-gray-900 group-hover:text-white transition-colors mb-2 line-clamp-2 min-h-12">
                        {title}
                      </h3>

                      <p className="text-gray-500 group-hover:text-white/80 text-sm transition-colors line-clamp-2 grow">
                        {description}
                      </p>

                      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                        <span>Buka Formulir</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Animate>
              ),
            )}
          </Animate>
        )}
      </div>
    </div>
  );
};

export default Formulir;
