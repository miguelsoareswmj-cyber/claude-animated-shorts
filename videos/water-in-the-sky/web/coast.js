// The coast: a skyscraper, a record wave next to it, the kilometre-tall wall of water behind,
// and the steaming "hot tub" ocean with a sweaty fish and a thermometer.
import { THREE, makeCam, toon, inked, box, card, canvasTex, fishTex, skyDome, sprite, steamTex, hash, clamp, V3, PLUM, Person } from './core.js';

export const scene = new THREE.Scene();
export const cam = makeCam(40, 20000);
const sky = skyDome(0x3e7fd2, 0xc4d6ee, 15000); scene.add(sky);
scene.add(new THREE.HemisphereLight(0xbcd3ff, 0x8a8f9a, 1.0));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.3); sun.position.set(-60, 80, 60); scene.add(sun);
scene.fog = new THREE.Fog(0xc4d6ee, 1500, 40000);

// sea
const seaU = { uT: { value: 0 }, uWarm: { value: 0 } };
const sea = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.ShaderMaterial({
  uniforms: seaU,
  vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform float uT,uWarm; varying vec3 vW;
  void main(){ vec2 q=vW.xz*.03; float s=sin(q.x+sin(q.y*1.7+uT*.03)*1.3+uT*.04)*.5+.5; float s2=sin(q.x*3.1-q.y*1.2+uT*.08)*.5+.5;
    vec3 a=mix(vec3(.13,.46,.80),vec3(.22,.62,.70),uWarm), b=mix(vec3(.26,.64,.93),vec3(.45,.80,.78),uWarm);
    vec3 c=mix(a,b,s); c=mix(c,vec3(.93,.97,1.),smoothstep(.95,.995,s2)*.7);
    float d=length(vW.xz-cameraPosition.xz); c=mix(c,vec3(.77,.84,.93),smoothstep(800.,9000.,d));
    gl_FragColor=vec4(c,1.); }`
}));
sea.rotation.x = -Math.PI / 2; scene.add(sea);

// land: a coastal city strip + mountains behind (x along shore, z>0 land, sea at z<0)
{
  const geo = new THREE.PlaneGeometry(9000, 3000, 180, 60); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 1500);
  const p = geo.attributes.position, col = [];
  const gr = new THREE.Color(0x6fae4f), rk = new THREE.Color(0x9b8a7a), sn = new THREE.Color(0xf4f6fb);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const m = clamp((z - 500) / 900) * (320 + 160 * Math.sin(x * 0.0016) + 90 * Math.sin(x * 0.0041 + 1));
    const y = 2 + m * (0.7 + 0.3 * Math.sin(x * 0.01 + z * 0.006));
    p.setY(i, y);
    const c = y > 900 ? sn : y > 300 ? gr.clone().lerp(rk, clamp((y - 300) / 400)) : gr; col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, toon(0xffffff, { vertexColors: true })));
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(9000, 40), toon(0xe7d29e)); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 1.5, 15); scene.add(beach);
}
// city blocks + the skyscraper (~440 m with spire, 1 unit = 1 m)
const CITY = new THREE.Group(); scene.add(CITY);
const BCOL = [0xd9d2c3, 0xb9c8d8, 0xe0b89a, 0xc4d1b2, 0xa9b2c8];
for (let i = 0; i < 70; i++) {
  const x = (hash(i) - 0.5) * 1400, z = 60 + hash(i + 50) * 380, h = 25 + hash(i + 9) * 120, w = 25 + hash(i + 3) * 30;
  if (Math.abs(x) < 50 && z < 150) continue;
  const b = box(w, h, w, BCOL[i % 5], 1.2); b.position.set(x, h / 2, z); CITY.add(b);
}
export const tower = new THREE.Group();
{
  const c = 0xd8d0bf;
  const tiers = [[60, 200], [46, 110], [34, 60], [22, 26]]; let y = 0;
  for (const [w, h] of tiers) { const b = box(w, h, w, c, 1.4); b.position.y = y + h / 2; tower.add(b); y += h; }
  const sp = inked(new THREE.CylinderGeometry(1.2, 3.5, 44, 8), toon(0xbfc6cf), 1.0); sp.position.y = y + 22; tower.add(sp);
  for (let k = 0; k < 18; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(61, 1.2, 61), toon(0x8d9aae)); st.position.y = 10 + k * 11; tower.add(st); }
  tower.position.set(0, 0, 110); scene.add(tower);
}

// wave builder: a solid curling wave, profile in (z, y), extruded along x; it travels toward +z (the shore)
function waveMesh(height, len, seed) {
  const h = height;
  const prof = [[-1.5, 0], [-0.9, 0.22], [-0.45, 0.55], [-0.15, 0.86], [0.08, 1.0], [0.3, 1.0], [0.48, 0.9], [0.56, 0.74],
    [0.5, 0.62], [0.4, 0.66], [0.3, 0.6], [0.2, 0.42], [0.18, 0.22], [0.26, 0]];
  const sh = new THREE.Shape(); sh.moveTo(prof[0][0] * h, prof[0][1] * h);
  for (const [z, y] of prof.slice(1)) sh.lineTo(z * h, y * h); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false, steps: 60 });
  // shape x -> world z, shape y -> world y, extrude z -> world x
  geo.rotateY(Math.PI / 2); geo.translate(-len / 2, 0, 0);
  const p = geo.attributes.position, col = [];
  const deep = new THREE.Color(0x123f8a), mid = new THREE.Color(0x2275cc), lip = new THREE.Color(0x6cc3f5), foam = new THREE.Color(0xffffff);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), v = y / h;
    const wob = Math.sin(x / len * 17 + seed) * 0.05 + Math.sin(x / len * 43 + seed * 2) * 0.025;
    p.setY(i, y * (1 + wob)); p.setZ(i, p.getZ(i) + wob * h * 0.5);
    const c = v > 0.9 ? lip.clone().lerp(foam, (v - 0.9) / 0.1) : v > 0.45 ? mid.clone().lerp(lip, (v - 0.45) / 0.45) : deep.clone().lerp(mid, v / 0.45);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const g = inked(geo, toon(0xffffff, { vertexColors: true }), h * 0.006);
  const sprayTex = canvasTex(128, 128, (gg) => { gg.fillStyle = '#ffffff'; gg.beginPath(); gg.arc(64, 64, 56, 0, 7); gg.fill(); });
  for (let i = 0; i < 90; i++) { const s = sprite(sprayTex, h * (0.015 + hash(i + seed) * 0.025)); s.position.set((hash(i * 2 + seed) - 0.5) * len, h * (0.97 + hash(i * 5) * 0.06), h * (0.05 + 0.45 * hash(i * 3))); g.add(s); }
  return g;
}
export const wave1 = waveMesh(524, 1800, 1); scene.add(wave1);
export const megaWave = waveMesh(3200, 16000, 7); scene.add(megaWave);

// hot-tub close-up props (near the shore, z<0)
export const hot = new THREE.Group(); scene.add(hot);
const hotFishO = fishTex('#f39a3a', '#e0663a', { sweat: true, open: true, red: true });
const hotFishC = fishTex('#f39a3a', '#e0663a', { sweat: true, open: false, red: true });
export const hotFish = card(hotFishO, 2.6, 1.6, { emissive: 0.45 }); hot.add(hotFish);
export const thermo = new THREE.Group(); hot.add(thermo);
{
  const glass = inked(new THREE.CapsuleGeometry(0.28, 4.4, 6, 16), toon(0xf2f7ff, { transparent: true, opacity: 0.85 }), 0.06); glass.position.y = 2.5; thermo.add(glass);
  const bulb = inked(new THREE.SphereGeometry(0.55, 16, 12), toon(0xe2403a), 0.06); bulb.position.y = 0.2; thermo.add(bulb);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 10), toon(0xe2403a)); liquid.position.y = 0.6; thermo.add(liquid); thermo.userData.liq = liquid;
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.18 : 0.32, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x241726 })); t.position.set(0.3, 1 + i * 0.5, 0.15); thermo.add(t); }
}
const steams = [];
for (let i = 0; i < 16; i++) { const s = sprite(steamTex, 1.6); hot.add(s); steams.push({ s, x: (hash(i) - 0.5) * 14, z: -hash(i + 4) * 10 + 1, o: hash(i + 9) }); }

export function update(f, st) {
  seaU.uT.value = f; seaU.uWarm.value = st.warm ?? 0;
  wave1.visible = st.w1 !== undefined; if (wave1.visible) { wave1.position.set(0, 0, st.w1); }
  megaWave.visible = st.w2 !== undefined; if (megaWave.visible) { megaWave.position.set(0, -50, st.w2); }
  hot.visible = !!st.hot;
  if (st.hot) {
    hot.position.set(0, 0, -40);
    const bob = Math.sin(f * 0.2) * 0.08;
    hotFish.position.set(-0.8, -0.55 + bob, 0);
    const t = hotFish.material; const tx = Math.floor(f / 6) % 2 ? hotFishC : hotFishO; t.map = tx; t.emissiveMap = tx;
    thermo.position.set(1.8, -0.4, -0.6); thermo.rotation.z = -0.08;
    const lv = st.thermo ?? 0; const L = thermo.userData.liq; L.scale.y = 0.6 + lv * 3.6; L.position.y = 0.4 + L.scale.y / 2;
    steams.forEach((S) => { const ph = (f * 0.02 + S.o) % 1; S.s.position.set(S.x, ph * 6, S.z); S.s.material.opacity = Math.sin(ph * Math.PI) * 0.8; S.s.scale.set(1.2 + ph, 2.4 + ph * 2, 1); });
  }
}
