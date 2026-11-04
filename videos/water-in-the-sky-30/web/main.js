// Shot plan + compositor for "What if all of Earth's water teleported into the sky?"
// Every reaction is timed to the narration (timings.js, from voice/make_voice.py).
import { THREE, renderer, W, H, FPS, clamp, lerp, sstep, burst, easeIn, kick, V3, vlerp, placeCam, orientBillboards } from './core.js';
import TIM from './timings.js';
import * as G from './globe.js';
import * as T from './town.js';
import * as U from './under.js';
import * as S from './studio.js';
import * as C from './coast.js';

// ---------- word timing ----------
const LN = Object.fromEntries(TIM.lines.map((l) => [l.id, l]));
const fr = (s) => s * FPS;
/** frame where word i of line id starts (character-proportional inside the line) */
export function wf(id, i) { return fr(LN[id].words[i].s); }
const ls = (id) => fr(LN[id].start), le = (id) => fr(LN[id].end);
export const END = Math.ceil(fr(TIM.duration)) + 14; // room for the signature wah-wah

// ---------- shot boundaries ----------
// 30 s cut on the user's own voice-over: shots C, D, I, L, M, M2 are zero-length (skipped)
const B = {
  A: 0, B: ls('s1') - 3, C: ls('e3') - 3, D: ls('e3') - 3, E: ls('e3') - 3, F: ls('e5') - 3, G: ls('q1') - 3,
  H: ls('y1') - 3, I: ls('f1') - 3, J: ls('f1') - 3, J2: ls('f2') - 2, K: ls('i1') - 3, L: wf('i1', 6) - 2, L2: wf('i1', 6) - 2,
  M: ls('l1') - 3, M2: ls('l1') - 3, N: ls('l1') - 3, N2: ls('l2') - 2, Z: END,
};
const KEY = {
  teleport: wf('h1', 6) - 2, dark: wf('h2', 2) - 2, floating: wf('s1', 6) - 2, thick: wf('s1', 11) - 2,
  inch: 0, pacific: 0, house: wf('e3', 3) - 2, sub: wf('e5', 2) - 2, why: wf('q1', 3) - 2,
  twoHundred: wf('y1', 3) - 2, air: wf('y1', 9), bathtub: 0, towel: 0,
  falls: wf('f1', 2) - 2, fish: wf('f2', 5) - 2, whales: wf('f2', 6) - 2, ships: wf('f2', 8) - 2,
  hits: wf('i1', 2) - 2, five: 0, km: wf('i1', 10) - 2, heat: 0, warmer: 0,
  drains: wf('l1', 3) - 2, unluck: ls('l2') - 2, yourHouse: wf('l3', 3) - 2,
};
window.KEY = KEY; window.B = B; window.T = T;

