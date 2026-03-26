// app/partner/page.tsx
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BackToTop from "@/components/layout/back-to-top";

import Partner from "./partner";

export default function App() {
  return (
    <>
      <Navbar />
      <Partner />
      <Footer />
      <BackToTop />
    </>
  );
}
