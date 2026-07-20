"use client";
import Animate from "@/components/animations/animate";
import Banner from "@/components/ui/custom/banner";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// File excel sumber data, disimpan di folder /public
const EXCEL_PATH = "/indikator-mutu-2026.xlsx";
const SHEET_NAME = "DATA FIKS TH 2026";
const BULAN = ["Jan", "Feb", "Mar", "April", "Mei", "Juni"];
// Kolom pada sheet (0-based, hasil header:1): 0 NO, 1 Judul, 2 Standar,
// 3 Jan, 4 Feb, 5 Mar, 6 TW1, 7 April, 8 Mei, 9 Juni, 10 TW2
const KOLOM_BULAN = [3, 4, 5, 7, 8, 9] as const;

type ExcelRow = (string | number | null)[];
type Arah = "min" | "max";

interface IndikatorBulanan {
  tipe: "bulanan";
  no: number;
  judul: string;
  standar: number;
  arah: Arah;
  data: (number | null)[];
}

interface IndikatorTunggal {
  tipe: "tunggal";
  no: number;
  judul: string;
  standar: number;
  nilai: number | null;
}

type IndikatorItem = IndikatorBulanan | IndikatorTunggal;

// Ubah angka standar/capaian mentah dari excel (hasil rumus di sheet) menjadi persen (0-100)
function kePersen(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
}

// Standar bisa berupa angka (0.85 / 1) atau teks ("≥ 80%", "≤ 5%", "≥ 76,61")
function parseStandar(raw: unknown): { nilai: number | null; arah: Arah } {
  if (typeof raw === "number") {
    return { nilai: kePersen(raw), arah: "min" };
  }
  const str = String(raw ?? "").trim();
  const arah: Arah = str.includes("≤") ? "max" : "min";
  const angka = parseFloat(str.replace(/[^\d,.-]/g, "").replace(",", "."));
  return { nilai: Number.isNaN(angka) ? null : angka, arah };
}

function parseWorkbook(arrayBuffer: ArrayBuffer): IndikatorItem[] {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws =
    wb.Sheets[SHEET_NAME] ||
    wb.Sheets[wb.SheetNames[1]] ||
    wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, {
    header: 1,
    defval: null,
  });

  // Baris header ada di baris yang berisi "NO" di kolom pertama
  const headerIdx = rows.findIndex((r) => r && r[0] === "NO");
  const dataRows = rows
    .slice(headerIdx + 1)
    .filter((r): r is ExcelRow => !!r && typeof r[0] === "number");

  const hasil: IndikatorItem[] = [];

  dataRows.forEach((row) => {
    const no = row[0] as number;
    const judul = String(row[1]);
    const { nilai: standar, arah } = parseStandar(row[2]);
    const nilaiBulan = KOLOM_BULAN.map((idx) => kePersen(row[idx]));

    // Indikator "Kepuasan Pasien" hanya disurvei sekali (bukan bulanan)
    const terisi = nilaiBulan.filter((v) => v !== null).length;
    if (terisi <= 1) {
      hasil.push({
        tipe: "tunggal",
        no,
        judul,
        standar: standar ?? 0,
        nilai: nilaiBulan.find((v) => v !== null) ?? null,
      });
      return;
    }

    hasil.push({
      tipe: "bulanan",
      no,
      judul,
      standar: standar ?? 0,
      arah,
      data: nilaiBulan,
    });
  });

  // Urutkan sesuai nomor indikator — sama seperti urutan slide di IMN_UNTUK_WEBSITE.pptx
  return hasil.sort((a, b) => a.no - b.no);
}

function tercapaiBulanan(ind: IndikatorBulanan): boolean {
  const nilaiTerakhir = [...ind.data].reverse().find((v) => v !== null);
  if (nilaiTerakhir === null || nilaiTerakhir === undefined) return true;
  return ind.arah === "max"
    ? nilaiTerakhir <= ind.standar
    : nilaiTerakhir >= ind.standar;
}

function tercapaiTunggal(ind: IndikatorTunggal): boolean {
  if (ind.nilai === null) return true;
  return ind.nilai >= ind.standar;
}

function buildChartData(ind: IndikatorBulanan) {
  return BULAN.map((bulan, i) => ({
    bulan,
    capaian: ind.data[i],
    standar: ind.standar,
  }));
}

const IndikatorMutu = () => {
  const [dataReady, setDataReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [indikator, setIndikator] = useState<IndikatorItem[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch(EXCEL_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("File tidak ditemukan");
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (!mounted) return;
        setIndikator(parseWorkbook(buf));
        setStatus("ok");
        setTimeout(() => setDataReady(true), 80);
      })
      .catch((err) => {
        console.error("Gagal memuat indikator-mutu-2026.xlsx:", err);
        if (mounted) setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="bg-gray-50 py-24 px-4 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Memuat data indikator mutu…</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-gray-50 py-24 px-4 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500 text-center max-w-md">
          <FileWarning className="w-8 h-8 text-rose-400" />
          <p>
            Gagal memuat{" "}
            <code className="text-rose-500">indikator-mutu-2026.xlsx</code>.
            Pastikan file tersebut ada di folder{" "}
            <code className="text-gray-700">public/</code> dengan nama yang sama
            persis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Animate type="fadein" ready={dataReady}>
          <Banner
            title="Hasil Capaian Indikator Mutu Nasional"
            subtitle="Tahun 2026"
          />
        </Animate>

        {/* Daftar indikator — 1 kolom, urut sesuai nomor indikator di excel / pptx */}
        <Animate
          type="stagger"
          staggerChildren={0.08}
          delayChildren={0.1}
          ready={dataReady}
          className="flex flex-col gap-8 mt-12"
        >
          {indikator.map((ind) => {
            if (ind.tipe === "tunggal") {
              const capai = tercapaiTunggal(ind);
              return (
                <Animate key={ind.no} type="slideup">
                  <div className="bg-white rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold text-mariner-600 mb-1">
                        Indikator #{ind.no}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {ind.judul}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Standar ≥ {ind.standar}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-5xl font-extrabold ${
                          capai ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {ind.nilai ?? "-"}%
                      </span>
                      {capai ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                      )}
                    </div>
                  </div>
                </Animate>
              );
            }

            const capai = tercapaiBulanan(ind);
            const accent = capai ? "#10b981" : "#f43f5e";
            const chartData = buildChartData(ind);

            return (
              <Animate key={ind.no} type="slideup">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-1">
                        Indikator #{ind.no}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {ind.judul}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Standar {ind.arah === "max" ? "≤" : "≥"} {ind.standar}%
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        capai
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {capai ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {capai ? "Tercapai" : "Belum Tercapai"}
                    </span>
                  </div>

                  {/* Chart: Standar (putus-putus abu) vs Capaian (garis warna) — seperti di pptx */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="bulan"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 110]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value}%`,
                            name === "capaian" ? "Capaian" : "Standar",
                          ]}
                        />
                        <ReferenceLine
                          y={ind.standar}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                        />
                        <Line
                          type="monotone"
                          dataKey="standar"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="standar"
                        />
                        <Line
                          type="monotone"
                          dataKey="capaian"
                          stroke={accent}
                          strokeWidth={3}
                          dot={{ r: 4, fill: accent }}
                          activeDot={{ r: 6 }}
                          name="capaian"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Animate>
            );
          })}
        </Animate>
      </div>
    </div>
  );
};

export default IndikatorMutu;
