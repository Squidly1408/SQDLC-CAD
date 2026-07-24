import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useSceneStore } from '../state/store'
import { getObject } from './objectRegistry'
import { clearDragHud, setDragHud } from './dragHudStore'
import { computeObjectSnapXZ, snapToGrid } from './objectSnap'

// Module-level scratch objects (drags are inherently serial, so sharing these avoids
// per-drag allocation/GC churn).
const raycaster = new THREE.Raycaster()
const dragPlane = new THREE.Plane()
const hitPoint = new THREE.Vector3()
const groundNormal = new THREE.Vector3(0, 1, 0)
const camDir = new THREE.Vector3()

type Axis = 'x' | 'y' | 'z' | null

interface DragState {
  clickedId: string
  planeY: number
  offsetX: number
  offsetZ: number
  starts: Record<string, { x: number; y: number; z: number }>
  moved: boolean
  axisLock: Axis
  typedBuffer: string
}

/**
 * Direct click-and-drag movement of a shape's body (Tinkercad-style), with AutoCAD-flavored
 * precision on top: press X/Y/Z during the drag to lock movement to that single axis, then
 * optionally type an exact distance and hit Enter to snap to it precisely instead of trusting
 * the mouse. Escape clears a typed value, or cancels the whole drag if nothing's been typed.
 *
 * Complements the TransformControls gizmo (still available for rotate/scale and precise
 * single-axis moves via its arrow handles). Live position updates mutate the mesh(es)
 * imperatively (see GizmoLayer for the same pattern) and only commit to the store — and undo
 * history — once, when the drag ends.
 *
 * If the clicked shape is already part of a multi-selection, the whole selection drags
 * together, each shape keeping its own height (or its own X/Z, under Y-lock) and its offset
 * from the others.
 */
