import React from 'react'

export function UI({ era, setEra, started, onStart, onLetItSnow }) {
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
  }

  // 1. INTRO MODE (Matches your screenshot)
  if (!started) {
    return (
      <div style={{ ...panelStyle, top: '50%', bottom: 'auto' }}>
        <h1>Timeless Snow Globe</h1>
        <p>A journey through Christmas memories.</p>
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
        <h2 style={{ margin: '0 0 10px 0' }}>{era.toUpperCase()}</h2>
        <button onClick={() => setEra(nextEra)}>Time Travel</button>
      </div>
    </>
  )
}