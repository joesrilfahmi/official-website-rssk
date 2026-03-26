// app/dokter/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackToTop from "@/components/layout/back-to-top";

import KamarInap from "./kamar-inap";

export default function App() {
  return (
    <>
      <Navbar />
      <KamarInap />
      <Footer />
      <BackToTop />
    </>
  );
}
