// app/dokter/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
// import Chat from "@/components/layout/chat"
import BackToTop from "@/components/layout/back-to-top";

import KritikSaran from "./kritik-saran";

export default function App() {
  return (
    <>
      <Navbar />
      <KritikSaran />
      <Footer />
      <BackToTop />
    </>
  );
}