// ---------- shots ----------
const blinkOf = (f) => (Math.floor(f) % 53) < 3;
const SHOTS = [
  { id: 'A', a: B.A, b: B.B, run(f) {
    const t = f - KEY.teleport;
    const lifted = t >= 0;
    G.update(f, {
      level: lifted ? 1 : 0, cloud: lifted ? 1 - clamp(t / 6) : 1,
      shellR: lifted ? lerp(1.0, 1.10, burst(f, KEY.teleport, 14)) : 0, shellA: 0.9,
      dark: sstep(KEY.dark, KEY.dark + 8, f),
      rotY: -Math.PI / 2 + 0.70 + f * 0.0016,
    });
    const push = lerp(9.6, 9.0, f / B.B) - 0.5 * burst(f, ls('h2') - 2, 12) - 0.35 * burst(f, KEY.dark, 12) - (f > B.B - 8 ? 3.0 * easeIn(f, B.B - 8, 8) : 0);
    const sh = kick(f, KEY.teleport, 0.06);
    G.setCam(push, { x: sh, y: 0.55 + sh, roll: lerp(-0.07, 0.0, f / B.B) });
    return [G.scene, G.cam];
  } },
  { id: 'B', a: B.B, b: B.C, run(f) {
    T.update(f, { light: 'under', slab: true, me: { pose: { expr: 'shock', blink: blinkOf(f), headTilt: -4 } } });
    const up = burst(f, KEY.floating, 18), out = burst(f, KEY.thick, 26);
    const p0 = V3(-2.6, 1.45, 10.2), l0 = V3(-5.2, 1.4, 6);
    const p1 = V3(-1.5, 1.2, 13), l1 = V3(-6, 80, -25);
    const p2 = V3(340, 55, 380), l2 = V3(-10, 70, -10);
    let pos = vlerp(p0, p1, up), look = vlerp(l0, l1, up);
    pos = vlerp(pos, p2, out); look = vlerp(look, l2, out);
    const creep = (f - B.B) * 0.004;
    pos.z -= creep * (1 - out);
    placeCam(T.cam, { pos, look, fov: lerp(40, 34, out), roll: lerp(0.05, -0.07, out) });
    return [T.scene, T.cam];
  } },
  { id: 'C', a: B.C, b: B.D, run(f) {
    T.update(f, { light: 'day', slab: false, rain: true, gauge: sstep(B.C + 4, KEY.inch, f), me: { pose: { expr: 'neutral', blink: blinkOf(f) }, x: -6.4, z: 5.6 } });
    const t = (f - B.C) / (B.D - B.C);
    const pos = V3(-2.4 + t * 0.2, 3.0, 16.5 - t * 1.6), look = V3(-5.4, 3.0 + 0.2 * t, 6.5);
    if (f > B.D - 6) look.y += 40 * easeIn(f, B.D - 6, 6); // whip up
    placeCam(T.cam, { pos, look, fov: 36, roll: 0.06 });
    return [T.scene, T.cam];
  } },
  { id: 'D', a: B.D, b: B.E, run(f) {
    T.update(f, { light: 'under', slab: true, whaleX: lerp(-70, 25, burst(f, KEY.pacific - 6, 40)) });
    const t = (f - B.D) / (B.E - B.D);
    const pos = V3(-2, 2.5, 22), look = V3(-5 + t * 4, 90, -25);
    if (f < B.D + 6) look.y = lerp(30, 90, burst(f, B.D, 6));
    placeCam(T.cam, { pos, look, fov: 52, roll: -0.08 + t * 0.03 });
    return [T.scene, T.cam];
  } },
  { id: 'E', a: B.E, b: B.F, run(f) {
    T.update(f, { light: 'under', slab: true, slabDrop: 66 });
    const t = (f - B.E) / (B.F - B.E);
    placeCam(T.cam, { pos: V3(2.5, 1.3, 17 - t * 1.5), look: V3(-11, 13 + t * 2, -2), fov: 50, roll: 0.07 });
    return [T.scene, T.cam];
  } },
  { id: 'F', a: B.F, b: B.G, run(f) {
    U.update(f, { planeX: lerp(-8, 4, (f - B.F) / (B.G - B.F)) });
    const k2 = burst(f, KEY.sub, 16);
    const pp = U.plane.position;
    const pos = vlerp(V3(pp.x + 34, 6, 30), V3(pp.x + 9.5, 1.6, 10.5), k2);
    const look = vlerp(V3(pp.x + 1, 0, 0), V3(pp.x + 4.5, 0.5, 2.5), k2);
    if (f < B.F + 6) pos.x -= 10 * (1 - burst(f, B.F, 6));
    placeCam(U.cam, { pos, look, fov: 42, roll: lerp(-0.06, 0.03, k2) });
    return [U.scene, U.cam];
  } },
  { id: 'G', a: B.G, b: B.H, run(f) {
    const sag = 2 * Math.max(0, Math.sin((f - B.G) * 0.25)) * sstep(KEY.why, KEY.why + 10, f);
    T.update(f, { light: 'under', slab: true, slabDrop: sag, me: { pose: { expr: f < KEY.why ? 'nervous' : 'shock', blink: blinkOf(f), headTilt: 6 } } });
    const pz = burst(f, KEY.why, 10);
    const pos = vlerp(V3(-2.2, 0.7, 11.2), V3(-3.6, 0.9, 8.9), pz).add(V3(0, 0, -(f - B.G) * 0.012)), look = vlerp(V3(-5.2, 1.6, 6), V3(-5.2, 1.75, 6), pz);
    placeCam(T.cam, { pos, look, fov: 40, roll: 0.075 });
    return [T.scene, T.cam];
  } },
  { id: 'H', a: B.H, b: B.I, run(f) {
    const drop = KEY.twoHundred;
    const inW = f >= drop - 8;
    const wy = inW ? lerp(14, 0, easeIn(f, drop - 8, 8)) : undefined;
    const tilt = f < drop ? 0.05 * Math.sin(f * 0.15) : lerp(0, 1, burst(f, drop, 7));
    const hop = f < drop ? 0 : 9 * Math.sin(clamp((f - drop) / 26) * Math.PI) * (f - drop < 26 ? 1 : 0) + (f - drop >= 26 ? 0 : 0);
    S.update(f, { tilt, water: wy, airHop: hop, airSpin: f > drop ? (f - drop) * 0.25 * clamp(1 - (f - drop) / 26) : 0 });
    const t = (f - B.H) / (B.I - B.H);
    const sh = kick(f, drop, 0.35);
    const pos = V3(0 + sh, 7.6 + sh, 39 - t * 3), look = V3(0, 5.2, 0);
    placeCam(S.cam, { pos, look, fov: 38, roll: -0.05 });
    return [S.scene, S.cam];
  } },
  { id: 'I', a: B.I, b: B.J, run(f) {
    const land = sstep(B.I + 2, KEY.bathtub + 6, f);
    const sag = 0.3 * land + 1.1 * sstep(KEY.bathtub + 6, B.J - 3, f);
    const torn = f >= B.J - 3 ? clamp((f - (B.J - 3)) / 6) : 0;
    const tubY = torn > 0 ? 5 - sag - 6 * easeIn(f, B.J - 3, 6) : lerp(10, 5.05, land) - sag * (land >= 1 ? 1 : land);
    S.update(f, { sag, torn, tubY, tubRot: torn * 0.2 });
    const t = (f - B.I) / (B.J - B.I);
    placeCam(S.cam, { pos: V3(61, 7.0, 25 - t * 2.5), look: V3(60, 5.6, 0), fov: 40, roll: 0.06 });
    return [S.scene, S.cam];
  } },
  { id: 'J', a: B.J, b: B.J2, run(f) {
    const t = Math.max(0, f - KEY.falls);
    T.update(f, { light: 'under', slab: true, slabDrop: t * t * 0.05, drops: clamp(t / 34), me: { pose: { expr: 'shock', blink: false } } });
    const pos = V3(-2.2, 1.2, 12.5), look = V3(-5, 40, -10);
    const sh = kick(f, KEY.falls, 0.15);
    pos.x += sh; look.x += sh * 4;
    placeCam(T.cam, { pos, look, fov: 52, roll: -0.06 });
    return [T.scene, T.cam];
  } },
  { id: 'J2', a: B.J2, b: B.K, run(f) {
    // falling alongside fish, a whale and a ship: the camera descends with them
    const camY = 85 - (f - B.J2) * 0.35;
    T.update(f, { light: 'under', slab: false, fallers: true, fallY: 0 });
    T.fallers.position.set(0, camY - 12, 0);
    const wIn = burst(f, KEY.whales - 3, 14), sIn = burst(f, KEY.ships - 3, 14);
    T.fallWhale.position.set(lerp(-30, -3, wIn), lerp(30, 3, wIn), -18); T.fallWhale.quaternion.copy(T.cam.quaternion); T.fallWhale.rotateZ(0.5 - wIn * 0.3 + Math.sin(f * 0.07) * 0.1);
    T.ship.position.set(lerp(30, 4, sIn), lerp(40, -4, sIn), -24); T.ship.rotation.set(0.6 + f * 0.01, -0.8, 0.9 + f * 0.012);
    T.ship.visible = f >= KEY.ships - 3; T.fallWhale.visible = f >= KEY.whales - 3;
    const fishIn = burst(f, KEY.fish - 4, 10);
    T.fallers.children.forEach((c, i) => { if (c !== T.ship && c !== T.fallWhale) c.visible = i % 18 < 6 + 12 * fishIn; });
    placeCam(T.cam, { pos: V3(0, camY, 8), look: V3(0, camY - 6, -10), fov: 50, roll: Math.sin(f * 0.05) * 0.06 });
    return [T.scene, T.cam];
  } },
  { id: 'K', a: B.K, b: B.L, run(f) {
    const hit = KEY.hits; const before = f < hit;
    G.update(f, {
      level: before ? 1 : 0, cloud: before ? 0 : sstep(hit + 10, hit + 40, f) * 0.6, dark: before ? 0.7 : 0.7 * (1 - sstep(hit, hit + 8, f)),
      shellR: before ? lerp(1.10, 1.0, easeIn(f, B.K, hit - B.K)) : 0, shellA: 0.92,
      foam: before ? 0 : 0.8 * (1 - sstep(hit + 2, hit + 24, f)), flood: 0,
      front: before ? 0 : 0.01 + 0.42 * burst(f, hit + 2, B.L - hit + 16),
      ring: before ? 0 : clamp((f - hit) / 20), rotY: -Math.PI / 2 + 0.62 + (f - B.K) * 0.0016,
    });
    // world scale: push in on the Americas, Europe and Africa as the walls of water race inland
    const sh = kick(f, hit, 0.10);
    G.setCam(lerp(7.8, 5.8, sstep(B.K, B.L, f)), { x: sh, y: lerp(0.5, 0.75, sstep(B.K, B.L, f)) + sh, lookY: lerp(0, 0.18, sstep(B.K, B.L, f)), roll: 0.06 });
    return [G.scene, G.cam];
  } },
  { id: 'L', a: B.L, b: B.L2, run(f) {
    const t = (f - B.L) / (B.L2 - B.L);
    C.update(f, { w1: lerp(-900, -400, t) });
    const pos = V3(-640 + t * 60, 90, 980 - t * 40), look = V3(0, 270, -60);
    placeCam(C.cam, { pos, look, fov: 34, roll: -0.06 });
    return [C.scene, C.cam];
  } },
  { id: 'L2', a: B.L2, b: B.M, run(f) {
    // one big city under a wave kilometres tall
    const t = (f - B.L2) / (B.M - B.L2);
    const rise = burst(f, B.L2, 14);
    C.update(f, { w2: lerp(-3700, -3100, t), downtown: true });
    C.megaWave.position.x = C.DT.x; C.megaWave.scale.set(1, lerp(0.35, 1, rise), 1);
    const sh = kick(f, KEY.km + 2, 5) + Math.sin(f * 1.7) * 1.2 * t;
    const pos = V3(C.DT.x - 260 + t * 30, 45 + sh, 1050 - t * 60);
    const look = V3(C.DT.x, lerp(420, 1350, rise), lerp(-300, -1300, rise));
    placeCam(C.cam, { pos, look, fov: lerp(55, 72, rise), roll: lerp(0.03, 0.07, t) });
    return [C.scene, C.cam];
  } },
  { id: 'M', a: B.M, b: B.M2, run(f) {
    G.update(f, { level: 0, cloud: 0.5, steam: sstep(B.M, B.M + 10, f), warm: sstep(KEY.heat - 6, KEY.heat + 10, f), rotY: -Math.PI / 2 + 1.4 + f * 0.0016 });
    G.setCam(lerp(8.4, 7.6, (f - B.M) / (B.M2 - B.M)), { y: 0.5, roll: -0.05 });
    return [G.scene, G.cam];
  } },
  { id: 'M2', a: B.M2, b: B.N, run(f) {
    C.update(f, { hot: true, warm: 1, thermo: sstep(B.M2 + 4, KEY.warmer + 4, f) });
    const t = (f - B.M2) / (B.N - B.M2);
    placeCam(C.cam, { pos: V3(0.5, 1.5, -27.5 - t * 1.5), look: V3(0.5, 0.9, -40), fov: 40, roll: 0.05 });
    return [C.scene, C.cam];
  } },
  { id: 'N', a: B.N, b: B.N2, run(f) {
    const t = (f - B.N) / (B.N2 - B.N);
    T.update(f, { light: 'day', slab: false, flood: true, floodY: lerp(3.2, 1.6, sstep(B.N, KEY.drains + 20, f)) });
    placeCam(T.cam, { pos: V3(46 - t * 4, 34, 70 - t * 6), look: V3(-8, 0, -20), fov: 42, roll: -0.04 });
    return [T.scene, T.cam];
  } },
  { id: 'N2', a: B.N2, b: B.Z, run(f) {
    const d = sstep(B.N2 + 4, B.Z + 30, f) * 0.6 + Math.max(0, f - KEY.yourHouse) * 0.004;
    const fy = 1.6;
    T.update(f, { light: 'day', slab: false, flood: true, floodY: fy, houseDrift: d,
      me: { pose: { expr: f < KEY.yourHouse ? 'nervous' : 'shock', blink: blinkOf(f), wave: Math.sin(f * 0.5) }, x: 0, y: 0, z: 0 } });
    const hp = T.hero.position;
    T.me.mesh.position.set(hp.x + 0.5, hp.y + 10.3, hp.z + 0.6);
    const pz = burst(f, KEY.yourHouse - 6, 14);
    const pos = V3(hp.x + lerp(9, 5, pz), hp.y + lerp(27, 19, pz), hp.z + lerp(13, 7.5, pz)), look = V3(hp.x + 0.5, hp.y + lerp(7, 10, pz), hp.z + 0.6);
    placeCam(T.cam, { pos, look, fov: 40, roll: lerp(0.07, 0.04, pz) });
    return [T.scene, T.cam];
  } },
];
const shotAt = (f) => (f < 0 ? SHOTS[0] : SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1]);

