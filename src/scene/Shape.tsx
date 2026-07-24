import { useEffect, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { useSceneStore } from '../state/store'
import { createGeometry } from '../geometry/primitives'
import { evaluateGroup, subtreeKey } from '../geometry/csg'
import { registerObject, unregisterObject } from './objectRegistry'
import { useBodyDrag } from './useBodyDrag'

interface ShapeProps {
  id: string
  dragEnabled: boolean
  snapEnabled: boolean
}

export function Shape({ id, dragEnabled, snapEnabled }: ShapeProps) {
  const node = useSceneStore((s) => s.nodesById[id])
  const nodesById = useSceneStore((s) => s.nodesById)
  const isSelected = useSceneStore((s) => s.selectedIds.includes(id))
  const setSelection = useSceneStore((s) => s.setSelection)
  const toggleSelection = useSceneStore((s) => s.toggleSelection)
  const meshRef = useRef<THREE.Mesh>(null)
  const startDrag = useBodyDrag(id, meshRef, snapEnabled)

  const key = node?.type === 'group' ? subtreeKey(id, nodesById) : null

  const geometry = useMemo(() => {
    if (!node) return null
    if (node.type === 'group') {
      return evaluateGroup(node, nodesById)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
    if (node.params) return createGeometry(node.params)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.type, node?.params, key])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    registerObject(id, mesh)
    return () => unregisterObject(id)
  }, [id])

  if (!node || !node.visible || !geometry) return null

  const { position, rotation, scale } = node.transform
  const degToRad = (d: number) => (d * Math.PI) / 180

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[position.x, position.y, position.z]}
      rotation={[degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]}
      scale={[scale.x, scale.y, scale.z]}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          toggleSelection(id)
          return
        }
        // Clicking a shape that's already part of a multi-selection keeps the whole
        // selection intact (so the drag below can move all of them together); clicking
        // any other shape collapses selection down to just that one, as usual.
        if (!useSceneStore.getState().selectedIds.includes(id)) {
          setSelection([id])
        }
        if (dragEnabled) startDrag(e)
      }}
    >
      <meshStandardMaterial
        color={node.color}
        transparent={!node.solid}
        opacity={node.solid ? 1 : 0.45}
        roughness={0.55}
        metalness={0.05}
      />
      {isSelected && <Outlines thickness={2} color="#ffffff" screenspace />}
    </mesh>
  )
}
