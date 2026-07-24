import { useDragHudStore } from '../scene/dragHudStore'

export function DragHud() {
  const active = useDragHudStore((s) => s.active)
  const axis = useDragHudStore((s) => s.axis)
  const deltaText = useDragHudStore((s) => s.deltaText)
  const typedText = useDragHudStore((s) => s.typedText)

  if (!active) return null

  return (
    <div className="drag-hud">
      <span className={`drag-hud-axis axis-${axis}`}>{axis === 'free' ? 'FREE' : axis?.toUpperCase()}</span>
      <span className="drag-hud-delta">{typedText ? `${typedText}_` : deltaText}</span>
      <span className="drag-hud-hint">X/Y/Z lock axis · type a number + Enter · Esc cancel</span>
    </div>
  )
}
