// app/api/notify-telegram-formulir-persetujuan-pembayaran-uang-muka/route.ts
//
// Install:  npm i pdf-lib sharp
//
import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { Profile } from "@/config/profile";

const TELEGRAM_TOKEN = process.env.TOKEN_TELEGRAM!;
// id telegram
//  6200327574 : bu ratri
const PENERIMA_PESAN = [1897938211, 6200327574];

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FormPayload {
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
  deskripsi: string | null;
  ttd: string | null;
  tanggal: string;
}

/* ─────────────────────────────────────────
   LABEL MAPS
───────────────────────────────────────── */
const PENJAMIN_MAP: Record<string, string> = {
  umum: "Umum", asuransi: "Asuransi",
  bpjs_k1: "BPJS Kelas 1 Naik Kelas", bpjs_k2: "BPJS Kelas 2 Naik Kelas",
};
const KELAS_MAP: Record<string, string> = {
  kelas3: "Kelas 3", kelas2: "Kelas 2", kelas1: "Kelas 1",
  vip_a: "VIP A", vip_b: "VIP B", suite: "Suite Room", president: "President Suite",
};
const TINDAKAN_MAP: Record<string, string> = { normal: "Normal", sc: "SC (Sesar)" };

const getLabel = (map: Record<string, string>, v: string | null) =>
  v ? (map[v] ?? v) : "-";

const formatTanggalLong = (s: string | null): string => {
  if (!s) return "-";
  const M = ["Januari","Februari","Maret","April","Mei","Juni",
             "Juli","Agustus","September","Oktober","November","Desember"];
  const d = new Date(s + "T00:00:00");
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};

function safe(s: string | null | undefined): string {
  if (!s) return "-";
  return s
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\u2013/g, "-").replace(/\u2014/g, "--")
    .replace(/[^\x20-\xFF]/g, "?");
}

/* ─────────────────────────────────────────
   FILE NAME
   Format: nomorRM_namaPasien_DDMMYYYYHHmmss
───────────────────────────────────────── */
function buildFileName(item: FormPayload): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const san = (s: string) =>
    s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const noRm  = item.no_rm ? san(item.no_rm) : "NoRM";
  const nama  = san(item.nama_pasien);
  const stamp =
    `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${noRm}_${nama}_${stamp}`;
}

/* ─────────────────────────────────────────
   TELEGRAM — sendDocument WITH CAPTION
   Mengirim PDF beserta caption teks notifikasi dalam 1 pesan
───────────────────────────────────────── */
async function sendDocumentWithCaption(
  chatId: number,
  pdfBuf: ArrayBuffer,
  fileName: string,
  caption: string,
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([pdfBuf], { type: "application/pdf" }), `${fileName}.pdf`);
  form.append("caption", caption);
  form.append("parse_mode", "MarkdownV2");

  const res  = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: "POST", body: form,
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`sendDocument [${chatId}]: ${json.description}`);
}

/* ─────────────────────────────────────────
   ESCAPE MarkdownV2 special characters
───────────────────────────────────────── */
function escMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

/* ─────────────────────────────────────────
   LOAD LOGO PNG  (sharp converts webp→PNG)
───────────────────────────────────────── */
async function loadLogoPng(): Promise<Buffer | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", Profile.logo);
    const raw = await fs.readFile(logoPath);
    return await sharp(raw).png().toBuffer();
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────
   GENERATE PDF  — layout identik dengan HTML di frontend (1 halaman)
