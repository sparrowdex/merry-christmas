// Animated 'shadow puppet' scenes drawn onto canvases (house windows, room figures).
export const W = 256;
export const H = 160;
export const FLOOR = 150;
export const INK = '#140a05';

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

// A side-view person. Returns hand position so props can be drawn there.
export function person(ctx, x, s, o = {}) {
  const { seated = false, bob = 0, arm = 0.3, facing = 1, hat = false, bun = false, dress = false, floor = FLOOR } = o;
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';

  const hipY = (seated ? floor - 24 * s : floor - 30 * s) + bob;
  const shoulderY = hipY - 26 * s;
  const headY = shoulderY - 11 * s;

  circle(ctx, x, headY, 7 * s); // head
  ctx.fillRect(x - 2 * s, headY + 4 * s, 4 * s, 5 * s); // neck
  poly(ctx, [[x - 9 * s, shoulderY], [x + 9 * s, shoulderY], [x + 7 * s, hipY], [x - 7 * s, hipY]]); // torso
  circle(ctx, x - 7 * s, shoulderY + 2 * s, 3 * s);
  circle(ctx, x + 7 * s, shoulderY + 2 * s, 3 * s);

  if (hat) {
    ctx.fillRect(x - 5 * s, headY - 17 * s, 10 * s, 12 * s);
    ctx.fillRect(x - 9 * s, headY - 6.5 * s, 18 * s, 2.5 * s);
  }
  if (bun) circle(ctx, x - facing * 6 * s, headY - 3 * s, 4 * s);

  if (seated) {
    ctx.fillRect(Math.min(x, x + facing * 18 * s), hipY - 7 * s, 18 * s, 8 * s); // thigh
    ctx.fillRect(x + facing * 15 * s - 3 * s, hipY - 4 * s, 6 * s, floor - hipY + 4 * s); // shin
  } else if (dress) {
    poly(ctx, [[x - 7 * s, hipY - 2 * s], [x + 7 * s, hipY - 2 * s], [x + 14 * s, floor], [x - 14 * s, floor]]);
  } else {
    ctx.fillRect(x - 7 * s, hipY, 6 * s, floor - hipY);
    ctx.fillRect(x + 1 * s, hipY, 6 * s, floor - hipY);
  }

  // Back arm hangs down
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(x - facing * 6 * s, shoulderY + 3 * s);
  ctx.lineTo(x - facing * 8 * s, shoulderY + 22 * s);
  ctx.stroke();

  // Front arm at the given angle (0 = straight down, PI = straight up)
  const sx = x + facing * 6 * s;
  const sy = shoulderY + 3 * s;
  const hx = sx + Math.sin(arm) * facing * 20 * s;
  const hy = sy + Math.cos(arm) * 20 * s;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  return [hx, hy];
}

export function chair(ctx, x, facing) {
  ctx.fillStyle = INK;
  ctx.fillRect(x - facing * 12 - 2, FLOOR - 58, 4, 58);
  ctx.fillRect(x - facing * 12 - 4, FLOOR - 60, 8, 4);
}

