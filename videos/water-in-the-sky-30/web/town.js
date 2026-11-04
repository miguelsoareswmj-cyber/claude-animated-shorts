// A small toon town under a floating slab of ocean. Light presets: 'under' (midnight at noon), 'day'.
import {
  THREE, makeCam, toon, inked, box, roundBox, card, canvasTex, Person, blob, fishTex, FISH, whaleTex, skyDome, sprite,
  glowTex, hash, clamp, lerp, V3, PLUM, bubbleTex,
} from './core.js';

export const scene = new THREE.Scene();
export const cam = makeCam(40, 6000);
export const CEIL = 90, THICK = 26, SLAB = 260;

const sky = skyDome(0x3e7fd2, 0xc4d6ee); scene.add(sky);
const hemi = new THREE.HemisphereLight(0xbcd3ff, 0x9a7f6a, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.position.set(-40, 70, 50); scene.add(sun);
scene.fog = new THREE.Fog(0xc4d6ee, 120, 1400);

// ---------- ground + road ----------
{
  const geo = new THREE.PlaneGeometry(3000, 3000, 200, 200); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [];
  const a = new THREE.Color(0x79b955), b = new THREE.Color(0x5f9e48);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    p.setY(i, r > 120 ? Math.sin(x * 0.01) * Math.sin(z * 0.013) * 14 * clamp((r - 120) / 300) : 0);
    const c = a.clone().lerp(b, 0.5 + 0.5 * Math.sin(x * 0.05 + Math.sin(z * 0.04) * 2)); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, toon(0xffffff, { vertexColors: true })));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 600), toon(0x5d5a66)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, -150); scene.add(road);
  for (let z = 140; z > -440; z -= 8) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), toon(0xf2e6b8)); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.05, z); scene.add(d); }
  for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 600), toon(0xc9c2b8)); s.position.set(sx * 5.7, 0.12, -150); scene.add(s); }
}

// ---------- houses ----------
const windows = [];
function house(x, z, rotY, wall, roof, w = 8, d = 8, h = 6) {
  const g = new THREE.Group();
  { const bx = box(w, h, d, wall, 0.09); bx.position.y = h / 2; g.add(bx); }
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.6, 0); sh.lineTo(w / 2 + 0.6, 0); sh.lineTo(0, h * 0.62); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 1.2, bevelEnabled: false }); rg.translate(0, h, -d / 2 - 0.6);
  g.add(inked(rg, toon(roof), 0.09));
  const ch = box(1.1, 2.6, 1.1, 0xa9574a, 0.06); ch.position.set(w * 0.25, h + h * 0.45, 0); g.add(ch);
  const door = box(1.5, 2.6, 0.2, 0x6b4430, 0.05); door.position.set(0, 1.3, d / 2 + 0.08); g.add(door);
  for (const [wx, wy] of [[-w * 0.3, h * 0.36], [w * 0.3, h * 0.36], [-w * 0.3, h * 0.74], [w * 0.3, h * 0.74]]) {
    const m = new THREE.MeshToonMaterial({ color: 0x2d3e5e, emissive: 0xffc46b, emissiveIntensity: 0 });
    const wnd = inked(new THREE.BoxGeometry(1.5, 1.4, 0.2), m, 0.05); wnd.position.set(wx, wy, d / 2 + 0.06); g.add(wnd); windows.push(m);
  }
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
}
const WALLS = [0xe9d3a6, 0xd98f6b, 0xb9d0e3, 0xe7b8c2, 0xcfe0a8, 0xf0e3c8, 0xa7c7b5];
const ROOFS = [0xb5453c, 0x5a6c9a, 0x8c4a3a, 0x3f6f62, 0xa35a3a];
export const hero = house(-13, 0, Math.PI / 2, 0xf2d48a, 0xc8473c, 9, 9, 6.5);
let k = 0;
for (let z = 22; z > -260; z -= 17) for (const sx of [-1, 1]) {
  if (sx === -1 && Math.abs(z - 0) < 10) continue;
  const h = 5.5 + hash(k) * 3;
  house(sx * (13 + hash(k + 9) * 3), z + hash(k + 3) * 4, sx < 0 ? Math.PI / 2 : -Math.PI / 2, WALLS[k % 7], ROOFS[k % 5], 8 + hash(k + 1) * 2, 8, h); k++;
}
// trees
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  const t = inked(new THREE.CylinderGeometry(0.3, 0.45, 2.4, 8), toon(0x7a5236), 0.05); t.position.y = 1.2; g.add(t);
  const c = inked(new THREE.IcosahedronGeometry(2, 1), toon(0x4f9a45), 0.1); c.position.y = 3.8; c.scale.set(1, 1.15, 1); g.add(c);
  g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
}
for (let z = 30; z > -260; z -= 23) for (const sx of [-1, 1]) tree(sx * (21 + hash(z) * 6), z + 8, 0.9 + hash(z * sx) * 0.5);
tree(-7.5, 9, 1.1); tree(-19, -8, 1.3);
// street lamps
const lampGlows = [], lampLights = [];
for (let z = 12; z > -200; z -= 24) for (const sx of [-1, 1]) {
  const g = new THREE.Group();
  const pole = inked(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), toon(0x2f3446), 0.04); pole.position.y = 3; g.add(pole);
  const head = inked(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe3a0 }), 0.05); head.position.y = 6.1; g.add(head);
  const gl = sprite(glowTex, 2.6, { blending: THREE.AdditiveBlending }); gl.position.y = 6.1; g.add(gl); lampGlows.push(gl);
  g.position.set(sx * 5.4, 0, z + (sx > 0 ? 12 : 0)); scene.add(g);
}
for (const z of [6, -14]) { const l = new THREE.PointLight(0xffc77a, 0, 26, 1.6); l.position.set(-5, 6, z); scene.add(l); lampLights.push(l); }

