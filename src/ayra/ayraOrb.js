/**
 * AYRA conscious orb — a living, audio-reactive WebGL sphere, ported from the
 * internal ops console and re-skinned to Sotbella's luxe monochrome (graphite →
 * silver → ivory, with a champagne-metal accent and a cool-steel "listening"
 * shift). Same "state engine" that makes it feel conscious: idle / listening /
 * thinking / speaking are target uniform sets that the render loop eases toward,
 * and the surface deforms to the real voice amplitude.
 *
 * createOrb(canvas, { getAmp, onClick }) -> { setState(name), dispose() }
 *   getAmp(): number 0..1  — live audio level (from the ElevenLabs SDK).
 */
import * as THREE from "three";

const STATE_UNIFORMS = {
  idle:       { turb: 0.28, speed: 0.12, cool: 0.10, bright: 0.66 },
  connecting: { turb: 0.55, speed: 0.40, cool: 0.35, bright: 0.78 },
  listening:  { turb: 0.48, speed: 0.28, cool: 0.80, bright: 0.90 }, // cool steel
  thinking:   { turb: 1.05, speed: 0.85, cool: 0.30, bright: 0.95 }, // agitated
  speaking:   { turb: 0.72, speed: 0.45, cool: 0.05, bright: 1.05 }, // warm, bright
};

export function createOrb(canvas, { getAmp, onClick } = {}) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tState = { ...STATE_UNIFORMS.idle };
  let ampNow = 0, ampTarget = 0, hidden = false, raf = 0, disposed = false;

  // ── CSS fallback (no WebGL / reduced motion): a breathing metallic disc ──
  if (reduce || typeof WebGLRenderingContext === "undefined") {
    canvas.style.display = "none";
    const el = canvas.parentElement?.querySelector(".ayra-orb-css");
    if (el) {
      el.style.display = "block";
      if (onClick) el.onclick = onClick;
      (function loop() {
        if (disposed) return;
        const a = (getAmp && getAmp()) || 0;
        ampTarget = Math.max(ampTarget * 0.94, a);
        ampNow += (ampTarget - ampNow) * 0.18;
        el.style.transform = `scale(${(1 + ampNow * 0.1).toFixed(3)})`;
        raf = requestAnimationFrame(loop);
      })();
    }
    return { setState: (s) => { if (STATE_UNIFORMS[s]) tState = { ...STATE_UNIFORMS[s] }; }, dispose: () => { disposed = true; cancelAnimationFrame(raf); } };
  }

  let renderer, scene, camera, sphere, points, uni;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    uni = {
      uTime: { value: 0 }, uAmp: { value: 0 }, uTurb: { value: 0.3 },
      uCool: { value: 0.1 }, uBright: { value: 0.66 },
      cDeep: { value: new THREE.Color("#2c2925") },   // graphite
      cBand: { value: new THREE.Color("#b8a179") },   // champagne metal accent
      cSilver: { value: new THREE.Color("#cfc9bf") }, // silver stone
      cIvory: { value: new THREE.Color("#f6f3ee") },  // ivory rim
      cCool: { value: new THREE.Color("#8f9aa1") },   // cool steel (listening)
    };
    const vert = `
      uniform float uTime,uAmp,uTurb;
      varying vec3 vN; varying float vD;
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod(i,289.0);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      void main(){
        vN = normal;
        float n = snoise(normal*1.8 + vec3(uTime*.35));
        float n2 = snoise(normal*4.0 - vec3(uTime*.5));
        float d = n*uTurb*.22 + n2*(uAmp*.34 + uTurb*.05);
        vD = d;
        vec3 p = position + normal*d;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`;
    const frag = `
      uniform float uTime,uCool,uBright,uAmp;
      uniform vec3 cDeep,cBand,cSilver,cIvory,cCool;
      varying vec3 vN; varying float vD;
      void main(){
        vec3 n = normalize(vN);
        float f = pow(1.0 - abs(dot(n, vec3(0.,0.,1.))), 1.6);   // fresnel rim
        float m1 = smoothstep(-.35,.55, n.y + vD*2.2);
        float m2 = smoothstep(-.6,.6, sin(n.x*2.0 + uTime*.25) );
        vec3 col = mix(cDeep, cSilver, m1);
        col = mix(col, cBand, m2*.45);                 // drifting champagne band
        col = mix(col, cIvory, f*.55 + uAmp*.25);      // ivory rim brightens w/ voice
        col = mix(col, cCool, uCool*.5);               // listening: cool steel shift
        col *= uBright + f*.35;
        gl_FragColor = vec4(col, .94);
      }`;
    sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 5),
      new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vert, fragmentShader: frag, transparent: true })
    );
    scene.add(sphere);

    const N = 260, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 2.2 + Math.random() * 3.0, t = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(t) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(ph) - 1.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xb8a179, size: 0.016, transparent: true, opacity: 0.5 }));
    scene.add(points);

    const resize = () => {
      const w = canvas.clientWidth || 200, h = canvas.clientHeight || 200;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const onVis = () => { hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    if (onClick) canvas.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    (function loop() {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const a = (getAmp && getAmp()) || 0;
      ampTarget = Math.max(ampTarget * 0.94, a);
      ampNow += (ampTarget - ampNow) * 0.18;
      uni.uTurb.value += (tState.turb - uni.uTurb.value) * 0.06;
      uni.uCool.value += (tState.cool - uni.uCool.value) * 0.08;
      uni.uBright.value += (tState.bright - uni.uBright.value) * 0.06;
      uni.uAmp.value = ampNow;
      uni.uTime.value += dt * (0.5 + tState.speed);
      sphere.rotation.y += dt * (0.08 + tState.speed * 0.35);
      sphere.rotation.x = Math.sin(uni.uTime.value * 0.18) * 0.12;
      points.rotation.y -= dt * 0.02;
      camera.position.x = Math.sin(uni.uTime.value * 0.07) * 0.14;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();

    return {
      setState: (s) => { if (STATE_UNIFORMS[s]) tState = { ...STATE_UNIFORMS[s] }; },
      dispose: () => {
        disposed = true; cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVis);
        ro.disconnect();
        try { sphere.geometry.dispose(); sphere.material.dispose(); points.geometry.dispose(); points.material.dispose(); renderer.dispose(); } catch {}
      },
    };
  } catch (e) {
    return { setState: () => {}, dispose: () => { disposed = true; } };
  }
}

export default createOrb;