export function flame(ctx, x, y, h, w, t, phase) {
  const flick = Math.sin(t * 11 + phase) * 0.2 + Math.sin(t * 7 + phase * 2) * 0.1;
  const hh = h * (1 + flick);
  ctx.fillStyle = '#ffb020';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w, y - hh * 0.6, x + flick * 4, y - hh);
  ctx.quadraticCurveTo(x + w, y - hh * 0.6, x + w, y);
  ctx.fill();
  ctx.fillStyle = '#fff2a8';
  ctx.beginPath();
  ctx.ellipse(x, y - hh * 0.3, w * 0.45, hh * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPast(ctx, t) {
  // Firelit room
  const g = ctx.createRadialGradient(215, 120, 10, 160, 90, 260);
  g.addColorStop(0, '#ffd27a');
  g.addColorStop(0.45, '#e08a35');
  g.addColorStop(1, '#5a2208');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Fireplace
  ctx.fillStyle = INK;
  ctx.fillRect(196, 76, 60, 7);
  ctx.fillRect(200, 83, 9, 67);
  ctx.fillRect(243, 83, 9, 67);
  ctx.fillStyle = '#3a1404';
  ctx.fillRect(209, 95, 34, 55);
  for (let i = 0; i < 3; i++) flame(ctx, 216 + i * 10, 148, 26 - i * 3, 6, t, i * 2.1);
  // Stockings on the mantle
  ctx.fillStyle = INK;
  [210, 236].forEach((x) => {
    ctx.fillRect(x, 83, 7, 14);
    ctx.fillRect(x, 93, 12, 6);
  });

  // Picture frame on the wall
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(70, 38, 13, 17, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Family around the table
  chair(ctx, 38, 1);
  const glass = person(ctx, 38, 1, { seated: true, hat: true, arm: 2.3 + Math.sin(t * 1.4) * 0.35, facing: 1 });
  ctx.fillRect(glass[0] - 2, glass[1] - 7, 4, 7);

  const knife = person(ctx, 112, 1, { arm: 1.5 + Math.sin(t * 4) * 0.45, facing: 1 }); // carving the turkey
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(knife[0], knife[1]);
  ctx.lineTo(knife[0] + 9, knife[1] + 4);
  ctx.stroke();

  person(ctx, 150, 0.62, { dress: true, bob: -Math.abs(Math.sin(t * 3)) * 3, arm: 2.6, facing: -1 }); // excited child

  chair(ctx, 182, -1);
  person(ctx, 182, 1, { seated: true, bun: true, arm: 1.1 + Math.sin(t * 2.2) * 0.3, facing: -1 });

  // Table + turkey (drawn in front of the people)
  ctx.fillStyle = INK;
  ctx.fillRect(58, 117, 116, 6);
  ctx.fillRect(62, 123, 108, 10); // tablecloth
  ctx.fillRect(68, 133, 5, 17);
  ctx.fillRect(159, 133, 5, 17);
  ctx.beginPath();
  ctx.ellipse(122, 116, 22, 3, 0, 0, Math.PI * 2); // platter
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(122, 106, 15, 10, 0, 0, Math.PI * 2); // turkey
  ctx.fill();
  [[108, 109, -0.6], [136, 109, 0.6]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 4, r, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, x + Math.sign(r) * 6, y - 4, 2.5);
  });
  // Candles on the table
  [80, 160].forEach((x, i) => {
    ctx.fillStyle = INK;
    ctx.fillRect(x, 101, 3, 16);
    flame(ctx, x + 1.5, 101, 7, 2.2, t, i * 3);
  });

  ctx.fillStyle = INK;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
}

