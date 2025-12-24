import React from 'react'
import { Sphere, MeshTransmissionMaterial } from '@react-three/drei'

export function Globe() {
  return (
    <group>
      {/* The Glass Sphere */}
      <Sphere args={[2.4, 64, 64]}>
        <MeshTransmissionMaterial 
          thickness={0.25} roughness={0.1} transmission={1} ior={1.5} chromaticAberration={0.1} color="#eefbff"
        />
      </Sphere>

      {/* The Wooden Base */}
      <mesh position={[0, -2.4, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.5, 32]} />
        <meshStandardMaterial color="#3d2817" roughness={0.6} />
      </mesh>
      
      
      <mesh position={[0, -2.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}