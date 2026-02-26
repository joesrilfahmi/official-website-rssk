"use client";
import { Profile } from "@/config/profile";
import { Eye, Target } from "lucide-react";
import Image from "next/image";

export default function VisiMisi() {
  const misiPoints = [
    "Menyelenggarakan Pelayanan Dasar Jenjang Pelayanan Sedang Rumah Sakit Rujukan Utama Yang Bermutu, Profesional, Islami, Dan Sesuai Standar Akreditasi Universal",
    "Trauma & Injury Center, Heart & Stroke Care, Cancer Care, Gerontology Care, Hematology Center & Telemedicine Care",
    "Menyelenggarakan Pendidikan Kesehatan Yang Terpercaya",
    "Mengadakan Sumber Daya Insani Yang Excellent Dan Berakhlak Mulia",
    "Mengadakan Alat & Keselamatan Sarana Yang Berkesinambungan",
    "Mengoptimalkan Service Excellence Yang Sejahtera Dan Mudah",
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* ── Hero Banner ── */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl aspect-21/7 min-h-[220px]">
          <Image
            src="/gedung-rssk.webp"
            alt="Gedung RS Siti Khodijah"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-mariner-900/75 via-mariner-900/40 to-transparent" />

          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
            <p className="text-mariner-200 text-sm sm:text-base font-semibold uppercase tracking-widest mb-2">
              Profil Rumah Sakit
            </p>
            <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              RS {Profile.name}
            </h1>
            <p className="text-mariner-100 text-lg sm:text-xl font-medium mt-1">
              {Profile.subtitle}
            </p>
          </div>
        </div>

        {/* ── Profile Description ── */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16 items-start">
          {/* Left label */}
          <div className="lg:sticky lg:top-8">
            <div className="inline-flex items-center gap-2 bg-mariner-50 text-mariner-500 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-mariner-500 inline-block" />
              Tentang Kami
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-mariner-500 leading-snug">
              RS {Profile.name}{" "}
              <span className="block text-gray-500 font-semibold text-xl mt-1">
                {Profile.subtitle}
              </span>
            </h2>
            <div className="mt-4 h-1 w-12 bg-mariner-500 rounded-full" />
          </div>

          {/* Right text */}
          <p className="text-gray-600 leading-relaxed text-base sm:text-[17px] text-justify">
            RS {Profile.name} {Profile.subtitle} berlokasi strategis di kawasan
            Sepanjang, Sidoarjo, dengan area yang terus berkembang guna
            mendukung pelayanan kesehatan yang berkualitas. Rumah sakit
            dilengkapi dengan beragam fasilitas kesehatan modern, mulai dari
            poliklinik rawat jalan berbagai spesialis hingga ruang rawat inap
            dengan kapasitas ratusan tempat tidur. RS Siti Khodijah Muhammadiyah
            Cabang Sepanjang telah meraih akreditasi paripurna dari Komisi
            Akreditasi Rumah Sakit (KARS) sebagai bukti komitmen dalam menjaga
            mutu layanan dan keselamatan pasien sesuai standar nasional.
            Pencapaian ini merupakan wujud nyata dedikasi rumah sakit dalam
            memberikan pelayanan kesehatan yang profesional, aman, dan
            terpercaya bagi masyarakat. Untuk menjaga kenyamanan pasien, RS Siti
            Khodijah menghadirkan fasilitas rawat inap dengan konsep modern,
            salah satunya adalah President Suite — kamar rawat inap satu pasien
            satu kamar yang memberikan suasana privat, nyaman, dan bersahabat
            bagi pasien maupun keluarga.
          </p>
        </div>

        {/* ── Visi & Misi ── */}
        <div>
          {/* Section heading */}
          <div className="flex items-end justify-between mb-10 border-b border-gray-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-mariner-50 text-mariner-500 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-mariner-500 inline-block" />
                Arah & Tujuan
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-mariner-500">
                Visi & Misi
              </h2>
            </div>
          </div>

          {/* Grid cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* ── Visi card ── */}
            <div className="bg-white rounded-3xl shadow-md ring-1 ring-gray-100 p-8 flex flex-col gap-6 h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-mariner-50 flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6 text-mariner-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-mariner-400 uppercase tracking-widest">
                    Visi
                  </p>
                  <h3 className="text-xl font-extrabold text-mariner-500">
                    Pandangan Kami
                  </h3>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <p className="text-gray-700 leading-relaxed text-base sm:text-[17px] text-justify flex-1">
                Terwujudnya Rumah Sakit {Profile.name} {Profile.subtitle} Yang
                Unggul, Profesional, Islami, Dan Terpercaya Di Jawa Timur.
              </p>
            </div>

            {/* ── Misi card ── */}
            <div className="bg-white rounded-3xl shadow-md ring-1 ring-gray-100 p-8 flex flex-col gap-6 h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-mariner-50 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-mariner-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-mariner-400 uppercase tracking-widest">
                    Misi
                  </p>
                  <h3 className="text-xl font-extrabold text-mariner-500">
                    Langkah Kami
                  </h3>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <ol className="space-y-4">
                {misiPoints.map((point, index) => (
                  <li key={index} className="flex gap-4 items-start">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-mariner-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base text-justify flex-1">
                      {point}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
