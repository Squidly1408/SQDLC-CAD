import * as THREE from 'three'
import type { SceneNode } from '../state/types'
import { createGeometry } from '../geometry/primitives'
import { evaluateGroup } from '../geometry/csg'

function applyTransform(obj: THREE.Object3D, node: SceneNode) {
  obj.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z)
  obj.rotation.set(
    THREE.MathUtils.degToRad(node.transform.rotation.x),
    THREE.MathUtils.degToRad(node.transform.rotation.y),
    THREE.MathUtils.degToRad(node.transform.rotation.z),
  )
  obj.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z)
}

/** Builds a plain THREE.Group (outside of React) mirroring the current scene, for exporters. */
export function buildExportGroup(nodesById: Record<string, SceneNode>, rootIds: string[]): THREE.Group {
  const root = new THREE.Group()

  for (const id of rootIds) {
    const node = nodesById[id]
    if (!node || !node.visible) continue

    let geometry: THREE.BufferGeometry | null = null
    if (node.type === 'group') {
      geometry = evaluateGroup(node, nodesById)
    } else if (node.params) {
      geometry = createGeometry(node.params)
    }
    if (!geometry) continue

    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: node.color }))
    applyTransform(mesh, node)
    root.add(mesh)
  }

  return root
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
