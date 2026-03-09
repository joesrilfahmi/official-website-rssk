// app/(dashboard)/formulir-dp/page.tsx
"use client";

import { AccessDeniedDialog } from "@/components/access-denied-dialog";
import { TablePagination } from "@/components/table/TablePagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Profile } from "@/config/profile";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowUpDown, Download, Eye, Loader2, Search, Trash2, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type SortField = "nama_pasien" | "tanggal" | "created_at";
type SortOrder = "asc" | "desc";

interface Fmo1 {
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

interface EditFormState {
  nama_pasien: string;
  tgl_lahir: string;
  no_rm: string;
  nama_penanggung_jawab: string;
  no_ktp: string;
  no_hp: string;
  alamat: string;
  tgl_rencana_persalinan: string;
  jenis_tindakan: string;
  dokter_penanggung_jawab: string;
  jenis_penjamin: string;
  rencana_kelas: string;
  deskripsi: string;
}

type EditFormErrors = Partial<Record<keyof EditFormState, string>>;

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
  { value: "dr. ANDI BUDI HERIANTO, Sp.OG", label: "dr. ANDI BUDI HERIANTO, Sp.OG" },
  { value: "dr. PRASTI SULANJARI, Sp.OG", label: "dr. PRASTI SULANJARI, Sp.OG" },
  { value: "dr. RODIYAH, Sp.OG", label: "dr. RODIYAH, Sp.OG" },
  { value: "dr. WAHYU WIDOYOKO, Sp.OG", label: "dr. WAHYU WIDOYOKO, Sp.OG" },
  { value: "dr. SETYO BUDI PAMUNGKAS, Sp.OG", label: "dr. SETYO BUDI PAMUNGKAS, Sp.OG" },
  { value: "dr. ADITYA HERLAMBANG, Sp.OG", label: "dr. ADITYA HERLAMBANG, Sp.OG" },
];

const getPenjaminLabel = (val: string) =>
  PENJAMIN_OPTIONS.find((o) => o.value === val)?.label ?? val;

const getKelasLabel = (val: string) =>
  KELAS_OPTIONS.find((o) => o.value === val)?.label ?? val;

const getJenisTindakanLabel = (val: string | null) => {
  if (!val) return "—";
  return JENIS_TINDAKAN_OPTIONS.find((o) => o.value === val)?.label ?? val;
};

