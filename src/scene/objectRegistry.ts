import type * as THREE from 'three'

const registry = new Map<string, THREE.Object3D>()

export function registerObject(id: string, obj: THREE.Object3D) {
  registry.set(id, obj)
}

export function unregisterObject(id: string) {
  registry.delete(id)
}

export function getObject(id: string): THREE.Object3D | undefined {
  return registry.get(id)
}