───────────────────────────────────────── */
async function generatePdf(item: FormPayload): Promise<ArrayBuffer> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const W    = 595;

  const fR = await doc.embedFont(StandardFonts.TimesRoman);
  const fB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fI = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // Margins & baseline — match HTML: padding 44px top/bottom, 64px L/R
  // 1px ≈ 0.75pt;  44px → ~33pt,  64px → ~48pt
  const ML  = 48;
  const MR  = 48;
  const BW  = W - ML - MR;
  const BLK = rgb(0, 0, 0);
  const GRY = rgb(0.45, 0.45, 0.45);

  // Base font size matches HTML 12px → 9pt
  const FS   = 9;   // body font size (pt)
  const LH   = 13;  // standard line-height (pt)
  const LHS  = 12;  // tight line-height for lists/fields

  let y = 842 - 33; // top margin

  function hline(x1: number, yy: number, x2: number, t: number) {
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: t, color: BLK });
  }

  function wrapText(
    str: string, x: number, curY: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; maxW?: number; lh?: number } = {}
  ): number {
    const { font = fR, size = FS, color = BLK, maxW = BW, lh = LH } = opts;
    const words = safe(str).split(" ");
    let line = "", cy = curY;
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > maxW && line) {
        page.drawText(line, { x, y: cy, size, font, color });
        cy -= lh; line = w;
      } else { line = t; }
    }
    if (line) { page.drawText(line, { x, y: cy, size, font, color }); cy -= lh; }
    return cy;
  }

  function cxOf(str: string, font: PDFFont, size: number, rx: number, rw: number) {
    return rx + (rw - font.widthOfTextAtSize(safe(str), size)) / 2;
  }

  function fieldRow(lbl: string, val: string, curY: number): number {
    const LW = 135, CW = 9;
    page.drawText(safe(lbl), { x: ML,      y: curY, size: FS, font: fR, color: BLK });
    page.drawText(":",       { x: ML + LW, y: curY, size: FS, font: fR, color: BLK });
    return wrapText(val, ML + LW + CW, curY, { maxW: BW - LW - CW, lh: LHS });
  }

  /* ── LETTERHEAD ── */
  const LOGO_PT = 40, LOGO_GAP = 9;
  const INFO_X  = ML + LOGO_PT + LOGO_GAP;
  const INFO_W  = BW - LOGO_PT - LOGO_GAP;

  const logoPng = await loadLogoPng();
  if (logoPng) {
    try {
      const img = await doc.embedPng(
        logoPng.buffer.slice(logoPng.byteOffset, logoPng.byteOffset + logoPng.byteLength) as ArrayBuffer
      );
      const dim = img.scaleToFit(LOGO_PT, LOGO_PT);
      page.drawImage(img, { x: ML, y: y - dim.height, width: dim.width, height: dim.height });
    } catch { /* skip */ }
  }

  const lhName = `${Profile.institusi} ${Profile.name}`.toUpperCase();
  page.drawText(safe(lhName), { x: cxOf(lhName, fB, 10, INFO_X, INFO_W), y, size: 10, font: fB, color: BLK });
  y -= 12;
  page.drawText(safe(Profile.subtitle), { x: cxOf(Profile.subtitle, fR, 7, INFO_X, INFO_W), y, size: 7, font: fR, color: GRY });
  y -= 10;
  page.drawText(safe(Profile.address), { x: cxOf(Profile.address, fR, 6.5, INFO_X, INFO_W), y, size: 6.5, font: fR, color: GRY });
  y -= 9;
  const contact = `Telp: ${Profile.phone}  |  Email: ${Profile.email}  |  WhatsApp: ${Profile.whatsapp}`;
  page.drawText(safe(contact), { x: cxOf(contact, fR, 6.5, INFO_X, INFO_W), y, size: 6.5, font: fR, color: GRY });
  y -= 9;

  hline(ML, y, W - MR, 1.5); y -= 2.5;
  hline(ML, y, W - MR, 0.4); y -= 12;

  /* ── TITLE ── */
  const jenisTindakanLabel = getLabel(TINDAKAN_MAP, item.jenis_tindakan);
  function drawTitle(t: string, curY: number): number {
    const tw = fB.widthOfTextAtSize(t, FS), tx = (W - tw) / 2;
    page.drawText(t, { x: tx, y: curY, size: FS, font: fB, color: BLK });
    hline(tx, curY - 1.2, tx + tw, 0.4);
    return curY - 13;
  }
  y = drawTitle("FORMULIR PERSETUJUAN PEMBAYARAN UANG MUKA (DP)", y);
  y = drawTitle(safe(`PERSALINAN ${jenisTindakanLabel.toUpperCase()} DI ${Profile.institusi} ${Profile.name}`.toUpperCase()), y);
  y -= 6;

  /* ── FIELDS ── */
  y = wrapText("Yang bertanda tangan di bawah ini:", ML, y); y -= 2;
  y = fieldRow("Nama Pasien",             item.nama_pasien,                               y);
  y = fieldRow("Tanggal Lahir",           formatTanggalLong(item.tgl_lahir),              y);
  y = fieldRow("No. RM",                  item.no_rm ?? "-",                              y);
  y = fieldRow("Nama Penanggung Jawab",   item.nama_penanggung_jawab,                     y);
  y = fieldRow("No. KTP/Identitas",       item.no_ktp ?? "-",                             y);
  y = fieldRow("No. HP",                  item.no_hp ?? "-",                              y);
  y = fieldRow("Alamat",                  item.alamat ?? "-",                             y);
  y = fieldRow("Tgl. Rencana Persalinan", formatTanggalLong(item.tgl_rencana_persalinan), y);
  y = fieldRow("Jenis Tindakan",          jenisTindakanLabel,                             y);
  y = fieldRow("Dokter Penanggung Jawab", item.dokter_penanggung_jawab ?? "-",            y);
  y -= 4;

  /* ── PARAGRAPHS ── */
  y = wrapText(`Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan persalinan yang akan dilakukan di ${Profile.institusi} ${Profile.name}, termasuk estimasi biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku.`, ML, y, { lh: LH });
  y -= 2;
  y = wrapText("Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka (DP) persalinan sebesar: Rp1.000.000,- (Satu Juta Rupiah)", ML, y, { lh: LH, font: fR });
  y -= 2;
  y = wrapText("Saya memahami dan menyetujui bahwa:", ML, y, { font: fB });
  for (const li of [
    "1.  Uang muka (DP) merupakan bagian dari total biaya persalinan.",
    "2.  Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.",
    "3.  Uang muka (DP) yang telah dibayarkan tidak dapat dikembalikan (non-refundable) dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.",
  ]) { y = wrapText(li, ML + 8, y, { maxW: BW - 8, lh: LHS }); }
  y -= 3;

  /* ── SECTION LABEL — Rencana Penjamin ── */
  const secLabel = "Rencana Penjamin dan Kelas Perawatan";
  page.drawText(safe(secLabel), { x: ML, y, size: FS, font: fB, color: BLK });
  hline(ML, y - 1.2, ML + fB.widthOfTextAtSize(secLabel, FS), 0.4);
  y -= 13;
  y = fieldRow("Jenis Penjamin",        getLabel(PENJAMIN_MAP, item.jenis_penjamin), y);
  y = fieldRow("Rencana Kelas / Kamar", getLabel(KELAS_MAP,    item.rencana_kelas),  y);
  y -= 3;

  page.drawText("Keterangan:", { x: ML, y, size: FS, font: fB, color: BLK });
  y -= 12;
  y = wrapText("Apabila terjadi perubahan kelas perawatan selama masa rawat inap, maka pasien/penanggung jawab bersedia mengikuti ketentuan biaya sesuai kelas yang ditempati.", ML, y, { maxW: BW, lh: LHS });
  y -= 2;

  if (item.deskripsi) { y = wrapText(item.deskripsi, ML, y, { lh: LH, font: fI }); y -= 2; }

  y = wrapText("Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.", ML, y, { lh: LH });
  y -= 12;

  /* ── SIGNATURE ── */
  const SIGN_W = 155, sigX = W - MR - SIGN_W;
  page.drawText(safe(`Sepanjang, ${formatTanggalLong(item.tanggal)}`), { x: sigX, y, size: FS, font: fR, color: BLK });
  y -= 12;
  page.drawText("Pasien / Penanggung Jawab,", { x: sigX, y, size: FS, font: fR, color: BLK });
  y -= 5;

  const gapTop = y;
  if (item.ttd) {
    try {
      const b64 = item.ttd.replace(/^data:image\/\w+;base64,/, "");
      const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
      const ttdPng = await sharp(Buffer.from(buf)).png().toBuffer();
      const ttdBuf = ttdPng.buffer.slice(ttdPng.byteOffset, ttdPng.byteOffset + ttdPng.byteLength) as ArrayBuffer;
      const sigImg = await doc.embedPng(ttdBuf);
      const dim    = sigImg.scaleToFit(SIGN_W - 10, 44);
      page.drawImage(sigImg, { x: sigX + (SIGN_W - dim.width) / 2, y: gapTop - dim.height, width: dim.width, height: dim.height });
    } catch { /* skip */ }
  }
  y = gapTop - 46;

  hline(sigX, y + 2, sigX + SIGN_W, 0.7);
  y -= 11;
  const nameStr = `( ${safe(item.nama_penanggung_jawab)} )`;
  page.drawText(nameStr, { x: sigX + (SIGN_W - fR.widthOfTextAtSize(nameStr, FS)) / 2, y, size: FS, font: fR, color: BLK });

  /* ── FOOTER ── */
  const footerY = 22;
  hline(ML, footerY + 11, W - MR, 0.4);
  const footerLeft  = "Halaman 1 dari 1";
  const footerRight = `FM-ADM-001 · ${Profile.shortName}`;
  page.drawText(footerLeft,  { x: ML,                                                    y: footerY, size: 6.5, font: fR, color: GRY });
  page.drawText(footerRight, { x: W - MR - fR.widthOfTextAtSize(footerRight, 6.5),       y: footerY, size: 6.5, font: fR, color: GRY });

  const u8 = await doc.save();
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

