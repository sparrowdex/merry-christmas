import React from 'react'

export function House({ era }) {
  const isPast = era === 'past'
  const isFuture = era === 'future'

  // Colors
  const wallColor = isPast ? '#8b5a2b' : (isFuture ? '#000000' : '#e8e8e8')
  const roofColor = isPast ? '#4a3c31' : (isFuture ? '#ff00ff' : '#2c3e50')
  const doorColor = isPast ? '#3b2a1e' : (isFuture ? '#00ffff' : '#5d4037')

  // Future Style: Wireframe with high glow
  const materialProps = isFuture 
    ? { wireframe: true, emissive: "#ff00ff", emissiveIntensity: 1.5, color: "#000" }
    : {}
  
  const doorMaterialProps = isFuture
    ? { wireframe: true, emissive: "#00ffff", emissiveIntensity: 2, color: "#000" }
    : {}

  return (
    <group position={[0.8, -1, -0.5]} rotation={[0, -0.5, 0]} scale={0.8}>
      
      {/* 1. Main House Block */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1.2]} />
        <meshStandardMaterial color={wallColor} {...materialProps} />
      </mesh>

      {/* 2. Roof */}
      {/* Using a Cylinder with 3 segments makes a perfect Triangular Prism (House Roof) */}
      {/* Rotate the prism 45deg on the Y-axis to align its flat sides */}
      <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        {isPast ? (
           // Past: Conical Thatched Roof
           <coneGeometry args={[1.1, 1.2, 4]} />
        ) : (
           // Present & Future: Standard Triangular Prism (a cylinder with 4 sides is a square prism)
           <cylinderGeometry args={[0, 1.1, 1, 4]} />
        )}
        <meshStandardMaterial color={roofColor} {...materialProps} />
      </mesh>

      {/* 3. The Door (Adds scale/realism) */}
      <mesh position={[0, 0.3, 0.61]}>
        <planeGeometry args={[0.4, 0.6]} />
        <meshStandardMaterial color={doorColor} {...doorMaterialProps} side={2} />
      </mesh>

      {/* 4. Future Extra Details (Cyber Pillars) */}
      {isFuture && (
        <>
          <mesh position={[-0.8, 0.5, 0.6]}>
             <boxGeometry args={[0.1, 2, 0.1]} />
             <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.8, 0.5, 0.6]}>
             <boxGeometry args={[0.1, 2, 0.1]} />
             <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
        </>
      )}

    </group>
  )
}