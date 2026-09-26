/* tigOS arcade, Ghost Run part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one closure.
   Ghost Run is a three-lane runner through a haunted house, rendered with Three.js (window.THREE, vendored in src/assets/three.js and fetched
   only when the game starts). The simulation is the canvas game's, untouched: lanes 0..2, obstacles that travel a unit depth z from 0 (far)
   to 1.08 (behind you) with the runner at z = .86, speed .46 rising to 1.7, forks that turn the house, a threat meter the ghosts climb.
   Part 02 draws that as a real corridor (one unit of z = 40 m) with the props built in Blender (blender/ghostrun.py), which ship as one small
   .glb (haunt.glb) that streams in after the game starts; boxy stand-ins draw until it lands. Same contract as games.js:
   make(api) -> { reset, update, draw, key, pointer, resize, destroy }. */
(function(){
  var GAMES = window.TIG_GAMES; if(!GAMES) return;
  var W = 400, H = 600, FONT = 'ui-monospace, Menlo, Consolas, monospace';
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; }, rnd = function(a, b){ return a + Math.random() * (b - a); }, ri = function(a, b){ return Math.floor(rnd(a, b + 1)); }, lerp = function(a, b, k){ return a + (b - a) * k; };
  var mk = function(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  var seed = 13; var srand = function(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  var text = function(c, s, x, y, size, col, align, weight, font){ c.font = (weight || 700)+' '+size+'px '+(font || FONT); c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  function esc(s){ return String(s).replace(/[&<>"]/g, function(ch){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]; }); }
  function grain(x, w, h, a, n){ for(var i = 0; i < n; i++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '255,255,255')+','+(a * srand())+')'; x.fillRect((srand()*w)|0, (srand()*h)|0, 1 + (srand()*2)|0, 1); } }
  function isDir(k){ return { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', w:'U', W:'U', ' ':'U', ArrowDown:'D', s:'D', S:'D' }[k] || null; }

  /* ---------- player settings: graphics tier and volume, kept in localStorage, edited on the title card ---------- */
  var GFX = ['low', 'medium', 'high', 'ultra'];
  var SET = { gfx:'high', vol:.8 };
  (function(){ try { var o = JSON.parse(localStorage.getItem('tigos.ghostrun') || '{}'); Object.keys(SET).forEach(function(k){ if(o[k] !== undefined) SET[k] = o[k]; }); } catch(e){} SET.vol = clamp(+SET.vol, 0, 1); if(GFX.indexOf(SET.gfx) < 0) SET.gfx = 'high'; })();
  function saveSet(){ try { localStorage.setItem('tigos.ghostrun', JSON.stringify(SET)); } catch(e){} }

  /* ---------- the Blender models: one glb with the runner, the ghost, the witch, coffin, armor, candle, arch, sconce, portrait and bat as named nodes ---------- */
  var MODEL_KEYS = ['haunt'];
  var MODELS = { haunt:null, tried:false, failed:{}, listeners:[] };
  function modelReady(k, scene){ prepProps(scene); MODELS[k] = scene; MODELS.listeners.slice().forEach(function(fn){ try { fn(k, scene); } catch(e){} }); }
  function loadModels(){ if(MODELS.tried) return; MODELS.tried = true; var THREE = window.THREE; if(!THREE || !THREE.GLTFLoader) return; var L = new THREE.GLTFLoader();
    MODEL_KEYS.forEach(function(k){ var url = window.TIG_ASSETS && window.TIG_ASSETS[k]; if(!url){ MODELS.failed[k] = 'no asset'; return; } if(!/^https?:/.test(location.protocol)){ MODELS.failed[k] = 'file://'; return; }   /* fetch() has no file: scheme; tests hand the bytes in through g.dbg.model */
      L.load(url, function(gltf){ modelReady(k, gltf.scene); }, undefined, function(e){ MODELS.failed[k] = String(e && e.message || e || 'load error'); }); }); }
  function parseModel(k, buf, cb){ new window.THREE.GLTFLoader().parse(buf, '', function(gltf){ modelReady(k, gltf.scene); if(cb) cb(null); }, function(e){ MODELS.failed[k] = String(e && e.message || e); if(cb) cb(e); }); }
  function prepProps(sc){ var THREE = window.THREE; sc.traverse(function(o){ if(!o.isMesh) return; o.castShadow = o.receiveShadow = false; var m = o.material; m.side = THREE.FrontSide;
      if(/Armor|Brass|Frame|Lantern|Cross/.test(m.name)){ m.metalness = Math.min(m.metalness, .4); m.roughness = Math.max(m.roughness, .4); }   /* no environment map: full metalness renders black */
      if(/Flame/.test(m.name)){ m.emissive.setHex(0xffb040); m.emissiveIntensity = 2.6; } if(/^Ghost$/.test(m.name)){ m.transparent = true; m.opacity = .82; m.emissive.setHex(0x6a6aa0); m.emissiveIntensity = .55; m.depthWrite = true; }
      if(/Band/.test(m.name)) m.emissiveIntensity = .8; if(/BatEyes/.test(m.name)) m.emissiveIntensity = 2.5; }); }
  function cloneNode(sc, name){ var src = sc.getObjectByName(name); if(!src) return null; var g = src.clone(true), seen = {}, mats = [];
    g.traverse(function(o){ if(!o.isMesh) return; var m = o.material, k = m.name || m.uuid; if(!seen[k]){ seen[k] = m.clone(); seen[k].name = m.name; mats.push(seen[k]); } o.material = seen[k]; });
    g.userData.mats = mats; g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); return g; }

  /* ---------- sound: footsteps on the boards, a whoosh for the jump and the slide, a candle chime, a thud and a ghost wail on a hit, a door boom at each turn, thunder with the lightning, a low drone that rises with the threat ---------- */
  function Synth(){
    var ac = null, muted = false, master, drone, droneG, droneF, stepT = 0;
    function ctx(){ if(ac || muted) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5*SET.vol; var comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; master.connect(comp); comp.connect(ac.destination); } catch(e){ ac = null; } return ac; }
    function noise(dur, freq, gain, q, type, delay, curve){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, curve || 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + (delay || 0)); }
    function tone(type, f0, f1, dur, gain, delay, attack){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); if(attack){ g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); } else g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02); }
    function ensureDrone(){ var a = ctx(); if(!a || drone) return; drone = a.createOscillator(); drone.type = 'sawtooth'; drone.frequency.value = 48; droneF = a.createBiquadFilter(); droneF.type = 'lowpass'; droneF.frequency.value = 160; droneG = a.createGain(); droneG.gain.value = 0; drone.connect(droneF); droneF.connect(droneG); droneG.connect(master); drone.start(); }
    return {
      toggle:function(){ muted = !muted; if(muted && ac){ try { ac.suspend(); } catch(e){} } else if(ac){ try { ac.resume(); } catch(e){} } return muted; },
      volume:function(v){ if(master) master.gain.value = .5*v; },
      step:function(dt, speed, on){ stepT -= dt; if(stepT <= 0 && on){ stepT = .36/Math.max(.5, speed); noise(.06, 900 + Math.random()*400, .35, 1, 'bandpass'); tone('sine', 120, 60, .05, .12); } },
      jump:function(){ noise(.25, 1800, .3, .6, 'bandpass', 0, 1.5); tone('sine', 300, 700, .22, .08); },
      slide:function(){ noise(.35, 700, .4, .8, 'lowpass', 0, 1.2); },
      candle:function(n){ tone('sine', 1320, 1320, .12, .12); tone('sine', 1980, 1980, .16, .09, .05); },
      hit:function(){ noise(.25, 500, 1.0, .7); tone('sine', 140, 40, .3, .6); tone('sawtooth', 520, 180, .9, .12, .05, .2); tone('sine', 700, 220, 1.1, .1, .1, .3); },
      dead:function(){ [220, 196, 165, 131].forEach(function(f, i){ tone('sawtooth', f, f*.94, .5, .12, i*.22); }); noise(1.4, 300, .6, .5, 'lowpass', .2, 1.2); },
      door:function(){ noise(.5, 260, 1.1, .5); tone('sine', 90, 30, .6, .7); noise(.4, 2500, .15, 2, 'bandpass', .35); },
      thunder:function(){ noise(1.8, 220, 1.1, .4, 'lowpass', .12, 1.3); tone('sine', 60, 25, 1.6, .5, .15); noise(.03, 6000, .5, .5, 'highpass'); },
      bats:function(){ for(var i = 0; i < 5; i++) tone('square', 2400 + Math.random()*1200, 1800, .04, .02, i*.09 + Math.random()*.04); },
      drone:function(threat){ ensureDrone(); if(!droneG) return; var t = ac.currentTime; droneG.gain.setTargetAtTime(.02 + threat*.12, t, .3); droneF.frequency.setTargetAtTime(160 + threat*500, t, .3); },
      close:function(){ if(ac){ try { ac.close(); } catch(e){} } ac = null; drone = null; } };
  }
/* tigOS arcade, Ghost Run part 01: the simulation, ported from the canvas game as is: three lanes, a unit depth z that every obstacle travels
   from 0 (the far end) to 1.08 (behind you) at `speed` per second with the runner at PZ = .86, jump and slide windows of .6 s, forks and one-way
   turns that swap the hall theme at the midpoint of a 1.05 s doorway transition (the screen is black at that instant, so nothing pops), a threat meter that a hit raises by half and time bleeds off,
   candles worth ten, lightning, bats. The renderer (part 02) reads these every frame and never writes them; the only additions are the mode
   (a title card before the first run) and the event queue EV the picture and the synth consume. Opens ghosts(); part 03 closes it. */
  function ghosts(api){
    var g = {}, t, speed, dist, candles, lane, px, jump, slide, objs, spawnT, alive, score, tiles, flick, threat, stumble, theme, turnT, turnDir, quiet, forkT, halls, ghostBob, light, lightT, dust, bats, batT, TURN_T = 1.05, mode = 'menu', played = 0, EV = [], R = null, snd = Synth();
    var PZ = .86;
    var THEMES = [ { wall:'#2a2436', wall2:'#171320', floor:'#3a3147', trim:'#5a4d6e', rug:'#5a1f2e', name:'the great hall' }, { wall:'#33222a', wall2:'#1d1418', floor:'#432b34', trim:'#7a4a55', rug:'#2a3a1f', name:'the library' }, { wall:'#1e2a2a', wall2:'#111c1b', floor:'#28393a', trim:'#3f6a66', rug:'#3a1f3a', name:'the crypt' }, { wall:'#2e2a1c', wall2:'#1c1a10', floor:'#3d3724', trim:'#7a6b3a', rug:'#4a1f1f', name:'the kitchen' } ];
    function emit(type, o){ o = o || {}; o.type = type; EV.push(o); }
    g.reset = function(){ t = 0; speed = .46; dist = 0; candles = 0; lane = 1; px = 1; jump = 0; slide = 0; objs = []; spawnT = .8; alive = true; score = 0; tiles = 0; flick = 0; threat = 0; stumble = 0; theme = 0; turnT = 0; turnDir = 0; quiet = 0; forkT = 7; halls = 0; ghostBob = 0; light = 0; lightT = rnd(3, 7); dust = []; for(var di = 0; di < 26; di++) dust.push({ x:Math.random(), y:Math.random(), s:rnd(.6, 1.6), ph:rnd(0, 7) }); bats = []; batT = rnd(4, 9); api.score(0);
      mode = played ? 'run' : 'menu'; api.status(mode === 'menu' ? 'Ghost Run  \u00b7  play when you are ready' : api.touch ? 'swipe to dodge, the ghosts are close' : 'arrows dodge, up jumps, down slides'); emit('reset'); if(R) R.reset(); };   /* the title card once; after a run the restart button drops you straight back into the house */
    function start(){ if(mode !== 'menu') return; mode = 'run'; played++; t = 0; api.status(api.touch ? 'swipe to dodge, the ghosts are close' : 'arrows dodge, up jumps, down slides'); emit('start'); }
    function toMenu(){ g.reset(); mode = 'menu'; api.status('Ghost Run  \u00b7  play when you are ready'); }
    g.inMenu = function(){ return mode === 'menu'; };
    function spawn(){ var r = Math.random(), l = ri(0, 2), z = 0.001;
      if(r < .27) objs.push({ k:'low', l:l, z:z }); else if(r < .48) objs.push({ k:'high', l:l, z:z }); else if(r < .7) objs.push({ k:'wall', l:l, z:z }); else { var l2 = ri(0, 2); for(var i = 0; i < 4; i++) objs.push({ k:'candle', l:l2, z:z - i*.05 }); }
      if(Math.random() < .2 + speed*.18){ var l3 = (l + ri(1, 2)) % 3; objs.push({ k:Math.random() < .5 ? 'low' : 'wall', l:l3, z:z - .012 }); } }
    function fork(){ var one = Math.random() < .4; objs.push({ k:one ? 'turn' : 'fork', l:1, z:0.001, dir:Math.random() < .5 ? -1 : 1 }); quiet = 2.6 / speed * .5 + .9; }
    g.key = function(k, down){ if(!down) return false; if(mode === 'menu'){ if(k === 'Enter' || k === ' '){ start(); return true; } return false; } if(!alive) return false; if(k === 'm' || k === 'M'){ snd.toggle(); return true; } var d = isDir(k); if(!d) return false; if(turnT > 0) return true;
      if(d === 'L') lane = Math.max(0, lane - 1); if(d === 'R') lane = Math.min(2, lane + 1); if(d === 'U' && !jump && !slide){ jump = .6; snd.jump(); emit('jump'); } if(d === 'D' && !jump && !slide){ slide = .6; snd.slide(); emit('slide'); } return true; };
    function hit(){ if(stumble > 0) return; stumble = .55; threat += .5; speed = Math.max(.42, speed*.82); snd.hit(); emit('hit'); if(threat >= 1){ alive = false; snd.dead(); emit('dead'); api.over(dist > 2500 ? 'The ghosts caught up after a long run' : 'The ghosts got you'); } }
    function turnHall(dir, one){ turnDir = dir; turnT = TURN_T; objs = []; quiet = 1.3; halls++; lane = dir < 0 ? 0 : 2; snd.door(); emit('turn', { dir:dir, one:!!one }); }   /* the runner heads INTO the chosen archway: the render keeps the wall and slides it past the camera, the screen falls dark inside it, and the next hall swings in from the turn */
    g.update = function(dt){
      if(mode === 'menu'){ t += dt; ghostBob += dt; flick += dt; dust.forEach(function(d){ d.y += dt*(.05 + d.s*.03); if(d.y > 1){ d.y = 0; d.x = Math.random(); } }); return; }
      if(!alive) return; t += dt; ghostBob += dt; speed = Math.min(1.7, speed + dt*.02); dist += speed*dt*60; tiles = (tiles + speed*dt*1.6) % 1; flick += dt; threat = Math.max(0, threat - dt*.11); if(stumble > 0) stumble -= dt;
      px += (lane - px)*Math.min(1, dt*12); if(jump > 0) jump -= dt; if(slide > 0) slide -= dt;
      if(turnT > 0){ var was = turnT, mid = TURN_T*.5; turnT -= dt; if(was > mid && turnT <= mid){ theme = (theme + 1) % THEMES.length; px = 1; lane = 1; emit('theme', { theme:theme }); } }
      lightT -= dt; if(lightT <= 0){ light = 1; lightT = rnd(4, 11); snd.thunder(); emit('light'); } light = Math.max(0, light - dt*2.2);
      dust.forEach(function(d){ d.y += dt*(.05 + d.s*.03); d.x += Math.sin(t*.8 + d.ph)*dt*.02; if(d.y > 1){ d.y = 0; d.x = Math.random(); } });
      batT -= dt; if(batT <= 0){ batT = rnd(5, 12); var bd = Math.random() < .5 ? 1 : -1; for(var bi = 0; bi < ri(2, 4); bi++) bats.push({ x:bd < 0 ? W + 20 + bi*30 : -20 - bi*30, y:rnd(20, H*.34*.7), vx:bd*rnd(140, 220), ph:rnd(0, 7) }); snd.bats(); emit('bats'); }
      bats.forEach(function(b){ b.x += b.vx*dt; b.y += Math.sin(t*6 + b.ph)*30*dt; }); bats = bats.filter(function(b){ return b.x > -60 && b.x < W + 60; });
      if(quiet > 0) quiet -= dt; forkT -= dt;
      if(quiet <= 0){ spawnT -= dt; if(forkT <= 0 && !objs.some(function(o){ return o.k === 'fork' || o.k === 'turn'; })){ fork(); forkT = rnd(8, 13); } else if(spawnT <= 0){ spawn(); spawnT = clamp(1.05 - speed*.32, .38, 1.05); } }
      for(var i = objs.length - 1; i >= 0; i--){ var o = objs[i]; o.z += speed*dt; if(o.z > 1.08){ objs.splice(i, 1); continue; }
        if(!o.hit && o.z > PZ - .03 && o.z < PZ + .03){
          if(o.k === 'fork' || o.k === 'turn'){ o.hit = true; if(o.k === 'fork'){ if(lane === 1){ hit(); if(!alive) return; turnHall(Math.random() < .5 ? -1 : 1); } else turnHall(lane === 0 ? -1 : 1); } else turnHall(o.dir, true); break; }
          if(Math.abs(o.l - px) < .5){ o.hit = true;
            if(o.k === 'candle'){ candles++; score += 10; o.z = 9; snd.candle(); emit('candle', { l:o.l }); }
            else if((o.k === 'low' && jump > 0) || (o.k === 'high' && slide > 0)) {}
            else { hit(); if(!alive) return; } } } }
      snd.step(dt, speed, jump <= 0 && slide <= 0 && turnT <= 0); snd.drone(threat);
      api.score(Math.floor(dist/10) + score); api.status(Math.floor(dist)+' m  \u00b7  '+candles+' candles  \u00b7  '+THEMES[theme].name);
    };
/* tigOS arcade, Ghost Run part 02: the picture. One unit of the sim's depth is 40 m of corridor: the runner stands at z = 0, obstacles ride in
   from -34 m and pass behind the camera. The hall is one long box (floorboards, wallpaper, wainscot, beamed ceiling, a moonlit window at the
   far end in the fog) whose textures scroll with the run, sconces and portraits cycling down the walls, four pooled candle lights following the
   nearest sconces so the light count never changes. Every obstacle kind has a pool of Blender props (boxy stand-ins until the glb lands),
   three ghosts rise behind you with the threat, bats cross overhead, dust floats, lightning flashes the window and the room. */
    var LANE_W = 1.5, HALL_W = 5.4, HALL_H = 4.6, DEPTH = 40, frameDt = 0, vw = 2, vh = 2, soft = false, hudEl = null, menuEl = null, last = {}, tmpV = null, scrollZ = 0, door = null, darkK = 0;   /* door: the wall being run through ({ dir, one }); darkK: how black the doorway blackout is this frame (the HUD paints it) */
    function lx(l){ return (l - 1)*LANE_W; } function dz(z){ return (z - PZ)*DEPTH; }
    function Picture(){
      var THREE = window.THREE; tmpV = new THREE.Vector3();
      var renderer = new THREE.WebGLRenderer({ canvas:api.canvas, antialias:false, powerPreference:'high-performance', alpha:false, stencil:false });
      renderer.info.autoReset = false; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
      try { var gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), rn = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(rn); } catch(e){}
      if(/[?&]gl=1/.test(location.search)) soft = false;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0810); scene.fog = new THREE.FogExp2(0x0a0810, .034);
      var camera = new THREE.PerspectiveCamera(62, 9/16, .05, 120); scene.add(camera);
      /* ---- textures: wallpaper damask, floorboards, a rug with its diamonds, ceiling beams, the moon window, paintings, a bat and a soft dot; all neutral so the theme tints them ---- */
      function ctex(w, h, fn, rep){ var c = mk(w, h); fn(c.getContext('2d'), w, h); var tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; if(rep) tx.repeat.set(rep[0], rep[1]); tx.canvas = c; return tx; }
      var T = {};
      T.paper = ctex(256, 256, function(x, w, h){ x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.16)'; for(var r = 0; r < 4; r++) for(var c = 0; c < 4; c++){ var cx = c*64 + (r % 2 ? 32 : 0), cy = r*64 + 32; x.beginPath(); x.ellipse(cx, cy, 14, 22, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx, cy, 22, 10, 0, 0, 7); x.fill(); } grain(x, w, h, .18, 3000); x.fillStyle = 'rgba(0,0,0,.25)'; for(var s = 0; s < 8; s++){ x.beginPath(); x.moveTo(srand()*w, 0); x.lineTo(srand()*w, srand()*60); x.lineTo(srand()*w, 0); x.fill(); } }, [1, 1]);
      T.boards = ctex(256, 256, function(x, w, h){ x.fillStyle = '#a89888'; x.fillRect(0, 0, w, h); for(var b = 0; b < 4; b++){ x.fillStyle = 'hsl(28 18% '+(52 + srand()*14)+'%)'; x.fillRect(b*64 + 1, 0, 62, h); x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(b*64, 0, 2, h); x.fillRect(b*64 + 4, (srand()*h)|0, 56, 2); for(var g = 0; g < 14; g++){ x.strokeStyle = 'rgba(0,0,0,'+(.06 + srand()*.12)+')'; x.lineWidth = 1; x.beginPath(); x.moveTo(b*64 + 4 + srand()*56, 0); x.bezierCurveTo(b*64 + 4 + srand()*56, h*.3, b*64 + 4 + srand()*56, h*.7, b*64 + 4 + srand()*56, h); x.stroke(); } } grain(x, w, h, .14, 2000); }, [2, 24]);
      T.rug = ctex(128, 256, function(x, w, h){ x.fillStyle = '#b0b0b0'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,220,140,.45)'; x.fillRect(6, 0, 4, h); x.fillRect(w - 10, 0, 4, h); for(var d = 0; d < 4; d++){ var cy = d*64 + 32; x.beginPath(); x.moveTo(64, cy - 22); x.lineTo(84, cy); x.lineTo(64, cy + 22); x.lineTo(44, cy); x.closePath(); x.fill(); } grain(x, w, h, .2, 1500); }, [1, 12]);
      T.ceiling = ctex(256, 256, function(x, w, h){ x.fillStyle = '#6a6060'; x.fillRect(0, 0, w, h); grain(x, w, h, .2, 3000); x.fillStyle = '#2a2020'; x.fillRect(0, 0, w, 26); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 2, w, 3); for(var i = 0; i < 9; i++){ x.fillStyle = 'rgba(60,40,20,'+(.1 + srand()*.15)+')'; x.beginPath(); x.ellipse(srand()*w, 40 + srand()*200, 30 + srand()*50, 20 + srand()*30, srand()*3, 0, 7); x.fill(); } }, [2, 18]);
      T.moon = ctex(128, 160, function(x, w, h){ x.fillStyle = '#0e0c18'; x.fillRect(0, 0, w, h); x.fillStyle = '#cfd6ff'; x.beginPath(); x.arc(76, 58, 26, 0, 7); x.fill(); x.fillStyle = '#0e0c18'; x.beginPath(); x.arc(88, 50, 24, 0, 7); x.fill(); for(var i = 0; i < 20; i++){ x.fillStyle = 'rgba(255,255,255,'+(.4 + srand()*.5)+')'; x.fillRect(srand()*w, srand()*h*.7, 1.5, 1.5); } x.fillStyle = '#3a3040'; x.fillRect(60, 0, 8, h); x.fillRect(0, 76, w, 6); }); T.moon.wrapS = T.moon.wrapT = THREE.ClampToEdgeWrapping;
      T.soft = ctex(64, 64, function(x, w, h){ var g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); T.soft.colorSpace = THREE.NoColorSpace;
      T.web = ctex(128, 128, function(x, w, h){ x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = .7; for(var r = 1; r <= 5; r++){ x.beginPath(); x.arc(0, 0, r*24, 0, Math.PI/2); x.stroke(); } for(var a = 0; a <= 6; a++){ var an = a*Math.PI/12; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an)*128, Math.sin(an)*128); x.stroke(); } }); T.web.wrapS = T.web.wrapT = THREE.ClampToEdgeWrapping;
      var paintings = [];
      [['#3a2a4a', '#b08a6a'], ['#2a3a3a', '#a09a80'], ['#4a2a2a', '#c0a080'], ['#2a2a4a', '#9a8a90']].forEach(function(pal, i){ paintings.push(ctex(128, 176, function(x, w, h){ x.fillStyle = pal[0]; x.fillRect(0, 0, w, h); var g = x.createRadialGradient(64, 80, 10, 64, 80, 90); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = '#151018'; x.beginPath(); x.ellipse(64, 130, 40, 44, 0, 0, 7); x.fill(); x.fillStyle = pal[1]; x.beginPath(); x.ellipse(64, 70, 22 + i*2, 28, 0, 0, 7); x.fill(); x.fillStyle = '#151018'; x.beginPath(); x.ellipse(64, 48 - i*2, 26, 14, 0, 0, 7); x.fill();
        x.fillStyle = '#f4f1ea'; x.beginPath(); x.ellipse(55, 68, 4, 3, 0, 0, 7); x.ellipse(73, 68, 4, 3, 0, 0, 7); x.fill(); x.fillStyle = '#ff5f57'; x.beginPath(); x.arc(55, 68, 1.5, 0, 7); x.arc(73, 68, 1.5, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(58, 80, 12, 2); grain(x, w, h, .22, 1600); })); paintings[i].wrapS = paintings[i].wrapT = THREE.ClampToEdgeWrapping; paintings[i].flipY = false; });   /* glTF UVs put v = 0 at the top of the image, so the paintings ship unflipped; the stand-in flips its own UVs to match */
      function std(o){ return new THREE.MeshStandardMaterial(o); }
      var M = { wall:std({ map:T.paper, roughness:.95 }), floor:std({ map:T.boards, roughness:.8 }), rug:std({ map:T.rug, roughness:1 }), ceiling:std({ map:T.ceiling, roughness:1 }), trim:std({ roughness:.6 }), dark:std({ color:0x07060c, roughness:1 }), moon:new THREE.MeshStandardMaterial({ map:T.moon, emissive:0xffffff, emissiveMap:T.moon, emissiveIntensity:.9, roughness:.5 }), void:new THREE.MeshBasicMaterial({ color:0x07060c }), web:new THREE.MeshBasicMaterial({ map:T.web, transparent:true, opacity:.32, depthWrite:false, side:THREE.DoubleSide }) };
      /* ---- the hall ---- */
      var LEN = 58, Z0 = -46, hall = new THREE.Group(); scene.add(hall);
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, LEN), M.floor); floor.rotation.x = -Math.PI/2; floor.position.set(0, 0, Z0 + LEN/2); hall.add(floor);
      var rug = new THREE.Mesh(new THREE.PlaneGeometry(LANE_W*.84, LEN), M.rug); rug.rotation.x = -Math.PI/2; rug.position.set(0, .012, Z0 + LEN/2); hall.add(rug);
      var ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, LEN), M.ceiling); ceil.rotation.x = Math.PI/2; ceil.position.set(0, HALL_H, Z0 + LEN/2); hall.add(ceil);
      [-1, 1].forEach(function(sd){ var wall = new THREE.Mesh(new THREE.PlaneGeometry(LEN, HALL_H), M.wall); wall.rotation.y = sd < 0 ? Math.PI/2 : -Math.PI/2; wall.position.set(sd*HALL_W/2, HALL_H/2, Z0 + LEN/2); wall.material.map.repeat.set(LEN/3, HALL_H/3); hall.add(wall);
        var wain = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.1, LEN), M.trim); wain.position.set(sd*(HALL_W/2 - .04), .55, Z0 + LEN/2); hall.add(wain); var rail = new THREE.Mesh(new THREE.BoxGeometry(.14, .08, LEN), M.trim); rail.position.set(sd*(HALL_W/2 - .07), 1.14, Z0 + LEN/2); hall.add(rail);
        var cove = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, LEN), M.trim); cove.position.set(sd*(HALL_W/2 - .08), HALL_H - .08, Z0 + LEN/2); hall.add(cove); });
      var farWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_H), M.wall); farWall.position.set(0, HALL_H/2, Z0 + .01); hall.add(farWall);
      var moon = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), M.moon); moon.position.set(0, 2.8, Z0 + .05); hall.add(moon);
      [-1, 1].forEach(function(sd){ var web = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), M.web); web.position.set(sd*(HALL_W/2 - .7), HALL_H - .7, sd < 0 ? -9 : -21); if(sd > 0) web.scale.x = -1; hall.add(web); });   /* the texture's corner is its top left, so the web hangs from the wall and ceiling junction */
      /* ---- lights: a hemisphere so the walls read, the moon from the far end, the lantern in the runner's hand, four candle lights that follow the nearest sconces, one lightning light at zero ---- */
      var hemi = new THREE.HemisphereLight(0x7a6a9a, 0x2a2028, 1.15); scene.add(hemi);
      var moonL = new THREE.DirectionalLight(0x8fa0ff, .6); moonL.position.set(0, 6, -40); moonL.target.position.set(0, 0, 0); scene.add(moonL); scene.add(moonL.target);
      var lantL = new THREE.PointLight(0xffb060, 4.2, 12, 1.5); scene.add(lantL);
      var candleL = []; for(var ci = 0; ci < 4; ci++){ var cl = new THREE.PointLight(0xffa040, 2.2, 8, 1.6); scene.add(cl); candleL.push(cl); }
      var boltL = new THREE.DirectionalLight(0xdfe8ff, 0); boltL.position.set(2, 8, -20); scene.add(boltL);
      /* ---- wall props: sconces and portraits alternate every 6 m down each wall and cycle with the scroll ---- */
      var stdMat = function(col, o){ return new THREE.MeshStandardMaterial(Object.assign({ color:col, roughness:.7, metalness:.1 }, o || {})); };
      function standIn(kind){ var g = new THREE.Group(), m;
        if(kind === 'runner'){ var hood = stdMat(0x4a2a6a), skin = stdMat(0xf2c9a0), pants = stdMat(0x2b2b33); var root = new THREE.Group(); root.name = 'Root'; g.add(root); ['HipL', 'HipR'].forEach(function(n, i){ var hp = new THREE.Group(); hp.name = n; hp.position.set(i ? .11 : -.11, .78, 0); root.add(hp); var lg = new THREE.Mesh(new THREE.BoxGeometry(.14, .74, .16), pants); lg.position.y = -.37; hp.add(lg); }); var to = new THREE.Group(); to.name = 'Torso'; to.position.y = .78; root.add(to); var body = new THREE.Mesh(new THREE.BoxGeometry(.4, .54, .26), hood); body.position.y = .27; to.add(body); ['ShoulderL', 'ShoulderR'].forEach(function(n, i){ var sh = new THREE.Group(); sh.name = n; sh.position.set(i ? .24 : -.24, .48, 0); to.add(sh); var am = new THREE.Mesh(new THREE.BoxGeometry(.12, .52, .12), hood); am.position.y = -.26; sh.add(am); if(i){ var la = new THREE.Group(); la.name = 'Lantern'; la.position.set(0, -.6, .1); sh.add(la); var lb = new THREE.Mesh(new THREE.BoxGeometry(.12, .16, .12), new THREE.MeshStandardMaterial({ color:0xffb060, emissive:0xffb040, emissiveIntensity:2 })); lb.position.y = -.1; la.add(lb); } }); var hd = new THREE.Group(); hd.name = 'Head'; hd.position.y = 1.3; root.add(hd); var face = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 9), skin); face.position.y = .14; hd.add(face); return g; }
        if(kind === 'ghost'){ m = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .7, 4, 12), new THREE.MeshStandardMaterial({ color:0xe8e6f5, transparent:true, opacity:.8, emissive:0x6a6aa0, emissiveIntensity:.5 })); m.position.y = .65; m.material.name = 'Ghost'; g.userData.mats = [m.material]; g.add(m); return g; }
        if(kind === 'witch'){ m = new THREE.Mesh(new THREE.ConeGeometry(.34, .9, 10), stdMat(0x1a1424)); m.position.y = .45; g.add(m); var br = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.6, 6), stdMat(0x7a4a1e)); br.rotation.z = Math.PI/2; g.add(br); var hd2 = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), stdMat(0x7fd66a)); hd2.position.y = .92; g.add(hd2); return g; }
        if(kind === 'coffin'){ m = new THREE.Mesh(new THREE.BoxGeometry(1.3, .5, .64), stdMat(0x4a3222)); m.position.y = .25; g.add(m); return g; }
        if(kind === 'armor'){ m = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.7, .5), stdMat(0x8c8c9a, { metalness:.4, roughness:.4 })); m.position.y = .95; g.add(m); var h2 = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), stdMat(0x5a5a68, { metalness:.4 })); h2.position.y = 1.95; g.add(h2); return g; }
        if(kind === 'candle'){ m = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .3, 8), stdMat(0xf4e3b0)); m.position.y = .35; g.add(m); var fl = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshStandardMaterial({ color:0xffb040, emissive:0xffb040, emissiveIntensity:2.6 })); fl.position.y = .55; fl.material.name = 'Flame'; g.add(fl); return g; }
        if(kind === 'arch'){ [-1, 1].forEach(function(sd){ var p = new THREE.Mesh(new THREE.BoxGeometry(.22, 2.6, .3), stdMat(0x66606a)); p.position.set(sd*.86, 1.3, 0); g.add(p); }); var top = new THREE.Mesh(new THREE.BoxGeometry(1.94, .3, .3), stdMat(0x66606a)); top.position.y = 2.75; g.add(top); return g; }
        if(kind === 'sconce'){ m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .2, 8), stdMat(0xf4e3b0)); m.position.set(0, .14, -.2); g.add(m); var fl2 = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), new THREE.MeshStandardMaterial({ color:0xffb040, emissive:0xffb040, emissiveIntensity:2.6 })); fl2.position.set(0, .28, -.2); fl2.material.name = 'Flame'; g.add(fl2); return g; }
        if(kind === 'portrait'){ var pg = new THREE.PlaneGeometry(.9, 1.24), puv = pg.attributes.uv; for(var ui = 0; ui < puv.count; ui++) puv.setY(ui, 1 - puv.getY(ui)); m = new THREE.Mesh(pg, stdMat(0x6b5a7a)); m.material.name = 'Canvas'; m.position.z = .01; g.add(m); var fr = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.38, .06), stdMat(0x8a6a2a, { metalness:.3 })); fr.position.z = -.02; g.add(fr); g.userData.mats = [m.material]; return g; }
        if(kind === 'bat'){ m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), stdMat(0x0a0810)); g.add(m); ['WingL', 'WingR'].forEach(function(n, i){ var wg = new THREE.Group(); wg.name = n; g.add(wg); var wm = new THREE.Mesh(new THREE.PlaneGeometry(.4, .2), stdMat(0x0a0810, { side:THREE.DoubleSide })); wm.position.x = i ? .22 : -.22; wg.add(wm); }); return g; }
        return g; }
      var NODE = { runner:'runner', ghost:'ghost', witch:'witch', coffin:'coffin', armor:'armor', candle:'candle', arch:'arch', sconce:'sconce', portrait:'portrait', bat:'bat' };
      function prop(kind){ var sc = MODELS.haunt, m = sc ? cloneNode(sc, NODE[kind]) : null; if(!m) m = standIn(kind); m.userData.kind = kind; m.userData.model = !!sc && !!sc.getObjectByName(NODE[kind]); return m; }
      function clearGroup(grp){ while(grp.children.length){ var c = grp.children[0]; grp.remove(c); c.traverse(function(o){ if(o.isMesh){ [].concat(o.material).forEach(function(m){ if(!m.userData.shared) m.dispose(); }); } }); } }
      /* a pool: n slots of one prop kind, each a Group holding the prop so the prop can be swapped when the glb lands */
      function Pool(kind, n, fn){ var slots = []; for(var i = 0; i < n; i++){ var slot = new THREE.Group(); slot.visible = false; slot.userData.i = i; slot.add(prop(kind)); if(fn) fn(slot); scene.add(slot); slots.push(slot); }
        return { slots:slots, kind:kind, used:0, begin:function(){ this.used = 0; }, take:function(){ if(this.used >= n) return null; var s = slots[this.used++]; s.visible = true; return s; }, end:function(){ for(var i = this.used; i < n; i++) slots[i].visible = false; }, reload:function(){ slots.forEach(function(s){ clearGroup(s); s.add(prop(kind)); if(fn) fn(s); }); } }; }
      var pools = { low:Pool('coffin', 6), high:Pool('witch', 4), wall:Pool('armor', 6), candle:Pool('candle', 12), arch:Pool('arch', 2), sconce:Pool('sconce', 8), portrait:Pool('portrait', 6, function(s){ var mats = s.children[0].userData.mats || []; mats.filter(function(m){ return m.name === 'Canvas'; }).forEach(function(m){ m.map = paintings[s.userData.i % paintings.length]; m.color.setHex(0xffffff); m.needsUpdate = true; }); }), bat:Pool('bat', 6) };
      /* the fork: a wall across the hall with the two arch openings (or one, for a turn) and a portrait between them */
      var forkWall = new THREE.Group(); forkWall.visible = false; scene.add(forkWall); var fwPanel = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, HALL_H, .3), M.wall); fwPanel.position.set(0, HALL_H/2, -.15); forkWall.add(fwPanel);
      var holeShape = new THREE.Shape(); holeShape.moveTo(-.75, 0); holeShape.lineTo(-.75, 1.85); holeShape.absarc(0, 1.85, .75, Math.PI, 0, true); holeShape.lineTo(.75, 0); holeShape.closePath(); var holeGeo = new THREE.ShapeGeometry(holeShape, 14);
      var fwHoles = [-1, 1].map(function(sd){ var hole = new THREE.Mesh(holeGeo, M.void); hole.position.set(sd*LANE_W, 0, .006); forkWall.add(hole); return { hole:hole }; });   /* the openings: black shapes on the wall face, the arch prop framing each */
      var fwTrim = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, .12, .36), M.trim); fwTrim.position.set(0, HALL_H - .06, -.15); forkWall.add(fwTrim);
      var arrowTex = { }; function arrowMat(dir){ var k = dir < 0 ? 'l' : 'r'; if(!arrowTex[k]){ var c = mk(128, 64); text(c.getContext('2d'), dir < 0 ? '\u2190' : '\u2192', 64, 32, 52, '#f4e3b0', 'center', 800); var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; arrowTex[k] = new THREE.MeshBasicMaterial({ map:tx, transparent:true }); } return arrowTex[k]; }
      var arrowSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .55), arrowMat(1)); arrowSign.position.set(0, 3.5, .2); forkWall.add(arrowSign); var fwPortrait = prop('portrait'); fwPortrait.position.set(0, 2.2, .18); (fwPortrait.userData.mats || []).filter(function(m){ return m.name === 'Canvas'; }).forEach(function(m){ m.map = paintings[2]; m.color.setHex(0xffffff); }); forkWall.add(fwPortrait);
      /* ---- the runner, the ghosts, the dust ---- */
      var runner = new THREE.Group(), body = null, J = {}; scene.add(runner);
      function setRunner(){ clearGroup(runner); body = prop('runner'); runner.add(body); ['Root', 'Torso', 'Head', 'ShoulderL', 'ShoulderR', 'HipL', 'HipR', 'Lantern'].forEach(function(n){ J[n] = body.getObjectByName(n) || null; }); }
      var ghostsG = []; for(var gi = 0; gi < 3; gi++){ var gg = new THREE.Group(); gg.add(prop('ghost')); scene.add(gg); ghostsG.push(gg); }
      function setGhosts(){ ghostsG.forEach(function(gg){ clearGroup(gg); gg.add(prop('ghost')); }); }
      var dustGeo = new THREE.BufferGeometry(), dustPos = new Float32Array(26*3); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3)); var dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map:T.soft, color:0xbbbbcc, size:.06, transparent:true, opacity:.5, depthWrite:false, sizeAttenuation:true })); dustPts.frustumCulled = false; scene.add(dustPts);
      var candleGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(1.8, 1.2, .5), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); candleGlow.scale.set(1.2, 1.2, 1); scene.add(candleGlow); var glowT = 0;
      function rebuildProps(){ setRunner(); setGhosts(); Object.keys(pools).forEach(function(k){ pools[k].reload(); }); forkWall.remove(fwPortrait); fwPortrait = prop('portrait'); fwPortrait.position.set(0, 2.2, .18); (fwPortrait.userData.mats || []).filter(function(m){ return m.name === 'Canvas'; }).forEach(function(m){ m.map = paintings[2]; m.color.setHex(0xffffff); }); forkWall.add(fwPortrait); uploadScene(); }
      var onModel = function(){ rebuildProps(); }; MODELS.listeners.push(onModel);
      /* ---- post ---- */
      var composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(320, 180), .45, .5, .85); composer.addPass(bloom); composer.addPass(new THREE.OutputPass());
      var auto = { level:0, samples:[], last:0, p50:0, windows:0 }, AUTO_K = [1, .8, .62, .5];
      function applyGfx(){ var tier = soft ? 'low' : SET.gfx, dpr = window.devicePixelRatio || 1, pr = (soft ? .3 : { low:.55, medium:.8, high:Math.min(1.5, dpr), ultra:Math.min(2, dpr) }[tier])*AUTO_K[auto.level]; renderer.setPixelRatio(pr); composer.setPixelRatio(pr); bloom.enabled = (tier !== 'low' && auto.level < 3) || /[?&]gl=1/.test(location.search); bloom.strength = tier === 'ultra' ? .55 : .45; if(vw > 2) P.resize(vw, vh); }
      function uploadScene(){ try { var culled = [], hidden = []; scene.traverse(function(o){ if((o.isMesh || o.isSprite || o.isPoints) && o.frustumCulled){ o.frustumCulled = false; culled.push(o); } if(o.visible === false && !o.isLight){ o.visible = true; hidden.push(o); } }); renderer.setRenderTarget(bloom.enabled ? composer.readBuffer : null); renderer.render(scene, camera); culled.forEach(function(o){ o.frustumCulled = true; }); hidden.forEach(function(o){ o.visible = false; }); } catch(e){} finally { try { renderer.setRenderTarget(null); } catch(e2){} } }   /* into the real target: programs are keyed by it */
      /* ---- theme colours, eased over the swap ---- */
      var col = { wall:new THREE.Color(), floor:new THREE.Color(), trim:new THREE.Color(), rug:new THREE.Color(), bg:new THREE.Color() }, tgt = {}, themeK = 1;
      function setTheme(i, snap){ var Th = THEMES[i]; tgt = { wall:new THREE.Color(Th.wall), floor:new THREE.Color(Th.floor), trim:new THREE.Color(Th.trim), rug:new THREE.Color(Th.rug), bg:new THREE.Color(Th.wall2) }; if(snap){ Object.keys(tgt).forEach(function(k){ col[k].copy(tgt[k]); }); themeK = 1; } else themeK = 0; applyTheme(); }
      function applyTheme(){ M.wall.color.copy(col.wall).multiplyScalar(3.0); M.floor.color.copy(col.floor).multiplyScalar(2.6); M.rug.color.copy(col.rug).multiplyScalar(2.4); M.trim.color.copy(col.trim).multiplyScalar(1.6); M.ceiling.color.copy(col.wall).multiplyScalar(1.8); scene.background.copy(col.bg); scene.fog.color.copy(col.bg); }
      var P = { scene:scene, camera:camera, renderer:renderer, bloom:bloom, soft:function(){ return soft; }, auto:function(){ return { level:auto.level, p50:+auto.p50.toFixed(1), pr:renderer.getPixelRatio() }; }, pools:pools, runner:function(){ return { body:body, J:J }; }, ghosts:ghostsG, forkWall:forkWall,
        resize:function(w, h){ vw = w; vh = h; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); },
        applySettings:function(){ applyGfx(); snd.volume(SET.vol); },
        reset:function(){ scrollZ = 0; setTheme(0, true); camYaw = 0; door = null; darkK = 0; }, cam:function(){ return { yaw:+camYaw.toFixed(3), x:+camera.position.x.toFixed(2), z:+camera.position.z.toFixed(2), dark:+darkK.toFixed(2) }; },
        project:function(x, y, z){ tmpV.set(x, y, z || 0).project(camera); return { x:(tmpV.x + 1)/2*vw, y:(1 - tmpV.y)/2*vh, z:tmpV.z }; },
        upload:uploadScene, dispose:function(){ var li = MODELS.listeners.indexOf(onModel); if(li >= 0) MODELS.listeners.splice(li, 1); try { composer.dispose && composer.dispose(); } catch(e){} try { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } catch(e){} },
        frame:function(dt){ frame(dt); } };
      /* ---- the frame ---- */
      var camYaw = 0, camPos = new THREE.Vector3(0, 2.4, 4.6), look = new THREE.Vector3(0, 1.3, -6), boltK = 0, batPhase = 0, menuSpin = 0;
      function frame(dt){ renderer.info.reset();
        for(var e = 0; e < EV.length; e++){ var ev = EV[e]; if(ev.type === 'theme') setTheme(ev.theme, false); else if(ev.type === 'turn') door = { dir:ev.dir, one:ev.one }; else if(ev.type === 'reset' || ev.type === 'start'){ setTheme(theme, true); scrollZ = 0; door = null; darkK = 0; } else if(ev.type === 'candle'){ candleGlow.position.set(lx(ev.l), .7, 0); glowT = .35; } } EV.length = 0;
        if(themeK < 1){ themeK = Math.min(1, themeK + dt*2.5); Object.keys(tgt).forEach(function(k){ col[k].lerp(tgt[k], Math.min(1, dt*6)); }); applyTheme(); }
        var running = mode === 'run' && alive; if(running) scrollZ += speed*dt*DEPTH;
        M.floor.map.offset.y = -(scrollZ/(LEN/24)) % 1; M.rug.map.offset.y = -(scrollZ/(LEN/12)) % 1; M.ceiling.map.offset.y = (scrollZ/(LEN/18)) % 1; M.wall.map.offset.x = (scrollZ/3) % 1;
        /* wall props cycle down the hall: sconce, portrait, sconce ... every 6 m on each wall */
        pools.sconce.begin(); pools.portrait.begin(); var near = []; for(var side = -1; side <= 1; side += 2) for(var i = 0; i < 9; i++){ var zz = ((i*6 + scrollZ + (side < 0 ? 0 : 3)) % 54) - 48; if(zz > 8) continue; var isS = i % 2 === 0, slot = isS ? pools.sconce.take() : pools.portrait.take(); if(!slot) continue;
          slot.position.set(side*(HALL_W/2 - (isS ? .12 : .06)), isS ? 2.0 : 2.3, zz); slot.rotation.y = (isS ? -1 : 1)*(side < 0 ? Math.PI/2 : -Math.PI/2); if(isS) near.push({ z:zz, x:slot.position.x*.9 }); }
        pools.sconce.end(); pools.portrait.end(); near.sort(function(a, b){ return Math.abs(a.z) - Math.abs(b.z); }); candleL.forEach(function(cl, i){ var n = near[i]; if(n){ cl.position.set(n.x, 2.35, n.z); cl.intensity = 2.0 + Math.sin(flick*11 + i*2)*.4; } else cl.intensity = 0; });
        /* obstacles: each sim object takes a slot in its kind's pool */
        Object.keys(pools).forEach(function(k){ if(k !== 'sconce' && k !== 'portrait' && k !== 'bat') pools[k].begin(); }); var fk = null;
        for(var oi = 0; oi < objs.length; oi++){ var o = objs[oi]; if(o.z <= 0 || o.z > 1.06) continue; if(o.k === 'fork' || o.k === 'turn'){ fk = o; continue; } var pl = pools[o.k]; if(!pl) continue; var s = pl.take(); if(!s) continue; s.position.set(lx(o.l), 0, dz(o.z)); s.rotation.set(0, 0, 0);
          if(o.k === 'high'){ s.position.y = 1.15 + Math.sin(t*5 + o.z*9)*.12; s.rotation.z = Math.sin(t*7 + o.z*4)*.12; s.rotation.y = o.l < 1 ? -.3 : o.l > 1 ? .3 : 0; } else if(o.k === 'candle'){ s.position.y = .05 + Math.sin(flick*10 + o.z*7)*.01; } }
        Object.keys(pools).forEach(function(k){ if(k !== 'sconce' && k !== 'portrait' && k !== 'bat') pools[k].end(); });
        /* the doorway: progress 0..1 over TURN_T. First half: the wall the runner just reached slides on past the camera (smoothstep), the camera follows the runner into the chosen arch and turns toward it,
           and the picture blacks out as the wall meets the lens. The sim swaps the theme at .5, under the black. Second half: the black lifts and the new hall swings in from the side the turn came from. */
        var prog = turnT > 0 ? 1 - turnT/TURN_T : 0, ent = turnT > 0 ? clamp(prog/.5, 0, 1) : 0, ee = ent*ent*(3 - 2*ent), ex = turnT > 0 ? clamp((prog - .5)/.5, 0, 1) : 1, xe = 1 - (1 - ex)*(1 - ex);
        darkK = turnT > 0 ? (prog < .5 ? clamp((prog - .22)/.14, 0, 1) : 1 - clamp((prog - .5)/.2, 0, 1)) : 0; if(turnT <= 0) door = null;
        var dw = turnT > 0 && prog < .5 && door ? door : null, wallZ = fk ? dz(fk.z) : dw ? ee*(camera.position.z + 1.2) : null, wOne = fk ? fk.k === 'turn' : dw ? dw.one : false, wDir = fk ? fk.dir : dw ? dw.dir : 1;
        forkWall.visible = wallZ !== null; if(wallZ !== null){ forkWall.position.z = wallZ; fwHoles.forEach(function(h, i){ var sd = i ? 1 : -1; h.hole.visible = !wOne || sd === wDir; }); arrowSign.visible = wOne; if(wOne) arrowSign.material = arrowMat(wDir); fwPortrait.visible = !wOne; pools.arch.begin(); fwHoles.forEach(function(h, i){ if(!h.hole.visible) return; var a = pools.arch.take(); if(a){ a.position.set((i ? 1 : -1)*LANE_W, 0, wallZ + .18); a.rotation.set(0, 0, 0); } }); pools.arch.end(); } else { pools.arch.begin(); pools.arch.end(); }
        /* the runner: run cycle, jump tuck, slide lean, stumble tilt, the lantern light in its hand */
        var pxw = lx(px), lift = jump > 0 ? Math.sin(Math.PI*(1 - jump/.6))*1.1 : 0, bob = running ? Math.abs(Math.sin(t*14))*.05 : 0, tilt = stumble > 0 ? Math.sin(stumble*12)*.25 : 0, sw = running ? Math.sin(t*14) : 0;
        runner.position.set(pxw, lift + bob, 0); runner.rotation.set(0, 0, tilt); if(J.Root){ J.Root.rotation.x = slide > 0 ? .9 : (running ? -.12 : 0); J.Root.position.y = slide > 0 ? -.35 : 0; J.Root.scale.y = slide > 0 ? .75 : 1; }
        if(J.HipL){ J.HipL.rotation.x = jump > 0 ? -.9 : slide > 0 ? -1.2 : sw*.85; J.HipR.rotation.x = jump > 0 ? -.4 : slide > 0 ? -1.1 : -sw*.85; } if(J.ShoulderL){ J.ShoulderL.rotation.x = jump > 0 ? -2.4 : -sw*.7; J.ShoulderR.rotation.x = jump > 0 ? -.6 : sw*.7; } if(J.Head) J.Head.rotation.y = (px - lane)*.4;
        if(J.Lantern){ J.Lantern.getWorldPosition(tmpV); lantL.position.copy(tmpV); lantL.position.z += .1; } else lantL.position.set(pxw + .3, 1.0 + lift, .2); lantL.intensity = 3.8 + Math.sin(flick*13)*.5 + (mode === 'menu' ? .4 : 0);
        /* the ghosts lurk below the floor at the edges of the frame and rise as the threat grows, the third one straight behind your heels once it is bad */
        var gy = -1.5 + threat*1.9, gs = .72 + threat*.28; ghostsG.forEach(function(gg, i){ var ph = [0, 2.6, 1.3][i], mid = i === 2; gg.position.set([-2.1, 2.1, 0][i]*(1 - threat*.3), (mid ? gy - .5 : gy) + Math.sin(ghostBob*(3 + i*.3) + ph)*.12, mid ? 1.4 : 2.2 + i*.4 - threat*.6); gg.scale.setScalar(gs*(mid ? .85 : i === 1 ? .95 : 1)); gg.rotation.y = Math.sin(ghostBob*1.7 + ph)*.15; (gg.children[0].userData.mats || []).forEach(function(m){ if(m.name === 'Ghost') m.opacity = .45 + threat*.45; }); });
        /* bats and dust */
        pools.bat.begin(); batPhase += dt; for(var bi = 0; bi < bats.length; bi++){ var b = bats[bi], bs = pools.bat.take(); if(!bs) break; bs.position.set((b.x/W - .5)*(HALL_W + 1.2), HALL_H - .6 - (b.y/(H*.34*.7))*1.4, -6 - bi*.8); bs.rotation.y = b.vx > 0 ? Math.PI/2 : -Math.PI/2; var fl = Math.sin(t*22 + b.ph)*.9; var wl = bs.getObjectByName('WingL'), wr = bs.getObjectByName('WingR'); if(wl){ wl.rotation.z = fl; wr.rotation.z = -fl; } } pools.bat.end();
        for(var di = 0; di < 26; di++){ var d = dust[di]; dustPos[di*3] = (d.x - .5)*HALL_W*.9; dustPos[di*3 + 1] = .4 + (1 - d.y)*3.6; dustPos[di*3 + 2] = -1 - (d.s - .6)*9; } dustGeo.attributes.position.needsUpdate = true;
        if(glowT > 0){ glowT -= dt; candleGlow.material.opacity = glowT/.35; candleGlow.scale.setScalar(1.2 + (1 - glowT/.35)*1.5); } else candleGlow.material.opacity = 0;
        /* lightning: the moon window blazes and a cold light sweeps the hall */
        M.moon.emissiveIntensity = .9 + light*4; boltL.intensity = light*2.2; hemi.intensity = 1.15 + light*.9;
        /* camera: behind and above the runner, easing with the lane. Doorway, first half: it follows the runner all the way into the chosen arch and turns toward that side (a right door turns the view right).
           Second half: having turned 90 degrees, it starts the new hall looking back toward where it came from (left of the axis after a right turn) and swings onto the axis. Both halves are continuous; the one jump sits under full black. */
        var narrow = Math.max(0, 1.1 - camera.aspect);
        var cx = pxw*.45, cz = 4.6 + narrow*2.2, cy = 2.4 + narrow*.4, lz = -6, ly = 1.3; if(turnT > 0){ if(prog < .5){ cx = lerp(pxw*.45, lx(turnDir < 0 ? 0 : 2), ee); camYaw = turnDir*ee*.45; } else { camYaw = -turnDir*(1 - xe)*.7; cx = lerp(-turnDir*.6, pxw*.45, xe); } } else camYaw = lerp(camYaw, 0, Math.min(1, dt*6));
        if(mode === 'menu'){ menuSpin += dt*.25; cx = Math.sin(menuSpin)*2.2; cz = 3.4 + Math.cos(menuSpin)*.8; cy = 1.9; lz = -1.5; ly = 1.0; camYaw = 0; }
        camPos.set(cx, cy, cz); if(turnT > 0 && prog >= .5 && prog < .52) camera.position.copy(camPos); else camera.position.lerp(camPos, Math.min(1, dt*(mode === 'menu' ? 2 : 10)));   /* the one snap of the turn lands under the black */ look.set(cx*.6 + Math.sin(camYaw)*6, ly, lz*Math.cos(camYaw)); camera.lookAt(look);
        var now = performance.now(); if(auto.last && !document.hidden && !soft){ var gap = now - auto.last; if(gap < 200){ auto.samples.push(gap); if(auto.samples.length >= 120){ auto.samples.sort(function(a, b){ return a - b; }); auto.p50 = auto.samples[60]; auto.samples.length = 0; auto.windows++; if(auto.p50 > 24 && auto.level < 3 && auto.windows > 2){ auto.level++; applyGfx(); try { console.info('Ghost Run: frames at '+auto.p50.toFixed(0)+' ms, picture stepped down to level '+auto.level); } catch(e){} } } } } auto.last = now;
        if(bloom.enabled) composer.render(); else renderer.render(scene, camera); P.stats = { calls:renderer.info.render.calls, tris:renderer.info.render.triangles };
      }
      applyGfx(); setTheme(0, true); setRunner(); loadModels(); uploadScene();
      return P;
    }