const formatTanggal = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTanggalLong = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/* ─────────────────────────────────────────
   FILENAME HELPER
───────────────────────────────────────── */
function buildFileName(item: Fmo1): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const sanitize = (s: string) =>
    s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
  const noRm = item.no_rm ? sanitize(item.no_rm) : "NoRM";
  const nama = sanitize(item.nama_pasien);
  const stamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${noRm}-${nama}-${stamp}`;
}

/* ─────────────────────────────────────────
   BUILD DOCUMENT HTML
───────────────────────────────────────── */
function buildDocumentHTML(item: Fmo1, logoBase64?: string): string {
  const penjaminLabel = getPenjaminLabel(item.jenis_penjamin);
  const kelasLabel = getKelasLabel(item.rencana_kelas);
  const jenisTindakanLabel = getJenisTindakanLabel(item.jenis_tindakan);
  const tanggalFormatted = formatTanggalLong(item.tanggal);
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
    font-size: 13px;
    color: #000;
    background: #fff;
    width: 794px;
    padding: 60px 72px 60px 72px;
    line-height: 1.65;
  }
  .letterhead {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 8px;
    border-bottom: 3px double #000;
    margin-bottom: 16px;
  }
  .lh-logo { width: 58px; height: 58px; object-fit: contain; flex-shrink: 0; }
  .lh-info { flex: 1; text-align: center; }
  .lh-name { font-size: 15px; font-weight: 700; text-transform: uppercase; line-height: 1.3; }
  .lh-sub  { font-size: 11px; margin-top: 2px; }
  .lh-addr { font-size: 10px; margin-top: 2px; }
  .doc-title {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    text-decoration: underline;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  p { margin-bottom: 5px; font-size: 13px; }
  .field-block { margin-bottom: 12px; }
  .field-row {
    display: flex;
    align-items: flex-end;
    margin-bottom: 3px;
    font-size: 13px;
  }
  .field-label { width: 195px; flex-shrink: 0; }
  .field-colon { width: 14px; flex-shrink: 0; }
  .field-value {
    flex: 1;
    padding-bottom: 1px;
    padding-left: 4px;
  }
  ol { margin: 3px 0 8px 20px; padding: 0; }
  ol li { font-size: 13px; margin-bottom: 2px; line-height: 1.55; }
  .section-label {
    font-size: 13px;
    font-weight: 700;
    text-decoration: underline;
    margin-top: 10px;
    margin-bottom: 4px;
  }
  .sign-block { margin-top: 16px; display: flex; justify-content: flex-end; }
  .sign-inner { text-align: center; width: 220px; }
  .sign-inner p { font-size: 13px; margin-bottom: 3px; }
  .sign-gap { height: 64px; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
  .sign-gap img { max-height: 60px; max-width: 190px; object-fit: contain; }
  .sign-name {
    font-size: 13px;
    border-top: 1px solid #000;
    padding-top: 4px;
    display: inline-block;
    min-width: 175px;
    text-align: center;
  }
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
    <div class="field-row">
      <span class="field-label">Nama Pasien</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.nama_pasien}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Tanggal Lahir</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.tgl_lahir ? formatTanggalLong(item.tgl_lahir) : ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">No. RM</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.no_rm ?? ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Nama Penanggung Jawab</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.nama_penanggung_jawab}</span>
    </div>
    <div class="field-row">
      <span class="field-label">No. KTP/Identitas</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.no_ktp ?? ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">No. HP</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.no_hp ?? ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Alamat</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.alamat ?? ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Tgl. Rencana Persalinan</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.tgl_rencana_persalinan ? formatTanggalLong(item.tgl_rencana_persalinan) : ""}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Jenis Tindakan</span>
      <span class="field-colon">:</span>
      <span class="field-value">${jenisTindakanLabel}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Dokter Penanggung Jawab</span>
      <span class="field-colon">:</span>
      <span class="field-value">${item.dokter_penanggung_jawab ?? ""}</span>
    </div>
  </div>

  <p style="text-align:justify;">
    Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan
    persalinan yang akan dilakukan di ${Profile.institusi} ${Profile.name}, termasuk estimasi
    biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku.
  </p>
  <p>
    Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka
    (DP) persalinan sebesar: <strong>Rp1.000.000,- (Satu Juta Rupiah)</strong>
  </p>
  <p>Saya memahami dan menyetujui bahwa:</p>
  <ol>
    <li>Uang muka (DP) merupakan bagian dari total biaya persalinan.</li>
    <li>Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.</li>
    <li>Uang muka (DP) yang telah dibayarkan tidak dapat dikembalikan (non-refundable)
        dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.</li>
  </ol>

  <p class="section-label">Rencana Penjamin dan Kelas Perawatan</p>
  <div class="field-block">
    <div class="field-row">
      <span class="field-label">Jenis Penjamin</span>
      <span class="field-colon">:</span>
      <span class="field-value">${penjaminLabel}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Rencana Kelas / Kamar</span>
      <span class="field-colon">:</span>
      <span class="field-value">${kelasLabel}</span>
    </div>
  </div>

  <p><strong>Keterangan:</strong></p>
  <p style="text-align:justify;">
    Apabila terjadi perubahan kelas perawatan selama masa rawat inap, maka pasien/penanggung
    jawab bersedia mengikuti ketentuan biaya sesuai kelas yang ditempati.
  </p>
  ${item.deskripsi ? `<p>${item.deskripsi}</p>` : ""}

  <p style="text-align:justify; margin-top:8px;">
    Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun,
    dan dapat dipergunakan sebagaimana mestinya.
  </p>

  <div class="sign-block">
    <div class="sign-inner">
      <p>Sepanjang, ${tanggalFormatted}</p>
      <p>Pasien / Penanggung Jawab,</p>
      <div class="sign-gap">
        ${item.ttd
          ? `<img src="${item.ttd}" alt="Tanda tangan" />`
          : `<span style="display:block;height:60px;"></span>`
        }
      </div>
      <span class="sign-name">( ${item.nama_penanggung_jawab} )</span>
    </div>
  </div>

</body>
</html>`;
}

