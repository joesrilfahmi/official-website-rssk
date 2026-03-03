// app/sections/formulir/page.tsx
import Chat from "@/components/layout/chat";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

import Formulir from "./Formulir";

export default function App() {
  return (
    <>
      <Navbar />
      <Formulir />
      <Footer />
      <Chat />
    </>
  );
}
