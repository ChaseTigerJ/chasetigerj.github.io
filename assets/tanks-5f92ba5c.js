/* tigOS arcade, Tanks part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one closure.
   Tanks is turn-based artillery on rolling hills against up to three cpu tanks, rendered with Three.js (window.THREE, vendored in
   src/assets/three.js and fetched only when the game starts). The simulation is the original 2D canvas game's, untouched: a 640 x 400 pixel
   field with a one-value-per-column terrain, wind, fuel, coins and the shop, all in pixels and pixels per second. Part 02 draws that field as a
   3D valley (1 pixel = 5 cm), so every number that made the game feel right still does. The tank, its wreck and the shell are built in Blender
   (blender/tank.py) and ship as one small .glb that streams in after the game starts; a boxy stand-in draws until it lands. Same contract as
   games.js: make(api) -> { reset, update, draw, key, pointer, resize, destroy }. */
(function(){
  var GAMES = window.TIG_GAMES; if(!GAMES) return;
  var W = 640, H = 400, S = .05, FONT = 'ui-monospace, Menlo, Consolas, monospace';   /* S: sim pixels to metres */
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; }, rnd = function(a, b){ return a + Math.random() * (b - a); }, ri = function(a, b){ return Math.floor(rnd(a, b + 1)); }, lerp = function(a, b, k){ return a + (b - a) * k; };
  var mk = function(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  var seed = 7; var srand = function(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  function esc(s){ return String(s).replace(/[&<>"]/g, function(ch){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]; }); }
  function grain(x, w, h, a, n){ for(var i = 0; i < n; i++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '255,255,255')+','+(a * srand())+')'; x.fillRect((srand()*w)|0, (srand()*h)|0, 1 + (srand()*2)|0, 1); } }

  /* ---------- player settings: graphics tier and volume, kept in localStorage, edited on the difficulty card ---------- */
  var GFX = ['low', 'medium', 'high', 'ultra'];
  var SET = { gfx:'high', vol:.8 };
  (function(){ try { var o = JSON.parse(localStorage.getItem('tigos.tanks') || '{}'); Object.keys(SET).forEach(function(k){ if(o[k] !== undefined) SET[k] = o[k]; }); } catch(e){} SET.vol = clamp(+SET.vol, 0, 1); if(GFX.indexOf(SET.gfx) < 0) SET.gfx = 'high'; })();
  function saveSet(){ try { localStorage.setItem('tigos.tanks', JSON.stringify(SET)); } catch(e){} }

  /* ---------- the Blender model. MODELS.tank holds the parsed glTF scene once it arrives (null before, and for good if the fetch fails, e.g.
     offline or file://); it carries three nodes, tank, wreck and shell, cloned per body. Listeners hear about the arrival so a running game
     swaps its stand-ins in place. ---------- */
  var MODEL_KEYS = ['tank'];
  var MODELS = { tank:null, tried:false, failed:{}, listeners:[] };
  function modelReady(k, scene){ prepTank(scene); MODELS[k] = scene; MODELS.listeners.slice().forEach(function(fn){ try { fn(k, scene); } catch(e){} }); }
  function loadModels(){ if(MODELS.tried) return; MODELS.tried = true; var THREE = window.THREE; if(!THREE || !THREE.GLTFLoader) return; var L = new THREE.GLTFLoader();
    MODEL_KEYS.forEach(function(k){ var url = window.TIG_ASSETS && window.TIG_ASSETS[k]; if(!url){ MODELS.failed[k] = 'no asset'; return; } if(!/^https?:/.test(location.protocol)){ MODELS.failed[k] = 'file://'; return; }   /* fetch() has no file: scheme; tests hand the bytes in through g.dbg.model */
      L.load(url, function(gltf){ modelReady(k, gltf.scene); }, undefined, function(e){ MODELS.failed[k] = String(e && e.message || e || 'load error'); }); }); }
  function parseModel(k, buf, cb){ new window.THREE.GLTFLoader().parse(buf, '', function(gltf){ modelReady(k, gltf.scene); if(cb) cb(null); }, function(e){ MODELS.failed[k] = String(e && e.message || e); if(cb) cb(e); }); }
  function prepTank(sc){ var THREE = window.THREE; sc.traverse(function(o){ if(!o.isMesh) return; o.castShadow = true; o.receiveShadow = false; var m = o.material; m.side = THREE.FrontSide;
      if(/Steel|Brass|Dark/.test(m.name)){ m.metalness = Math.min(m.metalness, .45); m.roughness = Math.max(m.roughness, .4); }   /* no environment map: full metalness renders black under a sun */
      if(/Ember/.test(m.name)){ m.emissive.setHex(0xff5010); m.emissiveIntensity = 2.2; } if(/Glass/.test(m.name)){ m.emissiveIntensity = .4; } }); }
  /* clone a named node out of the loaded scene with its own materials (so a tint or a flash touches one tank, not every copy) */
  function cloneNode(sc, name){ var src = sc.getObjectByName(name); if(!src) return null; var g = src.clone(true), seen = {}, mats = [];
    g.traverse(function(o){ if(!o.isMesh) return; var m = o.material, k = m.name || m.uuid; if(!seen[k]){ seen[k] = m.clone(); seen[k].name = m.name; mats.push(seen[k]); } o.material = seen[k]; });
    g.userData.mats = mats; g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); return g; }

  /* ---------- sound: a small WebAudio synth. The gun is a thump with a crack on top, shells whistle down, the ground hit is filtered noise sized to the
     crater, a hull hit clanks, tracks hum while a tank drives, coins ring, the shop clicks. No audio files. ---------- */
  function Synth(){
    var ac = null, muted = false, master, drive, driveG, driveF;
    function ctx(){ if(ac || muted) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5*SET.vol; var comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; master.connect(comp); comp.connect(ac.destination); } catch(e){ ac = null; } return ac; }
    function noise(dur, freq, gain, q, type, delay, curve){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, curve || 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + (delay || 0)); }
    function tone(type, f0, f1, dur, gain, delay, attack){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); if(attack){ g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); } else g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02); }
    function ensureDrive(){ var a = ctx(); if(!a || drive) return; drive = a.createOscillator(); drive.type = 'sawtooth'; drive.frequency.value = 55; driveF = a.createBiquadFilter(); driveF.type = 'lowpass'; driveF.frequency.value = 260; driveG = a.createGain(); driveG.gain.value = 0; drive.connect(driveF); driveF.connect(driveG); driveG.connect(master); drive.start(); }
    return {
      toggle:function(){ muted = !muted; if(muted && ac){ try { ac.suspend(); } catch(e){} } else if(ac){ try { ac.resume(); } catch(e){} } return muted; },
      volume:function(v){ if(master) master.gain.value = .5*v; },
      fire:function(nuke){ noise(.02, 5000, 1.1, .5, 'highpass'); noise(.5, 500, 1.2, .6); tone('sine', nuke ? 90 : 150, 34, .45, .8); tone('triangle', 70, 28, .5, .35); if(nuke) tone('sawtooth', 60, 20, 1.2, .25, .1); },
      whistle:function(){ tone('sine', 1800, 700, 1.1, .05, .5, .3); },
      boom:function(size, hull){ var s = clamp(size, .8, 3); noise(.03, 6000, .8, .5, 'highpass'); noise(.5*s, 420/s, 1.4, .5, 'lowpass', 0, 1.6); tone('sine', 120/s*1.6, 26, .5*s, .9); if(hull){ tone('square', 900, 300, .12, .18); noise(.15, 3200, .5, 3, 'bandpass', .02); } if(s > 2){ noise(1.6, 120, 1.2, .3, 'lowpass', .1, 1.2); tone('sine', 40, 22, 1.8, .6, .15); } },
      drive:function(on, k){ ensureDrive(); if(!driveG) return; var a = ac, t = a.currentTime; driveG.gain.cancelScheduledValues(t); driveG.gain.setTargetAtTime(on ? .06*(k || 1) : 0, t, .08); driveF.frequency.setTargetAtTime(on ? 420 : 200, t, .15); if(drive) drive.frequency.setTargetAtTime(on ? 68 : 52, t, .2); },
      coin:function(n){ for(var i = 0; i < Math.min(n || 1, 4); i++){ tone('sine', 1320, 1320, .12, .12, i*.07); tone('sine', 1980, 1980, .16, .09, i*.07 + .05); } },
      ui:function(ok){ tone('square', ok ? 660 : 220, ok ? 880 : 180, .06, .05); },
      win:function(){ [523, 659, 784, 1046].forEach(function(f, i){ tone('triangle', f, f, .22, .14, i*.11); }); tone('sine', 1046, 1046, .5, .1, .44); },
      lose:function(){ [392, 330, 262, 196].forEach(function(f, i){ tone('sawtooth', f, f*.97, .3, .1, i*.16); }); },
      close:function(){ if(ac){ try { ac.close(); } catch(e){} } ac = null; drive = null; } };
  }
