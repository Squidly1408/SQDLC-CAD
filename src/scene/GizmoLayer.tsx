import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../state/store'
import { getObject } from './objectRegistry'
import { registerGizmoDetach, unregisterGizmoDetach } from './gizmoBridge'

export type GizmoMode = 'translate' | 'rotate' | 'scale'

interface GizmoLayerProps {
  mode: GizmoMode
  snapEnabled: boolean
}

interface NodeSnapshot {
  id: string
  mesh: THREE.Object3D
  startPos: THREE.Vector3
  startQuat: THREE.Quaternion
  startScale: THREE.Vector3
}

interface DragSnapshot {
  pivotStartPos: THREE.Vector3
  nodes: NodeSnapshot[]
}

/**
 * A single, always-in-scene, invisible pivot that TransformControls attaches to instead of
 * attaching directly to a shape's mesh. For a single selection the pivot sits at that
 * object's own position, so single-object behavior is unchanged. For a multi-selection it
 * sits at the selection's center, and drag deltas (translation / rotation / scale, computed
 * against the pivot's own start-of-drag transform) are re-applied to every selected mesh —
 * translating them together, or rotating/scaling them together around the shared center.
 */
export function GizmoLayer({ mode, snapEnabled }: GizmoLayerProps) {
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const updateTransforms = useSceneStore((s) => s.updateTransforms)
  const pivot = useMemo(() => new THREE.Group(), [])
  const controlsRef = useRef<any>(null)
  const dragRef = useRef<DragSnapshot | null>(null)
  const lastSelectionKeyRef = useRef<string>('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const detach = () => {
      controlsRef.current?.detach()
      dragRef.current = null
      lastSelectionKeyRef.current = ''
      setReady(false)
    }
    registerGizmoDetach(detach)
    return () => unregisterGizmoDetach(detach)
  }, [])

  // Keep the pivot parked at the current selection's center whenever the selection changes
  // (and we're not mid-drag). Polls via useFrame — same reasoning as before: a just-added
  // object's mesh may not be registered yet the instant selection changes.
  useFrame(() => {
    if (dragRef.current) return
    if (selectedIds.length === 0) {
      if (ready) setReady(false)
      return
    }
    const objs = selectedIds.map((id) => getObject(id)).filter((o): o is THREE.Object3D => !!o && !!o.parent)
    if (objs.length !== selectedIds.length) {
      if (ready) setReady(false)
      return
    }
    const key = selectedIds.slice().sort().join(',')
    if (key === lastSelectionKeyRef.current && ready) return

    const center = new THREE.Vector3()
    objs.forEach((o) => center.add(o.position))
    center.divideScalar(objs.length)
    pivot.position.copy(center)
    pivot.quaternion.identity()
    pivot.scale.set(1, 1, 1)
    pivot.updateMatrixWorld()
    lastSelectionKeyRef.current = key
    setReady(true)
  })

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    // `ready` is intentionally part of the dependency array even though it's unused in the
    // body: controlsRef only becomes non-null once <TransformControls> mounts on ready=true,
    // and refs aren't reactive, so without `ready` here this effect can run once while the
    // ref is still null (exiting immediately below) and then never re-run to actually attach
    // these listeners once the gizmo mounts — TransformControls keeps working internally
    // (it owns its own pointer handling), but nothing ever hears its drag events, so dragging
    // silently never reaches the mesh or the store.

    const onDragStart = () => {
      // Pivot always starts a drag at identity rotation/scale, so the pivot's *current*
      // rotation/scale during the drag directly *is* the delta to re-apply to every node.
      pivot.quaternion.identity()
      pivot.scale.set(1, 1, 1)

      const nodes: NodeSnapshot[] = selectedIds
        .map((id) => {
          const mesh = getObject(id)
          if (!mesh) return null
          return {
            id,
            mesh,
            startPos: mesh.position.clone(),
            startQuat: mesh.quaternion.clone(),
            startScale: mesh.scale.clone(),
          }
        })
        .filter((n): n is NodeSnapshot => !!n)

      dragRef.current = { pivotStartPos: pivot.position.clone(), nodes }
    }

    const onObjectChange = () => {
      const drag = dragRef.current
      if (!drag) return
      const deltaPos = pivot.position.clone().sub(drag.pivotStartPos)
      const deltaQuat = pivot.quaternion
      const deltaScale = pivot.scale

      for (const n of drag.nodes) {
        const offset = n.startPos.clone().sub(drag.pivotStartPos)
        offset.multiply(deltaScale)
        offset.applyQuaternion(deltaQuat)
        n.mesh.position.copy(drag.pivotStartPos).add(offset).add(deltaPos)
        n.mesh.quaternion.copy(n.startQuat).premultiply(deltaQuat)
        n.mesh.scale.set(n.startScale.x * deltaScale.x, n.startScale.y * deltaScale.y, n.startScale.z * deltaScale.z)
      }
    }

    const onDragEnd = () => {
      const drag = dragRef.current
      if (!drag) return
      const euler = new THREE.Euler()
      const updates = drag.nodes.map((n) => {
        euler.setFromQuaternion(n.mesh.quaternion, 'XYZ')
        return {
          id: n.id,
          transform: {
            position: { x: n.mesh.position.x, y: n.mesh.position.y, z: n.mesh.position.z },
            rotation: {
              x: THREE.MathUtils.radToDeg(euler.x),
              y: THREE.MathUtils.radToDeg(euler.y),
              z: THREE.MathUtils.radToDeg(euler.z),
            },
            scale: { x: n.mesh.scale.x, y: n.mesh.scale.y, z: n.mesh.scale.z },
          },
        }
      })
      updateTransforms(updates)
      dragRef.current = null
      lastSelectionKeyRef.current = '' // force a re-center next frame
    }

    controls.addEventListener('mouseDown', onDragStart)
    controls.addEventListener('objectChange', onObjectChange)
    controls.addEventListener('mouseUp', onDragEnd)
    return () => {
      controls.removeEventListener('mouseDown', onDragStart)
      controls.removeEventListener('objectChange', onObjectChange)
      controls.removeEventListener('mouseUp', onDragEnd)
    }
  }, [selectedIds, updateTransforms, pivot, ready])

  return (
    <>
      <primitive object={pivot} />
      {ready && (
        <TransformControls
          ref={controlsRef}
          object={pivot}
          mode={mode}
          size={1.35}
          translationSnap={snapEnabled ? 5 : null}
          rotationSnap={snapEnabled ? Math.PI / 12 : null}
          scaleSnap={snapEnabled ? 0.25 : null}
          // Deliberately NOT makeDefault: OrbitControls is the sole `makeDefault` (state.controls)
          // owner. TransformControls disables it while dragging via its own 'dragging-changed'
          // listener, which reads state.controls — if TransformControls also claimed makeDefault,
          // selecting an object would flip state.controls to itself, and the disable-while-
          // dragging wiring would target itself instead of OrbitControls, so orbiting and the
          // gizmo would fight over the same drag.
        />
      )}
    </>
  )
}
