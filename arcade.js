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

/* tigOS arcade, Nightshift part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one closure.
   Nightshift is a first-person wave shooter set in an abandoned subway station, rendered with Three.js (window.THREE, vendored in
   src/assets/three.js and fetched only when the game starts). Everything in the scene is generated here at load: tile, brick, ballast
   and poster textures are drawn on canvases, every prop is boxes and cylinders, every sound is synthesised with WebAudio. Nothing is
   downloaded but code. Same contract as games.js: make(api) -> { reset, update, draw, key, pointer, resize, destroy }. */
(function(){
  var GAMES = window.TIG_GAMES; if(!GAMES) return;
  var W = 960, H = 540, FONT = 'ui-monospace, Menlo, Consolas, monospace';
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; }, rnd = function(a, b){ return a + Math.random() * (b - a); }, lerp = function(a, b, k){ return a + (b - a) * k; };
  var mk = function(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  var seed = 11; var srand = function(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  var text = function(c, s, x, y, size, col, align, weight, font){ c.font = (weight || 700)+' '+size+'px '+(font || FONT); c.fillStyle = col; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  function grain(x, w, h, a, n){ for(var i = 0; i < n; i++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '255,255,255')+','+(a * srand())+')'; x.fillRect((srand()*w)|0, (srand()*h)|0, 1 + (srand()*2)|0, 1); } }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(ch){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]; }); }

  /* ---------- player settings: sensitivity, field of view, graphics tier, volume. Kept in localStorage, edited on the title card and the pause card ---------- */
  var GFX = ['low', 'medium', 'high', 'ultra'];
  var SET = { sens:1, fov:78, gfx:'high', vol:.8, inv:false };
  (function(){ try { var o = JSON.parse(localStorage.getItem('tigos.nightshift') || '{}'); Object.keys(SET).forEach(function(k){ if(o[k] !== undefined) SET[k] = o[k]; }); } catch(e){} SET.sens = clamp(+SET.sens || 1, .3, 2.5); SET.fov = clamp(+SET.fov || 78, 60, 110); SET.vol = clamp(+SET.vol, 0, 1); if(GFX.indexOf(SET.gfx) < 0) SET.gfx = 'high'; })();
  function saveSet(){ try { localStorage.setItem('tigos.nightshift', JSON.stringify(SET)); } catch(e){} }

  /* ---------- textures and materials, built once the first time the game starts (they need THREE) ---------- */
  var A = null;   /* the asset bag */
  function assets(){
    if(A) return A; var THREE = window.THREE; A = { tex:{}, mat:{} };
    function ctex(w, h, fn, rep){ var c = mk(w, h); fn(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if(rep){ t.repeat.set(rep[0], rep[1]); } t.canvas = c; return t; }
    function std(o){ return new THREE.MeshStandardMaterial(o); }
    var T = A.tex, M = A.mat;
    /* white subway tile, 2:1 bricks, warm grout, a little grime toward the bottom of each texture tile (1 texture = 1 m) */
    T.tile = ctex(256, 256, function(x, w, h){ x.fillStyle = '#b9b3a4'; x.fillRect(0, 0, w, h); var tw = 64, th = 32; for(var r = 0; r < h/th; r++) for(var c = -1; c < w/tw + 1; c++){ var bx = c*tw + (r % 2 ? tw/2 : 0), by = r*th, l = 88 + srand()*8; x.fillStyle = 'hsl(42 '+(12 + srand()*8)+'% '+l+'%)'; x.fillRect(bx + 2, by + 2, tw - 4, th - 4); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(bx + 3, by + 3, tw - 6, 2); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(bx + 3, by + th - 5, tw - 6, 2); } grain(x, w, h, .10, 2600); var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(40,30,20,0)'); g.addColorStop(1, 'rgba(40,30,20,.22)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
    T.brick = ctex(256, 256, function(x, w, h){ x.fillStyle = '#2a1a16'; x.fillRect(0, 0, w, h); for(var r = 0; r < 16; r++) for(var c = -1; c < 9; c++){ var bx = c*32 + (r % 2 ? 16 : 0), by = r*16; x.fillStyle = 'hsl('+(8 + srand()*14)+' '+(28 + srand()*16)+'% '+(20 + srand()*12)+'%)'; x.fillRect(bx + 1, by + 1, 30, 14); } grain(x, w, h, .2, 3000); });
    T.concrete = ctex(256, 256, function(x, w, h){ x.fillStyle = '#5d5b57'; x.fillRect(0, 0, w, h); grain(x, w, h, .22, 9000); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); for(var i = 0; i < 3; i++){ var gg = x.createRadialGradient(srand()*w, srand()*h, 4, w/2, h/2, 160); gg.addColorStop(0, 'rgba(0,0,0,'+(.05 + srand()*.06)+')'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, 0, w, h); } for(var s2 = 0; s2 < 30; s2++){ x.fillStyle = 'rgba('+(srand() < .5 ? '20,15,10' : '90,88,84')+','+(.1 + srand()*.2)+')'; x.fillRect(srand()*w, srand()*h, 2 + srand()*10, 1 + srand()*3); } });
    T.ceiling = ctex(256, 256, function(x, w, h){ x.fillStyle = '#3d3b3a'; x.fillRect(0, 0, w, h); grain(x, w, h, .18, 5000); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 126, w, 4); x.fillRect(126, 0, 4, h); for(var i = 0; i < 9; i++){ x.fillStyle = 'rgba(60,40,20,'+(.08 + srand()*.15)+')'; x.beginPath(); x.ellipse(srand()*w, srand()*h, 30 + srand()*60, 20 + srand()*40, srand()*3, 0, 7); x.fill(); } });
    T.ballast = ctex(256, 256, function(x, w, h){ x.fillStyle = '#1d1c1c'; x.fillRect(0, 0, w, h); for(var i = 0; i < 1800; i++){ x.fillStyle = 'hsl(30 '+(4 + srand()*8)+'% '+(12 + srand()*22)+'%)'; x.beginPath(); x.arc(srand()*w, srand()*h, 1.5 + srand()*3.5, 0, 7); x.fill(); } grain(x, w, h, .2, 2000); });
    T.metal = ctex(128, 128, function(x, w, h){ x.fillStyle = '#3a3e46'; x.fillRect(0, 0, w, h); grain(x, w, h, .14, 1400); for(var i = 0; i < 8; i++){ x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i*16 + 14, w, 2); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, i*16 + 2, w, 1); } }, [1, 1]);
    T.grate = ctex(128, 256, function(x, w, h){ x.fillStyle = '#2b2d33'; x.fillRect(0, 0, w, h); for(var i = 0; i < 32; i++){ x.fillStyle = i % 2 ? '#3a3d45' : '#23252b'; x.fillRect(0, i*8, w, 8); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, i*8, w, 1); } grain(x, w, h, .18, 1200); x.fillStyle = 'rgba(120,60,20,.25)'; for(var r = 0; r < 12; r++) x.fillRect(srand()*w, srand()*h, 3 + srand()*6, 10 + srand()*40); }, [1, 1]);
    T.wood = ctex(128, 128, function(x, w, h){ x.fillStyle = '#5a3a1e'; x.fillRect(0, 0, w, h); for(var i = 0; i < 40; i++){ x.strokeStyle = 'rgba('+(srand() < .5 ? '20,10,0' : '140,90,40')+','+(.15 + srand()*.3)+')'; x.lineWidth = 1 + srand()*2; x.beginPath(); x.moveTo(0, srand()*h); x.bezierCurveTo(w*.3, srand()*h, w*.7, srand()*h, w, srand()*h); x.stroke(); } grain(x, w, h, .1, 600); });
    T.burlap = ctex(64, 64, function(x, w, h){ x.fillStyle = '#7a6a48'; x.fillRect(0, 0, w, h); for(var i = 0; i < w; i += 3){ x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i, 0, 1, h); x.fillRect(0, i, w, 1); } grain(x, w, h, .18, 500); }, [2, 1]);
    T.stripe = ctex(64, 64, function(x, w, h){ x.fillStyle = '#d8b21a'; x.fillRect(0, 0, w, h); grain(x, w, h, .22, 500); x.fillStyle = 'rgba(0,0,0,.5)'; for(var i = 0; i < 8; i++) x.fillRect(srand()*w, srand()*h, 2 + srand()*6, 2 + srand()*6); });
    T.soft = ctex(64, 64, function(x, w, h){ var g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); T.soft.colorSpace = THREE.NoColorSpace;
    T.blood = ctex(128, 128, function(x, w, h){ x.clearRect(0, 0, w, h); for(var i = 0; i < 14; i++){ var r = 8 + srand()*26, px = 64 + (srand() - .5)*60, py = 64 + (srand() - .5)*60; var g = x.createRadialGradient(px, py, 1, px, py, r); g.addColorStop(0, 'rgba(90,6,6,.95)'); g.addColorStop(.7, 'rgba(70,4,4,.8)'); g.addColorStop(1, 'rgba(60,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } for(var d = 0; d < 20; d++){ x.fillStyle = 'rgba(80,4,4,.85)'; x.beginPath(); x.arc(64 + (srand() - .5)*110, 64 + (srand() - .5)*110, 1 + srand()*3, 0, 7); x.fill(); } });
    T.flash = ctex(128, 128, function(x, w, h){ x.clearRect(0, 0, w, h); x.translate(64, 64); for(var i = 0; i < 7; i++){ x.rotate(Math.PI*2/7); var g = x.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,160,40,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, -6); x.lineTo(60, 0); x.lineTo(0, 6); x.fill(); } var c = x.createRadialGradient(0, 0, 1, 0, 0, 26); c.addColorStop(0, 'rgba(255,255,255,1)'); c.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = c; x.beginPath(); x.arc(0, 0, 26, 0, 7); x.fill(); });
    /* the station's mosaic name plaque and the posters, drawn like tile mosaics */
    function mosaic(w, h, fn){ return ctex(w, h, function(x){ x.fillStyle = '#1f4a3a'; x.fillRect(0, 0, w, h); for(var yy = 0; yy < h; yy += 8) for(var xx = 0; xx < w; xx += 8){ x.fillStyle = 'hsl(160 '+(20 + srand()*10)+'% '+(20 + srand()*8)+'%)'; x.fillRect(xx + 1, yy + 1, 6, 6); } x.fillStyle = '#e9e2cf'; x.fillRect(16, 16, w - 32, h - 32); for(var y2 = 16; y2 < h - 16; y2 += 8) for(var x2 = 16; x2 < w - 16; x2 += 8){ x.fillStyle = 'hsl(45 '+(20 + srand()*12)+'% '+(80 + srand()*10)+'%)'; x.fillRect(x2 + 1, y2 + 1, 6, 6); } x.fillStyle = '#c9a54a'; for(var b = 24; b < w - 24; b += 8){ x.fillRect(b + 1, 25, 6, 6); x.fillRect(b + 1, h - 31, 6, 6); } fn(x); }); }
    T.sign = mosaic(512, 128, function(x){ var c = mk(512, 128), q = c.getContext('2d'); text(q, 'TIGER AVE', 256, 66, 64, '#000', 'center', 900, 'Georgia, "Times New Roman", serif'); var d = q.getImageData(0, 0, 512, 128).data; x.fillStyle = '#17181c'; for(var yy = 0; yy < 128; yy += 4) for(var xx = 0; xx < 512; xx += 4){ if(d[(yy*512 + xx)*4 + 3] > 120) x.fillRect(xx, yy, 4, 4); } });
    T.band = ctex(64, 64, function(x, w, h){ x.fillStyle = '#1f4a3a'; x.fillRect(0, 0, w, h); for(var yy = 0; yy < h; yy += 8) for(var xx = 0; xx < w; xx += 8){ x.fillStyle = 'hsl(160 '+(20 + srand()*10)+'% '+(20 + srand()*8)+'%)'; x.fillRect(xx + 1, yy + 1, 6, 6); } x.fillStyle = '#c9a54a'; for(var b = 0; b < w; b += 8){ x.fillRect(b + 1, 1, 6, 6); x.fillRect(b + 1, h - 7, 6, 6); } }, [4, 1]);
    var poster = function(fn){ return ctex(128, 192, function(x, w, h){ x.fillStyle = '#e8e0cc'; x.fillRect(0, 0, w, h); fn(x, w, h); grain(x, w, h, .25, 900); x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, 0, w, 3); x.fillRect(0, 0, 3, h); for(var i = 0; i < 3; i++){ x.fillStyle = 'rgba(30,20,10,.5)'; x.beginPath(); x.moveTo(srand()*w, 0); x.lineTo(srand()*w, 10 + srand()*30); x.lineTo(srand()*w, 0); x.fill(); } }); };
    T.posters = [
      poster(function(x, w, h){ x.fillStyle = '#ff8a00'; x.fillRect(0, 0, w, 70); text(x, 'HIRE', 64, 26, 30, '#1a1208', 'center', 900); text(x, 'CHASE', 64, 54, 30, '#1a1208', 'center', 900); text(x, 'marketing, made clear', 64, 96, 10, '#333', 'center', 600); text(x, 'chasetiger.com', 64, 118, 11, '#111', 'center', 800); x.fillStyle = '#111'; x.fillRect(20, 140, 88, 34); text(x, 'tigOS', 64, 157, 16, '#ff8a00', 'center', 900); }),
      poster(function(x, w, h){ x.fillStyle = '#12233a'; x.fillRect(0, 0, w, h); text(x, 'LAST TRAIN', 64, 40, 18, '#f4f1ea', 'center', 900); text(x, '12:00 AM', 64, 70, 26, '#ffd166', 'center', 900); text(x, 'no passengers', 64, 100, 11, '#c9d3e6', 'center', 600); text(x, 'tonight', 64, 116, 11, '#c9d3e6', 'center', 600); x.strokeStyle = '#ffd166'; x.lineWidth = 3; x.strokeRect(12, 12, 104, 168); }),
      poster(function(x, w, h){ x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#b00020'; x.fillRect(0, 0, w, 40); text(x, 'MISSING', 64, 20, 22, '#fff', 'center', 900); x.fillStyle = '#d8d3c6'; x.fillRect(24, 47, 80, 94); x.fillStyle = '#8a857a'; x.beginPath(); x.arc(64, 84, 18, 0, 7); x.fill(); x.fillRect(42, 104, 44, 36); text(x, 'CHASE J.', 64, 154, 13, '#17181c', 'center', 900); text(x, 'last seen: night shift', 64, 169, 9, '#333', 'center', 700); text(x, 'if seen, run', 64, 184, 11, '#b00020', 'center', 800); }),
      poster(function(x, w, h){ x.fillStyle = '#0d3b2e'; x.fillRect(0, 0, w, h); text(x, 'SEE', 64, 44, 30, '#63e6be', 'center', 900); text(x, 'SOMETHING', 64, 78, 18, '#f4f1ea', 'center', 900); text(x, 'SHOOT', 64, 112, 30, '#63e6be', 'center', 900); text(x, 'SOMETHING', 64, 146, 18, '#f4f1ea', 'center', 900); })
    ];
    T.exit = ctex(128, 48, function(x, w, h){ x.fillStyle = '#0a2a14'; x.fillRect(0, 0, w, h); text(x, 'EXIT', 64, 24, 30, '#5dffa0', 'center', 900); x.fillStyle = '#5dffa0'; x.fillRect(8, 20, 10, 8); x.fillRect(110, 20, 10, 8); });
    M.tile = std({ map:T.tile, roughness:.35, metalness:.05 });
    M.brick = std({ map:T.brick, roughness:.95 });
    M.floor = std({ map:T.concrete, roughness:.6, metalness:.08 });
    M.ceiling = std({ map:T.ceiling, roughness:1 });
    M.ballast = std({ map:T.ballast, roughness:1 });
    M.metal = std({ map:T.metal, roughness:.5, metalness:.7 });
    M.grate = std({ map:T.grate, roughness:.6, metalness:.75 });
    M.wood = std({ map:T.wood, roughness:.8 });
    M.burlap = std({ map:T.burlap, roughness:1 });
    M.stripe = std({ map:T.stripe, roughness:.7 });
    M.band = std({ map:T.band, roughness:.4 });
    M.sign = std({ map:T.sign, roughness:.4 });
    M.exit = new THREE.MeshBasicMaterial({ map:T.exit });
    M.steel = std({ color:0x1d3f34, roughness:.55, metalness:.6 });   /* the painted column green */
    M.dark = std({ color:0x14151a, roughness:.9 });
    M.rail = std({ color:0x6d6f75, roughness:.35, metalness:.9 });
    M.tube = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xdfe8ff, emissiveIntensity:3.2, roughness:.3 });
    M.tubeOff = new THREE.MeshStandardMaterial({ color:0x8890a0, emissive:0x101418, emissiveIntensity:1, roughness:.3 });
    M.work = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffb060, emissiveIntensity:4, roughness:.3 });
    M.bulb = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffd6a0, emissiveIntensity:2.2 });
    M.blood = new THREE.MeshBasicMaterial({ map:T.blood, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 });
    M.flash = new THREE.MeshBasicMaterial({ map:T.flash, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
    M.tracer = new THREE.MeshBasicMaterial({ color:0xffd9a0, transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false });
    M.beam = new THREE.MeshBasicMaterial({ color:0xff8a00, transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false });
    M.fence = new THREE.MeshStandardMaterial({ color:0x6a6f78, roughness:.6, metalness:.6, transparent:true, opacity:.55, wireframe:true });
    M.glass = new THREE.MeshStandardMaterial({ color:0x9fb8d8, roughness:.1, metalness:.2, transparent:true, opacity:.35 });
    M.window = new THREE.MeshStandardMaterial({ color:0xfff1c8, emissive:0xffe9b8, emissiveIntensity:.55, roughness:.2 });
    M.headlight = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:3 });
    M.train = std({ color:0x5c6068, roughness:.4, metalness:.55 });
    M.trainStripe = std({ color:0x1f4a3a, roughness:.4, metalness:.5 });
    M.poster = T.posters.map(function(t){ return std({ map:t, roughness:.9 }); });
    /* the missing person is Chase: his headshot, photocopied to black and white at build time, drops into the poster when it loads */
    A.photo = false; (function(){ var src = window.TIG_INLINE && window.TIG_INLINE.missing_photo; if(!src) return;   /* a data URI: drawing it never taints the poster canvas */ var im = new Image(); im.onload = function(){ var t = T.posters[2], x = t.canvas.getContext('2d'); x.drawImage(im, 24, 47, 80, 94); x.fillStyle = 'rgba(60,40,20,.18)'; x.fillRect(24, 47, 80, 94); x.strokeStyle = '#17181c'; x.lineWidth = 2; x.strokeRect(24, 47, 80, 94); grain(x, 128, 192, .12, 300); t.needsUpdate = true; A.photo = true; }; im.src = src; })();
    M.skinBase = { roughness:.85 };
    return A;
  }
