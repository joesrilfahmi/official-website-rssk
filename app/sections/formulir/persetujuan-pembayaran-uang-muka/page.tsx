"use client";
import Button from "@/components/ui/custom/button";
import DatePicker from "@/components/ui/custom/datepicker";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import Profile from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import { useRef, useState } from "react";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FormState {
  namaPasien: string;
  tglLahir: string;
  noRM: string;
  namaPJ: string;
  noKTP: string;
  alamat: string;
  tglRencanaPersalinan: string;
  jenisTindakan: string;
  dokterPJ: string;
  noHP: string;
  penjamin: string;
  kelas: string;
  deskripsi: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

interface SignaturePadProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClear: () => void;
}
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  form: FormState;
  penjaminLabel: string;
  kelasLabel: string;
  jenisTindakanLabel: string;
  isSubmitting: boolean;
}

/* ─────────────────────────────────────────
   INSERTED ROW TYPE (matches Supabase return)
───────────────────────────────────────── */
interface InsertedRow {
  id: string;
  nama_pasien: string;
  tgl_lahir: string | null;
  no_rm: string | null;
  nama_penanggung_jawab: string;
  no_ktp: string | null;
  no_hp: string | null;
  alamat: string | null;
  tgl_rencana_persalinan: string | null;
  jenis_tindakan: string | null;
  dokter_penanggung_jawab: string | null;
  jenis_penjamin: string;
  rencana_kelas: string;
  ttd: string | null;
  deskripsi: string | null;
  tanggal: string;
  created_at: string;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getTodayFormatted(): string {
  const now = new Date();
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return "";
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getSignatureDataUrl(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const hasContent = data.some((v, i) => i % 4 === 3 && v > 0);
  return hasContent ? canvas.toDataURL("image/png") : null;
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
const JENIS_TINDAKAN_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "sc", label: "SC (Sesar)" },
];
const DOKTER_OPTIONS = [
  { value: "dr. AMIK YULIATI, Sp.OG", label: "dr. AMIK YULIATI, Sp.OG" },
  { value: "dr. BAYU PRIANGGA, Sp.OG, M. Ked.Klin.", label: "dr. BAYU PRIANGGA, Sp.OG, M. Ked.Klin." },
  { value: "dr. ANDI BUDI HERIANTO, Sp.OG", label: "dr. ANDI BUDI HERIANTO, Sp.OG" },
  { value: "dr. PRASTI SULANJARI, Sp.OG", label: "dr. PRASTI SULANJARI, Sp.OG" },
  { value: "dr. RODIYAH, Sp.OG", label: "dr. RODIYAH, Sp.OG" },
  { value: "dr. WAHYU WIDOYOKO, Sp.OG", label: "dr. WAHYU WIDOYOKO, Sp.OG" },
  { value: "dr. SETYO BUDI PAMUNGKAS, Sp.OG", label: "dr. SETYO BUDI PAMUNGKAS, Sp.OG" },
  { value: "dr. ADITYA HERLAMBANG, Sp.OG", label: "dr. ADITYA HERLAMBANG, Sp.OG" },
];

const EMPTY: FormState = {
  namaPasien: "",
  tglLahir: "",
  noRM: "",
  namaPJ: "",
  noKTP: "",
  alamat: "",
  tglRencanaPersalinan: "",
  jenisTindakan: "",
  dokterPJ: "",
  noHP: "",
  penjamin: "",
  kelas: "",
  deskripsi: "",
};

/* ─────────────────────────────────────────
   LABEL HELPERS
───────────────────────────────────────── */
const getPenjaminLabel = (val: string) =>
  PENJAMIN_OPTIONS.find((o) => o.value === val)?.label ?? val;

const getKelasLabel = (val: string) =>
  KELAS_OPTIONS.find((o) => o.value === val)?.label ?? val;

const getJenisTindakanLabel = (val: string | null) => {
  if (!val) return "—";
  return JENIS_TINDAKAN_OPTIONS.find((o) => o.value === val)?.label ?? val;
};

/* ─────────────────────────────────────────
   PDF HELPERS
───────────────────────────────────────── */
function buildFileName(item: InsertedRow): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const sanitize = (s: string) =>
    s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
  const noRm = item.no_rm ? sanitize(item.no_rm) : "NoRM";
  const nama = sanitize(item.nama_pasien);
  const stamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${noRm}-${nama}-${stamp}`;
}

function buildDocumentHTML(item: InsertedRow, logoBase64?: string): string {
  const penjaminLabel = getPenjaminLabel(item.jenis_penjamin);
  const kelasLabel = getKelasLabel(item.rencana_kelas);
  const jenisTindakanLabel = getJenisTindakanLabel(item.jenis_tindakan);
  const tanggalFormatted = formatDateLong(item.tanggal);
  const logoSrc = logoBase64 ?? Profile.logo;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #fff; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12px; color: #000; background: #fff;
    width: 794px; padding: 44px 64px 40px; line-height: 1.5;
  }
  .letterhead { display: flex; align-items: center; gap: 12px; padding-bottom: 7px; border-bottom: 3px double #000; margin-bottom: 12px; }
  .lh-logo { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
  .lh-info { flex: 1; text-align: center; }
  .lh-name { font-size: 14px; font-weight: 700; text-transform: uppercase; line-height: 1.3; }
  .lh-sub  { font-size: 10px; margin-top: 2px; }
  .lh-addr { font-size: 9px; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 12px; font-weight: 700; text-transform: uppercase; text-decoration: underline; line-height: 1.45; margin-bottom: 12px; }
  p { margin-bottom: 4px; font-size: 12px; }
  .field-block { margin-bottom: 8px; }
  .field-row { display: flex; align-items: flex-end; margin-bottom: 2px; font-size: 12px; }
  .field-label { width: 185px; flex-shrink: 0; }
  .field-colon { width: 12px; flex-shrink: 0; }
  .field-value { flex: 1; padding-bottom: 1px; padding-left: 4px; }
  ol { margin: 2px 0 6px 18px; padding: 0; }
  ol li { font-size: 12px; margin-bottom: 1px; line-height: 1.45; }
  .section-label { font-size: 12px; font-weight: 700; text-decoration: underline; margin-top: 8px; margin-bottom: 3px; }
  .sign-block { margin-top: 12px; display: flex; justify-content: flex-end; }
  .sign-inner { text-align: center; width: 210px; }
  .sign-inner p { font-size: 12px; margin-bottom: 2px; }
  .sign-gap { height: 58px; display: flex; align-items: center; justify-content: center; margin: 3px 0; }
  .sign-gap img { max-height: 54px; max-width: 180px; object-fit: contain; }
  .sign-name { font-size: 12px; border-top: 1px solid #000; padding-top: 3px; display: inline-block; min-width: 165px; text-align: center; }
  .footer { margin-top: 14px; border-top: 0.5px solid #ccc; padding-top: 5px; display: flex; justify-content: space-between; font-size: 9px; color: #888; }
</style>
</head>
<body>
  <div class="letterhead">
    <img class="lh-logo" src="${logoSrc}" alt="Logo" />
    <div class="lh-info">
      <div class="lh-name">${Profile.institusi} ${Profile.name}</div>
      <div class="lh-sub">${Profile.subtitle}</div>
      <div class="lh-addr">${Profile.address}</div>
      <div class="lh-addr">Telp: ${Profile.phone} &nbsp;|&nbsp; Email: ${Profile.email} &nbsp;|&nbsp; WhatsApp: ${Profile.whatsapp}</div>
    </div>
  </div>
  <div class="doc-title">
    Formulir Persetujuan Pembayaran Uang Muka (DP)<br/>
    Persalinan ${jenisTindakanLabel} di ${Profile.institusi} ${Profile.name}
  </div>
  <p>Yang bertanda tangan di bawah ini:</p>
  <div class="field-block">
    <div class="field-row"><span class="field-label">Nama Pasien</span><span class="field-colon">:</span><span class="field-value">${item.nama_pasien}</span></div>
    <div class="field-row"><span class="field-label">Tanggal Lahir</span><span class="field-colon">:</span><span class="field-value">${item.tgl_lahir ? formatDateLong(item.tgl_lahir) : ""}</span></div>
    <div class="field-row"><span class="field-label">No. RM</span><span class="field-colon">:</span><span class="field-value">${item.no_rm ?? ""}</span></div>
    <div class="field-row"><span class="field-label">Nama Penanggung Jawab</span><span class="field-colon">:</span><span class="field-value">${item.nama_penanggung_jawab}</span></div>
    <div class="field-row"><span class="field-label">No. KTP/Identitas</span><span class="field-colon">:</span><span class="field-value">${item.no_ktp ?? ""}</span></div>
    <div class="field-row"><span class="field-label">No. HP</span><span class="field-colon">:</span><span class="field-value">${item.no_hp ?? ""}</span></div>
    <div class="field-row"><span class="field-label">Alamat</span><span class="field-colon">:</span><span class="field-value">${item.alamat ?? ""}</span></div>
    <div class="field-row"><span class="field-label">Tgl. Rencana Persalinan</span><span class="field-colon">:</span><span class="field-value">${item.tgl_rencana_persalinan ? formatDateLong(item.tgl_rencana_persalinan) : ""}</span></div>
    <div class="field-row"><span class="field-label">Jenis Tindakan</span><span class="field-colon">:</span><span class="field-value">${jenisTindakanLabel}</span></div>
    <div class="field-row"><span class="field-label">Dokter Penanggung Jawab</span><span class="field-colon">:</span><span class="field-value">${item.dokter_penanggung_jawab ?? ""}</span></div>
  </div>
  <p style="text-align:justify;">Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan persalinan yang akan dilakukan di ${Profile.institusi} ${Profile.name}, termasuk estimasi biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku.</p>
  <p>Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka (DP) persalinan sebesar: <strong>Rp1.000.000,- (Satu Juta Rupiah)</strong></p>
  <p>Saya memahami dan menyetujui bahwa:</p>
  <ol>
    <li>Uang muka (DP) merupakan bagian dari total biaya persalinan.</li>
    <li>Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.</li>
    <li>Uang muka (DP) yang telah dibayarkan tidak dapat dikembalikan (non-refundable) dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.</li>
  </ol>
  <p class="section-label">Rencana Penjamin dan Kelas Perawatan</p>
  <div class="field-block">
    <div class="field-row"><span class="field-label">Jenis Penjamin</span><span class="field-colon">:</span><span class="field-value">${penjaminLabel}</span></div>
    <div class="field-row"><span class="field-label">Rencana Kelas / Kamar</span><span class="field-colon">:</span><span class="field-value">${kelasLabel}</span></div>
  </div>
  <p><strong>Keterangan:</strong></p>
  <p style="text-align:justify;">Apabila terjadi perubahan kelas perawatan selama masa rawat inap, maka pasien/penanggung jawab bersedia mengikuti ketentuan biaya sesuai kelas yang ditempati.</p>
  ${item.deskripsi ? `<p>${item.deskripsi}</p>` : ""}
  <p style="text-align:justify; margin-top:6px;">Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.</p>
  <div class="sign-block">
    <div class="sign-inner">
      <p>Sepanjang, ${tanggalFormatted}</p>
      <p>Pasien / Penanggung Jawab,</p>
      <div class="sign-gap">
        ${item.ttd ? `<img src="${item.ttd}" alt="Tanda tangan" />` : `<span style="display:block;height:58px;"></span>`}
      </div>
      <span class="sign-name">( ${item.nama_penanggung_jawab} )</span>
    </div>
  </div>
  <div class="footer">
    <span>Halaman 1 dari 1</span>
    <span>FM-ADM-001 · ${Profile.shortName}</span>
  </div>
</body>
</html>`;
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement("script");
    s.id = id; s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

async function downloadPDFFromRow(item: InsertedRow): Promise<void> {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "html2canvas-script");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-script");

