// "Bright" house style test: a clean low-poly 3D city in soft high-key daylight (world),
// flat 2D cartoon cast with thick outlines and round heads (characters), no dark grade.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- palette (our own: cream concrete, sky-blue glass, mint water, coral + sunflower accents) ----------
const P = {
  sky: 0xbfe6ff, skyTop: 0x7cc8ff, ground: 0xeef0ea, sidewalk: 0xf6f3ec, road: 0x5b6474, lane: 0xffffff,
  water: 0x46d1d8, waterDeep: 0x23aebf, park: 0x9be07a, tree: [0x5fd08a, 0x48c59b, 0x7ad86a], trunk: 0x9c6b4a,
  walls: [0xf4f1ea, 0xe6edf5, 0xfbe9d8, 0xe9f2ea, 0xf3e6f0], roof: [0x8a93a8, 0x98a0b3, 0x7f89a0],
  glass: 0x69b7ff, accent: 0xff6b4a, accent2: 0xffc93c, cars: [0xff6b4a, 0xffc93c, 0x5bc0ff, 0xffffff, 0x7be07a, 0xff8fc2],
};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
const sh = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

// sky
scene.background = new THREE.Color(P.sky);
{
  const g = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { a: { value: new THREE.Color(P.skyTop) }, b: { value: new THREE.Color(0xeaf7ff) } },
    vertexShader: 'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 a,b; varying vec3 p; void main(){ float y=normalize(p).y; gl_FragColor=vec4(mix(b,a,smoothstep(-.05,.6,y)),1.); }' }));
  scene.add(g);
}
scene.fog = new THREE.Fog(0xeaf7ff, 260, 900);

// light: big soft sun + very bright sky fill (high-key, shadows stay light and blue)
const hemi = new THREE.HemisphereLight(0xffffff, 0xcfd8e6, 2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e2, 2.6); sun.position.set(-90, 160, 70); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 10; sc.far = 500;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6; sun.shadow.radius = 4; scene.add(sun);

// ---------- ground, river, roads ----------
const ground = sh(new THREE.Mesh(new THREE.BoxGeometry(900, 2, 900, 120, 1, 120), mat(P.ground))); ground.position.y = -1; scene.add(ground);
const river = new THREE.Mesh(new THREE.PlaneGeometry(900, 46, 180, 12), new THREE.ShaderMaterial({
  uniforms: { a: { value: new THREE.Color(P.water) }, b: { value: new THREE.Color(P.waterDeep) } },
  vertexShader: 'varying vec2 u; varying vec3 w; void main(){ u=uv; w=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.); }',
  fragmentShader: `uniform vec3 a,b; varying vec2 u; varying vec3 w;
    void main(){ float e=abs(u.y-.5)*2.; vec3 c=mix(b,a,smoothstep(.0,.9,e));
      float s=sin(w.x*.12+sin(w.z*.35+w.x*.05)*2.2)*.5+.5; float s2=sin(w.x*.31-w.z*.22)*.5+.5; c=mix(c,vec3(.85,1.,1.),smoothstep(.97,.995,s*s2+.02)*.5);
      gl_FragColor=vec4(c,1.); }` }));
river.rotation.x = -Math.PI / 2; river.position.set(0, 0.05, 30); scene.add(river);
for (const s of [-1, 1]) { const bank = sh(new THREE.Mesh(new THREE.BoxGeometry(900, 1.2, 3, 120, 1, 1), mat(0xd9dde2))); bank.position.set(0, 0.4, 30 + s * 24.5); scene.add(bank); }
function road(x, z, w, d) {
  const r = sh(new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d, Math.ceil(w / 8), 1, Math.ceil(d / 8)), mat(P.road, { roughness: 0.95 }))); r.position.set(x, 0.15, z); scene.add(r);
  const long = w > d; const n = Math.floor((long ? w : d) / 7);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(long ? 3 : 0.35, 0.05, long ? 0.35 : 3), mat(P.lane)); m.position.set(long ? x - w / 2 + 3.5 + i * 7 : x, 0.33, long ? z : z - d / 2 + 3.5 + i * 7); scene.add(m); }
  for (const s of [-1, 1]) { const sw = sh(new THREE.Mesh(new THREE.BoxGeometry(long ? w : 2.4, 0.6, long ? 2.4 : d, long ? Math.ceil(w / 8) : 1, 1, long ? 1 : Math.ceil(d / 8)), mat(P.sidewalk))); sw.position.set(long ? x : x + s * (w / 2 + 1.2), 0.3, long ? z + s * (d / 2 + 1.2) : z); scene.add(sw); }
}
road(0, -8, 900, 9); road(0, 68, 900, 9); road(-60, -100, 9, 180); road(40, -100, 9, 180);