export function drawPresent(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#ffe7b3');
  g.addColorStop(1, '#d0743a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Christmas tree with twinkling lights
  ctx.fillStyle = INK;
  poly(ctx, [[45, 20], [80, 75], [10, 75]]);
  poly(ctx, [[45, 45], [88, 115], [2, 115]]);
  poly(ctx, [[45, 80], [95, 145], [-5, 145]]);
  ctx.fillRect(40, 140, 10, 10);
  const lights = ['#ff3b3b', '#3bff6a', '#3b8bff', '#ffe03b', '#ff3bff'];
  for (let i = 0; i < 18; i++) {
    const y = 35 + i * 6;
    const half = (y - 20) * 0.38;
    const x = 45 + Math.sin(i * 2.4) * half * 0.8;
    const on = Math.sin(t * 3 + i * 1.3) > -0.3;
    ctx.fillStyle = on ? lights[i % lights.length] : '#3a2a20';
    circle(ctx, x, y, 2.6);
  }
  ctx.fillStyle = '#ffe03b';
  circle(ctx, 45, 18, 4);

  // Sofa with the grown-ups
  ctx.fillStyle = INK;
  ctx.fillRect(138, 90, 112, 30);
  person(ctx, 168, 1, { seated: true, arm: 1.2 + Math.sin(t * 1.5) * 0.2, facing: -1 });
  person(ctx, 214, 1, { seated: true, bun: true, arm: 0.9, facing: -1 });
  ctx.fillStyle = INK;
  ctx.fillRect(132, 118, 124, 18);
  ctx.fillRect(130, 104, 12, 46);
  ctx.fillRect(244, 104, 12, 46);

  // Kid jumping with a present held high
  const jump = -Math.abs(Math.sin(t * 4)) * 10;
  const hand = person(ctx, 108, 0.65, { bob: jump, arm: 2.9, facing: -1 });
  ctx.fillStyle = INK;
  ctx.fillRect(hand[0] - 8, hand[1] - 13, 16, 13);
  ctx.fillRect(hand[0] - 2, hand[1] - 19, 4, 6);

  // Presents under the tree
  ctx.fillRect(14, 136, 16, 14);
  ctx.fillRect(58, 132, 20, 18);

  // Dog wagging its tail
  ctx.beginPath();
  ctx.ellipse(100, 141, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, 88, 135, 5);
  ctx.fillRect(90, 141, 3, 9);
  ctx.fillRect(106, 141, 3, 9);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(112, 138);
  ctx.lineTo(120, 130 + Math.sin(t * 14) * 4);
  ctx.stroke();

  ctx.fillRect(0, FLOOR, W, H - FLOOR);
}


export function drawFrame(ctx, era) {
  // Window frame / muntins
  ctx.fillStyle = era === 'past' ? '#2b170c' : '#f3efe6';
  ctx.fillRect(0, 0, W, 7);
  ctx.fillRect(0, H - 7, W, 7);
  ctx.fillRect(0, 0, 7, H);
  ctx.fillRect(W - 7, 0, 7, H);
  ctx.fillRect(W / 2 - 2.5, 0, 5, H);
  ctx.fillRect(0, H / 2 - 2.5, W, 5);
  // Frost in the bottom corners
  [[7, H - 7], [W - 7, H - 7]].forEach(([x, y]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  });
}


// ---------- More olden-days window scenes, so every house is different ----------
function warmRoom(ctx, gx, gy) {
  const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, 260);
  g.addColorStop(0, '#ffd27a');
  g.addColorStop(0.45, '#e08a35');
  g.addColorStop(1, '#5a2208');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function fireplace(ctx, x0, t) {
  ctx.fillStyle = INK;
  ctx.fillRect(x0 - 4, 76, 60, 7);
  ctx.fillRect(x0, 83, 9, 67);
  ctx.fillRect(x0 + 43, 83, 9, 67);
  ctx.fillStyle = '#3a1404';
  ctx.fillRect(x0 + 9, 95, 34, 55);
  for (let i = 0; i < 3; i++) flame(ctx, x0 + 16 + i * 10, 148, 26 - i * 3, 6, t, i * 2.1);
}

function floorLine(ctx) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
}

