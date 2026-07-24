import * as THREE from 'three'
import type { ShapeParams } from '../state/types'

function wedgeGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const hw = width / 2
  const hh = height / 2
  const hd = depth / 2

  // Right-triangular-prism "ramp" shape.
  const v0 = [-hw, -hh, -hd] // bottom-left-back
  const v1 = [hw, -hh, -hd] // bottom-right-back
  const v2 = [hw, -hh, hd] // bottom-right-front
  const v3 = [-hw, -hh, hd] // bottom-left-front
  const v4 = [-hw, hh, -hd] // top ridge back
  const v5 = [-hw, hh, hd] // top ridge front

  const tri = (a: number[], b: number[], c: number[]) => [...a, ...b, ...c]

  const positions = [
    // bottom (facing -y)
    ...tri(v0, v2, v1),
    ...tri(v0, v3, v2),
    // back cap (facing -z)
    ...tri(v0, v1, v4),
    // front cap (facing +z)
    ...tri(v3, v5, v2),
    // left vertical face (facing -x)
    ...tri(v0, v4, v5),
    ...tri(v0, v5, v3),
    // ramp face (slanted)
    ...tri(v1, v2, v5),
    ...tri(v1, v5, v4),
  ]

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function importedMeshGeometry(params: { positions: number[]; normals?: number[]; indices?: number[] }): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(params.positions, 3))
  if (params.indices) geometry.setIndex(params.indices)
  if (params.normals) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(params.normals, 3))
  } else {
    geometry.computeVertexNormals()
  }
  return geometry
}

export function createGeometry(params: ShapeParams): THREE.BufferGeometry {
  switch (params.type) {
    case 'box':
      return new THREE.BoxGeometry(params.width, params.height, params.depth)
    case 'sphere':
      return new THREE.SphereGeometry(params.radius, params.segments, params.segments / 2)
    case 'cylinder':
      return new THREE.CylinderGeometry(params.radius, params.radius, params.height, params.segments)
    case 'cone':
      return new THREE.ConeGeometry(params.radius, params.height, params.segments)
    case 'torus':
      return new THREE.TorusGeometry(params.radius, params.tube, 16, params.segments)
    case 'wedge':
      return wedgeGeometry(params.width, params.height, params.depth)
    case 'mesh':
      return importedMeshGeometry(params)
  }
}
