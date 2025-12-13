// app/sections/layanan-unggulan/page.tsx
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import BackToTop from "@/components/layout/back-to-top"

import LayananUnggulan from "../layanan-unggulan/layanan-unggulan"

export default function App() {
    return (
        <>
            <Navbar />
            <BackToTop />
            <LayananUnggulan />
            <Footer />
        </>
    )
}