// ---------- hero, the everyman ----------
export const me = new Person(1.8); me.mesh.position.set(-5.2, 0, 6); scene.add(me.mesh);
const meShadow = blob(scene, -6.5, 3, 1.4, 0.7);

// ---------- rain gauge + little rain cloud (shot C) ----------
export const gauge = new THREE.Group();
{
  const post = box(0.25, 1.0, 0.25, 0x8a6a4a, 0.03); post.position.y = 0.5; gauge.add(post);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 24, 1, true), new THREE.MeshToonMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  glass.position.y = 1.7; gauge.add(glass);
  const rim = inked(new THREE.TorusGeometry(0.32, 0.03, 6, 24), toon(0xe8f4ff), 0.025); rim.rotation.x = Math.PI / 2; rim.position.y = 2.4; gauge.add(rim);
  const base = inked(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 24), toon(0xe8f4ff), 0.025); base.position.y = 1.0; gauge.add(base);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.1 : 0.18, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x241726 })); t.position.set(0.33, 1.03 + i * 0.12, 0.05); gauge.add(t); }
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 24), toon(0x3d8fe0)); water.position.y = 1.03; water.scale.y = 0.001; gauge.add(water); gauge.userData.water = water;
  gauge.position.set(-5, 0, 6.5); scene.add(gauge);
}
export const rainCloud = new THREE.Group();
{
  for (const [x, y, z, r] of [[0, 0, 0, 1.3], [1.3, -0.2, 0, 1.0], [-1.3, -0.25, 0, 0.95], [0.5, 0.6, 0, 0.9], [-0.6, 0.45, 0.2, 0.8]]) {
    const s = inked(new THREE.SphereGeometry(r, 20, 14), toon(0xf6f8ff), 0.06); s.position.set(x, y, z); rainCloud.add(s);
  }
  const face = card(canvasTex(256, 128, (g) => { g.fillStyle = '#241726'; for (const x of [88, 168]) { g.beginPath(); g.ellipse(x, 56, 12, 16, 0, 0, 7); g.fill(); } g.lineWidth = 9; g.strokeStyle = '#241726'; g.beginPath(); g.arc(128, 78, 22, 0.2, Math.PI - 0.2); g.stroke(); }), 1.6, 0.8, { lit: false });
  face.position.set(0, -0.5, 1.32); rainCloud.add(face);
  rainCloud.userData.drops = [];
  for (let i = 0; i < 24; i++) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 2, 6), new THREE.MeshBasicMaterial({ color: 0x4f9be8 })); rainCloud.add(d); rainCloud.userData.drops.push(d); }
  rainCloud.position.set(-5, 5.2, 6.5); rainCloud.scale.setScalar(0.62); scene.add(rainCloud);
}

