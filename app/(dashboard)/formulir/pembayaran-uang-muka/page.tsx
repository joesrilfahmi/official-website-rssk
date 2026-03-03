// app/(dashboard)/formulir-dp/page.tsx
"use client";

import { AccessDeniedDialog } from "@/components/access-denied-dialog";
import { TablePagination } from "@/components/table/TablePagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowUpDown,
  Eye,
  Loader2,
  Pencil,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type SortField = "nama_pasien" | "tanggal" | "created_at";
type SortOrder = "asc" | "desc";

interface Fmo1 {
  id: string;
  nama_pasien: string;
  no_rm: string | null;
  nama_penanggung_jawab: string;
  no_ktp: string | null;
  no_hp: string | null;
  alamat: string | null;
  jenis_penjamin: string;
  rencana_kelas: string;
  ttd: string | null;
  deskripsi: string | null;
  tanggal: string;
  created_at: string;
}

interface EditFormState {
  nama_pasien: string;
  no_rm: string;
  nama_penanggung_jawab: string;
  no_ktp: string;
  no_hp: string;
  alamat: string;
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

const getPenjaminLabel = (val: string) =>
  PENJAMIN_OPTIONS.find((o) => o.value === val)?.label ?? val;

const getKelasLabel = (val: string) =>
  KELAS_OPTIONS.find((o) => o.value === val)?.label ?? val;

const formatTanggal = (dateStr: string) => {
  if (!dateStr) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/* ─────────────────────────────────────────
   PRINT HELPER
───────────────────────────────────────── */
function handlePrint(item: Fmo1) {
  const penjaminLabel = getPenjaminLabel(item.jenis_penjamin);
  const kelasLabel = getKelasLabel(item.rencana_kelas);

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
  const d = new Date(item.tanggal);
  const tanggalFormatted = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  const printWindow = window.open("", "_blank", "width=860,height=900");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Formulir DP Persalinan – ${item.nama_pasien}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #111; background: #fff; padding: 24mm 20mm; }
    .letterhead { display: flex; align-items: flex-start; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
    .lh-text h1 { font-size: 14pt; font-weight: bold; margin-bottom: 2px; }
    .lh-text p { font-size: 9pt; color: #444; }
    .doc-title { text-align: center; margin: 16px 0 12px; }
    .doc-title h2 { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-title p { font-size: 9pt; color: #555; margin-top: 4px; }
    .section { margin-bottom: 14px; }
    .section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; letter-spacing: 0.4px; }
    .field-table { width: 100%; border-collapse: collapse; }
    .field-table tr td { padding: 4px 6px; font-size: 11pt; }
    .field-table tr td:first-child { width: 38%; color: #444; vertical-align: top; }
    .field-table tr td:nth-child(2) { width: 2%; color: #444; }
    .dp-box { border: 2px solid #111; padding: 10px 16px; display: inline-block; margin: 6px 0; }
    .dp-box .amount { font-size: 18pt; font-weight: bold; }
    .dp-box .terbilang { font-size: 9pt; color: #444; margin-top: 2px; }
    .bullet-list { padding-left: 20px; }
    .bullet-list li { margin-bottom: 4px; font-size: 11pt; line-height: 1.6; }
    .sign-section { display: flex; gap: 40px; margin-top: 6px; align-items: flex-start; }
    .sign-date { min-width: 120px; }
    .sign-date p { font-size: 10pt; color: #555; }
    .sign-date strong { font-size: 11pt; }
    .sign-pad { flex: 1; text-align: center; }
    .sign-pad p { font-size: 10pt; color: #555; margin-bottom: 4px; }
    .sign-pad img { max-height: 80px; max-width: 260px; border-bottom: 1.5px solid #111; padding-bottom: 4px; }
    .sign-pad .no-sig { height: 72px; border-bottom: 1.5px solid #111; display: block; }
    .sign-name { font-size: 11pt; font-weight: bold; margin-top: 4px; }
    .doc-footer { border-top: 1px solid #ccc; margin-top: 28px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9pt; color: #888; }
    @media print { body { padding: 12mm 16mm; } }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="lh-text">
      <h1>Rumah Sakit</h1>
      <p>Formulir Administrasi · FM-ADM-001</p>
    </div>
  </div>

  <div class="doc-title">
    <h2>Formulir Persetujuan Pembayaran Uang Muka (DP) Persalinan</h2>
    <p>Tindakan Persalinan &nbsp;·&nbsp; ${tanggalFormatted}</p>
  </div>

  <div class="section">
    <div class="section-title">Data Identitas</div>
    <p style="margin-bottom:6px;font-size:11pt;">Yang bertanda tangan di bawah ini:</p>
    <table class="field-table">
      <tr><td>Nama Pasien</td><td>:</td><td><strong>${item.nama_pasien}</strong></td></tr>
      <tr><td>No. Rekam Medis</td><td>:</td><td>${item.no_rm ?? "—"}</td></tr>
      <tr><td>Nama Penanggung Jawab</td><td>:</td><td>${item.nama_penanggung_jawab}</td></tr>
      <tr><td>No. KTP / Identitas</td><td>:</td><td>${item.no_ktp ?? "—"}</td></tr>
      <tr><td>No. HP</td><td>:</td><td>${item.no_hp ?? "—"}</td></tr>
      <tr><td>Alamat</td><td>:</td><td>${item.alamat ?? "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Pernyataan Persetujuan</div>
    <p style="font-size:11pt;line-height:1.7;margin-bottom:8px;">Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan persalinan yang akan dilakukan, termasuk estimasi biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku. Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka (DP) persalinan sebesar:</p>
    <div class="dp-box">
      <div class="amount">Rp 1.000.000,–</div>
      <div class="terbilang">Satu Juta Rupiah</div>
    </div>
    <p style="font-size:11pt;font-weight:bold;margin:10px 0 6px;">Saya memahami dan menyetujui bahwa:</p>
    <ul class="bullet-list">
      <li>Uang muka (DP) merupakan bagian dari total biaya persalinan.</li>
      <li>Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.</li>
      <li>Uang muka yang telah dibayarkan <strong>tidak dapat dikembalikan (non-refundable)</strong> dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Rencana Penjamin &amp; Kelas Perawatan</div>
    <table class="field-table">
      <tr><td>Jenis Penjamin</td><td>:</td><td>${penjaminLabel}</td></tr>
      <tr><td>Rencana Kelas / Kamar</td><td>:</td><td>${kelasLabel}</td></tr>
    </table>
    ${item.deskripsi ? `<p style="margin-top:8px;font-size:10pt;color:#555;">Keterangan: ${item.deskripsi}</p>` : ""}
  </div>

  <p style="font-size:11pt;line-height:1.8;margin-bottom:16px;">Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.</p>

  <div class="section">
    <div class="section-title">Tanda Tangan</div>
    <div class="sign-section">
      <div class="sign-date">
        <p>Sepanjang,</p>
        <strong>${tanggalFormatted}</strong>
      </div>
      <div class="sign-pad">
        <p>Pasien / Penanggung Jawab</p>
        ${
          item.ttd
            ? `<img src="${item.ttd}" alt="Tanda tangan" />`
            : `<span class="no-sig"></span>`
        }
        <div class="sign-name">( ${item.nama_pasien} )</div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>Halaman 1 dari 1</span>
    <span>FM-ADM-001 · Rev.01</span>
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`);
  printWindow.document.close();
}

/* ─────────────────────────────────────────
   VIEW DIALOG
───────────────────────────────────────── */
const ViewDialog: React.FC<{
  open: boolean;
  item: Fmo1 | null;
  onClose: () => void;
}> = ({ open, item, onClose }) => {
  if (!open || !item) return null;

  const rows: [string, string][] = [
    ["Nama Pasien", item.nama_pasien],
    ["No. Rekam Medis", item.no_rm ?? "—"],
    ["Penanggung Jawab", item.nama_penanggung_jawab],
    ["No. KTP / Identitas", item.no_ktp ?? "—"],
    ["No. HP", item.no_hp ?? "—"],
    ["Alamat", item.alamat ?? "—"],
    ["Jenis Penjamin", getPenjaminLabel(item.jenis_penjamin)],
    ["Rencana Kelas/Kamar", getKelasLabel(item.rencana_kelas)],
    ["Tanggal", formatTanggal(item.tanggal)],
    ["Keterangan", item.deskripsi ?? "—"],
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Formulir DP</DialogTitle>
          <DialogDescription>
            Data formulir persetujuan pembayaran DP persalinan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Info rows */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex border-b border-gray-100 last:border-b-0"
              >
                <div className="text-xs font-medium text-muted-foreground bg-muted/40 px-4 py-2.5 w-44 shrink-0 border-r border-gray-100">
                  {label}
                </div>
                <div className="px-4 py-2.5 text-sm text-foreground flex-1">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Signature */}
          {item.ttd && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tanda Tangan
              </p>
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 flex justify-center">
                <Image
                  src={item.ttd}
                  alt="Tanda tangan"
                  width={320}
                  height={120}
                  className="max-h-28 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={() => handlePrint(item)}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────
   EDIT DIALOG
───────────────────────────────────────── */
const EditDialog: React.FC<{
  open: boolean;
  item: Fmo1 | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, item, onClose, onSaved }) => {
  const [form, setForm] = useState<EditFormState>({
    nama_pasien: "",
    no_rm: "",
    nama_penanggung_jawab: "",
    no_ktp: "",
    no_hp: "",
    alamat: "",
    jenis_penjamin: "",
    rencana_kelas: "",
    deskripsi: "",
  });
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        nama_pasien: item.nama_pasien,
        no_rm: item.no_rm ?? "",
        nama_penanggung_jawab: item.nama_penanggung_jawab,
        no_ktp: item.no_ktp ?? "",
        no_hp: item.no_hp ?? "",
        alamat: item.alamat ?? "",
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
    if (!form.nama_penanggung_jawab.trim())
      e.nama_penanggung_jawab = "Wajib diisi";
    if (!form.jenis_penjamin) e.jenis_penjamin = "Wajib dipilih";
    if (!form.rencana_kelas) e.rencana_kelas = "Wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !item) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("fmo_1")
        .update({
          nama_pasien: form.nama_pasien.trim(),
          no_rm: form.no_rm.trim() || null,
          nama_penanggung_jawab: form.nama_penanggung_jawab.trim(),
          no_ktp: form.no_ktp.trim() || null,
          no_hp: form.no_hp.trim() || null,
          alamat: form.alamat.trim() || null,
          jenis_penjamin: form.jenis_penjamin,
          rencana_kelas: form.rencana_kelas,
          deskripsi: form.deskripsi.trim() || null,
        })
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Data berhasil diperbarui");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui data",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const setF = (k: keyof EditFormState) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  const setInputF =
    (k: keyof EditFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF(k)(e.target.value);
  const clearErr = (k: keyof EditFormState) => () =>
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Formulir DP</DialogTitle>
          <DialogDescription>
            Perbarui data formulir persetujuan DP persalinan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nama Pasien */}
            <div className="space-y-1.5">
              <Label htmlFor="nama_pasien">
                Nama Pasien <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama_pasien"
                value={form.nama_pasien}
                onChange={setInputF("nama_pasien")}
                onFocus={clearErr("nama_pasien")}
                placeholder="Nama pasien"
                disabled={submitting}
                className={errors.nama_pasien ? "border-red-500" : ""}
              />
              {errors.nama_pasien && (
                <p className="text-xs text-red-500">{errors.nama_pasien}</p>
              )}
            </div>

            {/* Grid: No RM + No KTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="no_rm">No. Rekam Medis</Label>
                <Input
                  id="no_rm"
                  value={form.no_rm}
                  onChange={setInputF("no_rm")}
                  placeholder="No. rekam medis"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="no_ktp">No. KTP / Identitas</Label>
                <Input
                  id="no_ktp"
                  value={form.no_ktp}
                  onChange={setInputF("no_ktp")}
                  placeholder="No. KTP"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Nama PJ */}
            <div className="space-y-1.5">
              <Label htmlFor="nama_penanggung_jawab">
                Nama Penanggung Jawab <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama_penanggung_jawab"
                value={form.nama_penanggung_jawab}
                onChange={setInputF("nama_penanggung_jawab")}
                onFocus={clearErr("nama_penanggung_jawab")}
                placeholder="Nama penanggung jawab"
                disabled={submitting}
                className={errors.nama_penanggung_jawab ? "border-red-500" : ""}
              />
              {errors.nama_penanggung_jawab && (
                <p className="text-xs text-red-500">
                  {errors.nama_penanggung_jawab}
                </p>
              )}
            </div>

            {/* No HP */}
            <div className="space-y-1.5">
              <Label htmlFor="no_hp">No. HP</Label>
              <Input
                id="no_hp"
                value={form.no_hp}
                onChange={setInputF("no_hp")}
                placeholder="No. HP"
                disabled={submitting}
              />
            </div>

            {/* Alamat */}
            <div className="space-y-1.5">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={form.alamat}
                onChange={setInputF("alamat")}
                placeholder="Alamat lengkap"
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Grid: Penjamin + Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Jenis Penjamin <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.jenis_penjamin}
                  onValueChange={(v) => {
                    setF("jenis_penjamin")(v);
                    clearErr("jenis_penjamin")();
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger
                    className={errors.jenis_penjamin ? "border-red-500" : ""}
                  >
                    <span>
                      {form.jenis_penjamin
                        ? getPenjaminLabel(form.jenis_penjamin)
                        : "Pilih penjamin"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {PENJAMIN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jenis_penjamin && (
                  <p className="text-xs text-red-500">
                    {errors.jenis_penjamin}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Rencana Kelas <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.rencana_kelas}
                  onValueChange={(v) => {
                    setF("rencana_kelas")(v);
                    clearErr("rencana_kelas")();
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger
                    className={errors.rencana_kelas ? "border-red-500" : ""}
                  >
                    <span>
                      {form.rencana_kelas
                        ? getKelasLabel(form.rencana_kelas)
                        : "Pilih kelas"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {KELAS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rencana_kelas && (
                  <p className="text-xs text-red-500">{errors.rencana_kelas}</p>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="deskripsi">Keterangan</Label>
              <Textarea
                id="deskripsi"
                value={form.deskripsi}
                onChange={setInputF("deskripsi")}
                placeholder="Keterangan tambahan (opsional)"
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </Button>
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

  // Action states
  const [viewItem, setViewItem] = useState<Fmo1 | null>(null);
  const [editItem, setEditItem] = useState<Fmo1 | null>(null);
  const [deleteItem, setDeleteItem] = useState<Fmo1 | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & filter
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);
  const [sortField, setSortField] = useState<SortField>("tanggal");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const applyFilters = useCallback(() => {
    let f = [...data];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      f = f.filter(
        (r) =>
          r.nama_pasien.toLowerCase().includes(q) ||
          r.nama_penanggung_jawab.toLowerCase().includes(q) ||
          (r.no_rm ?? "").toLowerCase().includes(q) ||
          (r.no_hp ?? "").toLowerCase().includes(q),
      );
    }

    f.sort((a, b) => {
      let cmp = 0;
      if (sortField === "nama_pasien") {
        cmp = a.nama_pasien.localeCompare(b.nama_pasien, "id");
      } else if (sortField === "tanggal") {
        cmp = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      } else if (sortField === "created_at") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    setFiltered(f);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [data, debouncedSearch, sortField, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchData = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("fmo_1")
        .select("*")
        .order("tanggal", { ascending: false });
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
        if (!user) {
          setShowAccessDenied(true);
          return;
        }
        await fetchData();
      } finally {
        setLoading(false);
      }
    };
    init();

    const channel = supabase
      .channel("fmo_1_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fmo_1" },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Pagination calc
  const totalItems = filtered.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * (itemsPerPage as number);
  const endIndex =
    itemsPerPage === "all" ? totalItems : startIndex + (itemsPerPage as number);
  const currentRows = filtered.slice(startIndex, endIndex);

  // Checkbox
  const isAllSelected =
    currentRows.length > 0 && currentRows.every((r) => selectedIds.has(r.id));
  const isSomeSelected =
    currentRows.some((r) => selectedIds.has(r.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(currentRows.map((r) => r.id)) : new Set());
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    const n = new Set(selectedIds);
    checked ? n.add(id) : n.delete(id);
    setSelectedIds(n);
  };

  // Delete single
  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("fmo_1")
        .delete()
        .eq("id", deleteItem.id);
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

  // Bulk delete
  const handleBulkDelete = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("fmo_1")
        .delete()
        .in("id", Array.from(selectedIds));
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
    sortOptions.find((o) => o.value === `${sortField}-${sortOrder}`)?.label ??
    "Urutkan";

  const showReset =
    sortField !== "tanggal" || sortOrder !== "desc" || searchQuery !== "";

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
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
      {/* Breadcrumb */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Formulir DP Persalinan
          </h1>
          <p className="text-muted-foreground mt-1">
            Data formulir persetujuan pembayaran uang muka persalinan
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Daftar Formulir ({totalItems})</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative grow sm:grow-0 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari nama pasien, no. RM, HP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(v) => {
                  const [f, o] = v.split("-") as [SortField, SortOrder];
                  setSortField(f);
                  setSortOrder(o);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{getSortLabel()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showReset && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortField("tanggal");
                    setSortOrder("desc");
                    setSearchQuery("");
                  }}
                >
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
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={
                        isSomeSelected
                          ? "data-[state=checked]:bg-primary/50"
                          : ""
                      }
                    />
                  </TableHead>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Pasien</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Penanggung Jawab
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Penjamin
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Kelas</TableHead>
                  <TableHead className="hidden sm:table-cell w-[130px]">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-right w-36">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground h-32"
                    >
                      {searchQuery
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data formulir DP"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(c) =>
                            handleSelectOne(row.id, c as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {startIndex + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.nama_pasien}</div>
                        {row.no_rm && (
                          <div className="text-xs text-muted-foreground">
                            RM: {row.no_rm}
                          </div>
                        )}
                        {row.no_hp && (
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {row.no_hp}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {row.nama_penanggung_jawab}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {getPenjaminLabel(row.jenis_penjamin)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getKelasLabel(row.rencana_kelas)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatTanggal(row.tanggal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          {/* Print */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handlePrint(row)}
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Print</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* View */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setViewItem(row)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Lihat Detail</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Edit */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditItem(row)}
                                  disabled={submitting}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Delete */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                  onClick={() => setDeleteItem(row)}
                                  disabled={submitting}
                                >
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

      {/* View Dialog */}
      <ViewDialog
        open={!!viewItem}
        item={viewItem}
        onClose={() => setViewItem(null)}
      />

      {/* Edit Dialog */}
      <EditDialog
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={fetchData}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Formulir?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data formulir atas nama{" "}
              <strong>{deleteItem?.nama_pasien}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedIds.size} Data Formulir?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} data formulir
              yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Menghapus..." : "Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Denied */}
      <AccessDeniedDialog
        open={showAccessDenied}
        onOpenChange={setShowAccessDenied}
      />
    </div>
  );
}
