
// =====================================================================
// "Gravity just turned off" v2 — cold-open hook, pause + rewind, animated cast, facts on screen
// =====================================================================
import TIM from './timings.js';
import { Actor, OUTFITS, walk, flail, standPose, blinkAt } from './rig.js';
const FPS = 30;
const cam = new THREE.PerspectiveCamera(30, W / H, 0.3, 3000);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (f, f0, d) => 1 - Math.pow(1 - clamp((f - f0) / d), 3);
const kick = (f, at, amp) => { const d = f - at; if (d < 0 || d > 8) return 0; return amp * (Math.floor(d) % 2 ? -1 : 1) * (1 - d / 8); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LN = Object.fromEntries(TIM.lines.map((l) => [l.id, l]));
const ls = (id) => LN[id].start * FPS;
const wf = (id, i) => LN[id].words[i].s * FPS;
const END = Math.ceil(TIM.duration * FPS) + 20;
const GY = 0.6; // promenade surface

// ---------- keys (all reactions land on their words) ----------
const K = {
  pass: wf('h1', 7) - 4, freeze: ls('h2') - 2, rew: ls('h3') - 2, R: ls('r1') - 3, grav: wf('r1', 5) - 2, jump: wf('r2', 7) - 2,
  F1: ls('f1') - 3, F2: wf('f2', 13) - 3, cm: wf('f2', 18) - 2, A1: ls('a1') - 3, rise: wf('a2', 8) - 2, A2: ls('a3') - 3, kmh: wf('a3', 4) - 2,
  hats: ls('a4') - 2, coffee: wf('a4', 1) - 2, jayc: wf('a4', 2) - 2, G: ls('g1') - 3, back: wf('g1', 2) - 2, down: wf('g1', 10) - 2,
  E1: ls('e1') - 3, splash: wf('e1', 3) - 2, E2: ls('e2') - 3,
};
window.K = K;

// ---------- cast ----------
const curly = new Actor(scene, OUTFITS.curly, 2.0);
const jay = new Actor(scene, OUTFITS.jay, 1.95);
const PEDS = [['p1', -6, 2.4], ['p2', -10, 4.0], ['mia', -14, 2.7], ['p3', 9, 4.1], ['p2', 13, 2.5]].map(([o, x, z], i) => {
  const a = new Actor(scene, OUTFITS[o], 1.85 + hash(i) * 0.2); a.home = { x, z, i };
  const hat = new THREE.Group();
  const crown = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.2, 18), mat([0xff6b4a, 0x2ec4b6, 0xffc93c, 0x7b5cff, 0xff8fab][i]))); crown.position.y = 0.1; hat.add(crown);
  const brim = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 20), mat(0x3d4b6b))); hat.add(brim);
  scene.add(hat); a.hat = hat; return a;
});
// coffee cup + coffee blob
const cup = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.17, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.07, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xff6b4a })); band.position.y = -0.01;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.01, 24), new THREE.MeshStandardMaterial({ color: 0x6b3e26, roughness: 0.3 })); top.position.y = 0.07; cup.userData.top = top;
  cup.add(body, band, top); scene.add(cup);
}
const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x7a4326, roughness: 0.2 });
const blob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), coffeeMat); scene.add(blob);
const cdrops = Array.from({ length: 10 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.014 + hash(i) * 0.012, 10, 8), coffeeMat); scene.add(d); return d; });

