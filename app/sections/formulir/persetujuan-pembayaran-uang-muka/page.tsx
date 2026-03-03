"use client";

import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import { ArrowLeft, FileText, RotateCcw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getTodayFormatted() {
  const now = new Date();
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

const PENJAMIN_OPTIONS = [
  { value: "umum", label: "Umum" },
  { value: "asuransi", label: "Asuransi" },
  { value: "bpjs_k1", label: "BPJS Kelas 1 Naik Kelas" },
  { value: "bpjs_k2", label: "BPJS Kelas 2 Naik Kelas" },
];

const KELAS_OPTIONS = [
  { value: "kelas3", label: "Kelas 3" },
  { value: "kelas2", label: "Kelas 2" },
  { value: "kelas1", label: "Kelas 1" },
  { value: "vip_a", label: "VIP A" },
  { value: "vip_b", label: "VIP B" },
  { value: "suite", label: "Suite Room" },
  { value: "president", label: "President Suite" },
];

const EMPTY = {
  namaPasien: "",
  noRM: "",
  namaPJ: "",
  noKTP: "",
  alamat: "",
  noHP: "",
  penjamin: "",
  kelas: "",
};

/* ─────────────────────────────────────────
   SIGNATURE PAD
───────────────────────────────────────── */
const SignaturePad: React.FC<{
  canvasRef: React.RefObject<HTMLCanvasElement>;
}> = ({ canvasRef }) => {
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const pos = (
    e: React.MouseEvent | React.TouchEvent,
    c: HTMLCanvasElement,
  ) => {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width,
      sy = c.height / r.height;
    if ("touches" in e)
      return {
        x: (e.touches[0].clientX - r.left) * sx,
        y: (e.touches[0].clientY - r.top) * sy,
      };
    return {
      x: ((e as React.MouseEvent).clientX - r.left) * sx,
      y: ((e as React.MouseEvent).clientY - r.top) * sy,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    drawing.current = true;
    last.current = pos(e, c);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const p = pos(e, c);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    last.current = p;
  };
  const stop = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-full border border-gray-400 bg-white overflow-hidden touch-none"
        style={{ height: 90 }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={90}
          className="w-full h-full cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-300 text-xs select-none">
          Tanda tangan di sini
        </span>
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
      >
        Hapus tanda tangan
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
const Navbar: React.FC = () => {
  const router = useRouter();
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 leading-none">
              RS Siti Khodijah
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              Formulir Digital
            </p>
          </div>
        </div>

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
const Footer: React.FC = () => (
  <footer className="w-full border-t border-gray-200 bg-white mt-auto">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
      <p>
        © {new Date().getFullYear()} RS Siti Khodijah Muhammadiyah Cabang
        Sepanjang
      </p>
      <p>Formulir Persetujuan Pembayaran DP Persalinan</p>
    </div>
  </footer>
);

/* ─────────────────────────────────────────
   DIVIDER
───────────────────────────────────────── */
const HR: React.FC<{ label?: string }> = ({ label }) =>
  label ? (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gray-300" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-300" />
    </div>
  ) : (
    <div className="h-px bg-gray-200 my-6" />
  );

/* ─────────────────────────────────────────
   MAIN FORM PAGE
───────────────────────────────────────── */
const FormulirDP: React.FC = () => {
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const today = getTodayFormatted();

  const set = (k: keyof typeof EMPTY) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Partial<typeof EMPTY> = {};
    if (!form.namaPasien) e.namaPasien = "Wajib diisi";
    if (!form.namaPJ) e.namaPJ = "Wajib diisi";
    if (!form.penjamin) e.penjamin = "Wajib dipilih";
    if (!form.kelas) e.kelas = "Wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors({});
    setSubmitted(false);
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      {/* Page body */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* ── Document paper ── */}
          <div className="bg-white border border-gray-300 shadow-md">
            {/* ── Document Header ── */}
            <div className="border-b-2 border-gray-900 px-8 pt-8 pb-5">
              <div className="flex items-start gap-5">
                {/* Logo placeholder */}
                <div className="w-16 h-16 shrink-0 border-2 border-gray-900 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-900" />
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    Rumah Sakit Siti Khodijah Muhammadiyah Cabang Sepanjang
                  </p>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-900 mt-1 leading-snug">
                    Formulir Persetujuan Pembayaran Uang Muka (DP)
                  </h1>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mt-0.5">
                    Tindakan Persalinan
                  </p>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-8 py-7 space-y-0 text-gray-900">
              {/* Intro */}
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Yang bertanda tangan di bawah ini:
              </p>

              {/* Patient Data */}
              <div className="border border-gray-300 divide-y divide-gray-200 mb-6">
                {[
                  { label: "Nama Pasien", key: "namaPasien" as const },
                  { label: "No. RM", key: "noRM" as const },
                  { label: "Nama Penanggung Jawab", key: "namaPJ" as const },
                  { label: "No. KTP / Identitas", key: "noKTP" as const },
                  { label: "Alamat", key: "alamat" as const },
                  { label: "No. HP", key: "noHP" as const },
                ].map(({ label, key }) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center"
                  >
                    <span className="text-sm text-gray-700 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 px-4 py-2.5 sm:w-56 shrink-0 font-medium">
                      {label}
                    </span>
                    <div className="flex-1 px-3 py-1.5">
                      <Input
                        value={form[key]}
                        onChange={(e) => set(key)(e.target.value)}
                        placeholder="............................................................................"
                        inputSize="sm"
                        rounded="md"
                        className="border-0 border-b border-dotted border-gray-400 rounded-none bg-transparent focus:ring-0 focus:border-gray-700 px-0 placeholder:text-gray-300 text-gray-900"
                        error={errors[key]}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Statement */}
              <div className="text-sm text-gray-800 leading-7 space-y-3 mb-6">
                <p>
                  Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan
                  mengenai rencana tindakan persalinan yang akan dilakukan di{" "}
                  <span className="font-semibold">
                    Rumah Sakit Siti Khodijah Muhammadiyah Cabang Sepanjang
                  </span>
                  , termasuk estimasi biaya pelayanan medis, fasilitas
                  perawatan, serta ketentuan administrasi yang berlaku.
                </p>
                <p>
                  Sehubungan dengan hal tersebut, saya menyetujui untuk
                  melakukan pembayaran uang muka (DP) persalinan sebesar:{" "}
                  <span className="font-bold underline underline-offset-2">
                    Rp1.000.000,- (Satu Juta Rupiah)
                  </span>
                </p>
                <p>Saya memahami dan menyetujui bahwa:</p>
                <ol className="list-decimal ml-6 space-y-1 text-gray-700">
                  <li>
                    Uang muka (DP) merupakan bagian dari total biaya persalinan.
                  </li>
                  <li>
                    Pembayaran DP dilakukan sebagai bentuk konfirmasi dan
                    komitmen pelayanan persalinan.
                  </li>
                  <li>
                    Uang muka (DP) yang telah dibayarkan{" "}
                    <span className="font-semibold">
                      tidak dapat dikembalikan (non-refundable)
                    </span>{" "}
                    dengan alasan apa pun, termasuk apabila terjadi pembatalan
                    dari pihak pasien.
                  </li>
                </ol>
              </div>

              <HR label="Rencana Penjamin & Kelas Perawatan" />

              {/* Penjamin & Kelas */}
              <div className="border border-gray-300 mb-6">
                {/* A. Penjamin */}
                <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200">
                  <span className="text-sm font-semibold bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 px-4 py-3 sm:w-56 shrink-0">
                    A. Jenis Penjamin
                  </span>
                  <div className="flex-1 px-4 py-2">
                    <Select
                      placeholder="Pilih jenis penjamin"
                      value={form.penjamin}
                      onChange={set("penjamin")}
                      options={PENJAMIN_OPTIONS}
                      rounded="md"
                      selectSize="sm"
                      error={errors.penjamin}
                    />
                  </div>
                </div>
                {/* B. Kelas */}
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-sm font-semibold bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 px-4 py-3 sm:w-56 shrink-0">
                    B. Rencana Kelas / Kamar
                  </span>
                  <div className="flex-1 px-4 py-2">
                    <Select
                      placeholder="Pilih kelas perawatan"
                      value={form.kelas}
                      onChange={set("kelas")}
                      options={KELAS_OPTIONS}
                      rounded="md"
                      selectSize="sm"
                      error={errors.kelas}
                    />
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="border-l-4 border-gray-400 pl-4 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Keterangan
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Apabila terjadi perubahan kelas perawatan selama masa rawat
                  inap, maka pasien/penanggung jawab bersedia mengikuti
                  ketentuan biaya sesuai kelas yang ditempati.
                </p>
              </div>

              {/* Closing statement */}
              <p className="text-sm text-gray-800 leading-7 mb-8">
                Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan
                dari pihak mana pun, dan dapat dipergunakan sebagaimana
                mestinya.
              </p>

              {/* Date + Signature */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64">
                  <p className="text-sm text-gray-700 mb-5">
                    Sepanjang, <span className="font-semibold">{today}</span>
                  </p>

                  <p className="text-sm text-gray-700 mb-2 text-center">
                    Pasien / Penanggung Jawab,
                  </p>

                  {/* Signature canvas */}
                  <SignaturePad canvasRef={canvasRef} />

                  {/* Auto name */}
                  <div className="mt-3 border-t border-gray-900 pt-2 text-center min-h-7">
                    <span className="text-sm font-semibold text-gray-900">
                      {form.namaPasien ? (
                        `( ${form.namaPasien} )`
                      ) : (
                        <span className="text-gray-300 font-normal text-xs italic">
                          (nama pasien)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <HR />

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  type="button"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Formulir
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  type="button"
                >
                  <Send className="w-4 h-4" />
                  Kirim Formulir
                </Button>
              </div>

              {/* Success */}
              {submitted && (
                <div className="mt-4 border border-gray-400 bg-gray-50 px-5 py-3 text-sm text-gray-700 text-center">
                  ✓ Formulir berhasil dikirim. Terima kasih.
                </div>
              )}
            </div>
            {/* /body */}
          </div>
          {/* /document */}

          {/* Doc note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Dokumen ini bersifat resmi dan dipergunakan sebagai arsip
            administrasi rumah sakit.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FormulirDP;
