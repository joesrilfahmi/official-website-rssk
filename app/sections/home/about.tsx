"use client";

import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { Profile } from "@/config/profile";
import { ArrowRight, Award, CheckCircle2, Heart, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const stats = [
  { icon: Heart, value: "30+", label: "Tahun Melayani" },
  { icon: Shield, value: "Tipe B", label: "Akreditasi RS" },
  { icon: Award, value: "Islami", label: "& Profesional" },
];

const highlights = [
  "Fasilitas medis modern & lengkap",
  "Tenaga kesehatan bersertifikasi",
  "Pelayanan berbasis nilai Islami",
];

const About = () => {
  const [backImageLoaded, setBackImageLoaded] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ─── Two-column grid ─── */}
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* ══ LEFT — image composition ══ */}
          <div className="relative w-full aspect-[4/3.6] max-w-[540px] mx-auto lg:mx-0">
            {/* Background fill so the column has visual weight */}
            <div className="absolute inset-0 bg-blue-50 rounded-4xl" />

            {/* Decorative dot-grid accent */}
            <div
              className="absolute top-4 left-4 w-24 h-24 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Back image — top-right */}
            <div className="absolute top-6 right-6 w-[58%] h-[52%] rounded-2xl overflow-hidden shadow-lg">
              {!backImageLoaded && (
                <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-200 animate-pulse" />
              )}
              <Image
                src="/gedung-rssk2.webp"
                alt="Gedung RS Siti Khodijah"
                fill
                className={`object-cover transition-opacity duration-500 ${backImageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                onLoadingComplete={() => setBackImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-linear-to-br from-transparent to-blue-900/15" />
            </div>

            {/* Main image — bottom-left, larger & foreground */}
            <div className="absolute bottom-6 left-6 w-[65%] h-[62%] rounded-2xl overflow-hidden shadow-2xl z-20 ring-4 ring-white">
              {!mainImageLoaded && (
                <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}
              <Image
                src="/gedung-rssk.webp"
                alt="Interior RS Siti Khodijah"
                fill
                className={`object-cover transition-opacity duration-500 ${mainImageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                onLoadingComplete={() => setMainImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
            </div>

            {/* Floating "Melayani Sejak" badge — anchored to overlap both images */}
            <div className="absolute bottom-[28%] right-4 z-30 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 ring-1 ring-blue-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-blue-500" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-gray-400 font-medium">
                  Melayani Sejak
                </p>
                <p className="text-sm font-bold text-gray-800">1993</p>
              </div>
            </div>
          </div>

          {/* ══ RIGHT — content ══ */}
          <div className="flex flex-col justify-center max-w-lg mx-auto lg:mx-0 w-full">
            {/* Title component — unchanged from original */}
            <Title
              badge="Profil"
              title={"RS" + " " + Profile.name + " " + Profile.subtitle}
              badgeVariant="default"
            />

            {/* Description */}
            <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed mt-5">
              Rumah Sakit {Profile.name} adalah rumah sakit tipe B dan merupakan
              salah satu amal usaha kesehatan milik Persyarikatan Muhammadiyah
              dibawah naungan Pimpinan Cabang Muhammadiyah Sepanjang yang
              didukung dengan fasilitas yang modern dan sumber daya insani yang
              profesional dan islami.
            </p>

            {/* Highlight checklist */}
            <ul className="mt-6 space-y-2.5">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-gray-700 text-sm sm:text-base"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="my-7 h-px bg-gray-200" />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center bg-white rounded-2xl py-4 px-2 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-base font-extrabold text-gray-900 leading-none">
                    {value}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1 leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link href="/sections/rumah-sakit">
                <Button variant="primary" size="lg" className="group">
                  Selengkapnya
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
