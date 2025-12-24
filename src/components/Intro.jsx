import React, { useEffect, useRef } from 'react';
import { Sparkles } from '@react-three/drei';

export function Intro() {
  const audioRef = useRef(typeof Audio !== 'undefined' && new Audio('/audio/jinglebells.mp3'));

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

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
