import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars, Points, PointMaterial } from '@react-three/drei';
import { BokehLights } from './Ambience';

// Gentle, endlessly looping snowfall across the whole screen
function FallingSnow({ count = 1200 }) {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      speeds[i] = 0.4 + Math.random() * 0.8;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 1] -= speeds[i] * delta;
      pos[i3] += Math.sin(t * 0.5 + i) * 0.003; // sway
      if (pos[i3 + 1] < -10) pos[i3 + 1] = 10;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial transparent color="#ffffff" size={0.06} sizeAttenuation depthWrite={false} opacity={0.85} />
    </Points>
  );
}

// Slow camera drift so the background never feels static
function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.08) * 1.2;
    state.camera.position.y = 1 + Math.sin(t * 0.12) * 0.3;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function Intro() {
  // Audio logic has been moved to App.jsx for centralized management
  return (
    <group>
      <color attach="background" args={['#0b0a1a']} />
      <CameraDrift />
      <Stars radius={50} depth={25} count={2000} factor={3} saturation={0} fade speed={0.6} />
      <BokehLights colors={['#ffb347', '#ffd28a', '#ff4d4d', '#3dff7a', '#fff1c9']} count={60} />
      <FallingSnow />
      <Sparkles count={120} scale={15} size={3} speed={0.3} opacity={0.6} color="#fff48c" />
    </group>
  );
}
