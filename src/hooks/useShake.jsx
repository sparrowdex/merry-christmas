import { useState, useEffect, useCallback, useRef } from 'react';

// Default options are now in one place
const defaultOptions = {
  threshold: 15,
  cooldown: 1000, // Cooldown is now configurable
  useKeyboard: true, // Allow disabling keyboard fallback
};

const useShake = (onShake, options = defaultOptions) => {
  // Merge user options with defaults
  const { threshold, cooldown, useKeyboard } = { ...defaultOptions, ...options };

  const [permissionState, setPermissionState] = useState('prompt');
  const isSupported = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function';

  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

  const requestPermission = useCallback(async () => {
    if (permissionState !== 'prompt' || !isSupported) {
      return;
    }

    try {
      const permission = await DeviceMotionEvent.requestPermission();
      setPermissionState(permission); // 'granted' or 'denied'
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
      setPermissionState('denied');
    }
  }, [permissionState, isSupported]);

  useEffect(() => {
    const handleDeviceMotion = (event) => {
      const { acceleration } = event;
      if (!acceleration || !acceleration.x) return; // Some browsers return null acceleration

      const { x, y, z } = acceleration;
      const currentTime = Date.now();

      if ((currentTime - lastShakeTime.current) < cooldown) {
        return; // Exit early if within cooldown
      }

      // Calculate acceleration change magnitude
      const deltaX = x - lastAcceleration.current.x;
      const deltaY = y - lastAcceleration.current.y;
      const deltaZ = z - lastAcceleration.current.z;
      
      // Using vector magnitude for a more holistic shake detection
      const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      if (magnitude > threshold) {
        // Pass intensity and source data to the callback
        onShake({ intensity: magnitude, source: 'devicemotion' });
        lastShakeTime.current = currentTime;
      }

      // Update last acceleration
      lastAcceleration.current = { x, y, z };
    };

    // Simplified logic for adding the event listener
    const canListen = !isSupported || permissionState === 'granted';

    if (canListen) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    // Cleanup
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [onShake, threshold, cooldown, isSupported, permissionState]);

  // Keyboard fallback effect
  useEffect(() => {
    if (!useKeyboard) return; // Exit if keyboard fallback is disabled

    const handleKeyPress = (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyS'].includes(event.code)) {
        const currentTime = Date.now();
        if (currentTime - lastShakeTime.current > cooldown) {
          event.preventDefault();
          // For keyboard, we can pass a fixed intensity or a different payload
          onShake({ intensity: threshold + 1, source: 'keyboard' });
          lastShakeTime.current = currentTime;
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onShake, cooldown, threshold, useKeyboard]); // Added useKeyboard to dependency array

  return { isSupported, permissionState, requestPermission };
};

export default useShake;