import * as THREE from 'three'
import { getObject } from './objectRegistry'
import { useSceneStore } from '../state/store'

const SNAP_THRESHOLD = 3 // world units

interface WorldBounds {
  min: THREE.Vector3
  max: THREE.Vector3
  center: THREE.Vector3
}

// Approximates world-space bounds from the mesh's LOCAL (unrotated) geometry bounding box,
// scaled and translated by its current position/scale. This is exact for axis-aligned
// (unrotated, or 90°-multiple-rotated) shapes and a reasonable approximation otherwise —
// a full oriented-bounding-box snap would need real per-vertex projection, which is more
// than this feature needs to be useful for the common "line two shapes up" case.
function worldBoundsFor(id: string): WorldBounds | null {
  const mesh = getObject(id) as THREE.Mesh | undefined
  if (!mesh || !mesh.geometry) return null
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  const box = mesh.geometry.boundingBox
  if (!box) return null
  const min = box.min.clone().multiply(mesh.scale).add(mesh.position)
  const max = box.max.clone().multiply(mesh.scale).add(mesh.position)
  const center = min.clone().add(max).multiplyScalar(0.5)
  return { min, max, center }
}

export interface SnapResultXZ {
  dx: number
  dz: number
  snappedX: boolean
  snappedZ: boolean
}

/** A small (dx, dz) nudge that aligns the dragged shape's bounding-box edges/center with a
 *  nearby other shape's, or all-zero if nothing is within the snap threshold. X and Z are
 *  evaluated independently, so a drag can snap on one axis without the other. */
export function computeObjectSnapXZ(clickedId: string, excludeIds: string[]): SnapResultXZ {
  const clicked = worldBoundsFor(clickedId)
  if (!clicked) return { dx: 0, dz: 0, snappedX: false, snappedZ: false }

  const rootIds = useSceneStore.getState().rootIds
  const candidatesX = [clicked.min.x, clicked.center.x, clicked.max.x]
  const candidatesZ = [clicked.min.z, clicked.center.z, clicked.max.z]

  let bestDx = 0
  let bestDxDist = SNAP_THRESHOLD
  let bestDz = 0
  let bestDzDist = SNAP_THRESHOLD

  for (const id of rootIds) {
    if (id === clickedId || excludeIds.includes(id)) continue
    const other = worldBoundsFor(id)
    if (!other) continue
    const otherX = [other.min.x, other.center.x, other.max.x]
    const otherZ = [other.min.z, other.center.z, other.max.z]

    for (const cx of candidatesX) {
      for (const ox of otherX) {
        const d = ox - cx
        if (Math.abs(d) < bestDxDist) {
          bestDxDist = Math.abs(d)
          bestDx = d
        }
      }
    }
    for (const cz of candidatesZ) {
      for (const oz of otherZ) {
        const d = oz - cz
        if (Math.abs(d) < bestDzDist) {
          bestDzDist = Math.abs(d)
          bestDz = d
        }
      }
    }
  }

  return { dx: bestDx, dz: bestDz, snappedX: bestDxDist < SNAP_THRESHOLD, snappedZ: bestDzDist < SNAP_THRESHOLD }
}

const GRID = 5

export function snapToGrid(value: number): number {
  return Math.round(value / GRID) * GRID
}