/* ─────────────────────────────────────────
   SCRIPT LOADER
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   DOWNLOAD PDF
───────────────────────────────────────── */
async function handleDownloadPDF(item: Fmo1): Promise<void> {
  const toastId = toast.loading("Membuat PDF...");
  try {
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
    } catch { /* fallback to path */ }

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
    const fullHeight = iframeBody.scrollHeight;

    const canvas = await html2canvas(iframeBody, {
      scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: "#ffffff",
      width: 794, height: fullHeight, windowWidth: 794, windowHeight: fullHeight,
      scrollX: 0, scrollY: 0, logging: false,
    });

    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = pageWidth * (canvas.height / canvas.width);

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
    } else {
      let rendered = 0;
      const sliceH = Math.floor((canvas.width * pageHeight) / pageWidth);
      let page = 0;
      while (rendered < canvas.height) {
        if (page > 0) pdf.addPage();
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width;
        tmp.height = Math.min(sliceH, canvas.height - rendered);
        const ctx = tmp.getContext("2d")!;
        ctx.drawImage(canvas, 0, rendered, canvas.width, tmp.height, 0, 0, canvas.width, tmp.height);
        pdf.addImage(tmp.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, pageWidth, (tmp.height / canvas.width) * pageWidth);
        rendered += tmp.height;
        page++;
      }
    }

    pdf.save(`${fileName}.pdf`);
    toast.success("PDF berhasil diunduh", { id: toastId });
  } catch (err) {
    console.error(err);
    toast.error("Gagal membuat PDF", { id: toastId });
  }
}

