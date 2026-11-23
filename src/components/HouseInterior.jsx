import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Tree } from './Tree';
import { person, INK } from './silhouettes';
import { ROOM_ORIGIN } from '../tour';

// Room is 8 wide (x), 4 tall (y), 6.4 deep (z). Origin = centre of the floor.
const RW = 8;
const RH = 4;
const RD = 6.4;

const ERA_ROOM = {
  past: { wall: '#3d4a36', wainscot: '#2a1d14', floor: ['#5a3a22', '#4e321d'], rug: '#6b1e1e' },
  present: { wall: '#7a3b34', wainscot: '#f0e6d6', floor: ['#8a6440', '#7d5a38'], rug: '#1e4d6b' },
};

function makeTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, ctx };
}

function usePlanks(colors) {
  return useMemo(() => {
    const { tex } = makeTexture(256, 256, (ctx) => {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = colors[i % 2];
        ctx.fillRect(0, i * 32, 256, 32);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, i * 32, 256, 2);
        ctx.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }, [colors]);
}

// Snowy night seen through the room's window
function useNightTexture() {
  return useMemo(
    () =>
      makeTexture(256, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#0b1230');
        g.addColorStop(1, '#3a4a7a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#f4f8ff';
        ctx.beginPath();
        ctx.arc(190, 60, 22, 0, Math.PI * 2); // moon
        ctx.fill();
        ctx.fillRect(0, 200, 256, 56); // snowy ground
        for (let i = 0; i < 120; i++) {
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(Math.random() * 256, Math.random() * 200, 1 + Math.random() * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Window frame cross
        ctx.fillStyle = '#2b170c';
        ctx.fillRect(124, 0, 8, 256);
        ctx.fillRect(0, 124, 256, 8);
      }).tex,
    []
  );
}

// ---------- Silhouette standees ----------
const FIG_W = 192;
const FIG_H = 256;
const FIG_FLOOR = 250;
const FIG_HEIGHT = 2.0; // world units for the full canvas height

function Figure({ draw, position, active }) {
  const { tex, ctx } = useMemo(() => makeTexture(FIG_W, FIG_H, () => {}), []);
  const last = useRef(-1);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if ((!active && last.current >= 0) || t - last.current < 1 / 12) return;
    last.current = t;
    ctx.clearRect(0, 0, FIG_W, FIG_H);
    ctx.save();
    // Warm rim light from the fire/candles so the silhouettes read against the walls
    ctx.shadowColor = 'rgba(255,190,110,0.85)';
    ctx.shadowBlur = 14;
    draw(ctx, t);
    ctx.restore();
    tex.needsUpdate = true;
  });

  return (
    <Billboard position={position} lockX lockZ>
      <mesh position={[0, FIG_HEIGHT / 2 - ((FIG_H - FIG_FLOOR) / FIG_H) * FIG_HEIGHT, 0]}>
        <planeGeometry args={[(FIG_HEIGHT * FIG_W) / FIG_H, FIG_HEIGHT]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

const S = 2.9; // figure scale on the standee canvas
const X = 96;
const o = (extra) => ({ floor: FIG_FLOOR, ...extra });

function drawDog(ctx, t) {
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.ellipse(96, 205, 42, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(56, 185, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(46, 175, 6, 14, -0.4, 0, Math.PI * 2);
  ctx.fill();
  [66, 82, 112, 126].forEach((x) => ctx.fillRect(x, 215, 9, 35));
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(134, 198);
  ctx.lineTo(160, 178 + Math.sin(t * 14) * 10);
  ctx.stroke();
}

const FIGURES = {
  past: [
    {
      // Father carving
      pos: [-0.2, 0, -1.75],
      draw: (ctx, t) => {
        const k = person(ctx, X, S, o({ arm: 1.5 + Math.sin(t * 4) * 0.45, facing: 1 }));
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(k[0], k[1]);
        ctx.lineTo(k[0] + 26, k[1] + 10);
        ctx.stroke();
      },
    },
    {
      // Uncle raising a toast
      pos: [-1.8, 0, -0.9],
      draw: (ctx, t) => {
        ctx.fillStyle = INK;
        ctx.fillRect(X - 44, 110, 10, 140); // chair back
        const g = person(ctx, X - 20, S * 0.95, o({ seated: true, hat: true, arm: 2.3 + Math.sin(t * 1.4) * 0.35, facing: 1 }));
        ctx.fillRect(g[0] - 5, g[1] - 20, 10, 20);
      },
    },
    {
      // Grandma rocking & knitting by the fire
      pos: [1.6, 0, -2.0],
      draw: (ctx, t) => {
        ctx.save();
        ctx.translate(X, FIG_FLOOR);
        ctx.rotate(Math.sin(t * 1.4) * 0.06);
        ctx.translate(-X, -FIG_FLOOR);
        ctx.fillStyle = INK;
        ctx.fillRect(X + 40, 90, 10, 160);
        ctx.lineWidth = 7;
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.arc(X, 160, 95, Math.PI * 0.32, Math.PI * 0.68);
        ctx.stroke();
        const k = person(ctx, X + 10, S * 0.95, o({ seated: true, bun: true, facing: -1, arm: 1.3 + Math.sin(t * 6) * 0.15 }));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(k[0] - 14, k[1] - 14);
        ctx.lineTo(k[0] + 10, k[1] + 8);
        ctx.moveTo(k[0] + 8, k[1] - 14);
        ctx.lineTo(k[0] - 12, k[1] + 8);
        ctx.stroke();
        ctx.restore();
      },
    },
    {
      // Child hanging an ornament
      pos: [-2.0, 0, -1.5],
      draw: (ctx, t) => {
        const h = person(ctx, X, S * 0.6, o({ dress: true, arm: 2.7 + Math.sin(t * 2) * 0.2, facing: -1 }));
        ctx.beginPath();
        ctx.arc(h[0], h[1] - 8, 7, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      // Child dancing
      pos: [-1.1, 0, -2.4],
      draw: (ctx, t) => person(ctx, X, S * 0.55, o({ arm: 2.4 + Math.sin(t * 5) * 0.5, bob: -Math.abs(Math.sin(t * 4)) * 14, facing: 1 })),
    },
  ],
  present: [
    {
      // Mum setting the table
      pos: [-0.2, 0, -1.75],
      draw: (ctx, t) => {
        const h = person(ctx, X, S, o({ bun: true, dress: true, arm: 1.4 + Math.sin(t * 1.2) * 0.15, facing: 1 }));
        ctx.beginPath();
        ctx.ellipse(h[0] + 6, h[1], 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    {
      // Dad taking a photo
      pos: [0.9, 0, 0.0],
      draw: (ctx, t) => {
        const h = person(ctx, X, S, o({ arm: 2.4, facing: -1 }));
        ctx.fillRect(h[0] - 14, h[1] - 18, 12, 20);
        if (Math.sin(t * 1.3) > 0.97) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(h[0] - 8, h[1] - 12, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    {
      // Grandpa asleep by the fire
      pos: [1.6, 0, -2.0],
      draw: (ctx, t) => {
        ctx.fillStyle = INK;
        ctx.fillRect(X + 30, 110, 40, 140);
        person(ctx, X, S * 0.95, o({ seated: true, facing: -1, arm: 0.5, bob: Math.sin(t * 0.8) * 3 }));
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,240,220,0.9)';
        ctx.font = 'bold 22px Georgia';
        const z = (t * 0.6) % 1;
        ctx.globalAlpha = 1 - z;
        ctx.fillText('z', X - 30, 70 - z * 40);
        ctx.fillText('Z', X - 18, 50 - z * 40);
        ctx.globalAlpha = 1;
      },
    },
    {
      // Kid with the biggest present
      pos: [-2.0, 0, -1.5],
      draw: (ctx, t) => {
        const h = person(ctx, X, S * 0.62, o({ arm: 2.9, bob: -Math.abs(Math.sin(t * 4)) * 16, facing: -1 }));
        ctx.fillStyle = INK;
        ctx.fillRect(h[0] - 22, h[1] - 34, 44, 34);
        ctx.fillRect(h[0] - 4, h[1] - 48, 8, 14);
      },
    },
    { pos: [2.4, 0, -1.2], draw: drawDog },
  ],
};

function Fireplace() {
  const flames = useRef([]);
  const lightRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    flames.current.forEach((m, i) => {
      if (m) m.scale.y = 1 + Math.sin(t * 11 + i * 2) * 0.25 + Math.sin(t * 7 + i) * 0.15;
    });
    if (lightRef.current) lightRef.current.intensity = 6 + Math.sin(t * 13) * 1.2 + Math.sin(t * 7.7) * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.0, 1.6, 0.5]} />
        <meshStandardMaterial color="#6e6258" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.5, 0.2]}>
        <boxGeometry args={[1.1, 0.9, 0.2]} />
        <meshStandardMaterial color="#120804" />
      </mesh>
      <mesh position={[0, 1.65, 0.1]}>
        <boxGeometry args={[2.3, 0.12, 0.7]} />
        <meshStandardMaterial color="#3b2416" roughness={0.7} />
      </mesh>
      {[-0.65, 0, 0.65].map((x, i) => (
        <mesh key={x} position={[x, 1.42, 0.42]}>
          <boxGeometry args={[0.16, 0.34, 0.06]} />
          <meshStandardMaterial color={['#a3201a', '#1f6b35', '#a3201a'][i]} />
        </mesh>
      ))}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={x} ref={(el) => (flames.current[i] = el)} position={[x, 0.3, 0.3]}>
          <coneGeometry args={[0.14, 0.5, 10]} />
          <meshBasicMaterial color={i === 1 ? '#ffd27a' : '#ff8a2a'} toneMapped={false} />
        </mesh>
      ))}
      <Sparkles count={20} scale={[0.8, 0.8, 0.3]} position={[0, 0.7, 0.3]} size={3} speed={1.5} color="#ffb347" />
      <pointLight ref={lightRef} position={[0, 0.6, 0.9]} color="#ff9a4a" intensity={6} distance={7} decay={1.5} />
    </group>
  );
}

function FeastTable({ era }) {
  return (
    <group>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#3b2416" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.5, 0.18, 1.3]} />
        <meshStandardMaterial color={era === 'past' ? '#e8dcc0' : '#b3202a'} roughness={0.9} />
      </mesh>
      {[[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.37, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.74, 8]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
      ))}
      {/* Turkey on a platter */}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.03, 24]} />
        <meshStandardMaterial color="#f4f4f4" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.98, 0]} scale={[1.25, 0.85, 1]}>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#9a5a22" roughness={0.45} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.24, 0.95, 0.08]} rotation={[0, 0, s * 0.9]}>
          <capsuleGeometry args={[0.05, 0.14, 4, 8]} />
          <meshStandardMaterial color="#8a4e1c" roughness={0.45} />
        </mesh>
      ))}
      {/* Plates + candles */}
      {[-0.8, 0.8].map((x) => (
        <group key={x}>
          {[-0.35, 0.35].map((z) => (
            <mesh key={z} position={[x, 0.835, z]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 20]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          <mesh position={[x * 0.55, 0.98, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#f5ecd6" />
          </mesh>
          <mesh position={[x * 0.55, 1.16, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#ffc46b" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function HouseInterior({ era, active }) {
  const style = ERA_ROOM[era] || ERA_ROOM.present;
  const floorTex = usePlanks(style.floor);
  const nightTex = useNightTexture();
  const figures = FIGURES[era] || FIGURES.present;

  return (
    <group position={ROOM_ORIGIN}>
      {/* Floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial map={floorTex} roughness={0.8} />
      </mesh>
      <mesh position={[0, RH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#2a201a" />
      </mesh>
      {/* Walls */}
      {[
        [[0, RH / 2, -RD / 2], [0, 0, 0], RW],
        [[0, RH / 2, RD / 2], [0, Math.PI, 0], RW],
        [[-RW / 2, RH / 2, 0], [0, Math.PI / 2, 0], RD],
        [[RW / 2, RH / 2, 0], [0, -Math.PI / 2, 0], RD],
      ].map(([p, r, w], i) => (
        <group key={i} position={p} rotation={r}>
          <mesh>
            <planeGeometry args={[w, RH]} />
            <meshStandardMaterial color={style.wall} roughness={0.9} />
          </mesh>
          <mesh position={[0, -RH / 2 + 0.5, 0.01]}>
            <planeGeometry args={[w, 1]} />
            <meshStandardMaterial color={style.wainscot} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Window on the left wall */}
      <mesh position={[-RW / 2 + 0.02, 2.1, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={nightTex} toneMapped={false} />
      </mesh>
      <pointLight position={[-RW / 2 + 0.6, 2.1, 0.6]} color="#9fb8ff" intensity={1.2} distance={4} />

      {/* Rug */}
      <mesh position={[0, 0.01, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 40]} />
        <meshStandardMaterial color={style.rug} roughness={1} />
      </mesh>

      <group position={[2.5, 0, -RD / 2 + 0.25]}>
        <Fireplace />
      </group>
      <group position={[-0.2, 0, -0.9]}>
        <FeastTable era={era} />
      </group>
      {/* Warm chandelier light over the table */}
      <pointLight position={[-0.2, 3.2, -0.9]} color="#ffd9a0" intensity={4} distance={8} decay={1.5} />

      <group position={[-2.9, 0, -2.4]} scale={1.45}>
        <Tree era={era} />
      </group>

      {figures.map((f, i) => (
        <Figure key={`${era}-${i}`} draw={f.draw} position={f.pos} active={active} />
      ))}
    </group>
  );
}
