import * as THREE from 'three'
import type { MeshParams } from '../state/types'

// The WASM binary is ~65MB, so this is only ever loaded on first actual use (STEP/IGES
// import), never on initial app load.
let ocPromise: Promise<any> | null = null

async function getOC(): Promise<any> {
  if (!ocPromise) {
    ocPromise = (async () => {
      const [{ default: wasmUrl }, { default: ocFactory }] = await Promise.all([
        import('opencascade.js/dist/opencascade.wasm.wasm?url'),
        import('opencascade.js/dist/opencascade.wasm.js'),
      ])
      return ocFactory({
        locateFile: (path: string) => (path.endsWith('.wasm') ? wasmUrl : path),
      })
    })()
  }
  return ocPromise
}

export async function importStepFile(file: File): Promise<MeshParams> {
  const oc = await getOC()
  const isIges = /\.(iges|igs)$/i.test(file.name)
  // Deliberately short (<=10 chars): this build's STEPControl_Reader/IGESControl_Reader
  // ReadFile silently fails (IFSelect_RetError) for virtual-FS filenames of 11+ characters —
  // confirmed by a length sweep ('abcde.step' = 10 chars works, 'abcdef.step' = 11 chars
  // doesn't, regardless of file content). Using the real uploaded filename would break for
  // most real-world names, so we always read/write under a short fixed name instead.
  const fileName = isIges ? 'a.igs' : 'a.step'
  const buffer = new Uint8Array(await file.arrayBuffer())
  oc.FS.writeFile(fileName, buffer)

  const reader = isIges ? new oc.IGESControl_Reader_1() : new oc.STEPControl_Reader_1()
  const status = reader.ReadFile(fileName)
  if (status !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
    throw new Error(`Could not parse ${isIges ? 'IGES' : 'STEP'} file (reader status ${status})`)
  }
  reader.TransferRoots()
  const shape = reader.OneShape()

  new oc.BRepMesh_IncrementalMesh_2(shape, 0.25, false, 0.5, false)

  const positions: number[] = []
  const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE)
  for (; explorer.More(); explorer.Next()) {
    const face = oc.TopoDS.Face_1(explorer.Current())
    const location = new oc.TopLoc_Location_1()
    const triHandle = oc.BRep_Tool.Triangulation(face, location)
    if (triHandle.IsNull()) continue
    const tri = triHandle.get()
    const trsf = location.Transformation()

    const nbNodes = tri.NbNodes()
    const nodes: number[][] = []
    for (let i = 1; i <= nbNodes; i++) {
      const p = tri.Node(i).Transformed(trsf)
      nodes.push([p.X(), p.Y(), p.Z()])
    }

    const reversed = face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED
    const nbTriangles = tri.NbTriangles()
    for (let i = 1; i <= nbTriangles; i++) {
      const t = tri.Triangle(i)
      let n1 = t.Value(1)
      let n2 = t.Value(2)
      let n3 = t.Value(3)
      if (reversed) [n2, n3] = [n3, n2]
      positions.push(...nodes[n1 - 1], ...nodes[n2 - 1], ...nodes[n3 - 1])
    }
  }

  oc.FS.unlink(fileName)

  if (positions.length === 0) {
    throw new Error('No triangulated surface geometry found in the file')
  }

  // Sit the import on the ground plane, centered over the origin — same treatment as
  // STL/OBJ/3MF imports (see importModel.ts), rather than leaving it wherever the STEP
  // file's own coordinate system happened to place it.
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const cx = (box.min.x + box.max.x) / 2
  const cz = (box.min.z + box.max.z) / 2
  geometry.translate(-cx, -box.min.y, -cz)
  geometry.computeVertexNormals()

  return {
    positions: Array.from(geometry.getAttribute('position').array as Float32Array),
    normals: Array.from(geometry.getAttribute('normal').array as Float32Array),
  }
}
