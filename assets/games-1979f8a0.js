/* tigOS arcade games.js, part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
/* tigOS arcade: game logic only. The framework in app.js (RENDER.games) owns the canvas, HUD, loop, keys, scores and fullscreen.
   Contract: make(api) -> { reset(), update(dt seconds), draw(ctx), key(name, down) -> handled?, pointer(type, x, y) }
   api: { W, H, score(n), over(headline), status(text), best, touch }.  Logical coordinates are fixed per game; the framework letterboxes. */
window.TIG_GAMES = (function(){
  var FONT = 'ui-monospace, Menlo, Consolas, monospace';
  var rnd = function(a, b){ return a + Math.random() * (b - a); };
  var ri = function(a, b){ return Math.floor(rnd(a, b + 1)); };
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
  var rr = function(c, x, y, w, h, r){ r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x+r, y); c.arcTo(x+w, y, x+w, y+h, r); c.arcTo(x+w, y+h, x, y+h, r); c.arcTo(x, y+h, x, y, r); c.arcTo(x, y, x+w, y, r); c.closePath(); };
  var text = function(c, s, x, y, size, col, align, weight){ c.font = (weight || 600)+' '+size+'px '+FONT; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  var bg = function(c, W, H, a, b){ var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a || '#111119'); g.addColorStop(1, b || '#07070b'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  /* ONE AudioContext for the whole arcade (window.TIG_AUDIO). Safari (macOS and iOS) starts a context suspended unless it is created or resumed inside a user gesture,
     flips it to 'interrupted' after a phone call or a backgrounded tab, and old iOS caps the number of contexts a page may open, so every game used to get stuck silent
     the moment its first sound was scheduled from the frame loop rather than a click. The shared context is created on the first gesture after a game asks for sound,
     resumed on every later gesture and on returning to the tab, and unlocked the iOS way (a silent one-sample buffer played inside the gesture). Nothing ever closes it. */
  window.TIG_AUDIO = window.TIG_AUDIO || (function(){ var ac = null, dead = false, wanted = false, unlocked = false, gestures = 0;
    function make(){ if(ac || dead) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ dead = true; ac = null; } return ac; }
    function kick(){ if(!ac) return; try { if(ac.state !== 'running') ac.resume(); } catch(e){} if(!unlocked){ try { var b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); if(ac.state === 'running') unlocked = true; } catch(e){} } }
    function gesture(){ gestures++; if(wanted){ make(); kick(); } }
    ['pointerdown', 'touchend', 'mousedown', 'keydown', 'click'].forEach(function(t){ document.addEventListener(t, gesture, { capture:true, passive:true }); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden && ac) kick(); });
    return { ctx:function(){ wanted = true; var a = make(); if(a) kick(); return a; }, resume:kick, state:function(){ return { ctx:!!ac, state:ac ? ac.state : null, wanted:wanted, unlocked:unlocked, gestures:gestures, dead:dead }; } }; })();
  /* tiny shared WebAudio synth on that context (silent if the browser refuses). rounds.js reuses it via window.TIG_SFX */
  var SFX = (function(){ var ac = null, master, dead = false; function ctx(){ if(ac){ window.TIG_AUDIO.resume(); return ac; } if(dead) return null; try { ac = window.TIG_AUDIO.ctx(); if(!ac) throw 0; master = ac.createGain(); master.gain.value = .3; master.connect(ac.destination); } catch(e){ dead = true; ac = null; } return ac; }
    function tone(type, f0, f1, dur, gain, delay){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02); }
    function noise(dur, freq, gain, q, delay){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + (delay || 0)); }
    return { tone:tone, noise:noise, ctx:ctx }; })();
  window.TIG_SFX = SFX;
  /* Front menus for the canvas games. One card builder in the Mines look (.mn-menu / .mn-panel, styles in core/styles/39-mines.css) so every game opens on its own setup
     screen: rows of option pills, a hint line, Play and Defaults, settings kept in localStorage under tigos.<id>. Each game declares its own options here and paints its own
     backdrop behind the card (someone quietly playing). The framework treats a `.gm-ui` element as the game's own: clicks go to it, not the canvas, and `G.menu` games are
     never paused or restarted while `inMenu()`.
       gameMenu(api, { id, title, sub, color, rows:[[key, label, kind?]], opt:{key:[values]}, def:{key:value}, label:{key:{value:text}}, help:{key:text}, swatch:{key:{value:css}},
                       foot, onChange(k, v, SET), onPlay(), version? }) -> { el, SET, set(k, v), sync(), show(on), hint(text), isDefault(), reset(), destroy() } */
  function gameMenu(api, spec){
    var KEY = 'tigos.'+spec.id, M = { SET:{} }, hintEl, resetBtn;
    function load(){ Object.keys(spec.def).forEach(function(k){ M.SET[k] = spec.def[k]; }); try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); Object.keys(spec.opt).forEach(function(k){ if(o[k] !== undefined && spec.opt[k].indexOf(o[k]) > -1) M.SET[k] = o[k]; }); } catch(e){} }
    function save(){ try { localStorage.setItem(KEY, JSON.stringify(M.SET)); } catch(e){} }
    function labelOf(k, v){ return spec.label && spec.label[k] && spec.label[k][v] !== undefined ? spec.label[k][v] : String(v); }
    function row(r){ var k = r[0], sw = spec.swatch && spec.swatch[k]; var btns = spec.opt[k].map(function(v){ var col = sw ? sw[v] : ''; return '<button type="button" data-opt="'+k+'" data-val="'+v+'"'+(col ? ' class="sw" style="--c:'+col+'" title="'+labelOf(k, v)+'" aria-label="'+labelOf(k, v)+'"' : '')+'>'+(col ? '' : labelOf(k, v))+'</button>'; }).join('');
      return '<div class="mn-row" data-row="'+k+'"><span class="mn-lab">'+r[1]+'</span><div class="mn-opts">'+btns+'</div></div>'; }
    load();
    var el = document.createElement('div'); el.className = 'mn-menu gm-ui mn-'+spec.id; el.hidden = true;
    el.innerHTML = '<div class="mn-panel" style="--mnc:'+(spec.color || '#ff5f57')+'"><h2>'+spec.title+'</h2><p class="mn-sub">'+(spec.sub || 'Set up the game')+'</p><div class="mn-rows">'+spec.rows.map(row).join('')+'</div>'+
      '<p class="mn-hint" data-hint></p><div class="mn-actions"><button type="button" class="mn-play" data-play>Play</button><button type="button" class="mn-reset" data-reset>Defaults</button></div><p class="mn-foot" data-foot>'+(spec.foot || '')+'</p></div>';
    api.stage.appendChild(el); hintEl = el.querySelector('[data-hint]'); resetBtn = el.querySelector('[data-reset]');
    M.el = el;
    M.isDefault = function(){ return Object.keys(spec.def).every(function(k){ return M.SET[k] === spec.def[k]; }); };
    M.hint = function(t){ hintEl.textContent = t || ''; };
    M.sync = function(){ [].forEach.call(el.querySelectorAll('[data-opt]'), function(b){ b.classList.toggle('sel', String(M.SET[b.getAttribute('data-opt')]) === b.getAttribute('data-val')); }); var d = M.isDefault(); resetBtn.hidden = d; if(!hintEl.textContent) hintEl.textContent = d ? 'These are the classic settings. Anything you change is kept in this browser.' : 'Your settings are kept in this browser.'; };
    M.set = function(k, v){ if(!spec.opt[k] || spec.opt[k].indexOf(v) < 0) return; M.SET[k] = v; save(); M.hint(spec.help && spec.help[k] ? spec.help[k] : ''); M.sync(); if(spec.onChange) spec.onChange(k, v, M.SET); };
    M.reset = function(){ Object.keys(spec.def).forEach(function(k){ M.SET[k] = spec.def[k]; }); save(); M.hint(''); M.sync(); if(spec.onChange) spec.onChange(null, null, M.SET); };
    M.show = function(on){ el.hidden = !on; if(on) M.sync(); };
    M.destroy = function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    el.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b || el.hidden) return;
      if(b.hasAttribute('data-opt')){ var k = b.getAttribute('data-opt'), raw = b.getAttribute('data-val'), v = spec.opt[k].filter(function(o){ return String(o) === raw; })[0]; if(v !== undefined) M.set(k, v); }
      else if(b.hasAttribute('data-play')){ if(spec.onPlay) spec.onPlay(); }
      else if(b.hasAttribute('data-reset')) M.reset();
      api.stage.focus({ preventScroll:true }); });
    M.sync();
    return M;
  }
  var isDir = function(k){ return { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', w:'U', W:'U', ArrowDown:'D', s:'D', S:'D' }[k] || null; };

/* tigOS arcade games.js, part 01: serpent. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Serpent (snake). Opens on its own menu (speed, board size, walls, skin, growth per bite; kept under tigos.snake); behind the card a serpent quietly
     plays itself, steering for the food and around its own tail, and starts over when it slips. Space, Enter or Play begins the real run. ---------- */
  var SN_SKIN = { orange:{ head:'#ffb15c', hue:28 }, green:{ head:'#8fd46a', hue:105 }, blue:{ head:'#8cc7ff', hue:205 }, pink:{ head:'#ff8fc8', hue:320 }, rainbow:{ head:'#ffffff', hue:-1 } };
  function snake(api){
    var g = {}, N, S, body, dir, queue, food, acc, step, alive, grow, score, state = 'menu', restT = 0, skin, wrapOn, gain;
    var menu = gameMenu(api, { id:'snake', title:'Serpent', sub:'Set up the run', color:'#28c840',
      rows:[['speed', 'Speed'], ['board', 'Board'], ['walls', 'Walls'], ['skin', 'Skin'], ['growth', 'Growth']],
      opt:{ speed:['slow', 'normal', 'fast'], board:[16, 24, 32], walls:['solid', 'wrap'], skin:Object.keys(SN_SKIN), growth:[1, 2, 3] }, def:{ speed:'normal', board:24, walls:'solid', skin:'orange', growth:2 },
      label:{ speed:{ slow:'Slow', normal:'Normal', fast:'Fast' }, board:{ 16:'16\u00d716', 24:'24\u00d724', 32:'32\u00d732' }, walls:{ solid:'Solid', wrap:'Wrap around' }, growth:{ 1:'+1', 2:'+2', 3:'+3' } },
      help:{ speed:'How fast the serpent starts. Every bite makes it a touch quicker either way.', board:'Cells across. A bigger board is a longer, calmer game.', walls:'Solid walls end the run on contact. Wrap around lets the serpent come out the far side.', skin:'The serpent\u2019s colours. Rainbow runs the spectrum down the body.', growth:'Segments gained per bite. More growth, sooner trouble.' },
      swatch:{ skin:{ orange:'#ffb15c', green:'#8fd46a', blue:'#8cc7ff', pink:'#ff8fc8', rainbow:'linear-gradient(90deg,#ff5f57,#ffd166,#28c840,#8cc7ff,#a78bfa)' } },
      foot:api.touch ? 'swipe to steer' : 'arrows or wasd steer  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function setup(){ N = SET.board; S = api.W / N; skin = SN_SKIN[SET.skin] || SN_SKIN.orange; wrapOn = SET.walls === 'wrap'; gain = SET.growth; var m = N >> 1; body = [{ x:m, y:m }, { x:m - 1, y:m }, { x:m - 2, y:m }]; dir = 'R'; queue = []; acc = 0; step = { slow:.17, normal:.13, fast:.09 }[SET.speed] || .13; alive = true; grow = 0; score = 0; restT = 0; place(); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the run, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status('length 3'); }
    g.inMenu = function(){ return state === 'menu'; };
    function place(){ var guard = 0; do { food = { x:ri(0, N-1), y:ri(0, N-1) }; } while(guard++ < 500 && body.some(function(b){ return b.x === food.x && b.y === food.y; })); }
    var DX = { L:-1, R:1, U:0, D:0 }, DY = { L:0, R:0, U:-1, D:1 }, OPP = { L:'R', R:'L', U:'D', D:'U' };
    function ahead(d){ var h = body[0], nx = h.x + DX[d], ny = h.y + DY[d]; if(wrapOn){ nx = (nx + N) % N; ny = (ny + N) % N; } return { x:nx, y:ny }; }
    function blocked(p){ if(p.x < 0 || p.y < 0 || p.x >= N || p.y >= N) return true; var tailIdx = grow > 0 ? body.length : body.length - 1; return body.slice(0, tailIdx).some(function(b){ return b.x === p.x && b.y === p.y; }); }
    g.key = function(k, down){ if(!down) return false; if(state === 'menu'){ if(k === ' ' || k === 'Enter'){ start(); return true; } return false; }
      var d = isDir(k); if(!d) return false; var last = queue.length ? queue[queue.length-1] : dir; if(d !== last && d !== OPP[last] && queue.length < 3) queue.push(d); return true; };
    g.pointer = function(){};
    g.peek = function(){ return { head:body[0], len:body.length, food:food, dir:dir, state:state, menu:state === 'menu' && !menu.el.hidden, n:N, wrap:wrapOn, step:+step.toFixed(3), skin:SET.skin, alive:alive, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, food:function(x, y){ food = { x:x, y:y }; }, tick:function(n){ for(var i = 0; i < (n || 1); i++) g.update(step); } };
    /* the ghost driver: of the three ways forward, take the safe one that gets closest to the food; with no safe way it slips, and a new serpent takes over after a beat */
    function ghost(){ var best = null, bd = 1e9; ['L', 'R', 'U', 'D'].forEach(function(d){ if(d === OPP[dir]) return; var p = ahead(d); if(blocked(p)) return; var dd = Math.abs(p.x - food.x) + Math.abs(p.y - food.y); if(wrapOn) dd = Math.min(dd, Math.abs(p.x - food.x + N) + Math.abs(p.y - food.y), Math.abs(p.x - food.x - N) + Math.abs(p.y - food.y), Math.abs(p.x - food.x) + Math.abs(p.y - food.y + N), Math.abs(p.x - food.x) + Math.abs(p.y - food.y - N)); var room = 0; ['L', 'R', 'U', 'D'].forEach(function(e){ var q = { x:p.x + DX[e], y:p.y + DY[e] }; if(wrapOn){ q.x = (q.x + N) % N; q.y = (q.y + N) % N; } if(!blocked(q)) room++; }); dd -= room*.4; if(dd < bd){ bd = dd; best = d; } }); if(best && best !== dir) queue = [best]; }
    g.update = function(dt){
      if(!alive){ if(state === 'menu'){ restT -= dt; if(restT <= 0) setup(); } return; } acc += dt; if(acc < step) return; acc -= step;
      if(state === 'menu') ghost();
      if(queue.length) dir = queue.shift();
      var nx = ahead(dir);
      if(blocked(nx)){ alive = false; if(state === 'menu'){ restT = 1.2; return; } api.over(nx.x < 0 || nx.y < 0 || nx.x >= N || nx.y >= N ? 'The serpent hit the wall' : 'The serpent bit its own tail'); return; }
      body.unshift({ x:nx.x, y:nx.y });
      if(nx.x === food.x && nx.y === food.y){ score += 10; grow += gain; step = Math.max(.05, step - .003); if(state === 'play') api.score(score); place(); }
      if(grow > 0) grow--; else body.pop();
      if(state === 'play') api.status('length '+body.length);
    };
    g.draw = function(c){
      bg(c, api.W, api.H, '#0d1410', '#06080a');
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1; for(var i = 1; i < N; i++){ c.beginPath(); c.moveTo(i*S, 0); c.lineTo(i*S, api.H); c.stroke(); c.beginPath(); c.moveTo(0, i*S); c.lineTo(api.W, i*S); c.stroke(); }
      if(wrapOn){ c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1.5; c.strokeRect(1, 1, api.W - 2, api.H - 2); c.setLineDash([]); }
      var t = Date.now() / 1000, pr = S*.32 + Math.sin(t*6) * 1.5;
      c.fillStyle = '#ff5f57'; c.beginPath(); c.arc(food.x*S + S/2, food.y*S + S/2, pr, 0, 7); c.fill();
      c.fillStyle = '#28c840'; c.fillRect(food.x*S + S/2 - 1.5, food.y*S + S/2 - pr - 5, 3, 6);
      var fade = !alive ? Math.max(.25, restT/1.2) : 1; c.globalAlpha = fade;
      for(var j = body.length - 1; j >= 0; j--){ var b = body[j], k = j / body.length; c.fillStyle = j === 0 ? skin.head : skin.hue < 0 ? 'hsl('+((k*300 + t*40) % 360)+' 85% 60%)' : 'hsl('+(skin.hue + k*30)+' 90% '+(55 - k*20)+'%)'; rr(c, b.x*S + 1.5, b.y*S + 1.5, S - 3, S - 3, j === 0 ? Math.min(7, S*.35) : Math.min(5, S*.25)); c.fill(); }
      var h = body[0], ex = dir === 'L' ? -1 : dir === 'R' ? 1 : 0, ey = dir === 'U' ? -1 : dir === 'D' ? 1 : 0, er = Math.max(1.4, S*.11);
      c.fillStyle = '#111'; [[-1,1],[1,-1]].forEach(function(o){ var px = h.x*S + S/2 + ex*S*.2 + (ey ? o[0] : 0)*S*.22, py = h.y*S + S/2 + ey*S*.2 + (ex ? o[1] : 0)*S*.22; c.beginPath(); c.arc(px, py, er, 0, 7); c.fill(); });
      c.globalAlpha = 1;
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 02: tiles. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Tiles (2048). Opens on its own menu (grid size, the goal tile, colours, how often a 4 appears; kept under tigos.2048); behind the card someone quietly
     plays a board, sliding and merging a move every half second, and starts over when it locks up. Space, Enter or Play begins the real game. ---------- */
  var TL_PAL = {
    classic:{ bg:['#1b1a22', '#0a0a10'], cell:'rgba(255,255,255,.07)', low:'#776e65', hi:'#f9f6f2', col:{ 2:'#eee4da', 4:'#ede0c8', 8:'#f2b179', 16:'#f59563', 32:'#f67c5f', 64:'#f65e3b', 128:'#edcf72', 256:'#edcc61', 512:'#edc850', 1024:'#edc53f', 2048:'#edc22e' }, big:'#3c3a32' },
    dark:{ bg:['#0d1017', '#05070b'], cell:'rgba(255,255,255,.05)', low:'#cfd6e4', hi:'#ffffff', col:{ 2:'#24304a', 4:'#2b3d63', 8:'#2f5aa8', 16:'#2f77d6', 32:'#2f95ff', 64:'#39b2ff', 128:'#4fc9ff', 256:'#63d9ff', 512:'#7ee8ff', 1024:'#a2f2ff', 2048:'#ffd166' }, big:'#ff8a00' },
    candy:{ bg:['#2a1030', '#12061a'], cell:'rgba(255,255,255,.08)', low:'#5a1a44', hi:'#fff0f7', col:{ 2:'#ffe6f3', 4:'#ffd1e8', 8:'#ffb3d9', 16:'#ff8fc8', 32:'#ff6fb5', 64:'#f04fa0', 128:'#c9b3ff', 256:'#a78bfa', 512:'#7ef0ff', 1024:'#ffe066', 2048:'#ffffff' }, big:'#ff5f57' },
    mono:{ bg:['#141414', '#060606'], cell:'rgba(255,255,255,.06)', low:'#1a1a1a', hi:'#ffffff', col:{ 2:'#f4f1ea', 4:'#e2ded5', 8:'#cfcac0', 16:'#bcb6ab', 32:'#a9a297', 64:'#958e83', 128:'#817a6f', 256:'#6d665c', 512:'#595349', 1024:'#453f37', 2048:'#2f2a24' }, big:'#ff8a00' } };
  function tiles(api){
    var N = 4, PAD = 14, CELL, g = {}, grid, score, won, anim, over, state = 'menu', PALK = TL_PAL.classic, GOAL = 2048, FOUR = .1, aiT = 0, restT = 0, moves = 0;
    var menu = gameMenu(api, { id:'2048', title:'Tiles', sub:'Set up the board', color:'#ffd166',
      rows:[['grid', 'Grid'], ['goal', 'Goal'], ['palette', 'Colours'], ['fours', 'Fours']],
      opt:{ grid:[3, 4, 5, 6], goal:[1024, 2048, 4096, 'endless'], palette:Object.keys(TL_PAL), fours:['10', '25'] }, def:{ grid:4, goal:2048, palette:'classic', fours:'10' },
      label:{ grid:{ 3:'3\u00d73', 4:'4\u00d74', 5:'5\u00d75', 6:'6\u00d76' }, goal:{ 1024:'1024', 2048:'2048', 4096:'4096', endless:'Endless' }, fours:{ 10:'1 in 10', 25:'1 in 4' } },
      help:{ grid:'Cells across. Three is a sprint, six is a long afternoon.', goal:'The tile that counts as a win; the game carries on past it for score. Endless never stops you.', palette:'The colours of the tiles.', fours:'How often a new tile is a 4 instead of a 2. More fours, faster, messier.' },
      swatch:{ palette:{ classic:'linear-gradient(90deg,#eee4da,#f2b179,#edc22e)', dark:'linear-gradient(90deg,#24304a,#2f95ff,#ffd166)', candy:'linear-gradient(90deg,#ffe6f3,#ff6fb5,#a78bfa)', mono:'linear-gradient(90deg,#f4f1ea,#2f2a24)' } },
      foot:api.touch ? 'swipe to slide' : 'arrows or wasd slide  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function setup(){ N = SET.grid; CELL = (api.W - PAD*(N + 1)) / N; PALK = TL_PAL[SET.palette] || TL_PAL.classic; GOAL = SET.goal === 'endless' ? Infinity : SET.goal; FOUR = SET.fours === '25' ? .25 : .1; grid = []; for(var i = 0; i < N*N; i++) grid.push(0); score = 0; won = false; over = false; anim = {}; moves = 0; aiT = 0; restT = 0; spawn(); spawn(); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the board, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status(GOAL === Infinity ? 'join the tiles, endless' : 'join the tiles, reach '+GOAL); }
    g.inMenu = function(){ return state === 'menu'; };
    function spawn(){ var e = []; grid.forEach(function(v, i){ if(!v) e.push(i); }); if(!e.length) return; var i = e[ri(0, e.length-1)]; grid[i] = Math.random() < 1 - FOUR ? 2 : 4; anim[i] = { t:0, kind:'new' }; }
    function line(idx, G, A){ var vals = idx.map(function(i){ return G[i]; }).filter(Boolean), out = [], moved = false, gained = 0;
      for(var i = 0; i < vals.length; i++){ if(vals[i] === vals[i+1]){ out.push(vals[i]*2); gained += vals[i]*2; i++; } else out.push(vals[i]); }
      while(out.length < N) out.push(0);
      idx.forEach(function(gi, k){ if(G[gi] !== out[k]) moved = true; if(A && out[k] && G[gi] !== out[k] && gained) A[gi] = { t:0, kind:'merge' }; G[gi] = out[k]; });
      return { moved:moved, gained:gained }; }
    function slide(d, G, A){ var moved = false, gained = 0;
      for(var r = 0; r < N; r++){ var idx = []; for(var k = 0; k < N; k++){ idx.push(d === 'L' ? r*N + k : d === 'R' ? r*N + (N-1-k) : d === 'U' ? k*N + r : (N-1-k)*N + r); } var res = line(idx, G, A); moved = moved || res.moved; gained += res.gained; }
      return { moved:moved, gained:gained }; }
    function move(d){ var res = slide(d, grid, anim);
      if(res.moved){ moves++; score += res.gained; if(state === 'play') api.score(score); spawn(); if(!won && grid.some(function(v){ return v >= GOAL; })){ won = true; if(state === 'play') api.status(GOAL+'! keep going for a higher score'); } if(!canMove()){ over = true; if(state === 'play') api.over(won ? 'Board full, but you made '+GOAL : 'No moves left'); else restT = 1.6; } }
      return res.moved; }
    function canMove(){ for(var i = 0; i < N*N; i++){ if(!grid[i]) return true; var x = i%N, y = (i/N)|0; if(x < N-1 && grid[i] === grid[i+1]) return true; if(y < N-1 && grid[i] === grid[i+N]) return true; } return false; }
    g.key = function(k, down){ if(!down) return false; if(state === 'menu'){ if(k === ' ' || k === 'Enter'){ start(); return true; } return false; } if(over) return false; var d = isDir(k); if(!d) return false; move(d); return true; };
    g.pointer = function(){};
    g.peek = function(){ return { grid:grid.slice(), score:score, state:state, menu:state === 'menu' && !menu.el.hidden, n:N, goal:GOAL === Infinity ? 'endless' : GOAL, won:won, over:over, moves:moves, max:Math.max.apply(null, grid), opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, grid:function(a){ grid = a.slice(); } };
    /* the ghost player: tries each slide on a copy and keeps the one that leaves the most room with the big tiles herded into a corner; a move every half second */
    function think(){ var best = null, bs = -1e9; ['L', 'D', 'R', 'U'].forEach(function(d, di){ var G = grid.slice(), res = slide(d, G, null); if(!res.moved) return; var empty = 0, corner = 0; for(var i = 0; i < N*N; i++){ if(!G[i]) empty++; else corner += G[i]*(1 + ((i % N)/(N-1))*.6 + (((i/N)|0)/(N-1))*.6); } var sc = res.gained*.5 + empty*30 + corner*.02 - di*.5; if(sc > bs){ bs = sc; best = d; } }); return best; }
    g.update = function(dt){ Object.keys(anim).forEach(function(i){ anim[i].t += dt; if(anim[i].t > .16) delete anim[i]; });
      if(state === 'menu'){ if(over){ restT -= dt; if(restT <= 0) setup(); return; } aiT += dt; if(aiT >= .5){ aiT = 0; var d = think(); if(d) move(d); } } };
    g.draw = function(c){
      bg(c, api.W, api.H, PALK.bg[0], PALK.bg[1]); c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 4, 4, api.W - 8, api.H - 8, 16); c.fill();
      var fs0 = N <= 4 ? 40 : N === 5 ? 32 : 26;
      for(var i = 0; i < N*N; i++){ var x = PAD + (i%N)*(CELL+PAD), y = PAD + ((i/N)|0)*(CELL+PAD), v = grid[i];
        c.fillStyle = PALK.cell; rr(c, x, y, CELL, CELL, 10); c.fill(); if(!v) continue;
        var a = anim[i], sc = a ? (a.kind === 'new' ? .5 + .5*(a.t/.16) : 1 + .18*Math.sin(Math.PI*a.t/.16)) : 1, cx = x + CELL/2, cy = y + CELL/2, s = CELL*sc;
        c.fillStyle = PALK.col[v] || PALK.big; rr(c, cx - s/2, cy - s/2, s, s, 10); c.fill();
        text(c, String(v), cx, cy + 1, v < 100 ? fs0 : v < 1000 ? fs0*.8 : fs0*.65, v <= 4 ? PALK.low : PALK.hi, 'center', 800); }
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 03: bricks. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Bricks (breakout). Opens on its own menu (paddle width, ball speed, balls, wall layout, brick palette; kept under tigos.bricks); behind the card a paddle
     quietly keeps a ball in play against the chosen wall and serves itself again when it misses. Space, Enter or Play starts the real game. ---------- */
  var BR_PAL = { rainbow:['#ff5f57', '#ff8a00', '#ffd166', '#28c840', '#8cc7ff', '#a78bfa'], sunset:['#ff3d6b', '#ff5f57', '#ff8a00', '#ffb15c', '#ffd166', '#fff1a8'], ocean:['#0e6ba8', '#1c8ad6', '#2fa8ff', '#63c8ff', '#9fe0ff', '#dff5ff'], mono:['#f4f1ea', '#d9d5cc', '#bfbab0', '#a39e94', '#878279', '#6b665e'] };
  function bricks(api){
    var W = api.W, H = api.H, g = {}, pad, ball, bricksArr, lives, level, score, held = {}, launched, flash, over, state = 'menu', PW = 100, SP0 = 300, PAL = BR_PAL.rainbow, ghostT = 0, serveT = 0;
    var menu = gameMenu(api, { id:'bricks', title:'Bricks', sub:'Set up the wall', color:'#ff8a00',
      rows:[['paddle', 'Paddle'], ['speed', 'Ball'], ['balls', 'Balls'], ['layout', 'Wall'], ['palette', 'Bricks']],
      opt:{ paddle:['short', 'normal', 'wide'], speed:['calm', 'normal', 'fast'], balls:[1, 3, 5], layout:['rows', 'pyramid', 'checker', 'random'], palette:Object.keys(BR_PAL) }, def:{ paddle:'normal', speed:'normal', balls:3, layout:'rows', palette:'rainbow' },
      label:{ paddle:{ short:'Short', normal:'Normal', wide:'Wide' }, speed:{ calm:'Calm', normal:'Normal', fast:'Fast' }, layout:{ rows:'Rows', pyramid:'Pyramid', checker:'Checker', random:'Random' } },
      help:{ paddle:'How wide your paddle is. Short is the purist\u2019s choice.', speed:'How fast the ball leaves the paddle. Every level adds a little.', balls:'Balls to lose before the game ends.', layout:'The shape of the wall. Pyramid and checker leave gaps to thread; random is a fresh wall every level.', palette:'Brick colours, top row first.' },
      swatch:{ palette:{ rainbow:'linear-gradient(90deg,#ff5f57,#ffd166,#28c840,#8cc7ff,#a78bfa)', sunset:'linear-gradient(90deg,#ff3d6b,#ff8a00,#ffd166)', ocean:'linear-gradient(90deg,#0e6ba8,#2fa8ff,#dff5ff)', mono:'linear-gradient(90deg,#f4f1ea,#6b665e)' } },
      foot:api.touch ? 'drag anywhere to move the paddle, tap to launch' : 'arrows or mouse move, space launches  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function build(){ bricksArr = []; var cols = 12, rows = 6, bw = (W - 40) / cols, bh = 20, lay = SET.layout;
      for(var r = 0; r < rows; r++) for(var col = 0; col < cols; col++){ var keep = lay === 'pyramid' ? Math.abs(col - 5.5) <= r + .6 : lay === 'checker' ? (r + col) % 2 === 0 : lay === 'random' ? Math.random() < .72 : true; if(!keep) continue;
        var hp = level > 1 && (r + col + level) % 5 === 0 ? 2 : 1; bricksArr.push({ x:20 + col*bw, y:60 + r*(bh+6), w:bw - 5, h:bh, hp:hp, col:PAL[r % PAL.length], pts:(rows - r) * 10 }); }
      if(bricksArr.length < 6) for(var q = 0; q < 8; q++) bricksArr.push({ x:20 + q*bw*1.5, y:60, w:bw - 5, h:bh, hp:1, col:PAL[0], pts:60 }); }
    function serve(){ launched = false; ball = { x:pad.x + pad.w/2, y:pad.y - 8, vx:0, vy:0, r:7 }; serveT = .9; }
    function setup(){ PW = { short:70, normal:100, wide:140 }[SET.paddle] || 100; SP0 = { calm:240, normal:300, fast:380 }[SET.speed] || 300; PAL = BR_PAL[SET.palette] || BR_PAL.rainbow; pad = { x:W/2 - PW/2, y:H - 34, w:PW, h:12 }; lives = SET.balls; level = 1; score = 0; flash = 0; over = false; held = {}; build(); serve(); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the wall, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status('level 1  \u00b7  '+lives+' ball'+(lives === 1 ? '' : 's')+'  \u00b7  space to launch'); }
    g.inMenu = function(){ return state === 'menu'; };
    function launch(){ if(launched) return; launched = true; var sp = SP0 + level*25, a = rnd(-.6, .6); ball.vx = Math.sin(a)*sp; ball.vy = -Math.cos(a)*sp; }
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } var d = isDir(k); if(d === 'L' || d === 'R'){ held[d] = down; return true; } if(k === ' ' || d === 'U'){ if(down) launch(); return true; } return false; };
    g.pointer = function(type, x){ if(state !== 'play') return; if(type === 'move' || type === 'down'){ pad.x = clamp(x - pad.w/2, 0, W - pad.w); } if(type === 'down') launch(); };
    g.peek = function(){ return { state:state, menu:state === 'menu' && !menu.el.hidden, bricks:bricksArr.length, lives:lives, level:level, score:score, launched:launched, padW:pad.w, ball:{ x:Math.round(ball.x), y:Math.round(ball.y) }, layout:SET.layout, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); } };
    g.update = function(dt){
      if(state === 'menu'){   /* the ghost: eases the paddle under the ball (a little late, like a person), serves when the ball is waiting, never runs out of balls */
        var aim = launched ? (ball.vy > 0 ? ball.x + ball.vx*.12 : ball.x*.5 + W*.25) : pad.x + pad.w/2; pad.x = clamp(pad.x + (aim - pad.w/2 - pad.x)*Math.min(1, dt*4.5), 0, W - pad.w);
        if(!launched){ serveT -= dt; if(serveT <= 0) launch(); } if(lives < 1) lives = 1; }
      if(held.L) pad.x = clamp(pad.x - 520*dt, 0, W - pad.w); if(held.R) pad.x = clamp(pad.x + 520*dt, 0, W - pad.w);
      flash = Math.max(0, flash - dt);
      if(!launched){ ball.x = pad.x + pad.w/2; ball.y = pad.y - 8; return; }
      var steps = 3, sdt = dt/steps;
      for(var s = 0; s < steps; s++){
        ball.x += ball.vx*sdt; ball.y += ball.vy*sdt;
        if(ball.x < ball.r){ ball.x = ball.r; ball.vx = Math.abs(ball.vx); } if(ball.x > W - ball.r){ ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); } if(ball.y < ball.r + 34){ ball.y = ball.r + 34; ball.vy = Math.abs(ball.vy); }
        if(ball.vy > 0 && ball.y + ball.r >= pad.y && ball.y - ball.r <= pad.y + pad.h && ball.x >= pad.x - ball.r && ball.x <= pad.x + pad.w + ball.r){ var rel = (ball.x - (pad.x + pad.w/2)) / (pad.w/2), sp = Math.hypot(ball.vx, ball.vy) * 1.02, a = rel * 1.05; ball.vx = Math.sin(a)*sp; ball.vy = -Math.cos(a)*sp; ball.y = pad.y - ball.r - .1; }
        for(var i = 0; i < bricksArr.length; i++){ var b = bricksArr[i]; if(ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w || ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) continue;
          var ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r)), oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r)); if(ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
          b.hp--; if(b.hp <= 0){ bricksArr.splice(i, 1); score += b.pts; if(state === 'play') api.score(score); } break; }
        if(over) return;
        if(ball.y > H + 20){ if(state === 'menu'){ flash = .2; serve(); return; } lives--; flash = .4; if(lives <= 0){ over = true; api.status('out of balls'); api.over('Out of balls'); return; } serve(); api.status('level '+level+'  \u00b7  '+lives+' ball'+(lives === 1 ? '' : 's')+'  \u00b7  space to launch'); return; }
      }
      if(!bricksArr.length){ level++; score += 100; if(state === 'play') api.score(score); build(); serve(); if(state === 'play') api.status('level '+level+'  \u00b7  '+lives+' balls  \u00b7  space to launch'); }
    };
    g.draw = function(c){
      bg(c, W, H, flash > 0 ? '#2a1214' : '#12101c', '#07070c');
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, 0, W, 34); text(c, 'LEVEL '+level, 16, 17, 12, 'rgba(255,255,255,.55)', 'left'); for(var l = 0; l < lives; l++){ c.fillStyle = '#ffb15c'; c.beginPath(); c.arc(W - 20 - l*16, 17, 4.5, 0, 7); c.fill(); }
      bricksArr.forEach(function(b){ c.fillStyle = b.col; c.globalAlpha = b.hp > 1 ? 1 : .9; rr(c, b.x, b.y, b.w, b.h, 4); c.fill(); if(b.hp > 1){ c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; rr(c, b.x + 2, b.y + 2, b.w - 4, b.h - 4, 3); c.stroke(); } }); c.globalAlpha = 1;
      var pg = c.createLinearGradient(pad.x, 0, pad.x + pad.w, 0); pg.addColorStop(0, '#ffb15c'); pg.addColorStop(1, '#ff6a00'); c.fillStyle = pg; rr(c, pad.x, pad.y, pad.w, pad.h, 6); c.fill();
      c.fillStyle = '#fff'; c.shadowColor = '#ffd166'; c.shadowBlur = 14; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 04: flap. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Flap. Opens on its own menu (gap width, speed, gravity, bird colour, time of day; kept under tigos.flap); behind the card a bird quietly flies the pipes on
     its own, flapping for the middle of each gap, and a new bird takes over when one clips a pipe. Space, Enter or Play starts the real flight. ---------- */
  var FL_BIRD = { yellow:{ body:'#ffd166', wing:'#ff8a00' }, red:{ body:'#ff5f57', wing:'#b3261e' }, blue:{ body:'#5aa9ff', wing:'#1c5fd6' }, pink:{ body:'#ff8fc8', wing:'#e0479c' }, mint:{ body:'#63e6be', wing:'#1f9d7a' } };
  var FL_SKY = { day:{ top:'#5aa9ff', bot:'#c9ecff', pipe:['#5ec850', '#8be07a', '#3f9c34'], ground:'#d9b46a', grass:'#8fce5a', cloud:'rgba(255,255,255,.85)', stars:false, hint:'#fff' },
    dusk:{ top:'#3a2a6a', bot:'#ff9a5c', pipe:['#3e8a52', '#5cb26f', '#2c6a3a'], ground:'#a67a4a', grass:'#6a9c46', cloud:'rgba(255,220,200,.7)', stars:false, hint:'#fff' },
    night:{ top:'#070b24', bot:'#24346a', pipe:['#2f6a3f', '#3f8a52', '#1f4a2c'], ground:'#4a3a2a', grass:'#3a6a2e', cloud:'rgba(255,255,255,.18)', stars:true, hint:'#fff' } };
  function flap(api){
    var W = api.W, H = api.H, g = {}, bird, pipes, score, alive, t, ground, started, clouds, state = 'menu', GAP = 150, SPEED = 165, GRAV = 1500, JUMP = -430, R = 14, SPACING = 230, BIRD = FL_BIRD.yellow, SKY = FL_SKY.day, restT = 0;
    var menu = gameMenu(api, { id:'flap', title:'Flap', sub:'Set up the flight', color:'#5aa9ff',
      rows:[['gap', 'Gap'], ['speed', 'Speed'], ['gravity', 'Gravity'], ['bird', 'Bird'], ['sky', 'Sky']],
      opt:{ gap:['wide', 'normal', 'narrow'], speed:['easy', 'normal', 'fast'], gravity:['floaty', 'normal', 'heavy'], bird:Object.keys(FL_BIRD), sky:Object.keys(FL_SKY) }, def:{ gap:'normal', speed:'normal', gravity:'normal', bird:'yellow', sky:'day' },
      label:{ gap:{ wide:'Wide', normal:'Normal', narrow:'Narrow' }, speed:{ easy:'Easy', normal:'Normal', fast:'Fast' }, gravity:{ floaty:'Floaty', normal:'Normal', heavy:'Heavy' }, sky:{ day:'Day', dusk:'Dusk', night:'Night' } },
      help:{ gap:'How much room between the pipes.', speed:'How fast the pipes come at you.', gravity:'Floaty falls slowly and flaps gently; heavy drops like a stone and flaps hard.', bird:'Your bird\u2019s colours.', sky:'Time of day. Night has stars.' },
      swatch:{ bird:{ yellow:'#ffd166', red:'#ff5f57', blue:'#5aa9ff', pink:'#ff8fc8', mint:'#63e6be' } },
      foot:api.touch ? 'tap to flap' : 'space or click flaps  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function setup(){ GAP = { wide:190, normal:150, narrow:120 }[SET.gap] || 150; SPEED = { easy:130, normal:165, fast:210 }[SET.speed] || 165; var gk = { floaty:.7, normal:1, heavy:1.35 }[SET.gravity] || 1; GRAV = 1500*gk; JUMP = -430*Math.sqrt(gk); BIRD = FL_BIRD[SET.bird] || FL_BIRD.yellow; SKY = FL_SKY[SET.sky] || FL_SKY.day;
      bird = { y:H/2, vy:0, wing:0 }; pipes = []; score = 0; alive = true; t = 0; ground = 0; started = state === 'menu'; restT = 0; clouds = []; for(var i = 0; i < 5; i++) clouds.push({ x:rnd(0, W), y:rnd(40, H*.5), s:rnd(.6, 1.3) }); for(var p = 0; p < 4; p++) pipes.push({ x:W + 120 + p*SPACING, gy:rnd(120, H - 120 - GAP), passed:false }); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the flight, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status(api.touch ? 'tap to flap' : 'space to flap'); }
    g.inMenu = function(){ return state === 'menu'; };
    function jump(){ if(!alive) return; started = true; bird.vy = JUMP; bird.wing = .25; }
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } if(k === ' ' || isDir(k) === 'U'){ if(down) jump(); return true; } return false; };
    g.pointer = function(type){ if(state === 'play' && type === 'down') jump(); };
    g.peek = function(){ return { state:state, menu:state === 'menu' && !menu.el.hidden, y:Math.round(bird.y), vy:Math.round(bird.vy), score:score, alive:alive, started:started, gap:GAP, speed:SPEED, grav:GRAV, sky:SET.sky, bird:SET.bird, pipes:pipes.map(function(p){ return Math.round(p.x); }), opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); } };
    /* the ghost flyer: flaps whenever it is below the middle of the next gap and falling, so it threads pipe after pipe without looking hurried */
    function ghost(){ var bx = W*.28, next = null; for(var i = 0; i < pipes.length; i++){ if(pipes[i].x + 60 > bx - R){ next = pipes[i]; break; } } var target = next ? next.gy + GAP/2 + 6 : H/2; if(bird.y > target && bird.vy > -60) jump(); }
    g.update = function(dt){
      t += dt; bird.wing = Math.max(0, bird.wing - dt); ground = (ground + SPEED*dt) % 40; clouds.forEach(function(k){ k.x -= 18*k.s*dt; if(k.x < -80) k.x = W + 80; });
      if(!started){ bird.y = H/2 + Math.sin(t*3)*8; return; }
      if(!alive){ if(state === 'menu'){ restT -= dt; if(restT <= 0) setup(); } return; }
      if(state === 'menu') ghost();
      bird.vy += GRAV*dt; bird.y += bird.vy*dt;
      pipes.forEach(function(p){ p.x -= SPEED*dt; if(!p.passed && p.x + 30 < W*.28){ p.passed = true; score++; if(state === 'play') api.score(score); } });
      if(pipes[0].x < -80){ pipes.shift(); var last = pipes[pipes.length-1]; pipes.push({ x:last.x + SPACING, gy:clamp(last.gy + rnd(-140, 140), 90, H - 110 - GAP), passed:false }); }
      var bx = W*.28, hit = bird.y + R > H - 56 || bird.y - R < 0;
      pipes.forEach(function(p){ if(bx + R > p.x && bx - R < p.x + 60 && (bird.y - R < p.gy || bird.y + R > p.gy + GAP)) hit = true; });
      if(hit){ alive = false; if(state === 'menu'){ restT = 1; return; } api.over(score >= 10 ? 'Nice flight' : 'Flapped out'); }
    };
    g.draw = function(c){
      var sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, SKY.top); sky.addColorStop(1, SKY.bot); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      if(SKY.stars){ c.fillStyle = 'rgba(255,255,255,.7)'; for(var s = 0; s < 40; s++){ var sx = (s*73) % W, sy = (s*41) % (H*.6); c.globalAlpha = .4 + .5*Math.abs(Math.sin(t*1.5 + s)); c.fillRect(sx, sy, 1.6, 1.6); } c.globalAlpha = 1; }
      c.fillStyle = SKY.cloud; clouds.forEach(function(k){ c.beginPath(); c.arc(k.x, k.y, 18*k.s, 0, 7); c.arc(k.x + 20*k.s, k.y - 6*k.s, 22*k.s, 0, 7); c.arc(k.x + 42*k.s, k.y, 16*k.s, 0, 7); c.fill(); });
      pipes.forEach(function(p){ var pg = c.createLinearGradient(p.x, 0, p.x + 60, 0); pg.addColorStop(0, SKY.pipe[0]); pg.addColorStop(.5, SKY.pipe[1]); pg.addColorStop(1, SKY.pipe[2]); c.fillStyle = pg; c.fillRect(p.x, 0, 60, p.gy); c.fillRect(p.x, p.gy + GAP, 60, H - p.gy - GAP - 56); c.fillStyle = SKY.pipe[2]; c.fillRect(p.x - 4, p.gy - 22, 68, 22); c.fillRect(p.x - 4, p.gy + GAP, 68, 22); });
      c.fillStyle = SKY.ground; c.fillRect(0, H - 56, W, 56); c.fillStyle = SKY.grass; c.fillRect(0, H - 56, W, 10); c.fillStyle = 'rgba(0,0,0,.08)'; for(var x = -ground; x < W; x += 40) c.fillRect(x, H - 40, 20, 6);
      var bx = W*.28, ang = clamp(bird.vy / 600, -.5, 1.1); c.save(); c.translate(bx, bird.y); c.rotate(started ? ang : 0); if(!alive) c.globalAlpha = Math.max(.2, restT);
      c.fillStyle = BIRD.body; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.fillStyle = BIRD.wing; c.beginPath(); c.ellipse(-2, 4 - bird.wing*24, 9, 5, -.3, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(6, -4, 5, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(7.5, -4, 2.2, 0, 7); c.fill(); c.fillStyle = '#ff5f57'; c.beginPath(); c.moveTo(11, 1); c.lineTo(20, 4); c.lineTo(11, 7); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1;
      if(state === 'play'){ if(started) text(c, String(score), W/2, 60, 44, SKY.hint, 'center', 800); else text(c, api.touch ? 'tap to start' : 'space to start', W/2, H*.38, 16, 'rgba(255,255,255,.95)', 'center'); }
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 05: stacker. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Stacker (falling blocks). Opens on its own menu (starting level, ghost piece, hold, next queue length, colours; kept under tigos.stacker); behind the card a
     tidy player quietly stacks, weighing every landing spot for height and holes, and starts a fresh well when it tops out. Space, Enter or Play begins the real game. ---------- */
  var ST_PAL = { classic:{ I:'#63e6be', O:'#ffd166', T:'#a78bfa', S:'#28c840', Z:'#ff5f57', J:'#8cc7ff', L:'#ff8a00' }, pastel:{ I:'#b3f0e6', O:'#ffe8b3', T:'#d9c9ff', S:'#b8f0c2', Z:'#ffb3af', J:'#c9e3ff', L:'#ffcf9e' }, neon:{ I:'#00fff0', O:'#fff200', T:'#ff00e6', S:'#39ff14', Z:'#ff2d2d', J:'#00a2ff', L:'#ff7a00' }, mono:{ I:'#f4f1ea', O:'#dcd8cf', T:'#c4bfb5', S:'#aca79c', Z:'#948f84', J:'#7c776d', L:'#645f56' } };
  function stacker(api){
    var COLS = 10, ROWS = 20, CELL = 26, BX = 20, BY = 10, g = {}, board, cur, nextQ, hold, canHold, score, lines, level, acc, das, held = {}, over, state = 'menu', COL = ST_PAL.classic, ghostOn = true, holdOn = true, nextN = 3, L0 = 1, ai = null, aiT = 0;
    var SHAPES = { I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[0,1],[1,1],[2,1],[1,0]], S:[[1,0],[2,0],[0,1],[1,1]], Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]] };
    var menu = gameMenu(api, { id:'stacker', title:'Stacker', sub:'Set up the well', color:'#a78bfa',
      rows:[['level', 'Start at'], ['ghost', 'Ghost'], ['hold', 'Hold'], ['next', 'Next'], ['palette', 'Colours']],
      opt:{ level:[1, 3, 5, 8], ghost:['on', 'off'], hold:['on', 'off'], next:[1, 3], palette:Object.keys(ST_PAL) }, def:{ level:1, ghost:'on', hold:'on', next:3, palette:'classic' },
      label:{ level:{ 1:'Level 1', 3:'Level 3', 5:'Level 5', 8:'Level 8' }, ghost:{ on:'On', off:'Off' }, hold:{ on:'On', off:'Off' }, next:{ 1:'1 piece', 3:'3 pieces' } },
      help:{ level:'Pieces fall faster from a higher level, and the lines you clear score more.', ghost:'A faint outline shows where the piece will land.', hold:'Keep a piece aside (c or a swipe up) for later.', next:'How far ahead you can see.', palette:'The colours of the seven pieces.' },
      swatch:{ palette:{ classic:'linear-gradient(90deg,#63e6be,#ffd166,#a78bfa,#ff5f57)', pastel:'linear-gradient(90deg,#b3f0e6,#ffe8b3,#d9c9ff,#ffb3af)', neon:'linear-gradient(90deg,#00fff0,#fff200,#ff00e6,#39ff14)', mono:'linear-gradient(90deg,#f4f1ea,#645f56)' } },
      foot:api.touch ? 'drag sideways to move, tap rotates, swipe down drops, swipe up holds' : 'arrows move, up rotates, space drops, c holds  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function bag(){ var k = Object.keys(SHAPES), out = []; while(k.length) out.push(k.splice(ri(0, k.length-1), 1)[0]); return out; }
    function piece(t){ return { t:t, cells:SHAPES[t].map(function(p){ return [p[0], p[1]]; }), x:3, y:t === 'I' ? -1 : 0, size:t === 'I' ? 4 : t === 'O' ? 2 : 3 }; }
    function fits(p, dx, dy, cells){ return (cells || p.cells).every(function(c){ var x = p.x + c[0] + dx, y = p.y + c[1] + dy; return x >= 0 && x < COLS && y < ROWS && (y < 0 || !board[y][x]); }); }
    function spawn(){ if(nextQ.length < 4) nextQ = nextQ.concat(bag()); cur = piece(nextQ.shift()); canHold = true; ai = null; if(!fits(cur, 0, 0)){ over = true; if(state === 'play') api.over('Stacked out at level '+level); } }
    function speed(){ return Math.max(.08, .8 - (level-1)*.07); }
    function setup(){ COL = ST_PAL[SET.palette] || ST_PAL.classic; ghostOn = SET.ghost === 'on'; holdOn = SET.hold === 'on'; nextN = SET.next; L0 = SET.level; board = []; for(var r = 0; r < ROWS; r++){ board.push(new Array(COLS).fill(0)); } nextQ = bag(); hold = null; score = 0; lines = 0; level = L0; acc = 0; das = 0; over = false; held = {}; ai = null; aiT = 0; spawn(); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the well, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status('level '+level+'  \u00b7  0 lines'); }
    g.inMenu = function(){ return state === 'menu'; };
    function rotated(p, dir){ var s = p.size - 1; return p.cells.map(function(c){ return dir > 0 ? [s - c[1], c[0]] : [c[1], s - c[0]]; }); }
    function rotate(dir){ if(cur.t === 'O') return; var cells = rotated(cur, dir); var kicks = [0, -1, 1, -2, 2]; for(var i = 0; i < kicks.length; i++){ if(fits(cur, kicks[i], 0, cells)){ cur.cells = cells; cur.x += kicks[i]; return; } if(fits(cur, kicks[i], -1, cells)){ cur.cells = cells; cur.x += kicks[i]; cur.y -= 1; return; } } }
    function lock(){ cur.cells.forEach(function(c){ var y = cur.y + c[1]; if(y >= 0) board[y][cur.x + c[0]] = cur.t; }); var cleared = 0; for(var r = ROWS - 1; r >= 0; r--){ if(board[r].every(Boolean)){ board.splice(r, 1); board.unshift(new Array(COLS).fill(0)); cleared++; r++; } }
      if(cleared){ lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.max(L0, 1 + Math.floor(lines / 10)); if(state === 'play'){ api.score(score); api.status('level '+level+'  \u00b7  '+lines+' line'+(lines === 1 ? '' : 's')); } } spawn(); }
    function drop(){ if(fits(cur, 0, 1)) cur.y++; else lock(); }
    function hardDrop(){ var d = 0; while(fits(cur, 0, d + 1)) d++; cur.y += d; score += d * 2; if(state === 'play') api.score(score); lock(); }
    function doHold(){ if(!holdOn || !canHold) return; var t = cur.t; if(hold){ cur = piece(hold); } else { spawn(); } hold = t; canHold = false; }
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } if(over) return false; var d = isDir(k);
      if(d === 'L' || d === 'R'){ held[d] = down; if(down){ das = -.17; if(fits(cur, d === 'L' ? -1 : 1, 0)) cur.x += d === 'L' ? -1 : 1; } return true; }
      if(d === 'D'){ held.D = down; if(down){ drop(); acc = 0; } return true; }
      if(!down) return false;
      if(d === 'U' || k === 'x' || k === 'X'){ rotate(1); return true; } if(k === 'z' || k === 'Z'){ rotate(-1); return true; }
      if(k === ' '){ hardDrop(); return true; } if(k === 'c' || k === 'C' || k === 'Shift'){ doHold(); return true; } return false; };
    g.pointer = function(){};
    g.peek = function(){ return { state:state, menu:state === 'menu' && !menu.el.hidden, level:level, lines:lines, score:score, cur:cur ? cur.t : null, hold:hold, next:nextQ.slice(0, nextN), filled:board.reduce(function(n, r){ return n + r.filter(Boolean).length; }, 0), over:over, ghost:ghostOn, holdOn:holdOn, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); } };
    /* the ghost stacker: for every rotation and column, drop the piece in a copy of the well and score the result (holes and height bad, cleared lines good); then walk the real piece there */
    function plan(){ var best = null, bs = -1e9, cells = cur.cells, s = cur.size - 1;
      for(var r = 0; r < 4; r++){ if(r) cells = cells.map(function(c){ return [s - c[1], c[0]]; }); if(cur.t === 'O' && r) break;
        for(var x = -2; x < COLS; x++){ var p = { x:x, y:cur.y, cells:cells }; if(!fits(p, 0, 0)) continue; var d = 0; while(fits(p, 0, d + 1)) d++;
          var b2 = board.map(function(row){ return row.slice(); }), maxY = 0; cells.forEach(function(c){ var yy = cur.y + c[1] + d; if(yy >= 0) b2[yy][x + c[0]] = 1; maxY = Math.max(maxY, ROWS - yy); });
          var cl = b2.filter(function(row){ return row.every(Boolean); }).length, holes = 0, agg = 0, bump = 0, prevH = -1;
          for(var cx = 0; cx < COLS; cx++){ var hgt = 0, seen = false; for(var yy = 0; yy < ROWS; yy++){ if(b2[yy][cx]){ if(!seen){ seen = true; hgt = ROWS - yy; } } else if(seen) holes++; } agg += hgt; if(prevH >= 0) bump += Math.abs(hgt - prevH); prevH = hgt; }
          var sc = cl*8 - holes*7 - agg*.6 - bump*.4 - maxY*.3; if(sc > bs){ bs = sc; best = { x:x, rot:r }; } } }
      return best || { x:cur.x, rot:0 }; }
    g.update = function(dt){ if(over){ if(state === 'menu'){ aiT += dt; if(aiT > 1.5) setup(); } return; }
      if(state === 'menu'){ if(!ai){ ai = plan(); ai.rots = 0; aiT = 0; } aiT += dt;   /* a move every tenth of a second: rotate first, then slide, then drop */
        if(aiT >= .1){ aiT -= .1; if(ai.rots < ai.rot){ rotate(1); ai.rots++; } else if(cur.x !== ai.x){ var dx = ai.x > cur.x ? 1 : -1; if(fits(cur, dx, 0)) cur.x += dx; else ai.x = cur.x; } else if(Math.random() < .5) hardDrop(); } }
      if(held.L || held.R){ das += dt; while(das >= .05){ das -= .05; var dx2 = held.L ? -1 : 1; if(fits(cur, dx2, 0)) cur.x += dx2; } }
      acc += dt; var sp = held.D ? Math.min(speed(), .05) : (state === 'menu' ? Math.max(.25, speed()) : speed()); while(acc >= sp){ acc -= sp; drop(); if(over) return; } };
    function cell(c, x, y, col, ghost){ var px = BX + x*CELL, py = BY + y*CELL; if(ghost){ c.strokeStyle = col; c.globalAlpha = .35; c.lineWidth = 2; rr(c, px + 2, py + 2, CELL - 4, CELL - 4, 4); c.stroke(); c.globalAlpha = 1; return; } c.fillStyle = col; rr(c, px + 1, py + 1, CELL - 2, CELL - 2, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; rr(c, px + 4, py + 4, CELL - 8, 6, 3); c.fill(); }
    function mini(c, t, x, y){ if(!t) return; SHAPES[t].forEach(function(p){ c.fillStyle = COL[t]; rr(c, x + p[0]*16, y + p[1]*16, 14, 14, 3); c.fill(); }); }
    g.draw = function(c){
      bg(c, api.W, api.H, '#14121f', '#08080d'); c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, BX - 2, BY - 2, COLS*CELL + 4, ROWS*CELL + 4, 8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; for(var i = 1; i < COLS; i++){ c.beginPath(); c.moveTo(BX + i*CELL, BY); c.lineTo(BX + i*CELL, BY + ROWS*CELL); c.stroke(); }
      for(var r = 0; r < ROWS; r++) for(var x = 0; x < COLS; x++) if(board[r][x]) cell(c, x, r, COL[board[r][x]]);
      if(cur && !over){ if(ghostOn){ var d = 0; while(fits(cur, 0, d + 1)) d++; cur.cells.forEach(function(p){ if(cur.y + p[1] + d >= 0) cell(c, cur.x + p[0], cur.y + p[1] + d, COL[cur.t], true); }); } cur.cells.forEach(function(p){ if(cur.y + p[1] >= 0) cell(c, cur.x + p[0], cur.y + p[1], COL[cur.t]); }); }
      var sx = BX + COLS*CELL + 24; text(c, 'NEXT', sx, 24, 12, 'rgba(255,255,255,.5)'); for(var n = 0; n < nextN; n++) mini(c, nextQ[n], sx, 44 + n*58);
      if(holdOn){ text(c, 'HOLD', sx, 236, 12, 'rgba(255,255,255,.5)'); mini(c, hold, sx, 256); }
      text(c, 'LEVEL', sx, 330, 12, 'rgba(255,255,255,.5)'); text(c, String(level), sx, 354, 26, '#ffd166', 'left', 800);
      text(c, 'LINES', sx, 400, 12, 'rgba(255,255,255,.5)'); text(c, String(lines), sx, 424, 26, '#63e6be', 'left', 800);
      text(c, api.touch ? 'swipe, tap rotates' : '\u2191 rotate   space drops', sx, api.H - 34, 10, 'rgba(255,255,255,.4)'); text(c, api.touch ? '' : (holdOn ? 'c holds   z counter' : 'z counter'), sx, api.H - 18, 10, 'rgba(255,255,255,.4)');
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 06: rocks. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Rocks (asteroids). Opens on its own menu (ships, how crowded the field is, arcade or space physics, hull colour, shots in the air; kept under tigos.rocks);
     behind the card a pilot quietly works a field, turning onto the nearest rock and firing, and lets the rocks drift past when the wave is clear. Space, Enter or Play starts. ---------- */
  var RK_HULL = { orange:'#ff8a00', cyan:'#63e6be', pink:'#ff8fc8', green:'#8fd46a', white:'#f4f1ea' };
  function rocks(api){
    var W = api.W, H = api.H, g = {}, ship, rocksArr, bullets, parts, lives, wave, score, held = {}, cool, safe, dead, over, state = 'menu', HULL = '#ff8a00', FRIC = .35, THR = 260, MAXB = 5, DENS = 3, aiT = 0, respawnT = 0;
    var menu = gameMenu(api, { id:'rocks', title:'Rocks', sub:'Set up the field', color:'#8cc7ff',
      rows:[['ships', 'Ships'], ['field', 'Field'], ['physics', 'Physics'], ['hull', 'Hull'], ['shots', 'Shots']],
      opt:{ ships:[1, 3, 5], field:['sparse', 'normal', 'dense'], physics:['arcade', 'space'], hull:Object.keys(RK_HULL), shots:[3, 5, 8] }, def:{ ships:3, field:'normal', physics:'arcade', hull:'orange', shots:5 },
      label:{ field:{ sparse:'Sparse', normal:'Normal', dense:'Dense' }, physics:{ arcade:'Arcade', space:'Space' } },
      help:{ ships:'Lives. Each ship lost puts a new one in the middle after a moment.', field:'How many rocks each wave opens with. Dense gets crowded fast.', physics:'Arcade brakes the ship when you stop thrusting. Space keeps it drifting, the way it really would.', hull:'The colour of your ship and its glow.', shots:'How many shots can be in the air at once.' },
      swatch:{ hull:RK_HULL },
      foot:api.touch ? 'hold a finger for a joystick: sideways turns, up thrusts; tap or a second finger fires' : 'left/right turn, up thrusts, space fires  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function wrap(o){ if(o.x < -20) o.x += W + 40; if(o.x > W + 20) o.x -= W + 40; if(o.y < -20) o.y += H + 40; if(o.y > H + 20) o.y -= H + 40; }
    function rock(x, y, size){ var r = [40, 24, 12][3 - size], pts = []; for(var i = 0; i < 11; i++) pts.push(rnd(.7, 1.15)); var sp = rnd(30, 70) + (3 - size)*25 + wave*6, a = rnd(0, 6.28); return { x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, r:r, size:size, pts:pts, rot:0, vr:rnd(-1.2, 1.2) }; }
    function spawnWave(){ rocksArr = []; for(var i = 0; i < DENS + wave; i++){ var x, y; do { x = rnd(0, W); y = rnd(0, H); } while(Math.hypot(x - W/2, y - H/2) < 150); rocksArr.push(rock(x, y, 3)); } }
    function boom(x, y, n, col){ for(var i = 0; i < n; i++){ var a = rnd(0, 6.28), s = rnd(40, 160); parts.push({ x:x, y:y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, t:rnd(.3, .8), col:col }); } }
    function respawn(){ ship = { x:W/2, y:H/2, vx:0, vy:0, a:-Math.PI/2 }; safe = 2.5; dead = false; }
    function setup(){ HULL = RK_HULL[SET.hull] || RK_HULL.orange; FRIC = SET.physics === 'space' ? .92 : .35; THR = SET.physics === 'space' ? 200 : 260; MAXB = SET.shots; DENS = { sparse:2, normal:3, dense:5 }[SET.field] || 3; bullets = []; parts = []; lives = SET.ships; wave = 1; score = 0; cool = 0; over = false; held = {}; respawnT = 0; respawn(); spawnWave(); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the field, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status('wave 1  \u00b7  '+lives+' ship'+(lives === 1 ? '' : 's')); }
    g.inMenu = function(){ return state === 'menu'; };
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } var d = isDir(k); if(d === 'L' || d === 'R' || d === 'U'){ held[d] = down; return true; } if(k === ' ' || d === 'D'){ held.F = down; if(down) fire(); return true; } return false; };
    function fire(){ if(dead || over || cool > 0 || bullets.length >= MAXB) return; cool = .18; bullets.push({ x:ship.x + Math.cos(ship.a)*14, y:ship.y + Math.sin(ship.a)*14, vx:Math.cos(ship.a)*460 + ship.vx, vy:Math.sin(ship.a)*460 + ship.vy, t:1.1 }); }
    g.pointer = function(){};   /* touch: the framework's floating stick holds the arrows, a still tap or a second finger sends space */
    g.peek = function(){ return { state:state, menu:state === 'menu' && !menu.el.hidden, rocks:rocksArr.length, bullets:bullets.length, lives:lives, wave:wave, score:score, dead:dead, hull:HULL, maxShots:MAXB, friction:FRIC, ship:{ x:Math.round(ship.x), y:Math.round(ship.y), a:+ship.a.toFixed(2) }, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); } };
    /* the ghost pilot: turns onto the nearest rock, fires when lined up, taps the thruster now and then to keep moving; it cannot die, but it does not need to */
    function pilot(dt){ held = {}; var near = null, nd = 1e9; rocksArr.forEach(function(r){ var d = Math.hypot(r.x - ship.x, r.y - ship.y); if(d < nd){ nd = d; near = r; } }); if(!near) return;
      var want = Math.atan2(near.y - ship.y, near.x - ship.x), diff = Math.atan2(Math.sin(want - ship.a), Math.cos(want - ship.a)); if(diff > .08) held.R = true; else if(diff < -.08) held.L = true;
      aiT += dt; if(Math.abs(diff) < .2 && nd > 40 && aiT > .35){ aiT = 0; fire(); } if(Math.sin(Date.now()/1400) > .75 && nd > 120) held.U = true; }
    g.update = function(dt){ if(over) return;
      cool -= dt; safe -= dt;
      if(state === 'menu'){ if(dead){ respawnT -= dt; if(respawnT <= 0) respawn(); } else { pilot(dt); safe = 1; } }
      if(!dead){ if(held.L) ship.a -= 4.2*dt; if(held.R) ship.a += 4.2*dt; if(held.U){ ship.vx += Math.cos(ship.a)*THR*dt; ship.vy += Math.sin(ship.a)*THR*dt; } ship.vx *= Math.pow(FRIC, dt); ship.vy *= Math.pow(FRIC, dt); ship.x += ship.vx*dt; ship.y += ship.vy*dt; wrap(ship); if(held.F) fire(); }
      bullets.forEach(function(b){ b.x += b.vx*dt; b.y += b.vy*dt; b.t -= dt; wrap(b); }); bullets = bullets.filter(function(b){ return b.t > 0; });
      parts.forEach(function(p){ p.x += p.vx*dt; p.y += p.vy*dt; p.t -= dt; }); parts = parts.filter(function(p){ return p.t > 0; });
      rocksArr.forEach(function(r){ r.x += r.vx*dt; r.y += r.vy*dt; r.rot += r.vr*dt; wrap(r); });
      for(var i = rocksArr.length - 1; i >= 0; i--){ var r = rocksArr[i], hitB = -1; for(var j = 0; j < bullets.length; j++){ if(Math.hypot(bullets[j].x - r.x, bullets[j].y - r.y) < r.r){ hitB = j; break; } }
        if(hitB > -1){ bullets.splice(hitB, 1); rocksArr.splice(i, 1); score += [100, 50, 20][r.size - 1]; if(state === 'play') api.score(score); boom(r.x, r.y, 10, '#ffd166'); if(r.size > 1){ rocksArr.push(rock(r.x, r.y, r.size - 1)); rocksArr.push(rock(r.x, r.y, r.size - 1)); } continue; }
        if(!dead && safe <= 0 && Math.hypot(ship.x - r.x, ship.y - r.y) < r.r + 10){ dead = true; lives--; boom(ship.x, ship.y, 24, HULL); if(lives <= 0){ over = true; api.status('wave '+wave+'  \u00b7  no ships left'); api.over('Lost in the rocks, wave '+wave); return; } api.status('wave '+wave+'  \u00b7  '+lives+' ship'+(lives === 1 ? '' : 's')); setTimeout(function(){ if(!over && state === 'play') respawn(); }, 1200); } }
      if(!rocksArr.length){ wave++; score += 250; if(state === 'play'){ api.score(score); api.status('wave '+wave+'  \u00b7  '+lives+' ship'+(lives === 1 ? '' : 's')); } safe = Math.max(safe, 1.5); spawnWave(); } };
    g.draw = function(c){
      bg(c, W, H, '#05060d', '#0b0a16'); c.fillStyle = 'rgba(255,255,255,.35)'; for(var s = 0; s < 40; s++){ c.fillRect((s*97 + wave*13) % W, (s*57) % H, 1.5, 1.5); }
      c.lineWidth = 2; c.strokeStyle = '#d8d4ff'; c.shadowColor = '#a78bfa'; c.shadowBlur = 8;
      rocksArr.forEach(function(r){ c.beginPath(); r.pts.forEach(function(p, i){ var a = r.rot + i/r.pts.length*6.283; var px = r.x + Math.cos(a)*r.r*p, py = r.y + Math.sin(a)*r.r*p; if(i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath(); c.stroke(); });
      c.shadowBlur = 0; parts.forEach(function(p){ c.fillStyle = p.col; c.globalAlpha = Math.min(1, p.t*2); c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }); c.globalAlpha = 1;
      c.fillStyle = '#fff'; bullets.forEach(function(b){ c.beginPath(); c.arc(b.x, b.y, 2.5, 0, 7); c.fill(); });
      if(!dead){ c.save(); c.translate(ship.x, ship.y); c.rotate(ship.a); c.globalAlpha = state === 'play' && safe > 0 && Math.floor(safe*8) % 2 ? .35 : 1; c.strokeStyle = HULL; c.shadowColor = HULL; c.shadowBlur = 10; c.beginPath(); c.moveTo(16, 0); c.lineTo(-12, 10); c.lineTo(-7, 0); c.lineTo(-12, -10); c.closePath(); c.stroke();
        if(held.U){ c.strokeStyle = '#ffd166'; c.beginPath(); c.moveTo(-9, 5); c.lineTo(-18 - rnd(0, 8), 0); c.lineTo(-9, -5); c.stroke(); } c.restore(); c.shadowBlur = 0; }
      for(var l = 0; l < lives; l++){ c.save(); c.translate(24 + l*22, 22); c.rotate(-Math.PI/2); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(8, 0); c.lineTo(-6, 5); c.lineTo(-3, 0); c.lineTo(-6, -5); c.closePath(); c.stroke(); c.restore(); }
      text(c, 'WAVE '+wave, W - 16, 22, 12, 'rgba(255,255,255,.55)', 'right');
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 07: mines. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Mines: levels of 30, 60, 90 ... mines on a board that grows with them, one life (three or five from the menu), red flags and yellow maybes. A front menu (like Tanks) sets up the field:
     mines per level (the board scales with them), lives, board shape (rectangle, diamond, circle, cross, or a torus whose edges wrap), blast radius (a boom chars the numbers around it),
     colours, flag colour, maybes, first-dig safety, a countdown clock, music and volume. Everything saves in this browser under tigos.mines; the defaults are the original game except lives (one since 9/27) and music (lo-fi since 9/27).
     The canvas is fluid (registry `fluid:true`): it takes the whole stage, the board is laid out for that size (held upright, the field turns tall too) and a UI scale keeps the top bar readable on a big screen.
     Fingers: a tap digs, a hold flags on a timer (the flag lands where the finger first pressed, a ring shows the hold filling, the lift after it does nothing), a second finger cancels whatever the first
     was about to do and the two of them pinch-zoom and pan the board, one finger pans when zoomed, the wheel or a trackpad pinch zooms on desktop. Nothing about the zoom is saved. ---------- */
  var MN_THEMES = {
    midnight:{ name:'Midnight', bg:['#15161d', '#0a0a0e'], lid:['#3d3e4c', '#2a2b36'], hi:'rgba(255,255,255,.12)', open:'rgba(255,255,255,.06)', mineCell:'#2a2a34', ink:'#f4f1ea', dim:'rgba(255,255,255,.55)', mine:'#f4f1ea', num:['', '#8cc7ff', '#28c840', '#ff5f57', '#a78bfa', '#ff8a00', '#63e6be', '#f4f1ea', '#ffd166'] },
    classic:{ name:'Classic', bg:['#d9d9d9', '#bfbfbf'], lid:['#ececec', '#c4c4c4'], hi:'rgba(255,255,255,.85)', open:'rgba(0,0,0,.09)', mineCell:'#a3a3a3', ink:'#1a1a1a', dim:'rgba(0,0,0,.55)', mine:'#111111', num:['', '#1d1dff', '#0a7a0a', '#e01010', '#10106e', '#7a1010', '#0a7a7a', '#111111', '#6e6e6e'] },
    garden:{ name:'Garden', bg:['#14291c', '#08130c'], lid:['#4f8a55', '#356a3d'], hi:'rgba(255,255,255,.18)', open:'rgba(255,255,255,.07)', mineCell:'#26402c', ink:'#eef7e9', dim:'rgba(238,247,233,.6)', mine:'#ffd6e8', flower:true, num:['', '#ffe28a', '#a6f0b4', '#ff8f6b', '#d5b8ff', '#ffb347', '#8fe8dc', '#ffffff', '#ffd166'] },
    ocean:{ name:'Ocean', bg:['#0d2334', '#06111a'], lid:['#2f6f9b', '#1f4f73'], hi:'rgba(255,255,255,.16)', open:'rgba(255,255,255,.07)', mineCell:'#1a3448', ink:'#eaf6ff', dim:'rgba(234,246,255,.6)', mine:'#f4f1ea', num:['', '#9fe0ff', '#7dffb0', '#ff7b7b', '#c9b3ff', '#ffb35c', '#7ff2e2', '#ffffff', '#ffe27a'] },
    candy:{ name:'Candy', bg:['#3a1030', '#1c0716'], lid:['#ff8fc8', '#f062a8'], hi:'rgba(255,255,255,.3)', open:'rgba(255,255,255,.09)', mineCell:'#5a1a44', ink:'#fff0f7', dim:'rgba(255,240,247,.6)', mine:'#ffe6f3', num:['', '#ffffff', '#ffe066', '#7ef0ff', '#c6ff7a', '#ffb067', '#ffd1e8', '#d7b3ff', '#ffffff'] },
    lava:{ name:'Lava', bg:['#210c08', '#0c0403'], lid:['#5a2a24', '#3a1815'], hi:'rgba(255,170,90,.18)', open:'rgba(255,120,60,.09)', mineCell:'#3d1c17', ink:'#ffe9d6', dim:'rgba(255,233,214,.6)', mine:'#ffd166', num:['', '#ffc98a', '#ffe66b', '#ff6b4a', '#f0a6ff', '#ff9a3c', '#ffd9b3', '#ffffff', '#ff8a00'] } };
  var MN_FLAGS = { red:'#ff5f57', pink:'#ff5fa8', blue:'#5aa9ff', green:'#28c840', purple:'#a78bfa', white:'#f4f1ea' };
  var MN_OPT = { mines:[10, 20, 30, 45, 60, 99], lives:[1, 3, 5], board:['rect', 'diamond', 'circle', 'cross', 'torus'], blast:[1, 3, 5], theme:Object.keys(MN_THEMES), flag:Object.keys(MN_FLAGS), maybe:['on', 'off'], first:['zone', 'cell', 'lucky'], clock:[0, 300, 180], music:['off', 'lofi', 'arcade'] };
  var MN_DEF = { mines:30, lives:1, board:'rect', blast:1, theme:'midnight', flag:'red', maybe:'on', first:'zone', clock:0, music:'lofi', vol:1 }, MN_SAVE_V = '2';   /* MN_SAVE_V: a save from before lo-fi became the default keeps its other choices and takes the new music default once */
  var MN_LABEL = { board:{ rect:'Rectangle', diamond:'Diamond', circle:'Circle', cross:'Cross', torus:'Torus' }, blast:{ 1:'1 cell', 3:'3\u00d73', 5:'5\u00d75' }, maybe:{ on:'On', off:'Off' }, first:{ zone:'Safe opening', cell:'Safe cell', lucky:'Lucky' }, clock:{ 0:'Stopwatch', 300:'5 min', 180:'3 min' }, music:{ off:'Off', lofi:'Lo-fi', arcade:'Arcade' } };
  var MN_FILL = { rect:1, diamond:.5, circle:.785, cross:.556, torus:1 };
  var MN_HELP = { mines:'Mines on level one. Each level adds that many again and the board grows with them.', lives:'One life is classic Minesweeper: the first mine you dig ends the game. Three or five let you survive a few.', board:'The shape of the field. On a torus the edges wrap: a number counts mines on the far side too.',
    blast:'A boom chars the cells around it: their numbers are gone for good, and mines caught in the blast go off with no life lost.', theme:'Board colours. Garden grows flowers where the mines are.', flag:'The colour of your flags. Maybes stay yellow.', maybe:'A second right click (or hold) turns a flag into a yellow maybe that does not count against the mines left.',
    first:'Safe opening clears the first cell and its neighbours. Safe cell only promises the cell. Lucky promises nothing.', clock:'Stopwatch times you for the bonus. A countdown ends the game when it runs out, every level.', music:'A looping synth track while you sweep. Lo-fi is calm and on by default, Arcade pushes.', vol:'Volume for the effects and the music.' };
  function mnLoad(){ var s = {}; Object.keys(MN_DEF).forEach(function(k){ s[k] = MN_DEF[k]; }); try { var o = JSON.parse(localStorage.getItem('tigos.mines') || '{}'); if(localStorage.getItem('tigos.mines.v') !== MN_SAVE_V) delete o.music; Object.keys(MN_OPT).forEach(function(k){ if(o[k] !== undefined && MN_OPT[k].indexOf(o[k]) > -1) s[k] = o[k]; }); if(typeof o.vol === 'number') s.vol = clamp(o.vol, 0, 1); } catch(e){} return s; }
  function mines(api){
    var W = api.W, H = api.H, MY = 48, PAD = 16, BOT = 14, UI = 1, g = {}, COLS, ROWS, CELL, MX, MINES, PLAY, cells, placed, cur, state, t0, elapsed, flags, maybes, blown, revealed, level, lives, score, t, shake, parts, msg, msgT, endT, cursorT, LIVES = 3, TH, FLAG, LIMIT = 0, charred, menuEl, hint = {}, lastSel = '', playedOnce = false;
    /* the view: the board is drawn in its own coordinates (cell (x, y) at x*CELL, y*CELL) through translate(view.x, view.y) scale(view.z); at z 1 it sits centred in the area under the top bar */
    var view = { z:1, x:0, y:0 }, ZMAX = 2, AX = 0, AY = 0, AW = 0, AH = 0, touches = {}, pinch = null, pinchCool = 0, press = null, holdTimer = 0;
    var SET = mnLoad(), sfx = window.TIG_SFX;
    function saveSet(){ try { localStorage.setItem('tigos.mines', JSON.stringify(SET)); localStorage.setItem('tigos.mines.v', MN_SAVE_V); } catch(e){} }
    function tone(type, f0, f1, dur, gain, delay){ if(SET.vol > 0) sfx.tone(type, f0, f1, dur, gain*SET.vol, delay); } function noise(dur, freq, gain, q, delay){ if(SET.vol > 0) sfx.noise(dur, freq, gain*SET.vol, q, delay); }
    var snd = { dig:function(){ tone('square', 420, 300, .05, .08); }, pop:function(n){ tone('triangle', 500 + n*40, 700 + n*40, .04, .05); }, flag:function(){ tone('square', 660, 880, .06, .1); }, maybe:function(){ tone('triangle', 520, 520, .08, .09); }, boom:function(){ noise(.4, 300, .8, 1); tone('sawtooth', 120, 30, .5, .3); }, dead:function(){ noise(.7, 200, .9, 1); tone('sawtooth', 90, 20, .9, .35); }, win:function(){ [523, 659, 784, 1046].forEach(function(f, i){ tone('triangle', f, f, .16, .18, i*.09); }); }, level:function(){ [392, 523, 659, 784, 1046, 1318].forEach(function(f, i){ tone('triangle', f, f, .14, .18, i*.08); }); }, ui:function(){ tone('triangle', 720, 760, .05, .06); }, tick:function(){ tone('square', 880, 880, .03, .05); } };
    /* music: two tiny loops scheduled from the frame, so a pause or the framework's game-over card stops them with the game */
    var music = { kind:'off', acc:0, step:0, start:function(k){ if(k !== this.kind){ this.kind = k; this.acc = 0; this.step = 0; } }, tick:function(dt){ if(this.kind === 'off') return; this.acc += dt; var bt = this.kind === 'lofi' ? .5 : .22; while(this.acc >= bt){ this.acc -= bt; this.play(this.step++); } },
      play:function(s){ if(this.kind === 'lofi'){ var ch = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [164.8, 196, 246.9]][(s >> 3) % 4]; if(s % 8 === 0) ch.forEach(function(f){ tone('triangle', f, f, 3.8, .03); }); if(s % 2 === 1){ var f2 = ch[[0, 1, 2, 1][(s >> 1) % 4]]*2; tone('sine', f2, f2, .55, .028); } if(s % 16 === 12) noise(.12, 1200, .06, .6); }
        else { var bass = [110, 110, 130.8, 98, 110, 110, 146.8, 130.8][(s >> 2) % 8]; if(s % 2 === 0) tone('square', bass, bass*.985, .16, .045); if(s % 4 === 2) noise(.05, 6000, .22, 1); if(s % 4 === 0) noise(.07, 180, .5, 1); var lead = [440, 523.3, 659.3, 587.3, 523.3, 440, 392, 493.9]; if(s % 4 === 1 && (s >> 3) % 2) tone('square', lead[(s >> 2) % 8], lead[(s >> 2) % 8], .11, .026); } } };
    function apply(){ TH = MN_THEMES[SET.theme] || MN_THEMES.midnight; FLAG = MN_FLAGS[SET.flag] || MN_FLAGS.red; LIVES = SET.lives; LIMIT = SET.clock; music.start(SET.music); }
    /* the ladder: level L holds mines*L mines; the board keeps the original 4:3 shape and grows so the density stays where it was (cols 4(L+3), rows 3(L+3) for 30), scaled up for a shape with holes so the playable area stays about the same */
    function dims(L){ var k = Math.sqrt(SET.mines/30) / Math.sqrt(MN_FILL[SET.board] || 1), cols = Math.min(48, Math.round(4*(L + 3)*k)), rows = Math.min(36, Math.round(3*(L + 3)*k));
      var a = area().w / Math.max(1, area().h); if(a < 1){ var N = cols*rows; cols = Math.max(6, Math.round(Math.sqrt(N*a))); rows = Math.min(64, Math.max(cols + 1, Math.round(N/cols))); }   /* held upright: the same number of cells stood on end, so the field fills the tall screen */
      return { cols:cols, rows:rows, mines:SET.mines*L }; }
    function area(){ var ui = clamp(Math.min(W/600, H/480), 1, 1.75), pad = api.touch ? 6 : 16, my = Math.round(48*ui), bot = api.touch ? 6 : 14; return { ui:ui, pad:pad, my:my, bot:bot, w:W - pad*2, h:H - my - bot }; }
    /* fit the current board to the canvas: cell size, the area it may use, and the view back at 1x. Called for a new board and whenever the stage changes size (a rotated phone, leaving full screen) */
    function layout(){ var A = area(); UI = A.ui; PAD = A.pad; MY = A.my; BOT = A.bot; AX = PAD; AY = MY; AW = A.w; AH = A.h; CELL = Math.max(4, Math.floor(Math.min(AW/COLS, AH/ROWS))); MX = Math.round((W - COLS*CELL)/2); ZMAX = Math.max(2, Math.ceil(72/CELL*10)/10); view.z = 1; clampView(); }
    function clampView(){ view.z = clamp(view.z, 1, ZMAX); var bw = COLS*CELL*view.z, bh = ROWS*CELL*view.z;
      view.x = bw <= AW ? AX + (AW - bw)/2 : clamp(view.x, AX + AW - bw, AX); view.y = bh <= AH ? AY + (AH - bh)/2 : clamp(view.y, AY + AH - bh, AY); }
    function zoomAt(z, x, y){ var k = clamp(z, 1, ZMAX)/view.z; view.x = x - (x - view.x)*k; view.y = y - (y - view.y)*k; view.z *= k; clampView(); }   /* scale about a screen point so the cell under the fingers stays under them */
    g.resize = function(w, h){ W = w; H = h; if(state === 'menu'){ board(1); status(); } else layout(); };
    function shape(x, y, cols, rows){ var cx = (cols - 1)/2, cy = (rows - 1)/2, dx = Math.abs(x - cx)/(cols/2), dy = Math.abs(y - cy)/(rows/2); switch(SET.board){ case 'diamond': return dx + dy <= 1.02; case 'circle': return dx*dx + dy*dy <= 1.04; case 'cross': return dx <= .34 || dy <= .34; default: return true; } }
    function idx(x, y){ return y*COLS + x; }
    function nb(x, y){ if(SET.board === 'torus'){ x = (x + COLS) % COLS; y = (y + ROWS) % ROWS; return idx(x, y); } return x >= 0 && y >= 0 && x < COLS && y < ROWS ? idx(x, y) : -1; }
    function around(i, fn){ var x = i % COLS, y = (i / COLS)|0; for(var dy = -1; dy <= 1; dy++) for(var dx = -1; dx <= 1; dx++){ if(!dx && !dy) continue; var j = nb(x + dx, y + dy); if(j > -1 && j !== i && !cells[j].v) fn(j); } }
    function board(L){ var d = dims(L); COLS = d.cols; ROWS = d.rows; layout(); endPress(); touches = {}; pinch = null; ghost.target = -1; ghost.done = 0; ghost.next = t + 1;
      cells = []; PLAY = 0; for(var i = 0; i < COLS*ROWS; i++){ var v = !shape(i % COLS, (i / COLS)|0, COLS, ROWS); cells.push({ m:false, n:0, open:v, flag:0, a:v ? 1 : 0, d:0, fa:0, blown:false, v:v, ch:false }); if(!v) PLAY++; }
      MINES = Math.min(d.mines, Math.max(1, PLAY - 10)); placed = false; cur = idx(COLS >> 1, ROWS >> 1); if(cells[cur].v){ for(var q = 0; q < cells.length; q++) if(!cells[q].v){ cur = q; break; } } t0 = 0; elapsed = 0; flags = 0; maybes = 0; blown = 0; revealed = 0; charred = 0; parts = []; shake = 0; endT = 0; }
    function status(){ api.status(state === 'menu' ? 'set up the field, then play' : left()+' mines  \u00b7  '+lives+(lives === 1 ? ' life' : ' lives')+'  \u00b7  level '+level+(api.touch ? '  \u00b7  tap digs, hold flags, pinch zooms' : '')); }
    function left(){ return MINES - flags - blown; }
    g.reset = function(){ apply(); level = 1; lives = LIVES; score = 0; t = 0; msg = ''; msgT = 0; cursorT = 0; state = 'menu'; board(1); api.score(0); status(); syncMenu(); };
    function start(){ apply(); level = 1; lives = LIVES; score = 0; msg = ''; msgT = 0; state = 'play'; board(1); playedOnce = true; api.score(0); status(); flash('level 1  \u00b7  '+MINES+' mines', 2); snd.ui(); }
    function place(first){ var safe = {}; if(SET.first !== 'lucky'){ safe[first] = 1; if(SET.first === 'zone') around(first, function(j){ safe[j] = 1; }); } var n = 0, guard = 0; while(n < MINES && guard++ < 200000){ var i = ri(0, cells.length - 1); if(cells[i].v || safe[i] || cells[i].m) continue; cells[i].m = true; n++; } cells.forEach(function(c, i){ if(!c.v) around(i, function(j){ if(cells[j].m) c.n++; }); }); placed = true; t0 = Date.now(); }
    function burst(x, y, n, col, sp){ for(var i = 0; i < n; i++){ var a = rnd(0, Math.PI*2), v = rnd(sp*.3, sp); parts.push({ x:x, y:y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - sp*.3, l:rnd(.5, 1.1), t:0, col:col, r:rnd(2, 4.5) }); } }
    function cx(i){ return (i % COLS)*CELL + CELL/2; } function cy(i){ return ((i / COLS)|0)*CELL + CELL/2; }   /* board coordinates: particles live in the board's space and zoom with it */
    function unflag(c){ if(c.flag){ if(c.flag === 1) flags--; else maybes--; c.flag = 0; } }
    function lose(head, why){ state = 'lost'; cells.forEach(function(k){ if(k.m && !k.open){ k.open = true; k.a = .001; k.d = rnd(.05, .6); } }); snd.dead(); api.status(head+'  \u00b7  '+revealed+' safe cells cleared on level '+level); api.over(why+' on level '+level+', '+left()+' mines still buried'); }
    function win(){ state = 'won'; elapsed = (Date.now() - t0)/1000; var bonus = Math.max(0, Math.round(300 - elapsed))*level; score += bonus; api.score(score); endT = 2.4; snd.win(); flash('cleared in '+elapsed.toFixed(1)+'s  +'+bonus, 2.4); api.status('level '+level+' cleared in '+elapsed.toFixed(1)+'s'); cells.forEach(function(k, j){ if(k.m && !k.blown){ k.flag = 1; k.fa = .001; k.d = ((j % COLS) + ((j / COLS)|0))*.03; } }); for(var b = 0; b < 6; b++) burst(rnd(0, COLS*CELL), rnd(0, ROWS*CELL), 10, ['#28c840', '#ffd166', '#8cc7ff', '#ff8a00'][b % 4], 200); }
    function blow(i){ var c = cells[i]; c.open = true; c.blown = true; c.a = .001; blown++; lives--; shake = 1; snd.boom(); burst(cx(i), cy(i), 26, '#ff5f57', 260); burst(cx(i), cy(i), 12, '#ffd166', 180); unflag(c);
      if(SET.blast > 1){ var r = (SET.blast - 1)/2, x = i % COLS, y = (i / COLS)|0;   /* the blast chars the ring: numbers gone, flags blown away, mines in it go off for free */
        for(var dy = -r; dy <= r; dy++) for(var dx = -r; dx <= r; dx++){ if(!dx && !dy) continue; var j = nb(x + dx, y + dy); if(j < 0 || j === i) continue; var k = cells[j]; if(k.v) continue; unflag(k);
          if(k.m){ if(!k.blown){ k.open = true; k.blown = true; k.a = .001; k.d = Math.hypot(dx, dy)*.08; blown++; burst(cx(j), cy(j), 10, '#ff8a00', 160); } }
          else { if(!k.open){ k.open = true; k.a = .001; k.d = Math.hypot(dx, dy)*.08; revealed++; } if(!k.ch){ k.ch = true; charred++; } } } shake = 1.3; }
      if(lives <= 0){ lose('boom', 'Out of lives'); return; }
      if(revealed === PLAY - MINES){ win(); return; }
      flash(lives === 1 ? 'boom!  last life' : 'boom!  '+lives+' lives left', 1.6); status(); }
    function reveal(i){ var c = cells[i]; if(c.open || c.flag === 1 || state !== 'play') return; if(!placed) place(i);
      if(c.m){ blow(i); return; }
      /* flood fill with a wave: each cell opens a beat after the one it was reached from, so a big clear ripples outward */
      var stack = [[i, 0]], n = 0; while(stack.length){ var s = stack.shift(), j = s[0], k = cells[j]; if(k.open || k.flag === 1) continue; k.open = true; k.a = .001; k.d = s[1]; if(k.flag === 2){ k.flag = 0; maybes--; } revealed++; n++; if(k.n === 0) around(j, function(q){ if(!cells[q].open) stack.push([q, s[1] + .035]); }); }
      snd.dig(); if(n > 4) snd.pop(Math.min(n, 8)); score += n; api.score(score);
      if(revealed === PLAY - MINES) win(); }
    function nextLevel(){ level++; lives = LIVES; state = 'play'; board(level); flash('level '+level+'  \u00b7  '+MINES+' mines', 2.2); snd.level(); status(); }
    function chord(i){ var c = cells[i]; if(!c.open || !c.n || c.ch) return; var f = 0; around(i, function(j){ if(cells[j].flag === 1) f++; }); if(f === c.n) around(i, function(j){ if(cells[j].flag !== 1) reveal(j); }); }
    function flag(i){ var c = cells[i]; if(c.open || state !== 'play') return; if(c.flag === 0){ c.flag = 1; flags++; snd.flag(); } else if(c.flag === 1 && SET.maybe === 'on'){ c.flag = 2; flags--; maybes++; snd.maybe(); } else { if(c.flag === 1) flags--; else maybes--; c.flag = 0; } c.fa = .001; status(); }   /* none -> red flag -> yellow maybe -> none (maybes off: none -> flag -> none) */
    function act(i){ if(cells[i].open) chord(i); else reveal(i); }
    function flash(s, d){ msg = s; msgT = d || 1.4; }
    function step(d){ var x = cur % COLS, y = (cur / COLS)|0, dx = d === 'L' ? -1 : d === 'R' ? 1 : 0, dy = d === 'U' ? -1 : d === 'D' ? 1 : 0;
      for(var n = 0; n < Math.max(COLS, ROWS); n++){ x += dx; y += dy; var j = nb(x, y); if(j < 0) return; if(!cells[j].v){ cur = j; cursorT = 0; return; } } }   /* skips the holes of a shaped board, wraps on the torus */
    g.key = function(k, down){ if(!down) return false;
      if(state === 'menu'){ if(k === ' ' || k === 'Enter'){ start(); return true; } return false; }
      if(state !== 'play') return false; var d = isDir(k);
      if(d){ step(d); return true; }
      if(k === ' ' || k === 'Enter'){ act(cur); return true; } if(k === 'f' || k === 'F'){ flag(cur); return true; } return false; };
    function at(x, y){ var bx = (x - view.x)/view.z, by = (y - view.y)/view.z, cxx = Math.floor(bx / CELL), cyy = Math.floor(by / CELL); if(!(cxx >= 0 && cyy >= 0 && cxx < COLS && cyy < ROWS)) return -1; var i = idx(cxx, cyy); return cells[i].v ? -1 : i; }
    /* one finger (or mouse button) = `press`: it digs on a quick lift, flags when held HOLD ms (a timer, so the flag never depends on where the finger is when it lifts; a drift under half a cell is
       still a hold), pans when it moves further and the board is zoomed. A second finger ends the press unresolved and starts a pinch; after a pinch nothing digs until every finger is up again. */
    var HOLD = { touch:320, pen:320, mouse:420 };
    function endPress(){ if(holdTimer){ clearTimeout(holdTimer); holdTimer = 0; } press = null; }
    function slack(){ return Math.max(10, CELL*view.z*.45); }
    function startPinch(){ var ids = Object.keys(touches), a = touches[ids[0]], b = touches[ids[1]]; pinch = { ids:[ids[0], ids[1]], d0:Math.max(24, Math.hypot(a.x - b.x, a.y - b.y)), mx:(a.x + b.x)/2, my:(a.y + b.y)/2, z0:view.z, vx:view.x, vy:view.y, moved:false }; }
    function pinchMove(){ var a = touches[pinch.ids[0]], b = touches[pinch.ids[1]]; if(!a || !b) return; var d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x)/2, my = (a.y + b.y)/2, z = clamp(pinch.z0*d/pinch.d0, 1, ZMAX), k = z/pinch.z0;
      pinch.moved = true; view.z = z; view.x = mx - (pinch.mx - pinch.vx)*k; view.y = my - (pinch.my - pinch.vy)*k; clampView(); }
    g.pointer = function(type, x, y, e){ var id = e && e.pointerId !== undefined ? String(e.pointerId) : 'm', kind = e && e.pointerType ? e.pointerType : 'mouse';
      if(type === 'down'){ touches[id] = { x:x, y:y }; var n = Object.keys(touches).length;
        if(n === 2){ endPress(); startPinch(); return; } if(n > 2) return;   /* a second finger: whatever the first was about to do is off; the pair zooms and pans */
        if(state !== 'play') return; var i = at(x, y); if(i > -1){ cur = i; cursorT = 0; }
        if(e && (e.button === 2 || e.ctrlKey || e.metaKey)){ if(i > -1) flag(i); return; }
        press = { id:id, i:i, x:x, y:y, lx:x, ly:y, t:Date.now(), hold:HOLD[kind] || 320, moved:false, done:i < 0 };   /* a press off the board can only pan */
        if(i > -1){ holdTimer = setTimeout(function(){ holdTimer = 0; if(press && press.id === id && !press.moved && !press.done && state === 'play'){ press.done = true; flag(press.i); burst(cx(press.i), cy(press.i), 6, cells[press.i].flag === 2 ? '#ffd166' : FLAG, 90); } }, press.hold); }
        return; }
      if(type === 'move'){ if(touches[id]){ touches[id].x = x; touches[id].y = y; } if(pinch){ if(pinch.ids.indexOf(id) > -1) pinchMove(); return; }
        if(press && press.id === id){ if(!press.moved && Math.hypot(x - press.x, y - press.y) > slack()){ press.moved = true; if(holdTimer){ clearTimeout(holdTimer); holdTimer = 0; } }
          if(press.moved && view.z > 1){ view.x += x - press.lx; view.y += y - press.ly; clampView(); } press.lx = x; press.ly = y; }
        return; }
      if(type === 'up' || type === 'cancel'){ delete touches[id];
        if(pinch){ if(pinch.ids.indexOf(id) > -1){ pinch = null; pinchCool = Date.now(); } return; }
        if(press && press.id === id){ var p = press; endPress(); if(type !== 'up' || p.moved || p.done || state !== 'play' || Date.now() - pinchCool < 300) return;
          if(at(x, y) === p.i){ if(Date.now() - p.t >= p.hold) flag(p.i); else act(p.i); } } } };   /* the timer normally beats the lift; this is the same rule if a frame ran late */
    g.cancel = function(x, y, e){ g.pointer('cancel', x, y, e); };
    g.release = function(){ touches = {}; pinch = null; endPress(); };
    var onWheel = function(e){ if(state !== 'play') return; e.preventDefault(); var r = api.canvas.getBoundingClientRect(), x = (e.clientX - r.left)/r.width*W, y = (e.clientY - r.top)/r.height*H; zoomAt(view.z*Math.exp(-(e.deltaMode ? e.deltaY*16 : e.deltaY)*(e.ctrlKey ? .02 : .0025)), x, y); };   /* wheel or trackpad pinch (ctrlKey) zooms about the cursor; a mouse drag pans */
    api.stage.addEventListener('wheel', onWheel, { passive:false });
    g.inMenu = function(){ return state === 'menu'; };
    /* ---- the front menu: a DOM card over the canvas (the framework hands .gm-ui clicks straight to it); the board behind previews the shape and colours ---- */
    function optRow(k, label, kind){ var btns = MN_OPT[k].map(function(v){ var lab = MN_LABEL[k] ? MN_LABEL[k][v] : String(v), sw = kind === 'theme' ? MN_THEMES[v].lid[0] : kind === 'flag' ? MN_FLAGS[v] : ''; return '<button type="button" data-opt="'+k+'" data-val="'+v+'"'+(sw ? ' class="sw" style="--c:'+sw+'" title="'+(kind === 'theme' ? MN_THEMES[v].name : v)+'" aria-label="'+(kind === 'theme' ? MN_THEMES[v].name : v)+'"' : '')+'>'+(sw ? '' : lab)+'</button>'; }).join('');
      return '<div class="mn-row" data-row="'+k+'"><span class="mn-lab">'+label+'</span><div class="mn-opts">'+btns+'</div></div>'; }
    menuEl = document.createElement('div'); menuEl.className = 'mn-menu gm-ui';
    menuEl.innerHTML = '<div class="mn-panel"><h2>Mines</h2><p class="mn-sub">Set up the field</p><div class="mn-rows">'+
      optRow('mines', 'Mines')+optRow('lives', 'Lives')+optRow('board', 'Board')+optRow('blast', 'Blast')+optRow('theme', 'Colours', 'theme')+optRow('flag', 'Flags', 'flag')+optRow('maybe', 'Maybes')+optRow('first', 'First dig')+optRow('clock', 'Clock')+optRow('music', 'Music')+
      '<div class="mn-row" data-row="vol"><span class="mn-lab">Volume</span><label class="mn-vol"><input type="range" data-vol min="0" max="1" step=".05" value="'+SET.vol+'"><output data-volout>'+Math.round(SET.vol*100)+'%</output></label></div></div>'+
      '<p class="mn-hint" data-hint></p><div class="mn-actions"><button type="button" class="mn-play" data-play>Play</button><button type="button" class="mn-reset" data-reset>Defaults</button></div><p class="mn-foot" data-foot>'+(api.touch ? 'tap digs, press and hold flags (twice for a yellow maybe), pinch zooms' : 'click digs, right click flags (twice for a yellow maybe), or arrows + space + f  \u00b7  wheel zooms  \u00b7  space plays')+'</p></div>';
    api.stage.appendChild(menuEl); hint.el = menuEl.querySelector('[data-hint]'); hint.vol = menuEl.querySelector('[data-vol]'); hint.volout = menuEl.querySelector('[data-volout]');
    function setHint(k){ var v = SET[k], line = MN_HELP[k] || ''; if(k === 'mines'){ var d = dims(1); line = v+' mines on a '+d.cols+'\u00d7'+d.rows+' board to start. '+line; } else if(k === 'board' && SET.board !== 'rect' && SET.board !== 'torus'){ var d2 = dims(1); line = MN_LABEL.board[v]+': '+d2.cols+'\u00d7'+d2.rows+' with the corners cut, '+PLAY+' cells to sweep. '+line; } hint.el.textContent = line; }
    function syncMenu(){ [].forEach.call(menuEl.querySelectorAll('[data-opt]'), function(b){ b.classList.toggle('sel', String(SET[b.getAttribute('data-opt')]) === b.getAttribute('data-val')); }); hint.vol.value = SET.vol; hint.volout.textContent = Math.round(SET.vol*100)+'%'; var isDef = Object.keys(MN_DEF).every(function(k){ return SET[k] === MN_DEF[k]; }); menuEl.querySelector('[data-reset]').hidden = isDef; if(!hint.el.textContent) hint.el.textContent = isDef ? 'These are the classic tigOS settings. Anything you change is kept in this browser.' : 'Your settings are kept in this browser.'; }
    function setOpt(k, v){ SET[k] = v; saveSet(); apply(); if(state === 'menu'){ board(1); status(); } syncMenu(); setHint(k); snd.ui(); }
    menuEl.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b || state !== 'menu') return;
      if(b.hasAttribute('data-opt')){ var k = b.getAttribute('data-opt'), raw = b.getAttribute('data-val'), v = MN_OPT[k].filter(function(o){ return String(o) === raw; })[0]; if(v !== undefined) setOpt(k, v); }
      else if(b.hasAttribute('data-play')) start();
      else if(b.hasAttribute('data-reset')){ Object.keys(MN_DEF).forEach(function(k){ SET[k] = MN_DEF[k]; }); saveSet(); apply(); board(1); hint.el.textContent = ''; syncMenu(); snd.ui(); }
      api.stage.focus({ preventScroll:true }); });
    var onVol = function(e){ if(!e.target.hasAttribute('data-vol')) return; SET.vol = clamp(+e.target.value, 0, 1); saveSet(); hint.volout.textContent = Math.round(SET.vol*100)+'%'; setHint('vol'); if(e.type === 'change') snd.ui(); };
    menuEl.addEventListener('input', onVol); menuEl.addEventListener('change', onVol);
    g.destroy = function(){ if(menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl); music.kind = 'off'; api.stage.removeEventListener('wheel', onWheel); g.release(); };
    g.peek = function(){ return { level:level, lives:lives, mines:MINES, left:left(), flags:flags, maybes:maybes, blown:blown, revealed:revealed, state:state, cols:COLS, rows:ROWS, cell:CELL, score:score, placed:placed, cur:cur, shake:+shake.toFixed(2), parts:parts.length, msg:msgT > 0 ? msg : '', endT:+endT.toFixed(2), flagAt:cells[cur].flag, opening:cells.filter(function(c){ return c.a > 0 && c.a < 1; }).length,
      playable:PLAY, voids:cells.length - PLAY, charred:charred, limit:LIMIT, remaining:LIMIT ? Math.max(0, LIMIT - elapsed) : null, theme:TH.name, flagCol:FLAG, maxLives:LIVES, music:music.kind, musicStep:music.step, opts:JSON.parse(JSON.stringify(SET)), menu:state === 'menu' && !menuEl.hidden,
      W:W, H:H, ui:+UI.toFixed(2), my:MY, area:{ x:AX, y:AY, w:AW, h:AH }, zoom:+view.z.toFixed(3), zmax:ZMAX, vx:Math.round(view.x), vy:Math.round(view.y), touches:Object.keys(touches).length, pinching:!!pinch, demo:state === 'menu', t:+t.toFixed(2), ghost:{ target:ghost.target, act:ghost.act, moves:ghost.moves, done:ghost.done > 0 }, holding:!!(press && press.i > -1 && !press.done && !press.moved), pressed:press ? press.i : -1 }; };
    g.dbg = { safe:function(){ if(!placed) place(cur); for(var i = 0; i < cells.length; i++) if(!cells[i].v && !cells[i].m && !cells[i].open && cells[i].n > 0) return i; return -1; }, mine:function(){ if(!placed) place(cur); for(var i = 0; i < cells.length; i++) if(cells[i].m && !cells[i].open) return i; return -1; }, reveal:function(i){ reveal(i); }, flag:function(i){ flag(i); }, cell:function(i){ var c = cells[i]; return { m:c.m, n:c.n, open:c.open, flag:c.flag, blown:c.blown, v:c.v, ch:c.ch }; },
      clear:function(){ if(!placed) place(cur); for(var i = 0; i < cells.length; i++) if(!cells[i].v && !cells[i].m && !cells[i].open) reveal(i); }, tick:function(sec){ var n = Math.round((sec || 1)*60); for(var i = 0; i < n; i++) g.update(1/60); }, dims:dims,
      set:function(k, v){ if(k === 'vol'){ SET.vol = clamp(+v, 0, 1); saveSet(); syncMenu(); } else setOpt(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, around:function(i){ var out = []; around(i, function(j){ out.push(j); }); return out; }, elapsed:function(s){ t0 = Date.now() - s*1000; }, defaults:function(){ return JSON.parse(JSON.stringify(MN_DEF)); },
      zoom:function(z, x, y){ zoomAt(z, x === undefined ? W/2 : x, y === undefined ? H/2 : y); return view.z; }, at:function(x, y){ return at(x, y); }, centre:function(i){ return { x:view.x + cx(i)*view.z, y:view.y + cy(i)*view.z }; } };
    /* the menu backdrop: someone quietly playing the field behind the panel. A ghost picks a cell on the edge of what is open, hovers it for a moment (a faint ring), then opens it with the
       usual ripple, or flags a mine it can see; when most of the board is open it starts a fresh one. Real cells, real mines, no sound, no score; Play deals a clean board. */
    var ghost = { next:0, target:-1, act:'', at:0, moves:0, done:0 };
    function ghostReset(){ ghost.next = t + 1; ghost.target = -1; ghost.moves = 0; ghost.done = 0; }
    function ghostOpen(i){ var stack = [[i, 0]]; while(stack.length){ var s = stack.shift(), j = s[0], k = cells[j]; if(k.open || k.flag === 1) continue; k.open = true; k.a = .001; k.d = s[1]; revealed++; if(k.n === 0) around(j, function(q){ if(!cells[q].open) stack.push([q, s[1] + .035]); }); } }
    function ghostTick(){
      if(ghost.done){ if(t >= ghost.done){ board(1); ghostReset(); } return; }
      if(!placed){ var c0 = -1; for(var g0 = 0; g0 < 40 && c0 < 0; g0++){ var q0 = ri(0, cells.length - 1); if(!cells[q0].v) c0 = q0; } if(c0 < 0) return; place(c0); ghost.next = t + .8; ghost.target = c0; ghost.act = 'open'; ghost.at = t + .5; return; }
      if(ghost.target < 0 && t >= ghost.next){ var front = [], mines = []; cells.forEach(function(k, i){ if(k.v || k.open || k.flag) return; var nearOpen = false; around(i, function(j){ if(cells[j].open) nearOpen = true; }); if(!nearOpen) return; (k.m ? mines : front).push(i); });
        if(mines.length && Math.random() < .3){ ghost.target = mines[ri(0, mines.length - 1)]; ghost.act = 'flag'; } else if(front.length){ ghost.target = front[ri(0, front.length - 1)]; ghost.act = 'open'; } else { for(var q1 = 0; q1 < cells.length; q1++) if(!cells[q1].v && !cells[q1].open && !cells[q1].m){ ghost.target = q1; ghost.act = 'open'; break; } }
        if(ghost.target < 0){ ghost.done = t + 2.5; return; } ghost.at = t + rnd(.4, .7); return; }
      if(ghost.target > -1 && t >= ghost.at){ var k1 = cells[ghost.target]; if(ghost.act === 'flag'){ if(!k1.flag){ k1.flag = 1; k1.fa = .001; flags++; } } else ghostOpen(ghost.target); ghost.target = -1; ghost.moves++; ghost.next = t + rnd(.9, 1.8);
        if(revealed >= (PLAY - MINES)*.85 || left() <= 0) ghost.done = t + 2.5; } }
    g.update = function(dt){ t += dt; music.tick(dt); if(state === 'play' && placed) elapsed = (Date.now() - t0)/1000; msgT = Math.max(0, msgT - dt); cursorT += dt; shake = Math.max(0, shake - dt*2.4);
      if(state === 'play' && placed && LIMIT && elapsed >= LIMIT){ lose('time', 'Out of time'); return; }
      for(var i = 0; i < cells.length; i++){ var c = cells[i]; if(c.a > 0 && c.a < 1){ if(c.d > 0) c.d -= dt; else c.a = Math.min(1, c.a + dt*4.5); } if(c.fa > 0 && c.fa < 1) c.fa = Math.min(1, c.fa + dt*5); }
      for(var p = parts.length - 1; p >= 0; p--){ var q = parts[p]; q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; if(q.g !== 0) q.vy += 520*dt; q.vx *= (1 - dt*1.5); if(q.t > q.l) parts.splice(p, 1); }
      if(state === 'menu') ghostTick();
      if(state === 'won' && endT > 0){ endT -= dt; if(endT <= 0) nextLevel(); } };
    function ease(k){ return 1 - (1 - k)*(1 - k)*(1 - k); }
    function drawFlag(c, x, y, s, kind, k){ var pop = k < 1 ? 1 + Math.sin(k*Math.PI)*.35 : 1; c.save(); c.translate(x, y); c.scale(s*pop, s*pop); c.fillStyle = kind === 1 ? FLAG : '#ffd166'; c.beginPath(); c.moveTo(-3, -8); c.lineTo(7, -3); c.lineTo(-3, 2); c.closePath(); c.fill(); c.fillStyle = TH.ink; c.fillRect(-4, -8, 2, 15); if(kind === 2){ c.fillStyle = '#1a1208'; c.font = '800 8px '+FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 1.5, -3); } c.restore(); }
    function drawMine(c, k){ if(TH.flower && !k.blown){ c.fillStyle = TH.mine; for(var p = 0; p < 5; p++){ var an = p*Math.PI*2/5 - Math.PI/2; c.beginPath(); c.arc(Math.cos(an)*CELL*.17, Math.sin(an)*CELL*.17, CELL*.12, 0, 7); c.fill(); } c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, 0, CELL*.11, 0, 7); c.fill(); return; }
      c.fillStyle = k.blown ? '#ff5f57' : TH.mine; c.beginPath(); c.arc(0, 0, CELL*.22, 0, 7); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(1.5, CELL*.07); for(var sp = 0; sp < 4; sp++){ var a2 = sp*Math.PI/4; c.beginPath(); c.moveTo(Math.cos(a2)*CELL*.3, Math.sin(a2)*CELL*.3); c.lineTo(-Math.cos(a2)*CELL*.3, -Math.sin(a2)*CELL*.3); c.stroke(); }
      if(k.blown){ c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-CELL*.3, -CELL*.3); c.lineTo(CELL*.3, CELL*.3); c.moveTo(CELL*.3, -CELL*.3); c.lineTo(-CELL*.3, CELL*.3); c.stroke(); } }
    function clockText(){ if(!LIMIT) return elapsed.toFixed(0)+'s'; var r = Math.max(0, LIMIT - elapsed), m = Math.floor(r/60), s = Math.floor(r % 60); return m+':'+(s < 10 ? '0' : '')+s; }
    g.draw = function(c){
      bg(c, W, H, TH.bg[0], TH.bg[1]);
      var menu = state === 'menu'; if(menuEl.hidden !== !menu) menuEl.hidden = !menu;
      c.save(); if(shake > 0){ var sh = shake*shake*6; c.translate(rnd(-sh, sh), rnd(-sh, sh)); }
      var late = LIMIT && state === 'play' && LIMIT - elapsed < 30;
      text(c, left()+' mines', PAD, 24*UI, 14*UI, FLAG, 'left', 700); text(c, clockText(), W - PAD, 24*UI, 14*UI, late ? '#ff5f57' : TH.dim, 'right', 700);
      text(c, 'level '+level, W/2, 18*UI, 12*UI, TH.dim, 'center', 700);
      if(view.z > 1.01) text(c, view.z.toFixed(1)+'\u00d7', W - PAD, 40*UI, 10*UI, TH.dim, 'right', 700);
      for(var l = 0; l < LIVES; l++){ var lx = W/2 - (LIVES - 1)*11*UI + l*22*UI, on = l < lives; c.fillStyle = on ? '#ff5f57' : TH.open; c.beginPath(); c.moveTo(lx, 36*UI); c.bezierCurveTo(lx - 7*UI, 30*UI, lx - 7*UI, 25*UI, lx, 28*UI); c.bezierCurveTo(lx + 7*UI, 25*UI, lx + 7*UI, 30*UI, lx, 36*UI); c.fill(); }
      var fs = Math.max(10, Math.round(CELL*.55)), r = Math.max(2, CELL*.14), now = Date.now();
      c.save(); c.beginPath(); c.rect(0, MY - 2, W, H - MY + 2); c.clip();
      c.translate(view.x, view.y); c.scale(view.z, view.z);   /* the board, zoomed and panned, never over the top bar */
      if(SET.board === 'torus'){ c.setLineDash([4, 4]); c.strokeStyle = TH.dim; c.lineWidth = 1; rr(c, -3.5, -3.5, COLS*CELL + 7, ROWS*CELL + 7, 6); c.stroke(); c.setLineDash([]); }
      for(var i = 0; i < cells.length; i++){ var k = cells[i]; if(k.v) continue; var x = (i % COLS)*CELL, y = ((i / COLS)|0)*CELL;
        if(k.open){ var ka = k.a >= 1 ? 1 : k.a <= 0 ? 0 : ease(k.a), sc = k.blown ? 1 : .6 + .4*ka;
          if(ka < 1){ c.fillStyle = TH.open; rr(c, x + 1, y + 1, CELL - 2, CELL - 2, r); c.fill(); }   /* the lid still drawn while the cell pops open */
          if(ka <= 0) continue; c.save(); c.translate(x + CELL/2, y + CELL/2); c.scale(sc, sc); c.globalAlpha = ka;
          c.fillStyle = k.blown ? '#5a1d1d' : k.ch ? '#1a1311' : k.m ? TH.mineCell : TH.open; rr(c, -CELL/2 + 1, -CELL/2 + 1, CELL - 2, CELL - 2, r); c.fill();
          if(k.m) drawMine(c, k);
          else if(k.ch){ c.fillStyle = 'rgba(255,255,255,.14)'; for(var s2 = 0; s2 < 3; s2++){ var ax = ((i*7 + s2*13) % 10 - 5)*CELL*.06, ay = ((i*11 + s2*17) % 10 - 5)*CELL*.06; c.beginPath(); c.arc(ax, ay, Math.max(1, CELL*.05), 0, 7); c.fill(); } }
          else if(k.n) text(c, String(k.n), 0, 1, fs, TH.num[k.n], 'center', 800);
          c.restore(); }
        else { var gr = c.createLinearGradient(x, y, x, y + CELL); gr.addColorStop(0, TH.lid[0]); gr.addColorStop(1, TH.lid[1]); c.fillStyle = gr; rr(c, x + 1, y + 1, CELL - 2, CELL - 2, r); c.fill(); c.fillStyle = TH.hi; rr(c, x + 3, y + 3, CELL - 6, Math.max(2, CELL*.18), 2); c.fill();
          if(k.flag) drawFlag(c, x + CELL/2, y + CELL/2 + 1, CELL/24, k.flag, k.fa); }
        if(i === cur && !api.touch && state === 'play'){ c.strokeStyle = 'rgba(255,138,0,'+(.65 + Math.sin(cursorT*6)*.35)+')'; c.lineWidth = 2; rr(c, x + 1.5, y + 1.5, CELL - 3, CELL - 3, r); c.stroke(); } }
      if(menu && ghost.target > -1){ var gk = clamp((t - (ghost.at - .6))/.6, 0, 1), gx = cx(ghost.target), gy = cy(ghost.target); c.strokeStyle = ghost.act === 'flag' ? FLAG : TH.ink; c.globalAlpha = .18 + .3*gk; c.lineWidth = Math.max(1.5, CELL*.06); rr(c, gx - CELL/2 + 1.5, gy - CELL/2 + 1.5, CELL - 3, CELL - 3, r); c.stroke(); c.globalAlpha = 1; }   /* the ghost's hover: a faint outline settling on the cell it is about to open or flag */
      if(press && press.i > -1 && !press.done && !press.moved && state === 'play'){ var hk = clamp((now - press.t)/press.hold, 0, 1), hx = cx(press.i), hy = cy(press.i);   /* the hold filling: a ring sweeps round the pressed cell and the flag drops when it closes */
        if(hk > .12){ c.strokeStyle = FLAG; c.lineWidth = Math.max(2, CELL*.09); c.globalAlpha = .9; c.beginPath(); c.arc(hx, hy, CELL*.36, -Math.PI/2, -Math.PI/2 + hk*Math.PI*2); c.stroke(); c.globalAlpha = 1; } }
      for(var p = 0; p < parts.length; p++){ var q = parts[p]; c.globalAlpha = Math.max(0, 1 - q.t/q.l); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r*(1 - q.t/q.l*.5), 0, 7); c.fill(); } c.globalAlpha = 1;
      c.restore();
      c.restore();
      if(msgT > 0 && !menu){ var ma = Math.min(1, msgT*3), my = AY + AH/2, mw = Math.min(300*UI, W - 16); c.fillStyle = 'rgba(10,10,14,'+(.72*ma)+')'; rr(c, W/2 - mw/2, my - 22*UI, mw, 44*UI, 12*UI); c.fill(); c.globalAlpha = ma; text(c, msg, W/2, my, Math.min(17*UI, mw/Math.max(8, msg.length)*1.9), state === 'won' ? '#28c840' : /boom|time/.test(msg) ? '#ff5f57' : '#ffd166', 'center', 800); c.globalAlpha = 1; }
    };
    return g;
  }
/* tigOS arcade games.js, part 08: paddle. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Paddle (pong vs cpu). Opens on its own menu (points to win, cpu skill, ball speed, paddle length, your colour; kept under tigos.paddle); behind the card two
     cpus quietly trade a rally, the score ticking up on both sides, and start a new match when one reaches the target. Space, Enter or Play begins yours. ---------- */
  var PD_COL = { orange:'#ff8a00', mint:'#63e6be', pink:'#ff8fc8', blue:'#8cc7ff', white:'#f4f1ea' };
  function paddle(api){
    var W = api.W, H = api.H, g = {}, me, cpu, ball, held = {}, pts, over, serveT, trail, state = 'menu', PH = 80, PW = 12, TO = 7, SPD = 330, CPUK = 1, MECOL = '#ff8a00', restT = 0;
    var menu = gameMenu(api, { id:'paddle', title:'Paddle', sub:'Set up the match', color:'#63e6be',
      rows:[['to', 'First to'], ['cpu', 'Cpu'], ['speed', 'Ball'], ['size', 'Paddles'], ['colour', 'Yours']],
      opt:{ to:[5, 7, 11], cpu:['easy', 'normal', 'hard'], speed:['slow', 'normal', 'fast'], size:['short', 'normal', 'long'], colour:Object.keys(PD_COL) }, def:{ to:7, cpu:'normal', speed:'normal', size:'normal', colour:'orange' },
      label:{ cpu:{ easy:'Easy', normal:'Normal', hard:'Hard' }, speed:{ slow:'Slow', normal:'Normal', fast:'Fast' }, size:{ short:'Short', normal:'Normal', long:'Long' } },
      help:{ to:'Points that win the match.', cpu:'How sharp the cpu tracks the ball. It also tightens up when it falls behind.', speed:'How fast the ball is served. Every return adds a little.', size:'Paddle length for both sides.', colour:'The colour of your paddle.' },
      swatch:{ colour:PD_COL },
      foot:api.touch ? 'drag to move your paddle' : 'up/down or the mouse move  \u00b7  space plays', onChange:function(){ if(state === 'menu') setup(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function serve(dir){ ball = { x:W/2, y:H/2, vx:0, vy:0, r:8 }; serveT = .9; ball.dir = dir; trail = []; }
    function setup(){ TO = SET.to; CPUK = { easy:.7, normal:1, hard:1.35 }[SET.cpu] || 1; SPD = { slow:260, normal:330, fast:420 }[SET.speed] || 330; PH = { short:56, normal:80, long:112 }[SET.size] || 80; MECOL = PD_COL[SET.colour] || PD_COL.orange; me = { y:H/2 - PH/2, react:0 }; cpu = { y:H/2 - PH/2, react:0 }; pts = [0, 0]; over = false; held = {}; restT = 0; serve(1); }
    g.reset = function(){ state = 'menu'; setup(); menu.show(true); api.score(0); api.status('set up the match, then play'); };
    function start(){ state = 'play'; setup(); menu.show(false); api.score(0); api.status('first to '+TO+'  \u00b7  you 0, cpu 0'); }
    g.inMenu = function(){ return state === 'menu'; };
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } var d = isDir(k); if(d === 'U' || d === 'D'){ held[d] = down; return true; } return false; };
    g.pointer = function(type, x, y){ if(state === 'play' && (type === 'move' || type === 'down')) me.y = clamp(y - PH/2, 0, H - PH); };
    g.peek = function(){ return { state:state, menu:state === 'menu' && !menu.el.hidden, pts:pts.slice(), to:TO, over:over, ph:PH, speed:SPD, cpuK:CPUK, colour:MECOL, ball:{ x:Math.round(ball.x), y:Math.round(ball.y) }, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, score:function(a, b){ pts = [a, b]; } };
    function point(who){ pts[who]++; if(state === 'play'){ api.score(pts[0]); api.status('first to '+TO+'  \u00b7  you '+pts[0]+', cpu '+pts[1]); } if(pts[who] >= TO){ over = true; if(state === 'play') api.over(who === 0 ? 'You beat the cpu '+pts[0]+' to '+pts[1] : 'The cpu wins '+pts[1]+' to '+pts[0]); else restT = 1.8; return; } serve(who === 0 ? 1 : -1); }
    function track(side, dt, k){ var mine = side === 0, coming = mine ? ball.vx < 0 : ball.vx > 0, tgt = coming ? ball.y - PH/2 + (side.react || 0) : H/2 - PH/2; if(coming && Math.random() < dt*3) side.react = rnd(-26, 26)/k; var lead = mine ? pts[0] - pts[1] : pts[1] - pts[0]; var cs = (260 + Math.min(-lead, 4)*35)*k; side.y += clamp(tgt - side.y, -cs*dt, cs*dt); side.y = clamp(side.y, 0, H - PH); }
    g.update = function(dt){ if(over){ if(state === 'menu'){ restT -= dt; if(restT <= 0) setup(); } return; }
      if(state === 'menu') track(me, dt, 1); else { if(held.U) me.y = clamp(me.y - 420*dt, 0, H - PH); if(held.D) me.y = clamp(me.y + 420*dt, 0, H - PH); }
      if(serveT > 0){ serveT -= dt; if(serveT <= 0){ var a = rnd(-.5, .5); ball.vx = Math.cos(a)*SPD*ball.dir; ball.vy = Math.sin(a)*SPD; } return; }
      ball.x += ball.vx*dt; ball.y += ball.vy*dt; trail.push({ x:ball.x, y:ball.y }); if(trail.length > 10) trail.shift();
      if(ball.y < ball.r){ ball.y = ball.r; ball.vy = Math.abs(ball.vy); } if(ball.y > H - ball.r){ ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); }
      track(cpu, dt, CPUK); cpu.y = clamp(cpu.y, 0, H - PH);
      if(ball.vx < 0 && ball.x - ball.r <= 24 + PW && ball.x - ball.r > 12 && ball.y > me.y - ball.r && ball.y < me.y + PH + ball.r){ var rel = (ball.y - (me.y + PH/2)) / (PH/2), sp = Math.min(760, Math.hypot(ball.vx, ball.vy)*1.06); ball.vx = Math.cos(rel*.9)*sp; ball.vy = Math.sin(rel*.9)*sp; ball.x = 24 + PW + ball.r; }
      if(ball.vx > 0 && ball.x + ball.r >= W - 24 - PW && ball.x + ball.r < W - 12 && ball.y > cpu.y - ball.r && ball.y < cpu.y + PH + ball.r){ var rel2 = (ball.y - (cpu.y + PH/2)) / (PH/2), sp2 = Math.min(760, Math.hypot(ball.vx, ball.vy)*1.06); ball.vx = -Math.cos(rel2*.9)*sp2; ball.vy = Math.sin(rel2*.9)*sp2; ball.x = W - 24 - PW - ball.r; }
      if(ball.x < -20) point(1); else if(ball.x > W + 20) point(0); };
    g.draw = function(c){
      bg(c, W, H, '#0e1016', '#07080c'); c.setLineDash([8, 10]); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W/2, 12); c.lineTo(W/2, H - 12); c.stroke(); c.setLineDash([]);
      text(c, String(pts[0]), W/2 - 50, 44, 48, 'rgba(255,255,255,.75)', 'center', 800); text(c, String(pts[1]), W/2 + 50, 44, 48, 'rgba(255,255,255,.35)', 'center', 800); text(c, state === 'menu' ? 'CPU' : 'YOU', 24, 20, 11, MECOL); text(c, 'CPU', W - 24, 20, 11, 'rgba(255,255,255,.5)', 'right');
      c.fillStyle = MECOL; rr(c, 24, me.y, PW, PH, 6); c.fill(); c.fillStyle = '#8cc7ff'; rr(c, W - 24 - PW, cpu.y, PW, PH, 6); c.fill();
      trail.forEach(function(p, i){ c.fillStyle = 'rgba(255,255,255,'+(i/trail.length*.25)+')'; c.beginPath(); c.arc(p.x, p.y, ball.r*(.4 + i/trail.length*.6), 0, 7); c.fill(); });
      c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 12; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
      if(serveT > 0 && !over && state === 'play') text(c, 'serving\u2026', W/2, H - 30, 13, 'rgba(255,255,255,.5)', 'center');
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 10: kong. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Kong (girders, ladders and barrels). Opens on its own menu (starting level, lives, barrel pace, hammer, outfit; kept under tigos.kong) while a ghost
     climber behind the card makes the climb on its own: walks to the nearest ladder up, hops a barrel rolling at it, swings the hammer if it happens across it, and starts
     the tower over after the rescue or a fall. Space, Enter or Play starts the real climb. ---------- */
  var KG_FIT = { blue:'#2a6df4', green:'#28c840', purple:'#a78bfa', orange:'#ff8a00', white:'#f4f1ea' };
  function kong(api){
    var W = api.W, H = api.H, g = {}, GIR = [536, 452, 368, 284, 200, 116], TOP = 56, p, barrels, level, lives, score, spawnT, spd, hammer, hamPick, elapsed, kongArm, flash, ladders, safeT, win, open, gapW, conf, hearts, pen, WIN_T = 2.8, state = 'menu', ghostT = 0, FIT = KG_FIT.blue;
    var GRAV = 1000, SPEED = 96, JUMP = -290, PW = 16, PH = 22, PACE = { gentle:.8, classic:1, wild:1.25 };
    var menu = gameMenu(api, { id:'kong', title:'Kong', sub:'Set up the climb', color:'#e24b4b',
      rows:[['level', 'Start level'], ['lives', 'Lives'], ['barrels', 'Barrels'], ['hammer', 'Hammer'], ['fit', 'Outfit']],
      opt:{ level:[1, 2, 3, 4], lives:[1, 3, 5], barrels:['gentle', 'classic', 'wild'], hammer:['on', 'off'], fit:Object.keys(KG_FIT) }, def:{ level:1, lives:3, barrels:'classic', hammer:'on', fit:'blue' },
      label:{ barrels:{ gentle:'Gentle', classic:'Classic', wild:'Wild' }, hammer:{ on:'On the girder', off:'None' } },
      help:{ level:'Which level to start on. Barrels roll faster and come in pairs from level three.', lives:'How many falls and barrels you can take.', barrels:'How fast the barrels roll and how often the ape throws one.', hammer:'Leave a hammer on a girder to smash barrels with, or climb without one.', fit:'The colour of your shirt.' },
      swatch:{ fit:KG_FIT },
      foot:api.touch ? 'hold and drag to walk and climb, tap jumps' : 'arrows move and climb, space jumps  \u00b7  space plays', onChange:function(){ if(state === 'menu') newGame(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    function girderX(i){ return i === 0 ? { x0:0, x1:W } : i === 5 ? { x0:20, x1:W - 44 } : open[i] === 'R' ? { x0:0, x1:W - gapW[i] } : { x0:gapW[i], x1:W }; }
    function rollDir(i){ return open[i] === 'R' ? 1 : -1; }   /* the floor girder runs wall to wall: nowhere to fall from the start */   /* alternating gaps: barrels roll off the open end */
    function buildLadders(){   /* every level lays the tower out fresh: which end of each girder is open, how wide the gap is, where the ladders and the hammer sit */
      open = [null, null, null, null, null, 'R']; gapW = [0, 0, 0, 0, 0, 44]; var side = Math.random() < .5 ? 'L' : 'R';
      for(var i = 4; i >= 1; i--){ open[i] = side; gapW[i] = ri(44, 84); side = side === 'L' ? 'R' : 'L'; if(level > 1 && Math.random() < .2) side = side === 'L' ? 'R' : 'L'; }
      ladders = [];
      for(var a = 0; a < 5; a++){ var ga = girderX(a), gb = girderX(a + 1), lo = Math.max(ga.x0, gb.x0) + 26, hi = Math.min(ga.x1, gb.x1) - 26; if(a === 4) lo = Math.max(lo, 130); var n = Math.random() < .55 ? 2 : 1, xs = [];
        for(var k = 0; k < n; k++){ var x, tries = 0; do { x = Math.round(rnd(lo, hi)); tries++; } while(tries < 20 && xs.some(function(o){ return Math.abs(o - x) < 70; })); xs.push(x); ladders.push({ x:x, a:a, b:a + 1 }); } }
      ladders.push({ x:Math.round(rnd(W - 100, W - 56)), a:5, b:'top' });
      var hg = ri(1, 3), hx = girderX(hg), hxx; do { hxx = Math.round(rnd(hx.x0 + 30, hx.x1 - 30)); } while(ladders.some(function(L){ return (L.a === hg || L.b === hg) && Math.abs(L.x - hxx) < 24; }));
      hamPick = { x:hxx, gi:hg, taken:SET.hammer === 'off' }; }
    function newGame(){ level = SET.level; lives = SET.lives; score = 0; FIT = KG_FIT[SET.fit] || KG_FIT.blue; ghostT = 0; g.held = {}; startLevel(); }
    g.reset = function(){ state = 'menu'; newGame(); menu.show(true); api.score(0); api.status('set up the climb, then play'); };
    function start(){ state = 'play'; newGame(); menu.show(false); api.score(0); st('level '+level+'  \u00b7  lives '+lives); }
    g.inMenu = function(){ return state === 'menu'; };
    var sc = function(){ if(state === 'play') api.score(score); }, st = function(s){ if(state === 'play') api.status(s); };
    function startLevel(){ p = { x:90, y:GIR[0], vy:0, dir:1, air:false, climb:null, dead:0 }; barrels = []; spawnT = 1.2; spd = (95 + (level - 1)*16) * (PACE[SET.barrels] || 1); hammer = 0; elapsed = 0; kongArm = 0; flash = 0; safeT = 1.5; win = 0; conf = []; hearts = []; pen = null; buildLadders(); st('level '+level+'  \u00b7  lives '+lives); }
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } var d = isDir(k); if(k === ' ' || k === 'z' || k === 'Z' || k === 'x' || k === 'X'){ if(down) jumpNow(); return true; } if(!d) return false; g.held = g.held || {}; g.held[d] = down; return true; };
    function jumpNow(){ if(!p || p.dead || win || p.air || p.climb || hammer > 0) return; p.vy = JUMP; p.air = true; }
    g.pointer = function(){};   /* touch: the framework's floating stick walks and climbs, a still tap or a second finger sends space (jump) */
    g.peek = function(){ return { x:p.x, y:p.y, barrels:barrels.length, level:level, lives:lives, hammer:hammer, climb:!!p.climb, air:p.air, win:win, ladders:ladders.map(function(L){ return L.x; }), open:open.slice(1), gaps:gapW.slice(1), hammerAt:{ x:hamPick.x, gi:hamPick.gi }, spd:spd, conf:conf.length, pen:pen ? Math.round(pen.x) : null, dead:p.dead > 0, bl:barrels.map(function(k){ return [Math.round(k.x), Math.round(k.y), k.gi, k.air ? 'a' : k.ladder ? 'l' : '', k.vx > 0 ? '>' : '<'].join(':'); }), state:state, menu:state === 'menu' && !menu.el.hidden, fit:FIT, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, win:function(){ rescue(); }, level:function(n){ level = n; startLevel(); } };
    function rescue(){ win = WIN_T; flash = .35; var bonus = Math.max(500, 5000 - Math.floor(elapsed/2)*100); score += bonus; sc(); st('rescued!  +'+bonus); pen = { x:W - 60, y:TOP - 14, vy:0, hop:0 }; for(var i = 0; i < 70; i++) conf.push({ x:rnd(0, W), y:rnd(-H*.6, -10), vx:rnd(-30, 30), vy:rnd(60, 160), rot:rnd(0, 7), vr:rnd(-6, 6), col:['#ffd166', '#ff5f57', '#4ad3ff', '#8fd46a', '#c084fc', '#fff'][i % 6], w:rnd(4, 8), h:rnd(3, 5) }); }
    function girderAt(y){ for(var i = 0; i < GIR.length; i++) if(Math.abs(GIR[i] - y) < 2) return i; return -1; }
    function ladderNear(x, gi, up){ for(var i = 0; i < ladders.length; i++){ var L = ladders[i]; if(Math.abs(L.x - x) < 9 && ((up && L.a === gi) || (!up && L.b === gi))) return L; } return null; }
    /* the ghost climber: on a girder it walks to the nearest ladder going up and climbs; a barrel rolling at it on the same girder gets jumped (the run carries on
       through the air); with the hammer in hand it goes for the nearest barrel instead, and simply waits out the swing time if the girder is clear */
    function ghost(dt){ if(p.dead || win || p.air) return; ghostT -= dt; if(ghostT > 0) return; ghostT = .05; var h = g.held = {};
      /* barrels that matter for a girder: rolling toward x (or flying off an end), plus one about to drop off a ladder onto it; returns the nearest distance */
      function threatOn(gi2, x, rad){ var best = 1e9; barrels.forEach(function(k){ var d = Math.abs(k.x - x); if(k.ladder){ if(k.ladder.a === gi2 && d < 70) best = Math.min(best, d); } else if(k.gi === gi2 && (d < 28 || (d < rad && (k.air || (k.x - x) * k.vx <= 0)))) best = Math.min(best, d); }); return best; }
      if(p.climb){ var L = p.climb, yb = L.b === 'top' ? TOP : GIR[L.b], dz = p.y - yb;
        if(barrels.some(function(k){ return k.ladder === L && k.y < p.y; })){ h.D = true; return; }   /* a barrel coming down this very ladder: back off */
        if(L.b !== 'top' && dz < 46){ var near = threatOn(L.b, p.x, 130); if(L.b === 5 && p.x < 260 && spawnT < dz/80 + .5) near = Math.min(near, 110 - p.x + spawnT*spd);   /* the ape is about to throw: count that barrel too */
          if(near < 1e9){ if(dz >= 30) return; if(near/spd > (32 - dz)/80) h.D = true; else h.U = true; return; } }   /* hold below the girder while it passes; too shallow already: retreat if there is time, else run for it */
        h.U = true; return; }
      var gi = girderAt(p.y); if(gi < 0) return; var tx = null;
      if(hammer > 0){ var nb = null, nd = 1e9; barrels.forEach(function(k){ if(k.gi === gi && !k.air && !k.ladder){ var d = Math.abs(k.x - p.x); if(d < nd){ nd = d; nb = k; } } }); if(nb) tx = nb.x; }
      var drop = null; barrels.forEach(function(k){ if(k.ladder && k.ladder.a === gi && Math.abs(k.ladder.x - p.x) < 36) drop = k.ladder.x; });
      var aside = 0; if(drop !== null){ var gx = girderX(gi); aside = (p.x > drop || (p.x === drop && gx.x1 - p.x > p.x - gx.x0)) ? 1 : -1; }   /* one is coming down a ladder onto this spot: step aside (still watching the girder) */
      var coming = 1e9, cv = 0; barrels.forEach(function(k){ if(k.gi === gi && !k.ladder && (k.air || (k.x - p.x) * k.vx < 0)){ var d = Math.abs(k.x - p.x); if(d < coming){ coming = d; cv = k.vx; } } });   /* nearest barrel rolling at him */
      if(hammer <= 0){ var lad = null, ld = 1e9; ladders.forEach(function(L){ if(L.a === gi){ var d = Math.abs(L.x - p.x); if(d < ld){ ld = d; lad = L; } } }); if(!lad) return; tx = lad.x;
        if(!aside && Math.abs(p.x - tx) < 6){ var tt = coming/spd; if(tt < .9){ if(tt > .12 && tt < .42) jumpNow(); return; } h.U = true; return; } }   /* at the ladder with a barrel bearing down: let it pass, hopping it if need be */
      if(tx === null && !aside) return; var dirTo = aside || (tx > p.x ? 1 : -1); h[dirTo > 0 ? 'R' : 'L'] = true;
      if(hammer <= 0 && coming < 1e9){ var rel = spd + (dirTo * cv < 0 ? SPEED : -SPEED), tw = rel > 20 ? coming/rel : 9; if(tw > .12 && tw < .42) jumpNow(); } }
    g.update = function(dt){
      if(state === 'menu') ghost(dt); var h = g.held || {}; elapsed += dt; kongArm = Math.max(0, kongArm - dt); flash = Math.max(0, flash - dt); safeT = Math.max(0, safeT - dt);
      if(win){ win -= dt; var wk = 1 - win/WIN_T;
        conf.forEach(function(q){ q.x += (q.vx + Math.sin(elapsed*3 + q.rot)*20)*dt; q.y += q.vy*dt; q.rot += q.vr*dt; }); conf = conf.filter(function(q){ return q.y < H + 10; });
        hearts.forEach(function(q){ q.t += dt; q.y -= 40*dt; q.x += Math.sin(q.t*5)*12*dt; }); hearts = hearts.filter(function(q){ return q.t < 1.4; });
        if(pen){ var tx = p.x + 18*p.dir; if(wk > .15){ pen.hop += dt; pen.x += (tx - pen.x)*Math.min(1, dt*3); pen.y = Math.min(TOP - 14, TOP - 14 - Math.abs(Math.sin(pen.hop*9))*10); } if(Math.random() < dt*6) hearts.push({ x:(pen.x + p.x)/2 + rnd(-16, 16), y:TOP - 30 + rnd(-6, 6), t:0 }); }
        if(win <= 0){ if(state === 'play') level++; startLevel(); } return; }
      if(p.dead){ p.dead -= dt; if(p.dead <= 0){ if(state === 'play' && lives <= 0){ api.over('Kong wins this round'); return; } p = { x:90, y:GIR[0], vy:0, dir:1, air:false, climb:null, dead:0 }; hammer = 0; safeT = 1.5; st('level '+level+'  \u00b7  lives '+lives); } return; }
      if(hammer > 0) hammer -= dt;
      var gi = p.climb ? -1 : girderAt(p.y);
      if(p.climb){ var L = p.climb, ya = GIR[L.a], yb = L.b === 'top' ? TOP : GIR[L.b]; if(h.U) p.y -= 80*dt; if(h.D) p.y += 80*dt; p.x = L.x;
        if(p.y <= yb){ p.y = yb; p.climb = null; if(L.b === 'top'){ p.dir = 1; rescue(); } }
        if(p.y >= ya){ p.y = ya; p.climb = null; } }
      else {
        if(h.L){ p.x -= SPEED*dt; p.dir = -1; } if(h.R){ p.x += SPEED*dt; p.dir = 1; }
        var gx = gi >= 0 ? girderX(gi) : { x0:0, x1:W }; p.x = clamp(p.x, Math.max(8, gi >= 0 && !p.air ? gx.x0 + 8 : 8), Math.min(W - 8, gi >= 0 && !p.air ? gx.x1 - 8 : W - 8));
        if(!p.air && gi >= 0 && hammer <= 0){ if(h.U){ var lu = ladderNear(p.x, gi, true); if(lu){ p.climb = lu; p.x = lu.x; p.y -= 1; } } else if(h.D){ var ld = ladderNear(p.x, gi, false); if(ld){ p.climb = ld; p.x = ld.x; p.y += 1; } } }
        if(p.air || gi < 0){ p.vy += GRAV*dt; p.y += p.vy*dt; for(var i = 0; i < GIR.length; i++){ if(p.vy > 0 && p.y >= GIR[i] && p.y - p.vy*dt <= GIR[i] + .01){ var g2 = girderX(i); if(p.x > g2.x0 - 4 && p.x < g2.x1 + 4){ p.y = GIR[i]; p.vy = 0; p.air = false; break; } } } if(p.y > H + 40){ die(); return; } }
        if(!hamPick.taken && !p.air && gi === hamPick.gi && Math.abs(p.x - hamPick.x) < 14){ hamPick.taken = true; hammer = Math.max(5, 8.5 - level*.5); st('hammer time'); }
      }
      /* barrels */
      spawnT -= dt; if(spawnT <= 0){ spawnT = (clamp(2.6 - level*.25, 1.1, 2.6) + rnd(-.3, .3)) / (PACE[SET.barrels] || 1); barrels.push({ x:110, y:GIR[5], vx:spd, vy:0, gi:5, air:false, r:9, rot:0, jumped:false, ladder:null, gd:Math.random() < .2 }); kongArm = .5; if(level >= 3 && Math.random() < .12 + level*.03) barrels.push({ x:90, y:GIR[5], vx:spd*.9, vy:0, gi:5, air:false, r:9, rot:0, jumped:false, ladder:null, gd:false }); }
      for(var b = barrels.length - 1; b >= 0; b--){ var k = barrels[b]; k.rot += k.vx*dt/9;
        if(k.ladder){ k.y += 70*dt; if(k.y >= GIR[k.ladder.a]){ k.y = GIR[k.ladder.a]; k.gi = k.ladder.a; k.vx = rollDir(k.gi)*spd; k.ladder = null; } }
        else if(k.air){ k.vy += GRAV*dt; k.y += k.vy*dt; k.x += k.vx*dt*.35; for(var j = k.gi - 1; j >= 0; j--){ if(k.y >= GIR[j] && k.y - k.vy*dt <= GIR[j]){ var gx2 = girderX(j); if(k.x > gx2.x0 - 6 && k.x < gx2.x1 + 6){ k.y = GIR[j]; k.gi = j; k.air = false; k.vy = 0; k.vx = rollDir(j)*spd; break; } } } if(k.y > H + 30){ barrels.splice(b, 1); continue; } }
        else { k.x += k.vx*dt; var gx3 = girderX(k.gi); if(k.x < gx3.x0 - 2 || k.x > gx3.x1 + 2 || (k.gi === 0 && (k.x < 12 || k.x > W - 12))){ if(k.gi === 0){ barrels.splice(b, 1); continue; } k.air = true; k.vy = 0; }
          if(!k.lad && Math.random() < dt*(5 + level*1.5)){ for(var q = 0; q < ladders.length; q++){ var L2 = ladders[q]; if(L2.b === k.gi && Math.abs(L2.x - k.x) < 4){ k.ladder = L2; k.lad = true; break; } } } }
        /* interactions */
        if(hammer > 0 && !p.dead && Math.abs(k.x - (p.x + p.dir*14)) < 16 && Math.abs(k.y - p.y) < 20){ barrels.splice(b, 1); score += k.gd ? 500 : 300; sc(); flash = .12; continue; }
        if(!k.jumped && p.air && Math.abs(k.x - p.x) < 12 && p.y < k.y - 12 && p.y > k.y - 60){ k.jumped = true; score += k.gd ? 200 : 100; sc(); }
        if(!p.dead && safeT <= 0 && Math.abs(k.x - p.x) < PW/2 + k.r - 3 && k.y - k.r < p.y && k.y + k.r > p.y - PH + 4){ die(); return; }
      }
    };
    function die(){ if(state === 'play') lives--; p.dead = 1.4; p.climb = null; g.held = {}; st(lives > 0 ? 'ouch  \u00b7  lives '+lives : 'no lives left'); }
    function drawPenguin(c, x, y, sc){ c.save(); c.translate(x, y); c.scale(sc, sc); c.fillStyle = '#111'; c.beginPath(); c.ellipse(0, 0, 9, 12, 0, 0, 7); c.fill(); c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(0, 2, 6, 8, 0, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(0, -10, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-2.2, -11, 1.8, 0, 7); c.arc(2.2, -11, 1.8, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-2, -11, .8, 0, 7); c.arc(2.4, -11, .8, 0, 7); c.fill(); c.fillStyle = '#ff8a00'; c.beginPath(); c.moveTo(-2.5, -8); c.lineTo(2.5, -8); c.lineTo(0, -5.5); c.closePath(); c.fill(); c.fillRect(-7, 11, 5, 2.5); c.fillRect(2, 11, 5, 2.5); c.restore(); }
    function drawBarrel(c, x, y, r, rot, gd){ c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#b5651d'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = '#5a2d0c'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r - 1, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-r, -3); c.lineTo(r, -3); c.moveTo(-r, 3); c.lineTo(r, 3); c.stroke(); if(gd) text(c, 'GD', 0, 0, 6, 'rgba(60,25,5,.85)', 'center', 800); c.restore(); }
    g.draw = function(c){
      bg(c, W, H, '#0b0b16', '#050508');
      /* girders */
      for(var i = 0; i < GIR.length; i++){ var gx = girderX(i), y = GIR[i]; c.fillStyle = '#e24b4b'; c.fillRect(gx.x0, y, gx.x1 - gx.x0, 10); c.fillStyle = '#ff8a8a'; for(var x = gx.x0 + 8; x < gx.x1 - 4; x += 16) c.fillRect(x, y + 3, 4, 4); }
      c.fillStyle = '#e24b4b'; c.fillRect(W - 120, TOP, 120, 10); c.fillStyle = '#ff8a8a'; for(var x2 = W - 112; x2 < W - 4; x2 += 16) c.fillRect(x2, TOP + 3, 4, 4);
      /* ladders */
      c.strokeStyle = '#4ad3ff'; c.lineWidth = 2; ladders.forEach(function(L){ var ya = GIR[L.a], yb = L.b === 'top' ? TOP : GIR[L.b]; c.beginPath(); c.moveTo(L.x - 6, ya); c.lineTo(L.x - 6, yb + 10); c.moveTo(L.x + 6, ya); c.lineTo(L.x + 6, yb + 10); for(var yy = yb + 18; yy < ya; yy += 12){ c.moveTo(L.x - 6, yy); c.lineTo(L.x + 6, yy); } c.stroke(); });
      /* kong + barrel stack + penguin */
      var kx = 60, ky = GIR[5]; c.fillStyle = '#6b3e1e'; rr(c, kx - 26, ky - 52, 52, 52, 14); c.fill(); c.fillStyle = '#c98b5a'; rr(c, kx - 16, ky - 42, 32, 20, 8); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(kx - 8, ky - 36, 3, 0, 7); c.arc(kx + 8, ky - 36, 3, 0, 7); c.fill(); c.fillStyle = '#6b3e1e'; rr(c, kx - 40 + (kongArm ? 6 : 0), ky - 40 - kongArm*20, 16, 34, 7); c.fill(); rr(c, kx + 24, ky - 40, 16, 34, 7); c.fill();
      drawBarrel(c, 16, ky - 10, 9, 0, true); drawBarrel(c, 16, ky - 28, 9, 0, false); drawBarrel(c, 34, ky - 10, 9, 0, false);
      if(!pen) drawPenguin(c, W - 60, TOP - 14, 1.1);
      if(win > 0){ var wk = 1 - win/WIN_T; if(pen) drawPenguin(c, pen.x, pen.y, 1.1 + Math.sin(pen.hop*9)*.06);
        conf.forEach(function(q){ c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.col; c.fillRect(-q.w/2, -q.h/2, q.w, q.h); c.restore(); });
        hearts.forEach(function(q){ var hs = 1 - q.t/1.4; c.save(); c.translate(q.x, q.y); c.scale(hs, hs); c.fillStyle = 'rgba(255,95,120,'+hs+')'; c.beginPath(); c.arc(-3, -2, 3.2, 0, 7); c.arc(3, -2, 3.2, 0, 7); c.fill(); c.beginPath(); c.moveTo(-6, -1); c.lineTo(0, 6); c.lineTo(6, -1); c.closePath(); c.fill(); c.restore(); });
        var bz = wk < .25 ? wk/.25 : 1, bs = .4 + bz*.6 + Math.sin(elapsed*6)*.02; c.save(); c.translate(W/2, H*.42); c.scale(bs, bs); c.globalAlpha = Math.min(1, bz*1.4); c.shadowColor = '#ffd166'; c.shadowBlur = 24; text(c, 'SAVED!', 0, 0, 44, '#ffd166', 'center', 800); c.shadowBlur = 0; text(c, 'Greggy D says thanks', 0, 34, 12, 'rgba(255,255,255,.85)', 'center', 700); c.restore();
        for(var sp = 0; sp < 10; sp++){ var sa = elapsed*2 + sp*.63, sr = 40 + Math.sin(elapsed*4 + sp)*10; c.fillStyle = 'rgba(255,255,255,'+(.5 + .5*Math.sin(elapsed*9 + sp))+')'; c.beginPath(); c.arc((pen ? pen.x : W - 60) + Math.cos(sa)*sr, TOP - 14 + Math.sin(sa)*sr*.5, 1.6, 0, 7); c.fill(); } }
      /* hammer pickup */
      if(!hamPick.taken){ var hx = hamPick.x, hy = GIR[hamPick.gi] - 26 + Math.sin(elapsed*4)*3; c.fillStyle = '#c9c9d4'; c.fillRect(hx - 8, hy - 5, 16, 10); c.fillStyle = '#b5651d'; c.fillRect(hx - 1.5, hy + 5, 3, 14); }
      /* barrels */
      barrels.forEach(function(k){ drawBarrel(c, k.x, k.y - k.r, k.r, k.rot, k.gd); });
      /* player */
      if(!(p.dead > 0 && Math.floor(p.dead*10) % 2)){ c.save(); c.translate(p.x, p.y); c.scale(p.dir, 1);
        c.fillStyle = FIT; rr(c, -7, -16, 14, 12, 3); c.fill(); c.fillStyle = '#e24b4b'; rr(c, -7, -24, 14, 9, 4); c.fill(); c.fillStyle = '#f2c9a0'; c.fillRect(-5, -18, 10, 5); c.fillStyle = '#e24b4b'; var run = (!p.air && !p.climb && (g.held || {}).L || (g.held || {}).R) ? Math.sin(elapsed*16)*3 : 0; c.fillRect(-6, -5, 5, 5 + run); c.fillRect(1, -5, 5, 5 - run);
        if(hammer > 0){ var sw = Math.sin(elapsed*12) > 0; c.fillStyle = '#b5651d'; c.fillRect(6, sw ? -30 : -14, 3, 16); c.fillStyle = '#c9c9d4'; c.fillRect(2, sw ? -36 : -2, 14, 8); }
        c.restore(); }
      if(flash > 0){ c.fillStyle = 'rgba(255,209,102,'+Math.min(1, flash*2)+')'; c.fillRect(0, 0, W, H); }
      /* hud line */
      text(c, 'L'+level+'  lives '+lives + (hammer > 0 ? '  hammer '+Math.ceil(hammer) : ''), 8, 12, 11, 'rgba(255,255,255,.7)');
      if(elapsed < 3 && level === 1 && state === 'play') text(c, api.touch ? 'hold and drag to walk and climb, tap jumps' : 'arrows move and climb, space jumps', W/2, 30, 13, 'rgba(255,255,255,.85)', 'center');
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }

/* tigOS arcade games.js, part 12: hopper. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Hopper (frogger): one frog has to reach the far bank each level (anywhere along it counts), every level a new theme, faster traffic, diving turtles, then crocodiles.
     Opens on its own menu (starting place, clock, frogs, traffic, frog colour; kept under tigos.hopper) while a ghost frog behind the card picks its way across on its own,
     waiting for gaps, riding logs back toward the middle, and hopping home level after level. Space, Enter or Play starts the real crossing. ---------- */
  var FR_COL = { green:'#3ddc84', yellow:'#ffd166', blue:'#8cc7ff', pink:'#ff8fc8', white:'#f4f1ea' };
  function hopper(api){
    var W = api.W, H = api.H, g = {}, CS = 40, COLS = W / CS, PLAY = 13 * CS, HOMES = [1, 3, 5, 7, 9], HOP = .11, state = 'menu', ghostT = 0, FC = FR_COL.green;
    var CLOCK = { relaxed:1.5, classic:1, rush:.7 }, TRAFFIC = { calm:.75, normal:1, heavy:1.3 };
    /* seven themes, one per level (then round again): colours, a name, whether it is night (headlights glow), and the decoration the banks and sky get */
    var THEMES = [
      { name:'the meadow', water:'#123a73', road:'#1e1f26', bank:'#1d4a2a', side:'#4a2d7a', deco:'flowers', log:'#8a5a2b' },
      { name:'sunset highway', water:'#2b3f8a', road:'#26202a', bank:'#5a3a1a', side:'#7a3a2a', deco:'sun', log:'#7a4a22' },
      { name:'night city', water:'#0a1a3a', road:'#101018', bank:'#12281a', side:'#24243a', deco:'stars', night:true, log:'#5a3a1e' },
      { name:'the swamp', water:'#1f4a2a', road:'#2a2a1e', bank:'#2f4a17', side:'#4a3a2a', deco:'reeds', log:'#6a4a24', croc:true },
      { name:'frozen lake', water:'#8fc4e8', road:'#2a2e3a', bank:'#dfe8f2', side:'#b8c8d8', deco:'snow', log:'#9a6a3a', ice:true },
      { name:'the desert', water:'#2a6a8a', road:'#3a2a1a', bank:'#c8a060', side:'#a07a40', deco:'cactus', log:'#8a5a2b' },
      { name:'neon strip', water:'#1a0a3a', road:'#0a0a12', bank:'#2a0a4a', side:'#3a0a5a', deco:'neon', night:true, log:'#5a3a5a' } ];
    function themeOf(L){ return THEMES[(L - 1) % THEMES.length]; }
    function timeOf(L){ return Math.round(Math.max(14, 30 - (L - 1) * 2) * (CLOCK[SET.clock] || 1)); }
    var menu = gameMenu(api, { id:'hopper', title:'Hopper', sub:'Pick your crossing', color:'#3ddc84',
      rows:[['start', 'Start at'], ['clock', 'Clock'], ['lives', 'Frogs'], ['traffic', 'Traffic'], ['frog', 'Frog']],
      opt:{ start:[1, 2, 3, 4, 5, 6, 7], clock:['relaxed', 'classic', 'rush'], lives:[1, 3, 5], traffic:['calm', 'normal', 'heavy'], frog:Object.keys(FR_COL) }, def:{ start:1, clock:'classic', lives:3, traffic:'normal', frog:'green' },
      label:{ start:{ 1:'the meadow', 2:'sunset highway', 3:'night city', 4:'the swamp', 5:'frozen lake', 6:'the desert', 7:'neon strip' }, clock:{ relaxed:'Relaxed', classic:'Classic', rush:'Rush' }, traffic:{ calm:'Calm', normal:'Normal', heavy:'Heavy' } },
      help:{ start:'Which place to start in. Later places bring faster traffic, diving turtles and crocodiles, and the clock is already shorter there.', clock:'How long each frog gets to cross. Relaxed is half again as long, Rush takes a third off.', lives:'Frogs in the pond. Every level cleared gives one back, up to five.', traffic:'How fast the cars, logs and turtles run. Heavy is a third quicker on every lane.', frog:'The colour of your frog.' },
      swatch:{ start:{ 1:'linear-gradient(180deg,#1d4a2a 45%,#123a73 45%)', 2:'linear-gradient(180deg,#7a3a2a 45%,#2b3f8a 45%)', 3:'linear-gradient(180deg,#24243a 45%,#0a1a3a 45%)', 4:'linear-gradient(180deg,#2f4a17 45%,#1f4a2a 45%)', 5:'linear-gradient(180deg,#dfe8f2 45%,#8fc4e8 45%)', 6:'linear-gradient(180deg,#c8a060 45%,#2a6a8a 45%)', 7:'linear-gradient(180deg,#3a0a5a 45%,#1a0a3a 45%)' }, frog:FR_COL },
      foot:api.touch ? 'swipe to hop, or tap a side of the frog' : 'arrows or wasd hop  \u00b7  space plays', onChange:function(){ if(state === 'menu') newGame(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    /* every level gets a fresh layout: lane kinds, directions, speeds and spacing are rolled here; each level rolls faster and tighter */
    function genLanes(level){
      var out = [], dir = Math.random() < .5 ? 1 : -1, turtles = 0, k = (1 + (level - 1)*.16) * (TRAFFIC[SET.traffic] || 1), th = themeOf(level);
      for(var row = 1; row <= 5; row++){ var turtle = (row === 5 && !turtles) || (Math.random() < .4 && turtles < 2); if(turtle) turtles++; var croc = !turtle && (th.croc || level >= 6) && Math.random() < .5; var len = turtle ? ri(2, 3) : croc ? 3 : ri(3, 6); out.push({ row:row, dir:dir, sp:rnd(55, 95)*k + (row === 3 ? 20 : 0), len:len, gap:Math.max(66, rnd(100, 190) - (level - 1)*10), kind:turtle ? 'turtle' : croc ? 'croc' : 'log' }); dir = -dir; }
      if(th.croc && !out.some(function(L){ return L.kind === 'croc'; })){ var lg = out.filter(function(L){ return L.kind === 'log'; })[0]; if(lg){ lg.kind = 'croc'; lg.len = 3; } }   /* the swamp always has at least one crocodile */
      var kinds = ['truck', 'race', 'car', 'dozer', 'car']; for(var i = kinds.length - 1; i > 0; i--){ var j = ri(0, i), tmp = kinds[i]; kinds[i] = kinds[j]; kinds[j] = tmp; }
      for(var r = 7; r <= 11; r++){ var kind = kinds[r - 7], sp = kind === 'race' ? rnd(170, 210) : kind === 'truck' ? rnd(100, 130) : kind === 'dozer' ? rnd(65, 85) : rnd(85, 125); out.push({ row:r, dir:dir, sp:sp*k, len:kind === 'truck' ? 2 : 1, gap:Math.max(76, (kind === 'race' ? rnd(240, 300) : rnd(120, 200)) - (level - 1)*12), kind:kind }); dir = -dir; }
      return out; }
    var LANES = genLanes(1), theme = THEMES[0];
    var sfx = window.TIG_SFX, snd = { hop:function(){ sfx.tone('square', 520, 780, .07, .12); }, splash:function(){ sfx.noise(.35, 700, .5, 1); sfx.tone('sine', 300, 80, .3, .2); }, squash:function(){ sfx.noise(.18, 260, .7, 1); sfx.tone('sawtooth', 160, 40, .22, .25); }, croc:function(){ sfx.noise(.12, 400, .6, 1); sfx.tone('sawtooth', 200, 60, .3, .25); }, time:function(){ sfx.tone('sawtooth', 220, 60, .5, .2); }, home:function(){ [523, 659, 784].forEach(function(f, i){ sfx.tone('triangle', f, f, .14, .18, i*.08); }); }, level:function(){ [523, 659, 784, 1046, 784, 1046].forEach(function(f, i){ sfx.tone('triangle', f, f, .16, .2, i*.1); }); } };
    var lanes, frog, lives, level, score, time, TIME, t, over, bestRow, msg, msgT, banner, parts, deco, lifeLost, stars;
    var rowY = function(r){ return r * CS + CS / 2; };
    function buildLanes(){ LANES = genLanes(level); theme = themeOf(level); TIME = timeOf(level); lanes = LANES.map(function(L, i){ var w = L.len * CS, P = w + L.gap; return { row:L.row, dir:L.dir, sp:L.sp, w:w, P:P, len:L.len, kind:L.kind, off:rnd(0, P), n:Math.ceil((W + P) / P) + 1, phase:rnd(0, 6), idx:i }; });
      deco = []; for(var d = 0; d < 40; d++) deco.push({ x:rnd(0, W), y:rnd(0, PLAY), s:rnd(.5, 1.5), ph:rnd(0, 7), v:rnd(20, 60) }); }
    function newGame(){ lives = SET.lives; level = SET.start; score = 0; t = 0; over = false; msg = ''; msgT = 0; banner = 0; parts = []; lifeLost = 0; stars = 0; ghostT = 0; FC = FR_COL[SET.frog] || FR_COL.green; buildLanes(); spawn(); showBanner(); }
    g.reset = function(){ state = 'menu'; newGame(); menu.show(true); api.score(0); api.status('pick your crossing, then play'); };
    function start(){ state = 'play'; newGame(); menu.show(false); api.score(0); api.status(api.touch ? 'swipe or tap a side to hop  \u00b7  level '+level+'  \u00b7  '+theme.name : 'arrows hop  \u00b7  level '+level+'  \u00b7  '+theme.name); }
    g.inMenu = function(){ return state === 'menu'; };
    var sc = function(){ if(state === 'play') api.score(score); }, st = function(s){ if(state === 'play') api.status(s); }, play = function(f){ if(state === 'play') f(); };
    function showBanner(){ banner = state === 'play' ? 2.2 : 0; }
    function spawn(){ frog = { x:W / 2, row:12, hop:0, fx:0, fr:12, tx:W / 2, tr:12, dead:0, kind:'', face:'U', idle:0, tongue:0 }; time = TIME; bestRow = 12; }
    function objX(L, i){ return -L.P + L.off + i * L.P; }
    function diving(L){ return L.kind === 'turtle' && (level >= 3 || (level === 2 && L.idx === 1)); }
    function submerged(L){ return diving(L) && ((L.phase % 6) > 4.4); }
    function turtleAlpha(L){ if(!diving(L)) return 1; var p = L.phase % 6; if(p < 3.8) return 1; if(p < 4.4) return 1 - (p - 3.8) / .6; if(p < 5.6) return 0; return (p - 5.6) / .4; }
    function jawOpen(L){ return L.kind === 'croc' && ((L.phase % 4) < 1.7); }
    function inJaws(L, x){ if(!jawOpen(L)) return false; for(var i = 0; i < L.n; i++){ var ox = objX(L, i), hx = L.dir > 0 ? ox + L.w - CS*.75 : ox; if(x > hx - 4 && x < hx + CS*.75 + 4) return true; } return false; }
    function laneAt(row){ for(var i = 0; i < lanes.length; i++) if(lanes[i].row === row) return lanes[i]; return null; }
    function riding(L, x){ for(var i = 0; i < L.n; i++){ var ox = objX(L, i); if(x > ox - 4 && x < ox + L.w + 4) return true; } return false; }
    function hitCar(L, x){ for(var i = 0; i < L.n; i++){ var ox = objX(L, i); if(x + 13 > ox + 2 && x - 13 < ox + L.w - 2) return true; } return false; }
    function burst(x, y, n, col, sp, up){ for(var i = 0; i < n; i++){ var a = rnd(0, Math.PI*2), v = rnd(sp*.3, sp); parts.push({ x:x, y:y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - (up || 0), l:rnd(.4, .9), t:0, col:col, r:rnd(2, 4) }); } }
    function die(kind){ if(frog.dead || over) return; frog.dead = 1.1; frog.kind = kind; frog.hop = 0; play(snd[kind] || snd.squash); var fy = rowY(frog.row); if(kind === 'splash') burst(frog.x, fy, 14, 'rgba(190,225,255,.9)', 160, 120); else if(kind === 'squash' || kind === 'croc') burst(frog.x, fy, 10, '#9be29b', 120, 60); }
    function hop(d){
      if(over || frog.dead || frog.hop > 0) return;
      var tr = frog.row, tx = frog.x;
      if(d === 'U') tr--; else if(d === 'D') tr++; else if(d === 'L') tx -= CS; else if(d === 'R') tx += CS;
      if(tr < 0 || tr > 12 || tx < CS / 2 - 6 || tx > W - CS / 2 + 6) return;
      frog.fx = frog.x; frog.fr = frog.row; frog.tx = tx; frog.tr = tr; frog.hop = HOP; frog.face = d; frog.idle = 0; play(snd.hop);
    }
    g.key = function(k, down){ if(!down) return false; if(state === 'menu'){ if(k === ' ' || k === 'Enter'){ start(); return true; } return false; } var d = isDir(k); if(!d) return false; hop(d); return true; };
    g.pointer = function(type, x, y){ if(type !== 'tap' || over || state === 'menu') return;   /* a flick is a hop (the framework's swipe layer); a still tap hops toward the side of the frog it landed on */ var dx = x - frog.x, dy = y - rowY(frog.row); if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return; hop(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); };
    g.peek = function(){ return { frog:{ x:frog.x, row:frog.row, dead:frog.dead > 0, kind:frog.kind, face:frog.face }, lives:lives, level:level, time:time, timeMax:TIME, score:score, hopping:frog.hop > 0, over:over, layout:lanes.map(function(L){ return L.kind + L.dir + ':' + Math.round(L.sp); }).join(','), theme:theme.water, themeName:theme.name, night:!!theme.night, banner:+banner.toFixed(2), parts:parts.length, kinds:lanes.map(function(L){ return L.kind; }), state:state, menu:state === 'menu' && !menu.el.hidden, frogCol:FC, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, place:function(x, row){ frog.x = x; frog.row = row; frog.hop = 0; frog.dead = 0; }, time:function(n){ time = n; }, level:function(n){ level = n; buildLanes(); spawn(); showBanner(); api.status((api.touch ? 'swipe or tap a side to hop' : 'arrows hop') + '  \u00b7  level ' + level + '  \u00b7  ' + theme.name); }, lanes:function(){ return lanes.map(function(L){ return { row:L.row, kind:L.kind, w:L.w, dir:L.dir, xs:Array.apply(null, Array(L.n)).map(function(_, i){ return Math.round(objX(L, i)); }), jaws:jawOpen(L) }; }); }, themes:function(){ return THEMES.map(function(th){ return th.name; }); }, timeOf:timeOf };
    function land(){
      frog.x = frog.tx; frog.row = frog.tr;
      if(frog.row < bestRow){ bestRow = frog.row; score += 10; sc(); }
      if(frog.row === 0){
        var home = 50 + Math.ceil(time) * 2, lv = 500 * level; score += home + lv; sc(); play(snd.home); burst(frog.x, CS / 2, 26, '#ffd166', 200, 140); burst(frog.x, CS / 2, 16, FC, 160, 100);
        level++; lives = Math.min(5, lives + 1); buildLanes(); play(snd.level); showBanner(); if(state === 'play') flash('home  +' + home + '  \u00b7  level ' + (level - 1) + ' clear  +' + lv);
        st((api.touch ? 'swipe or tap a side to hop' : 'arrows hop') + '  \u00b7  level ' + level + '  \u00b7  ' + theme.name);
        spawn(); return;
      }
      var L = laneAt(frog.row);
      if(L && L.kind !== 'log' && L.kind !== 'turtle' && L.kind !== 'croc' && hitCar(L, frog.x)){ die('squash'); return; }
      if(L && (L.kind === 'log' || L.kind === 'turtle' || L.kind === 'croc') && (!riding(L, frog.x) || submerged(L))){ die('splash'); return; }
      if(L && inJaws(L, frog.x)){ die('croc'); return; }
    }
    function flash(s){ msg = s; msgT = 1.6; }
    /* the ghost frog: looks a hop ahead (where the lane will be when it lands, and half a second on) and only goes when the next row is clear; on a log drifting toward the
       edge it hops back toward the middle, in traffic it steps sideways or back rather than into a car, and now and then it simply waits, the way a person would */
    function shifted(L, dtA){ var o = { row:L.row, dir:L.dir, sp:L.sp, w:L.w, P:L.P, len:L.len, kind:L.kind, n:L.n, idx:L.idx, off:(L.off + L.dir * L.sp * dtA) % L.P, phase:L.phase + dtA }; if(o.off < 0) o.off += o.P; return o; }
    function isRide(L){ return L.kind === 'log' || L.kind === 'turtle' || L.kind === 'croc'; }
    function safeSpot(row, x, dtA){ if(row <= 0 || row === 6 || row >= 12) return true; var L = laneAt(row); if(!L) return true; var A = shifted(L, dtA), B = shifted(L, dtA + .4);
      if(isRide(L)){ var x2 = x + L.dir * L.sp * .4; return riding(A, x) && riding(B, x2) && !submerged(A) && !submerged(B) && turtleAlpha(B) > .6 && !inJaws(A, x) && !inJaws(B, x2) && x2 > CS * .5 && x2 < W - CS * .5; }
      return !hitCar(A, x) && !hitCar(shifted(L, dtA + .15), x) && !hitCar(shifted(L, dtA + .3), x); }
    function ghost(dt){ if(frog.dead || frog.hop > 0) return; ghostT -= dt; if(ghostT > 0) return; ghostT = rnd(.18, .32);
      var here = safeSpot(frog.row, frog.x, 0), up = safeSpot(frog.row - 1, frog.x, HOP), L = laneAt(frog.row), ride = L && isRide(L), edge = ride && (L.dir > 0 ? frog.x > W - CS * 2.5 : frog.x < CS * 2.5);
      if(up && !(edge && Math.random() < .5) && Math.random() > .12){ hop('U'); return; }
      var pref = ride ? (L.dir > 0 ? 'L' : 'R') : (frog.x < W / 2 ? 'R' : 'L'), side = null;
      if(safeSpot(frog.row, frog.x + (pref === 'R' ? CS : -CS), HOP) && (edge || !here || Math.random() < .3)) side = pref;
      else if(!here && safeSpot(frog.row, frog.x + (pref === 'R' ? -CS : CS), HOP)) side = pref === 'R' ? 'L' : 'R';
      if(side){ hop(side); return; }
      if(!here && !up){ if(frog.row < 12 && safeSpot(frog.row + 1, frog.x, HOP)) hop('D'); else hop('U'); } }
    g.update = function(dt){
      if(over) return; t += dt; if(state === 'menu') ghost(dt); msgT = Math.max(0, msgT - dt); banner = Math.max(0, banner - dt); lifeLost = Math.max(0, lifeLost - dt); frog.idle += dt; if(frog.tongue > 0) frog.tongue -= dt; else if(frog.idle > 2 && Math.random() < dt*.5) frog.tongue = .25;
      lanes.forEach(function(L){ L.off = (L.off + L.dir * L.sp * dt) % L.P; if(L.off < 0) L.off += L.P; L.phase += dt; });
      for(var p = parts.length - 1; p >= 0; p--){ var q = parts[p]; q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; q.vy += 420*dt; if(q.t > q.l) parts.splice(p, 1); }
      deco.forEach(function(d){ if(theme.deco === 'snow'){ d.y += d.v*dt*.6; d.x += Math.sin(t + d.ph)*dt*12; if(d.y > PLAY){ d.y = 0; d.x = rnd(0, W); } } });
      if(frog.dead){ frog.dead -= dt; if(frog.dead <= 0){ frog.dead = 0; if(state === 'play'){ lives--; lifeLost = .6; if(lives <= 0){ over = true; api.over('Out of frogs on level ' + level + ', ' + theme.name); return; } } spawn(); } return; }
      if(frog.hop > 0){ frog.hop -= dt; if(frog.hop <= 0){ frog.hop = 0; land(); } return; }
      time -= dt; if(time <= 0){ time = 0; die('time'); return; }
      var L = laneAt(frog.row);
      if(L){
        if(L.kind === 'log' || L.kind === 'turtle' || L.kind === 'croc'){ frog.x += L.dir * L.sp * dt; if(frog.x < 6 || frog.x > W - 6){ die('splash'); return; } if(submerged(L) || !riding(L, frog.x)){ die('splash'); return; } if(inJaws(L, frog.x)){ die('croc'); return; } }
        else if(hitCar(L, frog.x)){ die('squash'); return; }
      }
    };
    /* the frog: faces the way it last hopped, stretches along the hop, legs tuck at the top of it, breathes when it sits, flicks its tongue when bored */
    function frogAt(c, x, y, s, col, squash, face, k, breath, tongue){
      c.save(); c.translate(x, y); c.rotate({ U:0, R:Math.PI/2, D:Math.PI, L:-Math.PI/2 }[face || 'U'] || 0); if(squash) c.scale(1.35, .35); else { var st = k > 0 && k < 1 ? Math.sin(k*Math.PI) : 0; c.scale(s*(1 - st*.18 + (breath || 0)), s*(1 + st*.3 - (breath || 0))); }
      var leg = k > 0 && k < 1 ? Math.sin(k*Math.PI) : 0;
      c.fillStyle = col; [[-14, -6 - leg*4], [14, -6 - leg*4], [-15 - leg*4, 9 + leg*6], [15 + leg*4, 9 + leg*6]].forEach(function(p){ c.beginPath(); c.ellipse(p[0], p[1], 5, 3.5 + leg*2, leg*.6*(p[0] < 0 ? -1 : 1), 0, Math.PI * 2); c.fill(); });
      c.fillStyle = col; rr(c, -12, -10, 24, 20, 8); c.fill(); c.fillStyle = 'rgba(0,0,0,.12)'; rr(c, -7, -2, 14, 9, 5); c.fill();
      if(tongue > 0){ c.strokeStyle = '#ff5f7a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -10 - Math.sin(tongue/.25*Math.PI)*12); c.stroke(); }
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-6, -9, 3.2, 0, Math.PI * 2); c.arc(6, -9, 3.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(-6, -9, 1.5, 0, Math.PI * 2); c.arc(6, -9, 1.5, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    function drawDeco(c){ var d = theme.deco;
      if(d === 'flowers'){ deco.forEach(function(f, i){ if(i % 2) return; var x = f.x, y = (i % 4 ? 6 : 12) * CS + 8 + f.s*10; c.fillStyle = ['#ff8a00', '#ffd166', '#ff5f7a', '#f4f1ea'][i % 4]; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x, y, 1.2, 0, 7); c.fill(); }); }
      else if(d === 'sun'){ var sg = c.createRadialGradient(W*.8, CS*.5, 4, W*.8, CS*.5, 60); sg.addColorStop(0, 'rgba(255,190,80,.9)'); sg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, CS); c.fillStyle = 'rgba(255,140,60,.12)'; c.fillRect(0, CS, W, 5*CS); }
      else if(d === 'stars' || d === 'neon'){ deco.forEach(function(f, i){ if(f.y > 6.9*CS && f.y < 12*CS) return; var a = .3 + Math.sin(t*3 + f.ph)*.3; c.fillStyle = d === 'neon' ? 'rgba('+(i % 2 ? '255,60,200' : '60,220,255')+','+a+')' : 'rgba(255,255,255,'+a+')'; c.fillRect(f.x, f.y, 1.5*f.s, 1.5*f.s); }); if(d === 'neon'){ c.fillStyle = 'rgba(255,60,200,.55)'; c.fillRect(0, 7*CS - 2, W, 2); c.fillStyle = 'rgba(60,220,255,.55)'; c.fillRect(0, 12*CS, W, 2); } }
      else if(d === 'reeds'){ deco.forEach(function(f, i){ if(i % 3) return; var x = f.x, base = (i % 2 ? 6 : 12)*CS + CS; c.strokeStyle = '#4a7a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + Math.sin(t + f.ph)*4, base - 18, x + Math.sin(t + f.ph)*7, base - 30*f.s); c.stroke(); }); c.fillStyle = 'rgba(120,200,80,.08)'; c.fillRect(0, CS, W, 5*CS); }
      else if(d === 'snow'){ deco.forEach(function(f){ c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(f.x, f.y, 1.4*f.s, 0, 7); c.fill(); }); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; for(var i = 0; i < 6; i++){ c.beginPath(); c.moveTo(i*80 + 10, CS + 10); c.lineTo(i*80 + 50, CS*3 + 20); c.lineTo(i*80 + 30, CS*5.6); c.stroke(); } }
      else if(d === 'cactus'){ deco.forEach(function(f, i){ if(i % 4) return; var x = f.x, base = (i % 2 ? 6 : 12)*CS + CS - 4; c.fillStyle = '#3a7a3a'; rr(c, x - 4, base - 26*f.s, 8, 26*f.s, 4); c.fill(); rr(c, x - 12, base - 18*f.s, 8, 6, 3); c.fill(); rr(c, x + 4, base - 14*f.s, 8, 6, 3); c.fill(); }); c.fillStyle = 'rgba(255,200,120,'+(.05 + Math.sin(t*2)*.03)+')'; c.fillRect(0, 7*CS, W, 5*CS); } }
    g.draw = function(c){
      c.fillStyle = theme.night ? '#05060f' : '#0b0d1c'; c.fillRect(0, 0, W, H);
      /* home bank: the whole far shore is home, so it glows along its waterline and wears a row of lily pads */
      c.fillStyle = theme.bank; c.fillRect(0, 0, W, CS);
      HOMES.forEach(function(hc, i){ var bx = hc * CS + CS / 2; c.fillStyle = 'rgba(61,220,132,'+(.35 + Math.sin(t*3 + i)*.12)+')'; c.beginPath(); c.arc(bx, CS * .55, 11, 0, 7); c.fill(); c.fillStyle = theme.bank; c.beginPath(); c.moveTo(bx, CS * .55); c.lineTo(bx + 11, CS * .4); c.lineTo(bx + 11, CS * .7); c.closePath(); c.fill(); });
      c.fillStyle = 'rgba(61,220,132,'+(.3 + Math.sin(t*4)*.15)+')'; c.fillRect(0, CS - 3, W, 3);
      /* river */
      c.fillStyle = theme.water; c.fillRect(0, CS, W, 5 * CS);
      c.strokeStyle = theme.ice ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; c.lineWidth = 2; for(var r = 1; r <= 5; r++){ c.beginPath(); for(var x = 0; x <= W; x += 20){ var yy = rowY(r) + (theme.ice ? 0 : Math.sin((x + t * 60 * (r % 2 ? 1 : -1)) / 30) * 3); x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
      if(!theme.ice) for(var sp = 0; sp < 8; sp++){ var sx = (sp*61 + t*25) % W, sy = CS + ((sp*37) % (5*CS)); c.fillStyle = 'rgba(255,255,255,'+(.15 + Math.sin(t*5 + sp)*.15)+')'; c.fillRect(sx, sy, 3, 1.5); }
      /* median and start */
      c.fillStyle = theme.side; c.fillRect(0, 6 * CS, W, CS); c.fillRect(0, 12 * CS, W, CS);
      c.fillStyle = 'rgba(255,255,255,.08)'; for(var k = 0; k < COLS; k += 2){ c.fillRect(k * CS, 6 * CS, CS, CS); c.fillRect((k + 1) * CS, 12 * CS, CS, CS); }
      /* road */
      c.fillStyle = theme.road; c.fillRect(0, 7 * CS, W, 5 * CS);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.setLineDash([16, 14]); for(var rr2 = 8; rr2 <= 11; rr2++){ c.beginPath(); c.moveTo(0, rr2 * CS); c.lineTo(W, rr2 * CS); c.stroke(); } c.setLineDash([]);
      drawDeco(c);
      lanes.forEach(function(L){
        var y = rowY(L.row), a = turtleAlpha(L);
        for(var i = 0; i < L.n; i++){
          var ox = objX(L, i); if(ox + L.w < -10 || ox > W + 10) continue;
          if(L.kind === 'log'){ var bob = Math.sin(t*2 + i + L.phase)*1.5; c.fillStyle = theme.log; rr(c, ox, y - 13 + bob, L.w, 26, 12); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, ox + 8, y - 4 + bob, L.w - 16, 4, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, ox + 6, y - 10 + bob, L.w - 12, 3, 2); c.fill(); }
          else if(L.kind === 'croc'){ var open = jawOpen(L), hx = L.dir > 0 ? ox + L.w - CS*.75 : ox; c.fillStyle = '#3a6a2a'; rr(c, ox, y - 12, L.w, 24, 10); c.fill(); c.fillStyle = '#2a5a1a'; for(var sc = 0; sc < L.len*2; sc++){ c.beginPath(); c.arc(ox + 10 + sc*18, y - 8, 4, 0, 7); c.fill(); } c.fillStyle = open ? '#ff8a8a' : '#3a6a2a'; if(open){ c.beginPath(); if(L.dir > 0){ c.moveTo(hx, y - 10); c.lineTo(hx + CS*.75 + 4, y - 16); c.lineTo(hx + CS*.75, y + 10); c.lineTo(hx, y + 10); } else { c.moveTo(hx + CS*.75, y - 10); c.lineTo(hx - 4, y - 16); c.lineTo(hx, y + 10); c.lineTo(hx + CS*.75, y + 10); } c.closePath(); c.fill(); c.fillStyle = '#fff'; for(var th = 0; th < 4; th++){ var tx = hx + 6 + th*7; c.beginPath(); c.moveTo(tx, y - 6); c.lineTo(tx + 3, y); c.lineTo(tx + 6, y - 6); c.fill(); } } c.fillStyle = '#ffd166'; c.beginPath(); c.arc(hx + (L.dir > 0 ? 6 : CS*.75 - 6), y - 8, 2.5, 0, 7); c.fill(); }
          else if(L.kind === 'turtle'){ c.globalAlpha = a; for(var s = 0; s < L.len; s++){ var cx = ox + s * CS + CS / 2, blink = Math.sin(t*3 + s + L.phase*2) > .95; c.fillStyle = '#2f9e5b'; c.beginPath(); c.arc(cx, y, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1d6a3c'; c.beginPath(); c.arc(cx, y, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2f9e5b'; c.beginPath(); c.arc(cx + L.dir * 16, y, 5, 0, Math.PI * 2); c.fill(); if(!blink){ c.fillStyle = '#111'; c.fillRect(cx + L.dir*18 - 1, y - 2, 2, 2); } } c.globalAlpha = 1; }
          else {
            var col = { truck:'#c8c8d0', race:'#ff3b3b', car:'#ffd166', dozer:'#63e6be' }[L.kind], hx2 = L.dir > 0 ? ox + L.w - 4 : ox + 4;
            if(theme.night){ var bg2 = c.createLinearGradient(hx2, 0, hx2 + L.dir*70, 0); bg2.addColorStop(0, 'rgba(255,240,180,.35)'); bg2.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = bg2; c.beginPath(); c.moveTo(hx2, y - 10); c.lineTo(hx2 + L.dir*70, y - 22); c.lineTo(hx2 + L.dir*70, y + 22); c.lineTo(hx2, y + 10); c.closePath(); c.fill(); }
            c.fillStyle = col; rr(c, ox + 2, y - 13, L.w - 4, 26, 6); c.fill();
            c.fillStyle = 'rgba(0,0,0,.35)'; if(L.kind === 'truck'){ rr(c, ox + (L.dir > 0 ? L.w - 26 : 4), y - 11, 22, 22, 4); c.fill(); } else { rr(c, ox + 10, y - 9, L.w - 20, 8, 3); c.fill(); }
            c.fillStyle = '#222'; c.fillRect(ox + 6, y - 15, 8, 4); c.fillRect(ox + L.w - 14, y - 15, 8, 4); c.fillRect(ox + 6, y + 11, 8, 4); c.fillRect(ox + L.w - 14, y + 11, 8, 4);
            c.fillStyle = theme.night ? '#fff7d0' : '#fff'; c.fillRect(hx2 - 2, y - 11, 3, 5); c.fillRect(hx2 - 2, y + 6, 3, 5);
            if(L.kind === 'race'){ var ex = L.dir > 0 ? ox : ox + L.w; c.fillStyle = 'rgba(255,140,40,'+(.4 + Math.sin(t*40 + i)*.3)+')'; c.beginPath(); c.arc(ex, y + 4, 4, 0, 7); c.fill(); }
          }
        }
      });
      /* frog */
      if(frog.dead){
        var fy = rowY(frog.row), k2 = frog.kind, dk = 1 - Math.max(0, frog.dead)/1.1;
        if(k2 === 'splash'){ for(var rg = 0; rg < 3; rg++){ var rk = Math.max(0, dk - rg*.15); c.strokeStyle = 'rgba(180,220,255,' + Math.max(0, 1 - rk*1.3) + ')'; c.lineWidth = 3 - rg; c.beginPath(); c.arc(frog.x, fy, 6 + rk * 34, 0, Math.PI * 2); c.stroke(); } }
        else if(k2 === 'squash' || k2 === 'croc'){ frogAt(c, frog.x, fy, 1, FC, true, frog.face); for(var st2 = 0; st2 < 4; st2++){ var an = t*5 + st2*Math.PI/2; text(c, '\u2726', frog.x + Math.cos(an)*22, fy - 8 + Math.sin(an)*8, 12, '#ffd166', 'center', 800); } if(k2 === 'croc') text(c, 'chomp', frog.x, fy - 26, 12, '#ff6b6b', 'center', 800); }
        else { c.globalAlpha = Math.max(0, frog.dead); c.save(); c.translate(Math.sin(t*50)*2, 0); frogAt(c, frog.x, fy, 1, '#9aa', false, frog.face); c.restore(); c.globalAlpha = 1; if(Math.sin(t*14) > 0) text(c, 'time!', frog.x, fy - 26, 12, '#ff6b6b', 'center', 800); }
      } else {
        var p = frog.hop > 0 ? 1 - frog.hop / HOP : 1, fx = frog.fx + (frog.tx - frog.fx) * p, fyy = rowY(frog.fr) + (rowY(frog.tr) - rowY(frog.fr)) * p, lift = frog.hop > 0 ? Math.sin(p * Math.PI) * .35 : 0;
        if(frog.hop <= 0){ fx = frog.x; fyy = rowY(frog.row); }
        if(frog.hop > 0){ c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(fx, fyy + 12, 12*(1 - lift), 5*(1 - lift), 0, 0, 7); c.fill(); }
        frogAt(c, fx, fyy - lift*14, 1 + lift*.4, FC, false, frog.face, frog.hop > 0 ? p : 0, frog.hop > 0 ? 0 : Math.sin(t*3)*.02, frog.tongue);
      }
      for(var pp = 0; pp < parts.length; pp++){ var q = parts[pp]; c.globalAlpha = Math.max(0, 1 - q.t/q.l); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); } c.globalAlpha = 1;
      /* hud */
      c.fillStyle = '#07070b'; c.fillRect(0, PLAY, W, H - PLAY);
      for(var l = 0; l < lives; l++) frogAt(c, 18 + l * 26, PLAY + 20, .55, FC, false, 'U', 0, Math.sin(t*3 + l)*.03); if(lifeLost > 0){ c.globalAlpha = lifeLost/.6; frogAt(c, 18 + lives * 26, PLAY + 20 - (1 - lifeLost/.6)*22, .55*(1 + (1 - lifeLost/.6)*.6), '#9aa', false, 'U'); c.globalAlpha = 1; }
      text(c, 'level ' + level + '  \u00b7  ' + theme.name, W / 2 - 14, PLAY + 20, 12, 'rgba(255,255,255,.7)', 'center', 700);
      var tw = 96, tf = time / TIME; c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, W - tw - 12, PLAY + 14, tw, 12, 4); c.fill(); c.fillStyle = tf < .25 ? (Math.sin(t*12) > 0 ? '#ff3b3b' : '#ff8a8a') : '#3ddc84'; if(tf > 0){ rr(c, W - tw - 12, PLAY + 14, tw * tf, 12, 4); c.fill(); }
      if(msgT > 0) text(c, msg, W / 2, 6.5 * CS, 13, '#ffd166', 'center', 800);
      /* the level card slides in from the top and out again */
      if(banner > 0){ var bk = banner > 1.8 ? (2.2 - banner)/.4 : banner < .4 ? banner/.4 : 1, by = 3.5*CS - (1 - bk)*60; c.globalAlpha = bk; c.fillStyle = 'rgba(7,7,11,.85)'; rr(c, W/2 - 140, by - 30, 280, 60, 14); c.fill(); text(c, 'level ' + level, W/2, by - 10, 18, '#ffd166', 'center', 800); text(c, theme.name, W/2, by + 12, 12, 'rgba(255,255,255,.75)', 'center', 700); c.globalAlpha = 1; }
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }
/* tigOS arcade games.js, part 13: invaders. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Invaders. Opens on its own menu (starting wave, ships, march speed, bunkers, ship colour; kept under tigos.invaders) while a ghost gunner behind the
     card holds the line on its own: it slides under the lowest alien of the nearest column, fires when lined up, sidesteps bombs, and a fresh formation drops in when it
     wins or loses. Space, Enter or Play starts the real game. ---------- */
  var IV_SHIP = { green:'#3ddc84', cyan:'#5ad1ff', yellow:'#ffd166', pink:'#ff6bd6', white:'#f4f1ea' };
  function invaders(api){
    var W = api.W, H = api.H, g = {}, COLS = 11, ROWS = 5, GX = 36, GY = 30, AW = 26, AH = 18, SHIPY = H - 70, GROUND = H - 34, state = 'menu', ghostT = 0, SC = IV_SHIP.green;
    var MARCH = { slow:1.35, classic:1, fast:.75 };
    var menu = gameMenu(api, { id:'invaders', title:'Invaders', sub:'Set up the defence', color:'#b8ff5c',
      rows:[['wave', 'Start wave'], ['lives', 'Ships'], ['march', 'March'], ['bunkers', 'Bunkers'], ['ship', 'Ship']],
      opt:{ wave:[1, 3, 5], lives:[1, 3, 5], march:['slow', 'classic', 'fast'], bunkers:['on', 'off'], ship:Object.keys(IV_SHIP) }, def:{ wave:1, lives:3, march:'classic', bunkers:'on', ship:'green' },
      label:{ march:{ slow:'Slow', classic:'Classic', fast:'Fast' }, bunkers:{ on:'Four', off:'None' } },
      help:{ wave:'Which wave to start on. Later waves start lower, march quicker and bomb more.', lives:'Ships in reserve. The game ends when the last one goes.', march:'How fast the formation steps. It always speeds up as it thins out.', bunkers:'Four shields to hide under, or an open field.', ship:'The colour of your ship.' },
      swatch:{ ship:IV_SHIP },
      foot:api.touch ? 'drag to steer, tap to fire' : 'left/right move, space fires  \u00b7  space plays', onChange:function(){ if(state === 'menu') newGame(); }, onPlay:function(){ start(); } });
    var SET = menu.SET;
    var ship, shot, aliens, ox, oy, dir, stepT, bombs, bombT, bunkers, ufo, ufoT, lives, wave, score, over, t, held, frame, dying, targetX, bursts, stars;
    var value = function(r){ return r === 0 ? 30 : r < 3 ? 20 : 10; };
    var alive = function(){ return aliens.filter(function(a){ return a.on; }); };
    function newGame(){ lives = SET.lives; wave = SET.wave; score = 0; over = false; t = 0; held = {}; targetX = null; bursts = []; stars = []; ghostT = 0; SC = IV_SHIP[SET.ship] || IV_SHIP.green; for(var i = 0; i < 60; i++) stars.push({ x:rnd(0, W), y:rnd(0, GROUND), r:rnd(.4, 1.4) }); ship = { x:W / 2 }; dying = 0; formation(); buildBunkers(); }
    g.reset = function(){ state = 'menu'; newGame(); menu.show(true); api.score(0); api.status('set up the defence, then play'); };
    function start(){ state = 'play'; newGame(); menu.show(false); api.score(0); api.status((api.touch ? 'drag to steer, tap to fire' : 'left/right move, space fires') + '  ·  wave ' + wave); }
    g.inMenu = function(){ return state === 'menu'; };
    var sc = function(){ if(state === 'play') api.score(score); };
    function formation(){ aliens = []; for(var r = 0; r < ROWS; r++) for(var c = 0; c < COLS; c++) aliens.push({ c:c, r:r, on:true }); ox = (W - (COLS - 1) * GX) / 2; oy = Math.min(200, 92 + (wave - 1) * 16); dir = 1; stepT = 0; bombs = []; bombT = 1.2; ufo = null; ufoT = rnd(14, 22); shot = null; frame = 0; }
    function buildBunkers(){ bunkers = []; if(SET.bunkers === 'off') return; var shape = ['.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXX..XXX', 'XX....XX']; for(var b = 0; b < 4; b++){ var bx = W * (b + 1) / 5 - 24, by = SHIPY - 62; shape.forEach(function(row, j){ for(var i = 0; i < row.length; i++) if(row[i] === 'X') bunkers.push({ x:bx + i * 6, y:by + j * 6, on:true }); }); } }
    var ax = function(a){ return ox + a.c * GX; }, ay = function(a){ return oy + a.r * GY; };
    function stepEvery(){ var n = alive().length; return clamp(.03 + .62 * (n / 55), .05, .65) / (1 + (wave - 1) * .12) * (MARCH[SET.march] || 1); }
    function fire(){ if(over || dying || shot) return; shot = { x:ship.x, y:SHIPY - 16 }; }
    function boom(x, y, col, n){ for(var i = 0; i < (n || 10); i++) bursts.push({ x:x, y:y, vx:rnd(-90, 90), vy:rnd(-90, 90), life:rnd(.25, .5), col:col }); }
    function hitBunker(x, y, rad){ var hit = false; bunkers.forEach(function(b){ if(b.on && Math.abs(b.x + 3 - x) < rad && Math.abs(b.y + 3 - y) < rad){ b.on = false; hit = true; } }); return hit; }
    function loseLife(){ if(dying || over) return; dying = 1.1; boom(ship.x, SHIPY, SC, 24); bombs = []; }
    g.key = function(k, down){ if(state === 'menu'){ if(down && (k === ' ' || k === 'Enter')){ start(); return true; } return false; } var d = isDir(k); if(d === 'L' || d === 'R'){ held[d] = down; targetX = null; return true; } if(k === ' ' || d === 'U'){ if(down) fire(); return true; } return false; };
    g.pointer = function(type, x){ if(over || state === 'menu') return; if(type === 'down'){ targetX = x; fire(); } else if(type === 'move') targetX = x; };
    g.peek = function(){ return { ship:ship.x, aliens:alive().length, wave:wave, lives:lives, bombs:bombs.length, shot:!!shot, ufo:!!ufo, score:score, oy:oy, dir:dir, over:over, bunkers:bunkers.filter(function(b){ return b.on; }).length, state:state, menu:state === 'menu' && !menu.el.hidden, shipCol:SC, opts:JSON.parse(JSON.stringify(SET)) }; };
    g.dbg = { set:function(k, v){ menu.set(k, v); return JSON.parse(JSON.stringify(SET)); }, start:function(){ if(state === 'menu') start(); }, menu:function(){ g.reset(); }, defaults:function(){ menu.reset(); return JSON.parse(JSON.stringify(SET)); }, clear:function(){ aliens.forEach(function(a){ a.on = false; }); }, drop:function(y){ oy = y; }, kill:function(){ loseLife(); } };
    /* the ghost gunner: a bomb about to land on it is sidestepped first; otherwise it slides under the lowest alien of the nearest column (a touch ahead of the march) and
       fires once it is lined up and no bunker is in the way, with a pot shot at the saucer when one crosses overhead */
    function bunkerAbove(x){ return bunkers.some(function(b){ return b.on && Math.abs(b.x + 3 - x) < 7; }); }
    function ghost(dt){ if(dying) return; ghostT -= dt; if(ghostT > 0) return; ghostT = rnd(.1, .22); var live = alive(); if(!live.length) return;
      var threat = null; bombs.forEach(function(b){ if(Math.abs(b.x - ship.x) < 28 && b.y > SHIPY - 170 && b.y < SHIPY + 4) threat = b; });
      if(threat){ targetX = clamp(ship.x + (threat.x >= ship.x ? -64 : 64), 20, W - 20); return; }
      var cols = {}; live.forEach(function(a){ if(!cols[a.c] || cols[a.c].r < a.r) cols[a.c] = a; }); var pick = null, pd = 1e9; Object.keys(cols).forEach(function(c){ var a = cols[c], d = Math.abs(ax(a) - ship.x); if(d < pd){ pd = d; pick = a; } });
      var aim = clamp(ax(pick) + dir * 5, 20, W - 20); targetX = aim;
      if(!shot && ufo && Math.abs(ufo.x + ufo.v * .35 - ship.x) < 6){ fire(); return; }
      if(!shot && Math.abs(ship.x - aim) < 9 && !bunkerAbove(ship.x) && Math.random() > .15) fire(); }
    g.update = function(dt){
      if(over) return; t += dt; if(state === 'menu') ghost(dt);
      bursts.forEach(function(p){ p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); bursts = bursts.filter(function(p){ return p.life > 0; });
      if(dying){ dying -= dt; if(dying <= 0){ dying = 0; if(state === 'play'){ lives--; if(lives <= 0){ over = true; api.over('The invaders landed on wave ' + wave); return; } } ship.x = W / 2; } return; }
      if(held.L) ship.x -= 260 * dt; if(held.R) ship.x += 260 * dt;
      if(targetX !== null){ var dx = targetX - ship.x; ship.x += clamp(dx, -320 * dt, 320 * dt); }
      ship.x = clamp(ship.x, 20, W - 20);
      /* formation march */
      stepT -= dt; if(stepT <= 0){ stepT = stepEvery(); frame ^= 1; var live = alive(), minx = 1e9, maxx = -1e9; live.forEach(function(a){ minx = Math.min(minx, ax(a)); maxx = Math.max(maxx, ax(a)); });
        if((dir > 0 && maxx + 10 + AW / 2 >= W - 8) || (dir < 0 && minx - 10 - AW / 2 <= 8)){ dir = -dir; oy += 14; } else ox += 10 * dir; }
      var lowest = 0; alive().forEach(function(a){ lowest = Math.max(lowest, ay(a)); if(Math.abs(ax(a) - ship.x) < AW / 2 + 12 && Math.abs(ay(a) - SHIPY) < AH / 2 + 10) loseLife(); });
      if(lowest + AH / 2 >= SHIPY + 8){ if(state === 'menu'){ formation(); buildBunkers(); return; } over = true; api.over('The invaders landed on wave ' + wave); return; }
      alive().forEach(function(a){ bunkers.forEach(function(b){ if(b.on && Math.abs(b.x + 3 - ax(a)) < AW / 2 + 3 && Math.abs(b.y + 3 - ay(a)) < AH / 2 + 3) b.on = false; }); });
      /* player shot */
      if(shot){ shot.y -= 520 * dt; if(shot.y < 20) shot = null; }
      if(shot){ var live2 = alive(), hit = null; for(var i = 0; i < live2.length; i++){ var a = live2[i]; if(Math.abs(ax(a) - shot.x) < AW / 2 && Math.abs(ay(a) - shot.y) < AH / 2 + 4){ hit = a; break; } }
        if(hit){ hit.on = false; score += value(hit.r); sc(); boom(ax(hit), ay(hit), hit.r === 0 ? '#ff6bd6' : hit.r < 3 ? '#5ad1ff' : '#b8ff5c'); shot = null; }
        else if(ufo && Math.abs(ufo.x - shot.x) < 24 && Math.abs(ufo.y - shot.y) < 12){ var v = [50, 100, 150, 300][ri(0, 3)]; score += v; sc(); boom(ufo.x, ufo.y, '#ff3b3b', 18); bursts.push({ x:ufo.x, y:ufo.y - 14, vx:0, vy:-20, life:.9, col:'#ffd166', txt:'+' + v }); ufo = null; shot = null; }
        else if(hitBunker(shot.x, shot.y, 5)) shot = null; }
      if(shot){ for(var j = bombs.length - 1; j >= 0; j--){ if(Math.abs(bombs[j].x - shot.x) < 5 && Math.abs(bombs[j].y - shot.y) < 8){ boom(shot.x, shot.y, '#fff', 6); bombs.splice(j, 1); shot = null; break; } } }
      /* bombs */
      bombT -= dt; if(bombT <= 0 && bombs.length < 3 && alive().length){ bombT = clamp(1.1 - wave * .08, .35, 1.1) * rnd(.6, 1.3); var cols = {}; alive().forEach(function(a){ if(!cols[a.c] || cols[a.c].r < a.r) cols[a.c] = a; }); var keys = Object.keys(cols), src = cols[keys[ri(0, keys.length - 1)]]; bombs.push({ x:ax(src), y:ay(src) + AH / 2, v:170 + wave * 18 }); }
      for(var k = bombs.length - 1; k >= 0; k--){ var b = bombs[k]; b.y += b.v * dt;
        if(b.y > GROUND){ bombs.splice(k, 1); continue; }
        if(hitBunker(b.x, b.y, 7)){ bombs.splice(k, 1); continue; }
        if(Math.abs(b.x - ship.x) < 16 && b.y > SHIPY - 10 && b.y < SHIPY + 10){ bombs.splice(k, 1); loseLife(); break; } }
      /* ufo */
      if(!ufo){ ufoT -= dt; if(ufoT <= 0 && alive().length >= 8){ var fromLeft = Math.random() < .5; ufo = { x:fromLeft ? -30 : W + 30, y:62, v:(fromLeft ? 1 : -1) * 130 }; ufoT = rnd(16, 26); } }
      else { ufo.x += ufo.v * dt; if(ufo.x < -40 || ufo.x > W + 40) ufo = null; }
      /* wave clear */
      if(!alive().length){ if(state === 'menu'){ formation(); buildBunkers(); return; } wave++; score += 100; sc(); formation(); buildBunkers(); bursts.push({ x:W / 2, y:H / 2, vx:0, vy:0, life:1.6, col:'#ffd166', txt:'wave ' + wave }); api.status((api.touch ? 'drag to steer, tap to fire' : 'left/right move, space fires') + '  ·  wave ' + wave); }
    };
    function drawAlien(c, x, y, r, f){
      var col = r === 0 ? '#ff6bd6' : r < 3 ? '#5ad1ff' : '#b8ff5c'; c.fillStyle = col;
      if(r === 0){ rr(c, x - 8, y - 9, 16, 12, 5); c.fill(); c.fillRect(x - 12, y - 3, 24, 6); c.fillRect(x - 10, y + 3, 4, 5); c.fillRect(x + 6, y + 3, 4, 5); if(f){ c.fillRect(x - 5, y + 3, 3, 5); c.fillRect(x + 2, y + 3, 3, 5); } else { c.fillRect(x - 13, y + 5, 4, 3); c.fillRect(x + 9, y + 5, 4, 3); } }
      else if(r < 3){ rr(c, x - 9, y - 7, 18, 12, 3); c.fill(); c.fillRect(x - 13, y - 4, 4, 8); c.fillRect(x + 9, y - 4, 4, 8); c.fillRect(x - 11, y - 9, 3, 3); c.fillRect(x + 8, y - 9, 3, 3); if(f){ c.fillRect(x - 8, y + 5, 4, 4); c.fillRect(x + 4, y + 5, 4, 4); } else { c.fillRect(x - 13, y + 5, 4, 4); c.fillRect(x + 9, y + 5, 4, 4); } }
      else { rr(c, x - 12, y - 8, 24, 12, 4); c.fill(); for(var i = 0; i < 4; i++) c.fillRect(x - 11 + i * 6 + (f ? 1 : 0), y + 4, 3, 5); }
      c.fillStyle = '#07070b'; c.fillRect(x - 5, y - 4, 3, 3); c.fillRect(x + 2, y - 4, 3, 3);
    }
    g.draw = function(c){
      bg(c, W, H, '#05060f', '#0b0d1c');
      c.fillStyle = 'rgba(255,255,255,.55)'; stars.forEach(function(s){ c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill(); });
      if(ufo){ c.fillStyle = '#ff3b3b'; c.beginPath(); c.ellipse(ufo.x, ufo.y, 22, 8, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.ellipse(ufo.x, ufo.y - 5, 10, 6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#07070b'; for(var u = -1; u <= 1; u++) c.fillRect(ufo.x + u * 10 - 2, ufo.y + 1, 4, 3); }
      aliens.forEach(function(a){ if(a.on) drawAlien(c, ax(a), ay(a), a.r, frame); });
      c.fillStyle = '#3ddc84'; bunkers.forEach(function(b){ if(b.on) c.fillRect(b.x, b.y, 6, 6); });
      bombs.forEach(function(b){ c.strokeStyle = '#ffd166'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x - 3, b.y - 8); c.lineTo(b.x + 3, b.y - 3); c.lineTo(b.x - 3, b.y + 3); c.lineTo(b.x + 3, b.y + 8); c.stroke(); });
      if(shot){ c.fillStyle = '#fff'; c.fillRect(shot.x - 1.5, shot.y - 8, 3, 14); }
      if(!dying){ c.fillStyle = SC; c.beginPath(); c.moveTo(ship.x - 18, SHIPY + 8); c.lineTo(ship.x - 18, SHIPY - 2); c.lineTo(ship.x - 6, SHIPY - 6); c.lineTo(ship.x - 3, SHIPY - 14); c.lineTo(ship.x + 3, SHIPY - 14); c.lineTo(ship.x + 6, SHIPY - 6); c.lineTo(ship.x + 18, SHIPY - 2); c.lineTo(ship.x + 18, SHIPY + 8); c.closePath(); c.fill(); }
      bursts.forEach(function(p){ c.globalAlpha = clamp(p.life * 2.5, 0, 1); if(p.txt) text(c, p.txt, p.x, p.y, p.txt.indexOf('wave') === 0 ? 22 : 13, p.col, 'center', 800); else { c.fillStyle = p.col; c.fillRect(p.x - 2, p.y - 2, 4, 4); } }); c.globalAlpha = 1;
      c.fillStyle = '#3ddc84'; c.fillRect(0, GROUND, W, 2);
      for(var l = 0; l < lives - 1; l++){ c.fillStyle = SC; rr(c, 12 + l * 30, GROUND + 12, 22, 9, 3); c.fill(); }
      text(c, 'wave ' + wave, W - 12, GROUND + 17, 12, 'rgba(255,255,255,.7)', 'right', 700);
      text(c, alive().length + ' left', W / 2, GROUND + 17, 12, 'rgba(255,255,255,.5)', 'center', 600);
    };
    g.destroy = function(){ menu.destroy(); };
    return g;
  }

  var I = function(p){ return '<svg viewBox="0 0 24 24">'+p+'</svg>'; };
  return [
    { id:'snake', tkeys:'Swipe to steer',   name:'Serpent', blurb:'Eat, grow, do not bite the wall. Gets faster the longer you get.', keys:'Arrows or WASD steer, space plays', W:480, H:480, pad:'swipe', menu:true, color:'#28c840', make:snake, icon:I('<path d="M4 16c0-3 2-4 5-4s5 1 5-2-2-3-5-3M14 10h3a3 3 0 0 1 0 6h-2"/><circle cx="17" cy="14" r="1" fill="currentColor"/>') },
    { id:'bricks', tkeys:'Drag anywhere to move the paddle, tap to launch',  name:'Bricks', blurb:'Classic brick breaker. Angle the ball off the paddle, clear every level.', keys:'Arrows or mouse move, space launches (and plays)', W:640, H:480, pad:'drag', menu:true, color:'#ff8a00', make:bricks, icon:I('<rect x="3" y="4" width="5" height="3"/><rect x="9.5" y="4" width="5" height="3"/><rect x="16" y="4" width="5" height="3"/><rect x="6" y="8.5" width="5" height="3"/><rect x="13" y="8.5" width="5" height="3"/><circle cx="12" cy="15.5" r="1.4"/><path d="M8 20h8"/>') },
    { id:'stacker', tkeys:'Drag sideways to move, tap rotates, swipe down drops, swipe up holds', name:'Stacker', blurb:'Seven falling shapes, ghost piece, hold slot, hard drop. Ten lines a level.', keys:'Arrows move, up rotates, space drops, c holds (space plays)', W:460, H:540, pad:'swipe', menu:true, gest:{ D:' ', U:'c', tap:'ArrowUp', rep:30, once:'UD' }, color:'#a78bfa', make:stacker, icon:I('<rect x="9.5" y="3" width="5" height="5"/><rect x="4.5" y="8" width="5" height="5"/><rect x="9.5" y="8" width="5" height="5"/><rect x="14.5" y="8" width="5" height="5"/><path d="M3 20h18"/>') },
    { id:'rocks', tkeys:'Hold a finger down for a joystick: sideways turns, up thrusts. Tap or a second finger fires',   name:'Rocks', blurb:'Vector asteroids with thrust, drift and screen wrap. Big rocks split into small ones.', keys:'Left/right turn, up thrusts, space fires (and plays)', W:640, H:480, pad:'stick', menu:true, gest:{ tap:' ' }, color:'#8cc7ff', make:rocks, icon:I('<path d="M12 4l4 8-4 8-4-8z"/><path d="M6 6l2 1M18 6l-2 1"/><circle cx="19" cy="17" r="2"/>') },
    { id:'2048', tkeys:'Swipe to slide',    name:'Tiles', blurb:'Slide and merge matching numbers. Reach 2048, then keep going.', keys:'Arrows or WASD slide, space plays', W:480, H:480, pad:'swipe', menu:true, color:'#ffd166', make:tiles, icon:I('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>') },
    { id:'flap', tkeys:'Tap to flap',    name:'Flap', blurb:'One button, endless pipes. Tap or press space to flap through the gaps.', keys:'Space or click flaps (space plays)', W:360, H:560, pad:'tap', menu:true, color:'#5aa9ff', make:flap, icon:I('<path d="M4 13c2-6 8-8 13-6 2 1 3 3 3 5-2 4-7 6-12 5"/><path d="M8 12l3 2"/><circle cx="15" cy="10" r=".8" fill="currentColor"/>') },
    { id:'mines', tkeys:'Tap digs, press and hold flags (twice for a yellow maybe), pinch zooms',   name:'Mines', blurb:'Thirty mines on level one, sixty on two, ninety on three, the board growing with them and filling the screen. One life, so every dig counts; the setup menu gives you three or five, plus board shapes, colours, blast radius, a clock and music (lo-fi plays unless you turn it off). Right click once for a flag, twice for a yellow maybe. First click is always safe, chord on numbers.', keys:'Click digs, right click flags (twice for a maybe), wheel zooms, or arrows + space + f', W:600, H:480, fluid:true, pad:'mines', menu:true, color:'#ff5f57', make:mines, icon:I('<circle cx="12" cy="13" r="6"/><path d="M12 4v3M5 13H2M22 13h-3M12 22v-3M6.5 7.5l2 2M17.5 7.5l-2 2"/>') },
    { id:'paddle', tkeys:'Drag to move your paddle',  name:'Paddle', blurb:'Table tennis against a cpu that gets sharper as you pull ahead. First to seven.', keys:'Up/down or mouse move, space plays', W:640, H:400, pad:'drag', menu:true, color:'#63e6be', make:paddle, icon:I('<rect x="3.5" y="7" width="2.5" height="10" rx="1"/><rect x="18" y="7" width="2.5" height="10" rx="1"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v3M12 18v3"/>') },
    { id:'hopper', premium:true, rank:6, tkeys:'Swipe to hop, or tap a side of the frog', name:'Hopper', blurb:'Five lanes of traffic, five lanes of river, one frog to reach the far bank each level, anywhere along it. Every level is a new place (meadow, sunset highway, night city, swamp, frozen lake, desert, neon strip) with faster traffic, tighter gaps, diving turtles and, later, crocodiles.', keys:'Arrows or WASD hop, space plays', W:440, H:560, pad:'swipe', menu:true, color:'#3ddc84', make:hopper, icon:I('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M3 13h18M3 17h18"/><circle cx="12" cy="11.5" r="2.2"/><circle cx="10.8" cy="10.6" r=".5" fill="currentColor"/><circle cx="13.2" cy="10.6" r=".5" fill="currentColor"/>') },
    { id:'invaders', tkeys:'Drag to steer, tap to fire', name:'Invaders', blurb:'Fifty five aliens march down the screen and speed up as they thin out. Four bunkers, one shot at a time, a mystery saucer worth up to 300.', keys:'Left/right move, space fires (and plays)', W:480, H:560, pad:'drag', menu:true, color:'#b8ff5c', make:invaders, icon:I('<path d="M7 6h10v3h3v6h-3v3h-2v-3H9v3H7v-3H4V9h3z"/><rect x="9" y="9" width="2" height="2" fill="currentColor"/><rect x="13" y="9" width="2" height="2" fill="currentColor"/><path d="M12 19v2"/>') },
    { id:'kong', premium:true, rank:3, tkeys:'Hold a finger down for a joystick: sideways walks, up and down climb. Tap or a second finger jumps', name:'Kong', blurb:'Climb six red girders while the ape hurls barrels. Jump them, hammer them, rescue the penguin at the top. This is for Greggy D!', keys:'Arrows move and climb, space jumps (and plays)', W:480, H:560, pad:'stick', gest:{ tap:' ' }, menu:true, color:'#e24b4b', make:kong, icon:I('<rect x="3" y="3" width="6" height="18" rx="1"/><path d="M3 8h6M3 13h6M3 18h6"/><ellipse cx="16" cy="14" rx="5" ry="6"/><path d="M11 12h10M11 16h10"/>') }
  ];
})();
/* tigOS arcade games.js, part 14: the premium games that ship as their own bundles. Only what the launcher, Spotlight and the terminal's
   `game` list need before the code is here lives in the stub: id, name, blurb, control hints, colour, pad kind, icon, and `src`, the TIG_ASSETS
   key of the bundle. The bundle calls TIG_REGISTER with the runtime half (make, W, H, lib, gl, menu, ownKeys, cards) when it lands. */
(function(){
  var L = window.TIG_GAMES; if(!L) return;
  L.push({ id:'nightshift', premium:true, rank:1, name:'Nightshift', src:'nightshift', color:'#ff3b3b', pad:'fps',
    tkeys:'Pad turns and walks, fire, use, reload, swap and jump on the buttons, drag to look',
    blurb:'First-person zombie survival on a four-station subway loop. Waves, points, gates, wall guns, a mystery box, perks, a Forge, tunnels you can walk and a train that takes you to the next stop, if you are still standing in it when the doors close.',
    keys:'WASD move, mouse looks, click fires, space jumps, scroll or 1 2 swap guns, R reload, F use, G grenade, V melee, shift sprints',
    icon:'<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6"/><path d="M8 16l-1 5h10l-1-5"/><path d="M9.5 9.5h.01M14.5 9.5h.01"/><path d="M10 13h4"/></svg>' });
  L.push({ id:'rounds', premium:true, rank:2, name:'Rounds', src:'rounds', color:'#ffb347', pad:'duel',
    tkeys:'Pad moves and jumps, fire and block buttons, aim is automatic',
    blurb:'Landfall\u2019s ROUNDS, rebuilt for one player: little big-headed gunners duel on floating maps, the loser of every round picks a card, first to five wins. All 67 cards plus the top community mods as toggles. Pick your colour first.',
    keys:'A/D move, W or space jumps, mouse aims, click shoots, right click or shift blocks',
    icon:'<svg viewBox="0 0 24 24"><circle cx="9" cy="13" r="5"/><path d="M13 12h6M17 10l2 2-2 2"/><path d="M6 17c-2 1-3 3-3 4M12 17c1 1 1 3 1 4"/></svg>' });
  L.push({ id:'tanks', premium:true, rank:4, name:'Tanks', src:'tanks', color:'#8fd46a', pad:'drag',
    tkeys:'Press on your tank and drag to aim, let go to fire. Drag anywhere else to drive, tap the nuke line to arm it',
    blurb:'Artillery on rolling hills against up to three cpu tanks, now in 3D. Wind, fuel, craters, and coins for a shop between rounds: armor, heavy shells, double barrels, a nuke.',
    keys:'Left/right drive, up/down angle, w/s power, space fires, n arms a nuke',
    icon:'<svg viewBox="0 0 24 24"><path d="M3 17h18M5 17v-3h10v3M8 14v-3h4v3M12 11l6-5"/><circle cx="7" cy="19.5" r="1"/><circle cx="12" cy="19.5" r="1"/><circle cx="17" cy="19.5" r="1"/></svg>' });
  L.push({ id:'ghosts', premium:true, rank:5, name:'Ghost Run', src:'ghostrun', color:'#7c5cbf', pad:'swipe',
    tkeys:'Swipe left or right to change lane, up to jump, down to slide. Pick a side at every fork',
    blurb:'Three lanes through a haunted house with ghosts on your heels, now in 3D. Jump the coffins, slide under the witches, dodge the armor, pick a side at every fork.',
    keys:'Arrows change lane, up jumps, down slides, space or enter starts',
    icon:'<svg viewBox="0 0 24 24"><path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/></svg>' });
  /* a bundle fills in its stub by id; a game with no stub (a future one) is simply added */
  window.TIG_REGISTER = function(def){ var g = L.filter(function(x){ return x.id === def.id; })[0]; if(!g){ L.push(def); return def; } Object.keys(def).forEach(function(k){ g[k] = def[k]; }); return g; };
})();

