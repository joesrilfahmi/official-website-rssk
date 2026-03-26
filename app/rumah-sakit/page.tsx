// app/layanan-unggulan/page.tsx
import BackToTop from "@/components/layout/back-to-top";

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

// import RumahSakit from "./rumahsakit"
import Pilihan from "./pilihan";
import VisiMisi from "./visimisi";

export default function App() {
  return (
    <>
      <Navbar />
      <VisiMisi />
      <Pilihan />
      <BackToTop />
      <Footer />
    </>
  );
}
