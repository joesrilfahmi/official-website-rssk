// app/api/notify-telegram-new-register/route.ts
import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TOKEN_TELEGRAM!;
const PENERIMA_PESAN = [1897938211];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, username, email, nomor_telepon, id_telegram } = body;

    const message =
      `🔔 *Pendaftaran Akun Baru!*\n\n` +
      `*Nama*     : ${nama}\n` +
      `*Username* : ${username}\n` +
      `*Email*    : ${email || "Tidak diisi"}\n` +
      `*Telepon*  : ${nomor_telepon || "Tidak diisi"}\n` +
      `*Telegram* : ${id_telegram || "Tidak diisi"}\n\n` +
      `🕐 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;

    const results = await Promise.allSettled(
      PENERIMA_PESAN.map((chatId) =>
        fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        }).then((res) => res.json())
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("Some Telegram messages failed:", failed);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram notify register error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}