// app/sections/layanan-unggulan/page.tsx
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import Chat from "@/components/layout/chat"


import LayananUnggulan from "../layanan-unggulan/layanan-unggulan"

export default function App() {
    return (
        <>
            <Navbar />
            <Chat />
            <LayananUnggulan />
            <Footer />
        </>
    )
}