// ============================================
// FILE: src/app/page.tsx
// ============================================

import HomePage from "./home/page";

export const revalidate = 3600; // ISR: revalidate setiap 1 jam

export default function App() {
  return <HomePage />;
}
