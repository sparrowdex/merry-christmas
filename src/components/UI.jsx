import React, { useState, useEffect } from 'react';

export function UI({ era, setEra, started, onStart, onLetItSnow }) {
  const [showInstruction, setShowInstruction] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple mobile detection
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    if (started) {
      setShowInstruction(true);
      const timer = setTimeout(() => setShowInstruction(false), 7000); // Hide after 7 seconds
      return () => clearTimeout(timer);
    }
  }, [started]);

  const panelStyle = {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    textAlign: 'center',
    zIndex: 10,
    pointerEvents: 'auto'
  };

  const instructionStyle = {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center',
    zIndex: 100,
    opacity: showInstruction ? 1 : 0,
    transition: 'opacity 1s ease-in-out',
    pointerEvents: 'none',
  };

  const [introPanelStyle, setIntroPanelStyle] = useState({
    ...panelStyle,
    top: '50%',
    bottom: 'auto',
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIntroPanelStyle({
          ...panelStyle,
          top: '30%', // Move up on mobile
          bottom: 'auto',
          padding: '15px',
        });
      } else {
        setIntroPanelStyle({
          ...panelStyle,
          top: '50%',
          bottom: 'auto',
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 1. INTRO MODE (Matches your screenshot)
  if (!started) {
    return (
      <div style={introPanelStyle}>
        <h1 style={{ fontFamily: 'Elegant Woman', fontSize: window.innerWidth < 768 ? '2rem' : '3rem' }}>Timeless Snow Globe</h1>
        <p style={{ fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem' }}>A journey through Christmas memories.</p>
        <button
          onClick={onStart}
          style={{
            marginTop: '15px',
            padding: '12px 24px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            background: 'white',
            border: 'none',
            borderRadius: '30px',
            color: 'black'
          }}
        >
          Enter Experience
        </button>
      </div>
    )
  }

  // 2. EXPERIENCE MODE (The button)
  const nextEra = era === 'past' ? 'present' : era === 'present' ? 'future' : 'past';
  return (
    <>
      {/* Instruction Text */}
      {showInstruction && (
        <div style={instructionStyle}>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {isMobile
              ? "Blow near your device's charging port to see the magic!"
              : "Blow towards your screen to fog up the glass!"}
          </p>
        </div>
      )}

      {/* "Let it Snow" button in top right */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={onLetItSnow}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '25px',
            color: 'white',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ❄️ Let it Snow
        </button>
      </div>

      <div style={panelStyle}>
        <h2 style={{ margin: '0 0 10px 0', fontFamily: 'Elegant Woman' }}>{era.charAt(0).toUpperCase() + era.slice(1)}</h2>
        <button onClick={() => setEra(nextEra)}>Time Travel</button>
      </div>
    </>
  )
}