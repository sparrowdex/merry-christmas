import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { SnowGlobe } from './components/SnowGlobe';
import { Intro } from './components/Intro';
import { UI } from './components/UI';
import useMicrophone from './hooks/useMicrophone';
import useShake from './hooks/useShake';
import './App.css';

function App() {
  const [era, setEra] = useState('past');
  const [started, setStarted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [isSnowing, setIsSnowing] = useState(false);
  const { windVolume, getMicrophone } = useMicrophone();

  // Shake detection for time travel
  const handleShake = () => {
    if (started) {
      const nextEra = era === 'past' ? 'present' : era === 'present' ? 'future' : 'past';
      setEra(nextEra);
    }
  };
  useShake(handleShake);

  // Audio management - centralized in App.jsx
  const introAudioRef = useRef(null);
  const bgAudioRef = useRef(null);
  const narratorAudioRef = useRef(null);
  const whooshAudioRef = useRef(null);
  const hasPlayedIntro = useRef(false);
  const prevEraRef = useRef(era);

  // Initialize audio objects once
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      if (!introAudioRef.current) {
        introAudioRef.current = new Audio('/audio/jinglebells.mp3');
      }
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio();
      }
      if (!narratorAudioRef.current) {
        narratorAudioRef.current = new Audio();
      }
      if (!whooshAudioRef.current) {
        whooshAudioRef.current = new Audio();
      }
    }
  }, []);

  // Audio management logic
  useEffect(() => {
    if (!started) return;

    const bgAudio = bgAudioRef.current;
    const narratorAudio = narratorAudioRef.current;
    const whooshAudio = whooshAudioRef.current;
    if (!bgAudio || !narratorAudio || !whooshAudio) return;

    // Play whoosh on era change
    if (prevEraRef.current !== era) {
      whooshAudio.src = '/audio/whoosh.mp3';
      whooshAudio.volume = 1.0;
      whooshAudio.loop = false;
      whooshAudio.play().catch(e => console.log("User interaction needed for whoosh"));
      prevEraRef.current = era;
    }

    // Stop previous BG music
    bgAudio.pause();
    bgAudio.currentTime = 0;

    // Stop narrator
    narratorAudio.pause();
    narratorAudio.currentTime = 0;

    let bgFile = '';
    let narratorFile = '';

    // Play the Era BG music and narrator
    if (era === 'past') {
      bgFile = '/audio/past.mp3';
      narratorFile = '/audio/narrator-past.mp3';
    }
    if (era === 'present') {
      bgFile = '/audio/present.mp3';
      narratorFile = '/audio/narrator-present.mp3';
    }
    if (era === 'future') {
      bgFile = '/audio/future.mp3';
      narratorFile = '/audio/narrator-future.mp3';
    }

    if (bgFile) {
      bgAudio.src = bgFile;
      bgAudio.volume = 0.4;
      bgAudio.loop = true;
      bgAudio.play().catch(e => console.log("User interaction needed for BG music"));

      if (narratorFile) {
        narratorAudio.src = narratorFile;
        narratorAudio.volume = 1.0;
        narratorAudio.loop = false;

        const playNarrator = () => {
          whooshAudio.pause(); // Stop whoosh at the end of transition
          whooshAudio.currentTime = 0;
          bgAudio.volume = 0.1; // Mute BG music slightly when narrator speaks
          narratorAudio.play().catch(e => console.log("User interaction needed for narration"));
        };

        // Delay narrator by 3 seconds after BG starts
        const narratorTimeout = setTimeout(playNarrator, 3000);

        narratorAudio.onended = () => {
          bgAudio.volume = 0.4; // Restore BG music volume
        };

        return () => {
          clearTimeout(narratorTimeout);
          narratorAudio.onended = null;
        };
      }
    }
  }, [era, started]);

  // Intro audio logic - play when in intro state
  useEffect(() => {
    const introAudio = introAudioRef.current;
    if (!introAudio) return;

    if (!micGranted || started) {
      // Stop intro audio when starting experience or if mic not granted
      introAudio.pause();
      introAudio.currentTime = 0;
      return;
    }

    // Play intro audio
    introAudio.loop = true;
    introAudio.volume = 0.4;
    introAudio.play().catch(e => console.error("Intro audio play failed:", e));

  }, [micGranted, started]);

  // Handle microphone permission
  const handleMicPermission = async () => {
    try {
      // Create audio context for microphone
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const success = await getMicrophone(audioContext);
      if (success) {
        setMicGranted(true);
      } else {
        // Still allow to continue without microphone
        setMicGranted(true);
      }
    } catch (error) {
      console.error('Microphone permission denied:', error);
      // Still allow to continue without microphone
      setMicGranted(true);
    }
  };

  // Simple start logic (Placeholder for the complex audio unlocking coming in Commit 3)
  const handleStart = () => {
    setStarted(true);
    console.log("Log: User clicked start. Audio context init will go here later.");
  };

  // Handle "Let it Snow" button - toggle continuous snowfall
  const handleLetItSnow = () => {
    console.log('Let it Snow button clicked!');
    setIsSnowing(prev => !prev);
  };

  // 0. MICROPHONE PERMISSION SCREEN
  if (!micGranted) {
    return (
      <>
        {/* Microphone permission UI overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          zIndex: 1000,
          pointerEvents: 'none' // Allow clicks through to Canvas
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '500px',
            pointerEvents: 'auto' // Re-enable for the modal
          }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>Microphone Permission</h1>
            <p style={{ margin: '0 0 30px 0', fontSize: '1.2rem', lineHeight: '1.6' }}>
              To experience the full magic of the Christmas Snow Globe, we need access to your microphone.
              <br /><br />
              Once allowed, you may blow on your screen to make the snow dance! ✨
            </p>
            <button
              onClick={handleMicPermission}
              style={{
                padding: '15px 30px',
                fontSize: '1.2rem',
                background: 'white',
                color: '#101020',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Allow Microphone Access
            </button>
            <p style={{ margin: '20px 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              You can still enjoy the experience without microphone access.
            </p>
          </div>
        </div>

        {/* Same Canvas background as intro page */}
        <Canvas camera={{ position: [0, 1, 8], fov: 50 }} style={{ background: '#101020' }}>
          <Sparkles
            count={200}
            scale={15}
            size={3}
            speed={0.3}
            opacity={0.7}
            color="#fff48c"
          />
        </Canvas>
      </>
    );
  }

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
      <UI era={era} setEra={(newEra) => setEra(newEra)} started={true} onLetItSnow={handleLetItSnow} />

      <Canvas camera={{ position: [0, 1, 8], fov: 50 }} style={{ background: '#101020' }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, -5]} intensity={1.5} />

        {/* SnowGlobe wrapper is now used instead of raw components */}
        <SnowGlobe era={era} windVolume={windVolume} isSnowing={isSnowing} />
      </Canvas>
    </>
  );
}

export default App;