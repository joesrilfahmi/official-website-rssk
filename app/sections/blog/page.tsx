
// app/sections/dokter/page.tsx
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import BackToTop from "@/components/layout/back-to-top"

import Blog from "./blog"


export default function App() {
    return (
        <>
            <Navbar />
            <Blog />
            <Footer />
            <BackToTop />
        </>
    )
}