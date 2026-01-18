  //  Helper functions
export const vector = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({
    x: b.x - a.x,
    y: b.y - a.y,
    z: b.z - a.z,
  });

export const magnitude = (v: { x: number; y: number; z: number }) => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);

export const dot = (v1: { x: number; y: number; z: number }, v2: { x: number; y: number; z: number }) =>
    v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

export const angleBetween = (v1: { x: number; y: number; z: number }, v2: { x: number; y: number; z: number }) => {
    const mag = magnitude(v1) * magnitude(v2);
    if (mag === 0) return 0;
    let cosAngle = dot(v1, v2) / mag;
    cosAngle = Math.min(Math.max(cosAngle, -1), 1); // clamp for precision
    return (Math.acos(cosAngle) * 180) / Math.PI; // convert to degrees
};

export const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

export const cross = (v1: { x: number; y: number; z: number }, v2: { x: number; y: number; z: number }) => ({
  x: v1.y * v2.z - v1.z * v2.y,
  y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
});

export const normalize = (v: { x: number; y: number; z: number }) => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
};