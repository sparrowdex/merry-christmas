// --- AUDIO DETECTIVE ---
if (typeof window !== 'undefined') {
  const OriginalAudio = window.Audio;
  let audioCount = 0;
  
  window.Audio = function(...args) {
    audioCount++;
    console.warn(`⚠️ Audio Player #${audioCount} created!`);
    console.log(new Error().stack); // This prints exactly WHERE it came from
    return new OriginalAudio(...args);
  };
}
// -----------------------

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)