// app/sections/formulir/page.tsx
import BackToTop from "@/components/layout/back-to-top"

import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

import Formulir from "./Formulir";

export default function App() {
  return (
    <>
      <Navbar />
      <Formulir />
      <Footer />
      <BackToTop />
    </>
  );
}
