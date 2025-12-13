// ============================================
// FILE: src/app/page.tsx
// ============================================

// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { isAuthenticated } from '@/lib/auth';

// export default function App() {
//   const router = useRouter();

//   useEffect(() => {
//     if (isAuthenticated()) {
//       router.push('/dashboard');
//     } else {
//       router.push('/login');
//     }
//   }, [router]);

//   return null;
// }

// app/page.tsx
import Home from "./sections/home/page"
export default function App() {
    return (
        <>
            <Home />
        </ >
    )
}