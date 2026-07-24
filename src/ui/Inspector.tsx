import { useSceneStore } from '../state/store'
import type { ShapeParams } from '../state/types'
import { NumberField } from './NumberField'

function ShapeParamFields({ id, params }: { id: string; params: ShapeParams }) {
  const updateParams = useSceneStore((s) => s.updateParams)
  const set = (patch: Partial<ShapeParams>) => updateParams(id, patch)

  switch (params.type) {
    case 'box':
      return (
        <>
          <NumberField label="Width" value={params.width} min={0.1} onChange={(v) => set({ width: v })} />
          <NumberField label="Height" value={params.height} min={0.1} onChange={(v) => set({ height: v })} />
          <NumberField label="Depth" value={params.depth} min={0.1} onChange={(v) => set({ depth: v })} />
        </>
      )
    case 'sphere':
      return (
        <>
          <NumberField label="Radius" value={params.radius} min={0.1} onChange={(v) => set({ radius: v })} />
          <NumberField label="Segments" value={params.segments} min={3} step={1} onChange={(v) => set({ segments: Math.round(v) })} />
        </>
      )
    case 'cylinder':
      return (
        <>
          <NumberField label="Radius" value={params.radius} min={0.1} onChange={(v) => set({ radius: v })} />
          <NumberField label="Height" value={params.height} min={0.1} onChange={(v) => set({ height: v })} />
          <NumberField label="Segments" value={params.segments} min={3} step={1} onChange={(v) => set({ segments: Math.round(v) })} />
        </>
      )
    case 'cone':
      return (
        <>
          <NumberField label="Radius" value={params.radius} min={0.1} onChange={(v) => set({ radius: v })} />
          <NumberField label="Height" value={params.height} min={0.1} onChange={(v) => set({ height: v })} />
          <NumberField label="Segments" value={params.segments} min={3} step={1} onChange={(v) => set({ segments: Math.round(v) })} />
        </>
      )
    case 'torus':
      return (
        <>
          <NumberField label="Radius" value={params.radius} min={0.1} onChange={(v) => set({ radius: v })} />
          <NumberField label="Tube" value={params.tube} min={0.05} onChange={(v) => set({ tube: v })} />
          <NumberField label="Segments" value={params.segments} min={3} step={1} onChange={(v) => set({ segments: Math.round(v) })} />
        </>
      )
    case 'wedge':
      return (
        <>
          <NumberField label="Width" value={params.width} min={0.1} onChange={(v) => set({ width: v })} />
          <NumberField label="Height" value={params.height} min={0.1} onChange={(v) => set({ height: v })} />
          <NumberField label="Depth" value={params.depth} min={0.1} onChange={(v) => set({ depth: v })} />
        </>
      )
    case 'mesh':
      return <div className="empty-hint">Imported mesh — {(params.positions.length / 3).toLocaleString()} vertices. Not parametrically editable; use Scale to resize.</div>
  }
}

export function Inspector() {
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const nodesById = useSceneStore((s) => s.nodesById)
  const updateTransform = useSceneStore((s) => s.updateTransform)
  const updateColor = useSceneStore((s) => s.updateColor)
  const toggleSolid = useSceneStore((s) => s.toggleSolid)
  const rename = useSceneStore((s) => s.rename)

  if (selectedIds.length === 0) {
    return (
      <div className="panel inspector">
        <div className="panel-title">Inspector</div>
        <div className="empty-hint">Select an object to edit its properties.</div>
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="panel inspector">
        <div className="panel-title">Inspector</div>
        <div className="empty-hint">{selectedIds.length} objects selected. Press Group (Ctrl+G) to combine them.</div>
      </div>
    )
  }

  const id = selectedIds[0]
  const node = nodesById[id]
  if (!node) return null
  const { position, rotation, scale } = node.transform

  return (
    <div className="panel inspector">
      <div className="panel-title">Inspector</div>

      <label className="text-field">
        <span>Name</span>
        <input type="text" value={node.name} onChange={(e) => rename(id, e.target.value)} />
      </label>

      <div className="field-section">
        <div className="field-section-label">Position</div>
        <div className="field-row">
          <NumberField label="X" value={position.x} onChange={(v) => updateTransform(id, { position: { ...position, x: v } })} />
          <NumberField label="Y" value={position.y} onChange={(v) => updateTransform(id, { position: { ...position, y: v } })} />
          <NumberField label="Z" value={position.z} onChange={(v) => updateTransform(id, { position: { ...position, z: v } })} />
        </div>
      </div>

      <div className="field-section">
        <div className="field-section-label">Rotation (°)</div>
        <div className="field-row">
          <NumberField label="X" value={rotation.x} onChange={(v) => updateTransform(id, { rotation: { ...rotation, x: v } })} />
          <NumberField label="Y" value={rotation.y} onChange={(v) => updateTransform(id, { rotation: { ...rotation, y: v } })} />
          <NumberField label="Z" value={rotation.z} onChange={(v) => updateTransform(id, { rotation: { ...rotation, z: v } })} />
        </div>
      </div>

      <div className="field-section">
        <div className="field-section-label">Scale</div>
        <div className="field-row">
          <NumberField label="X" value={scale.x} step={0.1} min={0.01} onChange={(v) => updateTransform(id, { scale: { ...scale, x: v } })} />
          <NumberField label="Y" value={scale.y} step={0.1} min={0.01} onChange={(v) => updateTransform(id, { scale: { ...scale, y: v } })} />
          <NumberField label="Z" value={scale.z} step={0.1} min={0.01} onChange={(v) => updateTransform(id, { scale: { ...scale, z: v } })} />
        </div>
      </div>

      {node.params && (
        <div className="field-section">
          <div className="field-section-label">Dimensions</div>
          <div className="field-row">
            <ShapeParamFields id={id} params={node.params} />
          </div>
        </div>
      )}

      <div className="field-section">
        <div className="field-section-label">Appearance</div>
        <div className="field-row appearance-row">
          <label className="color-field">
            <span>Color</span>
            <input type="color" value={node.color} onChange={(e) => updateColor(id, e.target.value)} />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={!node.solid} onChange={() => toggleSolid(id)} />
            Hole (subtracts when grouped)
          </label>
        </div>
      </div>
    </div>
  )
}
