import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Cottage, useSilhouetteTexture } from './Scenery';
import { person, INK } from './silhouettes';
import { groundHeight } from '../utils/terrain';

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, ctx, canvas };
}

// ============================================================
//  MOON (all eras)
// ============================================================
export function Moon({ position = [-8, 11, -40], size = 6 }) {
  const { tex } = useMemo(
    () =>
      canvasTexture(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,250,235,1)');
        g.addColorStop(0.38, 'rgba(245,240,220,1)');
        g.addColorStop(0.42, 'rgba(255,245,220,0.35)');
        g.addColorStop(1, 'rgba(255,240,210,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        // Craters / maria
        [[110, 105, 18], [150, 140, 24], [120, 160, 12], [158, 98, 10], [95, 135, 9]].forEach(([x, y, r]) => {
          ctx.fillStyle = 'rgba(190,180,160,0.35)';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }),
    []
  );
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

// ============================================================
//  PAST: Victorian village
// ============================================================
function Church() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.2, 2.4, 3.2]} />
        <meshStandardMaterial color="#6e6258" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4 + 0.7, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1.05]}>
        <boxGeometry args={[1.6, 1.6, 3.2]} />
        <meshStandardMaterial color="#f4f8ff" roughness={1} />
      </mesh>
      {/* Tower + spire */}
      <mesh position={[0, 2.6, 1.9]}>
        <boxGeometry args={[1.0, 5.2, 1.0]} />
        <meshStandardMaterial color="#655a50" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.4, 1.9]}>
        <coneGeometry args={[0.8, 2.6, 4]} />
        <meshStandardMaterial color="#2f2a26" roughness={0.8} />
      </mesh>
      {/* Lit arched windows */}
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[1.11, 1.3, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.45, 0.9]} />
          <meshBasicMaterial color="#ffc46b" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, 2.41]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
    </group>
  );
}

