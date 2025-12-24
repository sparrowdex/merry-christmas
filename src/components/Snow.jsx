import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

export function Snow({ volume, era }) {
  const ref = useRef()
  
  // Create 1000 snowflakes
  const positions = useMemo(() => {
    const pos = new Float32Array(1000 * 3)
    for (let i = 0; i < 1000; i++) {
      const r = 2.1 * Math.cbrt(Math.random()) // Keep inside globe radius
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!ref.current) return
    // Blow hard -> Spin fast!
    const speed = 0.05 + (volume * 20)
    ref.current.rotation.y += speed * delta
  })

  // Colors
  const color = era === 'past' ? '#dcd0b3' : (era === 'future' ? '#00ffcc' : 'white')

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  )
}