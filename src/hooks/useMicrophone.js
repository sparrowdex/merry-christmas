import { useState, useEffect, useRef } from 'react';

const useMicrophone = () => {
  const [windVolume, setWindVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameId = useRef(null);

  const getMicrophone = async (audioContext) => {
    if (!audioContext) {
      console.error('AudioContext not provided to getMicrophone');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = audioContext;
      analyserRef.current = audioContextRef.current.createAnalyser();
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const updateVolume = () => {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const volume = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length / 255;
        setWindVolume(volume);
        animationFrameId.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      return true;

    } catch (err) {
      console.error('Error accessing microphone:', err);
      return false;
    }
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Disconnect the source node, but don't close the context
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
    };
  }, []);

  return { windVolume, getMicrophone };
};

export default useMicrophone;
