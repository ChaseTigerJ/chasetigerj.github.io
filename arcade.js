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
  /* tiny shared WebAudio synth (created on first use, silent if the browser refuses). rounds.js reuses it via window.TIG_SFX */
  var SFX = (function(){ var ac = null, master, dead = false; function ctx(){ if(ac || dead) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .3; master.connect(ac.destination); } catch(e){ dead = true; ac = null; } return ac; }
    function tone(type, f0, f1, dur, gain, delay){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02); }
    function noise(dur, freq, gain, q, delay){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + (delay || 0)); }
    return { tone:tone, noise:noise, ctx:ctx }; })();
  window.TIG_SFX = SFX;
  var isDir = function(k){ return { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', w:'U', W:'U', ArrowDown:'D', s:'D', S:'D' }[k] || null; };

/* tigOS arcade games.js, part 01: serpent. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Serpent (snake) ---------- */
  function snake(api){
    var N = 24, S = api.W / N, g = {}, body, dir, queue, food, acc, step, alive, grow, score;
    g.reset = function(){ body = [{x:12,y:12},{x:11,y:12},{x:10,y:12}]; dir = 'R'; queue = []; acc = 0; step = .13; alive = true; grow = 0; score = 0; api.score(0); api.status('length 3'); place(); };
    function place(){ do { food = { x:ri(0, N-1), y:ri(0, N-1) }; } while(body.some(function(b){ return b.x === food.x && b.y === food.y; })); }
    g.key = function(k, down){ if(!down) return false; var d = isDir(k); if(!d) return false; var last = queue.length ? queue[queue.length-1] : dir; var opp = { L:'R', R:'L', U:'D', D:'U' }; if(d !== last && d !== opp[last] && queue.length < 3) queue.push(d); return true; };
    g.pointer = function(){};
    g.peek = function(){ return { head:body[0], len:body.length, food:food, dir:dir }; };
    g.update = function(dt){
      if(!alive) return; acc += dt; if(acc < step) return; acc -= step;
      if(queue.length) dir = queue.shift();
      var h = body[0], nx = h.x + (dir === 'R' ? 1 : dir === 'L' ? -1 : 0), ny = h.y + (dir === 'D' ? 1 : dir === 'U' ? -1 : 0);
      var tailIdx = grow > 0 ? body.length : body.length - 1;
      if(nx < 0 || ny < 0 || nx >= N || ny >= N){ alive = false; api.over('The serpent hit the wall'); return; }
      if(body.slice(0, tailIdx).some(function(b){ return b.x === nx && b.y === ny; })){ alive = false; api.over('The serpent bit its own tail'); return; }
      body.unshift({ x:nx, y:ny });
      if(nx === food.x && ny === food.y){ score += 10; grow += 2; step = Math.max(.06, step - .003); api.score(score); place(); }
      if(grow > 0) grow--; else body.pop();
      api.status('length '+body.length);
    };
    g.draw = function(c){
      bg(c, api.W, api.H, '#0d1410', '#06080a');
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1; for(var i = 1; i < N; i++){ c.beginPath(); c.moveTo(i*S, 0); c.lineTo(i*S, api.H); c.stroke(); c.beginPath(); c.moveTo(0, i*S); c.lineTo(api.W, i*S); c.stroke(); }
      var t = Date.now() / 1000, pr = S*.32 + Math.sin(t*6) * 1.5;
      c.fillStyle = '#ff5f57'; c.beginPath(); c.arc(food.x*S + S/2, food.y*S + S/2, pr, 0, 7); c.fill();
      c.fillStyle = '#28c840'; c.fillRect(food.x*S + S/2 - 1.5, food.y*S + S/2 - pr - 5, 3, 6);
      for(var j = body.length - 1; j >= 0; j--){ var b = body[j], k = j / body.length; c.fillStyle = j === 0 ? '#ffb15c' : 'hsl('+(28 + k*30)+' 90% '+(55 - k*20)+'%)'; rr(c, b.x*S + 1.5, b.y*S + 1.5, S - 3, S - 3, j === 0 ? 7 : 5); c.fill(); }
      var h = body[0], ex = dir === 'L' ? -1 : dir === 'R' ? 1 : 0, ey = dir === 'U' ? -1 : dir === 'D' ? 1 : 0;
      c.fillStyle = '#111'; [[-1,1],[1,-1]].forEach(function(o){ var px = h.x*S + S/2 + ex*S*.2 + (ey ? o[0] : 0)*S*.22, py = h.y*S + S/2 + ey*S*.2 + (ex ? o[1] : 0)*S*.22; c.beginPath(); c.arc(px, py, 2.2, 0, 7); c.fill(); });
    };
    return g;
  }

/* tigOS arcade games.js, part 02: tiles. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Tiles (2048) ---------- */
  function tiles(api){
    var N = 4, PAD = 14, CELL = (api.W - PAD*5) / 4, g = {}, grid, score, won, anim, over;
    var COL = { 2:'#eee4da', 4:'#ede0c8', 8:'#f2b179', 16:'#f59563', 32:'#f67c5f', 64:'#f65e3b', 128:'#edcf72', 256:'#edcc61', 512:'#edc850', 1024:'#edc53f', 2048:'#edc22e' };
    g.reset = function(){ grid = []; for(var i = 0; i < 16; i++) grid.push(0); score = 0; won = false; over = false; anim = {}; api.score(0); api.status('join the tiles, reach 2048'); spawn(); spawn(); };
    function spawn(){ var e = []; grid.forEach(function(v, i){ if(!v) e.push(i); }); if(!e.length) return; var i = e[ri(0, e.length-1)]; grid[i] = Math.random() < .9 ? 2 : 4; anim[i] = { t:0, kind:'new' }; }
    function line(idx){ var vals = idx.map(function(i){ return grid[i]; }).filter(Boolean), out = [], moved = false, gained = 0;
      for(var i = 0; i < vals.length; i++){ if(vals[i] === vals[i+1]){ out.push(vals[i]*2); gained += vals[i]*2; i++; } else out.push(vals[i]); }
      while(out.length < 4) out.push(0);
      idx.forEach(function(gi, k){ if(grid[gi] !== out[k]) moved = true; if(out[k] && grid[gi] !== out[k] && gained) anim[gi] = { t:0, kind:'merge' }; grid[gi] = out[k]; });
      return { moved:moved, gained:gained }; }
    function move(d){ var moved = false, gained = 0;
      for(var r = 0; r < 4; r++){ var idx = []; for(var k = 0; k < 4; k++){ idx.push(d === 'L' ? r*4 + k : d === 'R' ? r*4 + (3-k) : d === 'U' ? k*4 + r : (3-k)*4 + r); } var res = line(idx); moved = moved || res.moved; gained += res.gained; }
      if(moved){ score += gained; api.score(score); spawn(); if(!won && grid.indexOf(2048) > -1){ won = true; api.status('2048! keep going for a higher score'); } if(!canMove()){ over = true; api.over(won ? 'Board full, but you made 2048' : 'No moves left'); } }
      return moved; }
    function canMove(){ for(var i = 0; i < 16; i++){ if(!grid[i]) return true; var x = i%4, y = (i/4)|0; if(x < 3 && grid[i] === grid[i+1]) return true; if(y < 3 && grid[i] === grid[i+4]) return true; } return false; }
    g.key = function(k, down){ if(!down || over) return false; var d = isDir(k); if(!d) return false; move(d); return true; };
    g.pointer = function(){};
    g.peek = function(){ return { grid:grid.slice(), score:score }; };
    g.update = function(dt){ Object.keys(anim).forEach(function(i){ anim[i].t += dt; if(anim[i].t > .16) delete anim[i]; }); };
    g.draw = function(c){
      bg(c, api.W, api.H, '#1b1a22', '#0a0a10'); c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 4, 4, api.W - 8, api.H - 8, 16); c.fill();
      for(var i = 0; i < 16; i++){ var x = PAD + (i%4)*(CELL+PAD), y = PAD + ((i/4)|0)*(CELL+PAD), v = grid[i];
        c.fillStyle = 'rgba(255,255,255,.07)'; rr(c, x, y, CELL, CELL, 10); c.fill(); if(!v) continue;
        var a = anim[i], sc = a ? (a.kind === 'new' ? .5 + .5*(a.t/.16) : 1 + .18*Math.sin(Math.PI*a.t/.16)) : 1, cx = x + CELL/2, cy = y + CELL/2, s = CELL*sc;
        c.fillStyle = COL[v] || '#3c3a32'; rr(c, cx - s/2, cy - s/2, s, s, 10); c.fill();
        text(c, String(v), cx, cy + 1, v < 100 ? 40 : v < 1000 ? 32 : 26, v <= 4 ? '#776e65' : '#f9f6f2', 'center', 800); }
    };
    return g;
  }

/* tigOS arcade games.js, part 03: bricks. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Bricks (breakout) ---------- */
  function bricks(api){
    var W = api.W, H = api.H, g = {}, pad, ball, bricksArr, lives, level, score, held = {}, launched, flash, over;
    var ROWCOL = ['#ff5f57', '#ff8a00', '#ffd166', '#28c840', '#8cc7ff', '#a78bfa'];
    function build(){ bricksArr = []; var cols = 12, rows = 6, bw = (W - 40) / cols, bh = 20; for(var r = 0; r < rows; r++) for(var col = 0; col < cols; col++){ var hp = level > 1 && (r + col + level) % 5 === 0 ? 2 : 1; bricksArr.push({ x:20 + col*bw, y:60 + r*(bh+6), w:bw - 5, h:bh, hp:hp, col:ROWCOL[r], pts:(rows - r) * 10 }); } }
    function serve(){ launched = false; ball = { x:pad.x + pad.w/2, y:pad.y - 8, vx:0, vy:0, r:7 }; }
    g.reset = function(){ pad = { x:W/2 - 50, y:H - 34, w:100, h:12 }; lives = 3; level = 1; score = 0; flash = 0; over = false; api.score(0); build(); serve(); api.status('level 1  ·  3 balls  ·  space to launch'); };
    function launch(){ if(launched) return; launched = true; var sp = 300 + level*25, a = rnd(-.6, .6); ball.vx = Math.sin(a)*sp; ball.vy = -Math.cos(a)*sp; }
    g.key = function(k, down){ var d = isDir(k); if(d === 'L' || d === 'R'){ held[d] = down; return true; } if(k === ' ' || d === 'U'){ if(down) launch(); return true; } return false; };
    g.pointer = function(type, x){ if(type === 'move' || type === 'down'){ pad.x = clamp(x - pad.w/2, 0, W - pad.w); } if(type === 'down') launch(); };
    g.update = function(dt){
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
          b.hp--; if(b.hp <= 0){ bricksArr.splice(i, 1); score += b.pts; api.score(score); } break; }
        if(over) return;
        if(ball.y > H + 20){ lives--; flash = .4; if(lives <= 0){ over = true; api.status('out of balls'); api.over('Out of balls'); return; } serve(); api.status('level '+level+'  ·  '+lives+' ball'+(lives === 1 ? '' : 's')+'  ·  space to launch'); return; }
      }
      if(!bricksArr.length){ level++; score += 100; api.score(score); build(); serve(); api.status('level '+level+'  ·  '+lives+' balls  ·  space to launch'); }
    };
    g.draw = function(c){
      bg(c, W, H, flash > 0 ? '#2a1214' : '#12101c', '#07070c');
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, 0, W, 34); text(c, 'LEVEL '+level, 16, 17, 12, 'rgba(255,255,255,.55)', 'left'); for(var l = 0; l < lives; l++){ c.fillStyle = '#ffb15c'; c.beginPath(); c.arc(W - 20 - l*16, 17, 4.5, 0, 7); c.fill(); }
      bricksArr.forEach(function(b){ c.fillStyle = b.col; c.globalAlpha = b.hp > 1 ? 1 : .9; rr(c, b.x, b.y, b.w, b.h, 4); c.fill(); if(b.hp > 1){ c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; rr(c, b.x + 2, b.y + 2, b.w - 4, b.h - 4, 3); c.stroke(); } }); c.globalAlpha = 1;
      var pg = c.createLinearGradient(pad.x, 0, pad.x + pad.w, 0); pg.addColorStop(0, '#ffb15c'); pg.addColorStop(1, '#ff6a00'); c.fillStyle = pg; rr(c, pad.x, pad.y, pad.w, pad.h, 6); c.fill();
      c.fillStyle = '#fff'; c.shadowColor = '#ffd166'; c.shadowBlur = 14; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
    };
    return g;
  }

/* tigOS arcade games.js, part 04: flap. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Flap ---------- */
  function flap(api){
    var W = api.W, H = api.H, g = {}, bird, pipes, score, alive, t, ground, started, clouds;
    var GAP = 150, SPACING = 230, SPEED = 165, GRAV = 1500, JUMP = -430, R = 14;
    g.reset = function(){ bird = { y:H/2, vy:0, wing:0 }; pipes = []; score = 0; alive = true; t = 0; ground = 0; started = false; clouds = []; for(var i = 0; i < 5; i++) clouds.push({ x:rnd(0, W), y:rnd(40, H*.5), s:rnd(.6, 1.3) }); for(var p = 0; p < 4; p++) pipes.push({ x:W + 120 + p*SPACING, gy:rnd(120, H - 120 - GAP), passed:false }); api.score(0); api.status(api.touch ? 'tap to flap' : 'space to flap'); };
    function jump(){ if(!alive) return; started = true; bird.vy = JUMP; bird.wing = .25; }
    g.key = function(k, down){ if(k === ' ' || isDir(k) === 'U'){ if(down) jump(); return true; } return false; };
    g.pointer = function(type){ if(type === 'down') jump(); };
    g.update = function(dt){
      t += dt; bird.wing = Math.max(0, bird.wing - dt); ground = (ground + SPEED*dt) % 40; clouds.forEach(function(k){ k.x -= 18*k.s*dt; if(k.x < -80) k.x = W + 80; });
      if(!started){ bird.y = H/2 + Math.sin(t*3)*8; return; }
      if(!alive) return;
      bird.vy += GRAV*dt; bird.y += bird.vy*dt;
      pipes.forEach(function(p){ p.x -= SPEED*dt; if(!p.passed && p.x + 30 < W*.28){ p.passed = true; score++; api.score(score); } });
      if(pipes[0].x < -80){ pipes.shift(); var last = pipes[pipes.length-1]; pipes.push({ x:last.x + SPACING, gy:clamp(last.gy + rnd(-140, 140), 90, H - 110 - GAP), passed:false }); }
      var bx = W*.28, hit = bird.y + R > H - 56 || bird.y - R < 0;
      pipes.forEach(function(p){ if(bx + R > p.x && bx - R < p.x + 60 && (bird.y - R < p.gy || bird.y + R > p.gy + GAP)) hit = true; });
      if(hit){ alive = false; api.over(score >= 10 ? 'Nice flight' : 'Flapped out'); }
    };
    g.draw = function(c){
      var sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#5aa9ff'); sky.addColorStop(1, '#c9ecff'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.85)'; clouds.forEach(function(k){ c.beginPath(); c.arc(k.x, k.y, 18*k.s, 0, 7); c.arc(k.x + 20*k.s, k.y - 6*k.s, 22*k.s, 0, 7); c.arc(k.x + 42*k.s, k.y, 16*k.s, 0, 7); c.fill(); });
      pipes.forEach(function(p){ var pg = c.createLinearGradient(p.x, 0, p.x + 60, 0); pg.addColorStop(0, '#5ec850'); pg.addColorStop(.5, '#8be07a'); pg.addColorStop(1, '#3f9c34'); c.fillStyle = pg; c.fillRect(p.x, 0, 60, p.gy); c.fillRect(p.x, p.gy + GAP, 60, H - p.gy - GAP - 56); c.fillStyle = '#3f9c34'; c.fillRect(p.x - 4, p.gy - 22, 68, 22); c.fillRect(p.x - 4, p.gy + GAP, 68, 22); });
      c.fillStyle = '#d9b46a'; c.fillRect(0, H - 56, W, 56); c.fillStyle = '#8fce5a'; c.fillRect(0, H - 56, W, 10); c.fillStyle = 'rgba(0,0,0,.08)'; for(var x = -ground; x < W; x += 40) c.fillRect(x, H - 40, 20, 6);
      var bx = W*.28, ang = clamp(bird.vy / 600, -.5, 1.1); c.save(); c.translate(bx, bird.y); c.rotate(started ? ang : 0);
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.fillStyle = '#ff8a00'; c.beginPath(); c.ellipse(-2, 4 - bird.wing*24, 9, 5, -.3, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(6, -4, 5, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(7.5, -4, 2.2, 0, 7); c.fill(); c.fillStyle = '#ff5f57'; c.beginPath(); c.moveTo(11, 1); c.lineTo(20, 4); c.lineTo(11, 7); c.closePath(); c.fill(); c.restore();
      if(started) text(c, String(score), W/2, 60, 44, '#fff', 'center', 800); else text(c, api.touch ? 'tap to start' : 'space to start', W/2, H*.38, 16, 'rgba(255,255,255,.95)', 'center');
    };
    return g;
  }

/* tigOS arcade games.js, part 05: stacker. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Stacker (falling blocks) ---------- */
  function stacker(api){
    var COLS = 10, ROWS = 20, CELL = 26, BX = 20, BY = 10, g = {}, board, cur, nextQ, hold, canHold, score, lines, level, acc, das, held = {}, over;
    var SHAPES = { I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[0,1],[1,1],[2,1],[1,0]], S:[[1,0],[2,0],[0,1],[1,1]], Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]] };
    var COL = { I:'#63e6be', O:'#ffd166', T:'#a78bfa', S:'#28c840', Z:'#ff5f57', J:'#8cc7ff', L:'#ff8a00' };
    function bag(){ var k = Object.keys(SHAPES), out = []; while(k.length) out.push(k.splice(ri(0, k.length-1), 1)[0]); return out; }
    function piece(t){ return { t:t, cells:SHAPES[t].map(function(p){ return [p[0], p[1]]; }), x:3, y:t === 'I' ? -1 : 0, size:t === 'I' ? 4 : t === 'O' ? 2 : 3 }; }
    function fits(p, dx, dy, cells){ return (cells || p.cells).every(function(c){ var x = p.x + c[0] + dx, y = p.y + c[1] + dy; return x >= 0 && x < COLS && y < ROWS && (y < 0 || !board[y][x]); }); }
    function spawn(){ if(nextQ.length < 4) nextQ = nextQ.concat(bag()); cur = piece(nextQ.shift()); canHold = true; if(!fits(cur, 0, 0)){ over = true; api.over('Stacked out at level '+level); } }
    function speed(){ return Math.max(.08, .8 - (level-1)*.07); }
    g.reset = function(){ board = []; for(var r = 0; r < ROWS; r++){ board.push(new Array(COLS).fill(0)); } nextQ = bag(); hold = null; score = 0; lines = 0; level = 1; acc = 0; das = 0; over = false; held = {}; api.score(0); api.status('level 1  ·  0 lines'); spawn(); };
    function rotate(dir){ if(cur.t === 'O') return; var s = cur.size - 1, cells = cur.cells.map(function(c){ return dir > 0 ? [s - c[1], c[0]] : [c[1], s - c[0]]; }); var kicks = [0, -1, 1, -2, 2]; for(var i = 0; i < kicks.length; i++){ if(fits(cur, kicks[i], 0, cells)){ cur.cells = cells; cur.x += kicks[i]; return; } if(fits(cur, kicks[i], -1, cells)){ cur.cells = cells; cur.x += kicks[i]; cur.y -= 1; return; } } }
    function lock(){ cur.cells.forEach(function(c){ var y = cur.y + c[1]; if(y >= 0) board[y][cur.x + c[0]] = cur.t; }); var cleared = 0; for(var r = ROWS - 1; r >= 0; r--){ if(board[r].every(Boolean)){ board.splice(r, 1); board.unshift(new Array(COLS).fill(0)); cleared++; r++; } }
      if(cleared){ lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = 1 + Math.floor(lines / 10); api.score(score); api.status('level '+level+'  ·  '+lines+' line'+(lines === 1 ? '' : 's')); } spawn(); }
    function drop(){ if(fits(cur, 0, 1)) cur.y++; else lock(); }
    function hardDrop(){ var d = 0; while(fits(cur, 0, d + 1)) d++; cur.y += d; score += d * 2; api.score(score); lock(); }
    function doHold(){ if(!canHold) return; var t = cur.t; if(hold){ cur = piece(hold); } else { spawn(); } hold = t; canHold = false; }
    g.key = function(k, down){ if(over) return false; var d = isDir(k);
      if(d === 'L' || d === 'R'){ held[d] = down; if(down){ das = -.17; if(fits(cur, d === 'L' ? -1 : 1, 0)) cur.x += d === 'L' ? -1 : 1; } return true; }
      if(d === 'D'){ held.D = down; if(down){ drop(); acc = 0; } return true; }
      if(!down) return false;
      if(d === 'U' || k === 'x' || k === 'X'){ rotate(1); return true; } if(k === 'z' || k === 'Z'){ rotate(-1); return true; }
      if(k === ' '){ hardDrop(); return true; } if(k === 'c' || k === 'C' || k === 'Shift'){ doHold(); return true; } return false; };
    g.pointer = function(){};
    g.update = function(dt){ if(over) return;
      if(held.L || held.R){ das += dt; while(das >= .05){ das -= .05; var dx = held.L ? -1 : 1; if(fits(cur, dx, 0)) cur.x += dx; } }
      acc += dt; var sp = held.D ? Math.min(speed(), .05) : speed(); while(acc >= sp){ acc -= sp; drop(); if(over) return; } };
    function cell(c, x, y, col, ghost){ var px = BX + x*CELL, py = BY + y*CELL; if(ghost){ c.strokeStyle = col; c.globalAlpha = .35; c.lineWidth = 2; rr(c, px + 2, py + 2, CELL - 4, CELL - 4, 4); c.stroke(); c.globalAlpha = 1; return; } c.fillStyle = col; rr(c, px + 1, py + 1, CELL - 2, CELL - 2, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; rr(c, px + 4, py + 4, CELL - 8, 6, 3); c.fill(); }
    function mini(c, t, x, y){ if(!t) return; SHAPES[t].forEach(function(p){ c.fillStyle = COL[t]; rr(c, x + p[0]*16, y + p[1]*16, 14, 14, 3); c.fill(); }); }
    g.draw = function(c){
      bg(c, api.W, api.H, '#14121f', '#08080d'); c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, BX - 2, BY - 2, COLS*CELL + 4, ROWS*CELL + 4, 8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; for(var i = 1; i < COLS; i++){ c.beginPath(); c.moveTo(BX + i*CELL, BY); c.lineTo(BX + i*CELL, BY + ROWS*CELL); c.stroke(); }
      for(var r = 0; r < ROWS; r++) for(var x = 0; x < COLS; x++) if(board[r][x]) cell(c, x, r, COL[board[r][x]]);
      if(cur && !over){ var d = 0; while(fits(cur, 0, d + 1)) d++; cur.cells.forEach(function(p){ if(cur.y + p[1] + d >= 0) cell(c, cur.x + p[0], cur.y + p[1] + d, COL[cur.t], true); }); cur.cells.forEach(function(p){ if(cur.y + p[1] >= 0) cell(c, cur.x + p[0], cur.y + p[1], COL[cur.t]); }); }
      var sx = BX + COLS*CELL + 24; text(c, 'NEXT', sx, 24, 12, 'rgba(255,255,255,.5)'); for(var n = 0; n < 3; n++) mini(c, nextQ[n], sx, 44 + n*58);
      text(c, 'HOLD', sx, 236, 12, 'rgba(255,255,255,.5)'); mini(c, hold, sx, 256);
      text(c, 'LEVEL', sx, 330, 12, 'rgba(255,255,255,.5)'); text(c, String(level), sx, 354, 26, '#ffd166', 'left', 800);
      text(c, 'LINES', sx, 400, 12, 'rgba(255,255,255,.5)'); text(c, String(lines), sx, 424, 26, '#63e6be', 'left', 800);
      text(c, api.touch ? 'swipe, tap rotates' : '\u2191 rotate   space drops', sx, api.H - 34, 10, 'rgba(255,255,255,.4)'); text(c, api.touch ? '' : 'c holds   z counter', sx, api.H - 18, 10, 'rgba(255,255,255,.4)');
    };
    return g;
  }

/* tigOS arcade games.js, part 06: rocks. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Rocks (asteroids) ---------- */
  function rocks(api){
    var W = api.W, H = api.H, g = {}, ship, rocksArr, bullets, parts, lives, wave, score, held = {}, cool, safe, dead, over;
    function wrap(o){ if(o.x < -20) o.x += W + 40; if(o.x > W + 20) o.x -= W + 40; if(o.y < -20) o.y += H + 40; if(o.y > H + 20) o.y -= H + 40; }
    function rock(x, y, size){ var r = [40, 24, 12][3 - size], pts = []; for(var i = 0; i < 11; i++) pts.push(rnd(.7, 1.15)); var sp = rnd(30, 70) + (3 - size)*25 + wave*6, a = rnd(0, 6.28); return { x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, r:r, size:size, pts:pts, rot:0, vr:rnd(-1.2, 1.2) }; }
    function spawnWave(){ rocksArr = []; for(var i = 0; i < 3 + wave; i++){ var x, y; do { x = rnd(0, W); y = rnd(0, H); } while(Math.hypot(x - W/2, y - H/2) < 150); rocksArr.push(rock(x, y, 3)); } }
    function boom(x, y, n, col){ for(var i = 0; i < n; i++){ var a = rnd(0, 6.28), s = rnd(40, 160); parts.push({ x:x, y:y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, t:rnd(.3, .8), col:col }); } }
    function respawn(){ ship = { x:W/2, y:H/2, vx:0, vy:0, a:-Math.PI/2 }; safe = 2.5; dead = false; }
    g.reset = function(){ bullets = []; parts = []; lives = 3; wave = 1; score = 0; cool = 0; over = false; held = {}; api.score(0); api.status('wave 1  ·  3 ships'); respawn(); spawnWave(); };
    g.key = function(k, down){ var d = isDir(k); if(d === 'L' || d === 'R' || d === 'U'){ held[d] = down; return true; } if(k === ' ' || d === 'D'){ held.F = down; if(down) fire(); return true; } return false; };
    function fire(){ if(dead || over || cool > 0 || bullets.length >= 5) return; cool = .18; bullets.push({ x:ship.x + Math.cos(ship.a)*14, y:ship.y + Math.sin(ship.a)*14, vx:Math.cos(ship.a)*460 + ship.vx, vy:Math.sin(ship.a)*460 + ship.vy, t:1.1 }); }
    g.pointer = function(type){ if(type === 'down') fire(); };
    g.update = function(dt){ if(over) return;
      cool -= dt; safe -= dt;
      if(!dead){ if(held.L) ship.a -= 4.2*dt; if(held.R) ship.a += 4.2*dt; if(held.U){ ship.vx += Math.cos(ship.a)*260*dt; ship.vy += Math.sin(ship.a)*260*dt; } ship.vx *= Math.pow(.35, dt); ship.vy *= Math.pow(.35, dt); ship.x += ship.vx*dt; ship.y += ship.vy*dt; wrap(ship); if(held.F) fire(); }
      bullets.forEach(function(b){ b.x += b.vx*dt; b.y += b.vy*dt; b.t -= dt; wrap(b); }); bullets = bullets.filter(function(b){ return b.t > 0; });
      parts.forEach(function(p){ p.x += p.vx*dt; p.y += p.vy*dt; p.t -= dt; }); parts = parts.filter(function(p){ return p.t > 0; });
      rocksArr.forEach(function(r){ r.x += r.vx*dt; r.y += r.vy*dt; r.rot += r.vr*dt; wrap(r); });
      for(var i = rocksArr.length - 1; i >= 0; i--){ var r = rocksArr[i], hitB = -1; for(var j = 0; j < bullets.length; j++){ if(Math.hypot(bullets[j].x - r.x, bullets[j].y - r.y) < r.r){ hitB = j; break; } }
        if(hitB > -1){ bullets.splice(hitB, 1); rocksArr.splice(i, 1); score += [100, 50, 20][r.size - 1]; api.score(score); boom(r.x, r.y, 10, '#ffd166'); if(r.size > 1){ rocksArr.push(rock(r.x, r.y, r.size - 1)); rocksArr.push(rock(r.x, r.y, r.size - 1)); } continue; }
        if(!dead && safe <= 0 && Math.hypot(ship.x - r.x, ship.y - r.y) < r.r + 10){ dead = true; lives--; boom(ship.x, ship.y, 24, '#ff8a00'); if(lives <= 0){ over = true; api.status('wave '+wave+'  ·  no ships left'); api.over('Lost in the rocks, wave '+wave); return; } api.status('wave '+wave+'  ·  '+lives+' ship'+(lives === 1 ? '' : 's')); setTimeout(function(){ if(!over) respawn(); }, 1200); } }
      if(!rocksArr.length){ wave++; score += 250; api.score(score); api.status('wave '+wave+'  ·  '+lives+' ship'+(lives === 1 ? '' : 's')); safe = Math.max(safe, 1.5); spawnWave(); } };
    g.draw = function(c){
      bg(c, W, H, '#05060d', '#0b0a16'); c.fillStyle = 'rgba(255,255,255,.35)'; for(var s = 0; s < 40; s++){ c.fillRect((s*97 + wave*13) % W, (s*57) % H, 1.5, 1.5); }
      c.lineWidth = 2; c.strokeStyle = '#d8d4ff'; c.shadowColor = '#a78bfa'; c.shadowBlur = 8;
      rocksArr.forEach(function(r){ c.beginPath(); r.pts.forEach(function(p, i){ var a = r.rot + i/r.pts.length*6.283; var px = r.x + Math.cos(a)*r.r*p, py = r.y + Math.sin(a)*r.r*p; if(i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath(); c.stroke(); });
      c.shadowBlur = 0; parts.forEach(function(p){ c.fillStyle = p.col; c.globalAlpha = Math.min(1, p.t*2); c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }); c.globalAlpha = 1;
      c.fillStyle = '#fff'; bullets.forEach(function(b){ c.beginPath(); c.arc(b.x, b.y, 2.5, 0, 7); c.fill(); });
      if(!dead){ c.save(); c.translate(ship.x, ship.y); c.rotate(ship.a); c.globalAlpha = safe > 0 && Math.floor(safe*8) % 2 ? .35 : 1; c.strokeStyle = '#ff8a00'; c.shadowColor = '#ff8a00'; c.shadowBlur = 10; c.beginPath(); c.moveTo(16, 0); c.lineTo(-12, 10); c.lineTo(-7, 0); c.lineTo(-12, -10); c.closePath(); c.stroke();
        if(held.U){ c.strokeStyle = '#ffd166'; c.beginPath(); c.moveTo(-9, 5); c.lineTo(-18 - rnd(0, 8), 0); c.lineTo(-9, -5); c.stroke(); } c.restore(); c.shadowBlur = 0; }
      for(var l = 0; l < lives; l++){ c.save(); c.translate(24 + l*22, 22); c.rotate(-Math.PI/2); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(8, 0); c.lineTo(-6, 5); c.lineTo(-3, 0); c.lineTo(-6, -5); c.closePath(); c.stroke(); c.restore(); }
      text(c, 'WAVE '+wave, W - 16, 22, 12, 'rgba(255,255,255,.55)', 'right');
    };
    return g;
  }

/* tigOS arcade games.js, part 07: mines. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Mines ---------- */
  function mines(api){
    var COLS = 16, ROWS = 12, CELL = 28, MX = 16, MY = 48, MINES = 30, g = {}, cells, placed, cur, state, t0, elapsed, flags, revealed, pressT, pressCell;
    var NUMCOL = ['', '#8cc7ff', '#28c840', '#ff5f57', '#a78bfa', '#ff8a00', '#63e6be', '#f4f1ea', '#ffd166'];
    function idx(x, y){ return y*COLS + x; }
    function around(i, fn){ var x = i % COLS, y = (i / COLS)|0; for(var dy = -1; dy <= 1; dy++) for(var dx = -1; dx <= 1; dx++){ if(!dx && !dy) continue; var nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) fn(idx(nx, ny)); } }
    g.reset = function(){ cells = []; for(var i = 0; i < COLS*ROWS; i++) cells.push({ m:false, n:0, open:false, flag:false }); placed = false; cur = idx(8, 6); state = 'play'; t0 = 0; elapsed = 0; flags = 0; revealed = 0; pressT = 0; pressCell = -1; api.score(0); api.status(MINES+' mines  ·  '+(api.touch ? 'tap to dig, hold to flag' : 'click digs, right click flags')); };
    function place(first){ var safe = {}; safe[first] = 1; around(first, function(j){ safe[j] = 1; }); var n = 0; while(n < MINES){ var i = ri(0, cells.length - 1); if(safe[i] || cells[i].m) continue; cells[i].m = true; n++; } cells.forEach(function(c, i){ around(i, function(j){ if(cells[j].m) c.n++; }); }); placed = true; t0 = Date.now(); }
    function reveal(i){ var c = cells[i]; if(c.open || c.flag || state !== 'play') return; if(!placed) place(i);
      if(c.m){ c.open = true; state = 'lost'; cells.forEach(function(k){ if(k.m) k.open = true; }); api.status('boom  ·  '+revealed+' safe cells cleared'); api.over('Boom, that was a mine'); return; }
      var stack = [i]; while(stack.length){ var j = stack.pop(), k = cells[j]; if(k.open || k.flag) continue; k.open = true; revealed++; if(k.n === 0) around(j, function(q){ if(!cells[q].open) stack.push(q); }); }
      api.score(revealed);
      if(revealed === COLS*ROWS - MINES){ state = 'won'; elapsed = (Date.now() - t0)/1000; api.status('cleared in '+elapsed.toFixed(1)+'s'); api.score(revealed + Math.max(0, Math.round(300 - elapsed))); api.over('Field cleared in '+elapsed.toFixed(1)+'s'); } }
    function chord(i){ var c = cells[i]; if(!c.open || !c.n) return; var f = 0; around(i, function(j){ if(cells[j].flag) f++; }); if(f === c.n) around(i, function(j){ if(!cells[j].flag) reveal(j); }); }
    function flag(i){ var c = cells[i]; if(c.open || state !== 'play') return; c.flag = !c.flag; flags += c.flag ? 1 : -1; api.status((MINES - flags)+' mines left'); }
    function act(i){ if(cells[i].open) chord(i); else reveal(i); }
    g.key = function(k, down){ if(!down || state !== 'play') return false; var d = isDir(k), x = cur % COLS, y = (cur / COLS)|0;
      if(d){ x = clamp(x + (d === 'L' ? -1 : d === 'R' ? 1 : 0), 0, COLS - 1); y = clamp(y + (d === 'U' ? -1 : d === 'D' ? 1 : 0), 0, ROWS - 1); cur = idx(x, y); return true; }
      if(k === ' ' || k === 'Enter'){ act(cur); return true; } if(k === 'f' || k === 'F'){ flag(cur); return true; } return false; };
    function at(x, y){ var cx = Math.floor((x - MX) / CELL), cy = Math.floor((y - MY) / CELL); return cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS ? idx(cx, cy) : -1; }
    g.pointer = function(type, x, y, e){ var i = at(x, y); if(state !== 'play') return;
      if(type === 'down'){ pressCell = i; pressT = Date.now(); if(i > -1) cur = i; if(e && (e.button === 2 || e.ctrlKey || e.metaKey)){ if(i > -1) flag(i); pressCell = -1; } return; }
      if(type === 'up'){ if(pressCell > -1 && i === pressCell){ if(Date.now() - pressT > 380) flag(i); else act(i); } pressCell = -1; } };
    g.update = function(){ if(state === 'play' && placed) elapsed = (Date.now() - t0)/1000; };
    g.draw = function(c){
      bg(c, api.W, api.H, '#15161d', '#0a0a0e');
      text(c, (MINES - flags)+' mines', MX, 24, 14, '#ff5f57', 'left', 700); text(c, elapsed.toFixed(0)+'s', api.W - MX, 24, 14, 'rgba(255,255,255,.7)', 'right', 700); text(c, state === 'won' ? 'cleared' : state === 'lost' ? 'boom' : 'tigOS mines', api.W/2, 24, 13, 'rgba(255,255,255,.45)', 'center');
      cells.forEach(function(k, i){ var x = MX + (i % COLS)*CELL, y = MY + ((i / COLS)|0)*CELL;
        if(k.open){ c.fillStyle = k.m ? (state === 'lost' ? '#5a1d1d' : '#2a2a34') : 'rgba(255,255,255,.06)'; rr(c, x + 1, y + 1, CELL - 2, CELL - 2, 4); c.fill(); if(k.m){ c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(x + CELL/2, y + CELL/2, 6, 0, 7); c.fill(); } else if(k.n) text(c, String(k.n), x + CELL/2, y + CELL/2 + 1, 15, NUMCOL[k.n], 'center', 800); }
        else { var gr = c.createLinearGradient(x, y, x, y + CELL); gr.addColorStop(0, '#3d3e4c'); gr.addColorStop(1, '#2a2b36'); c.fillStyle = gr; rr(c, x + 1, y + 1, CELL - 2, CELL - 2, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, x + 3, y + 3, CELL - 6, 5, 2); c.fill();
          if(k.flag){ c.fillStyle = '#ff5f57'; c.beginPath(); c.moveTo(x + 10, y + 7); c.lineTo(x + 20, y + 12); c.lineTo(x + 10, y + 17); c.closePath(); c.fill(); c.fillStyle = '#f4f1ea'; c.fillRect(x + 9, y + 7, 2, 14); } }
        if(i === cur && !api.touch){ c.strokeStyle = '#ff8a00'; c.lineWidth = 2; rr(c, x + 1.5, y + 1.5, CELL - 3, CELL - 3, 4); c.stroke(); } });
    };
    return g;
  }

/* tigOS arcade games.js, part 08: paddle. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Paddle (pong vs cpu) ---------- */
  function paddle(api){
    var W = api.W, H = api.H, g = {}, me, cpu, ball, held = {}, pts, over, serveT, trail;
    var PH = 80, PW = 12, TO = 7;
    function serve(dir){ ball = { x:W/2, y:H/2, vx:0, vy:0, r:8 }; serveT = .9; ball.dir = dir; trail = []; }
    g.reset = function(){ me = { y:H/2 - PH/2 }; cpu = { y:H/2 - PH/2, react:0 }; pts = [0, 0]; over = false; held = {}; api.score(0); api.status('first to '+TO+'  ·  you 0, cpu 0'); serve(1); };
    g.key = function(k, down){ var d = isDir(k); if(d === 'U' || d === 'D'){ held[d] = down; return true; } return false; };
    g.pointer = function(type, x, y){ if(type === 'move' || type === 'down') me.y = clamp(y - PH/2, 0, H - PH); };
    function point(who){ pts[who]++; api.score(pts[0]); api.status('first to '+TO+'  ·  you '+pts[0]+', cpu '+pts[1]); if(pts[who] >= TO){ over = true; api.over(who === 0 ? 'You beat the cpu '+pts[0]+' to '+pts[1] : 'The cpu wins '+pts[1]+' to '+pts[0]); return; } serve(who === 0 ? 1 : -1); }
    g.update = function(dt){ if(over) return;
      if(held.U) me.y = clamp(me.y - 420*dt, 0, H - PH); if(held.D) me.y = clamp(me.y + 420*dt, 0, H - PH);
      if(serveT > 0){ serveT -= dt; if(serveT <= 0){ var a = rnd(-.5, .5); ball.vx = Math.cos(a)*330*ball.dir; ball.vy = Math.sin(a)*330; } return; }
      ball.x += ball.vx*dt; ball.y += ball.vy*dt; trail.push({ x:ball.x, y:ball.y }); if(trail.length > 10) trail.shift();
      if(ball.y < ball.r){ ball.y = ball.r; ball.vy = Math.abs(ball.vy); } if(ball.y > H - ball.r){ ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); }
      var tgt = ball.vx > 0 ? ball.y - PH/2 + (cpu.react || 0) : H/2 - PH/2; if(ball.vx > 0 && Math.random() < dt*3) cpu.react = rnd(-26, 26); var cs = 260 + Math.min(pts[0] - pts[1], 4)*35; cpu.y += clamp(tgt - cpu.y, -cs*dt, cs*dt); cpu.y = clamp(cpu.y, 0, H - PH);
      if(ball.vx < 0 && ball.x - ball.r <= 24 + PW && ball.x - ball.r > 12 && ball.y > me.y - ball.r && ball.y < me.y + PH + ball.r){ var rel = (ball.y - (me.y + PH/2)) / (PH/2), sp = Math.min(760, Math.hypot(ball.vx, ball.vy)*1.06); ball.vx = Math.cos(rel*.9)*sp; ball.vy = Math.sin(rel*.9)*sp; ball.x = 24 + PW + ball.r; }
      if(ball.vx > 0 && ball.x + ball.r >= W - 24 - PW && ball.x + ball.r < W - 12 && ball.y > cpu.y - ball.r && ball.y < cpu.y + PH + ball.r){ var rel2 = (ball.y - (cpu.y + PH/2)) / (PH/2), sp2 = Math.min(760, Math.hypot(ball.vx, ball.vy)*1.06); ball.vx = -Math.cos(rel2*.9)*sp2; ball.vy = Math.sin(rel2*.9)*sp2; ball.x = W - 24 - PW - ball.r; }
      if(ball.x < -20) point(1); else if(ball.x > W + 20) point(0); };
    g.draw = function(c){
      bg(c, W, H, '#0e1016', '#07080c'); c.setLineDash([8, 10]); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W/2, 12); c.lineTo(W/2, H - 12); c.stroke(); c.setLineDash([]);
      text(c, String(pts[0]), W/2 - 50, 44, 48, 'rgba(255,255,255,.75)', 'center', 800); text(c, String(pts[1]), W/2 + 50, 44, 48, 'rgba(255,255,255,.35)', 'center', 800); text(c, 'YOU', 24, 20, 11, '#ff8a00'); text(c, 'CPU', W - 24, 20, 11, 'rgba(255,255,255,.5)', 'right');
      c.fillStyle = '#ff8a00'; rr(c, 24, me.y, PW, PH, 6); c.fill(); c.fillStyle = '#8cc7ff'; rr(c, W - 24 - PW, cpu.y, PW, PH, 6); c.fill();
      trail.forEach(function(p, i){ c.fillStyle = 'rgba(255,255,255,'+(i/trail.length*.25)+')'; c.beginPath(); c.arc(p.x, p.y, ball.r*(.4 + i/trail.length*.6), 0, 7); c.fill(); });
      c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 12; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
      if(serveT > 0 && !over) text(c, 'serving\u2026', W/2, H - 30, 13, 'rgba(255,255,255,.5)', 'center');
    };
    return g;
  }

/* tigOS arcade games.js, part 09: ghost run. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Ghost Run (haunted house lane runner) ---------- */
  function ghosts(api){
    var W = api.W, H = api.H, g = {}, HZ = H*.34, LANE = W*.30, t, speed, dist, candles, lane, px, jump, slide, objs, spawnT, alive, score, tiles, flick, threat, stumble, theme, turnT, turnDir, quiet, forkT, halls, ghostBob, light, lightT, dust, bats, batT, TURN_T = 1.05;
    var PZ = .86, s = function(z){ return .10 + .90*z; }, sy = function(z){ return HZ + (H - HZ)*z; };   /* linear depth: things come down the hall at one steady pace */
    var THEMES = [ { wall:'#2a2436', wall2:'#171320', floor:'#3a3147', trim:'#5a4d6e', rug:'#5a1f2e', name:'the great hall' }, { wall:'#33222a', wall2:'#1d1418', floor:'#432b34', trim:'#7a4a55', rug:'#2a3a1f', name:'the library' }, { wall:'#1e2a2a', wall2:'#111c1b', floor:'#28393a', trim:'#3f6a66', rug:'#3a1f3a', name:'the crypt' }, { wall:'#2e2a1c', wall2:'#1c1a10', floor:'#3d3724', trim:'#7a6b3a', rug:'#4a1f1f', name:'the kitchen' } ];
    g.reset = function(){ t = 0; speed = .46; dist = 0; candles = 0; lane = 1; px = 1; jump = 0; slide = 0; objs = []; spawnT = .8; alive = true; score = 0; tiles = 0; flick = 0; threat = 0; stumble = 0; theme = 0; turnT = 0; turnDir = 0; quiet = 0; forkT = 7; halls = 0; ghostBob = 0; light = 0; lightT = rnd(3, 7); dust = []; for(var di = 0; di < 26; di++) dust.push({ x:Math.random(), y:Math.random(), s:rnd(.6, 1.6), ph:rnd(0, 7) }); bats = []; batT = rnd(4, 9); api.score(0); api.status(api.touch ? 'swipe to dodge, the ghosts are close' : 'arrows dodge, up jumps, down slides'); };
    function spawn(){ var r = Math.random(), l = ri(0, 2), z = 0.001;
      if(r < .27) objs.push({ k:'low', l:l, z:z }); else if(r < .48) objs.push({ k:'high', l:l, z:z }); else if(r < .7) objs.push({ k:'wall', l:l, z:z }); else { var l2 = ri(0, 2); for(var i = 0; i < 4; i++) objs.push({ k:'candle', l:l2, z:z - i*.05 }); }
      if(Math.random() < .2 + speed*.18){ var l3 = (l + ri(1, 2)) % 3; objs.push({ k:Math.random() < .5 ? 'low' : 'wall', l:l3, z:z - .012 }); } }
    function fork(){ var one = Math.random() < .4; objs.push({ k:one ? 'turn' : 'fork', l:1, z:0.001, dir:Math.random() < .5 ? -1 : 1 }); quiet = 2.6 / speed * .5 + .9; }
    g.key = function(k, down){ if(!down || !alive) return false; var d = isDir(k); if(!d) return false; if(turnT > 0) return true; if(d === 'L') lane = Math.max(0, lane - 1); if(d === 'R') lane = Math.min(2, lane + 1); if(d === 'U' && !jump && !slide) jump = .6; if(d === 'D' && !jump && !slide) slide = .6; return true; };
    g.pointer = function(){};
    g.peek = function(){ return { lane:lane, speed:speed, dist:Math.floor(dist), candles:candles, objs:objs.length, alive:alive, jump:jump, slide:slide, threat:threat, halls:halls, theme:theme, turning:turnT > 0, turnT:+turnT.toFixed(2), light:+light.toFixed(2), bats:bats.length, kinds:objs.map(function(o){ return o.k; }) }; };
    g.dbg = { turn:function(d){ turnHall(d || 1); }, spawn:function(k, l){ objs.push({ k:k, l:l == null ? 1 : l, z:.001 }); }, light:function(){ light = 1; } };
    function hit(){ if(stumble > 0) return; stumble = .55; threat += .5; speed = Math.max(.42, speed*.82); if(threat >= 1){ alive = false; api.over(dist > 2500 ? 'The ghosts caught up after a long run' : 'The ghosts got you'); } }
    function turnHall(dir){ turnDir = dir; turnT = TURN_T; objs = []; quiet = 1.3; halls++; lane = dir < 0 ? 0 : 2; }   /* the runner heads INTO the chosen archway, the screen falls dark inside it, and the next hall swings in from the turn */
    g.update = function(dt){
      if(!alive) return; t += dt; ghostBob += dt; speed = Math.min(1.7, speed + dt*.02); dist += speed*dt*60; tiles = (tiles + speed*dt*1.6) % 1; flick += dt; threat = Math.max(0, threat - dt*.11); if(stumble > 0) stumble -= dt;
      px += (lane - px)*Math.min(1, dt*12); if(jump > 0) jump -= dt; if(slide > 0) slide -= dt;
      if(turnT > 0){ var was = turnT, mid = TURN_T*.55; turnT -= dt; if(was > mid && turnT <= mid){ theme = (theme + 1) % THEMES.length; px = 1; lane = 1; } }
      lightT -= dt; if(lightT <= 0){ light = 1; lightT = rnd(4, 11); } light = Math.max(0, light - dt*2.2);
      dust.forEach(function(d){ d.y += dt*(.05 + d.s*.03); d.x += Math.sin(t*.8 + d.ph)*dt*.02; if(d.y > 1){ d.y = 0; d.x = Math.random(); } });
      batT -= dt; if(batT <= 0){ batT = rnd(5, 12); var bd = Math.random() < .5 ? 1 : -1; for(var bi = 0; bi < ri(2, 4); bi++) bats.push({ x:bd < 0 ? W + 20 + bi*30 : -20 - bi*30, y:rnd(20, HZ*.7), vx:bd*rnd(140, 220), ph:rnd(0, 7) }); }
      bats.forEach(function(b){ b.x += b.vx*dt; b.y += Math.sin(t*6 + b.ph)*30*dt; }); bats = bats.filter(function(b){ return b.x > -60 && b.x < W + 60; });
      if(quiet > 0) quiet -= dt; forkT -= dt;
      if(quiet <= 0){ spawnT -= dt; if(forkT <= 0 && !objs.some(function(o){ return o.k === 'fork' || o.k === 'turn'; })){ fork(); forkT = rnd(8, 13); } else if(spawnT <= 0){ spawn(); spawnT = clamp(1.05 - speed*.32, .38, 1.05); } }
      for(var i = objs.length - 1; i >= 0; i--){ var o = objs[i]; o.z += speed*dt; if(o.z > 1.08){ objs.splice(i, 1); continue; }
        if(!o.hit && o.z > PZ - .03 && o.z < PZ + .03){
          if(o.k === 'fork' || o.k === 'turn'){ o.hit = true; if(o.k === 'fork'){ if(lane === 1){ hit(); if(!alive) return; turnHall(Math.random() < .5 ? -1 : 1); } else turnHall(lane === 0 ? -1 : 1); } else turnHall(o.dir); break; }
          if(Math.abs(o.l - px) < .5){ o.hit = true;
            if(o.k === 'candle'){ candles++; score += 10; o.z = 9; }
            else if((o.k === 'low' && jump > 0) || (o.k === 'high' && slide > 0)) {}
            else { hit(); if(!alive) return; } } } }
      api.score(Math.floor(dist/10) + score); api.status(Math.floor(dist)+' m  \u00b7  '+candles+' candles  \u00b7  '+THEMES[theme].name);
    };
    function lx(l, z){ return W/2 + (l - 1)*LANE*s(z); }
    function ghost(c, x, y, sc, a){ c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(sc, sc); c.fillStyle = '#e8e6f5'; c.beginPath(); c.arc(0, -14, 16, Math.PI, 0); c.lineTo(16, 12); for(var k = 0; k < 4; k++){ c.quadraticCurveTo(12 - k*8, 18 + Math.sin(ghostBob*8 + k)*3, 8 - k*8, 12); } c.closePath(); c.fill(); c.fillStyle = '#1a1424'; c.beginPath(); c.ellipse(-6, -14, 3, 4.5, 0, 0, 7); c.ellipse(6, -14, 3, 4.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, -5, 3, 4, 0, 0, 7); c.fill(); c.restore(); }
    g.draw = function(c){
      var T = THEMES[theme], prog = turnT > 0 ? 1 - turnT/TURN_T : 0, ent = turnT > 0 ? clamp(prog/.45, 0, 1) : 0, ex = turnT > 0 ? clamp((prog - .62)/.38, 0, 1) : 1, exe = 1 - (1 - ex)*(1 - ex);
      var off = turnT > 0 ? (prog < .55 ? -turnDir*ent*ent*W*.25 : turnDir*(1 - exe)*W*.55) : 0, zoom = prog < .55 && turnT > 0 ? 1 + ent*ent*.5 : 1 + (1 - exe)*.08;
      c.fillStyle = T.wall2; c.fillRect(0, 0, W, H);
      c.save(); var zx = turnT > 0 && prog < .55 ? lx(turnDir < 0 ? 0 : 2, PZ) : W/2; c.translate(zx, H*.62); c.scale(zoom, zoom); c.translate(-zx, -H*.62); c.translate(off, 0);
      if(light > 0){ c.fillStyle = 'rgba(190,200,255,'+(light*.22)+')'; c.fillRect(-W, 0, 3*W, H); }
      /* far wall with a moonlit window */
      c.fillStyle = T.wall; c.fillRect(-W, 0, 3*W, HZ);
      c.fillStyle = '#0e0c18'; rr(c, W/2 - 26, HZ - 62, 52, 58, 26); c.fill(); c.fillStyle = '#cfd6ff'; c.beginPath(); c.arc(W/2 + 6, HZ - 40, 12, 0, 7); c.fill(); c.fillStyle = '#0e0c18'; c.beginPath(); c.arc(W/2 + 11, HZ - 43, 11, 0, 7); c.fill(); c.fillStyle = T.trim; c.fillRect(W/2 - 2, HZ - 62, 4, 58); c.fillRect(W/2 - 26, HZ - 34, 52, 3);
      if(light > 0){ c.fillStyle = 'rgba(230,236,255,'+(light*.85)+')'; rr(c, W/2 - 24, HZ - 60, 48, 54, 24); c.fill(); c.strokeStyle = 'rgba(255,255,255,'+light+')'; c.lineWidth = 2; c.beginPath(); c.moveTo(W/2 - 8, HZ - 58); c.lineTo(W/2 + 2, HZ - 40); c.lineTo(W/2 - 4, HZ - 38); c.lineTo(W/2 + 8, HZ - 14); c.stroke(); }
      c.fillStyle = '#5a0f16'; [W*.18, W*.31, W*.71, W*.86].forEach(function(dx, di){ var dl = 14 + ((t*6 + di*9) % 34); c.fillRect(dx - 1.5, 0, 3, dl); c.beginPath(); c.arc(dx, dl, 2.4, 0, 7); c.fill(); });
      /* side walls, wainscot and portraits */
      c.fillStyle = T.wall; c.beginPath(); c.moveTo(-W, H); c.lineTo(-W, 0); c.lineTo(lx(-.5, 0), 0); c.lineTo(lx(-.5, 0), HZ); c.lineTo(lx(-.5, 1), H); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(2*W, H); c.lineTo(2*W, 0); c.lineTo(lx(2.5, 0), 0); c.lineTo(lx(2.5, 0), HZ); c.lineTo(lx(2.5, 1), H); c.closePath(); c.fill();
      c.strokeStyle = T.trim; c.lineWidth = 2; c.beginPath(); c.moveTo(lx(-.5, 0), HZ - 30*s(0)); c.lineTo(lx(-.5, 1) - 60, H - 30*s(1) - 60); c.moveTo(lx(2.5, 0), HZ - 30*s(0)); c.lineTo(lx(2.5, 1) + 60, H - 30*s(1) - 60); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath(); for(var wp = 1; wp <= 4; wp++){ var wy0 = HZ - 30 - wp*(HZ - 30)/5, wy1 = wy0 - 120*wp/5; c.moveTo(lx(-.5, 0), wy0); c.lineTo(lx(-.5, 1) - 60, wy1 - 60); c.moveTo(lx(2.5, 0), wy0); c.lineTo(lx(2.5, 1) + 60, wy1 - 60); } c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx(-.5, .55) - 20, HZ*.3); c.lineTo(lx(-.5, .55) - 8, HZ*.5); c.lineTo(lx(-.5, .55) - 16, HZ*.62); c.lineTo(lx(-.5, .55) - 2, HZ*.8); c.moveTo(lx(2.5, .4) + 14, HZ*.2); c.lineTo(lx(2.5, .4) + 6, HZ*.42); c.lineTo(lx(2.5, .4) + 18, HZ*.55); c.stroke();
      c.strokeStyle = 'rgba(80,20,30,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(lx(-.5, .8) - 30, HZ*.9); c.lineTo(lx(-.5, .8) - 30, HZ*.9 + 60 + Math.sin(t)*6); c.stroke();
      for(var q = 0; q < 5; q++){ var zz = ((q/5) + tiles/5) % 1, sc = s(zz), y = sy(zz); [-1, 1].forEach(function(sd, k){ var x = W/2 + sd*(LANE*1.5*sc + 26*sc + (sd < 0 ? -18 : 18)*sc*.2), py = y - 150*sc; if((q + k) % 2){ c.fillStyle = '#3a2a1a'; c.fillRect(x - 14*sc, py - 18*sc, 28*sc, 36*sc); c.fillStyle = '#6b5a7a'; c.fillRect(x - 10*sc, py - 14*sc, 20*sc, 28*sc); var ey = (px - 1)*2.2*sc; c.fillStyle = '#1a1424'; c.beginPath(); c.arc(x - 4*sc + ey, py - 3*sc, 1.6*sc, 0, 7); c.arc(x + 4*sc + ey, py - 3*sc, 1.6*sc, 0, 7); c.fill(); c.fillStyle = 'rgba(255,60,60,'+(.35 + threat*.5)+')'; c.beginPath(); c.arc(x - 4*sc + ey, py - 3*sc, .7*sc, 0, 7); c.arc(x + 4*sc + ey, py - 3*sc, .7*sc, 0, 7); c.fill(); } else { c.fillStyle = T.trim; c.fillRect(x - 2*sc, py, 4*sc, 14*sc); c.fillStyle = '#f4e3b0'; c.fillRect(x - 3*sc, py - 16*sc, 6*sc, 16*sc); c.fillStyle = 'rgba(255,190,80,'+(.5 + .3*Math.sin(flick*11 + q*2 + k))+')'; c.beginPath(); c.arc(x, py - 20*sc, 5*sc + 1, 0, 7); c.fill(); c.fillStyle = 'rgba(255,170,60,.08)'; c.beginPath(); c.arc(x, py - 20*sc, 40*sc + 8, 0, 7); c.fill(); } }); }
      /* cobwebs */
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; [[0, 0, 1], [W, 0, -1]].forEach(function(w){ for(var r = 1; r <= 3; r++){ c.beginPath(); c.arc(w[0], w[1], r*22, w[2] > 0 ? 0 : Math.PI/2, w[2] > 0 ? Math.PI/2 : Math.PI); c.stroke(); } for(var a = 0; a <= 4; a++){ var an = (w[2] > 0 ? 0 : Math.PI/2) + a*Math.PI/8; c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[0] + Math.cos(an)*66, w[1] + Math.sin(an)*66); c.stroke(); } });
      /* floorboards */
      c.fillStyle = T.floor; c.beginPath(); c.moveTo(lx(-.5, 0), HZ); c.lineTo(lx(2.5, 0), HZ); c.lineTo(lx(2.5, 1), H); c.lineTo(lx(-.5, 1), H); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; for(var k2 = 0; k2 < 12; k2++){ var z = ((k2 + tiles) / 12), yy = sy(z); c.beginPath(); c.moveTo(lx(-.5, z), yy); c.lineTo(lx(2.5, z), yy); c.stroke(); }
      [-.5, .5, 1.5, 2.5].forEach(function(l){ c.beginPath(); c.moveTo(lx(l, 0), HZ); c.lineTo(lx(l, 1), H); c.stroke(); });
      c.fillStyle = T.rug; c.globalAlpha = .75; c.beginPath(); c.moveTo(lx(.58, 0), HZ); c.lineTo(lx(1.42, 0), HZ); c.lineTo(lx(1.42, 1), H); c.lineTo(lx(.58, 1), H); c.closePath(); c.fill(); c.globalAlpha = 1; c.strokeStyle = 'rgba(255,209,102,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx(.62, 0), HZ); c.lineTo(lx(.62, 1), H); c.moveTo(lx(1.38, 0), HZ); c.lineTo(lx(1.38, 1), H); c.stroke();
      c.fillStyle = 'rgba(255,209,102,.18)'; for(var rk = 0; rk < 8; rk++){ var rz = ((rk + tiles*.5) / 8), ry = sy(rz), rs = s(rz); c.beginPath(); c.moveTo(lx(1, rz), ry - 7*rs); c.lineTo(lx(1, rz) + 7*rs, ry); c.lineTo(lx(1, rz), ry + 7*rs); c.lineTo(lx(1, rz) - 7*rs, ry); c.closePath(); c.fill(); }
      var fogG = c.createLinearGradient(0, HZ - 40, 0, HZ + 120); fogG.addColorStop(0, 'rgba(120,110,150,.32)'); fogG.addColorStop(1, 'rgba(120,110,150,0)'); c.fillStyle = fogG; c.fillRect(lx(-.5, 0) - 60, HZ - 40, lx(2.5, 0) - lx(-.5, 0) + 120, 160);
      /* objects far to near */
      objs.slice().sort(function(a, b){ return a.z - b.z; }).forEach(function(o){ if(o.z <= 0 || o.z > 1.05) return; var sc = s(o.z), y = sy(o.z), x = lx(o.l, o.z), w = LANE*.82*sc;
        if(o.k === 'fork' || o.k === 'turn'){ var x0 = lx(-.5, o.z), x1 = lx(2.5, o.z), wh = 190*sc; c.fillStyle = T.wall; c.fillRect(x0, y - wh, x1 - x0, wh); c.fillStyle = T.trim; c.fillRect(x0, y - wh, x1 - x0, 6*sc); c.fillRect(x0, y - 30*sc, x1 - x0, 3*sc);
          var arch = function(ax){ c.fillStyle = '#07060c'; c.beginPath(); c.moveTo(ax - w/2, y); c.lineTo(ax - w/2, y - 120*sc); c.arc(ax, y - 120*sc, w/2, Math.PI, 0); c.lineTo(ax + w/2, y); c.closePath(); c.fill(); c.strokeStyle = T.trim; c.lineWidth = 3*sc; c.stroke(); };
          if(o.k === 'fork'){ arch(lx(0, o.z)); arch(lx(2, o.z)); c.fillStyle = '#3a2a1a'; c.fillRect(x - 24*sc, y - 150*sc, 48*sc, 60*sc); c.fillStyle = '#6b5a7a'; c.fillRect(x - 18*sc, y - 144*sc, 36*sc, 48*sc); c.fillStyle = '#ff5f57'; c.beginPath(); c.arc(x - 7*sc, y - 122*sc, 2.5*sc, 0, 7); c.arc(x + 7*sc, y - 122*sc, 2.5*sc, 0, 7); c.fill(); }
          else { arch(lx(o.dir < 0 ? 0 : 2, o.z)); c.fillStyle = '#f4e3b0'; c.font = '800 '+Math.max(8, 34*sc)+'px '+FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.dir < 0 ? '\u2190' : '\u2192', x, y - 100*sc); }
          return; }
        if(o.k === 'candle'){ c.fillStyle = '#f4e3b0'; c.fillRect(x - 3*sc, y - 26*sc, 6*sc, 20*sc); c.fillStyle = 'rgba(255,190,80,'+(.6 + .3*Math.sin(flick*10 + o.z*7))+')'; c.beginPath(); c.arc(x, y - 30*sc, 5*sc + .5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,170,60,.1)'; c.beginPath(); c.arc(x, y - 30*sc, 22*sc + 4, 0, 7); c.fill(); }
        else if(o.k === 'low'){ c.fillStyle = '#4a3222'; c.beginPath(); c.moveTo(x - w/2, y); c.lineTo(x - w*.42, y - 34*sc); c.lineTo(x + w*.42, y - 34*sc); c.lineTo(x + w/2, y); c.closePath(); c.fill(); c.fillStyle = '#c9c2b8'; c.fillRect(x - 2*sc, y - 30*sc, 4*sc, 22*sc); c.fillRect(x - 8*sc, y - 24*sc, 16*sc, 4*sc); }
        else if(o.k === 'high'){ /* a witch on her broom, hovering at head height: slide under her */ var wy = y - 128*sc + Math.sin(t*5 + o.z*9)*6*sc, wb = Math.sin(t*7 + o.z*4)*.12;
          c.fillStyle = 'rgba(120,255,120,.10)'; c.beginPath(); c.arc(x, wy - 20*sc, w*.7, 0, 7); c.fill();
          c.save(); c.translate(x, wy); c.rotate(wb); c.scale(sc, sc);
          c.strokeStyle = '#7a4a1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(-w/sc*.55, 6); c.lineTo(w/sc*.45, 2); c.stroke(); c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(w/sc*.42, -6); c.lineTo(w/sc*.75, -12); c.lineTo(w/sc*.78, 14); c.lineTo(w/sc*.42, 10); c.closePath(); c.fill();
          c.fillStyle = '#1a1424'; c.beginPath(); c.moveTo(-16, 4); c.lineTo(-6, -40); c.lineTo(14, -40); c.lineTo(22, 4); c.closePath(); c.fill(); c.fillRect(-26, -4, 20, 6); c.fillStyle = '#5a3a7a'; c.fillRect(-14, -10, 30, 5);
          c.fillStyle = '#7fd66a'; c.beginPath(); c.arc(4, -50, 11, 0, 7); c.fill(); c.fillStyle = '#5a9a4a'; c.beginPath(); c.moveTo(13, -50); c.lineTo(20, -47); c.lineTo(13, -45); c.closePath(); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(0, -52, 1.6, 0, 7); c.arc(8, -52, 1.6, 0, 7); c.fill(); c.fillStyle = '#7a1f1f'; c.fillRect(0, -45, 8, 2);
          c.fillStyle = '#1a1424'; c.beginPath(); c.moveTo(-14, -58); c.lineTo(22, -58); c.lineTo(10, -62); c.lineTo(6, -94); c.lineTo(-2, -62); c.closePath(); c.fill(); c.fillStyle = '#c084fc'; c.fillRect(-2, -64, 12, 3);
          c.fillStyle = '#7a7a86'; c.beginPath(); c.arc(-40, 8, 4, 0, 7); c.fill(); c.fillStyle = 'rgba(200,120,255,.7)'; for(var wi = 1; wi <= 4; wi++){ c.beginPath(); c.arc(-w/sc*.6 - wi*12, 4 + Math.sin(t*12 + wi)*5, 2.2, 0, 7); c.fill(); }
          c.restore(); }
        else { c.fillStyle = '#8c8c9a'; rr(c, x - w*.32, y - 140*sc, w*.64, 140*sc, 6*sc); c.fill(); c.fillStyle = '#5a5a68'; rr(c, x - w*.22, y - 168*sc, w*.44, 40*sc, 8*sc); c.fill(); c.fillStyle = '#111'; c.fillRect(x - w*.14, y - 154*sc, w*.28, 6*sc); c.fillStyle = '#6e6e7c'; rr(c, x - w*.4, y - 130*sc, w*.16, 70*sc, 5*sc); c.fill(); rr(c, x + w*.24, y - 130*sc, w*.16, 70*sc, 5*sc); c.fill(); c.strokeStyle = '#c9c2b8'; c.lineWidth = 3*sc; c.beginPath(); c.moveTo(x + w*.32, y - 180*sc); c.lineTo(x + w*.32, y - 20*sc); c.stroke(); c.fillStyle = '#c9c2b8'; c.beginPath(); c.moveTo(x + w*.32, y - 196*sc); c.lineTo(x + w*.22, y - 176*sc); c.lineTo(x + w*.42, y - 176*sc); c.closePath(); c.fill(); } });
      c.restore();
      /* dust motes and bats */
      dust.forEach(function(d){ c.fillStyle = 'rgba(255,255,255,'+(.10 + .12*Math.sin(t*2 + d.ph))+')'; c.beginPath(); c.arc(d.x*W, HZ*.2 + d.y*H*.75, d.s, 0, 7); c.fill(); });
      bats.forEach(function(b){ var fl = Math.sin(t*22 + b.ph)*7; c.fillStyle = '#0a0810'; c.beginPath(); c.moveTo(b.x - 14, b.y - fl); c.quadraticCurveTo(b.x - 7, b.y - 4, b.x, b.y); c.quadraticCurveTo(b.x + 7, b.y - 4, b.x + 14, b.y - fl); c.lineTo(b.x + 6, b.y + 3); c.lineTo(b.x, b.y + 1); c.lineTo(b.x - 6, b.y + 3); c.closePath(); c.fill(); c.fillStyle = '#ff5f57'; c.fillRect(b.x - 2, b.y - 1, 1.5, 1.5); c.fillRect(b.x + 1, b.y - 1, 1.5, 1.5); });
      var vg = c.createRadialGradient(W/2, H*.55, H*.25, W/2, H*.55, H*.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      /* running through the doorway: it swallows the screen, a beat of dark with the name of the next hall, then the new hall swings in */
      if(turnT > 0){ var dx0 = lx(turnDir < 0 ? 0 : 2, PZ) + off*zoom, dw = LANE*.82*s(PZ)*.5 + ent*ent*W*1.5, dy = H;
        if(prog < .55){ c.fillStyle = '#07060c'; c.beginPath(); c.moveTo(dx0 - dw, dy); c.lineTo(dx0 - dw, dy - dw*1.6); c.arc(dx0, dy - dw*1.6, dw, Math.PI, 0); c.lineTo(dx0 + dw, dy); c.closePath(); c.fill(); c.strokeStyle = T.trim; c.lineWidth = 4; c.globalAlpha = 1 - ent; c.stroke(); c.globalAlpha = 1; }
        else { c.fillStyle = 'rgba(7,6,12,'+(1 - exe)+')'; c.fillRect(0, 0, W, H); }
        var cap = prog < .3 ? 0 : prog < .5 ? (prog - .3)/.2 : prog < .8 ? 1 : 1 - (prog - .8)/.2; if(cap > 0){ c.globalAlpha = cap; text(c, turnDir < 0 ? '\u2190' : '\u2192', W/2, H*.4, 40, '#f4e3b0', 'center', 800); text(c, prog >= .55 ? THEMES[theme].name : '', W/2, H*.4 + 44, 20, '#fff', 'center', 800); text(c, prog >= .55 ? 'hall '+(halls + 1) : '', W/2, H*.4 + 68, 12, 'rgba(255,255,255,.6)', 'center', 600); c.globalAlpha = 1; } }
      /* player */
      var pz = PZ, ps = s(pz), pxx = lx(px, pz), py = sy(pz), lift = jump > 0 ? Math.sin(Math.PI*(1 - jump/.6))*105*ps : 0, sq = slide > 0 ? .5 : 1, bob = Math.abs(Math.sin(t*14))*4*ps, tilt = stumble > 0 ? Math.sin(stumble*12)*.25 : 0;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(pxx, py, 22*ps, 6*ps, 0, 0, 7); c.fill();
      c.save(); c.translate(pxx, py - lift - bob); c.rotate(tilt); c.scale(1, sq);
      c.fillStyle = '#4a2a6a'; rr(c, -14*ps, -60*ps, 28*ps, 40*ps, 6*ps); c.fill();
      c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(0, -72*ps, 12*ps, 0, 7); c.fill(); c.fillStyle = '#2b1a10'; rr(c, -12*ps, -84*ps, 24*ps, 10*ps, 4*ps); c.fill();
      c.fillStyle = '#2b2b33'; var lg = Math.sin(t*14)*8*ps; rr(c, -12*ps, -22*ps, 10*ps, 22*ps + lg, 3*ps); c.fill(); rr(c, 2*ps, -22*ps, 10*ps, 22*ps - lg, 3*ps); c.fill();
      c.fillStyle = '#f4e3b0'; c.fillRect(14*ps, -50*ps, 4*ps, 14*ps); c.fillStyle = 'rgba(255,190,80,.9)'; c.beginPath(); c.arc(16*ps, -53*ps, 4*ps, 0, 7); c.fill();
      c.restore();
      /* the ghosts: they lurk at the bottom and rise the more you stumble */
      var gy = H - 6 - threat*150, sc2 = .9 + threat*.5; ghost(c, W*.32, gy + Math.sin(ghostBob*3)*8, sc2, .55 + threat*.4); ghost(c, W*.68, gy + 10 + Math.cos(ghostBob*2.6)*8, sc2*.9, .5 + threat*.4); ghost(c, W*.5, gy + 26 + Math.sin(ghostBob*3.4 + 1)*6, sc2*1.1, .45 + threat*.45);
      if(threat > 0){ c.fillStyle = 'rgba(180,170,230,'+(threat*.18)+')'; c.fillRect(0, 0, W, H); }
            if(dist < 60) text(c, api.touch ? 'swipe left, right, up or down' : 'arrows dodge, up jumps, down slides', W/2, H*.22, 14, 'rgba(255,255,255,.85)', 'center');
      else if(halls === 0 && objs.some(function(o){ return o.k === 'fork' && o.z > .3; })) text(c, 'a fork: pick a side', W/2, H*.22, 15, '#f4e3b0', 'center', 800);
    };
    return g;
  }

/* tigOS arcade games.js, part 10: kong. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Kong (girders, ladders and barrels) ---------- */
  function kong(api){
    var W = api.W, H = api.H, g = {}, GIR = [536, 452, 368, 284, 200, 116], TOP = 56, p, barrels, level, lives, score, spawnT, spd, hammer, hamPick, elapsed, kongArm, flash, ladders, safeT, win, open, gapW, conf, hearts, pen, WIN_T = 2.8;
    var GRAV = 1000, SPEED = 96, JUMP = -290, PW = 16, PH = 22;
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
      hamPick = { x:hxx, gi:hg, taken:false }; }
    g.reset = function(){ level = 1; lives = 3; score = 0; api.score(0); startLevel(); };
    function startLevel(){ p = { x:90, y:GIR[0], vy:0, dir:1, air:false, climb:null, dead:0 }; barrels = []; spawnT = 1.2; spd = 95 + (level - 1)*16; hammer = 0; elapsed = 0; kongArm = 0; flash = 0; safeT = 1.5; win = 0; conf = []; hearts = []; pen = null; buildLadders(); api.status('level '+level+'  \u00b7  lives '+lives); }
    g.key = function(k, down){ var d = isDir(k); if(k === ' ' || k === 'z' || k === 'Z' || k === 'x' || k === 'X'){ if(down) jumpNow(); return true; } if(!d) return false; g.held = g.held || {}; g.held[d] = down; return true; };
    function jumpNow(){ if(!p || p.dead || win || p.air || p.climb || hammer > 0) return; p.vy = JUMP; p.air = true; }
    g.pointer = function(type){ if(type === 'down') jumpNow(); };
    g.peek = function(){ return { x:p.x, y:p.y, barrels:barrels.length, level:level, lives:lives, hammer:hammer, climb:!!p.climb, air:p.air, win:win, ladders:ladders.map(function(L){ return L.x; }), open:open.slice(1), gaps:gapW.slice(1), hammerAt:{ x:hamPick.x, gi:hamPick.gi }, spd:spd, conf:conf.length, pen:pen ? Math.round(pen.x) : null }; };
    g.dbg = { win:function(){ rescue(); }, level:function(n){ level = n; startLevel(); } };
    function rescue(){ win = WIN_T; flash = .35; var bonus = Math.max(500, 5000 - Math.floor(elapsed/2)*100); score += bonus; api.score(score); api.status('rescued!  +'+bonus); pen = { x:W - 60, y:TOP - 14, vy:0, hop:0 }; for(var i = 0; i < 70; i++) conf.push({ x:rnd(0, W), y:rnd(-H*.6, -10), vx:rnd(-30, 30), vy:rnd(60, 160), rot:rnd(0, 7), vr:rnd(-6, 6), col:['#ffd166', '#ff5f57', '#4ad3ff', '#8fd46a', '#c084fc', '#fff'][i % 6], w:rnd(4, 8), h:rnd(3, 5) }); }
    function girderAt(y){ for(var i = 0; i < GIR.length; i++) if(Math.abs(GIR[i] - y) < 2) return i; return -1; }
    function ladderNear(x, gi, up){ for(var i = 0; i < ladders.length; i++){ var L = ladders[i]; if(Math.abs(L.x - x) < 9 && ((up && L.a === gi) || (!up && L.b === gi))) return L; } return null; }
    g.update = function(dt){
      var h = g.held || {}; elapsed += dt; kongArm = Math.max(0, kongArm - dt); flash = Math.max(0, flash - dt); safeT = Math.max(0, safeT - dt);
      if(win){ win -= dt; var wk = 1 - win/WIN_T;
        conf.forEach(function(q){ q.x += (q.vx + Math.sin(elapsed*3 + q.rot)*20)*dt; q.y += q.vy*dt; q.rot += q.vr*dt; }); conf = conf.filter(function(q){ return q.y < H + 10; });
        hearts.forEach(function(q){ q.t += dt; q.y -= 40*dt; q.x += Math.sin(q.t*5)*12*dt; }); hearts = hearts.filter(function(q){ return q.t < 1.4; });
        if(pen){ var tx = p.x + 18*p.dir; if(wk > .15){ pen.hop += dt; pen.x += (tx - pen.x)*Math.min(1, dt*3); pen.y = Math.min(TOP - 14, TOP - 14 - Math.abs(Math.sin(pen.hop*9))*10); } if(Math.random() < dt*6) hearts.push({ x:(pen.x + p.x)/2 + rnd(-16, 16), y:TOP - 30 + rnd(-6, 6), t:0 }); }
        if(win <= 0){ level++; startLevel(); } return; }
      if(p.dead){ p.dead -= dt; if(p.dead <= 0){ if(lives <= 0){ api.over('Kong wins this round'); return; } p = { x:90, y:GIR[0], vy:0, dir:1, air:false, climb:null, dead:0 }; hammer = 0; safeT = 1.5; api.status('level '+level+'  \u00b7  lives '+lives); } return; }
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
        if(!hamPick.taken && !p.air && gi === hamPick.gi && Math.abs(p.x - hamPick.x) < 14){ hamPick.taken = true; hammer = Math.max(5, 8.5 - level*.5); api.status('hammer time'); }
      }
      /* barrels */
      spawnT -= dt; if(spawnT <= 0){ spawnT = clamp(2.6 - level*.25, 1.1, 2.6) + rnd(-.3, .3); barrels.push({ x:110, y:GIR[5], vx:spd, vy:0, gi:5, air:false, r:9, rot:0, jumped:false, ladder:null, gd:Math.random() < .2 }); kongArm = .5; if(level >= 3 && Math.random() < .12 + level*.03) barrels.push({ x:90, y:GIR[5], vx:spd*.9, vy:0, gi:5, air:false, r:9, rot:0, jumped:false, ladder:null, gd:false }); }
      for(var b = barrels.length - 1; b >= 0; b--){ var k = barrels[b]; k.rot += k.vx*dt/9;
        if(k.ladder){ k.y += 70*dt; if(k.y >= GIR[k.ladder.a]){ k.y = GIR[k.ladder.a]; k.gi = k.ladder.a; k.vx = rollDir(k.gi)*spd; k.ladder = null; } }
        else if(k.air){ k.vy += GRAV*dt; k.y += k.vy*dt; k.x += k.vx*dt*.35; for(var j = k.gi - 1; j >= 0; j--){ if(k.y >= GIR[j] && k.y - k.vy*dt <= GIR[j]){ var gx2 = girderX(j); if(k.x > gx2.x0 - 6 && k.x < gx2.x1 + 6){ k.y = GIR[j]; k.gi = j; k.air = false; k.vy = 0; k.vx = rollDir(j)*spd; break; } } } if(k.y > H + 30){ barrels.splice(b, 1); continue; } }
        else { k.x += k.vx*dt; var gx3 = girderX(k.gi); if(k.x < gx3.x0 - 2 || k.x > gx3.x1 + 2 || (k.gi === 0 && (k.x < 12 || k.x > W - 12))){ if(k.gi === 0){ barrels.splice(b, 1); continue; } k.air = true; k.vy = 0; }
          if(!k.lad && Math.random() < dt*(5 + level*1.5)){ for(var q = 0; q < ladders.length; q++){ var L2 = ladders[q]; if(L2.b === k.gi && Math.abs(L2.x - k.x) < 4){ k.ladder = L2; k.lad = true; break; } } } }
        /* interactions */
        if(hammer > 0 && !p.dead && Math.abs(k.x - (p.x + p.dir*14)) < 16 && Math.abs(k.y - p.y) < 20){ barrels.splice(b, 1); score += k.gd ? 500 : 300; api.score(score); flash = .12; continue; }
        if(!k.jumped && p.air && Math.abs(k.x - p.x) < 12 && p.y < k.y - 12 && p.y > k.y - 60){ k.jumped = true; score += k.gd ? 200 : 100; api.score(score); }
        if(!p.dead && safeT <= 0 && Math.abs(k.x - p.x) < PW/2 + k.r - 3 && k.y - k.r < p.y && k.y + k.r > p.y - PH + 4){ die(); return; }
      }
    };
    function die(){ lives--; p.dead = 1.4; p.climb = null; api.status(lives > 0 ? 'ouch  \u00b7  lives '+lives : 'no lives left'); }
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
        c.fillStyle = '#2a6df4'; rr(c, -7, -16, 14, 12, 3); c.fill(); c.fillStyle = '#e24b4b'; rr(c, -7, -24, 14, 9, 4); c.fill(); c.fillStyle = '#f2c9a0'; c.fillRect(-5, -18, 10, 5); c.fillStyle = '#e24b4b'; var run = (!p.air && !p.climb && (g.held || {}).L || (g.held || {}).R) ? Math.sin(elapsed*16)*3 : 0; c.fillRect(-6, -5, 5, 5 + run); c.fillRect(1, -5, 5, 5 - run);
        if(hammer > 0){ var sw = Math.sin(elapsed*12) > 0; c.fillStyle = '#b5651d'; c.fillRect(6, sw ? -30 : -14, 3, 16); c.fillStyle = '#c9c9d4'; c.fillRect(2, sw ? -36 : -2, 14, 8); }
        c.restore(); }
      if(flash > 0){ c.fillStyle = 'rgba(255,209,102,'+Math.min(1, flash*2)+')'; c.fillRect(0, 0, W, H); }
      /* hud line */
      text(c, 'L'+level+'  lives '+lives + (hammer > 0 ? '  hammer '+Math.ceil(hammer) : ''), 8, 12, 11, 'rgba(255,255,255,.7)');
      if(elapsed < 3 && level === 1) text(c, api.touch ? 'pad moves and climbs, tap jumps' : 'arrows move and climb, space jumps', W/2, 30, 13, 'rgba(255,255,255,.85)', 'center');
    };
    return g;
  }

/* tigOS arcade games.js, part 11: tanks. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Tanks (artillery, fuel, coins and a shop between rounds) ---------- */
  function tanks(api){
    var W = api.W, H = api.H, g = {}, ter, me, foes, shots, wind, phase, turn, round, score, coins, aimDrag, cpuT, msg, msgT, parts, smoke, rings, debris, shake, timers, held, upg, shopSel, nukeArmed, fuel, fuelMax, kills, D, diffSel;
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
    function genTer(){ ter = []; var a = rnd(0, 6), b = rnd(0, 6), c2 = rnd(0, 6); for(var x = 0; x < W; x++){ var y = H*.62 + Math.sin(x/90 + a)*28 + Math.sin(x/37 + b)*12 + Math.sin(x/160 + c2)*40; ter.push(clamp(y, H*.35, H*.9)); } for(var s = 0; s < 2; s++) for(var i = 1; i < W - 1; i++) ter[i] = (ter[i-1] + ter[i] + ter[i+1]) / 3; }
    function ground(t){ t.y = ter[Math.round(clamp(t.x, 0, W - 1))]; }
    function say(s){ msg = s; msgT = 2.2; }
    g.reset = function(){ round = 1; score = 0; coins = 0; kills = 0; api.score(0); upg = { repair:0, fuel:0, armor:0, big:0, guide:0, double:0, nuke:0 }; me = { hp:100, max:100, ang:45, pow:60, col:'#63e6be', x:80, y:0, name:'you' }; D = DIFFS[1]; diffSel = 1; genTer(); ground(me); foes = []; shots = []; parts = []; smoke = []; rings = []; debris = []; timers = []; shake = 0; wind = 0; held = {}; nukeArmed = false; refuel(); turn = -1; msg = ''; msgT = 0; phase = 'diff'; api.status('choose a difficulty  \u00b7  up/down, space starts'); };
    function pickDiff(i){ D = DIFFS[i]; diffSel = i; newRound(); say(D.name+' \u00b7 round 1  \u00b7  wind '+windTxt()); }
    function newRound(){ genTer(); me.x = ri(50, 120); ground(me); me.dead = false; me.hp = Math.min(me.max, me.hp + 25); var n = Math.min(3, 1 + Math.floor((round - 1) / 2)); foes = []; for(var i = 0; i < n; i++){ var f = { hp:D.hp, max:D.hp, ang:135, pow:60, col:FOE_COL[i], err:Math.max(.04, D.err - round*.03 - i*.02), x:Math.round(W*(.5 + (i + 1) / (n + 1) * .46)), name:'cpu '+(i + 1), fuelMax:D.fuel + round*2, fuel:D.fuel + round*2, drive:null }; ground(f); foes.push(f); }
      shots = []; parts = []; smoke = []; rings = []; debris = []; timers = []; shake = 0; wind = ri(-25, 25); aimDrag = null; cpuT = 0; held = {}; nukeArmed = false; phase = 'play'; turn = -1; refuel(); say('round '+round+'  \u00b7  '+n+' enem'+(n > 1 ? 'ies' : 'y')+'  \u00b7  wind '+windTxt()); status(); }
    function refuel(){ fuelMax = D.fuel + upg.fuel*12; fuel = fuelMax; }
    function windTxt(){ return (wind > 0 ? '\u2192 ' : wind < 0 ? '\u2190 ' : '')+Math.abs(wind); }
    function status(){ api.status(phase === 'diff' ? 'choose a difficulty  \u00b7  up/down, space starts' : phase === 'shop' ? 'shop  \u00b7  '+coins+' coins' : 'angle '+Math.round(me.ang)+'\u00b0  power '+Math.round(me.pow)+'  fuel '+Math.ceil(fuel)+'  \u00b7  '+coins+' coins'); }
    function myTurn(){ return phase === 'play' && turn === -1 && !shots.length && !me.dead; }
    g.key = function(k, down){
      if(phase === 'diff'){ if(!down) return true; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ diffSel = (diffSel + 3) % 4; return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ diffSel = (diffSel + 1) % 4; return true; } if(/^[1-4]$/.test(k)){ diffSel = +k - 1; return true; } if(k === ' ' || k === 'Enter'){ pickDiff(diffSel); return true; } return /^Arrow/.test(k); }
      if(phase === 'shop'){ if(!down) return true; var rows = SHOP.length + 1; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ shopSel = (shopSel + rows - 1) % rows; return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ shopSel = (shopSel + 1) % rows; return true; } if(k === ' ' || k === 'Enter'){ shopPick(shopSel); return true; } return /^Arrow/.test(k); }
      if(k === ' ' || k === 'Enter'){ if(down && myTurn()) fire(me); return true; }
      if(k === 'n' || k === 'N'){ if(down && myTurn() && upg.nuke > 0){ nukeArmed = !nukeArmed; say(nukeArmed ? 'nuke armed' : 'nuke stowed'); } return true; }
      var m = { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', ArrowDown:'D', w:'PU', W:'PU', s:'PD', S:'PD' }[k]; if(!m) return false; held[m] = down; return true; };
    g.pointer = function(type, x, y){
      if(phase === 'diff'){ if(type !== 'down') return; var drow = Math.floor((y - diffTop()) / 46); if(drow >= 0 && drow < 4){ if(drow === diffSel) pickDiff(drow); else diffSel = drow; } return; }
      if(phase === 'shop'){ if(type !== 'down') return; var row = Math.floor((y - shopTop()) / 34); if(row >= 0 && row <= SHOP.length){ if(row === shopSel) shopPick(row); else shopSel = row; } return; }
      if(!myTurn()) return;
      if(type === 'down') aimDrag = { moved:false, x0:x, y0:y };
      if(aimDrag && type === 'move' && (aimDrag.moved || Math.hypot(x - aimDrag.x0, y - aimDrag.y0) > 6)){ aimDrag.moved = true; var dx = x - me.x, dy = (me.y - 16) - y; if(Math.hypot(dx, dy) > 8){ me.ang = clamp(Math.atan2(dy, dx)*180/Math.PI, 0, 180); me.pow = clamp(Math.hypot(dx, dy)/2.4, 15, 100); status(); } }   /* a plain click never fires: only a real drag from the press point aims and lets go */
      if(type === 'up' && aimDrag){ var mv = aimDrag.moved; aimDrag = null; if(mv) fire(me); } };
    g.dbg = { killFoes:function(){ foes.forEach(function(f){ f.hp = 0; }); }, coins:function(n){ coins = n; status(); }, diff:function(i){ if(phase === 'diff') pickDiff(i); } };
    g.peek = function(){ return { turn:turn, phase:phase, shots:shots.length, meHp:me.hp, foes:foes.map(function(f){ return f.hp; }), round:round, wind:wind, ang:me.ang, pow:me.pow, fuel:fuel, fuelMax:fuelMax, coins:coins, upg:upg, x:me.x, shopSel:shopSel, diff:D.id, diffSel:diffSel, foeX:foes.map(function(f){ return Math.round(f.x); }), foeFuel:foes.map(function(f){ return +f.fuel.toFixed(1); }), foeFuelMax:foes.map(function(f){ return f.fuelMax; }) }; };
    function fire(t){ if(shots.length) return; var big = t === me && upg.big > 0, nuke = t === me && nukeArmed && upg.nuke > 0; if(nuke){ upg.nuke--; nukeArmed = false; }
      var angs = t === me && upg.double > 0 && !nuke ? [t.ang - 2.5, t.ang + 2.5] : [t.ang];
      angs.forEach(function(ang){ var a = ang*Math.PI/180, v = t.pow*5.2; shots.push({ x:t.x + Math.cos(a)*18, y:t.y - 16 - Math.sin(a)*18, vx:Math.cos(a)*v, vy:-Math.sin(a)*v, from:t, trail:[], t:0, big:big, nuke:nuke }); }); }
    function boom(x, y, size, col){ var n = Math.round(16*size); for(var i = 0; i < n; i++){ var a = rnd(0, 7), sp = rnd(60, 220)*size; parts.push({ x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 80*size, t:0, life:rnd(.35, .8), col:Math.random() < .5 ? '#ffd166' : (col || '#ff8a00') }); }
      for(var k = 0; k < Math.round(7*size); k++) smoke.push({ x:x + rnd(-8, 8)*size, y:y + rnd(-8, 8)*size, r:rnd(6, 12)*size, vx:rnd(-20, 20), vy:rnd(-50, -15), t:0, life:rnd(.9, 1.6)*Math.sqrt(size) });
      rings.push({ x:x, y:y, t:0, life:.45*Math.sqrt(size), r:30*size }); rings.push({ x:x, y:y, t:0, life:.18, r:14*size, flash:true }); shake = Math.min(24, shake + 5*size); }
    function crater(x, y, r){ for(var i = Math.max(0, Math.floor(x - r)); i < Math.min(W, x + r); i++){ var d = Math.sqrt(Math.max(0, r*r - (i - x)*(i - x))); ter[i] = Math.min(H*.95, Math.max(ter[i], y + d*.9)); } ground(me); foes.forEach(ground); }
    function damage(t, n){ if(t.dead) return; t.hp -= n; t.flash = .3; }
    function wreck(t){ t.dead = true; t.hp = 0; boom(t.x, t.y - 10, 1.6, t.col); timers.push({ t:.22, fn:function(){ boom(t.x - 10, t.y - 16, 1.2); } }); timers.push({ t:.48, fn:function(){ boom(t.x + 8, t.y - 6, 2.2); } });
      for(var i = 0; i < 9; i++) debris.push({ x:t.x, y:t.y - 10, vx:rnd(-150, 150), vy:rnd(-320, -120), rot:rnd(0, 7), vr:rnd(-9, 9), t:0, life:rnd(1.2, 2.2), w:rnd(4, 10), h:rnd(3, 6), col:t.col }); t.smokeT = 3; }
    function shopTop(){ return H*.5 - (SHOP.length + 1)*17 + 26; }
    function diffTop(){ return H*.5 - 4*23 + 22; }
    function shopPick(row){ if(row === SHOP.length){ phase = 'play'; newRound(); return; } var it = SHOP[row];
      if(it.max && upg[it.id] >= it.max){ say('already maxed'); return; } if(it.id === 'repair' && me.hp >= me.max){ say('hull is already full'); return; } if(coins < it.cost){ say('not enough coins ('+it.cost+')'); return; }
      coins -= it.cost; upg[it.id]++; if(it.id === 'repair') me.hp = me.max; if(it.id === 'armor'){ me.max += 30; me.hp = me.max; } say(it.name+' bought'); status(); }
    function cpuAim(f){ var dx = me.x - f.x, dy = f.y - me.y, ang = rnd(112, 152), a = ang*Math.PI/180, R = Math.abs(dx) + dy*.6; var v = Math.sqrt(Math.abs(R*G / Math.sin(2*a))) || 200; v -= wind*.9; v *= 1 + rnd(-f.err, f.err); f.ang = ang; f.pow = clamp(v/5.2, 20, 100); fire(f); }
    function endTurn(){
      var died = false; [me].concat(foes).forEach(function(t){ if(t.hp <= 0 && !t.dead){ wreck(t); died = true; if(t !== me){ kills++; var ck = Math.round(80*D.coin); coins += ck; score += 300; api.score(score); say(t.name+' destroyed  +'+ck+' coins'); } } });
      if(me.dead){ phase = 'dead'; timers.push({ t:1.8, fn:function(){ api.over(round > 3 ? 'Outgunned after '+(round - 1)+' rounds won' : 'Outgunned'); } }); return; }
      if(foes.every(function(f){ return f.dead; })){ var bonus = Math.round((120 + round*25 + Math.floor(me.hp/5))*D.coin); coins += bonus; score += 500 + me.hp*3; api.score(score); round++; say('round won  +'+bonus+' coins'); phase = 'won'; timers.push({ t:1.4, fn:function(){ phase = 'shop'; shopSel = 0; status(); } }); return; }
      var order = [-1].concat(foes.map(function(f, i){ return i; })), cur = order.indexOf(turn), next = turn;
      for(var k = 1; k <= order.length; k++){ var cand = order[(cur + k) % order.length]; if(cand === -1 || !foes[cand].dead){ next = cand; break; } }
      turn = next; cpuT = 0; if(turn === -1){ wind = clamp(wind + ri(-8, 8), -30, 30); refuel(); say('your turn  \u00b7  wind '+windTxt()); status(); } }
    g.update = function(dt){
      if(msgT > 0) msgT -= dt; if(shake > 0) shake = Math.max(0, shake - dt*40);
      for(var i = timers.length - 1; i >= 0; i--){ timers[i].t -= dt; if(timers[i].t <= 0){ var fn = timers[i].fn; timers.splice(i, 1); fn(); } }
      parts.forEach(function(q){ q.t += dt; q.vy += 320*dt; q.x += q.vx*dt; q.y += q.vy*dt; }); parts = parts.filter(function(q){ return q.t < q.life; });
      smoke.forEach(function(q){ q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; q.r += 14*dt; }); smoke = smoke.filter(function(q){ return q.t < q.life; });
      rings.forEach(function(q){ q.t += dt; }); rings = rings.filter(function(q){ return q.t < q.life; });
      debris.forEach(function(q){ q.t += dt; q.vy += 400*dt; q.x += q.vx*dt; q.y += q.vy*dt; q.rot += q.vr*dt; var gi = Math.round(clamp(q.x, 0, W - 1)); if(q.y > ter[gi]){ q.y = ter[gi]; q.vy *= -.3; q.vx *= .6; q.vr *= .5; } }); debris = debris.filter(function(q){ return q.t < q.life; });
      [me].concat(foes).forEach(function(t){ if(t.flash > 0) t.flash -= dt; if(t.smokeT > 0){ t.smokeT -= dt; if(Math.random() < dt*14) smoke.push({ x:t.x + rnd(-6, 6), y:t.y - 12, r:rnd(5, 9), vx:wind*.3 + rnd(-6, 6), vy:rnd(-40, -20), t:0, life:rnd(1, 1.8) }); } });
      if(phase !== 'play') return;
      if(myTurn()){ var moved = false;
        if(held.U) me.ang = clamp(me.ang + 40*dt, 0, 180); if(held.D) me.ang = clamp(me.ang - 40*dt, 0, 180); if(held.PU) me.pow = clamp(me.pow + 30*dt, 15, 100); if(held.PD) me.pow = clamp(me.pow - 30*dt, 15, 100);
        if((held.L || held.R) && fuel > 0){ var dx = (held.R ? 1 : -1)*42*dt, nx = clamp(me.x + dx, 16, W - 16), used = Math.abs(nx - me.x)/4; if(used > fuel){ nx = me.x + (nx - me.x)*(fuel/used); used = fuel; } fuel -= used; me.x = nx; ground(me); moved = true; }
        if(held.U || held.D || held.PU || held.PD || moved) status(); }
      else if(turn >= 0 && !shots.length){ var cf = foes[turn]; cpuT += dt;
        if(!cf.drive){ cf.fuel = cf.fuelMax; var away = Math.abs(me.x - cf.x) < 170, dir = away ? (cf.x > me.x ? 1 : -1) : (Math.random() < .5 ? -1 : 1), want = Math.min(cf.fuel, rnd(3, cf.fuel)); cf.drive = { dir:dir, left:want*4 }; }
        if(cpuT > .25 && cf.drive.left > 0 && cf.fuel > 0){ var step = Math.min(cf.drive.left, 42*dt), nx2 = clamp(cf.x + cf.drive.dir*step, W*.42, W - 16), blocked = foes.some(function(o){ return o !== cf && !o.dead && Math.abs(o.x - nx2) < 30; }) || Math.abs(nx2 - me.x) < 60; if(blocked || nx2 === cf.x){ cf.drive.left = 0; } else { var used2 = Math.abs(nx2 - cf.x)/4; if(used2 > cf.fuel){ nx2 = cf.x + (nx2 - cf.x)*(cf.fuel/used2); used2 = cf.fuel; } cf.fuel -= used2; cf.drive.left -= Math.abs(nx2 - cf.x); cf.x = nx2; ground(cf); if(Math.random() < dt*10) smoke.push({ x:cf.x - cf.drive.dir*14, y:cf.y - 4, r:rnd(2, 4), vx:-cf.drive.dir*20, vy:rnd(-20, -8), t:0, life:rnd(.4, .7) }); } }
        if(cpuT > 1.3 || (cpuT > .9 && cf.drive.left <= 0)){ cf.drive = null; cpuAim(cf); cpuT = 0; } }
      var had = shots.length;
      for(var s = shots.length - 1; s >= 0; s--){ var sh = shots[s]; sh.t += dt; sh.vx += wind*.9*dt; sh.vy += G*dt; sh.x += sh.vx*dt; sh.y += sh.vy*dt; if(sh.trail.length > 18) sh.trail.shift(); sh.trail.push({ x:sh.x, y:sh.y });
        var xi = Math.round(sh.x), done = false, size = sh.nuke ? 3 : sh.big ? 1.5 : 1, R = sh.nuke ? 90 : sh.big ? 55 : 40, base = sh.nuke ? 80 : sh.big ? 30 : 20, direct = sh.nuke ? 90 : sh.big ? 50 : 34, cr = sh.nuke ? 60 : sh.big ? 28 : 18;
        var tanksAll = [me].concat(foes), hitT = null; for(var k = 0; k < tanksAll.length; k++){ var tk = tanksAll[k]; if(tk !== sh.from && !tk.dead && Math.hypot(sh.x - tk.x, sh.y - (tk.y - 10)) < 18){ hitT = tk; break; } }
        if(hitT){ damage(hitT, sh.from === me ? direct : Math.round(direct*D.dmg)); boom(sh.x, sh.y, size*1.2, hitT.col); crater(sh.x, sh.y, cr); done = true; if(sh.from === me){ score += 100; api.score(score); say(sh.nuke ? 'nuclear direct hit' : 'direct hit on '+hitT.name); } else say(hitT === me ? 'you took a hit' : sh.from.name+' hit '+hitT.name); }
        else if(sh.y > H + 40 || sh.x < -60 || sh.x > W + 60 || sh.t > 9){ done = true; say(sh.from === me ? 'missed' : sh.from.name+' missed'); }
        else if(xi >= 0 && xi < W && sh.y >= ter[xi]){ boom(sh.x, sh.y, size); crater(sh.x, sh.y, cr); done = true; var any = false; tanksAll.forEach(function(tk){ if(tk.dead) return; var d = Math.hypot(sh.x - tk.x, sh.y - tk.y); if(d < R){ damage(tk, Math.round(base*(1 - d/R)*(sh.from === me ? 1 : D.dmg))); any = true; } }); say(any ? (sh.from === me ? 'close one' : 'shrapnel') : (sh.from === me ? 'so close' : sh.from.name+' digs a hole')); }
        if(done) shots.splice(s, 1); }
      if(had && !shots.length) endTurn();
    };
    function drawTank(c, t){ c.save(); c.translate(t.x, t.y);
      if(t.dead){ c.fillStyle = '#2a2622'; rr(c, -16, -10, 32, 9, 3); c.fill(); c.fillStyle = '#3a3430'; rr(c, -7, -17, 12, 8, 2); c.fill(); c.strokeStyle = '#3a3430'; c.lineWidth = 3; c.beginPath(); c.moveTo(2, -14); c.lineTo(16, -22); c.stroke(); c.restore(); return; }
      var col = t.flash > 0 && Math.floor(t.flash*20) % 2 ? '#ffffff' : t.col;
      c.fillStyle = col; rr(c, -16, -12, 32, 10, 4); c.fill(); c.fillStyle = '#222'; for(var i = -12; i <= 12; i += 8){ c.beginPath(); c.arc(i, -2, 3.2, 0, 7); c.fill(); } c.fillStyle = col; rr(c, -8, -20, 16, 9, 4); c.fill();
      var a = t.ang*Math.PI/180; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -16); c.lineTo(Math.cos(a)*20, -16 - Math.sin(a)*20); c.stroke(); if(t === me && upg.double){ c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -13); c.lineTo(Math.cos(a - .08)*19, -13 - Math.sin(a - .08)*19); c.stroke(); }
      c.restore();
      c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, t.x - 20, t.y - 34, 40, 5, 2); c.fill(); c.fillStyle = t.hp > t.max*.4 ? '#28c840' : '#ff5f57'; rr(c, t.x - 20, t.y - 34, 40*clamp(t.hp/t.max, 0, 1), 5, 2); c.fill();
      if(t !== me){ text(c, t.name, t.x, t.y - 41, 9, 'rgba(255,255,255,.6)', 'center'); c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, t.x - 20, t.y - 28, 40, 3, 1.5); c.fill(); c.fillStyle = '#ffa94d'; rr(c, t.x - 20, t.y - 28, 40*clamp(t.fuel/t.fuelMax, 0, 1), 3, 1.5); c.fill(); } }
    g.draw = function(c){
      var sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b1b3a'); sky.addColorStop(.6, '#7a3b5e'); sky.addColorStop(1, '#ff9a5c'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.save(); if(shake > 0) c.translate(rnd(-shake, shake)*.5, rnd(-shake, shake)*.5);
      c.fillStyle = 'rgba(255,255,255,.7)'; for(var s = 0; s < 30; s++) c.fillRect((s*97 + 13) % W, (s*53 + 7) % (H*.4), 1.5, 1.5);
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(W*.78, H*.3, 22, 0, 7); c.fill();
      c.beginPath(); c.moveTo(0, H + 40); c.lineTo(0, ter[0]); for(var x = 1; x < W; x++) c.lineTo(x, ter[x]); c.lineTo(W, H + 40); c.closePath(); var tg = c.createLinearGradient(0, H*.3, 0, H); tg.addColorStop(0, '#5f9e4a'); tg.addColorStop(.25, '#4a6b32'); tg.addColorStop(1, '#2a1a10'); c.fillStyle = tg; c.fill();
      c.strokeStyle = '#8fd46a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, ter[0]); for(var x2 = 1; x2 < W; x2++) c.lineTo(x2, ter[x2]); c.stroke();
      debris.forEach(function(q){ c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.col; c.globalAlpha = clamp(2 - q.t/q.life*2, 0, 1); c.fillRect(-q.w/2, -q.h/2, q.w, q.h); c.restore(); });
      drawTank(c, me); foes.forEach(function(f){ drawTank(c, f); });
      if(myTurn()){ var a = me.ang*Math.PI/180, L = 20 + me.pow*.9; c.strokeStyle = nukeArmed ? 'rgba(255,95,87,.9)' : 'rgba(255,255,255,.55)'; c.setLineDash([3, 5]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(me.x, me.y - 16); c.lineTo(me.x + Math.cos(a)*L, me.y - 16 - Math.sin(a)*L); c.stroke(); c.setLineDash([]);
        if(upg.guide){ var v = me.pow*5.2, px = me.x + Math.cos(a)*18, py = me.y - 16 - Math.sin(a)*18, vx = Math.cos(a)*v, vy = -Math.sin(a)*v; c.fillStyle = 'rgba(255,255,255,.5)'; for(var st = 0; st < 46; st++){ vx += wind*.9*.05; vy += G*.05; px += vx*.05; py += vy*.05; var gi = Math.round(px); if(px < 0 || px >= W || py > ter[gi]) break; if(st % 2 === 0){ c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill(); } } } }
      shots.forEach(function(sh){ c.strokeStyle = sh.nuke ? 'rgba(255,120,110,.7)' : 'rgba(255,220,150,.6)'; c.lineWidth = sh.nuke ? 3 : 2; c.beginPath(); sh.trail.forEach(function(q, i){ if(i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }); c.stroke(); c.fillStyle = sh.nuke ? '#ff5f57' : '#fff'; c.beginPath(); c.arc(sh.x, sh.y, sh.nuke ? 6 : sh.big ? 4.5 : 3.5, 0, 7); c.fill(); });
      smoke.forEach(function(q){ c.fillStyle = 'rgba(70,60,60,'+(.45*(1 - q.t/q.life))+')'; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); });
      parts.forEach(function(q){ c.fillStyle = q.col; c.globalAlpha = clamp(1 - q.t/q.life, 0, 1); c.fillRect(q.x - 2, q.y - 2, 4, 4); c.globalAlpha = 1; });
      rings.forEach(function(q){ var k = q.t/q.life; if(q.flash){ c.fillStyle = 'rgba(255,240,200,'+(.9*(1 - k))+')'; c.beginPath(); c.arc(q.x, q.y, q.r*(0.4 + k), 0, 7); c.fill(); } else { c.strokeStyle = 'rgba(255,200,120,'+(.8*(1 - k))+')'; c.lineWidth = 3*(1 - k) + .5; c.beginPath(); c.arc(q.x, q.y, q.r*k*1.6 + 4, 0, 7); c.stroke(); } });
      c.restore();
      /* hud */
      text(c, 'wind '+Math.abs(wind), W/2, 10, 10, 'rgba(255,255,255,.7)', 'center'); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W/2, 18); c.lineTo(W/2, 28); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(W/2, 23); c.lineTo(W/2 + wind*1.6, 23); c.stroke(); if(wind){ c.beginPath(); var wx = W/2 + wind*1.6, sg = wind > 0 ? 1 : -1; c.moveTo(wx, 23); c.lineTo(wx - sg*6, 19); c.moveTo(wx, 23); c.lineTo(wx - sg*6, 27); c.stroke(); }
      text(c, 'round '+round+'  \u00b7  '+coins+' coins', W - 12, 18, 12, '#ffd166', 'right', 700);
      text(c, Math.round(me.ang)+'\u00b0  '+Math.round(me.pow)+'%', 12, 18, 12, me.col, 'left', 700);
      c.fillStyle = 'rgba(0,0,0,.4)'; rr(c, 12, 30, 90, 6, 3); c.fill(); c.fillStyle = fuel > fuelMax*.3 ? '#8fd46a' : '#ff8a00'; rr(c, 12, 30, 90*clamp(fuel/fuelMax, 0, 1), 6, 3); c.fill(); text(c, 'fuel '+Math.ceil(fuel), 108, 33, 10, 'rgba(255,255,255,.7)');
      if(upg.nuke > 0) text(c, (nukeArmed ? 'NUKE ARMED' : 'nuke x'+upg.nuke+'  (N arms)'), 12, 48, 10, nukeArmed ? '#ff5f57' : 'rgba(255,255,255,.6)', 'left', 800);
      if(phase === 'play' && turn >= 0) text(c, foes[turn].name+(foes[turn].drive && foes[turn].drive.left > 0 ? ' is moving  \u00b7  fuel '+Math.ceil(foes[turn].fuel) : ' is aiming'), W/2, H - 20, 12, 'rgba(255,255,255,.7)', 'center');
      if(msgT > 0 && phase !== 'shop' && phase !== 'diff') text(c, msg, W/2, H*.14, 18, 'rgba(255,255,255,'+Math.min(1, msgT)+')', 'center', 800);
      if(round === 1 && kills === 0 && myTurn()) text(c, api.touch ? 'drag from your tank to aim, release to fire. Pad drives and tunes' : 'left/right drive (fuel), up/down angle, w/s power, space fires', W/2, H*.24, 12, 'rgba(255,255,255,.75)', 'center');
      if(phase === 'shop') drawShop(c); if(phase === 'diff') drawDiff(c);
    };
    function drawDiff(c){ c.fillStyle = 'rgba(8,8,14,.9)'; c.fillRect(0, 0, W, H); var top = diffTop();
      text(c, 'Tanks', W/2, top - 66, 26, '#fff', 'center', 800); text(c, 'Choose your difficulty', W/2, top - 38, 13, 'rgba(255,255,255,.7)', 'center', 600);
      DIFFS.forEach(function(d, i){ var y = top + i*46, sel = i === diffSel; c.fillStyle = sel ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)'; rr(c, W*.14, y - 4, W*.72, 42, 10); c.fill(); if(sel){ c.strokeStyle = d.col; c.lineWidth = 2; c.stroke(); }
        c.fillStyle = d.col; c.beginPath(); c.arc(W*.14 + 22, y + 17, sel ? 7 : 5, 0, 7); c.fill(); text(c, (i + 1)+'  '+d.name, W*.14 + 40, y + 10, 15, sel ? '#fff' : 'rgba(255,255,255,.8)', 'left', 800); text(c, d.desc, W*.14 + 40, y + 27, 10, sel ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.45)'); });
      text(c, api.touch ? 'tap to pick, tap again to roll out' : 'up/down or 1-4 pick, space rolls out', W/2, H - 18, 11, 'rgba(255,255,255,.6)', 'center'); }
    function drawShop(c){ c.fillStyle = 'rgba(8,8,14,.9)'; c.fillRect(0, 0, W, H); var top = shopTop();
      text(c, 'Round '+(round - 1)+' won', W/2, top - 66, 22, '#fff', 'center', 800); c.font = '800 16px '+FONT; var ctxt = '\u25c6  '+coins+' coins to spend', cw = c.measureText(ctxt).width + 36; c.fillStyle = '#14120c'; rr(c, W/2 - cw/2, top - 50, cw, 30, 15); c.fill(); c.strokeStyle = '#ffd166'; c.lineWidth = 2; c.stroke(); text(c, ctxt, W/2, top - 35, 16, '#ffd166', 'center', 800);
      SHOP.concat([{ id:'go', name:'Next round', desc:'Roll out', cost:0 }]).forEach(function(it, i){ var y = top + i*34, sel = i === shopSel, owned = upg[it.id] || 0, maxed = it.max && owned >= it.max, can = it.id === 'go' || (!maxed && coins >= it.cost);
        if(sel){ c.fillStyle = 'rgba(255,209,102,.16)'; rr(c, W*.1, y - 2, W*.8, 32, 8); c.fill(); c.strokeStyle = '#ffd166'; c.lineWidth = 1.5; c.stroke(); }
        var col = can ? '#fff' : 'rgba(255,255,255,.4)';
        text(c, it.name + (owned && it.id !== 'go' ? (it.id === 'nuke' ? '  x'+owned : '  \u2713'+(it.max > 1 ? owned+'/'+it.max : '')) : ''), W*.13, y + 9, 13, col, 'left', 800); text(c, it.desc, W*.13, y + 23, 10, can ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.3)');
        text(c, it.id === 'go' ? '\u2192' : maxed ? 'maxed' : it.cost+' coins', W*.87, y + 9, 12, it.id === 'go' ? '#8fd46a' : can ? '#ffd166' : 'rgba(255,255,255,.4)', 'right', 800); if(it.id !== 'go' && !maxed && !can) text(c, 'need '+(it.cost - coins)+' more', W*.87, y + 23, 9, 'rgba(255,120,110,.8)', 'right', 600); });
      if(msgT > 0) text(c, msg, W/2, H - 36, 12, '#ffd166', 'center', 700);
      text(c, api.touch ? 'tap to pick, tap again to buy' : 'up/down pick, space buys or continues', W/2, H - 18, 11, 'rgba(255,255,255,.6)', 'center'); }
    return g;
  }

/* tigOS arcade games.js, part 12: hopper. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Hopper (frogger) ---------- */
  function hopper(api){
    var W = api.W, H = api.H, g = {}, CS = 40, COLS = W / CS, PLAY = 13 * CS, HOMES = [1, 3, 5, 7, 9], HOP = .11, TIME = 30;
    /* every level gets a fresh layout: lane kinds, directions, speeds and spacing are rolled here; each level rolls faster and tighter */
    var THEMES = [{ water:'#123a73', road:'#1e1f26', bank:'#1d4a2a', side:'#4a2d7a' }, { water:'#0f4d5c', road:'#23232a', bank:'#2f5d1f', side:'#6b3a2a' }, { water:'#2b2f7a', road:'#1c2230', bank:'#4a3c17', side:'#2a4a6b' }, { water:'#0c3d3a', road:'#2a1e2e', bank:'#1d4a2a', side:'#7a3a5a' }, { water:'#3a1f6e', road:'#1a1a1a', bank:'#3d5a1d', side:'#3a6b7a' }];
    function genLanes(level){
      var out = [], dir = Math.random() < .5 ? 1 : -1, turtles = 0, k = 1 + (level - 1)*.12;
      for(var row = 1; row <= 5; row++){ var turtle = (row === 5 && !turtles) || (Math.random() < .4 && turtles < 2); if(turtle) turtles++; var len = turtle ? ri(2, 3) : ri(3, 6); out.push({ row:row, dir:dir, sp:rnd(55, 95)*k + (row === 3 ? 20 : 0), len:len, gap:Math.max(70, rnd(100, 190) - (level - 1)*8), kind:turtle ? 'turtle' : 'log' }); dir = -dir; }
      var kinds = ['truck', 'race', 'car', 'dozer', 'car']; for(var i = kinds.length - 1; i > 0; i--){ var j = ri(0, i), tmp = kinds[i]; kinds[i] = kinds[j]; kinds[j] = tmp; }
      for(var r = 7; r <= 11; r++){ var kind = kinds[r - 7], sp = kind === 'race' ? rnd(170, 210) : kind === 'truck' ? rnd(100, 130) : kind === 'dozer' ? rnd(65, 85) : rnd(85, 125); out.push({ row:r, dir:dir, sp:sp*k, len:kind === 'truck' ? 2 : 1, gap:Math.max(80, (kind === 'race' ? rnd(240, 300) : rnd(120, 200)) - (level - 1)*10), kind:kind }); dir = -dir; }
      return out; }
    var LANES = genLanes(1), theme = THEMES[0];
    var sfx = window.TIG_SFX, snd = { hop:function(){ sfx.tone('square', 520, 780, .07, .12); }, splash:function(){ sfx.noise(.35, 700, .5, 1); sfx.tone('sine', 300, 80, .3, .2); }, squash:function(){ sfx.noise(.18, 260, .7, 1); sfx.tone('sawtooth', 160, 40, .22, .25); }, hedge:function(){ sfx.tone('square', 240, 120, .2, .15); }, time:function(){ sfx.tone('sawtooth', 220, 60, .5, .2); }, home:function(){ [523, 659, 784].forEach(function(f, i){ sfx.tone('triangle', f, f, .14, .18, i*.08); }); }, level:function(){ [523, 659, 784, 1046, 784, 1046].forEach(function(f, i){ sfx.tone('triangle', f, f, .16, .2, i*.1); }); } };
    var lanes, frog, homes, lives, level, score, time, t, over, flies, bestRow, msg, msgT;
    var rowY = function(r){ return r * CS + CS / 2; };
    var mult = function(){ return 1; };   /* speed lives in genLanes now, rolled per level */
    function buildLanes(){ LANES = genLanes(level); theme = THEMES[(level - 1) % THEMES.length]; lanes = LANES.map(function(L, i){ var w = L.len * CS, P = w + L.gap; return { row:L.row, dir:L.dir, sp:L.sp, w:w, P:P, len:L.len, kind:L.kind, off:rnd(0, P), n:Math.ceil((W + P) / P) + 1, phase:rnd(0, 6), idx:i }; }); }
    g.reset = function(){
      lanes = LANES.map(function(L, i){ var w = L.len * CS, P = w + L.gap; return { row:L.row, dir:L.dir, sp:L.sp, w:w, P:P, len:L.len, kind:L.kind, off:rnd(0, P), n:Math.ceil((W + P) / P) + 1, phase:rnd(0, 6), idx:i }; });
      homes = [false, false, false, false, false]; lives = 3; level = 1; score = 0; t = 0; over = false; msg = ''; msgT = 0; buildLanes();
      api.score(0); spawn(); api.status(api.touch ? 'swipe or tap a side to hop  ·  level 1' : 'arrows hop  ·  level 1');
    };
    function spawn(){ frog = { x:W / 2, row:12, hop:0, fx:0, fr:12, tx:W / 2, tr:12, dead:0, kind:'' }; time = TIME; bestRow = 12; }
    function objX(L, i){ return -L.P + L.off + i * L.P; }
    function submerged(L){ return L.kind === 'turtle' && (level >= 3 || (level === 2 && L.idx === 1)) && ((L.phase % 6) > 4.4); }
    function turtleAlpha(L){ if(L.kind !== 'turtle' || !(level >= 3 || (level === 2 && L.idx === 1))) return 1; var p = L.phase % 6; if(p < 3.8) return 1; if(p < 4.4) return 1 - (p - 3.8) / .6; if(p < 5.6) return 0; return (p - 5.6) / .4; }
    function laneAt(row){ for(var i = 0; i < lanes.length; i++) if(lanes[i].row === row) return lanes[i]; return null; }
    function riding(L, x){ for(var i = 0; i < L.n; i++){ var ox = objX(L, i); if(x > ox - 4 && x < ox + L.w + 4) return true; } return false; }
    function hitCar(L, x){ for(var i = 0; i < L.n; i++){ var ox = objX(L, i); if(x + 13 > ox + 2 && x - 13 < ox + L.w - 2) return true; } return false; }
    function die(kind){ if(frog.dead || over) return; frog.dead = 1.1; frog.kind = kind; frog.hop = 0; (snd[kind] || snd.squash)(); }
    function hop(d){
      if(over || frog.dead || frog.hop > 0) return;
      var tr = frog.row, tx = frog.x;
      if(d === 'U') tr--; else if(d === 'D') tr++; else if(d === 'L') tx -= CS; else if(d === 'R') tx += CS;
      if(tr < 0 || tr > 12 || tx < CS / 2 - 6 || tx > W - CS / 2 + 6) return;
      frog.fx = frog.x; frog.fr = frog.row; frog.tx = tx; frog.tr = tr; frog.hop = HOP; frog.face = d; snd.hop();
    }
    g.key = function(k, down){ if(!down) return false; var d = isDir(k); if(!d) return false; hop(d); return true; };
    g.pointer = function(type, x, y){ if(type !== 'down' || over) return; var dx = x - frog.x, dy = y - rowY(frog.row); if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return; hop(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); };
    g.peek = function(){ return { frog:{ x:frog.x, row:frog.row, dead:frog.dead > 0, kind:frog.kind }, lives:lives, level:level, homes:homes.slice(), time:time, score:score, hopping:frog.hop > 0, over:over, layout:lanes.map(function(L){ return L.kind + L.dir + ':' + Math.round(L.sp); }).join(','), theme:theme.water }; };
    g.dbg = { place:function(x, row){ frog.x = x; frog.row = row; frog.hop = 0; frog.dead = 0; }, time:function(n){ time = n; }, homes:function(arr){ homes = arr.slice(); }, lanes:function(){ return lanes.map(function(L){ return { row:L.row, kind:L.kind, w:L.w, xs:Array.apply(null, Array(L.n)).map(function(_, i){ return Math.round(objX(L, i)); }) }; }); } };
    function land(){
      frog.x = frog.tx; frog.row = frog.tr;
      if(frog.row < bestRow){ bestRow = frog.row; score += 10; api.score(score); }
      if(frog.row === 0){
        var hit = -1; HOMES.forEach(function(hc, i){ if(Math.abs(frog.x - (hc * CS + CS / 2)) < 18) hit = i; });
        if(hit < 0 || homes[hit]){ die('hedge'); return; }
        homes[hit] = true; score += 50 + Math.ceil(time) * 2; api.score(score); flash('home  +' + (50 + Math.ceil(time) * 2)); snd.home();
        if(homes.every(function(h){ return h; })){ level++; homes = [false, false, false, false, false]; score += 1000; api.score(score); lives = Math.min(5, lives + 1); flash('level ' + level + '  +1000'); buildLanes(); snd.level(); api.status((api.touch ? 'swipe or tap a side to hop' : 'arrows hop') + '  ·  level ' + level); }
        spawn(); return;
      }
      var L = laneAt(frog.row);
      if(L && L.kind !== 'log' && L.kind !== 'turtle' && hitCar(L, frog.x)){ die('squash'); return; }
      if(L && (L.kind === 'log' || L.kind === 'turtle') && (!riding(L, frog.x) || submerged(L))){ die('splash'); return; }
    }
    function flash(s){ msg = s; msgT = 1.4; }
    g.update = function(dt){
      if(over) return; t += dt; msgT = Math.max(0, msgT - dt);
      lanes.forEach(function(L){ L.off = (L.off + L.dir * L.sp * mult() * dt) % L.P; if(L.off < 0) L.off += L.P; L.phase += dt; });
      if(frog.dead){ frog.dead -= dt; if(frog.dead <= 0){ frog.dead = 0; lives--; if(lives <= 0){ over = true; api.over('Out of frogs on level ' + level); return; } spawn(); } return; }
      if(frog.hop > 0){ frog.hop -= dt; if(frog.hop <= 0){ frog.hop = 0; land(); } return; }
      time -= dt; if(time <= 0){ time = 0; die('time'); return; }
      var L = laneAt(frog.row);
      if(L){
        if(L.kind === 'log' || L.kind === 'turtle'){ frog.x += L.dir * L.sp * mult() * dt; if(frog.x < 6 || frog.x > W - 6){ die('splash'); return; } if(submerged(L) || !riding(L, frog.x)){ die('splash'); return; } }
        else if(hitCar(L, frog.x)){ die('squash'); return; }
      }
    };
    function frogAt(c, x, y, s, col, squash){
      c.save(); c.translate(x, y); if(squash) c.scale(1.35, .35);
      c.fillStyle = col; rr(c, -12 * s, -10 * s, 24 * s, 20 * s, 8 * s); c.fill();
      c.fillStyle = col; [[-14, -6], [14, -6], [-14, 8], [14, 8]].forEach(function(p){ c.beginPath(); c.ellipse(p[0] * s, p[1] * s, 5 * s, 3.5 * s, 0, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-6 * s, -9 * s, 3.2 * s, 0, Math.PI * 2); c.arc(6 * s, -9 * s, 3.2 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(-6 * s, -9 * s, 1.5 * s, 0, Math.PI * 2); c.arc(6 * s, -9 * s, 1.5 * s, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    g.draw = function(c){
      c.fillStyle = '#0b0d1c'; c.fillRect(0, 0, W, H);
      /* homes */
      c.fillStyle = theme.bank; c.fillRect(0, 0, W, CS);
      HOMES.forEach(function(hc, i){ c.fillStyle = '#0b0d1c'; c.fillRect(hc * CS + 3, 4, CS - 6, CS - 4); if(homes[i]) frogAt(c, hc * CS + CS / 2, CS / 2 + 2, .8, '#3ddc84'); });
      /* river */
      c.fillStyle = theme.water; c.fillRect(0, CS, W, 5 * CS);
      c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2; for(var r = 1; r <= 5; r++){ c.beginPath(); for(var x = 0; x <= W; x += 20){ var yy = rowY(r) + Math.sin((x + t * 60 * (r % 2 ? 1 : -1)) / 30) * 3; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
      /* median and start */
      c.fillStyle = theme.side; c.fillRect(0, 6 * CS, W, CS); c.fillRect(0, 12 * CS, W, CS);
      c.fillStyle = 'rgba(255,255,255,.08)'; for(var k = 0; k < COLS; k += 2){ c.fillRect(k * CS, 6 * CS, CS, CS); c.fillRect((k + 1) * CS, 12 * CS, CS, CS); }
      /* road */
      c.fillStyle = theme.road; c.fillRect(0, 7 * CS, W, 5 * CS);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.setLineDash([16, 14]); for(var rr2 = 8; rr2 <= 11; rr2++){ c.beginPath(); c.moveTo(0, rr2 * CS); c.lineTo(W, rr2 * CS); c.stroke(); } c.setLineDash([]);
      lanes.forEach(function(L){
        var y = rowY(L.row), a = turtleAlpha(L);
        for(var i = 0; i < L.n; i++){
          var ox = objX(L, i); if(ox + L.w < -10 || ox > W + 10) continue;
          if(L.kind === 'log'){ c.fillStyle = '#8a5a2b'; rr(c, ox, y - 13, L.w, 26, 12); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, ox + 8, y - 4, L.w - 16, 4, 2); c.fill(); }
          else if(L.kind === 'turtle'){ c.globalAlpha = a; for(var s = 0; s < L.len; s++){ var cx = ox + s * CS + CS / 2; c.fillStyle = '#2f9e5b'; c.beginPath(); c.arc(cx, y, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1d6a3c'; c.beginPath(); c.arc(cx, y, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2f9e5b'; c.beginPath(); c.arc(cx + L.dir * 16, y, 5, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; }
          else {
            var col = { truck:'#c8c8d0', race:'#ff3b3b', car:'#ffd166', dozer:'#63e6be' }[L.kind];
            c.fillStyle = col; rr(c, ox + 2, y - 13, L.w - 4, 26, 6); c.fill();
            c.fillStyle = 'rgba(0,0,0,.35)'; if(L.kind === 'truck'){ rr(c, ox + (L.dir > 0 ? L.w - 26 : 4), y - 11, 22, 22, 4); c.fill(); } else { rr(c, ox + 10, y - 9, L.w - 20, 8, 3); c.fill(); }
            c.fillStyle = '#fff'; var hx = L.dir > 0 ? ox + L.w - 4 : ox + 4; c.fillRect(hx - 2, y - 11, 3, 5); c.fillRect(hx - 2, y + 6, 3, 5);
          }
        }
      });
      /* frog */
      if(frog.dead){
        var fy = rowY(frog.row), k2 = frog.kind;
        if(k2 === 'splash'){ c.strokeStyle = 'rgba(180,220,255,' + Math.max(0, frog.dead) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(frog.x, fy, 8 + (1.1 - frog.dead) * 30, 0, Math.PI * 2); c.stroke(); }
        else if(k2 === 'squash') frogAt(c, frog.x, fy, 1, '#9be29b', true);
        else { c.globalAlpha = Math.max(0, frog.dead); frogAt(c, frog.x, fy, 1, k2 === 'time' ? '#9aa' : '#9be29b'); c.globalAlpha = 1; text(c, k2 === 'time' ? 'time!' : 'ouch', frog.x, fy - 26, 12, '#ff6b6b', 'center', 800); }
      } else {
        var p = frog.hop > 0 ? 1 - frog.hop / HOP : 1, fx = frog.fx + (frog.tx - frog.fx) * p, fyy = rowY(frog.fr) + (rowY(frog.tr) - rowY(frog.fr)) * p, lift = frog.hop > 0 ? Math.sin(p * Math.PI) * .35 : 0;
        if(frog.hop <= 0){ fx = frog.x; fyy = rowY(frog.row); }
        frogAt(c, fx, fyy, 1 + lift, '#3ddc84');
      }
      /* hud */
      c.fillStyle = '#07070b'; c.fillRect(0, PLAY, W, H - PLAY);
      for(var l = 0; l < lives; l++) frogAt(c, 18 + l * 26, PLAY + 20, .55, '#3ddc84');
      text(c, 'level ' + level, W / 2, PLAY + 20, 12, 'rgba(255,255,255,.7)', 'center', 700);
      var tw = 140, tf = time / TIME; c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, W - tw - 12, PLAY + 14, tw, 12, 4); c.fill(); c.fillStyle = tf < .25 ? '#ff3b3b' : '#3ddc84'; if(tf > 0){ rr(c, W - tw - 12, PLAY + 14, tw * tf, 12, 4); c.fill(); }
      if(msgT > 0) text(c, msg, W / 2, 6.5 * CS, 14, '#ffd166', 'center', 800);
    };
    return g;
  }

/* tigOS arcade games.js, part 13: invaders. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Invaders ---------- */
  function invaders(api){
    var W = api.W, H = api.H, g = {}, COLS = 11, ROWS = 5, GX = 36, GY = 30, AW = 26, AH = 18, SHIPY = H - 70, GROUND = H - 34;
    var ship, shot, aliens, ox, oy, dir, stepT, bombs, bombT, bunkers, ufo, ufoT, lives, wave, score, over, t, held, frame, dying, targetX, bursts, stars;
    var value = function(r){ return r === 0 ? 30 : r < 3 ? 20 : 10; };
    var alive = function(){ return aliens.filter(function(a){ return a.on; }); };
    g.reset = function(){ lives = 3; wave = 1; score = 0; over = false; t = 0; held = {}; targetX = null; bursts = []; stars = []; for(var i = 0; i < 60; i++) stars.push({ x:rnd(0, W), y:rnd(0, GROUND), r:rnd(.4, 1.4) }); ship = { x:W / 2 }; dying = 0; api.score(0); formation(); buildBunkers(); api.status(api.touch ? 'drag to steer, tap to fire  ·  wave 1' : 'left/right move, space fires  ·  wave 1'); };
    function formation(){ aliens = []; for(var r = 0; r < ROWS; r++) for(var c = 0; c < COLS; c++) aliens.push({ c:c, r:r, on:true }); ox = (W - (COLS - 1) * GX) / 2; oy = Math.min(200, 92 + (wave - 1) * 16); dir = 1; stepT = 0; bombs = []; bombT = 1.2; ufo = null; ufoT = rnd(14, 22); shot = null; frame = 0; }
    function buildBunkers(){ bunkers = []; var shape = ['.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXX..XXX', 'XX....XX']; for(var b = 0; b < 4; b++){ var bx = W * (b + 1) / 5 - 24, by = SHIPY - 62; shape.forEach(function(row, j){ for(var i = 0; i < row.length; i++) if(row[i] === 'X') bunkers.push({ x:bx + i * 6, y:by + j * 6, on:true }); }); } }
    var ax = function(a){ return ox + a.c * GX; }, ay = function(a){ return oy + a.r * GY; };
    function stepEvery(){ var n = alive().length; return clamp(.03 + .62 * (n / 55), .05, .65) / (1 + (wave - 1) * .12); }
    function fire(){ if(over || dying || shot) return; shot = { x:ship.x, y:SHIPY - 16 }; }
    function boom(x, y, col, n){ for(var i = 0; i < (n || 10); i++) bursts.push({ x:x, y:y, vx:rnd(-90, 90), vy:rnd(-90, 90), life:rnd(.25, .5), col:col }); }
    function hitBunker(x, y, rad){ var hit = false; bunkers.forEach(function(b){ if(b.on && Math.abs(b.x + 3 - x) < rad && Math.abs(b.y + 3 - y) < rad){ b.on = false; hit = true; } }); return hit; }
    function loseLife(){ if(dying || over) return; dying = 1.1; boom(ship.x, SHIPY, '#3ddc84', 24); bombs = []; }
    g.key = function(k, down){ var d = isDir(k); if(d === 'L' || d === 'R'){ held[d] = down; targetX = null; return true; } if(k === ' ' || d === 'U'){ if(down) fire(); return true; } return false; };
    g.pointer = function(type, x){ if(over) return; if(type === 'down'){ targetX = x; fire(); } else if(type === 'move') targetX = x; };
    g.peek = function(){ return { ship:ship.x, aliens:alive().length, wave:wave, lives:lives, bombs:bombs.length, shot:!!shot, ufo:!!ufo, score:score, oy:oy, dir:dir, over:over, bunkers:bunkers.filter(function(b){ return b.on; }).length }; };
    g.dbg = { clear:function(){ aliens.forEach(function(a){ a.on = false; }); }, drop:function(y){ oy = y; }, kill:function(){ loseLife(); } };
    g.update = function(dt){
      if(over) return; t += dt;
      bursts.forEach(function(p){ p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); bursts = bursts.filter(function(p){ return p.life > 0; });
      if(dying){ dying -= dt; if(dying <= 0){ dying = 0; lives--; if(lives <= 0){ over = true; api.over('The invaders landed on wave ' + wave); return; } ship.x = W / 2; } return; }
      if(held.L) ship.x -= 260 * dt; if(held.R) ship.x += 260 * dt;
      if(targetX !== null){ var dx = targetX - ship.x; ship.x += clamp(dx, -320 * dt, 320 * dt); }
      ship.x = clamp(ship.x, 20, W - 20);
      /* formation march */
      stepT -= dt; if(stepT <= 0){ stepT = stepEvery(); frame ^= 1; var live = alive(), minx = 1e9, maxx = -1e9; live.forEach(function(a){ minx = Math.min(minx, ax(a)); maxx = Math.max(maxx, ax(a)); });
        if((dir > 0 && maxx + 10 + AW / 2 >= W - 8) || (dir < 0 && minx - 10 - AW / 2 <= 8)){ dir = -dir; oy += 14; } else ox += 10 * dir; }
      var lowest = 0; alive().forEach(function(a){ lowest = Math.max(lowest, ay(a)); if(Math.abs(ax(a) - ship.x) < AW / 2 + 12 && Math.abs(ay(a) - SHIPY) < AH / 2 + 10) loseLife(); });
      if(lowest + AH / 2 >= SHIPY + 8){ over = true; api.over('The invaders landed on wave ' + wave); return; }
      alive().forEach(function(a){ bunkers.forEach(function(b){ if(b.on && Math.abs(b.x + 3 - ax(a)) < AW / 2 + 3 && Math.abs(b.y + 3 - ay(a)) < AH / 2 + 3) b.on = false; }); });
      /* player shot */
      if(shot){ shot.y -= 520 * dt; if(shot.y < 20) shot = null; }
      if(shot){ var live2 = alive(), hit = null; for(var i = 0; i < live2.length; i++){ var a = live2[i]; if(Math.abs(ax(a) - shot.x) < AW / 2 && Math.abs(ay(a) - shot.y) < AH / 2 + 4){ hit = a; break; } }
        if(hit){ hit.on = false; score += value(hit.r); api.score(score); boom(ax(hit), ay(hit), hit.r === 0 ? '#ff6bd6' : hit.r < 3 ? '#5ad1ff' : '#b8ff5c'); shot = null; }
        else if(ufo && Math.abs(ufo.x - shot.x) < 24 && Math.abs(ufo.y - shot.y) < 12){ var v = [50, 100, 150, 300][ri(0, 3)]; score += v; api.score(score); boom(ufo.x, ufo.y, '#ff3b3b', 18); bursts.push({ x:ufo.x, y:ufo.y - 14, vx:0, vy:-20, life:.9, col:'#ffd166', txt:'+' + v }); ufo = null; shot = null; }
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
      if(!alive().length){ wave++; score += 100; api.score(score); formation(); buildBunkers(); bursts.push({ x:W / 2, y:H / 2, vx:0, vy:0, life:1.6, col:'#ffd166', txt:'wave ' + wave }); api.status((api.touch ? 'drag to steer, tap to fire' : 'left/right move, space fires') + '  ·  wave ' + wave); }
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
      if(!dying){ c.fillStyle = '#3ddc84'; c.beginPath(); c.moveTo(ship.x - 18, SHIPY + 8); c.lineTo(ship.x - 18, SHIPY - 2); c.lineTo(ship.x - 6, SHIPY - 6); c.lineTo(ship.x - 3, SHIPY - 14); c.lineTo(ship.x + 3, SHIPY - 14); c.lineTo(ship.x + 6, SHIPY - 6); c.lineTo(ship.x + 18, SHIPY - 2); c.lineTo(ship.x + 18, SHIPY + 8); c.closePath(); c.fill(); }
      bursts.forEach(function(p){ c.globalAlpha = clamp(p.life * 2.5, 0, 1); if(p.txt) text(c, p.txt, p.x, p.y, p.txt.indexOf('wave') === 0 ? 22 : 13, p.col, 'center', 800); else { c.fillStyle = p.col; c.fillRect(p.x - 2, p.y - 2, 4, 4); } }); c.globalAlpha = 1;
      c.fillStyle = '#3ddc84'; c.fillRect(0, GROUND, W, 2);
      for(var l = 0; l < lives - 1; l++){ c.fillStyle = '#3ddc84'; rr(c, 12 + l * 30, GROUND + 12, 22, 9, 3); c.fill(); }
      text(c, 'wave ' + wave, W - 12, GROUND + 17, 12, 'rgba(255,255,255,.7)', 'right', 700);
      text(c, alive().length + ' left', W / 2, GROUND + 17, 12, 'rgba(255,255,255,.5)', 'center', 600);
    };
    return g;
  }

  var I = function(p){ return '<svg viewBox="0 0 24 24">'+p+'</svg>'; };
  return [
    { id:'snake', tkeys:'Swipe or use the pad',   name:'Serpent', blurb:'Eat, grow, do not bite the wall. Gets faster the longer you get.', keys:'Arrows or WASD steer', W:480, H:480, pad:'dirs', color:'#28c840', make:snake, icon:I('<path d="M4 16c0-3 2-4 5-4s5 1 5-2-2-3-5-3M14 10h3a3 3 0 0 1 0 6h-2"/><circle cx="17" cy="14" r="1" fill="currentColor"/>') },
    { id:'bricks', tkeys:'Drag to move the paddle, tap to launch',  name:'Bricks', blurb:'Classic brick breaker. Angle the ball off the paddle, clear every level.', keys:'Arrows or mouse move, space launches', W:640, H:480, pad:'lr', color:'#ff8a00', make:bricks, icon:I('<rect x="3" y="4" width="5" height="3"/><rect x="9.5" y="4" width="5" height="3"/><rect x="16" y="4" width="5" height="3"/><rect x="6" y="8.5" width="5" height="3"/><rect x="13" y="8.5" width="5" height="3"/><circle cx="12" cy="15.5" r="1.4"/><path d="M8 20h8"/>') },
    { id:'stacker', tkeys:'Pad moves, rotates, drops and holds. Swipe works too', name:'Stacker', blurb:'Seven falling shapes, ghost piece, hold slot, hard drop. Ten lines a level.', keys:'Arrows move, up rotates, space drops, c holds', W:460, H:540, pad:'stack', color:'#a78bfa', make:stacker, icon:I('<rect x="9.5" y="3" width="5" height="5"/><rect x="4.5" y="8" width="5" height="5"/><rect x="9.5" y="8" width="5" height="5"/><rect x="14.5" y="8" width="5" height="5"/><path d="M3 20h18"/>') },
    { id:'rocks', tkeys:'Pad turns, thrusts and fires',   name:'Rocks', blurb:'Vector asteroids with thrust, drift and screen wrap. Big rocks split into small ones.', keys:'Left/right turn, up thrusts, space fires', W:640, H:480, pad:'ship', color:'#8cc7ff', make:rocks, icon:I('<path d="M12 4l4 8-4 8-4-8z"/><path d="M6 6l2 1M18 6l-2 1"/><circle cx="19" cy="17" r="2"/>') },
    { id:'2048', tkeys:'Swipe to slide',    name:'Tiles', blurb:'Slide and merge matching numbers. Reach 2048, then keep going.', keys:'Arrows or WASD slide', W:480, H:480, pad:'dirs', color:'#ffd166', make:tiles, icon:I('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>') },
    { id:'flap', tkeys:'Tap to flap',    name:'Flap', blurb:'One button, endless pipes. Tap or press space to flap through the gaps.', keys:'Space or click flaps', W:360, H:560, pad:'tap', color:'#5aa9ff', make:flap, icon:I('<path d="M4 13c2-6 8-8 13-6 2 1 3 3 3 5-2 4-7 6-12 5"/><path d="M8 12l3 2"/><circle cx="15" cy="10" r=".8" fill="currentColor"/>') },
    { id:'mines', tkeys:'Tap digs, press and hold flags',   name:'Mines', blurb:'Sixteen by twelve, thirty mines. First click is always safe. Chord on numbers.', keys:'Click digs, right click flags, or arrows + space + f', W:480, H:400, pad:'mines', color:'#ff5f57', make:mines, icon:I('<circle cx="12" cy="13" r="6"/><path d="M12 4v3M5 13H2M22 13h-3M12 22v-3M6.5 7.5l2 2M17.5 7.5l-2 2"/>') },
    { id:'paddle', tkeys:'Drag to move your paddle',  name:'Paddle', blurb:'Table tennis against a cpu that gets sharper as you pull ahead. First to seven.', keys:'Up/down or mouse move', W:640, H:400, pad:'ud', color:'#63e6be', make:paddle, icon:I('<rect x="3.5" y="7" width="2.5" height="10" rx="1"/><rect x="18" y="7" width="2.5" height="10" rx="1"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v3M12 18v3"/>') },
    { id:'hopper', premium:true, rank:6, tkeys:'Swipe, tap a side of the frog, or use the pad', name:'Hopper', blurb:'Five lanes of traffic, five lanes of river, five homes to fill. Logs carry you, turtles dive, the clock never stops, and every level deals a new, faster road.', keys:'Arrows or WASD hop', W:440, H:560, pad:'dirs', color:'#3ddc84', make:hopper, icon:I('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M3 13h18M3 17h18"/><circle cx="12" cy="11.5" r="2.2"/><circle cx="10.8" cy="10.6" r=".5" fill="currentColor"/><circle cx="13.2" cy="10.6" r=".5" fill="currentColor"/>') },
    { id:'invaders', tkeys:'Drag to steer, tap to fire, or use the pad', name:'Invaders', blurb:'Fifty five aliens march down the screen and speed up as they thin out. Four bunkers, one shot at a time, a mystery saucer worth up to 300.', keys:'Left/right move, space fires', W:480, H:560, pad:'lr', color:'#b8ff5c', make:invaders, icon:I('<path d="M7 6h10v3h3v6h-3v3h-2v-3H9v3H7v-3H4V9h3z"/><rect x="9" y="9" width="2" height="2" fill="currentColor"/><rect x="13" y="9" width="2" height="2" fill="currentColor"/><path d="M12 19v2"/>') },
    { id:'ghosts', premium:true, rank:5, tkeys:'Swipe left or right to change lane, up to jump, down to slide. Pick a side at every fork', name:'Ghost Run', blurb:'Three lanes through a haunted house with ghosts on your heels. Jump the coffins, slide under the witches, dodge the armor, pick a side at every fork.', keys:'Arrows change lane, up jumps, down slides', W:400, H:600, pad:'dirs', color:'#7c5cbf', make:ghosts, icon:I('<path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/>') },
    { id:'kong', premium:true, rank:3, tkeys:'Pad moves and climbs, jump button or a tap jumps', name:'Kong', blurb:'Climb six red girders while the ape hurls barrels. Jump them, hammer them, rescue the penguin at the top. This is for Greggy D!', keys:'Arrows move and climb, space jumps', W:480, H:560, pad:'plat', color:'#e24b4b', make:kong, icon:I('<rect x="3" y="3" width="6" height="18" rx="1"/><path d="M3 8h6M3 13h6M3 18h6"/><ellipse cx="16" cy="14" rx="5" ry="6"/><path d="M11 12h10M11 16h10"/>') },
    { id:'tanks', premium:true, rank:4, tkeys:'Drag from your tank to aim, let go to fire. The pad drives, tunes and arms the nuke', name:'Tanks', blurb:'Artillery on rolling hills against up to three cpu tanks. Wind, fuel, craters, and coins for a shop between rounds: armor, heavy shells, double barrels, a nuke.', keys:'Left/right drive, up/down angle, w/s power, space fires, n arms a nuke', W:640, H:400, pad:'arty', color:'#8fd46a', make:tanks, icon:I('<path d="M3 17h18M5 17v-3h10v3M8 14v-3h4v3M12 11l6-5"/><circle cx="7" cy="19.5" r="1"/><circle cx="12" cy="19.5" r="1"/><circle cx="17" cy="19.5" r="1"/>') }
  ];
})();

/* tigOS arcade, game 9: "Nightshift". A first-person raycast shooter in the COD Zombies mould, rendered with Canvas 2D.
   Everything on screen is generated here at load: wall textures, zombie sprites, machines, the map. No downloads, no audio files
   (the sounds are synthesised with WebAudio). Same contract as games.js: make(api) -> { reset, update, draw, key, pointer, destroy }. */
(function(){
  var GAMES = window.TIG_GAMES; if(!GAMES) return;
  var W = 640, H = 400, RAYS = 320, SW = W / RAYS, TS = 64, FONT = 'ui-monospace, Menlo, Consolas, monospace';
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; }, rnd = function(a, b){ return a + Math.random() * (b - a); };
  var mk = function(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  var seed = 7; var srand = function(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  var text = function(c, s, x, y, size, col, align, weight){ c.font = (weight || 700)+' '+size+'px '+FONT; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  var LEVELS = 7;   /* brightness steps for distance fog: pre-shaded copies beat per-strip alpha fills */
  function shade(img, k){ if(k >= LEVELS - 1) return img; var c = mk(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(4,4,10,'+(1 - (k + 1) / LEVELS)+')'; x.fillRect(0, 0, c.width, c.height); return c; }
  function levels(img){ var out = []; for(var k = 0; k < LEVELS; k++) out.push(shade(img, k)); return out; }
  function grain(x, w, h, a, n){ for(var i = 0; i < n; i++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '255,255,255')+','+(a * srand())+')'; x.fillRect((srand()*w)|0, (srand()*h)|0, 1 + (srand()*2)|0, 1); } }

  /* ---------- wall textures ---------- */
  var TEX = {};
  function tex(name, fn){ var c = mk(TS, TS), x = c.getContext('2d'); fn(x, c); TEX[name] = levels(c); return c; }
  tex('brick', function(x){ x.fillStyle = '#4a2a24'; x.fillRect(0, 0, TS, TS); for(var r = 0; r < 8; r++){ for(var col = -1; col < 5; col++){ var bx = col*16 + (r%2 ? 8 : 0), by = r*8; x.fillStyle = 'hsl('+(8 + srand()*10)+' '+(35 + srand()*15)+'% '+(24 + srand()*12)+'%)'; x.fillRect(bx + 1, by + 1, 14, 6); } } grain(x, TS, TS, .18, 500); });
  tex('concrete', function(x){ x.fillStyle = '#5a5b62'; x.fillRect(0, 0, TS, TS); grain(x, TS, TS, .16, 900); x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(10, 0); x.lineTo(18, 22); x.lineTo(14, 40); x.lineTo(22, 64); x.stroke(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 30, TS, 2); x.fillRect(0, 62, TS, 2); });
  tex('metal', function(x){ x.fillStyle = '#3c4250'; x.fillRect(0, 0, TS, TS); x.fillStyle = '#485062'; x.fillRect(2, 2, 60, 28); x.fillRect(2, 34, 60, 28); grain(x, TS, TS, .12, 400); x.fillStyle = '#20242c'; [[6,6],[58,6],[6,26],[58,26],[6,38],[58,38],[6,58],[58,58]].forEach(function(p){ x.beginPath(); x.arc(p[0], p[1], 1.6, 0, 7); x.fill(); }); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 30, TS, 4); });
  tex('shelf', function(x){ x.fillStyle = '#3b2a1a'; x.fillRect(0, 0, TS, TS); for(var s = 0; s < 3; s++){ var y = 4 + s*20; x.fillStyle = '#2a1c10'; x.fillRect(0, y + 16, TS, 4); for(var bx = 2; bx < 62; ){ var bw = 4 + (srand()*6)|0; x.fillStyle = 'hsl('+(srand()*360)+' 40% '+(30 + srand()*25)+'%)'; x.fillRect(bx, y + (srand()*3)|0, bw - 1, 16); bx += bw; } } grain(x, TS, TS, .1, 200); });
  tex('boards', function(x){ x.fillStyle = '#0a0a10'; x.fillRect(0, 0, TS, TS); x.fillStyle = '#2b1d12'; x.fillRect(0, 0, 6, TS); x.fillRect(58, 0, 6, TS); x.fillRect(0, 0, TS, 5); x.fillRect(0, 59, TS, 5); x.save(); x.translate(32, 32); [-.35, .25, -.05].forEach(function(a, i){ x.rotate(a); x.fillStyle = ['#5a4028', '#4c3520', '#664a30'][i]; x.fillRect(-36, -5 + i*10, 72, 9); x.rotate(-a); }); x.restore(); grain(x, TS, TS, .2, 300); });
  tex('blood', function(x){ x.drawImage(TEX.concrete[LEVELS-1], 0, 0); x.fillStyle = 'rgba(120,10,10,.75)'; for(var i = 0; i < 9; i++){ x.beginPath(); x.arc(20 + srand()*30, 20 + srand()*30, 3 + srand()*7, 0, 7); x.fill(); } x.fillRect(30, 40, 3, 24); x.fillRect(40, 44, 2, 20); });
  tex('switch', function(x){ x.drawImage(TEX.metal[LEVELS-1], 0, 0); x.fillStyle = '#1a1a20'; x.fillRect(18, 10, 28, 44); x.fillStyle = '#ffd166'; x.fillRect(22, 14, 20, 6); x.fillStyle = '#8a1e1e'; x.fillRect(28, 26, 8, 22); x.fillStyle = '#ff5f57'; x.fillRect(28, 26, 8, 8); text(x, 'POWER', 32, 58, 7, '#ffd166', 'center'); });
  function doorTex(cost){ var c = mk(TS, TS), x = c.getContext('2d'); x.drawImage(TEX.metal[LEVELS-1], 0, 0); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(4, 0, 56, TS); x.fillStyle = '#ffd166'; for(var i = 0; i < 4; i++) x.fillRect(8 + i*14, 50, 8, 8); x.fillStyle = '#ff8a00'; x.fillRect(4, 26, 56, 12); text(x, String(cost), 32, 32, 10, '#111', 'center', 800); text(x, 'LOCKED', 32, 12, 8, '#ffd166', 'center'); return levels(c); }
  function buyTex(name, cost){ var c = mk(TS, TS), x = c.getContext('2d'); x.drawImage(TEX.concrete[LEVELS-1], 0, 0); x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(6, 8, 52, 48); x.strokeStyle = '#ffd166'; x.lineWidth = 2; x.strokeRect(7, 9, 50, 46); x.fillStyle = '#f4f1ea'; x.fillRect(14, 30, 30, 5); x.fillRect(38, 26, 12, 4); x.fillRect(16, 35, 6, 10); x.fillRect(30, 35, 5, 6); text(x, name.toUpperCase(), 32, 18, 7, '#ffd166', 'center'); text(x, String(cost), 32, 50, 8, '#fff', 'center'); return levels(c); }

  /* ---------- sprites: zombies, machines, pickups ---------- */
  var ZW = 64, ZH = 96;
  function drawZombie(x, frame, pal, brute){
    var s = brute ? 1.25 : 1, cx = 32, gy = 94;   /* feet at y 94 */
    x.save(); x.translate(cx, gy); x.scale(s, s); x.translate(0, -76);
    var swing = frame === 0 ? -1 : frame === 1 ? 1 : 0, attack = frame === 2;
    x.fillStyle = pal.pants; x.fillRect(-9, 44, 7, 30 + swing*3); x.fillRect(2, 44, 7, 30 - swing*3);
    x.fillStyle = pal.skin; x.fillRect(-9, 68 + swing*3, 7, 6); x.fillRect(2, 68 - swing*3, 7, 6);
    x.fillStyle = pal.shirt; x.beginPath(); x.moveTo(-13, 16); x.lineTo(13, 16); x.lineTo(10, 48); x.lineTo(-10, 48); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-6, 26, 5, 9); x.fillRect(3, 34, 4, 7);
    x.fillStyle = pal.skin;
    if(attack){ x.fillRect(-19, 6, 6, 22); x.fillRect(13, 6, 6, 22); x.fillRect(-21, 2, 8, 6); x.fillRect(13, 2, 8, 6); }
    else { x.save(); x.translate(-13, 18); x.rotate(-1.2 + swing*.15); x.fillRect(-3, 0, 6, 24); x.fillRect(-4, 22, 8, 6); x.restore(); x.save(); x.translate(13, 18); x.rotate(-1.35 - swing*.15); x.fillRect(-3, 0, 6, 24); x.fillRect(-4, 22, 8, 6); x.restore(); }
    x.fillStyle = pal.skin; x.beginPath(); x.arc(0, 4, 11, 0, 7); x.fill(); x.fillStyle = pal.hair; x.fillRect(-11, -8, 22, 7); x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(-6, 9, 12, 3); x.fillStyle = '#7a1414'; x.fillRect(-4, 9, 8, 3);
    x.fillStyle = '#ff3b3b'; x.shadowColor = '#ff3b3b'; x.shadowBlur = 8; x.fillRect(-7, 0, 4, 3); x.fillRect(3, 0, 4, 3); x.shadowBlur = 0;
    x.restore();
  }
  var PALS = [ { skin:'#8aa56a', shirt:'#3a3f4a', pants:'#26262c', hair:'#1c1a18' }, { skin:'#b7b2a3', shirt:'#5a2a2a', pants:'#2c2a33', hair:'#3a3128' }, { skin:'#6f8c5c', shirt:'#2f4a3a', pants:'#33231a', hair:'#101010' }, { skin:'#9b7f6a', shirt:'#4a1e1e', pants:'#1e1e24', hair:'#2a1010' }, { skin:'#dfe9ff', shirt:'#aebfe8', pants:'#8b9cd0', hair:'#f2f6ff' } ];   /* 4 = wraith */
  var ZS = [];   /* ZS[variant][frame][level]; variant 3 = brute, 4 = wraith */
  PALS.forEach(function(pal, v){ var frames = []; for(var f = 0; f < 4; f++){ var c = mk(ZW, ZH), x = c.getContext('2d'); drawZombie(x, f === 3 ? 0 : f, pal, v === 3); if(f === 3){ x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, ZW, ZH); } var eyes = f === 3 ? null : eyePixels(c), lv = []; for(var k = 0; k < LEVELS; k++){ lv.push(k === LEVELS - 1 || f === 3 ? (k === LEVELS - 1 ? c : shade(c, k)) : eyesOn(shade(c, k), eyes)); } frames.push(lv); } ZS.push(frames); });
  function eyePixels(src){ var d = src.getContext('2d').getImageData(0, 0, ZW, ZH).data, out = []; for(var i = 0; i < d.length; i += 4){ if(d[i] > 230 && d[i+1] < 80 && d[i+2] < 80 && d[i+3] > 200) out.push((i/4) % ZW, ((i/4) / ZW)|0); } return out; }
  function eyesOn(dark, eyes){ var c = mk(ZW, ZH), x = c.getContext('2d'); x.drawImage(dark, 0, 0); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,40,40,.9)'; x.shadowColor = '#ff3b3b'; x.shadowBlur = 6; for(var i = 0; i < eyes.length; i += 2) x.fillRect(eyes[i], eyes[i+1], 1, 1); return c; }   /* the glow survives the fog: eyes stay lit at every distance */
  function machine(kind, col, label){ var c = mk(ZW, ZH), x = c.getContext('2d');
    if(kind === 'box' || kind === 'boxopen'){ var openBox = kind === 'boxopen'; if(openBox){ var lg = x.createLinearGradient(0, 0, 0, 50); lg.addColorStop(0, 'rgba(140,199,255,0)'); lg.addColorStop(1, 'rgba(140,199,255,.75)'); x.fillStyle = lg; x.fillRect(10, 0, 44, 50); }
      x.fillStyle = '#3b2a1a'; x.fillRect(6, 50, 52, 40); x.fillStyle = '#2a1c10'; x.fillRect(6, 66, 52, 3); x.fillRect(30, 50, 3, 40);
      if(openBox){ x.fillStyle = '#8cc7ff'; x.fillRect(8, 48, 48, 4); x.save(); x.translate(6, 50); x.rotate(-1.15); x.fillStyle = '#5a4028'; x.fillRect(0, -8, 52, 8); x.fillStyle = '#3b2a1a'; x.fillRect(0, -8, 52, 2); x.restore(); }
      else { x.fillStyle = '#5a4028'; x.fillRect(6, 44, 52, 8); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 12; text(x, '?', 32, 30, 30, col, 'center', 800); x.shadowBlur = 0; } }
    else if(kind === 'forge'){ x.fillStyle = '#2a2a30'; x.fillRect(8, 30, 48, 60); x.fillStyle = '#111'; x.fillRect(14, 40, 36, 22); var g = x.createRadialGradient(32, 52, 2, 32, 52, 20); g.addColorStop(0, '#ffd166'); g.addColorStop(.5, '#ff6a00'); g.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = g; x.fillRect(14, 40, 36, 22); x.fillStyle = '#44444c'; x.fillRect(4, 24, 56, 8); x.fillStyle = '#ff8a00'; text(x, 'FORGE', 32, 14, 9, '#ff8a00', 'center'); }
    else { x.fillStyle = '#1d1f26'; x.fillRect(12, 6, 40, 86); x.fillStyle = col; x.fillRect(16, 12, 32, 36); x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(16, 12, 32, 12); text(x, label, 32, 18, 7, '#fff', 'center'); x.fillStyle = '#111'; x.fillRect(18, 54, 28, 14); x.fillStyle = col; x.fillRect(22, 74, 20, 6); x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(14, 8, 3, 82); }
    return levels(c); }
  var MACH = { box:machine('box', '#8cc7ff'), boxopen:machine('boxopen', '#8cc7ff'), forge:machine('forge', '#ff8a00'), ironhide:machine('perk', '#ff5f57', 'IRONHIDE'), quickhands:machine('perk', '#63e6be', 'QUICKHANDS'), fleetfoot:machine('perk', '#8cc7ff', 'FLEETFOOT'), doubletap:machine('perk', '#ffd166', 'DOUBLETAP') };
  var MACH_OFF = {}; Object.keys(MACH).forEach(function(k){ MACH_OFF[k] = MACH[k].map(function(img){ var c = mk(ZW, ZH), x = c.getContext('2d'); x.drawImage(img, 0, 0); x.fillStyle = 'rgba(0,0,0,.55)'; x.globalCompositeOperation = 'source-atop'; x.fillRect(0, 0, ZW, ZH); return c; }); });
  var PU = {}; [['ammo', '#63e6be', 'MAX AMMO'], ['2x', '#ffd166', '2X'], ['insta', '#ff5f57', 'INSTA'], ['nuke', '#a7ffb0', 'NUKE']].forEach(function(p){ var c = mk(48, 48), x = c.getContext('2d'); x.shadowColor = p[1]; x.shadowBlur = 14; x.strokeStyle = p[1]; x.lineWidth = 3; x.beginPath(); x.arc(24, 24, 17, 0, 7); x.stroke(); x.shadowBlur = 0; text(x, p[2], 24, 24, p[2].length > 4 ? 7 : 12, p[1], 'center', 800); PU[p[0]] = { img:c, col:p[1], label:p[2] }; });
  var GREN = (function(){ var c = mk(16, 16), x = c.getContext('2d'); x.fillStyle = '#2f3a2f'; x.beginPath(); x.arc(8, 9, 6, 0, 7); x.fill(); x.fillStyle = '#777'; x.fillRect(6, 1, 4, 4); return c; })();

  /* ---------- the map: 24 x 24, procedurally built for every run. A 3x3 grid of rooms, some merged into halls, joined by a random spanning tree of doors
     (cheaper near the start), with boarded windows for the dead to climb through, wall buys, four perks, the box, the Forge and a power switch. ---------- */
  var MW = 24, MH = 24, MAP, SPAWNS, BUY_AT, MACHINES, BOXM, POWER_AT, MTILE, START, ROOMS, LOCATE;
  var DOOR_COST = { a:750, b:1000, c:1250, d:1250 };
  function genMap(){
    var xs = [0, 7 + ((Math.random()*2)|0), 15 + ((Math.random()*2)|0), MW - 1], ys = [0, 7 + ((Math.random()*2)|0), 15 + ((Math.random()*2)|0), MH - 1];
    MAP = []; for(var y = 0; y < MH; y++){ var row = []; for(var x = 0; x < MW; x++) row.push(x === 0 || y === 0 || x === MW - 1 || y === MH - 1 || xs.indexOf(x) > -1 || ys.indexOf(y) > -1 ? '#' : '.'); MAP.push(row); }
    var wallChar = function(){ var r = Math.random(); return r < .5 ? '#' : r < .82 ? '%' : '='; };
    var vch = [wallChar(), wallChar()], hch = [wallChar(), wallChar()];
    for(var yy = 1; yy < MH - 1; yy++){ MAP[yy][xs[1]] = vch[0]; MAP[yy][xs[2]] = vch[1]; } for(var xx = 1; xx < MW - 1; xx++){ MAP[ys[1]][xx] = hch[0]; MAP[ys[2]][xx] = hch[1]; }
    ROOMS = []; for(var r = 0; r < 3; r++) for(var c = 0; c < 3; c++) ROOMS.push({ id:r*3 + c, c:c, r:r, x0:xs[c] + 1, x1:xs[c+1] - 1, y0:ys[r] + 1, y1:ys[r+1] - 1, grp:r*3 + c });
    var room = function(c, r){ return ROOMS[r*3 + c]; };
    /* merge one or two neighbouring pairs into halls */
    var merges = 1 + ((Math.random()*2)|0), tries = 0;
    while(merges > 0 && tries++ < 20){ var a = ROOMS[(Math.random()*9)|0], vert = Math.random() < .5, b = vert ? (a.r < 2 ? room(a.c, a.r + 1) : null) : (a.c < 2 ? room(a.c + 1, a.r) : null); if(!b || a.grp === b.grp) continue;
      if(vert){ for(var mx = a.x0 + 1; mx <= a.x1 - 1; mx++) MAP[ys[a.r + 1]][mx] = '.'; } else { for(var my = a.y0 + 1; my <= a.y1 - 1; my++) MAP[my][xs[a.c + 1]] = '.'; }
      var g0 = b.grp; ROOMS.forEach(function(q){ if(q.grp === g0) q.grp = a.grp; }); merges--; }
    /* spanning tree over the 3x3 grid (kruskal on shuffled edges), then a loop or two */
    var edges = []; ROOMS.forEach(function(q){ if(q.c < 2) edges.push([q, room(q.c + 1, q.r), 'v']); if(q.r < 2) edges.push([q, room(q.c, q.r + 1), 'h']); });
    edges.sort(function(){ return Math.random() - .5; });
    var find = function(q){ return q.grp; }, doorsOut = [];
    edges.forEach(function(e){ if(find(e[0]) !== find(e[1])){ var g1 = find(e[1]), g2 = find(e[0]); ROOMS.forEach(function(q){ if(q.grp === g1) q.grp = g2; }); doorsOut.push(e); } });
    edges.filter(function(e){ return doorsOut.indexOf(e) < 0 && MAP[e[2] === 'v' ? e[0].y0 + 1 : ys[e[0].r + 1]][e[2] === 'v' ? xs[e[0].c + 1] : e[0].x0 + 1] !== '.'; }).slice(0, 1 + ((Math.random()*2)|0)).forEach(function(e){ doorsOut.push(e); });
    /* start room and door tiers by hop count */
    var startRoom = ROOMS[(Math.random()*9)|0]; START = { x:startRoom.x0 + 1.5, y:((startRoom.y0 + startRoom.y1) / 2 | 0) + .5, a:0 };
    var adj = {}; ROOMS.forEach(function(q){ adj[q.id] = []; }); doorsOut.forEach(function(e){ adj[e[0].id].push(e[1].id); adj[e[1].id].push(e[0].id); });
    ROOMS.forEach(function(q){ ROOMS.forEach(function(w){ if(q !== w && q.grp === w.grp && Math.abs(q.c - w.c) + Math.abs(q.r - w.r) === 1 && adj[q.id].indexOf(w.id) < 0) adj[q.id].push(w.id); }); });
    var dist = {}; dist[startRoom.id] = 0; var queue = [startRoom.id]; while(queue.length){ var cur = queue.shift(); adj[cur].forEach(function(n){ if(dist[n] === undefined){ dist[n] = dist[cur] + 1; queue.push(n); } }); }
    var used = {}, mark = function(x, y){ used[x+','+y] = true; };
    doorsOut.forEach(function(e){ var A = e[0], B = e[1], tier = Math.max(dist[A.id] || 0, dist[B.id] || 0), ch = tier <= 1 ? 'a' : tier === 2 ? 'b' : (Math.random() < .5 ? 'c' : 'd'), dx, dy;
      if(e[2] === 'v'){ dx = xs[A.c + 1]; var lo = Math.max(A.y0, B.y0) + 1, hi = Math.min(A.y1, B.y1) - 1; dy = lo + ((Math.random()*(hi - lo + 1))|0); } else { dy = ys[A.r + 1]; var lo2 = Math.max(A.x0, B.x0) + 1, hi2 = Math.min(A.x1, B.x1) - 1; dx = lo2 + ((Math.random()*(hi2 - lo2 + 1))|0); }
      MAP[dy][dx] = ch; mark(dx, dy); [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ mark(dx + o[0], dy + o[1]); }); });
    /* wall tiles of a room that face its floor: candidates for windows, buys, the switch */
    var perim = function(q, outerOnly){ var out = []; for(var x = q.x0; x <= q.x1; x++){ if(!outerOnly || q.r === 0) out.push([x, q.y0 - 1, x, q.y0]); if(!outerOnly || q.r === 2) out.push([x, q.y1 + 1, x, q.y1]); } for(var y = q.y0; y <= q.y1; y++){ if(!outerOnly || q.c === 0) out.push([q.x0 - 1, y, q.x0, y]); if(!outerOnly || q.c === 2) out.push([q.x1 + 1, y, q.x1, y]); }
      return out.filter(function(p){ var ch = MAP[p[1]][p[0]]; return (ch === '#' || ch === '%' || ch === '=') && !used[p[0]+','+p[1]] && MAP[p[3]][p[2]] === '.'; }); };
    var pick = function(arr){ return arr.length ? arr[(Math.random()*arr.length)|0] : null; };
    var take = function(q, outerOnly){ var p = pick(perim(q, outerOnly)); if(p){ mark(p[0], p[1]); mark(p[2], p[3]); } return p; };
    /* windows: one or two per room, on outside walls where the room has one */
    SPAWNS = []; ROOMS.forEach(function(q){ var n = 1 + (Math.random() < .5 ? 1 : 0), outer = q.r === 0 || q.r === 2 || q.c === 0 || q.c === 2; for(var i = 0; i < n; i++){ var p = take(q, outer); if(p){ MAP[p[1]][p[0]] = 'W'; SPAWNS.push({ x:p[2] + .5, y:p[3] + .5 }); } } });
    /* machines on the floor beside a wall: box near the start, the Forge far away, perks spread out */
    var byDist = ROOMS.slice().sort(function(p, q){ return (dist[q.id] || 0) - (dist[p.id] || 0); }), others = ROOMS.filter(function(q){ return q !== startRoom; });
    MACHINES = []; MTILE = {}; BUY_AT = {};
    var floorSpot = function(q){ var p = take(q, false); if(!p) return null; MTILE[p[2]+','+p[3]] = true; return { x:p[2] + .5, y:p[3] + .5 }; };
    var forgeRoom = byDist[0], boxRoom = pick(others.filter(function(q){ return dist[q.id] === 1; })) || pick(others), powerRoom = pick(others.filter(function(q){ return q !== forgeRoom; })) || forgeRoom;
    var m; if((m = floorSpot(boxRoom))){ m.kind = 'box'; MACHINES.push(m); } if((m = floorSpot(forgeRoom))){ m.kind = 'forge'; MACHINES.push(m); }
    var perkRooms = others.slice().sort(function(){ return Math.random() - .5; }); ['quickhands', 'ironhide', 'fleetfoot', 'doubletap'].forEach(function(k, i){ var q = perkRooms[i % perkRooms.length], sp = floorSpot(q); if(sp){ sp.kind = k; MACHINES.push(sp); } });
    MACHINES.forEach(function(mm){ MTILE[(mm.x|0)+','+(mm.y|0)] = mm; }); BOXM = MACHINES.filter(function(mm){ return mm.kind === 'box'; })[0] || MACHINES[0];
    var pw = take(powerRoom, false) || take(forgeRoom, false); if(pw){ MAP[pw[1]][pw[0]] = 'Y'; POWER_AT = pw[0]+','+pw[1]; }
    var st = take(startRoom, false); if(st){ MAP[st[1]][st[0]] = 'X'; BUY_AT[st[0]+','+st[1]] = 'stitcher'; }
    ['doorman', 'longbow', 'anvil', 'stitcher', 'doorman'].forEach(function(id, i){ var q = perkRooms[(i + 2) % perkRooms.length], p = take(q, false); if(p){ MAP[p[1]][p[0]] = 'X'; BUY_AT[p[0]+','+p[1]] = id; } });
    /* dressing: shelves on a few interior walls, a short stub of wall inside the bigger rooms (never the start room) */
    ROOMS.forEach(function(q){ if(q === startRoom) return; perim(q, false).filter(function(){ return Math.random() < .12; }).slice(0, 2).forEach(function(p){ MAP[p[1]][p[0]] = 'B'; mark(p[0], p[1]); });
      if(q.x1 - q.x0 >= 5 && q.y1 - q.y0 >= 5 && Math.random() < .55){ var len = 2 + ((Math.random()*2)|0), horiz = Math.random() < .5, sx = q.x0 + 2 + ((Math.random()*Math.max(1, q.x1 - q.x0 - 3 - (horiz ? len : 0)))|0), sy = q.y0 + 2 + ((Math.random()*Math.max(1, q.y1 - q.y0 - 3 - (horiz ? 0 : len)))|0), ok = true;
        for(var i = 0; i < len && ok; i++){ var tx = sx + (horiz ? i : 0), ty = sy + (horiz ? 0 : i); for(var oy = -1; oy <= 1 && ok; oy++) for(var ox = -1; ox <= 1 && ok; ox++){ var kx = tx + ox, ky = ty + oy; if(!MAP[ky] || MAP[ky][kx] !== '.' || MTILE[kx+','+ky] || used[kx+','+ky]) ok = false; } }
        if(ok) for(var j = 0; j < len; j++) MAP[sy + (horiz ? 0 : j)][sx + (horiz ? j : 0)] = Math.random() < .5 ? '#' : '%'; } });    MAP[START.y|0][START.x|0] = 'P';
    /* where a test (or a curious player) can stand to face each thing */
    var faceFrom = function(tx, ty){ var opts = [[1,0],[-1,0],[0,1],[0,-1]].map(function(o){ return { x:tx + o[0] + .5, y:ty + o[1] + .5, a:Math.atan2(-o[1], -o[0]), ok:MAP[ty + o[1]] && MAP[ty + o[1]][tx + o[0]] === '.' && !MTILE[(tx + o[0])+','+(ty + o[1])] }; }).filter(function(o){ return o.ok; }); return opts[0] ? { x:opts[0].x, y:opts[0].y, a:opts[0].a } : null; };
    LOCATE = { start:START, machines:{}, doors:[], buys:[], power:null };
    MACHINES.forEach(function(mm){ LOCATE.machines[mm.kind] = faceFrom(mm.x|0, mm.y|0); });
    for(var ly = 0; ly < MH; ly++) for(var lx = 0; lx < MW; lx++){ var ch = MAP[ly][lx]; if(ch === 'a' || ch === 'b' || ch === 'c' || ch === 'd'){ var f = faceFrom(lx, ly); if(f) LOCATE.doors.push({ x:f.x, y:f.y, a:f.a, cost:DOOR_COST[ch], tx:lx, ty:ly }); } if(ch === 'X'){ var f2 = faceFrom(lx, ly); if(f2) LOCATE.buys.push({ x:f2.x, y:f2.y, a:f2.a, id:BUY_AT[lx+','+ly] }); } if(ch === 'Y') LOCATE.power = faceFrom(lx, ly); }
    LOCATE.doors.sort(function(p, q){ return p.cost - q.cost; });
  }
  genMap();
  var BOX_T = 3.4;   /* seconds the mystery box spins before it hands over a gun */
  var WEAPONS = {
    sidearm:  { name:'Sidearm',  up:'Mustang',   dmg:60,  rpm:420, mag:8,   res:64,  reload:1.2, spread:.012, auto:false, cost:0 },
    stitcher: { name:'Stitcher', up:'Seamripper',dmg:45,  rpm:780, mag:32,  res:192, reload:1.8, spread:.03,  auto:true,  cost:1200 },
    doorman:  { name:'Doorman',  up:'Bouncer',   dmg:38,  rpm:95,  mag:6,   res:36,  reload:2.6, spread:.085, auto:false, cost:1500, pellets:8, range:9 },
    longbow:  { name:'Longbow',  up:'Skyhook',   dmg:420, rpm:60,  mag:5,   res:40,  reload:2.2, spread:0,    auto:false, cost:1800, pierce:3 },
    anvil:    { name:'Anvil',    up:'Hammerfall',dmg:66,  rpm:600, mag:100, res:300, reload:4.4, spread:.045, auto:true,  cost:2000 },
    prism:    { name:'Prism',    up:'Spectrum',  dmg:900, rpm:170, mag:20,  res:80,  reload:2.8, spread:.005, auto:false, cost:0, splash:1.4, box:true }
  };
  var PERKS = { ironhide:{ name:'Ironhide', cost:2500, col:'#ff5f57', blurb:'250 health' }, quickhands:{ name:'Quickhands', cost:3000, col:'#63e6be', blurb:'reload twice as fast' }, fleetfoot:{ name:'Fleetfoot', cost:2000, col:'#8cc7ff', blurb:'faster sprint and regen' }, doubletap:{ name:'Doubletap', cost:2000, col:'#ffd166', blurb:'fire rate +35%, damage +60%' } };

  /* ---------- weapon viewmodels. Each gun is a side profile built from solids in gun space (x forward, y up), extruded and projected
     obliquely so it sits bottom-right with the barrel running up-left to the crosshair. GUN_F/U/Z are the screen vectors of that space. ---------- */
  var GUN_F = [-.60, -.46], GUN_U = [.06, -1], GUN_Z = [-.80, -.08];
  var GUN_SC = { sidearm:2.1, stitcher:1.6, doorman:1.5, longbow:1.25, anvil:1.35, prism:1.7 };   /* long guns are drawn smaller so the barrel stops short of the crosshair */
  var GUN_MZ = { sidearm:[136, 32], stitcher:[234, 33], doorman:[250, 32], longbow:[306, 23], anvil:[272, 28], prism:[200, 27] };   /* muzzle in gun space */
  var GUN_PA = .0016, GUN_X0 = Math.log(1 + 100*GUN_PA)/GUN_PA;   /* fake perspective: things further down the barrel shrink and bunch up, so the gun visibly recedes */
  function gunPt(x, y, z, s){ z = z || 0; var k = 1/(1 + (x + 100)*GUN_PA), X = Math.log(1 + (x + 100)*GUN_PA)/GUN_PA - GUN_X0; return [ (X*GUN_F[0] + (y*GUN_U[0] + z*GUN_Z[0])*k)*s, (X*GUN_F[1] + (y*GUN_U[1] + z*GUN_Z[1])*k)*s ]; }
  function tint(hex, k){ var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, f = function(v){ return clamp(Math.round(k >= 0 ? v + (255 - v)*k : v*(1 + k)), 0, 255); }; return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
  function gunShape(c, id, up, s, pulse, tt){ tt = tt || 0;
    var poly = function(pts, z, col){ c.fillStyle = col; c.beginPath(); pts.forEach(function(q, i){ var v = gunPt(q[0], q[1], z, s); if(i) c.lineTo(v[0], v[1]); else c.moveTo(v[0], v[1]); }); c.closePath(); c.fill(); };
    /* pts counter-clockwise in gun space: far face, one quad per camera-facing edge (lit by its outward normal), near face on top */
    var solid = function(pts, thk, col){ poly(pts, thk, tint(col, -.45)); for(var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i+1) % pts.length], nx = b[1] - a[1], ny = -(b[0] - a[0]), L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L; if(nx*.55 - ny*.45 >= 0) continue;   /* the camera sits behind, right of and above the gun: front and bottom faces are never seen */
        var v0 = gunPt(a[0], a[1], 0, s), v1 = gunPt(b[0], b[1], 0, s), v2 = gunPt(b[0], b[1], thk, s), v3 = gunPt(a[0], a[1], thk, s); c.fillStyle = tint(col, ny > .3 ? .3 : ny < -.3 ? -.55 : nx < 0 ? -.15 : -.35); c.beginPath(); c.moveTo(v0[0], v0[1]); c.lineTo(v1[0], v1[1]); c.lineTo(v2[0], v2[1]); c.lineTo(v3[0], v3[1]); c.closePath(); c.fill(); } poly(pts, 0, col); };
    var box = function(x, y, w, h, thk, col){ solid([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], thk, col); };
    var flat = function(x, y, w, h, col){ poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], -.01, col); };
    var grip = function(x, y, w, h, lean, thk, col){ solid([[x - lean, y - h], [x - lean + w, y - h], [x + w, y], [x, y]], thk, col); };
    var ring = function(x, y, r, col, glow){ var v = gunPt(x, y, -.01, s); c.save(); if(glow){ c.shadowColor = col; c.shadowBlur = 14*s; } c.fillStyle = col; c.beginPath(); c.arc(v[0], v[1], r*s, 0, 7); c.fill(); c.restore(); };
    var acc = up ? '#ff8a00' : '#63e6be', dark = '#1b1c22', mid = '#2e3039', light = '#454858', stripes = [];
    var stripe = function(x, y, w, h){ stripes.push([x, y, w, h]); };
    if(id === 'sidearm'){ grip(10, -6, 30, 64, 10, 20, '#2b2d36'); solid([[46, -24], [72, -22], [74, -6], [44, -6]], 6, '#111'); box(0, -6, 112, 24, 22, mid); box(-6, 18, 130, 26, 22, '#23252d'); for(var i = 0; i < 5; i++) flat(4 + i*5, 22, 2, 18, '#101014'); box(124, 26, 12, 12, 12, '#0f1014'); box(2, 44, 8, 6, 18, dark); box(116, 44, 6, 6, 4, dark); stripe(30, 36, 80, 4); }
    else if(id === 'stitcher'){ box(-72, 12, 72, 14, 10, '#1e2028'); box(-86, 2, 14, 32, 16, '#111'); solid([[74, -86], [100, -86], [96, -8], [70, -8]], 16, dark); grip(16, -6, 30, 56, 8, 20, '#2b2d36'); grip(112, -6, 24, 38, -4, 16, '#23252d'); box(0, -6, 152, 26, 24, mid); box(-10, 20, 170, 30, 24, '#262830'); box(160, 22, 50, 22, 18, '#1e2028'); for(var j = 0; j < 3; j++) flat(168 + j*12, 28, 6, 10, '#0a0a0d'); box(210, 28, 24, 10, 8, '#0f1014'); box(0, 50, 150, 5, 12, dark); box(150, 50, 8, 12, 4, dark); stripe(26, 42, 120, 4); }
    else if(id === 'doorman'){ solid([[-134, -34], [-40, -2], [-40, 40], [-124, 22], [-146, -10]], 22, '#6b4324'); box(-40, -2, 100, 44, 26, '#2b2d36'); flat(2, 14, 36, 20, '#0a0a0d'); solid([[-16, -18], [10, -16], [12, -2], [-20, -2]], 6, '#111'); box(60, 4, 150, 16, 16, '#23252d'); box(60, 24, 190, 16, 16, '#1e2028'); box(112, -2, 58, 30, 24, '#7a4d2a'); for(var k = 0; k < 5; k++) flat(118 + k*11, 2, 3, 22, '#4a2c16'); box(244, 40, 6, 5, 6, acc); stripe(60, 40, 44, 4); }
    else if(id === 'longbow'){ solid([[-166, -28], [-60, -2], [-60, 36], [-152, 30], [-176, -2]], 22, '#1f2a22'); flat(-134, -8, 34, 14, '#0a0a0d'); box(-60, -2, 152, 42, 26, '#2b2d36'); box(6, 22, 22, 10, 4, light); grip(22, -2, 36, 32, -4, 18, dark); grip(-52, -2, 30, 52, 10, 20, '#23252d'); box(92, 14, 190, 16, 14, '#1e2028'); box(282, 10, 24, 26, 18, '#0f1014'); flat(286, 14, 3, 18, '#000'); flat(294, 14, 3, 18, '#000'); box(-20, 40, 80, 10, 12, dark); box(-40, 50, 140, 28, 24, '#23252d'); box(100, 52, 14, 24, 22, '#0f1218'); flat(102, 56, 10, 16, up ? '#ffb15c' : '#63e6be'); box(-54, 54, 14, 20, 20, '#111'); solid([[196, -46], [206, -46], [212, 14], [200, 14]], 6, '#23252d'); stripe(-20, 36, 80, 4); }
    else if(id === 'anvil'){ box(-112, 4, 82, 30, 22, '#23252d'); box(-126, -4, 14, 46, 24, '#111'); box(-30, -4, 170, 54, 30, '#33363f'); flat(-30, 40, 170, 10, '#262830'); solid([[24, 50], [120, 50], [100, 68], [42, 68]], 12, dark); var oct = []; for(var q = 0; q < 8; q++) oct.push([52 + Math.cos(q*Math.PI/4)*36, -34 + Math.sin(q*Math.PI/4)*36]); solid(oct, 26, '#1e2028'); ring(52, -34, 6, '#0a0a0d'); grip(-20, -4, 30, 54, 10, 20, '#2b2d36'); box(140, 10, 92, 34, 24, '#262830'); for(var r2 = 0; r2 < 5; r2++) flat(150 + r2*14, 18, 8, 18, '#0a0a0d'); box(232, 20, 40, 16, 14, '#0f1014'); solid([[186, -48], [196, -48], [184, 10], [174, 10]], 6, '#23252d'); solid([[150, -48], [160, -48], [184, 10], [174, 10]], 6, '#23252d'); stripe(0, 50, 130, 4); }
    else { var gc = up ? '#ffb15c' : '#a78bfa'; solid([[-50, 28], [-40, 0], [150, 8], [162, 40], [140, 54], [-30, 58]], 26, '#2a2140'); grip(-20, 0, 32, 54, 10, 20, '#1f1a30'); solid([[160, 14], [198, 20], [198, 34], [160, 42]], 18, '#17122a'); solid([[40, 54], [120, 54], [100, 74], [60, 74]], 8, '#3b2f5c'); ring(20, 30, 9, gc, true); ring(60, 30, 9, gc, true); ring(100, 30, 9, gc, true); ring(200, 27, 10, gc, true); c.save(); c.shadowColor = gc; c.shadowBlur = 12*s; flat(-20, 44, 150, 4, gc); c.restore(); }
    c.save(); if(up){ c.shadowColor = acc; c.shadowBlur = (18 + 22*pulse)*s; c.globalAlpha = .7 + .3*pulse; }
    stripes.forEach(function(st){ flat(st[0], st[1], st[2], st[3], acc); if(up){ flat(st[0], st[1] - 8, st[2]*.7, 2, acc); flat(st[0] + st[2]*.2, st[1] - 16, st[2]*.5, 2, acc);
      /* forged: a bright charge runs along every vein, and the body breathes light */
      var run = (tt*160) % (st[2] + 30) - 30, seg = 22; [[st[1], st[2], st[3]], [st[1] - 8, st[2]*.7, 2], [st[1] - 16, st[2]*.5, 2]].forEach(function(v, k){ var x0 = st[0] + Math.max(0, run - k*14), x1 = Math.min(st[0] + v[1], st[0] + run - k*14 + seg); if(x1 > x0){ c.shadowBlur = 30*s; flat(x0, v[0], x1 - x0, v[2], '#fff2d6'); } }); } });
    c.restore();
    if(up){ c.save(); c.globalCompositeOperation = 'lighter'; var hv = gunPt(70, 20, 0, s), hr = (110 + 30*pulse)*s, hg = c.createRadialGradient(hv[0], hv[1], 0, hv[0], hv[1], hr); hg.addColorStop(0, 'rgba(255,138,0,'+(.16 + .1*pulse)+')'); hg.addColorStop(1, 'rgba(255,138,0,0)'); c.fillStyle = hg; c.beginPath(); c.arc(hv[0], hv[1], hr, 0, 7); c.fill(); for(var e = 0; e < 5; e++){ var ph = (tt*1.3 + e*.2) % 1, ev = gunPt(20 + ((e*53) % 120) + ph*10, 30 - ph*60, -.02, s); c.fillStyle = 'rgba(255,200,120,'+((1 - ph)*.8)+')'; c.beginPath(); c.arc(ev[0], ev[1], (1.5 + (1 - ph)*1.5)*s, 0, 7); c.fill(); } c.restore(); }
    return GUN_MZ[id] || [140, 30];
  }

  /* ---------- sound: tiny WebAudio synth, created on the first shot ---------- */
  function Synth(){ var ac = null, muted = false, master; function ctx(){ if(ac || muted) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .35; master.connect(ac.destination); } catch(e){ ac = null; } return ac; }
    function noise(dur, freq, gain, q){ var a = ctx(); if(!a) return; var n = a.sampleRate * dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/n, 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(); }
    function tone(type, f0, f1, dur, gain){ var a = ctx(); if(!a) return; var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, a.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), a.currentTime + dur); g.gain.setValueAtTime(gain, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur); o.connect(g); g.connect(master); o.start(); o.stop(a.currentTime + dur); }
    return { toggle: function(){ muted = !muted; if(muted && ac){ try { ac.suspend(); } catch(e){} } else if(ac){ try { ac.resume(); } catch(e){} } return muted; }, isMuted: function(){ return muted; },
      shot: function(k){ if(k === 'doorman'){ noise(.32, 900, .9, .5); tone('sine', 120, 40, .25, .5); } else if(k === 'prism'){ tone('sawtooth', 900, 200, .25, .3); tone('square', 1400, 300, .18, .12); } else if(k === 'longbow'){ noise(.28, 1600, .8); tone('sine', 200, 50, .3, .5); } else if(k === 'anvil'){ noise(.14, 1400, .6); tone('sine', 150, 60, .1, .35); } else { noise(.12, 2200, .5); tone('sine', 220, 80, .09, .3); } },
      empty: function(){ tone('square', 1200, 900, .05, .08); }, laser: function(){ tone('sawtooth', 1700, 240, .16, .2); tone('square', 2600, 520, .09, .06); }, tick: function(){ tone('square', 1100, 900, .035, .07); }, reload: function(){ tone('square', 700, 500, .06, .1); setTimeout(function(){ tone('square', 500, 900, .06, .1); }, 140); },
      hit: function(){ tone('sine', 700, 500, .05, .12); }, kill: function(){ tone('sawtooth', 300, 80, .18, .18); }, hurt: function(){ noise(.25, 500, .8); tone('sawtooth', 120, 60, .3, .4); },
      growl: function(){ tone('sawtooth', 90 + Math.random()*40, 60, .5, .12); }, buy: function(){ tone('sine', 660, 990, .12, .2); setTimeout(function(){ tone('sine', 990, 1320, .15, .2); }, 110); }, deny: function(){ tone('square', 200, 150, .18, .15); },
      wave: function(){ tone('sawtooth', 80, 40, 1.4, .4); tone('sine', 55, 30, 1.6, .5); }, wraith: function(){ tone('sine', 520, 180, 2.2, .18); tone('sawtooth', 260, 70, 2.6, .12); noise(2.4, 300, .35, .3); setTimeout(function(){ tone('sine', 700, 210, 1.6, .12); }, 500); }, power: function(){ tone('sawtooth', 60, 220, .9, .3); noise(.8, 600, .5); }, boom: function(){ noise(.7, 400, 1.4, .3); tone('sine', 90, 25, .7, .9); }, pickup: function(){ tone('sine', 880, 1760, .25, .2); tone('sine', 1320, 1980, .3, .15); },
      close: function(){ if(ac){ try { ac.close(); } catch(e){} ac = null; } } }; }

  var BUYTEX = {}; Object.keys(WEAPONS).forEach(function(k){ if(!WEAPONS[k].box) BUYTEX[k] = buyTex(WEAPONS[k].name, WEAPONS[k].cost); });
  var DOORTEX = {}; Object.keys(DOOR_COST).forEach(function(k){ DOORTEX[k] = doorTex(DOOR_COST[k]); });
  var isDoor = function(ch){ return ch === 'a' || ch === 'b' || ch === 'c' || ch === 'd'; };

  /* ---------- the game ---------- */
  function nightshift(api){
    var g = {}, snd = Synth(), touch = api.touch, zbuf = new Float32Array(RAYS), flow = new Int16Array(MW*MH), flowKey = '';
    var special, fogK, P, zombies, pickups, grenades, parts, wave, toSpawn, brutes, spawnT, alive, kills, points, total, hp, maxhp, regenT, doors, power, perks, weapons, slot, fireT, reloadT, reloading, held, mouseDown, trigger, shake, flash, hitM, hitKill, dmgFlash, whiteFlash, banner, bannerT, over, puX2, puInsta, gren, grenT, meleeT, melee, msg, msgT, boxRoll, boxName, boxLast, beams, mz, swapT, gunPos, prompt, t, bob, between, recoil, dragX, flick = 0, flickT = 4;
    function ch(x, y){ return (x < 0 || y < 0 || x >= MW || y >= MH) ? '#' : MAP[y][x]; }
    function walk(x, y){ var c = ch(x, y); if(c === '.' || c === 'P') return !MTILE[x+','+y]; if(isDoor(c)) return !!doors[x+','+y]; return false; }
    function cast(px, py, dx, dy){
      var mx = px|0, my = py|0, ddx = Math.abs(1/dx), ddy = Math.abs(1/dy), sx, sy, stx, sty, side = 0, c = '#', n;
      if(dx < 0){ stx = -1; sx = (px - mx)*ddx; } else { stx = 1; sx = (mx + 1 - px)*ddx; }
      if(dy < 0){ sty = -1; sy = (py - my)*ddy; } else { sty = 1; sy = (my + 1 - py)*ddy; }
      for(n = 0; n < 64; n++){ if(sx < sy){ sx += ddx; mx += stx; side = 0; } else { sy += ddy; my += sty; side = 1; } c = ch(mx, my); if(c !== '.' && c !== 'P' && !(isDoor(c) && doors[mx+','+my])) break; }
      var dist = side === 0 ? sx - ddx : sy - ddy, wx = side === 0 ? py + dist*dy : px + dist*dx; wx -= Math.floor(wx); var tx = (wx*TS)|0; if((side === 0 && dx < 0) || (side === 1 && dy > 0)) tx = TS - 1 - tx;   /* our camera plane is (-dirY, dirX), the mirror of the textbook one, so the flip is too */
      return { dist:dist, side:side, ch:c, tx:tx, mx:mx, my:my };
    }
    function los(ax, ay, bx, by){ var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if(d < .01) return true; return cast(ax, ay, dx/d, dy/d).dist >= d; }
    function moveCircle(o, nx, ny, r){ var ok = function(x, y){ return walk((x - r)|0, (y - r)|0) && walk((x + r)|0, (y - r)|0) && walk((x - r)|0, (y + r)|0) && walk((x + r)|0, (y + r)|0); }; if(ok(nx, o.y)) o.x = nx; if(ok(o.x, ny)) o.y = ny; }
    function computeFlow(){ var px = P.x|0, py = P.y|0, key = px+','+py+':'+Object.keys(doors).length; if(key === flowKey) return; flowKey = key; flow.fill(-1); var q = [px + py*MW]; flow[q[0]] = 0; for(var h = 0; h < q.length; h++){ var i = q[h], x = i % MW, y = (i / MW)|0, d = flow[i] + 1; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ var nx = x + o[0], ny = y + o[1], j = nx + ny*MW; if(nx < 0 || ny < 0 || nx >= MW || ny >= MH || flow[j] > -1 || !walk(nx, ny)) return; flow[j] = d; q.push(j); }); } }
    function stat(w){ var b = WEAPONS[w.id], up = w.up; return { id:w.id, up:!!up, dmg:b.dmg * (up ? 2.5 : 1) * (perks.doubletap ? 1.6 : 1), rpm:b.rpm * (perks.doubletap ? 1.35 : 1), mag:Math.round(b.mag * (up ? 1.5 : 1)), res:Math.round(b.res * (up ? 1.5 : 1)), reload:b.reload / (perks.quickhands ? 2 : 1), spread:b.spread, auto:b.auto, pellets:b.pellets || 1, pierce:b.pierce || 1, splash:b.splash || 0, range:b.range || 40, name:up ? b.up : b.name }; }
    function giveWeapon(id){ var w = { id:id, up:false }, st = stat(w); w.mag = st.mag; w.res = st.res; if(weapons.length < 2){ weapons.push(w); slot = weapons.length - 1; } else weapons[slot] = w; reloading = false; fireT = .3; swapT = .34; }
    function cur(){ return weapons[slot]; }
    function addPoints(n){ n = Math.round(n * (puX2 > 0 ? 2 : 1)); points += n; total += n; api.score(total); }
    function say(s, d){ msg = s; msgT = d || 1.8; }
    function status(){ api.status('wave '+wave+'  \u00b7  '+kills+' kill'+(kills === 1 ? '' : 's')+'  \u00b7  '+points+' pts'); }
    g.reset = function(){
      genMap(); P = { x:START.x, y:START.y, a:START.a }; special = false; fogK = 1; zombies = []; pickups = []; grenades = []; parts = []; wave = 0; toSpawn = 0; brutes = 0; spawnT = 1; alive = 0; kills = 0; points = 500; total = 0; hp = 100; maxhp = 100; regenT = 0; doors = {}; power = false; perks = {}; weapons = []; slot = 0; fireT = 0; reloadT = 0; reloading = false; held = {}; mouseDown = false; trigger = false; shake = 0; flash = 0; hitM = 0; hitKill = false; dmgFlash = 0; whiteFlash = 0; banner = ''; bannerT = 0; over = false; puX2 = 0; puInsta = 0; gren = 4; grenT = 0; meleeT = 0; melee = 0; msg = ''; msgT = 0; boxRoll = 0; boxName = ''; boxLast = ''; beams = []; mz = null; swapT = 0; prompt = null; t = 0; bob = 0; between = 0; recoil = 0; dragX = null; flowKey = '';
      giveWeapon('sidearm'); fireT = 0; api.score(0); startWave(1); status();
    };
    function waveCount(n){ return Math.min(60, Math.round(5 + n*3 + n*n*.18)); }
    function startWave(n){ wave = n; special = n % 5 === 0; toSpawn = special ? Math.round(waveCount(n) * .7) : waveCount(n); brutes = !special && n % 4 === 0 ? Math.min(4, 1 + (n/4|0)) : 0; banner = special ? 'THE WRAITHS' : 'WAVE '+n; bannerT = 3.2; gren = 4; spawnT = 1.2; if(special){ snd.wraith(); say('Something cold is coming through the fog', 3); } else snd.wave(); status(); }   /* every fifth wave the fog rolls in and the wraiths come: fast, faint, and the last one drops a max ammo */
    function zombieHp(){ return wave < 10 ? 150 + (wave-1)*100 : Math.round(1050 * Math.pow(1.1, wave - 9)); }
    function spawn(){ var cands = SPAWNS.filter(function(s){ var f = flow[(s.x|0) + (s.y|0)*MW]; return f >= 5 && f <= 40; }); if(!cands.length) cands = SPAWNS.filter(function(s){ return flow[(s.x|0) + (s.y|0)*MW] >= 0; }); if(!cands.length) return;
      var s = cands[(Math.random()*cands.length)|0], wraith = special, brute = !wraith && brutes > 0 && Math.random() < .4, runner = !wraith && !brute && wave >= 4 && Math.random() < Math.min(.5, (wave-3)*.08), hp0 = zombieHp() * (wraith ? .55 : brute ? 3.5 : runner ? .8 : 1);
      if(brute) brutes--; toSpawn--; alive++;
      zombies.push({ x:s.x + rnd(-.2, .2), y:s.y + rnd(-.2, .2), hp:hp0, maxhp:hp0, speed:wraith ? Math.min(3.6, 2.6 + wave*.03) : brute ? .95 : runner ? Math.min(3.4, 2.3 + wave*.05) : Math.min(2.1, 1.0 + wave*.08), dmg:wraith ? 18 : brute ? 45 : runner ? 20 : 25, brute:brute, wraith:wraith, v:wraith ? 4 : brute ? 3 : (Math.random()*3)|0, rise:wraith ? .5 : wave <= 2 ? 2.2 : 1.3, rise0:wraith ? .5 : wave <= 2 ? 2.2 : 1.3, anim:Math.random()*2, atk:0, cool:0, flash:0, dead:false, deadT:0 }); }
    function hurt(d){ if(over) return; hp -= d; dmgFlash = .6; regenT = perks.fleetfoot ? 2 : 4; shake = Math.max(shake, .9); snd.hurt(); if(hp <= 0){ hp = 0; over = true; api.status('overrun on wave '+wave+'  \u00b7  '+kills+' kills'); api.over('Overrun on wave '+wave+' with '+kills+' kill'+(kills === 1 ? '' : 's')); } }
    function damage(z, d, hs, src){ if(z.dead || z.rise > .6) return false; if(puInsta > 0) d = 1e9; z.hp -= d; z.flash = .08; hitM = .14; hitKill = false; addPoints(hs ? 20 : 10); blood(z, 6);   /* a headshot is worth double, on the hit and on the kill */
      if(z.hp <= 0){ z.dead = true; z.deadT = .38; alive--; kills++; hitKill = true; addPoints(src === 'melee' ? 130 : hs ? 120 : 60); snd.kill(); blood(z, 14);
        if(special && toSpawn <= 0 && alive <= 0){ pickups.push({ x:z.x, y:z.y, kind:'ammo', t:40 }); say('The last wraith left something behind', 2.5); snd.pickup(); }
        else if(Math.random() < .035 && pickups.length < 2) pickups.push({ x:z.x, y:z.y, kind:['ammo','2x','insta','nuke'][(Math.random()*4)|0], t:22 }); status(); } else snd.hit(); return true; }
    function blood(z, n){ for(var i = 0; i < n && parts.length < 140; i++) parts.push({ x:z.x, y:z.y, z:.45 + rnd(0, .4), vx:rnd(-1.5, 1.5), vy:rnd(-1.5, 1.5), vz:rnd(.5, 2.5), t:rnd(.3, .7), col:'#8a1010' }); }
    function hitscan(ang, st){ var dx = Math.cos(ang), dy = Math.sin(ang), wall = cast(P.x, P.y, dx, dy).dist, hits = [];
      zombies.forEach(function(z){ if(z.dead || z.rise > .6) return; var rx = z.x - P.x, ry = z.y - P.y, along = rx*dx + ry*dy; if(along < .1 || along > Math.min(wall, st.range)) return; var lat = Math.abs(rx*dy - ry*dx), r = z.brute ? .48 : .34; if(lat < r) hits.push({ z:z, along:along, hs:lat < r*.3 }); });
      hits.sort(function(a, b){ return a.along - b.along; }); var n = 0, pt = null;
      hits.slice(0, st.pierce).forEach(function(h, i){ var fall = st.range < 20 ? Math.max(.25, 1 - h.along / st.range) : 1; damage(h.z, st.dmg * fall * (h.hs ? 1.6 : 1) * Math.pow(.7, i), h.hs); n++; if(!pt) pt = { x:P.x + dx*h.along, y:P.y + dy*h.along }; });
      if(!pt) pt = { x:P.x + dx*Math.max(0, wall - .1), y:P.y + dy*Math.max(0, wall - .1) };
      if(st.up) beams.push({ x:pt.x, y:pt.y, t:.16, col:st.id === 'prism' ? '#ffb15c' : '#ff8a00' });   /* a forged gun fires light, not lead */
      if(st.splash){ zombies.forEach(function(z){ if(z.dead) return; var d = Math.hypot(z.x - pt.x, z.y - pt.y); if(d < st.splash && !(hits[0] && hits[0].z === z)) damage(z, st.dmg * .6 * (1 - d/st.splash), false); }); for(var k = 0; k < 8; k++) parts.push({ x:pt.x, y:pt.y, z:.5, vx:rnd(-2, 2), vy:rnd(-2, 2), vz:rnd(0, 2), t:.4, col:'#a78bfa' }); }
      else if(!n) for(var k2 = 0; k2 < 3; k2++) parts.push({ x:pt.x, y:pt.y, z:rnd(.2, .8), vx:-dx*rnd(.5, 2) + rnd(-.5, .5), vy:-dy*rnd(.5, 2) + rnd(-.5, .5), vz:rnd(0, 1.5), t:.3, col:'#c8c8d0' });
      return n; }
    function shoot(){ var w = cur(), st = stat(w); if(reloading || fireT > 0 || boxRoll > 0) return false; if(w.mag <= 0){ snd.empty(); fireT = .25; if(w.res > 0 && msgT <= 0) say('Empty  \u00b7  R to reload', 1.2); return false; }   /* no auto reload: the trigger clicks on an empty chamber until you press R */
      w.mag--; fireT = 60 / st.rpm; flash = .07; recoil = 1; shake = Math.max(shake, st.pellets > 1 ? .9 : .25); if(w.up) snd.laser(); else snd.shot(w.id);
      for(var i = 0; i < st.pellets; i++) hitscan(P.a + (Math.random() - .5) * 2 * st.spread * (held.sprint ? 2.2 : 1), st); return true; }
    function reload(){ var w = cur(), st = stat(w); if(reloading || w.mag >= st.mag || w.res <= 0) return; reloading = true; reloadT = st.reload; snd.reload(); }
    function throwGrenade(){ if(gren <= 0 || grenT > 0 || over) return; gren--; grenT = .5; grenades.push({ x:P.x, y:P.y, z:.6, vx:Math.cos(P.a)*7.5, vy:Math.sin(P.a)*7.5, vz:2.4, t:1.35 }); }
    function explode(x, y, r, d){ shake = Math.max(shake, 1.6); whiteFlash = .18; snd.boom(); zombies.forEach(function(z){ if(z.dead) return; var k = Math.hypot(z.x - x, z.y - y); if(k < r) damage(z, d * (1 - k/r*.6), false); }); for(var i = 0; i < 26; i++) parts.push({ x:x, y:y, z:.3, vx:rnd(-4, 4), vy:rnd(-4, 4), vz:rnd(.5, 4), t:rnd(.3, .8), col:Math.random() < .5 ? '#ffd166' : '#ff6a00' }); }
    function doMelee(){ if(meleeT > 0 || over) return; meleeT = .55; melee = 1; var dx = Math.cos(P.a), dy = Math.sin(P.a), best = null, bd = 1.35; zombies.forEach(function(z){ if(z.dead) return; var rx = z.x - P.x, ry = z.y - P.y, d = Math.hypot(rx, ry); if(d < bd && (rx*dx + ry*dy)/d > .6){ bd = d; best = z; } }); if(best) damage(best, 150 + wave*10, false, 'melee'); }
    function interact(){ if(!prompt || over) return; if(prompt.deny){ snd.deny(); say(prompt.deny); return; } if(points < prompt.cost){ snd.deny(); say('Not enough points ('+prompt.cost+')'); return; } points -= prompt.cost; var act = prompt.act; prompt = null; act(); snd.buy(); status(); }   /* one purchase per prompt: mashing F before the next frame recomputes it must not charge twice */
    function findPrompt(){ prompt = null; var dx = Math.cos(P.a), dy = Math.sin(P.a), c = cast(P.x, P.y, dx, dy), key = c.mx+','+c.my;
      if(c.dist < 1.7){
        if(isDoor(c.ch) && !doors[key]) prompt = { txt:'Open door', cost:DOOR_COST[c.ch], act:function(){ doors[key] = true; flowKey = ''; say('Door opened'); } };
        else if(c.ch === 'X' && BUY_AT[key]){ var wid = BUY_AT[key], base = WEAPONS[wid], own = weapons.filter(function(w){ return w.id === wid; })[0];
          if(own) prompt = { txt:'Ammo for '+stat(own).name, cost:Math.round(base.cost * (own.up ? .8 : .5)), act:function(){ own.res = stat(own).res; own.mag = stat(own).mag; say('Ammo restocked'); } };
          else prompt = { txt:'Buy '+base.name, cost:base.cost, act:function(){ giveWeapon(wid); say(base.name+' equipped'); } }; }
        else if(c.ch === 'Y' && !power) prompt = { txt:'Turn on the power', cost:0, act:function(){ power = true; snd.power(); say('Power restored. Perks and the Forge are live.', 3); banner = 'POWER ON'; bannerT = 2.2; } };
      }
      if(!prompt) MACHINES.forEach(function(m){ var rx = m.x - P.x, ry = m.y - P.y, d = Math.hypot(rx, ry); if(d > 1.35 || (rx*dx + ry*dy)/d < .55) return;
        if(m.kind === 'box'){ prompt = boxRoll > 0 ? null : { txt:'Mystery box', cost:950, act:function(){ boxRoll = BOX_T; boxLast = ''; } }; }
        else if(m.kind === 'forge'){ if(!power) prompt = { txt:'Forge', deny:'The Forge needs power' }; else if(cur().up) prompt = { txt:stat(cur()).name+' is already forged', deny:'Already forged' }; else prompt = { txt:'Forge '+stat(cur()).name, cost:5000, act:function(){ var w = cur(); w.up = true; var st = stat(w); w.mag = st.mag; w.res = st.res; whiteFlash = .25; say('Forged: '+st.name, 2.5); } }; }
        else { var pk = PERKS[m.kind]; if(!power) prompt = { txt:pk.name, deny:'No power yet. Find the switch.' }; else if(!perks[m.kind]) prompt = { txt:pk.name+' ('+pk.blurb+')', cost:pk.cost, act:function(){ perks[m.kind] = true; if(m.kind === 'ironhide'){ maxhp = 250; hp = maxhp; } say(pk.name+' acquired', 2); } }; } });
    }
    g.key = function(k, down){ if(over) return false; var K = k.length === 1 ? k.toLowerCase() : k;
      var map = { ArrowLeft:'L', ArrowRight:'R', ArrowUp:'W', ArrowDown:'S', w:'W', s:'S', a:'A', d:'D', Shift:'sprint', ' ':'F' }[K];
      if(map){ held[map] = down; if(map === 'F' && down) trigger = true; return true; }
      if(!down) return false;
      if(K === 'r'){ reload(); return true; } if(K === 'f' || K === 'e' || K === 'Enter'){ interact(); return true; } if(K === 'q'){ if(weapons.length > 1){ slot = 1 - slot; reloading = false; fireT = .25; swapT = .34; } return true; }
      if(K === '1' || K === '2'){ var s = +K - 1; if(weapons[s] && s !== slot){ slot = s; reloading = false; fireT = .25; } return true; }
      if(K === 'g'){ throwGrenade(); return true; } if(K === 'v'){ doMelee(); return true; } if(K === 'm'){ say(snd.toggle() ? 'Sound off' : 'Sound on', 1); return true; }
      return false; };
    g.pointer = function(type, x, y, e){ if(over) return;
      if(type === 'down'){ if(e && e.button === 2){ doMelee(); return; } mouseDown = true; trigger = true; dragX = e ? e.clientX : null; if(e && e.pointerType === 'mouse' && !document.pointerLockElement){ var el = e.currentTarget || e.target; try { var p = el && el.requestPointerLock && el.requestPointerLock(); if(p && p.catch) p.catch(function(){}); } catch(err){} } }
      else if(type === 'up'){ mouseDown = false; dragX = null; }
      else if(type === 'move' && e){ if(document.pointerLockElement){ P.a += (e.movementX || 0) * .0022; } else if(dragX !== null && e.pointerType === 'touch'){ P.a += (e.clientX - dragX) * .006; dragX = e.clientX; } } };
    g.destroy = function(){ try { if(document.pointerLockElement) document.exitPointerLock(); } catch(e){} snd.close(); };
    g.peek = function(){ return { special:special, fogK:+fogK.toFixed(2), wave:wave, kills:kills, points:points, total:total, hp:hp, alive:alive, toSpawn:toSpawn, zombies:zombies.length, weapon:stat(cur()).name, mag:cur().mag, res:cur().res, doors:Object.keys(doors).length, power:power, perks:Object.keys(perks), x:P.x, y:P.y, a:P.a, prompt:prompt ? prompt.txt : null, over:over, between:+between.toFixed(2), beams:beams.length, swap:+(swapT || 0).toFixed(2), gun:gunPos || null, boxRoll:+boxRoll.toFixed(2), dmg:stat(cur()).dmg, list:zombies.map(function(z){ return { x:+z.x.toFixed(2), y:+z.y.toFixed(2), hp:Math.round(z.hp), rise:+z.rise.toFixed(2), dead:z.dead, brute:z.brute, wraith:!!z.wraith }; }), pickups:pickups.length, grenades:gren }; };
    g.dbg = { locate:function(){ return LOCATE; }, map:function(){ return MAP.map(function(r){ return r.join(''); }); }, points:function(n){ points += n; }, clear:function(){ toSpawn = 0; zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; } }); alive = 0; }, give:function(id, up){ giveWeapon(id); if(up) cur().up = true; }, forge:function(){ var w = cur(); w.up = true; var st = stat(w); w.mag = st.mag; w.res = st.res; }, killAll:function(){ zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; alive--; } }); }, wave:function(n){ zombies = []; alive = 0; startWave(n); }, spawn:function(){ computeFlow(); spawn(); }, hurt:hurt, teleport:function(x, y, a){ P.x = x; P.y = y; if(a !== undefined) P.a = a; } };
    g.update = function(dt){
      t += dt; fogK += ((special ? .45 : 1) - fogK) * Math.min(1, dt*1.5); fireT -= dt; grenT -= dt; meleeT -= dt; melee = Math.max(0, melee - dt*3); flash = Math.max(0, flash - dt); hitM = Math.max(0, hitM - dt); dmgFlash = Math.max(0, dmgFlash - dt); whiteFlash = Math.max(0, whiteFlash - dt); shake = Math.max(0, shake - dt*2.5); recoil = Math.max(0, recoil - dt*6); bannerT = Math.max(0, bannerT - dt); msgT = Math.max(0, msgT - dt); puX2 = Math.max(0, puX2 - dt); puInsta = Math.max(0, puInsta - dt);
      flickT -= dt; if(flickT <= 0){ flick = flick ? 0 : .14; flickT = flick ? rnd(.05, .18) : rnd(2.5, 9); }   /* the lights in this place are not well */
      if(over) return;
      var dx = Math.cos(P.a), dy = Math.sin(P.a);
      if(held.L) P.a -= 2.6*dt; if(held.R) P.a += 2.6*dt;
      var fw = (held.W ? 1 : 0) - (held.S ? 1 : 0), sf = (held.D ? 1 : 0) - (held.A ? 1 : 0), sp = 3.1 * (held.sprint && fw > 0 ? (perks.fleetfoot ? 1.75 : 1.45) : 1);
      if(fw || sf){ var l = Math.hypot(fw, sf); fw /= l; sf /= l; var mx = (dx*fw - dy*sf) * sp * dt, my = (dy*fw + dx*sf) * sp * dt; var ox = P.x, oy = P.y; moveCircle(P, P.x + mx, P.y + my, .22);
        zombies.forEach(function(z){ if(z.dead || z.rise > 0) return; var rx = P.x - z.x, ry = P.y - z.y, d = Math.hypot(rx, ry), r = (z.brute ? .5 : .38) + .22; if(d < r && d > 0){ P.x = z.x + rx/d*r; P.y = z.y + ry/d*r; } }); bob += dt * sp * 2.2; }
      if(reloading){ reloadT -= dt; if(reloadT <= 0){ var w = cur(), st = stat(w), need = st.mag - w.mag, take = Math.min(need, w.res); w.mag += take; w.res -= take; reloading = false; } }
      if(boxRoll > 0){ boxRoll -= dt; var pool = Object.keys(WEAPONS), prog = clamp(1 - boxRoll/BOX_T, 0, 1), idx = Math.floor(26 * (1 - Math.pow(1 - prog, 2.2))); boxName = WEAPONS[pool[idx % pool.length]].name; if(boxName !== boxLast){ boxLast = boxName; snd.tick(); }
        if(Math.random() < .7 && parts.length < 140) parts.push({ x:BOXM.x + rnd(-.4, .4), y:BOXM.y + rnd(-.4, .4), z:rnd(.1, .8), vx:0, vy:0, vz:rnd(1.2, 2.6), t:rnd(.35, .7), col:Math.random() < .3 ? '#fff' : '#8cc7ff' });
        if(boxRoll <= 0){ whiteFlash = .12; for(var bq = 0; bq < 30; bq++) parts.push({ x:BOXM.x, y:BOXM.y, z:1.1, vx:rnd(-2.5, 2.5), vy:rnd(-2.5, 2.5), vz:rnd(0, 3), t:rnd(.4, .9), col:Math.random() < .5 ? '#8cc7ff' : '#ffd166' }); var ids = pool.filter(function(k){ return k !== 'sidearm'; }), pick = Math.random() < .12 ? 'prism' : ids.filter(function(k){ return k !== 'prism'; })[(Math.random()*4)|0]; giveWeapon(pick); say('The box gave you a '+WEAPONS[pick].name, 2.5); snd.pickup(); } }
      var st0 = stat(cur()); if(trigger){ if(shoot() || reloading || cur().mag <= 0 || boxRoll > 0) trigger = false; } else if((held.F || mouseDown) && st0.auto) shoot();   /* a tap is buffered until the gun is ready, so no press is ever swallowed */
      if(regenT > 0) regenT -= dt; else if(hp < maxhp) hp = Math.min(maxhp, hp + dt * (perks.fleetfoot ? 40 : 22));
      computeFlow(); findPrompt();
      /* waves */
      if(toSpawn > 0){ spawnT -= dt; if(spawnT <= 0 && alive < Math.min(24, 6 + wave*2)){ spawn(); spawnT = Math.max(.45, 2.1 - wave*.1); } }
      else if(alive <= 0){ if(between <= 0) between = 15; between -= dt; if(between <= 0){ between = 0; startWave(wave + 1); } }
      /* zombies */
      zombies.forEach(function(z){
        if(z.flash > 0) z.flash -= dt;
        if(z.dead){ z.deadT -= dt; return; }
        if(z.rise > 0){ z.rise -= dt; if(Math.random() < dt*.4) snd.growl(); return; }
        var rx = P.x - z.x, ry = P.y - z.y, d = Math.hypot(rx, ry);
        if(z.atk > 0){ z.atk -= dt; if(z.atk <= 0){ if(d < 1.15) hurt(z.dmg); z.cool = .9; } return; }
        if(z.cool > 0) z.cool -= dt; else if(d < .85){ z.atk = .45; return; }
        if(d < .6) return;   /* stand at arm's reach between swings: a zombie standing on top of the player sat inside the hitscan's dead zone and could not be shot */
        var tx, ty; if(d < 2.5 && los(z.x, z.y, P.x, P.y)){ tx = P.x; ty = P.y; }
        else { var cx = z.x|0, cy = z.y|0, best = flow[cx + cy*MW], bx = -1, by = -1; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ var nx = cx + o[0], ny = cy + o[1]; if(nx < 0 || ny < 0 || nx >= MW || ny >= MH) return; var f = flow[nx + ny*MW]; if(f > -1 && (best < 0 || f < best)){ best = f; bx = nx; by = ny; } }); if(bx > -1){ tx = bx + .5; ty = by + .5; } else { tx = P.x; ty = P.y; } }
        var vx = tx - z.x, vy = ty - z.y, vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        zombies.forEach(function(o){ if(o === z || o.dead || o.rise > 0) return; var sx = z.x - o.x, sy = z.y - o.y, sd = Math.hypot(sx, sy); if(sd < .55 && sd > 0){ vx += sx/sd * .8; vy += sy/sd * .8; } });
        var l2 = Math.hypot(vx, vy) || 1; moveCircle(z, z.x + vx/l2*z.speed*dt, z.y + vy/l2*z.speed*dt, .28); z.anim += dt * z.speed * 1.4;
        if(Math.random() < dt*.05) snd.growl();
      });
      zombies = zombies.filter(function(z){ return !(z.dead && z.deadT <= 0); });
      /* pickups, grenades, particles */
      pickups.forEach(function(p){ p.t -= dt; if(Math.hypot(p.x - P.x, p.y - P.y) < .7){ p.t = 0; snd.pickup(); banner = PU[p.kind].label; bannerT = 2; if(p.kind === 'ammo'){ weapons.forEach(function(w){ var s = stat(w); w.mag = s.mag; w.res = s.res; }); gren = 4; } else if(p.kind === '2x') puX2 = 30; else if(p.kind === 'insta') puInsta = 12; else { whiteFlash = .5; zombies.forEach(function(z){ if(!z.dead && z.rise <= 0){ z.dead = true; z.deadT = .38; alive--; kills++; } }); addPoints(400); status(); } } }); pickups = pickups.filter(function(p){ return p.t > 0; });
      grenades.forEach(function(gr){ gr.t -= dt; gr.vz -= 7*dt; var nx = gr.x + gr.vx*dt, ny = gr.y + gr.vy*dt; if(walk(nx|0, gr.y|0)) gr.x = nx; else gr.vx = -gr.vx*.4; if(walk(gr.x|0, ny|0)) gr.y = ny; else gr.vy = -gr.vy*.4; gr.z += gr.vz*dt; if(gr.z < .05){ gr.z = .05; gr.vz = Math.abs(gr.vz)*.35; gr.vx *= .6; gr.vy *= .6; } if(gr.t <= 0) explode(gr.x, gr.y, 2.4, 380 + wave*70); }); grenades = grenades.filter(function(gr){ return gr.t > 0; });
      parts.forEach(function(p){ p.t -= dt; p.vz -= 6*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt; if(p.z < 0){ p.z = 0; p.vz = 0; p.vx *= .5; p.vy *= .5; } }); parts = parts.filter(function(p){ return p.t > 0; });
      beams.forEach(function(b){ b.t -= dt; }); beams = beams.filter(function(b){ return b.t > 0; }); if(swapT > 0) swapT -= dt;
    };
    /* ---------- render ---------- */
    function level(dist, side){ var f = 1 - dist / (13*fogK + flash*60) - flick; var k = Math.round(f * (LEVELS - 1)) - (side ? 1 : 0); return clamp(k, 0, LEVELS - 1); }
    function texFor(c){ var key = c.mx+','+c.my; if(c.ch === '#') return TEX.brick; if(c.ch === '%') return (c.mx*7 + c.my*13) % 9 === 0 ? TEX.blood : TEX.concrete; if(c.ch === '=') return TEX.metal; if(c.ch === 'B') return TEX.shelf; if(c.ch === 'W') return TEX.boards; if(c.ch === 'X') return BUYTEX[BUY_AT[key]] || TEX.concrete; if(c.ch === 'Y') return TEX['switch']; if(isDoor(c.ch)) return DOORTEX[c.ch]; return TEX.brick; }
    function drawWeapon(c){
      var w = cur(), st = stat(w), s = H/400 * (GUN_SC[w.id] || 1.3), bx = W*.74 + Math.sin(bob)*6*s, by = H - 6*s + Math.abs(Math.cos(bob))*4*s + recoil*18*s - melee*30*s + (swapT > 0 ? Math.sin(Math.PI*swapT/.34)*150*s : 0), rp = reloading ? Math.sin((1 - reloadT/st.reload) * Math.PI) : 0; by += rp*120*s; bx += rp*36*s;
      c.save(); c.translate(bx, by); if(reloading) c.rotate(rp*.45); if(melee) c.rotate(-melee*.5);
      var m = gunShape(c, w.id, w.up, s, .55 + .45*Math.sin(t*6), t), v = gunPt(m[0], m[1], 0, s);
      mz = reloading || melee ? null : [bx + v[0], by + v[1]]; gunPos = { ax:bx, ay:by, mx:bx + v[0], my:by + v[1], W:W, H:H };
      if(flash > 0){ var r = (w.up ? 20 : 24 + Math.random()*18)*s, gr = c.createRadialGradient(v[0], v[1], 1, v[0], v[1], r); if(w.up){ gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,170,60,.9)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); } else { gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(.35, 'rgba(255,190,60,.9)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); } c.fillStyle = gr; c.beginPath(); c.arc(v[0], v[1], r, 0, 7); c.fill(); }
      c.restore();
    }
    g.draw = function(c){
      var dirX = Math.cos(P.a), dirY = Math.sin(P.a), plX = -dirY*.66, plY = dirX*.66, half = H/2, i, k;
      c.save(); c.imageSmoothingEnabled = false; if(shake > 0) c.translate(rnd(-1, 1)*shake*6, rnd(-1, 1)*shake*6);
      var sky = c.createLinearGradient(0, 0, 0, half); sky.addColorStop(0, '#15151f'); sky.addColorStop(1, '#050508'); c.fillStyle = sky; c.fillRect(0, 0, W, half);
      for(var y = half; y < H; y += 4){ var d = half / (y - half + 2), br = clamp(1 - d/(13*fogK), 0, 1) * (1 + flash*1.5); c.fillStyle = 'rgb('+((26 + 40*br)|0)+','+((22 + 34*br)|0)+','+((20 + 30*br)|0)+')'; c.fillRect(0, y, W, 4); }
      for(i = 0; i < RAYS; i++){ var cam = 2*(i + .5)/RAYS - 1, rdx = dirX + plX*cam, rdy = dirY + plY*cam, hit = cast(P.x, P.y, rdx, rdy); zbuf[i] = hit.dist; var lh = H / hit.dist, y0 = half - lh/2; c.drawImage(texFor(hit)[level(hit.dist, hit.side)], hit.tx, 0, 1, TS, i*SW, y0, SW, lh); }
      /* sprites */
      var inv = 1 / (plX*dirY - dirX*plY), list = [];
      var proj = function(x, y){ var rx = x - P.x, ry = y - P.y, tx = inv*(dirY*rx - dirX*ry), ty = inv*(-plY*rx + plX*ry); return { sx:(W/2)*(1 + tx/ty), ty:ty }; };
      zombies.forEach(function(z){ var p = proj(z.x, z.y); if(p.ty > .15) list.push({ ty:p.ty, sx:p.sx, kind:'z', o:z }); });
      MACHINES.forEach(function(m){ var p = proj(m.x, m.y); if(p.ty > .15) list.push({ ty:p.ty, sx:p.sx, kind:'m', o:m }); });
      pickups.forEach(function(pk){ var p = proj(pk.x, pk.y); if(p.ty > .15 && !(pk.t < 5 && Math.floor(t*6) % 2)) list.push({ ty:p.ty, sx:p.sx, kind:'p', o:pk }); });
      grenades.forEach(function(gr){ var p = proj(gr.x, gr.y); if(p.ty > .15) list.push({ ty:p.ty, sx:p.sx, kind:'g', o:gr }); });
      parts.forEach(function(pt){ var p = proj(pt.x, pt.y); if(p.ty > .15) list.push({ ty:p.ty, sx:p.sx, kind:'pt', o:pt }); });
      list.sort(function(a, b){ return b.ty - a.ty; });
      var sprite = function(img, sx, ty, sh, elev, aspect, alpha, crop){ var hpx = (H / ty) * sh, wpx = hpx * aspect, bottom = half + (H/(2*ty)) * (1 - 2*elev), top = bottom - hpx, x0 = Math.round(sx - wpx/2), x1 = Math.round(sx + wpx/2); if(x1 < 0 || x0 > W) return;
        var i0 = clamp(Math.floor(x0/SW), 0, RAYS-1), i1 = clamp(Math.ceil(x1/SW), 0, RAYS-1), clear = true; for(var q = i0; q <= i1; q++){ if(zbuf[q] < ty){ clear = false; break; } }
        if(alpha < 1) c.globalAlpha = alpha; var ch0 = crop ? img.height*crop : img.height, hp0 = hpx*(crop || 1), ty0 = crop ? bottom - hp0 : top;
        if(clear) c.drawImage(img, 0, 0, img.width, ch0, x0, ty0, wpx, hp0);
        else for(var q2 = i0; q2 <= i1; q2++){ if(zbuf[q2] < ty) continue; var px = q2*SW; if(px < x0 || px >= x1) continue; var txx = ((px - x0)/wpx * img.width)|0; c.drawImage(img, txx, 0, 1, ch0, px, ty0, SW, hp0); }
        c.globalAlpha = 1; };
      list.forEach(function(s){ var lv = level(s.ty, 0);
        if(s.kind === 'z'){ var z = s.o, fr = z.flash > 0 ? 3 : z.atk > 0 ? 2 : (z.anim|0) % 2, img = ZS[z.v][fr][lv]; if(z.wraith && !z.dead){ sprite(img, s.sx, s.ty, .92, .12 + Math.sin(t*5 + z.anim)*.06, ZW/ZH, .55 + .25*Math.sin(t*7 + z.anim*3), clamp(1 - z.rise/z.rise0, .02, 1)); } else if(z.dead){ var k2 = Math.max(0, z.deadT/.38); sprite(img, s.sx, s.ty, (z.brute ? 1.15 : .92) * k2, 0, ZW/ZH, .4 + k2*.6); } else if(z.rise > 0){ sprite(img, s.sx, s.ty, z.brute ? 1.15 : .92, 0, ZW/ZH, 1, clamp(1 - z.rise/z.rise0, .02, 1)); } else sprite(img, s.sx, s.ty, z.brute ? 1.15 : .92, 0, ZW/ZH, 1); }
        else if(s.kind === 'm'){ var on = s.o.kind === 'box' || power; sprite((on ? MACH : MACH_OFF)[s.o.kind === 'box' && boxRoll > 0 ? 'boxopen' : s.o.kind][lv], s.sx, s.ty, .95, 0, ZW/ZH, 1); }
        else if(s.kind === 'p'){ sprite(PU[s.o.kind].img, s.sx, s.ty, .38, .35 + Math.sin(t*3 + s.o.x)*.06, 1, 1); }
        else if(s.kind === 'g'){ sprite(GREN, s.sx, s.ty, .13, s.o.z, 1, 1); }
        else { var pt = s.o, hpx = Math.min(6, (H/s.ty) * .022), by2 = half + (H/(2*s.ty)) * (1 - 2*pt.z); var ix = clamp(Math.floor(s.sx/SW), 0, RAYS-1); if(zbuf[ix] > s.ty){ c.fillStyle = pt.col; c.fillRect(s.sx - hpx/2, by2 - hpx, Math.max(1.5, hpx), Math.max(1.5, hpx)); } } });
      /* mystery box: a light column climbs out of the open box and the prize spins above it, slowing like a slot reel */
      if(boxRoll > 0){ var bp = proj(BOXM.x, BOXM.y); if(bp.ty > .15){ var bh = H/bp.ty, bbot = half + bh/2, prog = clamp(1 - boxRoll/BOX_T, 0, 1), rise = Math.min(1, prog*3), bw = bh*.5*(.75 + .25*Math.sin(t*9)), by0 = Math.max(0, bbot - bh*2.4);
          c.save(); c.globalCompositeOperation = 'lighter'; var lg = c.createLinearGradient(0, bbot, 0, by0); lg.addColorStop(0, 'rgba(140,199,255,.45)'); lg.addColorStop(1, 'rgba(140,199,255,0)'); c.fillStyle = lg; c.fillRect(bp.sx - bw/2, by0, bw, bbot - by0); c.restore();
          var gid = Object.keys(WEAPONS).filter(function(k){ return WEAPONS[k].name === boxName; })[0] || 'sidearm', gs = bh*.0012*(1 + Math.max(0, .5 - boxRoll)*.5), gy = bbot - bh*(.5 + .32*rise) + Math.sin(t*3)*bh*.025, gm = GUN_MZ[gid], gcen = gunPt(gm[0]*.5, 22, 12, gs);
          c.save(); c.translate(bp.sx, gy); c.rotate(Math.sin(t*2.6)*.16); c.translate(-gcen[0], -gcen[1]); c.shadowColor = '#8cc7ff'; c.shadowBlur = 18; gunShape(c, gid, false, gs, 0); c.restore();
          c.save(); c.shadowColor = '#8cc7ff'; c.shadowBlur = 12; text(c, boxName.toUpperCase(), bp.sx, Math.min(H - 110, gy + bh*.26), clamp(bh*.05, 10, 24), '#8cc7ff', 'center', 800); c.restore(); } }
      /* forged guns fire beams from the muzzle to the impact point */
      beams.forEach(function(b){ var p = proj(b.x, b.y); if(p.ty <= .12 || !mz) return; var ex = p.sx, ey = half + (H/(2*p.ty)) * (1 - 2*.52), a = clamp(b.t/.16, 0, 1); c.save(); c.globalAlpha = a; c.strokeStyle = b.col; c.shadowColor = b.col; c.shadowBlur = 14; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(mz[0], mz[1]); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = '#fff'; c.shadowBlur = 0; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 3 + 5*a, 0, 7); c.fill(); c.restore(); });
      drawWeapon(c);
      c.restore(); c.imageSmoothingEnabled = true;
      /* overlays */
      if(dmgFlash > 0 || hp < maxhp*.4){ var a = Math.min(.75, dmgFlash*.9 + (hp < maxhp*.4 ? (.4 - hp/maxhp) * 1.4 * (.6 + .4*Math.sin(t*6)) : 0)); var vg = c.createRadialGradient(W/2, H/2, H*.3, W/2, H/2, H*.75); vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, 'rgba(160,0,0,'+a+')'); c.fillStyle = vg; c.fillRect(0, 0, W, H); }
      if(whiteFlash > 0){ c.fillStyle = 'rgba(255,250,230,'+Math.min(.9, whiteFlash*3)+')'; c.fillRect(0, 0, W, H); }
      if(puInsta > 0){ c.fillStyle = 'rgba(255,60,60,'+(.05 + .03*Math.sin(t*8))+')'; c.fillRect(0, 0, W, H); }
      /* HUD */
      var cx = W/2, cy = H/2; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; var gap = 6 + recoil*6; [[0,-1],[0,1],[-1,0],[1,0]].forEach(function(o){ c.beginPath(); c.moveTo(cx + o[0]*gap, cy + o[1]*gap); c.lineTo(cx + o[0]*(gap+7), cy + o[1]*(gap+7)); c.stroke(); });
      if(hitM > 0){ c.strokeStyle = hitKill ? '#ff5f57' : '#fff'; c.lineWidth = 2.5; [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(o){ c.beginPath(); c.moveTo(cx + o[0]*5, cy + o[1]*5); c.lineTo(cx + o[0]*12, cy + o[1]*12); c.stroke(); }); }
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, H - 62, 312, 62); c.fillRect(W - 190, H - 62, 190, 62);
      text(c, 'WAVE', 16, H - 48, 10, 'rgba(255,255,255,.55)'); text(c, String(wave), 52, H - 48, 16, '#ff5f57', 'left', 800);
      text(c, String(points), 16, H - 24, 26, '#ffd166', 'left', 800);
      c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(120, H - 30, 96, 8); c.fillStyle = hp < maxhp*.4 ? '#ff5f57' : '#63e6be'; c.fillRect(120, H - 30, 96 * clamp(hp/maxhp, 0, 1), 8); text(c, Math.ceil(hp)+'', 120, H - 44, 11, 'rgba(255,255,255,.7)');
      var pi = 0; Object.keys(perks).forEach(function(pk){ c.fillStyle = PERKS[pk].col; c.beginPath(); c.arc(150 + pi*20, H - 46, 7, 0, 7); c.fill(); text(c, PERKS[pk].name[0], 150 + pi*20, H - 46, 9, '#111', 'center', 800); pi++; });
      var wpn = cur(), stt = stat(wpn); text(c, stt.name.toUpperCase() + (wpn.up ? '  \u2726' : ''), W - 16, H - 50, 11, wpn.up ? '#ff8a00' : 'rgba(255,255,255,.75)', 'right');
      text(c, reloading ? 'RELOADING' : wpn.mag + '  |  ' + wpn.res, W - 16, H - 26, reloading ? 14 : 22, wpn.mag === 0 && !reloading ? '#ff5f57' : '#fff', 'right', 800);
      if(weapons.length > 1) text(c, 'Q  '+stat(weapons[1 - slot]).name, 234, H - 46, 10, 'rgba(255,255,255,.4)', 'left');
      text(c, '\u2B22 '+gren, 234, H - 24, 13, gren ? '#a7ffb0' : 'rgba(255,255,255,.3)', 'left');
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(8, 8, snd.isMuted() ? 128 : 78, 20); text(c, kills+' kills', 16, 18, 11, 'rgba(255,255,255,.75)'); if(snd.isMuted()) text(c, 'muted', 84, 18, 11, 'rgba(255,255,255,.5)');
      if(puX2 > 0) text(c, '2X POINTS  '+Math.ceil(puX2), W/2 - 80, 22, 12, '#ffd166', 'center'); if(puInsta > 0) text(c, 'INSTA-KILL  '+Math.ceil(puInsta), W/2 + 80, 22, 12, '#ff5f57', 'center');
      if(bannerT > 0){ var ba = Math.min(1, bannerT); c.globalAlpha = ba; text(c, banner, W/2, H*.3, banner.length > 8 ? 34 : 52, banner.indexOf('WAVE') === 0 ? '#ff3b3b' : '#ffd166', 'center', 800); c.globalAlpha = 1; }
      if(between > 0 && toSpawn <= 0 && alive <= 0) text(c, 'next wave in '+Math.ceil(between), W/2, H*.3 + 34, 13, 'rgba(255,255,255,.7)', 'center');
      if(prompt){ var ptxt = '['+(touch ? 'USE' : 'F')+']  '+prompt.txt+(prompt.cost ? '  \u00b7  '+prompt.cost : ''); c.font = '700 13px '+FONT; var pw = c.measureText(ptxt).width + 28; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(W/2 - pw/2, H - 100, pw, 28); text(c, ptxt, W/2, H - 86, 13, prompt.deny ? '#ff5f57' : points >= (prompt.cost || 0) ? '#ffd166' : 'rgba(255,255,255,.6)', 'center'); }
      if(msgT > 0){ c.globalAlpha = Math.min(1, msgT*2); text(c, msg, W/2, H - 126, 13, '#fff', 'center'); c.globalAlpha = 1; }
      /* minimap */
      if(fogK < .95){ var fa = (1 - fogK)*.8; c.fillStyle = 'rgba(150,170,200,'+(fa*.3)+')'; c.fillRect(0, 0, W, H); var lg = c.createLinearGradient(0, H*.45, 0, H); lg.addColorStop(0, 'rgba(180,195,225,0)'); lg.addColorStop(1, 'rgba(180,195,225,'+(fa*.55)+')'); c.fillStyle = lg; c.fillRect(0, 0, W, H); for(var fb = 0; fb < 4; fb++){ var fy = H*.35 + fb*H*.16 + Math.sin(t*.7 + fb)*12, fx = ((t*30 + fb*W*.37) % (W*1.4)) - W*.2; var fg = c.createRadialGradient(fx, fy, 0, fx, fy, W*.35); fg.addColorStop(0, 'rgba(170,190,220,'+(fa*.45)+')'); fg.addColorStop(1, 'rgba(170,190,220,0)'); c.fillStyle = fg; c.fillRect(0, 0, W, H); } }
      var ms = 3, mx0 = W - 16 - MW*ms, my0 = 14; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(mx0 - 3, my0 - 3, MW*ms + 6, MH*ms + 6);
      for(var yy = 0; yy < MH; yy++) for(var xx = 0; xx < MW; xx++){ var cc = MAP[yy][xx]; if(cc === '.' || cc === 'P'){ continue; } c.fillStyle = cc === 'W' ? '#5a4028' : isDoor(cc) ? (doors[xx+','+yy] ? 'rgba(255,255,255,.1)' : '#ffd166') : cc === 'X' ? '#63e6be' : cc === 'Y' ? (power ? '#a7ffb0' : '#ff5f57') : 'rgba(255,255,255,.28)'; c.fillRect(mx0 + xx*ms, my0 + yy*ms, ms, ms); }
      MACHINES.forEach(function(m){ c.fillStyle = m.kind === 'box' ? '#8cc7ff' : m.kind === 'forge' ? '#ff8a00' : PERKS[m.kind].col; c.fillRect(mx0 + (m.x|0)*ms, my0 + (m.y|0)*ms, ms, ms); });
      zombies.forEach(function(z){ if(z.dead) return; c.fillStyle = z.brute ? '#ff8a00' : '#ff3b3b'; c.fillRect(mx0 + z.x*ms - 1, my0 + z.y*ms - 1, 2.5, 2.5); });
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(mx0 + P.x*ms + dirX*4, my0 + P.y*ms + dirY*4); c.lineTo(mx0 + P.x*ms - dirY*2.2 - dirX*2, my0 + P.y*ms + dirX*2.2 - dirY*2); c.lineTo(mx0 + P.x*ms + dirY*2.2 - dirX*2, my0 + P.y*ms - dirX*2.2 - dirY*2); c.closePath(); c.fill();
    };
    return g;
  }

  GAMES.push({ id:'nightshift', premium:true, rank:1, name:'Nightshift', tkeys:'Arrows move and turn, fire, use, reload and swap on the pad', blurb:'First-person zombie survival. Waves, points, doors, wall guns, a mystery box, perks and a Forge that upgrades your weapon.', keys:'WASD move, mouse or arrows aim, click or space fires, R reload, F use, Q swap, G grenade, V melee, shift sprints', W:W, H:H, pad:'fps', color:'#ff3b3b', ownKeys:true, make:nightshift,
    icon:'<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="6"/><path d="M8 16l-1 5h10l-1-5"/><path d="M9.5 9.5h.01M14.5 9.5h.01"/><path d="M10 13h4"/></svg>' });
})();

/* tigOS arcade rounds.js, part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
/* tigOS arcade, premium game: "Rounds". A faithful single-player take on Landfall's ROUNDS: round little gunners with noodle arms duel on
   floating maps, the loser of every round picks a card, first to five rounds wins. Every vanilla card is here with its real numbers, plus
   the most-downloaded community mods as toggles on the setup screen (Cosmic Rounds, Cards Plus, Will's Wacky Cards and Curses, Pykess'
   Card Expansion, Keys' Cards, Pick N Cards, SetRounds, Infoholic, Damage Indicators). Same contract as games.js: make(api) -> game. */
(function(){
  var GAMES = window.TIG_GAMES; if(!GAMES) return;
  var W = 1280, H = 720, FONT = 'ui-monospace, Menlo, Consolas, monospace';
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; }, rnd = function(a, b){ return a + Math.random() * (b - a); }, ri = function(a, b){ return Math.floor(rnd(a, b + 1)); };
  var lerp = function(a, b, k){ return a + (b - a)*k; }, sgn = function(v){ return v < 0 ? -1 : 1; };
  var rr = function(c, x, y, w, h, r){ r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x+r, y); c.arcTo(x+w, y, x+w, y+h, r); c.arcTo(x+w, y+h, x, y+h, r); c.arcTo(x, y+h, x, y, r); c.arcTo(x, y, x+w, y, r); c.closePath(); };
  var text = function(c, s, x, y, size, col, align, weight){ c.font = (weight || 700)+' '+size+'px '+FONT; c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  var pick = function(a){ return a[Math.floor(Math.random()*a.length)]; };
  var shade = function(hex, k){ var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = function(v){ return Math.round(clamp(k < 0 ? v*(1 + k) : v + (255 - v)*k, 0, 255)); }; return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; };
  /* ---------- the fighter: a big round head with two tall eyes on a small body, little fists and legs. The whole body mirrors with `face`;
     `walk` is the stride phase, `air` tucks the legs, `idle` plants the feet. s is the scale (radius 12 = s 1). o: { aim, stun, lowHp, squash, gun(gx, gy, a) } ---------- */
  /* the fighter: big round head, two tall eye slots, small body, two arms that both hold the gun (or hang, or grip a rope), dark legs. The whole body mirrors with `face`.
     o: { aim, gun(gx,gy,a,s), stun, lowHp, squash, blink, hang, look:{hat,face,extra}, t } */
  var HATS = ['none', 'cap', 'crown', 'tophat', 'beanie', 'halo', 'horns', 'propeller', 'cowboy', 'chef', 'party', 'viking', 'wizard', 'pirate', 'bucket', 'headband', 'antenna', 'bunny', 'flower', 'sombrero', 'helmet'], FACES = ['none', 'glasses', 'shades', 'monocle', 'mustache', 'blush', 'eyepatch', 'mask', 'beard', 'goggles', 'clown', 'scar', 'freckles', 'bandit'], EXTRAS = ['none', 'scarf', 'bowtie', 'cape', 'medal', 'backpack', 'tie', 'wings', 'belt', 'necklace', 'jetpack', 'tutu'];   /* all cosmetic: nothing here touches hitP, movement or the gun */
  function drawChibi(c, x, y, s, col, face, walk, air, idle, o){ o = o || {}; var sq = o.squash || 0, dark = shade(col, -.3), arm = shade(col, -.12), look = o.look || {}, T = o.t || 0;
    c.save(); c.translate(x, y + sq*3*s); c.scale(face*(1 + sq*.5), 1 - sq*.5);
    var sw = idle ? 0 : Math.sin(walk)*.75, bob = idle ? 0 : Math.abs(Math.cos(walk))*1.2*s;
    if(air){ sw = .4; }
    var hy = -13*s - bob;   /* head centre */
    /* cape and backpack sit behind everything */
    if(look.extra === 'cape'){ var fl = air ? .9 : idle ? .15 + Math.sin(T*3)*.05 : .35 + Math.sin(walk*2)*.15; c.fillStyle = shade(col, -.45); c.beginPath(); c.moveTo(-5*s, -7*s - bob); c.lineTo(5*s, -7*s - bob); c.lineTo(-2*s - fl*10*s, 12*s - bob - fl*4*s); c.lineTo(-10*s - fl*14*s, 8*s - bob - fl*8*s); c.closePath(); c.fill(); }
    if(look.extra === 'backpack'){ c.fillStyle = '#6b7a4a'; rr(c, -12*s, -6*s - bob, 6*s, 11*s, 2.5*s); c.fill(); c.fillStyle = '#4d5a33'; rr(c, -11*s, -5*s - bob, 4*s, 4*s, 1.5*s); c.fill(); }
    if(look.extra === 'wings'){ var wf = air ? Math.sin(T*18)*.5 : Math.sin(T*3)*.12; c.fillStyle = 'rgba(255,255,255,.92)'; [[-1, 1], [1, -1]].forEach(function(w){ c.save(); c.translate(w[0]*4*s, -3*s - bob); c.rotate(w[0]*(.35 + wf)); c.beginPath(); c.ellipse(w[0]*7*s, -2*s, 8*s, 3.4*s, w[0]*.35, 0, 7); c.fill(); c.restore(); }); }
    if(look.extra === 'jetpack'){ c.fillStyle = '#8a8f9c'; rr(c, -12.5*s, -7*s - bob, 6*s, 12*s, 2.5*s); c.fill(); c.fillStyle = '#5a5f6c'; rr(c, -11.5*s, -6*s - bob, 4*s, 3*s, 1.2*s); c.fill(); if(air){ var jf = 4 + Math.sin(T*40)*2; c.fillStyle = '#ff8a00'; c.beginPath(); c.moveTo(-12*s, 5*s - bob); c.lineTo(-7*s, 5*s - bob); c.lineTo(-9.5*s, 5*s + jf*s - bob); c.closePath(); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-11*s, 5*s - bob); c.lineTo(-8*s, 5*s - bob); c.lineTo(-9.5*s, 5*s + jf*.5*s - bob); c.closePath(); c.fill(); } }
    c.strokeStyle = dark; c.lineWidth = 3.6*s; c.lineCap = 'round'; c.lineJoin = 'round';
    var legs = [[-2.6*s, -sw], [2.6*s, sw]];
    legs.forEach(function(L){ var kx = L[0] + Math.sin(L[1])*5.5*s, ky = 12*s - Math.max(0, Math.sin(L[1])*(air ? 6 : 3))*s; if(air) ky = 9*s; if(o.hang){ kx = L[0] + 1.5*s; ky = 11*s; } c.beginPath(); c.moveTo(L[0], 4*s - bob); c.lineTo(kx, ky); c.stroke(); c.fillStyle = dark; c.beginPath(); c.ellipse(kx + 1.2*s, ky + .4*s, 3.2*s, 1.9*s, 0, 0, 7); c.fill(); });
    /* arms: where the hands go */
    var gx = null, gy = null, a = o.aim || 0; if(o.gun){ gx = 4*s + Math.cos(a)*8.5*s; gy = -2*s - bob + Math.sin(a)*8.5*s; }
    c.strokeStyle = arm; c.lineWidth = 3.2*s;
    /* back arm (behind the body): to the gun grip, up the rope, or hanging by the side */
    c.beginPath(); c.moveTo(-4.5*s, -1*s - bob); if(o.hang && gx == null){ c.lineTo(-6*s, 8*s - bob); } else if(gx != null){ c.lineTo(gx - Math.cos(a)*3.5*s, gy - Math.sin(a)*3.5*s + 1.5*s); } else { c.lineTo(-7*s + (idle ? 0 : Math.sin(walk + Math.PI)*2.5*s), 7*s - bob); } c.stroke();
    /* body */
    c.fillStyle = col; rr(c, -7*s, -6*s - bob, 14*s, 12*s, 6*s); c.fill(); c.fillStyle = 'rgba(0,0,0,.14)'; rr(c, -6*s, -bob, 12*s, 5.5*s, 4*s); c.fill();
    if(look.extra === 'scarf'){ c.fillStyle = '#e04848'; rr(c, -7.5*s, -7*s - bob, 15*s, 4*s, 2*s); c.fill(); c.beginPath(); c.moveTo(-6*s, -5*s - bob); c.lineTo(-12*s - (air ? 5*s : 0), 2*s - bob + (idle ? Math.sin(T*3)*s : Math.sin(walk*2)*2*s)); c.lineTo(-8*s, 1*s - bob); c.closePath(); c.fill(); }
    if(look.extra === 'bowtie'){ c.fillStyle = '#e04848'; c.beginPath(); c.moveTo(0, -5*s - bob); c.lineTo(-4.5*s, -7.5*s - bob); c.lineTo(-4.5*s, -2.5*s - bob); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, -5*s - bob); c.lineTo(4.5*s, -7.5*s - bob); c.lineTo(4.5*s, -2.5*s - bob); c.closePath(); c.fill(); c.fillStyle = '#7a1f1f'; c.beginPath(); c.arc(0, -5*s - bob, 1.3*s, 0, 7); c.fill(); }
    if(look.extra === 'tie'){ c.fillStyle = '#2f4f9e'; c.beginPath(); c.moveTo(1*s, -5*s - bob); c.lineTo(3.5*s, -3*s - bob); c.lineTo(2*s, 4*s - bob); c.lineTo(-0.5*s, 4*s - bob); c.lineTo(-1.5*s, -3*s - bob); c.closePath(); c.fill(); }
    if(look.extra === 'belt'){ c.fillStyle = '#3b2a1a'; rr(c, -7*s, 2.5*s - bob, 14*s, 2.6*s, 1*s); c.fill(); c.fillStyle = '#ffd166'; rr(c, -1.6*s, 2.2*s - bob, 3.2*s, 3.2*s, .8*s); c.fill(); }
    if(look.extra === 'necklace'){ c.strokeStyle = '#ffd166'; c.lineWidth = 1.1*s; c.beginPath(); c.arc(0, -6.5*s - bob, 5.5*s, Math.PI*.15, Math.PI*.85); c.stroke(); c.fillStyle = '#4fd1c5'; c.beginPath(); c.arc(0, -1*s - bob, 1.5*s, 0, 7); c.fill(); }
    if(look.extra === 'tutu'){ c.fillStyle = 'rgba(255,138,216,.9)'; c.beginPath(); c.moveTo(-7*s, 3*s - bob); for(var ti = 0; ti <= 8; ti++){ var tx = -11*s + ti*2.75*s; c.quadraticCurveTo(tx + 1.3*s, 9*s - bob + (ti % 2)*1.5*s, tx + 2.75*s, 7*s - bob); } c.lineTo(7*s, 3*s - bob); c.closePath(); c.fill(); }
    if(look.extra === 'medal'){ c.strokeStyle = '#c0392b'; c.lineWidth = 1.2*s; c.beginPath(); c.moveTo(1*s, -5*s - bob); c.lineTo(3*s, -1*s - bob); c.stroke(); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(3*s, 0*s - bob, 2.4*s, 0, 7); c.fill(); c.fillStyle = '#b8860b'; c.beginPath(); c.arc(3*s, 0*s - bob, 1.2*s, 0, 7); c.fill(); }
    /* head */
    c.fillStyle = col; c.beginPath(); c.arc(0, hy, 10*s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.arc(-3.5*s, hy - 4*s, 3.6*s, 0, 7); c.fill();
    /* eyes: two tall dark ovals shifted toward the way it faces; a blink squeezes them to lines; stun makes crosses */
    c.fillStyle = '#16161e'; var eyes = [[2.65*s, hy - 1*s], [7.25*s, hy - 1*s]];
    if(o.stun){ c.strokeStyle = '#16161e'; c.lineWidth = 1.6*s; eyes.forEach(function(e){ c.beginPath(); c.moveTo(e[0] - 1.6*s, e[1] - 1.8*s); c.lineTo(e[0] + 1.6*s, e[1] + 1.8*s); c.moveTo(e[0] + 1.6*s, e[1] - 1.8*s); c.lineTo(e[0] - 1.6*s, e[1] + 1.8*s); c.stroke(); }); }
    else if(o.mood === 'happy' && !o.blink){ c.strokeStyle = '#16161e'; c.lineWidth = 1.7*s; eyes.forEach(function(e){ if(look.face === 'eyepatch' && e === eyes[1]) return; c.beginPath(); c.arc(e[0], e[1] + 1.2*s, 2.2*s, Math.PI*1.08, Math.PI*1.92); c.stroke(); }); c.lineWidth = 1.2*s; c.beginPath(); c.arc(4.9*s, hy + 4.2*s, 2.4*s, Math.PI*.15, Math.PI*.85); c.stroke(); }   /* two little arches and a smile: it just won the point */
    else if(o.blink){ eyes.forEach(function(e){ rr(c, e[0] - 1.7*s, e[1] - .6*s, 3.4*s, 1.2*s, .6*s); c.fill(); }); }
    else if(o.mood === 'angry'){ eyes.forEach(function(e, i){ if(look.face === 'eyepatch' && e === eyes[1]) return; rr(c, e[0] - 1.35*s, e[1] - 1.6*s, 2.7*s, 5.1*s, 1.35*s); c.fill(); var inward = i === 0 ? 1 : -1; c.strokeStyle = '#16161e'; c.lineWidth = 1.5*s; c.beginPath(); c.moveTo(e[0] - inward*2.1*s, e[1] - 4.9*s); c.lineTo(e[0] + inward*2.1*s, e[1] - 3.3*s); c.stroke(); }); }   /* just got hit: eyes narrow under brows that slant in toward the nose */
    else { eyes.forEach(function(e){ if(look.face === 'eyepatch' && e === eyes[1]) return; rr(c, e[0] - 1.35*s, e[1] - 3.5*s, 2.7*s, 7*s, 1.35*s); c.fill(); }); }
    if(o.lowHp && !o.blink && o.mood !== 'happy'){ c.strokeStyle = '#16161e'; c.lineWidth = 1.3*s; c.beginPath(); c.arc(4.6*s, hy + 5.8*s, 2*s, Math.PI*1.15, Math.PI*1.85); c.stroke(); }
    /* face wear */
    if(look.face === 'glasses' || look.face === 'shades'){ var dk = look.face === 'shades'; c.strokeStyle = '#16161e'; c.lineWidth = 1.1*s; c.fillStyle = dk ? 'rgba(20,20,30,.92)' : 'rgba(180,220,255,.25)'; eyes.forEach(function(e){ c.beginPath(); c.arc(e[0], e[1], 3.1*s, 0, 7); c.fill(); c.stroke(); }); c.beginPath(); c.moveTo(eyes[0][0] + 3.1*s, eyes[0][1]); c.lineTo(eyes[1][0] - 3.1*s, eyes[1][1]); c.moveTo(eyes[0][0] - 3.1*s, eyes[0][1]); c.lineTo(-9*s, hy - 2*s); c.stroke(); }
    if(look.face === 'monocle'){ c.strokeStyle = '#ffd166'; c.lineWidth = 1.1*s; c.fillStyle = 'rgba(180,220,255,.25)'; c.beginPath(); c.arc(eyes[1][0], eyes[1][1], 3.3*s, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(eyes[1][0] + 2*s, eyes[1][1] + 2.6*s); c.quadraticCurveTo(eyes[1][0] + 5*s, eyes[1][1] + 7*s, eyes[1][0] + 2*s, eyes[1][1] + 10*s); c.stroke(); }
    if(look.face === 'mustache'){ c.fillStyle = '#3b2a1a'; c.beginPath(); c.moveTo(1*s, hy + 4.5*s); c.quadraticCurveTo(4*s, hy + 2.5*s, 8.5*s, hy + 4*s); c.quadraticCurveTo(5*s, hy + 6.2*s, 1*s, hy + 4.5*s); c.fill(); }
    if(look.face === 'beard'){ c.fillStyle = '#3b2a1a'; c.beginPath(); c.moveTo(-3*s, hy + 4*s); c.quadraticCurveTo(3*s, hy + 13*s, 9*s, hy + 4*s); c.quadraticCurveTo(4*s, hy + 7*s, -3*s, hy + 4*s); c.fill(); }
    if(look.face === 'blush'){ c.fillStyle = 'rgba(255,120,150,.55)'; c.beginPath(); c.ellipse(-3*s, hy + 3.5*s, 2.4*s, 1.4*s, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(8*s, hy + 4*s, 1.8*s, 1.2*s, 0, 0, 7); c.fill(); }
    if(look.face === 'eyepatch'){ c.fillStyle = '#16161e'; rr(c, eyes[1][0] - 2.6*s, eyes[1][1] - 3.2*s, 5.2*s, 6.4*s, 1.5*s); c.fill(); c.strokeStyle = '#16161e'; c.lineWidth = .9*s; c.beginPath(); c.moveTo(eyes[1][0] - 2.6*s, eyes[1][1] - 2.5*s); c.lineTo(-9.5*s, hy - 4.5*s); c.stroke(); }
    if(look.face === 'goggles'){ c.strokeStyle = '#b8860b'; c.lineWidth = 1.3*s; c.fillStyle = 'rgba(120,200,160,.35)'; eyes.forEach(function(e){ c.beginPath(); c.arc(e[0], e[1], 3.4*s, 0, 7); c.fill(); c.stroke(); }); c.strokeStyle = '#3b2a1a'; c.lineWidth = 1.6*s; c.beginPath(); c.moveTo(eyes[0][0] - 3.4*s, eyes[0][1]); c.lineTo(-9.8*s, hy - 1.5*s); c.stroke(); }
    if(look.face === 'clown'){ c.fillStyle = '#e8303c'; c.beginPath(); c.arc(5.2*s, hy + 3.2*s, 2.3*s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(4.4*s, hy + 2.4*s, .8*s, 0, 7); c.fill(); }
    if(look.face === 'scar'){ c.strokeStyle = '#d98a8a'; c.lineWidth = 1*s; c.beginPath(); c.moveTo(-5*s, hy - 1*s); c.lineTo(-1.5*s, hy + 5*s); c.moveTo(-4.5*s, hy + 1.5*s); c.lineTo(-2.5*s, hy + .5*s); c.moveTo(-3.5*s, hy + 3.5*s); c.lineTo(-1.5*s, hy + 2.5*s); c.stroke(); }
    if(look.face === 'freckles'){ c.fillStyle = 'rgba(120,70,40,.55)'; [[-3, 3.2], [-1.2, 4.2], [-4.2, 4.8], [7.6, 3.6], [9, 4.8], [6.4, 5]].forEach(function(f){ c.beginPath(); c.arc(f[0]*s, hy + f[1]*s, .55*s, 0, 7); c.fill(); }); }
    if(look.face === 'bandit'){ c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(-9.8*s, hy + 2*s); c.lineTo(9.9*s, hy + 2*s); c.lineTo(7*s, hy + 8.8*s); c.lineTo(-5*s, hy + 8.8*s); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; [[-6, 4], [-2, 6], [2, 4], [6, 6]].forEach(function(d){ c.beginPath(); c.arc(d[0]*s, hy + d[1]*s, .7*s, 0, 7); c.fill(); }); c.beginPath(); c.moveTo(-9.8*s, hy + 2*s); c.lineTo(-13*s, hy + 6*s); c.lineTo(-11*s, hy + 7*s); c.lineTo(-9*s, hy + 3.5*s); c.closePath(); c.fillStyle = '#c0392b'; c.fill(); }
    if(look.face === 'mask'){ c.fillStyle = '#4a6fb8'; c.beginPath(); c.moveTo(-9.5*s, hy + 2.5*s); c.lineTo(9.8*s, hy + 2.5*s); c.lineTo(6*s, hy + 8.5*s); c.lineTo(-6*s, hy + 8.5*s); c.closePath(); c.fill(); }
    /* hats */
    var ht = hy - 10*s;   /* top of the head */
    if(look.hat === 'cap'){ c.fillStyle = '#e04848'; c.beginPath(); c.arc(0, ht + 4*s, 8*s, Math.PI, 0); c.fill(); rr(c, 2*s, ht + 2.6*s, 11*s, 2.4*s, 1.2*s); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(-2*s, ht + 2*s, 2*s, 0, 7); c.fill(); }
    if(look.hat === 'crown'){ c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-7*s, ht + 3*s); c.lineTo(-7*s, ht - 4*s); c.lineTo(-3.5*s, ht); c.lineTo(0, ht - 5*s); c.lineTo(3.5*s, ht); c.lineTo(7*s, ht - 4*s); c.lineTo(7*s, ht + 3*s); c.closePath(); c.fill(); c.fillStyle = '#e04848'; c.beginPath(); c.arc(0, ht + 1*s, 1.2*s, 0, 7); c.fill(); }
    if(look.hat === 'tophat'){ c.fillStyle = '#16161e'; rr(c, -9*s, ht + 1*s, 18*s, 2.6*s, 1.3*s); c.fill(); rr(c, -6*s, ht - 11*s, 12*s, 13*s, 1.5*s); c.fill(); c.fillStyle = '#e04848'; c.fillRect(-6*s, ht - 1.5*s, 12*s, 2*s); }
    if(look.hat === 'beanie'){ c.fillStyle = '#4fd1c5'; c.beginPath(); c.arc(0, ht + 4.5*s, 9.3*s, Math.PI, 0); c.fill(); c.fillStyle = '#3aa79d'; rr(c, -9.3*s, ht + 2.5*s, 18.6*s, 3*s, 1.5*s); c.fill(); c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(0, ht - 5*s, 2.6*s, 0, 7); c.fill(); }
    if(look.hat === 'halo'){ c.strokeStyle = 'rgba(255,209,102,.95)'; c.lineWidth = 1.6*s; c.beginPath(); c.ellipse(0, ht - 5*s + Math.sin(T*2)*s, 7*s, 2.2*s, 0, 0, 7); c.stroke(); }
    if(look.hat === 'horns'){ c.fillStyle = '#c0392b'; [[-1, -6*s], [1, 6*s]].forEach(function(h){ c.beginPath(); c.moveTo(h[1] - 2.5*s*h[0], ht + 3*s); c.lineTo(h[1] + 3*s*h[0], ht - 7*s); c.lineTo(h[1] + 2*s*h[0], ht + 3*s); c.closePath(); c.fill(); }); }
    if(look.hat === 'propeller'){ c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, ht + 4*s, 8.5*s, Math.PI, 0); c.fill(); c.strokeStyle = '#16161e'; c.lineWidth = 1.2*s; c.beginPath(); c.moveTo(0, ht + 1*s); c.lineTo(0, ht - 3*s); c.stroke(); c.fillStyle = '#5ab4ff'; var pw = Math.cos(T*14)*8*s; rr(c, -Math.abs(pw), ht - 4.2*s, Math.abs(pw)*2 || 1, 1.6*s, .8*s); c.fill(); }
    if(look.hat === 'cowboy'){ c.fillStyle = '#8a5a2b'; c.beginPath(); c.ellipse(0, ht + 2.5*s, 13*s, 3*s, 0, 0, 7); c.fill(); rr(c, -6*s, ht - 6*s, 12*s, 9*s, 3*s); c.fill(); c.fillStyle = '#5a3a18'; c.fillRect(-6*s, ht + .5*s, 12*s, 1.6*s); }
    if(look.hat === 'chef'){ c.fillStyle = '#f4f1ea'; rr(c, -7*s, ht - 1*s, 14*s, 4*s, 1.5*s); c.fill(); c.beginPath(); c.arc(-4*s, ht - 5*s, 4.5*s, 0, 7); c.arc(1*s, ht - 7*s, 5*s, 0, 7); c.arc(5.5*s, ht - 4.5*s, 4*s, 0, 7); c.fill(); }
    if(look.hat === 'viking'){ c.fillStyle = '#9aa1b8'; c.beginPath(); c.arc(0, ht + 4.5*s, 9.6*s, Math.PI, 0); c.fill(); c.fillStyle = '#6a7088'; rr(c, -9.6*s, ht + 3*s, 19.2*s, 2.4*s, 1*s); c.fill(); c.fillStyle = '#f4f1ea'; [[-1, -8*s], [1, 8*s]].forEach(function(h){ c.beginPath(); c.moveTo(h[1] - 2*s*h[0], ht + 4*s); c.quadraticCurveTo(h[1] + 3*s*h[0], ht - 2*s, h[1] + 1.5*s*h[0], ht - 7*s); c.lineTo(h[1] + 3.2*s*h[0], ht + 1*s); c.closePath(); c.fill(); }); }
    if(look.hat === 'wizard'){ c.fillStyle = '#5b3fa8'; c.beginPath(); c.ellipse(0, ht + 3*s, 12*s, 2.6*s, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-7*s, ht + 3*s); c.lineTo(7*s, ht + 3*s); c.quadraticCurveTo(4*s, ht - 8*s, 3*s, ht - 15*s); c.quadraticCurveTo(0, ht - 6*s, -7*s, ht + 3*s); c.fill(); c.fillStyle = '#ffd166'; [[-1.5, -3], [2.5, -8], [.5, -12]].forEach(function(st){ c.beginPath(); c.arc(st[0]*s, ht + st[1]*s, .9*s, 0, 7); c.fill(); }); }
    if(look.hat === 'pirate'){ c.fillStyle = '#16161e'; c.beginPath(); c.moveTo(-12*s, ht + 3*s); c.quadraticCurveTo(-8*s, ht - 6*s, 0, ht - 5*s); c.quadraticCurveTo(8*s, ht - 6*s, 12*s, ht + 3*s); c.quadraticCurveTo(0, ht + .5*s, -12*s, ht + 3*s); c.fill(); c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(3.5*s, ht - 1.2*s, 1.4*s, 0, 7); c.fill(); c.fillStyle = '#16161e'; c.fillRect(2.9*s, ht - 1.5*s, .5*s, .8*s); c.fillRect(3.8*s, ht - 1.5*s, .5*s, .8*s); }
    if(look.hat === 'bucket'){ c.fillStyle = '#8a8f9c'; c.beginPath(); c.moveTo(-8*s, ht - 7*s); c.lineTo(8*s, ht - 7*s); c.lineTo(9.5*s, ht + 3*s); c.lineTo(-9.5*s, ht + 3*s); c.closePath(); c.fill(); c.fillStyle = '#5a5f6c'; rr(c, -9*s, ht - 8*s, 18*s, 2*s, .8*s); c.fill(); c.strokeStyle = '#5a5f6c'; c.lineWidth = .9*s; c.beginPath(); c.arc(0, ht - 7*s, 6*s, Math.PI, 0); c.stroke(); }
    if(look.hat === 'headband'){ c.fillStyle = '#e04848'; rr(c, -10*s, ht + 3*s, 20*s, 2.6*s, 1.2*s); c.fill(); var hb = idle ? Math.sin(T*3)*s : Math.sin(walk*2)*2*s; c.beginPath(); c.moveTo(-9.5*s, ht + 4*s); c.lineTo(-16*s - (air ? 4*s : 0), ht + 6*s + hb); c.lineTo(-10*s, ht + 5.5*s); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-9.5*s, ht + 4.5*s); c.lineTo(-15*s - (air ? 4*s : 0), ht + 9*s + hb); c.lineTo(-10*s, ht + 5.8*s); c.closePath(); c.fill(); }
    if(look.hat === 'antenna'){ c.strokeStyle = '#16161e'; c.lineWidth = 1*s; var an = Math.sin(T*5)*1.5*s; c.beginPath(); c.moveTo(0, ht + 1*s); c.quadraticCurveTo(an, ht - 4*s, an*1.5, ht - 8*s); c.stroke(); c.fillStyle = '#4fd1c5'; c.beginPath(); c.arc(an*1.5, ht - 9*s, 1.8*s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,'+(.3 + .3*Math.sin(T*8))+')'; c.beginPath(); c.arc(an*1.5, ht - 9*s, .8*s, 0, 7); c.fill(); }
    if(look.hat === 'bunny'){ [[-4.5, -1], [4.5, 1]].forEach(function(b){ var flop = air ? .5 : (idle ? Math.sin(T*2.5 + b[1])*.08 : Math.sin(walk*2)*.25); c.save(); c.translate(b[0]*s, ht + 1*s); c.rotate(b[1]*flop*.6); c.fillStyle = col; c.beginPath(); c.ellipse(0, -7*s, 2.6*s, 8*s, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,138,216,.85)'; c.beginPath(); c.ellipse(0, -6.5*s, 1.3*s, 5.5*s, 0, 0, 7); c.fill(); c.restore(); }); }
    if(look.hat === 'flower'){ c.strokeStyle = '#3aa79d'; c.lineWidth = 1*s; c.beginPath(); c.moveTo(-5*s, ht + 2*s); c.lineTo(-6*s, ht - 3*s); c.stroke(); for(var pi = 0; pi < 6; pi++){ c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(-6*s + Math.cos(pi/6*Math.PI*2)*2.4*s, ht - 5*s + Math.sin(pi/6*Math.PI*2)*2.4*s, 1.5*s, 1.1*s, pi/6*Math.PI*2, 0, 7); c.fill(); } c.fillStyle = '#ffd166'; c.beginPath(); c.arc(-6*s, ht - 5*s, 1.4*s, 0, 7); c.fill(); }
    if(look.hat === 'sombrero'){ c.fillStyle = '#d9a441'; c.beginPath(); c.ellipse(0, ht + 2.5*s, 17*s, 4*s, 0, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.beginPath(); c.ellipse(0, ht + 2.5*s, 17*s, 4*s, 0, Math.PI*.1, Math.PI*.9); c.fill(); c.fillStyle = '#d9a441'; c.beginPath(); c.moveTo(-6*s, ht + 2*s); c.lineTo(6*s, ht + 2*s); c.quadraticCurveTo(4*s, ht - 8*s, 0, ht - 8.5*s); c.quadraticCurveTo(-4*s, ht - 8*s, -6*s, ht + 2*s); c.fill(); c.fillStyle = '#c0392b'; rr(c, -6*s, ht - 1*s, 12*s, 1.6*s, .8*s); c.fill(); }
    if(look.hat === 'helmet'){ c.fillStyle = '#5c6b3c'; c.beginPath(); c.arc(0, ht + 4*s, 10.2*s, Math.PI, 0); c.fill(); rr(c, -10.6*s, ht + 3*s, 21.2*s, 2.2*s, 1*s); c.fill(); c.strokeStyle = '#3f4a2a'; c.lineWidth = .9*s; c.beginPath(); c.moveTo(-7*s, ht + 3*s); c.lineTo(-7*s, ht + 5*s); c.moveTo(7*s, ht + 3*s); c.lineTo(7*s, ht + 5*s); c.stroke(); c.fillStyle = '#f4f1ea'; c.font = 'bold '+(3*s)+'px sans-serif'; c.textAlign = 'center'; c.fillText('R', 0, ht + 1.5*s); }
    if(look.hat === 'party'){ c.fillStyle = '#c084fc'; c.beginPath(); c.moveTo(-5*s, ht + 2*s); c.lineTo(5*s, ht + 2*s); c.lineTo(1*s, ht - 11*s); c.closePath(); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-3*s, ht - 1*s); c.lineTo(3.5*s, ht - 1*s); c.lineTo(2.6*s, ht - 4*s); c.lineTo(-1.8*s, ht - 4*s); c.closePath(); c.fill(); c.beginPath(); c.arc(1*s, ht - 11*s, 1.6*s, 0, 7); c.fill(); }
    /* front arm and gun (or the rope hand) */
    c.strokeStyle = arm; c.lineWidth = 3.2*s;
    if(o.hang){ /* the body hangs beside the rope (drawPlayer shifts it back 8s): the front hand grips the rope up at -24s, the back hand keeps the gun on the aim */ c.beginPath(); c.moveTo(4.5*s, -1*s - bob); c.lineTo(8*s, -24*s - bob); c.stroke(); c.fillStyle = arm; c.beginPath(); c.arc(8*s, -24*s - bob, 2.6*s, 0, 7); c.fill(); if(gx != null){ o.gun(gx, gy, a, s); c.fillStyle = arm; c.beginPath(); c.arc(gx - Math.cos(a)*3.5*s, gy - Math.sin(a)*3.5*s + 1.5*s, 2.6*s, 0, 7); c.fill(); } else { c.fillStyle = arm; c.beginPath(); c.arc(-6*s, 8*s - bob, 2.4*s, 0, 7); c.fill(); } }
    else if(gx != null){ c.beginPath(); c.moveTo(4.5*s, -1*s - bob); c.lineTo(gx, gy); c.stroke(); o.gun(gx, gy, a, s); c.fillStyle = arm; c.beginPath(); c.arc(gx - Math.cos(a)*3.5*s, gy - Math.sin(a)*3.5*s + 1.5*s, 2.6*s, 0, 7); c.fill(); c.beginPath(); c.arc(gx, gy, 2.8*s, 0, 7); c.fill(); }
    else { c.beginPath(); c.moveTo(4.5*s, -1*s - bob); c.lineTo(7.5*s + (idle ? 0 : Math.sin(walk)*2.5*s), 7*s - bob); c.stroke(); c.fillStyle = arm; c.beginPath(); c.arc(7.5*s + (idle ? 0 : Math.sin(walk)*2.5*s), 7*s - bob, 2.4*s, 0, 7); c.fill(); c.beginPath(); c.arc(-7*s + (idle ? 0 : Math.sin(walk + Math.PI)*2.5*s), 7*s - bob, 2.4*s, 0, 7); c.fill(); }
    c.restore(); }
/* tigOS arcade rounds.js, part 01: sounds. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- sounds: the shared synth from games.js. Bigger bullets thump lower and louder ---------- */
  var sfx = window.TIG_SFX || { tone:function(){}, noise:function(){} };
  var snd = {
    shoot:function(size, dmg, n){ var g = clamp(.07 + dmg/380, .07, .45)*(n > 1 ? .7 : 1), f = clamp(1100/Math.pow(size, .9), 90, 1400); sfx.noise(.05 + size*.06, clamp(2200/size, 300, 3000), g*1.2); sfx.tone('square', f, f*.45, .06 + size*.05, g*.5); if(size >= 1.8) sfx.tone('sine', 90, 40, .25, g*.8); },
    laser:function(){ sfx.tone('sawtooth', 220, 90, .28, .18); sfx.tone('square', 1200, 300, .12, .08); },
    block:function(){ sfx.tone('sine', 320, 1100, .16, .2); sfx.tone('triangle', 640, 1600, .1, .08, .03); },
    hit:function(n){ sfx.noise(.07, 900, clamp(.15 + n/300, .15, .5)); sfx.tone('triangle', 260, 120, .08, .12); },
    kill:function(){ sfx.noise(.5, 500, .6); sfx.tone('sawtooth', 220, 30, .5, .3); sfx.tone('square', 900, 200, .25, .1, .05); },
    jump:function(){ sfx.tone('square', 260, 520, .09, .07); },
    land:function(){ sfx.noise(.05, 500, .12); },
    pick:function(){ [660, 880, 1320].forEach(function(f, i){ sfx.tone('triangle', f, f, .12, .12, i*.06); }); },
    tick:function(){ sfx.tone('sine', 520, 520, .06, .12); },
    fight:function(){ sfx.tone('square', 660, 990, .18, .18); sfx.noise(.15, 1500, .2); },
    point:function(win){ (win ? [523, 659, 784, 1046] : [392, 330, 262]).forEach(function(f, i){ sfx.tone('triangle', f, f, .16, .16, i*.09); }); },
    round:function(win){ (win ? [523, 659, 784, 1046, 1318] : [440, 392, 349, 330]).forEach(function(f, i){ sfx.tone('triangle', f, f, .2, .18, i*.11); }); },
    explode:function(r){ sfx.noise(.35 + r/300, clamp(900 - r*3, 150, 900), .7); sfx.tone('sine', 110, 30, .45, .35); },
    bounce:function(){ sfx.tone('sine', 760, 520, .04, .05); },
    heal:function(){ sfx.tone('sine', 880, 1320, .12, .06); },
    grab:function(){ sfx.noise(.06, 1200, .18); sfx.tone('triangle', 300, 420, .08, .08); },
    snap:function(){ sfx.tone('square', 900, 200, .12, .2); sfx.noise(.1, 2500, .3); },
    crateLand:function(){ sfx.noise(.3, 300, .7); sfx.tone('sine', 120, 40, .3, .35); },
    saw:function(){ sfx.noise(.2, 1800, .5, 4); sfx.tone('sawtooth', 700, 300, .18, .2); },
    blink:function(){} };
/* tigOS arcade rounds.js, part 02: music. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- music: a procedural synth loop in the spirit of ROUNDS' soundtrack, driving 128 bpm electro. Bass and hats always; kick, snare and a square lead join for the fight; a low-pass drop between points. M mutes. ---------- */
  var MUSIC = (function(){ var ac = null, out = null, filt = null, on = true, running = false, timer = null, nextT = 0, step = 0, mode = 'menu', vol = .15, nbuf = null, phrase = 0;
    var CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], BASS = [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 12, 0, 7, 0, 12, 0], LEAD = [[0, 2, 1, 3, 2, 4, 3, 5], [4, 3, 2, 1, 0, 1, 2, 3], [0, 0, 3, 3, 2, 2, 4, 4], [5, 4, 2, 4, 3, 2, 1, 0], [0, 3, 0, 4, 0, 5, 2, 4]];
    function hz(n, oct){ return 220*Math.pow(2, n/12 + (oct || 0)); }
    function osc(type, f, t0, dur, g, dest, f1){ var o = ac.createOscillator(), e = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if(f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + .008); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(e); e.connect(dest || filt); o.start(t0); o.stop(t0 + dur + .03); }
    function nz(t0, dur, g, hp){ if(!nbuf){ var n = ac.sampleRate*.25 | 0; nbuf = ac.createBuffer(1, n, ac.sampleRate); var d = nbuf.getChannelData(0); for(var i = 0; i < n; i++) d[i] = Math.random()*2 - 1; } var src = ac.createBufferSource(), f = ac.createBiquadFilter(), e = ac.createGain(); src.buffer = nbuf; f.type = 'highpass'; f.frequency.value = hp; e.gain.setValueAtTime(g, t0); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); src.connect(f); f.connect(e); e.connect(out); src.start(t0); src.stop(t0 + dur + .02); }
    function kick(t0){ osc('sine', 150, t0, .2, .55, out, 42); }
    function snare(t0){ nz(t0, .13, .28, 1600); osc('triangle', 210, t0, .09, .18, out, 120); }
    function play(i, t0, sd){ var bar = (i >> 4) % 4, s16 = i & 15, ch = CHORDS[bar], root = ch[0], drums = mode === 'fight';
      if(i === 0 && Math.random() < .5) phrase = (phrase + 1 + ((Math.random()*(LEAD.length - 1)) | 0)) % LEAD.length;
      if(mode !== 'drop' || s16 % 4 === 0){ var bn = hz(root + BASS[s16], -2); osc('sawtooth', bn, t0, sd*.85, .2); osc('square', bn*.5, t0, sd*.6, .07); }
      if((drums && s16 % 4 === 0) || (!drums && mode !== 'drop' && s16 % 8 === 0)) kick(t0);
      if(drums && (s16 === 4 || s16 === 12)) snare(t0);
      if(s16 % 2 === 1 && mode !== 'drop') nz(t0, .045, s16 % 4 === 3 ? .13 : .07, 7000);
      if(drums && s16 % 2 === 0){ var idx = LEAD[(phrase + bar) % LEAD.length][s16 >> 1], n = ch[idx % 3] + (idx >= 3 ? 12 : 0); osc('square', hz(n, 0), t0, sd*1.5, .055, filt, hz(n, 0)*1.002); }
      if(s16 === 0){ ch.forEach(function(n){ osc('sawtooth', hz(n, -1)*1.004, t0, sd*16, .03); osc('sawtooth', hz(n, -1)*.996, t0, sd*16, .03); }); } }
    function tick(){ if(!ac) return; var sd = 60/128/4; while(nextT < ac.currentTime + .3){ try { play(step, nextT, sd); } catch(e){} nextT += sd; step = (step + 1) % 64; } }
    function start(){ if(running) return false; ac = sfx.ctx ? sfx.ctx() : null; if(!ac) return false; try { if(ac.state === 'suspended') ac.resume(); } catch(e){} out = ac.createGain(); out.gain.value = on ? vol : 0; filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1400; filt.Q.value = .8; filt.connect(out); out.connect(ac.destination); running = true; nextT = ac.currentTime + .08; step = 0; timer = setInterval(tick, 80); return true; }
    function stop(){ if(timer) clearInterval(timer); timer = null; running = false; if(out && ac){ var o = out; try { o.gain.setTargetAtTime(0, ac.currentTime, .06); } catch(e){} setTimeout(function(){ try { o.disconnect(); } catch(e){} }, 400); } out = null; filt = null; }
    function setMode(m){ if(m === mode) return; mode = m; if(!filt || !ac) return; filt.frequency.setTargetAtTime(m === 'fight' ? 9000 : m === 'drop' ? 420 : 1400, ac.currentTime, .3); }
    function toggle(){ on = !on; if(out && ac) out.gain.setTargetAtTime(on ? vol : 0, ac.currentTime, .05); return on; }
    return { start:start, stop:stop, setMode:setMode, toggle:toggle, state:function(){ return { running:running, on:on, mode:mode, step:step, phrase:phrase }; } }; })();
  /* Landfall shows a multiplier m as +(m-1)% when m >= 1 and as -(1/m-1)% when m < 1, so "-100% HP" is a 0.5x multiplier. mul() reverses that. */
  var mul = function(p){ return p >= 0 ? 1 + p/100 : 1/(1 - p/100); };

/* tigOS arcade rounds.js, part 03: stats. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- stats ---------- */
  function baseStats(){ return { hp:100, dmg:55, reload:2.1, ammo:3, atk:.3/1.025, speed:1, bullets:1, burst:0, bounces:0, size:1, grav:1, spread:0, blockCd:4, move:1, jump:1, jumps:1, steal:0, regen:0, body:1, knock:1, gravity:1, blocks:1, crit:0,
    onBlock:[], onHit:[], onReload:[], passive:[], slow:0, stun:0, dot3:0, dot5:0, grow:0, homing:0, remote:0, sneaky:0, drill:0, explode:0, timed:0, toxic:0, thrust:0, trickster:0, targetBounce:0, ricochet:0, pierce:0, ghost:0, wrap:0, boomerang:0, ignite:0, hex:0, shards:0, frag:0, fireworks:0, snake:0, smoke:0, saw:0, laser:0, stasis:0, fizzle:0, unblockable:0, bleed:0, curses:0, echo:0, chilling:0, lifestealer:0, radiance:0, phoenix:0, abyssal:0, immovable:0, autoblock:0, halo:0, unicorn:0, pogo:0, lootbox:0, guardian:0, mending:0, nest:0, ferocity:0, warpath:0, scaredy:0, retreat:0, laststand:0, masochist:0, adrenaline:0, brawler:0, chase:0, decay:0, demonic:0, pristine:0, refresh:0, scavenger:0, shieldsUp:0, taste:0, empower:0, quickReflex:0, hotpotato:0, curseEater:0, gatling:0, hurtM:1, range:0, precise:0, apexBlock:0, mirror:0, siphon:0, kamikaze:0, perfect:0 }; }
  var RAR = { common:{ w:60, col:'#c8cbd6', name:'Common' }, uncommon:{ w:30, col:'#4fd1c5', name:'Uncommon' }, rare:{ w:9, col:'#e879f9', name:'Rare' }, legendary:{ w:1.2, col:'#fbbf24', name:'Legendary' }, curse:{ w:0, col:'#ff5f57', name:'Curse' } };
  var randomCard = null;   /* bound by the running game so luck cards can draw from its pool */
  var PACKS = { vanilla:'ROUNDS', cr:'Cosmic Rounds', plus:'Cards Plus', wacky:'Wacky Cards', pce:'PCE', keys:'Keys\u2019 Cards', tig:'tigOS Cuts' };
  var CARDS = [], BY = {};
  function C(pack, id, name, rarity, desc, lines, fn, opt){ var k = { id:id, name:name, pack:pack, rarity:rarity, desc:desc || '', lines:lines || [], apply:fn || function(){}, once:!!(opt && opt.once), instant:!!(opt && opt.instant), cursed:!!(opt && opt.cursed), tags:(opt && opt.tags) || [] }; CARDS.push(k); BY[id] = k; return k; }
  var blk = function(name, pct, cd){ return function(S){ if(pct) S.hp *= mul(pct); S.blockCd += (cd == null ? .25 : cd); S.onBlock.push(name); }; };

/* tigOS arcade rounds.js, part 04: the 67 vanilla. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- the 67 vanilla cards, numbers from the ROUNDS wiki ---------- */
  C('vanilla', 'abyssal', 'Abyssal Countdown', 'rare', 'Stand still to summon dark powers', [], function(S){ S.abyssal++; }, { tags:['block'] });
  C('vanilla', 'barrage', 'Barrage', 'uncommon', 'Fire many bullets at the same time', ['+4 Bullets', '+5 Ammo', '-70% DMG', '+0.25s Reload time'], function(S){ S.bullets += 4; S.ammo += 5; S.dmg *= mul(-70); S.reload += .25; S.spread += .16; }, { tags:['gun'] });
  C('vanilla', 'big', 'Big Bullets', 'common', 'Bigger bullets', ['+0.25s Reload time'], function(S){ S.size *= 1.6; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'bombsaway', 'Bombs Away', 'uncommon', 'Spawn a bunch of small bombs around you when you block', ['+30% HP', '+0.25s Block cooldown'], blk('bombs', 30), { tags:['block'] });
  C('vanilla', 'bouncy', 'Bouncy', 'uncommon', '', ['+2 Bullet bounces', '+25% Damage', '+0.25s Reload time'], function(S){ S.bounces += 2; S.dmg *= 1.25; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'brawler', 'Brawler', 'uncommon', '+200% HP 3s after dealing DMG', [], function(S){ S.brawler = 1; }, { once:true, tags:['body'] });
  C('vanilla', 'buckshot', 'Buckshot', 'uncommon', 'Adds a shotgun vibe to your attack', ['+4 Bullets', '+5 Ammo', '-60% DMG', '+0.25s Reload time'], function(S){ S.bullets += 4; S.ammo += 5; S.dmg *= mul(-60); S.reload += .25; S.spread += .3; }, { tags:['gun'] });
  C('vanilla', 'burst', 'Burst', 'common', 'Multiple bullets are fired in a sequence', ['+2 Bullets', '+3 Ammo', '-60% DMG', '+0.25s Reload time'], function(S){ S.burst += 2; S.ammo += 3; S.dmg *= mul(-60); S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'careful', 'Careful Planning', 'uncommon', '', ['+100% DMG', '-150% ATKSPD', '+0.5s Reload time'], function(S){ S.dmg *= 2; S.atk *= 2.5; S.reload += .5; }, { tags:['gun'] });
  C('vanilla', 'chase', 'Chase', 'uncommon', '+60% movement when moving towards the opponent', ['+30% Health'], function(S){ S.hp *= 1.3; S.chase = 1; }, { once:true, tags:['body'] });
  C('vanilla', 'chilling', 'Chilling Presence', 'rare', 'Slightly slow nearby enemies', ['+25% HP'], function(S){ S.hp *= 1.25; S.chilling++; }, { tags:['body'] });
  C('vanilla', 'cold', 'Cold Bullets', 'common', '', ['+70% Slow on hit', '+0.25s Reload time'], function(S){ S.slow += .7; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'combine', 'Combine', 'common', '', ['+100% DMG', '-2 Ammo', '+0.5s Reload time'], function(S){ S.dmg *= 2; S.ammo -= 2; S.reload += .5; }, { tags:['gun'] });
  C('vanilla', 'dazzle', 'Dazzle', 'common', 'Bullets stun the opponent multiple times', ['+0.25s Reload time'], function(S){ S.stun += .35; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'decay', 'Decay', 'uncommon', 'Damage done to you is dealt over 4 seconds', ['+50% HP'], function(S){ S.hp *= 1.5; S.decay = 1; }, { once:true, tags:['body'] });
  C('vanilla', 'defender', 'Defender', 'uncommon', '', ['-30% Block cooldown', '+30% HP'], function(S){ S.blockCd *= mul(-30); S.hp *= 1.3; }, { tags:['block', 'body'] });
  C('vanilla', 'demonic', 'Demonic Pact', 'rare', 'Shooting costs 10HP. Removes shooting cooldown', ['+9 Bullets', '+2 Splash DMG', '+0.25s Reload time'], function(S){ S.bullets += 9; S.demonic = 1; S.atk = 0; S.explode += .35; S.reload += .25; S.spread += .2; }, { once:true, tags:['gun'] });
  C('vanilla', 'drill', 'Drill Ammo', 'rare', 'Bullets drill through walls', ['+7m Drill', '+0.25s Reload time'], function(S){ S.drill += 7; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'echo', 'Echo', 'uncommon', 'Blocking triggers another, delayed block', ['+30% HP', '+0.25s Block cooldown'], function(S){ S.hp *= 1.3; S.blockCd += .25; S.echo++; }, { tags:['block'] });
  C('vanilla', 'emp', 'EMP', 'uncommon', 'Blocking spawns a ring of slowing projectiles', ['+30% HP', '+0.25s Block cooldown'], blk('emp', 30), { tags:['block'] });
  C('vanilla', 'empower', 'Empower', 'uncommon', 'Blocking increases the damage and speed of your next shot', ['+0.25s Block cooldown'], function(S){ S.blockCd += .25; S.empower++; }, { tags:['block'] });
  C('vanilla', 'explosive', 'Explosive Bullet', 'uncommon', 'Bullet explodes on impact', ['-100% ATKSPD', '+0.25s Reload time'], function(S){ S.explode += 1; S.atk *= 2; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'fastball', 'Fastball', 'common', '', ['+250% Bullet speed', '-50% ATKSPD', '+0.25s Reload time'], function(S){ S.speed *= 3.5; S.atk *= 1.5; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'fastforward', 'Fast Forward', 'common', 'Bullets keep the default trajectory', ['+100% Projectile speed', '+30% Reload speed'], function(S){ S.speed *= 2; S.reload /= 1.3; S.grav = 0; }, { tags:['gun'] });
  C('vanilla', 'frostslam', 'Frost Slam', 'common', 'Slows enemies around you when you block', ['+30% HP', '+0.25s Block cooldown'], blk('frost', 30), { tags:['block'] });
  C('vanilla', 'glass', 'Glass Cannon', 'uncommon', '', ['+100% DMG', '-100% HP', '+0.25s Reload time'], function(S){ S.dmg *= 2; S.hp *= .5; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'grow', 'Grow', 'uncommon', 'Bullets get more damage over time when travelling', ['+0.25s Reload time'], function(S){ S.grow += 1; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'healingfield', 'Healing Field', 'common', 'Blocking creates a healing field', ['+30% HP', '+0.25s Block cooldown'], blk('heal', 30), { tags:['block'] });
  C('vanilla', 'homing', 'Homing', 'uncommon', 'Bullets home towards visible targets', ['-25% DMG', '-50% ATKSPD', '+0.25s Reload time'], function(S){ S.homing += 1; S.dmg *= mul(-25); S.atk *= 1.5; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'huge', 'Huge', 'common', '', ['+80% HP'], function(S){ S.hp *= 1.8; }, { tags:['body'] });   /* size follows health now (recalc), so no extra body multiplier */
  C('vanilla', 'implode', 'Implode', 'uncommon', 'Blocking pulls enemies towards you', ['+50% HP', '+0.25s Block cooldown'], blk('implode', 50), { tags:['block'] });
  C('vanilla', 'leech', 'Leech', 'common', '', ['+75% Life steal', '+30% HP'], function(S){ S.steal += .75; S.hp *= 1.3; }, { tags:['body'] });
  C('vanilla', 'lifestealer', 'Lifestealer', 'rare', 'Steal hp from your opponent when near', ['+25% HP'], function(S){ S.hp *= 1.25; S.lifestealer++; }, { tags:['body'] });
  C('vanilla', 'mayhem', 'Mayhem', 'uncommon', '', ['+5 Bullet bounces', '-15% DMG', '+0.5s Reload time'], function(S){ S.bounces += 5; S.dmg *= mul(-15); S.reload += .5; S.spread += .2; }, { tags:['gun'] });
  C('vanilla', 'overpower', 'Overpower', 'uncommon', 'Deal 15% of your max HP to enemies around you when you block', ['+30% HP', '+0.25s Block cooldown'], blk('overpower', 30), { tags:['block'] });
  C('vanilla', 'parasite', 'Parasite', 'uncommon', 'Bullets deal damage over 5 seconds', ['+50% Life steal', '+25% HP', '+25% DMG', '+0.25s Reload time'], function(S){ S.steal += .5; S.hp *= 1.25; S.dmg *= 1.25; S.reload += .25; S.dot5 += 1; }, { tags:['gun'] });
  C('vanilla', 'phoenix', 'Phoenix', 'rare', 'Respawn once on death', ['-35% HP'], function(S){ S.hp *= mul(-35); S.phoenix++; }, { tags:['body'] });
  C('vanilla', 'poison', 'Poison', 'common', 'Bullets deal damage over 3 seconds', ['+70% DMG', '+30% Reload speed', '-1 Bullet'], function(S){ S.dmg *= 1.7; S.reload /= 1.3; S.ammo -= 1; S.dot3 += 1; }, { tags:['gun'] });
  C('vanilla', 'pristine', 'Pristine Perseverence', 'rare', '+400% HP when above 90% HP', [], function(S){ S.pristine = 1; }, { once:true, tags:['body'] });
  C('vanilla', 'quickreload', 'Quick Reload', 'uncommon', '', ['-70% Reload time'], function(S){ S.reload *= mul(-70); }, { tags:['gun'] });
  C('vanilla', 'quickshot', 'Quick Shot', 'common', '', ['+150% Bullet speed', '+0.25s Reload time'], function(S){ S.speed *= 2.5; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'radar', 'Radar Shot', 'uncommon', 'Blocking scans the area for enemies. You automatically shoot any enemy found', ['+30% HP', '+0.25s Block cooldown'], blk('radar', 30), { tags:['block'] });
  C('vanilla', 'radiance', 'Radiance', 'rare', 'Spawn damaging sun waves when reloading', ['+30% HP'], function(S){ S.hp *= 1.3; S.radiance++; }, { tags:['gun'] });
  C('vanilla', 'refresh', 'Refresh', 'rare', 'You get block back when dealing damage', [], function(S){ S.refresh = 1; }, { once:true, tags:['block'] });
  C('vanilla', 'remote', 'Remote', 'rare', 'Steer bullets with the mouse', ['-40% Bullet speed', '+0.25s Reload time'], function(S){ S.remote = 1; S.speed *= mul(-40); S.reload += .25; }, { once:true, tags:['gun'] });
  C('vanilla', 'ricochet', 'Riccochet', 'uncommon', 'Bullets lose half of their speed when they bounce', ['+2 Bullet bounces', '+25% ATKSPD', '+0.25s Reload time'], function(S){ S.bounces += 2; S.ricochet = 1; S.atk /= 1.25; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'saw', 'Saw', 'rare', 'Blocking spawns a saw around you for a short while', ['+30% HP', '+0.25s Block cooldown'], blk('saw', 30), { tags:['block'] });
  C('vanilla', 'scavenger', 'Scavenger', 'uncommon', 'Dealing damage reloads your weapon', ['+0.5s Reload time'], function(S){ S.scavenger = 1; S.reload += .5; }, { once:true, tags:['gun'] });
  C('vanilla', 'shieldcharge', 'Shield Charge', 'uncommon', 'Blocking launches you forward and gives you a second automatic block when the charge ends', ['+0.25s Block cooldown'], blk('charge', 0), { tags:['block'] });
  C('vanilla', 'shieldsup', 'Shields Up', 'rare', 'Firing your last bullet triggers a block. Disables continuous reloading', ['+0.5s Reload time', '+0.5s Block cooldown'], function(S){ S.shieldsUp = 1; S.reload += .5; S.blockCd += .5; }, { once:true, tags:['block'] });
  C('vanilla', 'shockwave', 'Shockwave', 'uncommon', 'Blocking pushes enemies away', ['+50% HP', '+0.25s Block cooldown'], blk('shock', 50), { tags:['block'] });
  C('vanilla', 'silence', 'Silence', 'uncommon', 'Blocking silences enemies nearby', ['+25% HP', '+0.25s Block cooldown'], blk('silence', 25), { tags:['block'] });
  C('vanilla', 'sneaky', 'Sneaky', 'uncommon', 'Bullets avoid the ground', ['+0.25s Reload time'], function(S){ S.sneaky = 1; S.reload += .25; }, { once:true, tags:['gun'] });
  C('vanilla', 'spray', 'Spray', 'uncommon', '', ['+1000% ATKSPD', '+12 AMMO', '-75% DMG', '+0.25s Reload time'], function(S){ S.atk /= 11; S.ammo += 12; S.dmg *= mul(-75); S.reload += .25; S.spread += .1; }, { tags:['gun'] });
  C('vanilla', 'static', 'Static Field', 'uncommon', 'Blocking creates a field that slows and deals damage', ['+0.25s Block cooldown'], blk('static', 0), { tags:['block'] });
  C('vanilla', 'steady', 'Steady Shot', 'common', '', ['+40% HP', '+100% Bullet speed', '+0.25s Reload time'], function(S){ S.hp *= 1.4; S.speed *= 2; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'supernova', 'Supernova', 'rare', 'Spawns a field that pulls enemies in and stuns after a while', ['+50% HP', '+0.5s Block cooldown'], blk('nova', 50, .5), { tags:['block'] });
  C('vanilla', 'tactical', 'Tactical Reload', 'rare', 'Blocking reloads your weapon', ['+0.25s Block cooldown'], blk('reload', 0), { tags:['block'] });
  C('vanilla', 'tank', 'Tank', 'common', '', ['+100% HP', '-25% ATKSPD', '+0.5s Reload time'], function(S){ S.hp *= 2; S.atk *= 1.25; S.reload += .5; }, { tags:['body'] });
  C('vanilla', 'targetbounce', 'Target Bounce', 'uncommon', 'Bullets aim for visible targets when bouncing', ['+1 Bullet bounce', '-20% DMG', '+0.25s Reload time'], function(S){ S.bounces += 1; S.targetBounce = 1; S.dmg *= mul(-20); S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'taste', 'Taste of Blood', 'uncommon', '+50% movement speed 3s after dealing DMG', ['+30% Life steal'], function(S){ S.steal += .3; S.taste = 1; }, { tags:['body'] });
  C('vanilla', 'teleport', 'Teleport', 'rare', 'Blocking teleports you forward', ['-30% Block cooldown'], function(S){ S.blockCd *= mul(-30); S.onBlock.push('teleport'); }, { once:true, tags:['block'] });
  C('vanilla', 'thruster', 'Thruster', 'uncommon', 'Bullets have thrusters that push targets', ['+0.25s Reload time'], function(S){ S.thrust += 1; S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'timed', 'Timed Detonation', 'common', 'Bullets spawn bombs that explode after half a second', ['-15% DMG', '+0.25s Reload time'], function(S){ S.timed += 1; S.dmg *= mul(-15); S.reload += .25; }, { tags:['gun'] });
  C('vanilla', 'toxic', 'Toxic Cloud', 'rare', 'Bullets spawn a poison cloud on impact. Clouds deal damage and slow', ['-20% Attack Speed', '+0.5s Reload time'], function(S){ S.toxic += 1; S.atk *= 1.2; S.reload += .5; }, { tags:['gun'] });
  C('vanilla', 'trickster', 'Trickster', 'rare', 'Bullets deal 80% more DMG per bounce', ['+2 Bullet bounces', '-20% DMG', '+0.5s Reload time'], function(S){ S.bounces += 2; S.trickster += 2; S.dmg *= mul(-20); S.reload += .5; }, { tags:['gun'] });
  C('vanilla', 'windup', 'Wind Up', 'common', '', ['+100% Bullet speed', '+60% DMG', '-100% ATKSPD', '+0.5s Reload time'], function(S){ S.speed *= 2; S.dmg *= 1.6; S.atk *= 2; S.reload += .5; }, { tags:['gun'] });

/* tigOS arcade rounds.js, part 05: cosmic rounds. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Cosmic Rounds (CR by XAngelMoonX, the most downloaded card pack) ---------- */
  C('cr', 'speedup', 'Speed Up', 'common', '', ['+25% Movement speed'], function(S){ S.move *= 1.25; }, { tags:['body'] });
  C('cr', 'stasis', 'Stasis', 'common', 'Bullets hang in the air for a moment after leaving the barrel', ['+35% DMG', '+0.25s Reload time'], function(S){ S.dmg *= 1.35; S.stasis = 1; S.reload += .25; }, { tags:['gun'] });
  C('cr', 'bullettime', 'Bullet Time', 'common', 'Blocking slows every enemy bullet on screen for a moment', ['-35% Reload time'], function(S){ S.reload *= mul(-35); S.onBlock.push('bullettime'); }, { tags:['block'] });
  C('cr', 'crstun', 'Stun', 'uncommon', 'Bullets have a chance to stun', ['-35% Reload time', '-1 Ammo'], function(S){ S.reload *= mul(-35); S.ammo -= 1; S.stun += .25; }, { tags:['gun'] });
  C('cr', 'star', 'Star', 'common', 'Bullets gain damage while they travel', ['+15% Damage growth', '+0.25s Reload time'], function(S){ S.grow += .6; S.reload += .25; }, { tags:['gun'] });
  C('cr', 'crit', 'Critical Hit', 'common', 'Bullets have a chance to deal double damage', ['+20% Crit chance'], function(S){ S.crit += .2; }, { tags:['gun'] });
  C('cr', 'flamethrower', 'Flamethrower', 'legendary', 'Short range, sets targets on fire', ['+8 Bullets', '+20 Ammo', '+500% ATKSPD', '-85% DMG', '+0.5s Reload time'], function(S){ S.bullets += 8; S.ammo += 20; S.atk /= 6; S.dmg *= mul(-85); S.reload += .5; S.ignite += 1; S.spread += .35; S.range = .32; S.speed *= .8; }, { once:true, tags:['gun'] });
  C('cr', 'pogo', 'Pogo', 'common', '', ['+60% HP', '-40% Block cooldown', '-50% Gravity'], function(S){ S.hp *= 1.6; S.blockCd *= mul(-40); S.gravity *= .5; }, { tags:['body'] });
  C('cr', 'cloud', 'Cloud', 'common', 'Blocking summons a cloud over your enemy that rains bullets', ['-50% DMG'], function(S){ S.dmg *= .5; S.onBlock.push('cloud'); }, { tags:['block'] });
  C('cr', 'crgravity', 'Gravity', 'uncommon', '', ['+100% Bullet gravity', '+50% DMG'], function(S){ S.grav *= 2; S.dmg *= 1.5; }, { tags:['gun'] });
  C('cr', 'ignite', 'Ignite', 'rare', 'Bullets set targets on fire. Blocking burns nearby enemies for 33% of their max HP', [], function(S){ S.ignite += 1; S.onBlock.push('ignite'); }, { tags:['gun', 'block'] });
  C('cr', 'glue', 'Glue', 'uncommon', '', ['+50% Slow on hit', '+100% ATKSPD', '-60% DMG'], function(S){ S.slow += .5; S.atk /= 2; S.dmg *= mul(-60); }, { tags:['gun'] });
  C('cr', 'aquaring', 'Aqua Ring', 'uncommon', 'Blocking spawns a healing ring that follows you', ['+25% HP', '+0.25s Block cooldown'], blk('aqua', 25), { tags:['block'] });
  C('cr', 'barrier', 'Barrier', 'uncommon', 'Blocking raises a barrier that eats enemy bullets', ['+0.25s Block cooldown'], blk('barrier', 0), { tags:['block'] });
  C('cr', 'chlorophyll', 'Chlorophyll', 'rare', '', ['+7 Life regen', '+30% HP', '+15% Movement speed'], function(S){ S.regen += 7; S.hp *= 1.3; S.move *= 1.15; }, { tags:['body'] });
  C('cr', 'cake', 'Cake', 'common', '', ['+7 Life regen', '+50% HP', '+35% Reload time'], function(S){ S.regen += 7; S.hp *= 1.5; S.reload *= 1.35; }, { tags:['body'] });
  C('cr', 'comet', 'Comet', 'uncommon', 'Blocking calls a comet down on the nearest enemy', ['+0.25s Block cooldown'], blk('comet', 0), { tags:['block'] });
  C('cr', 'iceshard', 'Ice Shard', 'rare', 'Bullets shatter into cold shards on impact', ['-66% DMG', '+0.25s Reload time'], function(S){ S.shards += 1; S.dmg *= mul(-66); S.reload += .25; S.slow += .3; }, { tags:['gun'] });
  C('cr', 'battery', 'Battery', 'rare', 'Starting a reload stuns enemies near you', ['+50% HP'], function(S){ S.hp *= 1.5; S.onReload.push('battery'); }, { tags:['body'] });
  C('cr', 'unicorn', 'Unicorn', 'rare', 'Every 8s you change colour and gain that colour\u2019s power', [], function(S){ S.unicorn = 1; }, { once:true, tags:['body'] });
  C('cr', 'halo', 'Halo', 'legendary', 'A ring of bullets orbits you and fires at your enemies', ['+25% Block cooldown'], function(S){ S.halo = 1; S.blockCd *= 1.25; }, { once:true, tags:['gun'] });
  C('cr', 'sun', 'Sun', 'legendary', 'Bullets split into four when they run out of bounces', ['+1 Bullet bounce', '+20% DMG'], function(S){ S.bounces += 1; S.dmg *= 1.2; S.frag += 2; }, { tags:['gun'] });
  C('cr', 'egg', 'Egg', 'legendary', 'Hatches into a random card of any rarity', [], function(S, P){ P.give(randomCard(P, ['common', 'uncommon', 'rare', 'legendary']), true); }, { once:true, instant:true, tags:['luck'] });
  C('cr', 'tabularasa', 'Tabula Rasa', 'rare', 'Wipes your deck clean and lets you pick two fresh cards', [], function(S, P){ P.wipe(); P.extraPicks += 2; }, { once:true, instant:true, tags:['luck'] });
  C('cr', 'sugarglaze', 'Sugar Glaze', 'uncommon', 'Enemies you hit move erratically', ['+25% HP'], function(S){ S.hp *= 1.25; S.hex += .5; }, { tags:['gun'] });
  C('cr', 'meteor', 'Meteor', 'uncommon', 'Reloading drops a meteor on the nearest enemy', ['+0.25s Reload time'], function(S){ S.reload += .25; S.onReload.push('meteor'); }, { tags:['gun'] });

/* tigOS arcade rounds.js, part 06: cards plus. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Cards Plus (willis81808) ---------- */
  C('plus', 'hare', 'Hare', 'uncommon', '', ['+50% Movement speed', '-50% Reload time'], function(S){ S.move *= 1.5; S.reload *= mul(-50); }, { once:true, tags:['body'] });
  C('plus', 'turtle', 'Turtle', 'uncommon', '', ['-25% Movement speed', '-70% Block cooldown'], function(S){ S.move *= mul(-25); S.blockCd *= mul(-70); }, { once:true, tags:['block'] });
  C('plus', 'terminator', 'Terminator', 'rare', 'Literally Buckshot, but better', ['+6 Bullets', '+6 Ammo', '-50% DMG', '+0.25s Reload time'], function(S){ S.bullets += 6; S.ammo += 6; S.dmg *= .5; S.reload += .25; S.spread += .22; }, { tags:['gun'] });
  C('plus', 'slowpoke', 'Slow Poke', 'common', '', ['+100% Damage', '-15% Movement speed', '-30% Bullet speed'], function(S){ S.dmg *= 2; S.move *= mul(-15); S.speed *= mul(-30); }, { tags:['gun'] });
  C('plus', 'phantom', 'Phantom', 'rare', 'Blocking makes you ethereal for a second: bullets pass through you and yours pass through walls', ['+0.25s Block cooldown'], blk('phantom', 0), { tags:['block'] });
  C('plus', 'lowgravity', 'Low Gravity', 'common', '', ['-75% Gravity', '+25% Jump height'], function(S){ S.gravity *= .25; S.jump *= 1.25; }, { tags:['body'] });
  C('plus', 'quickreflexes', 'Quick Reflexes', 'rare', 'Automatically blocks incoming bullets', ['+2s Block cooldown'], function(S){ S.quickReflex = 1; S.blockCd += 2; }, { once:true, tags:['block'] });
  C('plus', 'snakeattack', 'Snake Attack', 'uncommon', 'Spawns deadly snakes where your bullets strike', ['+0.25s Reload time'], function(S){ S.snake += 1; S.reload += .25; }, { tags:['gun'] });
  C('plus', 'excalibur', 'Excalibur', 'rare', 'Blocking summons swords that hunt nearby enemies', ['+0.25s Block cooldown'], blk('swords', 0), { tags:['block'] });
  C('plus', 'hotpotato', 'Hot Potato', 'common', 'Leave a trail of burning fire in your wake', ['+20% Movement speed'], function(S){ S.hotpotato = 1; S.move *= 1.2; }, { once:true, tags:['body'] });
  C('plus', 'smokegrenade', 'Smoke Grenade', 'uncommon', 'Bullets leave blinding smoke where they land', ['+0.25s Reload time'], function(S){ S.smoke += 1; S.reload += .25; }, { tags:['gun'] });

/* tigOS arcade rounds.js, part 07: will s wacky. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Will's Wacky Cards, with its curses (willuwontu) ---------- */
  C('wacky', 'ammocache', 'Ammo Cache', 'common', '', ['+4 Ammo'], function(S){ S.ammo += 4; }, { tags:['gun'] });
  C('wacky', 'slowdeath', 'Slow Death', 'rare', 'Bullets deal their damage again over ten seconds', ['-30% DMG'], function(S){ S.dmg *= mul(-30); S.bleed += 1; }, { tags:['gun'] });
  C('wacky', 'vampirism', 'Vampirism', 'rare', '', ['+100% Life steal', '-50% HP'], function(S){ S.steal += 1; S.hp *= mul(-50); }, { tags:['body'] });
  C('wacky', 'shotgun', 'Shotgun', 'uncommon', '', ['+6 Bullets', '-65% DMG', '+0.5s Reload time'], function(S){ S.bullets += 6; S.dmg *= mul(-65); S.reload += .5; S.spread += .4; }, { tags:['gun'] });
  C('wacky', 'basicphysics', 'Basic Physics', 'common', '', ['+150% Bullet gravity', '+50% DMG'], function(S){ S.grav *= 2.5; S.dmg *= 1.5; }, { tags:['gun'] });
  C('wacky', 'altphysics', 'Alternate Universe Physics', 'common', 'Bullets fall up', ['+35% DMG'], function(S){ S.grav = -Math.abs(S.grav || 1); S.dmg *= 1.35; }, { once:true, tags:['gun'] });
  C('wacky', 'minigun', 'Minigun', 'rare', '', ['+10 Ammo', '+600% ATKSPD', '-80% DMG', '+1s Reload time'], function(S){ S.ammo += 10; S.atk /= 7; S.dmg *= mul(-80); S.reload += 1; S.spread += .12; }, { tags:['gun'] });
  C('wacky', 'wildaim', 'Wild Aim', 'common', '', ['+3 Bullets', '-40% DMG', 'Wide spread'], function(S){ S.bullets += 3; S.dmg *= mul(-40); S.spread += .45; }, { tags:['gun'] });
  C('wacky', 'leaping', 'Boots of Leaping', 'common', '', ['+50% Jump height'], function(S){ S.jump *= 1.5; }, { tags:['body'] });
  C('wacky', 'runningshoes', 'Running Shoes', 'common', '', ['+35% Movement speed'], function(S){ S.move *= 1.35; }, { tags:['body'] });
  C('wacky', 'hex', 'Hex', 'uncommon', 'Hit enemies take 25% more damage for a while', ['+0.25s Reload time'], function(S){ S.hex += 1; S.reload += .25; }, { tags:['gun'] });
  C('wacky', 'unstoppable', 'Unstoppable Force', 'common', 'Your bullets hit like trucks', ['+25% DMG', '+200% Knockback'], function(S){ S.dmg *= 1.25; S.knock *= 3; }, { tags:['gun'] });
  C('wacky', 'immovable', 'Immovable Object', 'common', 'Nothing pushes you around', ['+40% HP'], function(S){ S.hp *= 1.4; S.immovable = 1; }, { once:true, tags:['body'] });
  C('wacky', 'reroll', 'Reroll', 'uncommon', 'Throws this hand away and deals a fresh one', [], function(S, P){ P.reroll = true; }, { instant:true, tags:['luck'] });
  C('wacky', 'tableflip', 'Table Flip', 'rare', 'Every player\u2019s cards are replaced with random ones', [], function(S, P){ P.tableFlip = true; }, { once:true, instant:true, tags:['luck'] });
  C('wacky', 'adrenaline', 'Adrenaline Rush', 'uncommon', 'Below half health you move and shoot faster', ['+20% HP'], function(S){ S.hp *= 1.2; S.adrenaline = 1; }, { once:true, tags:['body'] });
  C('wacky', 'endurance', 'Endurance Training', 'uncommon', '', ['+40% HP', '-15% Movement speed'], function(S){ S.hp *= 1.4; S.move *= mul(-15); }, { tags:['body'] });
  C('wacky', 'boomerang', 'Boomerang', 'common', 'Bullets come back to you', ['+20% DMG'], function(S){ S.boomerang = 1; S.dmg *= 1.2; }, { once:true, tags:['gun'] });
  C('wacky', 'jumpboots', 'Jump Boots', 'common', 'One more jump in the air', ['+1 Jump'], function(S){ S.jumps += 1; }, { tags:['body'] });
  C('wacky', 'gatling', 'Gatling Gun', 'rare', 'Holding the trigger spins up the barrel', ['+15 Ammo', '-60% DMG', '+0.75s Reload time'], function(S){ S.ammo += 15; S.dmg *= mul(-60); S.reload += .75; S.gatling = 1; }, { once:true, tags:['gun'] });
  C('wacky', 'plasmarifle', 'Plasma Rifle', 'rare', 'Bullets pass through enemies', ['+50% DMG', '-30% ATKSPD'], function(S){ S.pierce = 1; S.dmg *= 1.5; S.atk *= 1.3; }, { tags:['gun'] });
  C('wacky', 'savage', 'Savage Wounds', 'uncommon', 'Hits bleed', ['+15% DMG'], function(S){ S.dmg *= 1.15; S.bleed += .5; }, { tags:['gun'] });
  C('wacky', 'ritual', 'Ritualistic Sacrifice', 'rare', 'Power at a price: you also take a curse', ['+200% DMG'], function(S){ S.dmg *= 3; }, { cursed:true, tags:['gun'] });
  C('wacky', 'forbidden', 'Forbidden Magics', 'rare', 'Homing, bouncing bullets, and a curse', ['+2 Bullet bounces', '+50% Bullet speed'], function(S){ S.homing += 1; S.bounces += 2; S.speed *= 1.5; }, { cursed:true, tags:['gun'] });
  C('wacky', 'cursedknowledge', 'Cursed Knowledge', 'common', 'Take a curse for a fat health bar', ['+50% HP'], function(S){ S.hp *= 1.5; }, { cursed:true, tags:['body'] });
  C('wacky', 'flagellation', 'Flagellation', 'common', 'Suffering makes you sturdier. Comes with a curse', ['+100% HP'], function(S){ S.hp *= 2; }, { cursed:true, tags:['body'] });
  C('wacky', 'holywater', 'Holy Water', 'common', 'Removes one of your curses', [], function(S, P){ P.uncurse(1); }, { instant:true, tags:['luck'] });
  C('wacky', 'cleansing', 'Cleansing Ritual', 'uncommon', 'Removes every curse you carry', ['+25% HP'], function(S, P){ S.hp *= 1.25; P.uncurse(99); }, { instant:true, tags:['luck'] });
  C('wacky', 'curseeater', 'Curse Eater', 'common', '+20% DMG for every curse you carry', [], function(S){ S.curseEater += .2; }, { tags:['gun'] });
  C('wacky', 'runicwards', 'Runic Wards', 'rare', 'Every curse you carry grants an automatic block', [], function(S){ S.autoblock += 1; }, { tags:['block'] });
  C('wacky', 'siphoncurses', 'Siphon Curses', 'common', 'Each curse you carry adds 15% HP', [], function(S){ S.siphon = 1; }, { once:true, tags:['body'] });
  /* curses: never drawn, only granted by cursed cards */
  C('wacky', 'c_bleeding', 'Bleeding Wounds', 'curse', 'You take 20% more damage', [], function(S){ S.hurtM = (S.hurtM || 1)*1.2; });
  C('wacky', 'c_counterfeit', 'Counterfeit Ammo', 'curse', '', ['-1 Ammo'], function(S){ S.ammo -= 1; });
  C('wacky', 'c_crooked', 'Crooked Legs', 'curse', '', ['-25% Movement speed'], function(S){ S.move *= mul(-25); });
  C('wacky', 'c_driven', 'Driven to Earth', 'curse', '', ['+50% Gravity', '-20% Jump height'], function(S){ S.gravity *= 1.5; S.jump *= mul(-20); });
  C('wacky', 'c_easytarget', 'Easy Target', 'curse', 'You are bigger', [], function(S){ S.body *= 1.35; });
  C('wacky', 'c_misfire', 'Misfire', 'curse', 'One shot in ten fizzles', [], function(S){ S.fizzle += .1; });
  C('wacky', 'c_needle', 'Needle Bullets', 'curse', '', ['-40% Bullet size', '-15% DMG'], function(S){ S.size *= mul(-40); S.dmg *= mul(-15); });
  C('wacky', 'c_pasta', 'Pasta Shells', 'curse', '', ['-30% Bullet speed'], function(S){ S.speed *= mul(-30); });
  C('wacky', 'c_slowreflex', 'Slow Reflexes', 'curse', '', ['+1s Block cooldown'], function(S){ S.blockCd += 1; });
  C('wacky', 'c_wildshots', 'Wild Shots', 'curse', 'Your aim wanders', [], function(S){ S.spread += .3; });
  C('wacky', 'c_fragile', 'Fragile Body', 'curse', '', ['-30% HP'], function(S){ S.hp *= mul(-30); });
  C('wacky', 'c_lead', 'Lead Bullets', 'curse', '', ['+100% Bullet gravity'], function(S){ S.grav *= 2; });
  C('wacky', 'c_heavyshields', 'Heavy Shields', 'curse', '', ['+50% Block cooldown'], function(S){ S.blockCd *= 1.5; });
  C('wacky', 'c_fumbled', 'Fumbled Mags', 'curse', '', ['+0.75s Reload time'], function(S){ S.reload += .75; });
  C('wacky', 'c_damnation', 'Damnation', 'curse', '', ['-20% HP', '-10% DMG'], function(S){ S.hp *= mul(-20); S.dmg *= mul(-10); });
  var CURSES = CARDS.filter(function(k){ return k.rarity === 'curse'; });

/* tigOS arcade rounds.js, part 08: pykess card expansion. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Pykess' Card Expansion (PCE) ---------- */
  C('pce', 'laser', 'Laser', 'rare', 'Your gun fires an instant beam', ['-50% DMG', '+1s Reload time'], function(S){ S.laser = 1; S.dmg *= .5; S.reload += 1; }, { once:true, tags:['gun'] });
  C('pce', 'pacbullets', 'Pac-Bullets', 'uncommon', 'Bullets wrap around the edges of the screen', ['+0.25s Reload time'], function(S){ S.wrap = 1; S.reload += .25; }, { once:true, tags:['gun'] });
  C('pce', 'moonshoes', 'Moon Shoes', 'common', '', ['-60% Gravity', '+60% Jump height'], function(S){ S.gravity *= .4; S.jump *= 1.6; }, { tags:['body'] });
  C('pce', 'superjump', 'Super Jump', 'uncommon', 'Huge jumps, and you block for free at the top of each one', ['+100% Jump height'], function(S){ S.jump *= 2; S.apexBlock = 1; }, { once:true, tags:['body'] });
  C('pce', 'fireworks', 'Fireworks', 'uncommon', 'Bullets burst into sparks after a moment', ['-20% DMG', '+0.25s Reload time'], function(S){ S.fireworks += 1; S.dmg *= mul(-20); S.reload += .25; }, { tags:['gun'] });
  C('pce', 'fragmentation', 'Fragmentation', 'uncommon', 'Bullets split into three on impact', ['-25% DMG', '+0.25s Reload time'], function(S){ S.frag += 1; S.dmg *= mul(-25); S.reload += .25; }, { tags:['gun'] });
  C('pce', 'shuffle', 'Shuffle', 'rare', 'Replaces every card you own with a random one of the same rarity', [], function(S, P){ P.shuffle = true; }, { instant:true, tags:['luck'] });
  C('pce', 'jackpot', 'Jackpot', 'legendary', 'Gives you two random rare cards', [], function(S, P){ P.give(randomCard(P, ['rare']), true); P.give(randomCard(P, ['rare']), true); }, { instant:true, tags:['luck'] });
  C('pce', 'gamble', 'Gamble', 'uncommon', 'Gives you a random card', [], function(S, P){ P.give(randomCard(P, ['common', 'uncommon', 'rare']), true); }, { instant:true, tags:['luck'] });
  C('pce', 'piercing', 'Piercing Bullets', 'uncommon', 'Bullets pass through enemies', ['-25% DMG'], function(S){ S.pierce = 1; S.dmg *= mul(-25); }, { tags:['gun'] });
  C('pce', 'punching', 'Punching Bullets', 'common', 'Bullets send enemies flying', ['-30% DMG', '+300% Knockback'], function(S){ S.dmg *= mul(-30); S.knock *= 4; }, { tags:['gun'] });
  C('pce', 'ghostbullets', 'Ghost Bullets', 'rare', 'Bullets pass through walls', ['-30% DMG', '+0.25s Reload time'], function(S){ S.ghost = 1; S.dmg *= mul(-30); S.reload += .25; }, { once:true, tags:['gun'] });
  C('pce', 'straightshot', 'Straight Shot', 'common', 'Bullets fly dead straight', ['+30% Bullet speed', '-1 Ammo'], function(S){ S.grav = 0; S.speed *= 1.3; S.ammo -= 1; }, { tags:['gun'] });
  C('pce', 'flip', 'Flip', 'uncommon', 'Blocking flips gravity for nearby enemies', ['+0.25s Block cooldown'], blk('flip', 0), { tags:['block'] });
  C('pce', 'grounded', 'Grounded', 'common', 'Blocking roots nearby enemies to the floor', ['+0.25s Block cooldown'], blk('grounded', 0), { tags:['block'] });
  C('pce', 'discombobulate', 'Discombobulate', 'uncommon', 'Blocking scrambles nearby enemies\u2019 aim', ['+0.25s Block cooldown'], blk('discombobulate', 0), { tags:['block'] });
  C('pce', 'mulligan', 'Mulligan', 'common', 'Redraw this hand once more', [], function(S, P){ P.reroll = true; }, { instant:true, tags:['luck'] });
  C('pce', 'masochist', 'Masochist', 'uncommon', 'Every hit you take adds 10% DMG for the point', ['+20% HP'], function(S){ S.hp *= 1.2; S.masochist += .1; }, { tags:['body'] });
  C('pce', 'retreat', 'Retreat', 'common', 'Below half health you move 50% faster', [], function(S){ S.retreat = 1; }, { once:true, tags:['body'] });
  C('pce', 'laststand', 'Last Stand', 'uncommon', 'Below half health you deal 50% more damage', [], function(S){ S.laststand = 1; }, { once:true, tags:['gun'] });

/* tigOS arcade rounds.js, part 09: keys cards. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- Keys' Cards ---------- */
  C('keys', 'compass', 'Compass', 'common', 'Bullets drift toward your target', ['+10% DMG'], function(S){ S.homing += .35; S.dmg *= 1.1; }, { tags:['gun'] });
  C('keys', 'lootbox', 'Loot Box', 'common', 'A random stat gets a boost every round', [], function(S){ S.lootbox += 1; }, { tags:['luck'] });
  C('keys', 'nimble', 'Nimble', 'common', '', ['+20% Movement speed', '+20% Jump height'], function(S){ S.move *= 1.2; S.jump *= 1.2; }, { tags:['body'] });
  C('keys', 'precision', 'Precision', 'common', 'Tighter aim', ['+30% DMG', 'No spread'], function(S){ S.dmg *= 1.3; S.spread = 0; S.precise = 1; }, { tags:['gun'] });
/* tigOS arcade rounds.js, part 10: tigos cuts. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---- tigOS Cuts: house cards, on by default. Twelve are about the block, because the block is where the chaos lives ---- */
  C('tig', 'parry', 'Parry', 'uncommon', 'Blocking flings every nearby enemy bullet back where it came from, harder', ['+0.25s Block cooldown'], blk('parry', 0), { tags:['block'] });
  C('tig', 'thunderclap', 'Thunderclap', 'rare', 'Blocking calls lightning down on every enemy you can see', ['+0.5s Block cooldown'], blk('thunder', 0, .5), { tags:['block'] });
  C('tig', 'blastoff', 'Blast Off', 'uncommon', 'Blocking launches you skyward and leaves a bomb where you stood', ['+25% HP', '+0.25s Block cooldown'], blk('blastoff', 25), { tags:['block'] });
  C('tig', 'cluster', 'Cluster', 'uncommon', 'Blocking lobs three grenades toward your aim', ['+0.25s Block cooldown'], blk('cluster', 0), { tags:['block'] });
  C('tig', 'frenzy', 'Frenzy', 'uncommon', 'Blocking doubles your attack speed for 2.5 seconds', ['+0.25s Block cooldown'], blk('frenzy', 0), { tags:['block'] });
  C('tig', 'blackhole', 'Black Hole', 'rare', 'Blocking opens a black hole that swallows enemy bullets and drags enemies toward it', ['+0.5s Block cooldown'], blk('blackhole', 0, .5), { tags:['block'] });
  C('tig', 'meteorshower', 'Meteor Shower', 'rare', 'Blocking rains five exploding meteors on the nearest enemy', ['+0.5s Block cooldown'], blk('meteorshower', 0, .5), { tags:['block'] });
  C('tig', 'secondwind', 'Second Wind', 'common', 'Blocking heals a fifth of your missing health and shakes off slows, poison and fire', ['+0.25s Block cooldown'], blk('secondwind', 0), { tags:['block'] });
  C('tig', 'quake', 'Quake', 'uncommon', 'Blocking shakes the ground: every enemy standing on it is thrown up and stunned', ['+25% HP', '+0.25s Block cooldown'], blk('quake', 25), { tags:['block'] });
  C('tig', 'retaliate', 'Retaliate', 'uncommon', 'For two seconds after a block, every hit you take fires a bullet straight back at the shooter', ['+0.25s Block cooldown'], blk('retaliate', 0), { tags:['block'] });
  C('tig', 'perfectblock', 'Perfect Block', 'rare', 'Block just as a bullet arrives: the cooldown is refunded and every block effect fires twice', [], function(S){ S.perfect = 1; }, { once:true, tags:['block'] });
  C('tig', 'lightwall', 'Wall of Light', 'uncommon', 'Blocking raises a wall in front of you that stops enemy bullets for two seconds', ['+0.25s Block cooldown'], blk('lightwall', 0), { tags:['block'] });
  C('tig', 'sniper', 'Sniper', 'rare', 'One shot, one hole', ['+200% Bullet speed', '+120% DMG', '-1 Ammo', '+1s Reload time', 'No spread'], function(S){ S.speed *= 3; S.dmg *= 2.2; S.ammo -= 1; S.reload += 1; S.spread = 0; S.precise = 1; }, { tags:['gun'] });
  C('tig', 'bullethell', 'Bullet Hell', 'uncommon', 'Fill the screen', ['+8 Bullets', '+6 Ammo', '-80% DMG', 'Wide spread', '+0.5s Reload time'], function(S){ S.bullets += 8; S.ammo += 6; S.dmg *= mul(-80); S.spread += .5; S.reload += .5; }, { tags:['gun'] });
  C('tig', 'kamikaze', 'Kamikaze', 'rare', 'Dying blows you up: 60 damage to every enemy nearby', ['+20% HP'], function(S){ S.hp *= 1.2; S.kamikaze = 1; }, { once:true, tags:['body'] });
  C('tig', 'balloon', 'Balloon', 'common', 'Light on your feet', ['-50% Gravity', '+15% Movement speed'], function(S){ S.gravity *= .5; S.move *= 1.15; }, { tags:['body'] });
  C('tig', 'bloodlust', 'Bloodlust', 'uncommon', 'Every hit feeds you', ['+20% Life steal', '+20% Movement speed', '+10% DMG'], function(S){ S.steal += .2; S.move *= 1.2; S.dmg *= 1.1; }, { tags:['body'] });
  C('tig', 'trickshot', 'Trick Shot', 'uncommon', 'Bullets that bounce hit harder and hunt', ['+2 Bullet bounces', '+40% DMG after a bounce', 'Bullets home after bouncing'], function(S){ S.bounces += 2; S.trickster += 1; S.targetBounce = 1; }, { tags:['gun'] });
  C('keys', 'guardian', 'Guardian Angel', 'uncommon', 'Once a round, dropping below 20% HP heals you by 30%', [], function(S){ S.guardian += 1; }, { tags:['body'] });
  C('keys', 'mirror', 'Mirror', 'uncommon', 'Blocked bullets fly back at whoever shot them', ['+0.25s Block cooldown'], function(S){ S.blockCd += .25; S.mirror = 1; }, { once:true, tags:['block'] });
  C('keys', 'overdrive', 'Overdrive', 'uncommon', '', ['+100% ATKSPD', '+25% DMG', '-1 Ammo'], function(S){ S.atk /= 2; S.dmg *= 1.25; S.ammo -= 1; }, { tags:['gun'] });
  C('keys', 'sawshot', 'Saw Shot', 'uncommon', 'Bullets are spinning saws that pierce and bounce', ['-50% Bullet speed', '+2 Bullet bounces'], function(S){ S.saw = 1; S.pierce = 1; S.speed *= mul(-50); S.bounces += 2; }, { once:true, tags:['gun'] });
  C('keys', 'sentry', 'Sentry', 'rare', 'Blocking drops a turret that shoots for a few seconds', ['+0.5s Block cooldown'], blk('sentry', 0, .5), { tags:['block'] });
  C('keys', 'snipersnest', 'Snipers Nest', 'rare', 'Standing still for a second doubles your damage and bullet speed', [], function(S){ S.nest = 1; }, { once:true, tags:['gun'] });
  C('keys', 'raidboss', 'Raid Boss', 'rare', '', ['+300% HP', '-30% Movement speed', 'Bigger body'], function(S){ S.hp *= 4; S.move *= mul(-30); S.body *= 1.45; }, { once:true, tags:['body'] });
  C('keys', 'pipsqueak', 'Pipsqueak', 'rare', '', ['-50% Body size', '-30% HP', '+30% Movement speed'], function(S){ S.body *= .5; S.hp *= mul(-30); S.move *= 1.3; }, { once:true, tags:['body'] });
  C('keys', 'vampiricblock', 'Vampiric Block', 'rare', 'Blocking drains 10% HP from enemies nearby', ['+0.25s Block cooldown'], blk('vampiric', 0), { tags:['block'] });
  C('keys', 'boxingglove', 'Boxing Glove', 'common', '', ['+300% Knockback', '-20% DMG'], function(S){ S.knock *= 4; S.dmg *= mul(-20); }, { tags:['gun'] });
  C('keys', 'treasuremap', 'Treasure Map', 'common', 'You pick an extra card the next time you pick', [], function(S, P){ P.bonusPick += 1; }, { instant:true, tags:['luck'] });
  C('keys', 'pockets', 'Bottomless Pockets', 'common', '', ['+3 Ammo', '+0.25s Reload time'], function(S){ S.ammo += 3; S.reload += .25; }, { tags:['gun'] });
  C('keys', 'mending', 'Mending Reload', 'common', 'Reloading heals you a little', ['+0.25s Reload time'], function(S){ S.mending += 15; S.reload += .25; }, { tags:['body'] });
  C('keys', 'ferocity', 'Ferocity', 'uncommon', '+15% DMG for every point you have won', [], function(S){ S.ferocity += .15; }, { tags:['gun'] });
  C('keys', 'scaredycat', 'Scaredy Cat', 'uncommon', 'Below 30% HP you move 50% faster and reload twice as fast', [], function(S){ S.scaredy = 1; }, { once:true, tags:['body'] });
  C('keys', 'warpath', 'Warpath', 'uncommon', '+10% DMG for every round you have won', ['+10% HP'], function(S){ S.hp *= 1.1; S.warpath += .1; }, { tags:['gun'] });

/* tigOS arcade rounds.js, part 11: maps. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- maps: floating slabs over the void, ROUNDS style. rects are [x, y, w, h]; spawns sit on top of a slab ---------- */
  var MAPS = [], LAST_OPTS = null, LAST_LOOK = null;   /* the setup screen remembers the last match a person started (foes, packs) and the locker room their last look, across restarts and reopening */
  /* Maps are authored at 1280x720. Besides solid slabs a map can carry: movers (slabs riding a rail), swings (gondolas hanging from an anchor), ropes (grab with E, climb with W/S, pump with A/D, jump off),
     crates (hang from a rope; shoot the rope and the crate drops, hurting whoever is under it and settling where it lands) and saws (spinning blades, some on rails). */
  function M(name, o){ var m = { name:name, rects:o.rects, spawns:o.spawns, movers:o.movers || [], swings:o.swings || [], ropes:o.ropes || [], crates:o.crates || [], saws:o.saws || [], pads:o.pads || [], belts:o.belts || [], lava:o.lava || [], blurb:o.blurb || '' }; MAPS.push(m); return m; }
  /* pads are [x, y, w, h, k]: landing on one throws you up k times a jump. belts are [x, y, w, h, v]: standing on one carries you v px/s. lava is [x, y, w, h]: touching it burns 18 and pops you back out. */
  M('Flats',      { rects:[[80, 600, 420, 60], [780, 600, 420, 60], [540, 520, 200, 30]], spawns:[[200, 600], [1080, 600], [640, 520], [380, 600]] });
  M('Gondolas',   { rects:[[40, 520, 240, 40], [1000, 520, 240, 40], [560, 150, 160, 24]], spawns:[[160, 520], [1120, 520], [640, 150], [60, 520]],
                    swings:[{ ax:440, ay:120, len:330, w:150, h:22, amp:.55, speed:1.1, phase:0 }, { ax:840, ay:120, len:330, w:150, h:22, amp:.55, speed:1.1, phase:Math.PI }] });
  M('Elevators',  { rects:[[560, 260, 160, 460], [60, 620, 380, 40], [840, 620, 380, 40]], spawns:[[250, 620], [1030, 620], [640, 260], [380, 620]],
                    movers:[{ w:120, h:20, path:[[440, 560], [440, 200]], speed:120 }, { w:120, h:20, path:[[720, 200], [720, 560]], speed:120 }] });
  M('Sawmill',    { rects:[[100, 600, 1080, 50], [500, 440, 280, 26]], spawns:[[160, 600], [1120, 600], [560, 440], [720, 440]],
                    saws:[{ r:34, path:[[310, 600], [540, 600]], speed:150 }, { r:34, path:[[740, 600], [970, 600]], speed:190 }] });
  M('Jungle',     { rects:[[0, 600, 300, 120], [980, 600, 300, 120], [540, 620, 200, 100], [0, 120, 1280, 30]], spawns:[[150, 600], [1130, 600], [640, 620], [250, 600]],
                    ropes:[{ x:420, y:150, len:330 }, { x:860, y:150, len:330 }] });
  M('Warehouse',  { rects:[[0, 640, 1280, 80], [0, 80, 1280, 26], [560, 420, 160, 24]], spawns:[[120, 640], [1160, 640], [640, 420], [400, 640]],
                    crates:[{ x:280, y:300, w:90, h:70, ropeLen:194 }, { x:1000, y:300, w:90, h:70, ropeLen:194 }, { x:640, y:220, w:110, h:60, ropeLen:114 }] });
  M('Cross',      { rects:[[560, 240, 160, 360], [380, 420, 520, 40], [40, 600, 300, 40], [940, 600, 300, 40], [40, 260, 180, 26], [1060, 260, 180, 26]], spawns:[[180, 600], [1100, 600], [130, 260], [1150, 260]] });
  M('Islands',    { rects:[[60, 620, 280, 40], [940, 620, 280, 40], [230, 440, 200, 26], [850, 440, 200, 26], [540, 280, 200, 26]], spawns:[[200, 620], [1080, 620], [640, 280], [330, 440]] });
  M('Pendulum',   { rects:[[0, 400, 180, 320], [1100, 400, 180, 320], [600, 100, 80, 20]], spawns:[[90, 400], [1190, 400], [640, 100], [140, 400]],
                    swings:[{ ax:640, ay:100, len:380, w:260, h:26, amp:.75, speed:.85, phase:0 }] });
  M('Pillars',    { rects:[[0, 660, 1280, 60], [240, 300, 60, 360], [620, 240, 60, 420], [980, 300, 60, 360], [120, 200, 120, 20], [1040, 200, 120, 20]], spawns:[[100, 660], [1180, 660], [440, 660], [800, 660]] });
  M('Steps',      { rects:[[0, 320, 200, 400], [200, 420, 160, 300], [360, 520, 160, 200], [760, 520, 160, 200], [920, 420, 160, 300], [1080, 320, 200, 400], [520, 640, 240, 80]], spawns:[[100, 320], [1180, 320], [280, 420], [1000, 420]],
                    saws:[{ x:640, y:640, r:40 }] });
  M('Skyline',    { rects:[[80, 620, 220, 30], [980, 620, 220, 30], [300, 470, 160, 24], [820, 470, 160, 24], [540, 320, 200, 24], [60, 340, 140, 24], [1080, 340, 140, 24]], spawns:[[190, 620], [1090, 620], [640, 320], [380, 470]],
                    movers:[{ w:120, h:18, path:[[420, 560], [740, 560]], speed:110 }] });
  M('Trench',     { rects:[[0, 480, 420, 240], [860, 480, 420, 240], [420, 660, 440, 60], [560, 560, 160, 20]], spawns:[[210, 480], [1070, 480], [640, 660], [640, 560]] });
  M('Ledges',     { rects:[[0, 600, 340, 120], [940, 600, 340, 120], [0, 440, 180, 24], [1100, 440, 180, 24], [0, 280, 180, 24], [1100, 280, 180, 24], [540, 500, 200, 26]], spawns:[[170, 600], [1110, 600], [640, 500], [90, 440]],
                    movers:[{ w:80, h:16, path:[[300, 300], [900, 300]], speed:140 }] });
  M('Bowl',       { rects:[[0, 560, 260, 160], [260, 640, 760, 80], [1020, 560, 260, 160], [540, 400, 200, 24], [600, 40, 80, 20]], spawns:[[130, 560], [1150, 560], [640, 400], [400, 640]],
                    ropes:[{ x:640, y:60, len:300 }] });
  M('Arena',      { rects:[[100, 620, 1080, 50], [420, 470, 120, 22], [740, 470, 120, 22], [580, 330, 120, 22]], spawns:[[220, 620], [1060, 620], [640, 330], [480, 470]] });
  M('Towers',     { rects:[[60, 240, 200, 480], [1020, 240, 200, 480], [540, 640, 200, 80]], spawns:[[160, 240], [1120, 240], [640, 640], [60, 240]],
                    swings:[{ ax:640, ay:200, len:280, w:180, h:22, amp:.9, speed:.95, phase:0 }] });
  M('Bridge',     { rects:[[0, 560, 240, 160], [1040, 560, 240, 160], [240, 440, 800, 30], [560, 60, 160, 20]], spawns:[[120, 560], [1160, 560], [640, 440], [400, 440]],
                    crates:[{ x:640, y:300, w:100, h:70, ropeLen:220 }] });
  M('Trampoline', { rects:[[0, 640, 380, 80], [900, 640, 380, 80], [540, 300, 200, 24]], spawns:[[190, 640], [1090, 640], [640, 300], [300, 640]],
                    pads:[[420, 660, 120, 20, 1.35], [740, 660, 120, 20, 1.35]] });
  M('Conveyor',   { rects:[[0, 600, 200, 120], [1080, 600, 200, 120], [440, 440, 400, 24]], spawns:[[100, 600], [1180, 600], [640, 440], [300, 620]],
                    belts:[[200, 620, 440, 30, 90], [640, 620, 440, 30, -90]], saws:[{ x:640, y:620, r:36 }] });
  M('Lava Pit',   { rects:[[0, 600, 400, 120], [880, 600, 400, 120], [520, 500, 240, 24], [300, 380, 140, 22], [840, 380, 140, 22]], spawns:[[200, 600], [1080, 600], [640, 500], [370, 380]],
                    lava:[[400, 690, 480, 30]], ropes:[{ x:640, y:120, len:300 }] });
  M('Carousel',   { rects:[[560, 560, 160, 160], [0, 660, 1280, 60]], spawns:[[100, 660], [1180, 660], [640, 560], [400, 660]],
                    movers:[{ w:110, h:18, path:[[100, 420], [480, 420]], speed:130 }, { w:110, h:18, path:[[1180, 300], [800, 300]], speed:130 }] });
  M('Rooftops',   { rects:[[0, 520, 240, 200], [320, 600, 200, 120], [600, 460, 180, 260], [860, 600, 200, 120], [1040, 520, 240, 200], [560, 200, 160, 20]], spawns:[[120, 520], [1160, 520], [640, 460], [420, 600]],
                    crates:[{ x:690, y:330, w:90, h:60, ropeLen:110 }] });
  M('Springs',    { rects:[[0, 660, 1280, 60], [300, 380, 120, 24], [860, 380, 120, 24], [560, 220, 160, 22]], spawns:[[80, 660], [1200, 660], [640, 220], [360, 380]],
                    pads:[[200, 640, 100, 20, 1.3], [980, 640, 100, 20, 1.3], [590, 640, 100, 20, 1.45]] });
  M('Chasm',      { rects:[[0, 360, 360, 360], [920, 360, 360, 360], [520, 560, 240, 22]], spawns:[[180, 360], [1100, 360], [640, 560], [60, 360]],
                    lava:[[360, 690, 560, 30]], swings:[{ ax:640, ay:120, len:300, w:160, h:22, amp:.8, speed:1, phase:0 }] });
  M('Factory',    { rects:[[0, 600, 1280, 120], [520, 280, 240, 22]], spawns:[[120, 600], [1160, 600], [640, 280], [360, 420]],
                    belts:[[240, 420, 240, 22, 120], [800, 420, 240, 22, -120]], saws:[{ r:32, path:[[300, 600], [980, 600]], speed:170 }] });
  M('Well',       { rects:[[0, 300, 480, 420], [800, 300, 480, 420], [600, 520, 80, 16]], spawns:[[240, 300], [1040, 300], [640, 520], [60, 300]],
                    pads:[[540, 690, 200, 30, 1.5]] });
  M('Airship',    { rects:[[340, 500, 600, 60], [540, 300, 200, 22]], spawns:[[440, 500], [840, 500], [640, 300], [640, 500]],
                    movers:[{ w:120, h:18, path:[[80, 600], [300, 400]], speed:120 }, { w:120, h:18, path:[[1200, 600], [980, 400]], speed:120 }] });
  M('Sawtooth',   { rects:[[0, 640, 1280, 80], [200, 440, 160, 22], [920, 440, 160, 22], [540, 340, 200, 22]], spawns:[[280, 440], [1000, 440], [640, 340], [60, 640]],
                    saws:[{ r:30, path:[[120, 640], [1160, 640]], speed:260 }], pads:[[600, 620, 80, 20, 1.3]] });
  M('Depot',      { rects:[[0, 660, 1280, 60], [0, 120, 1280, 24], [300, 440, 200, 22], [780, 440, 200, 22]], spawns:[[120, 660], [1160, 660], [400, 440], [880, 440]],
                    crates:[{ x:400, y:300, w:90, h:70, ropeLen:144 }, { x:880, y:300, w:90, h:70, ropeLen:144 }, { x:640, y:520, w:100, h:70, ropeLen:376 }], belts:[[500, 640, 280, 20, -140]] });

/* tigOS arcade rounds.js, part 12: the game. The parts in this folder are concatenated in name order by build.py, so they share one scope. */
  /* ---------- the game ---------- */
  function rounds(api){
    var fightT = 0, noDmgT = 0, sudden = false;   /* stalemate breaker: a long point with nobody landing a hit drains everyone */
    var g = {}, retalQ = [], scorePipX = 0, pickClock = 0, PICK_LIMIT = 45, dyn, live, dynT = 0, jumpTap = false, grabTap = false, matchSel = 0, extensions = 0, cpuChoice = null, cpuBrowseT = 0, corpses = [], players, bullets, zones, bombs, ents, parts, nums, beams, map, phase, t, opts, hand, handSel, picker, pickQueue, pickNote, pickNoteT, countdown, endT, banner, bannerT, shake, slow, mouse, mouseDown, rightDown, held, matchWinner, score, over, mapIdx, setupSel, autoAim, flash, cpuPickT, ptsAwarded, log, helpT, lastSpeaker;
    var PALETTE = [['#ffb347', 'orange'], ['#5ab4ff', 'blue'], ['#ff6b6b', 'red'], ['#7ee081', 'green'], ['#c084fc', 'purple'], ['#ffd166', 'yellow'], ['#4fd1c5', 'teal'], ['#ff8ad8', 'pink'], ['#f4f1ea', 'cream']], COLS = PALETTE.map(function(q){ return q[0]; }), NAMES = ['you', 'cpu 1', 'cpu 2', 'cpu 3'], TAGS = ['bsdzombiekiller', 'devino001gaming', 'Tig', 'CHEEZEETIGER', 'xX_noodle_Xx', 'gravyboat', 'pickle.exe', 'SirBlocksALot', 'lag_switch', 'mildly_ok', 'BigTuna', 'toasterbath', 'ricochet_reggie', 'NoScopeNancy', 'CtrlAltDefeat', 'bloopy', 'GlassCannonGary', 'wallclimb_wendy', 'sn1pes', 'zoomzoom', 'DadJokes', 'ur_mom_64', 'kevin', 'the_floor_is_lava', 'BUCKSHOT_BETTY', 'hexed', 'afk_andy', 'ThunderChonk', 'TANZgeeeeeeeeeee']   /* cpus draw a fresh gamer tag every match; p.name stays the stable id the tests and log use */;
    var SKILL = [{ name:'Easy', err:.40, blockP:.12, react:.8, think:1.25, fireK:1.9, minGap:.45, lead:.35, dodge:.15, aimSpd:4.2, iq:.15, pickT:[1.4, 3] },
      { name:'Normal', err:.17, blockP:.42, react:.42, think:.7, fireK:1.3, minGap:.2, lead:.7, dodge:.35, aimSpd:5.5, iq:.45, pickT:[1.2, 3] },
      { name:'Hard', err:.07, blockP:.75, react:.22, think:.4, fireK:1, minGap:0, lead:.9, dodge:.55, aimSpd:7, iq:.75, pickT:[1, 2.8] },
      { name:'Legendary', err:.025, blockP:.96, react:.12, think:.22, fireK:.85, minGap:0, lead:1, dodge:.75, aimSpd:8.5, iq:1, pickT:[1, 2.5] }];   /* Easy really is easy now: wide aim error, slow to swing the gun, shoots half as often, barely blocks or dodges, and picks cards mostly on gut */
    var GRAV = 2100, MOVE = 288, JUMPV = 940, BSPEED = 820, BGRAV = 820, PR = 11, SIZE_K = .18;   /* jump apex 210px, air .9s, reach ~290px: every authored step (Islands 180, Cross bar 180, Bridge 120) is a plain jump; players are small on a 1280x720 arena */
    var SETUP = [
      { id:'foes', name:'Opponents', vals:[1, 2, 3], show:function(v){ return v+' cpu'+(v > 1 ? 's' : ''); } },
      { id:'skill', name:'CPU skill', vals:[0, 1, 2, 3], show:function(v){ return SKILL[v].name; } },
      { id:'rounds', name:'Rounds to win', vals:[1, 2, 3, 4, 5, 6, 7, 8, 9], show:function(v){ return String(v); }, mod:'SetRounds' },
      { id:'points', name:'Points per round', vals:[1, 2, 3], show:function(v){ return String(v); }, mod:'SetRounds' },
      { id:'picks', name:'Cards picked', vals:[1, 2, 3, 4, 5, 6], show:function(v){ return v+' per pick'; }, mod:'Pick N Cards' },
      { id:'draw', name:'Cards drawn', vals:[3, 4, 5, 6, 7], show:function(v){ return String(v); }, mod:'Draw N Cards' },
      { id:'cr', name:'Cosmic Rounds cards', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'CR by XAngelMoonX' },
      { id:'plus', name:'Cards Plus', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'willis81808' },
      { id:'wacky', name:'Wacky Cards and Curses', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'willuwontu' },
      { id:'pce', name:'Pykess\u2019 Card Expansion', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'PCE' },
      { id:'keys', name:'Keys\u2019 Cards', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'Keys' },
      { id:'tig', name:'tigOS Cuts', vals:[true, false], show:function(v){ return v ? 'on' : 'off'; }, mod:'house cards: 12 block, 6 chaos' },
      { id:'info', name:'Infoholic stats HUD', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; }, mod:'Penial' },
      { id:'nums', name:'Damage indicators', vals:[true, false], show:function(v){ return v ? 'on' : 'off'; }, mod:'willis81808' },
      { id:'cursor', name:'Target cursor', vals:[false, true], show:function(v){ return v ? 'on' : 'off'; } },
      { id:'go', name:'Start the match', vals:[0], show:function(){ return '\u25B6'; } } ];
    var defaults = function(){ var d = { foes:1, skill:1, rounds:5, points:2, picks:1, draw:5, cr:false, plus:false, wacky:false, pce:false, keys:false, tig:true, info:false, nums:true, cursor:false }; if(LAST_OPTS) Object.keys(LAST_OPTS).forEach(function(k){ if(k in d) d[k] = LAST_OPTS[k]; }); return d; };
    var remember = function(){ LAST_OPTS = JSON.parse(JSON.stringify(opts)); };
    function say(s, d){ banner = s; bannerT = d || 1.4; }
    function hitP(q, x, y, extra){ return Math.hypot(x - q.x, (y - q.y + q.r*.35)/1.35) < q.r + (extra || 0); }   /* the fighter is taller than wide: an upright ellipse covering body and head */
    function inMap(x, y){ return x > -60 && x < W + 60 && y < H + 70 && y > -400; }
    function rectHit(x, y, r){ for(var i = 0; i < live.length; i++){ var q = live[i]; if(x + r > q[0] && x - r < q[0] + q[2] && y + r > q[1] && y - r < q[1] + q[3]) return q; } return null; }
    function los(x0, y0, x1, y1){ var n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8) || 1; for(var i = 1; i < n; i++){ var k = i/n; if(rectHit(x0 + (x1 - x0)*k, y0 + (y1 - y0)*k, 1)) return false; } return true; }
    function enemies(p){ return players.filter(function(q){ return q !== p && q.alive; }); }
    function nearest(p, needLos){ var best = null, bd = 1e9; enemies(p).forEach(function(q){ var d = Math.hypot(q.x - p.x, q.y - p.y); if(d < bd && (!needLos || los(p.x, p.y, q.x, q.y))){ bd = d; best = q; } }); return best; }
    function blood(q, b, big){ var dx = b ? b.vx : 0, dy = b ? b.vy : 0, L = Math.hypot(dx, dy), aimed = L > 1, ux = aimed ? dx/L : 0, uy = aimed ? dy/L : 0, dir = aimed ? Math.atan2(uy, ux) : 0, n = big ? 34 + Math.round(q.r) : 9 + Math.min(5, Math.round(q.r/4));
      for(var i = 0; i < n; i++){ var a = aimed ? dir + (big ? rnd(-1.3, 1.3) : rnd(-.55, .55)) : rnd(0, 7), v = big ? rnd(90, 430) : rnd(80, 300); if(!aimed) v *= .65;
        parts.push({ x:q.x + rnd(-q.r*.35, q.r*.35), y:q.y - q.r*.3 + rnd(-q.r*.4, q.r*.4), vx:Math.cos(a)*v + ux*90, vy:Math.sin(a)*v + uy*90 - (big ? 130 : 50), t:0, life:big ? rnd(.6, 1.2) : rnd(.3, .6), col:pick(['#b3121b', '#8a0f16', '#d61f2b', '#e8303c']), r:big ? rnd(2, 5.2) : rnd(1.6, 3.4), blood:true, g:big ? 900 : 700 }); } }   /* the spray continues the shot: hit from the right, it flies out to the left; a kill empties the whole fighter in a wide, heavy burst */
    function burst(x, y, n, col, sp, life){ for(var i = 0; i < n; i++){ var a = rnd(0, 7), v = rnd(.3, 1)*(sp || 260); parts.push({ x:x, y:y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 60, t:0, life:(life || .5)*rnd(.6, 1.2), col:col || '#fff', r:rnd(2, 4) }); } }
    function num(x, y, v, col){ if(opts.nums) nums.push({ x:x + rnd(-8, 8), y:y - 24, v:v, t:0, col:col || '#fff' }); }

    /* ---- players and stats ---- */
    /* ---- the locker room: everyone dresses before the first card. Colour is exclusive, nothing here touches the fight ---- */
    var locker = null, LOCK = [{ id:'color', name:'Colour' }, { id:'hat', name:'Hat', vals:HATS }, { id:'face', name:'Face', vals:FACES }, { id:'extra', name:'Extra', vals:EXTRAS }, { id:'ready', name:'Ready' }];
    function lookOf(p){ return { hat:HATS[p.look.hat], face:FACES[p.look.face], extra:EXTRAS[p.look.extra] }; }
    function colorTaken(ci, p){ return players.some(function(q){ return q !== p && q.look.color === ci; }); }
    function applyLook(p){ p.col = COLS[p.look.color]; }
    function cycleLook(p, id, dir){ if(id === 'color'){ var c0 = p.look.color; for(var k = 0; k < COLS.length; k++){ c0 = (c0 + dir + COLS.length) % COLS.length; if(!colorTaken(c0, p)) break; } p.look.color = c0; applyLook(p); } else { var vals = LOCK.filter(function(r){ return r.id === id; })[0].vals; p.look[id] = (p.look[id] + dir + vals.length) % vals.length; } }
    function setLook(p, look){ var ok = true; Object.keys(look || {}).forEach(function(k){ if(k === 'color'){ if(colorTaken(look.color, p)){ ok = false; return; } p.look.color = clamp(look.color|0, 0, COLS.length - 1); } else if(k in p.look){ var vals = LOCK.filter(function(r){ return r.id === k; })[0].vals; p.look[k] = clamp(look[k]|0, 0, vals.length - 1); } }); applyLook(p); return ok; }
    function makePlayers(){ players = [mkPlayer(0, false)]; var pool = TAGS.slice(); for(var i = 1; i <= opts.foes; i++){ var q = mkPlayer(i, true); q.tag = pool.splice(ri(0, pool.length - 1), 1)[0]; players.push(q); }
      var me = players[0]; if(LAST_LOOK) setLook(me, LAST_LOOK); else applyLook(me);
      players.slice(1).forEach(function(p){ var c0 = 0; while(colorTaken(c0, p)) c0++; p.look.color = c0; applyLook(p); }); players.forEach(function(p){ recalc(p); p.hp = p.maxhp; }); }
    function startLocker(){ makePlayers(); locker = { t:30, sel:0, ready:players.map(function(){ return false; }), plan:players.map(function(p){ if(!p.cpu) return []; return [{ at:rnd(.6, 4), k:'color' }, { at:rnd(1.5, 8), k:'hat' }, { at:rnd(2, 9), k:'face' }, { at:rnd(2, 9), k:'extra' }, { at:rnd(8, 20), k:'ready' }]; }) }; phase = 'locker'; api.status('locker room  \u00b7  dress your fighter, colours are first come first served  \u00b7  enter when ready'); }
    function stepLocker(dt){ locker.t -= dt; players.forEach(function(p, i){ if(!p.cpu) return; locker.plan[i].forEach(function(st){ if(st.done || locker.t > 30 - st.at) return; st.done = true; if(st.k === 'ready') locker.ready[i] = true; else if(st.k === 'color'){ if(Math.random() < .7) cycleLook(p, 'color', ri(1, COLS.length - 1)); } else if(Math.random() < .8) cycleLook(p, st.k, ri(1, LOCK.filter(function(r){ return r.id === st.k; })[0].vals.length - 1)); }); });
      if(locker.t <= 0 || locker.ready.every(function(r){ return r; })) finishLocker(); }
    function finishLocker(){ LAST_LOOK = JSON.parse(JSON.stringify(players[0].look)); locker = null; startFirst(); }
    function startFirst(){ score = 0; api.score(0); pickQueue = []; startPoint(); }   /* the first round is fought with bare hands: cards come after it, to whoever lost */
    function lockerRows(){ var top = H*.70; return LOCK.map(function(r, i){ return { r:r, y:top + i*26 }; }); }
    function mkPlayer(i, cpu){ return { i:i, name:NAMES[i], tag:cpu ? 'cpu' : 'you', col:COLS[0], cpu:cpu, face:i === 0 ? 1 : -1, walkT:0, squashT:0, wasGround:false, cards:[], points:0, rounds:0, alive:true, extraPicks:0, bonusPick:0, brain:{ t:0, dir:0, jumpT:0, range:rnd(260, 420), strafeT:0, fireT:0, campT:0, push:0 }, unicornCol:null, phoenixUsed:false, hp:100, maxhp:100, x:0, y:0, vx:0, vy:0, aim:0, ammo:3, S:baseStats(), lootbox:[], blinkT:0, blinkClock:rnd(0, 6), look:{ color:0, hat:0, face:0, extra:0 }, reroll:false, tableFlip:false, shuffle:false,
      give:function(k, silent){ if(!k) return; this.cards.push(k); if(k.cursed){ var cu = pick(CURSES); this.cards.push(cu); if(!silent) note(this.name+' is cursed with '+cu.name); } recalc(this); },
      wipe:function(){ this.cards = []; recalc(this); }, uncurse:function(n){ for(var j = this.cards.length - 1; j >= 0 && n > 0; j--){ if(this.cards[j].rarity === 'curse'){ this.cards.splice(j, 1); n--; } } recalc(this); } }; }
    function recalc(p){ var S = baseStats(); p.cards.forEach(function(k){ if(!k.instant) k.apply(S, p); }); p.lootbox.forEach(function(fx){ fx(S); }); var curses = p.cards.filter(function(k){ return k.rarity === 'curse'; }).length; p.curses = curses;
      if(S.siphon) S.hp *= 1 + .15*curses; S.ammo = Math.max(1, Math.round(S.ammo)); S.atk = Math.max(S.demonic ? .04 : .05, S.atk); S.reload = Math.max(.25, S.reload); S.blockCd = Math.max(.6, S.blockCd); S.hp = Math.max(20, S.hp); S.spread = clamp(S.spread, 0, .8); S.body = clamp(S.body, .45, 2); S.move = clamp(S.move, .3, 3.2); S.speed = clamp(S.speed, .3, 6);
      var was = p.maxhp || S.hp, ratio = p.hp / was; p.S = S; p.maxhp = Math.round(S.hp); p.hp = Math.min(p.maxhp, Math.max(1, Math.round(p.maxhp*ratio))); var r0 = p.r || 0; p.r = PR*S.body*clamp(1 + (S.hp/100 - 1)*SIZE_K, .6, 2.2); if(r0 && p.onGround) p.y -= p.r - r0; }   /* a fat health bar makes a bigger fighter: SIZE_K of the health change, so Huge (+80%) is +14% size and Glass Cannon (-50%) is -9% */
    function dmgOf(p){ var S = p.S, m = 1; if(p.empowerN){ m *= 1 + .5*p.empowerN; } if(S.nest && p.stillT > 1) m *= 2; if(S.laststand && p.hp < p.maxhp*.5) m *= 1.5; if(S.adrenaline && p.hp < p.maxhp*.5) m *= 1.25; m *= 1 + S.curseEater*p.curses + S.ferocity*p.points + S.warpath*p.rounds + (p.masoN || 0)*S.masochist; if(p.uni === 'red') m *= 2; if(p.uni === 'orange') m *= .75; if(p.uni === 'purple') m *= 1.2; return S.dmg*m; }
    function moveOf(p){ var S = p.S, m = S.move*(p.slowK || 1); if(S.retreat && p.hp < p.maxhp*.5) m *= 1.5; if(S.scaredy && p.hp < p.maxhp*.3) m *= 1.5; if(S.adrenaline && p.hp < p.maxhp*.5) m *= 1.3; if(p.tasteT > 0) m *= 1.5; if(p.uni === 'cyan') m *= 2; if(p.uni === 'blue') m *= .75; if(S.chase){ var e = nearest(p); if(e && sgn(e.x - p.x) === sgn(p.vx || 1) && Math.abs(p.vx) > 10 && los(p.x, p.y, e.x, e.y)) m *= 1.6; } return m; }
    function hurtMul(p){ var S = p.S, m = S.hurtM; if(S.pristine && p.hp > p.maxhp*.9) m *= .2; if(p.brawlT > 0) m /= 3; if(p.hexT > 0) m *= 1.25; if(p.uni === 'green') m *= .5; return m; }
    function note(s){ pickNote = s; pickNoteT = 2.4; }

    /* ---- match flow ---- */
    g.reset = function(){ opts = defaults(); phase = 'setup'; setupSel = 0; t = 0; players = []; bullets = []; zones = []; bombs = []; ents = []; parts = []; nums = []; beams = []; corpses = []; cpuChoice = null; banner = ''; bannerT = 0; shake = 0; slow = 1; mouse = { x:W*.75, y:H*.5 }; mouseDown = false; rightDown = false; held = {}; matchWinner = null; matchSel = 0; extensions = 0; score = 0; over = false; mapIdx = -1; autoAim = api.touch; flash = 0; pickNote = ''; pickNoteT = 0; hand = null; picker = null; pickQueue = []; log = []; helpT = 6; map = MAPS[0]; buildDyn(); api.score(0); api.status('set up the match  \u00b7  up/down pick a row, left/right change it, enter starts'); };
    function startMatch(){ startLocker(); }
    function beginPicks(){ score = 0; api.score(0); pickQueue = players.slice(); if(opts.picks > 1) pickQueue = repeatQueue(pickQueue, opts.picks); nextPick(); }
    function repeatQueue(q, n){ var out = []; for(var k = 0; k < n; k++) q.forEach(function(p){ out.push(p); }); return out; }
    function nextPick(){ hand = null; if(!pickQueue.length){ startPoint(); return; } picker = pickQueue.shift(); var wantAuto = picker.bonusPick > 0; if(wantAuto){ picker.bonusPick--; pickQueue.unshift(picker); }
      hand = drawHand(picker); handSel = Math.floor(hand.length/2); phase = 'pick'; pickClock = 0; cpuChoice = null; cpuBrowseT = 0; cpuPickT = picker.cpu ? Math.round(rnd(SKILL[opts.skill].pickT[0], SKILL[opts.skill].pickT[1])*10)/10 : 0;   /* 1.0 to 3.0 s in tenths: some cpus snap a card up, some sit on it */ api.status(picker.cpu ? picker.name+' is picking a card' : 'pick a card  \u00b7  left/right or click, enter takes it  \u00b7  1-'+hand.length+' pick straight away'); }
    function pool(p){ return CARDS.filter(function(k){ if(k.rarity === 'curse') return false; if(k.pack !== 'vanilla' && !opts[k.pack]) return false; if(k.once && p.cards.indexOf(k) > -1) return false; return true; }); }
    function drawHand(p){ var src = pool(p), out = []; while(out.length < opts.draw && src.length){ var tot = 0; src.forEach(function(k){ tot += RAR[k.rarity].w; }); var r = Math.random()*tot, ch = src[0]; for(var i = 0; i < src.length; i++){ r -= RAR[src[i].rarity].w; if(r <= 0){ ch = src[i]; break; } } out.push(ch); src = src.filter(function(k){ return k !== ch && !(k.tags[0] === 'luck' && ch.tags[0] === 'luck' && Math.random() < .7); }); } return out; }
    randomCard = function(p, rars){ var src = pool(p).filter(function(k){ return rars.indexOf(k.rarity) > -1 && !k.instant; }); return src.length ? pick(src) : null; };
    function takeCard(p, k){ log.push(p.tag+': '+k.name); snd.pick(); if(k.instant){ k.apply(p.S, p); if(!p.cpu) note(k.name+': '+k.desc); if(p.reroll){ p.reroll = false; hand = drawHand(p); handSel = Math.floor(hand.length/2); cpuPickT = p.cpu ? .8 : 0; return; } if(p.tableFlip){ p.tableFlip = false; players.forEach(function(q){ var n = q.cards.filter(function(c){ return c.rarity !== 'curse'; }).length; q.cards = []; for(var i = 0; i < n; i++){ var rc = randomCard(q, ['common', 'uncommon', 'rare']); if(rc) q.cards.push(rc); } recalc(q); }); } if(p.shuffle){ p.shuffle = false; p.cards = p.cards.map(function(c){ return c.rarity === 'curse' ? c : (randomCard(p, [c.rarity]) || c); }); recalc(p); } }
      else p.give(k);
      while(p.extraPicks > 0){ p.extraPicks--; pickQueue.unshift(p); }
      if(!p.cpu){ note(k.name+(k.cursed ? '  (and a curse)' : '')); } else { note(p.tag+' took '+k.name); }
      nextPick(); }
    /* ---- the living map: movers, gondolas, ropes, crates and saws ---- */
    function pathPos(path, dist){ var L = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) || 1, u = (dist % (2*L) + 2*L) % (2*L); if(u > L) u = 2*L - u; return [lerp(path[0][0], path[1][0], u/L), lerp(path[0][1], path[1][1], u/L)]; }
    function buildDyn(){ dynT = 0;
      dyn = { movers:map.movers.map(function(d){ var q = [0, 0, d.w, d.h]; q.dyn = true; q.dx = 0; q.dy = 0; return { def:d, q:q, off:Math.random()*400 }; }),
        swings:map.swings.map(function(d){ var q = [0, 0, d.w, d.h]; q.dyn = true; q.dx = 0; q.dy = 0; return { def:d, q:q, a:0 }; }),
        ropes:map.ropes.map(function(d){ return { x:d.x, y:d.y, len:d.len, a:rnd(-.08, .08), av:0, pump:0, hang:null }; }),
        crates:map.crates.map(function(d){ var q = [d.x - d.w/2, d.y - d.h/2, d.w, d.h]; q.dyn = true; q.dx = 0; q.dy = 0; q.crate = true; return { def:d, q:q, state:'hang', vy:0, hit:[] }; }),
        saws:map.saws.map(function(d){ return { def:d, x:d.x || 0, y:d.y || 0, r:d.r, ang:0, off:Math.random()*300 }; }),
        fixed:map.pads.map(function(d){ var q = d.slice(0, 4); q.bounce = d[4] || 1.5; return q; }).concat(map.belts.map(function(d){ var q = d.slice(0, 4); q.belt = d[4] || 100; return q; }), map.lava.map(function(d){ var q = d.slice(0, 4); q.lava = true; return q; })) };
      stepMap(0); }
    function stepMap(dt){ dynT += dt; live = map.rects.concat(dyn.fixed);
      dyn.movers.forEach(function(m){ var P = pathPos(m.def.path, m.off + dynT*m.def.speed), q = m.q, nx = P[0] - q[2]/2, ny = P[1] - q[3]; q.dx = nx - q[0]; q.dy = ny - q[1]; if(dt > 0){ q.velx = q.dx/dt; q.vely = q.dy/dt; } q[0] = nx; q[1] = ny; live.push(q); });
      dyn.swings.forEach(function(w){ var d = w.def; w.a = d.amp*Math.sin(dynT*d.speed + d.phase); var cx = d.ax + Math.sin(w.a)*d.len, cy = d.ay + Math.cos(w.a)*d.len, q = w.q, nx = cx - q[2]/2, ny = cy - q[3]/2; q.dx = nx - q[0]; q.dy = ny - q[1]; if(dt > 0){ q.velx = q.dx/dt; q.vely = q.dy/dt; } q[0] = nx; q[1] = ny; live.push(q); });
      dyn.ropes.forEach(function(R){ if(dt > 0){ var acc = -(GRAV/R.len)*Math.sin(R.a) + (R.hang ? R.pump : 0); R.av += acc*dt; R.av *= 1 - (R.hang ? .35 : 1.1)*dt; R.a += R.av*dt; R.a = clamp(R.a, -1.35, 1.35); } R.pump = 0; });
      dyn.crates.forEach(function(k){ var q = k.q; q.dx = 0; q.dy = 0; if(k.state === 'gone') return;
        if(k.state === 'fall'){ k.vy += GRAV*dt; var ny = q[1] + k.vy*dt; q.dy = ny - q[1]; q[1] = ny;
          for(var i = 0; i < live.length; i++){ var s2 = live[i]; if(s2 === q || s2.dyn && !s2.crate) continue; if(q[0] + q[2] > s2[0] && q[0] < s2[0] + s2[2] && q[1] + q[3] > s2[1] && q[1] < s2[1] + s2[3] && q[1] + q[3] - k.vy*dt <= s2[1] + 8){ q[1] = s2[1] - q[3]; k.state = 'rest'; k.vy = 0; shake += 6; snd.crateLand(); burst(q[0] + q[2]/2, q[1] + q[3], 10, 'rgba(230,220,200,.8)', 160, .4); break; } }
          if(q[1] > H + 60){ k.state = 'gone'; return; }
          if(k.state === 'fall') players.forEach(function(p){ if(!p.alive || k.hit.indexOf(p) > -1) return; if(p.x + p.r > q[0] && p.x - p.r < q[0] + q[2] && p.y + p.r > q[1] && p.y - p.r < q[1] + q[3]){ k.hit.push(p); hurt(p, 40, null, { area:true, bullet:{ vx:(p.x - (q[0] + q[2]/2))*4, vy:260, knock:1 } }); p.stunT = Math.max(p.stunT, .5); } }); }
        live.push(q); });
      dyn.saws.forEach(function(sw){ var d = sw.def; sw.ang += dt*7; if(d.path){ var P = pathPos(d.path, sw.off + dynT*d.speed), ox = sw.x, oy = sw.y; sw.x = P[0]; sw.y = P[1]; sw.vx = dt > 0 ? (sw.x - ox)/dt : 0; }
        if(dt > 0) players.forEach(function(p){ if(!p.alive) return; if(p.sawCd > 0) p.sawCd -= dt; if(p.sawCd <= 0 && Math.hypot(p.x - sw.x, p.y - sw.y) < sw.r + p.r*.85){ p.sawCd = .7; var away = sgn(p.x - sw.x); hurt(p, 28, null, { area:true, bullet:{ vx:away*500, vy:-320, knock:1 } }); p.vx = away*380; p.vy = -360; p.rope = null; burst(p.x, p.y, 8, '#ff8a00', 220, .35); snd.saw(); } }); }); }
    function snapRope(k, x, y){ if(k.state !== 'hang') return false; k.state = 'fall'; k.vy = 0; snd.snap(); burst(x, y, 6, '#c9a86a', 120, .3); say('crate loose!', .9); return true; }
    function ropeDist(R, x, y){ var ex = R.x + Math.sin(R.a)*R.len, ey = R.y + Math.cos(R.a)*R.len, dx = ex - R.x, dy = ey - R.y, L2 = dx*dx + dy*dy || 1, u = clamp(((x - R.x)*dx + (y - R.y)*dy)/L2, 0, 1); return { d:Math.hypot(x - (R.x + dx*u), y - (R.y + dy*u)), u:u }; }
    function tryGrab(p){ if(p.rope || p.ropeCd > 0) return false; var best = null, bd = 1e9; dyn.ropes.forEach(function(R){ var h = ropeDist(R, p.x, p.y); if(h.d < bd && h.d < p.r + 16 && h.u*R.len > 20){ bd = h.d; best = { R:R, d:Math.max(30, h.u*R.len) }; } }); if(!best) return false;
      var R = best.R; p.rope = R; p.ropeD = best.d; R.hang = p; R.av = (p.vx*Math.cos(R.a) - p.vy*Math.sin(R.a))/best.d*.9; p.onGround = false; p.wall = 0; snd.grab(); return true; }
    function letGo(p, jumpOff, dir){ var R = p.rope; if(!R) return; var tv = R.av*p.ropeD; p.vx = tv*Math.cos(R.a) + (jumpOff ? dir*MOVE*.45 : 0); p.vy = -tv*Math.sin(R.a) + (jumpOff ? -JUMPV*.78*Math.sqrt(p.S.jump) : 0); if(R.hang === p) R.hang = null; p.rope = null; p.ropeCd = .35; p.jumpsLeft = p.S.jumps; if(jumpOff){ snd.jump(); burst(p.x, p.y, 5, 'rgba(255,255,255,.5)', 120, .3); } }
    function startPoint(force){ mapIdx = force != null ? force : (mapIdx + 1 + ri(0, MAPS.length - 2)) % MAPS.length; map = MAPS[mapIdx]; buildDyn(); fightT = 0; noDmgT = 0; sudden = false; bullets = []; zones = []; bombs = []; ents = []; beams = []; nums = []; corpses = []; slow = 1;
      var sp = map.spawns.slice(0, players.length); players.forEach(function(p, i){ p.alive = true; recalc(p); p.hp = p.maxhp; p.x = sp[i][0]; p.y = sp[i][1] - p.r; p.vx = 0; p.vy = 0; p.ammo = p.S.ammo; p.reloadT = 0; p.atkT = 0; p.blockT = 0; p.blockCd = 0; p.stunT = 0; p.silenceT = 0; p.slowK = 1; p.slowT = 0; p.dots = []; p.decayQ = 0; p.burn = 0; p.hexT = 0; p.brawlT = 0; p.tasteT = 0; p.empowerN = 0; p.echoT = 0; p.chargeT = 0; p.stillT = 0; p.abyss = 0; p.phantomT = 0; p.flipT = 0; p.rootT = 0; p.confuseT = 0; p.masoN = 0; p.guardianLeft = p.S.guardian; p.autoLeft = p.S.autoblock*p.curses; p.phoenixUsed = false; p.heat = 0; p.haloT = 0; p.uniT = 0; p.uni = null; p.burstQ = 0; p.jumpsLeft = p.S.jumps; p.onGround = false; p.wall = 0; p.aim = i === 0 ? 0 : Math.PI; p.potT = 0; p.radT = 0; p.apexArmed = false; p.dmgDealt = 0; p.facing = p.x < W/2 ? 1 : -1; p.rope = null; p.ropeCd = 0; p.ride = null; p.sawCd = 0; p.frenzyT = 0; p.retalT = 0; p.perfects = 0;
        if(p.S.lootbox){ for(var l = 0; l < p.S.lootbox; l++){ var fx = pick([function(S){ S.dmg *= 1.15; }, function(S){ S.hp *= 1.15; }, function(S){ S.move *= 1.15; }, function(S){ S.reload *= .85; }, function(S){ S.ammo += 1; }, function(S){ S.blockCd *= .85; }]); p.lootbox.push(fx); } recalc(p); p.hp = p.maxhp; p.ammo = p.S.ammo; } });
      phase = 'countdown'; countdown = 2.2; say(map.name, 1.2); api.status('round '+(maxRounds() + 1)+'  \u00b7  '+scoreLine()); }
    function maxRounds(){ var m = 0; players.forEach(function(p){ m = Math.max(m, p.rounds); }); return m; }
    function scoreLine(){ return players.map(function(p){ return p.tag+' '+p.rounds+'r '+p.points+'p'; }).join('  \u00b7  '); }
    function endPoint(winner){ phase = 'pointend'; endT = 2.4; slow = .28; ptsAwarded = false; if(winner) winner.happyT = 3; snd.point(winner === players[0]); if(winner){ winner.points++; say(winner === players[0] ? 'POINT' : winner.tag+' scores', 1.5); if(winner === players[0]){ score += 500; api.score(score); } } else say('draw', 1.2); }
    function afterPoint(){ var rw = null; players.forEach(function(p){ if(p.points >= opts.points){ rw = p; } }); slow = 1;
      if(rw){ rw.rounds++; snd.round(rw === players[0]); players.forEach(function(p){ p.points = 0; }); if(rw === players[0]){ score += 2000; api.score(score); }
        if(rw.rounds >= opts.rounds){ matchWinner = rw; phase = 'matchend'; matchSel = 0; bannerT = 0; helpT = 0; snd.round(rw === players[0]); api.status((rw === players[0] ? 'you win the match' : rw.tag+' wins the match')+'  \u00b7  extend by 3 rounds or end the game'); return; }
        losersPick(rw); }
      else startPoint(); }
    function losersPick(rw){ pickQueue = players.filter(function(p){ return p !== rw; }); if(opts.picks > 1) pickQueue = repeatQueue(pickQueue, opts.picks); say(rw === players[0] ? 'ROUND' : rw.tag+' takes the round', 1.5); nextPick(); }
    /* the match is won, but it does not have to stop: extend by three more rounds (as often as you like, the decks only get wilder) or end it */
    function matchMsg(){ var rw = matchWinner; return rw === players[0] ? 'You win '+rw.rounds+' rounds to '+players.filter(function(p){ return p !== rw; }).map(function(p){ return p.rounds; }).join('/') : rw.tag+' takes the match '+rw.rounds+' rounds to '+players[0].rounds; }
    function extendMatch(){ if(phase !== 'matchend') return false; var rw = matchWinner; opts.rounds += 3; extensions++; matchWinner = null; snd.pick(); say('+3 ROUNDS  \u00b7  first to '+opts.rounds, 2); api.status('extended  \u00b7  first to '+opts.rounds+' rounds'); losersPick(rw); return true; }
    function endMatch(){ if(phase !== 'matchend') return false; phase = 'over'; over = true; api.status(matchWinner === players[0] ? 'you win the match' : matchWinner.tag+' wins the match'); api.over(matchMsg()); return true; }
    function matchButtons(){ var y = H*.5 + 96, w = 250, gap = 28; return [{ id:'extend', label:'Extend by 3 rounds', x:W/2 - w - gap/2, y:y, w:w, h:46 }, { id:'end', label:'End game', x:W/2 + gap/2, y:y, w:w, h:46 }]; }

    /* ---- movement and collision ---- */
    function resolve(p, dt){ var r = p.r*.92, gdir = p.flipT > 0 ? -1 : 1; p.onGround = false; p.wall = 0;
      if(p.ride && p.ride.dyn){ p.x += p.ride.dx || 0; p.y += p.ride.dy || 0; } if(p.ride && p.ride.belt) p.x += p.ride.belt*dt; p.ride = null;   /* carried by whatever it stood on last frame */
      p.x += p.vx*dt; live.forEach(function(q){ if(p.x + r > q[0] && p.x - r < q[0] + q[2] && p.y + r > q[1] && p.y - r < q[1] + q[3]){ if(p.vx > 0){ p.x = q[0] - r; p.wall = 1; } else if(p.vx < 0){ p.x = q[0] + q[2] + r; p.wall = -1; } p.vx = 0; } });
      p.y += p.vy*dt; live.forEach(function(q){ if(p.x + r > q[0] && p.x - r < q[0] + q[2] && p.y + r > q[1] && p.y - r < q[1] + q[3]){ if(p.vy*gdir > 0){ p.y = gdir > 0 ? q[1] - r : q[1] + q[3] + r; p.onGround = true; p.jumpsLeft = p.S.jumps; p.ride = q; if(q.bounce) p.padQ = q.bounce; if(q.lava) p.lavaQ = true; } else { p.y = gdir > 0 ? q[1] + q[3] + r : q[1] - r; if(q.lava) p.lavaQ = true; } p.vy = 0; } });
      if(p.padQ){ p.vy = -JUMPV*p.padQ*gdir; p.onGround = false; p.ride = null; p.squashT = .25; p.jumpsLeft = p.S.jumps; burst(p.x, p.y + p.r*gdir, 8, '#7ee081', 160, .3); snd.jump(); p.padQ = 0; }
      if(p.lavaQ){ p.lavaQ = false; p.onGround = false; p.ride = null; p.vy = -JUMPV*.75*gdir; hurt(p, 18, null, { area:true }); burst(p.x, p.y + p.r*gdir, 10, '#ff5f57', 200, .4); num(p.x, p.y - 16, 'lava', '#ff8a00'); } }
    function jump(p){ if(p.stunT > 0 || p.rootT > 0) return; var gdir = p.flipT > 0 ? -1 : 1, v = JUMPV*Math.sqrt(p.S.jump);
      snd.jump(); if(p.onGround){ p.vy = -v*gdir; p.onGround = false; p.apexArmed = !!p.S.apexBlock; burst(p.x, p.y + p.r*gdir, 5, 'rgba(255,255,255,.5)', 120, .3); }
      else if(p.wall){ p.vy = -v*gdir*.95; p.vx = -p.wall*MOVE*1.1; p.jumpsLeft = p.S.jumps; }
      else if(p.jumpsLeft > 1){ p.jumpsLeft--; p.vy = -v*gdir*.9; burst(p.x, p.y + p.r*gdir, 6, 'rgba(255,255,255,.5)', 140, .3); } }
    function stepPlayer(p, dt, inp){ var S = p.S, gdir = p.flipT > 0 ? -1 : 1;
      ['stunT', 'silenceT', 'slowT', 'hexT', 'brawlT', 'tasteT', 'chargeT', 'phantomT', 'flipT', 'rootT', 'confuseT', 'echoT', 'radT', 'frenzyT', 'retalT'].forEach(function(k){ if(p[k] > 0) p[k] -= dt; });
      if(p.slowT <= 0) p.slowK = 1;
      if(p.ropeCd > 0) p.ropeCd -= dt;
      if(inp.grab && !p.grabHeld){ if(p.rope) letGo(p, false, inp.dir); else tryGrab(p); } p.grabHeld = inp.grab;
      if(p.rope){ var R = p.rope; if(inp.jump && !p.jumpHeld){ letGo(p, true, inp.dir); p.jumpHeld = true; }
        else { p.jumpHeld = inp.jump; p.ropeD = clamp(p.ropeD + (inp.climb || 0)*170*dt, 30, R.len); R.pump += inp.dir*2.6; if(inp.dir) p.face = inp.dir; else if(Math.abs(Math.cos(p.aim)) > .35) p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
          p.x = R.x + Math.sin(R.a)*p.ropeD; p.y = R.y + Math.cos(R.a)*p.ropeD; var tv = R.av*p.ropeD; p.vx = tv*Math.cos(R.a); p.vy = -tv*Math.sin(R.a); p.onGround = false; p.wall = 0; p.wasGround = false; p.stillT = 0; if(p.squashT > 0) p.squashT -= dt;
          stepGun(p, dt, inp); return; } }
      var mv = p.stunT > 0 ? 0 : inp.dir, target = mv*MOVE*moveOf(p); if(p.chargeT > 0) target = p.facing*900;
      p.vx += (target - p.vx)*Math.min(1, dt*(p.onGround ? 14 : 7)); if(mv) p.facing = mv;
      /* the whole body mirrors to face the way it walks; standing still it faces the gun */
      if(mv) p.face = mv; else if(Math.abs(Math.cos(p.aim)) > .35) p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
      if(p.onGround && Math.abs(p.vx) > 15) p.walkT += dt*Math.abs(p.vx)/22; else if(p.onGround) p.walkT += (Math.round(p.walkT/Math.PI)*Math.PI - p.walkT)*Math.min(1, dt*12);
      if(p.squashT > 0) p.squashT -= dt;
      if(!(S.immovable && Math.abs(p.vx) > MOVE*moveOf(p)*1.05)) {} else p.vx = sgn(p.vx)*MOVE*moveOf(p);
      p.vy += GRAV*S.gravity*gdir*dt*(p.uni === 'cyan' ? .7 : 1); if(p.vy*gdir > 900) p.vy = 900*gdir;
      if(inp.jump && !p.jumpHeld) jump(p); else if(!inp.jump && p.jumpHeld && !p.wall && p.vy*gdir < -260) p.vy *= .55;   /* let go early for a short hop */
      p.jumpHeld = inp.jump;
      if(p.apexArmed && !p.onGround && p.vy*gdir >= 0){ p.apexArmed = false; doBlock(p, true); }
      p.vyLand = Math.abs(p.vy);
      resolve(p, dt);
      if(p.onGround && !p.wasGround && p.vyLand > 260){ p.squashT = .16; snd.land(); } p.wasGround = p.onGround;
      if(!inMap(p.x, p.y)){ kill(p, null, 'fell'); return; }
      var still = Math.abs(p.vx) < 8 && p.onGround; p.stillT = still ? p.stillT + dt : 0;
      stepGun(p, dt, inp); }
    function stepGun(p, dt, inp){ var S = p.S;
      /* aim */
      if(!p.cpu){ if(autoAim){ var e = nearest(p); if(e) p.aim = Math.atan2(e.y - p.y, e.x - p.x); } else p.aim = Math.atan2(mouse.y - p.y, mouse.x - p.x); if(p.confuseT > 0) p.aim += Math.sin(t*9)*1.2; }
      /* gun */
      if(p.atkT > 0) p.atkT -= dt;
      if(p.reloadT > 0){ p.reloadT -= dt; if(S.radiance){ p.radT -= dt; if(p.radT <= 0){ p.radT = Math.max(.18, .6 - (S.reload - p.reloadT)*.15); ents.push({ k:'wave', x:p.x, y:p.y, r:0, o:p, t:0 }); enemies(p).forEach(function(q){ if(Math.hypot(q.x - p.x, q.y - p.y) < 130) hurt(q, 9*S.radiance, p, { area:true }); }); } }
        if(p.reloadT <= 0){ p.ammo = S.ammo; if(S.mending){ heal(p, S.mending); } } }
      else if(p.ammo <= 0 && !(S.shieldsUp && p.shieldsWait > 0)) startReload(p);
      if(p.shieldsWait > 0) p.shieldsWait -= dt;
      if(inp.fire && p.silenceT <= 0 && p.stunT <= 0) fire(p); if(p.burstQ > 0){ p.burstT -= dt; if(p.burstT <= 0){ p.burstQ--; p.burstT = .07; shootOnce(p, .35); } }
      if(S.gatling){ p.heat = clamp(p.heat + (inp.fire ? dt*1.2 : -dt*2), 0, 3); }
      if(inp.block && !p.blockHeld) doBlock(p, false); p.blockHeld = inp.block;
      if(p.blockT > 0) p.blockT -= dt; if(p.blockCd > 0) p.blockCd -= dt;
      if(p.echoT > 0 && p.echoT - dt <= 0) doBlock(p, true, true);
      if(p.chargeT > 0 && p.chargeT - dt <= 0) doBlock(p, true, true);
      /* passives */
      if(S.regen) heal(p, S.regen*dt, true);
      if(S.chilling) enemies(p).forEach(function(q){ if(Math.hypot(q.x - p.x, q.y - p.y) < 200) slowDown(q, 1 - .25*S.chilling, .2); });
      if(S.lifestealer) enemies(p).forEach(function(q){ if(Math.hypot(q.x - p.x, q.y - p.y) < 130){ hurt(q, 9*S.lifestealer*dt, p, { area:true, quiet:true }); heal(p, 9*S.lifestealer*dt, true); } });
      if(S.abyssal){ if(p.stillT > 1.1){ p.abyss += dt; if(p.abyss > .5){ p.abyss = 0; doBlock(p, true, true); } enemies(p).forEach(function(q){ var d = Math.hypot(q.x - p.x, q.y - p.y); if(d < 170){ hurt(q, 6*S.abyssal*dt, p, { area:true, quiet:true }); q.vx += (p.x - q.x)/d*260*dt; q.vy += (p.y - q.y)/d*260*dt; } }); } else p.abyss = 0; }
      if(S.halo){ p.haloT += dt; if(p.haloT > 1.4){ p.haloT = 0; var he = nearest(p, true); if(he){ var ha = Math.atan2(he.y - p.y, he.x - p.x); spawnBullet(p, p.x + Math.cos(ha)*40, p.y + Math.sin(ha)*40, ha, { dmgM:.6, free:true }); } } }
      if(S.unicorn){ p.uniT -= dt; if(p.uniT <= 0){ p.uniT = 8; p.uni = pick(['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink']); burst(p.x, p.y, 16, UNI[p.uni], 200, .6); } }
      if(S.hotpotato){ p.potT -= dt; if(p.potT <= 0 && Math.abs(p.vx) > 40){ p.potT = .12; zones.push({ k:'fire', x:p.x - p.vx*.05, y:p.y + p.r*.6, r:22, t:0, life:1.6, o:p }); } }
      if(S.quickReflex || p.autoLeft > 0){ var threat = bullets.some(function(b){ return b.o !== p && !b.free2 && Math.hypot(b.x + b.vx*.12 - p.x, b.y + b.vy*.12 - p.y) < p.r + b.r + 6 && Math.hypot(b.x - p.x, b.y - p.y) > p.r; }); if(threat && p.blockT <= 0){ if(S.quickReflex && p.blockCd <= 0) doBlock(p, false); else if(p.autoLeft > 0){ p.autoLeft--; doBlock(p, true, true); } } }
      /* damage over time */
      var dl = p.dots.slice(); for(var i = dl.length - 1; i >= 0 && p.alive; i--){ var d = dl[i]; var step = Math.min(dt, d.t)/d.t*d.left; d.left -= step; d.t -= dt; hurt(p, step, d.src, { area:true, quiet:true, dot:true }); if(d.t <= 0 || d.left <= .01){ var di = p.dots.indexOf(d); if(di > -1) p.dots.splice(di, 1); } }   /* a phoenix revive inside hurt() clears p.dots, so walk a copy */
      if(p.decayQ > 0){ var dq = Math.min(p.decayQ, p.decayQ*dt/1.2 + 2*dt); p.decayQ -= dq; p.hp -= dq; if(p.hp <= 0) kill(p, p.decaySrc, 'decay'); }
      if(p.burn > 0){ var bs = Math.min(p.burn, dt*p.burnRate); p.burn -= bs; hurt(p, bs, p.burnSrc, { area:true, quiet:true, dot:true }); if(Math.random() < dt*20) parts.push({ x:p.x + rnd(-p.r, p.r), y:p.y - p.r, vx:rnd(-20, 20), vy:-rnd(60, 140), t:0, life:.5, col:pick(['#ff8a00', '#ffd166', '#ff5f57']), r:rnd(2, 4) }); } }
    var UNI = { red:'#ff5f57', orange:'#ff8a00', yellow:'#ffd166', green:'#7ee081', cyan:'#4fd1c5', blue:'#5ab4ff', purple:'#c084fc', pink:'#ff7fb0' };
    function slowDown(q, k, tt){ q.slowK = Math.min(q.slowK, k); q.slowT = Math.max(q.slowT, tt); }
    function heal(p, n, quiet){ if(!p.alive || n <= 0) return; var was = p.hp; p.hp = Math.min(p.maxhp, p.hp + n); if(!quiet && p.hp - was >= 1) num(p.x, p.y, '+'+Math.round(p.hp - was), '#7ee081'); }
    function startReload(p){ if(p.reloadT > 0) return; var rt = p.S.reload; if(p.S.scaredy && p.hp < p.maxhp*.3) rt *= .5; if(p.uni === 'orange') rt *= .1; p.reloadT = rt; p.reloadFull = rt;
      p.S.onReload.forEach(function(h){ if(h === 'battery') enemies(p).forEach(function(q){ if(Math.hypot(q.x - p.x, q.y - p.y) < 160){ q.stunT = Math.max(q.stunT, .8); num(q.x, q.y, 'stun', '#ffd166'); } }); if(h === 'meteor'){ var e = nearest(p); if(e) ents.push({ k:'comet', x:e.x, y:-40, tx:e.x, o:p, t:0, vy:0 }); } }); }
    function fire(p){ var S = p.S; if(p.reloadT > 0 || p.atkT > 0 || p.ammo <= 0 || p.stunT > 0) return; if(S.demonic){ if(p.hp <= 10) return; p.hp -= 10; }
      var atk = S.atk; if(S.gatling) atk /= (1 + p.heat); if(p.frenzyT > 0) atk *= .5; if(p.uni === 'orange') atk *= .3; if(S.adrenaline && p.hp < p.maxhp*.5) atk *= .7; p.atkT = atk; p.ammo--;
      shootOnce(p, 1); if(S.burst){ p.burstQ = S.burst; p.burstT = .07; }
      if(p.ammo <= 0 && S.shieldsUp){ doBlock(p, true, true); p.shieldsWait = .9; }
      if(p.empowerN){ p.empowerN = 0; } }
    function shootOnce(p, dmgM){ var S = p.S; if(!p.alive) return; if(S.fizzle && Math.random() < S.fizzle){ burst(p.x + Math.cos(p.aim)*24, p.y + Math.sin(p.aim)*24, 4, '#888', 60, .3); num(p.x, p.y, 'misfire', '#aaa'); return; }
      var n = S.bullets, mx = p.x + Math.cos(p.aim)*(p.r + 10), my = p.y + Math.sin(p.aim)*(p.r + 10);
      if(S.laser){ var a = p.aim, x = mx, y = my, hitSet = {}, steps = 0; while(inMap(x, y) && steps < 400){ x += Math.cos(a)*6; y += Math.sin(a)*6; steps++; if(rectHit(x, y, 1) && !S.ghost) break; enemies(p).forEach(function(q){ if(!hitSet[q.i] && hitP(q, x, y, 4)){ hitSet[q.i] = 1; hurt(q, dmgOf(p)*dmgM, p, { bullet:{ vx:Math.cos(a), vy:Math.sin(a), knock:S.knock } }); } }); } beams.push({ x0:mx, y0:my, x1:x, y1:y, t:.16, col:p.col }); shake = Math.min(10, shake + 3); snd.laser(); return; }
      for(var i = 0; i < n; i++){ var sp = S.precise ? 0 : S.spread, a2 = p.aim + (n > 1 ? (i/(n - 1) - .5)*sp*1.8 : 0) + rnd(-sp, sp)*.35 + (p.confuseT > 0 ? rnd(-.6, .6) : 0); spawnBullet(p, mx, my, a2, { dmgM:dmgM }); }
      shake = Math.min(10, shake + 1.5 + n*.2); burst(mx, my, 3, '#fff', 200, .18); p.recoil = 6; snd.shoot(S.size*(S.saw ? 2.2 : 1)*(p.empowerN ? 1.4 : 1), dmgOf(p)*dmgM, n); }
    function spawnBullet(p, x, y, a, o){ var S = p.S, emp = p.empowerN && !o.free ? 1 + .5*p.empowerN : 1, spd = BSPEED*S.speed*emp*(S.nest && p.stillT > 1 ? 2 : 1)*(p.uni === 'yellow' ? 2 : 1), dmg = dmgOf(p)*(o.dmgM || 1)*(o.free ? 1 : emp);
      var b = { x:x, y:y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd, r:4*S.size*(S.saw ? 2.2 : 1), o:p, dmg:dmg, t:0, life:S.range ? S.range*3 : 6, bounces:S.bounces + (p.uni === 'pink' ? 5 : 0), grav:BGRAV*S.grav*(S.drill ? 1 : 1), S:S, hits:{}, bcount:0, trail:[], drillLeft:S.drill*17, empowered:emp > 1, free2:!!o.free, wallT:0, slowT:0, stasis:S.stasis ? .12 : 0, sub:!!o.sub };
      if(S.saw) b.spin = 0; if(S.fireworks && !o.sub) b.fw = .55; if(S.boomerang && !o.sub) b.boom = .75; bullets.push(b); return b; }
    function doBlock(p, free, silent){ if(!p.alive) return false; if(!free && p.blockCd > 0) return false; if(p.silenceT > 0 && !free) return false; var S = p.S; snd.block();
      p.blockT = .3; if(!free) p.blockCd = S.blockCd*(p.uni === 'blue' ? .5 : 1); if(!silent && S.echo) p.echoT = .45; if(S.empower) p.empowerN = Math.min(3, (p.empowerN || 0) + 1);
      ents.push({ k:'ring', x:p.x, y:p.y, o:p, t:0, life:.35, r:p.r });
      var perfect = S.perfect && bullets.some(function(b){ if(b.o === p || b.free2) return false; var d = Math.hypot(b.x - p.x, b.y - p.y); return d < p.r + 48 && (b.vx*(p.x - b.x) + b.vy*(p.y - b.y)) > 0; });   /* a bullet within reach and still heading in: a perfect block */
      if(perfect){ if(!free) p.blockCd = 0; num(p.x, p.y - 14, 'PERFECT', '#ffd166'); burst(p.x, p.y, 16, '#ffd166', 260, .4); p.perfects = (p.perfects || 0) + 1; }
      S.onBlock.forEach(function(h){ blockFx(p, h); if(perfect) blockFx(p, h); }); return true; }
    function blockFx(p, h){ var near = function(R){ return enemies(p).filter(function(q){ return Math.hypot(q.x - p.x, q.y - p.y) < R; }); }, e;
      if(h === 'bombs'){ for(var i = 0; i < 6; i++){ var a = i/6*Math.PI*2; bombs.push({ x:p.x + Math.cos(a)*22, y:p.y + Math.sin(a)*22, vx:Math.cos(a)*140, vy:Math.sin(a)*140 - 120, t:.6, o:p, r:34, dmg:20 }); } }
      else if(h === 'emp'){ for(var j = 0; j < 12; j++){ var b = spawnBullet(p, p.x, p.y, j/12*Math.PI*2, { dmgM:.12, free:true }); var sp = 230; b.vx = Math.cos(j/12*Math.PI*2)*sp; b.vy = Math.sin(j/12*Math.PI*2)*sp; b.grav = 0; b.life = 1.1; b.slowHit = .5; b.r = 4; b.col = '#4fd1c5'; } }
      else if(h === 'frost'){ near(150).forEach(function(q){ slowDown(q, .4, 2.2); num(q.x, q.y, 'slowed', '#4fd1c5'); }); zones.push({ k:'frostring', x:p.x, y:p.y, r:150, t:0, life:.4, o:p }); }
      else if(h === 'heal'){ zones.push({ k:'heal', x:p.x, y:p.y, r:90, t:0, life:3.2, o:p }); }
      else if(h === 'implode'){ near(240).forEach(function(q){ var d = Math.hypot(q.x - p.x, q.y - p.y) || 1; if(!q.S.immovable){ q.vx += (p.x - q.x)/d*520; q.vy += (p.y - q.y)/d*420 - 80; } }); zones.push({ k:'pull', x:p.x, y:p.y, r:240, t:0, life:.35, o:p }); }
      else if(h === 'overpower'){ near(140).forEach(function(q){ hurt(q, p.maxhp*.15, p, { area:true }); }); zones.push({ k:'boom', x:p.x, y:p.y, r:140, t:0, life:.35, o:p, col:'#ff6b6b' }); }
      else if(h === 'radar'){ enemies(p).forEach(function(q){ if(los(p.x, p.y, q.x, q.y)){ var a2 = Math.atan2(q.y - p.y, q.x - p.x); spawnBullet(p, p.x + Math.cos(a2)*(p.r + 8), p.y + Math.sin(a2)*(p.r + 8), a2, { dmgM:.8, free:true }); } }); zones.push({ k:'radar', x:p.x, y:p.y, r:420, t:0, life:.6, o:p }); }
      else if(h === 'saw'){ ents.push({ k:'saw', o:p, a:0, t:0, life:3.2, tick:0 }); }
      else if(h === 'charge'){ p.chargeT = .28; p.vy = Math.min(p.vy, -60); }
      else if(h === 'shock'){ near(220).forEach(function(q){ var d = Math.hypot(q.x - p.x, q.y - p.y) || 1; if(!q.S.immovable){ q.vx += (q.x - p.x)/d*780; q.vy += (q.y - p.y)/d*520 - 200; } }); zones.push({ k:'boom', x:p.x, y:p.y, r:220, t:0, life:.4, o:p, col:'#fff' }); }
      else if(h === 'silence'){ near(220).forEach(function(q){ q.silenceT = Math.max(q.silenceT, 2.2); num(q.x, q.y, 'silenced', '#c084fc'); }); zones.push({ k:'boom', x:p.x, y:p.y, r:220, t:0, life:.4, o:p, col:'#c084fc' }); }
      else if(h === 'static'){ zones.push({ k:'static', x:p.x, y:p.y, r:120, t:0, life:3, o:p }); }
      else if(h === 'nova'){ zones.push({ k:'nova', x:p.x + Math.cos(p.aim)*60, y:p.y + Math.sin(p.aim)*60, r:170, t:0, life:1.6, o:p }); }
      else if(h === 'reload'){ p.reloadT = 0; p.ammo = p.S.ammo; num(p.x, p.y, 'reloaded', '#ffd166'); }
      else if(h === 'teleport'){ var tx = clamp(p.x + Math.cos(p.aim)*190, 30, W - 30), ty = clamp(p.y + Math.sin(p.aim)*190, 20, H - 30); burst(p.x, p.y, 14, p.col, 240, .4); p.x = tx; p.y = ty; var q2 = rectHit(p.x, p.y, p.r*.9); if(q2){ p.y = q2[1] - p.r; } burst(p.x, p.y, 14, p.col, 240, .4); }
      else if(h === 'bullettime'){ bullets.forEach(function(b){ if(b.o !== p) b.slowT = 1.5; }); zones.push({ k:'boom', x:p.x, y:p.y, r:W, t:0, life:.3, o:p, col:'#5ab4ff' }); }
      else if(h === 'cloud'){ e = nearest(p); if(e) ents.push({ k:'cloud', o:p, tgt:e, x:e.x, y:Math.max(30, e.y - 150), t:0, life:2.2, tick:0 }); }
      else if(h === 'ignite'){ near(160).forEach(function(q){ ignite(q, q.maxhp*.33, p, 3); }); zones.push({ k:'boom', x:p.x, y:p.y, r:160, t:0, life:.4, o:p, col:'#ff8a00' }); }
      else if(h === 'aqua'){ zones.push({ k:'aqua', x:p.x, y:p.y, r:70, t:0, life:2, o:p, follow:true }); }
      else if(h === 'barrier'){ zones.push({ k:'barrier', x:p.x, y:p.y, r:110, t:0, life:1.6, o:p, follow:true }); }
      else if(h === 'comet'){ e = nearest(p); if(e) ents.push({ k:'comet', x:e.x, y:-40, tx:e.x, o:p, t:0, vy:0 }); }
      else if(h === 'phantom'){ p.phantomT = 1; }
      else if(h === 'swords'){ for(var s2 = 0; s2 < 3; s2++) ents.push({ k:'sword', o:p, a:s2/3*Math.PI*2, t:0, life:4, x:p.x, y:p.y, mode:'orbit', cd:0 }); }
      else if(h === 'flip'){ near(220).forEach(function(q){ q.flipT = 2; q.vy = -Math.abs(q.vy) - 60; num(q.x, q.y, 'flipped', '#c084fc'); }); }
      else if(h === 'grounded'){ near(220).forEach(function(q){ q.rootT = 1.6; num(q.x, q.y, 'grounded', '#a3a3a3'); }); }
      else if(h === 'discombobulate'){ near(240).forEach(function(q){ q.confuseT = 2.2; num(q.x, q.y, '?!', '#ffd166'); }); }
      else if(h === 'sentry'){ ents.push({ k:'sentry', x:p.x, y:p.y, o:p, t:0, life:4.2, tick:.3 }); }
      else if(h === 'vampiric'){ near(170).forEach(function(q){ var n = q.maxhp*.1; hurt(q, n, p, { area:true }); heal(p, n); }); zones.push({ k:'boom', x:p.x, y:p.y, r:170, t:0, life:.4, o:p, col:'#ff5f57' }); }
      /* tigOS Cuts */
      else if(h === 'parry'){ var pn = 0; bullets.forEach(function(b){ if(b.o === p || Math.hypot(b.x - p.x, b.y - p.y) > 140) return; var tgt = nearest(p), spd = Math.hypot(b.vx, b.vy)*1.15 || 400, a2 = tgt ? Math.atan2(tgt.y - b.y, tgt.x - b.x) : Math.atan2(-b.vy, -b.vx); b.o = p; b.S = p.S; b.vx = Math.cos(a2)*spd; b.vy = Math.sin(a2)*spd; b.dmg *= 1.5; b.hits = {}; b.col = p.col; b.t = 0; b.grav = 0; pn++; }); if(pn){ num(p.x, p.y, 'parried '+pn, '#ffd166'); snd.laser(); } zones.push({ k:'boom', x:p.x, y:p.y, r:140, t:0, life:.3, o:p, col:'#ffd166' }); }   /* the bullets change owner, so the shooter is now the one in their way */
      else if(h === 'thunder'){ enemies(p).forEach(function(q){ if(!los(p.x, p.y, q.x, q.y)) return; beams.push({ x0:q.x + rnd(-30, 30), y0:-20, x1:q.x, y1:q.y, t:.22, col:'#fff' }); hurt(q, 22, p, { area:true }); q.stunT = Math.max(q.stunT, .5); burst(q.x, q.y, 10, '#ffd166', 200, .3); }); flash = Math.max(flash, .12); snd.kill(); }
      else if(h === 'blastoff'){ bombs.push({ x:p.x, y:p.y + p.r*.5, vx:0, vy:0, t:.5, o:p, r:70, dmg:30 }); p.vy = -JUMPV*1.15; p.onGround = false; p.jumpsLeft = Math.max(p.jumpsLeft, 1); burst(p.x, p.y + p.r, 14, '#ff8a00', 260, .4); }
      else if(h === 'cluster'){ for(var ci2 = -1; ci2 <= 1; ci2++){ var ca2 = p.aim + ci2*.22; bombs.push({ x:p.x + Math.cos(ca2)*(p.r + 6), y:p.y + Math.sin(ca2)*(p.r + 6), vx:Math.cos(ca2)*420 + p.vx*.3, vy:Math.sin(ca2)*420 - 160, t:.9 + ci2*.08, o:p, r:52, dmg:24 }); } }
      else if(h === 'frenzy'){ p.frenzyT = 2.5; num(p.x, p.y, 'FRENZY', '#ff6b6b'); }
      else if(h === 'blackhole'){ zones.push({ k:'blackhole', x:p.x + Math.cos(p.aim)*90, y:p.y + Math.sin(p.aim)*90, r:200, t:0, life:1.8, o:p, ate:0 }); }
      else if(h === 'meteorshower'){ e = nearest(p); if(e){ for(var mi = 0; mi < 5; mi++){ var my0 = -30 - mi*70, mx0 = e.x + rnd(-90, 90), fall = (e.y - my0)/640; bombs.push({ x:mx0, y:my0, vx:(e.x + e.vx*fall*.5 - mx0)/fall, vy:640, t:fall + .05, o:p, r:64, dmg:16, meteor:true }); } } }   /* five fireballs aimed at where the enemy is heading; each bursts when it gets there (or where it lands) */
      else if(h === 'secondwind'){ heal(p, (p.maxhp - p.hp)*.2); p.dots = []; p.burn = 0; p.slowK = 1; p.slowT = 0; p.hexT = 0; zones.push({ k:'boom', x:p.x, y:p.y, r:80, t:0, life:.4, o:p, col:'#7ee081' }); }
      else if(h === 'quake'){ enemies(p).forEach(function(q){ if(q.onGround || q.wall){ q.vy = -620; q.onGround = false; q.stunT = Math.max(q.stunT, .5); num(q.x, q.y, 'quaked', '#d9a441'); } }); shake = Math.min(18, shake + 12); zones.push({ k:'boom', x:p.x, y:p.y, r:W, t:0, life:.3, o:p, col:'#d9a441' }); }
      else if(h === 'retaliate'){ p.retalT = 2; num(p.x, p.y, 'retaliate', '#ff8a00'); }
      else if(h === 'lightwall'){ var wf = p.facing || p.face || 1; zones.push({ k:'wall', x:p.x + wf*44, y:p.y - 8, w:14, h:110, t:0, life:2, o:p }); } }
    function ignite(q, total, src, secs){ q.burn = (q.burn || 0) + total; q.burnRate = q.burn/secs; q.burnSrc = src; }

    /* ---- damage ---- */
    function drainRetal(){ while(retalQ.length){ var rq = retalQ.shift(); if(rq.q.alive && rq.src.alive){ var a0 = rq.q.aim; rq.q.aim = Math.atan2(rq.src.y - rq.q.y, rq.src.x - rq.q.x); shootOnce(rq.q, .6); rq.q.aim = a0; } } }
    function hurt(q, n, src, o){ o = o || {}; if(!q.alive || n <= 0) return 0; if(q.phantomT > 0 && !o.area) return 0; var S = q.S; if(!o.drain) noDmgT = 0;
      if(!o.dot){ n *= hurtMul(q); if(src && src.S.crit && Math.random() < src.S.crit){ n *= 2; o.crit = true; } if(q.masoN != null && S.masochist) q.masoN++; }
      if(S.decay && !o.dot){ q.decayQ += n; q.decaySrc = src; num(q.x, q.y, Math.round(n)+' decay', '#c8cbd6'); } else { q.hp -= n; if(!o.quiet) num(q.x, q.y, Math.round(n), o.crit ? '#ffd166' : '#fff'); }
      if(!o.quiet){ burst(q.x, q.y, 4, q.col, 160, .3); blood(q, o.bullet); snd.hit(n); q.hurtT = .6; } if(o.bullet) q.lastHit = { vx:o.bullet.vx, vy:o.bullet.vy };
      if(q.retalT > 0 && src && src !== q && src.alive && !o.dot) retalQ.push({ q:q, src:src });   /* Retaliate: queued, because bullets are stepped through a filter and a push mid-step would be lost */
      if(src && src !== q && src.alive){ var SS = src.S; if(SS.steal) heal(src, n*SS.steal*(src.uni === 'purple' ? 1.5 : 1)); if(SS.brawler) src.brawlT = 3; if(SS.taste) src.tasteT = 3; if(SS.scavenger && !o.dot){ src.reloadT = 0; src.ammo = SS.ammo; } if(SS.refresh && !o.dot && src.refreshCd <= 0){ src.blockCd = 0; src.refreshCd = 1.5; } src.dmgDealt += n; if(src === players[0]){ score += Math.round(n); api.score(score); } }
      if(o.bullet && !S.immovable){ var kb = 190*(o.bullet.knock || 1)*Math.sqrt(Math.max(.3, n/55)); q.vx += o.bullet.vx*kb/ (Math.hypot(o.bullet.vx, o.bullet.vy) || 1); q.vy += o.bullet.vy*kb/(Math.hypot(o.bullet.vx, o.bullet.vy) || 1) - 60; }
      if(q.hp <= q.maxhp*.2 && q.guardianLeft > 0 && q.hp > 0){ q.guardianLeft--; heal(q, q.maxhp*.3); num(q.x, q.y - 20, 'guardian angel', '#ffd166'); }
      if(q.hp <= 0) kill(q, src, o.dot ? 'burned out' : 'shot'); return n; }
    function kill(q, src, how){ if(!q.alive) return; if(q.rope){ if(q.rope.hang === q) q.rope.hang = null; q.rope = null; } if(q.S.phoenix && !q.phoenixUsed){ q.phoenixUsed = true; q.hp = Math.round(q.maxhp*.6); q.dots = []; q.burn = 0; q.decayQ = 0; var sp = map.spawns[q.i % map.spawns.length]; q.x = sp[0]; q.y = sp[1] - q.r; q.vx = 0; q.vy = 0; q.blockT = .6; burst(q.x, q.y, 30, '#ff8a00', 320, .8); num(q.x, q.y, 'PHOENIX', '#ff8a00'); return; }
      q.alive = false; q.hp = 0; snd.kill(); burst(q.x, q.y, 34, q.col, 380, .9); if(q.S.kamikaze){ zones.push({ k:'boom', x:q.x, y:q.y, r:180, t:0, life:.5, o:q, col:'#ff8a00' }); shake = Math.min(18, shake + 8); enemies(q).forEach(function(e2){ if(Math.hypot(e2.x - q.x, e2.y - q.y) < 180) hurt(e2, 60, q, { area:true }); }); } burst(q.x, q.y, 12, '#fff', 200, .5); shake = Math.min(18, shake + 10); flash = .25; blood(q, how === 'shot' ? q.lastHit : null, true);
      var kd = q.lastHit && how === 'shot' ? sgn(q.lastHit.vx) || 1 : (Math.random() < .5 ? -1 : 1); corpses.push({ x:q.x, y:q.y, vx:kd*rnd(140, 260) + (q.lastHit && how === 'shot' ? q.lastHit.vx*.15 : 0), vy:-rnd(220, 380), rot:0, vr:kd*rnd(4, 8), t:0, life:1.5, s:q.r/12, col:q.uni ? UNI[q.uni] : q.col, face:q.face || 1, look:lookOf(q) });   /* the body tumbles away from the shot with crossed-out eyes and fades */ if(src && src === players[0]){ score += 150; api.score(score); }
      var alive = players.filter(function(p){ return p.alive; }); if(alive.length <= 1 && phase === 'fight') endPoint(alive[0] || null); }

    /* ---- bullets ---- */
    function stepBullet(b, dt){ var S = b.S, p = b.o; b.t += dt; if(b.t > b.life) return false; var ts = b.slowT > 0 ? .3 : 1; if(b.slowT > 0) b.slowT -= dt;
      if(b.stasis > 0){ if(b.t > .12){ b.stasis -= dt; ts = .04; } }
      if(b.fw){ b.fw -= dt; if(b.fw <= 0){ for(var f = 0; f < 6; f++){ var nb = spawnBullet(p, b.x, b.y, f/6*Math.PI*2 + rnd(-.2, .2), { dmgM:.45, sub:true }); nb.life = .9; nb.bounces = 0; } burst(b.x, b.y, 10, '#ffd166', 220, .4); return false; } }
      if(b.boom){ b.boom -= dt; if(b.boom <= 0){ b.boom = 0; b.returning = true; } } if(b.returning && p.alive){ var da = Math.atan2(p.y - b.y, p.x - b.x), spd = Math.hypot(b.vx, b.vy); var ca = Math.atan2(b.vy, b.vx), diff = Math.atan2(Math.sin(da - ca), Math.cos(da - ca)); ca += clamp(diff, -6*dt, 6*dt); b.vx = Math.cos(ca)*spd; b.vy = Math.sin(ca)*spd; if(Math.hypot(p.x - b.x, p.y - b.y) < p.r + 8 && b.t > .4) return false; }
      else b.vy += b.grav*dt*ts;
      var hom = S.homing + (S.targetBounce && b.bcount > 0 ? .5 : 0); if(hom && !b.returning){ var e = nearestTo(b, p, true); if(e){ var want = Math.atan2(e.y - b.y, e.x - b.x), cur = Math.atan2(b.vy, b.vx), dd = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)), spd2 = Math.hypot(b.vx, b.vy); cur += clamp(dd, -hom*2.6*dt, hom*2.6*dt); b.vx = Math.cos(cur)*spd2; b.vy = Math.sin(cur)*spd2; } }
      if(S.remote && !p.cpu && !b.returning){ var want2 = Math.atan2(mouse.y - b.y, mouse.x - b.x), cur2 = Math.atan2(b.vy, b.vx), d2 = Math.atan2(Math.sin(want2 - cur2), Math.cos(want2 - cur2)), sp3 = Math.hypot(b.vx, b.vy); cur2 += clamp(d2, -4*dt, 4*dt); b.vx = Math.cos(cur2)*sp3; b.vy = Math.sin(cur2)*sp3; }
      if(S.grow || S.star) b.dmg += b.baseDmg == null ? (b.baseDmg = b.dmg, 0) : b.baseDmg*S.grow*.55*dt*ts;
      if(b.spin != null) b.spin += dt*18;
      var steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy)*dt*ts/6)), sx = b.vx*dt*ts/steps, sy = b.vy*dt*ts/steps;
      for(var s = 0; s < steps; s++){ var ox = b.x, oy = b.y; b.x += sx; b.y += sy;
        if(S.wrap){ if(b.x < -b.r) b.x += W + 2*b.r; else if(b.x > W + b.r) b.x -= W + 2*b.r; if(b.y < -b.r - 30) b.y += H + 2*b.r + 30; else if(b.y > H + b.r) b.y -= H + 2*b.r + 30; }
        else if(!inMap(b.x, b.y) || b.y < -220) return false;
        /* the living map: a bullet through a crate's rope cuts it, a saw eats the bullet */
        for(var ci = 0; ci < dyn.crates.length; ci++){ var ck = dyn.crates[ci]; if(ck.state !== 'hang') continue; var rx = ck.def.x, ry0 = ck.q[1] - ck.def.ropeLen, ry1 = ck.q[1]; if(Math.abs(b.x - rx) < b.r + 4 && b.y > ry0 && b.y < ry1){ snapRope(ck, b.x, b.y); } }
        for(var si = 0; si < dyn.saws.length; si++){ var sw = dyn.saws[si]; if(Math.hypot(b.x - sw.x, b.y - sw.y) < sw.r + b.r){ burst(b.x, b.y, 5, '#ffd166', 200, .25); snd.bounce(); return false; } }
        var q = rectHit(b.x, b.y, b.r*.8);
        if(q){ var phantom = p.phantomT > 0 || S.ghost; if(phantom){ continue; } if(b.drillLeft > 0){ b.drillLeft -= Math.hypot(sx, sy); b.inWall = true; continue; }
          var fromTop = oy + b.r*.8 <= q[1] + .5 && sy > 0, fromBot = oy - b.r*.8 >= q[1] + q[3] - .5 && sy < 0, vertical = fromTop || fromBot;
          if(S.sneaky && fromTop){ b.y = oy; b.vy = -Math.abs(b.vy)*.85; sy = -Math.abs(sy); continue; }
          if(b.bounces > 0 || (S.saw && b.bounces > -1)){ b.bounces--; b.bcount++; b.x = ox; b.y = oy; if(vertical){ b.vy = -b.vy; sy = -sy; } else { b.vx = -b.vx; sx = -sx; } if(S.ricochet){ b.vx *= .5; b.vy *= .5; sx *= .5; sy *= .5; } if(S.trickster) b.dmg *= 1 + .8*Math.min(1, S.trickster/Math.max(1, b.bcount)) ; if(S.targetBounce){ var te = nearestTo(b, p, true); if(te){ var ta = Math.atan2(te.y - b.y, te.x - b.x), tsp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(ta)*tsp; b.vy = Math.sin(ta)*tsp; sx = b.vx*dt*ts/steps; sy = b.vy*dt*ts/steps; } } burst(b.x, b.y, 3, '#fff', 120, .2); continue; }
          impact(b, b.x, b.y, null); return false; }
        else if(b.inWall){ b.inWall = false; }
        for(var k = 0; k < players.length; k++){ var e2 = players[k]; if((e2 === p && (b.t < .35 || b.boom)) || !e2.alive || b.hits[e2.i]) continue; if(hitP(e2, b.x, b.y, b.r)){   /* after .35 s a bullet is live for its owner too: what bounces back is on you */
            if(e2.blockT > 0 && !(S.unblockable)){ burst(b.x, b.y, 8, '#fff', 260, .3); if(e2.S.mirror){ b.o = e2; b.S = e2.S; b.hits = {}; b.vx = -b.vx*1.1; b.vy = -b.vy*1.1; b.dmg *= 1.2; continue; } if(e2 === players[0]) num(e2.x, e2.y, 'blocked', '#fff'); return false; }
            if(e2.phantomT > 0) continue;
            b.hits[e2.i] = 1; var dealt = hurt(e2, b.dmg, p, { bullet:{ vx:b.vx, vy:b.vy, knock:S.knock*(S.thrust ? 2.2 : 1) } });
            if(S.dot3) e2.dots.push({ t:3, left:b.dmg*.7*S.dot3, src:p }); if(S.dot5) e2.dots.push({ t:5, left:b.dmg*.6*S.dot5, src:p }); if(S.bleed) e2.dots.push({ t:10, left:b.dmg*S.bleed, src:p });
            if(S.slow || b.slowHit) slowDown(e2, 1 - Math.min(.8, (S.slow || 0)*.6 + (b.slowHit || 0)), 1.6); if(S.stun && Math.random() < S.stun){ e2.stunT = Math.max(e2.stunT, .45); num(e2.x, e2.y - 14, 'stunned', '#ffd166'); } if(S.ignite) ignite(e2, b.dmg*.8*S.ignite, p, 3); if(S.hex) e2.hexT = 4;
            if(S.pierce){ continue; } impact(b, b.x, b.y, e2); return false; } } }
      if(b.trail.length > 6) b.trail.shift(); b.trail.push({ x:b.x, y:b.y }); return true; }
    function nearestTo(b, p, needLos){ var best = null, bd = 1e9; enemies(p).forEach(function(q){ var d = Math.hypot(q.x - b.x, q.y - b.y); if(d < bd && (!needLos || los(b.x, b.y, q.x, q.y))){ bd = d; best = q; } }); return best; }
    function impact(b, x, y, victim){ var S = b.S, p = b.o;
      if(S.explode){ var R = 46 + 30*S.explode; explode(x, y, R, b.dmg*.7*Math.min(2, S.explode), p, victim); }
      if(S.timed) bombs.push({ x:x, y:y, vx:0, vy:0, t:.5, o:p, r:52, dmg:b.dmg*.8, stick:true });
      if(S.toxic) zones.push({ k:'toxic', x:x, y:y, r:60 + 20*S.toxic, t:0, life:3.5, o:p, dps:8*S.toxic });
      if(S.smoke) zones.push({ k:'smoke', x:x, y:y, r:80, t:0, life:4, o:p });
      if(S.snake && !b.sub){ var q = rectHit(x, y + 4, 8) || rectHit(x, y + 12, 8); ents.push({ k:'snake', x:x, y:q ? q[1] - 8 : y, o:p, t:0, life:5, dir:p.facing || 1, dmg:Math.max(6, b.dmg*.35), plat:q }); }
      if(S.frag && !b.sub){ for(var f = 0; f < 2 + S.frag; f++){ var nb = spawnBullet(p, x, y, -Math.PI/2 + rnd(-1.1, 1.1), { dmgM:.5, sub:true }); nb.life = 1.6; nb.bounces = Math.min(1, nb.bounces); nb.hits = victim ? { } : {}; if(victim) nb.hits[victim.i] = 1; } }
      if(S.shards && !b.sub){ for(var h = 0; h < 5; h++){ var sb = spawnBullet(p, x, y, rnd(0, 7), { dmgM:.35, sub:true }); sb.vx *= .45; sb.vy *= .45; sb.life = 1; sb.grav *= .3; sb.col = '#bfe9ff'; if(victim) sb.hits[victim.i] = 1; } }
      burst(x, y, 6, p.col, 160, .3); }
    function explode(x, y, R, dmg, p, already){ zones.push({ k:'boom', x:x, y:y, r:R, t:0, life:.4, o:p, col:'#ff8a00' }); shake = Math.min(14, shake + 5); snd.explode(R);
      players.forEach(function(q){ if(!q.alive || q === p) return; var d = Math.hypot(q.x - x, q.y - y); if(d < R + q.r){ var k = 1 - Math.max(0, d - q.r)/R; if(q !== already) hurt(q, dmg*k, p, { area:true, bullet:{ vx:q.x - x, vy:q.y - y, knock:1.4 } }); else if(!q.S.immovable){ q.vx += (q.x - x)/(d || 1)*240; q.vy -= 160; } } }); }

    /* ---- bombs, zones and the odd entities ---- */
    function stepWorld(dt){
      for(var i = bombs.length - 1; i >= 0; i--){ var bm = bombs[i]; if(!bm.stick){ if(!bm.meteor) bm.vy += 900*dt; bm.x += bm.vx*dt; bm.y += bm.vy*dt; var q = rectHit(bm.x, bm.y, 5); if(q){ bm.y = q[1] - 5; bm.vx *= .5; bm.vy = 0; } } bm.t -= dt; if(bm.t <= 0){ explode(bm.x, bm.y, bm.r, bm.dmg, bm.o, null); bombs.splice(i, 1); } }
      for(var z = zones.length - 1; z >= 0; z--){ var zn = zones[z]; zn.t += dt; if(zn.follow && zn.o.alive){ zn.x = zn.o.x; zn.y = zn.o.y; }
        if(zn.k === 'heal' || zn.k === 'aqua'){ if(zn.o.alive && Math.hypot(zn.o.x - zn.x, zn.o.y - zn.y) < zn.r + zn.o.r) heal(zn.o, (zn.k === 'heal' ? 14 : 12)*dt, true); }
        else if(zn.k === 'static'){ enemies(zn.o).forEach(function(q){ if(Math.hypot(q.x - zn.x, q.y - zn.y) < zn.r){ slowDown(q, .5, .3); hurt(q, 7*dt, zn.o, { area:true, quiet:true, dot:true }); } }); }
        else if(zn.k === 'toxic'){ enemies(zn.o).forEach(function(q){ if(Math.hypot(q.x - zn.x, q.y - zn.y) < zn.r){ slowDown(q, .6, .3); hurt(q, zn.dps*dt, zn.o, { area:true, quiet:true, dot:true }); } }); }
        else if(zn.k === 'fire'){ enemies(zn.o).forEach(function(q){ if(Math.hypot(q.x - zn.x, q.y - zn.y) < zn.r + q.r*.6) ignite(q, 4*dt*60/60, zn.o, 1); }); }
        else if(zn.k === 'nova'){ enemies(zn.o).forEach(function(q){ var d = Math.hypot(q.x - zn.x, q.y - zn.y) || 1; if(d < zn.r && !q.S.immovable){ q.vx += (zn.x - q.x)/d*700*dt; q.vy += (zn.y - q.y)/d*700*dt; } }); if(zn.t >= zn.life){ enemies(zn.o).forEach(function(q){ if(Math.hypot(q.x - zn.x, q.y - zn.y) < zn.r*.6){ q.stunT = 1.1; hurt(q, 25, zn.o, { area:true }); } }); zones.push({ k:'boom', x:zn.x, y:zn.y, r:zn.r*.6, t:0, life:.5, o:zn.o, col:'#c084fc' }); shake += 8; } }
        else if(zn.k === 'barrier'){ bullets = bullets.filter(function(b){ if(b.o !== zn.o && Math.hypot(b.x - zn.x, b.y - zn.y) < zn.r){ burst(b.x, b.y, 4, '#4fd1c5', 120, .2); return false; } return true; }); }
        else if(zn.k === 'blackhole'){ bullets = bullets.filter(function(b){ if(b.o === zn.o) return true; var d = Math.hypot(b.x - zn.x, b.y - zn.y); if(d > zn.r) return true; if(d < 18){ zn.ate++; burst(b.x, b.y, 3, '#c084fc', 100, .2); return false; } b.vx += (zn.x - b.x)/d*1900*dt; b.vy += (zn.y - b.y)/d*1900*dt; return true; }); enemies(zn.o).forEach(function(q){ var d = Math.hypot(q.x - zn.x, q.y - zn.y) || 1; if(d < zn.r && !q.S.immovable){ q.vx += (zn.x - q.x)/d*520*dt; q.vy += (zn.y - q.y)/d*420*dt; } }); }
        else if(zn.k === 'wall'){ bullets = bullets.filter(function(b){ if(b.o !== zn.o && Math.abs(b.x - zn.x) < zn.w/2 + b.r && Math.abs(b.y - zn.y) < zn.h/2){ burst(b.x, b.y, 4, '#fff', 120, .2); return false; } return true; }); }
        if(zn.t >= zn.life) zones.splice(z, 1); }
      for(var e = ents.length - 1; e >= 0; e--){ var en = ents[e], o = en.o; en.t += dt;
        if(en.k === 'ring' || en.k === 'wave'){ if(en.t > (en.life || .5)) ents.splice(e, 1); continue; }
        if(en.k === 'saw'){ en.a += dt*3.2; en.tick -= dt; en.x = o.x + Math.cos(en.a)*54; en.y = o.y + Math.sin(en.a)*54; if(en.tick <= 0){ en.tick = .2; enemies(o).forEach(function(q){ if(Math.hypot(q.x - en.x, q.y - en.y) < q.r + 16) hurt(q, 11, o, { area:true, bullet:{ vx:q.x - o.x, vy:q.y - o.y, knock:.6 } }); }); } }
        else if(en.k === 'sword'){ en.cd -= dt; if(en.mode === 'orbit'){ en.a += dt*2.4; en.x = o.x + Math.cos(en.a)*46; en.y = o.y + Math.sin(en.a)*46 - 10; if(en.cd <= 0){ var st = nearest(o); if(st && Math.hypot(st.x - o.x, st.y - o.y) < 240){ en.mode = 'dart'; en.tgt = st; en.vx = (st.x - en.x); en.vy = (st.y - en.y); var L = Math.hypot(en.vx, en.vy) || 1; en.vx = en.vx/L*760; en.vy = en.vy/L*760; en.dartT = .45; } } } else { en.x += en.vx*dt; en.y += en.vy*dt; en.dartT -= dt; if(en.tgt.alive && Math.hypot(en.tgt.x - en.x, en.tgt.y - en.y) < en.tgt.r + 10){ hurt(en.tgt, 22, o, { area:true, bullet:{ vx:en.vx, vy:en.vy, knock:1 } }); en.mode = 'orbit'; en.cd = 1.1; } else if(en.dartT <= 0){ en.mode = 'orbit'; en.cd = .8; } } }
        else if(en.k === 'snake'){ en.x += en.dir*110*dt; var st2 = nearest(o); if(st2 && Math.abs(st2.y - en.y) < 40) en.dir = sgn(st2.x - en.x); if(en.plat && (en.x < en.plat[0] || en.x > en.plat[0] + en.plat[2])) en.dir = -en.dir; else if(!en.plat){ en.y += 300*dt; var pq = rectHit(en.x, en.y + 6, 4); if(pq){ en.plat = pq; en.y = pq[1] - 8; } } enemies(o).forEach(function(q){ if(Math.hypot(q.x - en.x, q.y - en.y) < q.r + 10){ hurt(q, en.dmg, o, { area:true }); q.dots.push({ t:2, left:en.dmg*.5, src:o }); en.t = 99; } }); }
        else if(en.k === 'sentry'){ en.tick -= dt; if(en.tick <= 0){ en.tick = .5; var se = nearest(o, false); if(se && los(en.x, en.y, se.x, se.y)){ var sa = Math.atan2(se.y - en.y, se.x - en.x); var sb = spawnBullet(o, en.x + Math.cos(sa)*14, en.y - 10 + Math.sin(sa)*14, sa, { dmgM:.3, free:true }); sb.grav *= .3; } } }
        else if(en.k === 'comet'){ en.vy += 1600*dt; en.y += en.vy*dt; en.x += (en.tx - en.x)*dt*2; var hitQ = rectHit(en.x, en.y, 10), hitP = enemies(o).some(function(q){ return Math.hypot(q.x - en.x, q.y - en.y) < q.r + 12; }); if(hitQ || hitP || en.y > H + 20){ explode(en.x, en.y, 80, 45, o, null); en.t = 99; } }
        else if(en.k === 'cloud'){ if(en.tgt.alive){ en.x += (en.tgt.x - en.x)*dt*3; } en.tick -= dt; if(en.tick <= 0){ en.tick = .22; var cb = spawnBullet(o, en.x + rnd(-30, 30), en.y + 16, Math.PI/2 + rnd(-.15, .15), { dmgM:.35, free:true }); cb.vx *= .3; cb.vy = 260; cb.life = 2.5; cb.col = '#c8cbd6'; } }
        if(en.t > (en.life || 9)) ents.splice(e, 1); }
      for(var pi = parts.length - 1; pi >= 0; pi--){ var pt = parts[pi]; pt.t += dt; pt.vy += (pt.g || 500)*dt; pt.x += pt.vx*dt; pt.y += pt.vy*dt; if(pt.t > pt.life) parts.splice(pi, 1); }
      for(var ci = corpses.length - 1; ci >= 0; ci--){ var co = corpses[ci]; co.t += dt; co.vy += GRAV*.6*dt; co.x += co.vx*dt; co.y += co.vy*dt; co.rot += co.vr*dt; if(co.t > co.life) corpses.splice(ci, 1); }
      for(var ni = nums.length - 1; ni >= 0; ni--){ var nm = nums[ni]; nm.t += dt; nm.y -= 34*dt; if(nm.t > .9) nums.splice(ni, 1); }
      for(var bi = beams.length - 1; bi >= 0; bi--){ beams[bi].t -= dt; if(beams[bi].t <= 0) beams.splice(bi, 1); } }

    /* ---- cpu brain ---- */
    function wallAhead(p, dir){ for(var xx = p.r + 10; xx < 340; xx += 16){ var q = rectHit(p.x + dir*xx, p.y, 2); if(q) return (!q.lava && p.y - q[1] > 120 && (xx <= 240 || groundBelow(p.x + dir*(xx - 20), p.y))) ? q : null; } return null; }   /* the first slab at body height that way, if its top is too high to hop onto: a wall worth climbing, provided a short leap reaches it or a miss lands on something */
    function reachesWall(p, dir, wq){ var x = p.x, y = p.y, vx = p.vx, vy = -JUMPV*Math.sqrt(p.S.jump), sp = MOVE*moveOf(p), gr = GRAV*(p.S.gravity || 1); for(var t = 0; t < 2; t += .05){ vx += (dir*sp - vx)*.35; x += vx*.05; vy += gr*.05; if(vy > 900) vy = 900; var y0 = y; y += vy*.05; if(y > H + 30) return false; var q = hitAt(x, y, p.r, t); if(q === wq) return y < wq[1] + wq[3] - 4; if(q) return !q.lava && vy > 0 && y0 + p.r <= q[1] + 2 + (q.vely || 0)*t; } return false; }   /* fly the leap at the wall: it must meet the face above its foot, or land on something; a head bump on an elevator overhead is a no */
    function hitAt(x, y, r, t){ for(var i = 0; i < live.length; i++){ var q = live[i], ox = q.dyn ? (q.velx || 0)*t : 0, oy = q.dyn ? (q.vely || 0)*t : 0, m = q.dyn ? 26 : 0; if(x + r > q[0] + ox - m && x - r < q[0] + ox + q[2] + m && y + r > q[1] + oy - m && y - r < q[1] + oy + q[3] + m) return q; } return null; }   /* rectHit with moving slabs advanced t seconds along their current velocity and padded 26 px, since the prediction is rough */
    function groundBelow(x, y){ for(var yy = y; yy < H + 40; yy += 16){ var q = rectHit(x, yy, 2); if(q) return !q.lava; } return false; }   /* is there anything to land on under x, from y down to the floor line */
    function lands(p, dir, vy0, cutT){ var x = p.x, y = p.y, vx = p.vx, vy = vy0 == null ? p.vy : vy0, sp = MOVE*moveOf(p), gr = GRAV*(p.S.gravity || 1), cut = false;   /* cheap ballistic look-ahead with the real air inertia: does moving this way end on a slab or in the void */
      for(var t = 0; t < 2.2; t += .05){ if(cutT != null && !cut && t >= cutT){ cut = true; if(vy < -260) vy *= .55; } vx += (dir*sp - vx)*.35; x += vx*.05; vy += gr*.05; if(vy > 900) vy = 900; var y0 = y; y += vy*.05; if(x < 6 || x > W - 6 || y > H + 30) return false; var q = rectHit(x, y, p.r); if(q) return !q.lava && vy > 0 && y0 + p.r <= q[1] + 2 && x >= q[0] + 6 && x <= q[0] + q[2] - 6; } return false; }   /* touching a slab counts as landing only from above; a head bumped on its underside or a side wall is a miss */
    function canCross(p, dir){ var v = -JUMPV*Math.sqrt(p.S.jump); return lands(p, dir, v) ? .6 : lands(p, dir, v, .12) ? .12 : 0; }   /* how long to hold the jump so the arc ends on ground: full, a short hop, or 0 for no way across */
    function think(p, dt){ var B = p.brain, sk = SKILL[opts.skill], S = p.S, inp = { dir:0, jump:false, fire:false, block:false }; B.t -= dt; B.fireT -= dt; B.jumpT -= dt; B.strafeT -= dt; B.hold = (B.hold || 0) - dt; if(B.hold > 0) inp.jump = true;
      var hop = function(hold, cd, commit){ inp.jump = true; B.hold = hold; B.jumpT = cd; B.commit = commit || 0; };
      var seekClimb = function(dir){ if(B.climb || B.jumpT > 0 || sgn(dx) !== dir) return false; var wq = wallAhead(p, dir); if(!wq || !reachesWall(p, dir, wq)) return false; B.climb = { dir:dir, top:wq[1], t:4.5 }; hop(.5, .5, dir); return true; };   /* a tall face that way with the enemy beyond it: leap at it and start a wall climb */   /* commit: keep steering this way in the air so a planned arc is flown, not abandoned */   /* a cpu jump is held for `hold` seconds so it gets the height it planned for */
      var e = nearest(p); if(!e){ return inp; }
      var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), see = los(p.x, p.y, e.x, e.y); B.noSee = see ? 0 : (B.noSee || 0) + dt;
      /* camping: five seconds without ever getting within 260 px of an enemy (pacing a slab and trading long shots) earns a push: close in for a few seconds, then reassess. sudden death: everyone is draining, so close in and shoot faster, most of all the one with the least health, who has the least time */
      if(d <= 260) B.campT = 0; else if(B.push <= 0) B.campT += dt;
      if(B.campT > 5){ B.push = rnd(2.5, 4); B.campT = 0; B.t = 0; } B.push -= dt;
      var lowest = sudden && players.every(function(q){ return !q.alive || q === p || q.hp >= p.hp; }), panic = sudden ? (lowest ? 1 : .6) : 0;
      if(B.t <= 0){ B.t = sk.think*rnd(.7, 1.3)*(panic ? .6 : 1); var wantRange = B.range*(S.range ? .45 : 1)*(S.laser ? 1.3 : 1)*(S.homing ? 1.2 : 1)*(B.push > 0 ? .45 : 1)*(1 - .55*panic); B.dir = d > wantRange + 40 ? sgn(dx) : d < wantRange - 60 ? -sgn(dx) : (Math.random() < .5 ? -1 : 1); if(Math.random() < .25 && !panic && B.push <= 0) B.dir = 0; if((B.push > 0 || panic >= 1) && d > 120) B.dir = sgn(dx); if(!see && (B.noSee > 2.5 || Math.random() < (dy < -120 ? .85 : .6))) B.dir = sgn(dx); if(Math.abs(dx) < 40 && S.onBlock.some(function(h){ return /overpower|bombs|ignite|vampiric|shock|nova|swords|saw|implode/.test(h); }) && p.blockCd <= 0) inp.block = true; }
      if(B.noSee > 2.5 && dy > 40){ if(!B.escDir) B.escDir = Math.abs(dx) > 60 ? sgn(dx) : (Math.random() < .5 ? -1 : 1); if(!groundBelow(p.x + B.escDir*40, p.y)) B.escDir = -B.escDir; B.dir = B.escDir; } else B.escDir = 0;   /* enemy hiding below: walk off the slab, on the side that has floor */
      inp.dir = B.dir;
      if(p.onGround) B.commit = 0; else if(B.commit) inp.dir = B.commit;
      if(!p.onGround && !p.wall && !B.climb){ var cands = [inp.dir, B.commit, sgn(dx), -sgn(dx), 0, -inp.dir], ok = null; for(var ci = 0; ci < cands.length && ok === null; ci++){ if(cands[ci] != null && lands(p, cands[ci])) ok = cands[ci]; } if(ok !== null && ok !== inp.dir){ inp.dir = ok; B.dir = ok; } }   /* airborne: keep the first heading that ends on a slab, never drift into the void */
      if(p.onGround && inp.dir && B.jumpT <= 0 && Math.abs(dx) > 160 && sgn(dx) === inp.dir && rectHit(p.x, p.y + p.r + 8, 2) && !rectHit(p.x + inp.dir*110, p.y + p.r + 12, 2) && !(dy > 40 && groundBelow(p.x + inp.dir*40, p.y))){ if((B.cross = canCross(p, inp.dir))) hop(B.cross, .9, inp.dir); else seekClimb(inp.dir); }   /* a gap is coming and the enemy is past it: take off early, while the arc still clears whatever hangs over the gap; no arc lands but a tall face is over there: go climb it */
      dyn.saws.forEach(function(sw){ var sx = sw.x + (sw.vx || 0)*.35, ahead = sgn(sx - p.x) === inp.dir && Math.abs(sx - p.x) < sw.r + 110 && Math.abs(sw.y - p.y) < sw.r + 60; var under = Math.abs(sx - p.x) < sw.r + 40 && sw.y > p.y && sw.y - p.y < sw.r + 90; if(ahead || under){ if(p.onGround && B.jumpT <= 0 && lands(p, inp.dir || sgn(dx), -JUMPV*Math.sqrt(p.S.jump))){ hop(.6, .8, inp.dir || sgn(dx)); } else if(p.onGround){ inp.dir = -sgn(sx - p.x); B.dir = inp.dir; } } });   /* a spinning blade ahead: hop it if the arc lands, else back off */
      var sd = sgn(p.vx); if(!B.climb && p.onGround && Math.abs(p.vx) > 120 && !rectHit(p.x + sd*(p.r + 18 + Math.abs(p.vx)*.1), p.y + p.r + 12, 2) && !groundBelow(p.x + sd*40, p.y)){ inp.dir = -sd; B.dir = -sd; p.vx *= .3; }   /* skidding toward an edge over the void (a landing at the lip): brake hard, whatever the plan was */
      /* do not walk off the edge unless the enemy is that way and lower */
      var ahead = rectHit(p.x + inp.dir*(p.r + 18), p.y + p.r + 12, 2), under = rectHit(p.x, p.y + p.r + 8, 2);
      if(p.onGround && under && !ahead && inp.dir){ var dropOk = dy > 40 && ((sgn(dx) === inp.dir && Math.abs(dx) > 120) || B.escDir) && groundBelow(p.x + inp.dir*40, p.y);   /* only step off when there is floor down there, the void is not a shortcut */
        if(!dropOk){ if(Math.abs(dx) > 160 && sgn(dx) === inp.dir && B.jumpT <= 0 && (B.cross = canCross(p, inp.dir))){ hop(B.cross, .9, inp.dir); } else if(seekClimb(inp.dir)){} else { inp.dir = -inp.dir; B.dir = inp.dir; if(B.escDir) B.escDir = inp.dir; if(Math.abs(dx) > 160) B.stuckT = 3; } } }
      B.stuckT = (B.stuckT || 0) - dt; if(B.stuckT > 0 && p.onGround && B.jumpT <= 0 && inp.dir && sgn(dx) === inp.dir){ var jv = -JUMPV*Math.sqrt(p.S.jump); if(lands(p, inp.dir, jv)) hop(.6, .9, inp.dir); else if(lands(p, inp.dir, jv, .12)) hop(.12, .9, inp.dir); }   /* turned back at an edge a moment ago: as it paces, take the first jump toward the enemy that lands anywhere (a platform above is a way round) */
      /* wall climb: shoved against a face too tall to clear in one jump, with the enemy beyond or above it, chain wall jumps up it, steering back into the face after each kick (the airborne steer above would otherwise walk it away, since a wall touch is not a landing) */
      if(p.wall && !B.climb && B.jumpT <= 0 && (sgn(dx) === p.wall || dy < -120)){ var wq = rectHit(p.x + p.wall*(p.r + 6), p.y, 2); if(wq && !wq.lava && p.y - wq[1] > 120) B.climb = { dir:p.wall, top:wq[1], t:4 }; }
      if(B.climb){ var Cm = B.climb; Cm.t -= dt; inp.dir = Cm.dir; B.dir = Cm.dir; B.commit = Cm.dir; if(p.wall === Cm.dir && B.jumpT <= 0 && p.y > Cm.top - p.r) hop(.35, .4, Cm.dir); if(Cm.t <= 0 || (p.onGround && Cm.t < 3.7)) B.climb = null; }
      else if(p.wall && inp.dir === p.wall && B.jumpT <= 0){ hop(.5, .6); }
      if(B.noSee > 3 && p.onGround && B.jumpT <= 0 && Math.random() < dt*1.2){ hop(.6, .9); }   /* lost sight for a while: explore upward, the airborne steer keeps it off the void */
      if(dy < -60 && Math.abs(dx) < 260 && (p.onGround || p.wall) && B.jumpT <= 0 && Math.random() < dt*1.6){ hop(.5, .8); }
      var incoming = null; bullets.forEach(function(b){ if(b.o === p || b.free2 && b.o === p) return; var tt = 0; for(var k = 1; k <= 6; k++){ var fx = b.x + b.vx*k*.05, fy = b.y + b.vy*k*.05 + .5*b.grav*(k*.05)*(k*.05); if(Math.hypot(fx - p.x, fy - p.y) < p.r + b.r + 8){ tt = k*.05; break; } } if(tt && (!incoming || tt < incoming.tt)) incoming = { b:b, tt:tt }; });
      if(incoming){ if(incoming.tt <= sk.react && p.blockCd <= 0 && Math.random() < sk.blockP) inp.block = true; else if(p.onGround && B.jumpT <= 0 && Math.random() < sk.dodge){ hop(lands(p, inp.dir, -JUMPV*Math.sqrt(p.S.jump), .12) ? .12 : .5, .7); } }
      /* aim with lead and gravity compensation */
      var bs = BSPEED*S.speed, tt2 = clamp(d/bs, 0, 1.4), ax = e.x + e.vx*tt2*.8*sk.lead, ay = e.y + e.vy*tt2*.4*sk.lead - .5*BGRAV*S.grav*tt2*tt2*(.4 + .6*sk.lead); var want = Math.atan2(ay - p.y, ax - p.x);   /* a weak cpu leads less and under-compensates gravity, so it shoots behind and low at range */
      if(p.confuseT > 0) want += rnd(-1.5, 1.5); B.err = B.err == null ? 0 : B.err + (rnd(-sk.err, sk.err) - B.err)*Math.min(1, dt*3); var smoke = zones.some(function(z){ return z.k === 'smoke' && Math.hypot(z.x - e.x, z.y - e.y) < z.r; }); want += B.err*(smoke ? 4 : 1);
      var da = Math.atan2(Math.sin(want - p.aim), Math.cos(want - p.aim)); p.aim += clamp(da, -sk.aimSpd*dt, sk.aimSpd*dt);
      if(see && Math.abs(da) < (panic ? .4 : .25) && p.ammo > 0 && p.reloadT <= 0 && B.fireT <= 0 && d < (S.range ? 260 : 800)){ inp.fire = true; if(S.atk < .12 && sk.fireK <= 1) inp.fire = true; else B.fireT = Math.max(sk.minGap*(panic ? .6 : 1), (S.atk*rnd(.9, 1.4) + (Math.random() < .3 && !panic ? .3 : 0))*sk.fireK*(1 - .4*panic)); }
      if(S.remote && !see) inp.fire = false;
      return inp; }
    /* how strong a deck is: damage per second over a full ammo cycle, weighted by how likely the shots land, times staying power */
    function powerOf(p, extra){ var S = baseStats(); p.cards.concat(extra ? [extra] : []).forEach(function(k){ if(!k.instant) k.apply(S, p); }); p.lootbox.forEach(function(fx){ fx(S); });
      var ammo = Math.max(1, Math.round(S.ammo)), atk = Math.max(.05, S.atk), reload = Math.max(.25, S.reload), hp = Math.max(20, S.hp), spread = clamp(S.spread, 0, .8);
      var perShot = S.dmg*S.bullets*(1 + S.burst*.7)*(1 + S.bounces*.08)*(1 + S.explode*.4 + S.homing*.3 + S.dot3*.4 + S.dot5*.5 + S.grow*.2 + S.ignite*.4 + S.steal*.3)*(1 - spread*.5)*(S.demonic ? .8 : 1);
      var dps = perShot*ammo/(ammo*atk + reload)*Math.min(1.5, .55 + .45*S.speed);
      var def = hp*(1 + S.blocks*.1 + (S.onBlock.length ? .15 : 0) + S.regen*.01 + (S.phoenix ? .35 : 0))*(.85 + .15*Math.min(2, S.move))*(1 + Math.min(1, S.jumps - 1)*.05);
      return Math.pow(dps, .75)*Math.pow(def, .55); }
    function cpuPick(p){ var sk = SKILL[opts.skill], iq = sk.iq, base = powerOf(p), best = null, bs = -Infinity, e = players[0];
      hand.forEach(function(k){ var gut = (RAR[k.rarity].w > 30 ? 1 : RAR[k.rarity].w > 8 ? 2 : RAR[k.rarity].w > 1 ? 3 : 4)*.6;   /* the old instinct: rarer looks better */
        var gain = k.instant ? 1.05 + (k.rarity === 'rare' ? .1 : 0) : powerOf(p, k)/Math.max(1e-6, base);
        if(k.cursed) gain *= .7; if(k.id === 'glass' && p.cards.length > 4) gain *= .6; if(k.id === 'demonic') gain *= .85; if(k.rarity === 'curse') gain *= .5;
        if(e && e.alive !== undefined && e.S.bullets >= 4 && k.tags[0] === 'block') gain *= 1.08;   /* facing a spray: a block card is worth more */
        var smart = (gain - 1)*10, s = iq*smart + (1 - iq)*gut + rnd(0, 1.5*(1 - iq)); if(s > bs){ bs = s; best = k; } });
      return best || hand[0]; }

    /* ---- update ---- */
    function stepBlinks(dt){ players.forEach(function(p){ p.blinkClock += dt; if(p.blinkClock >= 6){ p.blinkClock -= 6; if(Math.random() < .315) p.blinkT = .147; } if(p.blinkT > 0) p.blinkT -= dt; if(p.hurtT > 0) p.hurtT -= dt; if(p.happyT > 0) p.happyT -= dt; }); }   /* every six seconds a 31.5% chance to blink for .147 s; hurtT and happyT drive the expressions */
    g.stop = function(){ MUSIC.stop(); }; g.wake = function(){ MUSIC.start(); };   /* the framework's start click wakes the music without acting in the game */
    g.update = function(dt){ t += dt; if(bannerT > 0) bannerT -= dt; if(players) stepBlinks(dt); MUSIC.setMode(phase === 'fight' ? 'fight' : phase === 'pointend' ? 'drop' : 'menu'); if(pickNoteT > 0) pickNoteT -= dt; if(shake > 0) shake = Math.max(0, shake - dt*30); if(flash > 0) flash -= dt; if(helpT > 0) helpT -= dt;
      if(phase === 'setup' || phase === 'over' || phase === 'matchend') return;
      if(phase === 'locker'){ stepLocker(dt); return; }
      if(phase === 'pick'){ if(picker && picker.cpu && hand){ cpuPickT -= dt; cpuBrowseT -= dt; if(!cpuChoice || hand.indexOf(cpuChoice) < 0) cpuChoice = cpuPick(picker); if(cpuPickT > .45){ if(cpuBrowseT <= 0){ cpuBrowseT = rnd(.25, .55); handSel = ri(0, hand.length - 1); snd.tick(); } } else handSel = hand.indexOf(cpuChoice);   /* it reads the hand card by card, then its cursor settles on the one it wants for the last beat */
        if(cpuPickT <= 0){ var k = cpuChoice; cpuChoice = null; takeCard(picker, k); } }
        else if(picker && hand){ pickClock += dt; if(pickClock >= PICK_LIMIT){ var ak = hand[handSel] || hand[0]; note('auto-picked '+ak.name); takeCard(picker, ak); } }   /* a person gets 45 s, then the card under the cursor is taken for them; cpus keep their own clock */
        return; }
      var sdt = dt*slow;
      if(phase === 'countdown'){ var cdPrev = Math.ceil(countdown); countdown -= dt; if(Math.ceil(countdown) !== cdPrev && countdown > 0) snd.tick(); stepMap(dt); players.forEach(function(p){ if(p.alive){ p.vy += GRAV*dt; resolve(p, dt); } }); if(countdown <= 0){ phase = 'fight'; say('FIGHT', .7); snd.fight(); } return; }
      if(phase === 'pointend'){ endT -= dt; stepMap(sdt); players.forEach(function(p){ if(p.alive){ var inp = p.cpu ? { dir:0, jump:false, fire:false, block:false } : readInput(p); stepPlayer(p, sdt, inp); } }); bullets = bullets.filter(function(b){ return stepBullet(b, sdt); }); drainRetal(); stepWorld(sdt); if(endT <= 0) afterPoint(); return; }
      /* fight */
      stepMap(sdt);
      players.forEach(function(p){ if(!p.alive) return; if(p.refreshCd > 0) p.refreshCd -= sdt; var inp = p.cpu ? think(p, sdt) : readInput(p); stepPlayer(p, sdt, inp); });
      bullets = bullets.filter(function(b){ return stepBullet(b, sdt); }); drainRetal(); stepWorld(sdt);
      fightT += sdt; noDmgT += sdt; if(fightT > 30 && noDmgT > 12 && !sudden){ sudden = true; say('SUDDEN DEATH', 1.8); } if(sudden) players.forEach(function(p){ if(p.alive) hurt(p, 5*sdt, null, { area:true, quiet:true, dot:true, drain:true }); });
      if(phase === 'fight' && players.filter(function(p){ return p.alive; }).length <= 1){ var al = players.filter(function(p){ return p.alive; }); endPoint(al[0] || null); } };
    function readInput(p){ var onRope = !!p.rope, inp = { dir:(held.R ? 1 : 0) - (held.L ? 1 : 0), jump:!!(onRope ? (held.J || jumpTap) : (held.U || held.J || jumpTap)), climb:(held.D ? 1 : 0) - (held.U ? 1 : 0), fire:!!(mouseDown || held.F), block:!!(rightDown || held.B), grab:!!(held.G || grabTap) }; jumpTap = false; grabTap = false; return inp; }

    /* ---- input ---- */
    g.key = function(k, down){ MUSIC.start(); if(down && (k === 'm' || k === 'M')){ say(MUSIC.toggle() ? 'music on' : 'music off', 1); return true; }
      if(phase === 'matchend'){ if(!down) return true; if(k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd' || k === 'A' || k === 'D' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 's' || k === 'W' || k === 'S'){ matchSel = 1 - matchSel; snd.tick(); return true; } if(k === ' ' || k === 'Enter'){ if(matchSel === 0) extendMatch(); else endMatch(); return true; } if(k === 'e' || k === 'E'){ extendMatch(); return true; } return /^Arrow/.test(k); }
      if(phase === 'setup'){ if(!down) return true; var row = SETUP[setupSel]; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ setupSel = (setupSel + SETUP.length - 1) % SETUP.length; return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ setupSel = (setupSel + 1) % SETUP.length; return true; }
        if(k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd' || k === 'A' || k === 'D'){ if(row.id === 'go') return true; var dir = (k === 'ArrowLeft' || k === 'a' || k === 'A') ? -1 : 1, idx = row.vals.indexOf(opts[row.id]); opts[row.id] = row.vals[(idx + dir + row.vals.length) % row.vals.length]; return true; }
        if(k === ' ' || k === 'Enter'){ if(row.id === 'go'){ remember(); startMatch(); } else if(row.vals.length === 2){ opts[row.id] = row.vals[(row.vals.indexOf(opts[row.id]) + 1) % 2]; } else setupSel = SETUP.length - 1; return true; } return /^Arrow/.test(k); }
      if(phase === 'locker'){ if(!down) return true; var me = players[0], LR = LOCK[locker.sel]; if(k === 'ArrowUp' || k === 'w' || k === 'W'){ locker.sel = (locker.sel + LOCK.length - 1) % LOCK.length; return true; } if(k === 'ArrowDown' || k === 's' || k === 'S'){ locker.sel = (locker.sel + 1) % LOCK.length; return true; }
        if(k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd' || k === 'A' || k === 'D'){ if(LR.id !== 'ready' && !locker.ready[0]){ cycleLook(me, LR.id, (k === 'ArrowLeft' || k === 'a' || k === 'A') ? -1 : 1); snd.tick(); } return true; }
        if(k === ' ' || k === 'Enter'){ if(LR.id === 'ready'){ locker.ready[0] = true; snd.pick(); } else locker.sel = LOCK.length - 1; return true; } return /^Arrow/.test(k); }
      if(phase === 'pick'){ if(!down) return true; if(!picker || picker.cpu || !hand) return /^Arrow| $/.test(k); if(k === 'ArrowLeft' || k === 'a' || k === 'A'){ handSel = (handSel + hand.length - 1) % hand.length; return true; } if(k === 'ArrowRight' || k === 'd' || k === 'D'){ handSel = (handSel + 1) % hand.length; return true; } if(k === ' ' || k === 'Enter'){ takeCard(picker, hand[handSel]); return true; } if(/^[1-7]$/.test(k) && +k <= hand.length){ takeCard(picker, hand[+k - 1]); return true; } return /^Arrow/.test(k); }
      var m = { ArrowLeft:'L', a:'L', A:'L', ArrowRight:'R', d:'R', D:'R', ArrowUp:'U', w:'U', W:'U', ArrowDown:'D', s:'D', S:'D', ' ':'J', x:'F', X:'F', j:'F', J:'F', Shift:'B', z:'B', Z:'B', k:'B', K:'B', Control:'B', e:'G', E:'G', c:'G', C:'G' }[k]; if(!m) return false; held[m] = down; if(down && m === 'J') jumpTap = true; if(down && m === 'G') grabTap = true; if((m === 'F' || m === 'B') && down) autoAim = autoAim || api.touch; return true; };
    g.pointer = function(type, x, y, e){ if(type === 'down') MUSIC.start();
      if(phase === 'matchend'){ var MB = matchButtons(); for(var mi = 0; mi < MB.length; mi++){ var mb = MB[mi]; if(x >= mb.x && x <= mb.x + mb.w && y >= mb.y && y <= mb.y + mb.h){ matchSel = mi; if(type === 'down'){ if(mi === 0) extendMatch(); else endMatch(); } return; } } return; }
      if(phase === 'setup'){ if(type !== 'down') return; var top = setupTop(), row = Math.floor((y - top) / 26); if(row >= 0 && row < SETUP.length){ setupSel = row; var r = SETUP[row]; if(r.id === 'go'){ remember(); startMatch(); return; } var idx = r.vals.indexOf(opts[r.id]), dir = x < W*.62 ? -1 : 1; if(r.vals.length === 2) dir = 1; opts[r.id] = r.vals[(idx + dir + r.vals.length) % r.vals.length]; } return; }
      if(phase === 'locker'){ if(type !== 'down') return; var rows = lockerRows(), me2 = players[0]; for(var ri2 = 0; ri2 < rows.length; ri2++){ if(Math.abs(y - rows[ri2].y) <= 13 && x > W*.2 && x < W*.8){ locker.sel = ri2; var LR2 = rows[ri2].r; if(LR2.id === 'ready'){ locker.ready[0] = true; snd.pick(); } else if(!locker.ready[0]){ cycleLook(me2, LR2.id, x < W*.5 ? -1 : 1); snd.tick(); } } } return; }
      if(phase === 'pick'){ if(!hand || !picker || picker.cpu) return; var L = handLayout(), hit = -1; for(var i = 0; i < hand.length; i++){ var c = L[i]; if(x >= c.x && x <= c.x + c.w && y >= c.y - 20 && y <= c.y + c.h) hit = i; } if(hit < 0) return; if(type === 'move'){ handSel = hit; return; } if(type === 'down'){ if(hit === handSel || api.touch && hit === handSel) takeCard(picker, hand[hit]); else handSel = hit; } return; }
      if(type === 'move'){ mouse.x = x; mouse.y = y; if(!api.touch) autoAim = false; if(e && e.pointerType !== 'touch' && e.buttons === 0){ mouseDown = false; rightDown = false; } return; }   /* a release outside the stage never reaches us: a buttonless move clears the held state */
      var right = e && (e.button === 2 || (e.buttons & 2)); if(type === 'down'){ mouse.x = x; mouse.y = y; if(right) rightDown = true; else mouseDown = true; if(!api.touch) autoAim = false; } if(type === 'up'){ if(e && e.button === 2) rightDown = false; else { mouseDown = false; rightDown = false; } } };
    g.peek = function(){ var me = players[0]; return { phase:phase, sudden:sudden, W:W, H:H, pr:PR, mouseDown:!!mouseDown, rightDown:!!rightDown, fightT:+fightT.toFixed(1), opts:opts, setupSel:setupSel, locker:locker ? { t:+locker.t.toFixed(2), sel:locker.sel, ready:locker.ready.slice() } : null, music:MUSIC.state(), parts:parts.length, blood:parts.filter(function(q){ return q.blood; }).length, players:players.map(function(p){ return { name:p.name, tag:p.tag, col:p.col, look:p.look, blink:p.blinkT > 0, mood:p.happyT > 0 ? 'happy' : p.hurtT > 0 ? 'angry' : null, frenzy:p.frenzyT > 0, retal:p.retalT > 0, climb:!!(p.brain && p.brain.climb), onGround:!!p.onGround, brain:p.brain ? { dir:p.brain.dir, push:+(p.brain.push || 0).toFixed(2), campT:+(p.brain.campT || 0).toFixed(1), jumpT:+(p.brain.jumpT || 0).toFixed(2), stuckT:+(p.brain.stuckT || 0).toFixed(2), noSee:+(p.brain.noSee || 0).toFixed(1), wall:p.wall } : null, perfects:p.perfects || 0, vy:Math.round(p.vy), rope:!!p.rope, r:+p.r.toFixed(2), face:p.face, walkT:+(p.walkT || 0).toFixed(2), hp:Math.round(p.hp), maxhp:p.maxhp, alive:p.alive, x:Math.round(p.x), y:Math.round(p.y), ammo:p.ammo, points:p.points, rounds:p.rounds, cards:p.cards.map(function(k){ return k.id; }), blockCd:+(p.blockCd || 0).toFixed(2), blocking:p.blockT > 0, reloading:p.reloadT > 0, S:{ hp:Math.round(p.S.hp), dmg:+p.S.dmg.toFixed(1), reload:+p.S.reload.toFixed(2), ammo:p.S.ammo, atk:+p.S.atk.toFixed(3), speed:+p.S.speed.toFixed(2), bullets:p.S.bullets, bounces:p.S.bounces, blockCd:+p.S.blockCd.toFixed(2), move:+p.S.move.toFixed(2), onBlock:p.S.onBlock.slice() } }; }), bullets:bullets.length, hand:hand ? hand.map(function(k){ return k.id; }) : null, handSel:handSel, picker:picker ? picker.name : null, cpuPickT:+(cpuPickT || 0).toFixed(2), pickClock:+pickClock.toFixed(1), pickLimit:PICK_LIMIT, cpuChoice:cpuChoice ? cpuChoice.id : null, corpses:corpses.length, skill:SKILL[opts.skill], sizeK:SIZE_K, hats:HATS.length, faces:FACES.length, extras:EXTRAS.length, map:map ? map.name : null, countdown:+(countdown || 0).toFixed(2), banner:banner, over:over, matchSel:matchSel, extensions:extensions, winner:matchWinner ? matchWinner.name : null, score:score, cards:CARDS.length, packs:Object.keys(PACKS), maps:MAPS.length, move:MOVE, scorePipX:Math.round(scorePipX), fixed:dyn ? dyn.fixed.map(function(q){ return q.lava ? 'lava' : q.bounce ? 'pad' : 'belt'; }) : [], zones:zones.length, zoneKinds:zones.map(function(z){ return z.k; }), bombs:bombs.length, bulletOwners:bullets.map(function(b){ return b.o.name; }), bulletPos:bullets.map(function(b){ return [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy)]; }), ents:ents.length, aim:me ? +me.aim.toFixed(2) : 0, mouse:mouse }; };
    g.dbg = { start:function(o){ opts = defaults(); var color = null, first = false; if(o) Object.keys(o).forEach(function(k){ if(k === 'color') color = o[k]; else if(k === 'first') first = !!o[k]; else opts[k] = o[k]; }); makePlayers(); if(color != null){ players.slice(1).forEach(function(p){ if(p.look.color === color){ p.look.color = 0; while(colorTaken(p.look.color, p)) p.look.color++; applyLook(p); } }); setLook(players[0], { color:color }); } locker = null; if(first) startFirst(); else beginPicks(); },
      locker:function(){ startLocker(); }, hurry:function(){ if(phase === 'pick' && picker && picker.cpu){ cpuPickT = Math.min(cpuPickT, .1); return true; } return false; }, shoot:function(pi, ti){ var p = players[pi], e = players[ti]; if(!p || !e) return false; p.aim = Math.atan2(e.y - p.y, e.x - p.x); shootOnce(p, 1); return true; }, spawn:function(pi, x, y, vx, vy){ var p = players[pi]; if(!p) return false; var b = spawnBullet(p, x, y, Math.atan2(vy, vx), { dmgM:1 }); b.vx = vx; b.vy = vy; b.grav = 0; return true; }, power:function(pi, id){ return players[pi] ? +powerOf(players[pi], id ? BY[id] : null).toFixed(2) : null; }, cpuPick:function(pi){ return phase === 'pick' && hand ? cpuPick(players[pi] || picker).id : null; }, extend:function(){ return extendMatch(); }, endMatch:function(){ return endMatch(); }, look:function(pi, look){ return players[pi] ? setLook(players[pi], look) : false; }, ready:function(all){ if(phase !== 'locker') return false; if(all) locker.ready = locker.ready.map(function(){ return true; }); else locker.ready[0] = true; return true; }, dyn:function(){ return { movers:dyn.movers.map(function(m){ return { x:Math.round(m.q[0]), y:Math.round(m.q[1]) }; }), swings:dyn.swings.map(function(w){ return { a:+w.a.toFixed(3), x:Math.round(w.q[0]), y:Math.round(w.q[1]) }; }), ropes:dyn.ropes.map(function(R){ return { a:+R.a.toFixed(3), hang:R.hang ? R.hang.name : null, ex:Math.round(R.x + Math.sin(R.a)*R.len), ey:Math.round(R.y + Math.cos(R.a)*R.len) }; }), crates:dyn.crates.map(function(k){ return { state:k.state, x:Math.round(k.q[0]), y:Math.round(k.q[1]) }; }), saws:dyn.saws.map(function(sw){ return { x:Math.round(sw.x), y:Math.round(sw.y), r:sw.r }; }) }; }, snap:function(i){ var k = dyn.crates[i]; return k ? snapRope(k, k.def.x, k.q[1] - 20) : false; }, grab:function(pi){ return tryGrab(players[pi]); }, pick:function(i){ if(phase === 'pick' && hand) takeCard(picker, hand[i]); }, give:function(pi, id){ var p = players[pi], k = BY[id]; if(p && k){ if(k.instant){ k.apply(p.S, p); } else p.give(k, true); } }, kill:function(pi){ if(players[pi]) kill(players[pi], null, 'dbg'); }, hurt:function(pi, n){ if(players[pi]) hurt(players[pi], n, null, { area:true }); }, teleport:function(pi, x, y){ var p = players[pi]; if(p){ p.x = x; p.y = y; p.vx = 0; p.vy = 0; } }, card:function(id){ return BY[id] ? { id:id, name:BY[id].name, rarity:BY[id].rarity, pack:BY[id].pack, lines:BY[id].lines, desc:BY[id].desc } : null; }, cards:function(){ return CARDS.map(function(k){ return { id:k.id, name:k.name, pack:k.pack, rarity:k.rarity }; }); }, fight:function(){ if(phase === 'countdown'){ countdown = 0; phase = 'fight'; say('FIGHT', .7); } }, skip:function(){ if(phase === 'fight'){ var al = players.filter(function(p){ return p.alive; }); if(al.length <= 1) endPoint(al[0] || null); } if(phase === 'pointend') endT = 0; }, block:function(pi){ return doBlock(players[pi], true, false); }, tone:function(s){ return goodLine(s); }, pickClock:function(v){ pickClock = v; return pickClock; }, sudden:function(){ if(phase !== 'fight') return false; sudden = true; return true; }, camp:function(pi, v){ var p = players[pi]; if(!p || !p.brain) return false; p.brain.campT = v; return true; }, hand:function(ids){ if(phase !== 'pick') return false; var ks = ids.map(function(id){ return BY[id]; }).filter(Boolean); if(!ks.length) return false; hand = ks; handSel = Math.min(handSel, hand.length - 1); return true; }, layout:function(){ return hand ? handLayout() : null; }, fire:function(pi){ var p = players[pi]; p.atkT = 0; fire(p); }, map:function(name){ var i = MAPS.map(function(m){ return m.name; }).indexOf(name); if(i < 0) return false; startPoint(i); return true; }, maps:function(){ return MAPS.map(function(m){ return m.name; }); }, stats:function(pi){ return players[pi] ? players[pi].S : null; } };

    /* ---- drawing ---- */
    function setupTop(){ return H*.5 - SETUP.length*13 + 30; }
    function handLayout(){ var n = hand.length, w = Math.min(150, (W - 60)/n - 12), h = w*1.5, gap = 12, tot = n*w + (n - 1)*gap, x0 = (W - tot)/2, out = []; for(var i = 0; i < n; i++) out.push({ x:x0 + i*(w + gap), y:H*.5 - h/2 + 10, w:w, h:h }); return out; }
    var WORSE_UP = /Reload time|Block cooldown|Gravity|Body size|Spread|Bullet drop|Cooldown|Recoil/i, FLAT = { 'wide spread':-1, 'bigger body':-1, 'no spread':1, 'bullets home after bouncing':1 };
    function goodLine(s){ var k = s.trim().toLowerCase(); if(FLAT[k] != null) return FLAT[k]; var plus = s.charAt(0) === '+', minus = s.charAt(0) === '-'; if(!plus && !minus) return 0; return (plus !== WORSE_UP.test(s)) ? 1 : -1; }   /* +1 green, -1 red: a plus is bad on stats where more is worse (reload, block cooldown, gravity, body, spread); unsigned lines carry their own tone */
    function drawCard(c, k, x, y, w, h, sel, dim){ var R = RAR[k.rarity]; c.save(); if(sel){ c.shadowColor = R.col; c.shadowBlur = 26; } c.fillStyle = dim ? '#1c1d27' : '#23242f'; rr(c, x, y, w, h, 12); c.fill(); c.shadowBlur = 0; c.strokeStyle = R.col; c.lineWidth = sel ? 3 : 2; c.stroke();
      c.fillStyle = R.col; rr(c, x + 8, y + 8, w - 16, 5, 2); c.fill(); var fs = w < 120 ? 11 : 13;
      wrapText(c, k.name.toUpperCase(), x + w/2, y + 30, w - 16, fs + 1, '#fff', 800, fs + 3);
      var yy = y + 30 + (k.name.length > 12 && w < 130 ? 34 : 22); fitText(c, R.name + (k.pack !== 'vanilla' ? '  \u00b7  '+PACKS[k.pack] : ''), x + w/2, yy, w - 14, 8, R.col, 700); yy += 14;
      if(k.desc){ yy = wrapText(c, k.desc, x + w/2, yy + 4, w - 18, w < 110 ? 8 : 9, 'rgba(255,255,255,.8)', 600, w < 110 ? 10 : 11) + 6; }
      k.lines.forEach(function(s){ if(yy > y + h - 20) return; var gd = goodLine(s); fitText(c, s, x + w/2, yy, w - 14, 9, gd > 0 ? '#7ee081' : gd < 0 ? '#ff6b6b' : '#c8cbd6', 700); yy += 12; });
      if(k.cursed) text(c, '+ a random curse', x + w/2, y + h - 14, 8, '#ff5f57', 'center', 700);
      rareFx(c, k, x, y, w, h, sel);
      c.restore(); }
    /* rarity animations, all subtle and clipped to the card: uncommon breathes, rare adds a slow light sweep, legendary adds drifting sparkles and a warmer sweep, a curse flickers */
    function rareFx(c, k, x, y, w, h, sel){ var r = k.rarity, R = RAR[r], ph = (k.id.length*.7 + k.id.charCodeAt(0)*.13) % 6.28; if(r === 'common') return; c.save(); rr(c, x, y, w, h, 12); c.clip();
      var breathe = .5 + .5*Math.sin(t*1.6 + ph);
      if(r === 'curse'){ var fl = Math.sin(t*9 + ph) > .6 ? .16 : .05; c.fillStyle = 'rgba(255,59,59,'+fl+')'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(255,95,87,'+(.25 + .35*breathe)+')'; c.lineWidth = 2; rr(c, x + 3, y + 3, w - 6, h - 6, 10); c.stroke(); c.restore(); return; }
      c.strokeStyle = R.col; c.globalAlpha = (r === 'uncommon' ? .1 : .18) + .25*breathe; c.lineWidth = r === 'legendary' ? 5 : 3; rr(c, x + 2, y + 2, w - 4, h - 4, 11); c.stroke(); c.globalAlpha = 1;
      if(r === 'rare' || r === 'legendary'){ var per = r === 'legendary' ? 2.6 : 3.4, u = ((t*.9 + ph) % per)/per, sx = x - w*.5 + u*(w*2.2); c.save(); c.translate(sx, y); c.rotate(-.5); var gr = c.createLinearGradient(-18, 0, 18, 0); var tint = r === 'legendary' ? '255,215,120' : '232,121,249'; gr.addColorStop(0, 'rgba('+tint+',0)'); gr.addColorStop(.5, 'rgba('+tint+','+(r === 'legendary' ? .22 : .14)+')'); gr.addColorStop(1, 'rgba('+tint+',0)'); c.fillStyle = gr; c.fillRect(-18, -h, 36, h*3); c.restore(); }
      if(r === 'legendary'){ for(var i = 0; i < 7; i++){ var sp = (t*.25 + i*.143 + ph*.05) % 1, px = x + 10 + ((i*67 + Math.floor((t*.25 + i*.143 + ph*.05))*31) % (w - 20)), py = y + h - 8 - sp*(h - 16), tw = .5 + .5*Math.sin(t*6 + i*1.9), sz = 1.2 + 1.6*tw; c.fillStyle = 'rgba(255,225,140,'+(.35 + .55*tw)*(1 - sp)+')'; c.beginPath(); c.moveTo(px, py - sz*2); c.lineTo(px + sz*.6, py); c.lineTo(px, py + sz*2); c.lineTo(px - sz*.6, py); c.closePath(); c.fill(); } }
      c.restore(); }
    function fitText(c, s, cx, y, maxW, size, col, weight){ c.font = (weight || 600)+' '+size+'px '+FONT; while(size > 6 && c.measureText(s).width > maxW){ size -= .5; c.font = (weight || 600)+' '+size+'px '+FONT; } text(c, s, cx, y, size, col, 'center', weight); }   /* shrink to the card, never spill past its frame */
    function wrapText(c, s, cx, y, maxW, size, col, weight, lh){ c.font = (weight || 600)+' '+size+'px '+FONT; var words = s.split(' '), line = '', lines = []; words.forEach(function(w){ var tst = line ? line+' '+w : w; if(c.measureText(tst).width > maxW && line){ lines.push(line); line = w; } else line = tst; }); if(line) lines.push(line); lines.forEach(function(l, i){ text(c, l, cx, y + i*lh, size, col, 'center', weight); }); return y + lines.length*lh; }
    function drawPlayer(c, p){ var r = p.r, col = p.uni ? UNI[p.uni] : p.col, s = r/12, f = p.face || 1, aL = f > 0 ? p.aim : Math.atan2(Math.sin(p.aim), -Math.cos(p.aim)), rec = p.recoil || 0; if(p.recoil > 0) p.recoil -= .5;
      c.save(); if(p.phantomT > 0) c.globalAlpha = .45; if(p.flipT > 0){ c.translate(p.x, p.y); c.scale(1, -1); c.translate(-p.x, -p.y); }
      drawChibi(c, p.x - (p.rope ? f*8*s : 0), p.y, s, col, f, p.walkT || 0, !p.onGround && !p.wall && !p.rope, Math.abs(p.vx) < 15 || !p.onGround, { aim:aL, stun:p.stunT > 0 || p.silenceT > 0, lowHp:p.hp < p.maxhp*.3, squash:p.squashT > 0 ? p.squashT/.16 : 0, blink:p.blinkT > 0, hang:!!p.rope, look:lookOf(p), t:t, mood:p.happyT > 0 ? 'happy' : p.hurtT > 0 ? 'angry' : null,
        gun:function(gx, gy, a, sc){ c.save(); c.translate(gx - Math.cos(a)*rec*sc*.6, gy - Math.sin(a)*rec*sc*.6); c.rotate(a); var L = 20*sc*(p.S.size > 1 ? Math.min(1.5, Math.sqrt(p.S.size)) : 1); c.fillStyle = '#6a7088'; rr(c, -6*sc, -4*sc, L, 8*sc, 2.5*sc); c.fill(); c.strokeStyle = '#14151d'; c.lineWidth = 1.4*sc; rr(c, -6*sc, -4*sc, L, 8*sc, 2.5*sc); c.stroke(); c.fillStyle = '#9aa1b8'; rr(c, L - 10*sc, -2.8*sc, 10*sc, 5.6*sc, 2*sc); c.fill(); c.fillStyle = '#3a3e4f'; rr(c, -5*sc, 2*sc, 6*sc, 7*sc, 1.5*sc); c.fill();   /* gunmetal body with a dark outline and a lighter barrel so it reads against the arena (QA r28: the old #20222c vanished into the background) */ if(p.S.laser){ c.fillStyle = '#ff5f57'; c.fillRect(L - 8*sc, -1.2*sc, 5*sc, 2.4*sc); } c.restore(); } });
      c.translate(p.x, p.y);
      if(p.blockT > 0){ var bk = p.blockT/.3; c.strokeStyle = 'rgba(255,255,255,'+(.3 + bk*.6)+')'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, -r*.35, r*1.5 + 6 + (1 - bk)*10, r*2 + 6 + (1 - bk)*10, 0, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,'+(bk*.18)+')'; c.fill(); }
      if(p.hexT > 0){ c.strokeStyle = 'rgba(192,132,252,.8)'; c.lineWidth = 2; c.setLineDash([3, 4]); c.beginPath(); c.ellipse(0, -r*.35, r*1.4 + 4, r*1.9 + 4, 0, t*3, t*3 + 5); c.stroke(); c.setLineDash([]); }
      if(p.slowK < 1){ c.fillStyle = 'rgba(79,209,197,.35)'; c.beginPath(); c.ellipse(0, -r*.35, r*1.4 + 3, r*1.9 + 3, 0, 0, 7); c.fill(); }
      c.restore();
      /* bars */
      var bw = 40, bx = p.x - bw/2, by = p.y - p.r*2 - 16; c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, bx, by, bw, 6, 3); c.fill(); c.fillStyle = p.hp > p.maxhp*.35 ? '#7ee081' : '#ff6b6b'; rr(c, bx, by, bw*clamp(p.hp/p.maxhp, 0, 1), 6, 3); c.fill();
      if(p.brawlT > 0 || (p.S.pristine && p.hp > p.maxhp*.9)){ c.strokeStyle = '#ffd166'; c.lineWidth = 1.5; rr(c, bx - 1, by - 1, bw + 2, 8, 4); c.stroke(); }
      /* ammo pips + block ring below */
      var pips = Math.min(p.S.ammo, 14), pw = Math.min(6, (bw)/pips); for(var i = 0; i < pips; i++){ c.fillStyle = i < Math.round(p.ammo*pips/p.S.ammo) ? '#fff' : 'rgba(255,255,255,.22)'; c.fillRect(bx + i*pw, by + 8, pw - 1.5, 3); }
      if(p.reloadT > 0){ c.fillStyle = 'rgba(255,209,102,.9)'; rr(c, bx, by + 8, bw*(1 - p.reloadT/p.reloadFull), 3, 1); c.fill(); }
      if(p.blockCd > 0){ c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y + p.r*1.35, p.r*.9, -Math.PI/2, -Math.PI/2 + Math.PI*2*(1 - p.blockCd/p.S.blockCd)); c.stroke(); }
      text(c, p.tag, p.x, by - 8, 9, 'rgba(255,255,255,.7)', 'center', 700); }
    function slab(c, q, col){ c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, q[0] + 4, q[1] + 6, q[2], q[3], 6); c.fill(); c.fillStyle = col || '#e9e7e1'; rr(c, q[0], q[1], q[2], q[3], 6); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; rr(c, q[0], q[1] + q[3]*.55, q[2], q[3]*.45, 6); c.fill(); }
    function rope(c, x0, y0, x1, y1, w){ c.strokeStyle = '#3a2f22'; c.lineWidth = (w || 3) + 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#c9a86a'; c.lineWidth = w || 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    function drawMap(c){
      map.rects.forEach(function(q){ slab(c, q); });
      dyn.fixed.forEach(function(q){ if(q.lava){ c.fillStyle = 'rgba(255,95,87,.25)'; rr(c, q[0] - 6, q[1] - 10, q[2] + 12, q[3] + 10, 8); c.fill(); c.fillStyle = '#ff5f57'; rr(c, q[0], q[1], q[2], q[3], 4); c.fill(); c.fillStyle = '#ffb347'; for(var lx = q[0] + 10; lx < q[0] + q[2] - 6; lx += 26){ c.beginPath(); c.arc(lx + Math.sin(dynT*2 + lx)*4, q[1] + 6 + Math.cos(dynT*3 + lx)*3, 4, 0, 7); c.fill(); } }
        else if(q.bounce){ slab(c, q, '#7ee081'); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.beginPath(); for(var bx = q[0] + 8; bx < q[0] + q[2] - 6; bx += 12){ c.moveTo(bx, q[1] + q[3] - 4); c.lineTo(bx + 6, q[1] + 4); } c.stroke(); }
        else if(q.belt){ slab(c, q, '#5a5f73'); c.fillStyle = 'rgba(255,255,255,.45)'; var off = (dynT*q.belt) % 28; for(var cx = q[0] + ((off % 28) + 28) % 28 - 28; cx < q[0] + q[2]; cx += 28){ var x0 = Math.max(q[0] + 3, cx), x1 = Math.min(q[0] + q[2] - 3, cx + 10); if(x1 > x0){ rr(c, x0, q[1] + 4, x1 - x0, Math.max(2, q[3] - 8), 2); c.fill(); } } } });
      dyn.movers.forEach(function(m){ var P = m.def.path; c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(P[0][0], P[0][1] - m.q[3]/2); c.lineTo(P[1][0], P[1][1] - m.q[3]/2); c.stroke(); c.setLineDash([]); slab(c, m.q, '#d9e6f2'); c.fillStyle = 'rgba(90,180,255,.5)'; rr(c, m.q[0] + 6, m.q[1] + m.q[3] - 5, m.q[2] - 12, 3, 1.5); c.fill(); });
      dyn.swings.forEach(function(w){ var d = w.def, q = w.q; rope(c, d.ax, d.ay, q[0] + 8, q[1] + 4); rope(c, d.ax, d.ay, q[0] + q[2] - 8, q[1] + 4); c.fillStyle = '#5a5f73'; c.beginPath(); c.arc(d.ax, d.ay, 7, 0, 7); c.fill(); slab(c, q, '#f2e8d5'); });
      dyn.ropes.forEach(function(R){ var ex = R.x + Math.sin(R.a)*R.len, ey = R.y + Math.cos(R.a)*R.len; rope(c, R.x, R.y, ex, ey, 4); c.fillStyle = '#5a5f73'; c.beginPath(); c.arc(R.x, R.y, 6, 0, 7); c.fill(); c.fillStyle = '#8a6a3a'; c.beginPath(); c.arc(ex, ey, 6, 0, 7); c.fill(); if(!R.hang && phase === 'fight' && players[0] && players[0].alive && !players[0].rope && ropeDist(R, players[0].x, players[0].y).d < players[0].r + 16){ text(c, api.touch ? 'grab' : 'E  grab', ex, ey + 20, 10, 'rgba(255,255,255,.75)', 'center', 700); } });
      dyn.crates.forEach(function(k){ if(k.state === 'gone') return; var q = k.q; if(k.state === 'hang'){ rope(c, k.def.x, q[1] - k.def.ropeLen, k.def.x, q[1], 3); c.fillStyle = '#5a5f73'; c.beginPath(); c.arc(k.def.x, q[1] - k.def.ropeLen, 6, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, q[0] + 4, q[1] + 6, q[2], q[3], 4); c.fill(); c.fillStyle = '#b07a3c'; rr(c, q[0], q[1], q[2], q[3], 4); c.fill(); c.strokeStyle = '#7a4f1e'; c.lineWidth = 3; c.strokeRect(q[0] + 3, q[1] + 3, q[2] - 6, q[3] - 6); c.beginPath(); c.moveTo(q[0] + 4, q[1] + 4); c.lineTo(q[0] + q[2] - 4, q[1] + q[3] - 4); c.moveTo(q[0] + q[2] - 4, q[1] + 4); c.lineTo(q[0] + 4, q[1] + q[3] - 4); c.stroke(); });
      dyn.saws.forEach(function(sw){ var d = sw.def; if(d.path){ c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(d.path[0][0], d.path[0][1]); c.lineTo(d.path[1][0], d.path[1][1]); c.stroke(); c.setLineDash([]); }
        c.save(); c.translate(sw.x, sw.y); c.rotate(sw.ang); c.fillStyle = '#9aa0b4'; c.beginPath(); for(var i = 0; i < 16; i++){ var a0 = i/16*Math.PI*2, a1 = (i + .5)/16*Math.PI*2, a2 = (i + 1)/16*Math.PI*2; c.lineTo(Math.cos(a0)*sw.r, Math.sin(a0)*sw.r); c.lineTo(Math.cos(a1)*(sw.r*.82), Math.sin(a1)*(sw.r*.82)); c.lineTo(Math.cos(a2)*sw.r, Math.sin(a2)*sw.r); } c.closePath(); c.fill(); c.fillStyle = '#6a7088'; c.beginPath(); c.arc(0, 0, sw.r*.55, 0, 7); c.fill(); c.fillStyle = '#2b2d3d'; c.beginPath(); c.arc(0, 0, sw.r*.16, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, sw.r*.7, 0, 1.2); c.stroke(); c.restore(); }); }
    function drawArena(c){ var bgc = c.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#2b2d3d'); bgc.addColorStop(1, '#1b1c28'); c.fillStyle = bgc; c.fillRect(0, 0, W, H);
      c.save(); if(shake > 0) c.translate(rnd(-shake, shake)*.4, rnd(-shake, shake)*.4);
      /* zones under everything */
      zones.forEach(function(z){ var k = z.t/z.life; if(z.k === 'heal' || z.k === 'aqua'){ c.fillStyle = 'rgba(126,224,129,'+(.16*(1 - k) + .06)+')'; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(126,224,129,.6)'; c.lineWidth = 2; c.stroke(); }
        else if(z.k === 'static'){ c.fillStyle = 'rgba(90,180,255,'+(.14 + Math.sin(t*20)*.05)+')'; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(160,220,255,.8)'; c.lineWidth = 1.5; c.setLineDash([4, 6]); c.stroke(); c.setLineDash([]); }
        else if(z.k === 'toxic'){ c.fillStyle = 'rgba(126,224,129,'+(.22*(1 - k*.5))+')'; for(var i = 0; i < 5; i++){ c.beginPath(); c.arc(z.x + Math.cos(t*.8 + i)*z.r*.35, z.y + Math.sin(t*.6 + i*2)*z.r*.3, z.r*.55, 0, 7); c.fill(); } }
        else if(z.k === 'smoke'){ c.fillStyle = 'rgba(120,120,130,'+(.55*(1 - k))+')'; for(var j = 0; j < 6; j++){ c.beginPath(); c.arc(z.x + Math.cos(t*.5 + j*1.1)*z.r*.4, z.y + Math.sin(t*.4 + j*1.7)*z.r*.35 - k*30, z.r*.5, 0, 7); c.fill(); } }
        else if(z.k === 'fire'){ c.fillStyle = 'rgba(255,138,0,'+(.7*(1 - k))+')'; c.beginPath(); c.arc(z.x, z.y - k*8, z.r*(1 - k*.5), 0, 7); c.fill(); c.fillStyle = 'rgba(255,209,102,'+(.6*(1 - k))+')'; c.beginPath(); c.arc(z.x, z.y - k*12, z.r*.4, 0, 7); c.fill(); }
        else if(z.k === 'nova'){ c.fillStyle = 'rgba(192,132,252,'+(.12 + k*.25)+')'; c.beginPath(); c.arc(z.x, z.y, z.r*(1 - k*.4), 0, 7); c.fill(); c.strokeStyle = '#c084fc'; c.lineWidth = 2; c.stroke(); }
        else if(z.k === 'barrier'){ c.strokeStyle = 'rgba(79,209,197,.9)'; c.lineWidth = 3; c.setLineDash([8, 6]); c.beginPath(); c.arc(z.x, z.y, z.r, t*2, t*2 + 6.28); c.stroke(); c.setLineDash([]); }
        else if(z.k === 'blackhole'){ var bk = Math.min(1, z.t*4)*(1 - Math.max(0, (k - .8)*5)); c.fillStyle = 'rgba(0,0,0,'+(.85*bk)+')'; c.beginPath(); c.arc(z.x, z.y, 22*bk, 0, 7); c.fill(); c.strokeStyle = 'rgba(192,132,252,'+(.8*bk)+')'; c.lineWidth = 3; c.beginPath(); c.ellipse(z.x, z.y, 34*bk, 12*bk, t*3, 0, 7); c.stroke(); c.strokeStyle = 'rgba(192,132,252,.15)'; c.lineWidth = 1; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.stroke(); }
        else if(z.k === 'wall'){ c.fillStyle = 'rgba(255,255,255,'+(.55*(1 - k) + .2)+')'; rr(c, z.x - z.w/2, z.y - z.h/2, z.w, z.h, 6); c.fill(); c.strokeStyle = 'rgba(255,209,102,.8)'; c.lineWidth = 2; rr(c, z.x - z.w/2, z.y - z.h/2, z.w, z.h, 6); c.stroke(); }
        else if(z.k === 'boom' || z.k === 'frostring' || z.k === 'pull' || z.k === 'radar'){ var col = z.col || (z.k === 'frostring' ? '#4fd1c5' : z.k === 'radar' ? '#7ee081' : '#fff'); c.strokeStyle = col; c.globalAlpha = 1 - k; c.lineWidth = 4*(1 - k) + 1; c.beginPath(); c.arc(z.x, z.y, z.r*(z.k === 'pull' ? 1 - k : k), 0, 7); c.stroke(); if(z.k === 'boom'){ c.fillStyle = col; c.globalAlpha = (1 - k)*.25; c.fill(); } c.globalAlpha = 1; } });
      /* map */
      drawMap(c);
      /* entities */
      ents.forEach(function(en){ if(en.k === 'saw'){ c.save(); c.translate(en.x, en.y); c.rotate(t*14); c.fillStyle = '#c8cbd6'; c.beginPath(); for(var i = 0; i < 8; i++){ var a = i/8*Math.PI*2; c.lineTo(Math.cos(a)*16, Math.sin(a)*16); c.lineTo(Math.cos(a + .39)*10, Math.sin(a + .39)*10); } c.closePath(); c.fill(); c.restore(); }
        else if(en.k === 'sword'){ c.save(); c.translate(en.x, en.y); c.rotate(en.mode === 'dart' ? Math.atan2(en.vy, en.vx) + Math.PI/2 : en.a + Math.PI/2); c.fillStyle = '#e9e7e1'; c.fillRect(-2, -16, 4, 26); c.fillStyle = '#ffd166'; c.fillRect(-7, 8, 14, 3); c.restore(); }
        else if(en.k === 'snake'){ c.strokeStyle = '#7ee081'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); for(var s2 = 0; s2 <= 5; s2++){ var sx = en.x - en.dir*s2*6, sy = en.y + Math.sin(t*14 + s2)*3; if(s2) c.lineTo(sx, sy); else c.moveTo(sx, sy); } c.stroke(); c.fillStyle = '#ff5f57'; c.fillRect(en.x + en.dir*4, en.y - 1, 3, 2); }
        else if(en.k === 'sentry'){ c.fillStyle = '#3a3d4a'; rr(c, en.x - 12, en.y - 12, 24, 20, 4); c.fill(); c.fillStyle = en.o.col; c.beginPath(); c.arc(en.x, en.y - 12, 6, 0, 7); c.fill(); }
        else if(en.k === 'comet'){ c.fillStyle = '#ff8a00'; c.beginPath(); c.arc(en.x, en.y, 12, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,209,102,.7)'; c.lineWidth = 6; c.beginPath(); c.moveTo(en.x, en.y); c.lineTo(en.x - 6, en.y - 60); c.stroke(); }
        else if(en.k === 'cloud'){ c.fillStyle = 'rgba(200,203,214,.9)'; for(var cc = -1; cc <= 1; cc++){ c.beginPath(); c.arc(en.x + cc*18, en.y + Math.abs(cc)*4, 16, 0, 7); c.fill(); } }
        else if(en.k === 'ring'){ var rk = en.t/en.life; c.strokeStyle = 'rgba(255,255,255,'+(1 - rk)+')'; c.lineWidth = 3; c.beginPath(); c.arc(en.o.x, en.o.y, en.r + rk*40, 0, 7); c.stroke(); }
        else if(en.k === 'wave'){ var wk = en.t/.5; c.strokeStyle = 'rgba(255,209,102,'+(1 - wk)+')'; c.lineWidth = 3; c.beginPath(); c.arc(en.o.x, en.o.y, 130*wk, 0, 7); c.stroke(); } });
      bombs.forEach(function(bm){ if(bm.meteor){ c.fillStyle = 'rgba(255,138,0,.35)'; c.beginPath(); c.arc(bm.x - bm.vx*.03, bm.y - bm.vy*.03, 12, 0, 7); c.fill(); c.fillStyle = '#ff8a00'; c.beginPath(); c.arc(bm.x, bm.y, 8, 0, 7); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(bm.x, bm.y, 4, 0, 7); c.fill(); return; } c.fillStyle = '#20222c'; c.beginPath(); c.arc(bm.x, bm.y, 6, 0, 7); c.fill(); c.fillStyle = Math.floor(bm.t*12) % 2 ? '#ff5f57' : '#ffd166'; c.beginPath(); c.arc(bm.x, bm.y - 7, 2, 0, 7); c.fill(); });
      corpses.forEach(function(co){ c.save(); c.globalAlpha = clamp(1.3 - co.t/co.life, 0, 1); c.translate(co.x, co.y); c.rotate(co.rot); drawChibi(c, 0, 0, co.s, co.col, co.face, 0, true, false, { stun:true, look:co.look, t:t }); c.restore(); });
      players.forEach(function(p){ if(p.alive) drawPlayer(c, p); });
      if(players[0] && players[0].S.halo && players[0].alive){ var hp0 = players[0]; for(var hi = 0; hi < 6; hi++){ var ha = t*2 + hi/6*Math.PI*2; c.fillStyle = '#ffd166'; c.beginPath(); c.arc(hp0.x + Math.cos(ha)*(hp0.r + 22), hp0.y + Math.sin(ha)*(hp0.r + 22), 3, 0, 7); c.fill(); } }
      bullets.forEach(function(b){ var col = b.col || (b.empowered ? '#ffd166' : b.o.col); c.strokeStyle = col; c.globalAlpha = .45; c.lineWidth = b.r*1.2; c.beginPath(); b.trail.forEach(function(q, i){ if(i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }); c.lineTo(b.x, b.y); c.stroke(); c.globalAlpha = 1;
        if(b.spin != null){ c.save(); c.translate(b.x, b.y); c.rotate(b.spin); c.fillStyle = '#c8cbd6'; c.beginPath(); for(var i = 0; i < 6; i++){ var a = i/6*Math.PI*2; c.lineTo(Math.cos(a)*b.r, Math.sin(a)*b.r); c.lineTo(Math.cos(a + .5)*b.r*.6, Math.sin(a + .5)*b.r*.6); } c.closePath(); c.fill(); c.restore(); }
        else { c.fillStyle = col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(b.x - b.r*.3, b.y - b.r*.3, b.r*.35, 0, 7); c.fill(); } });
      beams.forEach(function(bm){ c.strokeStyle = bm.col; c.globalAlpha = bm.t/.16; c.lineWidth = 6; c.beginPath(); c.moveTo(bm.x0, bm.y0); c.lineTo(bm.x1, bm.y1); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; });
      parts.forEach(function(q){ c.globalAlpha = clamp(1 - q.t/q.life, 0, 1); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); }); c.globalAlpha = 1;
      nums.forEach(function(n){ c.globalAlpha = clamp(1.4 - n.t*1.5, 0, 1); text(c, String(n.v), n.x, n.y, typeof n.v === 'number' && n.v >= 40 ? 15 : 12, n.col, 'center', 800); }); c.globalAlpha = 1;
      /* crosshair */
      if(players[0] && players[0].alive && phase === 'fight' && !autoAim && opts.cursor){ var CR = 5.6, CO = 8.8, CI = 3.2; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(mouse.x, mouse.y, CR, 0, 7); c.stroke(); c.beginPath(); c.moveTo(mouse.x - CO, mouse.y); c.lineTo(mouse.x - CI, mouse.y); c.moveTo(mouse.x + CI, mouse.y); c.lineTo(mouse.x + CO, mouse.y); c.moveTo(mouse.x, mouse.y - CO); c.lineTo(mouse.x, mouse.y - CI); c.moveTo(mouse.x, mouse.y + CI); c.lineTo(mouse.x, mouse.y + CO); c.stroke(); }   /* a fifth smaller than it was; the setup row turns it off */
      c.restore();
      if(sudden && phase === 'fight'){ c.strokeStyle = 'rgba(255,59,59,'+(.35 + .25*Math.sin(t*8))+')'; c.lineWidth = 12; c.strokeRect(0, 0, W, H); text(c, 'sudden death: everyone is draining', W/2, 44, 12, 'rgba(255,120,120,.9)', 'center', 700); }
      if(flash > 0){ c.fillStyle = 'rgba(255,255,255,'+(flash*1.2)+')'; c.fillRect(0, 0, W, H); } }
    function drawHud(c){ /* score: one row per player, rounds as big pips, points as small dots */
      c.font = '700 10px '+FONT; var tagW = 0; players.forEach(function(p){ tagW = Math.max(tagW, c.measureText(p.tag).width); }); var pipX = 14 + 12 + Math.max(38, tagW) + 12; scorePipX = pipX;   /* the pips start one column past the longest tag, so a long gamer tag never runs under them */
      players.forEach(function(p, i){ var x = 14, y = 14 + i*22; c.fillStyle = p.col; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); text(c, p.tag, x + 12, y, 10, 'rgba(255,255,255,.85)', 'left', 700); for(var r = 0; r < opts.rounds; r++){ c.fillStyle = r < p.rounds ? p.col : 'rgba(255,255,255,.18)'; rr(c, pipX + r*13, y - 5, 10, 10, 3); c.fill(); } for(var q = 0; q < opts.points; q++){ c.fillStyle = q < p.points ? '#fff' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(pipX + opts.rounds*13 + 8 + q*10, y, 3.2, 0, 7); c.fill(); } });
      if(bannerT > 0 && banner){ var big = /FIGHT|POINT|ROUND/.test(banner); c.save(); c.globalAlpha = Math.min(1, bannerT*2); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 12; text(c, banner, W/2, big ? H*.32 : H*.2, big ? 54 : 22, '#fff', 'center', 800); c.restore(); }
      if(phase === 'countdown'){ var n = Math.ceil(countdown); text(c, n > 0 ? String(n) : 'GO', W/2, H*.45, 64, 'rgba(255,255,255,.9)', 'center', 800); if(helpT > 0 && maxRounds() === 0 && players.every(function(p){ return p.points === 0; })) text(c, api.touch ? 'pad moves and jumps, fire and block buttons, aim is automatic' : 'A/D move, W or space jumps, mouse aims, click shoots, right click or shift blocks', W/2, H*.6, 12, 'rgba(255,255,255,.75)', 'center', 600); }
      if(pickNoteT > 0 && phase !== 'pick') text(c, pickNote, W/2, H - 16, 11, 'rgba(255,255,255,'+Math.min(1, pickNoteT)+')', 'center', 700);
      var me = players[0]; if(me && opts.info && phase !== 'pick'){ var S = me.S, rows = [['HP', me.maxhp], ['DMG', dmgOf(me).toFixed(0)], ['AMMO', S.ammo], ['RELOAD', S.reload.toFixed(2)+'s'], ['ATK', S.atk.toFixed(2)+'s'], ['BULLETS', S.bullets + (S.burst ? '+'+S.burst : '')], ['SPEED', S.speed.toFixed(2)+'x'], ['BOUNCE', S.bounces], ['BLOCK', S.blockCd.toFixed(2)+'s'], ['MOVE', S.move.toFixed(2)+'x'], ['JUMP', S.jump.toFixed(2)+'x'], ['STEAL', Math.round(S.steal*100)+'%'], ['CARDS', me.cards.length]]; c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, W - 118, 6, 110, rows.length*9.6 + 8, 8); c.fill(); rows.forEach(function(r, i){ text(c, r[0], W - 110, 14 + i*9.6, 7, 'rgba(255,255,255,.55)', 'left', 700); text(c, String(r[1]), W - 16, 14 + i*9.6, 8, '#fff', 'right', 800); }); }   /* stays above the top-corner spawns (Cross, Towers) */
      else if(me && phase !== 'pick'){ var cs = me.cards.filter(function(k){ return k.rarity !== 'curse'; }), cu = me.curses || 0; if(cs.length){ var cx = W - 12; cs.slice(-8).reverse().forEach(function(k){ c.fillStyle = RAR[k.rarity].col; rr(c, cx - 14, 10, 14, 20, 3); c.fill(); text(c, k.name.charAt(0), cx - 7, 20, 9, '#111', 'center', 800); cx -= 17; }); if(cu) text(c, cu+' curse'+(cu > 1 ? 's' : ''), W - 12, 40, 9, '#ff5f57', 'right', 700); } } }
    function drawPick(c){ c.fillStyle = 'rgba(10,10,16,.86)'; c.fillRect(0, 0, W, H); if(!hand) return; var L = handLayout(), mine = picker && !picker.cpu;
      text(c, mine ? 'Pick a card' : picker.tag+' is thinking'+'.'.repeat(1 + Math.floor(t*2) % 3), W/2, L[0].y - 54, 22, '#fff', 'center', 800); text(c, mine ? (pickQueue.length ? (pickQueue.length)+' more pick'+(pickQueue.length > 1 ? 's' : '')+' after this' : 'the fight starts after this pick') : 'cards go to the player who lost the round', W/2, L[0].y - 30, 11, 'rgba(255,255,255,.65)', 'center', 600);
      hand.forEach(function(k, i){ var q = L[i], sel = i === handSel; drawCard(c, k, q.x, q.y - (sel ? 14 : 0), q.w, q.h, sel, !mine && !sel); if(mine) text(c, String(i + 1), q.x + q.w/2, q.y + q.h + 14, 10, sel ? '#fff' : 'rgba(255,255,255,.4)', 'center', 700); });
      if(mine && PICK_LIMIT - pickClock <= 10){ var left = Math.max(0, Math.ceil(PICK_LIMIT - pickClock)); text(c, 'auto-pick in '+left, W/2, L[0].y + L[0].h + 40, 12, left <= 3 ? '#ff6b6b' : '#ffd166', 'center', 700); }
      if(pickNoteT > 0) text(c, pickNote, W/2, H - 18, 12, '#ffd166', 'center', 700);
      var me = players[0]; if(me && me.cards.length){ text(c, 'your deck: '+me.cards.map(function(k){ return k.name; }).join(', '), W/2, H - 40, 9, 'rgba(255,255,255,.5)', 'center', 600); } }
    function drawSetup(c){ c.fillStyle = '#1f2030'; c.fillRect(0, 0, W, H); for(var i = 0; i < 40; i++){ c.fillStyle = 'rgba(255,255,255,'+(.03 + (i % 3)*.02)+')'; c.beginPath(); c.arc((i*173 + 40) % W, (i*97 + 30) % H, 2 + (i % 4), 0, 7); c.fill(); }
      var top = setupTop(); text(c, 'ROUNDS', W/2, top - 74, 34, '#fff', 'center', 800); text(c, 'first to '+opts.rounds+' rounds  \u00b7  '+CARDS.filter(function(k){ return k.rarity !== 'curse' && (k.pack === 'vanilla' || opts[k.pack]); }).length+' cards in the deck', W/2, top - 44, 12, 'rgba(255,255,255,.7)', 'center', 600);
      SETUP.forEach(function(r, i){ var y = top + i*26, sel = i === setupSel, v = opts[r.id]; if(sel){ c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, W*.2, y - 11, W*.6, 24, 6); c.fill(); }
        if(r.id === 'go'){ text(c, '\u25B6  Start the match', W/2, y + 1, 14, sel ? '#7ee081' : 'rgba(126,224,129,.8)', 'center', 800); return; }
        text(c, r.name, W*.23, y, 12, sel ? '#fff' : 'rgba(255,255,255,.8)', 'left', 700); if(r.mod) text(c, 'mod  \u00b7  '+r.mod, W*.23 + 190, y + 1, 8, 'rgba(255,209,102,.7)', 'left', 600);
        var shown = r.show(v), on = v === true, off = v === false; text(c, '\u2039', W*.62, y, 12, sel ? '#fff' : 'rgba(255,255,255,.35)', 'center', 700); text(c, shown, W*.69, y, 12, on ? '#7ee081' : off ? 'rgba(255,255,255,.5)' : '#fff', 'center', 800); text(c, '\u203A', W*.76, y, 12, sel ? '#fff' : 'rgba(255,255,255,.35)', 'center', 700); });
      text(c, api.touch ? 'tap a row to change it, tap Start to play' : 'up/down pick a row, left/right change it, enter starts', W/2, H - 16, 11, 'rgba(255,255,255,.55)', 'center', 600); }
    function drawLocker(c){ c.fillStyle = '#1f2030'; c.fillRect(0, 0, W, H); for(var i = 0; i < 40; i++){ c.fillStyle = 'rgba(255,255,255,'+(.03 + (i % 3)*.02)+')'; c.beginPath(); c.arc((i*173 + 40) % W, (i*97 + 30) % H, 2 + (i % 4), 0, 7); c.fill(); }
      text(c, 'LOCKER ROOM', W/2, 54, 30, '#fff', 'center', 800); text(c, 'dress your fighter  \u00b7  colours are first come, first served  \u00b7  nothing here changes the fight', W/2, 82, 12, 'rgba(255,255,255,.7)', 'center', 600);
      var k = clamp(locker.t/30, 0, 1); c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, W*.3, 98, W*.4, 6, 3); c.fill(); c.fillStyle = locker.t < 5 ? '#ff6b6b' : '#7ee081'; rr(c, W*.3, 98, W*.4*k, 6, 3); c.fill(); text(c, Math.ceil(locker.t)+' s', W*.7 + 14, 101, 12, 'rgba(255,255,255,.8)', 'left', 800);
      /* the line-up */
      var n = players.length, pw = Math.min(300, (W - 120)/n), x0 = W/2 - pw*n/2 + pw/2, base = H*.5; c.fillStyle = 'rgba(255,255,255,.05)'; rr(c, W/2 - pw*n/2 - 10, 150, pw*n + 20, H*.66 - 150, 14); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, W/2 - pw*n/2 + 10, base + 6, pw*n - 20, 10, 5); c.fill();
      players.forEach(function(p, i){ var x = x0 + i*pw, hop = Math.abs(Math.sin(t*2.2 + i*1.3))*(locker.ready[i] ? 6 : 0); drawChibi(c, x, base - hop, 4.4, p.col, p.cpu ? -1 : 1, 0, false, true, { blink:p.blinkT > 0, look:lookOf(p), t:t, mood:locker.ready[i] ? 'happy' : null });   /* 4.4 keeps the wizard tip and bunny ears (head top - 15s) under the name label at y 168 */ text(c, p.tag, x, 168, 13, p.col, 'center', 800); var st = locker.ready[i] ? 'READY' : p.cpu ? 'choosing\u2026' : 'dressing'; text(c, st, x, base + 84, 11, locker.ready[i] ? '#7ee081' : 'rgba(255,255,255,.55)', 'center', 800); if(i === 0 && !locker.ready[0]){ text(c, '\u25BC', x, 150 + Math.sin(t*4)*3, 12, '#ffd166', 'center', 800); } });
      /* your options */
      var me = players[0]; lockerRows().forEach(function(row, i){ var r = row.r, y = row.y, sel = i === locker.sel, dim = locker.ready[0] && r.id !== 'ready'; if(sel){ c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, W*.2, y - 12, W*.6, 25, 6); c.fill(); }
        if(r.id === 'ready'){ text(c, locker.ready[0] ? '\u2713  Ready, waiting for the others' : '\u25B6  Ready', W/2, y + 1, 14, locker.ready[0] ? 'rgba(126,224,129,.7)' : sel ? '#7ee081' : 'rgba(126,224,129,.8)', 'center', 800); return; }
        text(c, r.name, W*.23, y, 12, dim ? 'rgba(255,255,255,.35)' : sel ? '#fff' : 'rgba(255,255,255,.8)', 'left', 700); text(c, '\u2039', W*.38, y, 12, sel && !dim ? '#fff' : 'rgba(255,255,255,.3)', 'center', 700); text(c, '\u203A', W*.77, y, 12, sel && !dim ? '#fff' : 'rgba(255,255,255,.3)', 'center', 700);
        if(r.id === 'color'){ COLS.forEach(function(col, ci){ var sx = W*.42 + ci*36, taken = colorTaken(ci, me), mine = me.look.color === ci; c.fillStyle = col; c.globalAlpha = taken ? .3 : 1; c.beginPath(); c.arc(sx, y, 9, 0, 7); c.fill(); c.globalAlpha = 1; if(taken){ c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx - 5, y - 5); c.lineTo(sx + 5, y + 5); c.moveTo(sx + 5, y - 5); c.lineTo(sx - 5, y + 5); c.stroke(); } if(mine){ c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(sx, y, 12, 0, 7); c.stroke(); } }); }
        else text(c, r.vals[me.look[r.id]], W*.575, y, 12, dim ? 'rgba(255,255,255,.35)' : '#fff', 'center', 800); });
      text(c, api.touch ? 'tap a row to change it, tap Ready when you like the look' : 'up/down pick a row, left/right change it, enter when you are ready  \u00b7  M mutes the music', W/2, H - 16, 11, 'rgba(255,255,255,.55)', 'center', 600); }
    g.draw = function(c){ if(phase === 'setup'){ drawSetup(c); return; } if(phase === 'locker'){ drawLocker(c); return; } drawArena(c); drawHud(c); if(phase === 'pick') drawPick(c); if(phase === 'matchend') drawMatchEnd(c); };
    function drawMatchEnd(c){ var rw = matchWinner; if(!rw) return; c.fillStyle = 'rgba(10,10,16,.86)'; c.fillRect(0, 0, W, H); var cy = H*.5;
      drawChibi(c, W/2, cy - 14, 3.8, rw.uni ? UNI[rw.uni] : rw.col, 1, t*6, false, true, { blink:rw.blinkT > 0, look:lookOf(rw), t:t, mood:'happy' });   /* room above for the tallest hats (wizard, bunny ears) under the score line */
      text(c, rw === players[0] ? 'YOU WIN THE MATCH' : rw.tag.toUpperCase()+' TAKES THE MATCH', W/2, cy - 214, 32, '#fff', 'center', 800);
      text(c, scoreLine()+(extensions ? '  \u00b7  extended '+extensions+'x' : ''), W/2, cy - 184, 12, 'rgba(255,255,255,.7)', 'center', 600);
      text(c, 'keep going? three more rounds, everyone keeps their cards, and the '+(players.length > 2 ? 'losers pick' : 'loser picks')+' first  \u00b7  first to '+(opts.rounds + 3), W/2, cy + 64, 12, 'rgba(255,255,255,.75)', 'center', 600);
      matchButtons().forEach(function(b, i){ var sel = i === matchSel; c.fillStyle = sel ? (i === 0 ? 'rgba(126,224,129,.22)' : 'rgba(255,107,107,.22)') : 'rgba(255,255,255,.06)'; rr(c, b.x, b.y, b.w, b.h, 10); c.fill(); c.strokeStyle = sel ? (i === 0 ? '#7ee081' : '#ff6b6b') : 'rgba(255,255,255,.25)'; c.lineWidth = sel ? 2 : 1; rr(c, b.x, b.y, b.w, b.h, 10); c.stroke(); text(c, (i === 0 ? '\u25B6  ' : '')+b.label, b.x + b.w/2, b.y + b.h/2, 15, sel ? '#fff' : 'rgba(255,255,255,.8)', 'center', 800); });
      text(c, api.touch ? 'tap a choice' : 'left/right pick, enter confirms  \u00b7  E extends', W/2, H - 16, 11, 'rgba(255,255,255,.55)', 'center', 600); }
    return g;
  }

  var I = function(p){ return '<svg viewBox="0 0 24 24">'+p+'</svg>'; };
  GAMES.push({ id:'rounds', premium:true, rank:2, name:'Rounds', tkeys:'Pad moves and jumps, fire and block buttons, aim is automatic', blurb:'Landfall\u2019s ROUNDS, rebuilt for one player: little big-headed gunners duel on floating maps, the loser of every round picks a card, first to five wins. All 67 cards plus the top community mods as toggles. Pick your colour first.', keys:'A/D move, W or space jumps, mouse aims, click shoots, right click or shift blocks', W:W, H:H, pad:'duel', color:'#ffb347', make:rounds, cards:CARDS.length,
    icon:I('<circle cx="9" cy="13" r="5"/><path d="M13 12h6M17 10l2 2-2 2"/><path d="M6 17c-2 1-3 3-3 4M12 17c1 1 1 3 1 4"/>') });
})();

