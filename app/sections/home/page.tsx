import Hero from "./hero"
import About from "./about"
import LayananUnggulan from "./layanan-unggulan"
import KamarInap from "./kamar-inap"
import Berita from "./berita"
import Review from "./review"
import Pendaftaran from "./pendaftaran"
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import BackToTop from "@/components/layout/back-to-top"

export default function App() {
    return (
        <>
            <Navbar />
            <BackToTop />
            <Hero />
            <About />
            <LayananUnggulan />
            <KamarInap />
            <Berita />
            <Review />
            <Pendaftaran />
            <Footer />
        </>
    )
}