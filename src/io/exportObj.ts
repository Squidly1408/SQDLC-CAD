import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { useSceneStore } from '../state/store'
import { buildExportGroup, downloadBlob } from './sceneExport'

export function exportSceneToOBJ(filename = 'model.obj') {
  const { nodesById, rootIds } = useSceneStore.getState()
  const group = buildExportGroup(nodesById, rootIds)
  const exporter = new OBJExporter()
  const result = exporter.parse(group)
  const blob = new Blob([result], { type: 'text/plain' })
  downloadBlob(blob, filename)
}
