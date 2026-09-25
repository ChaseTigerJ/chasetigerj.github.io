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
      var seekClimb = function(dir){ if(B.climb || B.jumpT > 0 || sgn(dx) !== dir) return false; var wq = wallAhead(p, dir); if(!wq || !reachesWall(p, dir, wq)) return false; B.climb = { dir:dir, top:wq[1], t:4.5 }; B.climbs = (B.climbs || 0) + 1; hop(.5, .5, dir); return true; };   /* a tall face that way with the enemy beyond it: leap at it and start a wall climb */   /* commit: keep steering this way in the air so a planned arc is flown, not abandoned */   /* a cpu jump is held for `hold` seconds so it gets the height it planned for */
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
      if(p.wall && !B.climb && B.jumpT <= 0 && (sgn(dx) === p.wall || dy < -120)){ var wq = rectHit(p.x + p.wall*(p.r + 6), p.y, 2); if(wq && !wq.lava && p.y - wq[1] > 120){ B.climb = { dir:p.wall, top:wq[1], t:4 }; B.climbs = (B.climbs || 0) + 1; } }   /* climbs counts them for good: the flag itself lives only as long as the climb, too short to sample from outside */
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
    g.peek = function(){ var me = players[0]; return { phase:phase, sudden:sudden, picks:log.slice(),   /* every card taken this match, instants included: they fire and are gone, so they never show in a player's cards */ W:W, H:H, pr:PR, mouseDown:!!mouseDown, rightDown:!!rightDown, fightT:+fightT.toFixed(1), opts:opts, setupSel:setupSel, locker:locker ? { t:+locker.t.toFixed(2), sel:locker.sel, ready:locker.ready.slice() } : null, music:MUSIC.state(), parts:parts.length, blood:parts.filter(function(q){ return q.blood; }).length, players:players.map(function(p){ return { name:p.name, tag:p.tag, col:p.col, look:p.look, blink:p.blinkT > 0, mood:p.happyT > 0 ? 'happy' : p.hurtT > 0 ? 'angry' : null, frenzy:p.frenzyT > 0, retal:p.retalT > 0, climb:!!(p.brain && p.brain.climb), climbs:(p.brain && p.brain.climbs) || 0, onGround:!!p.onGround, brain:p.brain ? { dir:p.brain.dir, push:+(p.brain.push || 0).toFixed(2), campT:+(p.brain.campT || 0).toFixed(1), jumpT:+(p.brain.jumpT || 0).toFixed(2), stuckT:+(p.brain.stuckT || 0).toFixed(2), noSee:+(p.brain.noSee || 0).toFixed(1), wall:p.wall } : null, perfects:p.perfects || 0, vy:Math.round(p.vy), rope:!!p.rope, r:+p.r.toFixed(2), face:p.face, walkT:+(p.walkT || 0).toFixed(2), hp:Math.round(p.hp), maxhp:p.maxhp, alive:p.alive, x:Math.round(p.x), y:Math.round(p.y), ammo:p.ammo, points:p.points, rounds:p.rounds, cards:p.cards.map(function(k){ return k.id; }), blockCd:+(p.blockCd || 0).toFixed(2), blocking:p.blockT > 0, reloading:p.reloadT > 0, S:{ hp:Math.round(p.S.hp), dmg:+p.S.dmg.toFixed(1), reload:+p.S.reload.toFixed(2), ammo:p.S.ammo, atk:+p.S.atk.toFixed(3), speed:+p.S.speed.toFixed(2), bullets:p.S.bullets, bounces:p.S.bounces, blockCd:+p.S.blockCd.toFixed(2), move:+p.S.move.toFixed(2), onBlock:p.S.onBlock.slice() } }; }), bullets:bullets.length, hand:hand ? hand.map(function(k){ return k.id; }) : null, handSel:handSel, picker:picker ? picker.name : null, cpuPickT:+(cpuPickT || 0).toFixed(2), pickClock:+pickClock.toFixed(1), pickLimit:PICK_LIMIT, cpuChoice:cpuChoice ? cpuChoice.id : null, corpses:corpses.length, skill:SKILL[opts.skill], sizeK:SIZE_K, hats:HATS.length, faces:FACES.length, extras:EXTRAS.length, map:map ? map.name : null, countdown:+(countdown || 0).toFixed(2), banner:banner, over:over, matchSel:matchSel, extensions:extensions, winner:matchWinner ? matchWinner.name : null, score:score, cards:CARDS.length, packs:Object.keys(PACKS), maps:MAPS.length, move:MOVE, scorePipX:Math.round(scorePipX), fixed:dyn ? dyn.fixed.map(function(q){ return q.lava ? 'lava' : q.bounce ? 'pad' : 'belt'; }) : [], zones:zones.length, zoneKinds:zones.map(function(z){ return z.k; }), bombs:bombs.length, bulletOwners:bullets.map(function(b){ return b.o.name; }), bulletPos:bullets.map(function(b){ return [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy)]; }), ents:ents.length, aim:me ? +me.aim.toFixed(2) : 0, mouse:mouse }; };
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

  /* name, blurb and icon live in the stub in games/14-premium-stubs.js; this is the half that needs the code */
  (window.TIG_REGISTER || function(d){ GAMES.push(d); })({ id:'rounds', W:W, H:H, make:rounds, cards:CARDS.length });
})();

