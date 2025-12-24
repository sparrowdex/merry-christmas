import React from 'react';
import { Sparkles } from '@react-three/drei';

export function Intro() {
  // Audio logic has been moved to App.jsx for centralized management
  return (
    <group>
      <Sparkles
        count={200}
        scale={15}
        size={3}
        speed={0.3}
        opacity={0.7}
        color="#fff48c"
      />
    </group>
  );
}
