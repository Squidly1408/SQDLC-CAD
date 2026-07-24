export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'wedge'
export type NodeType = PrimitiveType | 'group' | 'mesh'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Transform {
  position: Vec3
  rotation: Vec3 // degrees
  scale: Vec3
}

export interface BoxParams {
  width: number
  height: number
  depth: number
}

export interface SphereParams {
  radius: number
  segments: number
}

export interface CylinderParams {
  radius: number
  height: number
  segments: number
}

export interface ConeParams {
  radius: number
  height: number
  segments: number
}

export interface TorusParams {
  radius: number
  tube: number
  segments: number
}

export interface WedgeParams {
  width: number
  height: number
  depth: number
}

/** A static, imported triangle mesh (from STL/OBJ/3MF) — not parametrically editable, but
 *  usable like any other shape: transform, color, solid/hole, group/CSG, export. */
export interface MeshParams {
  positions: number[]
  normals?: number[]
  indices?: number[]
}

export type ShapeParams =
  | ({ type: 'box' } & BoxParams)
  | ({ type: 'sphere' } & SphereParams)
  | ({ type: 'cylinder' } & CylinderParams)
  | ({ type: 'cone' } & ConeParams)
  | ({ type: 'torus' } & TorusParams)
  | ({ type: 'wedge' } & WedgeParams)
  | ({ type: 'mesh' } & MeshParams)

export interface SceneNode {
  id: string
  name: string
  type: NodeType
  transform: Transform
  params: ShapeParams | null // null for groups
  color: string
  solid: boolean // solid vs hole (holes are subtracted when grouped)
  visible: boolean
  children: string[] // child node ids, only meaningful for 'group' nodes
  parentId: string | null
}

export interface SceneState {
  nodesById: Record<string, SceneNode>
  rootIds: string[]
  selectedIds: string[]
}

export const DEFAULT_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
}

export function defaultParamsFor(type: PrimitiveType): ShapeParams {
  switch (type) {
    case 'box':
      return { type: 'box', width: 20, height: 20, depth: 20 }
    case 'sphere':
      return { type: 'sphere', radius: 12, segments: 32 }
    case 'cylinder':
      return { type: 'cylinder', radius: 10, height: 20, segments: 32 }
    case 'cone':
      return { type: 'cone', radius: 12, height: 20, segments: 32 }
    case 'torus':
      return { type: 'torus', radius: 10, tube: 3, segments: 32 }
    case 'wedge':
      return { type: 'wedge', width: 20, height: 20, depth: 20 }
  }
}

export const PRIMITIVE_LABELS: Record<PrimitiveType, string> = {
  box: 'Box',
  sphere: 'Sphere',
  cylinder: 'Cylinder',
  cone: 'Cone',
  torus: 'Torus',
  wedge: 'Wedge',
}