// ---------- buildings ----------
const winTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#8ec9ff'; g.fillRect(8, 10, 22, 34); g.fillRect(36, 10, 22, 34);
  g.fillStyle = '#c9e6ff'; g.fillRect(8, 10, 8, 34); g.fillRect(36, 10, 8, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
function building(x, z, w, d, h, k) {
  const g = new THREE.Group();
  const tx = winTex.clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)));
  const body = sh(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.35), mat(P.walls[k % 5], { map: tx })));
  body.position.y = h / 2; g.add(body);
  const base = sh(new THREE.Mesh(new RoundedBoxGeometry(w + 0.6, 2.2, d + 0.6, 2, 0.3), mat(P.roof[k % 3]))); base.position.y = 1.1; g.add(base);
  const roof = sh(new THREE.Mesh(new RoundedBoxGeometry(w + 0.5, 1.0, d + 0.5, 2, 0.3), mat(P.roof[k % 3]))); roof.position.y = h + 0.3; g.add(roof);
  for (let i = 0; i < 2 + (k % 3); i++) { const ac = sh(new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.3, 1.8, 2, 0.25), mat(0xdfe4ea))); ac.position.set((hash(k * 3 + i) - 0.5) * (w - 3), h + 1.4, (hash(k * 5 + i) - 0.5) * (d - 3)); g.add(ac); }
  if (k % 4 === 0) { const sign = sh(new THREE.Mesh(new RoundedBoxGeometry(w * 0.6, 1.6, 0.4, 2, 0.2), mat(P.accent, { emissive: P.accent, emissiveIntensity: 0.15 }))); sign.position.set(0, 4, d / 2 + 0.3); g.add(sign); }
  g.position.set(x, 0, z); scene.add(g); return g;
}
let k = 0;
for (let gx = -4; gx <= 4; gx++) for (let gz = 0; gz < 4; gz++) {
  const x = gx * 22 + (hash(k) - 0.5) * 3, z = -26 - gz * 22;
  if (Math.abs(x + 60) < 8 || Math.abs(x - 40) < 8) { k++; continue; }
  const h = 10 + hash(k + 1) * 34 * (gz > 0 ? 1.2 : 0.7);
  building(x, z, 13 + hash(k + 2) * 4, 13 + hash(k + 3) * 4, h, k); k++;
}
for (let gx = -4; gx <= 4; gx++) { if (gx % 2) continue; building(gx * 22 + 4, 88, 14, 12, 8 + hash(gx) * 8, k++); }

// trees + park
function tree(x, z, s = 1) {
  const t = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 8), mat(P.trunk))); t.position.set(x, 1, z); scene.add(t);
  const c = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * s, 2), mat(P.tree[Math.floor(hash(x * 7 + z) * 3)]))); c.position.set(x, 2.6 + s, z); c.scale.y = 1.15; scene.add(c);
}
const park = sh(new THREE.Mesh(new RoundedBoxGeometry(60, 0.6, 14, 2, 0.3), mat(P.park))); park.position.set(-30, 0.3, 61); scene.add(park);
for (let i = 0; i < 26; i++) tree(-58 + i * 2.2 + hash(i) * 1.2, 56 + hash(i + 9) * 10, 0.8 + hash(i + 4) * 0.5);
for (let x = -100; x < 100; x += 9) { if (Math.abs(x + 2) < 12) continue; tree(x + 2, 1.2, 0.7); }

// bridge (sunflower accent, our own: a chunky arch)
{
  const deck = sh(new THREE.Mesh(new RoundedBoxGeometry(9, 1.2, 56, 2, 0.4), mat(0x8c95a6))); deck.position.set(40, 1.6, 30); scene.add(deck);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(22, 0.9, 10, 48, Math.PI), mat(P.accent2)); arch.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) { const a = sh(arch.clone()); a.position.set(40 + s * 4.6, 1.6, 30); scene.add(a); }
  for (let i = -7; i <= 7; i++) for (const s of [-1, 1]) { const zz = 30 + i * 2.8; const hgt = Math.sqrt(Math.max(0, 22 * 22 - (i * 2.8) ** 2)); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, hgt, 5), mat(0xffffff)); c.position.set(40 + s * 4.6, 1.6 + hgt / 2, zz); scene.add(c); }
}
// cars
const CARS = [];
function car(x, z, rot, c) {
  const g = new THREE.Group();
  const b = sh(new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.0, 4.0, 3, 0.4), mat(c, { roughness: 0.5 }))); b.position.y = 0.8; g.add(b);
  const top = sh(new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.8, 2.0, 3, 0.35), mat(0xbfe2ff, { roughness: 0.3 }))); top.position.set(0, 1.6, -0.2); g.add(top);
  for (const [a, bz] of [[-1, -1.3], [1, -1.3], [-1, 1.3], [1, 1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), mat(0x2e3440)); w.rotation.z = Math.PI / 2; w.position.set(a * 1.0, 0.42, bz); g.add(w); }
  g.position.set(x, 0.3, z); g.rotation.y = rot; g.userData.base = { x, z, rot }; scene.add(g); CARS.push(g); return g;
}
for (let i = 0; i < 16; i++) car(-120 + i * 15 + hash(i) * 5, -8 + (i % 2 ? 2.2 : -2.2), i % 2 ? Math.PI / 2 : -Math.PI / 2, P.cars[i % 6]);
for (let i = 0; i < 6; i++) car(40 + (i % 2 ? 2.2 : -2.2), 10 + i * 8, i % 2 ? 0 : Math.PI, P.cars[(i + 2) % 6]);
// a busy stretch in front of the riverside stage
for (let i = 0; i < 9; i++) car(-14 + i * 4.2 + hash(i + 40) * 1.5, -8 + (i % 2 ? 2.2 : -2.2), i % 2 ? Math.PI / 2 : -Math.PI / 2, P.cars[(i + 1) % 6]);

