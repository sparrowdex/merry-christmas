import { useState, useEffect, useRef, useCallback } from 'react';

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth <= 768;

const useMicrophone = () => {
  const [windVolume, setWindVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameId = useRef(null);

  // Reads the mic level every frame. Safe to call again: it never starts two loops.
  const startLoop = useCallback(() => {
    if (animationFrameId.current || !analyserRef.current) return;

    const updateVolume = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      if (isMobileDevice()) {
        // Mobile/tablet: use max value for higher sensitivity
        const maxValue = Math.max(...dataArrayRef.current);
        setWindVolume(Math.min(maxValue / 128, 1.0));
      } else {
        // Desktop/laptop: average level, boosted x3 and clamped
        const volume = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length / 255;
        setWindVolume(Math.min(volume * 3, 1.0));
      }
      animationFrameId.current = requestAnimationFrame(updateVolume);
    };
    animationFrameId.current = requestAnimationFrame(updateVolume);
  }, []);

  const getMicrophone = async (audioContext) => {
    if (!audioContext) {
      console.error('AudioContext not provided to getMicrophone');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = audioContext;
      if (audioContext.state === 'suspended') await audioContext.resume();
      analyserRef.current = audioContext.createAnalyser();
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      startLoop();
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      return false;
    }
  };

  useEffect(() => {
    // If the component re-mounts (React StrictMode / hot reload in dev) while
    // the mic is already connected, pick the loop back up instead of going silent.
    startLoop();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      // NOTE: the mic source is intentionally left connected so the loop can resume.
    };
  }, [startLoop]);

  return { windVolume, getMicrophone };
};

export default useMicrophone;
