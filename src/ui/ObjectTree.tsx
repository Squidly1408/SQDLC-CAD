import { useSceneStore } from '../state/store'
import type { SceneNode } from '../state/types'

function TreeRow({ node, depth, selectable }: { node: SceneNode; depth: number; selectable: boolean }) {
  const isSelected = useSceneStore((s) => s.selectedIds.includes(node.id))
  const nodesById = useSceneStore((s) => s.nodesById)
  const setSelection = useSceneStore((s) => s.setSelection)
  const toggleSelection = useSceneStore((s) => s.toggleSelection)
  const toggleVisible = useSceneStore((s) => s.toggleVisible)

  return (
    <>
      <div
        className={`tree-row ${isSelected ? 'selected' : ''} ${!selectable ? 'nested' : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={(e) => {
          if (!selectable) return
          if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSelection(node.id)
          else setSelection([node.id])
        }}
      >
        <span className="tree-type-icon">{node.type === 'group' ? '▣' : node.type === 'mesh' ? '◈' : '◆'}</span>
        <span className="tree-name">{node.name}</span>
        {!node.solid && <span className="tree-hole-badge">hole</span>}
        <button
          className="visibility-toggle"
          title={node.visible ? 'Hide' : 'Show'}
          onClick={(e) => {
            e.stopPropagation()
            toggleVisible(node.id)
          }}
        >
          {node.visible ? '👁' : '—'}
        </button>
      </div>
      {node.type === 'group' &&
        node.children.map((cid) => {
          const child = nodesById[cid]
          if (!child) return null
          return <TreeRow key={cid} node={child} depth={depth + 1} selectable={false} />
        })}
    </>
  )
}

export function ObjectTree() {
  const rootIds = useSceneStore((s) => s.rootIds)
  const nodesById = useSceneStore((s) => s.nodesById)

  return (
    <div className="panel object-tree">
      <div className="panel-title">Objects</div>
      <div className="tree-list">
        {rootIds.length === 0 && <div className="empty-hint">No shapes yet — add one from the toolbar.</div>}
        {[...rootIds].reverse().map((id) => {
          const node = nodesById[id]
          if (!node) return null
          return <TreeRow key={id} node={node} depth={0} selectable />
        })}
      </div>
    </div>
  )
}
