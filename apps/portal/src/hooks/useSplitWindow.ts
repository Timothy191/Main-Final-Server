import { create } from "zustand";

type SplitService = "github" | "whatsapp";

interface Tab {
  id: string;
  service: SplitService;
}

interface SplitWindowState {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (_service: SplitService) => void;
  closeTab: (_id: string) => void;
  activateTab: (_id: string) => void;
  closeAll: () => void;
}

let tabCounter = 0;
function genTabId() {
  tabCounter += 1;
  return `tab-${tabCounter}-${Date.now()}`;
}

export const useSplitWindow = create<SplitWindowState>((set, get) => ({
  isOpen: false,
  tabs: [],
  activeTabId: null,

  openTab(service) {
    const { tabs } = get();
    const existing = tabs.find((t) => t.service === service);
    if (existing) {
      set({ isOpen: true, activeTabId: existing.id });
      return;
    }
    const newTab: Tab = { id: genTabId(), service };
    set({
      isOpen: true,
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  closeTab(id) {
    const { tabs, activeTabId } = get();
    const filtered = tabs.filter((t) => t.id !== id);
    if (filtered.length === 0) {
      set({ isOpen: false, tabs: [], activeTabId: null });
      return;
    }
    const candidate = filtered[Math.max(0, tabs.findIndex((t) => t.id === id) - 1)];
    const nextActive =
      activeTabId === id ? (candidate?.id ?? filtered[0]?.id ?? null) : activeTabId;
    set({ tabs: filtered, activeTabId: nextActive });
  },

  activateTab(id) {
    set({ activeTabId: id, isOpen: true });
  },

  closeAll() {
    set({ isOpen: false, tabs: [], activeTabId: null });
  },
}));