// transitions: dissolve between environments; flashes on impacts
const DISSOLVE = new Set(['B', 'E', 'F', 'G', 'H', 'J', 'K', 'L2', 'N']);
const DISS_LEN = 6;
const FLASHES = [[KEY.teleport, 0xcfe8ff], [KEY.hits, 0xffffff], [KEY.twoHundred, 0xffffff]];
// motion blur windows (subframes) around fast moves
const MB = [[KEY.teleport, 6], [B.B - 8, 14], [KEY.floating, 8], [KEY.thick, 12], [B.D - 6, 10], [KEY.pacific - 6, 8], [KEY.sub, 8], [KEY.twoHundred - 8, 14],
  [B.J - 3, 8], [KEY.whales - 3, 8], [KEY.ships - 3, 8], [KEY.hits - 8, 14], [B.L2, 10], [KEY.yourHouse - 6, 8]];
const mbAt = (f) => MB.some(([a, d]) => a > 12 && f >= a && f < a + d);

// custom shaders were authored in display (sRGB) values; the shot buffers are linear
for (const sc of [G.scene, T.scene, U.scene, S.scene, C.scene]) sc.traverse((o) => {
  const m = o.material; if (!m || !m.isShaderMaterial || m.userData.lin) return;
  m.fragmentShader = m.fragmentShader.replace(/\}\s*$/, ' gl_FragColor.rgb=pow(max(gl_FragColor.rgb,0.),vec3(2.2));\n}'); m.userData.lin = true; m.needsUpdate = true;
});

