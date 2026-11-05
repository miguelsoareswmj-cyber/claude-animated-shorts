// "Bright" house style test: a clean low-poly 3D city in soft high-key daylight (world),
// flat 2D cartoon cast with thick outlines and round heads (characters), no dark grade.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
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
scene.fog = new THREE.Fog(0xeaf7ff, 380, 1400);

// light: big soft sun + very bright sky fill (high-key, shadows stay light and blue)
const hemi = new THREE.HemisphereLight(0xfff8ef, 0xa9b6d6, 1.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe7c4, 3.1); sun.position.set(-90, 160, 70); sun.castShadow = true;
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


// ---------- props along the riverside promenade (z ~ 3.6) and street dressing ----------
const PROPS = new THREE.Group(); scene.add(PROPS);
function lamp(x, z) {
  const g = new THREE.Group();
  const pole = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 10), mat(0x3d4b6b, { roughness: 0.5 }))); pole.position.y = 1.8; g.add(pole);
  const arm = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), mat(0x3d4b6b))); arm.rotation.z = Math.PI / 2; arm.position.set(0.3, 3.55, 0); g.add(arm);
  const head = sh(new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.18, 0.28, 2, 0.06), mat(0x3d4b6b))); head.position.set(0.62, 3.5, 0); g.add(head);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.18), new THREE.MeshBasicMaterial({ color: 0xfff1c9 })); bulb.position.set(0.62, 3.4, 0); g.add(bulb);
  const flag = sh(new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.8, 0.45, 2, 0.02), mat([0xff6b4a, 0x4cc9f0, 0xffc93c][Math.abs(Math.round(x)) % 3]))); flag.position.set(0.0, 2.7, 0.25); g.add(flag);
  g.position.set(x, 0.6, z); PROPS.add(g); return g;
}
function bench(x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const sl = sh(new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.06, 0.14, 2, 0.02), mat(0xd9874e))); sl.position.set(0, 0.45, -0.18 + i * 0.16); g.add(sl); }
  for (let i = 0; i < 2; i++) { const bk = sh(new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.12, 0.05, 2, 0.02), mat(0xd9874e))); bk.position.set(0, 0.62 + i * 0.17, 0.22); bk.rotation.x = -0.15; g.add(bk); }
  for (const s of [-0.7, 0.7]) { const l = sh(new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.5, 0.5, 2, 0.02), mat(0x3d4b6b))); l.position.set(s, 0.25, 0); g.add(l); }
  g.position.set(x, 0.6, z); g.rotation.y = Math.PI; PROPS.add(g); return g;
}
function planter(x, z) {
  const b = sh(new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.5, 0.6, 2, 0.08), mat(0xf3e6d6))); b.position.set(x, 0.85, z); PROPS.add(b);
  for (let i = 0; i < 6; i++) { const f = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), mat([0xff6b9a, 0xffc93c, 0xff8a4a, 0xb68cff][i % 4]))); f.position.set(x - 0.45 + i * 0.18, 1.18 + hash(i + x) * 0.08, z + (hash(i * 3 + x) - 0.5) * 0.3); PROPS.add(f); }
  const bush = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat(0x5fd08a))); bush.scale.set(1.5, 0.7, 0.8); bush.position.set(x, 1.12, z); PROPS.add(bush);
}
const LAMPS = [];
for (let x = -40; x <= 40; x += 8) { LAMPS.push(lamp(x, 5.0)); }
for (let x = -36; x <= 36; x += 16) bench(x, 4.8);
for (let x = -28; x <= 36; x += 16) planter(x + 2, 4.9);
// promenade paving: a warm strip with tile lines (where the cast walks)
{
  const pv = sh(new THREE.Mesh(new THREE.BoxGeometry(200, 0.6, 5.0, 50, 1, 2), mat(0xf4e9da))); pv.position.set(0, 0.3, 3.4); scene.add(pv);
  for (let x = -100; x < 100; x += 2) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 5.0), mat(0xe4d6c2)); l.position.set(x, 0.61, 3.4); scene.add(l); }
  const cw = []; for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 7), mat(0xffffff)); c.position.set(18 + i * 1.3, 0.32, -8); scene.add(c); }
}
// low-poly clouds
const CLOUDS = [];
for (let i = 0; i < 14; i++) {
  const g = new THREE.Group();
  for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(6 + hash(i * 9 + k) * 5, 1), mat(0xffffff, { roughness: 1 })); p.position.set((k - 2) * 7 + hash(k + i) * 3, hash(k * 5 + i) * 4, hash(k * 7 + i) * 4); g.add(p); }
  g.position.set(-300 + i * 50 + hash(i) * 30, 70 + hash(i + 3) * 40, -260 - hash(i + 5) * 200); g.scale.y = 0.6; scene.add(g); CLOUDS.push(g);
}

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
// "What if gravity turned off for 5 seconds?" — built from the channel brief
// Scenes: hook / chaos / world goes crazy / countdown / crash / coffee-drop twist
// =====================================================================
import TIM from './timings.js';
import { Actor, OUTFITS, walk, flail, standPose, blinkAt } from './rig.js';
const FPS = 30;
const cam = new THREE.PerspectiveCamera(30, W / H, 0.2, 3000);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eo = (f, f0, d) => 1 - Math.pow(1 - clamp((f - f0) / d), 3);
const kick = (f, at, amp) => { const d = f - at; if (d < 0 || d > 8) return 0; return amp * (Math.floor(d) % 2 ? -1 : 1) * (1 - d / 8); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LN = Object.fromEntries(TIM.lines.map((l) => [l.id, l]));
const ls = (id) => LN[id].start * FPS, le = (id) => LN[id].end * FPS;
const wf = (id, i) => LN[id].words[i].s * FPS;
const END = Math.ceil(le('s6b')) + 85;
const GY = 0.6;

// ---------------- timeline (every beat on its word) ----------------
const K = {
  freeze: wf('s1', 2) - 2, boom: wf('s1', 4), pull: wf('s1b', 0) - 6, gtext: wf('s1b', 1) - 2,
  cool: ls('s2') - 3, real: ls('s2b') - 3,
  cars: ls('s3') - 3, ocean: ls('s3b') - 3, float: ls('s3c') - 3, gap3: le('s3c') + 6,
  terr: ls('s4') - 3, back: ls('s4b') - 3, count: le('s4b') + 4, zero: ls('s5') - 6,
  crash: ls('s5') - 6, list: ls('s5b') - 3, quiet: ls('s6') - 3, drop: le('s6b') + 10,
};
const TICK = (K.zero - K.count) / 5; // countdown: one number per tick
const gravityOff = (f) => f >= K.boom && f < K.zero;
const upT = (f) => (gravityOff(f) ? (f - K.boom) / FPS : 0); // seconds floating
window.K = K;

// ---------------- the dog (2D card, our style) ----------------
class Dog {
  constructor() { this.c = document.createElement('canvas'); this.c.width = 600; this.c.height = 500; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.83).translate(0, 0.41, 0), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false })); scene.add(this.mesh); }
  pose({ t = 0, run = 0, bark = 0, look = 0, worried = false, legs = 0 } = {}) {
    const g = this.g; g.clearRect(0, 0, 600, 500); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK;
    const fs = (c, w = 12) => { g.fillStyle = c; g.fill(); g.lineWidth = w; g.stroke(); };
    const sw = Math.sin(t * 0.6) * run, kick2 = legs ? Math.sin(t * 0.9) * 30 : 0;
    // tail (wagging)
    g.save(); g.translate(470, 250); g.rotate(-0.8 + Math.sin(t * 0.9) * 0.35); g.beginPath(); g.roundRect(-14, -90, 28, 100, 14); fs('#e8a35a', 11); g.restore();
    // legs
    for (const [x, ph] of [[200, 0], [260, 1.6], [390, 3.1], [440, 4.7]]) { const a = Math.sin(t * 0.6 + ph) * 0.45 * run + (legs ? Math.sin(t * 0.9 + ph) * 0.6 : 0);
      g.save(); g.translate(x, 330); g.rotate(a); g.beginPath(); g.roundRect(-20, 0, 40, 110, 18); fs('#e8a35a', 11); g.beginPath(); g.ellipse(0, 112, 30, 18, 0, 0, 7); fs('#ffffff', 10); g.restore(); }
    // body
    g.beginPath(); g.ellipse(320, 290, 170, 95, 0, 0, 7); fs('#f2b96b', 13);
    g.save(); g.beginPath(); g.ellipse(320, 290, 170, 95, 0, 0, 7); g.clip(); g.fillStyle = '#fff3e0'; g.beginPath(); g.ellipse(300, 360, 120, 60, 0, 0, 7); g.fill(); g.fillStyle = '#d98a48'; g.beginPath(); g.ellipse(380, 230, 70, 45, 0.3, 0, 7); g.fill(); g.restore();
    g.beginPath(); g.ellipse(320, 290, 170, 95, 0, 0, 7); g.lineWidth = 13; g.stroke();
    // collar + tag
    g.beginPath(); g.roundRect(150, 205, 30, 120, 12); fs('#ff4f5e', 9); g.beginPath(); g.arc(170, 330, 16, 0, 7); fs('#ffd166', 8);
    // head
    g.save(); g.translate(150, 200 + look * 20); g.rotate(look * 0.35);
    g.beginPath(); g.ellipse(-40, 0, 105, 92, 0, 0, 7); fs('#f2b96b', 13);
    g.beginPath(); g.ellipse(-120, 30, 60, 42, 0, 0, 7); fs('#fff3e0', 11); // muzzle
    g.beginPath(); g.ellipse(-160, 12, 22, 16, 0, 0, 7); fs(INK, 4); // nose
    for (const [x, r] of [[30, 0.5], [-90, -0.4]]) { g.beginPath(); g.ellipse(x, -60, 34, 66, r, 0, 7); fs('#c57a3e', 11); } // ears
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-50, -18, worried ? 26 : 20, worried ? 30 : 24, 0, 0, 7); g.fill(); g.lineWidth = 8; g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(-54 + (look ? 0 : -4), -14 + look * 10, 10, 0, 7); g.fill();
    if (worried) { g.lineWidth = 9; g.beginPath(); g.moveTo(-82, -58); g.lineTo(-30, -48); g.stroke(); }
    g.lineWidth = 9; if (bark > 0.2) { g.beginPath(); g.ellipse(-118, 62, 30, 22 * bark, 0, 0, 7); g.fillStyle = '#6a1f33'; g.fill(); g.stroke(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(-110, 74, 18, 10, 0, 0, 7); g.fill(); }
    else { g.beginPath(); g.moveTo(-150, 52); g.quadraticCurveTo(-120, 70, -95, 50); g.stroke(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(-112, 72, 14, 18, 0, 0, Math.PI); g.fill(); g.stroke(); }
    g.restore(); this.tex.needsUpdate = true; }
  face(c, spin = 0) { this.mesh.lookAt(c.position.x, this.mesh.position.y, c.position.z); if (spin) this.mesh.rotateZ(spin); }
}
const dog = new Dog();
const ball = sh(new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), mat(0xc6f03a))); scene.add(ball);