function LampPost() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2.4, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <coneGeometry args={[0.26, 0.22, 4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// ---------- Cobblestone roads ----------
function makeCobbleTexture() {
  const tex = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#d9dee4'; // snow packed in the gaps
    ctx.fillRect(0, 0, 256, 256);
    const rowH = 32;
    for (let row = 0; row < 8; row++) {
      let x = row % 2 ? -18 : 0;
      while (x < 256) {
        const w = 26 + Math.random() * 14;
        const shade = 80 + Math.floor(Math.random() * 40);
        ctx.fillStyle = 'rgb(' + shade + ',' + (shade - 6) + ',' + (shade - 12) + ')';
        ctx.beginPath();
        ctx.roundRect(x + 2, row * rowH + 2, w - 4, rowH - 4, 9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.roundRect(x + 4, row * rowH + 4, w - 10, 8, 5);
        ctx.fill();
        if (Math.random() < 0.25) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.ellipse(x + w / 2, row * rowH + rowH / 2, w * 0.3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        x += w;
      }
    }
  }).tex;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function useRoadGeometry(points, width) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const len = curve.getLength();
    const N = Math.max(20, Math.ceil(len * 3));
    const ACROSS = 4;
    const pos = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const p = curve.getPointAt(u);
      const tan = curve.getTangentAt(u);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      for (let j = 0; j <= ACROSS; j++) {
        const off = (j / ACROSS - 0.5) * width;
        const x = p.x + side.x * off;
        const z = p.z + side.z * off;
        pos.push(x, groundHeight(x, z) + 0.08, z);
        uv.push(j / ACROSS, (u * len) / width);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < ACROSS; j++) {
        const a = i * (ACROSS + 1) + j;
        const b = a + ACROSS + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, [points, width]);
}

function Road({ points, width, texture }) {
  const geo = useRoadGeometry(points, width);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial map={texture} roughness={0.95} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

// ---------- Carolers (flat silhouette standees, gently swaying) ----------
function Carolers() {
  const { tex, ctx } = useMemo(() => canvasTexture(256, 160, () => { }), []);
  const last = useRef(-1);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (t - last.current < 1 / 12) return;
    last.current = t;
    ctx.clearRect(0, 0, 256, 160);
    const sway = (i) => Math.sin(t * 1.8 + i) * 0.12;
    [[60, 1, { hat: true }], [128, 1, { bun: true, dress: true }], [190, 0.62, {}]].forEach(([x, s, o], i) => {
      const hand = person(ctx, x, s, { ...o, arm: 1.7 + sway(i), facing: 1 });
      ctx.fillStyle = INK;
      ctx.fillRect(hand[0] - 2, hand[1] - 8, 12 * s, 9 * s); // songbook
    });
    tex.needsUpdate = true;
  });
  return (
    <Billboard lockX lockZ>
      <mesh position={[0, 0.95, 0]}>
        <planeGeometry args={[3, 1.875]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  );
}

// ---------- The village ----------
const MAIN_ROAD = [[0.5, 6], [-1.2, 0], [0.8, -6], [-0.6, -11], [1.2, -16], [0.5, -21.5]];

const VILLAGE_HOUSES = [
  { x: -10, z: -15, r: 0.5, s: 3.0, scene: 'pastDinner', variant: {} },
  { x: -5.5, z: -19, r: 0.25, s: 2.6, scene: 'pastTree', variant: { wall: '#8b8174', roof: '#4a2e24', tudor: true, chimneyX: -0.3 } },
  { x: 6, z: -17, r: -0.4, s: 3.0, scene: 'pastDance', variant: { wall: '#5e3b2e', roof: '#2f3b30', shutters: '#3b4a3a', door: '#5a1a14' } },
  { x: 11.5, z: -12.5, r: -0.6, s: 2.6, scene: 'pastStory', variant: { wall: '#a89a80', tudor: true, shutters: '#2a1a10', chimneyX: -0.25 } },
  { x: -14, z: -22, r: 0.6, s: 2.4, scene: 'pastStory', variant: { wall: '#6e5a48', roof: '#2b2b33', shutters: '#5a1a14' } },
  { x: 15, z: -21, r: -0.7, s: 2.4, scene: 'pastTree', variant: { wall: '#7d6a55', roof: '#3a2620', tudor: true } },
];

// Point just outside a house's front door, in world space
function doorstep(h) {
  const lx = 0.32 * h.s;
  const lz = (0.377 + 0.5) * h.s;
  return [h.x + lx * Math.cos(h.r) + lz * Math.sin(h.r), h.z - lx * Math.sin(h.r) + lz * Math.cos(h.r)];
}

function nearestOnMainRoad(target) {
  const curve = new THREE.CatmullRomCurve3(MAIN_ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i <= 200; i++) {
    const p = curve.getPointAt(i / 200);
    const d = (p.x - target[0]) ** 2 + (p.z - target[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = [p.x, p.z];
    }
  }
  return best;
}

function VillageHouse({ h }) {
  const texture = useSilhouetteTexture(h.scene);
  return (
    <group position={[h.x, groundHeight(h.x, h.z) - 0.15, h.z]} rotation={[0, h.r, 0]} scale={h.s}>
      <Cottage era="past" texture={texture} variant={h.variant} />
    </group>
  );
}

export function PastVillage() {
  const cobble = useMemo(() => makeCobbleTexture(), []);

  const paths = useMemo(
    () =>
      VILLAGE_HOUSES.map((h) => {
        const door = doorstep(h);
        const start = nearestOnMainRoad(door);
        const mid = [(start[0] + door[0]) / 2, (start[1] + door[1]) / 2 + 0.6];
        return [start, mid, door];
      }),
    []
  );
  const churchDoor = [0.5, -21.5];
  const lamps = [[-2.2, -3], [2.4, -8.5], [-2.3, -13], [3, -17.5], [-1.5, -20]];

  return (
    <group>
      <Road points={MAIN_ROAD} width={2.2} texture={cobble} />
      {paths.map((p, i) => (
        <Road key={i} points={p} width={1.0} texture={cobble} />
      ))}
      {VILLAGE_HOUSES.map((h, i) => (
        <VillageHouse key={i} h={h} />
      ))}
      <group position={[churchDoor[0], groundHeight(churchDoor[0], -24) - 0.2, -24]} rotation={[0, -0.15, 0]}>
        <Church />
      </group>
      {lamps.map(([x, z], i) => (
        <group key={i} position={[x, groundHeight(x, z) - 0.1, z]}>
          <LampPost />
        </group>
      ))}
      <group position={[3.4, groundHeight(3.4, -12), -12]}>
        <Carolers />
      </group>
    </group>
  );
}

// ============================================================
//  PRESENT: Santa's sleigh crossing the moon, dropping presents
// ============================================================
const SLEIGH_W = 640;
const SLEIGH_H = 180;
const SLEIGH_INK = '#07070d';

function drawReindeer(ctx, x, y, phase, rudolph) {
  ctx.fillStyle = SLEIGH_INK;
  ctx.strokeStyle = SLEIGH_INK;
  ctx.lineCap = 'round';
  // body
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 10, -0.05, 0, Math.PI * 2);
  ctx.fill();
  // neck + head
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x + 20, y - 4);
  ctx.lineTo(x + 32, y - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 38, y - 22, 9, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // antlers
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 32, y - 26);
  ctx.lineTo(x + 26, y - 42);
  ctx.moveTo(x + 28, y - 36);
  ctx.lineTo(x + 20, y - 40);
  ctx.moveTo(x + 27, y - 39);
  ctx.lineTo(x + 32, y - 47);
  ctx.stroke();
  // tail
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 25, y - 4);
  ctx.lineTo(x - 31, y - 9);
  ctx.stroke();
  // galloping legs
  const swing = Math.sin(phase) * 0.7;
  ctx.lineWidth = 4;
  [[x + 16, 1], [x + 10, -1], [x - 14, -1], [x - 20, 1]].forEach(([lx, dir]) => {
    const a = swing * dir;
    ctx.beginPath();
    ctx.moveTo(lx, y + 5);
    ctx.lineTo(lx + Math.sin(a + (lx > x ? 0.6 : -0.6)) * 20, y + 5 + Math.cos(a) * 18);
    ctx.stroke();
  });
  if (rudolph) {
    const g = ctx.createRadialGradient(x + 47, y - 20, 0, x + 47, y - 20, 12);
    g.addColorStop(0, 'rgba(255,60,40,1)');
    g.addColorStop(0.35, 'rgba(255,40,20,0.8)');
    g.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x + 33, y - 34, 28, 28);
  }
}

