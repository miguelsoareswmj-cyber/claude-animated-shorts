
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
