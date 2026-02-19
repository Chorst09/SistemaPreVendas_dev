"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ITBudgetModule = "sales" | "rental" | "services"

export interface ITBudgetDraftItem {
  id: string
  module: ITBudgetModule
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

type ITBudgetDraftItemInput = Omit<ITBudgetDraftItem, "id">

interface ITBudgetDraftStore {
  items: ITBudgetDraftItem[]
  addItems: (items: ITBudgetDraftItemInput[]) => void
  removeItem: (itemId: string) => void
  clear: () => void
}

export const useITBudgetStore = create<ITBudgetDraftStore>()(
  persist(
    (set) => ({
      items: [],
      addItems: (items) => {
        const now = Date.now()
        const newItems = items.map((item, index) => ({
          ...item,
          id: `ITB-${now}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        }))
        set((state) => ({
          items: [...state.items, ...newItems],
        }))
      },
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "it-budget-draft",
    },
  ),
)*** End Patch}the code uses apply_patch to add file; but patch must be plain. I used JSON. Need redo. Let's call apply_patch correctly. 
