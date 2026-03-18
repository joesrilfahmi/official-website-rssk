import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get("nik");
  if (!nik) return NextResponse.json({ error: "NIK diperlukan" }, { status: 400 });

  const apiUrl = process.env.API_EHOS_MASTER_PASIEN;
  if (!apiUrl) return NextResponse.json({ error: "API tidak dikonfigurasi" }, { status: 500 });

  try {
    const res = await fetch(`${apiUrl}&px_noktp=${nik}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi server" }, { status: 502 });
  }
}