  let logoBase64: string | undefined;
  try {
    const resp = await fetch(Profile.logo);
    const blob = await resp.blob();
    logoBase64 = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch { /* fallback to Profile.logo path */ }

  const htmlContent = buildDocumentHTML(item, logoBase64);
  const fileName = buildFileName(item);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  await new Promise<void>((resolve) => { iframe.onload = () => resolve(); iframe.srcdoc = htmlContent; });
  await new Promise((r) => setTimeout(r, 1000));

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error("Tidak dapat mengakses iframe document");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvas = (window as any).html2canvas;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jsPDF } = (window as any).jspdf;

  const iframeBody = iframeDoc.body;
  // A4 at 96dpi = 1123px tall. Cap render height to A4 to guarantee 1 page.
  const A4_PX = 1123;
  const renderH = Math.min(iframeBody.scrollHeight, A4_PX);

  const canvas = await html2canvas(iframeBody, {
    scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: "#ffffff",
    width: 794, height: renderH, windowWidth: 794, windowHeight: A4_PX,
    scrollX: 0, scrollY: 0, logging: false,
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/jpeg", 0.97);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  // Always fit to 1 page — scale height proportionally, never exceed pageHeight
  const imgHeight = Math.min(pageWidth * (canvas.height / canvas.width), pageHeight);
  pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);

  pdf.save(`${fileName}.pdf`);
}

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-[10px] font-bold tracking-widest uppercase text-curiousblue-500 whitespace-nowrap">
      {children}
    </span>
    <div className="flex-1 h-px bg-curiousblue-500/20" />
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
      "flex flex-col sm:flex-row border-b border-catskillwhite-600 last:border-b-0",
      alignTop ? "sm:items-start" : "sm:items-center",
    ].join(" ")}
  >
    <div
      className={[
        "text-xs font-medium text-mineshaft-500/70 bg-catskillwhite-400 px-4 py-2.5 sm:w-52 sm:border-r sm:border-catskillwhite-600 shrink-0",
        alignTop ? "sm:pt-3" : "",
      ].join(" ")}
    >
      {label}
      {required && <span className="text-bittersweet-500 ml-0.5">*</span>}
    </div>
    <div className="flex-1 px-3 py-2">{children}</div>
  </div>
);

