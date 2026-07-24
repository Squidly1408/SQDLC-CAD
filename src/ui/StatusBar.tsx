import { useSceneStore } from '../state/store'

interface StatusBarProps {
  autosaveState: 'idle' | 'saved'
}

export function StatusBar({ autosaveState }: StatusBarProps) {
  const selectedCount = useSceneStore((s) => s.selectedIds.length)
  const shapeCount = useSceneStore((s) => Object.keys(s.nodesById).length)

  return (
    <div className="status-bar">
      <span>{shapeCount} object{shapeCount === 1 ? '' : 's'}</span>
      <span>{selectedCount} selected</span>
      <span className="status-hints">
        1/2/3 move·rotate·scale &nbsp;·&nbsp; Ctrl+G group &nbsp;·&nbsp; Ctrl+D duplicate &nbsp;·&nbsp; Del delete &nbsp;·&nbsp; Ctrl+Z undo
      </span>
      <span className="autosave-indicator">{autosaveState === 'saved' ? 'Saved locally' : ''}</span>
    </div>
  )
}