/* tigOS arcade, Tanks part 01: the simulation, ported from the canvas game as is. Everything here is in field pixels (640 x 400, y down) and
   pixels per second: terrain, wind, shells under gravity G, fuel spent per pixel driven, damage, coins, the shop and the cpu gunners. The
   renderer (part 02) reads these arrays every frame and never writes them; the only additions are the event queue EV (fire, boom, hit, buy...)
   the picture and the synth consume, and terDirty, set when a crater changed the ground. Opens tanks(); part 03 closes it. */
  function tanks(api){
    var g = {}, ter, me, foes, shots, wind, phase, turn, round, score, coins, aimDrag, cpuT, msg, msgT, parts, smoke, rings, debris, shake, timers, held, upg, shopSel, nukeArmed, fuel, fuelMax, kills, D, diffSel, EV = [], terDirty = true, t = 0, R = null, snd = Synth();
    var G = 230, FOE_COL = ['#ff6b6b', '#ffa94d', '#c084fc'];
    var DIFFS = [
      { id:'easy', name:'Easy', desc:'Sleepy gunners, 16 fuel, weak shells', err:.38, dmg:.7, fuel:16, coin:1, hp:80, col:'#8fd46a' },
      { id:'normal', name:'Normal', desc:'A fair fight, 10 fuel', err:.28, dmg:1, fuel:10, coin:1, hp:100, col:'#ffd166' },
      { id:'hard', name:'Hard', desc:'Sharp aim, 8 fuel, 25% more coins', err:.18, dmg:1.3, fuel:8, coin:1.25, hp:120, col:'#ff8a00' },
      { id:'legendary', name:'Legendary', desc:'Dead eyes, 6 fuel, armored hulls, 50% more coins', err:.10, dmg:1.6, fuel:6, coin:1.5, hp:150, col:'#ff5f57' } ];
    var SHOP = [
      { id:'repair', name:'Repair kit', desc:'Patch the hull back to full', cost:60 },
      { id:'fuel', name:'Fuel tank', desc:'+12 fuel every turn', cost:140, max:4 },
      { id:'armor', name:'Armor plating', desc:'+30 max hull, repaired now', cost:220, max:3 },
      { id:'big', name:'Heavy shells', desc:'Bigger craters, 50% more damage', cost:320, max:1 },
      { id:'guide', name:'Targeting computer', desc:'Shows the arc while you aim', cost:380, max:1 },
      { id:'double', name:'Double barrel', desc:'Two shells every shot', cost:520, max:1 },
      { id:'nuke', name:'Nuke', desc:'One devastating shell. N or the pad arms it', cost:650 } ];
    function emit(type, o){ o = o || {}; o.type = type; EV.push(o); }
    function genTer(){ ter = []; var a = rnd(0, 6), b = rnd(0, 6), c2 = rnd(0, 6); for(var x = 0; x < W; x++){ var y = H*.62 + Math.sin(x/90 + a)*28 + Math.sin(x/37 + b)*12 + Math.sin(x/160 + c2)*40; ter.push(clamp(y, H*.35, H*.9)); } for(var s = 0; s < 2; s++) for(var i = 1; i < W - 1; i++) ter[i] = (ter[i-1] + ter[i] + ter[i+1]) / 3; terDirty = true; emit('terrain'); }
    function ground(t){ t.y = ter[Math.round(clamp(t.x, 0, W - 1))]; }
    function say(s){ msg = s; msgT = 2.2; }
    g.reset = function(){ round = 1; score = 0; coins = 0; kills = 0; api.score(0); upg = { repair:0, fuel:0, armor:0, big:0, guide:0, double:0, nuke:0 }; me = { hp:100, max:100, ang:45, pow:60, col:'#63e6be', x:80, y:0, name:'you' }; D = DIFFS[1]; diffSel = 1; genTer(); ground(me); foes = []; shots = []; parts = []; smoke = []; rings = []; debris = []; timers = []; shake = 0; wind = 0; held = {}; nukeArmed = false; refuel(); turn = -1; msg = ''; msgT = 0; phase = 'diff'; shopSel = 0; api.status('choose a difficulty  \u00b7  up/down, space starts'); emit('reset'); if(R) R.reset(); };
    function pickDiff(i){ D = DIFFS[i]; diffSel = i; newRound(); say(D.name+' \u00b7 round 1  \u00b7  wind '+windTxt()); emit('start'); }
    function newRound(){ genTer(); me.x = ri(50, 120); ground(me); me.dead = false; me.hp = Math.min(me.max, me.hp + 25); var n = Math.min(3, 1 + Math.floor((round - 1) / 2)); foes = []; for(var i = 0; i < n; i++){ var f = { hp:D.hp, max:D.hp, ang:135, pow:60, col:FOE_COL[i], err:Math.max(.04, D.err - round*.03 - i*.02), x:Math.round(W*(.5 + (i + 1) / (n + 1) * .46)), name:'cpu '+(i + 1), fuelMax:D.fuel + round*2, fuel:D.fuel + round*2, drive:null, id:i }; ground(f); foes.push(f); }
      shots = []; parts = []; smoke = []; rings = []; debris = []; timers = []; shake = 0; wind = ri(-25, 25); aimDrag = null; cpuT = 0; held = {}; nukeArmed = false; phase = 'play'; turn = -1; refuel(); say('round '+round+'  \u00b7  '+n+' enem'+(n > 1 ? 'ies' : 'y')+'  \u00b7  wind '+windTxt()); status(); emit('round'); }
    function refuel(){ fuelMax = D.fuel + upg.fuel*12; fuel = fuelMax; }
    function windTxt(){ return (wind > 0 ? '\u2192 ' : wind < 0 ? '\u2190 ' : '')+Math.abs(wind); }
    function status(){ api.status(phase === 'diff' ? 'choose a difficulty  \u00b7  up/down, space starts' : phase === 'shop' ? 'shop  \u00b7  '+coins+' coins' : 'angle '+Math.round(me.ang)+'\u00b0  power '+Math.round(me.pow)+'  fuel '+Math.ceil(fuel)+'  \u00b7  '+coins+' coins'); }
    function myTurn(){ return phase === 'play' && turn === -1 && !shots.length && !me.dead; }
    g.inMenu = function(){ return phase === 'diff'; };
    /* keys: the difficulty card and the shop take arrows, digits and space; in play, arrows drive and elevate, W/S set power, space fires, N arms the nuke */
    g.key = function(k, down){
      if(phase === 'diff'){ if(!down) return true; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ diffSel = (diffSel + 3) % 4; snd.ui(true); return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ diffSel = (diffSel + 1) % 4; snd.ui(true); return true; } if(/^[1-4]$/.test(k)){ diffSel = +k - 1; snd.ui(true); return true; } if(k === ' ' || k === 'Enter'){ pickDiff(diffSel); return true; } return /^Arrow/.test(k); }
      if(phase === 'shop'){ if(!down) return true; var rows = SHOP.length + 1; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ shopSel = (shopSel + rows - 1) % rows; snd.ui(true); return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ shopSel = (shopSel + 1) % rows; snd.ui(true); return true; } if(k === ' ' || k === 'Enter'){ shopPick(shopSel); return true; } return /^Arrow/.test(k); }
      if(k === ' ' || k === 'Enter'){ if(down && myTurn()) fire(me); return true; }
      if(k === 'n' || k === 'N'){ if(down && myTurn() && upg.nuke > 0){ nukeArmed = !nukeArmed; say(nukeArmed ? 'nuke armed' : 'nuke stowed'); snd.ui(nukeArmed); } return true; }
      if(k === 'm' || k === 'M'){ if(down) snd.toggle(); return true; }
      var m = { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', ArrowDown:'D', w:'PU', W:'PU', s:'PD', S:'PD' }[k]; if(!m) return false; held[m] = down; return true; };
    /* drag-to-aim, in field pixels (part 03 unprojects the pointer onto the field plane first): a press starts a drag, a real move from the press
       point aims the barrel at the pointer with power from the distance, letting go fires. A plain click never fires. */
    function aimDown(x, y){ if(myTurn()) aimDrag = { moved:false, x0:x, y0:y }; }
    function aimMove(x, y){ if(!aimDrag || !myTurn()) return; if(aimDrag.moved || Math.hypot(x - aimDrag.x0, y - aimDrag.y0) > 6){ aimDrag.moved = true; var dx = x - me.x, dy = (me.y - 16) - y; if(Math.hypot(dx, dy) > 8){ me.ang = clamp(Math.atan2(dy, dx)*180/Math.PI, 0, 180); me.pow = clamp(Math.hypot(dx, dy)/2.4, 15, 100); status(); } } }
    function aimUp(){ if(!aimDrag) return; var mv = aimDrag.moved; aimDrag = null; if(mv && myTurn()) fire(me); }
    function fire(t){ if(shots.length) return; var big = t === me && upg.big > 0, nuke = t === me && nukeArmed && upg.nuke > 0; if(nuke){ upg.nuke--; nukeArmed = false; }
      var angs = t === me && upg.double > 0 && !nuke ? [t.ang - 2.5, t.ang + 2.5] : [t.ang];
      angs.forEach(function(ang){ var a = ang*Math.PI/180, v = t.pow*5.2; shots.push({ x:t.x + Math.cos(a)*18, y:t.y - 16 - Math.sin(a)*18, vx:Math.cos(a)*v, vy:-Math.sin(a)*v, from:t, trail:[], t:0, big:big, nuke:nuke }); });
      t.recoil = 1; emit('fire', { who:t, nuke:nuke, big:big }); snd.fire(nuke); if(t === me) status(); }
    function boom(x, y, size, col, hull){ var n = Math.round(16*size); for(var i = 0; i < n; i++){ var a = rnd(0, 7), sp = rnd(60, 220)*size; parts.push({ x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 80*size, t:0, life:rnd(.35, .8), col:Math.random() < .5 ? '#ffd166' : (col || '#ff8a00') }); }
      for(var k = 0; k < Math.round(7*size); k++) smoke.push({ x:x + rnd(-8, 8)*size, y:y + rnd(-8, 8)*size, r:rnd(6, 12)*size, vx:rnd(-20, 20), vy:rnd(-50, -15), t:0, life:rnd(.9, 1.6)*Math.sqrt(size) });
      rings.push({ x:x, y:y, t:0, life:.45*Math.sqrt(size), r:30*size }); rings.push({ x:x, y:y, t:0, life:.18, r:14*size, flash:true }); shake = Math.min(24, shake + 5*size); emit('boom', { x:x, y:y, size:size, hull:!!hull }); snd.boom(size, hull); }
    function crater(x, y, r){ for(var i = Math.max(0, Math.floor(x - r)); i < Math.min(W, x + r); i++){ var d = Math.sqrt(Math.max(0, r*r - (i - x)*(i - x))); ter[i] = Math.min(H*.95, Math.max(ter[i], y + d*.9)); } ground(me); foes.forEach(ground); terDirty = true; emit('crater', { x:x, r:r }); }
    function damage(t, n){ if(t.dead) return; t.hp -= n; t.flash = .3; }
    function wreck(t){ t.dead = true; t.hp = 0; boom(t.x, t.y - 10, 1.6, t.col); timers.push({ t:.22, fn:function(){ boom(t.x - 10, t.y - 16, 1.2); } }); timers.push({ t:.48, fn:function(){ boom(t.x + 8, t.y - 6, 2.2); } });
      for(var i = 0; i < 9; i++) debris.push({ x:t.x, y:t.y - 10, vx:rnd(-150, 150), vy:rnd(-320, -120), rot:rnd(0, 7), vr:rnd(-9, 9), t:0, life:rnd(1.2, 2.2), w:rnd(4, 10), h:rnd(3, 6), col:t.col }); t.smokeT = 3; emit('wreck', { who:t }); }
    function shopPick(row){ if(row === SHOP.length){ phase = 'play'; snd.ui(true); newRound(); return; } var it = SHOP[row];
      if(it.max && upg[it.id] >= it.max){ say('already maxed'); snd.ui(false); return; } if(it.id === 'repair' && me.hp >= me.max){ say('hull is already full'); snd.ui(false); return; } if(coins < it.cost){ say('not enough coins ('+it.cost+')'); snd.ui(false); return; }
      coins -= it.cost; upg[it.id]++; if(it.id === 'repair') me.hp = me.max; if(it.id === 'armor'){ me.max += 30; me.hp = me.max; } say(it.name+' bought'); status(); snd.coin(2); emit('buy', { id:it.id }); }
    function cpuAim(f){ var dx = me.x - f.x, dy = f.y - me.y, ang = rnd(112, 152), a = ang*Math.PI/180, Rg = Math.abs(dx) + dy*.6; var v = Math.sqrt(Math.abs(Rg*G / Math.sin(2*a))) || 200; v -= wind*.9; v *= 1 + rnd(-f.err, f.err); f.ang = ang; f.pow = clamp(v/5.2, 20, 100); fire(f); }
    function endTurn(){
      var died = false; [me].concat(foes).forEach(function(t){ if(t.hp <= 0 && !t.dead){ wreck(t); died = true; if(t !== me){ kills++; var ck = Math.round(80*D.coin); coins += ck; score += 300; api.score(score); say(t.name+' destroyed  +'+ck+' coins'); snd.coin(3); } } });
      if(me.dead){ phase = 'dead'; snd.lose(); timers.push({ t:1.8, fn:function(){ api.over(round > 3 ? 'Outgunned after '+(round - 1)+' rounds won' : 'Outgunned'); } }); return; }
      if(foes.every(function(f){ return f.dead; })){ var bonus = Math.round((120 + round*25 + Math.floor(me.hp/5))*D.coin); coins += bonus; score += 500 + me.hp*3; api.score(score); round++; say('round won  +'+bonus+' coins'); phase = 'won'; snd.win(); timers.push({ t:1.4, fn:function(){ phase = 'shop'; shopSel = 0; status(); emit('shop'); } }); return; }
      var order = [-1].concat(foes.map(function(f, i){ return i; })), cur = order.indexOf(turn), next = turn;
      for(var k = 1; k <= order.length; k++){ var cand = order[(cur + k) % order.length]; if(cand === -1 || !foes[cand].dead){ next = cand; break; } }
      turn = next; cpuT = 0; if(turn === -1){ wind = clamp(wind + ri(-8, 8), -30, 30); refuel(); say('your turn  \u00b7  wind '+windTxt()); status(); } emit('turn', { turn:turn }); }
    g.update = function(dt){
      t += dt; if(msgT > 0) msgT -= dt; if(shake > 0) shake = Math.max(0, shake - dt*40);
      for(var i = timers.length - 1; i >= 0; i--){ timers[i].t -= dt; if(timers[i].t <= 0){ var fn = timers[i].fn; timers.splice(i, 1); fn(); } }
      parts.forEach(function(q){ q.t += dt; q.vy += 320*dt; q.x += q.vx*dt; q.y += q.vy*dt; }); parts = parts.filter(function(q){ return q.t < q.life; });
      smoke.forEach(function(q){ q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; q.r += 14*dt; }); smoke = smoke.filter(function(q){ return q.t < q.life; });
      rings.forEach(function(q){ q.t += dt; }); rings = rings.filter(function(q){ return q.t < q.life; });
      debris.forEach(function(q){ q.t += dt; q.vy += 400*dt; q.x += q.vx*dt; q.y += q.vy*dt; q.rot += q.vr*dt; var gi = Math.round(clamp(q.x, 0, W - 1)); if(q.y > ter[gi]){ q.y = ter[gi]; q.vy *= -.3; q.vx *= .6; q.vr *= .5; } }); debris = debris.filter(function(q){ return q.t < q.life; });
      var driving = false;
      [me].concat(foes).forEach(function(t){ if(t.flash > 0) t.flash -= dt; if(t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt*3); if(t.smokeT > 0){ t.smokeT -= dt; if(Math.random() < dt*14) smoke.push({ x:t.x + rnd(-6, 6), y:t.y - 12, r:rnd(5, 9), vx:wind*.3 + rnd(-6, 6), vy:rnd(-40, -20), t:0, life:rnd(1, 1.8) }); } t.moving = false; });
      if(phase !== 'play'){ snd.drive(false); return; }
      if(myTurn()){ var moved = false;
        if(held.U) me.ang = clamp(me.ang + 40*dt, 0, 180); if(held.D) me.ang = clamp(me.ang - 40*dt, 0, 180); if(held.PU) me.pow = clamp(me.pow + 30*dt, 15, 100); if(held.PD) me.pow = clamp(me.pow - 30*dt, 15, 100);
        if((held.L || held.R) && fuel > 0){ var dx = (held.R ? 1 : -1)*42*dt, nx = clamp(me.x + dx, 16, W - 16), used = Math.abs(nx - me.x)/4; if(used > fuel){ nx = me.x + (nx - me.x)*(fuel/used); used = fuel; } fuel -= used; me.x = nx; ground(me); moved = true; me.moving = true; me.dir = held.R ? 1 : -1; driving = true; if(Math.random() < dt*10) smoke.push({ x:me.x - me.dir*14, y:me.y - 4, r:rnd(2, 4), vx:-me.dir*20, vy:rnd(-20, -8), t:0, life:rnd(.4, .7) }); }
        if(held.U || held.D || held.PU || held.PD || moved) status(); }
      else if(turn >= 0 && !shots.length){ var cf = foes[turn]; cpuT += dt;
        if(!cf.drive){ cf.fuel = cf.fuelMax; var away = Math.abs(me.x - cf.x) < 170, dir = away ? (cf.x > me.x ? 1 : -1) : (Math.random() < .5 ? -1 : 1), want = Math.min(cf.fuel, rnd(3, cf.fuel)); cf.drive = { dir:dir, left:want*4 }; }
        if(cpuT > .25 && cf.drive.left > 0 && cf.fuel > 0){ var step = Math.min(cf.drive.left, 42*dt), nx2 = clamp(cf.x + cf.drive.dir*step, W*.42, W - 16), blocked = foes.some(function(o){ return o !== cf && !o.dead && Math.abs(o.x - nx2) < 30; }) || Math.abs(nx2 - me.x) < 60; if(blocked || nx2 === cf.x){ cf.drive.left = 0; } else { var used2 = Math.abs(nx2 - cf.x)/4; if(used2 > cf.fuel){ nx2 = cf.x + (nx2 - cf.x)*(cf.fuel/used2); used2 = cf.fuel; } cf.fuel -= used2; cf.drive.left -= Math.abs(nx2 - cf.x); cf.x = nx2; ground(cf); cf.moving = true; cf.dir = cf.drive.dir; driving = true; if(Math.random() < dt*10) smoke.push({ x:cf.x - cf.drive.dir*14, y:cf.y - 4, r:rnd(2, 4), vx:-cf.drive.dir*20, vy:rnd(-20, -8), t:0, life:rnd(.4, .7) }); } }
        if(cpuT > 1.3 || (cpuT > .9 && cf.drive.left <= 0)){ cf.drive = null; cpuAim(cf); cpuT = 0; } }
      snd.drive(driving, driving && me.moving ? 1 : .6);
      var had = shots.length;
      for(var s = shots.length - 1; s >= 0; s--){ var sh = shots[s]; sh.t += dt; sh.vx += wind*.9*dt; sh.vy += G*dt; sh.x += sh.vx*dt; sh.y += sh.vy*dt; if(sh.trail.length > 18) sh.trail.shift(); sh.trail.push({ x:sh.x, y:sh.y });
        var xi = Math.round(sh.x), done = false, size = sh.nuke ? 3 : sh.big ? 1.5 : 1, Rr = sh.nuke ? 90 : sh.big ? 55 : 40, base = sh.nuke ? 80 : sh.big ? 30 : 20, direct = sh.nuke ? 90 : sh.big ? 50 : 34, cr = sh.nuke ? 60 : sh.big ? 28 : 18;
        var tanksAll = [me].concat(foes), hitT = null; for(var k = 0; k < tanksAll.length; k++){ var tk = tanksAll[k]; if(tk !== sh.from && !tk.dead && Math.hypot(sh.x - tk.x, sh.y - (tk.y - 10)) < 18){ hitT = tk; break; } }
        if(hitT){ damage(hitT, sh.from === me ? direct : Math.round(direct*D.dmg)); boom(sh.x, sh.y, size*1.2, hitT.col, true); crater(sh.x, sh.y, cr); done = true; if(sh.from === me){ score += 100; api.score(score); say(sh.nuke ? 'nuclear direct hit' : 'direct hit on '+hitT.name); } else say(hitT === me ? 'you took a hit' : sh.from.name+' hit '+hitT.name); }
        else if(sh.y > H + 40 || sh.x < -60 || sh.x > W + 60 || sh.t > 9){ done = true; say(sh.from === me ? 'missed' : sh.from.name+' missed'); }
        else if(xi >= 0 && xi < W && sh.y >= ter[xi]){ boom(sh.x, sh.y, size); crater(sh.x, sh.y, cr); done = true; var any = false; tanksAll.forEach(function(tk){ if(tk.dead) return; var d = Math.hypot(sh.x - tk.x, sh.y - tk.y); if(d < Rr){ damage(tk, Math.round(base*(1 - d/Rr)*(sh.from === me ? 1 : D.dmg))); any = true; } }); say(any ? (sh.from === me ? 'close one' : 'shrapnel') : (sh.from === me ? 'so close' : sh.from.name+' digs a hole')); }
        if(done) shots.splice(s, 1); }
      if(had && !shots.length) endTurn();
    };
    /* the guide arc the targeting computer draws: the shell's path from the muzzle, sampled every 50 ms, in field pixels */
    function guidePath(){ var a = me.ang*Math.PI/180, v = me.pow*5.2, px = me.x + Math.cos(a)*18, py = me.y - 16 - Math.sin(a)*18, vx = Math.cos(a)*v, vy = -Math.sin(a)*v, out = []; for(var st = 0; st < 46; st++){ vx += wind*.9*.05; vy += G*.05; px += vx*.05; py += vy*.05; var gi = Math.round(px); if(px < 0 || px >= W || py > ter[gi]) break; if(st % 2 === 0) out.push([px, py]); } return out; }
/* tigOS arcade, Tanks part 02: the picture. The 640 x 400 field becomes a valley 32 m wide: the terrain columns are the ridge line at z = 0 where
   the tanks sit, and the ground rolls away behind it and drops off in front, so a crater is a real dent you look into. A sunset dome, a sun that
   blooms, two ridge silhouettes in the fog, clouds that drift with the wind, one shadow-casting sun. Every effect the sim keeps in pixels (sparks,
   smoke, rings, debris, shell trails) is mapped 1 px = 5 cm into pooled Points, sprites and meshes, so the pools never allocate mid-shot. */
    var TS = 1.6, frameDt = 0, vw = 2, vh = 2, soft = false, views = [], shellViews = [], scorch = new Float32Array(W), camX = 0, camXT = 0, camZoom = 0, tmpV = null, hudEl = null, menuEl = null, tagsEl = null, last = {};
    function wx(x){ return (x - W/2)*S; } function wy(y){ return (H - y)*S; }
    function Picture(){
      var THREE = window.THREE; tmpV = new THREE.Vector3();
      var renderer = new THREE.WebGLRenderer({ canvas:api.canvas, antialias:false, powerPreference:'high-performance', alpha:false, stencil:false });
      renderer.info.autoReset = false; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.type = THREE.PCFShadowMap;
      try { var gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), rn = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(rn); } catch(e){}
      if(/[?&]gl=1/.test(location.search)) soft = false;
      var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x8a4a66, 34, 95);
      var camera = new THREE.PerspectiveCamera(40, 16/9, .1, 400); scene.add(camera);
      /* ---- textures ---- */
      function ctex(w, h, fn, rep){ var c = mk(w, h); fn(c.getContext('2d'), w, h); var tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; if(rep) tx.repeat.set(rep[0], rep[1]); return tx; }
      var T = {};
      T.sky = ctex(64, 512, function(x, w, h){ var g = x.createLinearGradient(0, 0, 0, h*.5); g.addColorStop(0, '#12122c'); g.addColorStop(.35, '#1b1b3a'); g.addColorStop(.72, '#7a3b5e'); g.addColorStop(1, '#ff9a5c'); x.fillStyle = g; x.fillRect(0, 0, w, h*.5); x.fillStyle = '#ff9a5c'; x.fillRect(0, h*.5, w, h*.5); var g2 = x.createLinearGradient(0, h*.5, 0, h); g2.addColorStop(0, 'rgba(255,154,92,1)'); g2.addColorStop(1, 'rgba(120,60,50,1)'); x.fillStyle = g2; x.fillRect(0, h*.5, w, h*.5); }); T.sky.wrapS = T.sky.wrapT = THREE.ClampToEdgeWrapping;
      T.stars = ctex(512, 256, function(x, w, h){ x.clearRect(0, 0, w, h); for(var i = 0; i < 140; i++){ var a = .35 + srand()*.6, r = .6 + srand()*1.1; x.fillStyle = 'rgba(255,255,255,'+a+')'; x.beginPath(); x.arc(srand()*w, srand()*h*.7, r, 0, 7); x.fill(); } });
      T.soft = ctex(64, 64, function(x, w, h){ var g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); T.soft.colorSpace = THREE.NoColorSpace;
      T.puff = ctex(64, 64, function(x, w, h){ x.clearRect(0, 0, w, h); for(var i = 0; i < 7; i++){ var px = 32 + (srand() - .5)*26, py = 32 + (srand() - .5)*26, r = 10 + srand()*12, g = x.createRadialGradient(px, py, 1, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } }); T.puff.colorSpace = THREE.NoColorSpace;
      T.cloud = ctex(256, 128, function(x, w, h){ x.clearRect(0, 0, w, h); for(var i = 0; i < 16; i++){ var px = 40 + srand()*176, py = 50 + srand()*40, r = 22 + srand()*26, g = x.createRadialGradient(px, py, 2, px, py, r); g.addColorStop(0, 'rgba(255,230,220,.85)'); g.addColorStop(.6, 'rgba(255,200,190,.45)'); g.addColorStop(1, 'rgba(255,180,170,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } });
      T.ground = ctex(256, 256, function(x, w, h){ x.fillStyle = '#b8b8b0'; x.fillRect(0, 0, w, h); grain(x, w, h, .35, 9000); for(var i = 0; i < 400; i++){ x.fillStyle = 'rgba('+(srand() < .5 ? '60,70,40' : '200,210,180')+','+(.1 + srand()*.25)+')'; x.fillRect(srand()*w, srand()*h, 1 + srand()*3, 2 + srand()*5); } }, [8, 4]);
      /* ---- sky dome, sun, stars, ridges, valley floor ---- */
      var dome = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 16), new THREE.MeshBasicMaterial({ map:T.sky, side:THREE.BackSide, fog:false, depthWrite:false })); dome.position.y = -30; scene.add(dome);
      var starMesh = new THREE.Mesh(new THREE.SphereGeometry(170, 24, 12, 0, Math.PI*2, 0, Math.PI*.5), new THREE.MeshBasicMaterial({ map:T.stars, side:THREE.BackSide, fog:false, depthWrite:false, transparent:true, opacity:.8 })); starMesh.position.y = -10; scene.add(starMesh);
      var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(2.2, 1.7, .9), fog:false, depthWrite:false, blending:THREE.AdditiveBlending })); sun.position.set(48, 26, -110); sun.scale.set(18, 18, 1); scene.add(sun);
      var sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(.9, .5, .3), fog:false, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.5 })); sunHalo.position.copy(sun.position); sunHalo.scale.set(60, 60, 1); scene.add(sunHalo);
      function ridge(z, amp, base, col){ var pts = [], n = 60; for(var i = 0; i <= n; i++){ var xx = -120 + i*4; pts.push(new THREE.Vector2(xx, base + Math.sin(xx*.05 + z)*amp + Math.sin(xx*.13 + z*2)*amp*.4 + Math.sin(xx*.021)*amp*1.3)); } var sh = new THREE.Shape(); sh.moveTo(-120, -20); pts.forEach(function(p){ sh.lineTo(p.x, p.y); }); sh.lineTo(120, -20); sh.closePath(); var m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color:col })); m.position.z = z; scene.add(m); return m; }
      ridge(-42, 3.2, 12, 0x3a2544); ridge(-64, 4.5, 15, 0x4d2f52); ridge(-90, 6, 19, 0x5a3660);
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color:0x1d1710, roughness:1 })); floor.rotation.x = -Math.PI/2; floor.position.y = -.2; scene.add(floor);
      var clouds = []; for(var ci = 0; ci < 7; ci++){ var cs = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.cloud, transparent:true, opacity:.35 + srand()*.25, depthWrite:false, fog:false })); cs.position.set(-40 + srand()*80, 19 + srand()*9, -30 - srand()*30); var sw = 10 + srand()*14; cs.scale.set(sw, sw*.45, 1); scene.add(cs); clouds.push(cs); }
      /* ---- lights: a hemisphere for the sky, one sun that casts the only shadow ---- */
      var hemi = new THREE.HemisphereLight(0x9a6a9a, 0x2a2014, .85); scene.add(hemi);
      var sunL = new THREE.DirectionalLight(0xffb478, 2.2); sunL.position.set(26, 30, 12); sunL.target.position.set(0, 6, 0); scene.add(sunL); scene.add(sunL.target);
      sunL.shadow.mapSize.set(1024, 1024); sunL.shadow.camera.near = 5; sunL.shadow.camera.far = 90; sunL.shadow.camera.left = -19; sunL.shadow.camera.right = 19; sunL.shadow.camera.top = 12; sunL.shadow.camera.bottom = -10; sunL.shadow.bias = -.0006; sunL.shadow.normalBias = .02;
      var fill = new THREE.DirectionalLight(0x6a7ab8, .35); fill.position.set(-20, 12, 20); scene.add(fill);
      var flashL = []; for(var fi = 0; fi < 2; fi++){ var fl = new THREE.PointLight(0xffb060, 0, 16, 1.4); scene.add(fl); flashL.push({ l:fl, t:0, k:0 }); }   /* pooled and always in the scene: a light coming and going would recompile every shader */
      /* ---- the terrain: a grid 44 x 24 m, 0.25 m columns, heights from the sim's ridge line plus a rolling sideways bump that is zero at z = 0 ---- */
      var NX = 176, NZ = 48, TX0 = -22, TW = 44, TZ0 = -16, TD = 24, tgeo = new THREE.PlaneGeometry(TW, TD, NX, NZ); tgeo.rotateX(-Math.PI/2); tgeo.translate(TX0 + TW/2, 0, TZ0 + TD/2);
      var tpos = tgeo.attributes.position, tcol = new Float32Array(tpos.count*3); tgeo.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
      var tmat = new THREE.MeshStandardMaterial({ map:T.ground, vertexColors:true, roughness:.95, metalness:0 }), terrain = new THREE.Mesh(tgeo, tmat); terrain.receiveShadow = true; scene.add(terrain);
      var cGrass = new THREE.Color(0x6fae52), cGrass2 = new THREE.Color(0x3f6a2c), cDirt = new THREE.Color(0x6b4a2c), cRock = new THREE.Color(0x4e4036), cScorch = new THREE.Color(0x1e150e), cc = new THREE.Color();
      function ridgeH(x){ var px = x/S + W/2; if(px < 0) return (H - ter[0])*S + Math.min(6, -px*S*.35); if(px > W - 1) return (H - ter[W - 1])*S + Math.min(6, (px - W + 1)*S*.35); var i = Math.floor(px), f = px - i; return (H - lerp(ter[i], ter[Math.min(W - 1, i + 1)], f))*S; }
      function scorchAt(x){ var px = Math.round(x/S + W/2); return px >= 0 && px < W ? scorch[px] : 0; }
      function refreshTerrain(){ var a = tpos.array, n = tpos.count; for(var i = 0; i < n; i++){ var x = a[i*3], z = a[i*3 + 2], h = ridgeH(x), az = Math.abs(z), side = az < 3 ? (az/3)*(az/3)*(3 - 2*az/3) : 1;
          var bump = (Math.sin(x*.62 + z*1.1)*.5 + Math.sin(x*.21 - z*.47)*1.3 + Math.sin(x*1.7 + z*2.3)*.12)*side; if(z < 0) bump += side*Math.min(-z, 4)*.12 - Math.max(0, -z - 4)*.55; else bump -= side*z*.9; if(z > 2) h = lerp(h + bump, -1.5, Math.min(1, (z - 2)/4)); else h += bump;   /* a crest: the ground falls away behind so the sky and the far ridges show, and drops off in front into a dark valley */
          a[i*3 + 1] = h; var sc = scorchAt(x)*(az < 1.5 ? 1 - az/1.5 : 0), hk = clamp((h - 2)/12, 0, 1); cc.copy(cGrass2).lerp(cGrass, hk*.8 + .1); if(az < 2.5 && z > 0) cc.lerp(cDirt, .15); if(z > 0){ cc.lerp(cRock, clamp((z - .4)/2.2, 0, .9)); cc.lerp(cScorch, clamp(z/7, 0, .5)); } cc.lerp(cScorch, sc); tcol[i*3] = cc.r; tcol[i*3 + 1] = cc.g; tcol[i*3 + 2] = cc.b; }
        /* the ridge face: columns steeper than a tank can climb turn to dirt */
        for(var j = 0; j < n; j++){ var x2 = a[j*3], z2 = a[j*3 + 2]; if(Math.abs(z2) < 2){ var sl = Math.abs(ridgeH(x2 + .25) - ridgeH(x2 - .25))*2; if(sl > .9){ cc.set(tcol[j*3], tcol[j*3 + 1], tcol[j*3 + 2]).lerp(cDirt, clamp((sl - .9)*1.2, 0, .85)); tcol[j*3] = cc.r; tcol[j*3 + 1] = cc.g; tcol[j*3 + 2] = cc.b; } } }
        tpos.needsUpdate = true; tgeo.attributes.color.needsUpdate = true; tgeo.computeVertexNormals(); }
      /* ---- pooled effects ---- */
      function PointCloud(n, map, additive){ var geo = new THREE.BufferGeometry(), pos = new Float32Array(n*3), col = new Float32Array(n*3), size = new Float32Array(n), alpha = new Float32Array(n); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
        var mat = new THREE.ShaderMaterial({ uniforms:{ map:{ value:map }, uScale:{ value:300 } }, vertexShader:'attribute float size; attribute float alpha; varying float vA; varying vec3 vC; uniform float uScale; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_PointSize = size*uScale/max(0.1, -mv.z); gl_Position = projectionMatrix*mv; }', fragmentShader:'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 tx = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, tx.a*vA); if(gl_FragColor.a < 0.004) discard;\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}', transparent:true, depthWrite:false, blending:additive ? THREE.AdditiveBlending : THREE.NormalBlending, vertexColors:true });
        var pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); var used = 0;
        return { mat:mat, n:n, begin:function(){ used = 0; }, put:function(x, y, z, s, r, g, b, a){ if(used >= n) return; var i = used++; pos[i*3] = x; pos[i*3 + 1] = y; pos[i*3 + 2] = z; col[i*3] = r; col[i*3 + 1] = g; col[i*3 + 2] = b; size[i] = s; alpha[i] = a; },
          end:function(){ geo.setDrawRange(0, used); if(used){ geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; } } }; }
      var sparks = PointCloud(600, T.soft, true), puffs = PointCloud(160, T.puff, false), dots = PointCloud(32, T.soft, false);
      var ringPool = []; for(var rp = 0; rp < 8; rp++){ var rm = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 40), new THREE.MeshBasicMaterial({ color:0xffc878, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); rm.visible = false;   /* faces the camera, so one-sided: a transparent DoubleSide material renders in two passes with two programs, both compiled on the first explosion */ scene.add(rm); ringPool.push(rm); }
      var flashPool = []; for(var fp = 0; fp < 6; fp++){ var fs = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(2.5, 2.1, 1.5), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); fs.visible = false; scene.add(fs); flashPool.push(fs); }
      var debrisPool = []; for(var dp = 0; dp < 24; dp++){ var dm = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color:0x888888, roughness:.7, metalness:.3 })); dm.visible = false; dm.castShadow = true; scene.add(dm); debrisPool.push(dm); }
      var muzzle = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(3, 2.4, 1.4), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); muzzle.scale.set(1.2, 1.2, 1); scene.add(muzzle); var muzzleT = 0;
      /* the aim line and the targeting computer's arc */
      var aimGeo = new THREE.BufferGeometry(); aimGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); var aimMat = new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.6, depthWrite:false }), aimLine = new THREE.Line(aimGeo, aimMat); aimLine.frustumCulled = false; aimLine.visible = false; scene.add(aimLine);
      /* ---- tanks and shells ---- */
      var stdMat = function(col, o){ return new THREE.MeshStandardMaterial(Object.assign({ color:col, roughness:.6, metalness:.2 }, o || {})); };
      function standTank(col){ var g = new THREE.Group(), pm = stdMat(col), dk = stdMat(0x22252a, { roughness:.9 }), st = stdMat(0x5a5e66, { metalness:.5, roughness:.4 }); pm.name = 'Paint'; g.userData.mats = [pm, dk, st];
        var hull = new THREE.Mesh(new THREE.BoxGeometry(1, .24, .52), pm); hull.position.y = .28; g.add(hull); [-.33, .33].forEach(function(z){ var tr = new THREE.Mesh(new THREE.BoxGeometry(1.06, .2, .16), dk); tr.position.set(0, .16, z); g.add(tr); });
        var tu = new THREE.Group(); tu.name = 'Turret'; tu.position.set(.02, .41, 0); g.add(tu); var td = new THREE.Mesh(new THREE.BoxGeometry(.46, .18, .38), pm); td.position.set(-.04, .09, 0); tu.add(td);
        var ba = new THREE.Group(); ba.name = 'Barrel'; ba.position.set(.22, .1, 0); tu.add(ba); var bm = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .62, 10), st); bm.rotation.z = -Math.PI/2; bm.position.x = .31; ba.add(bm);
        g.traverse(function(o){ if(o.isMesh) o.castShadow = true; }); return g; }
      function standWreck(){ var g = new THREE.Group(), ch = stdMat(0x1a1715, { roughness:1 }); var hull = new THREE.Mesh(new THREE.BoxGeometry(1, .2, .52), ch); hull.position.y = .24; g.add(hull); var tu = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .34), ch); tu.position.set(-.08, .42, .06); tu.rotation.set(.2, .5, -.15); g.add(tu); var em = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .2), new THREE.MeshStandardMaterial({ color:0xff5010, emissive:0xff5010, emissiveIntensity:2.2 })); em.position.set(0, .35, 0); g.add(em); g.userData.mats = [ch]; g.traverse(function(o){ if(o.isMesh) o.castShadow = true; }); return g; }
      function clearGroup(grp){ while(grp.children.length){ var c = grp.children[0]; grp.remove(c); c.traverse(function(o){ if(o.isMesh){ [].concat(o.material).forEach(function(m){ m.dispose(); }); } }); } }
      function TankView(t){ var v = { t:t, grp:new THREE.Group(), body:new THREE.Group(), turret:null, barrel:null, paint:[], model:false, dead:false, yaw:0, tilt:0 }; v.grp.add(v.body); scene.add(v.grp); setBody(v); return v; }
      function setBody(v){ clearGroup(v.body); var t = v.t, col = new THREE.Color(t.col), sc = MODELS.tank; v.dead = !!t.dead;
        var m = t.dead ? (sc ? cloneNode(sc, 'wreck') : standWreck()) : (sc ? cloneNode(sc, 'tank') : standTank(col)); if(!m) m = t.dead ? standWreck() : standTank(col);
        m.scale.setScalar(TS); v.body.add(m); v.model = !!sc; v.turret = m.getObjectByName('Turret'); v.barrel = m.getObjectByName('Barrel'); v.paint = (m.userData.mats || []).filter(function(mt){ return mt.name === 'Paint'; }); v.paint.forEach(function(mt){ mt.color.copy(col); mt.emissive = mt.emissive || new THREE.Color(0); });
        if(v.turret && t !== me) v.turret.rotation.y = 0; v.body.rotation.y = t === me ? 0 : Math.PI; }
      function ShellView(){ var v = { grp:new THREE.Group(), model:false, trail:null, live:false }; var sc = MODELS.tank, m = sc ? cloneNode(sc, 'shell') : null; if(m){ m.scale.setScalar(2.2); v.model = true; } else { m = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), stdMat(0xd8c090, { metalness:.5, roughness:.4 })); } v.mesh = m; v.grp.add(m);
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:T.soft, color:new THREE.Color(2, .6, .5), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending })); glow.scale.set(1.4, 1.4, 1); v.grp.add(glow); v.glow = glow;
        var tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(20*3), 3)); v.trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color:0xffe0a0, transparent:true, opacity:.55, depthWrite:false })); v.trail.frustumCulled = false; scene.add(v.trail); v.grp.visible = false; v.trail.visible = false; scene.add(v.grp); return v; }
      shellViews = [ShellView(), ShellView()];
      function rebuildViews(){ views.forEach(function(v){ scene.remove(v.grp); clearGroup(v.body); }); views = (me ? [me].concat(foes || []) : []).map(TankView); uploadScene(); }
      function onModel(){ views.forEach(setBody); shellViews.forEach(function(sv){ scene.remove(sv.grp); scene.remove(sv.trail); }); shellViews = [ShellView(), ShellView()]; uploadScene(); }
      MODELS.listeners.push(onModel);
      /* ---- post: bloom for the sun, flashes and embers, the output pass for tone mapping ---- */
      var composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(320, 180), .32, .5, 1.0); composer.addPass(bloom); composer.addPass(new THREE.OutputPass());
      var auto = { level:0, samples:[], last:0, p50:0, windows:0 }, AUTO_K = [1, .8, .62, .5];
      function applyGfx(){ var tier = soft ? 'low' : SET.gfx, dpr = window.devicePixelRatio || 1, pr = (soft ? .3 : { low:.55, medium:.8, high:Math.min(1.5, dpr), ultra:Math.min(2, dpr) }[tier])*AUTO_K[auto.level]; renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
        bloom.enabled = (tier !== 'low' && auto.level < 3) || /[?&]gl=1/.test(location.search); var sh = (tier === 'high' || tier === 'ultra') && auto.level < 2 && !soft; if(renderer.shadowMap.enabled !== sh){ renderer.shadowMap.enabled = sh; scene.traverse(function(o){ if(o.isMesh) [].concat(o.material).forEach(function(m){ m.needsUpdate = true; }); }); } sunL.castShadow = sh; sunL.shadow.mapSize.set(tier === 'ultra' ? 2048 : 1024, tier === 'ultra' ? 2048 : 1024); if(sunL.shadow.map){ sunL.shadow.map.dispose(); sunL.shadow.map = null; }
        if(vw > 2) P.resize(vw, vh); }
      /* one draw with culling off and every pooled object shown puts every vertex buffer and program on the GPU now, not in the first frame you see them. Into the composer's buffer when bloom runs, straight to the canvas when it does not: programs are keyed by the target (colour space, tone mapping), so warming into a spare target compiles the wrong variant */
      function uploadScene(){ try { var culled = [], hidden = []; scene.traverse(function(o){ if(o.isMesh && o.frustumCulled){ o.frustumCulled = false; culled.push(o); } if(o.visible === false && !o.isLight){ o.visible = true; hidden.push(o); } }); renderer.setRenderTarget(bloom.enabled ? composer.readBuffer : null); renderer.render(scene, camera); culled.forEach(function(o){ o.frustumCulled = true; }); hidden.forEach(function(o){ o.visible = false; }); } catch(e){} finally { try { renderer.setRenderTarget(null); } catch(e2){} } }
      function camDist(){ var tv = Math.tan(camera.fov*Math.PI/360); return Math.max(16.5/(tv*camera.aspect), 10.5/tv)*1.06; }
      var P = { scene:scene, camera:camera, renderer:renderer, bloom:bloom, terrain:terrain, sunL:sunL, soft:function(){ return soft; }, auto:function(){ return { level:auto.level, p50:+auto.p50.toFixed(1), pr:renderer.getPixelRatio() }; },
        resize:function(w, h){ vw = w; vh = h; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); var sc = h*renderer.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360)); [sparks, puffs, dots].forEach(function(pc){ pc.mat.uniforms.uScale.value = sc; }); },
        applySettings:function(){ applyGfx(); snd.volume(SET.vol); },
        reset:function(){ scorch.fill(0); camX = camXT = 0; camZoom = 0; rebuildViews(); },
        project:function(x, y, z){ tmpV.set(x, y, z || 0).project(camera); return { x:(tmpV.x + 1)/2*vw, y:(1 - tmpV.y)/2*vh, z:tmpV.z }; },
        /* the pointer, in the framework's 0..W x 0..H canvas units, dropped onto the field plane z = 0 and returned in field pixels */
        unproject:function(px, py){ tmpV.set(px/W*2 - 1, -(py/H*2 - 1), .5).unproject(camera); var d = tmpV.sub(camera.position).normalize(), k = -camera.position.z/(d.z || -1e-6); var hx = camera.position.x + d.x*k, hy = camera.position.y + d.y*k; return { x:hx/S + W/2, y:H - hy/S }; },
        upload:uploadScene, views:function(){ return views; }, shells:function(){ return shellViews; },
        dispose:function(){ var li = MODELS.listeners.indexOf(onModel); if(li >= 0) MODELS.listeners.splice(li, 1); try { composer.dispose && composer.dispose(); } catch(e){} try { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } catch(e){} },
        frame:function(dt){ frame(dt); } };
      /* ---- the per-frame animation of everything the sim decided ---- */
      var camCur = new THREE.Vector3(0, 9, 26), lookCur = new THREE.Vector3(0, 8, 0), shakeT = 0;
      function frame(dt){ renderer.info.reset();
        if(terDirty){ refreshTerrain(); terDirty = false; }
        for(var e = 0; e < EV.length; e++){ var ev = EV[e];
          if(ev.type === 'reset' || ev.type === 'round') rebuildViews();
          else if(ev.type === 'terrain') scorch.fill(0);
          else if(ev.type === 'crater'){ for(var i = Math.max(0, Math.floor(ev.x - ev.r)); i < Math.min(W, ev.x + ev.r); i++){ var d = Math.abs(i - ev.x)/ev.r; scorch[i] = Math.min(1, scorch[i] + (1 - d)*(1 - d)*1.1); } }
          else if(ev.type === 'wreck'){ views.forEach(function(v){ if(v.t === ev.who) setBody(v); }); }
          else if(ev.type === 'boom'){ var fl = flashL[0].t > flashL[1].t ? flashL[1] : flashL[0]; fl.l.position.set(wx(ev.x), wy(ev.y) + .6, .8); fl.t = .5*Math.sqrt(ev.size); fl.k = 9*ev.size; fl.l.distance = 10 + 6*ev.size; camZoom = Math.min(1, camZoom + .25*ev.size); }
          else if(ev.type === 'fire'){ var mv = views.filter(function(v){ return v.t === ev.who; })[0]; if(mv && mv.barrel){ tmpV.set(.66*TS, 0, 0); mv.barrel.localToWorld(tmpV); muzzle.position.copy(tmpV); muzzle.scale.setScalar(ev.nuke ? 2.6 : 1.4); muzzleT = .14; var fl2 = flashL[0].t > flashL[1].t ? flashL[1] : flashL[0]; fl2.l.position.copy(tmpV); fl2.l.position.z += .6; fl2.t = .18; fl2.k = ev.nuke ? 9 : 4; } } }
        EV.length = 0;
        /* camera: framed on the field, easing toward a shell in flight and pulling in a touch on a hit; the sim's shake in metres */
        var target = 0, zoom = 0; if(shots.length){ target = clamp(wx(shots[0].x)*.28, -3.5, 3.5); zoom = .5; } if(phase === 'diff'){ target = Math.sin(t*.13)*2.2; } camXT = lerp(camXT, target, Math.min(1, dt*1.6)); camZoom = Math.max(0, camZoom - dt*1.2);
        var dist = camDist(), zk = 1 - .035*camZoom - .03*zoom; camCur.set(camXT*.7, 9.4 + dist*.1, dist*zk); lookCur.set(camXT, 7.9, 0);
        shakeT += dt*60; var sk = shake*S*.55; camera.position.copy(camCur); camera.position.x += Math.sin(shakeT*1.3)*sk*rnd(.4, 1); camera.position.y += Math.cos(shakeT*1.7)*sk*rnd(.4, 1); camera.lookAt(lookCur);
        clouds.forEach(function(cs){ cs.position.x += (wind*.5 + 1.2)*S*dt*8; if(cs.position.x > 70) cs.position.x = -70; if(cs.position.x < -70) cs.position.x = 70; });
        flashL.forEach(function(fl){ if(fl.t > 0){ fl.t -= dt; fl.l.intensity = Math.max(0, fl.k*fl.t*(fl.t < .1 ? fl.t*10 : 1)*3); } else fl.l.intensity = 0; });
        if(muzzleT > 0){ muzzleT -= dt; muzzle.material.opacity = Math.max(0, muzzleT/.14); } else muzzle.material.opacity = 0;
        /* tanks: position on the ridge, hull tilted to the slope, turret yawed toward the aim side, barrel elevated, recoil, hit flash, drive bob */
        views.forEach(function(v){ var tk = v.t; if(!!tk.dead !== v.dead) setBody(v); var xi = Math.round(clamp(tk.x, 4, W - 5)), sl = (ter[xi + 4] - ter[xi - 4])/8, tilt = Math.atan(-sl); v.tilt = lerp(v.tilt, tilt, Math.min(1, dt*8)); v.grp.position.set(wx(tk.x), wy(tk.y) - .02, 0); v.grp.rotation.z = v.tilt; v.body.position.y = tk.moving ? Math.sin(t*38)*.012 : 0;
          if(v.turret){ var faceR = tk === me, aimR = tk.ang <= 90, want = (faceR === aimR) ? 0 : Math.PI; v.yaw = lerp(v.yaw, want, Math.min(1, dt*6)); v.turret.rotation.y = v.yaw; var elev = (aimR ? tk.ang : 180 - tk.ang)*Math.PI/180; v.barrel.rotation.z = lerp(v.barrel.rotation.z, elev, Math.min(1, dt*14)); v.barrel.position.x = .22 - (tk.recoil || 0)*.1; }
          var fk = tk.flash > 0 && Math.floor(tk.flash*20) % 2 ? 1 : 0; if(v.paint.length && v.fk !== fk){ v.fk = fk; v.paint.forEach(function(mt){ mt.emissive.setHex(fk ? 0xffffff : 0); mt.emissiveIntensity = fk ? 1.2 : 0; }); } });
        /* shells: the model rides the velocity, the trail is the sim's last 18 points */
        shellViews.forEach(function(sv, i){ var sh = shots[i]; if(!sh){ if(sv.live){ sv.live = false; sv.grp.visible = false; sv.trail.visible = false; } return; } sv.live = true; sv.grp.visible = true; sv.trail.visible = true; sv.grp.position.set(wx(sh.x), wy(sh.y), 0); sv.mesh.rotation.z = Math.atan2(-sh.vy, sh.vx); var big = sh.nuke ? 2.2 : sh.big ? 1.35 : 1; sv.mesh.scale.setScalar((sv.model ? 2.2 : 1)*big); sv.glow.material.opacity = sh.nuke ? .9 : .25; sv.glow.material.color.setRGB(sh.nuke ? 2.5 : 1.6, sh.nuke ? .5 : 1.2, sh.nuke ? .4 : .7); sv.trail.material.color.setHex(sh.nuke ? 0xff7a70 : 0xffe0a0);
          var tp = sv.trail.geometry.attributes.position, n = Math.min(20, sh.trail.length); for(var k = 0; k < n; k++){ var q = sh.trail[sh.trail.length - n + k]; tp.array[k*3] = wx(q.x); tp.array[k*3 + 1] = wy(q.y); tp.array[k*3 + 2] = 0; } tp.needsUpdate = true; sv.trail.geometry.setDrawRange(0, n); });
        /* the aim line and the computer's arc, only on your turn */
        var mine = myTurn(); aimLine.visible = mine; dots.begin(); if(mine){ var a = me.ang*Math.PI/180, L = (20 + me.pow*.9)*S, ap = aimGeo.attributes.position.array; ap[0] = wx(me.x); ap[1] = wy(me.y - 16); ap[2] = .05; ap[3] = ap[0] + Math.cos(a)*L; ap[4] = ap[1] + Math.sin(a)*L; ap[5] = .05; aimGeo.attributes.position.needsUpdate = true; aimMat.color.setHex(nukeArmed ? 0xff5f57 : 0xffffff); aimMat.opacity = nukeArmed ? .9 : .55;
          if(upg.guide) guidePath().forEach(function(p){ dots.put(wx(p[0]), wy(p[1]), .1, .16, 1, 1, 1, .7); }); } dots.end();
        /* sparks, smoke, rings, flashes, debris straight from the sim's arrays */
        sparks.begin(); parts.forEach(function(q){ var k = 1 - q.t/q.life; cc.set(q.col); sparks.put(wx(q.x), wy(q.y), rnd(-.25, .25), .22 + .1*k, cc.r*(1 + k), cc.g*(1 + k*.6), cc.b*k, k); }); sparks.end();
        puffs.begin(); smoke.forEach(function(q){ var k = 1 - q.t/q.life; puffs.put(wx(q.x), wy(q.y), .3 + (q.r % 1)*.6, q.r*S*2.6, .36, .33, .32, .72*k); }); puffs.end();
        ringPool.forEach(function(rm, i){ var q = rings.filter(function(r){ return !r.flash; })[i]; if(!q){ rm.visible = false; return; } var k = q.t/q.life; rm.visible = true; rm.position.set(wx(q.x), wy(q.y), .4); var rr = (q.r*k*1.6 + 4)*S; rm.scale.set(rr, rr, 1); rm.material.opacity = .8*(1 - k); });
        flashPool.forEach(function(fs, i){ var q = rings.filter(function(r){ return r.flash; })[i]; if(!q){ fs.visible = false; return; } var k = q.t/q.life; fs.visible = true; fs.position.set(wx(q.x), wy(q.y), .5); var fr = q.r*(0.4 + k)*S*2.4; fs.scale.set(fr, fr, 1); fs.material.opacity = .9*(1 - k); });
        debrisPool.forEach(function(dm, i){ var q = debris[i]; if(!q){ dm.visible = false; return; } dm.visible = true; dm.position.set(wx(q.x), wy(q.y) + .1, rnd(-.02, .02) + (i % 5)*.12 - .24); dm.rotation.set(0, i*.7, q.rot); dm.scale.set(q.w*S, q.h*S, .12); if(dm.userData.col !== q.col){ dm.userData.col = q.col; dm.material.color.set(q.col); } });
        /* the governor: two seconds of frames under 42 fps (after the first four) steps the picture down a notch; it never steps back up in a session */
        var now = performance.now(); if(auto.last && !document.hidden && !soft){ var gap = now - auto.last; if(gap < 200){ auto.samples.push(gap); if(auto.samples.length >= 120){ auto.samples.sort(function(a, b){ return a - b; }); auto.p50 = auto.samples[60]; auto.samples.length = 0; auto.windows++; if(auto.p50 > 24 && auto.level < 3 && auto.windows > 2){ auto.level++; applyGfx(); try { console.info('Tanks: frames at '+auto.p50.toFixed(0)+' ms, picture stepped down to level '+auto.level); } catch(e){} } } } } auto.last = now;
        if(bloom.enabled) composer.render(); else renderer.render(scene, camera); P.stats = { calls:renderer.info.render.calls, tris:renderer.info.render.triangles };
      }
      applyGfx(); terDirty = true; rebuildViews(); loadModels();   /* the terrain and the tanks come with the first frame: reset() runs after make() */
      return P;
    }
