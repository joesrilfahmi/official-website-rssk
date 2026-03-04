// app/sections/partner/page.tsx
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Chat from "@/components/layout/chat"

import Partner from "./partner"

export default function App() {
    return (
        <>
            <Navbar />
            <Partner />
            <Footer />
            <Chat />
        </>
    )
}
