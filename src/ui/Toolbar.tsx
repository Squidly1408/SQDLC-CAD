import { useEffect, useRef, useState } from 'react'
import { useSceneStore } from '../state/store'
import type { PrimitiveType } from '../state/types'
import { PRIMITIVE_LABELS } from '../state/types'
import type { GizmoMode } from '../scene/GizmoLayer'
import { saveProjectAs, openProjectFile } from '../io/projectFile'
import { exportSceneToSTL } from '../io/exportStl'
import { exportSceneToOBJ } from '../io/exportObj'
import { importModelFile } from '../io/importModel'
import { importStepFile } from '../io/importStep'
import { detachGizmo } from '../scene/gizmoBridge'
import { Logo } from './Logo'

const PRIMITIVES: PrimitiveType[] = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'wedge']

const PRIMITIVE_ICONS: Record<PrimitiveType, string> = {
  box: '◼',
  sphere: '●',
  cylinder: '⬤',
  cone: '▲',
  torus: '◎',
  wedge: '◺',
}

interface ToolbarProps {
  mode: GizmoMode
  onModeChange: (m: GizmoMode) => void
  snapEnabled: boolean
  onSnapChange: (v: boolean) => void
  arrayPanelOpen: boolean
  onToggleArrayPanel: () => void
  leftPanelOpen: boolean
  onToggleLeftPanel: () => void
  rightPanelOpen: boolean
  onToggleRightPanel: () => void
}

export function Toolbar({
  mode,
  onModeChange,
  snapEnabled,
  onSnapChange,
  arrayPanelOpen,
  onToggleArrayPanel,
  leftPanelOpen,
  onToggleLeftPanel,
  rightPanelOpen,
  onToggleRightPanel,
}: ToolbarProps) {
  const addPrimitive = useSceneStore((s) => s.addPrimitive)
  const groupSelected = useSceneStore((s) => s.groupSelected)
  const ungroupSelected = useSceneStore((s) => s.ungroupSelected)
  const duplicateSelected = useSceneStore((s) => s.duplicateSelected)
  const removeSelected = useSceneStore((s) => s.removeSelected)
  const newProject = useSceneStore((s) => s.newProject)
  const loadScene = useSceneStore((s) => s.loadScene)
  const addMeshNode = useSceneStore((s) => s.addMeshNode)
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  // On phone/tablet widths the file-ops group collapses into a dropdown (see .file-menu in
  // App.css) — close it on an outside tap so it doesn't linger over the viewport.
  useEffect(() => {
    if (!fileMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!fileMenuRef.current?.contains(e.target as Node)) setFileMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [fileMenuOpen])

  const handleOpenClick = () => fileInputRef.current?.click()
  const handleImportClick = () => importInputRef.current?.click()

  const handleFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const scene = await openProjectFile(file)
      loadScene({ nodesById: scene.nodesById, rootIds: scene.rootIds, selectedIds: [] })
    } catch (err) {
      alert('Could not open project file: ' + (err as Error).message)
    }
  }

  const handleImportChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const isStep = /\.(step|stp|iges|igs)$/i.test(file.name)
      const params = isStep ? await importStepFile(file) : await importModelFile(file)
      addMeshNode(file.name, params)
    } catch (err) {
      alert('Could not import model: ' + (err as Error).message)
    }
  }

  const handleNew = () => {
    if (!confirm('Start a new project? Unsaved changes will be lost (unless already autosaved).')) return
    newProject()
  }

  return (
    <div className="toolbar">
      <button
        className={`mobile-only panel-toggle ${leftPanelOpen ? 'active' : ''}`}
        onClick={onToggleLeftPanel}
        title="Toggle object list"
        aria-label="Toggle object list"
      >
        ☰
      </button>

      <a className="brand" href="#/" title="Back to home">
        <Logo />
        <span className="brand-name">SQDLC-CAD</span>
      </a>

      <div className="toolbar-divider" />

      <div className="toolbar-group file-menu-trigger" ref={fileMenuRef}>
        <button
          className={`mobile-only ${fileMenuOpen ? 'active' : ''}`}
          onClick={() => setFileMenuOpen((v) => !v)}
          aria-expanded={fileMenuOpen}
          title="File: new, open, save, import, export"
        >
          File ▾
        </button>
        <div
          className={`file-menu ${fileMenuOpen ? 'collapsible open' : 'collapsible'}`}
          onClick={() => setFileMenuOpen(false)}
        >
          <button onClick={handleNew} title="New project">New</button>
          <button onClick={handleOpenClick} title="Open project (.json)">Open</button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChosen} />
          <button
            onClick={() => saveProjectAs(useSceneStore.getState())}
            title="Save project as .json"
          >
            Save As
          </button>
          <button onClick={handleImportClick} title="Import a model (.stl, .obj, .3mf, .step, .stp, .iges, .igs)">Import</button>
          <input
            ref={importInputRef}
            type="file"
            accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs"
            hidden
            onChange={handleImportChosen}
          />
          <button onClick={() => exportSceneToSTL()} title="Export scene as STL">Export STL</button>
          <button onClick={() => exportSceneToOBJ()} title="Export scene as OBJ">Export OBJ</button>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        {PRIMITIVES.map((type) => (
          <button key={type} onClick={() => addPrimitive(type)} title={`Add ${PRIMITIVE_LABELS[type]}`}>
            <span className="icon">{PRIMITIVE_ICONS[type]}</span> {PRIMITIVE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className={mode === 'translate' ? 'active' : ''} onClick={() => onModeChange('translate')} title="Move (1)">Move</button>
        <button className={mode === 'rotate' ? 'active' : ''} onClick={() => onModeChange('rotate')} title="Rotate (2)">Rotate</button>
        <button className={mode === 'scale' ? 'active' : ''} onClick={() => onModeChange('scale')} title="Scale (3)">Scale</button>
        <label className="snap-toggle" title="Snap to grid/angle increments and nearby shapes">
          <input type="checkbox" checked={snapEnabled} onChange={(e) => onSnapChange(e.target.checked)} />
          Snap
        </label>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={() => { detachGizmo(); useSceneStore.temporal.getState().undo() }} title="Undo (Ctrl+Z)">Undo</button>
        <button onClick={() => { detachGizmo(); useSceneStore.temporal.getState().redo() }} title="Redo (Ctrl+Shift+Z)">Redo</button>
        <button onClick={duplicateSelected} disabled={selectedIds.length === 0} title="Duplicate (Ctrl+D)">Duplicate</button>
        <button
          className={arrayPanelOpen ? 'active' : ''}
          onClick={onToggleArrayPanel}
          disabled={selectedIds.length === 0}
          title="Linear or circular array"
        >
          Array
        </button>
        <button onClick={groupSelected} disabled={selectedIds.length < 2} title="Group (Ctrl+G)">Group</button>
        <button onClick={ungroupSelected} disabled={selectedIds.length === 0} title="Ungroup (Ctrl+Shift+G)">Ungroup</button>
        <button onClick={removeSelected} disabled={selectedIds.length === 0} title="Delete (Del)">Delete</button>
      </div>

      <button
        className={`mobile-only panel-toggle panel-toggle-right ${rightPanelOpen ? 'active' : ''}`}
        onClick={onToggleRightPanel}
        title="Toggle inspector"
        aria-label="Toggle inspector"
      >
        ⚙
      </button>
    </div>
  )
}