// ---------- the cast: flat 2D cards, thick outlines, round heads, bright & unlit ----------
const INK = '#26202e';
function person({ shirt = '#ff6b4a', shirt2 = '#ffd166', pants = '#3d5bd9', shoe = '#ff4f8b', skin = '#fff3e6', hair = '#3a2a24', mood = 'shock', arms = 'up', prop = null } = {}) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 1000; const g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  const ol = 14;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const tube = (pts, w, col) => { g.beginPath(); g.moveTo(...pts[0]); if (pts.length === 3) g.quadraticCurveTo(...pts[1], ...pts[2]); else g.lineTo(...pts[1]);
    g.strokeStyle = INK; g.lineWidth = w + ol * 2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const fillStroke = (col, w = ol) => { g.fillStyle = col; g.fill(); g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
  // ---- legs: trousers with rolled cuffs ----
  for (const [x0, x1] of [[262, 246], [338, 354]]) {
    tube([[x0, 730], [x1, 905]], 40, pants);
    g.strokeStyle = shade(pants, 0.78); g.lineWidth = 6; g.beginPath(); g.moveTo(x0 + (x0 < 300 ? 9 : -9), 760); g.lineTo(x1 + (x1 < 300 ? 9 : -9), 890); g.stroke();
    g.beginPath(); g.roundRect(x1 - 27, 888, 54, 22, 8); fillStroke(shade(pants, 1.25), 9);
  }
  // ---- sneakers: two-tone with white sole + laces ----
  for (const [x, d] of [[246, -1], [354, 1]]) {
    g.beginPath(); g.ellipse(x + d * 16, 948, 52, 26, 0, Math.PI, 0); g.lineTo(x + d * 16 + 52, 958); g.lineTo(x + d * 16 - 52, 958); g.closePath(); fillStroke(shoe, 10);
    g.beginPath(); g.roundRect(x + d * 16 - 56, 952, 112, 16, 8); fillStroke('#ffffff', 9);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + d * 6 - 12 + i * 2, 930 + i * 7); g.lineTo(x + d * 6 + 12 + i * 2, 926 + i * 7); g.stroke(); }
  }
  // ---- arms (sleeves + cuffs + mitten hands with a thumb) ----
  const armPts = arms === 'up' ? [[[212, 530], [128, 440], [112, 305]], [[388, 530], [472, 440], [488, 305]]]
    : arms === 'point' ? [[[212, 530], [168, 640], [176, 735]], [[388, 530], [480, 520], [560, 470]]]
    : [[[212, 530], [168, 640], [176, 735]], [[388, 530], [432, 640], [424, 735]]];
  for (const pts of armPts) {
    tube(pts, 36, shirt);
    const [hx, hy] = pts[2], [px, py] = pts[1]; const ang = Math.atan2(hy - py, hx - px);
    g.save(); g.translate(hx, hy); g.rotate(ang);
    g.beginPath(); g.roundRect(-22, -24, 20, 48, 8); fillStroke(shirt2, 9);
    g.beginPath(); g.ellipse(14, 0, 26, 24, 0, 0, 7); fillStroke(skin, 10);
    g.beginPath(); g.ellipse(10, -22, 10, 12, -0.5, 0, 7); fillStroke(skin, 8);
    g.restore();
  }
  // ---- hoodie torso: hood behind neck, two-tone shading, pocket, drawstrings ----
  g.beginPath(); g.ellipse(300, 492, 112, 46, 0, 0, 7); fillStroke(shade(shirt, 0.8));
  g.beginPath(); g.moveTo(202, 505); g.quadraticCurveTo(300, 470, 398, 505); g.quadraticCurveTo(420, 620, 412, 742); g.quadraticCurveTo(300, 772, 188, 742); g.quadraticCurveTo(180, 620, 202, 505); g.closePath();
  g.fillStyle = shirt; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(shirt, 0.82); g.beginPath(); g.ellipse(410, 640, 90, 190, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(232, 580, 26, 70, -0.15, 0, 7); g.fill();
  g.fillStyle = shirt2; g.fillRect(170, 712, 260, 40); g.restore();
  g.beginPath(); g.moveTo(202, 505); g.quadraticCurveTo(300, 470, 398, 505); g.quadraticCurveTo(420, 620, 412, 742); g.quadraticCurveTo(300, 772, 188, 742); g.quadraticCurveTo(180, 620, 202, 505); g.closePath(); g.lineWidth = ol; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(238, 640); g.lineTo(362, 640); g.lineTo(378, 700); g.lineTo(222, 700); g.closePath(); fillStroke(shade(shirt, 0.9), 9);
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(300, 640); g.lineTo(300, 700); g.stroke();
  for (const x of [278, 322]) { g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.moveTo(x, 505); g.quadraticCurveTo(x + (x < 300 ? -6 : 6), 545, x, 580); g.stroke(); g.beginPath(); g.roundRect(x - 6, 578, 12, 18, 4); fillStroke(shirt2, 5); }
  // little chest logo: a water drop (channel motif)
  g.beginPath(); g.moveTo(360, 560); g.quadraticCurveTo(342, 588, 360, 598); g.quadraticCurveTo(378, 588, 360, 560); fillStroke('#4cc9f0', 6);
  // ---- head ----
  const HX = 300, HY = 300, RX = 168, RY = 158;
  // signature: the tall spring curl (long, twice coiled, with a shine)
  g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(292, 152);
  g.bezierCurveTo(252, 84, 336, 40, 356, 86); g.bezierCurveTo(372, 126, 316, 128, 320, 96); g.bezierCurveTo(324, 70, 364, 52, 388, 30); g.stroke();
  g.strokeStyle = hair; g.lineWidth = 18; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(279, 118); g.bezierCurveTo(272, 92, 300, 72, 328, 74); g.stroke();
  g.beginPath(); g.ellipse(HX, HY, RX, RY, 0, 0, 7); g.fillStyle = skin; g.fill();
  g.save(); g.clip(); g.fillStyle = shade(skin, 0.92); g.beginPath(); g.ellipse(HX + 175, HY + 40, 95, 190, -0.15, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(HX - 92, HY - 82, 34, 18, -0.6, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.ellipse(HX, HY, RX, RY, 0, 0, 7); g.lineWidth = ol * 1.15; g.strokeStyle = INK; g.stroke();
  // ears
  for (const d of [-1, 1]) { g.beginPath(); g.ellipse(HX + d * (RX - 4), HY + 18, 20, 30, 0, d < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, d < 0 ? Math.PI * 1.5 : Math.PI * 0.5); fillStroke(skin, 10); }
  // cheeks
  g.fillStyle = 'rgba(255,120,140,.42)'; for (const x of [210, 390]) { g.beginPath(); g.ellipse(x, 360, 30, 17, 0, 0, 7); g.fill(); }
  // eyes with a highlight, brows, small nose
  g.strokeStyle = INK; g.fillStyle = INK;
  const eye = (x, y) => {
    if (mood === 'shock') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 32, 38, 0, 0, 7); g.fill(); g.lineWidth = 9; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x, y + 6, 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y + 1, 4, 0, 7); g.fill(); }
    else if (mood === 'smug') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + 4, 24, 16, 0, 0, Math.PI); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x + 26, y); g.stroke(); g.beginPath(); g.ellipse(x, y + 4, 24, 16, 0, 0, Math.PI); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + 4, y + 8, 9, 0, Math.PI); g.fill(); }
    else { g.beginPath(); g.ellipse(x, y, 14, 19, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y - 6, 5, 0, 7); g.fill(); g.fillStyle = INK; }
  };
  eye(240, 292); eye(360, 292);
  g.lineWidth = 11;
  if (mood === 'shock') { g.beginPath(); g.moveTo(205, 228); g.quadraticCurveTo(235, 210, 268, 222); g.moveTo(332, 222); g.quadraticCurveTo(365, 210, 395, 228); g.stroke(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(208, 262); g.lineTo(270, 252); g.moveTo(330, 246); g.quadraticCurveTo(365, 236, 392, 248); g.stroke(); }
  else { g.beginPath(); g.moveTo(212, 248); g.quadraticCurveTo(240, 236, 268, 246); g.moveTo(332, 246); g.quadraticCurveTo(360, 236, 388, 248); g.stroke(); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(300, 322); g.quadraticCurveTo(290, 345, 304, 350); g.stroke();
  g.lineWidth = 9;
  if (mood === 'shock') { g.beginPath(); g.ellipse(300, 398, 30, 36, 0, 0, 7); g.fillStyle = '#6a1f33'; g.fill(); g.stroke();
    g.save(); g.beginPath(); g.ellipse(300, 398, 30, 36, 0, 0, 7); g.clip(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(300, 428, 22, 14, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(278, 362, 44, 12); g.restore(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(258, 388); g.quadraticCurveTo(312, 412, 352, 374); g.stroke(); }
  else { g.beginPath(); g.moveTo(260, 380); g.quadraticCurveTo(300, 420, 340, 380); g.stroke(); }
  if (prop === 'sweat') { g.fillStyle = '#9fe0ff'; g.lineWidth = 7; g.beginPath(); g.moveTo(455, 205); g.quadraticCurveTo(428, 250, 455, 264); g.quadraticCurveTo(482, 250, 455, 205); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(448, 245, 5, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function card(tex, h, x, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.6, h).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false }));
  m.position.set(x, 0.6, z); scene.add(m);
  const s = document.createElement('canvas'); s.width = s.height = 128; const sg = s.getContext('2d'); const r = sg.createRadialGradient(64, 64, 4, 64, 64, 60); r.addColorStop(0, 'rgba(60,70,110,.45)'); r.addColorStop(1, 'rgba(60,70,110,0)'); sg.fillStyle = r; sg.fillRect(0, 0, 128, 128);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.55, h * 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); b.rotation.x = -Math.PI / 2; b.position.set(x, 0.62, z); scene.add(b);
  m.userData.blob = b; return m;
}

// =====================================================================
// "Gravity just turned off" — shots, timed to the narration
// =====================================================================
import TIM from './timings.js';
const FPS = 30;
const cam = new THREE.PerspectiveCamera(30, W / H, 0.3, 3000);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (f, f0, d) => 1 - Math.pow(1 - clamp((f - f0) / d), 3);
const kick = (f, at, amp) => { const d = f - at; if (d < 0 || d > 7) return 0; return amp * (Math.floor(d) % 2 ? -1 : 1) * (1 - d / 7); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LN = Object.fromEntries(TIM.lines.map((l) => [l.id, l]));
const ls = (id) => LN[id].start * FPS;
const wf = (id, i) => LN[id].words[i].s * FPS;
export const END = Math.ceil(TIM.duration * FPS) + 18;

// ---------- cast ----------
const CURLY = { shirt: '#ff6b4a', shirt2: '#ffd166', pants: '#3d5bd9', shoe: '#ff4f8b', hair: '#3a2a24', skin: '#fff3e6' };
const JAY = { shirt: '#7b5cff', shirt2: '#ffd166', pants: '#ff8fab', shoe: '#2ec4b6', hair: '#1b1b2f', skin: '#c98a5a' };
const texCache = new Map();
const pose = (base, o) => { const k = JSON.stringify([base.shirt, o]); if (!texCache.has(k)) texCache.set(k, person({ ...base, ...o })); return texCache.get(k); };
function actor(base, o, h, x, z) { const m = card(pose(base, o), h, x, z); m.userData.base = base; return m; }
function setPose(m, o) { const t = pose(m.userData.base, o); m.material.map = t; m.material.needsUpdate = true; }
const curly = actor(CURLY, { mood: 'happy', arms: 'down' }, 2.0, -0.35, 3.6);
const jay = actor(JAY, { mood: 'happy', arms: 'up' }, 1.95, 3.2, 1.2);

// coffee cup in Curly's left hand (card-local coordinates: 0.002 m per canvas px)
const cup = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.17, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.07, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xff6b4a, roughness: 0.6 })); band.position.y = -0.01;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.01, 24), new THREE.MeshStandardMaterial({ color: 0x6b3e26, roughness: 0.3 })); lid.position.y = 0.07; cup.userData.coffee = lid;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.2), new THREE.MeshStandardMaterial({ color: 0xffffff })); handle.position.set(0.08, 0, 0); handle.rotation.z = -Math.PI / 2;
  cup.add(body, band, lid, handle);
}
scene.add(cup);
const blobMat = new THREE.MeshStandardMaterial({ color: 0x7a4326, roughness: 0.25, metalness: 0 });
const coffeeBlob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), blobMat); scene.add(coffeeBlob);
const drops = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012 + hash(i) * 0.012, 10, 8), blobMat); scene.add(d); drops.push(d); }
// floating leaves (the first hint that something is wrong)
const leaves = [];
for (let i = 0; i < 40; i++) {
  const l = new THREE.Mesh(new THREE.CircleGeometry(0.09, 6), new THREE.MeshStandardMaterial({ color: [0x5fd08a, 0x9be07a, 0xffc93c][i % 3], side: THREE.DoubleSide }));
  l.scale.y = 0.55; l.userData = { x: -3 + hash(i) * 6, z: 1.5 + hash(i + 7) * 5, s: 0.5 + hash(i + 3) }; scene.add(l); leaves.push(l);
}
// height marker for Jay (dashed line)
const dash = new THREE.Group(); for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); s.position.y = 0.3 + i * 0.5; dash.add(s); } scene.add(dash);