// ---------- the ocean slab in the sky ----------
const slabU = { uT: { value: 0 }, uDark: { value: 1 } };
const slab = new THREE.Mesh(new THREE.BoxGeometry(SLAB * 2, THICK, SLAB * 2), new THREE.ShaderMaterial({
  uniforms: slabU, fog: false,
  vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uT; varying vec3 vP; varying vec3 vN;
  float hh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float vor(vec2 p){ vec2 i=floor(p),f=fract(p); float d=9.; for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y); vec2 o=vec2(hh(i+g),hh(i+g+5.3)); o=.5+.4*sin(uT*.05+6.28*o); d=min(d,length(g+o-f)); } return d; }
  void main(){
    vec3 c;
    if(vN.y<-.5){ // underside: caustic net
      vec2 q=vP.xz*.12; float v=vor(q); float v2=vor(q*2.7+3.);
      c=mix(vec3(.08,.27,.55),vec3(.13,.40,.70),smoothstep(-.4,.4,sin(vP.x*.02+uT*.01)*sin(vP.z*.017)));
      c+=vec3(.30,.60,.85)*(smoothstep(.28,.0,1.-v)*.0+smoothstep(.10,.0,abs(v-.62))*.22+smoothstep(.08,.0,abs(v2-.62))*.12);
    } else if(vN.y>.5){ // top: sunlit ocean surface
      vec2 q=vP.xz*.02; float v=vor(q);
      c=mix(vec3(.18,.55,.88),vec3(.40,.74,.97),smoothstep(.2,.7,v));
    } else { // side cut: depth gradient with strata of light
      float t=(vP.y+${(THICK / 2).toFixed(1)})/${THICK.toFixed(1)};
      c=mix(vec3(.04,.14,.36),vec3(.16,.50,.86),pow(t,1.4));
      float wv=sin((vP.x+vP.z)*.08+uT*.05)*.5+.5; c+=vec3(.05,.1,.15)*wv*t;
    }
    gl_FragColor=vec4(c,1.);
  }`
}));
const slabInk = new THREE.Mesh(new THREE.BoxGeometry(SLAB * 2 + 2, THICK + 2, SLAB * 2 + 2), new THREE.MeshBasicMaterial({ color: 0x070509, side: THREE.BackSide, fog: false }));
const slabG = new THREE.Group(); slabG.add(slab, slabInk); slabG.position.y = CEIL + THICK / 2; scene.add(slabG);

// swimmers in the ceiling
const swimmers = [];
for (let i = 0; i < 26; i++) {
  const c = FISH[i % FISH.length]; const t = fishTex(c[0], c[1], { open: i % 2 === 0 });
  const m = card(t, 3.2, 2.0, { lit: false, bb: 'full' }); m.material.color = new THREE.Color(0x9fb6d6);
  scene.add(m); swimmers.push({ m, x: (hash(i) - 0.5) * 120, z: (hash(i + 40) - 0.5) * 140 - 10, sp: 0.06 + hash(i + 7) * 0.08, y: CEIL - 1.5 - hash(i + 3) * 4 });
}
export const whale = card(whaleTex('sad'), 40, 20, { lit: false, bb: 'full' }); whale.material.color = new THREE.Color(0xa9c0e0); scene.add(whale);

// ---------- falling stuff (shot J) ----------
const drops = [];
const dropMat = toon(0x3f8fe0), dropGeo = new THREE.SphereGeometry(1, 16, 12);
for (let i = 0; i < 70; i++) {
  const d = inked(dropGeo, dropMat, 0.06);
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdff2ff })); hl.position.set(-0.35, 0.4, 0.75); d.add(hl);
  d.visible = false; scene.add(d);
  drops.push({ d, x: (hash(i * 3) - 0.5) * 90, z: (hash(i * 3 + 1) - 0.5) * 90 - 10, s: 1.2 + hash(i * 3 + 2) * 3.2, o: hash(i * 7) });
}
export const fallers = new THREE.Group(); scene.add(fallers);
const fallFish = [];
for (let i = 0; i < 18; i++) {
  const c = FISH[i % FISH.length]; const m = card(fishTex(c[0], c[1], { open: true }), 2.4, 1.5, { lit: false, bb: 'full' });
  fallers.add(m); fallFish.push({ m, x: (hash(i + 11) - 0.5) * 16, y: hash(i + 5) * 26, z: -6 - hash(i + 2) * 14, r: hash(i + 9) * 6 });
}
export const fallWhale = card(whaleTex('shock'), 14, 7, { lit: false, bb: 'full' }); fallers.add(fallWhale);
export const ship = makeShip(); ship.scale.setScalar(0.22); fallers.add(ship);
export function makeShip() {
  const s = new THREE.Group();
  const mk = (pts, color) => { const sh = new THREE.Shape(); sh.moveTo(...pts[0]); for (const q of pts.slice(1)) sh.lineTo(...q); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5, bevelSegments: 2 }); g.translate(0, 0, -4); s.add(inked(g, toon(color), 0.35)); };
  mk([[-18, 0], [16, 0], [19.86, 3], [-18.86, 3]], 0xc8403a); mk([[-18.86, 3], [19.86, 3], [25, 7], [-20, 7]], 0x2a3c6e);
  const br = box(6, 6, 7, 0xf2efe6, 0.3); br.position.set(-14, 10, 0); s.add(br);
  const wn = new THREE.Mesh(new THREE.BoxGeometry(6.1, 1.1, 6.2), toon(0x24304a)); wn.position.set(-14, 11.6, 0); s.add(wn);
  const fn = inked(new THREE.CylinderGeometry(1.4, 1.7, 5, 16), toon(0xe8b53a), 0.25); fn.position.set(-17, 15, 0); s.add(fn);
  const cols = [0xe0693a, 0x3a8fd6, 0x5fae55, 0xe8c547, 0xd04a6a, 0x4bb5b0]; let k = 0;
  for (let x = -8; x <= 16; x += 5.2) for (let y = 0; y < 2; y++) { if (x > 12 && y > 0) continue; const c = box(5, 2.6, 7, cols[(k++ * 7 + y * 3) % 6], 0.22); c.position.set(x, 8.4 + y * 2.7, 0); s.add(c); }
  return s;
}

// ---------- flood water (shot N) ----------
const floodU = { uT: { value: 0 } };
export const flood = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), new THREE.ShaderMaterial({
  uniforms: floodU, transparent: true,
  vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform float uT; varying vec3 vW;
  void main(){
    vec2 q=vW.xz*vec2(.08,.25)+vec2(-uT*.35,0.);
    float s=sin(q.x+sin(q.y*1.3)*1.5)*.5+.5; float s2=sin(q.x*2.3+q.y*.7+uT*.1)*.5+.5;
    vec3 c=mix(vec3(.16,.50,.82),vec3(.30,.66,.92),s);
    c=mix(c,vec3(.92,.97,1.),smoothstep(.93,.99,s2)*.9);
    float d=length(vW.xz-cameraPosition.xz); c=mix(c,vec3(.77,.84,.93),smoothstep(150.,900.,d));
    gl_FragColor=vec4(c,.97);
  }`,
}));
flood.rotation.x = -Math.PI / 2; flood.visible = false; scene.add(flood);

