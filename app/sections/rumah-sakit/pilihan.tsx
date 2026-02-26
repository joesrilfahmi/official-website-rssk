"use client";
import Animate from "@/components/animations/animate";
import Button from "@/components/ui/custom/button";
import Title from "@/components/ui/custom/title";
import { Ambulance, Award, Stethoscope, Users, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Reason {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  titleColor: string;
  descriptionColor: string;
  bgIcon: string;
}

interface Service {
  id: number;
  title: string;
  buttonText: string;
  icon: React.ReactNode;
  color: string;
  bgIcon: string;
}

const KenapaMemilih: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const mainReasons: Reason[] = [
    {
      id: 1,
      icon: <Users className="w-8 h-8" />,
      title: "Rumah Sakit Tipe B",
      description:
        "Sebagai salah satu Rumah Sakit besar di Sidoarjo, RS Siti Khodijah Muhammadiyah Cabang Sepanjang membuka layanan Poliklinik Spesialis setiap saat mulai pukul 07.00 - 21.00 WIB",
      color: "bg-mariner-500",
      iconColor: "text-mariner-600",
      titleColor: "text-white",
      descriptionColor: "text-white/85",
      bgIcon: "bg-mariner-100",
    },
    {
      id: 2,
      icon: <Zap className="w-8 h-8" />,
      title: "Fasilitas Lengkap & Modern",
      description:
        "RS Siti Khodijah Muhammadiyah Cabang Sepanjang selalu berinovasi dalam meningkatkan layanan untuk pasien. Setiap tahun RS Siti Khodijah Muhammadiyah Cabang Sepanjang menghadirkan peralatan medis baru, modern dan canggih",
      color: "bg-white",
      iconColor: "text-mariner-500",
      titleColor: "text-gray-900",
      descriptionColor: "text-gray-600",
      bgIcon: "bg-white border border-mariner-200",
    },
    {
      id: 3,
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Berbagai Klinik Unggulan",
      description:
        "RS Siti Khodijah Muhammadiyah Cabang Sepanjang menghadirkan layanan klinik unggulan diantaranya Jantung Anak, Cath Lab, Onkologi Center, Radiologi Center, Total Knee Replacement dan lain-lain.",
      color: "bg-white",
      iconColor: "text-mariner-500",
      titleColor: "text-gray-900",
      descriptionColor: "text-gray-600",
      bgIcon: "bg-white border border-mariner-200",
    },
  ];

  const services: Service[] = [
    {
      id: 1,
      title: "Cari dokter & Jadwal Dokter",
      buttonText: "Klik Disini",
      icon: <Stethoscope className="w-8 h-8" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
    {
      id: 2,
      title: "Ambulance Emergency",
      buttonText: "Hubungi",
      icon: <Ambulance className="w-8 h-8" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
    {
      id: 3,
      title: "Buat Janji Dokter Golden Eksekutif",
      buttonText: "Hubungi",
      icon: <Award className="w-8 h-8" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
  ];

  return (
    <section
      id="kenapa-memilih"
      className="bg-white py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* ── Header: slide masuk dari kiri ── */}
        <Animate type="slideleft" ready={ready} duration={0.95} margin="-40px">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <Title
              badge="Keunggulan"
              title="Mengapa Memilih Kami?"
              badgeVariant="default"
              containerClassName="items-start"
            />
          </div>
        </Animate>

        {/* ── Reasons: stagger + popin per card ── */}
        <Animate
          type="stagger"
          ready={ready}
          delayChildren={0.12}
          staggerChildren={0.2}
          margin="-40px"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {mainReasons.map((reason, index) => (
              <Animate
                key={reason.id}
                type="popin"
                ready={ready}
                duration={0.6}
              >
                <div className="relative h-full">
                  {index < mainReasons.length - 1 && (
                    <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 items-center justify-center">
                      <div className="w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 bg-mariner-500 rounded-full" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`${reason.color} rounded-2xl p-6 h-full shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`${reason.bgIcon} ${reason.iconColor} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}
                      >
                        {reason.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3
                          className={`text-base sm:text-lg font-bold ${reason.titleColor}`}
                        >
                          {reason.title}
                        </h3>
                        <p
                          className={`text-sm leading-relaxed ${reason.descriptionColor}`}
                        >
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Animate>
            ))}
          </div>
        </Animate>

        {/* ── Services: stagger + slideup per card ── */}
        <Animate
          type="stagger"
          ready={ready}
          delayChildren={0.08}
          staggerChildren={0.16}
          margin="-40px"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {services.map((service) => (
              <Animate
                key={service.id}
                type="slideup"
                ready={ready}
                duration={0.65}
              >
                <div className="group bg-gray-50 rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
                  <div
                    className={`${service.bgIcon} ${service.color} w-14 h-14 rounded-xl flex items-center justify-center shrink-0`}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-mariner-500 mb-3 leading-snug">
                      {service.title}
                    </h4>
                    <Button variant="secondary" size="sm">
                      {service.buttonText}
                    </Button>
                  </div>
                </div>
              </Animate>
            ))}
          </div>
        </Animate>
      </div>
    </section>
  );
};

export default KenapaMemilih;
