import React from 'react'

export function UI({ era, setEra }) {
  const panelStyle = {
    position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
    padding: '20px', borderRadius: '20px', color: 'white', textAlign: 'center', zIndex: 10
  }

  return (
    <div style={panelStyle}>
      <h2 style={{ margin: '0 0 10px 0' }}>{era.toUpperCase()}</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setEra('past')}>Past</button>
        <button onClick={() => setEra('present')}>Present</button>
        <button onClick={() => setEra('future')}>Future</button>
      </div>
    </div>
  )
}