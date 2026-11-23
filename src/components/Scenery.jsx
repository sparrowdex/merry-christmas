import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DRAW, drawFrame, W, H } from './silhouettes';
import { GROUND_Y } from '../utils/terrain';

export function useSilhouetteTexture(era) {
  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { ctx: canvas.getContext('2d'), texture };
  }, []);
  const last = useRef(-1);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (t - last.current < 1 / 15) return; // ~15fps is plenty for shadow puppets
    last.current = t;
    ctx.save();
    (DRAW[era] || DRAW.present)(ctx, t);
    drawFrame(ctx, era.startsWith('past') ? 'past' : 'present');
    ctx.restore();
    texture.needsUpdate = true;
  });

  return texture;
}

function WindowPane({ texture, size, ...props }) {
  return (
    <mesh {...props}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// ============================================================
//  HOUSES
// ============================================================
function useGableRoofGeometry(halfWidth, height, depth) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth, 0);
    shape.lineTo(halfWidth, 0);
    shape.lineTo(0, height);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [halfWidth, height, depth]);
}

// Shared cottage body, styled per era
// variant: optional { wall, roof, door, tudor, shutters, chimneyX } so village houses all look different
export function Cottage({ era, texture, variant = {} }) {
  const isPast = era === 'past';
  const wall = variant.wall || (isPast ? '#7a5a3f' : '#9c3a30');
  const roof = variant.roof || (isPast ? '#3b2a20' : '#2f3b4a');
  const chimneyX = variant.chimneyX ?? 0.3;
  const roofGeo = useGableRoofGeometry(0.6, 0.45, 0.86);
  const slope = Math.atan2(0.45, 0.6);
  const lightsRef = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    lightsRef.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 1.5 + Math.sin(t * 3 + i) * 1.2;
    });
  });

  // String lights along the front eaves (present only)
  const eaveLights = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const x = -0.6 + f * 1.2;
      const y = 0.62 + (0.45 - Math.abs(x) * 0.75) + 0.02;
      out.push([x, y, 0.44]);
    }
    return out;
  }, []);
  const bulbColors = ['#ff3030', '#30ff60', '#3070ff', '#ffdd30'];

  return (
    <group>
      {/* Walls */}
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[1.0, 0.62, 0.75]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>

      {/* Roof + snow */}
      <mesh geometry={roofGeo} position={[0, 0.62, 0]}>
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * (0.3 + 0.6 * 0.03), 0.62 + 0.225 + 0.8 * 0.03, 0]}
          rotation={[0, 0, -side * slope]}
        >
          <boxGeometry args={[0.78, 0.05, 0.9]} />
          <meshStandardMaterial color="#f4f8ff" roughness={1} />
        </mesh>
      ))}

      {/* Chimney */}
      <mesh position={[chimneyX, 0.98, -0.15]}>
        <boxGeometry args={[0.14, 0.3, 0.14]} />
        <meshStandardMaterial color="#5a2e22" roughness={0.9} />
      </mesh>
      <mesh position={[chimneyX, 1.14, -0.15]}>
        <boxGeometry args={[0.17, 0.04, 0.17]} />
        <meshStandardMaterial color="#f4f8ff" />
      </mesh>

      {/* Tudor half-timbering */}
      {variant.tudor &&
        [[-0.48, 0.31, 0.05, 0.62], [0.48, 0.31, 0.05, 0.62], [0, 0.6, 1.0, 0.04], [0, 0.03, 1.0, 0.04]].map(([x, y, w, h], i) => (
          <mesh key={'beam' + i} position={[x, y, 0.38]}>
            <boxGeometry args={[w, h, 0.02]} />
            <meshStandardMaterial color="#2a1a10" roughness={0.9} />
          </mesh>
        ))}
      {/* Shutters */}
      {variant.shutters &&
        [-0.47, 0.19].map((x) => (
          <mesh key={'sh' + x} position={[x, 0.33, 0.385]}>
            <boxGeometry args={[0.09, 0.36, 0.015]} />
            <meshStandardMaterial color={variant.shutters} roughness={0.8} />
          </mesh>
        ))}

      {/* Big silhouette windows, front and back */}
      <WindowPane texture={texture} size={[0.56, 0.35]} position={[-0.14, 0.33, 0.377]} />
      <WindowPane texture={texture} size={[0.64, 0.4]} position={[0, 0.33, -0.377]} rotation={[0, Math.PI, 0]} />
      {/* Snowy sills */}
      <mesh position={[-0.14, 0.14, 0.39]}>
        <boxGeometry args={[0.6, 0.03, 0.05]} />
        <meshStandardMaterial color="#f4f8ff" />
      </mesh>

      {/* Door */}
      <mesh position={[0.32, 0.19, 0.377]}>
        <planeGeometry args={[0.18, 0.36]} />
        <meshStandardMaterial color={variant.door || (isPast ? '#2b170c' : '#1f4d2b')} />
      </mesh>
      <mesh position={[0.37, 0.18, 0.385]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
      </mesh>
      {!isPast && (
        <mesh position={[0.32, 0.29, 0.39]}>
          <torusGeometry args={[0.055, 0.018, 8, 20]} />
          <meshStandardMaterial color="#1b6e3c" />
        </mesh>
      )}

      {/* Side windows: plain warm glow */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * 0.501, 0.36, 0]} rotation={[0, side * Math.PI / 2, 0]}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color="#ffc46b" toneMapped={false} />
        </mesh>
      ))}

      {/* Present: string lights on the eaves */}
      {!isPast &&
        eaveLights.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial
              ref={(m) => (lightsRef.current[i] = m)}
              color={bulbColors[i % 4]}
              emissive={bulbColors[i % 4]}
              toneMapped={false}
            />
          </mesh>
        ))}

    </group>
  );
}

