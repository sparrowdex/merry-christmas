import { useEffect, useRef } from 'react'

export function AudioPlayer({ era, isPlaying, volume = 0.4 }) {
  const audioRef = useRef(new Audio())
  
  const tracks = {
    past: '/audio/past.mp3',
    present: '/audio/present.mp3',
    future: '/audio/future.mp3'
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current
    if (!isPlaying) {
      audio.pause()
      return
    }
    
    audio.src = tracks[era]
    audio.loop = true
    audio.volume = volume
    
    const playPromise = audio.play()
    
    if (playPromise !== undefined) {
      playPromise.catch(error => console.log("Audio requires interaction first"))
    }

    return () => audio.pause()
  }, [era, isPlaying, volume])

  return null
}