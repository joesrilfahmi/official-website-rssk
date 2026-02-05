// app/sections/layanan-unggulan/page.tsx
import Chat from "@/components/layout/chat";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

import LayananUnggulan from "./klinik-spesialis";

export default function App() {
  return (
    <>
      <Navbar />
      <Chat />
      <LayananUnggulan />
      <Footer />
    </>
  );
}
