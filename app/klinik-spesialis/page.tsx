// app/sections/layanan-unggulan/page.tsx
import BackToTop from "@/components/layout/back-to-top"

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

import LayananUnggulan from "./klinik-spesialis";

export default function App() {
  return (
    <>
      <Navbar />
      <BackToTop />
      <LayananUnggulan />
      <Footer />
    </>
  );
}
