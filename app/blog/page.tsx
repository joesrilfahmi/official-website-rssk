
// app/sections/dokter/page.tsx
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
// import Chat from "@/components/layout/chat"
// import BackToTop from "@/components/layout/back-to-top"



import Blog from "./blog"
import BackToTop from "@/components/layout/back-to-top"


export default function App() {
    return (
        <>
            <Navbar />
            <BackToTop />
            <Blog />
            <Footer />
        </>
    )
}