// Decorating the tree: child on a stool placing the star, father steadying, mother knitting
export function drawPastTree(ctx, t) {
  warmRoom(ctx, 70, 60);
  ctx.fillStyle = INK;
  poly(ctx, [[70, 30], [100, 70], [40, 70]]);
  poly(ctx, [[70, 52], [110, 108], [30, 108]]);
  poly(ctx, [[70, 85], [118, 145], [22, 145]]);
  ctx.fillRect(64, 142, 12, 8);
  // Candles on the tree
  for (let i = 0; i < 9; i++) {
    const y = 48 + i * 10;
    const x = 70 + Math.sin(i * 2.3) * (y - 30) * 0.35;
    flame(ctx, x, y, 5, 1.6, t, i);
  }
  // Stool + child reaching up with the star
  ctx.fillStyle = INK;
  ctx.fillRect(108, 128, 24, 4);
  ctx.fillRect(110, 132, 4, 18);
  ctx.fillRect(126, 132, 4, 18);
  const reach = person(ctx, 120, 0.62, { floor: 128, arm: 2.9 + Math.sin(t * 2) * 0.15, facing: -1, dress: true });
  ctx.fillStyle = '#fff2a8';
  poly(ctx, [[reach[0], reach[1] - 7], [reach[0] + 3, reach[1]], [reach[0] - 3, reach[1]]]);
  person(ctx, 150, 1, { arm: 2.2, facing: -1, hat: true });
  // Mother knitting in an armchair
  ctx.fillStyle = INK;
  ctx.fillRect(200, 92, 44, 58);
  person(ctx, 206, 1, { seated: true, bun: true, facing: -1, arm: 1.3 + Math.sin(t * 6) * 0.15 });
  floorLine(ctx);
}

// A dance: someone plays the piano while a couple waltzes and a child claps
export function drawPastDance(ctx, t) {
  warmRoom(ctx, 128, 50);
  // Chandelier
  ctx.fillStyle = INK;
  ctx.fillRect(127, 0, 2, 18);
  ctx.fillRect(112, 18, 32, 3);
  [114, 128, 142].forEach((x, i) => flame(ctx, x, 17, 6, 1.8, t, i));
  // Piano + pianist
  ctx.fillStyle = INK;
  ctx.fillRect(8, 82, 46, 68);
  ctx.fillRect(4, 78, 54, 6);
  person(ctx, 70, 1, { seated: true, facing: -1, arm: 1.5 + Math.sin(t * 8) * 0.2, bob: Math.sin(t * 4) * 1.5 });
  // Waltzing couple sways together
  const sway = Math.sin(t * 1.6) * 14;
  person(ctx, 128 + sway, 1, { arm: 1.6, facing: 1, hat: true });
  person(ctx, 160 + sway, 1, { arm: 1.6, facing: -1, bun: true, dress: true });
  // Clapping child
  person(ctx, 215, 0.6, { arm: 1.6 + Math.abs(Math.sin(t * 6)) * 0.6, facing: -1, bob: -Math.abs(Math.sin(t * 3)) * 2 });
  floorLine(ctx);
}

// Grandpa reads a story by the fire, children listen, the cat sleeps
export function drawPastStory(ctx, t) {
  warmRoom(ctx, 40, 120);
  fireplace(ctx, 4, t);
  // Armchair + grandpa with book
  ctx.fillStyle = INK;
  ctx.fillRect(78, 88, 14, 62);
  const book = person(ctx, 98, 1, { seated: true, facing: 1, arm: 1.25 + Math.sin(t * 0.7) * 0.05 });
  ctx.fillRect(book[0] - 1, book[1] - 9, 12, 9);
  // Children sitting on the floor, one nodding along
  person(ctx, 175, 0.6, { seated: true, facing: -1, arm: 0.8, bob: Math.sin(t * 2) * 1.2 });
  person(ctx, 210, 0.55, { seated: true, facing: -1, arm: 0.4, bun: true });
  // Cat curled by the fire, tail flicking
  ctx.beginPath();
  ctx.ellipse(70, 144, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, 60, 139, 5);
  poly(ctx, [[56, 136], [57, 130], [60, 135]]);
  poly(ctx, [[61, 135], [64, 130], [64, 136]]);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(80, 146);
  ctx.quadraticCurveTo(88, 140, 86 + Math.sin(t * 3) * 3, 134);
  ctx.stroke();
  // Window clock on the wall
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(200, 45, 12, 0, Math.PI * 2);
  ctx.stroke();
  floorLine(ctx);
}

export const DRAW = {
  past: drawPast,
  pastDinner: drawPast,
  pastTree: drawPastTree,
  pastDance: drawPastDance,
  pastStory: drawPastStory,
  present: drawPresent,
};
