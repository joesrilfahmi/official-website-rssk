'use client'

export default function VisiMisi() {
    const visiPoints = [
        "Terwujudnya Rumah Sakit Siti Khodijah Muhammadiyah Cabang Sepanjang Yang Unggul, Profesional, Islami, Dan Terpercaya Di Jawa Timur."
    ];

    const misiPoints = [
        "Menyelenggarakan Pelayanan Dasar Jenjang Pelayanan Sedang Rumah Sakit Rujukan Utama Yang Bermutu, Profesional, Islami, Dan Sesuai Standar Akreditasi Universal (Akreditasi)",
        "Trauma & Injury Center, Heart & Stroke Care, Cancer Care, Gerontology Care, Hematology Center & Telemedicine Care",
        "Menyelenggarakan Pendidikan Kesehatan Yang Terpercaya",
        "Mengadakan Sumber Daya Insani Yang Excellent Dan Berakhlak Mulia",
        "Mengadakan Alat & Keselamatan Sarana Yang Berkesinambungan",
        "Mengoptimalkan Service Excellence Yang Sejahtera Dan Mudah"
    ];

    return (
        <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 ">
            <div className="max-w-7xl mx-auto">
                {/* Hero Image/Banner */}
                <div className="bg-linear-to-br from-mariner-100 to-mariner-200 rounded-3xl aspect-video relative overflow-hidden shadow-lg mb-12">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-mariner-500/20">
                            <svg className="w-32 h-32 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Hospital Profile */}
                <div className='space-y-8 mb-12'>
                    <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500'>
                        RS Siti Khodijah Muhammadiyah Cabang Sepanjang
                    </h2>
                    <p className='text-gray-700 leading-relaxed text-justify'>
                        RS Siti Khodijah Muhammadiyah Cabang Sepanjang merupakan rumah sakit yang berkomitmen memberikan pelayanan kesehatan terbaik dengan nilai-nilai Islami. Kami mengintegrasikan standar pelayanan medis modern dengan pendekatan yang humanis dan berakhlak mulia. Dengan fasilitas lengkap dan tenaga medis profesional, kami siap melayani masyarakat dengan sepenuh hati. Rumah sakit kami dilengkapi dengan berbagai layanan unggulan seperti Trauma & Injury Center, Heart & Stroke Care, Cancer Care, dan layanan spesialisasi lainnya yang terus berkembang mengikuti kebutuhan masyarakat. Sebagai bagian dari Persyarikatan Muhammadiyah, kami tidak hanya fokus pada pengobatan, tetapi juga pada pencegahan dan edukasi kesehatan kepada masyarakat. Kami percaya bahwa kesehatan adalah hak setiap individu, dan kami berupaya memberikan akses pelayanan kesehatan yang berkualitas dan terjangkau.
                    </p>
                </div>

                {/* Visi & Misi Title */}
                <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500 mb-8'>
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
                                <p key={index} className="text-gray-700 leading-relaxed text-justify">
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