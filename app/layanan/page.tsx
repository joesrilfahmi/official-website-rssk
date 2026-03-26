// app/dokter/page.tsx
import BackToTop from "@/components/layout/back-to-top";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import LayananUnggulan from "./layanan-unggulan";
export default function App() {
  return (
    <>
      <Navbar />
      <LayananUnggulan />
      <Footer />
      <BackToTop />
    </>
  );
}
