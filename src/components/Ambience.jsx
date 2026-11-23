import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Per-era mood: background colour, bokeh light colours, key light tint, dust colour
const ERA_THEME = {
  past: {
    background: '#12100e',
    bokeh: ['#ffb347', '#ffd28a', '#e8a35c', '#fff1c9'],
    keyLight: '#ffcf8a',
    dust: '#ffe0a8',
  },
  present: {
    background: '#0b1026',
    bokeh: ['#ff4d4d', '#3dff7a', '#ffd700', '#ffffff', '#ff9a3d'],
    keyLight: '#fff1d6',
    dust: '#fff48c',
  },
  future: {
    background: '#020d12',
    bokeh: ['#00ffcc', '#ff00ff', '#3d8bff', '#9dfff0'],
    keyLight: '#9dfff0',
    dust: '#00ffcc',
  },
};

// Soft round gradient used for every bokeh sprite
function useBokehTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

// Out-of-focus fairy lights in a ring around the globe, so every orbit angle has depth
export function BokehLights({ colors, count = 45 }) {
  const texture = useBokehTexture();
  const refs = useRef([]);

  const orbs = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 11 + Math.random() * 9;
        return {
          position: [Math.cos(angle) * radius, -3 + Math.random() * 10, Math.sin(angle) * radius],
          size: 0.6 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.8,
          colorIndex: Math.floor(Math.random() * 10),
        };
      }),
    [count]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    refs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const o = orbs[i];
      sprite.position.y = o.position[1] + Math.sin(t * o.speed * 0.5 + o.phase) * 0.3;
      sprite.material.opacity = 0.25 + (Math.sin(t * o.speed + o.phase) * 0.5 + 0.5) * 0.35;
    });
  });

  return (
    <group>
      {orbs.map((o, i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={o.position}
          scale={[o.size, o.size, 1]}
        >
          <spriteMaterial
            map={texture}
            color={colors[o.colorIndex % colors.length]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

export function Ambience({ era }) {
  const theme = ERA_THEME[era] || ERA_THEME.present;

  return (
    <>
      <color attach="background" args={[theme.background]} />

      {/* Distant starfield */}
      <Stars radius={60} depth={30} count={2500} factor={3} saturation={0} fade speed={0.5} />

      {/* Blurred fairy lights in the background */}
      <BokehLights key={era} colors={theme.bokeh} />

      {/* Magic dust drifting around the globe */}
      <Sparkles count={80} scale={[9, 6, 9]} size={2.5} speed={0.25} opacity={0.6} color={theme.dust} />

      {/* Warm display-case spotlight from above */}
      <spotLight
        position={[0, 9, 4]}
        angle={0.45}
        penumbra={1}
        intensity={40}
        color={theme.keyLight}
      />

      {/* Local studio environment so the glass has something to reflect (no network fetch) */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 6, 4]} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} color={theme.keyLight} position={[-6, 2, -4]} scale={4} />
        <Lightformer form="rect" intensity={1} color={theme.bokeh[0]} position={[6, 0, -2]} scale={[2, 6, 1]} />
      </Environment>
    </>
  );
}
