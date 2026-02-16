"use client";
import { Profile } from "@/config/profile";

export default function VisiMisi() {
  const visiPoints = [
    `Terwujudnya Rumah Sakit ${Profile.name} ${Profile.subtitle} Yang Unggul, Profesional, Islami, Dan Terpercaya Di Jawa Timur.`,
  ];

  const misiPoints = [
    "Menyelenggarakan Pelayanan Dasar Jenjang Pelayanan Sedang Rumah Sakit Rujukan Utama Yang Bermutu, Profesional, Islami, Dan Sesuai Standar Akreditasi Universal (Akreditasi)",
    "Trauma & Injury Center, Heart & Stroke Care, Cancer Care, Gerontology Care, Hematology Center & Telemedicine Care",
    "Menyelenggarakan Pendidikan Kesehatan Yang Terpercaya",
    "Mengadakan Sumber Daya Insani Yang Excellent Dan Berakhlak Mulia",
    "Mengadakan Alat & Keselamatan Sarana Yang Berkesinambungan",
    "Mengoptimalkan Service Excellence Yang Sejahtera Dan Mudah",
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Hero Image/Banner */}
        <div className="bg-linear-to-br from-mariner-100 to-mariner-200 rounded-3xl aspect-video relative overflow-hidden shadow-lg mb-12">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-mariner-500/20">
              <svg
                className="w-32 h-32 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hospital Profile */}
        <div className="space-y-8 mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500">
            RS {Profile.name} {Profile.subtitle}
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
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
            Khodijah Muhammadiyah Cabang Sepanjang menghadirkan fasilitas rawat
            inap dengan konsep modern, salah satunya adalah President Suite
            dengan desain kamar rawat inap satu pasien satu kamar, yang
            memberikan suasana yang lebih privat, nyaman, dan bersahabat bagi
            pasien maupun keluarga
          </p>
        </div>

        {/* Visi & Misi Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500 mb-8">
          Visi & Misi
        </h2>

        {/* Visi & Misi Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visi Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-mariner-500">Visi</h3>
            </div>

            <div className="pl-0">
              {visiPoints.map((point, index) => (
                <p
                  key={index}
                  className="text-gray-700 leading-relaxed text-justify"
                >
                  {point}
                </p>
              ))}
            </div>
          </div>

          {/* Misi Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-mariner-500">Misi</h3>
            </div>

            <div className="space-y-3">
              {misiPoints.map((point, index) => (
                <div key={index} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 bg-mariner-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 text-justify">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
