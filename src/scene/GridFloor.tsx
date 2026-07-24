import { Grid } from '@react-three/drei'

export function GridFloor() {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[10, 10]}
      cellSize={5}
      cellThickness={0.5}
      cellColor="#3a3f4b"
      sectionSize={50}
      sectionThickness={1}
      sectionColor="#5a6376"
      fadeDistance={800}
      fadeStrength={1}
      infiniteGrid
    />
  )
}
