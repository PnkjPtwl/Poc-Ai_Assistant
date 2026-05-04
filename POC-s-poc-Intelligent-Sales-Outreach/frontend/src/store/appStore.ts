import { create } from 'zustand'

interface Rep {
  id: string; name: string; email: string; role: string; quota: number; avatar_initials: string;
}

interface AppState {
  activeRep: Rep | null;
  reps: Rep[];
  sidebarExpanded: boolean;
  setActiveRep: (rep: Rep) => void;
  setReps: (reps: Rep[]) => void;
  toggleSidebar: () => void;
}

const saved = typeof window !== 'undefined' ? localStorage.getItem('activeRep') : null;

export const useAppStore = create<AppState>((set) => ({
  activeRep: saved ? JSON.parse(saved) : null,
  reps: [],
  sidebarExpanded: true,
  setActiveRep: (rep) => {
    localStorage.setItem('activeRep', JSON.stringify(rep));
    set({ activeRep: rep });
  },
  setReps: (reps) => set({ reps }),
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
}))
