// app/sections/layanan-unggulan/page.tsx
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import Chat from "@/components/layout/chat"


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
            <Chat />
            <Footer />
        </>
    )
}