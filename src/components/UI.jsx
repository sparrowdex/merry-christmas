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

  // 1. INTRO MODE (Matches your screenshot)
  if (!started) {
    return (
      <div className="landing">
        <div className="landing-glow" />
        <div className="landing-card">
          <p className="landing-eyebrow">✦ A Christmas Carol in Glass ✦</p>
          <h1 className="landing-title landing-title-large">Timeless Snow Globe</h1>
          <div className="landing-divider"><span>❄</span></div>
          <p className="landing-text">
            Three spirits. Three Christmases. One globe.
            <br />
            Travel through the <em>Past</em>, <em>Present</em> and <em>Future</em>.
          </p>
          <div className="landing-eras" aria-hidden="true">
            <span className="era-chip era-chip-past">Past</span>
            <span className="era-chip era-chip-present">Present</span>
            <span className="era-chip era-chip-future">Future</span>
          </div>
          <button className="landing-button" onClick={onStart}>
            Enter the Globe
          </button>
          <p className="landing-hint">🎧 Best with sound on</p>
        </div>
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