/* tigOS arcade, Nightshift part 01: the station. One authored map, 60 x 24 tiles (1 tile = 1 m), drawn on a grid that drives collision,
   pathing and the geometry builder. A near platform where you start, the tracks in a pit a step down, a far platform across them, tunnels
   running off both ends behind chain-link fences, stairs (the barricades the dead climb over) in the outer walls, and three rooms behind
   roll-down grates: the mezzanine (perks), a west maintenance room off the tunnel (the Forge) and an east room (power).
   Legend: # tile wall  % brick wall  . platform floor  _ track bed  P start  S stair mouth (spawn)  F fence (spawn)  a-d grates
           X wall buy  K resupply crate  Y power switch  C column  B bench  U turnstile  (machines sit on floor tiles, MTILE) */
  var MW = 60, MH = 24, MAP, SPAWNS, BUY_AT, MACHINES, BOXM, POWER_AT, MTILE, START, LOCATE, CEILH, FLOORY;
  var STATION = { x0:9, x1:50, z0:1, z1:15 }, PIT = { z0:5, z1:8 }, TRACK_Z = 7, PIT_Y = -1.05, CEIL_HI = 3.4, CEIL_LO = 2.6;
  var DOOR_COST = { a:750, b:1000, c:1000, d:1250 };
  var isDoor = function(ch){ return ch === 'a' || ch === 'b' || ch === 'c' || ch === 'd'; };
  var isFloor = function(ch){ return ch === '.' || ch === '_' || ch === 'P' || ch === 'C' || ch === 'B' || ch === 'U'; };   /* open air above; C/B/U are floor tiles with a prop on them */
  var isOpen = function(ch){ return isFloor(ch) || isDoor(ch); };
  function genMap(){
    MAP = []; for(var z = 0; z < MH; z++){ var row = []; for(var x = 0; x < MW; x++) row.push('#'); MAP.push(row); }
    var fill = function(x0, x1, z0, z1, ch){ for(var zz = z0; zz <= z1; zz++) for(var xx = x0; xx <= x1; xx++) MAP[zz][xx] = ch; };
    var put = function(x, z, ch){ MAP[z][x] = ch; };
    fill(STATION.x0, STATION.x1, 1, 4, '.');          /* far platform */
    fill(1, MW - 2, PIT.z0, PIT.z1, '_');              /* the pit, tunnel to tunnel */
    fill(STATION.x0, STATION.x1, 9, 15, '.');         /* near platform */
    fill(24, 35, 17, 22, '.');                         /* mezzanine, behind grate a */
    fill(1, 7, 10, 14, '.');                           /* west maintenance room, behind grate b (off the tunnel) */
    fill(52, 58, 10, 14, '.');                         /* east room, behind grate c (tunnel) or d (platform) */
    for(var zz = PIT.z0; zz <= PIT.z1; zz++){ put(0, zz, 'F'); put(MW - 1, zz, 'F'); }
    /* brick for everything outside the tiled station box */
    for(var z2 = 0; z2 < MH; z2++) for(var x2 = 0; x2 < MW; x2++){ if(MAP[z2][x2] === '#' && (x2 < STATION.x0 - 1 || x2 > STATION.x1 + 1 || z2 > 16)) MAP[z2][x2] = '%'; }
    /* stair mouths: the dead come down the stairs and over the sandbags */
    [[12, 16], [13, 16], [46, 16], [47, 16], [20, 0], [21, 0], [38, 0], [39, 0]].forEach(function(p){ put(p[0], p[1], 'S'); });
    put(30, 16, 'a'); put(4, 9, 'b'); put(55, 9, 'c'); put(51, 12, 'd');
    put(20, 16, 'X'); put(36, 19, 'X'); put(30, 0, 'X'); put(59, 12, 'X'); put(0, 12, 'X');
    BUY_AT = { '20,16':'stitcher', '36,19':'doorman', '30,0':'longbow', '59,12':'anvil', '0,12':'stitcher' };
    put(8, 11, 'K'); put(51, 10, 'K');
    put(55, 15, 'Y'); POWER_AT = '55,15';
    for(var cx = 11; cx <= 47; cx += 4){ put(cx, 11, 'C'); if(cx >= 13 && cx <= 45 && (cx - 13) % 8 === 0) put(cx, 2, 'C'); }
    [[17, 15], [25, 15], [33, 15], [41, 15], [16, 1], [44, 1]].forEach(function(p){ put(p[0], p[1], 'B'); });
    [[26, 18], [27, 18], [28, 18], [32, 18], [33, 18], [34, 18]].forEach(function(p){ put(p[0], p[1], 'U'); });
    /* machines on floor tiles beside a wall */
    MACHINES = [ { x:49.5, y:9.5, kind:'box' }, { x:2.5, y:13.5, kind:'forge' }, { x:24.5, y:21.5, kind:'quickhands' }, { x:34.5, y:21.5, kind:'doubletap' }, { x:9.5, y:1.5, kind:'fleetfoot' }, { x:57.5, y:13.5, kind:'ironhide' } ];
    MTILE = {}; MACHINES.forEach(function(m){ MTILE[(m.x|0)+','+(m.y|0)] = m; }); BOXM = MACHINES[0];
    START = { x:17.5, y:13.5, a:0 }; put(17, 13, 'P');
    /* spawn points: the floor tile in front of each stair mouth, and just inside the fences */
    SPAWNS = [];
    for(var sz = 0; sz < MH; sz++) for(var sx = 0; sx < MW; sx++){ var ch = MAP[sz][sx]; if(ch !== 'S' && ch !== 'F') continue;
      if(ch === 'F' && sz !== PIT.z1) continue;   /* the fences are forced open at their south end */
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function(o){ var nx = sx + o[0], nz = sz + o[1]; if(MAP[nz] && isFloor(MAP[nz][nx]) && !MTILE[nx+','+nz]) SPAWNS.push({ x:nx + .5, y:nz + .5, fx:ch === 'S' ? sx + .5 : sx + .5 + (sx === 0 ? -2.5 : 2.5), fy:sz + .5, stairs:ch === 'S' }); }); }
    /* per-tile ceiling height and floor level: the station hall is tall, rooms and tunnels are low; the pit is a step down */
    CEILH = []; FLOORY = [];
    for(var z3 = 0; z3 < MH; z3++){ CEILH.push([]); FLOORY.push([]); for(var x3 = 0; x3 < MW; x3++){ var inHall = x3 >= STATION.x0 && x3 <= STATION.x1 && z3 >= STATION.z0 && z3 <= STATION.z1; CEILH[z3].push(inHall ? CEIL_HI : CEIL_LO); FLOORY[z3].push(MAP[z3][x3] === '_' || MAP[z3][x3] === 'F' ? PIT_Y : 0); } }
    /* where a test (or a curious player) can stand to face each thing */
    var faceFrom = function(tx, tz){ var opts = [[1,0],[-1,0],[0,1],[0,-1]].map(function(o){ var nx = tx + o[0], nz = tz + o[1]; return { x:nx + .5, y:nz + .5, a:Math.atan2(-o[1], -o[0]), ok:MAP[nz] && isFloor(MAP[nz][nx]) && MAP[nz][nx] !== 'C' && MAP[nz][nx] !== 'B' && MAP[nz][nx] !== 'U' && !MTILE[nx+','+nz] }; }).filter(function(o){ return o.ok; }); return opts[0] ? { x:opts[0].x, y:opts[0].y, a:opts[0].a } : null; };
    LOCATE = { start:START, machines:{}, doors:[], buys:[], crates:[], power:null, stairs:[] };
    MACHINES.forEach(function(m){ LOCATE.machines[m.kind] = faceFrom(m.x|0, m.y|0); });
    for(var lz = 0; lz < MH; lz++) for(var lx = 0; lx < MW; lx++){ var c = MAP[lz][lx], f;
      if(isDoor(c) && (f = faceFrom(lx, lz))){ f.cost = DOOR_COST[c]; f.tx = lx; f.ty = lz; f.id = c; LOCATE.doors.push(f); }
      if(c === 'X' && (f = faceFrom(lx, lz))){ f.id = BUY_AT[lx+','+lz]; LOCATE.buys.push(f); }
      if(c === 'K' && (f = faceFrom(lx, lz))) LOCATE.crates.push(f);
      if(c === 'S' && (f = faceFrom(lx, lz))) LOCATE.stairs.push(f);
      if(c === 'Y') LOCATE.power = faceFrom(lx, lz); }
    LOCATE.doors.sort(function(p, q){ return p.cost - q.cost; });
  }
  genMap();
  function ch(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? '#' : MAP[z][x]; }
  function floorAt(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? 0 : FLOORY[z][x]; }
  function ceilAt(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? CEIL_LO : CEILH[z][x]; }
/* tigOS arcade, Nightshift part 02: the world builder. Turns the grid into merged meshes (one per material) plus props, lights and the
   train. Everything is boxes, cylinders and quads with canvas textures. buildWorld(scene) returns handles the game animates. */
  function Geo(){ this.p = []; this.n = []; this.uv = []; this.i = []; this.c = 0; }
  Geo.prototype.quad = function(v0, v1, v2, v3, uv, want){   /* four corners in order, uv = [[u,v] x4], want = the side the face must show */
    var ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2], bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    var nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx, L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    var vs = [v0, v1, v2, v3], us = uv; if(nx*want[0] + ny*want[1] + nz*want[2] < 0){ vs = [v0, v3, v2, v1]; us = [uv[0], uv[3], uv[2], uv[1]]; nx = -nx; ny = -ny; nz = -nz; }
    for(var k = 0; k < 4; k++){ this.p.push(vs[k][0], vs[k][1], vs[k][2]); this.n.push(nx, ny, nz); this.uv.push(us[k][0], us[k][1]); }
    var c = this.c; this.i.push(c, c + 1, c + 2, c, c + 2, c + 3); this.c += 4; };
  Geo.prototype.build = function(){ var THREE = window.THREE, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.i); return g; };

  function buildWorld(scene){
    var THREE = window.THREE, A = assets(), M = A.mat, T = A.tex, geos = {}, world = { lights:[], tubes:[], props:[], doors:{}, buys:{}, machines:{}, power:null, sandbags:[], dispose:[] };
    var G = function(k){ return geos[k] || (geos[k] = new Geo()); };
    var wallMat = function(c, x, z){ return c === '%' ? 'brick' : 'tile'; };
    /* a vertical face along the edge from (ax,az) to (bx,bz), y0..y1, showing toward (wx,wz) */
    var vface = function(k, ax, az, bx, bz, y0, y1, wx, wz, uscale){ var u0 = (ax !== bx ? ax : az)*(uscale || 1), u1 = (ax !== bx ? bx : bz)*(uscale || 1); G(k).quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], [wx, 0, wz]); };
    var hface = function(k, x0, z0, x1, z1, y, up, us){ us = us || 1; G(k).quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [[x0*us, z0*us], [x1*us, z0*us], [x1*us, z1*us], [x0*us, z1*us]], [0, up ? 1 : -1, 0]); };
    for(var z = 0; z < MH; z++) for(var x = 0; x < MW; x++){
      var c = MAP[z][x];
      if(isOpen(c)){
        var fy = floorAt(x, z), cy = ceilAt(x, z);
        hface(c === '_' || c === 'F' ? 'ballast' : 'floor', x, z, x + 1, z + 1, fy, true, c === '_' ? .5 : 1);
        hface('ceiling', x, z, x + 1, z + 1, cy, false, .5);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(o){ var nx = x + o[0], nz = z + o[1], nc = ch(nx, nz);
          var ex0 = o[0] === 1 ? x + 1 : x, ez0 = o[1] === 1 ? z + 1 : z, ex1 = o[0] === 0 ? x + 1 : ex0, ez1 = o[1] === 0 ? z + 1 : ez0;   /* the shared edge */
          if(isOpen(nc) || nc === 'F'){
            var nfy = floorAt(nx, nz), ncy = ceilAt(nx, nz);
            if(nfy < fy) vface('edge', ex0, ez0, ex1, ez1, nfy, fy, o[0], o[1]);          /* platform edge face, seen from the pit */
            if(ncy < cy) vface('ceiling', ex0, ez0, ex1, ez1, ncy, cy, -o[0], -o[1], .5); /* lintel where the hall ceiling drops into a room or tunnel */
          } else {
            if(nc !== 'S'){ var k = wallMat(nc, nx, nz); vface(k, ex0, ez0, ex1, ez1, fy, cy, -o[0], -o[1], k === 'brick' ? .5 : 2); }   /* a stair mouth is an opening: its alcove is built as a prop */
            world.props.push({ kind:nc, x:x, z:z, wx:nx, wz:nz, dir:o, fy:fy, cy:cy });   /* things that hang on or sit in this face: buys, crates, switch, posters, the sign band, stairs */
          } });
        if(c === 'C' || c === 'B' || c === 'U' || isDoor(c)) world.props.push({ kind:c, x:x, z:z, fy:fy, cy:cy });
      }
    }
    /* the tunnels run on past the fences into the dark */
    [[-44, 1], [MW - 1, MW + 44]].forEach(function(r){ var x0 = r[0], x1 = r[1], z0 = PIT.z0, z1 = PIT.z1 + 1;
      hface('ballast', x0, z0, x1, z1, PIT_Y, true, .5); hface('ceiling', x0, z0, x1, z1, CEIL_LO, false, .5);
      vface('brick', x0, z0, x1, z0, PIT_Y, CEIL_LO, 0, 1, .5); vface('brick', x0, z1, x1, z1, PIT_Y, CEIL_LO, 0, -1, .5); vface('brick', x0 < 0 ? x0 : x1, z0, x0 < 0 ? x0 : x1, z1, PIT_Y, CEIL_LO, x0 < 0 ? 1 : -1, 0, .5); });
    /* chain-link fences close the tunnels at the map's edge; the tunnel itself runs on behind them */
    [1, MW - 1].forEach(function(fx){ var fg = new THREE.PlaneGeometry(2.6, CEIL_LO - PIT_Y, 8, 8), fm = new THREE.Mesh(fg, M.fence); fm.position.set(fx, (CEIL_LO + PIT_Y)/2, PIT.z0 + 1.3); fm.rotation.y = Math.PI/2; scene.add(fm); world.dispose.push(fg); var bent = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6, 4, 4), M.fence); bent.position.set(fx + (fx < 2 ? .5 : -.5), PIT_Y + .8, PIT.z0 + 3.3); bent.rotation.y = Math.PI/2 + (fx < 2 ? .9 : -.9); bent.rotation.z = .3; scene.add(bent); world.dispose.push(bent.geometry);   /* somebody forced the last panel: that is where they come in */
      for(var pz2 = PIT.z0; pz2 <= PIT.z0 + 4; pz2 += 2){ var pg = new THREE.CylinderGeometry(.03, .03, CEIL_LO - PIT_Y, 6), pm = new THREE.Mesh(pg, M.rail); pm.position.set(fx, (CEIL_LO + PIT_Y)/2, pz2); scene.add(pm); world.dispose.push(pg); } });
    var matFor = { tile:M.tile, brick:M.brick, floor:M.floor, ceiling:M.ceiling, ballast:M.ballast, edge:M.floor, dark:M.dark };
    Object.keys(geos).forEach(function(k){ var g = geos[k].build(), m = new THREE.Mesh(g, matFor[k]); m.matrixAutoUpdate = false; scene.add(m); world.dispose.push(g); });

    /* ---------- props ---------- */
    var box = function(w, h, d, mat, x, y, z){ var g = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); world.dispose.push(g); return m; };
    var cyl = function(r0, r1, h, mat, x, y, z, seg){ var g = new THREE.CylinderGeometry(r0, r1, h, seg || 12), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); world.dispose.push(g); return m; };
    var plane = function(w, h, mat, x, y, z, dir){ var g = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = Math.atan2(dir[0], dir[1]); world.dispose.push(g); return m; };   /* dir = the way the plane faces */
    var textTex = function(w, h, fn){ var c = mk(w, h); fn(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; world.dispose.push(t); return t; };
    var faceCenter = function(p, inset){ inset = inset || 0; return { x:p.x + .5 + p.dir[0]*(.5 - inset), z:p.z + .5 + p.dir[1]*(.5 - inset), dir:[-p.dir[0], -p.dir[1]] }; };   /* on the wall face, looking back into the room */
    var stripeDone = {}, posterN = 0, bandDone = {};
    /* the platform edge gets the yellow warning strip */
    for(var pz = 0; pz < MH; pz++) for(var px = 0; px < MW; px++){ if(MAP[pz][px] !== '.') continue; [[0, 1], [0, -1]].forEach(function(o){ if(ch(px + o[0], pz + o[1]) === '_'){ var s = box(1, .012, .5, M.stripe, px + .5, .006, pz + .5 + o[1]*.25); scene.add(s); } }); }
    /* rails and ties along the whole track */
    var tiesG = new THREE.BoxGeometry(.22, .08, 2.4), ties = new THREE.InstancedMesh(tiesG, M.wood, 140), tm = new THREE.Object3D(); world.dispose.push(tiesG);
    for(var ti = 0; ti < 140; ti++){ tm.position.set(-44 + ti*(MW + 88)/140, PIT_Y + .04, TRACK_Z); tm.updateMatrix(); ties.setMatrixAt(ti, tm.matrix); } scene.add(ties);
    [TRACK_Z - .72, TRACK_Z + .72].forEach(function(rz){ scene.add(box(MW + 88, .14, .08, M.rail, MW/2, PIT_Y + .15, rz)); scene.add(box(MW + 88, .06, .16, M.rail, MW/2, PIT_Y + .06, rz)); });
    scene.add(box(MW + 88, .1, .1, M.dark, MW/2, PIT_Y + .3, TRACK_Z + 1.55));   /* third rail cover */
    world.props.forEach(function(p){
      var fc, k = p.kind;
      if(k === 'C'){ var cx = p.x + .5, cz = p.z + .5, hh = p.cy - p.fy; var col = new THREE.Group(); col.add(box(.34, hh, .34, M.steel, 0, p.fy + hh/2, 0)); col.add(box(.5, .08, .5, M.steel, 0, p.fy + .04, 0)); col.add(box(.5, .12, .5, M.steel, 0, p.cy - .06, 0)); col.add(box(.06, hh - .3, .42, M.dark, 0, p.fy + hh/2, 0)); col.add(box(.42, hh - .3, .06, M.dark, 0, p.fy + hh/2, 0)); col.position.set(cx, 0, cz); scene.add(col); }
      else if(k === 'B'){ var b = new THREE.Group(), along = ch(p.x, p.z - 1) === '.' && ch(p.x, p.z + 1) === '.'; b.add(box(1.7, .06, .42, M.wood, 0, .46, 0)); b.add(box(1.7, .38, .05, M.wood, 0, .68, -.2)); for(var li = -1; li <= 1; li += 2){ b.add(box(.06, .46, .4, M.steel, li*.75, .23, 0)); } b.position.set(p.x + .5, 0, p.z + .5); b.rotation.y = along ? Math.PI/2 : 0; if(!along && ch(p.x, p.z + 1) !== '.') b.rotation.y = Math.PI; scene.add(b); }
      else if(k === 'U'){ var u = new THREE.Group(); u.add(box(.36, 1.0, .9, M.metal, 0, .5, 0)); u.add(cyl(.03, .03, .8, M.rail, 0, .95, 0, 8)); u.children[1].rotation.z = Math.PI/2; u.add(cyl(.028, .028, .6, M.rail, .2, .98, 0, 8)); u.position.set(p.x + .5, 0, p.z + .5); scene.add(u); }
      else if(isDoor(k)){ var vert = isOpen(ch(p.x, p.z - 1)) || isOpen(ch(p.x, p.z + 1)); var d = new THREE.Group(); var gate = box(vert ? .96 : .08, p.cy - .05, vert ? .08 : .96, M.grate, 0, (p.cy - .05)/2, 0); if(vert){ gate.material = M.grate; } d.add(gate);
        var housing = box(vert ? 1.02 : .2, .22, vert ? .2 : 1.02, M.metal, 0, p.cy - .1, 0); d.add(housing);
        var lt = textTex(256, 128, function(x, w, h){ x.fillStyle = '#ffd166'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1208'; x.fillRect(6, 6, w - 12, h - 12); text(x, 'LOCKED', 128, 40, 34, '#ffd166', 'center', 900); text(x, DOOR_COST[k]+' PTS', 128, 90, 30, '#fff', 'center', 900); }), lm = new THREE.MeshStandardMaterial({ map:lt, roughness:.6, emissive:0x332200, emissiveIntensity:.6 }), s1 = plane(.6, .3, lm, vert ? 0 : .05, 1.35, vert ? .05 : 0, vert ? [0, 1] : [1, 0]), s2 = plane(.6, .3, lm, vert ? 0 : -.05, 1.35, vert ? -.05 : 0, vert ? [0, -1] : [-1, 0]); d.add(s1); d.add(s2);
        d.position.set(p.x + .5, 0, p.z + .5); scene.add(d); world.doors[p.x+','+p.z] = { grp:d, gate:gate, signs:[s1, s2], mat:lm, h:p.cy - .05 }; }
      else if(k === 'S'){ fc = faceCenter(p); var sg = new THREE.Group(), dx = p.dir[0], dz = p.dir[1], hh2 = p.cy - p.fy;
        sg.add(box(dx ? 1.3 : .06, hh2, dx ? .06 : 1.3, M.dark, dx*.65 + dz*.5, hh2/2, dz*.65 + dx*.5)); sg.add(box(dx ? 1.3 : .06, hh2, dx ? .06 : 1.3, M.dark, dx*.65 - dz*.5, hh2/2, dz*.65 - dx*.5)); sg.add(box(dx ? .06 : 1, hh2, dx ? 1 : .06, M.dark, dx*1.3, hh2/2, dz*1.3)); sg.add(box(dx ? 1.3 : 1, .06, dx ? 1 : 1.3, M.dark, dx*.65, hh2 - .03, dz*.65));   /* the alcove: two sides, a back wall and a lid */
        for(var st = 0; st < 5; st++){ sg.add(box(dx ? .28 : .96, .22, dx ? .96 : .28, M.floor, dx*(.2 + st*.22), .11 + st*.22, dz*(.2 + st*.22))); }   /* steps rising away into the dark */
        var bagMat = M.burlap; for(var bg = 0; bg < 9; bg++){ var row = bg < 5 ? 0 : 1, ix = bg < 5 ? bg - 2 : bg - 6.5, bagx = dx ? -.15 + row*.22 : ix*.2, bagz = dz ? -.15 + row*.22 : ix*.2; var bag = box(dx ? .3 : .34, .2, dx ? .34 : .3, bagMat, bagx, .1 + row*.19, bagz); bag.rotation.y = (srand() - .5)*.4; sg.add(bag); }
        var ex = plane(.7, .26, M.exit, dx*-.02, p.cy - .45, dz*-.02, [-dx, -dz]); sg.add(ex);
        sg.position.set(fc.x, p.fy, fc.z); scene.add(sg); world.sandbags.push(sg); }
      else if(k === 'X' && BUY_AT[p.wx+','+p.wz]){ fc = faceCenter(p, .02); var wid = BUY_AT[p.wx+','+p.wz], wp = WEAPONS[wid];
        var bt = textTex(256, 160, function(x, w, h){ x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); x.strokeStyle = '#f4f1ea'; x.lineWidth = 4; x.setLineDash([10, 8]); x.strokeRect(8, 8, w - 16, h - 16); x.setLineDash([]); text(x, wp.name.toUpperCase(), 128, 40, 30, '#f4f1ea', 'center', 900); x.fillStyle = '#f4f1ea'; x.fillRect(60, 70, 136, 12); x.fillRect(150, 60, 40, 10); x.fillRect(66, 82, 18, 30); x.fillRect(120, 82, 14, 18); text(x, wp.cost+' PTS', 128, 136, 26, '#ffd166', 'center', 900); }), bm = new THREE.MeshBasicMaterial({ map:bt, transparent:true }), bp = plane(1.3, .82, bm, fc.x, 1.65, fc.z, fc.dir); scene.add(bp); world.buys[p.wx+','+p.wz] = bp; }
      else if(k === 'K'){ fc = faceCenter(p, .25); var kg = new THREE.Group(); kg.add(box(.7, .34, .44, new THREE.MeshStandardMaterial({ color:0x2f4a2a, roughness:.8 }), 0, .17, 0)); kg.add(box(.6, .3, .4, new THREE.MeshStandardMaterial({ color:0x35552f, roughness:.8 }), .05, .5, .02)); kg.add(box(.72, .04, .46, M.dark, 0, .35, 0));
        var kt = textTex(256, 64, function(x, w, h){ x.fillStyle = '#1a1208'; x.fillRect(0, 0, w, h); text(x, 'RESUPPLY \u00b7 250', 128, 32, 28, '#ffd166', 'center', 900); }); kg.add(plane(1, .25, new THREE.MeshBasicMaterial({ map:kt }), p.dir[0]*.2, 1.5, p.dir[1]*.2, fc.dir)); kg.position.set(fc.x, p.fy, fc.z); scene.add(kg); }
      else if(k === 'Y'){ fc = faceCenter(p, .06); var yg = new THREE.Group(); yg.add(box(.6, .9, .12, M.metal, 0, 0, 0)); var lever = box(.08, .4, .08, new THREE.MeshStandardMaterial({ color:0xb01818, roughness:.5 }), 0, -.1, .1); lever.rotation.x = .9; yg.add(lever); var lamp = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshStandardMaterial({ color:0xff3030, emissive:0xff2020, emissiveIntensity:2 })); lamp.position.set(.18, .32, .07); yg.add(lamp); world.dispose.push(lamp.geometry);
        var yt = textTex(128, 40, function(x, w, h){ x.fillStyle = '#ffd166'; x.fillRect(0, 0, w, h); text(x, 'POWER', 64, 20, 24, '#1a1208', 'center', 900); }); yg.add(plane(.5, .16, new THREE.MeshBasicMaterial({ map:yt }), 0, .58, .07, [0, 1])); yg.position.set(fc.x, 1.35, fc.z); yg.rotation.y = Math.atan2(fc.dir[0], fc.dir[1]); scene.add(yg); world.power = { grp:yg, lever:lever, lamp:lamp }; }
      else if(k === '#' || k === '%'){
        /* the mosaic band and name plaques run along the hall's long walls; posters go on other tiled faces */
        var hall = p.x >= STATION.x0 && p.x <= STATION.x1 && p.z >= STATION.z0 && p.z <= STATION.z1 && p.dir[0] === 0 && k === '#';
        if(hall){ fc = faceCenter(p, .012); var bkey = p.z+':'+p.dir[1]; scene.add(plane(1, .22, M.band, fc.x, 2.25, fc.z, fc.dir));
          if((p.x - STATION.x0) % 12 === 6 && !bandDone[bkey+p.x]){ bandDone[bkey+p.x] = 1; scene.add(plane(3.2, .8, M.sign, fc.x, 1.75, fc.z, fc.dir)); }
          else if(((p.x*7 + p.z*3) % 11 === 0) && (p.x - STATION.x0) % 12 !== 5 && (p.x - STATION.x0) % 12 !== 7){ scene.add(plane(.66, 1, M.poster[posterN++ % M.poster.length], fc.x, 1.45, fc.z, fc.dir)); } }
        else if(k === '#' && p.dir[1] === 0 && (p.x + p.z) % 5 === 0){ fc = faceCenter(p, .012); scene.add(plane(.66, 1, M.poster[posterN++ % M.poster.length], fc.x, 1.45, fc.z, fc.dir)); }
      }
    });
    /* bins and puddles for life */
    [[22.5, 14.6], [40.5, 9.6], [30.5, 3.6], [12.5, 9.6]].forEach(function(b){ var bin = cyl(.28, .24, .8, M.metal, b[0], .4, b[1], 14); scene.add(bin); });

    /* ---------- machines: the box, the Forge, four perk vendors ---------- */
    MACHINES.forEach(function(m){ var g = new THREE.Group(), lit = [];
      if(m.kind === 'box'){ g.add(box(.9, .5, .6, M.wood, 0, .25, 0)); var lid = box(.92, .08, .62, M.wood, 0, .54, 0); g.add(lid); g.add(box(.94, .06, .64, M.metal, 0, .3, 0)); var qm = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshStandardMaterial({ color:0x8cc7ff, emissive:0x8cc7ff, emissiveIntensity:1.6 })); qm.position.set(0, .66, 0); g.add(qm); world.dispose.push(qm.geometry); m.lid = lid; m.gem = qm; }
      else if(m.kind === 'forge'){ g.add(box(1.1, 1.3, .8, M.metal, 0, .65, 0)); var mouth = box(.6, .36, .1, new THREE.MeshStandardMaterial({ color:0xff6a00, emissive:0xff5a00, emissiveIntensity:2.6 }), 0, .7, .4); g.add(mouth); g.add(box(.3, .5, .3, M.metal, 0, 1.55, 0)); g.add(box(1.2, .1, .9, M.dark, 0, 1.35, 0)); m.mouth = mouth; lit.push(mouth); }
      else { var pk = PERKS[m.kind], col = new THREE.Color(pk.col); g.add(box(.8, 1.9, .6, M.metal, 0, .95, 0)); var panel = box(.62, 1.0, .06, new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:1.4, roughness:.4 }), 0, 1.25, .31); g.add(panel); lit.push(panel);
        var lt = textTex(256, 96, function(x, w, h){ x.fillStyle = '#111'; x.fillRect(0, 0, w, h); text(x, pk.name.toUpperCase(), 128, 34, 30, pk.col, 'center', 900); text(x, pk.cost+' PTS', 128, 70, 22, '#fff', 'center', 800); }); g.add(plane(.62, .24, new THREE.MeshBasicMaterial({ map:lt }), 0, .55, .32, [0, 1])); m.panel = panel; }
      /* face the room: turn toward the nearest open neighbour */
      var f = LOCATE.machines[m.kind]; if(f){ g.rotation.y = Math.atan2(f.x - m.x, f.y - m.y); }
      g.position.set(m.x, floorAt(m.x|0, m.y|0), m.y); scene.add(g); m.grp = g; m.lit = lit; world.machines[m.kind] = m; });

    /* ---------- lights: fluorescent tubes over the platforms, bulbs in the rooms and tunnels, two work lamps by the south stairs ---------- */
    var tube = function(x, y, z, along, light, pri){ var t = box(along ? 1.3 : .08, .06, along ? .08 : 1.3, M.tube, x, y, z), hs = box(along ? 1.4 : .16, .05, along ? .16 : 1.4, M.dark, x, y + .05, z); scene.add(t); scene.add(hs); var o = { mesh:t, x:x, y:y, z:z, light:null, pri:pri || 5 }; if(light){ var L = new THREE.PointLight(0xdfe8ff, 3.6, 14, 1); L.position.set(x, y - .3, z); scene.add(L); o.light = L; o.base = 3.6;   /* linear falloff: inverse-square under a 3.4 m ceiling leaves the floor black or the ceiling white */ world.lights.push({ l:L, pri:o.pri }); } world.tubes.push(o); return o; };
    for(var tx = 11; tx <= 47; tx += 4){ tube(tx + .5, CEIL_HI - .12, 12.5, true, (tx - 11) % 8 === 0, 1); tube(tx + .5, CEIL_HI - .12, 2.5, true, (tx - 11) % 8 === 4, 3); }
    tube(27, CEIL_LO - .1, 20, true, true, 4); tube(33, CEIL_LO - .1, 20, true, false, 9);
    tube(4.5, CEIL_LO - .1, 12, false, true, 6); tube(55.5, CEIL_LO - .1, 12, false, true, 6);
    var bulb = function(x, y, z, pri, col, inten){ var b = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), M.bulb); b.position.set(x, y, z); scene.add(b); world.dispose.push(b.geometry); var L = new THREE.PointLight(col || 0xffd6a0, inten || 1.6, 10, 1); L.position.set(x, y - .25, z); scene.add(L); world.lights.push({ l:L, pri:pri }); return L; };
    bulb(-4, CEIL_LO - .2, TRACK_Z, 7); bulb(MW + 4, CEIL_LO - .2, TRACK_Z, 7); bulb(4.5, CEIL_LO - .2, TRACK_Z, 8); bulb(MW - 4.5, CEIL_LO - .2, TRACK_Z, 8); bulb(-20, CEIL_LO - .2, TRACK_Z, 12, 0xffd6a0, 1); bulb(MW + 20, CEIL_LO - .2, TRACK_Z, 12, 0xffd6a0, 1);
    for(var bx2 = -36; bx2 <= MW + 36; bx2 += 8){ if(bx2 > 1 && bx2 < MW - 1) continue; var bb = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), M.bulb); bb.position.set(bx2, CEIL_LO - .2, TRACK_Z); scene.add(bb); world.dispose.push(bb.geometry); }
    /* work lamps: a halogen on a tripod, warm and a little unsteady */
    var lamp = function(x, z, ry, pri){ var g = new THREE.Group(); g.add(cyl(.02, .02, 1.5, M.dark, 0, .75, 0, 6)); for(var i = 0; i < 3; i++){ var leg = cyl(.012, .012, .8, M.dark, Math.cos(i*2.1)*.22, .38, Math.sin(i*2.1)*.22, 5); leg.rotation.z = Math.cos(i*2.1)*.3; leg.rotation.x = -Math.sin(i*2.1)*.3; g.add(leg); } g.add(box(.36, .26, .16, M.metal, 0, 1.55, 0)); var face = box(.3, .2, .02, M.work, 0, 1.55, .09); g.add(face); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); var L = new THREE.PointLight(0xffb060, 2.6, 11, 1); L.position.set(x + Math.sin(ry)*.3, 1.55, z + Math.cos(ry)*.3); scene.add(L); world.lights.push({ l:L, pri:pri }); world.work = world.work || []; world.work.push({ l:L, face:face, base:2.6 }); };
    lamp(15.5, 14.4, -2.2, 2); lamp(44.5, 14.4, 2.2, 2);
    world.lights.sort(function(p, q){ return p.pri - q.pri; });
    scene.add(new THREE.HemisphereLight(0x303848, 0x0c0a08, .45));
    scene.add(new THREE.AmbientLight(0x1a1c24, .6));

    /* ---------- the train: four cars, lit windows, headlights. It lives in the tunnel until the game calls it ---------- */
    var tr = new THREE.Group(); var carL = 9.2, cars = 4;
    for(var ci = 0; ci < cars; ci++){ var cx0 = ci*(carL + .3); var body = box(carL, 2.3, 2.7, M.train, cx0, PIT_Y + 1.55, 0); tr.add(body); tr.add(box(carL, .3, 2.72, M.trainStripe, cx0, PIT_Y + 1.1, 0)); tr.add(box(carL - .6, .5, 2.5, M.dark, cx0, PIT_Y + 2.85, 0)); tr.add(box(carL, .5, 2.2, M.dark, cx0, PIT_Y + .3, 0));
      for(var wi = 0; wi < 5; wi++){ var wx = cx0 - carL/2 + .9 + wi*1.85; tr.add(box(.95, .62, 2.74, M.window, wx, PIT_Y + 1.95, 0)); } for(var wh = 0; wh < 2; wh++){ tr.add(cyl(.42, .42, .3, M.dark, cx0 - carL/2 + 1.5 + wh*(carL - 3), PIT_Y + .42, .8, 10)); tr.add(cyl(.42, .42, .3, M.dark, cx0 - carL/2 + 1.5 + wh*(carL - 3), PIT_Y + .42, -.8, 10)); } }
    tr.children.forEach(function(m){ if(m.geometry.type === 'CylinderGeometry') m.rotation.x = Math.PI/2; });
    var nose = (cars - 1)*(carL + .3) + carL/2; var hl1 = box(.3, .3, .3, M.headlight, nose + .05, PIT_Y + 1.2, .8), hl2 = box(.3, .3, .3, M.headlight, nose + .05, PIT_Y + 1.2, -.8); tr.add(hl1); tr.add(hl2);
    var hlight = new THREE.PointLight(0xfff4e0, 9, 30, 1); hlight.position.set(nose + 1.5, PIT_Y + 1.4, 0); tr.add(hlight);
    var tail1 = box(.2, .2, .2, new THREE.MeshStandardMaterial({ color:0xff2020, emissive:0xff2020, emissiveIntensity:3 }), -carL/2 - .05, PIT_Y + 1.2, .8), tail2 = tail1.clone(); tail2.position.z = -.8; tr.add(tail1); tr.add(tail2);
    tr.position.set(-200, 0, TRACK_Z); tr.visible = false; scene.add(tr);
    world.train = { grp:tr, tail:-carL/2, nose:nose, hlight:hlight };
    return world;
  }