/* tigOS arcade, Tanks part 03: the HUD over the canvas (angle, power, fuel, wind, round, coins, the nuke line, the message banner, a name and
   health tag that follows every tank), the difficulty card that doubles as the front menu, the shop, input, and the peek/dbg hooks the test
   suite drives. Closes tanks(). */
    var tags = [], hud = {}, sel = {};
    (function buildDom(){
      hudEl = document.createElement('div'); hudEl.className = 'tk-hud';
      hudEl.innerHTML = '<div class="tk-tags"></div><div class="tk-tl"><b data-aim>45\u00b0 60%</b><div class="tk-bar"><i data-fuelbar></i></div><span data-fuel>fuel 10</span><span class="tk-nuke" data-nuke hidden></span></div>'+
        '<div class="tk-wind"><span data-windtxt>wind 0</span><div class="tk-gauge"><i data-windbar></i></div></div><div class="tk-tr"><b data-round>round 1</b><span data-coins>0 coins</span></div>'+
        '<div class="tk-msg" data-msg></div><div class="tk-hint" data-hint></div><div class="tk-cpu" data-cpu></div>';
      api.stage.appendChild(hudEl); tagsEl = hudEl.firstChild; ['aim', 'fuelbar', 'fuel', 'nuke', 'windtxt', 'windbar', 'round', 'coins', 'msg', 'hint', 'cpu'].forEach(function(k){ hud[k] = hudEl.querySelector('[data-'+k+']'); });
      var diffRows = DIFFS.map(function(d, i){ return '<li><button type="button" data-diff="'+i+'" style="--c:'+d.col+'"><i></i><span class="tk-it"><b>'+(i + 1)+'  '+esc(d.name)+'</b><small>'+esc(d.desc)+'</small></span></button></li>'; }).join('');
      var shopRows = SHOP.concat([{ id:'go', name:'Next round', desc:'Roll out', cost:0 }]).map(function(it, i){ return '<li><button type="button" data-shop="'+i+'" data-id="'+it.id+'"><span class="tk-it"><b data-name>'+esc(it.name)+'</b><small>'+esc(it.desc)+'</small></span><span class="tk-cost"><b data-cost></b><small data-need></small></span></button></li>'; }).join('');
      menuEl = document.createElement('div'); menuEl.className = 'tk-menu gm-ui';
      menuEl.innerHTML = '<div class="tk-panel" data-panel="diff"><h2>Tanks</h2><p class="tk-sub">Choose your difficulty</p><ul class="tk-list tk-diffs">'+diffRows+'</ul>'+
          '<div class="tk-set"><label><span>Graphics</span><select data-set="gfx">'+GFX.map(function(k){ return '<option value="'+k+'"'+(k === SET.gfx ? ' selected' : '')+'>'+k+'</option>'; }).join('')+'</select></label><label><span>Volume</span><input type="range" data-set="vol" min="0" max="1" step=".05" value="'+SET.vol+'"><output>'+Math.round(SET.vol*100)+'%</output></label></div>'+
          '<p class="tk-foot" data-difffoot></p></div>'+
        '<div class="tk-panel" data-panel="shop" hidden><h2 data-shoptitle>Round won</h2><p class="tk-coins" data-shopcoins>\u25c6  0 coins to spend</p><ul class="tk-list tk-shop">'+shopRows+'</ul><p class="tk-shopmsg" data-shopmsg></p><p class="tk-foot" data-shopfoot></p></div>';
      api.stage.appendChild(menuEl);
      ['difffoot', 'shoptitle', 'shopcoins', 'shopmsg', 'shopfoot'].forEach(function(k){ hud[k] = menuEl.querySelector('[data-'+k+']'); }); hud.diffPanel = menuEl.querySelector('[data-panel="diff"]'); hud.shopPanel = menuEl.querySelector('[data-panel="shop"]');
      hud.difffoot.textContent = api.touch ? 'tap to pick, tap again to roll out' : 'up/down or 1-4 pick, space rolls out'; hud.shopfoot.textContent = api.touch ? 'tap to pick, tap again to buy' : 'up/down pick, space buys or continues';
      hud.hint.textContent = api.touch ? 'drag from your tank to aim, release to fire. Pad drives and tunes' : 'left/right drive (fuel), up/down angle, w/s power, space fires';
      menuEl.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; if(b.hasAttribute('data-diff')){ var di = +b.getAttribute('data-diff'); if(phase !== 'diff') return; if(di === diffSel) pickDiff(di); else { diffSel = di; snd.ui(true); } } else if(b.hasAttribute('data-shop')){ var si = +b.getAttribute('data-shop'); if(phase !== 'shop') return; if(si === shopSel) shopPick(si); else { shopSel = si; snd.ui(true); } } api.stage.focus({ preventScroll:true }); });
      var onSet = function(e){ var el = e.target.closest('[data-set]'); if(!el) return; var k = el.getAttribute('data-set'); if(k === 'gfx'){ SET.gfx = el.value; } else if(k === 'vol'){ SET.vol = +el.value; var o = el.parentNode.querySelector('output'); if(o) o.textContent = Math.round(SET.vol*100)+'%'; } saveSet(); if(R) R.applySettings(); };
      menuEl.addEventListener('input', onSet); menuEl.addEventListener('change', onSet);
    })();
    function setText(k, s){ if(last[k] !== s){ last[k] = s; hud[k].textContent = s; } }
    function setW(k, el, w){ if(last[k] !== w){ last[k] = w; el.style.width = w+'%'; } }
    function tagFor(i, tk){ var el = tags[i]; if(!el){ el = document.createElement('div'); el.className = 'tk-tag'; el.innerHTML = '<span class="tk-name"></span><div class="tk-hp"><i></i></div><div class="tk-fu"><i></i></div>'; tagsEl.appendChild(el); tags[i] = el; el.q = { name:el.firstChild, hp:el.children[1].firstChild, fu:el.children[2], fub:el.children[2].firstChild, k:{} }; } return el; }
    function drawHud(){
      var play = phase === 'play' || phase === 'won' || phase === 'dead', menu = phase === 'diff' || phase === 'shop'; if(last.hudOn !== play){ last.hudOn = play; hudEl.classList.toggle('on', play); }
      if(last.menuOn !== menu){ last.menuOn = menu; menuEl.hidden = !menu; } if(menu){ var sp = phase === 'shop'; if(last.shopOn !== sp){ last.shopOn = sp; hud.diffPanel.hidden = sp; hud.shopPanel.hidden = !sp; }
        if(!sp){ if(last.diffSel !== diffSel){ last.diffSel = diffSel; [].forEach.call(menuEl.querySelectorAll('[data-diff]'), function(b, i){ b.classList.toggle('sel', i === diffSel); }); } }
        else { setText('shoptitle', 'Round '+(round - 1)+' won'); setText('shopcoins', '\u25c6  '+coins+' coins to spend'); setText('shopmsg', msgT > 0 ? msg : '');
          var rows = menuEl.querySelectorAll('[data-shop]'); for(var i = 0; i < rows.length; i++){ var b = rows[i], it = i === SHOP.length ? null : SHOP[i], owned = it ? (upg[it.id] || 0) : 0, maxed = it && it.max && owned >= it.max, can = !it || (!maxed && coins >= it.cost), key = [i === shopSel, owned, maxed, can, it ? Math.max(0, it.cost - coins) : 0].join('|');
            if(b.getAttribute('data-k') === key) continue; b.setAttribute('data-k', key); b.classList.toggle('sel', i === shopSel); b.classList.toggle('off', !can); b.classList.toggle('maxed', !!maxed);
            b.querySelector('[data-name]').textContent = it ? it.name + (owned ? (it.id === 'nuke' ? '  x'+owned : '  \u2713'+(it.max > 1 ? owned+'/'+it.max : '')) : '') : 'Next round';
            b.querySelector('[data-cost]').textContent = !it ? '\u2192' : maxed ? 'maxed' : it.cost+' coins'; b.querySelector('[data-need]').textContent = it && !maxed && !can ? 'need '+(it.cost - coins)+' more' : ''; } } }
      if(!play){ setText('msg', ''); return; }   /* the shop and the card carry their own message line; the HUD's never bleeds through */
      setText('aim', Math.round(me.ang)+'\u00b0  '+Math.round(me.pow)+'%'); setW('fuelbar', hud.fuelbar, Math.round(clamp(fuel/fuelMax, 0, 1)*100)); var lowF = fuel <= fuelMax*.3; if(last.lowF !== lowF){ last.lowF = lowF; hud.fuelbar.classList.toggle('low', lowF); } setText('fuel', 'fuel '+Math.ceil(fuel));
      var nk = upg.nuke > 0 ? (nukeArmed ? 'NUKE ARMED' : 'nuke x'+upg.nuke+'  (N arms)') : ''; if(last.nk !== nk){ last.nk = nk; hud.nuke.hidden = !nk; hud.nuke.textContent = nk; hud.nuke.classList.toggle('armed', nukeArmed); }
      setText('windtxt', 'wind '+Math.abs(wind)); if(last.wind !== wind){ last.wind = wind; hud.windbar.style.left = wind < 0 ? (50 + wind*1.6)+'%' : '50%'; hud.windbar.style.width = Math.abs(wind)*1.6+'%'; }
      setText('round', 'round '+round); setText('coins', coins+' coins');
      var m = msgT > 0 && phase !== 'shop' ? msg : ''; setText('msg', m); var mo = msgT > 0 ? Math.min(1, msgT) : 0; if(Math.abs((last.mo || 0) - mo) > .04){ last.mo = mo; hud.msg.style.opacity = mo; }
      var hint = round === 1 && kills === 0 && myTurn(); if(last.hint !== hint){ last.hint = hint; hud.hint.classList.toggle('on', hint); }
      setText('cpu', phase === 'play' && turn >= 0 ? foes[turn].name+(foes[turn].drive && foes[turn].drive.left > 0 ? ' is moving  \u00b7  fuel '+Math.ceil(foes[turn].fuel) : ' is aiming') : '');
      /* the tags: projected from a point above each turret, integer pixels, guarded so an idle frame touches nothing */
      var all = [me].concat(foes); for(var i = 0; i < all.length; i++){ var tk = all[i], el = tagFor(i, tk), p = R.project(wx(tk.x), wy(tk.y) + 1.55, 0), q = el.q, sx = Math.round(p.x), sy = Math.round(p.y), on = p.z < 1 && !tk.dead;
        if(q.k.on !== on){ q.k.on = on; el.classList.toggle('on', on); el.classList.toggle('me', tk === me); } if(!on) continue; if(q.k.x !== sx || q.k.y !== sy){ q.k.x = sx; q.k.y = sy; el.style.transform = 'translate('+sx+'px,'+sy+'px)'; }
        var nm = tk === me ? '' : tk.name; if(q.k.nm !== nm){ q.k.nm = nm; q.name.textContent = nm; } var hpw = Math.round(clamp(tk.hp/tk.max, 0, 1)*100), lowH = tk.hp <= tk.max*.4; if(q.k.hp !== hpw){ q.k.hp = hpw; q.hp.style.width = hpw+'%'; } if(q.k.low !== lowH){ q.k.low = lowH; q.hp.classList.toggle('low', lowH); }
        if(tk !== me){ var fw = Math.round(clamp(tk.fuel/tk.fuelMax, 0, 1)*100); if(q.k.fu !== fw){ q.k.fu = fw; q.fub.style.width = fw+'%'; } } }
      for(var j = all.length; j < tags.length; j++){ if(tags[j].q.k.on){ tags[j].q.k.on = false; tags[j].classList.remove('on'); } }
    }
    /* ---- the frame ---- */
    g.update0 = g.update; g.update = function(dt){ g.update0(dt); frameDt = dt; };
    g.draw = function(){ if(!R) return; var dt = frameDt; frameDt = 0; R.frame(dt); drawHud(); };
    g.resize = function(w, h){ if(R) R.resize(w, h); };
    /* ---- the pointer: menus are DOM (the framework hands .gm-ui clicks straight to them); in play, the pointer drops onto the field plane and drives the drag-to-aim ---- */
    g.pointer = function(type, x, y){ if(phase !== 'play' || !R) return; var p = R.unproject(x, y); if(type === 'down') aimDown(p.x, p.y); else if(type === 'move') aimMove(p.x, p.y); else if(type === 'up') aimUp(); };
    g.destroy = function(){ [hudEl, menuEl].forEach(function(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }); snd.close(); if(R) R.dispose(); R = null; };
    /* ---- what the tests read ---- */
    g.peek = function(){ return { turn:turn, phase:phase, shots:shots.length, meHp:me.hp, foes:foes.map(function(f){ return f.hp; }), round:round, wind:wind, ang:me.ang, pow:me.pow, fuel:fuel, fuelMax:fuelMax, coins:coins, upg:upg, x:me.x, y:me.y, shopSel:shopSel, diff:D.id, diffSel:diffSel, foeX:foes.map(function(f){ return Math.round(f.x); }), foeFuel:foes.map(function(f){ return +f.fuel.toFixed(1); }), foeFuelMax:foes.map(function(f){ return f.fuelMax; }), kills:kills, score:score, model:!!MODELS.tank, modelFailed:MODELS.failed.tank || null, soft:R ? R.soft() : null, gfx:SET.gfx }; };
    g.dbg = { killFoes:function(){ foes.forEach(function(f){ f.hp = 0; }); }, coins:function(n){ coins = n; status(); }, diff:function(i){ if(phase === 'diff') pickDiff(i); }, fire:function(){ if(myTurn()) fire(me); }, aim:function(a, p){ me.ang = clamp(a, 0, 180); me.pow = clamp(p, 15, 100); status(); },
      model:function(k, buf, cb){ parseModel(k, buf, cb); }, models:function(){ return { tank:!!MODELS.tank, failed:MODELS.failed }; }, tick:function(sec){ var n = Math.round((sec || 1)*60); for(var i = 0; i < n; i++) g.update(1/60); return t; },
      toScreen:function(sx, sy){ var p = R.project(wx(sx), wy(sy), 0); return { x:p.x/vw*W, y:p.y/vh*H }; },   /* field pixels to the framework's pointer units */
      unproject:function(x, y){ return R.unproject(x, y); }, views:function(){ return R.views().map(function(v){ return { name:v.t.name, model:v.model, dead:v.dead, yaw:+v.yaw.toFixed(2), tilt:+v.tilt.toFixed(3), barrel:v.barrel ? +v.barrel.rotation.z.toFixed(3) : null, x:+v.grp.position.x.toFixed(2), y:+v.grp.position.y.toFixed(2), meshes:(function(){ var n = 0; v.grp.traverse(function(o){ if(o.isMesh) n++; }); return n; })() }; }); },
      shells:function(){ return R.shells().map(function(sv){ return { live:sv.live, model:sv.model, trail:sv.trail.geometry.drawRange.count }; }); }, terrain:function(){ var a = R.terrain.geometry.attributes.position, mn = 1e9, mx = -1e9; for(var i = 0; i < a.count; i++){ var z = a.array[i*3 + 2]; if(Math.abs(z) < .01){ mn = Math.min(mn, a.array[i*3 + 1]); mx = Math.max(mx, a.array[i*3 + 1]); } } return { verts:a.count, ridgeMin:+mn.toFixed(2), ridgeMax:+mx.toFixed(2) }; },
      gpu:function(){ var r = R.renderer, st = R.stats || {}; return { programs:r.info.programs.length, textures:r.info.memory.textures, geometries:r.info.memory.geometries, calls:st.calls, tris:st.tris }; }, progs:function(){ return R.renderer.info.programs.map(function(p){ return p.id+' '+p.name+' '+p.usedTimes+' '+p.cacheKey; }); }, matProgs:function(){ var out = []; R.scene.traverse(function(o){ if(!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return; [].concat(o.material).forEach(function(m){ var pr = R.renderer.properties.get(m), cp = pr && pr.currentProgram; out.push((o.name || o.type)+'/'+m.type+'/'+(m.name || '')+' -> '+(cp ? cp.id : 'none')); }); }); return out; }, sceneLights:function(){ var n = 0; R.scene.traverseVisible(function(o){ if(o.isLight) n++; }); return n; }, auto:function(){ return R.auto(); }, shadows:function(){ return R.renderer.shadowMap.enabled && R.sunL.castShadow; },
      set:function(k, v){ SET[k] = v; saveSet(); R.applySettings(); return SET; }, sim:function(){ return { W:W, H:H, S:S, G:G, DIFFS:DIFFS, SHOP:SHOP }; }, ev:function(){ return EV.length; } };
    R = Picture(); R.resize(api.canvas.clientWidth || W, api.canvas.clientHeight || H);
    return g;
  }
  (window.TIG_REGISTER || function(d){ GAMES.push(d); })({ id:'tanks', W:W, H:H, gl:true, lib:'three', menu:true, make:tanks });
})();