// ---------- compositor ----------
const rtOpts = { type: THREE.HalfFloatType, samples: 4, colorSpace: THREE.LinearSRGBColorSpace };
const rtShot = new THREE.WebGLRenderTarget(W, H, rtOpts);
const rtAcc = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const rtB = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = (mat) => { const s = new THREE.Scene(); const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; s.add(m); return s; };
const accMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, w: { value: 1 } }, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D t; uniform float w; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb*w,1.); }` });
const accScene = quad(accMat);
const finalMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: null }, tB: { value: null }, mixB: { value: 0 }, flash: { value: 0 }, flashC: { value: new THREE.Color(1, 1, 1) } },
  depthTest: false, depthWrite: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D tA,tB; uniform float mixB,flash; uniform vec3 flashC; varying vec2 vUv;
  vec3 toSRGB(vec3 c){ c=max(c,0.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
  void main(){
    vec3 c=mix(texture2D(tA,vUv).rgb,texture2D(tB,vUv).rgb,mixB);
    c=toSRGB(c);
    float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,1.08); c=(c-.5)*1.04+.5;
    vec2 q=vUv-.5; q.x*=.5625; c*=1.-smoothstep(.35,.85,length(q))*.22;
    c=mix(c,flashC,flash);
    gl_FragColor=vec4(clamp(c,0.,1.),1.);
  }` });
