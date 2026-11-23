import React, { useMemo, useRef } from 'react'
import { Sphere, MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth <= 768

// Patchy breath-on-glass texture: droplets + a few drips. Black = clear, white = fogged.
function createCondensationTexture() {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#5a5a5a' // even base haze everywhere
  ctx.fillRect(0, 0, w, h)

  // Soft cloudy blotches
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 20 + Math.random() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.25 + Math.random() * 0.35})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // Tiny droplets
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 0.8 + Math.random() * 2.5
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Clear drip trails running down
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.lineCap = 'round'
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * w
    const y = h * 0.2 + Math.random() * h * 0.5
    ctx.lineWidth = 1.5 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (Math.random() - 0.5) * 6, y + 20 + Math.random() * 70)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

export function Globe({ windVolume = 0, transitionAmount }) {
  const materialRef = useRef()
  const frostRef = useRef()
  const fog = useRef(0) // 0 = clear glass, 1 = fully fogged
  const frostTexture = useMemo(() => createCondensationTexture(), [])

  useFrame((state, delta) => {
    // Device-specific sensitivity: mobile/tablet more sensitive than desktop/laptop
    const multiplier = isMobileDevice() ? 6.0 : 3.0
    const breath = windVolume * multiplier

    // Breath builds fog quickly; when you stop it clears slowly, like real glass
    if (breath > 0.15) {
      fog.current = Math.min(1, fog.current + breath * delta * 1.2)
    } else {
      fog.current = Math.max(0, fog.current - delta * 0.12)
    }

    // Time travel: the glass mists over at the peak of the spin to hide the scene swap
    const travel = transitionAmount?.current || 0
    const shown = Math.max(fog.current, travel * 0.9)

    if (frostRef.current) {
      frostRef.current.opacity = shown * 0.85
    }

    if (materialRef.current) {
      const targetRoughness = 0.1 + shown * 0.5
      materialRef.current.roughness = THREE.MathUtils.lerp(materialRef.current.roughness, targetRoughness, delta * 3)
    }
  })

  return (
    <group>
      <Sphere args={[2.4, 64, 64]}>
        <MeshTransmissionMaterial
          ref={materialRef}
          thickness={0.25}
          roughness={0.1}
          transmission={1}
          ior={1.5}
          chromaticAberration={0.1}
          color="#eefbff"
        />
      </Sphere>

      {/* Condensation layer on the outside of the glass */}
      <Sphere args={[2.42, 64, 64]}>
        <meshStandardMaterial
          ref={frostRef}
          color="#f4f8ff"
          roughness={0.9}
          transparent
          opacity={0}
          alphaMap={frostTexture}
          depthWrite={false}
          side={THREE.DoubleSide} // visible from inside the globe too
        />
      </Sphere>

      <mesh position={[0, -2.4, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.5, 32]} />
        <meshStandardMaterial color="#3d2817" roughness={0.6} />
      </mesh>

      <mesh position={[0, -2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
