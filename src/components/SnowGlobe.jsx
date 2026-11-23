import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Globe } from './Globe';
import { Tree } from './Tree';
import { Snow } from './Snow';
import { PiledSnow } from './PiledSnow';
import { Scenery } from './Scenery';
import { GROUND_Y } from '../utils/terrain';
import { OrbitControls, ContactShadows } from '@react-three/drei';

const TRANSITION_SECONDS = 2.6;
const IDLE_SPIN = 0.1;
const PEAK_SPIN = 9;

export function SnowGlobe({ era, windVolume, isSnowing }) {
  const groupRef = useRef();
  const [scale, setScale] = useState(1);

  // The era actually shown. It lags behind `era` and swaps at the peak of the spin,
  // while the glass is fogged, so the change is hidden inside the whirl.
  const [displayedEra, setDisplayedEra] = useState(era);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionStart = useRef(null);
  const transitionAmount = useRef(0); // 0..1..0 bell curve, read by Globe for fog

  // Handle responsive scaling
  useEffect(() => {
    const handleResize = () => setScale(window.innerWidth < 768 ? 0.7 : 1);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kick off a transition whenever the requested era changes
  useEffect(() => {
    if (era === displayedEra && !isTransitioning) return;
    transitionStart.current = null; // set on the next frame, using the render clock
    setIsTransitioning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era]);

  // Frame-driven (not setTimeout) so a slow frame can't skip the spin
  useFrame((state, delta) => {
    let spin = IDLE_SPIN;

    if (isTransitioning) {
      const now = state.clock.getElapsedTime();
      if (transitionStart.current === null) transitionStart.current = now;
      const p = Math.min((now - transitionStart.current) / TRANSITION_SECONDS, 1);
      const bell = Math.sin(p * Math.PI); // ease in, peak in the middle, ease out
      transitionAmount.current = bell;
      spin = IDLE_SPIN + bell * PEAK_SPIN;

      if (p >= 0.5 && displayedEra !== era) setDisplayedEra(era);
      if (p >= 1) {
        transitionAmount.current = 0;
        setIsTransitioning(false);
      }
    }

    // Clamp delta so a hitch never makes the globe jump
    if (groupRef.current) groupRef.current.rotation.y += Math.min(delta, 1 / 30) * spin;

  });

  return (
    <>
    <group scale={scale}>
      {/* Everything inside the glass spins */}
      <group ref={groupRef}>
        <Globe windVolume={windVolume} transitionAmount={transitionAmount} />
        {/* Tree planted on the snowy ground, off to one side so the house fits */}
        <group position={[-0.5, GROUND_Y, -0.3]} scale={1.1}>
          <Tree era={displayedEra} isTransitioning={isTransitioning} soundIntensity={windVolume || 0} />
        </group>
        <Scenery era={displayedEra} />
        <Snow volume={windVolume || 0} era={displayedEra} isTransitioning={isTransitioning} isSnowing={isSnowing} />
        {/* Soft shadow so the globe feels grounded instead of floating in a void */}
        <ContactShadows position={[0, -2.68, 0]} scale={9} blur={2.5} far={3} opacity={0.6} color="#000000" />
      </group>

      {/* The "Let it Snow" world outside the globe stays still */}
      <PiledSnow isSnowing={isSnowing} era={displayedEra} />

      <OrbitControls
        enableZoom={true}
        minDistance={4.5}
        maxDistance={9}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </group>
    </>
  );
}