// ============================================================
//  SMALL ERA PROPS
// ============================================================
function GasLamp() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.015, 0.025, 0.7, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[0.09, 0.12, 0.09]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <coneGeometry args={[0.08, 0.06, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

function Snowman() {
  return (
    <group>
      {[[0, 0.13, 0.15], [0, 0.34, 0.11], [0, 0.5, 0.08]].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[r, 20, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.015, 0.08, 8]} />
        <meshStandardMaterial color="#ff7a1a" />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.085, 0.022, 8, 20]} />
        <meshStandardMaterial color="#d4202a" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 0.565, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 16]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
}

function Drone() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = 0.6 + Math.sin(t * 2) * 0.08;
      ref.current.rotation.y = t;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.06, 0.03, 20]} />
        <meshStandardMaterial color="#cfd6de" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.008, 6, 30]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

// ============================================================
//  GROUND + MAIN
// ============================================================

// Mounds safely contained inside the globe (max outer radius < 1.1, well within globe boundary ~1.64)
const SNOW_MOUNDS = [
  { pos: [-0.2, 0, 0.35], scale: [0.45, 0.12, 0.45] },
  { pos: [0.35, 0, -0.4], scale: [0.4, 0.1, 0.4] },
  { pos: [-0.6, 0, 0.15], scale: [0.38, 0.09, 0.38] },
  { pos: [0.15, 0, -0.2], scale: [0.48, 0.11, 0.48] },
  { pos: [-0.25, 0, -0.65], scale: [0.36, 0.08, 0.36] },
  { pos: [0.55, 0, 0.2], scale: [0.35, 0.09, 0.35] },
];

function SnowGround() {
  return (
    <group position={[0, GROUND_Y, 0]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.6, 1.05, 0.4, 48]} />
        <meshStandardMaterial color="#f4f8ff" roughness={1} />
      </mesh>
      {SNOW_MOUNDS.map((m, i) => (
        <mesh key={i} position={m.pos} scale={m.scale}>
          <sphereGeometry args={[1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f4f8ff" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// The NUMBER of lights never changes between eras (only colour/intensity),
// otherwise three.js recompiles every shader and the time-travel transition stutters.
const ERA_LIGHTS = {
  past:    { house: '#ffb45c', houseI: 1.5, prop: '#ffc46b', propI: 1.2 },
  present: { house: '#ffb45c', houseI: 1.5, prop: '#ffffff', propI: 0 },
  future:  { house: '#00ffcc', houseI: 0,   prop: '#ff00ff', propI: 1.0 },
};

export function Scenery({ era }) {
  const texture = useSilhouetteTexture(era);
  const L = ERA_LIGHTS[era] || ERA_LIGHTS.present;
  const housePos = [0.85, GROUND_Y, 0.35];

  return (
    <group>
      <SnowGround />

      {/* House with silhouette windows (past + present). The future globe has no house. */}
      {era !== 'future' && (
        <group position={housePos} rotation={[0, -0.35, 0]} scale={0.85}>
          <Cottage era={era} texture={texture} />
        </group>
      )}
      <pointLight position={[housePos[0] + 0.2, GROUND_Y + 0.3, housePos[2] + 0.6]} color={L.house} intensity={L.houseI} distance={2} />
      <pointLight position={[housePos[0] - 0.2, GROUND_Y + 0.3, housePos[2] - 0.6]} color={L.house} intensity={L.houseI * 0.8} distance={2} />

      <group position={[0.15, GROUND_Y, 1.15]}>
        {era === 'past' && <GasLamp />}
        {era === 'present' && <Snowman />}
        {era === 'future' && <Drone />}
        <pointLight position={[0, 0.7, 0]} color={L.prop} intensity={L.propI} distance={1.5} />
      </group>
    </group>
  );
}
