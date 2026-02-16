"use client";
import Banner from "@/components/ui/custom/banner";
import { Profile } from "@/config/profile";
import { Mail, MapPin, Phone } from "lucide-react";

const Kontak = () => {
  const handlePhoneClick = () => {
    window.location.href = `tel:${Profile.phone}`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${Profile.email}`;
  };

  const handleMapClick = () => {
    // Encode address untuk Google Maps
    const encodedAddress = encodeURIComponent(Profile.address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank",
    );
  };

  return (
    <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Banner
          title="Hubungi Kami"
          subtitle="Kami siap membantu Anda. Jangan ragu untuk menghubungi kami melalui saluran komunikasi berikut"
        />

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-16">
          {/* Phone Card */}
          <div
            onClick={handlePhoneClick}
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
          >
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-linear-to-br from-bittersweet-500 to-bittersweet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="bg-bittersweet-100 group-hover:bg-white rounded-2xl p-6 transition-colors duration-300">
                  <Phone className="w-12 h-12 text-bittersweet-500 group-hover:text-bittersweet-600 transition-colors duration-300" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-center font-bold text-2xl mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">
                Telepon
              </h3>
              <p className="text-center text-gray-600 group-hover:text-white text-sm mb-4 transition-colors duration-300">
                Hubungi kami melalui telepon
              </p>
              <p className="text-center font-semibold text-lg text-bittersweet-600 group-hover:text-white transition-colors duration-300">
                {Profile.phone}
              </p>
            </div>
          </div>

          {/* Email Card */}
          <div
            onClick={handleEmailClick}
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
          >
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-linear-to-br from-greenfresh-500 to-greenfresh-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="bg-greenfresh-100 group-hover:bg-white rounded-2xl p-6 transition-colors duration-300">
                  <Mail className="w-12 h-12 text-greenfresh-600 group-hover:text-greenfresh-600 transition-colors duration-300" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-center font-bold text-2xl mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">
                Email
              </h3>
              <p className="text-center text-gray-600 group-hover:text-white text-sm mb-4 transition-colors duration-300">
                Kirim email kepada kami
              </p>
              <p className="text-center font-semibold text-base text-greenfresh-600 group-hover:text-white transition-colors duration-300 wrap-break-word">
                {Profile.email}
              </p>
            </div>
          </div>

          {/* Address Card */}
          <div
            onClick={handleMapClick}
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
          >
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-linear-to-br from-mariner-500 to-mariner-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="bg-mariner-100 group-hover:bg-white rounded-2xl p-6 transition-colors duration-300">
                  <MapPin className="w-12 h-12 text-mariner-600 group-hover:text-mariner-600 transition-colors duration-300" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-center font-bold text-2xl mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">
                Alamat
              </h3>
              <p className="text-center text-gray-600 group-hover:text-white text-sm mb-4 transition-colors duration-300">
                Lihat lokasi kami di peta
              </p>
              <p className="text-center font-semibold text-base text-mariner-600 group-hover:text-white transition-colors duration-300">
                {Profile.address}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kontak;