/* ─────────────────────────────────────────
   SIGNATURE PAD
───────────────────────────────────────── */
const SignaturePad: React.FC<SignaturePadProps> = ({ canvasRef, onClear }) => {
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const pos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
    if ("touches" in e)
      return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: ((e as React.MouseEvent).clientX - r.left) * sx, y: ((e as React.MouseEvent).clientY - r.top) * sy };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    drawing.current = true; last.current = pos(e, c); setHasDrawn(true);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || !last.current) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const p = pos(e, c);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#202124"; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.stroke(); last.current = p;
  };
  const stop = () => { drawing.current = false; last.current = null; };

  const handleClear = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasDrawn(false);
    onClear();
  };

  // Expose clear function via ref pattern - store in canvas dataset
  if (canvasRef.current) {
    (canvasRef.current as HTMLCanvasElement & { __clearFn?: () => void }).__clearFn = handleClear;
  }

  return (
    <div>
      <div className="relative border border-catskillwhite-700 rounded-lg bg-white overflow-hidden cursor-crosshair touch-none h-56 hover:border-curiousblue-500 hover:shadow-[0_0_0_2px_rgba(52,152,219,0.12)] transition-all">
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#6b7280 1px,transparent 1px),linear-gradient(90deg,#6b7280 1px,transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute bottom-10 left-6 right-6 border-b border-dashed border-gray-200 pointer-events-none" />
        <canvas ref={canvasRef} width={1200} height={224}
          className="w-full h-full relative z-10 block"
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none z-20">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-xs text-gray-300 select-none">Tanda tangan di sini</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────── */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, form, penjaminLabel, kelasLabel, jenisTindakanLabel, isSubmitting,
}) => {
  if (!open) return null;
  const rows: [string, string][] = [
    ["Nama Pasien", form.namaPasien || "—"],
    ["Tanggal Lahir", form.tglLahir ? formatDateLong(form.tglLahir) : "—"],
    ["No. Rekam Medis", form.noRM || "—"],
    ["Penanggung Jawab", form.namaPJ || "—"],
    ["No. KTP / Identitas", form.noKTP || "—"],
    ["No. HP", form.noHP || "—"],
    ["Rencana Persalinan", form.tglRencanaPersalinan ? formatDateLong(form.tglRencanaPersalinan) : "—"],
    ["Jenis Tindakan", jenisTindakanLabel || "—"],
    ["Dokter Penanggung Jawab", form.dokterPJ || "—"],
    ["Jenis Penjamin", penjaminLabel || "—"],
    ["Rencana Kelas/Kamar", kelasLabel || "—"],
  ];
  return (
    <div className="fixed inset-0 z-9999 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-curiousblue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-curiousblue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Konfirmasi</div>
              <div className="text-[15px] font-semibold text-gray-800">Periksa Data Anda</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer bg-transparent border-none transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-gray-50 last:border-b-0">
                  <td className="py-2 text-xs text-gray-500 w-[46%] align-middle">{k}</td>
                  <td className="py-2 text-[13px] font-medium text-gray-800 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-gray-400 text-center">Pastikan semua data sudah benar sebelum mengirim.</p>
        </div>
        <div className="flex gap-2.5 justify-end flex-wrap px-6 py-4 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>Periksa Lagi</Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </>
            ) : (
              <>
                Ya, Kirim Formulir
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SUCCESS DIALOG
───────────────────────────────────────── */
const SuccessDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
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
          <div className="w-14 h-14 rounded-full bg-pastelgreen-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-pastelgreen-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-[17px] font-bold text-gray-800 mb-2">Formulir Terkirim!</div>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
            Data Anda telah diterima dan akan diproses oleh tim administrasi {Profile.shortName}.
          </p>
          <p className="text-[12px] text-gray-400 leading-relaxed mb-6">
            PDF formulir telah otomatis diunduh ke perangkat Anda.
          </p>
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
};

/* Toolbar removed */

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function FormulirDP() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, setSignatureHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const today = getTodayFormatted();
  const todayISO = getTodayISO();

  const setField = (k: keyof FormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setInputField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(k)(e.target.value);
  const clearError = (k: keyof FormState) => () => setErrors((p) => { const n = { ...p }; delete n[k]; return n; });

  /* ── Validasi tanggal lahir: tidak boleh lebih dari hari ini ── */
  const validateTglLahir = (val: string): string | undefined => {
    if (!val) return undefined;
    if (val > todayISO) return "Tanggal lahir tidak boleh lebih dari hari ini";
    return undefined;
  };

  /* ── Validasi tanggal rencana: tidak boleh kurang dari hari ini ── */
  const validateTglRencana = (val: string): string | undefined => {
    if (!val) return undefined;
    if (val < todayISO) return "Tanggal rencana tidak boleh kurang dari hari ini";
    return undefined;
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.namaPasien) e.namaPasien = "Wajib diisi";
    if (!form.namaPJ) e.namaPJ = "Wajib diisi";
    if (!form.penjamin) e.penjamin = "Wajib dipilih";
    if (!form.kelas) e.kelas = "Wajib dipilih";
    if (!form.jenisTindakan) e.jenisTindakan = "Wajib dipilih";
    if (!form.dokterPJ) e.dokterPJ = "Wajib dipilih";

    // Validasi tanggal lahir
    const tglLahirErr = validateTglLahir(form.tglLahir);
    if (tglLahirErr) e.tglLahir = tglLahirErr;

    // Validasi tanggal rencana persalinan
    const tglRencanaErr = validateTglRencana(form.tglRencanaPersalinan);
    if (tglRencanaErr) e.tglRencanaPersalinan = tglRencanaErr;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleClearSignature = () => {
    setSignatureHasDrawn(false);
  };

  const handleClearSignatureBtn = () => {
    const c = canvasRef.current;
    if (c) {
      c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    }
    setSignatureHasDrawn(false);
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors({});
    setSubmitError(null);
    handleClearSignatureBtn();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const ttdDataUrl = getSignatureDataUrl(canvasRef.current);

      // ── 1. Insert ke Supabase ──────────────────────────────────
      const { data: inserted, error } = await supabase
        .from("fmo_1")
        .insert([
          {
            nama_pasien:             form.namaPasien.trim(),
            tgl_lahir:               form.tglLahir || null,
            no_rm:                   form.noRM.trim() || null,
            nama_penanggung_jawab:   form.namaPJ.trim(),
            no_ktp:                  form.noKTP.trim() || null,
            no_hp:                   form.noHP.trim() || null,
            alamat:                  form.alamat.trim() || null,
            tgl_rencana_persalinan:  form.tglRencanaPersalinan || null,
            jenis_tindakan:          form.jenisTindakan || null,
            dokter_penanggung_jawab: form.dokterPJ || null,
            jenis_penjamin:          form.penjamin,
            rencana_kelas:           form.kelas,
            deskripsi:               form.deskripsi.trim() || null,
            ttd:                     ttdDataUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const insertedRow = inserted as InsertedRow;

      // ── 2. Generate & download PDF langsung ───────────────────
      setShowConfirm(false);
      try {
        await downloadPDFFromRow(insertedRow);
      } catch (pdfErr) {
        console.error("[download-pdf] failed:", pdfErr);
      }

      // ── 3. Kirim notifikasi Telegram (fire & forget) ───────────
      fetch("/api/notify-telegram-formulir-persetujuan-pembayaran-uang-muka", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(insertedRow),
      })
        .then(async (res) => {
          const json = await res.json();
          if (!json.ok) console.error("[notify-telegram] response error:", json);
        })
        .catch((err) => console.error("[notify-telegram] fetch failed:", err));

      // ── 4. Tampilkan sukses & reset form ──────────────────────
      handleReset();
      setShowSuccess(true);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal mengirim formulir. Silakan coba lagi.";
      setSubmitError(msg);
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const penjaminLabel = PENJAMIN_OPTIONS.find((o) => o.value === form.penjamin)?.label ?? "";
  const kelasLabel = KELAS_OPTIONS.find((o) => o.value === form.kelas)?.label ?? "";
  const jenisTindakanLabel = JENIS_TINDAKAN_OPTIONS.find((o) => o.value === form.jenisTindakan)?.label ?? "";

  return (
    <div className="font-sans text-sm text-mineshaft-500 bg-catskillwhite-500 min-h-screen antialiased">

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        form={form}
        penjaminLabel={penjaminLabel}
        kelasLabel={kelasLabel}
        jenisTindakanLabel={jenisTindakanLabel}
        isSubmitting={isSubmitting}
      />

      <SuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      <div className="py-8 px-4 sm:py-10 sm:px-6 lg:py-12 lg:px-10 xl:px-16 2xl:px-0">
        <div className="bg-white w-full max-w-[960px] mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_32px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">

          {/* Letterhead */}
          <div className="px-6 pt-7 pb-6 sm:px-10 sm:pt-8 sm:pb-7 lg:px-14 lg:pt-10 lg:pb-8 border-b border-catskillwhite-600 bg-linear-to-br from-white to-catskillwhite-400">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-catskillwhite-600 bg-white p-1">
                <Image src={Profile.logo} alt={Profile.shortName} width={60} height={60} className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (next) next.style.display = "flex";
                  }}
                />
                <div className="w-full h-full items-center justify-center hidden">
                  <svg className="w-7 h-7 text-catskillwhite-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-curiousblue-500/70 uppercase tracking-widest mb-1.5">
                  {Profile.institusi} {Profile.name} · {Profile.subtitle}
                </div>
                <h1 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-mineshaft-500 leading-tight">
                  Formulir Persetujuan Pembayaran{" "}
                  <span className="text-curiousblue-500">Uang Muka (DP) Persalinan</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-7 sm:px-10 sm:py-8 lg:px-14 lg:py-10">

            {submitError && (
              <div className="mb-6 flex items-start gap-3 bg-bittersweet-500/5 border border-bittersweet-500/30 rounded-xl px-4 py-3.5">
                <svg className="w-4 h-4 text-bittersweet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[12px] text-bittersweet-600">{submitError}</p>
              </div>
            )}

            {/* §1 Data Identitas */}
            <div className="mb-8">
              <SectionLabel>Data Identitas</SectionLabel>
              <p className="text-[13px] text-gray-500 mb-3.5 leading-relaxed">Yang bertanda tangan di bawah ini:</p>
              <div className="border border-catskillwhite-600 rounded-xl overflow-hidden">
                <FieldRow label="Nama Pasien" required>
                  <Input value={form.namaPasien} onChange={setInputField("namaPasien")} onFocus={clearError("namaPasien")}
                    placeholder="Isi nama pasien" error={errors.namaPasien} rounded="md" inputSize="sm" />
                </FieldRow>
                <FieldRow label="Tanggal Lahir">
                  <DatePicker
                    value={form.tglLahir}
                    onChange={(v) => {
                      setField("tglLahir")(v);
                      // Validasi real-time
                      const err = validateTglLahir(v);
                      if (err) {
                        setErrors((p) => ({ ...p, tglLahir: err }));
                      } else {
                        clearError("tglLahir")();
                      }
                    }}
                    placeholder="Pilih tanggal lahir"
                    maxDate={todayISO}
                    rounded="md" selectSize="sm"
                    error={errors.tglLahir}
                  />
                </FieldRow>
                <FieldRow label="No. Rekam Medis">
                  <Input type="tel" value={form.noRM} onChange={setInputField("noRM")}
                    placeholder="Isi nomor rekam medis" rounded="md" inputSize="sm" />
                </FieldRow>
                <FieldRow label="Nama Penanggung Jawab" required>
                  <Input value={form.namaPJ} onChange={setInputField("namaPJ")} onFocus={clearError("namaPJ")}
                    placeholder="Isi nama penanggung jawab" error={errors.namaPJ} rounded="md" inputSize="sm" />
                </FieldRow>
                <FieldRow label="No. KTP / Identitas">
                  <Input type="tel" value={form.noKTP} onChange={setInputField("noKTP")}
                    placeholder="Isi nomor KTP / identitas" rounded="md" inputSize="sm" />
                </FieldRow>
                <FieldRow label="No. HP">
                  <Input type="tel" value={form.noHP} onChange={setInputField("noHP")}
                    placeholder="Isi nomor HP" rounded="md" inputSize="sm" />
                </FieldRow>
                <FieldRow label="Alamat" alignTop>
                  <Textarea value={form.alamat} onChange={setInputField("alamat")}
                    placeholder="Isi alamat lengkap" rows={3} resize="vertical" rounded="md" textareaSize="sm" />
                </FieldRow>
                <FieldRow label="Tgl. Rencana Persalinan">
                  <DatePicker
                    value={form.tglRencanaPersalinan}
                    onChange={(v) => {
                      setField("tglRencanaPersalinan")(v);
                      // Validasi real-time
                      const err = validateTglRencana(v);
                      if (err) {
                        setErrors((p) => ({ ...p, tglRencanaPersalinan: err }));
                      } else {
                        clearError("tglRencanaPersalinan")();
                      }
                    }}
                    placeholder="Pilih tanggal rencana"
                    minDate={todayISO}
                    rounded="md" selectSize="sm"
                    error={errors.tglRencanaPersalinan}
                  />
                </FieldRow>
                <FieldRow label="Jenis Tindakan" required>
                  <Select
                    placeholder="Pilih jenis tindakan"
                    value={form.jenisTindakan}
                    onChange={(v) => { setField("jenisTindakan")(v); clearError("jenisTindakan")(); }}
                    options={JENIS_TINDAKAN_OPTIONS}
                    error={errors.jenisTindakan}
                    required rounded="md" selectSize="sm"
                  />
                </FieldRow>
                <FieldRow label="Dokter Penanggung Jawab" required>
                  <Select
                    placeholder="Pilih dokter"
                    value={form.dokterPJ}
                    onChange={(v) => { setField("dokterPJ")(v); clearError("dokterPJ")(); }}
                    options={DOKTER_OPTIONS}
                    error={errors.dokterPJ}
                    searchable
                    required rounded="md" selectSize="sm"
                  />
                </FieldRow>
              </div>
            </div>

            {/* §2 Pernyataan */}
            <div className="mb-8">
              <SectionLabel>Pernyataan Persetujuan</SectionLabel>
              <div className="text-[13px] text-gray-700 leading-[1.8] mb-3.5">
                <p className="mb-2.5">
                  Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan
                  persalinan yang akan dilakukan di{" "}
                  <strong className="text-gray-800">{Profile.institusi} {Profile.name}, {Profile.subtitle}</strong>,
                  termasuk estimasi biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku.
                </p>
                <p>Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka (DP) persalinan sebesar:</p>
              </div>
              <div className="flex gap-3 items-start bg-curiousblue-500/8 border border-curiousblue-500/20 rounded-xl px-5 py-4 mb-4">
                <svg className="w-5 h-5 text-curiousblue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-[18px] font-bold text-curiousblue-500">Rp 1.000.000,–</div>
                  <div className="text-[11px] text-catskillwhite-900 mt-0.5">Satu Juta Rupiah</div>
                </div>
              </div>
              <p className="text-[13px] text-gray-700 font-medium mb-2.5">Saya memahami dan menyetujui bahwa:</p>
              <ul className="list-disc pl-5 text-[13px] text-gray-500 leading-[2.1] space-y-0.5">
                <li>Uang muka (DP) merupakan bagian dari total biaya persalinan.</li>
                <li>Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.</li>
                <li>Uang muka yang telah dibayarkan{" "}
                  <strong className="text-gray-700">tidak dapat dikembalikan (non-refundable)</strong>{" "}
                  dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.</li>
              </ul>
            </div>

            {/* §3 Penjamin & Kelas */}
            <div className="mb-8">
              <SectionLabel>Rencana Penjamin &amp; Kelas Perawatan</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  { alpha: "A", title: "Jenis Penjamin", key: "penjamin" as const, opts: PENJAMIN_OPTIONS, ph: "Pilih jenis penjamin" },
                  { alpha: "B", title: "Rencana Kelas / Kamar", key: "kelas" as const, opts: KELAS_OPTIONS, ph: "Pilih kelas perawatan" },
                ].map(({ alpha, title, key, opts, ph }) => (
                  <div key={key} className="bg-catskillwhite-400 border border-catskillwhite-600 rounded-xl px-5 py-4">
                    <div className="text-[10px] font-bold text-curiousblue-500/70 uppercase tracking-[0.08em] mb-2.5">{alpha}. {title}</div>
                    <Select placeholder={ph} value={form[key]}
                      onChange={(v) => { setField(key)(v); clearError(key)(); }}
                      options={opts} error={errors[key]} required rounded="xl" selectSize="sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 items-start bg-mariner-500/6 border border-mariner-500/20 rounded-xl px-5 py-4">
                <svg className="w-4 h-4 text-mariner-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-[12px] text-mariner-500 leading-relaxed">
                  Apabila terjadi perubahan kelas perawatan selama masa rawat inap, pasien/penanggung jawab bersedia mengikuti ketentuan biaya sesuai kelas yang ditempati.
                </p>
              </div>
            </div>

            {/* Closing */}
            <p className="text-[13px] text-gray-500 leading-[1.8] mb-8">
              Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.
            </p>

            {/* §4 Tanda Tangan */}
            <div className="mb-8">
              <SectionLabel>Tanda Tangan</SectionLabel>
              <div className="w-full">
                {/* Baris atas: label kiri, tanggal kanan — keduanya di LUAR box */}
                <div className="flex items-end justify-between mb-2">
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.06em]">
                    Pasien / Penanggung Jawab
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-400">Sepanjang,</span>
                    <span className="text-[12px] font-semibold text-gray-700">{today}</span>
                  </div>
                </div>
                {/* Box tanda tangan */}
                <SignaturePad canvasRef={canvasRef} onClear={handleClearSignature} />
                {/* Baris bawah: tombol hapus kiri, nama kanan — keduanya di LUAR box */}
                <div className="flex items-start justify-between mt-1.5">
                  <button
                    type="button"
                    onClick={handleClearSignatureBtn}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer px-0 py-0.5 rounded"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hapus tanda tangan
                  </button>
                  <div className="border-t-2 border-gray-800 pt-1.5 text-center min-w-[200px]">
                    {form.namaPJ ? (
                      <span className="text-[13px] font-semibold text-gray-800">( {form.namaPJ} )</span>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">(nama penanggung jawab)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-catskillwhite-600 my-7" />

            {/* Actions — urutan: Kembali | Reset || Kirim Formulir */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Kembali */}
                <Button variant="secondary" size="sm" onClick={() => window.history.back()}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali
                </Button>
                {/* Reset */}
                <Button variant="default" size="sm" onClick={handleReset}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </Button>
              </div>
              {/* Kirim Formulir */}
              <Button variant="primary" size="md"
                onClick={() => { if (validate()) setShowConfirm(true); }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Kirim Formulir
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Doc footer */}
          <div className="border-t border-catskillwhite-600 bg-catskillwhite-400 px-6 sm:px-10 lg:px-14 py-3 flex justify-between items-center flex-wrap gap-1">
            <span className="text-[11px] text-catskillwhite-900">Halaman 1 dari 1</span>
            <span className="text-[11px] text-catskillwhite-900">FM-ADM-001 · {Profile.shortName}</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-catskillwhite-900 mt-5 px-4">
          Dokumen ini bersifat resmi dan dipergunakan sebagai arsip administrasi rumah sakit.
        </p>
      </div>
    </div>
  );
}