import type { SceneState } from '../state/types'
import { downloadBlob } from './sceneExport'

const PROJECT_FILE_VERSION = 1

interface ProjectFile {
  version: number
  nodesById: SceneState['nodesById']
  rootIds: SceneState['rootIds']
}

export function saveProjectAs(state: Pick<SceneState, 'nodesById' | 'rootIds'>, filename = 'project.json') {
  const file: ProjectFile = { version: PROJECT_FILE_VERSION, nodesById: state.nodesById, rootIds: state.rootIds }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename)
}

export async function openProjectFile(file: File): Promise<Pick<SceneState, 'nodesById' | 'rootIds'>> {
  const text = await file.text()
  const parsed = JSON.parse(text) as ProjectFile
  if (!parsed || typeof parsed !== 'object' || !parsed.nodesById || !parsed.rootIds) {
    throw new Error('Invalid project file')
  }
  return { nodesById: parsed.nodesById, rootIds: parsed.rootIds }
}