// ---------- globe scene (bright storybook space) ----------
const gScene = new THREE.Scene();
gScene.background = new THREE.Color(0x2a5cff);
{
  const bgm = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 u; void main(){ u=uv; gl_Position=vec4(position.xy,.999,1.); }',
    fragmentShader: `varying vec2 u; float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 c=mix(vec3(.10,.22,.70),vec3(.30,.55,1.0),u.y); vec2 g=u*vec2(40.,70.); vec2 id=floor(g); vec2 f=fract(g)-.5;
        float r=h(id); c+=vec3(1.)*step(.9,r)*smoothstep(.12,.0,length(f))*.9; gl_FragColor=vec4(c,1.); }` }));
  bgm.frustumCulled = false; gScene.add(bgm);
}
const earthTex = new THREE.TextureLoader().load('./earthmap.png'); earthTex.colorSpace = THREE.NoColorSpace;
const sunG = V(-0.5, 0.5, 0.7).normalize();
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 80), new THREE.ShaderMaterial({ uniforms: { m: { value: earthTex }, s: { value: sunG } },
  vertexShader: 'varying vec2 u; varying vec3 n; void main(){ u=uv; n=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D m; uniform vec3 s; varying vec2 u; varying vec3 n;
    void main(){ vec4 t=texture2D(m,u); float lat=abs(u.y-.5)*2.;
      vec3 land=mix(vec3(.45,.85,.42),vec3(.95,.82,.50),smoothstep(.2,.3,lat)*(1.-smoothstep(.38,.45,lat))*t.b);
      land=mix(land,vec3(1.),smoothstep(.75,.8,lat));
      vec3 sea=mix(vec3(.30,.78,1.),vec3(.12,.50,.95),smoothstep(.0,.3,t.g));
      vec3 c=t.r>.5?land:sea; float l=smoothstep(-.1,.2,dot(normalize(n),s)); c*=mix(.62,1.08,l);
      float coast=smoothstep(.15,.45,fwidth(t.r)*2.2); c=mix(c,vec3(.15,.12,.2),coast*.8);
      gl_FragColor=vec4(c,1.); }` }));
earth.material.extensions = { derivatives: true };
gScene.add(earth);
const gRing = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 48), new THREE.MeshBasicMaterial({ color: 0x26202e, side: THREE.BackSide })); gScene.add(gRing);
const gGlow = new THREE.Mesh(new THREE.SphereGeometry(1.12, 96, 48), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.25, side: THREE.BackSide })); gScene.add(gGlow);
// spin arrow (curved) + tiny Curly peeling off along the tangent
const arrow = new THREE.Group();
{
  const curve = new THREE.EllipseCurve(0, 0, 1.25, 1.25, Math.PI * 0.15, Math.PI * 0.85, false, 0);
  const pts = curve.getPoints(40).map((p) => V(p.x, p.y, 0));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.035, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  const e = pts[pts.length - 1]; head.position.copy(e); head.rotation.z = Math.PI * 0.85 + Math.PI;
  arrow.add(tube, head); arrow.rotation.z = Math.PI; arrow.position.y = 0; gScene.add(arrow);
}
const tiny = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.35).translate(0, 0.17, 0), new THREE.MeshBasicMaterial({ map: pose(CURLY, { mood: 'shock', arms: 'up' }), transparent: true, alphaTest: 0.3, toneMapped: false }));
gScene.add(tiny);
const path = new THREE.Group(); for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); d.position.set(i * 0.085, i * i * 0.0023, 0); path.add(d); } gScene.add(path);
const gCam = new THREE.PerspectiveCamera(26, W / H, 0.1, 100);

// ---------- shot table ----------
const B = { A: 0, B: ls('b1') - 3, C: ls('c1') - 3, D: ls('c2') - 3, E: ls('d1') - 3, F: ls('e1') - 3, G1: ls('e3') - 3, G2: wf('e3', 2) - 2, H: ls('f1') - 3, I: ls('g1') - 3, Z: END };
const K = { off: wf('a1', 3) - 2, peel: wf('b2', 8) - 2, coffee: wf('c1', 2) - 2, lift: wf('c2', 1) - 2, jay: wf('d2', 0) - 2, back: wf('e1', 2) - 2, drop: wf('e2', 1) - 2, except: wf('f1', 1) - 2 };
window.K = K; window.B = B;
// story physics: gravity off from K.off until K.drop (cartoon-stretched 5 s)
const offAmt = (f) => (f < K.off ? 0 : f < K.drop ? sstep(K.off, K.off + 60, f) : 0);
function worldState(f) {
  const floatT = clamp((f - K.off) / (K.drop - K.off));
  const up = f >= K.off && f < K.drop;
  // cars rise up to ~0.6 m and tilt, then slam down and bounce
  CARS.forEach((c, i) => {
    const b = c.userData.base; let y = 0.3, rx = 0, rz = 0;
    if (up) { const a = sstep(K.lift - 20, K.lift + 70, f) * (0.8 + 0.9 * hash(i)); y += a + Math.sin(f * 0.06 + i) * 0.05 * a; rx = a * 0.16 * (hash(i + 2) - 0.5); rz = a * 0.2 * (hash(i + 5) - 0.5); }
    else if (f >= K.drop) { const d = f - K.drop; y += Math.max(0, Math.sin(Math.min(d, 9) / 9 * Math.PI)) * 0.12 * Math.exp(-d / 10); }
    c.position.set(b.x, y, b.z); c.rotation.set(rx, b.rot, rz);
  });
  // Jay: mid-jump at 3 m/s, keeps going while gravity is off
  const jy = f < K.off ? 0 : f < K.drop ? clamp((f - K.off) / (K.drop - K.off)) * 15 : 15;
  jay.position.y = 0.6 + jy; jay.userData.blob.visible = jy < 1;
  setPose(jay, f < K.except ? { mood: jy > 4 ? 'shock' : 'happy', arms: 'up', prop: jy > 4 ? 'sweat' : null } : { mood: 'shock', arms: 'up', prop: 'sweat' });
  // leaves drift up slowly
  leaves.forEach((l, i) => { const u = l.userData; const a = offAmt(f); l.position.set(u.x + Math.sin(f * 0.02 + i) * 0.2 * a, 0.65 + a * (0.2 + u.s * 1.6) * clamp((f - K.off) / 120), u.z); l.rotation.set(f * 0.02 * u.s, f * 0.03, i); l.visible = f < K.drop; });
}
function placeCup(f, m) {
  // hand position from the card: canvas (176,735) -> local (-0.25, 0.53)
  const hand = V(-0.25, 0.53, 0.06).applyMatrix4(m.matrixWorld);
  cup.position.copy(hand); cup.position.y += 0.04;
  const out = f >= K.coffee && f < K.drop ? sstep(K.coffee, K.coffee + 40, f) : 0;
  const splash = f >= K.drop;
  cup.userData.coffee.visible = !out && !splash;
  coffeeBlob.visible = out > 0;
  coffeeBlob.position.set(cup.position.x + Math.sin(f * 0.07) * 0.02, cup.position.y + 0.12 + out * 0.42, cup.position.z);
  const w = 1 + 0.12 * Math.sin(f * 0.21); coffeeBlob.scale.set(w * 1.1, 1 / w, w);
  drops.forEach((d, i) => { d.visible = out > 0.3 || (splash && f - K.drop < 18);
    if (splash) { const t = (f - K.drop) / 18; const a = hash(i) * 6.28; d.position.set(cup.position.x + Math.cos(a) * 0.25 * t, cup.position.y + 0.05 + Math.sin(t * Math.PI) * 0.15 * hash(i + 3), cup.position.z + Math.sin(a) * 0.15 * t); }
    else { d.position.set(coffeeBlob.position.x + Math.cos(i * 0.7 + f * 0.03) * 0.13, coffeeBlob.position.y + Math.sin(i * 1.3 + f * 0.04) * 0.1, coffeeBlob.position.z + Math.sin(i) * 0.05); } });
}
function look(pos, tgt, fov = 30, roll = 0) { cam.fov = fov; cam.aspect = W / H; cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); if (roll) cam.rotateZ(roll); cam.updateProjectionMatrix(); }
function billboard() { for (const m of [curly, jay]) { m.lookAt(cam.position.x, m.position.y, cam.position.z); m.updateMatrixWorld(); } }
const CURLY_SHOT = (f, t) => { const p = V(-0.2, 1.4 - t * 0.03, -1.2 + t * 0.5); look(p, V(-0.3, 1.55, 8), 30, 0.035); };

const SHOTS = [
  { id: 'A', a: B.A, b: B.B, run(f) { const t = (f - B.A) / (B.B - B.A); CURLY_SHOT(f, t); setPose(curly, { mood: f < K.off + 10 ? 'happy' : 'shock', arms: 'down' }); return 'city'; } },
  { id: 'B', a: B.B, b: B.C, run(f) { // the spinning Earth, Curly peels off along a straight line
    earth.rotation.y = -1.2 + f * 0.01; const t = (f - B.B) / (B.C - B.B);
    gCam.position.set(lerp(0, 0.4, t), 0.45, lerp(9.2, 7.0, t)); gCam.lookAt(0, lerp(0.35, 0.6, t), 0); gCam.updateProjectionMatrix();
    const pe = easeOut(f, K.peel - 10, 50); const sx = 0, sy = 1.0; // top of the globe
    tiny.position.set(sx + pe * 1.1, sy + pe * pe * 0.45, 0.2); tiny.rotation.z = -pe * 0.6; tiny.visible = true;
    path.position.set(sx, sy + 0.05, 0.19); path.visible = f > K.peel - 10; path.children.forEach((d, i) => (d.visible = i / 14 < pe));
    arrow.rotation.z = Math.PI + Math.sin(f * 0.05) * 0.02; return 'globe'; } },
  { id: 'C', a: B.C, b: B.D, run(f) { const t = (f - B.C) / (B.D - B.C); setPose(curly, { mood: 'shock', arms: 'down' });
    const hand = V(-0.25, 0.53, 0.06).applyMatrix4(curly.matrixWorld); look(V(hand.x + 0.15, hand.y + 0.45, hand.z - 2.3 + t * 0.2), V(hand.x + 0.12, hand.y + 0.5, hand.z), 32, -0.04); return 'city'; } },
  { id: 'D', a: B.D, b: B.E, run(f) { const t = (f - B.D) / (B.E - B.D); look(V(-16 + t * 1.0, 4.2, 3.5), V(2, 0.7, -8.5), 40, 0.05); return 'city'; } },
  { id: 'E', a: B.E, b: B.F, run(f) { const t = (f - B.E) / (B.F - B.E); const jy = jay.position.y;
    look(V(4.1, 0.4 + jy * 0.85, 5.6), V(3.2, 0.6 + jy + 1.0, 1.2), 40, -0.06); return 'city'; } },
  { id: 'F', a: B.F, b: B.G1, run(f) { const t = (f - B.F) / (B.G1 - B.F); const sh = kick(f, K.drop, 0.12);
    look(V(-16 + sh + t * 1.2, 4.2 + sh - t * 0.3, 3.5 - t * 0.8), V(2, 0.7, -8.5), 40, 0.04); return 'city'; } },
  { id: 'G1', a: B.G1, b: B.G2, run(f) { const c = CARS[CARS.length - 5].userData.base; const u = (f - B.G1) / (B.G2 - B.G1); look(V(c.x - 9 + u * 0.8, 2.4, c.z + 12 - u * 1.2), V(c.x, 0.8, c.z), 30, -0.05); return 'city'; } },
  { id: 'G2', a: B.G2, b: B.H, run(f) { setPose(curly, { mood: 'shock', arms: 'down' }); const hand = V(-0.25, 0.53, 0.06).applyMatrix4(curly.matrixWorld);
    look(V(hand.x + 0.15, hand.y + 0.45, hand.z - 2.3), V(hand.x + 0.12, hand.y + 0.5, hand.z), 32, 0.04); return 'city'; } },
  { id: 'H', a: B.H, b: B.I, run(f) { const t = (f - B.H) / (B.I - B.H); setPose(curly, { mood: 'shock', arms: 'down' });
    jay.position.y = 0.6 + 15 + Math.sin(f * 0.1) * 0.1; dash.position.set(3.2, 0, 1.25); dash.visible = true;
    look(V(-1.4, 1.0, 6.8 - t * 0.3), V(2.4, 8.5, 1.5), 58, 0.07); return 'city'; } },
  { id: 'I', a: B.I, b: B.Z, run(f) { const t = (f - B.I) / (B.Z - B.I); CURLY_SHOT(f, 1 - t); setPose(curly, { mood: 'smug', arms: 'down' }); return 'city'; } },
];
const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
const flashEl = { v: 0 };
window.renderFrame = (f) => {
  const s = shotAt(f);
  dash.visible = false; tiny.visible = false;
  worldState(f);
  const where = s.run(f);
  if (s.id !== 'H') jay.position.y = jay.position.y; // keep
  billboard(); placeCup(f, curly);
  if (where === 'globe') renderer.render(gScene, gCam); else renderer.render(scene, cam);
};
window.TOTAL = END;
window.SHOTS = SHOTS.map((s) => ({ id: s.id, a: Math.round(s.a), b: Math.round(s.b) }));
const ready = () => (earthTex.image && earthTex.image.complete ? (window.READY = true) : setTimeout(ready, 50)); ready();
