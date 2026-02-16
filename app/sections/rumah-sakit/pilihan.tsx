"use client";
import Button from "@/components/ui/custom/button";
import { Ambulance, Award, Stethoscope, Users, Zap } from "lucide-react";
import React from "react";

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
      descriptionColor: "text-white",
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
      bgIcon: "bg-white border border-mariner-500",
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
      bgIcon: "bg-white border border-mariner-500",
    },
  ];

  const services: Service[] = [
    {
      id: 1,
      title: "Cari dokter & Jadwal Dokter",
      buttonText: "Klik Disini",
      icon: <Stethoscope className="w-10 h-10" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
    {
      id: 2,
      title: "Ambulance Emergency",
      buttonText: "Hubungi",
      icon: <Ambulance className="w-10 h-10" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
    {
      id: 3,
      title: "Buat Janji Dokter Golden Eksekutif",
      buttonText: "Hubungi",
      icon: <Award className="w-10 h-10" />,
      color: "text-red-500",
      bgIcon: "bg-red-50",
    },
  ];

  return (
    <section
      id="kenapa-memilih"
      className="bg-white py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8 sm:space-y-10 md:space-y-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500">
                Mengapa Anda Harus Memilih
                <br />
                Rumah Sakit Siti Khodijah
                <br />
                Muhammadiyah Cabang Sepanjang?
              </h2>
            </div>

            <div className="pt-2 shrink-0">
              <Button variant="primary" size="md">
                Selengkapnya
              </Button>
            </div>
          </div>

          {/* Main Reasons Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 relative py-4 sm:py-6 md:py-8">
            {mainReasons.map((reason, index) => (
              <div key={reason.id} className="relative">
                {/* Connector dot */}
                {index < mainReasons.length - 1 && (
                  <div className="hidden md:block absolute -right-[25px] top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-7 h-7 bg-gray-300 border-4 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-mariner-600 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`${reason.color} rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 h-full shadow-md hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`${reason.bgIcon} ${reason.iconColor} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0`}
                    >
                      {reason.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 sm:space-y-2">
                      <h3
                        className={`text-base sm:text-lg font-semibold ${reason.titleColor}`}
                      >
                        {reason.title}
                      </h3>
                      <p className={`text-sm ${reason.descriptionColor}`}>
                        {reason.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Services Section */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex flex-col w-full h-full gap-4 sm:gap-5 md:gap-6">
                    {/* Icon dan Title */}
                    <div className="flex items-start justify-start w-full gap-3 sm:gap-4">
                      {/* Icon */}
                      <div
                        className={`${service.bgIcon} ${service.color} w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center shrink-0`}
                      >
                        {service.icon}
                      </div>

                      {/* Title */}
                      <div className="flex-1 flex flex-col gap-3">
                        <h4 className="text-base sm:text-lg font-semibold text-mariner-500">
                          {service.title}
                        </h4>
                        <div className="mt-auto items-center justify-start flex">
                          <Button variant="secondary" size="sm">
                            {service.buttonText}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Button */}
          {/* <div className="flex justify-center pt-4 sm:pt-6 md:pt-8 pb-2">
                        <Button variant="primary" size="lg">
                            Cari Dokter Kamu Disini
                        </Button>
                    </div> */}
        </div>
      </div>
    </section>
  );
};

export default KenapaMemilih;
