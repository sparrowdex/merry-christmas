import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SnowGlobe } from './components/SnowGlobe';
import { Intro } from './components/Intro';
import { Narrator } from './components/Narrator';
import { UI } from './components/UI';
import { useMicrophone } from './hooks/useMicrophone';
import './App.css';

function App() {
  const [era, setEra] = useState('past');
  const [started, setStarted] = useState(false);
  const { volume, startListening } = useMicrophone();

  // Simple start logic (Placeholder for the complex audio unlocking coming in Commit 3)
  const handleStart = () => {
    setStarted(true);
    startListening(); // Start microphone when experience starts
    console.log("Log: User clicked start. Audio context init will go here later.");
  };

  // 1. INTRO SCREEN STATE
  if (!started) {
    return (
      <>
        {/* FIX: We must render UI here to show the "Enter Experience" button */}
        <UI era={era} setEra={setEra} started={false} onStart={handleStart} />
        
        <Canvas camera={{ position: [0, 1, 8], fov: 50 }} style={{ background: '#101020' }}>
           <Intro />
        </Canvas>
      </>
    );
  }

  // 2. EXPERIENCE STATE
  return (
    <>
      <UI era={era} setEra={(newEra) => setEra(newEra)} started={true} />
      
      {/* Narrator is added, but logic is still basic in this commit */}
      <Narrator era={era} started={started} setMusicVolume={() => {}} />
      
      <Canvas camera={{ position: [0, 1, 8], fov: 50 }} style={{ background: '#101020' }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, -5]} intensity={1.5} />
        
        {/* SnowGlobe wrapper is now used instead of raw components */}
        <SnowGlobe era={era} windVolume={volume} />
      </Canvas>
    </>
  );
}

export default App;