/* tigOS arcade, Nightshift part 03: actors. Jointed, textured zombies with a procedural shamble, the weapon viewmodels, particles, tracers,
   blood decals and the muzzle flash. Pure construction and per-frame animation; the rules live in part 05. */
  /* the dead: jointed capsule bodies (two-segment arms and legs, a lathed torso, a sphere head with a hanging jaw), skinned with
     canvas textures of mottled skin and filthy torn cloth. 0-3 walkers in four decays, 4 = wraith. Every body is a little different:
     height, hunch, a dropped shoulder, a missing forearm, hair or none. */
  var PALS = [ { skin:'#7f8f68', skin2:'#4d5a3c', shirt:'#343946', pants:'#232228', hair:'#1c1a18' }, { skin:'#b3ada0', skin2:'#6e6459', shirt:'#5e2b2b', pants:'#2a2830', hair:'#3a3128' }, { skin:'#6f8460', skin2:'#3a4a34', shirt:'#2c4638', pants:'#3a2718', hair:'#101010' }, { skin:'#a08772', skin2:'#5c3f33', shirt:'#4a1e1e', pants:'#1e1e24', hair:'#2a1010' }, { skin:'#dfe9ff', skin2:'#9fb4e6', shirt:'#aebfe8', pants:'#8b9cd0', hair:'#f2f6ff' } ];   /* 4 = wraith */
  var ZGEO = null, ZTEX = null;
  function zgeo(){ if(ZGEO) return ZGEO; var THREE = window.THREE, pts = [], prof = [[0, .155], [.08, .165], [.2, .15], [.34, .17], [.46, .21], [.56, .225], [.62, .2], [.66, .09]];
    prof.forEach(function(q){ pts.push(new THREE.Vector2(q[1], q[0])); }); var torso = new THREE.LatheGeometry(pts, 12); torso.scale(1, 1, .62);
    ZGEO = { torso:torso, neck:new THREE.CylinderGeometry(.045, .06, .1, 8), head:new THREE.SphereGeometry(.125, 14, 12), jaw:new THREE.SphereGeometry(.06, 10, 8), hair:new THREE.SphereGeometry(.132, 12, 7, 0, Math.PI*2, 0, 1.25),
      eye:new THREE.SphereGeometry(.018, 6, 6), uarm:new THREE.CapsuleGeometry(.052, .26, 3, 8), farm:new THREE.CapsuleGeometry(.042, .25, 3, 8), hand:new THREE.SphereGeometry(.05, 8, 6), thigh:new THREE.CapsuleGeometry(.078, .38, 3, 9), shin:new THREE.CapsuleGeometry(.06, .37, 3, 8), foot:new THREE.BoxGeometry(.1, .06, .21) };
    ZGEO.head.scale(1, 1.12, 1.04); ZGEO.jaw.scale(1.1, .7, 1); ZGEO.hand.scale(.9, .6, 1.2); return ZGEO; }
  function ztex(){ if(ZTEX) return ZTEX; var THREE = window.THREE; ZTEX = PALS.map(function(pal, i){ var wraith = i === 4, mk2 = function(fn){ var c = mk(64, 64), x = c.getContext('2d'); fn(x, 64, 64); var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
      return { skin:mk2(function(x, w, h){ x.fillStyle = pal.skin; x.fillRect(0, 0, w, h); for(var k = 0; k < 140; k++){ x.fillStyle = 'rgba(0,0,0,'+(.04 + srand()*.12)+')'; var r = 1 + srand()*5; x.beginPath(); x.arc(srand()*w, srand()*h, r, 0, 7); x.fill(); } x.strokeStyle = pal.skin2; x.lineWidth = 1; for(var v = 0; v < 9; v++){ x.beginPath(); var vx = srand()*w, vy = srand()*h; x.moveTo(vx, vy); for(var q = 0; q < 4; q++){ vx += srand()*14 - 7; vy += srand()*14 - 7; x.lineTo(vx, vy); } x.globalAlpha = .55; x.stroke(); x.globalAlpha = 1; } if(!wraith) for(var wnd = 0; wnd < 3; wnd++){ x.fillStyle = '#3a0a0a'; x.beginPath(); x.ellipse(srand()*w, srand()*h, 2 + srand()*3, 1 + srand()*2, srand()*3, 0, 7); x.fill(); } grain(x, w, h, .22, 500); }),
        cloth:mk2(function(x, w, h){ x.fillStyle = pal.shirt; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; for(var k = 0; k < 64; k += 4) x.fillRect(k, 0, 1, h); for(var k2 = 0; k2 < 40; k2++){ x.fillStyle = 'rgba(30,20,10,'+(.08 + srand()*.25)+')'; x.fillRect(srand()*w, srand()*h, 2 + srand()*10, 2 + srand()*6); } if(!wraith){ for(var b = 0; b < 4; b++){ x.fillStyle = 'rgba(70,6,6,'+(.5 + srand()*.4)+')'; x.beginPath(); x.ellipse(srand()*w, srand()*h, 3 + srand()*7, 2 + srand()*5, srand()*3, 0, 7); x.fill(); } } grain(x, w, h, .18, 400); }),
        pants:mk2(function(x, w, h){ x.fillStyle = pal.pants; x.fillRect(0, 0, w, h); for(var k = 0; k < 50; k++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '90,80,60')+','+(.08 + srand()*.2)+')'; x.fillRect(srand()*w, srand()*h, 1 + srand()*8, 1 + srand()*8); } grain(x, w, h, .2, 400); }) }; }); return ZTEX; }
  function makeZombie(v, brute){
    var THREE = window.THREE, Z = zgeo(), TX = ztex()[v], pal = PALS[v], wraith = v === 4, std = function(hex, map){ var m = new THREE.MeshStandardMaterial({ color:map ? 0xffffff : hex, map:map || null, roughness:.92 }); if(wraith){ m.transparent = true; m.opacity = .62; m.emissive = new THREE.Color(0x8fa8ff); m.emissiveIntensity = .35; } return m; };
    var mats = { skin:std(pal.skin, TX.skin), shirt:std(pal.shirt, TX.cloth), pants:std(pal.pants, TX.pants), hair:std(pal.hair) }, eyeM = new THREE.MeshStandardMaterial({ color:0xff2020, emissive:0xff2a2a, emissiveIntensity:3 });
    var g = new THREE.Group(), P = {}, mesh = function(geo, mat, x, y, z){ var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
    P.torso = mesh(Z.torso, mats.shirt, 0, .9, 0); g.add(P.torso);
    P.headP = new THREE.Group(); P.headP.position.set(0, 1.55, .04); P.headP.add(mesh(Z.neck, mats.skin, 0, .04, 0)); P.headP.add(mesh(Z.head, mats.skin, 0, .2, 0)); P.jaw = mesh(Z.jaw, mats.skin, 0, .09, .07); P.headP.add(P.jaw);
    if(Math.random() < .72 || wraith) P.headP.add(mesh(Z.hair, mats.hair, 0, .24, -.01));
    P.headP.add(mesh(Z.eye, eyeM, -.05, .215, .105)); P.headP.add(mesh(Z.eye, eyeM, .05, .215, .105)); g.add(P.headP);
    var arm = function(side){ var p = new THREE.Group(); p.position.set(side*.245, 1.47, 0); p.add(mesh(Z.uarm, mats.shirt, 0, -.15, 0)); var el = new THREE.Group(); el.position.set(0, -.3, 0); p.elbow = el; p.add(el);
      if(!(side === 1 && Math.random() < .16 && !wraith)){ el.add(mesh(Z.farm, mats.skin, 0, -.14, 0)); el.add(mesh(Z.hand, mats.skin, 0, -.3, .02)); } g.add(p); return p; }; P.armL = arm(-1); P.armR = arm(1);
    var leg = function(side){ var p = new THREE.Group(); p.position.set(side*.1, .9, 0); p.add(mesh(Z.thigh, mats.pants, 0, -.21, 0)); var kn = new THREE.Group(); kn.position.set(0, -.42, 0); p.knee = kn; p.add(kn); kn.add(mesh(Z.shin, mats.pants, 0, -.2, 0)); kn.add(mesh(Z.foot, mats.hair, 0, -.42, .05)); g.add(p); return p; }; P.legL = leg(-1); P.legR = leg(1);
    var s = brute ? 1.28 : wraith ? 1.06 : .94 + Math.random()*.12; g.scale.set(s*(brute ? 1.18 : 1), s, s*(brute ? 1.1 : 1));
    var body = new THREE.Group(); body.add(g);   /* body = the thing the game positions and turns; g tips over when it dies */
    return { grp:body, inner:g, P:P, mats:[mats.skin, mats.shirt, mats.pants, mats.hair, eyeM], s:s, r:(brute ? .48 : .34)*s, h:1.9*s, headY:1.5*s, lop:Math.random()*.25, tilt:(Math.random() < .5 ? -1 : 1)*(.08 + Math.random()*.14), hunch:.12 + Math.random()*.16 };
  }
  function animZombie(z, dt, t){
    var m = z.m, P = m.P, a = z.anim, swing = Math.sin(a*3.2), k = Math.min(1, z.speed/2), lean = (z.brute ? .2 : m.hunch) + (z.runner ? .22 : 0);
    if(z.dead){ var kd = clamp(1 - z.deadT/z.deadT0, 0, 1), fall = Math.min(1, kd*4.5); m.inner.rotation.x = fall*1.5*z.fallDir; m.inner.rotation.z = fall*.2*m.tilt; m.inner.position.y = kd > .6 ? -(kd - .6)*2.6 : 0; P.armL.rotation.x = P.armR.rotation.x = -1.4 + fall; P.armL.elbow.rotation.x = P.armR.elbow.rotation.x = -.4; P.legL.knee.rotation.x = P.legR.knee.rotation.x = .3*fall; P.jaw.position.y = .07; return; }
    var riseK = z.rise > 0 ? 1 - z.rise/z.rise0 : 1;
    /* legs: the thigh swings, the knee bends as the leg comes forward and straightens as it takes weight; one leg drags a little */
    P.legL.rotation.x = swing*.6*k; P.legR.rotation.x = -swing*.6*k*(1 - m.lop*.5);
    P.legL.knee.rotation.x = .12 + Math.max(0, -Math.sin(a*3.2 + .7))*.85*k; P.legR.knee.rotation.x = .12 + Math.max(0, Math.sin(a*3.2 + .7))*.85*k;
    /* arms: hang forward and reach; the attack snaps both up and out */
    var atkK = z.atk > 0 ? 1 - z.atk/.45 : 0, reach = z.atk > 0 ? -1.75 + atkK*1.3 : -.95 - m.lop*.6 + Math.sin(a*1.6)*.1 + (z.runner ? -.35 : 0);
    P.armL.rotation.x = reach - swing*.12; P.armR.rotation.x = reach*(1 - m.lop*.35) + swing*.12; P.armL.rotation.z = .14 + (z.atk > 0 ? -.35 : 0); P.armR.rotation.z = -.14 - m.lop*.3 + (z.atk > 0 ? .35 : 0);
    P.armL.elbow.rotation.x = -(z.atk > 0 ? .15 : .55 + Math.sin(a*1.6 + 1)*.15); P.armR.elbow.rotation.x = -(z.atk > 0 ? .15 : .45 + m.lop*.4);
    /* torso, head and jaw */
    m.inner.rotation.x = lean + Math.sin(a*1.6)*.03; m.inner.rotation.z = Math.sin(a*1.6)*.05 + (z.wraith ? Math.sin(t*2 + a)*.12 : 0);
    P.headP.rotation.z = m.tilt + Math.sin(a*1.6 + 1)*.1 + (z.wraith ? .3 : 0); P.headP.rotation.x = -.2 - lean*.6 + (z.atk > 0 ? .35 : 0) + Math.sin(a*.8)*.06;
    P.jaw.position.y = .07 - (z.atk > 0 ? .035 : .012 + Math.max(0, Math.sin(a*2.3))*.02);
    m.inner.position.y = (z.wraith ? .15 + Math.sin(t*4 + a)*.08 : Math.abs(Math.sin(a*3.2))*.035*k) - (1 - riseK)*.35;
    var em = z.flash > 0 ? .9 : 0; if(em !== z.emLast){ z.emLast = em; m.mats.forEach(function(mt, i){ if(i === 4) return; if(z.wraith) mt.emissiveIntensity = .35 + em; else { mt.emissive.setHex(em ? 0xffffff : 0); mt.emissiveIntensity = em; } }); }
  }

  /* ---------- weapon viewmodels: boxes in gun space (x forward, y up, z right, centimetres) ---------- */
  var GUNM = null;
  function gunMats(){ if(GUNM) return GUNM; var THREE = window.THREE, A = assets(), s = function(o){ return new THREE.MeshStandardMaterial(o); }; GUNM = { dark:s({ color:0x2a2c34, roughness:.5, metalness:.35 }), mid:s({ color:0x3b3e48, roughness:.45, metalness:.35 }), light:s({ color:0x5a5e6e, roughness:.4, metalness:.4 }), black:s({ color:0x15161b, roughness:.6, metalness:.3 }), wood:s({ map:A.tex.wood, roughness:.7 }), teal:s({ color:0x63e6be, emissive:0x63e6be, emissiveIntensity:.9 }), orange:s({ color:0xff8a00, emissive:0xff8a00, emissiveIntensity:1.8 }), purple:s({ color:0x2a2140, roughness:.4, metalness:.6 }), violet:s({ color:0xa78bfa, emissive:0xa78bfa, emissiveIntensity:1.6 }), glow:s({ color:0xffb15c, emissive:0xffb15c, emissiveIntensity:2.4 }) }; return GUNM; }
  var GUN_DEF = {
    sidearm:  { mz:[24, 4.2, 0], grip:[0, -5, 0], parts:[[11, 4, 0, 24, 4.2, 3.2, 'mid'], [9, 1, 0, 20, 3, 3.4, 'dark'], [1, -5.5, 0, 4.4, 12, 3.6, 'black'], [8, -1.6, 0, 6, 1, .8, 'dark'], [22.5, 4.2, 0, 3, 2.2, 2.2, 'black'], [20, 6.6, 0, 1, 1, .8, 'light']], stripe:[[10, 6.4, 0, 12, .4, 3.4]] },
    stitcher: { mz:[36, 4.2, 0], grip:[-1, -5, 0], parts:[[9, 3, 0, 30, 6, 4.2, 'mid'], [29, 4.2, 0, 14, 2.2, 2.2, 'dark'], [6, -6, 0, 4, 14, 3.4, 'black'], [-2, -6, 0, 4.2, 10, 3.6, 'black'], [-14, 3, 0, 14, 3, 2.4, 'dark'], [-21, 3, 0, 2, 6, 3, 'dark'], [17, -3, 0, 3, 6, 3.4, 'black'], [8, 6.6, 0, 20, 1.2, 1.4, 'light']], stripe:[[9, 6, 0, 26, .4, 4.4]] },
    doorman:  { mz:[44, 4.2, 0], grip:[-4, -3, 0], parts:[[6, 3, 0, 22, 6, 4.4, 'mid'], [-14, 1, 0, 18, 6.5, 4, 'wood'], [-24, 1, 0, 3, 8, 4.4, 'black'], [21, 1.4, 0, 10, 4, 4.4, 'wood'], [31, 4.2, 0, 26, 2.3, 2.3, 'dark'], [31, 1.5, 0, 26, 2, 2, 'dark'], [43, 5.6, 0, 1, 1, .8, 'light']], stripe:[[6, 6.2, 0, 20, .4, 4.6]] },
    longbow:  { mz:[50, 4.2, 0], grip:[-2, -5, 0], parts:[[8, 3, 0, 24, 5, 4, 'mid'], [35, 4.2, 0, 30, 1.9, 1.9, 'dark'], [-16, 2, 0, 18, 5, 3.2, 'dark'], [-25, 2, 0, 2, 7, 3.6, 'black'], [6, -4, 0, 3.2, 8, 3.2, 'black'], [-2, -5.5, 0, 4, 9, 3.4, 'black'], [10, 8.4, 0, 14, 3, 3, 'black'], [4, 6.6, 0, 1.4, 1.6, 1.4, 'light'], [16, 6.6, 0, 1.4, 1.6, 1.4, 'light'], [24, 2, 0, 12, 1.4, 4.2, 'dark']], stripe:[[8, 5.6, 0, 22, .4, 4.2]] },
    anvil:    { mz:[51, 4.2, 0], grip:[-4, -6, 0], parts:[[8, 3, 0, 32, 8, 5, 'mid'], [37, 4.2, 0, 28, 2.6, 2.6, 'dark'], [27, 4.2, 0, 12, 4.4, 4.4, 'light'], [8, -6, 0, 12, 10, 6.2, 'black'], [-4, -6, 0, 4.2, 10, 3.6, 'black'], [-18, 3, 0, 14, 5, 4, 'dark'], [-25, 3, 0, 2, 7.5, 4.4, 'black'], [31, -1, 0, 1.6, 8, 1.6, 'dark'], [8, 7.8, 0, 24, 1, 1.6, 'light']], stripe:[[8, 7.2, 0, 30, .4, 5.2]] },
    prism:    { mz:[36, 3, 0], grip:[-2, -6, 0], parts:[[8, 3, 0, 34, 8, 6, 'purple'], [30, 3, 0, 8, 6, 6, 'black'], [-2, -6, 0, 4.4, 10, 3.6, 'black'], [-14, 2, 0, 10, 4, 4, 'purple'], [8, -3, 0, 20, 2, 5, 'violet']], rings:[[14, 3, 0], [22, 3, 0], [34, 3, 0]], stripe:[[8, 7.2, 0, 28, .5, 6.2]] }
  };
  function makeGun(id, up){
    var THREE = window.THREE, GM = gunMats(), d = GUN_DEF[id] || GUN_DEF.sidearm, g = new THREE.Group(), geos = [];
    d.parts.forEach(function(p){ var geo = new THREE.BoxGeometry(p[3]*.01, p[4]*.01, p[5]*.01), m = new THREE.Mesh(geo, GM[p[6]]); m.position.set(p[0]*.01, p[1]*.01, p[2]*.01); g.add(m); geos.push(geo); });
    (d.rings || []).forEach(function(r){ var geo = new THREE.TorusGeometry(.04, .009, 8, 18), m = new THREE.Mesh(geo, up ? GM.glow : GM.violet); m.position.set(r[0]*.01, r[1]*.01, r[2]*.01); m.rotation.y = Math.PI/2; g.add(m); geos.push(geo); });
    if(up){ d.stripe.forEach(function(s){ var geo = new THREE.BoxGeometry(s[3]*.01, s[4]*.01, s[5]*.01), m = new THREE.Mesh(geo, GM.orange); m.position.set(s[0]*.01, s[1]*.01, s[2]*.01); g.add(m); geos.push(geo); }); var L = new THREE.PointLight(0xff8a00, .5, 1.5, 1); L.position.set(.1, .06, 0); g.add(L); }
    else if(id !== 'prism'){ var geo2 = new THREE.BoxGeometry(d.stripe[0][3]*.01*.5, .004, d.stripe[0][5]*.01), m2 = new THREE.Mesh(geo2, GM.teal); m2.position.set(d.stripe[0][0]*.01, d.stripe[0][1]*.01 - .01, 0); g.add(m2); geos.push(geo2); }
    var A = assets(), fl = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), A.mat.flash); fl.position.set(d.mz[0]*.01 + .1, d.mz[1]*.01, 0); fl.rotation.y = Math.PI/2; fl.visible = false; g.add(fl); geos.push(fl.geometry);
    var fl2 = fl.clone(); fl2.rotation.set(0, 0, Math.PI/4); fl2.position.set(d.mz[0]*.01 + .16, d.mz[1]*.01, 0); fl2.visible = false; g.add(fl2);
    var ML = new THREE.PointLight(0xffb060, 0, 6, 1); ML.position.set(d.mz[0]*.01, d.mz[1]*.01, 0); g.add(ML);
    return { grp:g, mz:new THREE.Vector3(d.mz[0]*.01, d.mz[1]*.01, d.mz[2]*.01), grip:new THREE.Vector3(d.grip[0]*.01, d.grip[1]*.01, d.grip[2]*.01), flash:[fl, fl2], light:ML, dispose:function(){ geos.forEach(function(q){ q.dispose(); }); } };
  }

  /* ---------- particles (Points), tracers, decals ---------- */
  function Particles(scene, n, size, tex){
    var THREE = window.THREE, pos = new Float32Array(n*3), col = new Float32Array(n*3), geo = new THREE.BufferGeometry(); for(var i = 0; i < n; i++) pos[i*3 + 1] = -1000;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size:size, vertexColors:true, map:tex, transparent:true, depthWrite:false, sizeAttenuation:true, alphaTest:.02 }), pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    var live = [], free = []; for(var k = n - 1; k >= 0; k--) free.push(k); var tmp = new THREE.Color();
    return { list:live, count:function(){ return live.length; },
      add:function(x, y, z, vx, vy, vz, t, hex, g){ if(!free.length) return; var i = free.pop(); tmp.set(hex); col[i*3] = tmp.r; col[i*3 + 1] = tmp.g; col[i*3 + 2] = tmp.b; live.push({ i:i, x:x, y:y, z:z, vx:vx, vy:vy, vz:vz, t:t, g:g === undefined ? 9 : g, floor:0 }); },
      update:function(dt, floorFn){ for(var k = live.length - 1; k >= 0; k--){ var p = live[k]; p.t -= dt; if(p.t <= 0){ pos[p.i*3 + 1] = -1000; free.push(p.i); live.splice(k, 1); continue; } p.vy -= p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt; var fy = floorFn ? floorFn(p.x, p.z) : 0; if(p.y < fy + .01){ p.y = fy + .01; p.vy = -p.vy*.2; p.vx *= .5; p.vz *= .5; } pos[p.i*3] = p.x; pos[p.i*3 + 1] = p.y; pos[p.i*3 + 2] = p.z; } geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; },
      dispose:function(){ scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
  function Beams(scene, n, mat, thick){
    var THREE = window.THREE, geo = new THREE.BoxGeometry(thick, thick, 1), pool = [], live = [];
    for(var i = 0; i < n; i++){ var m = new THREE.Mesh(geo, mat.clone()); m.visible = false; m.frustumCulled = false; scene.add(m); pool.push(m); }
    var tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    return { list:live, add:function(a, b, t, col){ var m = pool.pop(); if(!m) return; tmpA.set(a.x, a.y, a.z); tmpB.set(b.x, b.y, b.z); var L = tmpA.distanceTo(tmpB); if(L < .05){ pool.push(m); return; } m.position.copy(tmpA).add(tmpB).multiplyScalar(.5); m.lookAt(tmpB); m.scale.set(1, 1, L); m.visible = true; if(col) m.material.color.set(col); live.push({ m:m, t:t, t0:t, x:b.x, y:b.y, z:b.z }); },
      update:function(dt){ for(var k = live.length - 1; k >= 0; k--){ var b = live[k]; b.t -= dt; if(b.t <= 0){ b.m.visible = false; pool.push(b.m); live.splice(k, 1); continue; } b.m.material.opacity = .9*b.t/b.t0; } },
      dispose:function(){ pool.concat(live.map(function(b){ return b.m; })).forEach(function(m){ scene.remove(m); m.material.dispose(); }); geo.dispose(); } };
  }
  function Decals(scene, n, mat){
    var THREE = window.THREE, geo = new THREE.PlaneGeometry(1, 1), ring = [], at = 0;
    for(var i = 0; i < n; i++){ var m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI/2; m.visible = false; m.renderOrder = 1; scene.add(m); ring.push(m); }
    return { add:function(x, y, z, size){ var m = ring[at++ % n]; m.position.set(x, y + .012, z); m.rotation.z = Math.random()*6.28; m.scale.set(size, size, 1); m.visible = true; }, clear:function(){ ring.forEach(function(m){ m.visible = false; }); }, dispose:function(){ ring.forEach(function(m){ scene.remove(m); }); geo.dispose(); } };
  }
/* tigOS arcade, Nightshift part 04: sound. A WebAudio synth with a generated reverb so the station echoes. Gunshots are layered (a click,
   a body and a tail), casings tink on the tile, footsteps, groans through a formant filter, a fluorescent hum, drips in the tunnel,
   and the train: a rumble whose pitch follows its speed, a brake squeal and a horn. No audio files anywhere. */
  function Synth(){
    var ac = null, muted = false, master, dry, verb, wet, hum, humG, rumble, rumbleG, rumbleF, squeal, squealG;
    function ctx(){ if(ac || muted) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5*SET.vol; var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; master.connect(comp); comp.connect(ac.destination);
        dry = ac.createGain(); dry.gain.value = 1; dry.connect(master); verb = ac.createConvolver(); verb.buffer = impulse(1.9, 2.4); wet = ac.createGain(); wet.gain.value = .32; verb.connect(wet); wet.connect(master); } catch(e){ ac = null; } return ac; }
    function impulse(dur, decay){ var n = ac.sampleRate*dur | 0, b = ac.createBuffer(2, n, ac.sampleRate); for(var c = 0; c < 2; c++){ var d = b.getChannelData(c); for(var i = 0; i < n; i++){ var k = i/n; d[i] = (Math.random()*2 - 1)*Math.pow(1 - k, decay)*(i < 2000 ? i/2000 : 1); } } return b; }
    function out(node, send){ node.connect(dry); if(send){ var g = ac.createGain(); g.gain.value = send; node.connect(g); g.connect(verb); } }
    function noise(dur, freq, gain, q, send, type, delay){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); out(g, send); s.start(a.currentTime + (delay || 0)); }
    function tone(type, f0, f1, dur, gain, send, delay){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); out(g, send); o.start(t0); o.stop(t0 + dur + .02); }
    function formant(f0, f1, dur, gain, band, q, vib){ var a = ctx(); if(!a) return; var t0 = a.currentTime, o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(), l = a.createOscillator(), lg = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f1, t0 + dur); l.frequency.value = vib || 6; lg.gain.value = f0*.06; l.connect(lg); lg.connect(o.frequency); f.type = 'bandpass'; f.frequency.setValueAtTime(band, t0); f.frequency.linearRampToValueAtTime(band*.6, t0 + dur); f.Q.value = q || 3; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + dur*.25); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(f); f.connect(g); out(g, .5); o.start(t0); l.start(t0); o.stop(t0 + dur + .02); l.stop(t0 + dur + .02); }
    function casing(){ var d = .35 + Math.random()*.3; tone('sine', 3200 + Math.random()*1200, 2400, .05, .05, .3, d); tone('sine', 4200, 3000, .04, .03, .3, d + .09 + Math.random()*.05); }
    function shot(k){
      if(k === 'doorman'){ noise(.02, 6000, 1.2, .5, 0, 'highpass'); noise(.38, 700, 1.2, .6, .8); tone('sine', 140, 38, .32, .7, .5); tone('triangle', 90, 30, .4, .4, .4); }
      else if(k === 'longbow'){ noise(.015, 7000, 1, .5, 0, 'highpass'); noise(.3, 1800, .8, .8, .9); tone('sine', 220, 45, .3, .6, .6); }
      else if(k === 'anvil'){ noise(.012, 5000, .8, .5, 0, 'highpass'); noise(.13, 1500, .6, 1, .5); tone('sine', 160, 60, .1, .4, .3); }
      else if(k === 'prism'){ tone('sawtooth', 900, 200, .25, .3, .6); tone('square', 1400, 300, .18, .12, .4); tone('sine', 3000, 600, .12, .08, .5); }
      else { noise(.012, 6000, .9, .5, 0, 'highpass'); noise(.12, 2200, .55, 1, .6); tone('sine', 230, 70, .1, .35, .4); }
      if(k !== 'prism') casing();
    }
    function ensureLoops(){ var a = ctx(); if(!a || hum) return;
      hum = a.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 120; var hf = a.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 400; humG = a.createGain(); humG.gain.value = .012; hum.connect(hf); hf.connect(humG); humG.connect(master); hum.start();
      var n = a.sampleRate*2 | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), last = 0; for(var i = 0; i < n; i++){ last = (last + (Math.random()*2 - 1)*.02)*.995; d[i] = last*8; }   /* brown noise */
      rumble = a.createBufferSource(); rumble.buffer = b; rumble.loop = true; rumbleF = a.createBiquadFilter(); rumbleF.type = 'lowpass'; rumbleF.frequency.value = 80; rumbleG = a.createGain(); rumbleG.gain.value = 0; rumble.connect(rumbleF); rumbleF.connect(rumbleG); rumbleG.connect(master); rumbleG.connect(verb); rumble.start();
      squeal = a.createOscillator(); squeal.type = 'sine'; squeal.frequency.value = 2800; squealG = a.createGain(); squealG.gain.value = 0; var sv = a.createOscillator(), svg = a.createGain(); sv.frequency.value = 9; svg.gain.value = 60; sv.connect(svg); svg.connect(squeal.frequency); squeal.connect(squealG); squealG.connect(master); squealG.connect(verb); squeal.start(); sv.start(); }
    return {
      toggle:function(){ muted = !muted; if(muted && ac){ try { ac.suspend(); } catch(e){} } else if(ac){ try { ac.resume(); } catch(e){} } return muted; }, isMuted:function(){ return muted; },
      volume:function(v){ if(master) master.gain.value = .5*v; },
      ambient:function(on){ ensureLoops(); if(humG) humG.gain.value = on ? .012 : 0; },
      train:function(speed, braking){ ensureLoops(); if(!rumbleG) return; var s = clamp(speed/16, 0, 1); rumbleG.gain.value = Math.min(.9, s*1.1)*(speed > 0 ? 1 : 0); rumbleF.frequency.value = 60 + s*260; squealG.gain.value = braking && speed > 2 ? Math.min(.09, s*.14) : 0; if(squeal) squeal.frequency.value = 2400 + s*900; },
      horn:function(){ tone('sawtooth', 311, 305, 1.1, .16, .9); tone('sawtooth', 370, 366, 1.1, .12, .9); tone('square', 155, 152, 1.1, .06, .9); },
      shot:shot, empty:function(){ tone('square', 1200, 900, .05, .08); tone('square', 600, 500, .03, .05, 0, .06); }, laser:function(){ tone('sawtooth', 1700, 240, .16, .2, .5); tone('square', 2600, 520, .09, .06, .4); }, tick:function(){ tone('square', 1100, 900, .035, .07); },
      reload:function(){ tone('square', 700, 500, .05, .09, .3); noise(.06, 3000, .25, 1, .3, 'bandpass', .05); tone('square', 500, 900, .05, .09, .3, .34); noise(.05, 4000, .3, 1, .3, 'bandpass', .5); },
      swap:function(){ noise(.08, 2500, .3, 1, .3, 'bandpass'); tone('square', 400, 600, .05, .06, .3, .1); },
      step:function(pit){ noise(.07, pit ? 900 : 1600, pit ? .18 : .14, 1, .35, pit ? 'lowpass' : 'bandpass'); },
      hit:function(){ noise(.08, 900, .5, 1, .2); tone('sine', 700, 500, .05, .12); }, kill:function(){ noise(.16, 600, .7, 1, .4); tone('sawtooth', 300, 80, .18, .18, .4); },
      ricochet:function(){ tone('sine', 3400 + Math.random()*1800, 900, .12, .08, .7); noise(.03, 5000, .4, 1, .3, 'highpass'); },
      hurt:function(){ noise(.25, 500, .8, 1, .3); tone('sawtooth', 120, 60, .3, .4, .3); }, growl:function(near){ formant(70 + Math.random()*50, 55, .7 + Math.random()*.6, near ? .22 : .12, 400 + Math.random()*500, 4, 5 + Math.random()*4); },
      shriek:function(){ formant(400 + Math.random()*200, 180, 1.4, .14, 1500, 6, 9); },
      buy:function(){ tone('sine', 660, 990, .12, .2, .4); tone('sine', 990, 1320, .15, .2, .4, .11); }, deny:function(){ tone('square', 200, 150, .18, .15, .2); },
      gate:function(){ noise(.9, 900, .5, .6, .7, 'bandpass'); for(var i = 0; i < 6; i++) tone('square', 90 + i*20, 80, .08, .06, .5, i*.13); },
      wave:function(){ tone('sawtooth', 80, 40, 1.4, .4, .9); tone('sine', 55, 30, 1.6, .5, .9); }, wraith:function(){ tone('sine', 520, 180, 2.2, .18, .9); tone('sawtooth', 260, 70, 2.6, .12, .9); noise(2.4, 300, .35, .3, .9); tone('sine', 700, 210, 1.6, .12, .9, .5); },
      power:function(){ tone('sawtooth', 60, 220, .9, .3, .6); noise(.8, 600, .5, 1, .6); tone('sine', 120, 120, 1.2, .1, .5, .8); }, boom:function(){ noise(.7, 400, 1.4, .3, 1); tone('sine', 90, 25, .7, .9, .8); noise(.02, 8000, 1, .5, 0, 'highpass'); },
      pickup:function(){ tone('sine', 880, 1760, .25, .2, .5); tone('sine', 1320, 2640, .3, .15, .5, .1); }, drip:function(){ tone('sine', 1800 + Math.random()*900, 900, .09, .05, .9); },
      forge:function(){ noise(1.2, 300, .6, 1, .8); tone('sawtooth', 60, 300, 1.2, .25, .6); tone('sine', 900, 2400, .6, .1, .6, .9); },
      close:function(){ if(ac){ try { ac.close(); } catch(e){} ac = null; hum = null; } } };
  }
