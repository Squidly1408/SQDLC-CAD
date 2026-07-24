// Lets code outside the R3F tree (Toolbar buttons, keyboard shortcuts) tell the mounted
// TransformControls to let go of its target *before* a store mutation can remove that
// object from the scene graph. Reacting after the fact (via polling) leaves a one-frame
// window where TransformControls still references a parentless object.
let detachFn: (() => void) | null = null

export function registerGizmoDetach(fn: () => void) {
  detachFn = fn
}

export function unregisterGizmoDetach(fn: () => void) {
  if (detachFn === fn) detachFn = null
}

export function detachGizmo() {
  detachFn?.()
}
