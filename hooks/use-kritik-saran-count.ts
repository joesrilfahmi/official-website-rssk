// @/hooks/use-kritik-saran-count.ts
"use client";

import { useKritikSaranStore } from "@/store/kritik-saran-store";
import { useEffect } from "react";

export function useKritikSaranUnread() {
  const { unreadCount, subscribe } = useKritikSaranStore();

  useEffect(() => {
    // subscribe() starts the realtime listener and returns a cleanup fn
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  return { unreadCount };
}