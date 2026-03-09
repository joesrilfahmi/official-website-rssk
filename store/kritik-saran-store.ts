// @/store/kritik-saran-store.ts
// ---------------------------------------------------------------------------
// Global unread-count store — shared between sidebar & page (no Provider needed)
// ---------------------------------------------------------------------------
// npm install zustand
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";

interface KritikSaranStore {
  unreadCount: number;
  /** Re-fetch the real count from DB — use after any batch operation */
  refetch: () => Promise<void>;
  /** Optimistically decrement when an item is marked as read */
  markRead: (wasUnread: boolean) => void;
  /** Optimistically increment when an item is reverted to unread */
  markUnread: () => void;
  /** Optimistically decrement by n — use after deleting items */
  removeUnread: (n: number) => void;
  /** Start Supabase realtime listener (call once on app mount) */
  subscribe: () => () => void;
}

export const useKritikSaranStore = create<KritikSaranStore>((set) => ({
  unreadCount: 0,

  refetch: async () => {
    const { count, error } = await supabase
      .from("kritik_saran")
      .select("*", { count: "exact", head: true })
      .eq("is_readed", false);
    if (!error) set({ unreadCount: count ?? 0 });
  },

  markRead: (wasUnread) => {
    if (wasUnread) set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) }));
  },

  markUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  removeUnread: (n) => {
    if (n > 0) set((s) => ({ unreadCount: Math.max(0, s.unreadCount - n) }));
  },

  subscribe: () => {
    // Initial fetch
    supabase
      .from("kritik_saran")
      .select("*", { count: "exact", head: true })
      .eq("is_readed", false)
      .then(({ count, error }) => {
        if (!error) set({ unreadCount: count ?? 0 });
      });

    // Realtime as safety net for changes from other sessions / devices
    const channel = supabase
      .channel("kritik_saran_store")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kritik_saran" },
        async () => {
          const { count, error } = await supabase
            .from("kritik_saran")
            .select("*", { count: "exact", head: true })
            .eq("is_readed", false);
          if (!error) set({ unreadCount: count ?? 0 });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));