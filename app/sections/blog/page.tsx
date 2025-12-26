
// app/sections/dokter/page.tsx
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import Chat from "@/components/layout/chat"


import Blog from "./blog"


export default function App() {
    return (
        <>
            <Navbar />
            <Blog />
            <Footer />
            <Chat />
        </>
    )
}