function drawSleigh(ctx, t) {
  ctx.clearRect(0, 0, SLEIGH_W, SLEIGH_H);
  const bob = (i) => Math.sin(t * 6 + i) * 3;
  // Reins
  ctx.strokeStyle = 'rgba(7,7,13,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 98);
  ctx.quadraticCurveTo(330, 110, 560, 80 + bob(3));
  ctx.stroke();
  // Reindeer team (lead = Rudolph)
  for (let i = 0; i < 4; i++) {
    const x = 250 + i * 95;
    const y = 95 - i * 5 + bob(i);
    drawReindeer(ctx, x, y, t * 12 + i * 1.3, i === 3);
  }
  // Sleigh
  ctx.fillStyle = SLEIGH_INK;
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.quadraticCurveTo(45, 130, 90, 130);
  ctx.lineTo(160, 130);
  ctx.quadraticCurveTo(175, 120, 170, 95);
  ctx.lineTo(130, 100);
  ctx.lineTo(60, 75);
  ctx.closePath();
  ctx.fill();
  // Runner with curl
  ctx.strokeStyle = SLEIGH_INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, 145);
  ctx.lineTo(170, 145);
  ctx.quadraticCurveTo(195, 145, 190, 128);
  ctx.quadraticCurveTo(186, 118, 176, 124);
  ctx.stroke();
  ctx.lineWidth = 3;
  [70, 140].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 130);
    ctx.lineTo(x, 145);
    ctx.stroke();
  });
  // Sack of presents
  ctx.beginPath();
  ctx.ellipse(70, 62, 26, 24, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Santa
  ctx.beginPath();
  ctx.ellipse(118, 78, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(124, 50, 11, 0, Math.PI * 2);
  ctx.fill();
  // Hat flopping back with pom-pom
  ctx.beginPath();
  ctx.moveTo(114, 46);
  ctx.quadraticCurveTo(110, 26, 92 + Math.sin(t * 5) * 3, 36);
  ctx.lineTo(132, 44);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(91 + Math.sin(t * 5) * 3, 37, 5, 0, Math.PI * 2);
  ctx.fill();
  // Waving arm
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(126, 70);
  ctx.lineTo(146 + Math.sin(t * 4) * 4, 48 + Math.cos(t * 4) * 4);
  ctx.stroke();
}

const SLEIGH_LOOP = 24; // seconds for one pass across the sky
const PRESENT_COLORS = ['#d4202a', '#2a8bd4', '#2e9d4a', '#ffd700', '#b03bd4'];

export function SantaSleigh() {
  const groupRef = useRef();
  const trailRef = useRef();
  const presentRefs = useRef([]);
  const presents = useRef(
    Array.from({ length: 8 }, () => ({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0 }))
  );
  const lastDrop = useRef(0);
  const lastDraw = useRef(-1);

  const { tex, ctx } = useMemo(() => canvasTexture(SLEIGH_W, SLEIGH_H, () => { }), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const p = (t % SLEIGH_LOOP) / SLEIGH_LOOP;
    const x = -45 + p * 90;
    const y = 8.4 + Math.sin(p * Math.PI) * 1.2;
    const z = -30;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.z = Math.cos(p * Math.PI) * 0.06; // climb then descend
    }
    if (trailRef.current) trailRef.current.position.set(x - 7, y - 0.5, z);

    if (t - lastDraw.current > 1 / 15) {
      lastDraw.current = t;
      drawSleigh(ctx, t);
      tex.needsUpdate = true;
    }

    // Drop a present every so often while the sleigh is over the village
    if (x > -25 && x < 25 && t - lastDrop.current > 1.6) {
      const slot = presents.current.find((pr) => !pr.active);
      if (slot) {
        lastDrop.current = t;
        slot.active = true;
        slot.pos.set(x - 4, y - 1, z + 1);
        slot.vel.set(2.5, 0, 0.8);
        slot.spin = (Math.random() - 0.5) * 6;
      }
    }

    presents.current.forEach((pr, i) => {
      const m = presentRefs.current[i];
      if (!m) return;
      if (pr.active) {
        pr.vel.y -= 4 * delta; // gentle gravity
        pr.pos.addScaledVector(pr.vel, delta);
        m.position.copy(pr.pos);
        m.rotation.x += pr.spin * delta;
        m.rotation.y += pr.spin * 0.7 * delta;
        if (pr.pos.y < groundHeight(pr.pos.x, pr.pos.z)) pr.active = false;
      }
      m.visible = pr.active;
    });
  });

  return (
    <>
      <group ref={groupRef}>
        <mesh>
          <planeGeometry args={[12, (12 * SLEIGH_H) / SLEIGH_W]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Magic sparkle trail behind the sleigh */}
      <group ref={trailRef}>
        <Sparkles count={40} scale={[6, 1.2, 1]} size={6} speed={0.6} opacity={0.9} color="#ffe9a8" />
      </group>
      {presents.current.map((_, i) => (
        <mesh key={i} ref={(el) => (presentRefs.current[i] = el)} visible={false}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial
            color={PRESENT_COLORS[i % PRESENT_COLORS.length]}
            emissive={PRESENT_COLORS[i % PRESENT_COLORS.length]}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </>
  );
}

// ============================================================
//  FUTURE: a snowy town of the future + a child silhouette holding their own globe
// ============================================================
function makeWindowTexture(palette) {
  return canvasTexture(128, 256, (ctx) => {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 256; y += 12) {
      for (let x = 6; x < 128; x += 14) {
        if (Math.random() < 0.55) {
          ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
          ctx.fillRect(x, y, 9, 6);
        }
      }
    }
  }).tex;
}

function Tower({ height, width, shape = 'box', tex, accent }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        {shape === 'box' ? <boxGeometry args={[width, height, width]} /> : <cylinderGeometry args={[width / 2, width / 1.6, height, 24]} />}
        <meshStandardMaterial color="#1a1f2a" metalness={0.7} roughness={0.35} map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={1.1} />
      </mesh>
      {/* Snow on the roof */}
      <mesh position={[0, height + 0.08, 0]}>
        {shape === 'box' ? <boxGeometry args={[width * 1.02, 0.16, width * 1.02]} /> : <cylinderGeometry args={[width / 2 + 0.02, width / 2 + 0.02, 0.16, 24]} />}
        <meshStandardMaterial color="#f4f8ff" roughness={1} />
      </mesh>
      {/* Neon crown + beacon */}
      <mesh position={[0, height - 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[width * 0.72, 0.05, 6, 40]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, height + 0.7, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#cfd6de" metalness={0.9} />
      </mesh>
      <mesh position={[0, height + 1.35, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GlassDome({ radius = 2 }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9feaff" transparent opacity={0.35} metalness={0.4} roughness={0.05} emissive="#00ffcc" emissiveIntensity={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.06, 8, 48]} />
        <meshBasicMaterial color="#00ffcc" toneMapped={false} />
      </mesh>
      {/* Warm glow of homes inside */}
      <mesh position={[0, radius * 0.3, 0]}>
        <sphereGeometry args={[radius * 0.25, 12, 12]} />
        <meshBasicMaterial color="#ffc46b" toneMapped={false} />
      </mesh>
    </group>
  );
}

function HoloSign() {
  const { tex } = useMemo(
    () =>
      canvasTexture(1024, 256, (ctx) => {
        ctx.font = 'bold 74px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffd6ff';
        ctx.fillText('MERRY XMAS 2125', 512, 128);
      }),
    []
  );
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.material.opacity = 0.75 + Math.sin(state.clock.getElapsedTime() * 9) * 0.12;
  });
  return (
    <mesh ref={ref}>
      <planeGeometry args={[8, 2]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Futuristic Train Car: aerodynamic bullet train with cockpit, windows, maglev skirts & couplings
function TrainCar({ type = 'middle' }) {
  const isLead = type === 'lead';
  const isTail = type === 'tail';

  return (
    <group>
      {/* Main streamlined train body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.36, 0.28, 1.15]} />
        <meshStandardMaterial color="#e6edf5" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Aerodynamic roof cap */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.30, 0.04, 1.12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Futuristic green/cyan side accent stripe */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.368, 0.035, 1.14]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Illuminated passenger window strips (both sides) */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.366, 0.08, 0.92]} />
        <meshStandardMaterial color="#0b1b24" emissive="#00e6a8" emissiveIntensity={0.55} roughness={0.1} />
      </mesh>

      {/* Maglev undercarriage chassis */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.38, 0.08, 1.16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Straddle clamps that hug the monorail beam */}
      {[-0.32, 0.32].map((zPos, idx) => (
        <group key={idx} position={[0, -0.22, zPos]}>
          <mesh position={[0.17, 0, 0]}>
            <boxGeometry args={[0.04, 0.12, 0.28]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[-0.17, 0, 0]}>
            <boxGeometry args={[0.04, 0.12, 0.28]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Maglev glowing levitation runners along track */}
      <mesh position={[0, -0.20, 0]}>
        <boxGeometry args={[0.14, 0.02, 1.1]} />
        <meshBasicMaterial color="#00ffcc" toneMapped={false} />
      </mesh>

      {/* LEAD CAR: Aerodynamic bullet nose, cockpit glass & headlights */}
      {isLead && (
        <group position={[0, 0, -0.58]}>
          {/* Sloped bullet nose wedge */}
          <mesh position={[0, -0.02, -0.16]}>
            <boxGeometry args={[0.34, 0.24, 0.32]} />
            <meshStandardMaterial color="#e6edf5" metalness={0.75} roughness={0.25} />
          </mesh>
          {/* Tapered nose tip */}
          <mesh position={[0, -0.03, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.15, 0.16, 16]} />
            <meshStandardMaterial color="#e6edf5" metalness={0.75} roughness={0.25} />
          </mesh>
          {/* Angled cockpit windshield */}
          <mesh position={[0, 0.07, -0.14]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[0.30, 0.12, 0.24]} />
            <meshStandardMaterial color="#032026" emissive="#00ffcc" emissiveIntensity={0.8} roughness={0.1} />
          </mesh>
          {/* Front high-beam headlights */}
          <mesh position={[0.10, -0.03, -0.39]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[-0.10, -0.03, -0.39]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.03, -0.36]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* TAIL CAR: Tapered rear & red LED tail lights */}
      {isTail && (
        <group position={[0, 0, 0.58]}>
          <mesh position={[0, 0, 0.12]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.33, 0.24, 0.24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.3} />
          </mesh>
          {/* Twin red tail lights */}
          <mesh position={[0.10, -0.02, 0.24]}>
            <boxGeometry args={[0.06, 0.025, 0.02]} />
            <meshBasicMaterial color="#ff1744" toneMapped={false} />
          </mesh>
          <mesh position={[-0.10, -0.02, 0.24]}>
            <boxGeometry args={[0.06, 0.025, 0.02]} />
            <meshBasicMaterial color="#ff1744" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* INTER-CAR COUPLING: Accordion gangway bellow */}
      {!isLead && (
        <mesh position={[0, -0.01, -0.63]}>
          <boxGeometry args={[0.28, 0.23, 0.12]} />
          <meshStandardMaterial color="#111827" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// Monorail ring with an articulated futuristic train gliding around it
function Monorail({ radius = 13, y = 3.2, center = [0, -5, -20] }) {
  const trainRef = useRef();
  useFrame((state) => {
    if (trainRef.current) trainRef.current.rotation.y = state.clock.getElapsedTime() * 0.25;
  });

  const CAR_STEP = 0.108;
  const cars = [
    { type: 'lead', angle: 0 },
    { type: 'middle', angle: CAR_STEP },
    { type: 'tail', angle: CAR_STEP * 2 },
  ];

  return (
    <group position={[center[0], center[1] + y, center[2]]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.08, 8, 120]} />
        <meshBasicMaterial color="#3d8bff" toneMapped={false} />
      </mesh>
      <group ref={trainRef}>
        {cars.map((car, i) => (
          <group
            key={i}
            position={[Math.cos(car.angle) * radius, 0.28, Math.sin(car.angle) * radius]}
            rotation={[0, -car.angle, 0]}
          >
            <TrainCar type={car.type} />
          </group>
        ))}
      </group>
    </group>
  );
}

// Little hover cars zipping between the towers
function FlyingCars() {
  const refs = useRef([]);
  const cars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        rx: 10 + Math.random() * 10,
        rz: 4 + Math.random() * 6,
        y: 0 + Math.random() * 7,
        speed: (0.15 + Math.random() * 0.2) * (i % 2 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        color: ['#00ffcc', '#ff00ff', '#ffd24a', '#3d8bff'][i % 4],
      })),
    []
  );
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const c = cars[i];
      const a = t * c.speed + c.phase;
      m.position.set(Math.cos(a) * c.rx, c.y + Math.sin(t + i) * 0.3, -22 + Math.sin(a) * c.rz);
      m.rotation.y = -a + (c.speed > 0 ? 0 : Math.PI);
    });
  });
  return cars.map((c, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.18, 0.5, 4, 10]} />
        <meshStandardMaterial color="#d8e0ea" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.03, 6, 20]} />
        <meshBasicMaterial color={c.color} toneMapped={false} />
      </mesh>
    </group>
  ));
}

export function FutureTown() {
  const texCyan = useMemo(() => makeWindowTexture(['#00ffcc', '#9dfff0', '#ffffff']), []);
  const texPink = useMemo(() => makeWindowTexture(['#ff00ff', '#ffb3ff', '#3d8bff']), []);
  const texWarm = useMemo(() => makeWindowTexture(['#ffd27a', '#ffffff', '#00ffcc']), []);
  const towers = [
    { x: -16, z: -24, h: 11, w: 2.2, shape: 'cyl', tex: texCyan, accent: '#00ffcc' },
    { x: -10, z: -28, h: 15, w: 2.6, shape: 'box', tex: texPink, accent: '#ff00ff' },
    { x: -5, z: -22, h: 8, w: 1.8, shape: 'cyl', tex: texWarm, accent: '#ffd24a' },
    { x: 5, z: -25, h: 13, w: 2.4, shape: 'box', tex: texCyan, accent: '#3d8bff' },
    { x: 10, z: -30, h: 18, w: 2.8, shape: 'cyl', tex: texPink, accent: '#ff00ff' },
    { x: 16, z: -22, h: 9, w: 2.0, shape: 'box', tex: texWarm, accent: '#00ffcc' },
    { x: 0, z: -33, h: 21, w: 3.0, shape: 'cyl', tex: texCyan, accent: '#ff00ff' },
  ];
  const domes = [[-12, -16, 2.4], [12, -15, 2.0], [3, -18, 1.6]];

  return (
    <group>
      {towers.map((t, i) => (
        <group key={i} position={[t.x, groundHeight(t.x, t.z) - 0.3, t.z]}>
          <Tower height={t.h} width={t.w} shape={t.shape} tex={t.tex} accent={t.accent} />
        </group>
      ))}
      {domes.map(([x, z, r], i) => (
        <group key={i} position={[x, groundHeight(x, z) - 0.2, z]}>
          <GlassDome radius={r} />
        </group>
      ))}
      <group position={[0, groundHeight(0, -33) + 23.5, -32.5]}>
        <HoloSign />
      </group>
      <Monorail />
      <FlyingCars />
    </group>
  );
}

// ---------- The child silhouette ----------
function drawKid(ctx, w) {
  ctx.save();
  // A soft rim so the silhouette separates from the night, but it stays a silhouette
  ctx.shadowColor = 'rgba(0,255,204,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#04050a';
  ctx.strokeStyle = '#04050a';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = w / 2;
  // Beanie with pom-pom
  ctx.beginPath();
  ctx.arc(cx, 150, 58, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 6, 82, 18, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(cx, 178, 56, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  // Scarf tail blowing in the wind
  ctx.beginPath();
  ctx.moveTo(cx + 30, 240);
  ctx.quadraticCurveTo(cx + 95, 270, cx + 110, 330);
  ctx.lineTo(cx + 85, 335);
  ctx.quadraticCurveTo(cx + 70, 285, cx + 20, 262);
  ctx.fill();
  // Puffy coat
  ctx.beginPath();
  ctx.moveTo(cx - 60, 250);
  ctx.quadraticCurveTo(cx, 225, cx + 60, 250);
  ctx.quadraticCurveTo(cx + 98, 420, cx + 92, 520);
  ctx.lineTo(cx - 92, 520);
  ctx.quadraticCurveTo(cx - 98, 420, cx - 60, 250);
  ctx.fill();
  // Both arms come together in front, cupping the globe in the centre
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.moveTo(cx - 62, 280);
  ctx.quadraticCurveTo(cx - 95, 380, cx - 28, 405);
  ctx.moveTo(cx + 62, 280);
  ctx.quadraticCurveTo(cx + 95, 380, cx + 28, 405);
  ctx.stroke();
  [cx - 26, cx + 26].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 405, 24, 0, Math.PI * 2);
    ctx.fill();
  });
  // Legs + boots
  ctx.fillRect(cx - 62, 510, 48, 180);
  ctx.fillRect(cx + 14, 510, 48, 180);
  ctx.beginPath();
  ctx.ellipse(cx - 46, 700, 42, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 46, 700, 42, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function MiniFutureGlobe() {
  const treeRef = useRef();
  const glowRef = useRef();
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (treeRef.current) treeRef.current.rotation.y += delta * 0.8;
    if (glowRef.current) glowRef.current.material.opacity = 0.3 + Math.sin(t * 2) * 0.08;
  });
  const glowTex = useMemo(
    () =>
      canvasTexture(128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(0,255,204,1)');
        g.addColorStop(1, 'rgba(0,255,204,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
      }).tex,
    []
  );

  return (
    <group>
      <sprite ref={glowRef} scale={[3, 3, 1]} position={[0, 0, -0.2]}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial color="#bff8ff" transparent opacity={0.3} roughness={0.05} metalness={0.1} emissive="#00ffcc" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={treeRef} position={[0, -0.1, 0]}>
        <coneGeometry args={[0.45, 1.1, 8]} />
        <meshBasicMaterial color="#00ffcc" wireframe toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <octahedronGeometry args={[0.1]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.75, 0.9, 0.3, 32]} />
        <meshStandardMaterial color="#14161c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.03, 8, 48]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

const KID_W = 512;
const KID_H = 768;
const KID_HEIGHT = 3.2; // smaller than the main globe (4.8 across)

export function FutureKid() {
  const { tex } = useMemo(() => canvasTexture(KID_W, KID_H, drawKid), []);
  const x = -6.5;
  const z = -5;
  const feetY = groundHeight(x, z);
  // Boots end at canvas y≈724 and the mittens are at y=405 (of 768)
  const planeBottom = feetY - KID_HEIGHT * ((KID_H - 724) / KID_H);
  const centerY = planeBottom + KID_HEIGHT / 2;
  const handsY = KID_HEIGHT * (0.5 - 405 / KID_H);
  const globeScale = 0.3;

  return (
    <Billboard position={[x, centerY, z]} lockX lockZ>
      <mesh>
        <planeGeometry args={[(KID_HEIGHT * KID_W) / KID_H, KID_HEIGHT]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Sits in the cupped mittens, centred */}
      <group position={[0, handsY + 1.2 * globeScale, 0.15]} scale={globeScale}>
        <MiniFutureGlobe />
      </group>
    </Billboard>
  );
}
