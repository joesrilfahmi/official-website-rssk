// app/api/notify-telegram/route.ts
import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TOKEN_TELEGRAM!;
const PENERIMA_PESAN = [1897938211];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, no_hp, unit_pelayanan, pesan, rating, is_anonymus } = body;

    const ratingStars = rating ? "⭐".repeat(rating) : "Tidak ada rating";
    const pengirim = is_anonymus
      ? "*Dari* : Anonim"
      : `*Dari* : ${nama}\n*Telepon* : ${no_hp}`;

    const message =
      `🔔 *Kritik & Saran Baru!*\n\n` +
      `${pengirim}\n` +
      `*Untuk Unit* : ${unit_pelayanan}\n` +
      `*Rating* : ${ratingStars}\n\n` +
      `*Pesan* : \n${pesan}\n\n` +
      `${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;

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
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}