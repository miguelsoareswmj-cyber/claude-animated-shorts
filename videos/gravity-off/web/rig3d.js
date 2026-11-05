// 3D cast for the bright style: the same character design (round head, spring curl, hoodie, sneakers,
// thick dark outline) built from real 3D parts so it holds up from any camera angle. Faces and hoodie
// details are drawn on canvas decals so expressions stay as readable as the 2D design.
import * as THREE from 'three';
import { OUTFITS } from './rig.js';
export { OUTFITS };
export const INK = '#26202e';
const INKC = 0x1e1a26;
const rad = (d) => (d * Math.PI) / 180;

// ---------- materials ----------
const matCache = new Map();
const smat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, metalness: 0, emissive: c, emissiveIntensity: 0.1, ...o })); return matCache.get(k); };
const inkMat = (w) => { const m = new THREE.MeshBasicMaterial({ color: INKC, side: THREE.BackSide });
  m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${w.toFixed(4)};`); }; return m; };
const INK_W = 0.016;
const ink1 = inkMat(INK_W), ink2 = inkMat(INK_W * 0.75);
function part(geo, mat, ink = ink1) { const g = new THREE.Group(); const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
  if (ink) { const h = new THREE.Mesh(geo, ink); g.add(h); } g.userData.m = m; return g; }
const limb = (r, len) => { const g = new THREE.CapsuleGeometry(r, len, 4, 12); g.translate(0, -len / 2, 0); return g; };

// ---------- face + hoodie decals ----------
function drawFace(g, o, p) {
  const S = 512; g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = INK;
  const mood = p.mood || 'happy', mouth = p.mouth || 0, lx = p.look || 0, cx = 256, ey = 230;
  g.fillStyle = 'rgba(255,120,140,.42)'; for (const x of [130, 382]) { g.beginPath(); g.ellipse(x, 320, 40, 22, 0, 0, 7); g.fill(); }
  const eye = (x) => {
    if (p.blink) { g.lineWidth = 12; g.beginPath(); g.moveTo(x - 30, ey + 6); g.quadraticCurveTo(x, ey + 20, x + 30, ey + 6); g.stroke(); return; }
    if (mood === 'shock' || mood === 'scream') { const big = mood === 'scream' ? 1.12 : 1; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, 44 * big, 52 * big, 0, 0, 7); g.fill(); g.lineWidth = 12; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx * 14, ey + 8, mood === 'scream' ? 12 : 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 6 + lx * 14, ey + 1, 6, 0, 7); g.fill(); }
    else if (mood === 'smug') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey + 6, 34, 22, 0, 0, Math.PI); g.fill(); g.lineWidth = 12; g.beginPath(); g.moveTo(x - 36, ey); g.lineTo(x + 36, ey); g.stroke(); g.beginPath(); g.ellipse(x, ey + 6, 34, 22, 0, 0, Math.PI); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + 6 + lx * 10, ey + 11, 12, 0, Math.PI); g.fill(); }
    else { g.fillStyle = INK; g.beginPath(); g.ellipse(x + lx * 12, ey, 19, 26, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 6 + lx * 12, ey - 9, 7, 0, 7); g.fill(); }
  };
  eye(176); eye(336);
  g.fillStyle = INK; g.lineWidth = 15;
  if (mood === 'shock' || mood === 'scream') { g.beginPath(); g.moveTo(128, 144); g.quadraticCurveTo(170, 112, 212, 132); g.moveTo(300, 132); g.quadraticCurveTo(342, 112, 384, 144); g.stroke(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(132, 190); g.lineTo(214, 176); g.moveTo(298, 168); g.quadraticCurveTo(346, 154, 382, 170); g.stroke(); }
  else if (mood === 'worried') { g.beginPath(); g.moveTo(132, 156); g.lineTo(212, 178); g.moveTo(300, 178); g.lineTo(380, 156); g.stroke(); }
  else { g.beginPath(); g.moveTo(136, 168); g.quadraticCurveTo(176, 150, 214, 164); g.moveTo(298, 164); g.quadraticCurveTo(336, 150, 376, 168); g.stroke(); }
  g.lineWidth = 9; g.beginPath(); g.moveTo(256, 268); g.quadraticCurveTo(242, 300, 262, 306); g.stroke();
  g.lineWidth = 12; const my = 360;
  if (mood === 'scream' || mood === 'shock' || mouth > 0.15) { const m = mood === 'scream' ? 1.35 : mood === 'shock' ? 1 : 0.4 + mouth * 0.7; const rw = 42 * Math.min(1.2, 0.7 + m * 0.4), rh = 46 * m;
    g.beginPath(); g.ellipse(cx, my, rw, rh, 0, 0, 7); g.fillStyle = '#6a1f33'; g.fill(); g.stroke();
    g.save(); g.beginPath(); g.ellipse(cx, my, rw, rh, 0, 0, 7); g.clip(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(cx, my + rh * 0.9, 30, 18, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(cx - 34, my - rh, 68, 15); g.restore(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(198, 352); g.quadraticCurveTo(270, 386, 326, 334); g.stroke(); }
  else if (mood === 'worried') { g.beginPath(); g.moveTo(200, 380); g.quadraticCurveTo(256, 352, 312, 380); g.stroke(); }
  else { g.beginPath(); g.moveTo(196, 340); g.quadraticCurveTo(256, 396, 316, 340); g.stroke(); }
  if (p.sweat) { g.fillStyle = '#9fe0ff'; g.lineWidth = 9; g.beginPath(); g.moveTo(450, 90); g.quadraticCurveTo(414, 150, 450, 168); g.quadraticCurveTo(486, 150, 450, 90); g.fill(); g.stroke(); }
}
function drawChest(g, o, p) {
  g.clearRect(0, 0, 256, 256); g.lineCap = 'round'; g.lineJoin = 'round';
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  if (o.tie) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(98, 0); g.lineTo(128, 110); g.lineTo(158, 0); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    g.fillStyle = o.tie; g.beginPath(); g.moveTo(118, 8); g.lineTo(138, 8); g.lineTo(146, 110); g.lineTo(128, 136); g.lineTo(110, 110); g.closePath(); g.fill(); g.stroke(); }
  else { for (const x of [106, 150]) { g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 70); g.stroke(); g.fillStyle = o.shirt2; g.beginPath(); g.roundRect(x - 7, 68, 14, 20, 4); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); }
    g.fillStyle = '#4cc9f0'; g.beginPath(); g.moveTo(200, 40); g.quadraticCurveTo(184, 66, 200, 76); g.quadraticCurveTo(216, 66, 200, 40); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); }
  if (o.vest) { g.fillStyle = o.vest; for (const x of [40, 172]) { g.beginPath(); g.roundRect(x, 0, 44, 250, 8); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); } g.fillStyle = '#f6f6f6'; g.fillRect(40, 120, 176, 16); }
  if (!o.tie) { g.fillStyle = shade(o.shirt, 0.88); g.beginPath(); g.moveTo(66, 150); g.lineTo(190, 150); g.lineTo(206, 214); g.lineTo(50, 214); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(128, 150); g.lineTo(128, 214); g.stroke(); }
  if (p.stain) { g.fillStyle = 'rgba(110,60,30,.92)'; for (const [x, y, r] of [[96, 110, 36], [136, 130, 28], [76, 160, 20], [160, 96, 14]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
}

// ---------- the character ----------
export class Char3D {
  constructor(scene, outfit, h = 2.0) {
    this.o = outfit; this.h = h; const k = h / 2.0; this.k = k;
    const o = outfit;
    const root = new THREE.Group(); this.root = root; this.mesh = root; scene.add(root);
    const body = new THREE.Group(); root.add(body); this.body = body; body.scale.setScalar(k);
    // hips + legs
    const hips = new THREE.Group(); hips.position.y = 0.5; body.add(hips); this.hips = hips;
    this.legs = [-1, 1].map((s) => {
      const hip = new THREE.Group(); hip.position.set(s * 0.085, 0, 0); hips.add(hip);
      hip.add(part(limb(0.05, 0.2), smat(o.pants)));
      const knee = new THREE.Group(); knee.position.y = -0.25; hip.add(knee);
      knee.add(part(limb(0.047, 0.17), smat(o.pants)));
      const cuff = part(new THREE.CylinderGeometry(0.058, 0.058, 0.05, 14), smat(o.pants, { emissiveIntensity: 0.2 }), ink2); cuff.position.y = -0.2; knee.add(cuff);
      const foot = new THREE.Group(); foot.position.y = -0.245; knee.add(foot);
      const shoe = part(new THREE.CapsuleGeometry(0.06, 0.08, 4, 12), smat(o.shoe)); shoe.rotation.x = Math.PI / 2; shoe.position.set(0, -0.0, 0.05); shoe.scale.set(1.05, 1, 0.8); foot.add(shoe);
      const sole = part(new THREE.BoxGeometry(0.13, 0.03, 0.22), smat('#ffffff'), ink2); sole.position.set(0, -0.05, 0.05); foot.add(sole);
      return { hip, knee, foot };
    });
    // torso (hoodie)
    const torso = new THREE.Group(); torso.position.y = 0.5; body.add(torso); this.torso = torso;
    const tg = new THREE.CapsuleGeometry(0.2, 0.22, 6, 18); tg.scale(1.08, 1, 0.78); tg.translate(0, 0.27, 0);
    torso.add(part(tg, smat(o.shirt)));
    const hem = part(new THREE.CylinderGeometry(0.21, 0.22, 0.06, 20), smat(o.shirt2), ink2); hem.scale.z = 0.8; hem.position.y = 0.075; torso.add(hem);
    const hood = part(new THREE.TorusGeometry(0.13, 0.05, 10, 20), smat(o.shirt, { emissiveIntensity: 0 }), ink2); hood.rotation.x = Math.PI / 2; hood.position.set(0, 0.6, -0.02); torso.add(hood);
    // chest decal
    this.cc = document.createElement('canvas'); this.cc.width = this.cc.height = 256; this.cg = this.cc.getContext('2d', { willReadFrequently: true });
    this.ct = new THREE.CanvasTexture(this.cc); this.ct.colorSpace = THREE.SRGBColorSpace;
    const chest = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: this.ct, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    chest.position.set(0, 0.32, 0.168); torso.add(chest);
    // arms
    this.arms = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.23, 0.52, 0); torso.add(sh);
      sh.add(part(limb(0.045, 0.17), smat(o.shirt)));
      const el = new THREE.Group(); el.position.y = -0.21; sh.add(el);
      el.add(part(limb(0.042, 0.15), smat(o.shirt)));
      const cuffA = part(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), smat(o.shirt2), ink2); cuffA.position.y = -0.19; el.add(cuffA);
      const hand = new THREE.Group(); hand.position.y = -0.25; el.add(hand);
      hand.add(part(new THREE.SphereGeometry(0.06, 16, 12), smat(o.skin)));
      const thumb = part(new THREE.SphereGeometry(0.025, 10, 8), smat(o.skin), ink2); thumb.position.set(-s * 0.045, 0.02, 0.03); hand.add(thumb);
      return { sh, el, hand };
    });
    // head
    const neck = new THREE.Group(); neck.position.y = 0.62; torso.add(neck); this.neck = neck;
    const headG = new THREE.Group(); headG.position.y = 0.3; neck.add(headG); this.head = headG;
    const hg = new THREE.SphereGeometry(0.33, 40, 28); hg.scale(1, 0.94, 0.92);
    headG.add(part(hg, smat(o.skin, { emissiveIntensity: 0.28 })));
    for (const s of [-1, 1]) { const ear = part(new THREE.SphereGeometry(0.06, 12, 10), smat(o.skin), ink2); ear.scale.set(0.6, 1, 0.8); ear.position.set(s * 0.33, 0.0, 0); headG.add(ear); }
    // face decal: a patch of a slightly larger sphere facing +z
    this.fc = document.createElement('canvas'); this.fc.width = this.fc.height = 512; this.fg = this.fc.getContext('2d', { willReadFrequently: true });
    this.ft = new THREE.CanvasTexture(this.fc); this.ft.colorSpace = THREE.SRGBColorSpace;
    const pl = Math.PI * 0.62, tl = Math.PI * 0.55; const fgeo = new THREE.SphereGeometry(0.333, 32, 24, Math.PI / 2 - pl / 2 + Math.PI, pl, Math.PI / 2 - tl / 2 + 0.05, tl);
    fgeo.scale(1, 0.94, 0.92); fgeo.rotateY(Math.PI);
    const face = new THREE.Mesh(fgeo, new THREE.MeshBasicMaterial({ map: this.ft, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    headG.add(face); this.faceMesh = face;
    // the signature spring curl (3D tube)
    const pts = [new THREE.Vector3(0, 0.29, 0), new THREE.Vector3(-0.005, 0.37, 0)];
    for (let i = 0; i <= 26; i++) { const a = -Math.PI / 2 - i / 26 * Math.PI * 2 * 0.9; pts.push(new THREE.Vector3(0.07 + Math.cos(a) * 0.075 + i * 0.001, 0.47 + Math.sin(a) * 0.075 + 0.075 * 0, 0)); }
    pts.push(new THREE.Vector3(0.13, 0.56, 0), new THREE.Vector3(0.2, 0.62, 0));
    const curlG = new THREE.Group(); const cg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.03, 10);
    curlG.add(part(cg, smat(o.hair, { emissiveIntensity: 0 }), inkMat(0.012))); headG.add(curlG); this.curl = curlG;
    // contact shadow
    const s = document.createElement('canvas'); s.width = s.height = 128; const sg = s.getContext('2d'); const r = sg.createRadialGradient(64, 64, 4, 64, 64, 60); r.addColorStop(0, 'rgba(60,70,110,.45)'); r.addColorStop(1, 'rgba(60,70,110,0)'); sg.fillStyle = r; sg.fillRect(0, 0, 128, 128);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * k, 0.6 * k), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); this.blob.rotation.x = -Math.PI / 2; scene.add(this.blob);
    this.faceKey = ''; this.chestKey = ''; this.heading = null; this.hands = { handL: ['L'], handR: ['R'] };
  }
  /** pose: { legs:[[hipX, knee],[..]], arms:[[swingX, raiseZ, elbow],[..]], bob, lean, tilt, headTilt, headTurn, curl, mood, mouth, blink, look, sweat, stain } */
  pose(p) {
    const L = (p.legs || [[0, 0], [0, 0]]).map((x) => x.slice()), A = (p.arms || [[0, 8, 10], [0, 8, 10]]).map((x) => x.slice());
    // 2D-style shorthand: armL/armR [raiseDeg, elbowDeg], legL/legR [splayDeg, kneeDeg, lift]
    if (p.armL) A[0] = [p.armL[2] || 0, p.armL[0], p.armL[1]]; if (p.armR) A[1] = [p.armR[2] || 0, p.armR[0], p.armR[1]];
    if (p.legL) L[0] = [-(p.legL[2] || 0) * 50, p.legL[1] * 0.8 + (p.legL[2] || 0) * 70, -p.legL[0]];
    if (p.legR) L[1] = [-(p.legR[2] || 0) * 50, p.legR[1] * 0.8 + (p.legR[2] || 0) * 70, p.legR[0]];
    this.legs.forEach((l, i) => { l.hip.rotation.set(rad(L[i][0]), 0, rad(L[i][2] || 0) * (i ? 1 : -1)); l.knee.rotation.x = rad(L[i][1]); l.foot.rotation.x = -rad(L[i][0] + L[i][1]) * 0.5; });
    this.arms.forEach((a, i) => { const s = i ? 1 : -1; a.sh.rotation.set(rad(A[i][0]), 0, s * rad(A[i][1])); a.el.rotation.x = -rad(A[i][2]); });
    const bob = Math.abs(p.bob || 0) > 0.5 ? -(p.bob || 0) * 0.002 : (p.bob || 0); this.body.position.y = bob * this.k; this.torso.rotation.set(rad(p.lean || 0), 0, rad(p.tilt || 0));
    this.neck.rotation.set(rad(p.nod || 0), rad(p.headTurn || 0), rad(p.headTilt || 0));
    this.curl.rotation.z = (p.curl || 0) * 0.35; this.curl.rotation.x = (p.curl || 0) * 0.2;
    const fk = [p.mood, Math.round((p.mouth || 0) * 4), !!p.blink, Math.round((p.look || 0) * 2), !!p.sweat].join();
    if (fk !== this.faceKey) { drawFace(this.fg, this.o, p); this.ft.needsUpdate = true; this.faceKey = fk; }
    const ck = String(!!p.stain); if (ck !== this.chestKey) { drawChest(this.cg, this.o, p); this.ct.needsUpdate = true; this.chestKey = ck; }
  }
  place(x, y, z, groundY = 0.6) { this.root.position.set(x, y, z); this.blob.position.set(x, groundY + 0.02, z); const up = Math.max(0, y - groundY); this.blob.scale.setScalar(Math.max(0.2, 1 - up * 0.15)); this.blob.material.opacity = Math.max(0, 1 - up * 0.12); }
  /** face the camera (or a fixed heading if set); spin rolls the whole body */
  face(cam, spin = 0) { const h = this.heading !== null ? this.heading : Math.atan2(cam.position.x - this.root.position.x, cam.position.z - this.root.position.z);
    this.root.rotation.set(0, h, 0); if (spin) this.root.rotateZ(spin); this.root.updateMatrixWorld(true); }
  /** world points: 'L'/'R' hands, or design-space px (600x1000 card space) mapped onto the body */
  local(px, py) { this.root.updateMatrixWorld(true); if (px === 'L' || px === 'R') { const v = new THREE.Vector3(); this.arms[px === 'L' ? 0 : 1].hand.getWorldPosition(v); return v; }
    return new THREE.Vector3((px - 300) * this.h / 1000, (1000 - py) * this.h / 1000, 0.18 * this.k).applyMatrix4(this.root.matrixWorld); }
}

// ---------- 3D motions (same names as the 2D rig, 3D meaning) ----------
export const walk = (t, speed = 1) => { const ph = t * 0.3 * speed, s = Math.sin(ph), c = Math.cos(ph);
  return { legs: [[s * 30, Math.max(0, -c) * 40 + 6], [-s * 30, Math.max(0, c) * 40 + 6]], arms: [[-s * 28, 8, 18], [s * 28, 8, 18]], bob: -Math.abs(c) * 0.035 + 0.02, lean: 4, tilt: s * 2, curl: Math.sin(ph * 2) * 0.6, headTilt: -s * 2, t }; };
export const flail = (t) => { const a = Math.sin(t * 0.9), b = Math.sin(t * 1.1 + 1);
  return { legs: [[20 + a * 30, 40 + b * 30, 10], [-20 - b * 30, 40 - a * 25, 10]], arms: [[a * 30, 140 + b * 25, 30 + a * 30], [-b * 30, 140 - a * 25, 30 - b * 30]], tilt: a * 8, headTilt: b * 8, curl: a * 1.5, lean: -6, t }; };
export const standPose = (t) => ({ legs: [[0, 2], [0, 2]], arms: [[0, 8, 12], [0, 8, 12]], bob: Math.sin(t * 0.08) * 0.004, curl: Math.sin(t * 0.1) * 0.2, t });
export const blinkAt = (t, seed = 0) => (Math.floor(t + seed * 17) % 58) < 3;
// helpers translating the 2D-style arm/leg shorthand used in shots ([deg, deg]) into 3D poses
export function arms2(p, armL, armR) { const conv = (a) => (a ? [a[0] > 90 ? 0 : -a[0] * 0.3, a[0] > 90 ? a[0] : 10 + a[0] * 0.4, a[1] * 0.8] : null);
  const A = p.arms ? p.arms.slice() : [[0, 8, 12], [0, 8, 12]]; if (armL) A[0] = conv(armL); if (armR) A[1] = conv(armR); return { ...p, arms: A }; }

// ---------- the dog (3D, same look) ----------
export class Dog3D {
  constructor(scene) {
    const root = new THREE.Group(); this.root = root; this.mesh = root; scene.add(root);
    const fur = smat('#f2b96b'), dark = smat('#c57a3e'), white = smat('#fff3e0');
    const body = new THREE.Group(); body.position.y = 0.36; root.add(body); this.body = body;
    const bg = new THREE.CapsuleGeometry(0.16, 0.3, 6, 16); bg.rotateX(Math.PI / 2); body.add(part(bg, fur));
    const belly = part(new THREE.SphereGeometry(0.15, 16, 12), white, ink2); belly.scale.set(0.9, 0.6, 1.5); belly.position.set(0, -0.06, 0); body.add(belly);
    const collar = part(new THREE.TorusGeometry(0.12, 0.03, 8, 18), smat('#ff4f5e'), ink2); collar.position.set(0, 0.06, 0.25); collar.rotation.x = 0.3; body.add(collar);
    this.legs = [[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.2], [0.09, -0.2]].map(([x, z]) => { const hip = new THREE.Group(); hip.position.set(x, -0.08, z); body.add(hip); hip.add(part(limb(0.045, 0.16), fur)); const paw = part(new THREE.SphereGeometry(0.055, 12, 8), white, ink2); paw.position.y = -0.24; paw.scale.set(1, 0.7, 1.3); hip.add(paw); return hip; });
    const tail = new THREE.Group(); tail.position.set(0, 0.08, -0.3); body.add(tail); const tl = part(limb(0.035, 0.18), fur); tl.rotation.x = Math.PI * 0.8; tail.add(tl); this.tail = tail;
    const head = new THREE.Group(); head.position.set(0, 0.2, 0.33); body.add(head); this.head = head;
    head.add(part(new THREE.SphereGeometry(0.17, 24, 18), fur));
    const snout = part(new THREE.SphereGeometry(0.1, 16, 12), white); snout.scale.set(1, 0.8, 1.1); snout.position.set(0, -0.05, 0.14); head.add(snout);
    const nose = part(new THREE.SphereGeometry(0.035, 12, 8), smat('#26202e'), ink2); nose.position.set(0, -0.01, 0.25); head.add(nose);
    this.jaw = new THREE.Group(); this.jaw.position.set(0, -0.09, 0.08); head.add(this.jaw); const jw = part(new THREE.SphereGeometry(0.07, 12, 8), white, ink2); jw.scale.set(1, 0.4, 1.3); jw.position.set(0, -0.01, 0.08); this.jaw.add(jw);
    for (const s of [-1, 1]) { const ear = part(new THREE.SphereGeometry(0.08, 12, 10), dark); ear.scale.set(0.5, 1.2, 0.9); ear.position.set(s * 0.15, 0.04, -0.02); ear.rotation.z = s * 0.4; head.add(ear); }
    this.eyes = [-1, 1].map((s) => { const e = part(new THREE.SphereGeometry(0.038, 12, 10), smat('#ffffff', { emissiveIntensity: 0.4 }), ink2); e.position.set(s * 0.07, 0.05, 0.14); head.add(e); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0x26202e })); pu.position.set(0, 0, 0.03); e.add(pu); return { e, pu }; });
    this.brows = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x26202e })); b.position.set(s * 0.07, 0.11, 0.155); head.add(b); return b; });
    const s = document.createElement('canvas'); s.width = s.height = 128; const sg = s.getContext('2d'); const r = sg.createRadialGradient(64, 64, 4, 64, 64, 60); r.addColorStop(0, 'rgba(60,70,110,.45)'); r.addColorStop(1, 'rgba(60,70,110,0)'); sg.fillStyle = r; sg.fillRect(0, 0, 128, 128);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); this.blob.rotation.x = -Math.PI / 2; scene.add(this.blob);
    this.heading = null;
  }
  pose({ t = 0, run = 0, bark = 0, look = 0, worried = false, legs = 0 } = {}) {
    this.legs.forEach((l, i) => { const ph = [0, Math.PI, Math.PI, 0][i]; l.rotation.x = Math.sin(t * 0.6 + ph) * 0.7 * run + (legs ? Math.sin(t * 0.9 + i * 1.7) * 0.8 : 0); l.rotation.z = legs ? Math.sin(t * 0.7 + i) * 0.3 : 0; });
    this.tail.rotation.y = Math.sin(t * 0.9) * 0.6; this.body.position.y = 0.36 + Math.abs(Math.sin(t * 0.6)) * 0.04 * run;
    this.head.rotation.x = look * 0.6; this.jaw.rotation.x = bark * 0.6;
    this.eyes.forEach(({ e, pu }, i) => { const k = worried ? 1.25 : 1; e.scale.setScalar(k); pu.position.set(0, look ? -0.01 : 0, 0.03); });
    this.brows.forEach((b, i) => { b.visible = worried; b.rotation.z = (i ? -1 : 1) * 0.4; });
  }
  get position() { return this.root.position; }
  place(x, y, z, groundY = 0.6) { this.root.position.set(x, y, z); this.blob.position.set(x, groundY + 0.02, z); this.blob.visible = y - groundY < 3; }
  face(cam, spin = 0) { const h = this.heading !== null ? this.heading : Math.atan2(cam.position.x - this.root.position.x, cam.position.z - this.root.position.z); this.root.rotation.set(0, h, 0); if (spin) this.root.rotateZ(spin); }
}
