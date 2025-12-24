import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Globe } from './components/Globe';
import { Tree } from './components/Tree';
import { House } from './components/House'; // Including House initially
import { UI } from './components/UI';
import { OrbitControls } from '@react-three/drei';
import './App.css';

function App() {
  const [era, setEra] = useState('past');

  return (
    <>
      <UI era={era} setEra={setEra} />
      <Canvas camera={{ position: [0, 1, 8], fov: 50 }} style={{ background: '#101020' }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, -5]} intensity={1.5} />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="lightblue" />
        
        <group>
          <Globe />
          <Tree era={era} />
          <House era={era} /> {/* We will delete this in next commit */}
          <OrbitControls />
        </group>
      </Canvas>
    </>
  );
}

export default App;