// ---------------- cast ----------------
const curly = new Actor(scene, OUTFITS.curly, 2.0);
const mia = new Actor(scene, OUTFITS.mia, 1.9);
const boss = new Actor(scene, OUTFITS.boss, 1.95);
const worker = new Actor(scene, OUTFITS.worker, 1.95);
const rider = new Actor(scene, OUTFITS.p1, 1.8);
const shopper = new Actor(scene, OUTFITS.p2, 1.85);
const passenger = new Actor(scene, OUTFITS.p3, 1.9);
const extras = ['jay', 'p1', 'p2', 'p3', 'mia'].map((o, i) => { const a = new Actor(scene, OUTFITS[o], 1.8 + hash(i) * 0.2); a.k = i; return a; });
const ALL = [curly, mia, boss, worker, rider, shopper, passenger, ...extras];
const hide = () => { for (const a of ALL) { a.mesh.visible = false; a.blob.visible = false; } dog.mesh.visible = false; };
const show = (a) => { a.mesh.visible = true; a.blob.visible = true; };

// ---------------- props ----------------
const cupG = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.17, 24, 1, true), mat(0xffffff, { side: THREE.DoubleSide })); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.07, 0.06, 24, 1, true), mat(0xff6b4a)); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.01, 24), mat(0x6b3e26, { roughness: 0.3 })); top.position.y = 0.07; cupG.userData.top = top; cupG.add(b, band, top); scene.add(cupG); }
const coffeeM = mat(0x7a4326, { roughness: 0.2 });
const blob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), coffeeM); scene.add(blob);
const drip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), coffeeM); drip.scale.y = 1.3; scene.add(drip);
const phone = sh(new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.17, 0.015, 2, 0.008), mat(0x26202e))); scene.add(phone);
const streakTex = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(4, 0, 8, 256); return new THREE.CanvasTexture(c); })();
const streaks = Array.from({ length: 80 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.4), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); m.u = { o: hash(i * 7), s: 0.6 + hash(i) * 0.8, dx: hash(i * 3), dz: hash(i * 5) }; scene.add(m); return m; });
const leafMats = [0x5fd08a, 0x9be07a, 0xffc93c, 0xff8a4a].map((c) => mat(c, { side: THREE.DoubleSide }));
const leaves = Array.from({ length: 70 }, (_, i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.08, 6), leafMats[i % 4]); l.scale.y = 0.55; l.u = { x: -14 + hash(i) * 30, z: 0.8 + hash(i + 7) * 5, s: 0.5 + hash(i + 3) }; scene.add(l); return l; });
const dust = Array.from({ length: 30 }, (_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14 + hash(i) * 0.12, 1), mat(0xf1e7dc, { transparent: true })); scene.add(d); return d; });
function puff(x, y, z, age, spread = 1, n = 30) { dust.forEach((d, i) => { if (i >= n) { d.visible = false; return; } const a = hash(i) * 6.28; const r = age * 0.06 * spread * (0.5 + hash(i + 1)); d.visible = age >= 0 && age < 28; d.position.set(x + Math.cos(a) * r * 2.5, y + 0.1 + r * 0.6 * hash(i + 4), z + Math.sin(a) * r); d.material.opacity = 1 - age / 28; d.scale.setScalar(1 + age * 0.04); }); }

// ---------------- set: office (x=300) ----------------
const OF = V(300, 0, 0);
const office = new THREE.Group(); office.position.copy(OF); scene.add(office);
{
  const floor = sh(new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10, 12, 1, 10), mat(0xd8c4a8))); floor.position.y = -0.1; office.add(floor);
  const wall = sh(new THREE.Mesh(new THREE.BoxGeometry(12, 6, 0.2, 12, 6, 1), mat(0xbfe0f0))); wall.position.set(0, 3, -3); office.add(wall);
  for (let i = -2; i <= 2; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshBasicMaterial({ color: 0x8fd0ff, toneMapped: false })); w.position.set(i * 2.2, 3.2, -2.88); office.add(w); const fr = sh(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.1), mat(0xffffff))); fr.position.set(i * 2.2, 3.2, -2.85); office.add(fr); }
  const desk = sh(new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.08, 1.0, 2, 0.03), mat(0xffffff))); desk.position.set(0, 0.95, -0.6); office.add(desk);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, -0.2], [1, -0.2]]) { const l = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), mat(0x3d4b6b))); l.position.set(x, 0.47, z); office.add(l); }
  const plant = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat(0x5fd08a))); plant.position.set(-2.8, 1.0, -2.3); office.add(plant); const pot = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.5, 14), mat(0xff8a4a))); pot.position.set(-2.8, 0.25, -2.3); office.add(pot);
}
const chair = new THREE.Group(); { const seat = sh(new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.1, 0.6, 2, 0.04), mat(0x26202e))); seat.position.y = 0.55; chair.add(seat); chair.userData.seat = seat;
  const back = sh(new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.7, 0.08, 2, 0.04), mat(0x26202e))); back.position.set(0, 0.95, 0.3); chair.add(back); chair.userData.back = back;
  const post = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), mat(0x9aa3b5))); post.position.y = 0.28; chair.add(post); chair.userData.post = post;
  for (let i = 0; i < 5; i++) { const l = sh(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.05), mat(0x9aa3b5))); l.position.y = 0.06; l.rotation.y = i * 1.257; l.translateX(0.17); chair.add(l); }
  chair.position.set(0, 0, 0.3); office.add(chair); }
