// Animated 2D cast for the bright style: the same character design, redrawn every frame from a pose
// (walk cycles, flailing arms, kicking legs, head tilt, blinks, mouth, curl bounce).
import * as THREE from 'three';
export const INK = '#26202e';
const OL = 14;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const rad = (d) => (d * Math.PI) / 180;

export const OUTFITS = {
  curly: { shirt: '#ff6b4a', shirt2: '#ffd166', pants: '#3d5bd9', shoe: '#ff4f8b', hair: '#3a2a24', skin: '#fff3e6' },
  jay: { shirt: '#7b5cff', shirt2: '#ffd166', pants: '#ff8fab', shoe: '#2ec4b6', hair: '#1b1b2f', skin: '#c98a5a' },
  mia: { shirt: '#ffc93c', shirt2: '#4cc9f0', pants: '#2a9d8f', shoe: '#7b5cff', hair: '#e07a2b', skin: '#f6d2b0' },
  p1: { shirt: '#2ec4b6', shirt2: '#ff6b4a', pants: '#3a3a5a', shoe: '#ffd166', hair: '#f2c14e', skin: '#ffe0c2' },
  p2: { shirt: '#ff8fab', shirt2: '#4cc9f0', pants: '#5a4fcf', shoe: '#ffffff', hair: '#6b3e26', skin: '#e8b48a' },
  boss: { shirt: '#2f3f7a', shirt2: '#ffffff', pants: '#2a2f45', shoe: '#3a2a24', hair: '#3a2a24', skin: '#f6d2b0', tie: '#ff4f5e' },
  worker: { shirt: '#3d5bd9', shirt2: '#ffd166', pants: '#3a3a5a', shoe: '#6b3e26', hair: '#6b3e26', skin: '#c98a5a', vest: '#ff8a1f' },
  pilot: { shirt: '#ffffff', shirt2: '#2f3f7a', pants: '#2f3f7a', shoe: '#222222', hair: '#222222', skin: '#ffe0c2' },
  p3: { shirt: '#9be07a', shirt2: '#7b5cff', pants: '#2f3b52', shoe: '#ff6b4a', hair: '#222222', skin: '#8d5a3b' },
};

