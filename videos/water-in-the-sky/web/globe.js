// The cartoon Earth in space: toon globe, procedural clouds, ink rim, atmosphere,
// a lifted "water shell", impact foam, warm oceans and steam.
import { THREE, makeCam, steamTex, sprite, hash, clamp } from './core.js';

export const scene = new THREE.Scene();
export const cam = makeCam(26, 100);

const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  depthWrite: false, depthTest: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.); }`,
  fragmentShader: `varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  void main(){
    vec3 c=mix(vec3(.10,.06,.22),vec3(.035,.04,.12),vUv.y);
    vec2 g=vUv*vec2(54.,96.); vec2 id=floor(g); vec2 f=fract(g)-.5;
    float r=h(id); vec2 o=vec2(h(id+3.1),h(id+7.7))-.5;
    c+=vec3(1.,.95,.85)*step(.86,r)*smoothstep(.09,.0,length(f-o*.6))*(r-.86)*7.;
    gl_FragColor=vec4(c,1.);
  }`
}));
bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

const tex = new THREE.TextureLoader().load('./earthmap.png');
tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8; tex.wrapS = THREE.RepeatWrapping;
export const ready = () => !!(tex.image && tex.image.complete);

const sunDir = new THREE.Vector3(-0.55, 0.45, 0.70).normalize();
const U = {
  uMap: { value: tex }, uLevel: { value: 0 }, uSun: { value: sunDir }, uDark: { value: 0 },
  uFoam: { value: 0 }, uWarm: { value: 0 }, uFlood: { value: 0 }, uT: { value: 0 },
};
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 128), new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main(){ vUv=uv; vP=position; vN=normalize(mat3(modelMatrix)*normal);
    vec4 wp=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-wp.xyz);
    gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform sampler2D uMap; uniform float uLevel,uDark,uFoam,uWarm,uFlood,uT; uniform vec3 uSun;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
  vec3 hex(float r,float g,float b){ return vec3(r,g,b)/255.; }
  float hh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
  float vn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z); }
  void main(){
    vec4 m=texture2D(uMap,vUv);
    float land=m.r, dep=m.g, ln=m.b, ridge=m.a;
    float lat=abs(vUv.y-.5)*2.;
    vec3 green=mix(hex(96.,168.,74.),hex(62.,132.,64.),ln);
    vec3 desert=mix(hex(222.,186.,120.),hex(200.,152.,96.),ln);
    float desertBand=smoothstep(.17,.25,lat)*(1.-smoothstep(.36,.44,lat));
    vec3 la=mix(green,desert,clamp(desertBand*1.2*smoothstep(.35,.6,ln+.1),0.,1.));
    la=mix(la,hex(150.,120.,92.),smoothstep(.72,.9,ln)*.6);
    la=mix(la,hex(244.,248.,255.),smoothstep(.74,.8,lat));
    vec3 sb=mix(hex(226.,204.,150.),hex(196.,164.,118.),smoothstep(.0,.04,dep));
    sb=mix(sb,hex(150.,128.,112.),smoothstep(.04,.38,dep));
    sb=mix(sb,hex(108.,98.,112.),smoothstep(.38,.52,dep));
    sb=mix(sb,hex(58.,52.,78.),smoothstep(.58,.85,dep));
    sb=mix(sb,hex(186.,150.,120.),ridge*.55*smoothstep(.1,.3,dep));
    float k=dep*11.; float cw=fwidth(k);
    float contour=1.-smoothstep(.0,cw*1.2,abs(fract(k+.5)-.5)-cw*.15);
    sb*=1.-contour*.18*step(.03,dep);
    vec3 wa=mix(hex(70.,196.,222.),hex(34.,110.,206.),smoothstep(.0,.06,dep));
    wa=mix(wa,hex(22.,62.,168.),smoothstep(.06,.6,dep));
    wa=mix(wa,mix(hex(60.,200.,190.),hex(40.,150.,170.),smoothstep(.0,.3,dep)),uWarm*.7);
    float wet = uLevel<=0.0005 ? (1.-land) : step(uLevel,dep)*(1.-land);
    vec3 alb=land>.5?la:mix(sb,wa,wet);
    // flood: land temporarily under churning water
    float fn=vn(vP*9.+uT*.05);
    alb=mix(alb,mix(hex(60.,140.,200.),hex(110.,170.,210.),fn),uFlood*land*smoothstep(.2,.6,uFlood+fn*.5));
    vec3 N=normalize(vN); float ndl=dot(N,uSun);
    float lit=smoothstep(-.08,.12,ndl);
    vec3 L=mix(vec3(.26,.27,.42),vec3(1.32,1.26,1.12),lit)+vec3(.05,.06,.12);
    L=mix(L,vec3(.05,.07,.16),uDark);
    vec3 c=alb*L;
    vec3 Hh=normalize(uSun+vV); float sp=pow(max(dot(N,Hh),0.),220.);
    c+=wet*smoothstep(.3,.6,sp)*vec3(.45,.45,.42)*(1.-uDark);
    // impact foam: white churn everywhere
    float foam=smoothstep(.45,.75,vn(vP*14.+3.)*.6+vn(vP*31.)*.4+uFoam*.5-.25)*uFoam;
    c=mix(c,vec3(.97,.98,1.)*mix(1.,.55,1.-lit),clamp(foam,0.,1.));
    float fw=fwidth(land); float coast=smoothstep(.15,.45,fw*2.2);
    float wl=0.;
    if(uLevel>.0015){ float d=dep-uLevel; float fd=fwidth(dep); wl=1.-smoothstep(fd*.6,fd*1.6,abs(d)); wl*=1.-land; }
    c=mix(c,vec3(.05,.035,.07),clamp(max(coast*.85,wl*.9),0.,1.)*(1.-uDark*.6));
    gl_FragColor=vec4(c,1.);
  }`
}));
earth.material.extensions = { derivatives: true };
scene.add(earth);

