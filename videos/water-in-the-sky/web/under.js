// Inside the sky-ocean: an airliner at cruising altitude, now a submarine.
import { THREE, makeCam, toon, inked, box, card, canvasTex, fishTex, FISH, sprite, bubbleTex, hash, V3, PLUM } from './core.js';

export const scene = new THREE.Scene();
export const cam = makeCam(42, 2000);
scene.fog = new THREE.Fog(0x1d5fa8, 20, 220);
scene.background = null;

// gradient water backdrop
const bg = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uT: { value: 0 } },
  vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uT; varying vec3 vP; void main(){ vec3 d=normalize(vP); float y=d.y;
    vec3 c=mix(vec3(.05,.20,.45),vec3(.20,.58,.90),smoothstep(-.6,.7,y));
    float rays=pow(max(0.,sin(d.x*24.+d.z*9.+uT*.02)),8.)*smoothstep(.0,.8,y);
    c+=vec3(.25,.45,.6)*rays*.35; gl_FragColor=vec4(c,1.); }`
}));
bg.renderOrder = -5; scene.add(bg);
scene.add(new THREE.HemisphereLight(0x9fd2ff, 0x10305a, 1.2));
const key = new THREE.DirectionalLight(0xbfe6ff, 1.6); key.position.set(-20, 60, 30); scene.add(key);

// light shafts
const shafts = [];
for (let i = 0; i < 7; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6 + hash(i) * 8, 200), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  m.position.set(-60 + i * 20, 40, -60 - hash(i + 3) * 60); m.rotation.z = 0.25; scene.add(m); shafts.push(m);
}

// the airliner
export const plane = new THREE.Group();
{
  const white = 0xf3f1ec, blue = 0x2f6fc0;
  const fus = inked(new THREE.CapsuleGeometry(2.2, 22, 8, 20), toon(white), 0.12); fus.rotation.z = Math.PI / 2; plane.add(fus);
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(2.23, 22, 8, 20, 1), toon(blue)); belly.rotation.z = Math.PI / 2; belly.scale.set(1, 1, 1); belly.position.y = -0.05;
  // stripe: thin band
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.24, 2.24, 22, 20, 1, true, 0, Math.PI), toon(blue, { side: THREE.DoubleSide })); stripe.rotation.z = Math.PI / 2; stripe.rotation.x = Math.PI; stripe.scale.set(1, 1, 1); plane.add(stripe);
  const ws = new THREE.Shape(); ws.moveTo(-3, 0); ws.lineTo(3, 0); ws.lineTo(-2, 14); ws.lineTo(-4.5, 14); ws.closePath();
  const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.5, bevelEnabled: false }); wg.rotateX(Math.PI / 2);
  for (const s of [-1, 1]) {
    const w = inked(wg, toon(0xdedbd6), 0.1); w.scale.z = s; w.position.set(1, -0.9, 0); plane.add(w);
    const eng = inked(new THREE.CylinderGeometry(0.9, 1.0, 3.4, 16), toon(0xbfc3cc), 0.08); eng.rotation.z = Math.PI / 2; eng.position.set(1.5, -2.0, s * 5.2); plane.add(eng);
  }
  const ts = new THREE.Shape(); ts.moveTo(0, 0); ts.lineTo(3.5, 0); ts.lineTo(4.8, 6); ts.lineTo(3.2, 6); ts.closePath();
  const tf = inked(new THREE.ExtrudeGeometry(ts, { depth: 0.4, bevelEnabled: false }), toon(blue), 0.08); tf.position.set(-14.5, 1.2, -0.2); tf.scale.x = -1; tf.position.x = -10.2; plane.add(tf);
  const hs = new THREE.Shape(); hs.moveTo(-1.5, 0); hs.lineTo(1.5, 0); hs.lineTo(-0.5, 5); hs.lineTo(-2, 5); hs.closePath();
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: false }); hg.rotateX(Math.PI / 2);
  for (const s of [-1, 1]) { const h = inked(hg, toon(0xdedbd6), 0.06); h.scale.z = s; h.position.set(-11.5, 0.8, 0); plane.add(h); }
  for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), toon(0x1f2a44)); w.position.set(7 - i * 2, 0.7, 2.1); w.scale.z = 0.4; plane.add(w); }
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), toon(0x1f2a44)); cockpit.position.set(12.4, 0.9, 0); cockpit.scale.set(0.7, 0.45, 1.6); plane.add(cockpit);
  scene.add(plane);
}
// bubbles from the engines + fish
const bubbles = [];
for (let i = 0; i < 40; i++) { const b = sprite(bubbleTex, 0.6); scene.add(b); bubbles.push({ b, o: hash(i), s: 0.3 + hash(i + 2) * 0.7, side: i % 2 ? 1 : -1 }); }
const fish = [];
for (let i = 0; i < 12; i++) {
  const c = FISH[i % FISH.length]; const m = card(fishTex(c[0], c[1], { open: i % 3 === 0 }), 3.2, 2, { emissive: 0.5 });
  scene.add(m); fish.push({ m, x: (hash(i + 1) - 0.5) * 80, y: (hash(i + 2) - 0.5) * 30, z: -10 - hash(i + 3) * 50, sp: 0.05 + hash(i) * 0.08 });
}
// the nosy fish at the window
export const nosy = card(fishTex('#f2d24a', '#5bb5d6', { open: false }), 2.0, 1.25, { emissive: 0.5 }); scene.add(nosy);

export function update(f, st) {
  bg.material.uniforms.uT.value = f;
  plane.position.set(st.planeX ?? 0, Math.sin(f * 0.05) * 0.3, 0);
  plane.rotation.set(0.04 * Math.sin(f * 0.04), 0, -0.04 + 0.03 * Math.sin(f * 0.06));
  bubbles.forEach((B, i) => {
    const ph = (f * 0.02 * (1 + B.s) + B.o) % 1;
    B.b.position.set(plane.position.x - 1 - ph * 18, -2 + ph * 6 + Math.sin(ph * 12 + i) * 0.3, B.side * 5.2 + Math.sin(i) * 0.6);
    const sc = 0.3 + B.s * 0.6 * (0.5 + ph); B.b.scale.set(sc, sc, 1); B.b.material.opacity = 1 - ph;
  });
  fish.forEach((F) => { F.m.position.set(F.x + ((f * F.sp * 6) % 60) - 30, F.y, F.z); });
  nosy.position.set(plane.position.x + 4.2 + Math.sin(f * 0.07) * 0.25, 0.1 + Math.sin(f * 0.11) * 0.1, 3.4);
}
