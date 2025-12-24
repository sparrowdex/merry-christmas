import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

export function Snow({ volume, era, isTransitioning = false, isSnowing = false }) {
  const ref = useRef()
  const fallingSnowRef = useRef()
  const maxSnowflakes = 5000 // Increased for a denser snowfall effect

  // Initialize the buffer for falling snow positions. This is a fixed-size buffer.
  const fallingPositions = useMemo(() => new Float32Array(maxSnowflakes * 3), [maxSnowflakes])

  // State to manage the properties of each snowflake
  const [snowflakes, setSnowflakes] = useState(() =>
    Array.from({ length: maxSnowflakes }, (_, i) => ({
      x: (Math.random() - 0.5) * 40,
      y: -1000, // Start all flakes off-screen
      z: (Math.random() - 0.5) * 20,
      speed: 0,
      drift: 0,
      active: false,
    }))
  )

  // Memoized positions for the static snow inside the globe
  const positions = useMemo(() => {
    const pos = new Float32Array(1000 * 3)
    for (let i = 0; i < 1000; i++) {
      const r = 2.1 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!ref.current || !fallingSnowRef.current) return

    // Spin the globe based on microphone volume or during transitions
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
    let speed = isTransitioning ? 4 : (isMobile ? (volume > 0.05 ? 0.1 + volume * 25 : 0) : (volume > 0.1 ? 0.1 + volume * 15 : 0))
    ref.current.rotation.y += speed * delta

    // This state update was causing re-renders every frame. We should manage state in-place.
    // By managing the snowflakes array directly and only calling setState when absolutely necessary (like toggling isSnowing),
    // we can avoid the performance overhead. For this animation, we'll manipulate the array directly.
    const newFlakes = snowflakes

    if (isSnowing) {
      // Find inactive snowflakes to spawn new ones
      const inactiveIndices = []
      for (let i = 0; i < newFlakes.length; i++) {
        if (!newFlakes[i].active) {
          inactiveIndices.push(i)
        }
      }

      // Spawn a few new snowflakes per frame if there's space
      const spawnCount = Math.min(Math.floor(Math.random() * 5) + 3, inactiveIndices.length)
      for (let i = 0; i < spawnCount; i++) {
        const idx = inactiveIndices[i]
        if (newFlakes[idx]) {
          newFlakes[idx] = {
            x: (Math.random() - 0.5) * 40,
            y: 10 + Math.random() * 5,
            z: (Math.random() - 0.5) * 20,
            speed: 2 + Math.random() * 3,
            drift: (Math.random() - 0.5) * 0.5,
            active: true,
          }
        }
      }
    }

    // Update positions of all snowflakes
    for (let i = 0; i < newFlakes.length; i++) {
      const flake = newFlakes[i]
      if (flake.active) {
        flake.y -= flake.speed * delta
        flake.x += flake.drift * delta

        // Deactivate if it falls below the screen
        if (flake.y < -10) {
          flake.active = false
        }
      }
      
      // Update buffer: move inactive flakes off-screen
      const index = i * 3
      if (flake.active) {
        fallingPositions[index] = flake.x
        fallingPositions[index + 1] = flake.y
        fallingPositions[index + 2] = flake.z
      } else {
        // Position inactive flakes far away
        fallingPositions[index] = 0
        fallingPositions[index + 1] = -1000
        fallingPositions[index + 2] = 0
      }
    }

    if (!isSnowing) {
      // If snowing is turned off, deactivate all flakes
      for (let i = 0; i < newFlakes.length; i++) {
        newFlakes[i].active = false
      }
    }
    
    // Crucially, mark the buffer as needing an update
    fallingSnowRef.current.geometry.attributes.position.needsUpdate = true
  })

  // Set color based on the current era
  const color = era === 'past' ? '#dcd0b3' : era === 'future' ? '#00ffcc' : 'white'

  return (
    <>
      {/* Static snow inside the globe */}
      <Points ref={ref} positions={positions} stride={3}>
        <PointMaterial transparent color={color} size={0.05} sizeAttenuation={true} depthWrite={false} />
      </Points>

      {/* Falling snow outside the globe */}
      <Points ref={fallingSnowRef} positions={fallingPositions} stride={3}>
        <PointMaterial transparent color="white" size={0.08} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </>
  )
}