/** pose: { bob, tilt, headTilt, armL:[shoulderDeg, elbowDeg], armR, legL:[hipDeg, kneeDeg], legR, mood, mouth (0..1), blink, curl, sweat, hold } */
export function drawPerson(g, o, p) {
  g.clearRect(0, 0, 600, 1000);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const bob = p.bob || 0, tilt = rad(p.tilt || 0);
  const pel = [300, 730 + bob];
  const tube = (pts, w, col) => { g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q);
    g.strokeStyle = INK; g.lineWidth = w + OL * 2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const fs = (col, w = OL) => { g.fillStyle = col; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
  const rot = (pt, c, a) => { const s = Math.sin(a), k = Math.cos(a); const x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };
  // ---- legs (hip swing + knee bend), drawn first ----
  const leg = (side, [hip, knee, lift = 0]) => {
    const h0 = rot([pel[0] + side * 38, pel[1]], pel, tilt);
    const L1 = 120 * (1 - 0.32 * lift), L2 = 112 * (1 - 0.32 * lift);
    const a1 = rad(hip), k1 = [h0[0] + Math.sin(a1) * L1, h0[1] + Math.cos(a1) * L1];
    const a2 = a1 - rad(knee), k2 = [k1[0] + Math.sin(a2) * L2, k1[1] + Math.cos(a2) * L2];
    tube([h0, k1, k2], 40, o.pants);
    g.save(); g.translate(...k2); g.rotate(-a2);
    g.beginPath(); g.roundRect(-27, -14, 54, 22, 8); fs(shade(o.pants, 1.25), 9);
    g.beginPath(); g.ellipse(side * 16, 34, 52, 26, 0, Math.PI, 0); g.lineTo(side * 16 + 52, 44); g.lineTo(side * 16 - 52, 44); g.closePath(); fs(o.shoe, 10);
    g.beginPath(); g.roundRect(side * 16 - 56, 38, 112, 16, 8); fs('#ffffff', 9);
    g.restore();
  };
  leg(-1, p.legL || [0, 0]); leg(1, p.legR || [0, 0]);
  // ---- torso frame (everything above rotates with the body tilt) ----
  g.save(); g.translate(...pel); g.rotate(tilt); g.translate(-pel[0], -pel[1] + bob * 0);
  const dy = bob; // torso and up already offset through pel
  const T = (x, y) => [x, y + dy];
  // arms behind the torso edge
  const arm = (side, [sh, el], hand) => {
    const s0 = T(300 + side * 92, 530);
    const a1 = rad(sh) * side, u = [s0[0] + Math.sin(a1) * 105, s0[1] + Math.cos(a1) * 105];
    const a2 = a1 + rad(el) * side, h = [u[0] + Math.sin(a2) * 98, u[1] + Math.cos(a2) * 98];
    tube([s0, u, h], 36, o.shirt);
    g.save(); g.translate(...h); g.rotate(-a2 + Math.PI / 2);
    g.beginPath(); g.roundRect(-22, -24, 20, 48, 8); fs(o.shirt2, 9);
    g.beginPath(); g.ellipse(14, 0, 26, 24, 0, 0, 7); fs(o.skin, 10);
    g.beginPath(); g.ellipse(10, -22 * side, 10, 12, -0.5, 0, 7); fs(o.skin, 8);
    g.restore();
    return h;
  };
  const AL = p.armL || [8, 6], AR = p.armR || [8, 6]; let hL, hR;
  if (AL[0] < 70) hL = arm(-1, AL); if (AR[0] < 70) hR = arm(1, AR);
  // hood behind neck
  g.beginPath(); g.ellipse(300, 492 + dy, 112, 46, 0, 0, 7); fs(shade(o.shirt, 0.8));
  const body = () => { g.beginPath(); g.moveTo(202, 505 + dy); g.quadraticCurveTo(300, 470 + dy, 398, 505 + dy); g.quadraticCurveTo(420, 620 + dy, 412, 742 + dy); g.quadraticCurveTo(300, 772 + dy, 188, 742 + dy); g.quadraticCurveTo(180, 620 + dy, 202, 505 + dy); g.closePath(); };
  body(); g.fillStyle = o.shirt; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(o.shirt, 0.82); g.beginPath(); g.ellipse(410, 640 + dy, 90, 190, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(232, 580 + dy, 26, 70, -0.15, 0, 7); g.fill();
  g.fillStyle = o.shirt2; g.fillRect(170, 712 + dy, 260, 40); g.restore();
  body(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(238, 640 + dy); g.lineTo(362, 640 + dy); g.lineTo(378, 700 + dy); g.lineTo(222, 700 + dy); g.closePath(); fs(shade(o.shirt, 0.9), 9);
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(300, 640 + dy); g.lineTo(300, 700 + dy); g.stroke();
  const sway = Math.sin((p.t || 0) * 0.3) * 6;
  for (const x of [278, 322]) { g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.moveTo(x, 505 + dy); g.quadraticCurveTo(x + (x < 300 ? -6 : 6) + sway, 545 + dy, x + sway, 580 + dy); g.stroke(); g.beginPath(); g.roundRect(x - 6 + sway, 578 + dy, 12, 18, 4); fs(o.shirt2, 5); }
  g.beginPath(); g.moveTo(360, 560 + dy); g.quadraticCurveTo(342, 588 + dy, 360, 598 + dy); g.quadraticCurveTo(378, 588 + dy, 360, 560 + dy); fs('#4cc9f0', 6);
  if (o.tie) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(268, 500 + dy); g.lineTo(300, 600 + dy); g.lineTo(332, 500 + dy); g.closePath(); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.fillStyle = o.tie; g.beginPath(); g.moveTo(290, 510 + dy); g.lineTo(310, 510 + dy); g.lineTo(318, 600 + dy); g.lineTo(300, 625 + dy); g.lineTo(282, 600 + dy); g.closePath(); g.fill(); g.stroke(); }
  if (o.vest) { g.fillStyle = o.vest; for (const x of [222, 330]) { g.beginPath(); g.roundRect(x, 520 + dy, 48, 200, 10); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); } g.fillStyle = '#f6f6f6'; g.fillRect(222, 610 + dy, 156, 16); }
  if (p.stain) { g.fillStyle = 'rgba(110,60,30,.92)'; for (const [x, y, r] of [[262, 590, 38], [300, 612, 30], [236, 640, 22], [330, 575, 16], [282, 668, 14]]) { g.beginPath(); g.arc(x, y + dy, r, 0, 7); g.fill(); } }
  if (AL[0] >= 70) hL = arm(-1, AL); if (AR[0] >= 70) hR = arm(1, AR);
  // ---- head (tilts on the neck) ----
  g.save(); g.translate(300, 455 + dy); g.rotate(rad(p.headTilt || 0)); g.translate(-300, -455 - dy);
  const HX = 300, HY = 300 + dy, RX = 168, RY = 158;
  // the signature spring curl, bouncing
  const cb = (p.curl || 0) * 30;
  g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(292, 152 + dy);
  g.bezierCurveTo(252 - cb * 0.3, 84 + dy, 336 + cb * 0.2, 40 + dy - cb * 0.4, 356 + cb * 0.3, 86 + dy); g.bezierCurveTo(372 + cb * 0.3, 126 + dy, 316, 128 + dy, 320, 96 + dy); g.bezierCurveTo(324, 70 + dy, 364 + cb, 52 + dy - cb * 0.5, 388 + cb * 1.4, 30 + dy - cb); g.stroke();
  g.strokeStyle = o.hair; g.lineWidth = 18; g.stroke();
  g.beginPath(); g.ellipse(HX, HY, RX, RY, 0, 0, 7); g.fillStyle = o.skin; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(o.skin, 0.92); g.beginPath(); g.ellipse(HX + 175, HY + 40, 95, 190, -0.15, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(HX - 92, HY - 82, 34, 18, -0.6, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.ellipse(HX, HY, RX, RY, 0, 0, 7); g.lineWidth = OL * 1.15; g.strokeStyle = INK; g.stroke();
  for (const d of [-1, 1]) { g.beginPath(); g.ellipse(HX + d * (RX - 4), HY + 18, 20, 30, 0, d < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, d < 0 ? Math.PI * 1.5 : Math.PI * 0.5); fs(o.skin, 10); }
  g.fillStyle = 'rgba(255,120,140,.42)'; for (const x of [210, 390]) { g.beginPath(); g.ellipse(x, 360 + dy, 30, 17, 0, 0, 7); g.fill(); }
  const mood = p.mood || 'happy', mouth = p.mouth || 0, ey = 292 + dy, lx = p.look || 0;
  g.strokeStyle = INK; g.fillStyle = INK;
  const eye = (x) => {
    if (p.blink) { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 22, ey + 4); g.quadraticCurveTo(x, ey + 14, x + 22, ey + 4); g.stroke(); return; }
    if (mood === 'shock' || mood === 'scream') { const big = mood === 'scream' ? 1.12 : 1; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, 32 * big, 38 * big, 0, 0, 7); g.fill(); g.lineWidth = 9; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx * 10, ey + 6, mood === 'scream' ? 9 : 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4 + lx * 10, ey + 1, 4, 0, 7); g.fill(); }
    else if (mood === 'smug') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey + 4, 24, 16, 0, 0, Math.PI); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(x - 26, ey); g.lineTo(x + 26, ey); g.stroke(); g.beginPath(); g.ellipse(x, ey + 4, 24, 16, 0, 0, Math.PI); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + 4 + lx * 8, ey + 8, 9, 0, Math.PI); g.fill(); }
    else { g.beginPath(); g.ellipse(x + lx * 8, ey, 14, 19, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4 + lx * 8, ey - 6, 5, 0, 7); g.fill(); g.fillStyle = INK; }
  };
  eye(240); eye(360);
  g.lineWidth = 11;
  if (mood === 'shock' || mood === 'scream') { g.beginPath(); g.moveTo(205, 228 + dy); g.quadraticCurveTo(235, 205 + dy, 268, 218 + dy); g.moveTo(332, 218 + dy); g.quadraticCurveTo(365, 205 + dy, 395, 228 + dy); g.stroke(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(208, 262 + dy); g.lineTo(270, 252 + dy); g.moveTo(330, 246 + dy); g.quadraticCurveTo(365, 236 + dy, 392, 248 + dy); g.stroke(); }
  else if (mood === 'worried') { g.beginPath(); g.moveTo(208, 236 + dy); g.lineTo(268, 252 + dy); g.moveTo(332, 252 + dy); g.lineTo(392, 236 + dy); g.stroke(); }
  else { g.beginPath(); g.moveTo(212, 248 + dy); g.quadraticCurveTo(240, 236 + dy, 268, 246 + dy); g.moveTo(332, 246 + dy); g.quadraticCurveTo(360, 236 + dy, 388, 248 + dy); g.stroke(); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(300, 322 + dy); g.quadraticCurveTo(290, 345 + dy, 304, 350 + dy); g.stroke();
  g.lineWidth = 9;
  const my = 392 + dy;
  if (mood === 'scream' || mood === 'shock' || mouth > 0.15) { const m = mood === 'scream' ? 1.35 : mood === 'shock' ? 1 : 0.4 + mouth * 0.7;
    g.beginPath(); g.ellipse(300, my, 30 * Math.min(1.2, 0.7 + m * 0.4), 34 * m, 0, 0, 7); g.fillStyle = '#6a1f33'; g.fill(); g.stroke();
    g.save(); g.beginPath(); g.ellipse(300, my, 30 * Math.min(1.2, 0.7 + m * 0.4), 34 * m, 0, 0, 7); g.clip(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(300, my + 30 * m, 22, 14, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(276, my - 34 * m, 48, 12); g.restore(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(258, 388 + dy); g.quadraticCurveTo(312, 412 + dy, 352, 374 + dy); g.stroke(); }
  else if (mood === 'worried') { g.beginPath(); g.moveTo(262, 400 + dy); g.quadraticCurveTo(300, 380 + dy, 338, 400 + dy); g.stroke(); }
  else { g.beginPath(); g.moveTo(260, 380 + dy); g.quadraticCurveTo(300, 420 + dy, 340, 380 + dy); g.stroke(); }
  if (p.sweat) { g.fillStyle = '#9fe0ff'; g.lineWidth = 7; g.beginPath(); g.moveTo(455, 205 + dy); g.quadraticCurveTo(428, 250 + dy, 455, 264 + dy); g.quadraticCurveTo(482, 250 + dy, 455, 205 + dy); g.fill(); g.stroke(); }
  g.restore(); // head
  g.restore(); // torso
  return { handL: hL, handR: hR };
}

/** a camera-facing animated card */
export class Actor {
  constructor(scene, outfit, h = 2.0) {
    this.o = outfit; this.h = h;
    this.c = document.createElement('canvas'); this.c.width = 600; this.c.height = 1000; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.6, h).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false }));
    scene.add(this.mesh);
    const s = document.createElement('canvas'); s.width = s.height = 128; const sg = s.getContext('2d'); const r = sg.createRadialGradient(64, 64, 4, 64, 64, 60); r.addColorStop(0, 'rgba(60,70,110,.5)'); r.addColorStop(1, 'rgba(60,70,110,0)'); sg.fillStyle = r; sg.fillRect(0, 0, 128, 128);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.55, h * 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); this.blob.rotation.x = -Math.PI / 2; scene.add(this.blob);
    this.hands = null;
  }
  pose(p) { this.hands = drawPerson(this.g, this.o, p); this.tex.needsUpdate = true; }
  place(x, y, z, groundY = 0.6) { this.mesh.position.set(x, y, z); this.blob.position.set(x, groundY + 0.02, z); const up = Math.max(0, y - groundY); this.blob.scale.setScalar(Math.max(0.2, 1 - up * 0.15)); this.blob.material.opacity = Math.max(0, 1 - up * 0.12); }
  face(cam, spin = 0) { this.mesh.lookAt(cam.position.x, this.mesh.position.y, cam.position.z); if (spin) this.mesh.rotateZ(spin); }
  /** canvas px -> world, after face() */
  local(px, py) { this.mesh.updateMatrixWorld(); return new THREE.Vector3((px - 300) * this.h / 1000, (1000 - py) * this.h / 1000, 0.03).applyMatrix4(this.mesh.matrixWorld); }
}

