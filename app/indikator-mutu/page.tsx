// app/dokter/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackToTop from "@/components/layout/back-to-top";

import IndikatorMutu from "./indikator-mutu";

export default function App() {
  return (
    <>
      <Navbar />
      <IndikatorMutu />
      <Footer />
      <BackToTop />
    </>
  );
}
