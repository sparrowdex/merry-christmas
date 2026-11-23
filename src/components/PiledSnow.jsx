import React, { useRef, useMemo } from 'react';
import { Moon, PastVillage, SantaSleigh, FutureKid, FutureTown } from './SnowWorlds';
import { groundHeight } from '../utils/terrain';
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

// --- SUB-COMPONENT: The North Star ---
// Drawn like a real bright star seen through the atmosphere / a lens:
// a hot white core, soft halo and thin diffraction rays that fade out.
function createStarTexture() {
  const size = 512;
  const c = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Soft halo
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, 'rgba(255,255,255,1)');
  halo.addColorStop(0.04, 'rgba(255,255,255,0.95)');
  halo.addColorStop(0.1, 'rgba(210,230,255,0.45)');
  halo.addColorStop(0.3, 'rgba(160,200,255,0.12)');
  halo.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Diffraction rays: long thin cross + shorter faint diagonals
  const ray = (angle, length, width, alpha) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, length, 0);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.3, `rgba(220,235,255,${alpha * 0.4})`);
    g.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 4; i++) ray((i * Math.PI) / 2, c, 3, 0.9);
  for (let i = 0; i < 4; i++) ray((i * Math.PI) / 2 + Math.PI / 4, c * 0.45, 1.5, 0.45);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function NorthStar({ growth }) {
  const starPosition = [15, 25, -45];
  const texture = useMemo(() => createStarTexture(), []);
  const flareRef = useRef();
  const glowRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const growthProgress = growth.current;
    if (lightRef.current) lightRef.current.intensity = 2.5 * growthProgress;
    const t = state.clock.getElapsedTime();
    // Atmospheric twinkle: a few overlapping frequencies so it never looks looped
    const twinkle = 1 + Math.sin(t * 3.1) * 0.06 + Math.sin(t * 7.7) * 0.04 + Math.sin(t * 13.3) * 0.02;
    if (flareRef.current) {
      flareRef.current.scale.setScalar(14 * twinkle * growthProgress);
      flareRef.current.material.rotation = Math.sin(t * 0.2) * 0.03;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(30 * growthProgress);
      glowRef.current.material.opacity = 0.18 * twinkle;
    }
  });

  return (
    <group position={starPosition}>
      <pointLight ref={lightRef} color="#cceeff" intensity={0} distance={150} decay={2} />
      {/* Wide, very faint sky glow */}
      <sprite ref={glowRef} scale={0}>
        <spriteMaterial map={texture} color="#9cc4ff" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      {/* Core + rays */}
      <sprite ref={flareRef} scale={0}>
        <spriteMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
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
    <group scale={[scale, scale, scale]}>
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
// Era-specific scale-in worlds. Each is anchored at the origin and grows in with the snow.
function EraWorld({ era }) {
  if (era === 'past') return <PastVillage />;
  if (era === 'future') return (
    <>
      <FutureTown />
      <FutureKid />
    </>
  );
  return (
    <>
      <group position={[-7, groundHeight(-7, -13) + 0.3, -13]} rotation={[0, 0.5, 0]}>
        <GingerbreadHouse scale={1} />
      </group>
      <SantaSleigh />
    </>
  );
}

export function PiledSnow({ isSnowing, era }) {
  const meshRef = useRef();
  const groundRef = useRef();
  const worldRef = useRef();
  const growth = useRef(0);
  const progress = useRef(0); // linear 0..1 timeline, eased into growth

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

  // 2. GROUND GEOMETRY (heights must match groundHeight() in SnowWorlds.jsx)
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
    // Fixed-length eased rise (4s in, 1.5s out) so the world fully arrives instead of creeping
    const step = Math.min(delta, 1 / 30) / (isSnowing ? 4 : 1.5);
    progress.current = THREE.MathUtils.clamp(progress.current + (isSnowing ? step : -step), 0, 1);
    const g = THREE.MathUtils.smootherstep(progress.current, 0, 1);
    growth.current = g;

    if (meshRef.current) meshRef.current.scale.setScalar(g);
    if (groundRef.current) {
      groundRef.current.scale.setScalar(g);
      groundRef.current.material.opacity = Math.max(0, g);
    }
    if (worldRef.current) {
      // Rise up out of the snow rather than scaling from the centre of the scene
      worldRef.current.position.y = (1 - g) * -12;
      worldRef.current.visible = g > 0.01;
    }
  });

  return (
    <>
      <NorthStar growth={growth} />
      <Moon />

      <mesh ref={meshRef} geometry={standGeometry} position={[0, -2.3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0, 0, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      <mesh ref={groundRef} geometry={groundGeometry} position={[0, -6, -10]} rotation={[-Math.PI / 2, 0, 0]} scale={[0, 0, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0} />
      </mesh>

      <group ref={worldRef} visible={false}>
        <EraWorld era={era} />
      </group>
    </>
  );
}
