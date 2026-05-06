// app/dokter/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
// import Chat from "@/components/layout/chat"
// import BackToTop from "@/components/layout/back-to-top"

import Blog from "./blog";
import BackToTop from "@/components/layout/back-to-top";

export const revalidate = 1800; // ISR: revalidate setiap 30 menit

export default function App() {
  return (
    <>
      <Navbar />
      <BackToTop />
      <Blog />
      <Footer />
    </>
  );
}
