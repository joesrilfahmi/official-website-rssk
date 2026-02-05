// app/sections/dokter/page.tsx
import Chat from "@/components/layout/chat";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import LayananUnggulan from "./layanan-unggulan";
export default function App() {
  return (
    <>
      <Navbar />
      <LayananUnggulan />
      <Footer />
      <Chat />
    </>
  );
}
