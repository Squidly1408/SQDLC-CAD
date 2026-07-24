import { create } from 'zustand'
import { temporal } from 'zundo'
import type { MeshParams, PrimitiveType, SceneNode, SceneState, ShapeParams, Transform, Vec3 } from './types'
import { DEFAULT_TRANSFORM, defaultParamsFor, PRIMITIVE_LABELS } from './types'
import { detachGizmo } from '../scene/gizmoBridge'

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Clones a subtree (following the same "children keep their own relative transform, only the
// root's transform is overridden" rule as duplicateSelected) directly into a draft nodesById
// map. Used by the array tools to stamp out copies of a selection.
function cloneSubtreeInto(nodesById: Record<string, SceneNode>, id: string, rootTransform?: Transform): string {
  const src = nodesById[id]
  const clonedId = newId()
  const clonedChildren = src.children.map((childId) => cloneSubtreeInto(nodesById, childId))
  nodesById[clonedId] = {
    ...src,
    id: clonedId,
    transform: rootTransform ?? {
      position: { ...src.transform.position },
      rotation: { ...src.transform.rotation },
      scale: { ...src.transform.scale },
    },
    children: clonedChildren,
    parentId: null,
  }
  clonedChildren.forEach((cid) => {
    nodesById[cid] = { ...nodesById[cid], parentId: clonedId }
  })
  return clonedId
}

export type ArrayAxis = 'x' | 'y' | 'z'

function rotateAroundAxis(point: Vec3, center: Vec3, axis: ArrayAxis, angleRad: number): Vec3 {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const dz = point.z - center.z
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  if (axis === 'y') return { x: center.x + dx * cos + dz * sin, y: center.y + dy, z: center.z + (-dx * sin + dz * cos) }
  if (axis === 'x') return { x: center.x + dx, y: center.y + (dy * cos - dz * sin), z: center.z + (dy * sin + dz * cos) }
  return { x: center.x + (dx * cos - dy * sin), y: center.y + (dx * sin + dy * cos), z: center.z + dz }
}

const PALETTE = ['#4f8ef7', '#f75c4f', '#4ff78e', '#f7d34f', '#b04ff7', '#4fd6f7', '#f78ec7', '#8ef74f']
let paletteIndex = 0
function nextColor(): string {
  const c = PALETTE[paletteIndex % PALETTE.length]
  paletteIndex += 1
  return c
}

interface HistoryState {
  nodesById: Record<string, SceneNode>
  rootIds: string[]
}

interface Store extends SceneState {
  addPrimitive: (type: PrimitiveType, at?: { x: number; z: number }) => string
  addMeshNode: (name: string, params: MeshParams) => string
  updateTransform: (id: string, transform: Partial<Transform>) => void
  updateTransforms: (updates: { id: string; transform: Transform }[]) => void
  updateParams: (id: string, params: Partial<ShapeParams>) => void
  updateColor: (id: string, color: string) => void
  toggleSolid: (id: string) => void
  toggleVisible: (id: string) => void
  rename: (id: string, name: string) => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  removeSelected: () => void
  duplicateSelected: () => void
  createLinearArray: (axis: ArrayAxis, count: number, spacing: number) => void
  createCircularArray: (axis: ArrayAxis, count: number, totalAngleDeg: number, center: Vec3) => void
  groupSelected: () => void
  ungroupSelected: () => void
  loadScene: (state: SceneState) => void
  newProject: () => void
}

const initialState: SceneState = {
  nodesById: {},
  rootIds: [],
  selectedIds: [],
}

export const useSceneStore = create<Store>()(
  temporal(
    (set, get) => ({
      ...initialState,

      addPrimitive: (type, at) => {
        const id = newId()
        const label = PRIMITIVE_LABELS[type]
        const siblingCount = get().rootIds.filter((rid) => get().nodesById[rid]?.type === type).length
        const node: SceneNode = {
          id,
          name: siblingCount > 0 ? `${label} ${siblingCount + 1}` : label,
          type,
          transform: {
            ...DEFAULT_TRANSFORM,
            position: { x: at?.x ?? 0, y: 0, z: at?.z ?? 0 },
          },
          params: defaultParamsFor(type),
          color: nextColor(),
          solid: true,
          visible: true,
          children: [],
          parentId: null,
        }
        set((s) => ({
          nodesById: { ...s.nodesById, [id]: node },
          rootIds: [...s.rootIds, id],
          selectedIds: [id],
        }))
        return id
      },

      addMeshNode: (name, params) => {
        const id = newId()
        const node: SceneNode = {
          id,
          name,
          type: 'mesh',
          transform: { ...DEFAULT_TRANSFORM },
          params: { type: 'mesh', ...params },
          color: nextColor(),
          solid: true,
          visible: true,
          children: [],
          parentId: null,
        }
        set((s) => ({
          nodesById: { ...s.nodesById, [id]: node },
          rootIds: [...s.rootIds, id],
          selectedIds: [id],
        }))
        return id
      },

      updateTransform: (id, transform) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node) return s
          return {
            nodesById: {
              ...s.nodesById,
              [id]: {
                ...node,
                transform: {
                  position: { ...node.transform.position, ...transform.position },
                  rotation: { ...node.transform.rotation, ...transform.rotation },
                  scale: { ...node.transform.scale, ...transform.scale },
                },
              },
            },
          }
        })
      },

      updateTransforms: (updates) => {
        set((s) => {
          const nodesById = { ...s.nodesById }
          for (const { id, transform } of updates) {
            const node = nodesById[id]
            if (!node) continue
            nodesById[id] = { ...node, transform }
          }
          return { nodesById }
        })
      },

      updateParams: (id, params) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node || !node.params) return s
          return {
            nodesById: {
              ...s.nodesById,
              [id]: { ...node, params: { ...node.params, ...params } as ShapeParams },
            },
          }
        })
      },

      updateColor: (id, color) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node) return s
          return { nodesById: { ...s.nodesById, [id]: { ...node, color } } }
        })
      },

      toggleSolid: (id) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node) return s
          return { nodesById: { ...s.nodesById, [id]: { ...node, solid: !node.solid } } }
        })
      },

      toggleVisible: (id) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node) return s
          return { nodesById: { ...s.nodesById, [id]: { ...node, visible: !node.visible } } }
        })
      },

      rename: (id, name) => {
        set((s) => {
          const node = s.nodesById[id]
          if (!node) return s
          return { nodesById: { ...s.nodesById, [id]: { ...node, name } } }
        })
      },

      setSelection: (ids) => set({ selectedIds: ids }),

      toggleSelection: (id) => {
        set((s) => {
          const has = s.selectedIds.includes(id)
          return { selectedIds: has ? s.selectedIds.filter((i) => i !== id) : [...s.selectedIds, id] }
        })
      },

      clearSelection: () => set({ selectedIds: [] }),

      removeSelected: () => {
        detachGizmo()
        set((s) => {
          const toRemove = new Set<string>()
          const collect = (id: string) => {
            toRemove.add(id)
            const n = s.nodesById[id]
            n?.children.forEach(collect)
          }
          s.selectedIds.forEach(collect)

          const nodesById = { ...s.nodesById }
          toRemove.forEach((id) => delete nodesById[id])

          return {
            nodesById,
            rootIds: s.rootIds.filter((id) => !toRemove.has(id)),
            selectedIds: [],
          }
        })
      },

      duplicateSelected: () => {
        set((s) => {
          const nodesById = { ...s.nodesById }
          const newIds: string[] = []

          const cloneSubtree = (id: string): string => {
            const src = nodesById[id]
            const clonedId = newId()
            const clonedChildren = src.children.map((childId) => cloneSubtree(childId))
            nodesById[clonedId] = {
              ...src,
              id: clonedId,
              name: `${src.name} copy`,
              transform: {
                position: { x: src.transform.position.x + 5, y: src.transform.position.y, z: src.transform.position.z + 5 },
                rotation: { ...src.transform.rotation },
                scale: { ...src.transform.scale },
              },
              children: clonedChildren,
              parentId: null,
            }
            clonedChildren.forEach((cid) => {
              nodesById[cid] = { ...nodesById[cid], parentId: clonedId }
            })
            return clonedId
          }

          s.selectedIds.forEach((id) => {
            if (!s.nodesById[id]) return
            newIds.push(cloneSubtree(id))
          })

          return {
            nodesById,
            rootIds: [...s.rootIds, ...newIds],
            selectedIds: newIds,
          }
        })
      },

      createLinearArray: (axis, count, spacing) => {
        set((s) => {
          const ids = s.selectedIds.filter((id) => s.nodesById[id])
          if (ids.length === 0 || count < 2) return s
          const nodesById = { ...s.nodesById }
          const newIds: string[] = []

          ids.forEach((id) => {
            const src = nodesById[id]
            for (let i = 1; i < count; i++) {
              const offset = spacing * i
              const transform: Transform = {
                position: {
                  x: src.transform.position.x + (axis === 'x' ? offset : 0),
                  y: src.transform.position.y + (axis === 'y' ? offset : 0),
                  z: src.transform.position.z + (axis === 'z' ? offset : 0),
                },
                rotation: { ...src.transform.rotation },
                scale: { ...src.transform.scale },
              }
              newIds.push(cloneSubtreeInto(nodesById, id, transform))
            }
          })

          return {
            nodesById,
            rootIds: [...s.rootIds, ...newIds],
            selectedIds: [...ids, ...newIds],
          }
        })
      },

      createCircularArray: (axis, count, totalAngleDeg, center) => {
        set((s) => {
          const ids = s.selectedIds.filter((id) => s.nodesById[id])
          if (ids.length === 0 || count < 2) return s
          const nodesById = { ...s.nodesById }
          const newIds: string[] = []
          const stepDeg = totalAngleDeg / count

          ids.forEach((id) => {
            const src = nodesById[id]
            for (let i = 1; i < count; i++) {
              const angleDeg = stepDeg * i
              const angleRad = (angleDeg * Math.PI) / 180
              const position = rotateAroundAxis(src.transform.position, center, axis, angleRad)
              const rotation = { ...src.transform.rotation }
              rotation[axis] += angleDeg
              const transform: Transform = { position, rotation, scale: { ...src.transform.scale } }
              newIds.push(cloneSubtreeInto(nodesById, id, transform))
            }
          })

          return {
            nodesById,
            rootIds: [...s.rootIds, ...newIds],
            selectedIds: [...ids, ...newIds],
          }
        })
      },

      groupSelected: () => {
        detachGizmo()
        set((s) => {
          if (s.selectedIds.length < 2) return s
          const groupId = newId()
          const group: SceneNode = {
            id: groupId,
            name: 'Group',
            type: 'group',
            transform: { ...DEFAULT_TRANSFORM },
            params: null,
            color: s.nodesById[s.selectedIds[0]]?.color ?? nextColor(),
            solid: true,
            visible: true,
            children: [...s.selectedIds],
            parentId: null,
          }
          const nodesById = { ...s.nodesById, [groupId]: group }
          s.selectedIds.forEach((id) => {
            if (nodesById[id]) nodesById[id] = { ...nodesById[id], parentId: groupId }
          })
          return {
            nodesById,
            rootIds: [...s.rootIds.filter((id) => !s.selectedIds.includes(id)), groupId],
            selectedIds: [groupId],
          }
        })
      },

      ungroupSelected: () => {
        detachGizmo()
        set((s) => {
          const groupIds = s.selectedIds.filter((id) => s.nodesById[id]?.type === 'group')
          if (groupIds.length === 0) return s

          const nodesById = { ...s.nodesById }
          let rootIds = [...s.rootIds]
          const freed: string[] = []

          groupIds.forEach((gid) => {
            const group = nodesById[gid]
            group.children.forEach((cid) => {
              nodesById[cid] = { ...nodesById[cid], parentId: null }
              freed.push(cid)
            })
            delete nodesById[gid]
            rootIds = rootIds.filter((id) => id !== gid)
          })

          return {
            nodesById,
            rootIds: [...rootIds, ...freed],
            selectedIds: freed,
          }
        })
      },

      loadScene: (state) => {
        detachGizmo()
        set({ ...state })
      },

      newProject: () => {
        detachGizmo()
        set({ ...initialState, nodesById: {}, rootIds: [], selectedIds: [] })
      },
    }),
    {
      partialize: (s): HistoryState => ({ nodesById: s.nodesById, rootIds: s.rootIds }),
      equality: (a, b) => a.nodesById === b.nodesById && a.rootIds === b.rootIds,
      limit: 100,
    },
  ),
)

// selectedIds is intentionally excluded from undo history (see `partialize` above), so an
// undo/redo can leave it pointing at ids that no longer exist in nodesById. Prune those here
// rather than have every consumer (Inspector, gizmo, toolbar) defend against stale ids.
useSceneStore.subscribe((state) => {
  const stale = state.selectedIds.filter((id) => !state.nodesById[id])
  if (stale.length > 0) {
    useSceneStore.setState({ selectedIds: state.selectedIds.filter((id) => state.nodesById[id]) })
  }
})

export function getNode(id: string): SceneNode | undefined {
  return useSceneStore.getState().nodesById[id]
}