const laptop = new THREE.Group(); { const base = sh(new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.025, 0.3, 2, 0.01), mat(0xc9ced6))); laptop.add(base); const scr = new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.3, 0.02, 2, 0.01), mat(0xc9ced6)); scr.position.set(0, 0.15, -0.15); scr.rotation.x = -0.25; laptop.add(scr); const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, toneMapped: false })); glow.position.set(0, 0.15, -0.138); glow.rotation.x = -0.25; laptop.add(glow); scene.add(laptop); }
const papers = Array.from({ length: 10 }, (_, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), mat(0xffffff, { side: THREE.DoubleSide })); p.u = { x: -1 + hash(i) * 2, z: -0.9 + hash(i + 3) * 0.6, s: hash(i + 5) }; office.add(p); return p; });

// ---------------- set: supermarket (x=-300) ----------------
const SM = V(-300, 0, 0);
const market = new THREE.Group(); market.position.copy(SM); scene.add(market);
const goods = [];
{
  const floor = sh(new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 14, 16, 1, 14), mat(0xf3f0ea))); floor.position.y = -0.1; market.add(floor);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 14; j++) if ((i + j) % 2) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(0xe1e6ee)); t.rotation.x = -Math.PI / 2; t.position.set(-7.5 + i, 0.005, -6.5 + j); market.add(t); }
  const back = sh(new THREE.Mesh(new THREE.BoxGeometry(16, 4.4, 0.2, 8, 2, 1), mat(0xffe9c9))); back.position.set(0, 2.1, -6.9); market.add(back);
  const sign = new THREE.Mesh(new RoundedBoxGeometry(5, 0.8, 0.1, 2, 0.1), mat(0xff6b4a)); sign.position.set(0, 3.3, -6.75); market.add(sign);
  for (const sx of [-8, 8]) { const sw = sh(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.4, 14), mat(0xfff3e0))); sw.position.set(sx, 2.1, 0); market.add(sw); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), mat(0xffffff, { side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.2; market.add(ceil);
  for (let i = 0; i < 4; i++) { const lt = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); lt.position.set(-4.5 + i * 3, 4.15, -1); market.add(lt); }
  const COLS = [0xff6b4a, 0xffc93c, 0x4cc9f0, 0x7b5cff, 0x2ec4b6, 0xff8fab, 0x9be07a];
  for (const sx of [-2.4, 2.4]) {
    const shelf = sh(new THREE.Mesh(new RoundedBoxGeometry(0.9, 2.4, 7, 2, 0.05), mat(0xdfe4ea))); shelf.position.set(sx, 1.2, -1.5); market.add(shelf);
    for (let lvl = 0; lvl < 4; lvl++) for (let k = 0; k < 18; k++) { const b = sh(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.42, 0.22, 2, 0.03), mat(COLS[(k + lvl * 3) % 7]))); const home = V(sx + (sx < 0 ? 0.55 : -0.55), 0.35 + lvl * 0.55, -4.6 + k * 0.36); b.position.copy(home); b.u = { home, s: hash(k * 9 + lvl), r: hash(k + lvl * 7) }; market.add(b); goods.push(b); }
  }
  const stand = sh(new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.8, 1.2, 2, 0.06), mat(0xd9874e))); stand.position.set(0, 0.4, 2.0); market.add(stand); market.userData.stand = stand;
  for (let k = 0; k < 36; k++) { const fr = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + hash(k) * 0.04, 1), mat([0xff4f5e, 0xffa63c, 0xffe14a, 0x7ed36b][k % 4]))); const home = V(-0.9 + (k % 9) * 0.22, 0.9 + Math.floor(k / 9) * 0.05, 1.55 + Math.floor(k / 9) * 0.22); fr.position.copy(home); fr.u = { home, s: hash(k * 3), r: hash(k * 5) }; market.add(fr); goods.push(fr); }
}
const carts = [0, 1].map((i) => { const g = new THREE.Group(); const m = mat(0xb8c2d0, { roughness: 0.3, metalness: 0.4 });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55, 4, 3, 3), new THREE.MeshStandardMaterial({ color: 0xb8c2d0, wireframe: true })); basket.position.y = 0.75; g.add(basket);
  const h = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), mat(0xff6b4a))); h.rotation.x = Math.PI / 2; h.position.set(-0.48, 1.05, 0); h.rotation.set(0, 0, Math.PI / 2); h.rotation.y = Math.PI / 2; g.add(h);
  for (const [x, z] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]]) { const w = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), mat(0x26202e))); w.rotation.x = Math.PI / 2; w.position.set(x, 0.08, z); g.add(w); }
  const bar = sh(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), m)); bar.position.y = 0.48; g.add(bar);
  g.u = { home: V(-0.8 + i * 1.8, 0, 0.0) }; market.add(g); return g; });