// ---------- effects: leaves, wind streaks, speed lines, splash ----------
const leafMats = [0x5fd08a, 0x9be07a, 0xffc93c, 0xff8a4a].map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide }));
const leaves = Array.from({ length: 60 }, (_, i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.08, 6), leafMats[i % 4]); l.scale.y = 0.55; l.u = { x: -12 + hash(i) * 26, z: 1.2 + hash(i + 7) * 4.5, s: 0.5 + hash(i + 3), o: hash(i + 11) }; scene.add(l); return l; });
const streakTex = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(4, 0, 8, 256); return new THREE.CanvasTexture(c); })();
const streaks = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.6), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); m.u = { x: -10 + hash(i * 3) * 22, z: 0.5 + hash(i * 5) * 7, o: hash(i * 7), s: 0.6 + hash(i) * 0.8 }; scene.add(m); return m; });
const speed = Array.from({ length: 14 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.2), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, toneMapped: false })); scene.add(m); return m; });
const splashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
const splash = Array.from({ length: 40 }, (_, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.12 + hash(i) * 0.18, 10, 8), splashMat); d.u = { a: hash(i) * 6.28, v: 3 + hash(i + 2) * 5, h: 4 + hash(i + 4) * 7 }; scene.add(d); return d; });
const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
const dust = Array.from({ length: 24 }, (_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + hash(i) * 0.1, 1), new THREE.MeshStandardMaterial({ color: 0xf1e7dc, transparent: true })); scene.add(d); return d; });

// ---------- globe (bright storybook space) ----------
const gScene = new THREE.Scene();
{ const bgm = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 u; void main(){ u=uv; gl_Position=vec4(position.xy,.999,1.); }',
    fragmentShader: `varying vec2 u; float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 c=mix(vec3(.10,.22,.70),vec3(.30,.55,1.0),u.y); vec2 g=u*vec2(40.,70.); vec2 id=floor(g); vec2 f=fract(g)-.5;
        c+=vec3(1.)*step(.9,h(id))*smoothstep(.12,.0,length(f))*.9; gl_FragColor=vec4(c,1.); }` })); bgm.frustumCulled = false; gScene.add(bgm); }