// ---------- presets ----------
const C = (h) => new THREE.Color(h);
export function preset(name) {
  const under = name === 'under';
  sky.userData.u.uTop.value = under ? C(0x0b1636) : C(0x3e7fd2);
  sky.userData.u.uHz.value = under ? C(0x1d3462) : C(0xc4d6ee);
  scene.fog.color = under ? C(0x16264a) : C(0xc4d6ee); scene.fog.near = under ? 50 : 120; scene.fog.far = under ? 900 : 1400;
  hemi.color = under ? C(0x4f7fcf) : C(0xbcd3ff); hemi.groundColor = under ? C(0x262a48) : C(0x9a7f6a); hemi.intensity = under ? 1.7 : 0.9;
  sun.intensity = under ? 1.1 : 2.4; sun.color = under ? C(0x6fa8d8) : C(0xfff1dc);
  windows.forEach((m) => (m.emissiveIntensity = under ? 1.0 : 0));
  lampGlows.forEach((g) => (g.visible = under)); lampLights.forEach((l) => (l.intensity = under ? 5 : 0));
  me.mesh.material.emissiveIntensity = under ? 0.22 : 0.45;
}

/**
 * st: { light, slab (bool), slabDrop (m), drops 0..1 progress, fallers (bool), fallY, flood (bool), floodY,
 *       houseDrift (0..1), me {x,z,y,pose}, gauge (0..1 fill), rain (bool), whaleX, swim }
 */
