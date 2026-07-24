import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MeshParams } from '../state/types'

function collectGeometries(object: THREE.Object3D): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = []
  object.updateWorldMatrix(true, true)
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry.clone()
      geom.applyMatrix4(child.matrixWorld)
      // Keep only position/normal — drop UVs/colors/etc. so merge doesn't choke on mismatched attributes.
      const stripped = new THREE.BufferGeometry()
      stripped.setAttribute('position', geom.getAttribute('position'))
      if (geom.getAttribute('normal')) stripped.setAttribute('normal', geom.getAttribute('normal'))
      if (geom.index) stripped.setIndex(geom.index)
      geometries.push(stripped)
    }
  })
  return geometries
}

function toMeshParams(geometry: THREE.BufferGeometry): MeshParams {
  geometry = geometry.index ? geometry.toNonIndexed() : geometry
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const cx = (box.min.x + box.max.x) / 2
  const cz = (box.min.z + box.max.z) / 2
  // Sit the import on the ground plane, centered over the origin — like dropping a part
  // onto the workplane, rather than leaving it wherever the source file happened to place it.
  geometry.translate(-cx, -box.min.y, -cz)

  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined

  return {
    positions: Array.from(position.array as Float32Array),
    normals: normal ? Array.from(normal.array as Float32Array) : undefined,
  }
}

async function loadSTL(buffer: ArrayBuffer): Promise<MeshParams> {
  const geometry = new STLLoader().parse(buffer)
  return toMeshParams(geometry)
}

async function loadOBJ(text: string): Promise<MeshParams> {
  const group = new OBJLoader().parse(text)
  const geometries = collectGeometries(group)
  if (geometries.length === 0) throw new Error('No mesh data found in OBJ file')
  const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false)
  if (!merged) throw new Error('Could not merge OBJ geometry')
  return toMeshParams(merged)
}

async function load3MF(buffer: ArrayBuffer): Promise<MeshParams> {
  const group = new ThreeMFLoader().parse(buffer)
  const geometries = collectGeometries(group)
  if (geometries.length === 0) throw new Error('No mesh data found in 3MF file')
  const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false)
  if (!merged) throw new Error('Could not merge 3MF geometry')
  return toMeshParams(merged)
}

export async function importModelFile(file: File): Promise<MeshParams> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'stl':
      return loadSTL(await file.arrayBuffer())
    case 'obj':
      return loadOBJ(await file.text())
    case '3mf':
      return load3MF(await file.arrayBuffer())
    default:
      throw new Error(`Unsupported file type: .${ext ?? ''}`)
  }
}