// ---------------- set: rooftop pool (z=-300) ----------------
const PO = V(0, 20, -300);
const pool = new THREE.Group(); pool.position.copy(PO); scene.add(pool);
{
  const deck = sh(new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 16, 20, 1, 16), mat(0xf4e9da))); deck.position.y = -0.2; pool.add(deck);
  const rim = sh(new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.3, 4.4), mat(0xffffff))); rim.position.y = 0.05; pool.add(rim);
  const basin = sh(new THREE.Mesh(new THREE.BoxGeometry(8, 0.32, 4), mat(0x2ec4d6, { roughness: 0.2 }))); basin.position.y = 0.06; pool.add(basin);
  for (const [x, c] of [[-6, 0xff6b4a], [6, 0x4cc9f0]]) { const lng = sh(new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.25, 2.2, 2, 0.08), mat(c))); lng.position.set(x, 0.3, 3.5); lng.rotation.x = -0.1; pool.add(lng);
    const um = sh(new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), mat(c))); um.position.set(x, 2.6, 3.5); pool.add(um); const pole = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), mat(0xffffff))); pole.position.set(x, 1.2, 3.5); pool.add(pole); }
  for (let i = 0; i < 10; i++) { const tb = sh(new THREE.Mesh(new THREE.BoxGeometry(0.8 + hash(i) * 2, 6 + hash(i + 2) * 14, 2), mat(P.walls[i % 5]))); tb.position.set(-18 + i * 4, -8 + hash(i + 3) * 4, -12 - hash(i + 4) * 8); pool.add(tb); }
}
const waterU = { t: { value: 0 } };
const water = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 5), new THREE.ShaderMaterial({ uniforms: waterU, transparent: true,
  vertexShader: `uniform float t; varying vec3 n; varying vec3 vw; void main(){ vec3 p=position; float w=sin(p.x*4.+t*.15)*sin(p.y*3.+t*.12)*sin(p.z*5.-t*.1); p*=1.+.06*w; n=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(p,1.); vw=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `varying vec3 n; varying vec3 vw; void main(){ float fr=pow(1.-abs(dot(n,vw)),2.); vec3 c=mix(vec3(.18,.72,.90),vec3(.75,.95,1.),fr); float sp=pow(max(dot(reflect(-vw,n),normalize(vec3(-.4,.8,.4))),0.),40.); c+=sp*.8; gl_FragColor=vec4(c,.78+fr*.2); }` }));
scene.add(water);
const wdrops = Array.from({ length: 40 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06 + hash(i) * 0.12, 10, 8), water.material); d.u = { a: hash(i) * 6.28, b: hash(i + 3) * 3.14, r: 1 + hash(i + 5) }; scene.add(d); return d; });

// ---------------- set: plane cabin (x=0, z=300) ----------------
const PL = V(0, 0, 300);
const cabin = new THREE.Group(); cabin.position.copy(PL); scene.add(cabin);
const cabinItems = [];
{
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 16, 32, 8, true), mat(0xf4f1ea, { side: THREE.BackSide })); shell.rotation.x = Math.PI / 2; shell.position.y = 1.6; cabin.add(shell);
  const floor = sh(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 16), mat(0x5b6474))); floor.position.y = 0.05; cabin.add(floor);
  for (let r = 0; r < 7; r++) for (const sx of [-1.2, -0.65, 0.65, 1.2]) { const s = sh(new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.1, 0.5, 2, 0.08), mat(0x3d5bd9))); s.position.set(sx, 0.65, -6 + r * 1.6); cabin.add(s); }
  for (let r = 0; r < 7; r++) for (const sx of [-1, 1]) { const w = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.55, 0.4, 2, 0.1), new THREE.MeshBasicMaterial({ color: 0x9fdcff, toneMapped: false })); w.position.set(sx * 2.05, 1.55, -6 + r * 1.6 + 0.2); cabin.add(w); }
  const IC = [0xff6b4a, 0xffc93c, 0x4cc9f0, 0xffffff, 0x7b5cff];
  for (let k = 0; k < 18; k++) { const it = sh(new THREE.Mesh(k % 3 === 0 ? new THREE.CylinderGeometry(0.05, 0.04, 0.12, 12) : new RoundedBoxGeometry(0.2, 0.12, 0.3, 2, 0.03), mat(IC[k % 5]))); const home = V(-1.3 + hash(k) * 2.6, 0.9 + hash(k + 1) * 0.4, -3 + hash(k + 2) * 5); it.position.copy(home); it.u = { home, s: hash(k + 7) }; cabin.add(it); cabinItems.push(it); }
}

// ---------------- set: fountain + construction corner on the promenade ----------------
const FO = V(22, GY, 3.2);
const fountain = new THREE.Group(); fountain.position.copy(FO); scene.add(fountain);
{ const b1 = sh(new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.6, 24), mat(0xf3e6d6))); b1.position.y = 0.3; fountain.add(b1);
  const w1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.05, 24), mat(0x46d1d8, { roughness: 0.2 })); w1.position.y = 0.55; fountain.add(w1); fountain.userData.water = w1;
  const col = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 12), mat(0xf3e6d6))); col.position.y = 1.0; fountain.add(col);
  const b2 = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.25, 20), mat(0xf3e6d6))); b2.position.y = 1.75; fountain.add(b2); }
const fdrops = Array.from({ length: 120 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.16 + hash(i) * 0.16, 10, 8), water.material); d.u = { a: hash(i) * 6.28, r: hash(i + 1) * 1.8, h: hash(i + 2), s: 0.4 + hash(i + 3) }; scene.add(d); return d; });
const cone = new THREE.Group(); { const c = sh(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 16), mat(0xff8a1f))); c.position.y = 0.38; cone.add(c); const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 16), mat(0xffffff)); s1.position.y = 0.42; cone.add(s1); const bs = sh(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), mat(0xff8a1f))); cone.add(bs); scene.add(cone); }
const barrier = sh(new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.5, 0.15, 2, 0.04), mat(0xff8a1f))); barrier.position.set(-16, GY + 0.9, 2.2); scene.add(barrier);
// bicycle
const bike = new THREE.Group(); { const wm = mat(0x26202e); for (const x of [-0.55, 0.55]) { const w = sh(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 24), wm)); w.position.set(x, 0.35, 0); bike.add(w); }
  const fm = mat(0xff6b4a, { roughness: 0.4 }); const bar = (a, b) => { const d = b.clone().sub(a); const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, d.length(), 8), fm)); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); bike.add(m); };
  bar(V(-0.55, 0.35, 0), V(0, 0.4, 0)); bar(V(0, 0.4, 0), V(0.4, 0.8, 0)); bar(V(-0.2, 0.8, 0), V(0.4, 0.8, 0)); bar(V(-0.55, 0.35, 0), V(-0.2, 0.8, 0)); bar(V(0.55, 0.35, 0), V(0.45, 0.95, 0)); bar(V(0.3, 0.98, -0.25), V(0.3, 0.98, 0.25));
  const seat = sh(new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.06, 0.12, 2, 0.02), wm)); seat.position.set(-0.22, 0.86, 0); bike.add(seat); scene.add(bike); }
// pillows pile (the dog's soft landing) — in front of the furniture shop on the promenade
const pillows = new THREE.Group(); { const PC = [0xff8fab, 0xffd166, 0x4cc9f0, 0x9be07a, 0xb68cff, 0xffffff]; for (let i = 0; i < 12; i++) { const p = sh(new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.22, 0.5, 3, 0.1), mat(PC[i % 6]))); p.position.set((hash(i) - 0.5) * 1.2, 0.12 + Math.floor(i / 4) * 0.2, (hash(i + 3) - 0.5) * 0.8); p.rotation.y = hash(i + 5) * 3; pillows.add(p); } pillows.position.set(-8, GY, 4.2); scene.add(pillows); }

// ---------------- post: DOF + HUD ----------------
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); rt.depthTexture = new THREE.DepthTexture(W, H); rt.texture.colorSpace = THREE.SRGBColorSpace;
const dofMat = new THREE.ShaderMaterial({ uniforms: { tC: { value: null }, tD: { value: null }, near: { value: 0.2 }, far: { value: 3000 }, focus: { value: 5 }, amt: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, sat: { value: 0 }, flash: { value: 0 }, dark: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: `uniform sampler2D tC,tD; uniform float near,far,focus,amt,sat,flash,dark; uniform vec2 res; varying vec2 vUv;
    float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
    float coc(vec2 uv){ float z=lin(texture2D(tD,uv).r); return clamp(abs(z-focus)/max(z,.01)*amt,0.,1.); }
    void main(){ float c=coc(vUv); vec3 acc=texture2D(tC,vUv).rgb; float ws=1.;
      if(c>.02){ for(int i=0;i<24;i++){ float fi=float(i); float r=sqrt(fi/24.)*c*14.; float a=fi*2.39996; vec2 o=vec2(cos(a),sin(a))*r/res; float cs=coc(vUv+o); float w=cs>c*.5?1.:cs*2.; acc+=texture2D(tC,vUv+o).rgb*w; ws+=w; } }
      vec3 col=acc/ws; float l=dot(col,vec3(.299,.587,.114)); col=mix(col,vec3(l),sat);
      vec2 q=vUv-.5; col*=1.-dark*smoothstep(.2,.8,length(q*vec2(.7,1.)))*.8; col*=1.-dark*.25;
      col=mix(col,vec3(1.),flash); gl_FragColor=vec4(col,1.); }` });
const quad = new THREE.Scene(); const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dofMat); q.frustumCulled = false; quad.add(q); }
const hudC = document.createElement('canvas'); hudC.width = W; hudC.height = H; const hg = hudC.getContext('2d', { willReadFrequently: true });
const hudTex = new THREE.CanvasTexture(hudC); hudTex.colorSpace = THREE.SRGBColorSpace;
const hud = new THREE.Scene(); { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, toneMapped: false, depthTest: false })); q.frustumCulled = false; hud.add(q); }
const FNT = '"Inter", sans-serif';
function bigText(text, y, size, s, col = '#ffd166', a = 1, rot = 0) { if (s <= 0) return; hg.save(); hg.globalAlpha = a; hg.translate(W / 2, y); hg.rotate(rot); hg.scale(s, s); hg.font = `900 ${size}px ${FNT}`; hg.textAlign = 'center'; hg.textBaseline = 'middle';
  hg.lineJoin = 'round'; hg.lineWidth = size * 0.2; hg.strokeStyle = INK; hg.strokeText(text, 0, size * 0.06); hg.strokeText(text, 0, 0); hg.fillStyle = col; hg.fillText(text, 0, 0); hg.restore(); }
function factTag(text, x, y, s) { if (s <= 0) return; hg.save(); hg.translate(x, y); hg.scale(s, s); hg.font = `900 56px ${FNT}`; const w = hg.measureText(text).width + 56;
  hg.fillStyle = INK; hg.beginPath(); hg.roundRect(-w / 2 + 7, -40 + 9, w, 84, 26); hg.fill(); hg.fillStyle = '#ffffff'; hg.strokeStyle = INK; hg.lineWidth = 9; hg.beginPath(); hg.roundRect(-w / 2, -40, w, 84, 26); hg.fill(); hg.stroke();
  hg.fillStyle = '#ff6b4a'; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(text, 0, 4); hg.restore(); }

// ---------------- world state ----------------
const LOOK = (p, t, fov = 32, roll = 0) => { cam.fov = fov; cam.aspect = W / H; cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(t); if (roll) cam.rotateZ(roll); cam.updateProjectionMatrix(); };
const FX = { amt: 0.8, focus: 6, sat: 0, flash: 0, dark: 0 };
// how high something floats: drifts up, carried by the rising air (cartoon-scaled), falls at zero
function rise(f, speed = 1, seed = 0) { if (f < K.boom) return 0; if (f < K.zero) { const t = (f - K.boom) / FPS; return speed * (0.25 * t + 0.06 * t * t) * (0.7 + 0.6 * hash(seed)); }
  const top = rise(K.zero - 1, speed, seed); const d = (f - K.zero) / FPS; return Math.max(0, top - 0.5 * 9.8 * d * d * 2.2); }
function cityState(f) {
  const off = gravityOff(f);
  CARS.forEach((c, i) => { const b = c.userData.base; const drive = f < K.boom ? (f * 0.12) % 20 : (K.boom * 0.12) % 20; const x = b.x + (Math.abs(b.rot) > 1 ? (b.rot > 0 ? drive : -drive) : 0);
    const y = 0.3 + rise(f, 0.55, i) + (f >= K.zero ? Math.max(0, Math.sin(Math.min(f - K.zero - 6, 9) / 9 * Math.PI)) * 0.12 * Math.exp(-(f - K.zero) / 12) : 0);
    const tilt = off ? (y - 0.3) * 0.2 : 0; c.position.set(x, y, b.z); c.rotation.set(tilt * (hash(i + 2) - 0.5), b.rot, tilt * (hash(i + 5) - 0.5) * 1.4); });
  leaves.forEach((l, i) => { const u = l.u; const y = GY + 0.05 + rise(f, 1.6, i + 40); l.position.set(u.x + Math.sin(f * 0.04 + i) * 0.3 * (off ? 1 : 0), y, u.z); l.rotation.set(f * 0.05 * u.s * (off ? 1 : 0), f * 0.04 * (off ? 1 : 0), i); });
  const wind = off ? sstep(K.boom, K.boom + 60, f) : 0;
  streaks.forEach((m, i) => { const u = m.u; const ph = (f * 0.05 * u.s + u.o) % 1; m.position.set(cam.position.x - 6 + u.dx * 12, cam.position.y - 3 + ph * 9, cam.position.z - 3 - u.dz * 8); m.material.opacity = wind * Math.sin(ph * Math.PI) * 0.5; m.lookAt(cam.position.x, m.position.y, cam.position.z); m.visible = wind > 0; });
  extras.forEach((a, i) => { const hx = -4 + i * 2.6, hz = 2.0 + (i % 2) * 2.2; const r = rise(f, 1.2, i + 10);
    a.pose(r > 0.05 ? { ...flail(f + i * 9), mood: f >= K.zero ? 'shock' : 'scream', sweat: true } : f >= K.zero ? { ...standPose(f), mood: 'worried', bob: 14 * Math.exp(-(f - K.zero - 12) / 6) } : { ...walk(f + i * 11, 0.8), mood: 'happy', blink: blinkAt(f, i) });
    a.place(hx + (f < K.boom ? ((f * 0.02 + i) % 4) - 2 : 0), GY + r, hz, GY); show(a); });
}
function cupAt(actor, f, mode) { const hd = actor.hands?.handL || [176, 735]; const p = actor.local(hd[0], hd[1]); cupG.position.set(p.x, p.y + 0.04, p.z); cupG.visible = true;
  const out = f >= K.boom && f < K.zero ? eo(f, K.boom, 30) : 0; cupG.userData.top.visible = f < K.boom; blob.visible = out > 0 || mode === 'drip';
  if (out > 0) { blob.position.set(p.x + Math.sin(f * 0.07) * 0.04, p.y + 0.18 + out * 0.35 + rise(f, 0.4, 99), p.z); const w = 1 + 0.15 * Math.sin(f * 0.25); blob.scale.set(w * 1.1, 1 / w, w); } return p; }

// ---------------- shots ----------------
const S = [];
const shot = (id, a, b, run) => S.push({ id, a, b, run });
const streetCurly = (f, mood, extra = {}) => { const x = -1 + Math.min(f, K.boom) * 0.018; const r = rise(f, 0.5, 3);
  curly.pose({ ...(f < K.boom ? walk(f) : flail(f * 0.5)), mood, armL: [20, 70], blink: f < K.boom && blinkAt(f), ...extra }); curly.place(x, GY + r, 3.0, GY); show(curly); return x; };
// SCENE 1 — the hook
shot('H1', 0, K.pull, (f) => { cityState(f); const x = streetCurly(f, f < K.freeze ? 'happy' : 'shock', f >= K.boom ? { legL: [-10, 30, 0.4], legR: [10, 30, 0.4] } : {});
  mia.pose({ ...standPose(f), mood: f < K.boom ? 'smug' : 'scream', armR: [150, 30], armL: [10, 10] }); mia.place(x - 2.0, GY + rise(f, 0.9, 7), 4.1, GY); show(mia);
  dog.mesh.visible = true; const dx = x - 3.4 + (f < K.boom ? f * 0.03 : K.boom * 0.03); dog.pose({ t: f, run: f < K.boom ? 1 : 0, legs: f >= K.boom ? 1 : 0, bark: f >= K.boom ? 0.5 + 0.5 * Math.sin(f * 0.6) : 0 }); dog.mesh.position.set(dx, GY + rise(f, 0.8, 5), 2.6); ball.position.set(dx - 0.9, GY + 0.12 + Math.abs(Math.sin(f * 0.25)) * 0.3 * (f < K.boom ? 1 : 0) + rise(f, 1.1, 6), 2.6);
  const frz = f >= K.freeze && f < K.boom; const sh = kick(f, K.boom, 0.12);
  LOOK(V(x + 5.0 + sh, 1.55 + sh, 3.6), V(x - 1.2, 1.45, 3.1), 32, 0.03);
  FX.sat = frz ? 0.6 : 0; FX.flash = f >= K.boom && f < K.boom + 4 ? [0.9, 0.6, 0.3, 0.1][Math.floor(f - K.boom)] : 0; FX.amt = 0.9; FX.focus = 5.5;
  for (const a of [curly, mia]) a.face(cam); dog.face(cam); cupAt(curly, f); const p = mia.local(mia.hands?.handR?.[0] || 420, mia.hands?.handR?.[1] || 300); phone.position.copy(p); phone.lookAt(cam.position); phone.visible = true; });
shot('H2', K.pull, K.cool, (f) => { cityState(f); const x = streetCurly(f, 'shock', { legL: [-10, 30, 0.4], legR: [10, 30, 0.4] });
  mia.pose({ ...flail(f), mood: 'scream' }); mia.place(x - 2.0, GY + rise(f, 0.9, 7), 4.1, GY); show(mia);
  dog.mesh.visible = true; dog.pose({ t: f, legs: 1, bark: 0.6 + 0.4 * Math.sin(f * 0.6) }); dog.mesh.position.set(x - 3.4 + K.boom * 0.03, GY + rise(f, 0.8, 5), 2.6);
  const t = eo(f, K.pull, 34); LOOK(V(x + lerp(5, 26, t), lerp(1.55, 14, t), lerp(3.6, 26, t)), V(x - lerp(1.2, 4, t), lerp(1.45, 2.4, t), 3.1), lerp(32, 40, t), lerp(0.03, -0.06, t));
  for (const a of [curly, mia]) a.face(cam); dog.face(cam); cupAt(curly, f); FX.amt = lerp(0.9, 0.5, t); FX.focus = lerp(5.5, 30, t);
  bigText('GRAVITY = OFF', H * 0.2, 120, f >= K.gtext ? 1 + 0.4 * (1 - eo(f, K.gtext, 6)) : 0, '#ffd166', 1, -0.04); });
// SCENE 2 — chaos begins
shot('C1', K.cool, K.real, (f) => { cityState(f); const t = (f - K.cool) / (K.real - K.cool); curly.pose({ ...standPose(f), mood: 'happy', armL: [20, 70], armR: [60 + Math.sin(f * 0.2) * 30, 40], legL: [-14, 30, 0.3], legR: [16, 40, 0.3], tilt: Math.sin(f * 0.05) * 8, mouth: 0.3 });
  curly.place(-0.2, GY + 0.8 + rise(f, 0.3, 3), 3.0, GY); show(curly); LOOK(V(-0.2 + 4.2 * Math.sin(0.6 + t * 0.9), 2.0, 3.0 + 4.2 * Math.cos(0.6 + t * 0.9)), V(-0.2, 2.1, 3.0), 34, 0.04); curly.face(cam, Math.sin(f * 0.05) * 0.1); cupAt(curly, f); FX.focus = 3; });
const CUT = (K.cars - K.real) / 5;
shot('C2', K.real, K.real + CUT, (f) => { // businessman floats out of his chair, still typing
  const t = (f - K.real) / CUT; const r = 0.4 + rise(f, 0.4, 20); boss.pose({ ...standPose(f), mood: 'shock', armL: [70, 60 + Math.sin(f * 1.4) * 10], armR: [70, 60 + Math.sin(f * 1.6 + 1) * 10], legL: [-20, 60, 0.4], legR: [20, 60, 0.4] }); boss.place(OF.x, r, OF.z + 0.35, 0.02); show(boss);
  laptop.position.set(OF.x, r + 0.85, OF.z - 0.15); laptop.rotation.set(0.1 * Math.sin(f * 0.1), 0, 0.1); chair.position.set(0, rise(f, 0.2, 21) * 0.5, 0.3); chair.rotation.y = f * 0.02;
  papers.forEach((p, i) => { p.position.set(p.u.x, 1.0 + rise(f, 1.5, i + 30), p.u.z); p.rotation.set(f * 0.03 * p.u.s, f * 0.02, i); });
  LOOK(V(OF.x + 1.6, 1.6, OF.z + 3.6 - t * 0.4), V(OF.x, 1.5 + r * 0.5, OF.z), 38, -0.05); boss.face(cam); FX.focus = 3.8; });
shot('C3', K.real + CUT, K.real + CUT * 2, (f) => { // shopping bags drop, groceries burst into the air
  const t = (f - K.real - CUT) / CUT; mia.pose({ ...flail(f), mood: 'scream', armL: [140, 30] }); mia.place(4, GY + 0.6 + t * 0.5, 2.9, GY); show(mia);
  goods.slice(-36).forEach((g, i) => { g.visible = true; }); // fruit from the market set reused here via world positions
  for (let i = 0; i < 18; i++) { const l = leaves[i]; }
  LOOK(V(7.4, 1.6, 7.6), V(4, 1.9, 2.9), 36, 0.05); mia.face(cam); FX.focus = 5.4;
  groceries(f, V(4, GY + 0.3, 3.1), K.real + CUT); });
shot('C4', K.real + CUT * 2, K.real + CUT * 3, (f) => { // the dog floats upside down, barking at nothing
  dog.mesh.visible = true; dog.pose({ t: f, legs: 1, bark: 0.5 + 0.5 * Math.sin(f * 0.7) }); dog.mesh.position.set(-3, GY + 1.6 + Math.sin(f * 0.08) * 0.1, 2.6);
  dog.mesh.position.y += 0.83; LOOK(V(-2.2, 2.5, 5.6), V(-3, GY + 2.0, 2.6), 34, -0.08); dog.face(cam, Math.PI + Math.sin(f * 0.05) * 0.2); cityState(f); FX.focus = 2.7; });
shot('C5', K.real + CUT * 3, K.real + CUT * 4, (f) => { // a bicycle rises, the rider hangs on to the handlebars
  cityState(f); const t = (f - K.real - CUT * 3) / CUT; const by = GY + 1.2 + t * 0.8; bike.position.set(10, by, 3.0); bike.rotation.set(0, -0.4, 0.3 + t * 0.4);
  rider.pose({ ...flail(f * 0.4), mood: 'scream', armL: [150, 0], armR: [150, 0], legL: [-30, 40, 0.3], legR: [30, 30, 0.3] }); rider.place(10.2, by - 1.0 + t * 0.2, 3.1, GY); show(rider);
  LOOK(V(13.5, 1.2, 6.5), V(10, by + 0.2, 3.0), 40, 0.06); rider.face(cam, -0.2); FX.focus = 4.6; });
shot('C6', K.real + CUT * 4, K.cars, (f) => { // the swimming pool lifts into a giant floating sphere
  const t = eo(f, K.real + CUT * 4 - 6, CUT); waterU.t.value = f; water.visible = true; water.position.set(PO.x, PO.y + 0.4 + t * 2.4, PO.z); water.scale.set(lerp(4, 2.2, t), lerp(0.15, 2.0, t), lerp(2, 2.2, t));
  wdrops.forEach((d, i) => { d.visible = true; const r = 2.6 + d.u.r * t; d.position.set(PO.x + Math.cos(d.u.a + f * 0.01) * Math.sin(d.u.b) * r, water.position.y + Math.cos(d.u.b) * r * 0.9, PO.z + Math.sin(d.u.a + f * 0.01) * Math.sin(d.u.b) * r); });
  LOOK(V(PO.x + 7, PO.y + 2.2, PO.z + 9), V(PO.x, PO.y + 2, PO.z), 40, -0.04); FX.focus = 11; FX.amt = 0.6; });
// SCENE 3 — the world goes crazy
shot('D1', K.cars, K.ocean, (f) => { cityState(f); const t = (f - K.cars) / (K.ocean - K.cars); LOOK(V(-16 + t * 2, 4.5 + t, 3.6), V(2, 1.4, -8.5), 40, 0.05); FX.amt = 0.5; FX.focus = 16;
  // a driver panicking in the nearest car's window
  const c = CARS[CARS.length - 5]; const dr = extras[0]; dr.pose({ ...standPose(f), mood: 'scream', armL: [100, 60], armR: [100, 60] }); dr.place(c.position.x, c.position.y + 0.2, c.position.z, -5); dr.mesh.scale.setScalar(0.55); dr.blob.visible = false; dr.face(cam);
  factTag('AIR RISING 170 km/h ↑', W / 2, H * 0.16, eo(f, K.cars + 8, 8)); });
shot('D2', K.ocean, K.float, (f) => { cityState(f); const t = (f - K.ocean) / (K.float - K.ocean); river.position.y = 0.05 + eo(f, K.ocean - 4, 30) * 2.5; river.scale.set(1, 1, 1);
  LOOK(V(14, 3.6, -1), V(0, 1.8, 26), 38, -0.05); FX.amt = 0.4; FX.focus = 22; factTag('OCEANS RISING ↑', W / 2, H * 0.16, eo(f, K.ocean + 6, 8)); });
const CUT3 = (K.terr - K.float) / 4;
shot('D3', K.float, K.float + CUT3, (f) => { // construction worker floats away clutching a traffic cone
  cityState(f); const t = (f - K.float) / CUT3; const y = GY + 1.0 + t * 1.2; worker.pose({ ...flail(f * 0.5), mood: 'scream', armL: [40, 80], armR: [40, 80], sweat: true }); worker.place(-16, y, 3.0, GY); show(worker);
  cone.position.set(-16, y + 0.5, 3.15); cone.rotation.set(0.6 + t, 0, 0.3); cone.visible = true; LOOK(V(-13.4, 1.4, 6.6), V(-16, y + 1.0, 3.0), 38, -0.06); worker.face(cam); FX.focus = 4.4; });
shot('D4', K.float + CUT3, K.float + CUT3 * 2, (f) => { // supermarket: everything drifts toward the ceiling
  const t = (f - K.float - CUT3) / CUT3; marketFloat(f); shopper.pose({ ...flail(f * 0.6), mood: 'shock' }); shopper.place(SM.x + 0.5, 0.8 + t * 1.2, SM.z + 0.8, 0.02); show(shopper);
  LOOK(V(SM.x + 1.2, 1.5, SM.z + 6.5 - t), V(SM.x, 2.2, SM.z - 1), 44, 0.04); shopper.face(cam); FX.focus = 5.6; });
shot('D5', K.float + CUT3 * 2, K.float + CUT3 * 3, (f) => { // plane cabin: loose things float past the passenger
  const t = (f - K.float - CUT3 * 2) / CUT3; cabinItems.forEach((it, i) => { it.position.set(it.u.home.x + Math.sin(f * 0.03 + i) * 0.1, it.u.home.y + 0.4 + t * 0.6 * it.u.s, it.u.home.z); it.rotation.set(f * 0.03 * it.u.s, f * 0.02, i); });
  passenger.pose({ ...standPose(f), mood: 'shock', look: -1, armL: [40, 70], armR: [40, 70] }); passenger.place(PL.x - 1.2, 0.35, PL.z - 1.6 + 0.4, 0.1); show(passenger); passenger.blob.visible = false;
  LOOK(V(PL.x + 0.2, 1.75, PL.z + 3.4), V(PL.x - 1.0, 1.4, PL.z - 1.6), 46, -0.03); passenger.face(cam); FX.focus = 3.2; });
shot('D6', K.float + CUT3 * 3, K.terr, (f) => { // the fountain becomes a floating cloud of droplets
  cityState(f); fountainCloud(f); LOOK(V(FO.x + 3.6, 2.2, FO.z + 5), V(FO.x, 2.6, FO.z), 40, 0.05); FX.focus = 6.2; });
// SCENE 4 — terrifying: the countdown
shot('E1', K.terr, K.count, (f) => { cityState(f); fountainCloud(f); const t = (f - K.terr) / (K.count - K.terr); LOOK(V(lerp(30, 6, t), lerp(9, 4, t), lerp(16, 8, t)), V(lerp(10, -2, t), 2.4, 3), 42, -0.04); FX.dark = sstep(K.terr, K.terr + 30, f) * 0.6; FX.amt = 0.5; FX.focus = 14; });
const cd = (f) => Math.max(1, 5 - Math.floor((f - K.count) / TICK));
const CD = [
  (f) => { boss.pose({ ...standPose(f), mood: 'worried', look: 0, headTilt: 14, armL: [70, 60], armR: [70, 60] }); boss.place(OF.x, 1.6, OF.z + 0.35, 0.02); show(boss); laptop.position.set(OF.x, 2.45, OF.z - 0.15); LOOK(V(OF.x + 1.2, 2.1, OF.z + 3), V(OF.x, 2.6, OF.z), 36, 0.04); boss.face(cam); FX.focus = 3.2; },
  (f) => { dog.mesh.visible = true; dog.pose({ t: f, look: 1, worried: true }); dog.mesh.position.set(-3, GY + 2.2, 2.6); LOOK(V(-2.4, 2.9, 5.0), V(-3, GY + 2.5, 2.6), 34, 0.05); dog.face(cam); cityState(f); FX.focus = 2.5; },
  (f) => { cityState(f); curly.pose({ ...standPose(f), mood: 'shock', look: 0, headTilt: 16, armL: [20, 70], legL: [-6, 10], legR: [6, 10] }); curly.place(-0.2, GY + 1.6, 3.0, GY); show(curly); LOOK(V(1.4, 2.6, 5.2), V(-0.2, 3.3, 3.0), 34, -0.05); curly.face(cam); cupAt(curly, f); FX.focus = 2.6; },
  (f) => { cityState(f); fountainCloud(f); LOOK(V(-20, 10, 18), V(0, 2, 0), 40, 0.04); FX.focus = 25; FX.amt = 0.4; },
  (f) => { cityState(f); curly.pose({ ...standPose(f), mood: 'scream', armL: [20, 70], armR: [130, 20], legL: [-6, 10], legR: [6, 10] }); curly.place(-0.2, GY + 1.7, 3.0, GY); show(curly); LOOK(V(0.4, 3.4, 4.0), V(-0.2, 3.6, 3.0), 30, 0.02); curly.face(cam); cupAt(curly, f); FX.focus = 1.2; },
];
shot('CNT', K.count, K.zero, (f) => { const i = 5 - cd(f); CD[i](f); FX.dark = 0.6; const local = (f - K.count) % TICK; bigText(String(cd(f)), H * 0.3, 380, 1 + 0.5 * (1 - eo(local, 0, 6)), '#ffffff', 1); });
// SCENE 5 — the crash (one slow-motion beat, then rapid cuts)
const SLO = (f) => K.zero + (f - K.zero) * 0.35; // slow motion time
shot('F1', K.zero, K.list, (f) => { const ff = f < K.zero + 30 ? SLO(f) : K.zero + 10.5 + (f - K.zero - 30); cityState(ff); fountainCloud(ff);
  FX.flash = f < K.zero + 4 ? [1, 0.7, 0.4, 0.15][Math.floor(f - K.zero)] : 0; const sh = kick(f, K.zero + 28, 0.2);
  LOOK(V(-14 + sh, 3.2 + sh, 3.8), V(2, 0.9, -8.5), 42, 0.05); FX.amt = 0.5; FX.focus = 15; if (f > K.zero + 26) puff(0, 0.3, -8, f - K.zero - 28, 3); });
const L5 = ['Cars.', 'People.', 'Furniture.', 'Water.', 'Everything.'].map((_, i) => wf('s5b', i) - 2);
shot('F2', L5[0], L5[1], (f) => { cityState(f); const c = CARS[CARS.length - 5]; LOOK(V(c.position.x - 6, 1.6 + kick(f, L5[0] + 2, 0.12), c.position.z + 8), V(c.position.x, 0.6, c.position.z), 32, -0.05); puff(c.position.x, 0.3, c.position.z, f - K.zero - 10, 2); FX.focus = 10; });
shot('F3', L5[1], L5[2], (f) => { cityState(f); LOOK(V(3, 1.7 + kick(f, L5[1] + 3, 0.1), 9.5), V(-1, 1.2, 3), 36, 0.04); for (const a of extras) a.face(cam); puff(-1, GY, 3, f - L5[1] - 2, 2.5); FX.focus = 7; });
shot('F4', L5[2], L5[3], (f) => { // the businessman lands back in his chair, which breaks
  const d = f - L5[2]; const y = Math.max(0.5, 1.8 - d * d * 0.03); const broke = y <= 0.5;
  boss.pose({ ...standPose(f), mood: broke ? 'shock' : 'scream', armL: [110, 40], armR: [110, 40], legL: [-40, 80, 0.5], legR: [40, 80, 0.5] }); boss.place(OF.x, broke ? 0.2 : y, OF.z + 0.35, 0.02); show(boss);
  const cs = chair.userData; cs.seat.position.y = broke ? 0.12 : 0.55; cs.back.rotation.x = broke ? -1.2 : 0; cs.back.position.y = broke ? 0.3 : 0.95; cs.post.visible = !broke; chair.position.set(0, 0, 0.3); chair.rotation.y = 0.3;
  laptop.position.set(OF.x + 0.3, broke ? 0.05 : 0.99, OF.z - 0.6); LOOK(V(OF.x + 1.8, 1.3 + kick(f, L5[2] + 7, 0.1), OF.z + 3.2), V(OF.x, 0.8, OF.z), 38, -0.04); boss.face(cam); if (broke) puff(OF.x, 0.05, OF.z + 0.3, d - 7, 1.4); FX.focus = 3.6; });
shot('F5', L5[3], L5[4], (f) => { // the floating pool collapses into a huge wave
  const d = f - L5[3]; waterU.t.value = f; water.visible = true; water.position.set(PO.x, PO.y + Math.max(0.3, 2.8 - d * d * 0.02), PO.z); water.scale.set(2.2 + d * 0.3, Math.max(0.15, 2.0 - d * 0.12), 2.2 + d * 0.2);
  wdrops.forEach((dd, i) => { dd.visible = true; const r = 2 + d * 0.25 * dd.u.r; dd.position.set(PO.x + Math.cos(dd.u.a) * r, PO.y + 0.3 + Math.max(0, Math.sin(dd.u.b) * (3 - d * 0.1)), PO.z + Math.sin(dd.u.a) * r * 0.7); });
  LOOK(V(PO.x + 7, PO.y + 2.4 + kick(f, L5[3] + 6, 0.15), PO.z + 9), V(PO.x, PO.y + 1.2, PO.z), 42, 0.05); FX.focus = 11; FX.amt = 0.5; });
const F6 = (K.quiet - L5[4]) / 2;
shot('F6', L5[4], L5[4] + F6, (f) => { // supermarket: carts crash through the displays
  const d = f - L5[4]; marketCrash(f, d); LOOK(V(SM.x + 2.5, 1.6 + kick(f, L5[4] + 5, 0.12), SM.z + 6.5), V(SM.x, 1.0, SM.z + 1), 42, -0.05); puff(SM.x, 0.1, SM.z + 1.6, d - 5, 2.2); FX.focus = 5.5; });
shot('F7', L5[4] + F6, K.quiet, (f) => { // the dog lands safely on a pile of pillows
  const d = f - L5[4] - F6; const y = Math.max(0.55, 2.6 - d * d * 0.02); dog.mesh.visible = true; dog.pose({ t: f, legs: y > 0.6 ? 1 : 0, bark: y > 0.6 ? 0 : 0.2, worried: y > 0.6 }); dog.mesh.position.set(-8, GY + y, 4.2);
  pillows.scale.y = y <= 0.56 ? 1 - 0.25 * Math.exp(-(d - 16) / 4) : 1; cityState(f); LOOK(V(-6.4, 1.6, 6.8), V(-8, GY + 0.9, 4.2), 36, 0.05); dog.face(cam); FX.focus = 3; });
// SCENE 6 — the twist
const DRIP = K.drop;
shot('G1', K.quiet, DRIP + 8, (f) => { cityState(f); const t = (f - K.quiet) / (DRIP - K.quiet); const up = sstep(K.quiet, K.quiet + 40, f);
  curly.pose({ ...standPose(f), mood: f < K.quiet + 50 ? 'worried' : 'happy', armL: [20, 70], bob: (1 - up) * 120, legL: [-20 * (1 - up), 60 * (1 - up), 0.4 * (1 - up)], legR: [20 * (1 - up), 60 * (1 - up), 0.4 * (1 - up)], look: Math.sin(f * 0.05), blink: blinkAt(f) }); curly.place(-0.2, GY, 3.0, GY); show(curly);
  LOOK(V(3.4 - t * 0.6, 1.5, 6.0 - t * 0.8), V(-0.2, 1.4, 3.0), 34, 0.03); curly.face(cam); cupAt(curly, f);
  drip.visible = true; const hp = curly.local(300, 120); const dd = f - (DRIP - 22); drip.position.set(hp.x, dd < 0 ? hp.y + 2.6 : Math.max(hp.y, hp.y + 2.6 - dd * dd * 0.0055 * 30), hp.z + 0.02); FX.focus = 4.2; });
shot('G2', DRIP + 8, END, (f) => { cityState(f); const d = f - DRIP - 8; curly.pose({ ...standPose(f), mood: d < 10 ? 'shock' : 'smug', armL: [20, 70], blink: d > 20 && blinkAt(f), headTilt: 4 });
  curly.place(-0.2, GY, 3.0, GY); show(curly); LOOK(V(0.9, 2.2, 4.6), V(-0.2, 2.15, 3.0), 30, 0.02); curly.face(cam); cupAt(curly, f);
  const hp = curly.local(300, 120); drip.visible = d < 6; drip.position.set(hp.x, hp.y, hp.z + 0.02); drip.scale.set(1 + d * 0.4, 0.6, 1);
  if (d > 30) bigText('WOULD YOU SURVIVE?', H * 0.17, 84, eo(d, 30, 6) * 1.0, '#ffd166', 1, -0.03); FX.focus = 1.7; FX.sat = d > 30 ? 0.15 : 0; });

// ---------------- set animation helpers ----------------
function groceries(f, at, f0) { const t = Math.max(0, (f - f0) / FPS); goods.slice(-36).forEach((g, i) => { g.visible = true; const a = hash(i) * 6.28; const sp = 0.4 + hash(i + 4) * 0.8;
  const wp = V(at.x + Math.cos(a) * sp * t * 1.4, at.y + 0.3 + sp * t * 1.6, at.z + 0.4 + Math.sin(a) * sp * t * 0.8); if (i > 20) { g.visible = false; return; } market.worldToLocal(wp); g.position.copy(wp); g.rotation.set(f * 0.05 * g.u.s, f * 0.04, i); }); }
function marketFloat(f) { const t = upT(f); goods.forEach((g, i) => { const h = g.u.home; g.position.set(h.x + Math.sin(f * 0.03 + i) * 0.1 * t, Math.min(4.0, h.y + (0.15 + g.u.s * 0.4) * t * t), h.z); g.rotation.set(t * g.u.r, t * g.u.s, 0); });
  carts.forEach((c, i) => { c.position.set(c.u.home.x, Math.min(3.0, 0.2 * t * t * (1 + i * 0.5)), c.u.home.z); c.rotation.set(0.1 * t, i, 0.15 * t); }); }
function marketCrash(f, d) { goods.forEach((g, i) => { const h = g.u.home; const fallen = d > 4 + hash(i) * 10; g.position.set(h.x + (hash(i) - 0.5) * 1.6, fallen ? 0.12 : Math.max(0.12, 3.5 - d * 0.3), h.z + (hash(i + 2) - 0.5) * 1.2); g.rotation.set(g.u.r * 3, g.u.s * 3, 0); });
  carts.forEach((c, i) => { const y = Math.max(0, 2.5 - d * d * 0.03); c.position.set(c.u.home.x + i * 0.2, y, lerp(c.u.home.z, 1.6, clamp(d / 14))); c.rotation.set(y > 0 ? 0.3 : 0.05, i * 0.6, y > 0 ? 0.2 : 0.4); });
  const st = market.userData.stand; st.rotation.z = d > 14 ? -0.25 : 0; st.position.y = d > 14 ? 0.3 : 0.4; }
function fountainCloud(f) { const t = upT(f); const after = f >= K.zero; fdrops.forEach((d, i) => { d.visible = true; const u = d.u; const h = after ? Math.max(0.05, (u.h * 2 + rise(K.zero - 1, 1.2, i)) - ((f - K.zero) / FPS) ** 2 * 6) : 1.9 + u.h * 0.6 + t * t * 0.35 * u.s;
  d.position.set(FO.x + Math.cos(u.a + f * 0.004) * u.r * (1 + t * 0.15), FO.y + h, FO.z + Math.sin(u.a + f * 0.004) * u.r * (1 + t * 0.15)); }); fountain.userData.water.visible = !gravityOff(f); }

// ---------------- frame ----------------
const shotAt = (f) => (f < 0 ? S[0] : S.find((s) => f >= s.a && f < s.b) || S[S.length - 1]);
window.renderFrame = (f) => {
  hg.clearRect(0, 0, W, H); hg.fillStyle = 'rgba(0,0,0,0.004)'; hg.fillRect(0, 0, 1, 1); Object.assign(FX, { amt: 0.8, focus: 6, sat: 0, flash: 0, dark: 0 });
  hide(); for (const x of [cupG, blob, drip, phone, water, cone, ball]) x.visible = false; wdrops.forEach((d) => (d.visible = false)); fdrops.forEach((d) => (d.visible = false)); dust.forEach((d) => (d.visible = false)); streaks.forEach((s) => (s.visible = false));
  extras.forEach((a) => a.mesh.scale.setScalar(1)); river.position.y = 0.05; ball.visible = true; bike.position.set(10, GY, 3.0); bike.rotation.set(0, -0.4, 0);
  const cs = chair.userData; cs.seat.position.y = 0.55; cs.back.rotation.x = 0; cs.back.position.y = 0.95; cs.post.visible = true; pillows.scale.y = 1;
  goods.forEach((g) => { g.position.copy(g.u.home); g.rotation.set(0, 0, 0); g.visible = true; }); carts.forEach((c) => { c.position.copy(c.u.home); c.rotation.set(0, 0, 0); });
  if (f < K.boom) { cone.visible = true; cone.position.set(-16.6, GY, 3.2); cone.rotation.set(0, 0, 0); }
  const s = shotAt(f); s.run(f);
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  const u = dofMat.uniforms; u.tC.value = rt.texture; u.tD.value = rt.depthTexture; u.focus.value = FX.focus; u.amt.value = FX.amt; u.sat.value = FX.sat; u.flash.value = FX.flash; u.dark.value = FX.dark;
  renderer.setRenderTarget(null); renderer.render(quad, qcam);
  hudTex.needsUpdate = true; renderer.autoClear = false; renderer.render(hud, qcam); renderer.autoClear = true;
};
window.TOTAL = END;
window.SHOTS = S.map((s) => ({ id: s.id, a: Math.round(s.a), b: Math.round(s.b) }));
const ready = () => (document.fonts ? document.fonts.ready.then(() => (window.READY = true)) : (window.READY = true)); ready();
