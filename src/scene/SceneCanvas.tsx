import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { useSceneStore } from '../state/store'
import { Shape } from './Shape'
import { GridFloor } from './GridFloor'
import { GizmoLayer, type GizmoMode } from './GizmoLayer'

interface SceneCanvasProps {
  mode: GizmoMode
  snapEnabled: boolean
}

export function SceneCanvas({ mode, snapEnabled }: SceneCanvasProps) {
  const rootIds = useSceneStore((s) => s.rootIds)
  const clearSelection = useSceneStore((s) => s.clearSelection)

  return (
    <Canvas
      shadows
      camera={{ position: [120, 110, 120], fov: 45, near: 0.1, far: 5000 }}
      onPointerMissed={() => clearSelection()}
    >
      <color attach="background" args={['#20232b']} />
      <hemisphereLight args={['#ffffff', '#3a3f4b', 0.8]} />
      <directionalLight
        position={[80, 140, 60]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <GridFloor />

      {rootIds.map((id) => (
        <Shape key={id} id={id} dragEnabled={mode === 'translate'} snapEnabled={snapEnabled} />
      ))}

      <GizmoLayer mode={mode} snapEnabled={snapEnabled} />

      <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={5} maxDistance={2000} />
      <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
        <GizmoViewport axisColors={['#f75c4f', '#4ff78e', '#4f8ef7']} labelColor="black" />
      </GizmoHelper>
    </Canvas>
  )
}