/* tigOS arcade, Ghost Run part 03: the HUD over the canvas (distance, candles, the hall's name, the threat meter, the control hint, the fork
   call, the doorway caption), the title card that doubles as the front menu (play, graphics, volume), the frame, the input and the peek/dbg
   hooks the test suite drives. Closes ghosts(). */
    var hud = {};
    (function buildDom(){
      hudEl = document.createElement('div'); hudEl.className = 'gr-hud';
      hudEl.innerHTML = '<div class="gr-tl"><b data-dist>0 m</b><span data-candles>0 candles</span></div><div class="gr-tr"><b data-hall>the great hall</b><div class="gr-threat"><i data-threat></i></div><span class="gr-tlabel">the ghosts</span></div>'+
        '<div class="gr-hint" data-hint></div><div class="gr-fork" data-fork>a fork: pick a side</div><div class="gr-door" data-door><b data-doorarrow>\u2190</b><span data-doorname></span><small data-doorn></small></div><div class="gr-dark" data-dark></div>';
      api.stage.appendChild(hudEl); ['dist', 'candles', 'hall', 'threat', 'hint', 'fork', 'door', 'doorarrow', 'doorname', 'doorn', 'dark'].forEach(function(k){ hud[k] = hudEl.querySelector('[data-'+k+']'); });
      hud.hint.textContent = api.touch ? 'swipe left, right, up or down' : 'arrows dodge, up jumps, down slides';
      menuEl = document.createElement('div'); menuEl.className = 'gr-menu gm-ui';
      menuEl.innerHTML = '<div class="gr-panel"><h2>Ghost Run</h2><p class="gr-sub">Three lanes through a haunted house, the ghosts on your heels</p><button type="button" class="gr-play" data-play>Play</button>'+
          '<div class="gr-set"><label><span>Graphics</span><select data-set="gfx">'+GFX.map(function(k){ return '<option value="'+k+'"'+(k === SET.gfx ? ' selected' : '')+'>'+k+'</option>'; }).join('')+'</select></label><label><span>Volume</span><input type="range" data-set="vol" min="0" max="1" step=".05" value="'+SET.vol+'"><output>'+Math.round(SET.vol*100)+'%</output></label></div>'+
          '<p class="gr-foot" data-foot></p><p class="gr-best" data-best></p></div>';
      api.stage.appendChild(menuEl); hud.foot = menuEl.querySelector('[data-foot]'); hud.best = menuEl.querySelector('[data-best]'); hud.play = menuEl.querySelector('[data-play]');
      hud.foot.textContent = api.touch ? 'swipe to change lane, up jumps the coffins, down slides under the witches, pick a side at every fork' : 'arrows change lane, up jumps the coffins, down slides under the witches, pick a side at every fork. Space or enter starts';
      menuEl.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; if(b.hasAttribute('data-play')) start(); api.stage.focus({ preventScroll:true }); });
      var onSet = function(e){ var el = e.target.closest('[data-set]'); if(!el) return; var k = el.getAttribute('data-set'); if(k === 'gfx'){ SET.gfx = el.value; } else if(k === 'vol'){ SET.vol = +el.value; var o = el.parentNode.querySelector('output'); if(o) o.textContent = Math.round(SET.vol*100)+'%'; } saveSet(); if(R) R.applySettings(); };
      menuEl.addEventListener('input', onSet); menuEl.addEventListener('change', onSet);
    })();
    function setText(k, s){ if(last[k] !== s){ last[k] = s; hud[k].textContent = s; } }
    function setOn(k, on){ if(last['on.'+k] !== on){ last['on.'+k] = on; hud[k].classList.toggle('on', on); } }
    function drawHud(){
      var menu = mode === 'menu'; if(last.menuOn !== menu){ last.menuOn = menu; menuEl.hidden = !menu; hudEl.classList.toggle('on', !menu); }
      if(menu){ var best = api.best || 0; setText('best', best > 0 ? 'best  '+best : ''); return; }
      setText('dist', Math.floor(dist)+' m'); setText('candles', candles+(candles === 1 ? ' candle' : ' candles')); setText('hall', THEMES[theme].name);
      var tw = Math.round(clamp(threat, 0, 1)*100); if(last.tw !== tw){ last.tw = tw; hud.threat.style.width = tw+'%'; } var hot = threat >= .5; if(last.hot !== hot){ last.hot = hot; hud.threat.classList.toggle('hot', hot); }
      setOn('hint', alive && t < 5 && halls === 0 && played === 1);
      var fk = objs.filter(function(o){ return o.k === 'fork' && !o.hit && o.z > .05; })[0]; setOn('fork', !!fk && turnT <= 0);
      var dk = Math.round(darkK*100)/100; if(last.dk !== dk){ last.dk = dk; hud.dark.style.opacity = dk; }
      var door = turnT > 0; setOn('door', door); if(door){ setText('doorarrow', turnDir < 0 ? '\u2190' : '\u2192'); var nx = turnT > TURN_T*.5 ? (theme + 1) % THEMES.length : theme; setText('doorname', THEMES[nx].name); setText('doorn', 'hall '+(halls + 1)); }
    }
    /* ---- the frame ---- */
    g.update0 = g.update; g.update = function(dt){ g.update0(dt); frameDt = dt; };
    g.draw = function(){ if(!R) return; var dt = frameDt; frameDt = 0; R.frame(dt); drawHud(); };
    g.resize = function(w, h){ if(R) R.resize(w, h); };
    /* ---- the pointer: the framework's swipe gestures ('swipe', no buttons) arrive through g.key, the title card is DOM (.gm-ui clicks go straight to it) ---- */
    g.pointer = function(){ };
    g.destroy = function(){ [hudEl, menuEl].forEach(function(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }); snd.close(); if(R) R.dispose(); R = null; };
    /* ---- what the tests read ---- */
    g.peek = function(){ return { lane:lane, speed:+speed.toFixed(3), dist:Math.floor(dist), candles:candles, objs:objs.length, alive:alive, jump:jump, slide:slide, threat:+threat.toFixed(3), halls:halls, theme:theme, turning:turnT > 0, turnT:+turnT.toFixed(3), dark:+darkK.toFixed(2), doorWall:R ? R.forkWall.visible : null, light:+light.toFixed(3), bats:bats.length, kinds:objs.map(function(o){ return o.k; }), mode:mode, played:played, model:!!MODELS.haunt, modelFailed:MODELS.failed.haunt || null, soft:R ? R.soft() : null, gfx:SET.gfx }; };
    g.dbg = { turn:function(d){ if(mode === 'run' && alive) turnHall(d < 0 ? -1 : 1); }, spawn:function(k, l){ objs.push({ k:k, l:l == null ? 1 : l, z:0.001, dir:1 }); }, light:function(){ light = 1; emit('light'); }, threat:function(v){ threat = clamp(v, 0, 1); return threat; }, start:function(){ start(); return mode; }, menu:function(){ toMenu(); return mode; },
      model:function(k, buf, cb){ parseModel(k, buf, cb); }, models:function(){ return { haunt:!!MODELS.haunt, failed:MODELS.failed }; }, tick:function(sec){ var n = Math.round((sec || 1)*60); for(var i = 0; i < n; i++) g.update(1/60); return t; },
      pools:function(){ var out = {}; Object.keys(R.pools).forEach(function(k){ var p = R.pools[k]; out[k] = { n:p.slots.length, on:p.slots.filter(function(s){ return s.visible; }).length, model:!!(p.slots[0].children[0] && p.slots[0].children[0].userData.model) }; }); return out; },
      runner:function(){ var r = R.runner(), j = {}; Object.keys(r.J).forEach(function(k){ j[k] = !!r.J[k]; }); return { model:!!(r.body && r.body.userData.model), joints:j, x:+R.scene.getObjectByProperty('type', 'Group').position.x.toFixed(2) }; },
      forkWall:function(){ return { visible:R.forkWall.visible, z:+R.forkWall.position.z.toFixed(2) }; }, cam:function(){ return R.cam(); },
      gpu:function(){ var r = R.renderer, st = R.stats || {}; return { programs:r.info.programs.length, textures:r.info.memory.textures, geometries:r.info.memory.geometries, calls:st.calls, tris:st.tris }; }, progs:function(){ return R.renderer.info.programs.map(function(p){ return p.id+' '+p.name+' '+p.usedTimes+' '+p.cacheKey; }); },
      matProgs:function(){ var out = []; R.scene.traverse(function(o){ if(!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return; [].concat(o.material).forEach(function(m){ var pr = R.renderer.properties.get(m), cp = pr && pr.currentProgram; out.push((o.name || o.type)+'/'+m.type+'/'+(m.name || '')+' -> '+(cp ? cp.id : 'none')); }); }); return out; },
      sceneLights:function(){ var n = 0; R.scene.traverseVisible(function(o){ if(o.isLight) n++; }); return n; }, auto:function(){ return R.auto(); }, gfx:function(){ return { tier:SET.gfx, bloom:R.bloom.enabled, pr:R.renderer.getPixelRatio() }; }, project:function(x, y, z){ return R.project(x, y, z); },
      set:function(k, v){ SET[k] = v; saveSet(); R.applySettings(); return SET; }, sim:function(){ return { W:W, H:H, PZ:PZ, TURN_T:TURN_T, THEMES:THEMES }; }, ev:function(){ return EV.length; } };
    R = Picture(); R.resize(api.canvas.clientWidth || W, api.canvas.clientHeight || H);
    return g;
  }
  (window.TIG_REGISTER || function(d){ GAMES.push(d); })({ id:'ghosts', W:W, H:H, gl:true, lib:'three', menu:true, make:ghosts });
})();

