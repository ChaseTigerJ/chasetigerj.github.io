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
    { id:'kong', premium:true, rank:3, tkeys:'Pad moves and climbs, jump button or a tap jumps', name:'Kong', blurb:'Climb six red girders while the ape hurls barrels. Jump them, hammer them, rescue the penguin at the top. This is for Greggy D!', keys:'Arrows move and climb, space jumps', W:480, H:560, pad:'plat', color:'#e24b4b', make:kong, icon:I('<rect x="3" y="3" width="6" height="18" rx="1"/><path d="M3 8h6M3 13h6M3 18h6"/><ellipse cx="16" cy="14" rx="5" ry="6"/><path d="M11 12h10M11 16h10"/>') }
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
  L.push({ id:'tanks', premium:true, rank:4, name:'Tanks', src:'tanks', color:'#8fd46a', pad:'arty',
    tkeys:'Drag from your tank to aim, let go to fire. The pad drives, tunes and arms the nuke',
    blurb:'Artillery on rolling hills against up to three cpu tanks, now in 3D. Wind, fuel, craters, and coins for a shop between rounds: armor, heavy shells, double barrels, a nuke.',
    keys:'Left/right drive, up/down angle, w/s power, space fires, n arms a nuke',
    icon:'<svg viewBox="0 0 24 24"><path d="M3 17h18M5 17v-3h10v3M8 14v-3h4v3M12 11l6-5"/><circle cx="7" cy="19.5" r="1"/><circle cx="12" cy="19.5" r="1"/><circle cx="17" cy="19.5" r="1"/></svg>' });
  L.push({ id:'ghosts', premium:true, rank:5, name:'Ghost Run', src:'ghostrun', color:'#7c5cbf', pad:'dirs',
    tkeys:'Swipe left or right to change lane, up to jump, down to slide. Pick a side at every fork',
    blurb:'Three lanes through a haunted house with ghosts on your heels, now in 3D. Jump the coffins, slide under the witches, dodge the armor, pick a side at every fork.',
    keys:'Arrows change lane, up jumps, down slides, space or enter starts',
    icon:'<svg viewBox="0 0 24 24"><path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/></svg>' });
  /* a bundle fills in its stub by id; a game with no stub (a future one) is simply added */
  window.TIG_REGISTER = function(def){ var g = L.filter(function(x){ return x.id === def.id; })[0]; if(!g){ L.push(def); return def; } Object.keys(def).forEach(function(k){ g[k] = def[k]; }); return g; };
})();

