
// app/sections/dokter/page.tsx
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Chat from "@/components/layout/chat"


import Contact from "./kontak"


export default function App() {
    return (
        <>
            <Navbar />
            <Contact />
            <Footer />
            <Chat />
        </>
    )
}