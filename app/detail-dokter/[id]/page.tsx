// app/detail-dokter/[id]/page.tsx
// import Chat from "@/components/layout/chat";
import BackToTop from "@/components/layout/back-to-top"

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import DetailDokter from "./detaildokter";

export default function DetailDokterPage() {
  return (
    <>
      <Navbar />
      <DetailDokter />
      <Footer />
      <BackToTop />
    </>
  );
}
