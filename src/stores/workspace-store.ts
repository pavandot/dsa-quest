import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Draft code per problem, persisted locally so work survives navigation/reload. */
type WorkspaceState = {
  drafts: Record<string, string>
  setDraft: (problemId: string, code: string) => void
  clearDraft: (problemId: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (problemId, code) => set((s) => ({ drafts: { ...s.drafts, [problemId]: code } })),
      clearDraft: (problemId) =>
        set((s) => {
          const rest = { ...s.drafts }
          delete rest[problemId]
          return { drafts: rest }
        }),
    }),
    { name: 'dsa-quest-workspace' }
  )
)
