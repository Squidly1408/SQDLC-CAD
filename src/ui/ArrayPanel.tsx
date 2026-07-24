import { useEffect, useState } from 'react'
import { useSceneStore } from '../state/store'
import type { ArrayAxis } from '../state/store'
import { NumberField } from './NumberField'

interface ArrayPanelProps {
  open: boolean
  onClose: () => void
}

type ArrayKind = 'linear' | 'circular'

function selectionCenter(): { x: number; y: number; z: number } {
  const { selectedIds, nodesById } = useSceneStore.getState()
  const nodes = selectedIds.map((id) => nodesById[id]).filter((n): n is NonNullable<typeof n> => !!n)
  if (nodes.length === 0) return { x: 0, y: 0, z: 0 }
  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.transform.position.x, y: acc.y + n.transform.position.y, z: acc.z + n.transform.position.z }),
    { x: 0, y: 0, z: 0 },
  )
  return { x: sum.x / nodes.length, y: sum.y / nodes.length, z: sum.z / nodes.length }
}

export function ArrayPanel({ open, onClose }: ArrayPanelProps) {
  const selectedCount = useSceneStore((s) => s.selectedIds.length)
  const createLinearArray = useSceneStore((s) => s.createLinearArray)
  const createCircularArray = useSceneStore((s) => s.createCircularArray)

  const [kind, setKind] = useState<ArrayKind>('linear')
  const [axis, setAxis] = useState<ArrayAxis>('x')
  const [count, setCount] = useState(4)
  const [spacing, setSpacing] = useState(25)
  const [angle, setAngle] = useState(360)
  const [center, setCenter] = useState({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    if (open) {
      setCenter(selectionCenter())
      setAxis('y') // panel always opens on the Linear tab, which defaults its own axis to 'x' on switch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const changeKind = (next: ArrayKind) => {
    setKind(next)
    // Y is the natural default rotation axis for a circular array (turntable-style), X for a
    // row of linear copies — re-pick it on every tab switch, not just when the panel opens,
    // otherwise switching tabs silently keeps a stale axis selection.
    setAxis(next === 'circular' ? 'y' : 'x')
  }

  if (!open) return null

  const apply = () => {
    if (kind === 'linear') createLinearArray(axis, Math.max(2, Math.round(count)), spacing)
    else createCircularArray(axis, Math.max(2, Math.round(count)), angle, center)
    onClose()
  }

  return (
    <div className="array-panel">
      <div className="array-panel-header">
        <span>Array</span>
        <button className="array-panel-close" onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div className="array-panel-tabs">
        <button className={kind === 'linear' ? 'active' : ''} onClick={() => changeKind('linear')}>
          Linear
        </button>
        <button className={kind === 'circular' ? 'active' : ''} onClick={() => changeKind('circular')}>
          Circular
        </button>
      </div>

      {selectedCount === 0 ? (
        <div className="empty-hint">Select one or more shapes first.</div>
      ) : (
        <>
          <div className="field-row array-axis-row">
            <span className="field-label">Axis</span>
            {(['x', 'y', 'z'] as const).map((a) => (
              <button key={a} className={`axis-btn axis-${a} ${axis === a ? 'active' : ''}`} onClick={() => setAxis(a)}>
                {a.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="field-row">
            <NumberField label="Count" value={count} step={1} min={2} onChange={setCount} />
            {kind === 'linear' ? (
              <NumberField label="Spacing" value={spacing} onChange={setSpacing} />
            ) : (
              <NumberField label="Angle (°)" value={angle} onChange={setAngle} />
            )}
          </div>

          {kind === 'circular' && (
            <div className="field-section">
              <div className="field-section-label">Center</div>
              <div className="field-row">
                <NumberField label="X" value={center.x} onChange={(v) => setCenter({ ...center, x: v })} />
                <NumberField label="Y" value={center.y} onChange={(v) => setCenter({ ...center, y: v })} />
                <NumberField label="Z" value={center.z} onChange={(v) => setCenter({ ...center, z: v })} />
              </div>
            </div>
          )}

          <button className="array-apply" onClick={apply}>
            Apply
          </button>
        </>
      )}
    </div>
  )
}
