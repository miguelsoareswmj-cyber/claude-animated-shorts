// Shared helpers: renderer, toon materials, ink hulls, canvas cards, easing, camera helpers.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Pen, bodyFront, INK as PLUM_INK } from './toon.js';

export { THREE };
export const W = 1080, H = 1920, FPS = 30;

export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
/** ease-out burst: peak speed at the first frame, decays (reference camera motion) */
export const burst = (f, f0, dur) => { const t = clamp((f - f0) / dur); return 1 - Math.pow(1 - t, 3); };
export const easeIn = (f, f0, dur) => { const t = clamp((f - f0) / dur); return t * t * t; };
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** impact kick: flips sign each frame, decays over 7 f */
export const kick = (f, at, amp) => { const d = f - at; if (d < 0 || d > 7) return 0; return amp * (Math.floor(d) % 2 ? -1 : 1) * (1 - d / 7); };
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const vlerp = (a, b, t) => a.clone().lerp(b, t);

// ---------- materials ----------
const gradTex = (() => {
  const d = new Uint8Array([84, 84, 84, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
export const toon = (c, opts = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: gradTex, ...opts });
export const INK = 0x070509;
export const inkMat = (w) => {
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${w.toFixed(4)};`);
  };
  return m;
};
/** mesh + inverted-hull ink outline; smooths normals of the hull so hard-edged boxes keep a closed outline */
export function inked(geo, mat, w = 0.05) {
  const g = new THREE.Group();
  const a = new THREE.Mesh(geo, mat);
  let hg = geo.clone(); hg.deleteAttribute('uv'); if (hg.attributes.color) hg.deleteAttribute('color');
  hg = mergeVertices(hg, 1e-3); hg.computeVertexNormals();
  const b = new THREE.Mesh(hg, inkMat(w));
  g.add(a, b); g.userData.body = a; return g;
}
export const box = (w, h, d, c, ink = 0.05, opts) => inked(new THREE.BoxGeometry(w, h, d), toon(c, opts), ink);
export const roundBox = (w, h, d, r, c, ink = 0.05) => {
  const g = new THREE.BoxGeometry(w, h, d, 6, 6, 6); const p = g.attributes.position; const v = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c3 = V3(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    const dlt = v.clone().sub(c3); if (dlt.length() > 1e-6) dlt.setLength(r); v.copy(c3.add(dlt)); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return inked(g, toon(c), ink);
};

// ---------- canvas cards ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; draw(g, w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { canvas: c, g };
  return t;
}
/** a camera-facing (Y-axis) billboard card with its base at y=0 */
export function card(tex, w, h, { lit = true, baseY = 0, emissive = 0.35, depthWrite = true, bb = 'y' } = {}) {
  const m = lit
    ? new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive, depthWrite })
    : new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, depthWrite });
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2 + baseY, 0);
  const mesh = new THREE.Mesh(geo, m); mesh.userData.bb = bb; mesh.userData.spin = 0; return mesh;
}
/** orient every billboard card toward the camera (run after the camera is placed) */
const _wp = new THREE.Vector3(), _q = new THREE.Quaternion();
export function orientBillboards(scene, cam) {
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    const bb = o.userData.bb; if (!bb || !o.visible) return;
    if (bb === 'y') { o.getWorldPosition(_wp); o.lookAt(cam.position.x, _wp.y, cam.position.z); }
    else if (bb === 'full') { o.parent.getWorldQuaternion(_q); o.quaternion.copy(_q.invert().multiply(cam.quaternion)); }
    if (o.userData.spin) o.rotateZ(o.userData.spin);
  });
}
export const PLUM = PLUM_INK;

// character card drawn with the repo's toon.js (600x1000 design space)
const ME = { jacket: '#3f8fd0', pants: '#384056', boots: '#4a3426', hat: 'hair', hair: '#4a2f22', skin: '#ffe2c2' };
export function personTex(opts, outfit = ME) {
  return canvasTex(600, 1000, (g) => { const p = new Pen(g); bodyFront(p, outfit, { mode: 'stand', seed: 4, ...opts }); });
}
export class Person {
  constructor(height = 1.75) {
    this.cache = new Map(); this.h = height;
    this.mesh = card(this.tex({}), height * 0.6, height, { emissive: 0.45 });
  }
  tex(o) {
    const k = JSON.stringify(o); if (!this.cache.has(k)) this.cache.set(k, personTex(o)); return this.cache.get(k);
  }
  pose(o) { const t = this.tex(o); this.mesh.material.map = t; this.mesh.material.emissiveMap = t; }
}
export function blink(f, seed = 0) { // 4-frame blinks every ~0.5-2.3 s
  const period = 38 + Math.floor(hash(seed) * 30); const ph = (f + seed * 13) % period; return ph < 4;
}

// contact shadow
export const shadowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, 'rgba(30,20,45,.6)'); r.addColorStop(1, 'rgba(30,20,45,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
export function blob(scene, x, z, sx, sz, y = 0.04) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m;
}

// fish card textures (open / closed mouth)
export function fishTex(body, fin, { sweat = false, open = true, red = false } = {}) {
  return canvasTex(512, 320, (g) => {
    g.translate(256, 165); g.strokeStyle = PLUM; g.lineWidth = 12; g.fillStyle = fin;
    g.beginPath(); g.moveTo(120, 0); g.lineTo(220, -80); g.quadraticCurveTo(195, 0, 220, 80); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-40, -78); g.quadraticCurveTo(20, -150, 80, -70); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = body; g.beginPath(); g.ellipse(-10, 0, 150, 92, 0, 0, 7); g.fill();
    g.save(); g.clip(); g.fillStyle = 'rgba(40,20,60,.16)'; g.beginPath(); g.ellipse(-10, 70, 170, 50, 0, 0, 7); g.fill();
    if (red) { g.fillStyle = 'rgba(230,40,40,.35)'; g.beginPath(); g.ellipse(-80, 10, 70, 50, 0, 0, 7); g.fill(); }
    g.restore();
    g.beginPath(); g.ellipse(-10, 0, 150, 92, 0, 0, 7); g.lineWidth = 14; g.strokeStyle = PLUM; g.stroke();
    g.lineWidth = 9; g.strokeStyle = 'rgba(36,23,38,.5)';
    for (const x of [20, 60]) { g.beginPath(); g.moveTo(x, -70); g.quadraticCurveTo(x + 18, 0, x, 70); g.stroke(); }
    // eye
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-90, -22, 30, 34, 0, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = PLUM; g.stroke();
    g.fillStyle = PLUM; g.beginPath(); g.arc(-100, -18, 13, 0, 7); g.fill();
    g.lineWidth = 9; g.beginPath(); g.moveTo(-122, -60); g.lineTo(-62, -70); g.stroke();
    g.fillStyle = '#5a1f33'; g.lineWidth = 9;
    g.beginPath(); g.ellipse(-140, 30, open ? 16 : 10, open ? 20 : 6, 0, 0, 7); g.fill(); g.stroke();
    if (sweat) for (const [x, y, s] of [[-30, -120, 1], [40, -112, .8], [-150, -70, .7]]) {
      g.fillStyle = '#bfe6ff'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y - 26 * s); g.quadraticCurveTo(x - 16 * s, y, x, y + 8 * s); g.quadraticCurveTo(x + 16 * s, y, x, y - 26 * s); g.fill(); g.stroke();
    }
  });
}
export const FISH = [['#f39a3a', '#e0663a'], ['#f2d24a', '#5bb5d6'], ['#e86d8f', '#a04fb0'], ['#7ed36b', '#3f9a66'], ['#69b7ef', '#3d6fc4']];

export const whaleTex = (mood = 'sad') => canvasTex(1024, 512, (g) => {
  g.translate(500, 300); g.strokeStyle = PLUM; g.lineJoin = 'round'; g.fillStyle = '#4f7fc4'; g.lineWidth = 16;
  g.beginPath(); g.moveTo(330, -20); g.quadraticCurveTo(420, -150, 480, -170); g.quadraticCurveTo(450, -90, 470, -40); g.quadraticCurveTo(420, -60, 330, 20); g.fill(); g.stroke();
  const body = () => { g.beginPath(); g.moveTo(-380, 40); g.bezierCurveTo(-400, -170, -100, -200, 120, -120); g.bezierCurveTo(260, -80, 330, -40, 360, 0); g.bezierCurveTo(300, 70, 120, 150, -120, 150); g.bezierCurveTo(-300, 150, -370, 110, -380, 40); g.closePath(); };
  body(); g.fill(); g.save(); g.clip(); g.fillStyle = '#e8dcc6'; g.beginPath(); g.ellipse(-120, 170, 300, 90, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(36,23,38,.45)'; g.lineWidth = 7; for (let x = -330; x < 120; x += 34) { g.beginPath(); g.moveTo(x, 100); g.lineTo(x + 10, 160); g.stroke(); }
  g.restore(); body(); g.lineWidth = 18; g.strokeStyle = PLUM; g.stroke();
  g.fillStyle = '#41699f'; g.lineWidth = 13; g.beginPath(); g.moveTo(-140, 90); g.quadraticCurveTo(-90, 170, -10, 180); g.quadraticCurveTo(-60, 120, -70, 80); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-250, -10, 28, 32, 0, 0, 7); g.fill(); g.lineWidth = 8; g.stroke();
  g.fillStyle = PLUM; g.beginPath(); g.arc(mood === 'shock' ? -250 : -244, -6, mood === 'shock' ? 8 : 12, 0, 7); g.fill();
  g.lineWidth = 12; g.beginPath();
  if (mood === 'shock') { g.fillStyle = '#5a1f33'; g.ellipse(-330, 70, 22, 26, 0, 0, 7); g.fill(); g.stroke(); }
  else { g.moveTo(-370, 70); g.quadraticCurveTo(-300, 40, -220, 78); g.stroke(); }
  g.lineWidth = 10; g.beginPath(); g.moveTo(-285, -58); g.lineTo(-215, -72); g.stroke();
});

// flat 2D effect sprites
export const steamTex = canvasTex(256, 512, (g) => {
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 34; g.lineCap = 'round';
  g.beginPath(); g.moveTo(128, 490); g.bezierCurveTo(40, 380, 220, 280, 128, 180); g.bezierCurveTo(60, 110, 160, 60, 128, 20); g.stroke();
});
export const bubbleTex = canvasTex(128, 128, (g) => {
  g.fillStyle = 'rgba(200,240,255,.35)'; g.strokeStyle = 'rgba(235,250,255,.95)'; g.lineWidth = 8;
  g.beginPath(); g.arc(64, 64, 52, 0, 7); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(46, 44, 12, 8, -0.6, 0, 7); g.fill();
});
export const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 2, 64, 64, 62); r.addColorStop(0, 'rgba(255,230,160,1)'); r.addColorStop(0.3, 'rgba(255,200,110,.5)'); r.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
export function sprite(tex, s, opts = {}) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, ...opts })); m.scale.set(s, s, 1); return m;
}

// sky dome
export function skyDome(top, hz, r = 3000) {
  const u = { uTop: { value: new THREE.Color(top) }, uHz: { value: new THREE.Color(hz) } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uTop,uHz; varying vec3 vP; void main(){ float y=normalize(vP).y; gl_FragColor=vec4(mix(uHz,uTop,smoothstep(-.02,.5,y)),1.); }`
  }));
  m.userData.u = u; m.renderOrder = -5; return m;
}

/** set a camera from {pos, look, fov, roll} */
export function placeCam(cam, s) {
  cam.position.copy(s.pos); cam.up.set(0, 1, 0); cam.lookAt(s.look);
  if (s.roll) cam.rotateZ(s.roll);
  if (s.fov && cam.fov !== s.fov) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
}
export const makeCam = (fov = 40, far = 5000) => new THREE.PerspectiveCamera(fov, W / H, 0.1, far);
