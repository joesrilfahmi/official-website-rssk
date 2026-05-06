// app/dokter/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackToTop from "@/components/layout/back-to-top";

import Dokter from "./dokter";

export const revalidate = 3600; // ISR: revalidate setiap 1 jam

export default function App() {
  return (
    <>
      <Navbar />
      <Dokter />
      <Footer />
      <BackToTop />
    </>
  );
}