const finalScene = quad(finalMat);

function renderShotTo(rt, f) {
  const s = shotAt(Math.floor(f));
  const [scene, cam] = s.run(f); orientBillboards(scene, cam);
  renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
}
function renderAccum(rtOut, f) {
  const n = mbAt(Math.floor(f)) ? 5 : 1;
  if (n === 1) { renderShotTo(rtOut, f); return; }
  renderer.setRenderTarget(rtOut); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let i = 0; i < n; i++) {
    renderShotTo(rtShot, f + i / n - 0.4);
    accMat.uniforms.t.value = rtShot.texture; accMat.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(rtOut); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
  }
}
window.renderFrame = (f) => {
  renderAccum(rtAcc, f);
  let mixB = 0;
  const s = shotAt(f);
  // dissolve: first frames of a shot blend from the previous shot's continuation
  if (DISSOLVE.has(s.id) && f - s.a < DISS_LEN && f > 0) {
    const prev = SHOTS.slice(0, SHOTS.indexOf(s)).reverse().find((x) => x.b > x.a);
    const [scene, cam] = prev.run(f); orientBillboards(scene, cam);
    renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(scene, cam);
    s.run(f); // restore this shot's state for subsequent calls
    mixB = 1 - sstep(0, DISS_LEN, f - s.a + 1);
  }
  let flash = 0, fc = 0xffffff;
  for (const [at, col] of FLASHES) { const d = Math.floor(f) - Math.ceil(at); if (d >= 0 && d < 4) { flash = [0.9, 0.6, 0.3, 0.1][d]; fc = col; } }
  finalMat.uniforms.tA.value = rtAcc.texture; finalMat.uniforms.tB.value = rtB.texture; finalMat.uniforms.mixB.value = mixB;
  finalMat.uniforms.flash.value = flash; finalMat.uniforms.flashC.value.set(fc);
  renderer.setRenderTarget(null); renderer.render(finalScene, quadCam);
};
window.TOTAL = END;
window.SHOTS = SHOTS.map((s) => ({ id: s.id, a: Math.round(s.a), b: Math.round(s.b) }));
const wait = () => new Promise((r) => { const chk = () => (G.ready() ? r() : setTimeout(chk, 50)); chk(); });
wait().then(() => { window.READY = true; });