const CU = { uAmt: { value: 1 }, uSun: { value: sunDir }, uT: { value: 0 }, uDark: { value: 0 } };
const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 160, 80), new THREE.ShaderMaterial({
  uniforms: CU, transparent: true, depthWrite: false,
  vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uAmt,uT,uDark; uniform vec3 uSun; varying vec3 vP; varying vec3 vN;
  vec3 h3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return -1.+2.*fract(sin(p)*43758.5453); }
  float n3(vec3 p){ vec3 i=floor(p),f=fract(p); vec3 u=f*f*(3.-2.*f);
    return mix(mix(mix(dot(h3(i),f),dot(h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(h3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(h3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(h3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z); }
  void main(){
    vec3 q=normalize(vP); vec3 p=vec3(q.x*4.2,q.y*7.5,q.z*4.2)+vec3(uT*.01,0.,0.);
    float n=n3(p)*.55+n3(p*2.3+1.7)*.3+n3(p*5.1)*.18;
    float lat=abs(q.y); n+=.13*cos(lat*9.4)-.02+.08*smoothstep(.75,.9,lat);
    float th=mix(.13,.8,1.-uAmt);
    float a=smoothstep(th,th+.03,n);
    float edge=smoothstep(th,th+.012,n)-smoothstep(th+.012,th+.03,n);
    float lit=smoothstep(-.08,.12,dot(normalize(vN),uSun));
    vec3 c=mix(vec3(.55,.58,.78),vec3(1.,.99,.97),lit); c=mix(c,vec3(.32,.33,.5),edge*.35);
    gl_FragColor=vec4(c*(1.-uDark*.8),a*.95*smoothstep(.0,.15,uAmt));
  }`
}));
scene.add(clouds);

// the lifted ocean: a translucent rippling shell
const SU = { uT: { value: 0 }, uA: { value: 0 }, uSun: { value: sunDir }, uBreak: { value: 0 } };
const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 200, 100), new THREE.ShaderMaterial({
  uniforms: SU, transparent: true, depthWrite: false,
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP=position; vN=normalize(mat3(modelMatrix)*normal);
    vec4 wp=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform float uT,uA,uBreak; uniform vec3 uSun; varying vec3 vN; varying vec3 vV; varying vec3 vP;
  float hh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
  float vn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z); }
  void main(){
    vec3 N=normalize(vN); float lit=smoothstep(-.1,.2,dot(N,uSun));
    float n=vn(vP*7.+vec3(uT*.03,0.,uT*.02))*.6+vn(vP*17.-uT*.04)*.4;
    vec3 deep=vec3(.08,.30,.72), shal=vec3(.25,.62,.92);
    vec3 c=mix(deep,shal,smoothstep(.3,.8,n)*.6);
    c=mix(c*vec3(.35,.4,.6),c*1.15,lit);
    float band=smoothstep(.66,.68,n)-smoothstep(.68,.70,n); c=mix(c,vec3(.75,.9,1.),band*.35*lit);
    float fr=1.-abs(dot(N,normalize(vV)));
    c+=vec3(.25,.45,.7)*pow(fr,3.)*.6;
    vec3 Hh=normalize(uSun+vV); c+=smoothstep(.3,.6,pow(max(dot(N,Hh),0.),400.))*vec3(.35)*lit;
    float holes=smoothstep(.15,.0,n-uBreak*1.2+.05)*step(.001,uBreak);
    gl_FragColor=vec4(c,uA*mix(.42,1.,pow(fr,1.5))*(1.-holes));
  }`
}));
scene.add(shell);

const outline = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), new THREE.MeshBasicMaterial({ color: 0x0b0a12, side: THREE.BackSide }));
scene.add(outline);
const AU = { uAmt: { value: 1 } };
const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 128, 64), new THREE.ShaderMaterial({
  uniforms: AU, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform float uAmt; varying vec3 vN; varying vec3 vV;
  void main(){ float a=smoothstep(.0,1.,dot(-normalize(vN),vV)); a=pow(a,5.)*1.1; gl_FragColor=vec4(vec3(.35,.62,1.)*a*uAmt,1.); }`
}));
scene.add(atmo);

// impact ring (flat bright ring expanding at the limb) + steam wisps
const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.06, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
scene.add(ring);
const steams = [];
for (let i = 0; i < 26; i++) { const s = sprite(steamTex, 0.32); s.material.opacity = 0; scene.add(s); steams.push(s); }

/**
 * st: { level 0..1 dry, cloud 0..1, shellR (radius, 0 = hidden), shellA, dark, foam, warm, flood, ring 0..1, steam 0..1, rotY }
 */
export function update(f, st) {
  U.uLevel.value = st.level <= 0 ? 0 : Math.pow(st.level, 1.6) * 0.9 + 0.0005;
  U.uDark.value = st.dark ?? 0; U.uFoam.value = st.foam ?? 0; U.uWarm.value = st.warm ?? 0; U.uFlood.value = st.flood ?? 0; U.uT.value = f;
  CU.uAmt.value = st.cloud ?? 1; CU.uT.value = f; CU.uDark.value = st.dark ?? 0;
  AU.uAmt.value = (0.55 + 0.45 * (st.cloud ?? 1)) * (1 - 0.5 * (st.dark ?? 0));
  earth.rotation.y = st.rotY ?? (-Math.PI / 2 + 0.70 + f * 0.0016);
  clouds.rotation.y = earth.rotation.y + f * 0.0006;
  const sr = st.shellR ?? 0;
  shell.visible = sr > 0.0; shell.scale.setScalar(Math.max(sr, 0.001)); SU.uA.value = st.shellA ?? 1; SU.uT.value = f; SU.uBreak.value = st.shellBreak ?? 0;
  shell.rotation.y = earth.rotation.y;
  outline.scale.setScalar(Math.max(1.032, sr > 0 ? sr * 1.032 : 0) );
  atmo.scale.setScalar(Math.max(1, sr));
  const rg = st.ring ?? 0;
  ring.visible = rg > 0 && rg < 1; ring.scale.setScalar(1.0 + rg * 0.5); ring.material.opacity = (1 - rg) * 0.9;
  ring.lookAt(cam.position);
  const sm = st.steam ?? 0;
  steams.forEach((s, i) => {
    const a = (i / steams.length) * Math.PI * 2 + 0.2 * Math.sin(i * 3.1);
    const ph = ((f * 0.012 + hash(i)) % 1);
    const r = 1.02 + ph * 0.25;
    s.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.2);
    s.material.rotation = a - Math.PI / 2;
    s.scale.set(0.16 + ph * 0.16, 0.32 + ph * 0.3, 1);
    s.material.opacity = sm * Math.sin(ph * Math.PI) * 0.85;
    s.quaternion.copy(cam.quaternion);
  });
}
export function setCam(dist, opts = {}) {
  const { x = 0, y = 0.55, lookY = 0, roll = 0, fov = 26 } = opts;
  cam.position.set(x, y, dist); cam.up.set(0, 1, 0); cam.lookAt(0, lookY, 0); if (roll) cam.rotateZ(roll);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
}
