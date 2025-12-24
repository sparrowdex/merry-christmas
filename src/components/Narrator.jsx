import { useEffect, useRef } from 'react'

export function Narrator({ era, started, setMusicVolume }) {
  const hasPlayedIntro = useRef(false)
  const bgAudioRef = useRef(typeof Audio !== 'undefined' && new Audio())
  const narratorAudioRef = useRef(typeof Audio !== 'undefined' && new Audio())
  const whooshAudioRef = useRef(typeof Audio !== 'undefined' && new Audio())
  const prevEraRef = useRef(era)

  useEffect(() => {
    if (!started) return

    const bgAudio = bgAudioRef.current
    const narratorAudio = narratorAudioRef.current
    const whooshAudio = whooshAudioRef.current
    if (!bgAudio || !narratorAudio || !whooshAudio) return

    // Play whoosh on era change
    if (prevEraRef.current !== era) {
      whooshAudio.src = '/audio/whoosh.mp3'
      whooshAudio.volume = 1.0
      whooshAudio.loop = false
      whooshAudio.play().catch(e => console.log("User interaction needed for whoosh"))
      prevEraRef.current = era
    }

    // Stop previous BG music
    bgAudio.pause()
    bgAudio.currentTime = 0

    // Stop narrator
    narratorAudio.pause()
    narratorAudio.currentTime = 0

    let bgFile = ''
    let narratorFile = ''

    // LOGIC:
    // 1. If this is the VERY first time starting, play Intro.
    if (!hasPlayedIntro.current) {
      bgFile = '/audio/intro.mp3'
      hasPlayedIntro.current = true // Mark it as done
    }
    // 2. Otherwise, play the Era BG music and narrator
    else {
      if (era === 'past') {
        bgFile = '/audio/past.mp3'
        narratorFile = '/audio/narrator-past.mp3'
      }
      if (era === 'present') {
        bgFile = '/audio/present.mp3'
        narratorFile = '/audio/narrator-present.mp3'
      }
      if (era === 'future') {
        bgFile = '/audio/future.mp3'
        narratorFile = '/audio/narrator-future.mp3'
      }
    }

    if (bgFile) {
      bgAudio.src = bgFile
      bgAudio.volume = 0.4
      bgAudio.loop = true
      bgAudio.play().catch(e => console.log("User interaction needed for BG music"))

      if (narratorFile) {
        narratorAudio.src = narratorFile
        narratorAudio.volume = 1.0
        narratorAudio.loop = false

        const playNarrator = () => {
          whooshAudio.pause() // Stop whoosh at the end of transition
          whooshAudio.currentTime = 0
          bgAudio.volume = 0.1 // Mute BG music slightly when narrator speaks
          narratorAudio.play().catch(e => console.log("User interaction needed for narration"))
        }

        // Delay narrator by 3 seconds after BG starts
        const narratorTimeout = setTimeout(playNarrator, 3000)

        narratorAudio.onended = () => {
          bgAudio.volume = 0.4 // Restore BG music volume
        }

        return () => {
          clearTimeout(narratorTimeout)
          narratorAudio.onended = null
          if (setMusicVolume) setMusicVolume(0.4)
        }
      }
    }

  }, [era, started, setMusicVolume])

  return null
}
