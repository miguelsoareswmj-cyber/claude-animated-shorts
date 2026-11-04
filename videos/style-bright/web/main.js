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
function person({ shirt = '#ff6b4a', pants = '#3d4b8c', skin = '#fff6ee', hair = '#3a2a24', mood = 'shock', arms = 'up', prop = null } = {}) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 1000; const g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK;
  const ol = 16;
  // legs
  g.lineWidth = 34 + ol * 2; g.beginPath(); g.moveTo(255, 720); g.lineTo(240, 940); g.moveTo(345, 720); g.lineTo(360, 940); g.stroke();
  g.strokeStyle = pants; g.lineWidth = 34; g.stroke();
  // shoes
  for (const [x, d] of [[240, -1], [360, 1]]) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + d * 14, 952, 44, 22, 0, 0, 7); g.fill(); g.lineWidth = ol * 0.8; g.strokeStyle = INK; g.stroke(); }
  // arms
  const armPts = arms === 'up' ? [[[210, 520], [130, 430], [110, 300]], [[390, 520], [470, 430], [490, 300]]] : [[[210, 520], [170, 640], [180, 740]], [[390, 520], [430, 640], [420, 740]]];
  for (const pts of armPts) {
    g.beginPath(); g.moveTo(...pts[0]); g.quadraticCurveTo(...pts[1], ...pts[2]); g.strokeStyle = INK; g.lineWidth = 30 + ol * 2; g.stroke(); g.strokeStyle = shirt; g.lineWidth = 30; g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(pts[2][0], pts[2][1], 24, 0, 7); g.fill(); g.lineWidth = ol * 0.8; g.strokeStyle = INK; g.stroke();
  }
  // torso: rounded hoodie
  g.fillStyle = shirt; g.beginPath(); g.moveTo(200, 500); g.quadraticCurveTo(300, 455, 400, 500); g.lineTo(410, 740); g.quadraticCurveTo(300, 770, 190, 740); g.closePath(); g.fill(); g.lineWidth = ol; g.strokeStyle = INK; g.stroke();
  g.save(); g.clip(); g.fillStyle = 'rgba(40,20,60,.13)'; g.fillRect(320, 450, 120, 330); g.restore();
  g.strokeStyle = 'rgba(38,32,46,.55)'; g.lineWidth = 7; g.beginPath(); g.moveTo(300, 520); g.lineTo(300, 740); g.stroke();
  g.beginPath(); g.moveTo(250, 640); g.quadraticCurveTo(300, 660, 350, 640); g.stroke(); // pocket
  // head: big round, slightly wider than tall
  g.fillStyle = skin; g.beginPath(); g.ellipse(300, 300, 165, 155, 0, 0, 7); g.fill(); g.lineWidth = ol * 1.1; g.strokeStyle = INK; g.stroke();
  g.save(); g.beginPath(); g.ellipse(300, 300, 165, 155, 0, 0, 7); g.clip(); g.fillStyle = 'rgba(60,40,90,.08)'; g.beginPath(); g.ellipse(390, 340, 120, 150, 0, 0, 7); g.fill(); g.restore();
  // signature: one big hair curl on top (our mascot mark)
  g.fillStyle = hair; g.beginPath(); g.moveTo(270, 152); g.bezierCurveTo(250, 80, 340, 60, 345, 115); g.bezierCurveTo(348, 140, 318, 150, 310, 128); g.bezierCurveTo(325, 120, 320, 100, 300, 108); g.bezierCurveTo(285, 115, 288, 140, 296, 150); g.closePath(); g.fill(); g.lineWidth = ol * 0.7; g.strokeStyle = INK; g.stroke();
  // face
  g.fillStyle = INK; g.strokeStyle = INK;
  const eye = (x, y) => {
    if (mood === 'shock') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 30, 36, 0, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x, y + 4, 11, 0, 7); g.fill(); }
    else if (mood === 'smug') { g.lineWidth = 10; g.beginPath(); g.moveTo(x - 24, y); g.quadraticCurveTo(x, y - 8, x + 24, y); g.stroke(); g.beginPath(); g.arc(x, y + 8, 9, 0, Math.PI); g.fill(); }
    else { g.beginPath(); g.ellipse(x, y, 12, 17, 0, 0, 7); g.fill(); }
  };
  eye(245, 300); eye(355, 300);
  g.lineWidth = 9;
  if (mood === 'shock') { g.beginPath(); g.moveTo(215, 240); g.lineTo(265, 230); g.moveTo(335, 230); g.lineTo(385, 240); g.stroke();
    g.fillStyle = '#5a1e2a'; g.beginPath(); g.ellipse(300, 385, 28, 34, 0, 0, 7); g.fill(); g.stroke(); }
  else if (mood === 'smug') { g.beginPath(); g.moveTo(260, 385); g.quadraticCurveTo(310, 405, 345, 372); g.stroke(); }
  else { g.beginPath(); g.moveTo(262, 375); g.quadraticCurveTo(300, 410, 338, 375); g.stroke(); }
  if (prop === 'sweat') { g.fillStyle = '#9fe0ff'; g.lineWidth = 7; g.beginPath(); g.moveTo(450, 215); g.quadraticCurveTo(425, 255, 450, 268); g.quadraticCurveTo(475, 255, 450, 215); g.fill(); g.stroke(); }
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
const friend = card(person({ shirt: '#ffc93c', pants: '#2f6f73', hair: '#d9832b', mood: 'smug', arms: 'down' }), 1.9, 0.62, 3.9);

const cam = new THREE.PerspectiveCamera(30, W / H, 0.5, 3000);
window.shot = (name) => {
  if (name === 'iso') { cam.fov = 24; cam.position.set(170, 190, 230); cam.lookAt(-5, 0, 0); }
  else if (name === 'street') { cam.fov = 30; cam.position.set(0.1, 1.25, -3.6); cam.lookAt(0, 1.9, 12); }
  cam.updateProjectionMatrix();
  for (const m of [hero, friend]) m.lookAt(cam.position.x, m.position.y, cam.position.z);
  renderer.render(scene, cam);
};
window.READY = true;