export function update(f, st) {
  preset(st.light || 'day');
  slabU.uT.value = f; floodU.uT.value = f;
  slabG.visible = !!st.slab; slabG.position.y = CEIL + THICK / 2 - (st.slabDrop || 0);
  const swimOn = !!st.slab && !st.drops;
  swimmers.forEach((s, i) => {
    s.m.visible = swimOn; if (!swimOn) return;
    s.m.position.set(s.x + ((f * s.sp * 3) % 80) - 40, s.y - (st.slabDrop || 0), s.z);
  });
  whale.visible = swimOn && st.whaleX !== undefined;
  if (whale.visible) { whale.position.set(st.whaleX, CEIL - 12, -40); }
  // drops raining down from the slab
  drops.forEach((D) => {
    D.d.visible = st.drops !== undefined && st.drops > D.o * 0.5;
    if (!D.d.visible) return;
    const t = (st.drops - D.o * 0.5) * 2.0;
    D.d.position.set(D.x, CEIL - 4 - t * t * 70, D.z); D.d.scale.set(D.s, D.s * (1.3 + t * 0.6), D.s);
  });
  fallers.visible = !!st.fallers;
  if (st.fallers) {
    const fy = st.fallY || 0;
    fallFish.forEach((F, i) => {
      F.m.position.set(F.x, F.y + fy + Math.sin(f * 0.1 + i) * 0.3, F.z);
      F.m.userData.spin = F.r + f * 0.08 * (i % 2 ? 1 : -1);
    });
  }
  flood.visible = !!st.flood; flood.position.y = st.floodY ?? 1.5;
  if (st.houseDrift !== undefined) {
    const d = st.houseDrift; hero.position.set(-13 + d * 60, (st.floodY ?? 0) - 1.2 + Math.sin(f * 0.15) * 0.15, d * 25);
    hero.rotation.set(Math.sin(f * 0.11) * 0.04, Math.PI / 2 + d * 0.6, Math.sin(f * 0.09) * 0.05);
  } else { hero.position.set(-13, 0, 0); hero.rotation.set(0, Math.PI / 2, 0); }
  if (st.me) {
    const m = st.me; me.mesh.visible = true; me.pose(m.pose || {});
    me.mesh.position.set(m.x ?? -5.2, m.y ?? 0, m.z ?? 6); me.mesh.userData.spin = m.rot || 0;
    meShadow.visible = (m.y ?? 0) < 0.1; meShadow.position.set(me.mesh.position.x, 0.04, me.mesh.position.z);
  } else { me.mesh.visible = false; meShadow.visible = false; }
  gauge.visible = st.gauge !== undefined; rainCloud.visible = !!st.rain;
  if (gauge.visible) { const w = gauge.userData.water; const h = Math.max(0.001, (st.gauge || 0) * 0.24); w.scale.y = h; w.position.y = 1.03 + h / 2; }
  if (st.rain) {
    rainCloud.position.y = 5.2 + Math.sin(f * 0.08) * 0.1;
    rainCloud.userData.drops.forEach((d, i) => { const ph = ((f * 0.06 + hash(i)) % 1); d.position.set((hash(i + 1) - 0.5) * 1.4, -0.9 - ph * 5.4, (hash(i + 2) - 0.5) * 0.6); d.visible = ph < 0.92; });
  }
}
