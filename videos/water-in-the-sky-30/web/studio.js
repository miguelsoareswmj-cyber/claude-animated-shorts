// The night-blue explainer stage: a balance scale (air vs. water) and a bathtub on a paper towel.
import { THREE, makeCam, toon, inked, box, roundBox, card, canvasTex, blob, V3, clamp, PLUM, hash } from './core.js';

export const scene = new THREE.Scene();
export const cam = makeCam(38, 1000);
const back = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vP; void main(){ float y=normalize(vP).y; gl_FragColor=vec4(mix(vec3(.36,.30,.66),vec3(.16,.17,.42),smoothstep(-.1,.6,y)),1.); }`
}));
back.renderOrder = -5; scene.add(back);
scene.add(new THREE.HemisphereLight(0xa8b8ff, 0x4a3a76, 1.6));
const key = new THREE.DirectionalLight(0xffe2b8, 2.8); key.position.set(-14, 22, 18); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fa0ff, 1.0); rim.position.set(16, 10, -14); scene.add(rim);
{
  const floor = inked(new THREE.CylinderGeometry(26, 26, 1, 64), toon(0x7468c0), 0.12); floor.position.y = -0.5; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(26, 0.15, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffd36b })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
}
// spotlight pool
blob(scene, 0, 0, 22, 14, 0.02).material.color = new THREE.Color(0x000000);

// ---------- balance scale ----------
export const scale = new THREE.Group(); scene.add(scale); scale.rotation.y = 0.0;
const gold = 0xe2b347, dgold = 0xb98a2e;
{
  const base = inked(new THREE.CylinderGeometry(1.6, 2.2, 0.8, 24), toon(dgold), 0.08); base.position.y = 0.4; scale.add(base);
  const post = inked(new THREE.CylinderGeometry(0.28, 0.34, 7.5, 12), toon(gold), 0.06); post.position.y = 4.4; scale.add(post);
  const knob = inked(new THREE.SphereGeometry(0.55, 16, 12), toon(gold), 0.05); knob.position.y = 8.3; scale.add(knob);
}
const beam = new THREE.Group(); beam.position.y = 8.1; scale.add(beam);
beam.add(box(11, 0.35, 0.45, gold, 0.06));
const pans = [];
for (const s of [-1, 1]) {
  const hang = new THREE.Group(); hang.position.x = s * 5.3; beam.add(hang);
  const pan = new THREE.Group(); hang.add(pan);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2; const ex = Math.cos(a) * 1.7, ez = Math.sin(a) * 1.7;
    const len = Math.hypot(ex, 4.2, ez);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 5), new THREE.MeshBasicMaterial({ color: PLUM }));
    str.position.set(ex / 2, -2.1, ez / 2); str.lookAt(V3(ex, -4.2, ez).add(hang.position).add(beam.position)); str.rotateX(Math.PI / 2);
    str.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(-ex, 4.2, -ez).normalize());
    pan.add(str);
  }
  const dish = inked(new THREE.CylinderGeometry(2.1, 1.6, 0.4, 28), toon(gold), 0.06); dish.position.y = -4.3; pan.add(dish);
  pans.push(hang);
}
// air: a puffy little cloud with a face
const airTex = canvasTex(512, 400, (g) => {
  g.fillStyle = '#f4f7ff'; g.strokeStyle = PLUM; g.lineWidth = 14;
  const puffs = [[256, 210, 110], [150, 250, 80], [362, 250, 80], [200, 160, 80], [320, 160, 78], [256, 280, 90]];
  g.beginPath(); for (const [x, y, r] of puffs) { g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); } g.fill();
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
  g.fillStyle = '#f4f7ff'; for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x, y, r - 7, 0, 7); g.fill(); }
  g.fillStyle = PLUM; for (const x of [215, 297]) { g.beginPath(); g.ellipse(x, 220, 14, 20, 0, 0, 7); g.fill(); }
  g.lineWidth = 10; g.beginPath(); g.ellipse(256, 272, 16, 20, 0, 0, 7); g.stroke();
});
export const air = card(airTex, 3.2, 2.5, { emissive: 0.5 }); pans[0].add(air); air.position.y = -4.1;
// water: a big blue block with a wavy top and a grumpy face
export const water = new THREE.Group();
{
  const w = 3.4;
  const b = roundBox(w, w, w, 0.25, 0x2f7fd8, 0.08); b.position.y = w / 2; water.add(b);
  const top = inked(new THREE.CylinderGeometry(w * 0.48, w * 0.48, 0.3, 24), toon(0x6fc0f2), 0.03); top.position.y = w + 0.02; top.scale.z = 1; water.add(top);
  const face = card(canvasTex(256, 160, (g) => {
    g.fillStyle = '#fff'; g.strokeStyle = PLUM; g.lineWidth = 8;
    for (const x of [80, 176]) { g.beginPath(); g.ellipse(x, 64, 24, 28, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = PLUM; g.beginPath(); g.arc(x + 4, 70, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; }
    g.lineWidth = 10; g.beginPath(); g.moveTo(52, 24); g.lineTo(106, 40); g.moveTo(204, 24); g.lineTo(150, 40); g.stroke();
    g.beginPath(); g.moveTo(96, 134); g.quadraticCurveTo(128, 116, 160, 134); g.stroke();
  }), 2.2, 1.4, { lit: false });
  face.position.set(0, w * 0.35, w / 2 + 0.06); water.add(face);
  water.position.y = -4.1; pans[1].add(water);
}

// ---------- bathtub over a paper towel ----------
export const tubSet = new THREE.Group(); tubSet.position.set(60, 0, 0); scene.add(tubSet);
const towelTex = canvasTex(512, 512, (g) => {
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(160,170,200,.35)'; for (let y = 16; y < 512; y += 32) for (let x = 16 + ((y / 32) % 2) * 16; x < 512; x += 32) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(150,160,190,.6)'; g.lineWidth = 5; g.setLineDash([12, 10]); g.strokeRect(10, 10, 492, 492);
});
const TW = 7, TD = 4.5, TY = 5;
const towelGeo = new THREE.PlaneGeometry(TW, TD, 40, 26); towelGeo.rotateX(-Math.PI / 2);
const towelBase = towelGeo.attributes.position.array.slice();
const towelMat = toon(0xffffff, { map: towelTex, side: THREE.DoubleSide });
export const towel = new THREE.Mesh(towelGeo, towelMat); towel.position.y = TY; tubSet.add(towel);
const halves = [];
for (const s of [-1, 1]) {
  const g = new THREE.PlaneGeometry(TW / 2, TD, 20, 2); g.rotateX(-Math.PI / 2); g.translate(s * TW / 4, 0, 0);
  const pivot = new THREE.Group(); pivot.position.set(s * TW / 2, TY, 0);
  const m = new THREE.Mesh(g, towelMat); m.position.x = -s * TW / 2; pivot.add(m); pivot.visible = false; tubSet.add(pivot); halves.push(pivot);
}
for (const s of [-1, 1]) {
  const p = box(0.7, TY + 0.4, 0.7, 0x8a5a3a, 0.06); p.position.set(s * (TW / 2 + 0.2), (TY + 0.4) / 2, 0); tubSet.add(p);
  const c = box(0.9, 0.3, TD + 0.4, 0x6e4630, 0.05); c.position.set(s * (TW / 2 + 0.2), TY + 0.45, 0); tubSet.add(c);
}
export const tub = new THREE.Group(); tubSet.add(tub);
{
  const shell = roundBox(4.6, 1.7, 2.4, 0.55, 0xf7f5f0, 0.08); shell.position.y = 0.85; tub.add(shell);
  const wtr = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.05, 1.8), toon(0x5fb6ef)); wtr.position.y = 1.72; tub.add(wtr);
  const rim = inked(new THREE.TorusGeometry(1, 0.12, 8, 32), toon(0xf7f5f0), 0.04); rim.scale.set(2.05, 1.0, 1.0); rim.rotation.x = Math.PI / 2; rim.position.y = 1.72; tub.add(rim);
  for (const [x, z] of [[-1.7, -0.8], [1.7, -0.8], [-1.7, 0.8], [1.7, 0.8]]) { const ft = inked(new THREE.SphereGeometry(0.28, 12, 8), toon(0xe2b347), 0.04); ft.position.set(x, -0.05, z); tub.add(ft); }
  const tap = inked(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), toon(0xc9ced6), 0.03); tap.position.set(-1.9, 2.1, 0); tub.add(tap);
  // rubber duck
  const duck = new THREE.Group();
  const db = inked(new THREE.SphereGeometry(0.32, 14, 10), toon(0xffd23a), 0.03); db.scale.set(1.2, 0.85, 1); duck.add(db);
  const dh = inked(new THREE.SphereGeometry(0.2, 12, 8), toon(0xffd23a), 0.03); dh.position.set(0.22, 0.32, 0); duck.add(dh);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), toon(0xf07a2a)); bk.rotation.z = -Math.PI / 2; bk.position.set(0.45, 0.3, 0); duck.add(bk);
  duck.position.set(0.8, 1.85, 0.2); tub.add(duck);
}

export function update(f, st) {
  // scale tilt: -1 (air side down) .. +1 (water side down)
  const tilt = st.tilt ?? 0;
  beam.rotation.z = -tilt * 0.38;
  pans.forEach((p) => (p.rotation.z = tilt * 0.38));
  water.visible = st.water !== undefined; if (water.visible) water.position.y = -4.1 + (st.water ?? 0);
  air.position.y = -4.1 + (st.airHop ?? 0); air.userData.spin = st.airSpin ?? 0;
  // tub + towel
  const sag = st.sag ?? 0, torn = st.torn ?? 0;
  const p = towelGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = towelBase[i * 3], z = towelBase[i * 3 + 2];
    const u = 1 - Math.pow(x / (TW / 2), 2), v = 1 - Math.pow(z / (TD / 2), 2) * 0.35;
    p.setY(i, -sag * u * v + Math.sin(x * 3 + f * 0.3) * 0.02 * sag);
  }
  p.needsUpdate = true; towelGeo.computeVertexNormals();
  towel.visible = torn <= 0;
  halves.forEach((h, i) => { h.visible = torn > 0; h.rotation.z = (i ? 1 : -1) * -torn * 1.3; });
  tub.position.y = st.tubY ?? 9;
  tub.rotation.z = st.tubRot ?? 0;
}