const earthTex = new THREE.TextureLoader().load('./earthmap.png'); earthTex.colorSpace = THREE.NoColorSpace;
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 80), new THREE.ShaderMaterial({ uniforms: { m: { value: earthTex }, s: { value: V(-0.5, 0.5, 0.7).normalize() } },
  vertexShader: 'varying vec2 u; varying vec3 n; void main(){ u=uv; n=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D m; uniform vec3 s; varying vec2 u; varying vec3 n;
    void main(){ vec4 t=texture2D(m,u); float lat=abs(u.y-.5)*2.;
      vec3 land=mix(vec3(.45,.85,.42),vec3(.95,.82,.50),smoothstep(.2,.3,lat)*(1.-smoothstep(.38,.45,lat))*t.b); land=mix(land,vec3(1.),smoothstep(.75,.8,lat));
      vec3 sea=mix(vec3(.30,.78,1.),vec3(.12,.50,.95),smoothstep(.0,.3,t.g)); vec3 c=t.r>.5?land:sea;
      c*=mix(.62,1.08,smoothstep(-.1,.2,dot(normalize(n),s))); c=mix(c,vec3(.15,.12,.2),smoothstep(.15,.45,fwidth(t.r)*2.2)*.8); gl_FragColor=vec4(c,1.); }` }));
earth.material.extensions = { derivatives: true }; gScene.add(earth);
gScene.add(new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 48), new THREE.MeshBasicMaterial({ color: 0x26202e, side: THREE.BackSide })));
const arrow = new THREE.Group();
{ const pts = new THREE.EllipseCurve(0, 0, 1.22, 1.22, Math.PI * 0.2, Math.PI * 0.8, false, 0).getPoints(40).map((p) => V(p.x, p.y, 0));
  arrow.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.04, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 })));
  const hd = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 16), new THREE.MeshBasicMaterial({ color: 0xffd166 })); hd.position.copy(pts[pts.length - 1]); hd.rotation.z = Math.PI * 0.8 + Math.PI; arrow.add(hd); gScene.add(arrow); }
const gCam = new THREE.PerspectiveCamera(26, W / H, 0.1, 100);

// ---------- post: depth of field (miniature look) + HUD ----------
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); rt.depthTexture = new THREE.DepthTexture(W, H); rt.texture.colorSpace = THREE.SRGBColorSpace;
const rtD = new THREE.WebGLRenderTarget(W, H); rtD.depthTexture = new THREE.DepthTexture(W, H);
const dofMat = new THREE.ShaderMaterial({ uniforms: { tC: { value: null }, tD: { value: null }, near: { value: 0.3 }, far: { value: 3000 }, focus: { value: 5 }, amt: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, sat: { value: 0 }, vhs: { value: 0 }, t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: `uniform sampler2D tC,tD; uniform float near,far,focus,amt,sat,vhs,t; uniform vec2 res; varying vec2 vUv;
    float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
    float coc(vec2 uv){ float z=lin(texture2D(tD,uv).r); return clamp(abs(z-focus)/max(z,.01)*amt,0.,1.); }
    void main(){
      float c=coc(vUv); vec3 acc=texture2D(tC,vUv).rgb; float wsum=1.;
      if(c>.02){ for(int i=0;i<24;i++){ float fi=float(i); float r=sqrt(fi/24.)*c*14.; float a=fi*2.39996;
        vec2 o=vec2(cos(a),sin(a))*r/res; float cs=coc(vUv+o); float w=cs>c*.5?1.:cs*2.; acc+=texture2D(tC,vUv+o).rgb*w; wsum+=w; } }
      vec3 col=acc/wsum;
      float l=dot(col,vec3(.299,.587,.114)); col=mix(col,vec3(l),sat);
      if(vhs>0.){ float line=step(.5,fract(vUv.y*240.+t*3.)); col*=1.-.18*vhs*line; col.r=mix(col.r,texture2D(tC,vUv+vec2(.004*vhs,0.)).r,.8*vhs); col+=vec3(.06,.0,.1)*vhs; }
      gl_FragColor=vec4(col,1.); }` });
const quadScene = new THREE.Scene(); const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
{ const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dofMat); q.frustumCulled = false; quadScene.add(q); }
const hudC = document.createElement('canvas'); hudC.width = W; hudC.height = H; const hg = hudC.getContext('2d');
const hudTex = new THREE.CanvasTexture(hudC); hudTex.colorSpace = THREE.SRGBColorSpace;
const hudScene = new THREE.Scene(); { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, toneMapped: false, depthTest: false })); q.frustumCulled = false; hudScene.add(q); }
const FONT = '"Inter", "Inter ExtraBold", sans-serif';
function label(text, x, y, s = 1, col = '#ffd166', a = 1) {
  hg.save(); hg.globalAlpha = a; hg.translate(x, y); hg.scale(s, s);
  hg.font = `900 72px ${FONT}`; const w = hg.measureText(text).width + 60;
  hg.fillStyle = '#26202e'; hg.beginPath(); hg.roundRect(-w / 2 + 8, -52 + 10, w, 104, 30); hg.fill();
  hg.fillStyle = '#ffffff'; hg.strokeStyle = '#26202e'; hg.lineWidth = 10; hg.beginPath(); hg.roundRect(-w / 2, -52, w, 104, 30); hg.fill(); hg.stroke();
  hg.fillStyle = col === '#ffd166' ? '#ff6b4a' : col; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(text, 0, 4); hg.restore();
}
function pauseIcon(s, a) { hg.save(); hg.globalAlpha = a; hg.translate(W / 2, H * 0.36); hg.scale(s, s);
  hg.fillStyle = 'rgba(38,32,46,.55)'; hg.beginPath(); hg.arc(0, 0, 150, 0, 7); hg.fill(); hg.fillStyle = '#ffffff'; hg.strokeStyle = '#26202e'; hg.lineWidth = 10;
  for (const x of [-48, 48]) { hg.beginPath(); hg.roundRect(x - 26, -78, 52, 156, 14); hg.fill(); hg.stroke(); } hg.restore(); }
function rewindIcon(a) { hg.save(); hg.globalAlpha = a; hg.translate(W / 2, H * 0.36); hg.fillStyle = '#ffffff'; hg.strokeStyle = '#26202e'; hg.lineWidth = 10;
  for (const x of [-70, 40]) { hg.beginPath(); hg.moveTo(x + 70, -80); hg.lineTo(x - 40, 0); hg.lineTo(x + 70, 80); hg.closePath(); hg.fill(); hg.stroke(); }
  hg.font = `900 64px ${FONT}`; hg.textAlign = 'center'; hg.lineWidth = 12; hg.strokeText('5 SECONDS AGO', 0, 190); hg.fillText('5 SECONDS AGO', 0, 190); hg.restore(); }

// ---------- helpers ----------
function look(pos, tgt, fov = 32, roll = 0) { cam.fov = fov; cam.aspect = W / H; cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); if (roll) cam.rotateZ(roll); cam.updateProjectionMatrix(); }
const grav = (f) => f < K.grav || f >= K.down; // story gravity (after the rewind)
const windAmt = (f) => (f >= K.grav && f < K.down ? sstep(K.rise - 40, K.rise + 50, f) : 0);
function jayY(f) { if (f < K.jump) return 0; if (f < K.down) { const t = (f - K.jump) / FPS; return 3 * t + windAmt(f) * 1.5 * t * t; } const tTop = (K.down - K.jump) / FPS; const top = 3 * tTop + 1.5 * tTop * tTop; return top; }

// ---------- per-frame world state ----------
function world(f, mode) {
  // mode: 'story' (after rewind) or 'hook' (the cold open, mid-event)
  const wind = mode === 'hook' ? 1 : windAmt(f);
  const floating = mode === 'hook' ? 1 : (f >= K.grav && f < K.down ? 1 : 0);
  leaves.forEach((l, i) => { const u = l.u; const age = mode === 'hook' ? 3 + u.o * 2 : Math.max(0, (f - K.grav) / FPS);
    const up = floating ? (0.2 + u.s * 0.4) * age + wind * (age * age * 1.2) : 0; const fall = f >= K.down && mode === 'story';
    l.visible = !fall || (f - K.down) < 30; const yy = fall ? Math.max(GY + 0.05, GY + 0.05 + up * (1 - (f - K.down) / 18)) : GY + 0.05 + up;
    l.position.set(u.x + Math.sin(f * 0.04 + i) * 0.4 * floating, Math.min(yy, 30), u.z); l.rotation.set(f * 0.05 * u.s, f * 0.04, i); });
  streaks.forEach((m, i) => { const u = m.u; const ph = (f * 0.06 * u.s + u.o) % 1; m.position.set(u.x, GY + 0.5 + ph * 9, u.z); m.material.opacity = wind * Math.sin(ph * Math.PI) * 0.65; m.lookAt(cam.position.x, m.position.y, cam.position.z); });
  CARS.forEach((c, i) => { const b = c.userData.base; let y = 0.3; if (floating && mode === 'story') y += windAmt(f) * (0.3 + hash(i) * 0.5); if (mode === 'hook') y += 0.5 + hash(i) * 0.6;
    if (mode === 'story' && f >= K.down) { const d = f - K.down; y = 0.3 + Math.max(0, Math.sin(Math.min(d, 9) / 9 * Math.PI)) * 0.12 * Math.exp(-d / 10); }
    c.position.set(b.x, y, b.z); c.rotation.set(floating ? (hash(i + 2) - 0.5) * 0.2 * (y - 0.3) : 0, b.rot, floating ? (hash(i + 5) - 0.5) * 0.25 * (y - 0.3) : 0); });
  PEDS.forEach((p, i) => { const h = p.home; let y = GY, pose;
    const lift = mode === 'hook' ? 1.2 + hash(i) * 1.5 : windAmt(f) * (0.6 + hash(i) * 1.8) * clamp((f - K.rise) / 60 + 0.3);
    if (mode === 'story' && f >= K.down) { const d = f - K.down; const h0 = windAmt(K.down - 1) * (0.6 + hash(i) * 1.8); y = Math.max(GY, GY + h0 - 0.5 * 9.8 * (d / FPS) ** 2 * 3); pose = d < 14 && y <= GY + 0.01 ? { ...standPose(f), mood: 'worried', bob: 18 * Math.exp(-d / 5) } : { ...flail(f + i * 7), mood: 'scream' }; }
    else if (lift > 0.05) { y = GY + lift; pose = { ...flail(f + i * 7), mood: 'scream', sweat: true }; }
    else pose = { ...walk(f + i * 9, 0.8), mood: 'happy', blink: blinkAt(f, i) };
    p.pose(pose); p.place(h.x + (lift > 0.05 ? 0 : ((f * 0.025 + i) % 6) - 3), y, h.z, GY); p.face(cam);
    const head = p.local(300, 140); const hatUp = (mode === 'hook' ? 4 + hash(i) * 3 : (f >= K.hats - 30 && f < K.down ? easeOut(f, K.hats - 30, 40) * 6 : 0));
    p.hat.position.set(head.x, head.y + hatUp, head.z); p.hat.rotation.set(hatUp * 0.4, f * 0.05 * (hatUp > 0 ? 1 : 0), hatUp * 0.3); });
}
function placeCup(f, mode) {
  const hd = curly.hands?.handL || [176, 735]; const hp = curly.local(hd[0], hd[1]);
  cup.position.set(hp.x, hp.y + 0.04, hp.z); const empty = mode === 'story' && f >= K.coffee - 6;
  cup.userData.top.visible = !empty && !(mode === 'hook');
  const out = mode === 'story' && f >= K.coffee - 6 && f < K.down ? easeOut(f, K.coffee - 6, 26) : 0;
  blob.visible = out > 0 || mode === 'hook';
  const by = mode === 'hook' ? 0.5 : out * 2.2;
  blob.position.set(hp.x + Math.sin(f * 0.07) * 0.03, hp.y + 0.15 + by, hp.z); const w = 1 + 0.15 * Math.sin(f * 0.25); blob.scale.set(w * 1.1, 1 / w, w);
  cdrops.forEach((d, i) => { d.visible = blob.visible; d.position.set(blob.position.x + Math.cos(i * 0.7 + f * 0.05) * 0.16, blob.position.y + Math.sin(i * 1.3 + f * 0.06) * 0.12 - i * 0.03, blob.position.z + Math.sin(i) * 0.05); });
}

// ---------- shots ----------
const B = { H1: 0, P: K.freeze, R: K.R, F1: K.F1, F2: K.F2, A1: K.A1, A2: K.A2, Ha: K.hats, Hb: K.coffee, Hc: K.jayc, G: K.G, E1: K.E1, E2: K.E2, Z: END };
const DOF = { amt: 0, focus: 5, sat: 0, vhs: 0 };
function curlyWalkShot(f, mode, x0 = -3, speed = 0.022, stain = false, mood = 'happy') {
  const x = x0 + (f - (mode === 'hook' ? 0 : B.E2)) * speed;
  curly.pose({ ...walk(f, 1), mood, blink: blinkAt(f), stain, armL: [20, 70], mouth: 0 });
  curly.place(x, GY, 3.0, GY);
  look(V(x + 5.2, 1.5, 3.35), V(x - 1, 1.45, 3.0), 30, 0.03); curly.face(cam);
  DOF.amt = 0.9; DOF.focus = 5.2;
  return x;
}
const SHOTS = [
  { id: 'H1', a: B.H1, b: B.P, run(f) { // cold open: Curly walks to work, Jay flies past him screaming
    const x = curlyWalkShot(f, 'hook', -3, 0.02, false, f > K.pass ? 'shock' : 'happy');
    world(f, 'hook');
    const t = clamp((f - (K.pass - 40)) / 70); // Jay's pass
    jay.pose({ ...flail(f * 1.3), mood: 'scream', sweat: true }); jay.place(lerp(x - 6, x + 6.5, t), lerp(GY + 0.2, GY + 7, t * t), lerp(4.8, 2.6, t), GY); jay.face(cam, lerp(-0.4, 0.5, t));
    speed.forEach((m, i) => { m.visible = t > 0 && t < 1; m.position.copy(jay.mesh.position).add(V(-0.9 - hash(i) * 1.5, 0.3 + hash(i + 3) * 1.6, (hash(i + 5) - 0.5))); m.lookAt(cam.position); m.rotateZ(-1.1); m.material.opacity = 0.8; });
    if (f > K.pass) curly.pose({ ...walk(f, 0.4), mood: 'shock', look: 1, headTilt: -8, armL: [20, 70], blink: false });
    return 'city'; } },
  { id: 'P', a: B.P, b: B.R, run(f) { // freeze + pause, then rewind
    const rew = f >= K.rew; const src = rew ? Math.max(0, K.freeze - (f - K.rew) * 6) : K.freeze - 1;
    SHOTS[0].run(src); DOF.sat = rew ? 0.2 : 0.35; DOF.vhs = rew ? 1 : 0;
    if (!rew) pauseIcon(lerp(1.3, 1, easeOut(f, K.freeze, 6)), 1); else rewindIcon(1);
    return 'city'; } },
  { id: 'R', a: B.R, b: B.F1, run(f) { // 5 seconds earlier: walking together; gravity goes; Jay jumps
    const x = -1 + (f - B.R) * 0.018; world(f, 'story');
    const off = f >= K.grav;
    curly.pose({ ...walk(f, off ? 0.5 : 1), mood: off ? 'worried' : 'happy', blink: blinkAt(f), armL: [20, 70], mouth: 0 }); curly.place(x, GY + (off ? 0.04 : 0), 3.0, GY);
    const jy = jayY(f); const jx = x + 1.2;
    const jp = f < K.jump - 10 ? { ...walk(f + 13, 1.2), mood: 'happy', armR: [60 + Math.sin(f * 0.3) * 30, 20] } : f < K.jump ? { ...standPose(f), mood: 'happy', legL: [-8, 40, 0.5], legR: [8, 40, 0.5], bob: 40, armL: [30, 40], armR: [30, 40] } : { ...flail(f), mood: jy > 2 ? 'scream' : 'shock', sweat: jy > 2 };
    jay.pose(jp); jay.place(jx, GY + jy, 3.6, GY);
    const sh = off && f < K.grav + 10 ? kick(f, K.grav, 0.06) : 0;
    const up = sstep(K.jump, K.jump + 40, f);
    look(V(x + 5.4 + sh, 1.6 + up * 1.2 + sh, 3.5), V(x - 0.4, 1.5 + up * Math.min(jy, 4) * 0.6, 3.2), 32, 0.03); curly.face(cam); jay.face(cam);
    DOF.amt = 0.9; DOF.focus = 5.4; return 'city'; } },
  { id: 'F1', a: B.F1, b: B.F2, run(f) { // the spinning Earth: 1,670 km/h
    const t = (f - B.F1) / (B.F2 - B.F1); earth.rotation.y = -1.2 + f * 0.02; arrow.rotation.z = Math.PI;
    gCam.position.set(lerp(-0.3, 0.3, t), 0.5, lerp(7.6, 6.4, t)); gCam.lookAt(0, 0.35, 0); gCam.updateProjectionMatrix();
    if (f > wf('f2', 3) - 4) label('1,670 km/h', W / 2, H * 0.2, easeOut(f, wf('f2', 3) - 4, 8) * 1.1);
    return 'globe'; } },
  { id: 'F2', a: B.F2, b: B.A1, run(f) { // ...but in 5 s you only rise 40 cm: Curly floats up a little, sips coffee
    world(f, 'story'); const t = (f - B.F2) / (B.A1 - B.F2); const rise = easeOut(f, B.F2, 50) * 0.4;
    curly.pose({ ...standPose(f), mood: 'smug', armL: [20, 70], legL: [-6, 10], legR: [6, 10], blink: blinkAt(f) }); curly.place(-0.5, GY + rise, 3.0, GY);
    jay.place(30, 0, 0); look(V(1.9, 1.0 + t * 0.1, 4.2), V(-0.5, 1.15, 3.0), 34, -0.04); curly.face(cam);
    if (f > K.cm - 8) label('40 cm', W * 0.7, H * 0.62, easeOut(f, K.cm - 8, 8));
    DOF.amt = 1.0; DOF.focus = 2.6; return 'city'; } },
  { id: 'A1', a: B.A1, b: B.A2, run(f) { // the air starts rising: leaves stream up, Curly's curl and hood blow upward
    world(f, 'story'); const t = (f - B.A1) / (B.A2 - B.A1); const w = windAmt(f);
    curly.pose({ ...standPose(f), mood: w > 0.3 ? 'shock' : 'worried', armL: [20, 70], armR: [20 + w * 120, 30], curl: 1.5 * w + Math.sin(f * 0.8) * 0.4 * w, look: -1, headTilt: 6 * w }); curly.place(-0.5, GY + 0.4 + w * 0.3, 3.0, GY);
    look(V(2.6 - t * 0.6, 1.5, 6.2), V(-0.5, 2.2 + w * 1.5, 2.6), 40, 0.05); curly.face(cam);
    DOF.amt = 0.8; DOF.focus = 4.2; return 'city'; } },
  { id: 'A2', a: B.A2, b: B.Ha, run(f) { // 170 km/h straight up: wide promenade, people lifting, holding on
    world(f, 'story'); const t = (f - B.A2) / (B.Ha - B.A2);
    curly.pose({ ...flail(f * 0.7), mood: 'shock', armL: [140, 20], armR: [140, 20] }); curly.place(-0.5, GY + 0.9 + Math.sin(f * 0.1) * 0.1, 4.95, GY); // clinging to the lamp
    look(V(10 - t * 1.5, 2.6, 13), V(-1, 3.2, 2.5), 40, -0.05); curly.face(cam);
    if (f > K.kmh - 8) label('170 km/h ↑', W / 2, H * 0.18, easeOut(f, K.kmh - 8, 8) * 1.1);
    DOF.amt = 0.6; DOF.focus = 13; return 'city'; } },
  { id: 'Ha', a: B.Ha, b: B.Hb, run(f) { world(f, 'story'); const p = PEDS[0]; const hp = p.hat.position; look(V(hp.x + 3, Math.max(1.6, hp.y - 1.5), hp.z + 4.5), V(hp.x, hp.y - 0.2, hp.z), 34, 0.06); DOF.amt = 0.8; DOF.focus = 5; return 'city'; } },
  { id: 'Hb', a: B.Hb, b: B.Hc, run(f) { world(f, 'story'); curly.pose({ ...standPose(f), mood: 'shock', armL: [20, 70], look: -1 }); curly.place(-0.5, GY + 0.5, 3.0, GY);
    look(V(0.6, 2.2, 4.8), V(-0.6, 2.4, 3.0), 34, -0.05); curly.face(cam); DOF.amt = 0.9; DOF.focus = 2; return 'city'; } },
  { id: 'Hc', a: B.Hc, b: B.G, run(f) { world(f, 'story'); const jy = jayY(f); jay.pose({ ...flail(f * 1.2), mood: 'scream', sweat: true }); jay.place(0.7, GY + jy, 3.6, GY);
    look(V(4, GY + jy - 3, 9), V(0.7, GY + jy + 0.9, 3.6), 40, 0.08); jay.face(cam, Math.sin(f * 0.2) * 0.3); DOF.amt = 0.6; DOF.focus = 7; return 'city'; } },
  { id: 'G', a: B.G, b: B.E1, run(f) { // gravity comes back: everything that went up comes down at once
    world(f, 'story'); const sh = kick(f, K.down, 0.16) + kick(f, K.down + 9, 0.08);
    const down = f >= K.down; const d = f - K.down;
    curly.pose(down ? { ...standPose(f), mood: d < 20 ? 'shock' : 'worried', stain: d > 3, armL: [20, 70], bob: 16 * Math.exp(-Math.max(0, d) / 5) } : { ...flail(f * 0.5), mood: 'worried', armL: [20, 70] });
    curly.place(-0.5, down ? GY : GY + 0.4, 3.0, GY);
    if (down && d < 10) { const hp = curly.local(300, 560); blob.visible = true; blob.position.set(hp.x, hp.y + 0.1 + (10 - d) * 0.25, hp.z + 0.05); } else if (down) blob.visible = false;
    dust.forEach((p, i) => { const a = hash(i) * 6.28, r = Math.max(0, d) * 0.05 * (0.5 + hash(i + 1)); p.visible = down && d < 26; p.position.set(-0.5 + Math.cos(a) * r * 3, GY + 0.1 + r * 0.6, 3.0 + Math.sin(a) * r); p.material.opacity = 1 - d / 26; });
    look(V(5.5 + sh, 2.0 + sh, 6.5), V(-0.8, 1.6, 2.6), 40, 0.04); curly.face(cam); DOF.amt = 0.7; DOF.focus = 7.5; return 'city'; } },
  { id: 'E1', a: B.E1, b: B.E2, run(f) { // Jay lands in the river
    world(f, 'story'); const d = f - K.splash; const fall = clamp(1 - (K.splash - f) / 14);
    jay.pose({ ...flail(f * 1.5), mood: 'scream' }); jay.place(2, d < 0 ? GY + 12 * (1 - fall * fall) - 1.5 : -3, 14, GY); jay.blob.visible = false;
    splash.forEach((s) => { s.visible = d >= 0 && d < 40; const tt = Math.max(0, d) / FPS; s.position.set(2 + Math.cos(s.u.a) * s.u.v * tt, 0.1 + s.u.h * tt - 9.8 * tt * tt, 14 + Math.sin(s.u.a) * s.u.v * tt * 0.6); });
    ring.visible = d >= 0; ring.position.set(2, 0.12, 14); ring.scale.setScalar(1 + Math.max(0, d) * 0.12); ring.material.opacity = Math.max(0, 1 - d / 30);
    look(V(9, 4.5 + kick(f, K.splash, 0.2), 1), V(2, 1.5, 14), 40, -0.05); jay.face(cam); DOF.amt = 0.5; DOF.focus = 15; return 'city'; } },
  { id: 'E2', a: B.E2, b: B.Z, run(f) { world(f, 'story'); curlyWalkShot(f, 'story', -2.6, 0.02, true, 'smug'); return 'city'; } },
];
const shotAt = (f) => (f < 0 ? SHOTS[0] : SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1]);

window.renderFrame = (f) => {
  hg.clearRect(0, 0, W, H); DOF.sat = 0; DOF.vhs = 0;
  for (const m of [...speed, ...splash, ...dust]) m.visible = false; ring.visible = false; blob.visible = false; cdrops.forEach((d) => (d.visible = false));
  jay.blob.visible = true; jay.place(40, 0, 0); curly.place(40, 0, 0);
  const s = shotAt(f);
  const where = s.run(f);
  if (where === 'city') { if (!['G', 'E1'].includes(s.id) || !blob.visible) placeCup(f, s.id === 'H1' || s.id === 'P' ? 'hook' : 'story'); }
  if (where === 'globe') { renderer.setRenderTarget(null); renderer.render(gScene, gCam); }
  else {
    renderer.setRenderTarget(rt); renderer.render(scene, cam);
    dofMat.uniforms.tC.value = rt.texture; dofMat.uniforms.tD.value = rt.depthTexture; dofMat.uniforms.focus.value = DOF.focus; dofMat.uniforms.amt.value = DOF.amt;
    dofMat.uniforms.sat.value = DOF.sat; dofMat.uniforms.vhs.value = DOF.vhs; dofMat.uniforms.t.value = f;
    renderer.setRenderTarget(null); renderer.render(quadScene, qcam);
  }
  hudTex.needsUpdate = true; renderer.autoClear = false; renderer.render(hudScene, qcam); renderer.autoClear = true;
};
window.TOTAL = END;
window.SHOTS = SHOTS.map((s) => ({ id: s.id, a: Math.round(s.a), b: Math.round(s.b) }));
const ready = () => (earthTex.image && earthTex.image.complete ? (window.READY = true) : setTimeout(ready, 50)); ready();
