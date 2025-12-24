import React from 'react'

export function UI({ era, setEra, started, onStart }) {
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
    <div style={panelStyle}>
      <h2 style={{ margin: '0 0 10px 0' }}>{era.toUpperCase()}</h2>
      <button onClick={() => setEra(nextEra)}>Time Travel</button>
    </div>
  )
}