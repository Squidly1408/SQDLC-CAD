import { useEffect } from 'react'
import { useSceneStore } from '../state/store'
import type { GizmoMode } from '../scene/GizmoLayer'
import { detachGizmo } from '../scene/gizmoBridge'
import { useDragHudStore } from '../scene/dragHudStore'

interface Options {
  setMode: (mode: GizmoMode) => void
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || el.isContentEditable
}

export function useKeyboardShortcuts({ setMode }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      // A body-drag in progress owns the keyboard (axis-lock letters, digit entry, Enter,
      // Escape) — defer to its own listener instead of e.g. switching gizmo mode on '1'/'2'/'3'
      // or clearing selection on Escape mid-drag.
      if (useDragHudStore.getState().active) return
      const meta = e.ctrlKey || e.metaKey

      if (meta && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault()
        detachGizmo()
        useSceneStore.temporal.getState().redo()
        return
      }
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        detachGizmo()
        useSceneStore.temporal.getState().undo()
        return
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        detachGizmo()
        useSceneStore.temporal.getState().redo()
        return
      }
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        useSceneStore.getState().duplicateSelected()
        return
      }
      if (meta && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) useSceneStore.getState().ungroupSelected()
        else useSceneStore.getState().groupSelected()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (useSceneStore.getState().selectedIds.length > 0) {
          e.preventDefault()
          useSceneStore.getState().removeSelected()
        }
        return
      }
      if (e.key === 'Escape') {
        useSceneStore.getState().clearSelection()
        return
      }
      if (e.key === '1') setMode('translate')
      if (e.key === '2') setMode('rotate')
      if (e.key === '3') setMode('scale')
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setMode])
}
