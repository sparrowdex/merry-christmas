import { useEffect, useRef } from 'react';

const useShake = (onShake, threshold = 15) => {
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

  useEffect(() => {
    const handleDeviceMotion = (event) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;

      const { x, y, z } = accelerationIncludingGravity;
      const currentTime = Date.now();

      // Calculate acceleration change
      const deltaX = Math.abs(x - lastAcceleration.current.x);
      const deltaY = Math.abs(y - lastAcceleration.current.y);
      const deltaZ = Math.abs(z - lastAcceleration.current.z);

      // Check if shake threshold is exceeded and enough time has passed since last shake
      if ((deltaX > threshold || deltaY > threshold || deltaZ > threshold) &&
          (currentTime - lastShakeTime.current) > 1000) { // 1 second cooldown
        onShake();
        lastShakeTime.current = currentTime;
      }

      // Update last acceleration
      lastAcceleration.current = { x, y, z };
    };

    const handleKeyPress = (event) => {
      // Allow spacebar, arrow keys, or 'S' key to simulate shake on desktop
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
          event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'KeyS') {
        const currentTime = Date.now();
        if (currentTime - lastShakeTime.current > 1000) { // 1 second cooldown
          event.preventDefault(); // Prevent page scroll on spacebar
          onShake();
          lastShakeTime.current = currentTime;
        }
      }
    };

    // Add event listeners
    window.addEventListener('devicemotion', handleDeviceMotion, true);
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onShake, threshold]);
};

export default useShake;
