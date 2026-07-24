import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { SceneState } from '../state/types'

const AUTOSAVE_KEY = 'cad-webapp-autosave-v1'

export type AutosavePayload = Pick<SceneState, 'nodesById' | 'rootIds'>

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleAutosave(state: AutosavePayload, delayMs = 800) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void idbSet(AUTOSAVE_KEY, state)
  }, delayMs)
}

export async function loadAutosave(): Promise<AutosavePayload | undefined> {
  return idbGet<AutosavePayload>(AUTOSAVE_KEY)
}
