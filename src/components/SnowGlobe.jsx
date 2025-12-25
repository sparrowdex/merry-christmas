import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Globe } from './Globe';
import { Tree } from './Tree';
import { Snow } from './Snow'; // You can add Snow.jsx now too
import { PiledSnow } from './PiledSnow';
import { OrbitControls } from '@react-three/drei';

export function SnowGlobe({ era, windVolume, isSnowing }) {
  const groupRef = useRef();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scale, setScale] = useState(1);

  // Handle responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setScale(isMobile ? 0.7 : 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect era changes and trigger transition
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [era]);

  // Basic rotation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      const rotationSpeed = isTransitioning ? 2 : 0.1; // Faster rotation during transition
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <Globe windVolume={windVolume} />
      <Tree era={era} isTransitioning={isTransitioning} />
      {/* Removed House, Added Snow */}
      <Snow volume={windVolume || 0} era={era} isTransitioning={isTransitioning} isSnowing={isSnowing} />
      <PiledSnow isSnowing={isSnowing} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
    </group>
  );
}
