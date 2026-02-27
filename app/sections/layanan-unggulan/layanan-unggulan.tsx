"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import { supabase } from "@/lib/supabase/client";
import {
  Activity,
  Baby,
  Bone,
  Brain,
  Eye,
  FileText,
  Heart,
  Stethoscope,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface KondisiMedis {
  id: string;
  title: string;
  description: string;
  urutan: number;
}

interface TeknologiMedis {
  id: string;
  title: string;
  description: string;
  urutan: number;
}

interface DokterItem {
  dokter_id: string;
  dokter: {
    nama: string;
    poli: { nama_poli: string } | null;
  } | null;
}

interface LayananUnggulan {
  id: string;
  title: string;
  description: string;
  specializations: string[];
  additional_info: string | null;
  icon: string;
  status: string;
  urutan: number;
  poli: { nama_poli: string } | null;
  layanan_unggulan_kondisi: KondisiMedis[];
  layanan_unggulan_teknologi: TeknologiMedis[];
  layanan_unggulan_dokter: DokterItem[];
}

// ── Icon resolver ──────────────────────────────────────────────────────────

function resolveIcon(iconName: string, className = "w-5 h-5"): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    heart: <Heart className={className} />,
    bone: <Bone className={className} />,
    activity: <Activity className={className} />,
    "file-text": <FileText className={className} />,
    stethoscope: <Stethoscope className={className} />,
    brain: <Brain className={className} />,
    eye: <Eye className={className} />,
    baby: <Baby className={className} />,
  };
  return map[iconName] ?? <Stethoscope className={className} />;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="bg-gray-100 rounded-2xl p-2 space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 rounded-xl bg-white/60 animate-pulse flex items-center gap-3"
        >
          <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-4/6 bg-gray-100 rounded" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-100 rounded" />
        ))}
      </div>
      <div className="pt-6 border-t border-gray-100 space-y-3">
        <div className="h-6 w-56 bg-gray-200 rounded" />
        <div className="flex gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-4/5 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LayananUnggulanSection() {
  const [services, setServices] = useState<LayananUnggulan[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "kondisi" | "teknologi" | "dokter"
  >("kondisi");
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Reset tab when service changes
  useEffect(() => {
    setActiveTab("kondisi");
  }, [selectedId]);

  useEffect(() => {
    fetchLayanan();

    const channel = supabase
      .channel("layanan_unggulan_section")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "layanan_unggulan" },
        () => {
          fetchLayanan();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLayanan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("layanan_unggulan")
        .select(
          `
          id, title, description, specializations, additional_info, icon, status, urutan,
          poli:poli_id(nama_poli),
          layanan_unggulan_kondisi(id, title, description, urutan),
          layanan_unggulan_teknologi(id, title, description, urutan),
          layanan_unggulan_dokter(
            dokter_id,
            dokter:dokter_id(nama, poli:poli_id(nama_poli))
          )
        `,
        )
        .eq("status", "active")
        .order("urutan", { ascending: true });

      if (error) throw error;

      const result = (data ?? []) as unknown as LayananUnggulan[];
      // Sort sub-arrays by urutan
      result.forEach((s) => {
        s.layanan_unggulan_kondisi?.sort((a, b) => a.urutan - b.urutan);
        s.layanan_unggulan_teknologi?.sort((a, b) => a.urutan - b.urutan);
      });

      setServices(result);
      if (result.length > 0) setSelectedId(result[0].id);
    } catch (err) {
      console.error("Error fetching layanan unggulan:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setDataReady(true), 120);
    }
  };

  const current = services.find((s) => s.id === selectedId);

  const hasKondisi = (current?.layanan_unggulan_kondisi?.length ?? 0) > 0;
  const hasTeknologi = (current?.layanan_unggulan_teknologi?.length ?? 0) > 0;
  const hasDokter = (current?.layanan_unggulan_dokter?.length ?? 0) > 0;

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Layanan Unggulan"
            subtitle="Kami menyediakan layanan terbaik untuk memenuhi kebutuhan kesehatan Anda."
          />
        </Animate>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          {/* ── Sidebar ── */}
          <Animate type="slideleft" ready={dataReady} className="lg:col-span-1">
            {loading ? (
              <SidebarSkeleton />
            ) : services.length === 0 ? (
              <div className="bg-gray-100 rounded-2xl p-6 text-center text-gray-400 text-sm">
                Belum ada layanan tersedia.
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-2 space-y-2 sticky top-4">
                <Animate
                  type="stagger"
                  staggerChildren={0.08}
                  delayChildren={0.1}
                  ready={dataReady}
                >
                  {services.map((service) => (
                    <Animate key={service.id} type="fielditem">
                      <button
                        onClick={() => setSelectedId(service.id)}
                        className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          selectedId === service.id
                            ? "bg-white shadow-md text-mariner-600 font-semibold"
                            : "text-gray-700 hover:bg-white/50"
                        }`}
                      >
                        <span
                          className={
                            selectedId === service.id
                              ? "text-mariner-600"
                              : "text-gray-500"
                          }
                        >
                          {resolveIcon(service.icon)}
                        </span>
                        <span className="text-base">{service.title}</span>
                      </button>
                    </Animate>
                  ))}
                </Animate>
              </div>
            )}
          </Animate>

          {/* ── Content ── */}
          <Animate
            type="slideright"
            ready={dataReady}
            delay={0.1}
            className="lg:col-span-3"
          >
            {loading ? (
              <ContentSkeleton />
            ) : !current ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400">
                Pilih layanan di sebelah kiri.
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
                <div className="space-y-6">
                  {/* Title */}
                  <Animate type="fadein" ready={dataReady}>
                    <h2 className="text-3xl font-bold text-mariner-600 mb-6">
                      {current.title}
                    </h2>
                  </Animate>

                  {/* Description */}
                  <Animate type="fadein" ready={dataReady} delay={0.05}>
                    <p className="text-gray-700 text-base leading-relaxed">
                      {current.description}
                    </p>
                  </Animate>

                  {/* Specializations */}
                  {current.specializations?.length > 0 && (
                    <Animate type="fadein" ready={dataReady} delay={0.1}>
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-mariner-600 mb-4">
                          Layanan yang Tersedia:
                        </h3>
                        <Animate
                          type="stagger"
                          staggerChildren={0.07}
                          delayChildren={0.05}
                          ready={dataReady}
                        >
                          {current.specializations.map((spec, index) => (
                            <Animate key={index} type="slideleftitem">
                              <li className="flex items-start list-none">
                                <span className="inline-block w-2 h-2 bg-mariner-500 rounded-full mt-2 mr-3 shrink-0" />
                                <span className="text-gray-700 text-base">
                                  {spec}
                                </span>
                              </li>
                            </Animate>
                          ))}
                        </Animate>
                      </div>
                    </Animate>
                  )}

                  {/* Additional Info */}
                  {current.additional_info && (
                    <Animate type="fadein" ready={dataReady} delay={0.15}>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                          {current.additional_info}
                        </p>
                      </div>
                    </Animate>
                  )}

                  {/* Tabs Section */}
                  <Animate type="slideup" ready={dataReady} delay={0.2}>
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-2xl font-bold text-mariner-600 mb-2">
                        Jadwal Praktik Dokter RS Siti Khodijah Muhammadiyah
                        Cabang Sepanjang
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Klinik rawat jalan{" "}
                        {current.poli?.nama_poli
                          ? `Layanan ${current.poli.nama_poli}`
                          : "Layanan"}{" "}
                        buka Senin – Sabtu mulai pukul 07.00–20.00, memberikan
                        fleksibilitas bagi Anda untuk membuat janji temu sesuai
                        dengan waktu yang tersedia.
                      </p>

                      {/* Tab buttons */}
                      <Animate type="growx" ready={dataReady} delay={0.05}>
                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                          {(
                            [
                              { key: "kondisi", label: "Kondisi Medis" },
                              { key: "teknologi", label: "Teknologi Medis" },
                              { key: "dokter", label: "Dokter Kami" },
                            ] as {
                              key: "kondisi" | "teknologi" | "dokter";
                              label: string;
                            }[]
                          ).map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => setActiveTab(tab.key)}
                              className={`px-6 py-3 font-medium transition-all ${
                                activeTab === tab.key
                                  ? "text-mariner-600 border-b-2 border-mariner-600"
                                  : "text-gray-600 hover:text-mariner-600"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </Animate>

                      {/* Tab Content */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        {/* Kondisi Medis */}
                        {activeTab === "kondisi" &&
                          (hasKondisi ? (
                            <Animate
                              key={`kondisi-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_kondisi.map((item) => (
                                <Animate
                                  key={item.id}
                                  type="slideup"
                                  once={false}
                                >
                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-mariner-600 mb-2">
                                      {item.title}
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </Animate>
                              ))}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}

                        {/* Teknologi Medis */}
                        {activeTab === "teknologi" &&
                          (hasTeknologi ? (
                            <Animate
                              key={`teknologi-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_teknologi.map(
                                (item) => (
                                  <Animate
                                    key={item.id}
                                    type="slideup"
                                    once={false}
                                  >
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <h4 className="font-semibold text-mariner-600 mb-2">
                                        {item.title}
                                      </h4>
                                      <p className="text-gray-700 text-sm leading-relaxed">
                                        {item.description}
                                      </p>
                                    </div>
                                  </Animate>
                                ),
                              )}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}

                        {/* Dokter Kami */}
                        {activeTab === "dokter" &&
                          (hasDokter ? (
                            <Animate
                              key={`dokter-${selectedId}`}
                              type="stagger"
                              staggerChildren={0.08}
                              delayChildren={0.0}
                              once={false}
                              ready={dataReady}
                              className="space-y-4"
                            >
                              {current.layanan_unggulan_dokter.map((item) => (
                                <Animate
                                  key={item.dokter_id}
                                  type="slideup"
                                  once={false}
                                >
                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-semibold text-mariner-600 mb-1">
                                      {item.dokter?.nama ?? "—"}
                                    </h4>
                                    {item.dokter?.poli?.nama_poli && (
                                      <p className="text-gray-600 text-sm">
                                        {item.dokter.poli.nama_poli}
                                      </p>
                                    )}
                                  </div>
                                </Animate>
                              ))}
                            </Animate>
                          ) : (
                            <EmptyTab />
                          ))}
                      </div>
                    </div>
                  </Animate>
                </div>
              </div>
            )}
          </Animate>
        </div>
      </div>
    </section>
  );
}

function EmptyTab() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Informasi tidak tersedia untuk layanan ini.
      </p>
    </div>
  );
}
