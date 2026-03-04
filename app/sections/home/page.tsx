// app/sections/home/page.tsx

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import About from "./about";
import Berita from "./berita";
import Hero from "./hero";
import KamarInap from "./kamar-inap";
import LayananUnggulan from "./klinik-spesialis";
import Partner from "./partner-list";
import Pendaftaran from "./pendaftaran";
import Review from "./review";
// import BackToTop from "@/components/layout/back-to-top"
import Chat from "@/components/layout/chat";

export default function App() {
  return (
    <>
      <Navbar />
      {/* <BackToTop /> */}
      <Chat />
      <Hero />
      <About />
      <LayananUnggulan />
      <KamarInap />
      <Berita />
      <Review />
      <Partner />
      <Pendaftaran />
      <Footer />
    </>
  );
}
