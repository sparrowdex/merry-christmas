import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Globe } from './Globe';
import { Tree } from './Tree';
import { Snow } from './Snow'; // You can add Snow.jsx now too
import { OrbitControls } from '@react-three/drei';

export function SnowGlobe({ era, windVolume }) {
  const groupRef = useRef();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Detect era changes and trigger transition
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [era]);

  // Basic rotation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
       groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Globe windVolume={windVolume} />
      <Tree era={era} isTransitioning={isTransitioning} />
      {/* Removed House, Added Snow */}
      <Snow volume={windVolume || 0} era={era} isTransitioning={isTransitioning} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
    </group>
  );
}
