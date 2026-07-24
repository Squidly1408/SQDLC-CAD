import { create } from 'zustand'

// Ephemeral UI-only state for the live drag HUD (current axis lock, live delta, typed
// numeric override). Deliberately a separate, non-undo-tracked store — this changes on
// every pointermove during a drag and has nothing to do with the scene graph.
interface DragHudState {
  active: boolean
  axis: 'x' | 'y' | 'z' | 'free' | null
  deltaText: string
  typedText: string
}

const initial: DragHudState = { active: false, axis: null, deltaText: '', typedText: '' }

export const useDragHudStore = create<DragHudState>(() => ({ ...initial }))

export function setDragHud(patch: Partial<DragHudState>) {
  useDragHudStore.setState({ active: true, ...patch })
}

export function clearDragHud() {
  useDragHudStore.setState({ ...initial })
}
