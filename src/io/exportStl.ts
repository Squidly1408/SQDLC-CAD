import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { useSceneStore } from '../state/store'
import { buildExportGroup, downloadBlob } from './sceneExport'

export function exportSceneToSTL(filename = 'model.stl') {
  const { nodesById, rootIds } = useSceneStore.getState()
  const group = buildExportGroup(nodesById, rootIds)
  const exporter = new STLExporter()
  const result = exporter.parse(group, { binary: true })
  const blob = new Blob([result.buffer as ArrayBuffer], { type: 'application/sla' })
  downloadBlob(blob, filename)
}