/* ─────────────────────────────────────────
   ROUTE HANDLER
───────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const item: FormPayload = await req.json();

    if (!item?.nama_pasien || !item?.nama_penanggung_jawab) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tindakan    = getLabel(TINDAKAN_MAP, item.jenis_tindakan);
    const penjamin    = getLabel(PENJAMIN_MAP, item.jenis_penjamin);
    const kelas       = getLabel(KELAS_MAP,    item.rencana_kelas);
    const waktu       = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    // Caption dikirim bersamaan dengan PDF (1 pesan = dokumen + caption)
    // Gunakan MarkdownV2 — semua karakter khusus harus di-escape
    const caption =
      `🔔 *Formulir DP Persalinan Baru\\!*\n\n` +
      `*Pasien*           : ${escMd(item.nama_pasien)}\n` +
      `*No\\. RM*          : ${escMd(item.no_rm ?? "-")}\n` +
      `*Penanggung Jawab* : ${escMd(item.nama_penanggung_jawab)}\n` +
      `*No\\. HP*          : ${escMd(item.no_hp ?? "-")}\n\n` +
      `*Tindakan*         : ${escMd(tindakan)}\n` +
      `*Dokter*           : ${escMd(item.dokter_penanggung_jawab ?? "-")}\n` +
      `*Rencana Persalinan* : ${escMd(formatTanggalLong(item.tgl_rencana_persalinan))}\n\n` +
      `*Penjamin*         : ${escMd(penjamin)}\n` +
      `*Kelas*            : ${escMd(kelas)}\n\n` +
      `_${escMd(waktu)}_`;

    const fileName = buildFileName(item);
    const pdfBuf   = await generatePdf(item);

    // Kirim 1 pesan = PDF + caption ke semua penerima
    const results = await Promise.allSettled(
      PENERIMA_PESAN.map((chatId) =>
        sendDocumentWithCaption(chatId, pdfBuf, fileName, caption)
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("[notify-telegram-dp] Some sends failed:", failed);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-telegram-dp] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}