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
const ground = sh(new THREE.Mesh(new THREE.BoxGeometry(900, 2, 900), mat(P.ground))); ground.position.y = -1; scene.add(ground);
const river = new THREE.Mesh(new THREE.PlaneGeometry(900, 46), new THREE.ShaderMaterial({
  uniforms: { a: { value: new THREE.Color(P.water) }, b: { value: new THREE.Color(P.waterDeep) } },
  vertexShader: 'varying vec2 u; varying vec3 w; void main(){ u=uv; w=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.); }',
  fragmentShader: `uniform vec3 a,b; varying vec2 u; varying vec3 w;
    void main(){ float e=abs(u.y-.5)*2.; vec3 c=mix(b,a,smoothstep(.0,.9,e));
      float s=sin(w.x*.12+sin(w.z*.35+w.x*.05)*2.2)*.5+.5; float s2=sin(w.x*.31-w.z*.22)*.5+.5; c=mix(c,vec3(.85,1.,1.),smoothstep(.97,.995,s*s2+.02)*.5);
      gl_FragColor=vec4(c,1.); }` }));
river.rotation.x = -Math.PI / 2; river.position.set(0, 0.05, 30); scene.add(river);
for (const s of [-1, 1]) { const bank = sh(new THREE.Mesh(new THREE.BoxGeometry(900, 1.2, 3), mat(0xd9dde2))); bank.position.set(0, 0.4, 30 + s * 24.5); scene.add(bank); }
function road(x, z, w, d) {
  const r = sh(new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), mat(P.road, { roughness: 0.95 }))); r.position.set(x, 0.15, z); scene.add(r);
  const long = w > d; const n = Math.floor((long ? w : d) / 7);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(long ? 3 : 0.35, 0.05, long ? 0.35 : 3), mat(P.lane)); m.position.set(long ? x - w / 2 + 3.5 + i * 7 : x, 0.33, long ? z : z - d / 2 + 3.5 + i * 7); scene.add(m); }
  for (const s of [-1, 1]) { const sw = sh(new THREE.Mesh(new THREE.BoxGeometry(long ? w : 2.4, 0.6, long ? 2.4 : d), mat(P.sidewalk))); sw.position.set(long ? x : x + s * (w / 2 + 1.2), 0.3, long ? z + s * (d / 2 + 1.2) : z); scene.add(sw); }
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
function car(x, z, rot, c) {
  const g = new THREE.Group();
  const b = sh(new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.0, 4.0, 3, 0.4), mat(c, { roughness: 0.5 }))); b.position.y = 0.8; g.add(b);
  const top = sh(new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.8, 2.0, 3, 0.35), mat(0xbfe2ff, { roughness: 0.3 }))); top.position.set(0, 1.6, -0.2); g.add(top);
  for (const [a, bz] of [[-1, -1.3], [1, -1.3], [-1, 1.3], [1, 1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), mat(0x2e3440)); w.rotation.z = Math.PI / 2; w.position.set(a * 1.0, 0.42, bz); g.add(w); }
  g.position.set(x, 0.3, z); g.rotation.y = rot; scene.add(g);
}
for (let i = 0; i < 16; i++) car(-120 + i * 15 + hash(i) * 5, -8 + (i % 2 ? 2.2 : -2.2), i % 2 ? Math.PI / 2 : -Math.PI / 2, P.cars[i % 6]);
for (let i = 0; i < 6; i++) car(40 + (i % 2 ? 2.2 : -2.2), 10 + i * 8, i % 2 ? 0 : Math.PI, P.cars[(i + 2) % 6]);

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
  return m;
}
const hero = card(person({ mood: 'shock', arms: 'up', prop: 'sweat' }), 2.0, -0.62, 3.6);
const friend = card(person({ shirt: '#ffc93c', shirt2: '#4cc9f0', pants: '#2a9d8f', shoe: '#7b5cff', hair: '#e07a2b', skin: '#f6d2b0', mood: 'smug', arms: 'point' }), 1.9, 0.62, 3.9);

const cam = new THREE.PerspectiveCamera(30, W / H, 0.5, 3000);
window.shot = (name) => {
  if (name === 'iso') { cam.fov = 24; cam.position.set(170, 190, 230); cam.lookAt(-5, 0, 0); }
  else if (name === 'street') { cam.fov = 30; cam.position.set(0.1, 1.25, -3.6); cam.lookAt(0, 1.9, 12); }
  cam.updateProjectionMatrix();
  for (const m of [hero, friend]) m.lookAt(cam.position.x, m.position.y, cam.position.z);
  renderer.render(scene, cam);
};
window.READY = true;
// character lineup for review
window.lineup = () => {
  const L = [
    { mood: 'shock', arms: 'up', prop: 'sweat' },
    { shirt: '#ffc93c', shirt2: '#4cc9f0', pants: '#2a9d8f', shoe: '#7b5cff', hair: '#e07a2b', skin: '#f6d2b0', mood: 'smug', arms: 'point' },
    { shirt: '#7b5cff', shirt2: '#ffd166', pants: '#ff8fab', shoe: '#2ec4b6', hair: '#1b1b2f', skin: '#c98a5a', mood: 'happy', arms: 'down' },
    { shirt: '#2ec4b6', shirt2: '#ff6b4a', pants: '#3a3a5a', shoe: '#ffd166', hair: '#f2c14e', skin: '#ffe0c2', mood: 'shock', arms: 'down' },
  ];
  const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 1000); gr.addColorStop(0, '#bfe6ff'); gr.addColorStop(1, '#f3fbff'); g.fillStyle = gr; g.fillRect(0, 0, 1600, 1000);
  L.forEach((o, i) => g.drawImage(person(o).image, i * 400 - 40, 0, 480, 800 * 1.0));
  return c.toDataURL('image/jpeg', 0.92);
};
// ---- branding helpers ----
window.personPNG = (o) => person(o).image.toDataURL('image/png');
window.renderAt = (w, h, name) => {
  renderer.setSize(w, h); cam.aspect = w / h;
  if (name === 'banner') { cam.fov = 20; cam.position.set(150, 120, 240); cam.lookAt(-10, 6, 10); }
  cam.updateProjectionMatrix();
  for (const m of [hero, friend]) m.visible = false;
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
};
