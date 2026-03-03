"use client";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import Profile from "@/config/profile";
import Image from "next/image";
import { useRef, useState } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FormState {
  namaPasien: string;
  noRM: string;
  namaPJ: string;
  noKTP: string;
  alamat: string;
  noHP: string;
  penjamin: string;
  kelas: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

interface SignaturePadProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  form: FormState;
  penjaminLabel: string;
  kelasLabel: string;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getTodayFormatted(): string {
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

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
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
const EMPTY: FormState = {
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
   SECTION LABEL
───────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-center gap-2 mb-3.5">
    <span className="text-[10px] font-semibold tracking-[0.09em] uppercase text-blue-600 whitespace-nowrap">
      {children}
    </span>
    <div className="flex-1 h-px bg-blue-100" />
  </div>
);

/* ─────────────────────────────────────────
   FIELD ROW
───────────────────────────────────────── */
const FieldRow: React.FC<{
  label: string;
  required?: boolean;
  alignTop?: boolean;
  children: React.ReactNode;
}> = ({ label, required, alignTop, children }) => (
  <div
    className={[
      "flex flex-col sm:flex-row border-b border-gray-200 last:border-b-0",
      alignTop ? "sm:items-start" : "sm:items-center",
    ].join(" ")}
  >
    <div
      className={[
        "text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 sm:w-48 sm:border-r sm:border-gray-200 shrink-0",
        alignTop ? "sm:pt-3" : "",
      ].join(" ")}
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </div>
    <div className="flex-1 px-2 py-1.5">{children}</div>
  </div>
);

/* ─────────────────────────────────────────
   SIGNATURE PAD
───────────────────────────────────────── */
const SignaturePad: React.FC<SignaturePadProps> = ({ canvasRef }) => {
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const pos = (
    e: React.MouseEvent | React.TouchEvent,
    c: HTMLCanvasElement,
  ) => {
    const r = c.getBoundingClientRect(),
      sx = c.width / r.width,
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
    setHasDrawn(true);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || !last.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const p = pos(e, c);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#202124";
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
    setHasDrawn(false);
  };

  return (
    <div>
      <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden cursor-crosshair touch-none h-40 hover:border-blue-500 hover:shadow-[0_0_0_2px_rgba(59,130,246,0.12)] transition-all">
        {/* grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#6b7280 1px,transparent 1px),linear-gradient(90deg,#6b7280 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* baseline */}
        <div className="absolute bottom-9 left-5 right-5 border-b border-dashed border-gray-200 pointer-events-none" />

        <canvas
          ref={canvasRef}
          width={860}
          height={160}
          className="w-full h-full relative z-10 block"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none z-20">
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="text-xs text-gray-300 select-none">
              Tanda tangan di sini
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={clear}
        className="mt-1.5 text-[11px] text-gray-400 bg-transparent border-none cursor-pointer flex items-center gap-1 px-1 py-0.5 rounded hover:text-red-500 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Hapus tanda tangan
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────── */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  form,
  penjaminLabel,
  kelasLabel,
}) => {
  if (!open) return null;
  const rows: [string, string][] = [
    ["Nama Pasien", form.namaPasien || "—"],
    ["No. Rekam Medis", form.noRM || "—"],
    ["Penanggung Jawab", form.namaPJ || "—"],
    ["No. KTP / Identitas", form.noKTP || "—"],
    ["No. HP", form.noHP || "—"],
    ["Jenis Penjamin", penjaminLabel || "—"],
    ["Rencana Kelas/Kamar", kelasLabel || "—"],
  ];
  return (
    <div
      className="fixed inset-0 z-9999 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Konfirmasi
              </div>
              <div className="text-[15px] font-semibold text-gray-800">
                Periksa Data Anda
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer bg-transparent border-none transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-gray-50 last:border-b-0">
                  <td className="py-2 text-xs text-gray-500 w-[46%] align-middle">
                    {k}
                  </td>
                  <td className="py-2 text-[13px] font-medium text-gray-800 text-right">
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-gray-400 text-center">
            Pastikan semua data sudah benar sebelum mengirim.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 justify-end flex-wrap px-6 py-4 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Periksa Lagi
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Ya, Kirim Formulir
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SUCCESS DIALOG
───────────────────────────────────────── */
const SuccessDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-9999 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[360px] overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-9 pb-7">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-green-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-[17px] font-bold text-gray-800 mb-2">
            Formulir Terkirim!
          </div>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
            Data Anda telah diterima dan akan diproses oleh tim administrasi{" "}
            {Profile.shortName}.
          </p>
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full justify-center"
          >
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   TOOLBAR
───────────────────────────────────────── */
const Toolbar: React.FC = () => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="max-w-[860px] mx-auto px-5 h-[52px] flex items-center gap-3">
      <div className="w-[34px] h-[34px] rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
        <Image
          src={Profile.logo}
          alt={Profile.shortName}
          width={40}
          height={40}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-gray-800 leading-tight">
          Formulir Persetujuan DP Persalinan
        </div>
        <div className="text-[11px] text-gray-400 mt-px">
          {Profile.shortName} · {Profile.subtitle}
        </div>
      </div>
      <span className="text-[11px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-2 py-0.5 whitespace-nowrap">
        FM-ADM-001
      </span>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function FormulirDP() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const today = getTodayFormatted();

  const setField = (k: keyof FormState) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  const setInputField =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(k)(e.target.value);
  const clearError = (k: keyof FormState) => () =>
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });

  const validate = (): boolean => {
    const e: FormErrors = {};
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
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  const penjaminLabel =
    PENJAMIN_OPTIONS.find((o) => o.value === form.penjamin)?.label ?? "";
  const kelasLabel =
    KELAS_OPTIONS.find((o) => o.value === form.kelas)?.label ?? "";

  return (
    <div className="font-sans text-sm text-gray-800 bg-gray-100 min-h-screen antialiased">
      <Toolbar />

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          setShowSuccess(true);
          handleReset();
        }}
        form={form}
        penjaminLabel={penjaminLabel}
        kelasLabel={kelasLabel}
      />
      <SuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />

      {/* Outer */}
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 pb-12 sm:pb-14 lg:pb-16">
        {/* Paper */}
        <div className="bg-white w-full max-w-[760px] mx-auto shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)] rounded-sm">
          {/* ── Letterhead ── */}
          <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-6 lg:px-[52px] lg:pt-9 lg:pb-7 border-b border-gray-200">
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:gap-[18px]">
              {/* Logo */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={Profile.logo}
                  alt={Profile.shortName}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    const next = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (next) next.style.display = "flex";
                  }}
                />
                <div className="w-full h-full items-center justify-center hidden">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  {Profile.institusi} {Profile.name} · {Profile.subtitle}
                </div>
                <h1 className="text-[18px] sm:text-xl lg:text-[22px] font-bold text-gray-800 leading-[1.3]">
                  Formulir Persetujuan Pembayaran
                  <br />
                  <span className="text-blue-600">
                    Uang Muka (DP) Persalinan
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="inline-flex items-center text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Tindakan Persalinan
                  </span>
                  <span className="text-[11px] text-gray-400">{today}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-5 py-6 sm:px-8 sm:py-7 lg:px-[52px] lg:py-9">
            {/* §1 Data Identitas */}
            <div className="mb-8">
              <SectionLabel>Data Identitas</SectionLabel>
              <p className="text-[13px] text-gray-500 mb-3.5 leading-relaxed">
                Yang bertanda tangan di bawah ini:
              </p>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <FieldRow label="Nama Pasien" required>
                  <Input
                    value={form.namaPasien}
                    onChange={setInputField("namaPasien")}
                    onFocus={clearError("namaPasien")}
                    placeholder="Isi nama pasien"
                    error={errors.namaPasien}
                    rounded="md"
                    inputSize="sm"
                  />
                </FieldRow>

                <FieldRow label="No. Rekam Medis">
                  <Input
                    type="tel"
                    value={form.noRM}
                    onChange={setInputField("noRM")}
                    placeholder="Isi nomor rekam medis"
                    rounded="md"
                    inputSize="sm"
                  />
                </FieldRow>

                <FieldRow label="Nama Penanggung Jawab" required>
                  <Input
                    value={form.namaPJ}
                    onChange={setInputField("namaPJ")}
                    onFocus={clearError("namaPJ")}
                    placeholder="Isi nama penanggung jawab"
                    error={errors.namaPJ}
                    rounded="md"
                    inputSize="sm"
                  />
                </FieldRow>

                <FieldRow label="No. KTP / Identitas">
                  <Input
                    type="tel"
                    value={form.noKTP}
                    onChange={setInputField("noKTP")}
                    placeholder="Isi nomor KTP / identitas"
                    rounded="md"
                    inputSize="sm"
                  />
                </FieldRow>

                <FieldRow label="No. HP">
                  <Input
                    type="tel"
                    value={form.noHP}
                    onChange={setInputField("noHP")}
                    placeholder="Isi nomor HP"
                    rounded="md"
                    inputSize="sm"
                  />
                </FieldRow>

                <FieldRow label="Alamat" alignTop>
                  <Textarea
                    value={form.alamat}
                    onChange={setInputField("alamat")}
                    placeholder="Isi alamat lengkap"
                    rows={3}
                    resize="vertical"
                    rounded="md"
                    textareaSize="sm"
                  />
                </FieldRow>
              </div>
            </div>

            {/* §2 Pernyataan */}
            <div className="mb-8">
              <SectionLabel>Pernyataan Persetujuan</SectionLabel>

              <div className="text-[13px] text-gray-700 leading-[1.8] mb-3.5">
                <p className="mb-2.5">
                  Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan
                  mengenai rencana tindakan persalinan yang akan dilakukan di{" "}
                  <strong className="text-gray-800">
                    {Profile.institusi} {Profile.name}, {Profile.subtitle}
                  </strong>
                  , termasuk estimasi biaya pelayanan medis, fasilitas
                  perawatan, serta ketentuan administrasi yang berlaku.
                </p>
                <p>
                  Sehubungan dengan hal tersebut, saya menyetujui untuk
                  melakukan pembayaran uang muka (DP) persalinan sebesar:
                </p>
              </div>

              {/* DP amount box */}
              <div className="flex gap-2.5 items-start bg-blue-50 rounded-lg px-4 py-3 mb-4">
                <svg
                  className="w-[18px] h-[18px] text-blue-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="text-[17px] font-bold text-blue-600">
                    Rp 1.000.000,–
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Satu Juta Rupiah
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-gray-700 font-medium mb-2.5">
                Saya memahami dan menyetujui bahwa:
              </p>
              <ul className="list-disc pl-5 text-[13px] text-gray-500 leading-[2.1] space-y-0.5">
                <li>
                  Uang muka (DP) merupakan bagian dari total biaya persalinan.
                </li>
                <li>
                  Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen
                  pelayanan persalinan.
                </li>
                <li>
                  Uang muka yang telah dibayarkan{" "}
                  <strong className="text-gray-700">
                    tidak dapat dikembalikan (non-refundable)
                  </strong>{" "}
                  dengan alasan apa pun, termasuk apabila terjadi pembatalan
                  dari pihak pasien.
                </li>
              </ul>
            </div>

            {/* §3 Penjamin & Kelas */}
            <div className="mb-8">
              <SectionLabel>
                Rencana Penjamin &amp; Kelas Perawatan
              </SectionLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {[
                  {
                    alpha: "A",
                    title: "Jenis Penjamin",
                    key: "penjamin" as const,
                    opts: PENJAMIN_OPTIONS,
                    ph: "Pilih jenis penjamin",
                  },
                  {
                    alpha: "B",
                    title: "Rencana Kelas / Kamar",
                    key: "kelas" as const,
                    opts: KELAS_OPTIONS,
                    ph: "Pilih kelas perawatan",
                  },
                ].map(({ alpha, title, key, opts, ph }) => (
                  <div
                    key={key}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3.5"
                  >
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">
                      {alpha}. {title}
                    </div>
                    <Select
                      placeholder={ph}
                      value={form[key]}
                      onChange={(v) => {
                        setField(key)(v);
                        clearError(key)();
                      }}
                      options={opts}
                      error={errors[key]}
                      required
                      rounded="xl"
                      selectSize="sm"
                    />
                  </div>
                ))}
              </div>

              {/* Warning box */}
              <div className="flex gap-2.5 items-start bg-amber-50 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Apabila terjadi perubahan kelas perawatan selama masa rawat
                  inap, pasien/penanggung jawab bersedia mengikuti ketentuan
                  biaya sesuai kelas yang ditempati.
                </p>
              </div>
            </div>

            {/* Closing */}
            <p className="text-[13px] text-gray-500 leading-[1.8] mb-8">
              Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari
              pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.
            </p>

            {/* §4 Tanda Tangan */}
            <div className="mb-8">
              <SectionLabel>Tanda Tangan</SectionLabel>

              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 sm:items-start">
                {/* Date card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3.5 sm:w-40 shrink-0">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">
                    Tanggal
                  </div>
                  <div className="text-xs text-gray-400">Sepanjang,</div>
                  <div className="text-[13px] font-semibold text-gray-800 mt-0.5 leading-snug">
                    {today}
                  </div>
                </div>

                {/* Signature */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.06em] mb-2 text-center">
                    Pasien / Penanggung Jawab
                  </div>
                  <SignaturePad canvasRef={canvasRef} />
                  <div className="mt-2.5 border-t-2 border-gray-800 pt-1.5 text-center">
                    {form.namaPasien ? (
                      <span className="text-[13px] font-semibold text-gray-800">
                        ( {form.namaPasien} )
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">
                        (nama pasien)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 my-6" />

            {/* Action buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Kembali
                </Button>
                <Button variant="default" size="sm" onClick={handleReset}>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset
                </Button>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (validate()) setShowConfirm(true);
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Kirim Formulir
              </Button>
            </div>
          </div>
          {/* /body */}

          {/* Doc footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-5 sm:px-8 lg:px-[52px] py-2.5 flex justify-between items-center flex-wrap gap-1">
            <span className="text-[11px] text-gray-400">Halaman 1 dari 1</span>
            <span className="text-[11px] text-gray-400">
              FM-ADM-001 · Rev.01 · {Profile.shortName}
            </span>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-[11px] text-gray-400 mt-5 px-4">
          Dokumen ini bersifat resmi dan dipergunakan sebagai arsip administrasi
          rumah sakit.
        </p>
      </div>
    </div>
  );
}
