export const GROUND_Y = -1.75;

// Calculates the undulating ground height at world coordinates (x, z)
export function groundHeight(x, z) {
  const ly = -(z + 10);
  return -6 + Math.sin(x * 0.15) * 1.2 + Math.cos(ly * 0.2) * 1.0 + Math.sin(x * 0.5 + ly * 0.5) * 0.3;
}
