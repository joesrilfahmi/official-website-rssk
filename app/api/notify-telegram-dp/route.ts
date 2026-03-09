// app/api/notify-telegram-dp/route.ts
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
const PENERIMA_PESAN = [ 1897938211, 6200327574];

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
   TELEGRAM — sendMessage (teks notifikasi)
───────────────────────────────────────── */
async function sendMessage(chatId: number, text: string): Promise<void> {
  const res  = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`sendMessage [${chatId}]: ${json.description}`);
}

/* ─────────────────────────────────────────
   TELEGRAM — sendDocument (PDF)
───────────────────────────────────────── */
async function sendDocument(
  chatId: number, pdfBuf: ArrayBuffer, fileName: string,
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([pdfBuf], { type: "application/pdf" }), `${fileName}.pdf`);

  const res  = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: "POST", body: form,
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`sendDocument [${chatId}]: ${json.description}`);
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
   GENERATE PDF
───────────────────────────────────────── */
async function generatePdf(item: FormPayload): Promise<ArrayBuffer> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const W    = 595;

  const fR = await doc.embedFont(StandardFonts.TimesRoman);
  const fB = await doc.embedFont(StandardFonts.TimesRomanBold);

  const ML  = 54;
  const MR  = 54;
  const BW  = W - ML - MR;
  const BLK = rgb(0, 0, 0);
  const GRY = rgb(0.35, 0.35, 0.35);

  let y = 842 - 45;

  function hline(x1: number, yy: number, x2: number, t: number) {
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: t, color: BLK });
  }

  function wrapText(
    str: string, x: number, curY: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; maxW?: number; lh?: number } = {}
  ): number {
    const { font = fR, size = 10, color = BLK, maxW = BW, lh = size * 1.5 } = opts;
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
    const LW = 147, CW = 10;
    page.drawText(safe(lbl), { x: ML,       y: curY, size: 10, font: fR, color: BLK });
    page.drawText(":",        { x: ML + LW,  y: curY, size: 10, font: fR, color: BLK });
    return wrapText(val, ML + LW + CW, curY, { maxW: BW - LW - CW, lh: 14 });
  }

  /* ── LETTERHEAD ── */
  const LOGO_PT = 44, LOGO_GAP = 10;
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
  page.drawText(safe(lhName), { x: cxOf(lhName, fB, 11, INFO_X, INFO_W), y, size: 11, font: fB, color: BLK });
  y -= 14;
  page.drawText(safe(Profile.subtitle), { x: cxOf(Profile.subtitle, fR, 8, INFO_X, INFO_W), y, size: 8, font: fR, color: GRY });
  y -= 11;
  page.drawText(safe(Profile.address), { x: cxOf(Profile.address, fR, 7, INFO_X, INFO_W), y, size: 7, font: fR, color: GRY });
  y -= 10;
  const contact = `Telp: ${Profile.phone}  |  Email: ${Profile.email}  |  WhatsApp: ${Profile.whatsapp}`;
  page.drawText(safe(contact), { x: cxOf(contact, fR, 7, INFO_X, INFO_W), y, size: 7, font: fR, color: GRY });
  y -= 10;

  hline(ML, y, W - MR, 1.5); y -= 3;
  hline(ML, y, W - MR, 0.5); y -= 14;

  /* ── TITLE ── */
  const jenisTindakanLabel = getLabel(TINDAKAN_MAP, item.jenis_tindakan);
  function drawTitle(t: string, curY: number): number {
    const tw = fB.widthOfTextAtSize(t, 10), tx = (W - tw) / 2;
    page.drawText(t, { x: tx, y: curY, size: 10, font: fB, color: BLK });
    hline(tx, curY - 1.5, tx + tw, 0.5);
    return curY - 15;
  }
  y = drawTitle("FORMULIR PERSETUJUAN PEMBAYARAN UANG MUKA (DP)", y);
  y = drawTitle(safe(`PERSALINAN ${jenisTindakanLabel.toUpperCase()} DI ${Profile.institusi} ${Profile.name}`.toUpperCase()), y);
  y -= 8;

  /* ── FIELDS ── */
  y = wrapText("Yang bertanda tangan di bawah ini:", ML, y); y -= 3;
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
  y -= 5;

  /* ── PARAGRAPHS ── */
  y = wrapText(`Dengan ini menyatakan bahwa saya telah mendapatkan penjelasan mengenai rencana tindakan persalinan yang akan dilakukan di ${Profile.institusi} ${Profile.name}, termasuk estimasi biaya pelayanan medis, fasilitas perawatan, serta ketentuan administrasi yang berlaku.`, ML, y, { lh: 14 });
  y -= 3;
  y = wrapText("Sehubungan dengan hal tersebut, saya menyetujui untuk melakukan pembayaran uang muka (DP) persalinan sebesar: Rp1.000.000,- (Satu Juta Rupiah)", ML, y, { lh: 14 });
  y -= 3;
  y = wrapText("Saya memahami dan menyetujui bahwa:", ML, y);
  for (const li of [
    "1.  Uang muka (DP) merupakan bagian dari total biaya persalinan.",
    "2.  Pembayaran DP dilakukan sebagai bentuk konfirmasi dan komitmen pelayanan persalinan.",
    "3.  Uang muka (DP) yang telah dibayarkan tidak dapat dikembalikan (non-refundable) dengan alasan apa pun, termasuk apabila terjadi pembatalan dari pihak pasien.",
  ]) { y = wrapText(li, ML + 10, y, { maxW: BW - 10, lh: 13 }); }
  y -= 4;

  /* ── SECTION LABEL ── */
  const secLabel = "Rencana Penjamin dan Kelas Perawatan";
  page.drawText(safe(secLabel), { x: ML, y, size: 10, font: fB, color: BLK });
  hline(ML, y - 1.5, ML + fB.widthOfTextAtSize(secLabel, 10), 0.5);
  y -= 16;
  y = fieldRow("Jenis Penjamin",        getLabel(PENJAMIN_MAP, item.jenis_penjamin), y);
  y = fieldRow("Rencana Kelas / Kamar", getLabel(KELAS_MAP,    item.rencana_kelas),  y);
  y -= 4;

  page.drawText("Keterangan:", { x: ML, y, size: 10, font: fB, color: BLK });
  const kW = fB.widthOfTextAtSize("Keterangan:", 10) + 4;
  y = wrapText("Apabila terjadi perubahan kelas perawatan selama masa rawat inap, maka pasien/penanggung jawab bersedia mengikuti ketentuan biaya sesuai kelas yang ditempati.", ML + kW, y, { maxW: BW - kW, lh: 13 });
  y -= 3;

  if (item.deskripsi) { y = wrapText(item.deskripsi, ML, y, { lh: 14 }); y -= 3; }

  y = wrapText("Demikian pernyataan ini saya buat dengan sadar, tanpa paksaan dari pihak mana pun, dan dapat dipergunakan sebagaimana mestinya.", ML, y, { lh: 14 });
  y -= 16;

  /* ── SIGNATURE ── */
  const SIGN_W = 165, sigX = W - MR - SIGN_W;
  page.drawText(safe(`Sepanjang, ${formatTanggalLong(item.tanggal)}`), { x: sigX, y, size: 10, font: fR, color: BLK });
  y -= 14;
  page.drawText("Pasien / Penanggung Jawab,", { x: sigX, y, size: 10, font: fR, color: BLK });
  y -= 6;

  const gapTop = y;
  if (item.ttd) {
    try {
      const b64 = item.ttd.replace(/^data:image\/\w+;base64,/, "");
      const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
      const ttdPng = await sharp(Buffer.from(buf)).png().toBuffer();
      const ttdBuf = ttdPng.buffer.slice(ttdPng.byteOffset, ttdPng.byteOffset + ttdPng.byteLength) as ArrayBuffer;
      const sigImg = await doc.embedPng(ttdBuf);
      const dim    = sigImg.scaleToFit(SIGN_W - 10, 48);
      page.drawImage(sigImg, { x: sigX + (SIGN_W - dim.width) / 2, y: gapTop - dim.height, width: dim.width, height: dim.height });
    } catch { /* skip */ }
  }
  y = gapTop - 50;

  hline(sigX, y + 2, sigX + SIGN_W, 0.8);
  y -= 12;
  const nameStr = `( ${safe(item.nama_penanggung_jawab)} )`;
  page.drawText(nameStr, { x: sigX + (SIGN_W - fR.widthOfTextAtSize(nameStr, 10)) / 2, y, size: 10, font: fR, color: BLK });

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

    const message =
      `🔔 *Formulir DP Persalinan Baru!*\n\n` +
      `*Pasien* : ${item.nama_pasien}\n` +
      `*No\\. RM* : ${item.no_rm ?? "-"}\n` +
      `*Penanggung Jawab* : ${item.nama_penanggung_jawab}\n` +
      `*No\\. HP* : ${item.no_hp ?? "-"}\n\n` +
      `*Tindakan* : ${tindakan}\n` +
      `*Dokter* : ${item.dokter_penanggung_jawab ?? "-"}\n` +
      `*Rencana Persalinan* : ${formatTanggalLong(item.tgl_rencana_persalinan)}\n\n` +
      `*Penjamin* : ${penjamin}\n` +
      `*Kelas* : ${kelas}\n\n` +
      `${waktu}`;

    const fileName = buildFileName(item);
    const pdfBuf   = await generatePdf(item);

    const results = await Promise.allSettled(
      PENERIMA_PESAN.map(async (chatId) => {
        await sendMessage(chatId, message);
        await sendDocument(chatId, pdfBuf, fileName);
      })
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