export function useBodyDrag(id: string, meshRef: React.RefObject<THREE.Object3D | null>, snapEnabled: boolean) {
  const { camera, gl } = useThree()
  const controls = useThree((state) => state.controls) as unknown as { enabled: boolean } | null
  const dragRef = useRef<DragState | null>(null)

  const applyDelta = (dx: number, dy: number, dz: number) => {
    const drag = dragRef.current
    if (!drag) return
    for (const [dragId, start] of Object.entries(drag.starts)) {
      const m = getObject(dragId)
      if (!m) continue
      m.position.set(start.x + dx, start.y + dy, start.z + dz)
    }
  }

  const updateHud = (dx: number, dy: number, dz: number, snapped = false) => {
    const drag = dragRef.current
    if (!drag) return
    const axis = drag.axisLock ?? 'free'
    const deltaText =
      drag.axisLock === 'x' ? `Δx ${dx.toFixed(1)}`
      : drag.axisLock === 'y' ? `Δy ${dy.toFixed(1)}`
      : drag.axisLock === 'z' ? `Δz ${dz.toFixed(1)}`
      : `Δx ${dx.toFixed(1)}  Δz ${dz.toFixed(1)}`
    setDragHud({ axis, deltaText: snapped ? `${deltaText}  ⌁ snap` : deltaText, typedText: drag.typedBuffer })
  }

  // Ground-plane (y = planeY) raycast for a given client pointer position. Used both to seed
  // the drag's initial offset and, every subsequent move, to track the cursor — the SAME
  // method both times is what matters: mixing this with the mesh-surface click point (e.point,
  // which for a tall shape clicked near its top could be many units above the ground plane)
  // would introduce a perspective/parallax offset between the two.
  const groundHitAt = (clientX: number, clientY: number, planeY: number): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
    dragPlane.setFromNormalAndCoplanarPoint(groundNormal, new THREE.Vector3(0, planeY, 0))
    return raycaster.ray.intersectPlane(dragPlane, hitPoint)
  }

  const computeDelta = (ev: PointerEvent): [number, number, number] | null => {
    const drag = dragRef.current
    if (!drag) return null
    const clicked = drag.starts[drag.clickedId]
    if (!clicked) return null

    if (drag.axisLock === 'y') {
      const rect = gl.domElement.getBoundingClientRect()
      const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
      camera.getWorldDirection(camDir)
      camDir.y = 0
      if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, 1)
      camDir.normalize()
      dragPlane.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(clicked.x, clicked.y, clicked.z))
      if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return null
      return [0, hitPoint.y - clicked.y, 0]
    }

    const hit = groundHitAt(ev.clientX, ev.clientY, drag.planeY)
    if (!hit) return null
    const dx = hit.x + drag.offsetX - clicked.x
    const dz = hit.z + drag.offsetZ - clicked.z
    if (drag.axisLock === 'x') return [dx, 0, 0]
    if (drag.axisLock === 'z') return [0, 0, dz]
    return [dx, 0, dz]
  }

  const finalizeDrag = (commit: boolean) => {
    const drag = dragRef.current
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('keydown', onKeyDown)
    dragRef.current = null
    if (controls) controls.enabled = true
    clearDragHud()
    if (!drag || !commit || !drag.moved) return

    const nodesById = useSceneStore.getState().nodesById
    const updates = Object.keys(drag.starts)
      .map((dragId) => {
        const m = getObject(dragId)
        const node = nodesById[dragId]
        if (!m || !node) return null
        return {
          id: dragId,
          transform: {
            position: { x: m.position.x, y: m.position.y, z: m.position.z },
            rotation: node.transform.rotation,
            scale: node.transform.scale,
          },
        }
      })
      .filter((u): u is NonNullable<typeof u> => !!u)

    if (updates.length > 0) useSceneStore.getState().updateTransforms(updates)
  }

  const onPointerMove = (ev: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = computeDelta(ev)
    if (!delta) return
    drag.moved = true
    let [dx, dy, dz] = delta
    let snapped = false

    // Numeric override in progress: leave the raw mouse delta alone, no snapping — the
    // typed value is the whole point of asking for an exact number.
    if (snapEnabled && !drag.typedBuffer) {
      if (!drag.axisLock) {
        applyDelta(dx, dy, dz) // put the clicked mesh at its proposed spot so its bounds reflect it
        const snap = computeObjectSnapXZ(drag.clickedId, Object.keys(drag.starts))
        dx += snap.dx
        dz += snap.dz
        snapped = snap.snappedX || snap.snappedZ
      } else if (drag.axisLock === 'x') {
        dx = snapToGrid(dx)
        snapped = true
      } else if (drag.axisLock === 'y') {
        dy = snapToGrid(dy)
        snapped = true
      } else if (drag.axisLock === 'z') {
        dz = snapToGrid(dz)
        snapped = true
      }
    }

    applyDelta(dx, dy, dz)
    updateHud(dx, dy, dz, snapped)
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const key = ev.key.toLowerCase()

    if (key === 'escape') {
      ev.preventDefault()
      if (drag.typedBuffer) {
        drag.typedBuffer = ''
        updateHud(0, 0, 0)
      } else {
        applyDelta(0, 0, 0)
        finalizeDrag(false)
      }
      return
    }

    if (key === 'enter') {
      ev.preventDefault()
      const value = parseFloat(drag.typedBuffer)
      if (drag.axisLock && Number.isFinite(value)) {
        const dx = drag.axisLock === 'x' ? value : 0
        const dy = drag.axisLock === 'y' ? value : 0
        const dz = drag.axisLock === 'z' ? value : 0
        drag.moved = true
        applyDelta(dx, dy, dz)
      }
      finalizeDrag(true)
      return
    }

    if (key === 'x' || key === 'y' || key === 'z') {
      ev.preventDefault()
      drag.axisLock = drag.axisLock === key ? null : (key as Axis)
      drag.typedBuffer = ''
      updateHud(0, 0, 0)
      return
    }

    if (drag.axisLock && /^[0-9.-]$/.test(ev.key)) {
      ev.preventDefault()
      drag.typedBuffer += ev.key
      setDragHud({ typedText: drag.typedBuffer })
      return
    }

    if (key === 'backspace' && drag.axisLock) {
      ev.preventDefault()
      drag.typedBuffer = drag.typedBuffer.slice(0, -1)
      setDragHud({ typedText: drag.typedBuffer })
    }
  }

  const onPointerUp = () => finalizeDrag(true)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    if (e.shiftKey || e.ctrlKey || e.metaKey) return // multi-select click, no drag
    e.stopPropagation()

    const mesh = meshRef.current
    if (!mesh) return

    // Deliberately NOT calling detachGizmo() here: body-dragging repositions the mesh
    // imperatively but never removes it (or anything else) from the scene, so there's no
    // "parentless object" race to guard against (unlike delete/undo/group, which can). Detaching
    // anyway used to unmount/remount the whole TransformControls tree on every drag start, and
    // that remount raced drei's attach effect, leaving the gizmo invisible afterwards.
    if (controls) controls.enabled = false

    const selection = useSceneStore.getState().selectedIds
    const dragIds = selection.length > 1 && selection.includes(id) ? selection : [id]

    const starts: Record<string, { x: number; y: number; z: number }> = {}
    for (const dragId of dragIds) {
      const m = dragId === id ? mesh : getObject(dragId)
      if (m) starts[dragId] = { x: m.position.x, y: m.position.y, z: m.position.z }
    }

    // Use a ground-plane raycast (not e.point, the mesh-surface hit) to establish the
    // click offset — see groundHitAt's comment for why the two shouldn't be mixed.
    const initialHit = groundHitAt(e.nativeEvent.clientX, e.nativeEvent.clientY, mesh.position.y)

    dragRef.current = {
      clickedId: id,
      planeY: mesh.position.y,
      offsetX: initialHit ? mesh.position.x - initialHit.x : 0,
      offsetZ: initialHit ? mesh.position.z - initialHit.z : 0,
      starts,
      moved: false,
      axisLock: null,
      typedBuffer: '',
    }
    setDragHud({ axis: 'free', deltaText: 'Δx 0.0  Δz 0.0', typedText: '' })

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
  }

  return onPointerDown
}
