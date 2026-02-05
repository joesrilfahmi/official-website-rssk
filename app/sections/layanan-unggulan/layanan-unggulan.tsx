"use client";
import Banner from "@/components/ui/custom/banner";
import { Activity, Bone, FileText, Heart, Stethoscope } from "lucide-react";
import React, { useEffect, useState } from "react";

interface MedicalCondition {
  title: string;
  description: string;
}

interface MedicalTechnology {
  title: string;
  description: string;
}

interface DoctorInfo {
  name: string;
  specialization: string;
  schedule?: string;
}

interface ServiceContent {
  title: string;
  description: string;
  specializations: string[];
  additionalInfo?: string;
  medicalConditions?: MedicalCondition[];
  medicalTechnologies?: MedicalTechnology[];
  doctors?: DoctorInfo[];
}

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  content: ServiceContent;
}

export default function LayananUnggulan() {
  const [selectedService, setSelectedService] = useState<string>("jantung");
  const [activeTab, setActiveTab] = useState<string>("kondisi");

  // Reset tab to "kondisi" when service changes
  useEffect(() => {
    setActiveTab("kondisi");
  }, [selectedService]);

  const services: Service[] = [
    {
      id: "jantung",
      name: "Jantung Care",
      icon: <Heart className="w-5 h-5" />,
      content: {
        title: "Jantung Care",
        description:
          "RS Siti Khodijah Muhammadiyah Cabang Sepanjang merupakan pusat layanan jantung terpadu yang memberikan pelayanan komprehensif dalam menangani berbagai golongan kardiovaskular pada pasien jantung pada semua usia.",
        specializations: [
          "Spesialis Jantung dan Pembuluh Darah Subspesialis Aritmia",
          "Spesialis Jantung dan Pembuluh Darah Subspesialis Bawaan",
          "Spesialis Jantung dan Pembuluh Darah Subspesialis Kardiologi Intervensi",
          "Spesialis Jantung dan Pembuluh Darah Subspesialis Kardiologi Pediatrik dan Penyakit Jantung Bawaan",
          "Spesialis Bedah Toraks, Kardiak, dan Vaskular",
          "Spesialis Jantung dan Pembuluh Darah Subspesialis Imaging dan Pencatatan Kardiovaskular",
        ],
        additionalInfo: `Dalam layanan diagnosis, tersedia pula berbagai tindakan Intervensi dan terapi jantung, meliputi tindakan kardiologi intervensi (PCI) dengan dukungan teknologi modern, tindakan ablasi aritmia, pemasangan Permanent Pacemaker (PPM), Cardiac Resynchronization Therapy (CRT), serta Implantable Cardioverter Defibrillator (ICD).

RS Siti Khodijah Muhammadiyah Cabang Sepanjang juga memiliki layanan bedah jantung dan pembuluh darah, termasuk Tindakan Bedah Pintas Koroner (Bypass/CABG) serta penanggulangan kelainan katup dan pembuluh darah besar jantung.`,
        medicalConditions: [
          {
            title: "Penyakit Jantung Koroner",
            description:
              "Kondisi akibat penyempitan atau sumbatan pada pembuluh darah koroner yang disebabkan oleh penumpukan lemak dan kolesterol, sehingga aliran darah ke otot jantung berkurang dan dapat memunculkan nyeri dada hingga serangan jantung.",
          },
          {
            title: "Aritmia (Gangguan Irama Jantung)",
            description:
              "Gangguan pada cara kerja sistem listrik jantung yang tidak normal, baik terlalu cepat, terlalu lambat, atau tidak beraturan. Kondisi ini dapat membuat tubuh lainnya berdetak terlalu cepat, terlalu lambat, atau tidak beraturan.",
          },
          {
            title: "Kelainan Katup Jantung",
            description:
              "Masalah pada katup jantung yang tidak berfungsi optimal sehingga aliran darah dalam jantung menjadi terganggu dan berpotensi membutuhkan sesak napas serta kelelahan.",
          },
          {
            title: "Penyakit Jantung Bawaan",
            description:
              "Kelainan struktur jantung yang sudah ada sejak lahir dan dapat mengganggu aliran darah, sehingga memerlukan pemantauan dan penanganan khusus sejak dini.",
          },
          {
            title: "Aneurisma Pembuluh Darah Jantung",
            description:
              "Kondisi peledakan anormal pada dinding pembuluh darah jantung akibat melemahnya jaringan pembuluh darah, yang berisiko pecah dan menyebabkan komplikasi serius.",
          },
          {
            title: "Kardiomiopati",
            description:
              "Kelainan pada otot jantung yang menyebabkan dinding jantung menebal, melentuk, atau membesar, sehingga kemampuan jantung dalam memompa darah ke seluruh tubuh menurun.",
          },
          {
            title: "Gagal Jantung",
            description:
              "Kondisi kronis ketika jantung tidak mampu memompa darah secara optimal untuk memenuhi kebutuhan oksigen tubuh, ditandai dengan mudah lelah, sesak napas, dan pembengkakan pada kaki.",
          },
          {
            title: "Perikarditis",
            description:
              "Peradangan pada selaputi pembungkus jantung (perikardium) yang dapat memunculkan nyeri dada, sesak napas, dan rasa tidak nyaman saat berbaring.",
          },
          {
            title: "Tumor Jantung",
            description:
              "Pertumbuhan jaringan abnormal pada jantung yang dapat mengganggu aliran darah dan fungsi jantung, baik bersifat jinak maupun ganas, sehingga memerlukan evaluasi medis lanjutan.",
          },
        ],
        medicalTechnologies: [
          {
            title: "MRI Jantung 1.5 Tesla",
            description:
              "Pemeriksaan jantung non-invasif dengan teknologi magnet canggih untuk melihat struktur dan fungsi jantung secara detail tanpa radiasi.",
          },
          {
            title: "CT Scan Jantung",
            description:
              "Pemeriksaan cepat untuk melihat kondisi jantung dan pembuluh darah, membantu deteksi penyumbatan atau kelainan jantung.",
          },
          {
            title: "Color Doppler Echocardiography",
            description:
              "USG jantung berwarna untuk melihat aliran darah dan fungsi katup jantung secara aman.",
          },
          {
            title: "Treadmill Test",
            description:
              "Tes jantung saat aktivitas fisik untuk menilai respons jantung, mendeteksi penyakit jantung, dan menentukan program latihan yang aman.",
          },
        ],
        doctors: [
          {
            name: "dr. Ahmad Syaifuddin, Sp.JP(K), FIHA",
            specialization: "Spesialis Jantung dan Pembuluh Darah - Konsultan",
          },
          {
            name: "dr. Budi Santoso, Sp.JP",
            specialization: "Spesialis Jantung dan Pembuluh Darah",
          },
          {
            name: "dr. Citra Dewi, Sp.JP",
            specialization: "Spesialis Jantung dan Pembuluh Darah",
          },
        ],
      },
    },
    {
      id: "orthopedi",
      name: "Orthopedi Care",
      icon: <Bone className="w-5 h-5" />,
      content: {
        title: "Orthopedi Care",
        description:
          "Layanan orthopedi kami menyediakan perawatan komprehensif untuk masalah tulang, sendi, dan otot dengan teknologi terkini dan tim dokter spesialis berpengalaman.",
        specializations: [
          "Bedah Tulang dan Sendi",
          "Penanganan Patah Tulang dan Cedera Olahraga",
          "Operasi Penggantian Sendi (Total Joint Replacement)",
          "Arthroscopy",
          "Spinal Surgery (Bedah Tulang Belakang)",
          "Pediatric Orthopedi",
        ],
        additionalInfo: `Dilengkapi dengan fasilitas fisioterapi modern untuk rehabilitasi pasca operasi dan pemulihan cedera. Tim kami terdiri dari dokter spesialis orthopedi yang berpengalaman dalam menangani berbagai kasus dari yang sederhana hingga kompleks.`,
        medicalConditions: [
          {
            title: "Fraktur (Patah Tulang)",
            description:
              "Penanganan berbagai jenis patah tulang akibat trauma atau kecelakaan dengan metode konservatif maupun operatif.",
          },
          {
            title: "Osteoarthritis",
            description:
              "Peradangan sendi degeneratif yang menyebabkan nyeri dan kekakuan, terutama pada lutut, pinggul, dan tulang belakang.",
          },
          {
            title: "Cedera Ligamen",
            description:
              "Penanganan cedera ligamen seperti ACL, PCL, dan meniscus dengan teknik arthroscopy minimal invasif.",
          },
          {
            title: "Skoliosis",
            description:
              "Kelainan tulang belakang yang melengkung ke samping, memerlukan pemantauan dan penanganan khusus.",
          },
          {
            title: "Carpal Tunnel Syndrome",
            description:
              "Gangguan saraf di pergelangan tangan yang menyebabkan kesemutan dan nyeri pada jari-jari tangan.",
          },
        ],
        medicalTechnologies: [
          {
            title: "Arthroscopy",
            description:
              "Teknik bedah minimal invasif menggunakan kamera kecil untuk melihat dan memperbaiki kerusakan di dalam sendi.",
          },
          {
            title: "C-Arm Fluoroscopy",
            description:
              "Alat pencitraan real-time untuk memandu prosedur bedah orthopedi dengan presisi tinggi.",
          },
          {
            title: "MRI Musculoskeletal",
            description:
              "Pemeriksaan pencitraan detail untuk mendiagnosis masalah pada tulang, sendi, otot, dan ligamen.",
          },
          {
            title: "Bone Densitometry (DEXA Scan)",
            description:
              "Pemeriksaan kepadatan tulang untuk mendeteksi osteoporosis dan risiko patah tulang.",
          },
        ],
        doctors: [
          {
            name: "dr. Eko Prasetyo, Sp.OT(K)",
            specialization: "Spesialis Bedah Orthopedi - Konsultan Spine",
          },
          {
            name: "dr. Fitri Handayani, Sp.OT",
            specialization: "Spesialis Bedah Orthopedi",
          },
          {
            name: "dr. Gunawan Wibowo, Sp.OT",
            specialization: "Spesialis Bedah Orthopedi",
          },
        ],
      },
    },
    {
      id: "kanker",
      name: "Kanker Care",
      icon: <Activity className="w-5 h-5" />,
      content: {
        title: "Kanker Care",
        description:
          "Pusat layanan kanker terpadu yang menyediakan diagnosis, pengobatan, dan perawatan komprehensif untuk pasien kanker dengan pendekatan multidisiplin.",
        specializations: [
          "Kemoterapi",
          "Radioterapi",
          "Bedah Onkologi",
          "Imunoterapi",
          "Terapi Target",
          "Perawatan Paliatif",
        ],
        additionalInfo: `Didukung oleh tim multidisiplin yang terdiri dari dokter spesialis onkologi, radiologi, patologi, dan perawat onkologi terlatih. Kami menyediakan fasilitas kemoterapi day care yang nyaman dan peralatan radioterapi modern untuk memberikan perawatan terbaik bagi pasien kanker.`,
        medicalConditions: [
          {
            title: "Kanker Payudara",
            description:
              "Diagnosis dan penanganan komprehensif kanker payudara dengan berbagai modalitas terapi sesuai stadium.",
          },
          {
            title: "Kanker Paru-paru",
            description:
              "Penanganan kanker paru dengan terapi kombinasi kemoterapi, radioterapi, dan targeted therapy.",
          },
          {
            title: "Kanker Kolorektal",
            description:
              "Penanganan kanker usus besar dan rektum dengan pendekatan bedah dan terapi adjuvan.",
          },
          {
            title: "Kanker Serviks",
            description:
              "Program skrining, deteksi dini, dan penanganan kanker leher rahim dengan berbagai metode terapi.",
          },
          {
            title: "Kanker Prostat",
            description:
              "Diagnosis dan penanganan kanker prostat dengan pendekatan individual sesuai kondisi pasien.",
          },
          {
            title: "Leukemia",
            description:
              "Penanganan kanker darah dengan kemoterapi intensif dan perawatan suportif komprehensif.",
          },
        ],
        medicalTechnologies: [
          {
            title: "Linear Accelerator (LINAC)",
            description:
              "Teknologi radioterapi canggih untuk memberikan radiasi presisi tinggi pada sel kanker dengan minimal kerusakan jaringan sehat.",
          },
          {
            title: "PET-CT Scan",
            description:
              "Pemeriksaan pencitraan kombinasi untuk deteksi dan staging kanker dengan akurasi tinggi.",
          },
          {
            title: "Mammografi Digital",
            description:
              "Skrining dan diagnosis kanker payudara dengan teknologi digital untuk hasil lebih akurat.",
          },
          {
            title: "Kemoterapi Day Care",
            description:
              "Fasilitas kemoterapi rawat jalan yang nyaman dengan peralatan modern dan tim medis berpengalaman.",
          },
        ],
        doctors: [
          {
            name: "dr. Hendra Kusuma, Sp.PD-KHOM",
            specialization:
              "Spesialis Penyakit Dalam - Konsultan Hematologi Onkologi Medik",
          },
          {
            name: "dr. Indah Permata, Sp.Rad(K)Onk.Rad",
            specialization: "Spesialis Radiologi - Konsultan Onkologi Radiasi",
          },
          {
            name: "dr. Jessica Tan, Sp.B(K)Onk",
            specialization: "Spesialis Bedah - Konsultan Bedah Onkologi",
          },
        ],
      },
    },
    {
      id: "radiologi",
      name: "Radiologi Center",
      icon: <FileText className="w-5 h-5" />,
      content: {
        title: "Radiologi Center",
        description:
          "Pusat diagnostik pencitraan medis dengan teknologi terkini untuk mendukung diagnosis yang akurat dan cepat.",
        specializations: [
          "CT-Scan (Computed Tomography)",
          "MRI (Magnetic Resonance Imaging)",
          "USG (Ultrasonografi) 4D",
          "Rontgen Digital",
          "Mammografi Digital",
          "Fluoroscopy",
        ],
        additionalInfo: `Dilengkapi dengan peralatan radiologi terkini dan tim radiografer serta dokter spesialis radiologi yang berpengalaman. Hasil pemeriksaan dapat diakses secara digital dengan sistem PACS (Picture Archiving and Communication System) untuk kemudahan konsultasi dan second opinion.`,
        medicalConditions: [
          {
            title: "Deteksi Tumor dan Kanker",
            description:
              "Pemeriksaan pencitraan untuk mendeteksi, menentukan lokasi, dan mengukur ukuran tumor di berbagai organ tubuh.",
          },
          {
            title: "Penyakit Kardiovaskular",
            description:
              "Evaluasi kondisi jantung dan pembuluh darah menggunakan CT Angiografi dan MRI Jantung.",
          },
          {
            title: "Gangguan Neurologis",
            description:
              "Diagnosis penyakit otak dan saraf seperti stroke, tumor otak, dan multiple sclerosis dengan MRI.",
          },
          {
            title: "Penyakit Paru",
            description:
              "Deteksi pneumonia, TB, PPOK, dan kanker paru melalui rontgen thorax dan CT Scan.",
          },
          {
            title: "Kelainan Muskuloskeletal",
            description:
              "Evaluasi patah tulang, cedera ligamen, dan gangguan sendi dengan berbagai modalitas pencitraan.",
          },
        ],
        medicalTechnologies: [
          {
            title: "CT-Scan 128 Slice",
            description:
              "Teknologi CT-Scan canggih untuk pencitraan cepat dan detail dengan radiasi minimal.",
          },
          {
            title: "MRI 1.5 Tesla",
            description:
              "Pemeriksaan pencitraan tanpa radiasi untuk detail jaringan lunak yang superior.",
          },
          {
            title: "USG 4D Color Doppler",
            description:
              "Ultrasonografi 4 dimensi dengan color doppler untuk pemeriksaan kehamilan dan pembuluh darah.",
          },
          {
            title: "Digital Radiography (DR)",
            description:
              "Sistem rontgen digital untuk hasil cepat dengan kualitas gambar tinggi dan radiasi rendah.",
          },
          {
            title: "Mammografi Digital",
            description:
              "Skrining dan diagnosis kanker payudara dengan teknologi digital resolusi tinggi.",
          },
          {
            title: "PACS System",
            description:
              "Sistem penyimpanan dan distribusi gambar digital untuk akses mudah dan konsultasi jarak jauh.",
          },
        ],
        doctors: [
          {
            name: "dr. Kartika Sari, Sp.Rad",
            specialization: "Spesialis Radiologi",
          },
          {
            name: "dr. Lukman Hakim, Sp.Rad",
            specialization: "Spesialis Radiologi",
          },
          {
            name: "dr. Maya Dewi, Sp.Rad",
            specialization: "Spesialis Radiologi",
          },
        ],
      },
    },
    {
      id: "urologi",
      name: "Urologi Center",
      icon: <Stethoscope className="w-5 h-5" />,
      content: {
        title: "Urologi Center",
        description:
          "Layanan spesialis urologi untuk menangani gangguan sistem kemih dan reproduksi pria dengan teknologi minimal invasif.",
        specializations: [
          "ESWL (Extracorporeal Shock Wave Lithotripsy) untuk Batu Ginjal",
          "Endourologi",
          "Bedah Prostat",
          "Urologi Anak",
          "Urologi Onkologi",
          "Andrologi dan Infertilitas Pria",
        ],
        additionalInfo: `Dilengkapi dengan teknologi ESWL untuk penanganan batu ginjal tanpa operasi dan fasilitas endourologi untuk tindakan minimal invasif. Tim kami terdiri dari dokter spesialis urologi yang berpengalaman dalam menangani berbagai kondisi urologi dari yang sederhana hingga kompleks.`,
        medicalConditions: [
          {
            title: "Batu Saluran Kemih",
            description:
              "Penanganan batu ginjal, ureter, dan kandung kemih dengan metode ESWL, endoskopi, atau pembedahan.",
          },
          {
            title: "Pembesaran Prostat (BPH)",
            description:
              "Diagnosis dan terapi pembesaran prostat jinak yang menyebabkan gangguan berkemih.",
          },
          {
            title: "Infeksi Saluran Kemih",
            description:
              "Penanganan infeksi berulang pada ginjal, ureter, kandung kemih, dan uretra.",
          },
          {
            title: "Kanker Urologi",
            description:
              "Diagnosis dan penanganan kanker ginjal, kandung kemih, prostat, dan testis.",
          },
          {
            title: "Disfungsi Ereksi",
            description:
              "Evaluasi dan terapi gangguan fungsi seksual pria dengan pendekatan medis dan minimal invasif.",
          },
          {
            title: "Inkontinensia Urin",
            description:
              "Penanganan gangguan kontrol berkemih pada pria dan wanita.",
          },
        ],
        medicalTechnologies: [
          {
            title: "ESWL (Extracorporeal Shock Wave Lithotripsy)",
            description:
              "Teknologi penghancur batu ginjal tanpa sayatan menggunakan gelombang kejut dari luar tubuh.",
          },
          {
            title: "Ureteroscopy (URS)",
            description:
              "Prosedur endoskopi untuk melihat dan mengatasi masalah di ureter dan ginjal secara minimal invasif.",
          },
          {
            title: "Transurethral Resection of Prostate (TURP)",
            description:
              "Teknik bedah minimal invasif untuk mengangkat jaringan prostat yang membesar.",
          },
          {
            title: "Uroflowmetry",
            description:
              "Pemeriksaan untuk mengukur kecepatan dan volume aliran urin guna mendeteksi gangguan berkemih.",
          },
          {
            title: "Cystoscopy",
            description:
              "Pemeriksaan endoskopi untuk melihat bagian dalam kandung kemih dan uretra.",
          },
        ],
        doctors: [
          {
            name: "dr. Nugroho Wijaya, Sp.U",
            specialization: "Spesialis Urologi",
          },
          {
            name: "dr. Okta Ramadhan, Sp.U",
            specialization: "Spesialis Urologi",
          },
          {
            name: "dr. Putri Andini, Sp.U",
            specialization: "Spesialis Urologi",
          },
        ],
      },
    },
  ];

  const currentService = services.find(
    (s) => s.id === selectedService,
  )?.content;

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Layanan Unggulan"
          subtitle="Kami menyediakan layanan urologi terbaik untuk memenuhi kebutuhan kesehatan Anda."
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          {/* Left Sidebar - Service List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-100 rounded-2xl p-2 space-y-2 sticky top-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                    selectedService === service.id
                      ? "bg-white shadow-md text-mariner-600 font-semibold"
                      : "text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <span
                    className={
                      selectedService === service.id
                        ? "text-mariner-600"
                        : "text-gray-500"
                    }
                  >
                    {service.icon}
                  </span>
                  <span className="text-base">{service.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              {currentService && (
                <div className="space-y-6">
                  {/* Title */}
                  <h2 className="text-3xl font-bold text-mariner-600 mb-6">
                    {currentService.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-700 text-base leading-relaxed">
                    {currentService.description}
                  </p>

                  {/* Specializations */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-mariner-600 mb-4">
                      Layanan yang Tersedia:
                    </h3>
                    <ul className="space-y-3">
                      {currentService.specializations.map((spec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-mariner-500 rounded-full mt-2 mr-3 shrink-0"></span>
                          <span className="text-gray-700 text-base">
                            {spec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Additional Info */}
                  {currentService.additionalInfo && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                        {currentService.additionalInfo}
                      </p>
                    </div>
                  )}

                  {/* Jadwal Praktik Dokter Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-2xl font-bold text-mariner-600 mb-2">
                      Jadwal Praktik Dokter RS Siti Khodijah Muhammadiyah Cabang
                      Sepanjang
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Klinik rawat jalan Layanan Jantung buka Senin - Sabtu
                      mulai pukul 07.00-20.00, memberikan fleksibilitas bagi
                      Anda untuk membuat janji temu sesuai dengan waktu yang
                      tersedia.
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200">
                      <button
                        onClick={() => setActiveTab("kondisi")}
                        className={`px-6 py-3 font-medium transition-all ${
                          activeTab === "kondisi"
                            ? "text-mariner-600 border-b-2 border-mariner-600"
                            : "text-gray-600 hover:text-mariner-600"
                        }`}
                      >
                        Kondisi Medis
                      </button>
                      <button
                        onClick={() => setActiveTab("teknologi")}
                        className={`px-6 py-3 font-medium transition-all ${
                          activeTab === "teknologi"
                            ? "text-mariner-600 border-b-2 border-mariner-600"
                            : "text-gray-600 hover:text-mariner-600"
                        }`}
                      >
                        Teknologi Medis
                      </button>
                      <button
                        onClick={() => setActiveTab("dokter")}
                        className={`px-6 py-3 font-medium transition-all ${
                          activeTab === "dokter"
                            ? "text-mariner-600 border-b-2 border-mariner-600"
                            : "text-gray-600 hover:text-mariner-600"
                        }`}
                      >
                        Dokter Kami
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      {/* Kondisi Medis Tab */}
                      {activeTab === "kondisi" &&
                        currentService?.medicalConditions && (
                          <div className="space-y-4">
                            {currentService.medicalConditions.map(
                              (condition, index) => (
                                <div
                                  key={index}
                                  className="bg-white rounded-lg p-4 shadow-sm"
                                >
                                  <h4 className="font-semibold text-mariner-600 mb-2">
                                    {condition.title}
                                  </h4>
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {condition.description}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                      {/* Teknologi Medis Tab */}
                      {activeTab === "teknologi" &&
                        currentService?.medicalTechnologies && (
                          <div className="space-y-4">
                            {currentService.medicalTechnologies.map(
                              (tech, index) => (
                                <div
                                  key={index}
                                  className="bg-white rounded-lg p-4 shadow-sm"
                                >
                                  <h4 className="font-semibold text-mariner-600 mb-2">
                                    {tech.title}
                                  </h4>
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {tech.description}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                      {/* Dokter Kami Tab */}
                      {activeTab === "dokter" && currentService?.doctors && (
                        <div className="space-y-4">
                          {currentService.doctors.map((doctor, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 shadow-sm"
                            >
                              <h4 className="font-semibold text-mariner-600 mb-1">
                                {doctor.name}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {doctor.specialization}
                              </p>
                              {doctor.schedule && (
                                <p className="text-gray-500 text-sm mt-2">
                                  {doctor.schedule}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fallback if no data */}
                      {((activeTab === "kondisi" &&
                        !currentService?.medicalConditions) ||
                        (activeTab === "teknologi" &&
                          !currentService?.medicalTechnologies) ||
                        (activeTab === "dokter" &&
                          !currentService?.doctors)) && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            Informasi tidak tersedia untuk layanan ini.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