/* tigOS arcade, Nightshift part 05: the rules. Waves, points, the economy (grates, wall buys, resupply, the box, perks, power, the Forge),
   the dead and how they move, the guns and how they hit, grenades, the train. nightshift(api) opens here and closes in part 06. */
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
  var PU_DEF = { ammo:{ col:'#63e6be', label:'MAX AMMO' }, '2x':{ col:'#ffd166', label:'2X POINTS' }, insta:{ col:'#ff5f57', label:'INSTA-KILL' }, nuke:{ col:'#a7ffb0', label:'NUKE' } };
  var EYE = 1.6;

  function nightshift(api){
    var THREE = window.THREE, A = assets(), M = A.mat;
    var g = {}, snd = Synth(), touch = api.touch, flow = new Int16Array(MW*MH), flowKey = '';
    var special, fogK, P, zombies, pickups, grenades, wave, toSpawn, brutes, spawnT, alive, kills, points, total, hp, maxhp, regenT, doors, power, perks, weapons, slot, fireT, reloadT, reloading, held, mouseDown, trigger, shake, flash, hitM, hitKill, dmgFlash, whiteFlash, banner, bannerT, over, puX2, puInsta, gren, grenT, meleeT, melee, msg, msgT, boxRoll, boxName, boxLast, boxPick, swapT, prompt, t, bob, stepPh, between, recoil, dragX, dragY, flick = 0, flickT = 4, flickTube = null, dripT = 5, train, footY, overMsg, mode = 'menu', booted = false, jumpZ = 0, vz = 0, attract = null, lastRun = null;
    var R = null;   /* the renderer bag, built in part 06 */
    function walk(x, z){ var c = ch(x, z); if(c === '.' || c === 'P' || c === 'C') return !MTILE[x+','+z]; if(c === '_') return !trainBlocks(x); if(isDoor(c)) return !!doors[x+','+z]; return false; }
    function passes(c){ return isOpen(c) && !(isDoor(c) && false); }   /* what a bullet flies through: everything open, doors only when open (checked with position) */
    function trainBlocks(x){ return train && train.grp.visible && train.v < 1.5 && x + 1 > train.x + train.tail - .3 && x < train.x + train.nose + .3; }
    function cast(px, py, dx, dy, bullet){
      var mx = px|0, my = py|0, ddx = Math.abs(1/dx), ddy = Math.abs(1/dy), sx, sy, stx, sty, side = 0, c = '#', n;
      if(dx < 0){ stx = -1; sx = (px - mx)*ddx; } else { stx = 1; sx = (mx + 1 - px)*ddx; }
      if(dy < 0){ sty = -1; sy = (py - my)*ddy; } else { sty = 1; sy = (my + 1 - py)*ddy; }
      for(n = 0; n < 96; n++){ if(sx < sy){ sx += ddx; mx += stx; side = 0; } else { sy += ddy; my += sty; side = 1; } c = ch(mx, my); var open = isFloor(c) || (isDoor(c) && doors[mx+','+my]); if(open && bullet && c === 'B') open = false; if(!open) break; if(bullet && c === '_' && trainBlocks(mx)) { c = 'T'; break; } }
      var dist = side === 0 ? sx - ddx : sy - ddy;
      return { dist:dist, side:side, ch:c, mx:mx, my:my };
    }
    function los(ax, ay, bx, by){ var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if(d < .01) return true; return cast(ax, ay, dx/d, dy/d).dist >= d; }
    function moveCircle(o, nx, ny, r){ var ok = function(x, y){ return walk((x - r)|0, (y - r)|0) && walk((x + r)|0, (y - r)|0) && walk((x - r)|0, (y + r)|0) && walk((x + r)|0, (y + r)|0); }; if(ok(nx, o.y)) o.x = nx; if(ok(o.x, ny)) o.y = ny;
      /* columns are thin: push out of a .25 m core instead of blocking the tile */
      var cx = o.x|0, cy = o.y|0; for(var ox = -1; ox <= 1; ox++) for(var oy = -1; oy <= 1; oy++){ if(ch(cx + ox, cy + oy) !== 'C') continue; var kx = cx + ox + .5, ky = cy + oy + .5, rx = o.x - kx, ry = o.y - ky, d = Math.hypot(rx, ry), need = .26 + r; if(d < need && d > 0){ o.x = kx + rx/d*need; o.y = ky + ry/d*need; } } }
    function computeFlow(){ var px = P.x|0, py = P.y|0, key = px+','+py+':'+Object.keys(doors).length+':'+(train && train.grp.visible && train.v < 1.5 ? (train.x|0) : 'n'); if(key === flowKey) return; flowKey = key; flow.fill(-1); var q = [px + py*MW]; flow[q[0]] = 0; for(var h = 0; h < q.length; h++){ var i = q[h], x = i % MW, y = (i / MW)|0, d = flow[i] + 1; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ var nx = x + o[0], ny = y + o[1], j = nx + ny*MW; if(nx < 0 || ny < 0 || nx >= MW || ny >= MH || flow[j] > -1 || !walk(nx, ny)) return; flow[j] = d; q.push(j); }); } }
    function stat(w){ var b = WEAPONS[w.id], up = w.up; return { id:w.id, up:!!up, dmg:b.dmg * (up ? 2.5 : 1) * (perks.doubletap ? 1.6 : 1), rpm:b.rpm * (perks.doubletap ? 1.35 : 1), mag:Math.round(b.mag * (up ? 1.5 : 1)), res:Math.round(b.res * (up ? 1.5 : 1)), reload:b.reload / (perks.quickhands ? 2 : 1), spread:b.spread, auto:b.auto, pellets:b.pellets || 1, pierce:b.pierce || 1, splash:b.splash || 0, range:b.range || 40, name:up ? b.up : b.name }; }
    function giveWeapon(id){ var w = { id:id, up:false }, st = stat(w); w.mag = st.mag; w.res = st.res; if(weapons.length < 2){ weapons.push(w); slot = weapons.length - 1; } else weapons[slot] = w; reloading = false; fireT = .3; swapT = .34; if(R) R.gunFor(w); }
    function cur(){ return weapons[slot]; }
    function swapTo(s){ if(!weapons[s] || s === slot || over) return false; slot = s; reloading = false; fireT = .25; swapT = .34; R.gunFor(cur()); snd.swap(); return true; }
    function jump(){ if(mode !== 'play' || over || jumpZ > 0 || vz !== 0) return false; vz = 4.6; snd.step(false); return true; }
    function addPoints(n){ n = Math.round(n * (puX2 > 0 ? 2 : 1)); points += n; total += n; api.score(total); }
    function say(s, d){ msg = s; msgT = d || 1.8; }
    function status(){ api.status('wave '+wave+'  \u00b7  '+kills+' kill'+(kills === 1 ? '' : 's')+'  \u00b7  '+points+' pts'); }
    function resetRun(){
      if(R) R.reset();   /* clears last run's meshes before the lists forget them */
      P = { x:START.x, y:START.y, a:START.a, p:0 }; footY = 0; special = false; fogK = 1; zombies = []; pickups = []; grenades = []; wave = 0; toSpawn = 0; brutes = 0; spawnT = 1; alive = 0; kills = 0; points = 500; total = 0; hp = 100; maxhp = 100; regenT = 0; doors = {}; power = false; perks = {}; weapons = []; slot = 0; fireT = 0; reloadT = 0; reloading = false; held = {}; mouseDown = false; trigger = false; shake = 0; flash = 0; hitM = 0; hitKill = false; dmgFlash = 0; whiteFlash = 0; banner = ''; bannerT = 0; over = false; puX2 = 0; puInsta = 0; gren = 4; grenT = 0; meleeT = 0; melee = 0; msg = ''; msgT = 0; boxRoll = 0; boxName = ''; boxLast = ''; boxPick = null; swapT = 0; prompt = null; t = 0; bob = 0; stepPh = 0; between = 0; recoil = 0; dragX = null; dragY = null; flowKey = ''; overMsg = '';
      train = { grp:R.world.train.grp, nose:R.world.train.nose, tail:R.world.train.tail, x:-300, v:0, state:'away', next:28, t:0, braking:false }; train.grp.visible = false;
      jumpZ = 0; vz = 0; giveWeapon('sidearm'); fireT = 0; api.score(0); startWave(1); status();
    }
    /* the front menu is a security camera on the empty station: the train calls every minute and now and then one of the dead wanders out of a stairwell */
    function enterMenu(){ mode = 'menu'; train.state = 'coming'; train.x = -62 - train.nose; train.v = 17; train.braking = false; train.grp.visible = true; train.menu = true; attract = { z:null, next:4 + Math.random()*4 }; if(R) R.menu(true); api.status('main menu'); }
    function startRun(){ dropAttract(); resetRun(); mode = 'play'; if(R) R.menu(false); snd.ambient(true); }
    function dropAttract(){ if(attract && attract.z){ R.scene.remove(attract.z.m.grp); attract.z.m.mats.forEach(function(m){ m.dispose(); }); attract.z = null; } }
    g.reset = function(){ if(!booted){ booted = true; resetRun(); enterMenu(); } else startRun(); };   /* the first reset is the boot into the menu; every later one (Restart, Play again) goes straight into a run */
    g.inMenu = function(){ return mode === 'menu'; };
    g.play = function(){ if(mode === 'menu') startRun(); };
    function updateAttract(dt){ var at = attract; if(!at) return;
      if(!at.z){ at.next -= dt; if(at.next > 0) return; var cands = SPAWNS.filter(function(sp){ return sp.stairs && sp.x > STATION.x0 + 3 && sp.x < STATION.x1 - 3 && sp.y > PIT.z1 + 1; }); if(!cands.length){ at.next = 20; return; }
        var sp = cands[(Math.random()*cands.length)|0], m = makeZombie((Math.random()*4)|0, false), dir = sp.y > sp.fy ? 1 : -1, out = sp.y, steps = 0; while(steps < 5 && isFloor(ch(sp.x|0, (out + dir)|0)) && !MTILE[(sp.x|0)+','+((out + dir)|0)]){ out += dir; steps++; }
        at.z = { x:sp.fx, y:sp.fy, fx:sp.fx, fy:sp.fy, tx:sp.x, ty:out - dir*.4, phase:'out', wait:0, speed:.9 + Math.random()*.3, anim:Math.random()*6, rise:0, rise0:1, atk:0, cool:0, dead:false, deadT:0, deadT0:1, flash:0, m:m, r:m.r, h:m.h, headY:m.headY, fy2:floorAt(sp.x|0, sp.y|0), face:Math.atan2(0, dir), brute:false, wraith:false, runner:false, climb:0 };
        m.grp.position.set(at.z.x, at.z.fy2, at.z.y); R.scene.add(m.grp); return; }
      var z = at.z, gx = z.phase === 'out' ? z.tx : z.fx, gy = z.phase === 'out' ? z.ty : z.fy, dx = gx - z.x, dy = gy - z.y, d = Math.hypot(dx, dy);
      if(z.phase === 'look'){ z.wait -= dt; z.face += Math.sin(z.wait*1.3)*dt*.9; z.anim += dt*.6; if(z.wait <= 0) z.phase = 'back'; return; }
      if(d < .08){ if(z.phase === 'out'){ z.phase = 'look'; z.wait = 2.5 + Math.random()*3; if(Math.random() < .5) snd.growl(false); } else { dropAttract(); at.next = 9 + Math.random()*14; } return; }
      z.x += dx/d*z.speed*dt; z.y += dy/d*z.speed*dt; z.anim += dt*z.speed*1.4; z.face = Math.atan2(dx, dy); z.fy2 = floorAt(z.x|0, z.y|0); }
    function waveCount(n){ return Math.min(60, Math.round(5 + n*3 + n*n*.18)); }
    function startWave(n){ wave = n; special = n % 5 === 0; toSpawn = special ? Math.round(waveCount(n) * .7) : waveCount(n); brutes = !special && n % 4 === 0 ? Math.min(4, 1 + (n/4|0)) : 0; banner = special ? 'THE WRAITHS' : 'WAVE '+(n < 10 ? '0'+n : n); bannerT = 3.2; gren = 4; spawnT = 1.2; if(special){ snd.wraith(); say('Something cold is coming down the tunnel', 3); } else snd.wave(); status(); }   /* every fifth wave the fog rolls in and the wraiths come: fast, faint, and the last one drops a max ammo */
    function zombieHp(){ return wave < 10 ? 150 + (wave-1)*100 : Math.round(1050 * Math.pow(1.1, wave - 9)); }
    function spawn(){ var cands = SPAWNS.filter(function(s){ var f = flow[(s.x|0) + (s.y|0)*MW]; return f >= 5 && f <= 40; }); if(!cands.length) cands = SPAWNS.filter(function(s){ return flow[(s.x|0) + (s.y|0)*MW] >= 0; }); if(!cands.length) return;
      var s = cands[(Math.random()*cands.length)|0], wraith = special, brute = !wraith && brutes > 0 && Math.random() < .4, runner = !wraith && !brute && wave >= 4 && Math.random() < Math.min(.5, (wave-3)*.08), hp0 = zombieHp() * (wraith ? .55 : brute ? 3.5 : runner ? .8 : 1);
      if(brute) brutes--; toSpawn--; alive++;
      var v = wraith ? 4 : brute ? 3 : (Math.random()*3)|0, m = makeZombie(v, brute), rise0 = s.stairs ? 1.6 : 1.1;
      var z = { x:s.fx, y:s.fy, tx:s.x + rnd(-.2, .2), ty:s.y + rnd(-.2, .2), fx:s.fx, fy:s.fy, hp:hp0, maxhp:hp0, speed:wraith ? Math.min(3.6, 2.6 + wave*.03) : brute ? .95 : runner ? Math.min(3.4, 2.3 + wave*.05) : Math.min(2.1, 1.0 + wave*.08), dmg:wraith ? 18 : brute ? 45 : runner ? 20 : 25, brute:brute, wraith:wraith, runner:runner, v:v, anim:Math.random()*6, rise:rise0, rise0:rise0, stairs:s.stairs, atk:0, cool:0, dead:false, deadT:0, deadT0:2.2, flash:0, m:m, r:m.r, h:m.h, headY:m.headY, fy2:floorAt(s.x|0, s.y|0), face:Math.atan2(P.x - s.x, P.y - s.y), fallDir:1 };
      m.grp.position.set(z.x, z.fy2, z.y); R.scene.add(m.grp); zombies.push(z); if(Math.random() < .5) snd.growl(false); }
    function hurt(d, why){ if(over) return; hp -= d; dmgFlash = .6; regenT = perks.fleetfoot ? 2 : 4; shake = Math.max(shake, .9); snd.hurt(); if(hp <= 0){ hp = 0; over = true; overMsg = why || 'Overrun'; saveRun(); api.status((why ? why.toLowerCase() : 'overrun')+' on wave '+wave+'  \u00b7  '+kills+' kills'); api.over((why || 'Overrun')+' on wave '+wave+' with '+kills+' kill'+(kills === 1 ? '' : 's')); } }
    function saveRun(){ try { var o = JSON.parse(localStorage.getItem('tigos.nightshift.runs') || '{}'); o.runs = (o.runs || 0) + 1; o.last = { wave:wave, kills:kills, pts:total, why:overMsg }; if(!o.best || total > o.best.pts) o.best = { wave:wave, kills:kills, pts:total }; if(!o.deep || wave > o.deep) o.deep = wave; localStorage.setItem('tigos.nightshift.runs', JSON.stringify(o)); lastRun = o; } catch(e){} }
    function runs(){ if(lastRun) return lastRun; try { lastRun = JSON.parse(localStorage.getItem('tigos.nightshift.runs') || '{}'); } catch(e){ lastRun = {}; } return lastRun; }
    function killZombie(z, src){ z.dead = true; z.deadT = z.deadT0; z.fallDir = Math.random() < .8 ? 1 : -1; alive--; kills++; hitKill = true; R.decal(z.x, z.fy2, z.y, .9 + Math.random()*.6); R.blood(z, 18); if(src !== 'train') snd.kill();
      if(special && toSpawn <= 0 && alive <= 0){ pickups.push({ x:z.x, y:z.y, kind:'ammo', t:40 }); say('The last wraith left something behind', 2.5); snd.pickup(); }
      else if(Math.random() < .035 && pickups.length < 2) pickups.push({ x:z.x, y:z.y, kind:['ammo','2x','insta','nuke'][(Math.random()*4)|0], t:22 }); status(); }
    function damage(z, d, hs, src){ if(z.dead || z.rise > .6) return false; if(puInsta > 0) d = 1e9; z.hp -= d; z.flash = .08; hitM = .14; hitKill = false; addPoints(hs ? 20 : 10); R.blood(z, hs ? 9 : 5);   /* a headshot is worth double, on the hit and on the kill */
      if(z.hp <= 0){ addPoints(src === 'melee' ? 130 : hs ? 120 : 60); killZombie(z, src); } else snd.hit(); return true; }
    /* a shot: the yaw/pitch ray against the grid, the floor and ceiling, and every zombie's capsule. Returns the hit count; draws a tracer and impact sparks. */
    function hitscan(ang, pitch, st){ var dx = Math.cos(ang), dy = Math.sin(ang), tp = Math.tan(pitch), eye = footY + jumpZ + EYE, wall = cast(P.x, P.y, dx, dy, true), tmax = Math.min(wall.dist, st.range), hits = [], kind = wall.ch === 'T' ? 'train' : 'wall';
      if(tp < -1e-4){ var tf = (floorAt(P.x|0, P.y|0) - eye)/tp, fx = P.x + dx*tf, fy = P.y + dy*tf, tf2 = (floorAt(fx|0, fy|0) - eye)/tp; tf = Math.max(tf, tf2); if(tf < tmax){ tmax = tf; kind = 'floor'; } } else if(tp > 1e-4){ var tc = (ceilAt(P.x|0, P.y|0) - eye)/tp; if(tc < tmax){ tmax = tc; kind = 'ceiling'; } }
      zombies.forEach(function(z){ if(z.dead || z.rise > .6) return; var rx = z.x - P.x, ry = z.y - P.y, along = rx*dx + ry*dy; if(along < .1 || along > tmax) return; var lat = Math.abs(rx*dy - ry*dx); if(lat >= z.r) return; var yh = eye + along*tp - z.fy2; if(yh < 0 || yh > z.h) return; hits.push({ z:z, along:along - Math.sqrt(Math.max(0, z.r*z.r - lat*lat)), hs:yh > z.headY }); });
      hits.sort(function(a, b){ return a.along - b.along; }); var n = 0, pt = null;
      hits.slice(0, st.pierce).forEach(function(h, i){ var fall = st.range < 20 ? Math.max(.25, 1 - h.along / st.range) : 1; damage(h.z, st.dmg * fall * (h.hs ? 1.6 : 1) * Math.pow(.7, i), h.hs); n++; if(!pt) pt = { x:P.x + dx*h.along, y:eye + h.along*tp, z:P.y + dy*h.along }; });
      if(!pt){ var te = Math.max(0, tmax - .05); pt = { x:P.x + dx*te, y:eye + te*tp, z:P.y + dy*te }; if(kind !== 'wall' || wall.dist < st.range) R.sparks(pt, -dx, -dy, kind); }
      R.tracer(pt, st.up ? (st.id === 'prism' ? '#ffb15c' : '#ff8a00') : null);   /* a forged gun fires light, not lead */
      if(st.splash){ zombies.forEach(function(z){ if(z.dead) return; var d = Math.hypot(z.x - pt.x, z.y - pt.z); if(d < st.splash && !(hits[0] && hits[0].z === z)) damage(z, st.dmg * .6 * (1 - d/st.splash), false); }); R.burst(pt.x, pt.y, pt.z, 10, '#ffd166', 2); }
      return n; }
    function shoot(){ var w = cur(), st = stat(w); if(reloading || fireT > 0) return false;   /* the box spinning never locks the trigger: you shoot until the new gun is in your hands */ if(w.mag <= 0){ snd.empty(); fireT = .25; if(w.res > 0 && msgT <= 0) say('Empty  \u00b7  R to reload', 1.2); return false; }   /* no auto reload: the trigger clicks on an empty chamber until you press R */
      w.mag--; fireT = 60 / st.rpm; flash = .07; recoil = 1; shake = Math.max(shake, st.pellets > 1 ? .9 : .25); if(w.up) snd.laser(); else snd.shot(w.id);
      for(var i = 0; i < st.pellets; i++) hitscan(P.a + (Math.random() - .5) * 2 * st.spread * (held.sprint ? 2.2 : 1), P.p + (Math.random() - .5) * 2 * st.spread, st); return true; }
    function reload(){ var w = cur(), st = stat(w); if(reloading || w.mag >= st.mag || w.res <= 0) return; reloading = true; reloadT = st.reload; snd.reload(); }
    function throwGrenade(){ if(gren <= 0 || grenT > 0 || over) return; gren--; grenT = .5; var c = Math.cos(P.p); grenades.push({ x:P.x, y:P.y, z:footY + jumpZ + 1.3, vx:Math.cos(P.a)*7.5*c, vy:Math.sin(P.a)*7.5*c, vz:2.4 + Math.sin(P.p)*7, t:1.35, m:R.grenade() }); }
    function explode(x, y, r, d){ shake = Math.max(shake, 1.6); whiteFlash = .18; snd.boom(); zombies.forEach(function(z){ if(z.dead) return; var k = Math.hypot(z.x - x, z.y - y); if(k < r) damage(z, d * (1 - k/r*.6), false); }); R.burst(x, floorAt(x|0, y|0) + .3, y, 40, '#ffb15c', 4); R.burst(x, floorAt(x|0, y|0) + .3, y, 20, '#555', 3); R.flashLight(x, floorAt(x|0, y|0) + .8, y); if(Math.hypot(P.x - x, P.y - y) < r*.7) hurt(30); }
    function doMelee(){ if(meleeT > 0 || over) return; meleeT = .55; melee = 1; var dx = Math.cos(P.a), dy = Math.sin(P.a), best = null, bd = 1.35; zombies.forEach(function(z){ if(z.dead) return; var rx = z.x - P.x, ry = z.y - P.y, d = Math.hypot(rx, ry); if(d < bd && (rx*dx + ry*dy)/d > .6){ bd = d; best = z; } }); if(best) damage(best, 150, false, 'melee'); snd.swap(); }
    function interact(){ if(!prompt || over) return; if(prompt.deny){ snd.deny(); say(prompt.deny); return; } if(points < prompt.cost){ snd.deny(); say('Not enough points ('+prompt.cost+')'); return; } points -= prompt.cost; var act = prompt.act; prompt = null; act(); snd.buy(); status(); }   /* one purchase per prompt: mashing F cannot double-buy */
    function findPrompt(){ prompt = null; var dx = Math.cos(P.a), dy = Math.sin(P.a), c = cast(P.x, P.y, dx, dy), key = c.mx+','+c.my;
      if(c.dist < 1.9){
        if(isDoor(c.ch) && !doors[key]) prompt = { txt:'Open the gate', cost:DOOR_COST[c.ch], act:function(){ doors[key] = true; flowKey = ''; R.openDoor(key); snd.gate(); say('Gate open'); } };
        else if(c.ch === 'X' && BUY_AT[key]){ var wid = BUY_AT[key], base = WEAPONS[wid], own = weapons.filter(function(w){ return w.id === wid; })[0];
          if(own) prompt = { txt:'Ammo for '+stat(own).name, cost:Math.round(base.cost * (own.up ? .8 : .5)), act:function(){ own.res = stat(own).res; own.mag = stat(own).mag; say('Ammo restocked'); } };
          else prompt = { txt:'Buy '+base.name, cost:base.cost, act:function(){ giveWeapon(wid); say(base.name+' equipped'); } }; }
        else if(c.ch === 'K'){ var w0 = cur(), s0 = stat(w0); if(w0.res >= s0.res && w0.mag >= s0.mag) prompt = { txt:'Resupply', deny:'Already full' }; else prompt = { txt:'Resupply '+s0.name, cost:250, act:function(){ w0.res = s0.res; w0.mag = s0.mag; say('Resupplied'); } }; }
        else if(c.ch === 'Y' && !power) prompt = { txt:'Turn on the power', cost:0, act:function(){ power = true; snd.power(); R.powerOn(); say('Power restored. Perks and the Forge are live.', 3); banner = 'POWER ON'; bannerT = 2.2; } };
      }
      if(!prompt) MACHINES.forEach(function(m){ var rx = m.x - P.x, ry = m.y - P.y, d = Math.hypot(rx, ry); if(d > 1.6 || (rx*dx + ry*dy)/d < .55) return;
        if(m.kind === 'box'){ prompt = boxRoll > 0 ? null : { txt:'Mystery box', cost:950, act:function(){ boxRoll = BOX_T; boxLast = ''; var ids = Object.keys(WEAPONS).filter(function(k){ return k !== 'sidearm'; }); boxPick = Math.random() < .12 ? 'prism' : ids.filter(function(k){ return k !== 'prism'; })[(Math.random()*4)|0]; R.boxOpen(true); } }; }
        else if(m.kind === 'forge'){ if(!power) prompt = { txt:'Forge', deny:'The Forge needs power' }; else if(cur().up) prompt = { txt:stat(cur()).name+' is already forged', deny:'Already forged' }; else prompt = { txt:'Forge '+stat(cur()).name, cost:5000, act:function(){ var w = cur(); w.up = true; var st = stat(w); w.mag = st.mag; w.res = st.res; R.gunFor(w); snd.forge(); whiteFlash = .2; say(st.name+' forged', 2.5); banner = st.name.toUpperCase(); bannerT = 2.4; } }; }
        else { var pk = PERKS[m.kind]; if(!power) prompt = { txt:pk.name, deny:'No power yet. Find the switch.' }; else if(!perks[m.kind]) prompt = { txt:pk.name+' ('+pk.blurb+')', cost:pk.cost, act:function(){ perks[m.kind] = true; if(m.kind === 'ironhide'){ maxhp = 250; hp = maxhp; } say(pk.name+' acquired', 2); } }; } });
    }
    /* the train: called from the tunnel every so often once the second wave starts. It brakes to a stop at the platform, waits, then pulls away,
       gathering speed the way a real one does. Anything on the tracks in front of it is gone. */
    function updateTrain(dt){ var tr = train; if(!tr) return;
      if(tr.state === 'away'){ if(tr.menu || wave >= 2){ tr.next -= dt; if(tr.next <= 0){ tr.state = 'coming'; tr.x = -140 - tr.nose; tr.v = 17; tr.braking = false; tr.grp.visible = true; snd.horn(); say('Train coming in', 2); } } }
      else {
        var nosePos = tr.x + tr.nose, stopAt = STATION.x1 - 1.5;
        if(tr.state === 'coming'){ var left = stopAt - nosePos, vBrake = Math.sqrt(2*2.6*Math.max(0, left)) + .25; if(tr.v > vBrake){ tr.braking = true; tr.v = vBrake; }   /* v = sqrt(2ad): the classic braking curve, so it always settles exactly at the mark */ if(left <= .06){ tr.x = stopAt - tr.nose; tr.v = 0; tr.state = 'stopped'; tr.t = tr.menu ? 10 : 7; tr.braking = false; shake = Math.max(shake, .4); flowKey = ''; } }
        else if(tr.state === 'stopped'){ tr.t -= dt; if(tr.t <= 0){ tr.state = 'leaving'; snd.horn(); } }
        else if(tr.state === 'leaving'){ tr.v = Math.min(22, tr.v + 1.35*dt); if(tr.x + tr.tail > MW + 130){ tr.state = 'away'; tr.v = 0; tr.next = tr.menu ? 24 : 75 + Math.random()*40; tr.grp.visible = false; flowKey = ''; }   /* the menu train runs a one-minute loop: ~9 s in, 10 s at the platform, ~17 s out, 24 s away */ }
        tr.x += tr.v*dt; tr.grp.position.x = tr.x; if(tr.v > 0 && tr.v < 1.5) flowKey = '';
        if(tr.v > 1.5){ var x0 = tr.x + tr.tail - .5, x1 = tr.x + tr.nose + 1.2; zombies.forEach(function(z){ if(!z.dead && Math.abs(z.y - TRACK_Z) < 2.1 && z.x > x0 && z.x < x1){ addPoints(50); killZombie(z, 'train'); z.fallDir = 1; } }); if(!over && Math.abs(P.y - TRACK_Z) < 2.1 && P.x > x0 && P.x < x1) hurt(1000, 'Struck by the train'); }
        var near = clamp(1 - Math.abs((tr.x + tr.nose/2) - P.x)/90, 0, 1); shake = Math.max(shake, tr.v/22*.25*near); }
      snd.train(tr.grp.visible ? tr.v*(.35 + .65*clamp(1 - Math.abs((tr.x + tr.nose/2) - P.x)/120, 0, 1)) : 0, tr.braking);
    }
    function ambientTick(dt){ flickT -= dt; if(flickT <= 0){ flick = flick ? 0 : 1; flickT = flick ? rnd(.04, .16) : rnd(2.5, 9); if(!flick && Math.random() < .3) flickTube = null; }   /* the lights in this place are not well */
      dripT -= dt; if(dripT <= 0){ dripT = rnd(3, 9); snd.drip(); } }
    g.update = function(dt){
      if(mode === 'menu'){ t += dt; ambientTick(dt); updateTrain(dt); updateAttract(dt); return; }
      t += dt; fogK += ((special ? .45 : 1) - fogK) * Math.min(1, dt*1.5); fireT -= dt; grenT -= dt; meleeT -= dt; melee = Math.max(0, melee - dt*3); flash = Math.max(0, flash - dt); hitM = Math.max(0, hitM - dt); dmgFlash = Math.max(0, dmgFlash - dt); whiteFlash = Math.max(0, whiteFlash - dt); shake = Math.max(0, shake - dt*2.5); recoil = Math.max(0, recoil - dt*6); bannerT -= dt; msgT -= dt; puX2 = Math.max(0, puX2 - dt); puInsta = Math.max(0, puInsta - dt);
      ambientTick(dt); updateTrain(dt);
      if(jumpZ > 0 || vz !== 0){ vz -= 12*dt; jumpZ += vz*dt; if(jumpZ <= 0){ jumpZ = 0; vz = 0; snd.step(floorAt(P.x|0, P.y|0) < -.5); shake = Math.max(shake, .12); } }
      if(over) return;
      var dx = Math.cos(P.a), dy = Math.sin(P.a);
      if(held.L) P.a -= 2.6*dt; if(held.R) P.a += 2.6*dt;
      var fw = (held.W ? 1 : 0) - (held.S ? 1 : 0), sf = (held.D ? 1 : 0) - (held.A ? 1 : 0), sp = 3.1 * (held.sprint && fw > 0 ? (perks.fleetfoot ? 1.75 : 1.45) : 1);
      if(fw || sf){ var l = Math.hypot(fw, sf); fw /= l; sf /= l; var mx = (dx*fw - dy*sf) * sp * dt, my = (dy*fw + dx*sf) * sp * dt; moveCircle(P, P.x + mx, P.y + my, .22);
        zombies.forEach(function(z){ if(z.dead || z.rise > 0) return; var rx = P.x - z.x, ry = P.y - z.y, d = Math.hypot(rx, ry), r = z.r + .22; if(d < r && d > 0){ P.x = z.x + rx/d*r; P.y = z.y + ry/d*r; } }); bob += dt * sp * 2.2; var ph = Math.floor(bob / Math.PI); if(ph !== stepPh){ stepPh = ph; snd.step(floorAt(P.x|0, P.y|0) < -.5); } }
      var fl = floorAt(P.x|0, P.y|0); footY += (fl - footY) * Math.min(1, dt*9);
      if(reloading){ reloadT -= dt; if(reloadT <= 0){ var w = cur(), st = stat(w), need = st.mag - w.mag, take = Math.min(need, w.res); w.mag += take; w.res -= take; reloading = false; } }
      if(boxRoll > 0){ boxRoll -= dt; var pool = Object.keys(WEAPONS), prog = clamp(1 - boxRoll/BOX_T, 0, 1), idx = Math.floor(26 * (1 - Math.pow(1 - prog, 2.2))); boxName = WEAPONS[pool[idx % pool.length]].name; if(boxRoll < .35) boxName = WEAPONS[boxPick].name; if(boxName !== boxLast){ boxLast = boxName; snd.tick(); R.boxShow(boxName); }
        if(boxRoll <= 0){ whiteFlash = .12; R.burst(BOXM.x, .9, BOXM.y, 30, '#8cc7ff', 3); giveWeapon(boxPick); say(WEAPONS[boxPick].name+' from the box', 2); R.boxOpen(false); } }
      var st0 = stat(cur()); if(trigger){ if(shoot() || reloading || cur().mag <= 0) trigger = false; } else if((held.F || mouseDown) && st0.auto) shoot();   /* a tap is buffered until the gun is ready, so no press is ever swallowed */
      if(regenT > 0) regenT -= dt; else if(hp < maxhp) hp = Math.min(maxhp, hp + dt * (perks.fleetfoot ? 40 : 22));
      computeFlow(); findPrompt();
      /* waves */
      if(toSpawn > 0){ spawnT -= dt; if(spawnT <= 0 && alive < Math.min(24, 6 + wave*2)){ spawn(); spawnT = Math.max(.45, 2.1 - wave*.1); } }
      else if(alive <= 0){ if(between <= 0) between = 15; between -= dt; if(between <= 0){ between = 0; startWave(wave + 1); } }
      /* the dead */
      zombies.forEach(function(z){
        if(z.flash > 0) z.flash -= dt;
        if(z.dead){ z.deadT -= dt; return; }
        if(z.rise > 0){ z.rise -= dt; var k = clamp(1 - z.rise/z.rise0, 0, 1); z.x = lerp(z.fx, z.tx, k); z.y = lerp(z.fy, z.ty, k); z.climb = z.stairs ? Math.sin(k*Math.PI)*.42 : 0; z.anim += dt*2; z.face = Math.atan2(z.tx - z.fx, z.ty - z.fy); if(Math.random() < dt*.4) snd.growl(Math.hypot(P.x - z.x, P.y - z.y) < 7); return; }
        z.climb = 0; var rx = P.x - z.x, ry = P.y - z.y, d = Math.hypot(rx, ry);
        if(z.hold){ z.face = Math.atan2(rx, ry); z.anim += dt; return; }   /* a held zombie stands where it was put (debug hook for the train check) */
        if(z.atk > 0){ z.atk -= dt; z.face = Math.atan2(rx, ry); if(z.atk <= 0){ if(d < 1.25 && Math.abs(footY - z.fy2) < 1.2) hurt(z.dmg); z.cool = .9; } return; }
        if(z.cool > 0) z.cool -= dt; else if(d < .9 && Math.abs(footY - z.fy2) < 1.2){ z.atk = .45; return; }
        if(d < .65){ z.face = Math.atan2(rx, ry); return; }   /* stand at arm's reach between swings */
        var tx, ty; if(d < 2.5 && los(z.x, z.y, P.x, P.y)){ tx = P.x; ty = P.y; }
        else { var cx = z.x|0, cy = z.y|0, best = flow[cx + cy*MW], bx = -1, by = -1; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ var nx = cx + o[0], ny = cy + o[1]; if(nx < 0 || ny < 0 || nx >= MW || ny >= MH) return; var f = flow[nx + ny*MW]; if(f > -1 && (best < 0 || f < best)){ best = f; bx = nx; by = ny; } }); if(bx > -1){ tx = bx + .5; ty = by + .5; } else { tx = P.x; ty = P.y; } }
        var vx = tx - z.x, vy = ty - z.y, vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        zombies.forEach(function(o){ if(o === z || o.dead || o.rise > 0) return; var sx = z.x - o.x, sy = z.y - o.y, sd = Math.hypot(sx, sy); if(sd < .6 && sd > 0){ vx += sx/sd * .8; vy += sy/sd * .8; } });
        var l2 = Math.hypot(vx, vy) || 1; moveCircle(z, z.x + vx/l2*z.speed*dt, z.y + vy/l2*z.speed*dt, .28); z.anim += dt * z.speed * 1.4; z.face = Math.atan2(vx, vy);
        if(Math.random() < dt*.05) snd.growl(d < 7);
      });
      zombies.forEach(function(z){ var fl2 = floorAt(z.x|0, z.y|0); z.fy2 += (fl2 - z.fy2) * Math.min(1, dt*9); });
      zombies = zombies.filter(function(z){ if(z.dead && z.deadT <= 0){ R.scene.remove(z.m.grp); z.m.mats.forEach(function(m){ m.dispose(); }); return false; } return true; });
      /* pickups, grenades */
      pickups.forEach(function(p){ p.t -= dt; if(Math.hypot(p.x - P.x, p.y - P.y) < .8){ p.t = 0; snd.pickup(); banner = PU_DEF[p.kind].label; bannerT = 2; if(p.kind === 'ammo'){ weapons.forEach(function(w){ var s = stat(w); w.mag = s.mag; w.res = s.res; }); gren = 4; } else if(p.kind === '2x') puX2 = 30; else if(p.kind === 'insta') puInsta = 30; else { whiteFlash = .35; zombies.forEach(function(z){ if(!z.dead && z.rise <= 0){ addPoints(40); killZombie(z, 'nuke'); } }); } } });
      pickups = pickups.filter(function(p){ if(p.t <= 0){ R.pickupGone(p); return false; } return true; });
      grenades.forEach(function(gr){ gr.t -= dt; gr.vz -= 7*dt; var nx = gr.x + gr.vx*dt, ny = gr.y + gr.vy*dt; if(walk(nx|0, gr.y|0)) gr.x = nx; else gr.vx = -gr.vx*.4; if(walk(gr.x|0, ny|0)) gr.y = ny; else gr.vy = -gr.vy*.4; gr.z += gr.vz*dt; var gf = floorAt(gr.x|0, gr.y|0); if(gr.z < gf + .06){ gr.z = gf + .06; gr.vz = Math.abs(gr.vz)*.35; gr.vx *= .6; gr.vy *= .6; }
        if(gr.t <= 0){ explode(gr.x, gr.y, 3.2, 700); R.scene.remove(gr.m); } });
      grenades = grenades.filter(function(gr){ return gr.t > 0; });
      if(swapT > 0) swapT -= dt;
    };
