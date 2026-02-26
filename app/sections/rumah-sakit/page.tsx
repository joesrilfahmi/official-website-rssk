// app/sections/layanan-unggulan/page.tsx
import Chat from "@/components/layout/chat";
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
      <Chat />
      <Footer />
    </>
  );
}
