import { useEffect, useRef, useState } from 'react'
import { SceneCanvas } from './scene/SceneCanvas'
import { ViewportErrorBoundary } from './scene/ViewportErrorBoundary'
import type { GizmoMode } from './scene/GizmoLayer'
import { Toolbar } from './ui/Toolbar'
import { ObjectTree } from './ui/ObjectTree'
import { Inspector } from './ui/Inspector'
import { StatusBar } from './ui/StatusBar'
import { DragHud } from './ui/DragHud'
import { ArrayPanel } from './ui/ArrayPanel'
import { useSceneStore } from './state/store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { loadAutosave, scheduleAutosave } from './io/persistence'
import './App.css'

function App() {
  const [mode, setMode] = useState<GizmoMode>('translate')
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [arrayPanelOpen, setArrayPanelOpen] = useState(false)
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saved'>('idle')
  // Side panels double as slide-in drawers on narrow (phone/tablet) viewports — see the
  // `@media` rules in App.css. They stay permanently visible on desktop widths regardless of
  // this state (the CSS only applies the drawer/backdrop behavior below the breakpoint).
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const restoredRef = useRef(false)

  const nodesById = useSceneStore((s) => s.nodesById)
  const rootIds = useSceneStore((s) => s.rootIds)
  const selectedCount = useSceneStore((s) => s.selectedIds.length)
  const loadScene = useSceneStore((s) => s.loadScene)

  useKeyboardShortcuts({ setMode })

  // On a touch/narrow layout the inspector is a drawer, not an always-visible panel — open it
  // automatically when something becomes selected, since selecting is almost always in order
  // to look at or edit it. (No-op on desktop widths: see the .panel-drawer media query.)
  useEffect(() => {
    if (selectedCount > 0) setRightPanelOpen(true)
  }, [selectedCount])

  // Offer to restore an autosaved project on first load.
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    void loadAutosave().then((saved) => {
      if (saved && Object.keys(saved.nodesById).length > 0) {
        if (confirm('Restore your autosaved project from this browser?')) {
          loadScene({ nodesById: saved.nodesById, rootIds: saved.rootIds, selectedIds: [] })
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autosave whenever the scene graph changes.
  const isFirstAutosaveRun = useRef(true)
  useEffect(() => {
    if (isFirstAutosaveRun.current) {
      isFirstAutosaveRun.current = false
      return
    }
    scheduleAutosave({ nodesById, rootIds })
    setAutosaveState('idle')
    const t = setTimeout(() => setAutosaveState('saved'), 900)
    return () => clearTimeout(t)
  }, [nodesById, rootIds])

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        snapEnabled={snapEnabled}
        onSnapChange={setSnapEnabled}
        arrayPanelOpen={arrayPanelOpen}
        onToggleArrayPanel={() => setArrayPanelOpen((v) => !v)}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen((v) => !v)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((v) => !v)}
      />
      <div className="workspace">
        <div className={`panel-drawer left ${leftPanelOpen ? 'open' : ''}`}>
          <ObjectTree />
        </div>
        <div className="viewport">
          <ViewportErrorBoundary>
            <SceneCanvas mode={mode} snapEnabled={snapEnabled} />
          </ViewportErrorBoundary>
          <DragHud />
          <ArrayPanel open={arrayPanelOpen} onClose={() => setArrayPanelOpen(false)} />
        </div>
        <div className={`panel-drawer right ${rightPanelOpen ? 'open' : ''}`}>
          <Inspector />
        </div>
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="panel-backdrop"
            onClick={() => {
              setLeftPanelOpen(false)
              setRightPanelOpen(false)
            }}
          />
        )}
      </div>
      <StatusBar autosaveState={autosaveState} />
    </div>
  )
}

export default App
