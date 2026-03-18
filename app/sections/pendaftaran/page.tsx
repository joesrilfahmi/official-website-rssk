// app/sections/dokter/page.tsx
import BackToTop from "@/components/layout/back-to-top"

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Pendaftaran from "./pendaftaran";
export default function App() {
  return (
    <>
      <Navbar />
      <Pendaftaran />
      <Footer />
      <BackToTop />
    </>
  );
}
