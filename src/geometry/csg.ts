import * as THREE from 'three'
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import type { SceneNode } from '../state/types'
import { createGeometry } from './primitives'

const evaluator = new Evaluator()
// This app only ever renders flat-color materials (no texture mapping), and imported
// meshes (STL/OBJ/3MF) generally carry no UV data at all. The evaluator's default
// attribute list includes 'uv', which it then unconditionally tries to interpolate —
// crashing with "Cannot read properties of undefined (reading 'array')" the moment any
// operand lacks a uv attribute. Since nothing here needs UVs, just drop it from the list.
evaluator.attributes = ['position', 'normal']

function applyTransform(obj: THREE.Object3D, node: SceneNode) {
  obj.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z)
  obj.rotation.set(
    THREE.MathUtils.degToRad(node.transform.rotation.x),
    THREE.MathUtils.degToRad(node.transform.rotation.y),
    THREE.MathUtils.degToRad(node.transform.rotation.z),
  )
  obj.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z)
  obj.updateMatrix()
  obj.updateMatrixWorld(true)
}

function nodeToBrush(node: SceneNode, nodesById: Record<string, SceneNode>): Brush | null {
  let geometry: THREE.BufferGeometry
  if (node.type === 'group') {
    const evaluated = evaluateGroup(node, nodesById)
    if (!evaluated) return null
    geometry = evaluated
  } else if (node.params) {
    geometry = createGeometry(node.params)
  } else {
    return null
  }
  const brush = new Brush(geometry)
  applyTransform(brush, node)
  return brush
}

/** Recursively evaluates a group node's CSG tree (solids unioned, holes subtracted) into a single geometry, in the group's local space. */
export function evaluateGroup(group: SceneNode, nodesById: Record<string, SceneNode>): THREE.BufferGeometry | null {
  const childNodes = group.children.map((id) => nodesById[id]).filter((n): n is SceneNode => !!n && n.visible)
  const solids = childNodes.filter((n) => n.solid)
  const holes = childNodes.filter((n) => !n.solid)
  if (solids.length === 0) return null

  let solidResult: Brush | null = null
  for (const n of solids) {
    const b = nodeToBrush(n, nodesById)
    if (!b) continue
    solidResult = solidResult ? evaluator.evaluate(solidResult, b, ADDITION) : b
  }
  if (!solidResult) return null

  let result = solidResult
  for (const n of holes) {
    const b = nodeToBrush(n, nodesById)
    if (!b) continue
    result = evaluator.evaluate(result, b, SUBTRACTION)
  }

  result.geometry.computeVertexNormals()
  return result.geometry
}

/** Builds a stable string key that changes whenever anything affecting a subtree's evaluated geometry changes. */
export function subtreeKey(id: string, nodesById: Record<string, SceneNode>): string {
  const node = nodesById[id]
  if (!node) return id
  const self = `${node.type}:${JSON.stringify(node.params)}:${JSON.stringify(node.transform)}:${node.solid}:${node.visible}`
  if (node.type !== 'group') return self
  return `${self}[${node.children.map((cid) => subtreeKey(cid, nodesById)).join(',')}]`
}
