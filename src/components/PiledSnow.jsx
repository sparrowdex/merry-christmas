import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- HELPER: Generate procedural noise texture for cookie walls ---
function createNoiseTexture() {
  const width = 256;
  const height = 256;
  const size = width * height;
  const data = new Uint8Array(4 * size);

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    const value = Math.random() * 255;
    data[stride] = value * 0.6;     // R
    data[stride + 1] = value * 0.3; // G
    data[stride + 2] = value * 0.1; // B
    data[stride + 3] = 255;         // A
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

// --- UPDATED SUB-COMPONENT: The Realistic North Star ---
function NorthStar({ growthProgress = 0 }) {
  const starPosition = [15, 25, -45];

  return (
    <group position={starPosition} scale={growthProgress}>
      {/* 1. Light Source */}
      <pointLight 
        color="#cceeff" 
        intensity={2.5} 
        distance={150} 
        decay={2}      
      />

      {/* 2. Core */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* 3. The "Ninja Star" Spikes (Lens Flare) 
          Using additive blending makes them look like light rays.
      */}
      {/* Group for the main cross */}
      <group>
        {/* Vertical Spike */}
        <mesh position={[0, 3.5, 0]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -3.5, 0]} rotation={[Math.PI, 0, 0]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Horizontal Spike */}
        <mesh position={[3.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[-3.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Group for the smaller diagonal cross */}
      <group rotation={[0, 0, Math.PI/4]} scale={[0.6, 0.6, 0.6]}>
        <mesh position={[0, 3.5, 0]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -3.5, 0]} rotation={[Math.PI, 0, 0]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[3.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[-3.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <coneGeometry args={[0.15, 7, 8]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* 4. Seamless Glow (Additive spheres) */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.25} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.15} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
       <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.05} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// --- SUB-COMPONENT: Gingerbread House ---
function GingerbreadHouse({ scale = 0 }) {
  const materials = useMemo(() => {
    const texture = createNoiseTexture();
    const cookie = new THREE.MeshStandardMaterial({ 
      map: texture, bumpMap: texture, bumpScale: 0.2,
      color: "#8B4513", roughness: 0.8 
    });
    const snow = new THREE.MeshStandardMaterial({ color: "white", roughness: 1 });
    const icing = new THREE.MeshStandardMaterial({ 
      color: "#EEE", roughness: 0.4, emissive: "#FFF", emissiveIntensity: 0.1 
    });
    const windowBlue = new THREE.MeshStandardMaterial({ 
        color: "#87CEEB", roughness: 0.2, emissive: "#87CEEB", emissiveIntensity: 0.2
    });
    return { cookie, snow, icing, windowBlue };
  }, []);

  const drips = useMemo(() => {
    const items = [];
    // Y position adjusted to match the bottom edge of the roof
    const dripY = 3.3; 
    
    // FIX: Recalculated positions to match the roof edge exactly.
    // Roof Radius = 3.6. Rotated 45deg = Square aligned to axes.
    // Distance to face = 3.6 * cos(45) = ~2.54.
    // Front/Back scaled by 0.85 = ~2.16. 
    
    const zOffset = 2.2; // Adjusted from 2.05 to 2.2 to push drips out
    const xOffset = 2.6; // Adjusted from 2.45 to 2.6 to push drips out

    // Front/Back
    for(let x = -2.4; x <= 2.4; x += 0.25) {
       const s = 0.15 + Math.random() * 0.15; 
       const rX = (Math.random() - 0.5) * 0.1; 
       // Front
       items.push(<mesh key={`f-${x}`} position={[x+rX, dripY, zOffset]} material={materials.snow}><sphereGeometry args={[s, 8, 8]} /></mesh>);
       // Back
       items.push(<mesh key={`b-${x}`} position={[x+rX, dripY, -zOffset]} material={materials.snow}><sphereGeometry args={[s, 8, 8]} /></mesh>);
    }
    
    // Left/Right
    for(let z = -1.9; z <= 1.9; z += 0.25) {
      const s = 0.15 + Math.random() * 0.15;
      const rZ = (Math.random() - 0.5) * 0.1;
      // Left
      items.push(<mesh key={`l-${z}`} position={[-xOffset, dripY, z+rZ]} material={materials.snow}><sphereGeometry args={[s, 8, 8]} /></mesh>);
      // Right
      items.push(<mesh key={`r-${z}`} position={[xOffset, dripY, z+rZ]} material={materials.snow}><sphereGeometry args={[s, 8, 8]} /></mesh>);
    }
    return items;
  }, [materials]);

  return (
    <group position={[0, -5.5, -12]} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.5, 0]} material={materials.cookie}>
        <boxGeometry args={[4.5, 3.5, 3.5]} />
      </mesh>
      <group position={[0, 4.5, 0]} scale={[1, 1, 0.85]}>
          <mesh rotation={[0, Math.PI / 4, 0]} position={[0, 0, 0]} material={materials.cookie}>
             <cylinderGeometry args={[0, 3.4, 2.5, 4]} /> 
          </mesh>
          <mesh rotation={[0, Math.PI / 4, 0]} position={[0, 0.25, 0]} material={materials.snow}>
             <cylinderGeometry args={[0, 3.6, 2.6, 4]} />
          </mesh>
      </group>
      <mesh position={[1.0, 4.5, -0.8]} material={materials.cookie}>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
      </mesh>
      <mesh position={[1.0, 5.1, -0.8]} material={materials.snow}>
        <boxGeometry args={[1.0, 0.3, 1.0]} />
      </mesh>
      {drips}
      <group position={[0, 0.5, 1.8]}>
        <mesh position={[0, 0, 0]} material={materials.icing}>
           <boxGeometry args={[1.4, 2.0, 0.1]} />
        </mesh>
        <mesh position={[0, 0, 0.15]} material={materials.cookie}>
          <planeGeometry args={[1.1, 1.8]} />
        </mesh>
        <mesh position={[0.4, 0, 0.3]}>
           <sphereGeometry args={[0.12]} />
           <meshStandardMaterial color="gold" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
      {[-1.5, 1.5].map((x, i) => (
         <group key={i} position={[x, 1.8, 1.8]}>
            <mesh material={materials.icing}>
               <boxGeometry args={[1.2, 1.2, 0.1]} />
            </mesh>
             <mesh position={[0,0,0.15]} material={materials.windowBlue}>
               <planeGeometry args={[0.9, 0.9]} />
            </mesh>
            <mesh position={[0,0,0.25]} material={materials.icing}>
               <boxGeometry args={[0.1, 0.9, 0.05]} />
            </mesh>
             <mesh position={[0,0,0.25]} material={materials.icing}>
               <boxGeometry args={[0.9, 0.1, 0.05]} />
            </mesh>
            <mesh position={[0, -0.5, 0.2]} material={materials.snow}>
               <boxGeometry args={[1.3, 0.2, 0.2]} />
            </mesh>
         </group>
      ))}
      {[-1.8, -1, 1, 1.8].map((x, i) => (
          <mesh key={`candy-${i}`} position={[x, 0, 1.8]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#ff0000" : "#00ff00"} emissive={i % 2 === 0 ? "#550000" : "#005500"} emissiveIntensity={0.5} />
          </mesh>
      ))}
    </group>
  );
}

// --- MAIN COMPONENT ---
export function PiledSnow({ isSnowing }) {
  const meshRef = useRef();
  const groundRef = useRef();
  const [growthProgress, setGrowthProgress] = useState(0);

  // 1. STAND SNOW
  const standGeometry = useMemo(() => {
    const geo = new THREE.TorusGeometry(2.3, 0.2, 16, 50);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x += (Math.random() - 0.5) * 0.1;
      v.y += (Math.random() - 0.5) * 0.1;
      v.z += (Math.random() - 0.5) * 0.1;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. GROUND GEOMETRY
  const groundGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 128, 128); 
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      let height = Math.sin(v.x * 0.15) * 1.2; 
      height += Math.cos(v.y * 0.2) * 1.0;     
      height += Math.sin(v.x * 0.5 + v.y * 0.5) * 0.3; 
      v.z = height; 
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state, delta) => {
    const targetScale = isSnowing ? 1 : 0;
    const speed = isSnowing ? 0.3 : 1.5; 
    let newProgress = THREE.MathUtils.lerp(growthProgress, targetScale, delta * speed);
    setGrowthProgress(newProgress);

    if (meshRef.current) {
      meshRef.current.scale.setScalar(newProgress);
    }

    if (groundRef.current) {
      groundRef.current.scale.setScalar(newProgress);
      groundRef.current.material.opacity = Math.max(0, newProgress); 
    }
  });

  return (
    <>
      <NorthStar growthProgress={growthProgress} />

      <mesh 
        ref={meshRef} 
        geometry={standGeometry}
        position={[0, -2.3, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0, 0, 0]}
      >
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      <mesh
        ref={groundRef}
        geometry={groundGeometry}
        position={[0, -6, -10]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        scale={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={1}
          transparent={true} 
          opacity={0}
        />
      </mesh>

      <GingerbreadHouse scale={growthProgress} />
    </>
  );
}