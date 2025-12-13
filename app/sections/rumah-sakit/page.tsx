// app/sections/layanan-unggulan/page.tsx
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import BackToTop from "@/components/layout/back-to-top"

import RumahSakit from "./rumahsakit"
import VisiMisi from "./visimisi"
import Pilihan from "./pilihan"

export default function App() {
    return (
        <>
            <Navbar />
            <RumahSakit />
            <VisiMisi />
            <Pilihan />
            <BackToTop />
            <Footer />
        </>
    )
}