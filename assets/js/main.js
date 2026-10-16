/* ==========================================================
   MOO//PHASE — main.js  (vanilla, no build step)
   ========================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------------- CONFIG ---------------- */
  const PH = "YOUR_CONTRACT_ADDRESS_HERE";
  const cfg = Object.assign({}, window.SITE_CONFIG || {});
  const caSet = cfg.contractAddress && cfg.contractAddress !== PH && cfg.contractAddress.trim() !== "";
  if (caSet) for (const k of ["pumpFunUrl", "dexUrl", "dexEmbedUrl"]) if (cfg[k]) cfg[k] = cfg[k].split(PH).join(cfg.contractAddress.trim());

  $$("[data-link]").forEach(a => {
    const url = cfg[a.dataset.link];
    if (url) a.href = url; else a.href = "#";
  });
  $$("[data-ca]").forEach(el => el.textContent = caSet ? cfg.contractAddress : "CA DROPS AT LAUNCH");

  const frame = $("#dexFrame");
  if (frame && cfg.dexEmbedUrl && !cfg.dexEmbedUrl.includes(PH) && !/YOUR_/.test(cfg.dexEmbedUrl)) {
    frame.src = cfg.dexEmbedUrl;
    frame.closest(".vp-screen").classList.add("live");
  }

  /* ---------------- TOAST / COPY ---------------- */
  const toast = $("#toast"); let tt;
  const say = msg => { toast.textContent = msg; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 2200); };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok; }
  }
  $$("[data-copy-ca]").forEach(b => b.addEventListener("click", async e => {
    if (!caSet) { say("CA not live yet — stay tuned 🛸"); return; }
    const ok = await copy(cfg.contractAddress.trim());
    if (ok) { b.classList.add("copied"); say("CA COPIED — MOO!"); burst(e.clientX, e.clientY, 10); setTimeout(() => b.classList.remove("copied"), 1800); }
    else say("Copy failed — select the CA manually");
  }));
  // placeholder links: friendly message instead of a dead jump
  $$("[data-link]").forEach(a => a.addEventListener("click", e => {
    const url = cfg[a.dataset.link] || "";
    if (!url || /YOUR_/.test(url)) { e.preventDefault(); say("Link drops at launch 🛸"); }
  }));

  /* ---------------- FX: hearts + MOO ---------------- */
  const fx = $("#fx");
  const HEARTS = ["assets/img/heart1.png", "assets/img/heart2.png", "assets/img/heart3.png"];
  const WORDS = ["MOO", "moo!", "MOOO", "$MOO", "phase", "✦"];
  function burst(x, y, n = 7) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement("img"); h.src = HEARTS[i % 3]; h.className = "fx-heart"; h.alt = "";
      h.style.left = x - 15 + "px"; h.style.top = y - 15 + "px"; fx.appendChild(h);
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      h.animate([{ transform: "translate(0,0) scale(.3) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 60}px) scale(${.6 + Math.random() * .7}) rotate(${Math.random() * 120 - 60}deg)`, opacity: 0 }],
        { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => h.remove();
    }
    const w = document.createElement("div"); w.className = "fx-moo"; w.textContent = WORDS[Math.random() * WORDS.length | 0];
    w.style.left = x + "px"; w.style.top = y + "px"; fx.appendChild(w);
    w.animate([{ transform: "translate(-50%,-50%) scale(.5)", opacity: 1 }, { transform: "translate(-50%,-140px) scale(1.4) rotate(-8deg)", opacity: 0 }],
      { duration: 1100, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => w.remove();
  }

  /* ---------------- CURSOR ---------------- */
  const cur = $(".ufo-cursor");
  if (fine && !reduce) {
    document.body.classList.add("cursor-on");
    let cx = -100, cy = -100, tx = -100, ty = -100;
    addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { cx = lerp(cx, tx, .22); cy = lerp(cy, ty, .22);
      cur.style.transform = `translate3d(${cx - 23}px,${cy - 30}px,0) rotate(${clamp((tx - cx) * .4, -20, 20)}deg)`; requestAnimationFrame(loop); })();
    document.addEventListener("pointerover", e => cur.classList.toggle("hot", !!e.target.closest("a,button,.ring-wrap,.hb")));
    addEventListener("pointerdown", e => { if (!e.target.closest("iframe")) burst(e.clientX, e.clientY, 6); });
  } else {
    addEventListener("pointerdown", e => { if (e.target.closest(".jelly,.tp,.soc")) burst(e.clientX, e.clientY, 6); }, { passive: true });
  }

  /* ---------------- WEBGL HOLO LIQUID ---------------- */
  const FRAG = `precision mediump float;
uniform vec2 R; uniform float T; uniform vec2 M; uniform float D;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
vec3 pal(float i){i=mod(i,6.);
 if(i<1.)return vec3(1.,.61,.91); if(i<2.)return vec3(.69,.55,1.); if(i<3.)return vec3(.44,.89,.94);
 if(i<4.)return vec3(.58,.94,.66); if(i<5.)return vec3(.87,.49,.83); return vec3(.6,.49,.71);}
void main(){
 vec2 uv=gl_FragCoord.xy/R; vec2 p=(gl_FragCoord.xy-.5*R)/min(R.x,R.y)*2.2;
 float t=T*.06;
 p+= (M-.5)*.35;
 vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
 vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*1.4),fbm(p+3.5*q+vec2(8.3,2.8)-t*1.2));
 float f=fbm(p+3.2*r);
 float b=f*D+T*.05; float fr=fract(b); float id=floor(b);
 vec3 c=mix(pal(id),pal(id+1.),smoothstep(.6,1.,fr));
 float d=min(fr,1.-fr);
 c=mix(vec3(.16,.09,.26),c,smoothstep(.015,.075,d));
 c+=.12*vec3(1.,.8,1.)*pow(max(0.,1.-length(uv-vec2(.7,.6))),3.);
 gl_FragColor=vec4(c,1.);
}`;
  const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  function holo(canvas, density = 9) {
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) { canvas.style.background = "url(assets/img/holo-marble.webp) center/cover"; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.style.background = "url(assets/img/holo-marble.webp) center/cover"; return; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "R"), uT = gl.getUniformLocation(pr, "T"), uM = gl.getUniformLocation(pr, "M"), uD = gl.getUniformLocation(pr, "D");
    const scale = innerWidth < 700 ? .45 : .55;
    const size = () => { const w = canvas.clientWidth * scale | 0, h = canvas.clientHeight * scale | 0; canvas.width = Math.max(2, w); canvas.height = Math.max(2, h); gl.viewport(0, 0, canvas.width, canvas.height); };
    size(); addEventListener("resize", size);
    let vis = true, mx = .5, my = .5, sx = .5, sy = .5;
    new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(canvas);
    addEventListener("pointermove", e => { mx = e.clientX / innerWidth; my = 1 - e.clientY / innerHeight; }, { passive: true });
    const t0 = performance.now();
    (function frame(now) {
      if (vis) { sx = lerp(sx, mx, .04); sy = lerp(sy, my, .04);
        gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, reduce ? 10 : (now - t0) / 1000); gl.uniform2f(uM, sx, sy); gl.uniform1f(uD, density);
        gl.drawArrays(gl.TRIANGLES, 0, 3); }
      if (!reduce) requestAnimationFrame(frame);
    })(t0);
  }
  holo($("#heroGL"), 9); holo($("#footGL"), 7);

  /* ---------------- HERO BUBBLES (pop them) ---------------- */
  const hbWrap = $("#heroBubbles");
  function spawnBubble(initial) {
    const b = document.createElement("div"); b.className = "hb";
    const s = 40 + Math.random() * 90, dur = 9 + Math.random() * 10;
    b.style.cssText = `left:${Math.random() * 96}%;width:${s}px;height:${s}px;animation-duration:${dur}s;--dx:${(Math.random() - .5) * 160}px;${initial ? `animation-delay:-${Math.random() * dur}s` : ""}`;
    b.innerHTML = '<img src="assets/img/bubble.png" alt="">';
    b.addEventListener("pointerdown", e => { e.stopPropagation(); b.classList.add("pop"); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 5); setTimeout(() => { b.remove(); spawnBubble(); }, 380); });
    b.addEventListener("animationiteration", () => { b.style.left = Math.random() * 96 + "%"; });
    hbWrap.appendChild(b);
  }
  if (hbWrap && !reduce) for (let i = 0; i < (innerWidth < 700 ? 7 : 12); i++) spawnBubble(true);

  /* ---------------- HOLO CARD 3D ---------------- */
  const card = $("#holoCard"), hero = $("#hero");
  if (card && !reduce) {
    hero.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", `${clamp((x - .5) * 30, -22, 22)}deg`);
      card.style.setProperty("--rx", `${clamp((.5 - y) * 26, -18, 18)}deg`);
      card.style.setProperty("--mx", clamp(x, 0, 1)); card.style.setProperty("--my", clamp(y, 0, 1));
    });
    hero.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    if (!fine) { let a = 0; (function idle() { a += .012; card.style.setProperty("--ry", `${Math.sin(a) * 12}deg`); card.style.setProperty("--rx", `${Math.cos(a * .8) * 7}deg`);
      card.style.setProperty("--mx", .5 + Math.sin(a) * .5); requestAnimationFrame(idle); })(); }
  }

  /* ---------------- TILT CARDS ---------------- */
  if (fine && !reduce) $$(".tilt").forEach(el => {
    el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect();
      el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - .5) * 16}deg`);
      el.style.setProperty("--rx", `${(.5 - (e.clientY - r.top) / r.height) * 14}deg`); });
    el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });

  /* ---------------- REVEAL ---------------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const el = e.target; const sib = el.parentElement ? [...el.parentElement.children].filter(c => c.hasAttribute("data-reveal")) : [];
      const i = Math.max(0, sib.indexOf(el)); el.style.transitionDelay = (i * 0.09) + "s";
      el.classList.add("in"); if (el.classList.contains("sec-head") || el.classList.contains("foot-title")) el.classList.add("glitch-in"); io.unobserve(el); }
  }), { threshold: .14, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach(el => io.observe(el));

  /* ---------------- TAPES MARQUEE ---------------- */
  const tapes = $$(".tape-track").map((t, i) => { t.innerHTML += t.innerHTML; return { el: t, x: 0, dir: i ? 1 : -1 }; });

  /* ---------------- SMOOTH SCROLL ---------------- */
  let lenis = null;
  function initLenis() {
    if (reduce || !window.Lenis) { document.documentElement.classList.add("no-lenis"); return; }
    try { lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now()); }
    catch { lenis = null; document.documentElement.classList.add("no-lenis"); }
  }
  const scrollTo = target => {
    const el = target === "#top" ? document.body : $(target); if (!el) return;
    if (lenis) lenis.scrollTo(target === "#top" ? 0 : el, { offset: 0, duration: 1.6 });
    else if (target === "#top") scrollTo_native(0); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  const scrollTo_native = y => window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  $$("[data-scroll]").forEach(a => a.addEventListener("click", e => {
    const href = a.getAttribute("href"); if (!href || !href.startsWith("#")) return;
    e.preventDefault(); closeNav(); scrollTo(href);
  }));

  /* ---------------- NAV ---------------- */
  const burger = $("#burger"), nav = $("#nav"), hdr = $("#hdr");
  function closeNav() { nav.classList.remove("open"); hdr.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open); hdr.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : ""; if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------------- SCROLL-DRIVEN SCENES ---------------- */
  const toTop = $(".to-top");
  const ab = $("#abduction"), stage = $(".ab-stage"), cow = $(".ab-cow"), ufo = $(".ab-ufo");
  const steps = $$(".ab-step"), meter = $("#abMeter"), pct = $("#abPct");
  const dims = $("#dimensions"), ring = $("#ring"), ringWrap = $("#ringWrap"), cards = $$(".ring-card");
  const track = $("#track"), trackFill = $("#trackFill");
  let lastY = scrollY, vel = 0, drag = 0, dragV = 0;

  function layoutRing() {
    const w = cards[0].getBoundingClientRect().width || 260;
    const n = cards.length, r = (w / (2 * Math.tan(Math.PI / n))) * 1.12;
    cards.forEach((c, i) => c.style.transform = `rotateY(${i * 360 / n}deg) translateZ(${r}px)`);
  }
  layoutRing(); addEventListener("resize", layoutRing);

  // drag ring
  let down = false, px = 0;
  ringWrap.addEventListener("pointerdown", e => { down = true; px = e.clientX; dragV = 0; ringWrap.setPointerCapture(e.pointerId); });
  ringWrap.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - px; px = e.clientX; drag += dx * .35; dragV = dx * .35; });
  const up = () => { down = false; };
  ringWrap.addEventListener("pointerup", up); ringWrap.addEventListener("pointercancel", up);

  const sectionP = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight), 0, 1); };

  let hidden = false;
  function tick() {
    const y = scrollY; const dy = y - lastY; lastY = y; vel = lerp(vel, dy, .15);

    // header hide on scroll down
    const shouldHide = y > 160 && dy > 2 && !nav.classList.contains("open");
    if (shouldHide !== hidden && Math.abs(dy) > 2) { hidden = shouldHide; hdr.classList.toggle("hide", hidden); }
    toTop.classList.toggle("show", y > innerHeight * .9);

    // tapes
    const v = clamp(vel, -60, 60);
    tapes.forEach(t => { t.x += t.dir * (1.1 + Math.abs(v) * .25); const half = t.el.scrollWidth / 2; if (t.x <= -half) t.x += half; if (t.x > 0) t.x -= half; t.el.style.transform = `translateX(${t.x}px)`; });
    document.documentElement.style.setProperty("--skew", `${clamp(v * .25, -10, 10)}deg`);

    // abduction
    if (!reduce) {
      const p = sectionP(ab);
      const u = ease(range(p, 0, .16));
      stage.style.setProperty("--ufoY", `${lerp(-60, 0, u)}vh`);
      stage.style.setProperty("--beam", ease(range(p, .12, .26)).toFixed(3));
      const c = range(p, .28, .78), ce = c * c * (3 - 2 * c);
      const travel = innerHeight * (innerWidth < 720 ? .44 : .5);
      stage.style.setProperty("--cowY", `${-ce * travel}px`);
      stage.style.setProperty("--cowS", (1 - ce * .78).toFixed(3));
      stage.style.setProperty("--cowR", `${Math.sin(c * 14) * 10 * (c > 0 ? 1 : 0) + c * 25}deg`);
      stage.style.setProperty("--cowH", `${c * 220}deg`);
      stage.style.setProperty("--cowG", `${c * 30}px`);
      const fade = range(p, .78, .86);
      stage.style.setProperty("--cowO", (1 - fade).toFixed(3));
      const fl = range(p, .76, .84) - range(p, .84, .95);
      stage.style.setProperty("--flash", clamp(fl, 0, 1).toFixed(3));
      stage.style.setProperty("--ufoR", `${p > .86 ? Math.sin(performance.now() / 120) * 4 : Math.sin(performance.now() / 600) * 2}deg`);
      steps.forEach((s, i) => s.classList.toggle("on", p > [.04, .3, .8][i]));
      const pr = Math.round(range(p, .02, .85) * 100);
      meter.style.width = pr + "%"; pct.textContent = pr + "%";
    }

    // ring
    if (!down) { drag += dragV; dragV *= .94; }
    const rp = sectionP(dims);
    ring.style.setProperty("--ringY", `${-rp * 400 + drag}deg`);

    // roadmap beam
    const tr = track.getBoundingClientRect();
    const tp = clamp((innerHeight * .6 - tr.top) / tr.height, 0, 1);
    trackFill.style.height = tp * 100 + "%";

    requestAnimationFrame(tick);
  }

  /* ---------------- PRELOADER ---------------- */
  const loader = $("#loader"), lc = $("#loaderCanvas"), ctx = lc.getContext("2d");
  const fill = $("#loaderFill"), lpct = $("#loaderPct");
  const main = new Image(); main.src = "assets/img/moo-main.webp";
  let shown = 0, target = 0, done = false, finished = false;
  const imgs = $$("img").filter(i => !i.closest("#loader"));
  const crit = imgs.filter(i => i.loading !== "lazy").slice(0, 16);
  let loaded = 0; const total = crit.length + 1;
  const bump = () => { loaded++; target = Math.min(1, loaded / total); };
  crit.forEach(i => (i.complete ? bump() : (i.addEventListener("load", bump, { once: true }), i.addEventListener("error", bump, { once: true }))));
  main.onload = bump; main.onerror = bump;
  const t0 = performance.now();
  addEventListener("load", () => { target = 1; });
  setTimeout(() => { target = 1; }, 4500); // never hang

  function sizeLC() { lc.width = innerWidth * Math.min(devicePixelRatio, 2); lc.height = innerHeight * Math.min(devicePixelRatio, 2); }
  sizeLC(); addEventListener("resize", sizeLC);
  const off = document.createElement("canvas"), octx = off.getContext("2d");
  function drawPix(prog) {
    const W = lc.width, H = lc.height;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (!main.complete || !main.naturalWidth) return;
    const s = Math.max(W, H); const ox = (W - s) / 2, oy = (H - s) / 2;
    const res = Math.round(lerp(8, 220, Math.pow(prog, 1.6)));
    if (prog > .985) { ctx.imageSmoothingEnabled = true; ctx.drawImage(main, ox, oy, s, s); }
    else { off.width = res; off.height = res; octx.drawImage(main, 0, 0, res, res); ctx.imageSmoothingEnabled = false;
      const j = (1 - prog) * 14 * (Math.random() > .7 ? 1 : 0);
      ctx.globalAlpha = 1; ctx.drawImage(off, ox + j, oy, s, s);
      if (j) { ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = .5; ctx.drawImage(off, ox - j * 2, oy, s, s); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; } }
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
  }
  function dissolve() {
    if (finished) return; finished = true;
    loader.classList.add("out"); $(".loader-ui").style.opacity = 0; $(".loader-skip").style.display = "none";
    loader.style.background = "transparent"; $(".loader-scan").style.display = "none";
    document.body.classList.remove("is-loading"); initLenis(); requestAnimationFrame(tick);
    if (reduce) { loader.classList.add("gone"); return; }
    const W = lc.width, H = lc.height, cs = Math.ceil(Math.max(W, H) / 18);
    const cells = []; for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) cells.push([x, y, Math.random() * .6 + (y / H) * .4]);
    cells.sort((a, b) => a[2] - b[2]);
    const st = performance.now(), dur = 900;
    (function step(now) {
      const k = (now - st) / dur, upto = Math.floor(cells.length * clamp(k, 0, 1));
      for (let i = 0; i < upto; i++) ctx.clearRect(cells[i][0], cells[i][1], cs, cs);
      if (k < 1) requestAnimationFrame(step); else loader.classList.add("gone");
    })(st);
  }
  let lastT = t0;
  (function loop(now) {
    if (finished) return;
    const dt = Math.min(.25, (now - lastT) / 1000); lastT = now;
    const minT = clamp((now - t0) / 2200, 0, 1);
    shown = lerp(shown, Math.min(target, minT), 1 - Math.exp(-dt * 7));
    if (target >= 1 && minT >= 1 && shown > .97) shown = 1;
    fill.style.width = (shown * 100).toFixed(1) + "%"; lpct.textContent = Math.round(shown * 100) + "%";
    drawPix(shown);
    if (shown >= 1 && !done) { done = true; setTimeout(dissolve, 350); }
    requestAnimationFrame(loop);
  })(t0);
  const skip = () => { if (!finished) { drawPix(1); dissolve(); } };
  $(".loader-skip").addEventListener("click", skip);
  loader.addEventListener("click", skip);
})();
