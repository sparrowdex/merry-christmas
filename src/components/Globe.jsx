import React, { useRef } from 'react'
import { Sphere, MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Globe({ windVolume = 0 }) {
  const materialRef = useRef()

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Base roughness is 0.1 (Clear)
      // When you blow (windVolume goes up), target roughness increases to 0.8 (Foggy)
      // We multiply windVolume by 3 to make it sensitive (easy to fog up)

      console.log('Wind volume in Globe:', windVolume); // Debug
      const targetRoughness = 0.1 + (windVolume * 3.0);

      // Clamp the max fog so it doesn't turn into a matte stone (max 0.6 is good)
      const clampedTarget = Math.min(Math.max(targetRoughness, 0.1), 0.6);

      // Lerp (Linear Interpolate) for smooth animation
      // "delta * 2" determines the speed of the fogging/defogging
      materialRef.current.roughness = THREE.MathUtils.lerp(
        materialRef.current.roughness,
        clampedTarget,
        delta * 2
      );

      // Make it slightly whiter when foggy
      const targetColor = new THREE.Color(windVolume > 0.1 ? '#ffffff' : '#eefbff')
      materialRef.current.color.lerp(targetColor, delta * 2)
    }
  })

  return (
    <group>
      <Sphere args={[2.4, 64, 64]}>
        <MeshTransmissionMaterial
          ref={materialRef}
          thickness={0.25}
          roughness={0.1}       // Starting Value
          transmission={1}
          ior={1.5}
          chromaticAberration={0.1}
          color="#eefbff"
        />
      </Sphere>

      <mesh position={[0, -2.4, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.5, 32]} />
        <meshStandardMaterial color="#3d2817" roughness={0.6} />
      </mesh>

      {/* FIXED: Rotated 90 degrees (Math.PI / 2) */}
      <mesh position={[0, -2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