/* tigOS arcade, Nightshift part 06: the picture. Renderer, camera and post (bloom), the per-frame animation of everything part 05 decided,
   the DOM HUD over the canvas, the title card with its settings, input, and the peek/dbg hooks the test suite drives. Closes nightshift(). */
    var frameDt = 0, gun = null, gunW = null, hud = {}, hudEl = null, last = {}, vw = 2, vh = 2, soft = false, boxGuns = {}, flashLights = [], tmpV = new THREE.Vector3(), menuEl = null, menuPanel = 'main', menuSel = 0;
    (function build(){
      var renderer = new THREE.WebGLRenderer({ canvas:api.canvas, antialias:false, powerPreference:'high-performance', alpha:false, stencil:false });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
      try { var gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), rn = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(rn); } catch(e){}
      if(/[?&]gl=1/.test(location.search)) soft = false;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x04050a); scene.fog = new THREE.FogExp2(0x04050a, .042);
      var camera = new THREE.PerspectiveCamera(SET.fov, 16/9, .04, 200); camera.rotation.order = 'YXZ'; scene.add(camera); var handL = new THREE.PointLight(0xfff0dd, 1.1, 1.3, 1); handL.position.set(.1, .18, -.1); camera.add(handL);   /* a faint fill so the gun reads in a dark station */
      var world = buildWorld(scene);
      var composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(320, 180), .22, .3, 1.05);   /* only what is brighter than white glows: tubes, lamps, eyes, panels */ composer.addPass(bloom); composer.addPass(new THREE.OutputPass());
      var blood = Particles(scene, 320, .075, A.tex.soft), sparks = Particles(scene, 160, .045, A.tex.soft), tracers = Beams(scene, 12, M.tracer, .014), beams = Beams(scene, 8, M.beam, .05), decals = Decals(scene, 48, M.blood), grenGeo = new THREE.SphereGeometry(.07, 10, 8);
      for(var fl = 0; fl < 3; fl++){ var L = new THREE.PointLight(0xffb060, 0, 14, 1); scene.add(L); flashLights.push({ l:L, t:0 }); }
      var puGeo = new THREE.SphereGeometry(.16, 14, 10), puTex = {}; Object.keys(PU_DEF).forEach(function(k){ var c = mk(128, 32); text(c.getContext('2d'), PU_DEF[k].label, 64, 16, 22, PU_DEF[k].col, 'center', 900); var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; puTex[k] = tx; });
      function applyGfx(){ var tier = soft ? 'low' : SET.gfx, dpr = window.devicePixelRatio || 1, pr = soft ? .3 : { low:.55, medium:.8, high:Math.min(1.5, dpr), ultra:Math.min(2, dpr) }[tier]; renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
        bloom.enabled = tier !== 'low' || /[?&]gl=1/.test(location.search); bloom.strength = tier === 'ultra' ? .28 : .22; var nl = { low:8, medium:12, high:17, ultra:99 }[tier]; world.lights.forEach(function(o, i){ o.l.visible = i < nl; }); if(vw > 2) R.resize(vw, vh); }
      R = { scene:scene, camera:camera, renderer:renderer, world:world, soft:function(){ return soft; }, bloom:bloom,
        resize:function(w, h){ vw = w; vh = h; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); },
        applySettings:function(){ camera.fov = SET.fov; camera.updateProjectionMatrix(); applyGfx(); snd.volume(SET.vol); },
        reset:function(){ (zombies || []).forEach(function(z){ scene.remove(z.m.grp); z.m.mats.forEach(function(m){ m.dispose(); }); }); (grenades || []).forEach(function(gr){ scene.remove(gr.m); }); (pickups || []).forEach(function(p){ R.pickupGone(p); }); decals.clear(); Object.keys(world.doors).forEach(function(k){ var d = world.doors[k]; d.grp.visible = true; d.gate.position.y = d.h/2; d.signs.forEach(function(s){ s.visible = true; }); d.open = 0; });
          Object.keys(world.machines).forEach(function(k){ var m = world.machines[k]; if(m.panel) m.panel.material.emissiveIntensity = .05; if(m.mouth) m.mouth.material.emissiveIntensity = .25; }); if(world.power){ world.power.lamp.material.emissive.setHex(0xff2020); world.power.lamp.material.color.setHex(0xff3030); world.power.lever.rotation.x = .9; }
          Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = false; }); if(world.machines.box) world.machines.box.lid.rotation.x = 0; scene.fog.density = .042; },
        gunFor:function(w){ if(gun){ camera.remove(gun.grp); gun.dispose(); } gun = makeGun(w.id, w.up); gunW = w; gun.grp.rotation.y = Math.PI/2 + .1; gun.grp.scale.set(.5, .5, .5); camera.add(gun.grp); },
        blood:function(z, n){ for(var i = 0; i < n; i++) blood.add(z.x, z.fy2 + z.h*.55 + rnd(-.2, .3), z.y, rnd(-1.6, 1.6), rnd(.3, 2.4), rnd(-1.6, 1.6), rnd(.35, .8), Math.random() < .3 ? '#5a0606' : '#8a0a0a'); },
        decal:function(x, y, z, s){ decals.add(x, y, z, s); },
        sparks:function(pt, nx, nz, kind){ var col = kind === 'floor' || kind === 'ceiling' ? '#777' : '#ffd27a', n = kind === 'wall' || kind === 'train' ? 5 : 3; for(var i = 0; i < n; i++) sparks.add(pt.x, pt.y, pt.z, nx*rnd(.5, 3) + rnd(-1.5, 1.5), rnd(-.5, 2.5), nz*rnd(.5, 3) + rnd(-1.5, 1.5), rnd(.15, .4), col, 7); if((kind === 'wall' || kind === 'train') && Math.random() < .4) snd.ricochet(); },
        tracer:function(pt, col){ if(!gun) return; var mzw = gun.grp.localToWorld(tmpV.copy(gun.mz)); if(col) beams.add({ x:mzw.x, y:mzw.y, z:mzw.z }, pt, .16, col); else tracers.add({ x:mzw.x, y:mzw.y, z:mzw.z }, pt, .06); },
        burst:function(x, y, z, n, col, spd){ for(var i = 0; i < n; i++) sparks.add(x, y, z, rnd(-spd, spd), rnd(0, spd*1.2), rnd(-spd, spd), rnd(.3, .8), col, 6); },
        flashLight:function(x, y, z){ var f = flashLights[0]; flashLights.forEach(function(o){ if(o.t < f.t) f = o; }); f.l.position.set(x, y, z); f.t = .5; },
        openDoor:function(key){ var d = world.doors[key]; if(d) d.open = .001; },
        powerOn:function(){ Object.keys(world.machines).forEach(function(k){ var m = world.machines[k]; if(m.panel) m.panel.material.emissiveIntensity = 1.4; if(m.mouth) m.mouth.material.emissiveIntensity = 2.6; }); if(world.power){ world.power.lamp.material.emissive.setHex(0x30ff60); world.power.lamp.material.color.setHex(0x40ff70); world.power.lever.rotation.x = -.9; } },
        boxOpen:function(on){ if(!on) Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = false; }); },
        boxShow:function(name){ var id = Object.keys(WEAPONS).filter(function(k){ return WEAPONS[k].name === name; })[0]; if(!id) return; if(!boxGuns[id]){ boxGuns[id] = makeGun(id, false); boxGuns[id].grp.scale.set(2.2, 2.2, 2.2); scene.add(boxGuns[id].grp); } Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = k === id; }); },
        grenade:function(){ var m = new THREE.Mesh(grenGeo, M.dark); scene.add(m); return m; },
        pickupGone:function(p){ if(p.m){ scene.remove(p.m); if(p.lbl) scene.remove(p.lbl); } },
        frame:function(dt){
          var eye = footY + jumpZ + EYE + (Math.abs(Math.sin(bob))*.045), sk = shake*.035;
          if(mode === 'menu'){   /* the security camera: high in the west corner of the platform, a slow pan across the platform and the tracks, a little roll */
            camera.position.set(STATION.x0 + .9, CEIL_HI - .25, STATION.z1 - .8); tmpV.set(30 + Math.sin(t*.13)*7, .4, 7.2); camera.lookAt(tmpV); camera.rotation.z += .035; if(gun) gun.grp.visible = false; }
          else { camera.position.set(P.x + rnd(-1, 1)*sk, eye + rnd(-1, 1)*sk, P.y + rnd(-1, 1)*sk); camera.rotation.set(P.p + rnd(-1, 1)*sk*.5, Math.atan2(-Math.cos(P.a), -Math.sin(P.a)), Math.sin(bob)*.006 + rnd(-1, 1)*sk*.3); if(gun) gun.grp.visible = true; }
          /* the gun: bob, recoil, reload dip, swap slide, melee shove */
          if(gun && mode !== 'menu'){ var rp = reloading ? Math.sin((1 - reloadT/stat(gunW).reload) * Math.PI) : 0, sw = swapT > 0 ? Math.sin(Math.PI*swapT/.34) : 0;
            gun.grp.position.set(.2 + Math.sin(bob)*.01 - melee*.1, -.17 + Math.abs(Math.cos(bob))*.008 - rp*.2 - sw*.4 - recoil*.01, -.36 + recoil*.06 - melee*.18);
            gun.grp.rotation.set(recoil*.09 - rp*.7 - melee*.4, Math.PI/2 + .1 + rp*.3, -rp*.35 + melee*.5);
            var on = flash > 0 && !reloading; gun.flash.forEach(function(f){ f.visible = on; if(on){ f.rotation.x = Math.random()*6.28; var s = .7 + Math.random()*.7; f.scale.set(s, s, 1); } }); gun.light.intensity = on ? 3.5 : 0; }
          /* the dead */
          zombies.forEach(function(z){ z.m.grp.position.set(z.x, z.fy2 + (z.climb || 0), z.y); z.m.grp.rotation.y = z.face; animZombie(z, dt, t); });
          if(attract && attract.z){ var az = attract.z; az.m.grp.position.set(az.x, az.fy2, az.y); az.m.grp.rotation.y = az.face; animZombie(az, dt, t); }
          /* grenades, pickups */
          grenades.forEach(function(gr){ gr.m.position.set(gr.x, gr.z, gr.y); gr.m.rotation.x += dt*6; });
          pickups.forEach(function(p){ if(!p.m){ var mat = new THREE.MeshStandardMaterial({ color:PU_DEF[p.kind].col, emissive:PU_DEF[p.kind].col, emissiveIntensity:1.6 }); p.m = new THREE.Mesh(puGeo, mat); scene.add(p.m); var sm = new THREE.SpriteMaterial({ map:puTex[p.kind], transparent:true, depthWrite:false }); p.lbl = new THREE.Sprite(sm); p.lbl.scale.set(1.2, .3, 1); scene.add(p.lbl); } var py = floorAt(p.x|0, p.y|0) + .9 + Math.sin(t*3 + p.x)*.08; p.m.position.set(p.x, py, p.y); p.m.rotation.y += dt*2; p.lbl.position.set(p.x, py + .4, p.y); p.m.visible = p.lbl.visible = !(p.t < 5 && Math.floor(t*6) % 2); });
          /* gates roll up */
          Object.keys(world.doors).forEach(function(k){ var d = world.doors[k]; if(!d.open || !d.grp.visible) return; d.open += dt; var k2 = Math.min(1, d.open/.9); d.gate.position.y = d.h/2 + k2*(d.h - .2); d.gate.scale.y = 1 - k2*.92; d.signs.forEach(function(s){ s.visible = k2 < .3; }); if(k2 >= 1) d.grp.visible = false; });
          /* the box */
          var bm = world.machines.box; if(bm){ var open = boxRoll > 0; bm.lid.rotation.x += ((open ? -1.9 : 0) - bm.lid.rotation.x)*Math.min(1, dt*8); bm.gem.material.emissiveIntensity = open ? 3 + Math.sin(t*12) : 1.4; if(open){ var prog = clamp(1 - boxRoll/BOX_T, 0, 1); Object.keys(boxGuns).forEach(function(k){ var bg = boxGuns[k].grp; if(!bg.visible) return; bg.position.set(BOXM.x, floorAt(BOXM.x|0, BOXM.y|0) + .95 + Math.min(1, prog*3)*.5 + Math.sin(t*3)*.04, BOXM.y); bg.rotation.y += dt*(2 + 8*(1 - prog)); }); if(Math.random() < .6) sparks.add(BOXM.x + rnd(-.3, .3), floorAt(BOXM.x|0, BOXM.y|0) + .6, BOXM.y + rnd(-.3, .3), 0, rnd(1, 2.4), 0, rnd(.4, .8), '#8cc7ff', -1); } }
          /* lights: one tube stutters, the work lamps breathe, explosions fade */
          if(!flickTube && world.tubes.length){ var lit = world.tubes.filter(function(o){ return o.light; }); flickTube = lit[(Math.random()*lit.length)|0]; }
          world.tubes.forEach(function(o){ var off = o === flickTube && flick; o.mesh.material = off ? M.tubeOff : M.tube; if(o.light) o.light.intensity = off ? o.base*.12 : o.base; });
          (world.work || []).forEach(function(w){ w.l.intensity = w.base*(.9 + .08*Math.sin(t*23) + rnd(-.03, .03)); });
          flashLights.forEach(function(f){ if(f.t > 0){ f.t -= dt; f.l.intensity = Math.max(0, f.t)*14; } });
          if(gun) gun.light.intensity = flash > 0 && !reloading ? 3.5 : 0;
          world.train.hlight.intensity = train && train.grp.visible ? 9 : 0;
          /* fog thickens and cools when the wraiths come */
          var fd = mode === 'menu' ? .021 : .042/fogK; scene.fog.density += (fd - scene.fog.density)*Math.min(1, dt*2); scene.fog.color.setHex(0x04050a).lerp(new THREE.Color(0x1a2238), 1 - fogK); scene.background.copy(scene.fog.color);
          blood.update(dt, floorAt2); sparks.update(dt, floorAt2); tracers.update(dt); beams.update(dt);
          camera.updateMatrixWorld();
          if(bloom.enabled) composer.render(); else renderer.render(scene, camera);
        },
        beamsLive:function(){ return beams.list.length; },
        menu:function(on){ api.canvas.classList.toggle('cctv', on); if(hudEl) hudEl.hidden = true; if(menuEl){ menuEl.hidden = !on; if(on) showPanel('main'); } if(gun) gun.grp.visible = !on; },
        dispose:function(){ if(gun){ camera.remove(gun.grp); gun.dispose(); } Object.keys(boxGuns).forEach(function(k){ boxGuns[k].dispose(); }); blood.dispose(); sparks.dispose(); tracers.dispose(); beams.dispose(); decals.dispose(); grenGeo.dispose(); puGeo.dispose(); world.dispose.forEach(function(o){ if(o.dispose) o.dispose(); }); scene.traverse(function(o){ if(o.geometry && o.geometry.dispose) o.geometry.dispose(); }); composer.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch(e){} } };
      function floorAt2(x, z){ return floorAt(x|0, z|0); }
      applyGfx();
    })();
    /* ---------- HUD: DOM over the canvas ---------- */
    (function buildHud(){
      hudEl = document.createElement('div'); hudEl.className = 'ns-hud';
      hudEl.innerHTML = '<div class="ns-vig"></div><div class="ns-white"></div><div class="ns-fog"></div>'+
        '<div class="ns-top"><b data-wave>WAVE 01</b><span data-inf></span></div><div class="ns-kills" data-kills>0 kills</div>'+
        '<div class="ns-cross"><i></i><i></i><i></i><i></i></div><div class="ns-hit" data-hit hidden></div>'+
        '<div class="ns-bl"><div class="ns-hprow"><div class="ns-hpbar"><i data-hpbar></i></div><b data-hp>100</b></div><div class="ns-perks" data-perks></div><b class="ns-pts" data-pts>500</b></div>'+
        '<div class="ns-br"><span class="ns-wname" data-wname>SIDEARM</span><b class="ns-ammo" data-ammo>8 | 64</b><span class="ns-sub"><span data-gren>\u2B22 4</span><span data-other></span></span></div>'+
        '<div class="ns-banner" data-banner></div><div class="ns-next" data-next></div><div class="ns-pu" data-pu></div><div class="ns-prompt" data-prompt hidden></div><div class="ns-msg" data-msg></div><div class="ns-box" data-box hidden></div>'+
        (touch ? '' : '<div class="ns-hint" data-hint>click to look around</div>');
      var ov = api.stage.querySelector('.gm-over'); if(ov) api.stage.insertBefore(hudEl, ov); else api.stage.appendChild(hudEl); hudEl.hidden = true;   /* under the framework's title/pause card, and hidden until the first tick */
      ['wave','inf','kills','hit','hpbar','hp','perks','pts','wname','ammo','gren','other','banner','next','pu','prompt','msg','box','hint'].forEach(function(k){ hud[k] = hudEl.querySelector('[data-'+k+']'); });
      hud.vig = hudEl.querySelector('.ns-vig'); hud.white = hudEl.querySelector('.ns-white'); hud.fog = hudEl.querySelector('.ns-fog'); hud.cross = hudEl.querySelector('.ns-cross');
    })();
    /* ---------- the front menu: a real game menu over the security-camera feed ---------- */
    (function buildMenu(){
      var row = function(k, label, min, max, step, val, out){ return '<label class="ns-opt"><span>'+label+'</span><input type="range" data-set="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"><output>'+out+'</output></label>'; };
      var item = function(act, label, sub){ return '<li><button type="button" data-act="'+act+'"><b>'+label+'</b><small>'+sub+'</small></button></li>'; };
      menuEl = document.createElement('div'); menuEl.className = 'ns-menu gm-ui'; menuEl.hidden = true;
      menuEl.innerHTML = '<div class="ns-cctv"><div class="ns-scan"></div><div class="ns-cctv-top"><span class="ns-rec"><i></i>REC</span><span>CAM 04 \u00b7 TIGER AVE \u00b7 PLATFORM A</span><span data-clock>00:00:00</span></div><div class="ns-cctv-bot"><span data-camnote>NS-CCTV \u00b7 NIGHT \u00b7 30 FPS</span><span data-camstat>PLATFORM CLEAR</span></div></div>'+
        '<div class="ns-panel main" data-panel="main"><div class="ns-sign"><span>NIGHTSHIFT</span></div><p class="ns-tag"><b>T</b> Tiger Ave \u00b7 The last train tonight isn\u2019t carrying passengers</p>'+
          '<ul class="ns-items">'+item('play', 'Play', 'survive the waves')+item('settings', 'Settings', 'look, sound and picture')+item('controls', 'Controls', 'keys and mouse')+item('records', 'Records', 'your best nights')+'</ul>'+
          '<p class="ns-foot"><kbd>\u2191</kbd><kbd>\u2193</kbd> select &nbsp;\u00b7&nbsp; <kbd>Enter</kbd> confirm &nbsp;\u00b7&nbsp; <span data-best>best 0</span></p></div>'+
        '<div class="ns-panel" data-panel="settings" hidden><h3>Settings</h3><div class="ns-set">'+row('sens', 'Sensitivity', .3, 2.5, .1, SET.sens, SET.sens.toFixed(1))+row('fov', 'Field of view', 60, 110, 1, SET.fov, SET.fov+'\u00b0')+row('vol', 'Volume', 0, 1, .05, SET.vol, Math.round(SET.vol*100)+'%')+
          '<label class="ns-opt"><span>Graphics</span><select data-set="gfx">'+GFX.map(function(k){ return '<option value="'+k+'"'+(k === SET.gfx ? ' selected' : '')+'>'+k+'</option>'; }).join('')+'</select><output>'+SET.gfx+'</output></label>'+
          '<label class="ns-opt"><span>Invert look</span><input type="checkbox" data-set="inv"'+(SET.inv ? ' checked' : '')+'><output>'+(SET.inv ? 'on' : 'off')+'</output></label></div><p class="ns-note">Graphics: low turns bloom off and halves the picture; ultra keeps every light on. Saved on this device.</p><ul class="ns-items back"><li><button type="button" data-act="back"><b>Back</b><small>to the main menu</small></button></li></ul></div>'+
        '<div class="ns-panel" data-panel="controls" hidden><h3>Controls</h3><div class="ns-keys big"><span><kbd>WASD</kbd> move</span><span><kbd>mouse</kbd> look</span><span><kbd>click</kbd> fire</span><span><kbd>right click</kbd> / <kbd>V</kbd> melee</span><span><kbd>space</kbd> jump</span><span><kbd>scroll</kbd> / <kbd>1</kbd> <kbd>2</kbd> swap guns</span><span><kbd>Q</kbd> other gun</span><span><kbd>R</kbd> reload</span><span><kbd>F</kbd> / <kbd>E</kbd> use, buy, open</span><span><kbd>G</kbd> grenade</span><span><kbd>shift</kbd> sprint</span><span><kbd>M</kbd> mute</span><span><kbd>P</kbd> pause</span><span><kbd>Esc</kbd> leave full screen</span></div><ul class="ns-items back"><li><button type="button" data-act="back"><b>Back</b><small>to the main menu</small></button></li></ul></div>'+
        '<div class="ns-panel" data-panel="records" hidden><h3>Records</h3><div class="ns-rec-grid" data-records></div><ul class="ns-items back"><li><button type="button" data-act="back"><b>Back</b><small>to the main menu</small></button></li></ul></div>';
      var ov = api.stage.querySelector('.gm-over'); if(ov) api.stage.insertBefore(menuEl, ov); else api.stage.appendChild(menuEl);
      menuEl.addEventListener('click', function(e){ var b = e.target.closest('button[data-act]'); if(!b) return; e.stopPropagation(); menuSel = menuItems().indexOf(b); menuAct(b.getAttribute('data-act'), e); });
      menuEl.addEventListener('pointermove', function(e){ var b = e.target.closest('button[data-act]'); if(!b) return; var i = menuItems().indexOf(b); if(i > -1 && i !== menuSel){ menuSel = i; paintSel(); } });
    })();
    function menuItems(){ return menuEl ? Array.prototype.slice.call(menuEl.querySelectorAll('[data-panel="'+menuPanel+'"] .ns-items button')) : []; }
    function paintSel(){ menuItems().forEach(function(b, i){ b.classList.toggle('sel', i === menuSel); }); }
    function showPanel(name){ menuPanel = name; menuSel = 0; Array.prototype.forEach.call(menuEl.querySelectorAll('.ns-panel'), function(pn){ pn.hidden = pn.getAttribute('data-panel') !== name; }); if(name === 'records'){ var o = runs(), fmt = function(r){ return r ? 'wave '+r.wave+'  \u00b7  '+r.kills+' kills  \u00b7  '+r.pts+' pts' : 'no nights yet'; }; menuEl.querySelector('[data-records]').innerHTML = '<div><span>Best night</span><b>'+fmt(o.best)+'</b></div><div><span>Last night</span><b>'+fmt(o.last)+(o.last && o.last.why ? '<small>'+esc(o.last.why)+'</small>' : '')+'</b></div><div><span>Deepest wave</span><b>'+(o.deep || 0)+'</b></div><div><span>Nights worked</span><b>'+(o.runs || 0)+'</b></div>'; } menuEl.querySelector('[data-best]').textContent = 'best '+api.best; paintSel(); }
    function menuAct(act, e){ if(act === 'play'){ snd.buy(); startRun(); if(!touch){ try { var pl = api.canvas.requestPointerLock && api.canvas.requestPointerLock(); if(pl && pl.catch) pl.catch(function(){}); } catch(x){} } }
      else if(act === 'back'){ snd.tick(); showPanel('main'); } else { snd.tick(); showPanel(act); } }
    function menuKey(K){ var items = menuItems(); if(!items.length) return false;
      if(K === 'ArrowUp' || K === 'w' || K === 'ArrowLeft'){ menuSel = (menuSel + items.length - 1) % items.length; paintSel(); snd.tick(); return true; }
      if(K === 'ArrowDown' || K === 's' || K === 'ArrowRight' || K === 'Tab'){ menuSel = (menuSel + 1) % items.length; paintSel(); snd.tick(); return true; }
      if(K === 'Enter' || K === ' '){ menuAct(items[menuSel].getAttribute('data-act')); return true; }
      if(K === 'Backspace' || K === 'Delete'){ if(menuPanel !== 'main') menuAct('back'); return true; }
      return false; }
    function drawMenu(){ var d = new Date(), pad2 = function(n){ return (n < 10 ? '0' : '')+n; }, clk = pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds())+'  '+d.getFullYear()+'-'+pad2(d.getMonth() + 1)+'-'+pad2(d.getDate()); setM('clock', clk);
      var tr = train, st = attract && attract.z ? 'MOVEMENT \u00b7 STAIR ' + (attract.z.fx < 30 ? 'W' : 'E') : tr && tr.grp.visible ? (tr.state === 'stopped' ? 'TRAIN AT PLATFORM' : tr.state === 'coming' ? 'TRAIN APPROACHING' : 'TRAIN DEPARTING') : 'PLATFORM CLEAR'; setM('camstat', st); }
    function setM(k, v){ if(last['m_'+k] !== v){ last['m_'+k] = v; var el = menuEl.querySelector('[data-'+k+']'); if(el) el.textContent = v; } }
    function setT(k, s){ if(last[k] !== s){ last[k] = s; hud[k].textContent = s; } }
    function drawHud(){
      setT('wave', special ? 'THE WRAITHS' : 'WAVE '+(wave < 10 ? '0'+wave : wave)); var inf = alive + toSpawn; setT('inf', inf ? inf+' INFECTED' : 'CLEAR'); setT('kills', kills+' kill'+(kills === 1 ? '' : 's')+(snd.isMuted() ? '  \u00b7  muted' : ''));
      var hpk = clamp(hp/maxhp, 0, 1); if(last.hpk !== hpk){ last.hpk = hpk; hud.hpbar.style.width = (hpk*100)+'%'; hud.hpbar.style.background = hpk < .4 ? '#ff5f57' : '#63e6be'; } setT('hp', String(Math.ceil(hp)));
      var pk = Object.keys(perks).map(function(k){ return '<i style="--pc:'+PERKS[k].col+'" title="'+PERKS[k].name+'">'+PERKS[k].name[0]+'</i>'; }).join(''); if(last.pk !== pk){ last.pk = pk; hud.perks.innerHTML = pk; }
      setT('pts', String(points));
      var wpn = cur(), stt = stat(wpn); setT('wname', stt.name.toUpperCase() + (wpn.up ? '  \u2726' : '')); hud.wname.style.color = wpn.up ? '#ff8a00' : ''; setT('ammo', reloading ? 'RELOADING' : wpn.mag + ' | ' + wpn.res); hud.ammo.style.color = wpn.mag === 0 && !reloading ? '#ff5f57' : '';
      setT('gren', '\u2B22 '+gren); hud.gren.style.opacity = gren ? 1 : .35; setT('other', weapons.length > 1 ? 'Q  '+stat(weapons[1 - slot]).name : '');
      var ba = bannerT > 0 ? Math.min(1, bannerT) : 0; setT('banner', ba ? banner : ''); hud.banner.style.opacity = ba; hud.banner.className = 'ns-banner'+(banner.indexOf('WAVE') === 0 ? ' red' : '');
      setT('next', between > 0 && toSpawn <= 0 && alive <= 0 ? 'next wave in '+Math.ceil(between) : '');
      setT('pu', (puX2 > 0 ? '2X POINTS '+Math.ceil(puX2)+'   ' : '') + (puInsta > 0 ? 'INSTA-KILL '+Math.ceil(puInsta) : ''));
      var ps = prompt ? '['+(touch ? 'USE' : 'F')+']  '+prompt.txt+(prompt.cost ? '  \u00b7  '+prompt.cost : '') : ''; setT('prompt', ps); hud.prompt.hidden = !ps; hud.prompt.className = 'ns-prompt'+(prompt && (prompt.deny || points < prompt.cost) ? ' no' : '');
      setT('msg', msgT > 0 ? msg : ''); hud.msg.style.opacity = msgT > 0 ? Math.min(1, msgT*2) : 0;
      setT('box', boxRoll > 0 ? boxName.toUpperCase() : ''); hud.box.hidden = boxRoll <= 0;
      hud.hit.hidden = hitM <= 0; hud.hit.className = 'ns-hit'+(hitKill ? ' kill' : ''); hud.cross.style.setProperty('--gap', (6 + recoil*7)+'px');
      var va = Math.min(.8, dmgFlash*.9 + (hp < maxhp*.4 ? (.4 - hp/maxhp) * 1.4 * (.6 + .4*Math.sin(t*6)) : 0)); if(last.va !== va){ last.va = va; hud.vig.style.opacity = va; }
      var wa = Math.min(.9, whiteFlash*3) + (puInsta > 0 ? .04 : 0); if(last.wa !== wa){ last.wa = wa; hud.white.style.opacity = wa; hud.white.style.background = puInsta > 0 && whiteFlash <= 0 ? 'rgba(255,60,60,1)' : ''; }
      var fa = fogK < .95 ? (1 - fogK)*.5 : 0; if(last.fa !== fa){ last.fa = fa; hud.fog.style.opacity = fa; }
      if(hud.hint){ var hh = !over && t < 6 && !document.pointerLockElement && !touch; if(last.hh !== hh){ last.hh = hh; hud.hint.style.opacity = hh ? 1 : 0; } }
    }
    g.draw = function(){ if(!R) return; var dt = frameDt; frameDt = 0; R.frame(dt); if(mode === 'menu'){ drawMenu(); return; } if(t > 0){ if(hudEl.hidden) hudEl.hidden = false; drawHud(); } };
    g.update0 = g.update; g.update = function(dt){ g.update0(dt); frameDt = dt; };
    g.resize = function(w, h){ if(R) R.resize(w, h); };
    g.wake = function(){ snd.ambient(true); };
    /* ---------- input ---------- */
    g.key = function(k, down){ if(over) return false; var K = k.length === 1 ? k.toLowerCase() : k;
      if(mode === 'menu') return down ? menuKey(K) : false;
      var map = { ArrowLeft:'L', ArrowRight:'R', ArrowUp:'W', ArrowDown:'S', w:'W', s:'S', a:'A', d:'D', Shift:'sprint', x:'F' }[K];
      if(map){ held[map] = down; if(map === 'F' && down) trigger = true; return true; }
      if(!down) return false;
      if(K === ' '){ jump(); return true; }
      if(K === 'r'){ reload(); return true; } if(K === 'f' || K === 'e' || K === 'Enter'){ interact(); return true; } if(K === 'q'){ swapTo(1 - slot); return true; }
      if(K === '1' || K === '2'){ swapTo(+K - 1); return true; }
      if(K === 'g'){ throwGrenade(); return true; } if(K === 'v'){ doMelee(); return true; } if(K === 'm'){ say(snd.toggle() ? 'Sound off' : 'Sound on', 1); return true; }
      return false; };
    g.pointer = function(type, x, y, e){ if(over || mode === 'menu') return;
      if(type === 'down'){ if(e && e.button === 2){ doMelee(); return; } mouseDown = true; trigger = true; dragX = e ? e.clientX : null; dragY = e ? e.clientY : null; if(e && e.pointerType === 'mouse' && !document.pointerLockElement){ var el = e.currentTarget || e.target; try { var p = el && el.requestPointerLock && el.requestPointerLock(); if(p && p.catch) p.catch(function(){}); } catch(x){} } }
      else if(type === 'up'){ mouseDown = false; dragX = null; dragY = null; }
      else if(type === 'move' && e){ if(document.pointerLockElement){ P.a += (e.movementX || 0) * .0022 * SET.sens; P.p = clamp(P.p - (e.movementY || 0) * .0022 * SET.sens * (SET.inv ? -1 : 1), -1.25, 1.25); } else if(dragX !== null && e.pointerType === 'touch'){ P.a += (e.clientX - dragX) * .006; P.p = clamp(P.p - (e.clientY - dragY) * .005, -1.25, 1.25); dragX = e.clientX; dragY = e.clientY; } } };
    /* settings live on the title and pause cards: the framework rebuilds those, so listen on the stage */
    var onSet = function(e){ var el = e.target; if(!el || !el.getAttribute || !el.getAttribute('data-set')) return; var k = el.getAttribute('data-set'), v = el.value; if(k === 'inv') SET.inv = !!el.checked; else if(k === 'gfx'){ if(GFX.indexOf(v) < 0) return; SET.gfx = v; } else SET[k] = clamp(+v, k === 'sens' ? .3 : k === 'fov' ? 60 : 0, k === 'sens' ? 2.5 : k === 'fov' ? 110 : 1); saveSet(); R.applySettings(); var out = el.parentNode && el.parentNode.querySelector('output'); if(out) out.textContent = k === 'fov' ? SET.fov+'\u00b0' : k === 'vol' ? Math.round(SET.vol*100)+'%' : k === 'sens' ? SET.sens.toFixed(1) : k === 'inv' ? (SET.inv ? 'on' : 'off') : SET.gfx; };
    api.stage.addEventListener('input', onSet); api.stage.addEventListener('change', onSet);
    var wheelT = 0, onWheel = function(e){ if(mode !== 'play' || over) return; e.preventDefault(); var now = Date.now(); if(now - wheelT < 160 || Math.abs(e.deltaY) < 1) return; wheelT = now; swapTo(1 - slot); };   /* two guns, so any notch flips to the other one */
    api.stage.addEventListener('wheel', onWheel, { passive:false });
    g.destroy = function(){ try { if(document.pointerLockElement) document.exitPointerLock(); } catch(e){} api.stage.removeEventListener('input', onSet); api.stage.removeEventListener('change', onSet); api.stage.removeEventListener('wheel', onWheel); if(hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl); if(menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl); dropAttract(); snd.close(); if(R) R.dispose(); R = null; };
    /* ---------- what the tests read ---------- */
    function gunScreen(){ if(!gun || !R) return null; var v = gun.grp.localToWorld(tmpV.copy(gun.grip)).project(R.camera), ax = (v.x + 1)/2*vw, ay = (1 - v.y)/2*vh; v = gun.grp.localToWorld(tmpV.copy(gun.mz)).project(R.camera); return { ax:ax, ay:ay, mx:(v.x + 1)/2*vw, my:(1 - v.y)/2*vh, W:vw, H:vh }; }
    g.peek = function(){ return { special:special, fogK:+fogK.toFixed(2), wave:wave, kills:kills, points:points, total:total, hp:hp, alive:alive, toSpawn:toSpawn, zombies:zombies.length, weapon:stat(cur()).name, mag:cur().mag, res:cur().res, doors:Object.keys(doors).length, power:power, perks:Object.keys(perks), x:P.x, y:P.y, a:P.a, pitch:P.p, footY:+footY.toFixed(2), over:over, overMsg:overMsg, between:+between.toFixed(2), reloading:reloading, swap:+swapT.toFixed(3), boxRoll:+boxRoll.toFixed(2), boxName:boxName, prompt:prompt ? prompt.txt : null, promptCost:prompt ? prompt.cost : null, dmg:stat(cur()).dmg, beams:R ? R.beamsLive() : 0, gun:gunScreen(), gren:gren, puX2:+puX2.toFixed(1), puInsta:+puInsta.toFixed(1), soft:R ? R.soft() : null, bloom:R ? R.bloom.enabled : null, lights:R ? R.world.lights.filter(function(o){ return o.l.visible; }).length : 0, gfx:SET.gfx, fov:SET.fov, sens:SET.sens, train:train ? { state:train.state, x:+train.x.toFixed(1), v:+train.v.toFixed(2), nose:+(train.x + train.nose).toFixed(1), visible:train.grp.visible, next:+train.next.toFixed(1) } : null, banner:bannerT > 0 ? banner : '', gates:R ? Object.keys(R.world.doors).filter(function(k){ return R.world.doors[k].grp.visible; }).length : 0, hud:hudEl ? !hudEl.hidden : false, mode:mode, menu:menuEl ? { open:!menuEl.hidden, panel:menuPanel, sel:menuSel, item:menuItems()[menuSel] ? menuItems()[menuSel].getAttribute('data-act') : null, clock:menuEl.querySelector('[data-clock]').textContent, attract:attract && attract.z ? { x:+attract.z.x.toFixed(2), y:+attract.z.y.toFixed(2), phase:attract.z.phase } : null, cctv:api.canvas.classList.contains('cctv') } : null, jump:+jumpZ.toFixed(2), vz:+vz.toFixed(2), slot:slot, weapons:weapons.map(function(w){ return stat(w).name; }), photo:A.photo, inv:!!SET.inv,
      list:zombies.map(function(z){ return { x:z.x, y:z.y, hp:z.hp, dead:z.dead, rise:z.rise, brute:z.brute, wraith:z.wraith, runner:z.runner, atk:z.atk, fy:+z.fy2.toFixed(2) }; }) }; };
    g.dbg = { locate:function(){ return LOCATE; }, scene:function(){ return R.scene; }, attract:function(){ if(attract){ attract.next = 0; } }, map:function(){ return MAP.map(function(r){ return r.join(''); }); }, points:function(n){ points += n; }, clear:function(){ toSpawn = 0; zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; } }); alive = 0; }, give:function(id, up){ giveWeapon(id); if(up){ cur().up = true; var st = stat(cur()); cur().mag = st.mag; cur().res = st.res; R.gunFor(cur()); } },
      teleport:function(x, y, a, p){ P.x = x; P.y = y; if(a !== undefined) P.a = a; if(p !== undefined) P.p = p; footY = floorAt(x|0, y|0); }, killAll:function(){ zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; alive--; } }); alive = Math.max(0, alive); }, wave:function(n){ zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; } }); alive = 0; between = 0; startWave(n); }, hurt:function(n){ hurt(n); }, power:function(){ power = true; R.powerOn(); }, train:function(){ if(train){ train.next = 0; if(wave < 2) wave = 2; } }, trainAt:function(x, v, state){ train.grp.visible = true; train.x = x; train.v = v; train.state = state || 'coming'; }, gfx:function(t){ SET.gfx = t; R.applySettings(); }, spawnAt:function(x, y, hold){ var s = { x:x, y:y, fx:x, fy:y, stairs:false }; var keep = SPAWNS; SPAWNS = [s]; toSpawn++; spawn(); SPAWNS = keep; var z = zombies[zombies.length - 1]; if(z){ z.rise = 0; z.x = x; z.y = y; z.hold = !!hold; } return zombies.length; } };
    return g;
  }

  GAMES.push({ id:'nightshift', premium:true, rank:1, name:'Nightshift', tkeys:'Pad turns and walks, fire, use, reload, swap and jump on the buttons, drag to look', blurb:'First-person zombie survival in an abandoned subway station. Waves, points, gates, wall guns, a mystery box, perks, a Forge and a train that does not stop for anyone.', keys:'WASD move, mouse looks, click fires, space jumps, scroll or 1 2 swap guns, R reload, F use, G grenade, V melee, shift sprints', W:W, H:H, pad:'fps', color:'#ff3b3b', ownKeys:true, gl:true, lib:'three', menu:true, make:nightshift,
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

