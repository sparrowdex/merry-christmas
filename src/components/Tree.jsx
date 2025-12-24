import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Pass soundIntensity (0 to 1) from your parent component
export function Tree({ era, soundIntensity = 0, isTransitioning = false }) {
  const group = useRef()
  // Ref to store the fairy lights material to animate them
  const lightsRefs = useRef([])

  // --- CONFIGURATION ---
  const isPast = era === 'past'
  const isFuture = era === 'future'

  // Colors based on Era
  const trunkColor = isPast ? '#5c4033' : (isFuture ? '#1a1a1a' : '#4a3728')
  const leavesColor = isPast ? '#8c7e68' : (isFuture ? '#000000' : '#0f5c2e')
  const starColor = isPast ? '#d4cdba' : (isFuture ? '#ff00ff' : '#ffd700')

  // Future Vibe: Wireframe & Neon Glow
  const materialProps = isFuture 
    ? { wireframe: true, emissive: "#00ffcc", emissiveIntensity: 2, color: "#00ffcc" }
    : { wireframe: false }

  // Generate positions for Fairy Lights (Spiral)
  const lightPositions = useMemo(() => {
    const pos = []
    // Create 15 lights spiraling up
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 4 // 2 full turns
      const y = -0.2 + (i / 15) * 1.8 // Height from bottom leaves to top
      const radius = 0.6 * (1 - i / 15) + 0.1 // Taper radius as we go up
      pos.push([
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ])
    }
    return pos
  }, [])

    useFrame((state, delta) => {

      const t = state.clock.getElapsedTime()

      // 1. Floating Animation

      if(group.current) {

          group.current.position.y = -1 + Math.sin(t * 1) * 0.05

          // Spin fast during transition

          if (isTransitioning) {

            group.current.rotation.y += delta * 2

          }

      }

  

      // 2. MIC REACTIVITY:

      // If blowing (intensity > 0.1), make lights bright. Otherwise, dim pulse.

      // Apply intensity to all lights individually

      const baseIntensity = 0.5 + Math.sin(t * 3) * 0.3 // Idle twinkle

      const blowIntensity = soundIntensity * 20 // Intense glow when blowing

      const targetIntensity = soundIntensity > 0.1 ? 5 + blowIntensity : baseIntensity

  

      lightsRefs.current.forEach(material => {

        if (material) {

          material.emissiveIntensity = THREE.MathUtils.lerp(

            material.emissiveIntensity,

            targetIntensity,

            0.1

          )

        }

      })

    })

  

    return (

      <group ref={group}>

        {/* 1. Trunk */}

        <mesh position={[0, -0.5, 0]}>

          <cylinderGeometry args={[0.2, 0.4, 1, 8]} />

          <meshStandardMaterial color={trunkColor} {...materialProps} />

        </mesh>

  

        {/* 2. Leaves (Stacked Cones) */}

        <mesh position={[0, 0.2, 0]}>

          <coneGeometry args={[1.0, 1.2, isPast ? 4 : 16]} /> 

          <meshStandardMaterial color={leavesColor} {...materialProps} roughness={0.8} />

        </mesh>

        

        <mesh position={[0, 0.8, 0]}>

          <coneGeometry args={[0.8, 1.0, isPast ? 4 : 16]} />

          <meshStandardMaterial color={leavesColor} {...materialProps} roughness={0.8} />

        </mesh>

  

        <mesh position={[0, 1.4, 0]}>

          <coneGeometry args={[0.6, 0.8, isPast ? 4 : 16]} />

          <meshStandardMaterial color={leavesColor} {...materialProps} roughness={0.8} />

        </mesh>

  

        {/* 3. The Star */}

        <mesh position={[0, 1.9, 0]} rotation={[0, 0, 0.2]}>

          <dodecahedronGeometry args={[0.2, 0]} />

          <meshStandardMaterial 

            color={starColor} 

            emissive={starColor}

            emissiveIntensity={isFuture ? 4 : 1} 

          />

        </mesh>

  

        {/* 4. MIC REACTIVE LIGHTS */}

        {/* We map over the positions to create small bulbs */}

        {lightPositions.map((pos, i) => {

          let lightColor = '#ffaa00' // Default warm yellow

  

          if (era === 'present') {

            const presentColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

            lightColor = presentColors[i % presentColors.length]

          } else if (era === 'past') {

            lightColor = '#d4cdba' // Muted, vintage white/yellow

          } else if (era === 'future') {

            lightColor = '#00ffcc' // Neon glow

          }

  

          return (

            <mesh key={i} position={pos}>

              <sphereGeometry args={[0.06, 8, 8]} />

              <meshStandardMaterial 

                ref={material => lightsRefs.current[i] = material}

                color={lightColor}

                emissive={lightColor}

                emissiveIntensity={1}

                toneMapped={false}

              />

            </mesh>

          )

        })}

        {/* Hack: If we didn't attach ref to all, we need to ensure they share the material resource in a real app, 

            but simpler here: just copy the props or use instances. 

            For simplicity in this snippet, the animation logic above only targets the ref attached to the FIRST light. 

            To fix this simply without complex instancing: */}

  

  

         {/* 5. Future Matrix Particles */}

        {isFuture && (

           <Sparkles count={50} scale={3} size={2} speed={2} opacity={1} color="#00ffcc" noise={1} />

        )}

      </group>

    )

  }