// ---- reusable motions ----
export const walk = (t, speed = 1) => { const ph = t * 0.32 * speed; const s = Math.sin(ph);
  return { legL: [-3, 0, Math.max(0, s)], legR: [3, 0, Math.max(0, -s)], armL: [10 + s * 14, 14 + Math.max(0, s) * 30], armR: [10 - s * 14, 14 + Math.max(0, -s) * 30], bob: -Math.abs(s) * 16, tilt: s * 2.5, headTilt: -s * 2, curl: Math.sin(ph * 2) * 0.5, t }; };
export const flail = (t) => { const a = Math.sin(t * 0.9), b = Math.sin(t * 1.1 + 1);
  return { armL: [118 + a * 28, 25 + b * 30], armR: [118 - b * 28, 25 - a * 30], legL: [-14 + a * 16, 20 + b * 25, 0.3 + 0.3 * a], legR: [14 - b * 16, 20 - a * 25, 0.3 - 0.3 * b], tilt: a * 7, headTilt: b * 7, curl: a, t }; };
export const standPose = (t) => ({ armL: [8, 6], armR: [8, 6], legL: [0, 0], legR: [0, 0], bob: Math.sin(t * 0.08) * 2, curl: Math.sin(t * 0.1) * 0.15, t });
export const blinkAt = (t, seed = 0) => (Math.floor(t + seed * 17) % 58) < 3;
