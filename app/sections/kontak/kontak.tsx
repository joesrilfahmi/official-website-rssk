"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import { Profile } from "@/config/profile";
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

const Kontak = () => {
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDataReady(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handlePhoneClick = () => {
    window.location.href = `tel:${Profile.phone}`;
  };
  const handleEmailClick = () => {
    window.location.href = `mailto:${Profile.email}`;
  };
  const handleMapClick = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(Profile.address)}`,
      "_blank",
    );
  };

  const cards = [
    {
      onClick: handlePhoneClick,
      gradient: "from-bittersweet-500 to-bittersweet-600",
      iconBg: "bg-bittersweet-100 group-hover:bg-white",
      Icon: Phone,
      iconColor: "text-bittersweet-500",
      title: "Telepon",
      subtitle: "Hubungi kami melalui telepon",
      value: Profile.phone,
      valueColor: "text-bittersweet-600",
    },
    {
      onClick: handleEmailClick,
      gradient: "from-greenfresh-500 to-greenfresh-600",
      iconBg: "bg-greenfresh-100 group-hover:bg-white",
      Icon: Mail,
      iconColor: "text-greenfresh-600",
      title: "Email",
      subtitle: "Kirim email kepada kami",
      value: Profile.email,
      valueColor: "text-greenfresh-600",
    },
    {
      onClick: handleMapClick,
      gradient: "from-mariner-500 to-mariner-600",
      iconBg: "bg-mariner-100 group-hover:bg-white",
      Icon: MapPin,
      iconColor: "text-mariner-600",
      title: "Alamat",
      subtitle: "Lihat lokasi kami di peta",
      value: Profile.address,
      valueColor: "text-mariner-600",
    },
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Hubungi Kami"
            subtitle="Kami siap membantu Anda. Jangan ragu untuk menghubungi kami melalui saluran komunikasi berikut"
          />
        </Animate>

        {/* Cards — equal height via items-stretch on the grid */}
        <Animate
          type="stagger"
          staggerChildren={0.12}
          delayChildren={0.1}
          ready={dataReady}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-16 items-stretch"
        >
          {cards.map(
            ({
              onClick,
              gradient,
              iconBg,
              Icon,
              iconColor,
              title,
              subtitle,
              value,
              valueColor,
            }) => (
              <Animate key={title} type="slideup" className="h-full">
                <div
                  onClick={onClick}
                  className="h-full bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group relative overflow-hidden flex flex-col"
                >
                  {/* Hover gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className="relative z-10 flex flex-col flex-1">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div
                        className={`${iconBg} rounded-2xl p-6 transition-colors duration-300`}
                      >
                        <Icon
                          className={`w-12 h-12 ${iconColor} transition-colors duration-300`}
                        />
                      </div>
                    </div>

                    {/* Title + subtitle */}
                    <h3 className="text-center font-bold text-2xl mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">
                      {title}
                    </h3>
                    <p className="text-center text-gray-600 group-hover:text-white text-sm mb-4 transition-colors duration-300">
                      {subtitle}
                    </p>

                    {/* Value — pushed to bottom so all cards align */}
                    <p
                      className={`mt-auto text-center font-semibold text-base ${valueColor} group-hover:text-white transition-colors duration-300 wrap-break-word`}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              </Animate>
            ),
          )}
        </Animate>
      </div>
    </div>
  );
};

export default Kontak;