/* ─────────────────────────────────────────
   VIEW DIALOG  — PDF-viewer style modal
───────────────────────────────────────── */
const ViewDialog: React.FC<{ open: boolean; item: Fmo1 | null; onClose: () => void }> = ({ open, item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !item) return;
    setLoading(true);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) iframe.style.height = doc.body.scrollHeight + "px";
      } catch { /* guard */ }
      setLoading(false);
    };
    iframe.addEventListener("load", onLoad, { once: true });
    iframe.srcdoc = buildDocumentHTML(item);
    return () => iframe.removeEventListener("load", onLoad);
  }, [open, item]);

  if (!open || !item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] w-full sm:max-w-4xl p-0 bg-[#525659] gap-0 overflow-hidden flex flex-col"
        style={{ height: "92vh" }}
      >
        <div className="sr-only">
          <DialogTitle>Preview Formulir DP</DialogTitle>
          <DialogDescription>Preview dokumen formulir DP persalinan</DialogDescription>
        </div>
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#323639] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#444] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-100 truncate leading-tight">
                Formulir DP — {item.nama_pasien}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                FM-ADM-001 · {formatTanggal(item.tanggal)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <Button
              size="sm" variant="ghost"
              className="h-8 px-3 text-gray-300 hover:text-white hover:bg-white/10 text-xs gap-1.5"
              onClick={() => handleDownloadPDF(item)}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Document area */}
        <div className="flex-1 overflow-auto bg-[#525659] flex justify-center py-6 px-4">
          <div className="relative w-full" style={{ maxWidth: 794 }}>
            {loading && (
              <div className="absolute inset-0 bg-white rounded shadow-2xl z-10 flex items-center justify-center" style={{ minHeight: 900 }}>
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  <span className="text-xs text-gray-400">Memuat dokumen...</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              title="Preview Formulir DP"
              className="w-full bg-white rounded shadow-2xl block"
              style={{ border: "none", minHeight: 900, height: "auto" }}
              scrolling="no"
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#323639] shrink-0 border-t border-black/20">
          <span className="text-[11px] text-gray-500">FM-ADM-001 · Rev.01</span>
          <Button size="sm" variant="ghost"
            className="h-7 px-3 text-gray-400 hover:text-white hover:bg-white/10 text-xs"
            onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────
   EDIT DIALOG
───────────────────────────────────────── */
const EditDialog: React.FC<{
  open: boolean; item: Fmo1 | null; onClose: () => void; onSaved: () => void;
}> = ({ open, item, onClose, onSaved }) => {
  const [form, setForm] = useState<EditFormState>({
    nama_pasien: "", tgl_lahir: "", no_rm: "", nama_penanggung_jawab: "",
    no_ktp: "", no_hp: "", alamat: "", tgl_rencana_persalinan: "",
    jenis_tindakan: "", dokter_penanggung_jawab: "", jenis_penjamin: "", rencana_kelas: "", deskripsi: "",
  });
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        nama_pasien: item.nama_pasien,
        tgl_lahir: item.tgl_lahir ?? "",
        no_rm: item.no_rm ?? "",
        nama_penanggung_jawab: item.nama_penanggung_jawab,
        no_ktp: item.no_ktp ?? "",
        no_hp: item.no_hp ?? "",
        alamat: item.alamat ?? "",
        tgl_rencana_persalinan: item.tgl_rencana_persalinan ?? "",
        jenis_tindakan: item.jenis_tindakan ?? "",
        dokter_penanggung_jawab: item.dokter_penanggung_jawab ?? "",
        jenis_penjamin: item.jenis_penjamin,
        rencana_kelas: item.rencana_kelas,
        deskripsi: item.deskripsi ?? "",
      });
      setErrors({});
    }
  }, [item]);

  const validate = (): boolean => {
    const e: EditFormErrors = {};
    if (!form.nama_pasien.trim()) e.nama_pasien = "Wajib diisi";
    if (!form.nama_penanggung_jawab.trim()) e.nama_penanggung_jawab = "Wajib diisi";
    if (!form.jenis_penjamin) e.jenis_penjamin = "Wajib dipilih";
    if (!form.rencana_kelas) e.rencana_kelas = "Wajib dipilih";
    if (!form.jenis_tindakan) e.jenis_tindakan = "Wajib dipilih";
    if (!form.dokter_penanggung_jawab) e.dokter_penanggung_jawab = "Wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !item) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("fmo_1").update({
        nama_pasien: form.nama_pasien.trim(),
        tgl_lahir: form.tgl_lahir || null,
        no_rm: form.no_rm.trim() || null,
        nama_penanggung_jawab: form.nama_penanggung_jawab.trim(),
        no_ktp: form.no_ktp.trim() || null,
        no_hp: form.no_hp.trim() || null,
        alamat: form.alamat.trim() || null,
        tgl_rencana_persalinan: form.tgl_rencana_persalinan || null,
        jenis_tindakan: form.jenis_tindakan || null,
        dokter_penanggung_jawab: form.dokter_penanggung_jawab || null,
        jenis_penjamin: form.jenis_penjamin,
        rencana_kelas: form.rencana_kelas,
        deskripsi: form.deskripsi.trim() || null,
      }).eq("id", item.id);
      if (error) throw error;
      toast.success("Data berhasil diperbarui");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui data");
    } finally {
      setSubmitting(false);
    }
  };

  const setF = (k: keyof EditFormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setInputF = (k: keyof EditFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(k)(e.target.value);
  const clearErr = (k: keyof EditFormState) => () => setErrors((p) => { const n = { ...p }; delete n[k]; return n; });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Formulir DP</DialogTitle>
          <DialogDescription>Perbarui data formulir persetujuan DP persalinan</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nama Pasien */}
            <div className="space-y-1.5">
              <Label htmlFor="nama_pasien">Nama Pasien <span className="text-red-500">*</span></Label>
              <Input id="nama_pasien" value={form.nama_pasien} onChange={setInputF("nama_pasien")}
                onFocus={clearErr("nama_pasien")} placeholder="Nama pasien" disabled={submitting}
                className={errors.nama_pasien ? "border-red-500" : ""} />
              {errors.nama_pasien && <p className="text-xs text-red-500">{errors.nama_pasien}</p>}
            </div>

            {/* Tgl Lahir */}
            <div className="space-y-1.5">
              <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
              <Input id="tgl_lahir" type="date" value={form.tgl_lahir} onChange={setInputF("tgl_lahir")} disabled={submitting} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="no_rm">No. Rekam Medis</Label>
                <Input id="no_rm" value={form.no_rm} onChange={setInputF("no_rm")} placeholder="No. rekam medis" disabled={submitting} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="no_ktp">No. KTP / Identitas</Label>
                <Input id="no_ktp" value={form.no_ktp} onChange={setInputF("no_ktp")} placeholder="No. KTP" disabled={submitting} />
              </div>
            </div>

            {/* Nama PJ */}
            <div className="space-y-1.5">
              <Label htmlFor="nama_penanggung_jawab">Nama Penanggung Jawab <span className="text-red-500">*</span></Label>
              <Input id="nama_penanggung_jawab" value={form.nama_penanggung_jawab} onChange={setInputF("nama_penanggung_jawab")}
                onFocus={clearErr("nama_penanggung_jawab")} placeholder="Nama penanggung jawab" disabled={submitting}
                className={errors.nama_penanggung_jawab ? "border-red-500" : ""} />
              {errors.nama_penanggung_jawab && <p className="text-xs text-red-500">{errors.nama_penanggung_jawab}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="no_hp">No. HP</Label>
              <Input id="no_hp" value={form.no_hp} onChange={setInputF("no_hp")} placeholder="No. HP" disabled={submitting} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea id="alamat" value={form.alamat} onChange={setInputF("alamat")} placeholder="Alamat lengkap" rows={3} disabled={submitting} />
            </div>

            {/* Tgl Rencana Persalinan */}
            <div className="space-y-1.5">
              <Label htmlFor="tgl_rencana_persalinan">Tgl. Rencana Persalinan</Label>
              <Input id="tgl_rencana_persalinan" type="date" value={form.tgl_rencana_persalinan}
                onChange={setInputF("tgl_rencana_persalinan")} disabled={submitting} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jenis Tindakan */}
              <div className="space-y-1.5">
                <Label>Jenis Tindakan <span className="text-red-500">*</span></Label>
                <Select value={form.jenis_tindakan}
                  onValueChange={(v) => { setF("jenis_tindakan")(v); clearErr("jenis_tindakan")(); }}
                  disabled={submitting}>
                  <SelectTrigger className={errors.jenis_tindakan ? "border-red-500" : ""}>
                    <span>{form.jenis_tindakan ? getJenisTindakanLabel(form.jenis_tindakan) : "Pilih jenis tindakan"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_TINDAKAN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jenis_tindakan && <p className="text-xs text-red-500">{errors.jenis_tindakan}</p>}
              </div>

              {/* Jenis Penjamin */}
              <div className="space-y-1.5">
                <Label>Jenis Penjamin <span className="text-red-500">*</span></Label>
                <Select value={form.jenis_penjamin}
                  onValueChange={(v) => { setF("jenis_penjamin")(v); clearErr("jenis_penjamin")(); }}
                  disabled={submitting}>
                  <SelectTrigger className={errors.jenis_penjamin ? "border-red-500" : ""}>
                    <span>{form.jenis_penjamin ? getPenjaminLabel(form.jenis_penjamin) : "Pilih penjamin"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {PENJAMIN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jenis_penjamin && <p className="text-xs text-red-500">{errors.jenis_penjamin}</p>}
              </div>
            </div>

            {/* Dokter PJ */}
            <div className="space-y-1.5">
              <Label>Dokter Penanggung Jawab <span className="text-red-500">*</span></Label>
              <Select value={form.dokter_penanggung_jawab}
                onValueChange={(v) => { setF("dokter_penanggung_jawab")(v); clearErr("dokter_penanggung_jawab")(); }}
                disabled={submitting}>
                <SelectTrigger className={errors.dokter_penanggung_jawab ? "border-red-500" : ""}>
                  <span>{form.dokter_penanggung_jawab || "Pilih dokter"}</span>
                </SelectTrigger>
                <SelectContent>
                  {DOKTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dokter_penanggung_jawab && <p className="text-xs text-red-500">{errors.dokter_penanggung_jawab}</p>}
            </div>

            {/* Rencana Kelas */}
            <div className="space-y-1.5">
              <Label>Rencana Kelas <span className="text-red-500">*</span></Label>
              <Select value={form.rencana_kelas}
                onValueChange={(v) => { setF("rencana_kelas")(v); clearErr("rencana_kelas")(); }}
                disabled={submitting}>
                <SelectTrigger className={errors.rencana_kelas ? "border-red-500" : ""}>
                  <span>{form.rencana_kelas ? getKelasLabel(form.rencana_kelas) : "Pilih kelas"}</span>
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rencana_kelas && <p className="text-xs text-red-500">{errors.rencana_kelas}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function FormulirDPPage() {
  const [data, setData] = useState<Fmo1[]>([]);
  const [filtered, setFiltered] = useState<Fmo1[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const [viewItem, setViewItem] = useState<Fmo1 | null>(null);
  const [editItem, setEditItem] = useState<Fmo1 | null>(null);
  const [deleteItem, setDeleteItem] = useState<Fmo1 | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);
  const [sortField, setSortField] = useState<SortField>("tanggal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const applyFilters = useCallback(() => {
    let f = [...data];
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      f = f.filter((r) =>
        r.nama_pasien.toLowerCase().includes(q) ||
        r.nama_penanggung_jawab.toLowerCase().includes(q) ||
        (r.no_rm ?? "").toLowerCase().includes(q) ||
        (r.no_hp ?? "").toLowerCase().includes(q) ||
        (r.dokter_penanggung_jawab ?? "").toLowerCase().includes(q),
      );
    }
    f.sort((a, b) => {
      let cmp = 0;
      if (sortField === "nama_pasien") cmp = a.nama_pasien.localeCompare(b.nama_pasien, "id");
      else if (sortField === "tanggal") cmp = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });
    setFiltered(f);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [data, debouncedSearch, sortField, sortOrder]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const fetchData = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase.from("fmo_1").select("*").order("tanggal", { ascending: false });
      if (error) throw error;
      setData(rows ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data formulir");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const user = getCurrentUser();
        if (!user) { setShowAccessDenied(true); return; }
        await fetchData();
      } finally {
        setLoading(false);
      }
    };
    init();
    const channel = supabase.channel("fmo_1_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "fmo_1" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const totalItems = filtered.length;
  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === "all" ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex = itemsPerPage === "all" ? totalItems : startIndex + (itemsPerPage as number);
  const currentRows = filtered.slice(startIndex, endIndex);

  const isAllSelected = currentRows.length > 0 && currentRows.every((r) => selectedIds.has(r.id));
  const isSomeSelected = currentRows.some((r) => selectedIds.has(r.id)) && !isAllSelected;
  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(currentRows.map((r) => r.id)) : new Set());
  const handleSelectOne = (id: string, checked: boolean) => {
    const n = new Set(selectedIds);
    checked ? n.add(id) : n.delete(id);
    setSelectedIds(n);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("fmo_1").delete().eq("id", deleteItem.id);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      setDeleteItem(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("fmo_1").delete().in("id", Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} data berhasil dihapus`);
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const sortOptions = [
    { value: "tanggal-desc", label: "Terbaru" },
    { value: "tanggal-asc", label: "Terlama" },
    { value: "nama_pasien-asc", label: "Nama (A-Z)" },
    { value: "nama_pasien-desc", label: "Nama (Z-A)" },
    { value: "created_at-desc", label: "Dibuat Terbaru" },
    { value: "created_at-asc", label: "Dibuat Terlama" },
  ];
  const getSortLabel = () =>
    sortOptions.find((o) => o.value === `${sortField}-${sortOrder}`)?.label ?? "Urutkan";
  const showReset = sortField !== "tanggal" || sortOrder !== "desc" || searchQuery !== "";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Formulir DP Persalinan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Formulir DP Persalinan</h1>
          <p className="text-muted-foreground mt-1">Data formulir persetujuan pembayaran uang muka persalinan</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="self-end sm:self-auto">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(true)} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Formulir ({totalItems})</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Cari nama pasien, no. RM, HP, dokter..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={`${sortField}-${sortOrder}`}
                onValueChange={(v) => {
                  const [f, o] = v.split("-") as [SortField, SortOrder];
                  setSortField(f); setSortOrder(o);
                }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{getSortLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showReset && (
                <Button variant="outline" onClick={() => { setSortField("tanggal"); setSortOrder("desc"); setSearchQuery(""); }}>
                  <X className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all"
                      className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""} />
                  </TableHead>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Pasien</TableHead>
                  <TableHead className="hidden md:table-cell">Penanggung Jawab</TableHead>
                  <TableHead className="hidden xl:table-cell">Dokter</TableHead>
                  <TableHead className="hidden lg:table-cell">Tindakan</TableHead>
                  <TableHead className="hidden lg:table-cell">Penjamin</TableHead>
                  <TableHead className="hidden lg:table-cell">Kelas</TableHead>
                  <TableHead className="hidden sm:table-cell w-[130px]">Tanggal</TableHead>
                  <TableHead className="text-right w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32">
                      {searchQuery ? "Tidak ada data yang sesuai dengan pencarian" : "Belum ada data formulir DP"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(row.id)}
                          onCheckedChange={(c) => handleSelectOne(row.id, c as boolean)} />
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">{startIndex + idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.nama_pasien}</div>
                        {row.no_rm && <div className="text-xs text-muted-foreground">RM: {row.no_rm}</div>}
                        {row.tgl_lahir && (
                          <div className="text-xs text-muted-foreground">Lahir: {formatTanggal(row.tgl_lahir)}</div>
                        )}
                        {row.no_hp && (
                          <div className="text-xs text-muted-foreground sm:hidden">{row.no_hp}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{row.nama_penanggung_jawab}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {row.dokter_penanggung_jawab ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {row.jenis_tindakan ? (
                          <Badge variant={row.jenis_tindakan === "sc" ? "destructive" : "default"} className="text-xs">
                            {getJenisTindakanLabel(row.jenis_tindakan)}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">{getPenjaminLabel(row.jenis_penjamin)}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">{getKelasLabel(row.rencana_kelas)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        <div>{formatTanggal(row.tanggal)}</div>
                        {row.tgl_rencana_persalinan && (
                          <div className="text-xs text-blue-500">
                            Rencana: {formatTanggal(row.tgl_rencana_persalinan)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8"
                                  onClick={() => setViewItem(row)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview Dokumen</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8"
                                  onClick={() => handleDownloadPDF(row)}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon"
                                  className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                  onClick={() => setDeleteItem(row)} disabled={submitting}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Hapus</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </CardContent>
      </Card>

      <ViewDialog open={!!viewItem} item={viewItem} onClose={() => setViewItem(null)} />
      <EditDialog open={!!editItem} item={editItem} onClose={() => setEditItem(null)} onSaved={fetchData} />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Formulir?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data formulir atas nama{" "}
              <strong>{deleteItem?.nama_pasien}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Data Formulir?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} data formulir yang dipilih?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
}