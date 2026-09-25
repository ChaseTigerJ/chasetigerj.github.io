/* tigOS arcade, Nightshift part 00: setup. The parts in this folder are concatenated in name order by build.py, so they share one closure.
   Nightshift is a first-person wave shooter set in an abandoned subway station, rendered with Three.js (window.THREE, vendored in
   src/assets/three.js and fetched only when the game starts). Nearly everything in the scene is generated here at load: tile, brick,
   ballast and poster textures are drawn on canvases, the props are boxes and cylinders, every sound is synthesised with WebAudio.
   The two hero models, the wraith and the subway train, are built in Blender (blender/*.py, run headless) and ship as small .glb files
   that stream in after the game starts; a procedural stand-in draws until each lands. Same contract as games.js:
   make(api) -> { reset, update, draw, key, pointer, resize, destroy }. */
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
    /* per-station mosaic band and name plaque in the station's own colour, made on first visit and kept */
    A.station = {}; A.stationMats = function(def){ if(A.station[def.id]) return A.station[def.id]; var hsl = hexHsl(def.band), hue = hsl[0], sat = hsl[1], lum = hsl[2];
      var tiles = function(x, w, h){ for(var yy = 0; yy < h; yy += 8) for(var xx = 0; xx < w; xx += 8){ x.fillStyle = 'hsl('+hue+' '+(sat*100 - 8 + srand()*12)+'% '+(lum*100 - 4 + srand()*8)+'%)'; x.fillRect(xx + 1, yy + 1, 6, 6); } };
      var band = ctex(64, 64, function(x, w, h){ x.fillStyle = def.band; x.fillRect(0, 0, w, h); tiles(x, w, h); x.fillStyle = '#c9a54a'; for(var b = 0; b < w; b += 8){ x.fillRect(b + 1, 1, 6, 6); x.fillRect(b + 1, h - 7, 6, 6); } }, [4, 1]);
      var sign = ctex(512, 128, function(x, w, h){ x.fillStyle = def.band; x.fillRect(0, 0, w, h); tiles(x, w, h); x.fillStyle = '#e9e2cf'; x.fillRect(16, 16, w - 32, h - 32); for(var y2 = 16; y2 < h - 16; y2 += 8) for(var x2 = 16; x2 < w - 16; x2 += 8){ x.fillStyle = 'hsl(45 '+(20 + srand()*12)+'% '+(80 + srand()*10)+'%)'; x.fillRect(x2 + 1, y2 + 1, 6, 6); } x.fillStyle = '#c9a54a'; for(var b = 24; b < w - 24; b += 8){ x.fillRect(b + 1, 25, 6, 6); x.fillRect(b + 1, h - 31, 6, 6); }
        var c = mk(512, 128), q = c.getContext('2d'); text(q, def.name.toUpperCase(), 256, 66, def.name.length > 9 ? 52 : 64, '#000', 'center', 900, 'Georgia, "Times New Roman", serif'); var d = q.getImageData(0, 0, 512, 128).data; x.fillStyle = '#17181c'; for(var yy = 0; yy < 128; yy += 4) for(var xx = 0; xx < 512; xx += 4){ if(d[(yy*512 + xx)*4 + 3] > 120) x.fillRect(xx, yy, 4, 4); } });
      return A.station[def.id] = { band:std({ map:band, roughness:.4 }), sign:std({ map:sign, roughness:.4 }) }; };
    return A;
  }
  function hexHsl(hex){ var n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255)/255, g = ((n >> 8) & 255)/255, b = (n & 255)/255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn)/2, d = mx - mn, h = 0, s = 0;
    if(d > 0){ s = d/(1 - Math.abs(2*l - 1)); h = mx === r ? ((g - b)/d) % 6 : mx === g ? (b - r)/d + 2 : (r - g)/d + 4; h = Math.round(h*60); if(h < 0) h += 360; } return [h, s, l]; }

  /* ---------- the Blender models. MODELS[key] holds each parsed glTF scene once it arrives (null before, and for good if the fetch fails,
     e.g. offline or file://). wraith and zombie are cloned per body, guns per viewmodel, props per machine; the train is one. Listeners hear
     about each arrival so a running game can swap the train in place. ---------- */
  var MODEL_KEYS = ['wraith', 'train', 'zombie', 'guns', 'props'];
  var MODELS = { wraith:null, train:null, zombie:null, guns:null, props:null, tried:false, failed:{}, listeners:[] };
  function modelReady(k, scene){ ({ wraith:prepWraith, train:prepTrain, zombie:prepZombie, guns:prepGuns, props:prepProps }[k] || function(){})(scene); MODELS[k] = scene; MODELS.listeners.slice().forEach(function(fn){ try { fn(k, scene); } catch(e){} }); }
  function loadModels(){ if(MODELS.tried) return; MODELS.tried = true; var THREE = window.THREE; if(!THREE || !THREE.GLTFLoader) return; var L = new THREE.GLTFLoader();
    MODEL_KEYS.forEach(function(k){ var url = window.TIG_ASSETS && window.TIG_ASSETS[k]; if(!url){ MODELS.failed[k] = 'no asset'; return; } if(!/^https?:/.test(location.protocol)){ MODELS.failed[k] = 'file://'; return; }   /* fetch() has no file: scheme; tests hand the bytes in through g.dbg.model */
      L.load(url, function(gltf){ modelReady(k, gltf.scene); }, undefined, function(e){ MODELS.failed[k] = String(e && e.message || e || 'load error'); }); }); }
  function parseModel(k, buf, cb){ new window.THREE.GLTFLoader().parse(buf, '', function(gltf){ modelReady(k, gltf.scene); if(cb) cb(null); }, function(e){ MODELS.failed[k] = String(e && e.message || e); if(cb) cb(e); }); }
  function eachMesh(sc, fn){ sc.traverse(function(o){ if(o.isMesh){ o.castShadow = o.receiveShadow = false; fn(o, o.material); } }); }
  function prepWraith(sc){ var THREE = window.THREE; eachMesh(sc, function(o, m){ m.side = THREE.FrontSide; m.roughness = Math.max(m.roughness, .75);
      if(/Shroud|Flesh/.test(m.name)){ m.transparent = true; m.opacity = /Flesh/.test(m.name) ? .9 : .8; m.emissive = new THREE.Color(0x2c4a66); m.emissiveIntensity = .35; m.depthWrite = true; }
      if(/Void/.test(m.name)){ m.color.setHex(0x000000); m.emissive.setHex(0); m.userData.fixed = true; }
      if(/Eyes/.test(m.name)){ m.emissive.setHex(0x9fe0ff); m.emissiveIntensity = 4; m.userData.fixed = true; } }); }
  function prepTrain(sc){ var THREE = window.THREE; eachMesh(sc, function(o, m){ if(/Glass/.test(m.name)){ m.transparent = false; m.side = THREE.DoubleSide; m.emissive.setHex(0xffc98a); m.emissiveIntensity = .75; }   /* Blender's strength 2.2 plus bloom whites the whole side out */
      if(/Steel|Rib|Bezel/.test(m.name)){ m.metalness = .22; m.roughness = .42; } if(/^Black|Rubber|Dark/.test(m.name)){ m.roughness = .92; } if(/^(Steel|Black|Dark)/.test(m.name)) m.side = THREE.FrontSide;   /* the body panels are one-sided so the interior built in 02-world is all you see from a seat */   /* no environment map: full metalness would render black under point lights; matte darks, or the grazing view along the platform turns the window band grey */ }); }
  function prepZombie(sc){ eachMesh(sc, function(o, m){ m.roughness = Math.max(m.roughness, .8); if(/Eyes|Glass|Stripe|Lantern/.test(m.name)) m.userData.fixed = true; if(/Stripe/.test(m.name)){ m.emissive.setHex(0xd8d8c0); m.emissiveIntensity = .5; } if(/Lantern|Glass/.test(m.name)){ m.emissive.setHex(0xffb050); m.emissiveIntensity = /Glass/.test(m.name) ? 2.5 : .3; } if(/Badge/.test(m.name)) m.metalness = .3; }); }
  function prepGuns(sc){ eachMesh(sc, function(o, m){ if(/Gun$|GunLight|Brass|Iron/.test(m.name)){ m.metalness = Math.min(m.metalness, .3); m.roughness = Math.max(m.roughness, .4); } if(/GunLight/.test(m.name) && !m.userData.dim){ m.userData.dim = true; m.color.multiplyScalar(.72); } if(/Glow/.test(m.name)){ m.emissive.setHex(0xff8a00); m.emissiveIntensity = 2.2; } if(/Green|Teal|Violet|Blue|Red|Purple/.test(m.name)) m.emissiveIntensity = Math.min(m.emissiveIntensity, .7);   /* bloom does the rest; at Blender strength the ray gun's rings white the screen out */ if(/GunGlass/.test(m.name)){ m.transparent = true; m.opacity = .6; } }); }
  function prepProps(sc){ var THREE = window.THREE; eachMesh(sc, function(o, m){ if(/Iron|Steel|Brass|Hydraulic|Grate|Cabinet/.test(m.name)){ m.metalness = Math.min(m.metalness, .3); m.roughness = Math.max(m.roughness, .4); } if(/Beam/.test(m.name)){ m.transparent = true; m.opacity = .16; m.depthWrite = false; m.side = THREE.DoubleSide; m.emissiveIntensity = Math.min(m.emissiveIntensity, .5); } if(/Glass/.test(m.name)){ m.transparent = true; m.opacity = .45; } if(/Plaque/.test(m.name)){ m.emissiveIntensity = 0; } }); }
  /* clone a named node out of a loaded scene with its own materials (so a tint or a flash touches one body, not every copy) */
  function cloneNode(sc, name, matFilter){ var src = name ? sc.getObjectByName(name) : sc; if(!src) return null; var g = src.clone(true), seen = {}, mats = [];
    g.traverse(function(o){ if(!o.isMesh) return; var m = o.material, k = m.name || m.uuid; if(!seen[k]){ seen[k] = m.clone(); seen[k].name = m.name; seen[k].userData.fixed = m.userData.fixed; if(matFilter) matFilter(seen[k]); mats.push(seen[k]); } o.material = seen[k]; });
    g.userData.mats = mats; return g; }
/* tigOS arcade, Nightshift part 01: the line. Four stations on a loop (Tiger Ave, Canal St, Foundry Yard, Harbor Pl) joined by long tunnels,
   each a 60 x 24 tile grid (1 tile = 1 m) that drives collision, pathing and the geometry builder. One chunk is loaded at a time: the station
   you stand in, or a stretch of tunnel. The train runs the loop eastbound and stops at every platform; ride it and you arrive at the next station,
   walk the tunnel instead and you meet what lives in the dark. Every station: a near platform where the trains stop, the tracks in a pit a
   step down, a far platform across them, tunnel mouths at both ends, stair mouths (the barricades the dead climb over) and rooms behind grates.
   Legend: # tile wall  % brick wall  . platform floor  _ track bed  P start  S stair mouth (spawn)  F fence (spawn, forced open)  a-d grates
           X wall buy  K resupply crate  Y power switch  C column  B bench  U turnstile  (machines sit on floor tiles, MTILE) */
  var MW = 60, MH = 24, MAP, SPAWNS, BUY_AT, MACHINES, BOXM, POWER_AT, MTILE, START, LOCATE, CEILH, FLOORY, CUR = null;
  var STATION = { x0:9, x1:50, z0:1, z1:15 }, PIT = { z0:5, z1:8 }, TRACK_Z = 7, PIT_Y = -1.05, CEIL_HI = 3.4, CEIL_LO = 2.6, TRAIN_FLOOR = PIT_Y + .95;   /* the car floor: a short step down from the platform, 2 m of headroom under the roof */
  var DOOR_COST = { a:750, b:1000, c:1000, d:1250 };
  var isDoor = function(ch){ return ch === 'a' || ch === 'b' || ch === 'c' || ch === 'd'; };
  var isFloor = function(ch){ return ch === '.' || ch === '_' || ch === 'P' || ch === 'C' || ch === 'B' || ch === 'U' || ch === 'F' || ch === 'W'; };   /* open air above; C/B/U are floor tiles with a prop on them; F is the forced fence panel; W a tunnel walkway */
  var isOpen = function(ch){ return isFloor(ch) || isDoor(ch); };
  /* the four stations. Each layout draws its rooms on top of the shared hall; machines are per station so the perks are spread down the line,
     the Forge lives at Foundry Yard, the power at Tiger Ave, and the box starts at Tiger Ave until the bear sends it elsewhere. */
  var STATIONS = [
    { id:'tiger', name:'Tiger Ave', sub:'Platform A', band:'#1f4a3a', accent:'#ff8a00', wall:'tile', layout:function(F){
        F.fill(24, 35, 17, 22, '.'); F.fill(1, 7, 10, 14, '.'); F.fill(52, 58, 10, 14, '.');
        F.stairs([[12, 16], [13, 16], [46, 16], [47, 16], [20, 0], [21, 0], [38, 0], [39, 0]]);
        F.put(30, 16, 'a'); F.put(4, 9, 'b'); F.put(55, 9, 'c'); F.put(51, 12, 'd');
        F.buy(20, 16, 'stitcher'); F.buy(36, 19, 'doorman'); F.buy(30, 0, 'longbow'); F.buy(59, 12, 'anvil'); F.buy(0, 12, 'wasp');
        F.put(8, 11, 'K'); F.put(51, 10, 'K'); F.power(55, 15);
        F.columns(11, 47, 4, 11); F.columns(13, 45, 8, 2); F.benches([[17, 15], [25, 15], [33, 15], [41, 15], [16, 1], [44, 1]]); F.turnstiles([[26, 18], [27, 18], [28, 18], [32, 18], [33, 18], [34, 18]]);
        F.machines([{ x:49.5, y:9.5, kind:'box' }, { x:2.5, y:13.5, kind:'fleetfoot' }, { x:24.5, y:21.5, kind:'quickhands' }, { x:34.5, y:21.5, kind:'doubletap' }, { x:57.5, y:13.5, kind:'ironhide' }]);
        F.start(17.5, 13.5, 0); } },
    { id:'canal', name:'Canal St', sub:'Lower Level', band:'#7a1b1b', accent:'#ffd166', wall:'tile', layout:function(F){
        F.fill(10, 22, 17, 22, '.'); F.fill(37, 49, 17, 22, '.'); F.fill(1, 7, 1, 4, '.'); F.fill(52, 58, 1, 4, '.'); F.fill(52, 58, 10, 13, '.');
        F.stairs([[26, 16], [27, 16], [33, 16], [34, 16], [14, 0], [15, 0], [44, 0], [45, 0]]);
        F.put(16, 16, 'a'); F.put(43, 16, 'b'); F.put(8, 2, 'c'); F.put(51, 11, 'd');
        F.buy(9, 20, 'wasp'); F.buy(50, 20, 'doorman'); F.buy(30, 0, 'stitcher'); F.buy(59, 11, 'longbow');
        F.put(51, 3, 'K'); F.put(8, 12, 'K');
        F.columns(13, 47, 4, 11); F.columns(15, 45, 6, 2); F.benches([[19, 15], [29, 15], [39, 15], [22, 1], [36, 1]]); F.turnstiles([[12, 19], [13, 19], [45, 19], [46, 19]]);
        F.machines([{ x:48.5, y:21.5, kind:'box' }, { x:11.5, y:21.5, kind:'fleetfoot' }, { x:20.5, y:21.5, kind:'deadshot' }, { x:57.5, y:12.5, kind:'ironhide' }, { x:2.5, y:1.5, kind:'quickhands' }]);
        F.start(30.5, 13.5, 0); } },
    { id:'foundry', name:'Foundry Yard', sub:'Works Siding', band:'#8a5a10', accent:'#ff5a00', wall:'brick', layout:function(F){
        F.fill(1, 7, 9, 15, '.'); F.fill(1, 7, 1, 4, '.'); F.fill(20, 39, 17, 22, '.'); F.fill(52, 58, 9, 15, '.');
        F.stairs([[10, 16], [11, 16], [48, 16], [49, 16], [30, 0], [31, 0]]);
        F.put(8, 12, 'a'); F.put(29, 16, 'b'); F.put(51, 12, 'c'); F.put(8, 2, 'd');
        F.buy(0, 12, 'reaper'); F.buy(40, 19, 'anvil'); F.buy(12, 0, 'doorman'); F.buy(59, 12, 'stitcher');
        F.put(51, 4, 'K'); F.put(19, 20, 'K');
        F.columns(13, 47, 6, 11); F.benches([[15, 15], [44, 15], [20, 1], [40, 1]]); F.turnstiles([[24, 18], [25, 18], [34, 18], [35, 18]]);
        F.machines([{ x:2.5, y:14.5, kind:'forge' }, { x:38.5, y:21.5, kind:'box' }, { x:21.5, y:21.5, kind:'doubletap' }, { x:57.5, y:14.5, kind:'fleetfoot' }, { x:2.5, y:3.5, kind:'deadshot' }]);
        F.start(30.5, 12.5, Math.PI); } },
    { id:'harbor', name:'Harbor Pl', sub:'Ferry Exit', band:'#1c3f8a', accent:'#8cc7ff', wall:'tile', layout:function(F){
        F.fill(14, 45, 17, 21, '.'); F.fill(1, 7, 10, 14, '.'); F.fill(52, 58, 1, 4, '.'); F.fill(52, 58, 10, 14, '.');
        F.stairs([[22, 16], [23, 16], [36, 16], [37, 16], [18, 0], [19, 0], [40, 0], [41, 0]]);
        F.put(30, 16, 'a'); F.put(8, 12, 'b'); F.put(51, 2, 'c'); F.put(51, 12, 'd');
        F.buy(46, 19, 'wasp'); F.buy(13, 19, 'longbow'); F.buy(26, 0, 'doorman'); F.buy(59, 12, 'reaper'); F.buy(0, 12, 'anvil');   /* (30, 0) sits behind the middle bench */
        F.put(51, 3, 'K'); F.put(8, 11, 'K');
        F.columns(11, 47, 4, 11); F.columns(13, 45, 8, 2); F.benches([[15, 15], [27, 15], [33, 15], [45, 15], [16, 1], [30, 1], [44, 1]]); F.turnstiles([[27, 18], [28, 18], [31, 18], [32, 18]]);
        F.machines([{ x:15.5, y:20.5, kind:'box' }, { x:44.5, y:20.5, kind:'ironhide' }, { x:2.5, y:13.5, kind:'quickhands' }, { x:57.5, y:3.5, kind:'doubletap' }, { x:57.5, y:13.5, kind:'fleetfoot' }]);
        F.start(29.5, 13.5, 0); } } ];
  /* the tunnel between stations: a straight run of track with maintenance alcoves (walkways a step up, out of the train's path) and no light to speak of */
  var TUNNEL = { id:'tunnel', name:'Tunnel', sub:'', band:'#222', accent:'#ff3b3b', wall:'brick', tunnel:true, layout:function(F){
      [[6, 10], [24, 28], [42, 46]].forEach(function(r){ F.fill(r[0], r[1], 4, 4, 'W'); F.fill(r[0], r[1], 9, 9, 'W'); });
      F.machines([]); F.start(2.5, 8.5, 0); } };
  var TUNNEL_SEGS = 3;   /* tunnel chunks between two stations: ~180 m on foot */
  function genMap(def){
    CUR = def; MAP = []; for(var z = 0; z < MH; z++){ var row = []; for(var x = 0; x < MW; x++) row.push('#'); MAP.push(row); }
    var fill = function(x0, x1, z0, z1, ch){ for(var zz = z0; zz <= z1; zz++) for(var xx = x0; xx <= x1; xx++) MAP[zz][xx] = ch; };
    var put = function(x, z, ch){ MAP[z][x] = ch; };
    BUY_AT = {}; MACHINES = []; POWER_AT = null; START = { x:17.5, y:13.5, a:0 };
    var F = { fill:fill, put:put, stairs:function(l){ l.forEach(function(p){ put(p[0], p[1], 'S'); }); }, buy:function(x, z, id){ put(x, z, 'X'); BUY_AT[x+','+z] = id; }, power:function(x, z){ put(x, z, 'Y'); POWER_AT = x+','+z; },
      columns:function(x0, x1, step, z){ for(var cx = x0; cx <= x1; cx += step) put(cx, z, 'C'); }, benches:function(l){ l.forEach(function(p){ put(p[0], p[1], 'B'); }); }, turnstiles:function(l){ l.forEach(function(p){ put(p[0], p[1], 'U'); }); },
      machines:function(l){ MACHINES = l; }, start:function(x, y, a){ START = { x:x, y:y, a:a }; } };
    if(def.tunnel){ fill(0, MW - 1, PIT.z0, PIT.z1, '_'); def.layout(F); }
    else {
      fill(STATION.x0, STATION.x1, 1, 4, '.');          /* far platform */
      fill(1, MW - 2, PIT.z0, PIT.z1, '_');              /* the pit, tunnel to tunnel */
      fill(STATION.x0, STATION.x1, 9, 15, '.');         /* near platform */
      def.layout(F);
      for(var zz = PIT.z0; zz <= PIT.z1; zz++){ put(0, zz, zz === PIT.z1 ? 'F' : '#'); put(MW - 1, zz, zz === PIT.z1 ? 'F' : '#'); }   /* the fence: the south panel is the one somebody forced */
      put(0, PIT.z1 - 1, 'F'); put(MW - 1, PIT.z1 - 1, 'F');
      /* brick for everything outside the tiled station box */
      for(var z2 = 0; z2 < MH; z2++) for(var x2 = 0; x2 < MW; x2++){ if(MAP[z2][x2] === '#' && (def.wall === 'brick' || x2 < STATION.x0 - 1 || x2 > STATION.x1 + 1 || z2 > 16)) MAP[z2][x2] = '%'; }
      put(START.x|0, START.y|0, 'P');
    }
    MTILE = {}; MACHINES.forEach(function(m){ MTILE[(m.x|0)+','+(m.y|0)] = m; }); BOXM = MACHINES.filter(function(m){ return m.kind === 'box'; })[0] || null;
    /* spawn points: the floor tile in front of each stair mouth, and just inside the fences */
    SPAWNS = [];
    for(var sz = 0; sz < MH; sz++) for(var sx = 0; sx < MW; sx++){ var c0 = MAP[sz][sx]; if(c0 !== 'S' && c0 !== 'F') continue;
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function(o){ var nx = sx + o[0], nz = sz + o[1]; if(MAP[nz] && isFloor(MAP[nz][nx]) && MAP[nz][nx] !== 'F' && !MTILE[nx+','+nz]) SPAWNS.push({ x:nx + .5, y:nz + .5, fx:c0 === 'S' ? sx + .5 : sx + .5 + (sx === 0 ? -2.5 : 2.5), fy:sz + .5, stairs:c0 === 'S' }); }); }
    if(def.tunnel){ SPAWNS = []; [[-2, TRACK_Z + .5], [MW + 2, TRACK_Z + .5]].forEach(function(p){ SPAWNS.push({ x:p[0] < 0 ? .5 : MW - .5, y:p[1], fx:p[0], fy:p[1], stairs:false }); }); }
    /* per-tile ceiling height and floor level: the station hall is tall, rooms and tunnels are low; the pit is a step down */
    CEILH = []; FLOORY = [];
    for(var z3 = 0; z3 < MH; z3++){ CEILH.push([]); FLOORY.push([]); for(var x3 = 0; x3 < MW; x3++){ var inHall = !def.tunnel && x3 >= STATION.x0 && x3 <= STATION.x1 && z3 >= STATION.z0 && z3 <= STATION.z1; CEILH[z3].push(inHall ? CEIL_HI : CEIL_LO); FLOORY[z3].push(MAP[z3][x3] === '_' || MAP[z3][x3] === 'F' ? PIT_Y : 0); } }
    /* where a test (or a curious player) can stand to face each thing */
    var faceFrom = function(tx, tz){ var opts = [[1,0],[-1,0],[0,1],[0,-1]].map(function(o){ var nx = tx + o[0], nz = tz + o[1]; return { x:nx + .5, y:nz + .5, a:Math.atan2(-o[1], -o[0]), ok:MAP[nz] && isFloor(MAP[nz][nx]) && MAP[nz][nx] !== 'C' && MAP[nz][nx] !== 'B' && MAP[nz][nx] !== 'U' && !MTILE[nx+','+nz] }; }).filter(function(o){ return o.ok; }); return opts[0] ? { x:opts[0].x, y:opts[0].y, a:opts[0].a } : null; };
    LOCATE = { start:START, machines:{}, doors:[], buys:[], crates:[], power:null, stairs:[], station:def.id };
    MACHINES.forEach(function(m){ LOCATE.machines[m.kind] = faceFrom(m.x|0, m.y|0); });
    for(var lz = 0; lz < MH; lz++) for(var lx = 0; lx < MW; lx++){ var c = MAP[lz][lx], f;
      if(isDoor(c) && (f = faceFrom(lx, lz))){ f.cost = DOOR_COST[c]; f.tx = lx; f.ty = lz; f.id = c; LOCATE.doors.push(f); }
      if(c === 'X' && (f = faceFrom(lx, lz))){ f.id = BUY_AT[lx+','+lz]; LOCATE.buys.push(f); }
      if(c === 'K' && (f = faceFrom(lx, lz))) LOCATE.crates.push(f);
      if(c === 'S' && (f = faceFrom(lx, lz))) LOCATE.stairs.push(f);
      if(c === 'Y') LOCATE.power = faceFrom(lx, lz); }
    LOCATE.doors.sort(function(p, q){ return p.cost - q.cost; });
  }
  genMap(STATIONS[0]);
  function ch(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? '#' : MAP[z][x]; }
  function floorAt(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? 0 : FLOORY[z][x]; }
  function ceilAt(x, z){ return (x < 0 || z < 0 || x >= MW || z >= MH) ? CEIL_LO : CEILH[z][x]; }
/* tigOS arcade, Nightshift part 02: the world builder. Turns the grid into merged meshes (one per material) plus props, lights and the
   train. Everything is boxes, cylinders and quads with canvas textures. buildWorld(scene, opts) builds one chunk (a station or a tunnel stretch) into a group
   and returns handles the game animates; world.root is removed and disposed when the player moves down the line. */
  function Geo(){ this.p = []; this.n = []; this.uv = []; this.i = []; this.c = 0; }
  Geo.prototype.quad = function(v0, v1, v2, v3, uv, want){   /* four corners in order, uv = [[u,v] x4], want = the side the face must show */
    var ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2], bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    var nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx, L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    var vs = [v0, v1, v2, v3], us = uv; if(nx*want[0] + ny*want[1] + nz*want[2] < 0){ vs = [v0, v3, v2, v1]; us = [uv[0], uv[3], uv[2], uv[1]]; nx = -nx; ny = -ny; nz = -nz; }
    for(var k = 0; k < 4; k++){ this.p.push(vs[k][0], vs[k][1], vs[k][2]); this.n.push(nx, ny, nz); this.uv.push(us[k][0], us[k][1]); }
    var c = this.c; this.i.push(c, c + 1, c + 2, c, c + 2, c + 3); this.c += 4; };
  Geo.prototype.build = function(){ var THREE = window.THREE, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.i); return g; };

  function buildWorld(scene, opts){
    opts = opts || {}; var THREE = window.THREE, A = assets(), M = A.mat, T = A.tex, geos = {}, def = CUR, tunnel = !!def.tunnel, SM = A.stationMats(def);
    var root = new THREE.Group(); scene.add(root);
    var world = { root:root, def:def, lights:[], tubes:[], props:[], doors:{}, buys:{}, machines:{}, power:null, sandbags:[], dispose:[], signals:[], add:function(o){ root.add(o); return o; } };
    var G = function(k){ return geos[k] || (geos[k] = new Geo()); };
    var wallMat = function(c, x, z){ return c === '%' ? 'brick' : 'tile'; };
    /* a vertical face along the edge from (ax,az) to (bx,bz), y0..y1, showing toward (wx,wz) */
    var vface = function(k, ax, az, bx, bz, y0, y1, wx, wz, uscale){ var u0 = (ax !== bx ? ax : az)*(uscale || 1), u1 = (ax !== bx ? bx : bz)*(uscale || 1); G(k).quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], [wx, 0, wz]); };
    var hface = function(k, x0, z0, x1, z1, y, up, us){ us = us || 1; G(k).quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [[x0*us, z0*us], [x1*us, z0*us], [x1*us, z1*us], [x0*us, z1*us]], [0, up ? 1 : -1, 0]); };
    for(var z = 0; z < MH; z++) for(var x = 0; x < MW; x++){
      var c = MAP[z][x];
      if(isOpen(c)){
        var fy = floorAt(x, z), cy = ceilAt(x, z);
        hface(c === '_' || c === 'F' ? 'ballast' : c === 'W' ? 'walk' : 'floor', x, z, x + 1, z + 1, fy, true, c === '_' ? .5 : 1);
        hface('ceiling', x, z, x + 1, z + 1, cy, false, .5);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(o){ var nx = x + o[0], nz = z + o[1], nc = ch(nx, nz);
          var ex0 = o[0] === 1 ? x + 1 : x, ez0 = o[1] === 1 ? z + 1 : z, ex1 = o[0] === 0 ? x + 1 : ex0, ez1 = o[1] === 0 ? z + 1 : ez0;   /* the shared edge */
          if(isOpen(nc)){
            var nfy = floorAt(nx, nz), ncy = ceilAt(nx, nz);
            if(nfy < fy) vface('edge', ex0, ez0, ex1, ez1, nfy, fy, o[0], o[1]);          /* platform edge face, seen from the pit */
            if(ncy < cy) vface('ceiling', ex0, ez0, ex1, ez1, ncy, cy, -o[0], -o[1], .5); /* lintel where the hall ceiling drops into a room or tunnel */
          } else {
            if((nx < 0 || nx >= MW) && z >= PIT.z0 && z <= PIT.z1) return;   /* the track runs off the map's ends into the tunnel, no wall there */
            if(nc !== 'S'){ var k = wallMat(nc, nx, nz); vface(k, ex0, ez0, ex1, ez1, fy, cy, -o[0], -o[1], k === 'brick' ? .5 : 2); }   /* a stair mouth is an opening: its alcove is built as a prop */
            world.props.push({ kind:nc, x:x, z:z, wx:nx, wz:nz, dir:o, fy:fy, cy:cy });   /* things that hang on or sit in this face: buys, crates, switch, posters, the sign band, stairs */
          } });
        if(c === 'C' || c === 'B' || c === 'U' || isDoor(c)) world.props.push({ kind:c, x:x, z:z, fy:fy, cy:cy });
      }
    }
    /* the tunnels run on past the map's ends into the dark (a station's fences, a tunnel stretch's next stretch) */
    [[-44, 0], [MW, MW + 44]].forEach(function(r){ var x0 = r[0], x1 = r[1], z0 = PIT.z0, z1 = PIT.z1 + 1;
      hface('ballast', x0, z0, x1, z1, PIT_Y, true, .5); hface('ceiling', x0, z0, x1, z1, CEIL_LO, false, .5);
      vface('brick', x0, z0, x1, z0, PIT_Y, CEIL_LO, 0, 1, .5); vface('brick', x0, z1, x1, z1, PIT_Y, CEIL_LO, 0, -1, .5); vface('brick', x0 < 0 ? x0 : x1, z0, x0 < 0 ? x0 : x1, z1, PIT_Y, CEIL_LO, x0 < 0 ? 1 : -1, 0, .5); });
    if(!tunnel){   /* chain-link fences close the tunnels at the map's edge; somebody forced the last panel: that is where they come in, and where you go out */
      [0.5, MW - .5].forEach(function(fx){ var fg = new THREE.PlaneGeometry(2.6, CEIL_LO - PIT_Y, 8, 8), fm = new THREE.Mesh(fg, M.fence); fm.position.set(fx, (CEIL_LO + PIT_Y)/2, PIT.z0 + 1.3); fm.rotation.y = Math.PI/2; root.add(fm); world.dispose.push(fg); var bent = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6, 4, 4), M.fence); bent.position.set(fx + (fx < 2 ? .5 : -.5), PIT_Y + .8, PIT.z0 + 3.3); bent.rotation.y = Math.PI/2 + (fx < 2 ? .9 : -.9); bent.rotation.z = .3; root.add(bent); world.dispose.push(bent.geometry);
        for(var pz2 = PIT.z0; pz2 <= PIT.z0 + 4; pz2 += 2){ var pg = new THREE.CylinderGeometry(.03, .03, CEIL_LO - PIT_Y, 6), pm = new THREE.Mesh(pg, M.rail); pm.position.set(fx, (CEIL_LO + PIT_Y)/2, pz2); root.add(pm); world.dispose.push(pg); } }); }
    var matFor = { tile:M.tile, brick:M.brick, floor:M.floor, walk:M.metal, ceiling:M.ceiling, ballast:M.ballast, edge:M.floor, dark:M.dark };
    Object.keys(geos).forEach(function(k){ var g = geos[k].build(), m = new THREE.Mesh(g, matFor[k]); m.matrixAutoUpdate = false; root.add(m); world.dispose.push(g); });

    /* ---------- props ---------- */
    var box = function(w, h, d, mat, x, y, z){ var g = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); world.dispose.push(g); return m; };
    var cyl = function(r0, r1, h, mat, x, y, z, seg){ var g = new THREE.CylinderGeometry(r0, r1, h, seg || 12), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); world.dispose.push(g); return m; };
    var plane = function(w, h, mat, x, y, z, dir){ var g = new THREE.PlaneGeometry(w, h), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = Math.atan2(dir[0], dir[1]); world.dispose.push(g); return m; };   /* dir = the way the plane faces */
    var textTex = function(w, h, fn){ var c = mk(w, h); fn(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; world.dispose.push(t); return t; };
    var faceCenter = function(p, inset){ inset = inset || 0; return { x:p.x + .5 + p.dir[0]*(.5 - inset), z:p.z + .5 + p.dir[1]*(.5 - inset), dir:[-p.dir[0], -p.dir[1]] }; };   /* on the wall face, looking back into the room */
    var prop = function(kind, mats){ var sc = MODELS.props; if(!sc) return null; var g = cloneNode(sc, kind); if(!g) return null; g.userData.mats.forEach(function(m){ if(mats) mats(m); }); g.traverse(function(o){ if(o.isMesh){ o.matrixAutoUpdate = true; } }); return g; };   /* a Blender prop with its own materials, or null when the model has not arrived */
    var posterN = 0, bandDone = {};
    /* the platform edge gets the yellow warning strip */
    for(var pz = 0; pz < MH; pz++) for(var px = 0; px < MW; px++){ if(MAP[pz][px] !== '.') continue; [[0, 1], [0, -1]].forEach(function(o){ if(ch(px + o[0], pz + o[1]) === '_'){ var s = box(1, .012, .5, M.stripe, px + .5, .006, pz + .5 + o[1]*.25); root.add(s); } }); }
    /* rails and ties along the whole track */
    var tiesG = new THREE.BoxGeometry(.22, .08, 2.4), ties = new THREE.InstancedMesh(tiesG, M.wood, 140), tm = new THREE.Object3D(); world.dispose.push(tiesG);
    for(var ti = 0; ti < 140; ti++){ tm.position.set(-44 + ti*(MW + 88)/140, PIT_Y + .04, TRACK_Z); tm.updateMatrix(); ties.setMatrixAt(ti, tm.matrix); } root.add(ties);
    [TRACK_Z - .72, TRACK_Z + .72].forEach(function(rz){ root.add(box(MW + 88, .14, .08, M.rail, MW/2, PIT_Y + .15, rz)); root.add(box(MW + 88, .06, .16, M.rail, MW/2, PIT_Y + .06, rz)); });
    root.add(box(MW + 88, .1, .1, M.dark, MW/2, PIT_Y + .3, TRACK_Z + 1.55));   /* third rail cover */
    if(tunnel){   /* cable runs, signal lights and a soaked floor: the tunnel is its own place */
      for(var cz = PIT.z0; cz <= PIT.z1 + 1; cz += PIT.z1 + 1 - PIT.z0){ root.add(box(MW + 88, .06, .06, M.dark, MW/2, CEIL_LO - .9, cz + (cz === PIT.z0 ? .1 : -.1))); root.add(box(MW + 88, .06, .06, M.dark, MW/2, CEIL_LO - 1.2, cz + (cz === PIT.z0 ? .1 : -.1))); }
      [12, 32, 52].forEach(function(sx, i){ var pole = cyl(.04, .04, 1.6, M.rail, sx, PIT_Y + .8, PIT.z0 + .25, 8); root.add(pole); var head = box(.22, .5, .16, M.dark, sx, PIT_Y + 1.75, PIT.z0 + .25); root.add(head);
        var lampM = new THREE.MeshStandardMaterial({ color:i === 1 ? 0xffb020 : 0xff2020, emissive:i === 1 ? 0xff9000 : 0xff1010, emissiveIntensity:2.5 }), lamp = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), lampM); lamp.position.set(sx, PIT_Y + 1.85, PIT.z0 + .35); root.add(lamp); world.dispose.push(lamp.geometry);
        var L = new THREE.PointLight(i === 1 ? 0xff9000 : 0xff2020, 1.6, 9, 1); L.position.set(sx, PIT_Y + 1.6, PIT.z0 + .8); root.add(L); world.lights.push({ l:L, pri:1 }); world.signals.push({ l:L, m:lampM, ph:i }); });
      [[6, 4], [24, 4], [42, 4], [6, 9], [24, 9], [42, 9]].forEach(function(w2){ var lamp2 = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), M.bulb); lamp2.position.set(w2[0] + 2.5, CEIL_LO - .3, w2[1] + .5); root.add(lamp2); world.dispose.push(lamp2.geometry); var L2 = new THREE.PointLight(0xffd6a0, .9, 6, 1); L2.position.set(w2[0] + 2.5, CEIL_LO - .5, w2[1] + .5); root.add(L2); world.lights.push({ l:L2, pri:2 }); var cage = box(.6, .2, .3, M.dark, w2[0] + 2.5, CEIL_LO - .12, w2[1] + .5); root.add(cage); }); }
    world.props.forEach(function(p){
      var fc, k = p.kind;
      if(k === 'C'){ var cx = p.x + .5, cz = p.z + .5, hh = p.cy - p.fy; var col = new THREE.Group(); col.add(box(.34, hh, .34, M.steel, 0, p.fy + hh/2, 0)); col.add(box(.5, .08, .5, M.steel, 0, p.fy + .04, 0)); col.add(box(.5, .12, .5, M.steel, 0, p.cy - .06, 0)); col.add(box(.06, hh - .3, .42, M.dark, 0, p.fy + hh/2, 0)); col.add(box(.42, hh - .3, .06, M.dark, 0, p.fy + hh/2, 0)); col.position.set(cx, 0, cz); root.add(col); }
      else if(k === 'B'){ var b = new THREE.Group(), along = ch(p.x, p.z - 1) === '.' && ch(p.x, p.z + 1) === '.'; b.add(box(1.7, .06, .42, M.wood, 0, .46, 0)); b.add(box(1.7, .38, .05, M.wood, 0, .68, -.2)); for(var li = -1; li <= 1; li += 2){ b.add(box(.06, .46, .4, M.steel, li*.75, .23, 0)); } b.position.set(p.x + .5, 0, p.z + .5); b.rotation.y = along ? Math.PI/2 : 0; if(!along && ch(p.x, p.z + 1) !== '.') b.rotation.y = Math.PI; root.add(b); }
      else if(k === 'U'){ var u = new THREE.Group(); u.add(box(.36, 1.0, .9, M.metal, 0, .5, 0)); u.add(cyl(.03, .03, .8, M.rail, 0, .95, 0, 8)); u.children[1].rotation.z = Math.PI/2; u.add(cyl(.028, .028, .6, M.rail, .2, .98, 0, 8)); u.position.set(p.x + .5, 0, p.z + .5); root.add(u); }
      else if(isDoor(k)){ var vert = isOpen(ch(p.x, p.z - 1)) || isOpen(ch(p.x, p.z + 1)), h = p.cy - .05, d = new THREE.Group();
        var lt = textTex(256, 128, function(x, w, hh3){ x.fillStyle = '#ffd166'; x.fillRect(0, 0, w, hh3); x.fillStyle = '#1a1208'; x.fillRect(6, 6, w - 12, hh3 - 12); text(x, 'LOCKED', 128, 40, 34, '#ffd166', 'center', 900); text(x, DOOR_COST[k]+' PTS', 128, 90, 30, '#fff', 'center', 900); }), lm = new THREE.MeshStandardMaterial({ map:lt, roughness:.6, emissive:0x332200, emissiveIntensity:.6 });
        var gate = prop('gate'), entry = { grp:d, h:h, mat:lm, signs:[], model:!!gate };
        if(gate){ gate.scale.set(1, h/2.5, 1); gate.rotation.y = vert ? Math.PI/2 : 0; d.add(gate); var slats = gate.getObjectByName('Slats'), lock = gate.getObjectByName('Lock'), plaque = gate.getObjectByName('Plaque'); if(plaque){ plaque.traverse(function(o){ if(o.isMesh) o.material = lm; }); var p2 = plaque.clone(); p2.rotation.y = Math.PI; p2.position.z = -plaque.position.z; gate.add(p2); entry.signs = [plaque, p2]; }
          entry.gate = slats || gate; entry.lock = lock; entry.slats = slats; entry.y0 = entry.gate.position.y; }
        else { var gm = box(vert ? .96 : .08, h, vert ? .08 : .96, M.grate, 0, h/2, 0); d.add(gm); d.add(box(vert ? 1.02 : .2, .22, vert ? .2 : 1.02, M.metal, 0, p.cy - .1, 0)); var s1 = plane(.6, .3, lm, vert ? 0 : .05, 1.35, vert ? .05 : 0, vert ? [0, 1] : [1, 0]), s2 = plane(.6, .3, lm, vert ? 0 : -.05, 1.35, vert ? -.05 : 0, vert ? [0, -1] : [-1, 0]); d.add(s1); d.add(s2); entry.gate = gm; entry.signs = [s1, s2]; entry.y0 = gm.position.y; }
        d.position.set(p.x + .5, 0, p.z + .5); root.add(d); world.doors[p.x+','+p.z] = entry; }
      else if(k === 'S'){ fc = faceCenter(p); var sg = new THREE.Group(), dx = p.dir[0], dz = p.dir[1], hh2 = p.cy - p.fy;
        sg.add(box(dx ? 1.3 : .06, hh2, dx ? .06 : 1.3, M.dark, dx*.65 + dz*.5, hh2/2, dz*.65 + dx*.5)); sg.add(box(dx ? 1.3 : .06, hh2, dx ? .06 : 1.3, M.dark, dx*.65 - dz*.5, hh2/2, dz*.65 - dx*.5)); sg.add(box(dx ? .06 : 1, hh2, dx ? 1 : .06, M.dark, dx*1.3, hh2/2, dz*1.3)); sg.add(box(dx ? 1.3 : 1, .06, dx ? 1 : 1.3, M.dark, dx*.65, hh2 - .03, dz*.65));   /* the alcove: two sides, a back wall and a lid */
        for(var st = 0; st < 5; st++){ sg.add(box(dx ? .28 : .96, .22, dx ? .96 : .28, M.floor, dx*(.2 + st*.22), .11 + st*.22, dz*(.2 + st*.22))); }   /* steps rising away into the dark */
        var bagMat = M.burlap; for(var bg = 0; bg < 9; bg++){ var row = bg < 5 ? 0 : 1, ix = bg < 5 ? bg - 2 : bg - 6.5, bagx = dx ? -.15 + row*.22 : ix*.2, bagz = dz ? -.15 + row*.22 : ix*.2; var bag = box(dx ? .3 : .34, .2, dx ? .34 : .3, bagMat, bagx, .1 + row*.19, bagz); bag.rotation.y = (srand() - .5)*.4; sg.add(bag); }
        var ex = plane(.7, .26, M.exit, dx*-.02, p.cy - .45, dz*-.02, [-dx, -dz]); sg.add(ex);
        sg.position.set(fc.x, p.fy, fc.z); root.add(sg); world.sandbags.push(sg); }
      else if(k === 'X' && BUY_AT[p.wx+','+p.wz]){ fc = faceCenter(p, .02); var wid = BUY_AT[p.wx+','+p.wz], wp = WEAPONS[wid];
        var bt = textTex(256, 160, function(x, w, h4){ x.clearRect(0, 0, w, h4); x.strokeStyle = '#f4f1ea'; x.lineWidth = 4; x.setLineDash([10, 8]); x.strokeRect(8, 8, w - 16, h4 - 16); x.setLineDash([]); text(x, wp.name.toUpperCase(), 128, 40, 30, '#f4f1ea', 'center', 900); x.fillStyle = '#f4f1ea'; x.fillRect(60, 70, 136, 12); x.fillRect(150, 60, 40, 10); x.fillRect(66, 82, 18, 30); x.fillRect(120, 82, 14, 18); text(x, wp.cost+' PTS', 128, 136, 26, '#ffd166', 'center', 900); }), bm = new THREE.MeshBasicMaterial({ map:bt, transparent:true }), bp = plane(1.3, .82, bm, fc.x, 1.65, fc.z, fc.dir); root.add(bp); world.buys[p.wx+','+p.wz] = bp;
        if(MODELS.guns){ var wg = cloneNode(MODELS.guns, wid); if(wg){ wg.traverse(function(o){ if(o.name.indexOf('Glow') === 0) o.visible = false; }); wg.scale.set(1.6, 1.6, 1.6); wg.position.set(fc.x + fc.dir[0]*.12, 1.62, fc.z + fc.dir[1]*.12); wg.rotation.y = Math.atan2(fc.dir[0], fc.dir[1]) + Math.PI/2; wg.rotation.z = .08; root.add(wg); bp.visible = false; var chalk = plane(1.5, .95, bm, fc.x, 1.65, fc.z, fc.dir); root.add(chalk); world.buys[p.wx+','+p.wz] = chalk; } } }   /* the gun itself hangs on the chalk outline once the models are in */
      else if(k === 'K'){ fc = faceCenter(p, .25); var kg = new THREE.Group(); kg.add(box(.7, .34, .44, new THREE.MeshStandardMaterial({ color:0x2f4a2a, roughness:.8 }), 0, .17, 0)); kg.add(box(.6, .3, .4, new THREE.MeshStandardMaterial({ color:0x35552f, roughness:.8 }), .05, .5, .02)); kg.add(box(.72, .04, .46, M.dark, 0, .35, 0));
        var kt = textTex(256, 64, function(x, w, h5){ x.fillStyle = '#1a1208'; x.fillRect(0, 0, w, h5); text(x, 'RESUPPLY \u00b7 250', 128, 32, 28, '#ffd166', 'center', 900); }); kg.add(plane(1, .25, new THREE.MeshBasicMaterial({ map:kt }), p.dir[0]*.2, 1.5, p.dir[1]*.2, fc.dir)); kg.position.set(fc.x, p.fy, fc.z); root.add(kg); }
      else if(k === 'Y'){ fc = faceCenter(p, .06); var pg2 = prop('power'), yg = new THREE.Group(), lever, lamp;
        if(pg2){ yg.add(pg2); lever = pg2.getObjectByName('Lever'); lamp = pg2.getObjectByName('Lamp'); yg.position.set(fc.x, 0, fc.z); }
        else { yg.add(box(.6, .9, .12, M.metal, 0, 1.35, 0)); lever = box(.08, .4, .08, new THREE.MeshStandardMaterial({ color:0xb01818, roughness:.5 }), 0, 1.25, .1); lever.rotation.x = .9; yg.add(lever); lamp = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshStandardMaterial({ color:0xff3030, emissive:0xff2020, emissiveIntensity:2 })); lamp.position.set(.18, 1.67, .07); yg.add(lamp); world.dispose.push(lamp.geometry);
          var yt = textTex(128, 40, function(x, w, h6){ x.fillStyle = '#ffd166'; x.fillRect(0, 0, w, h6); text(x, 'POWER', 64, 20, 24, '#1a1208', 'center', 900); }); yg.add(plane(.5, .16, new THREE.MeshBasicMaterial({ map:yt }), 0, 1.93, .07, [0, 1])); yg.position.set(fc.x, 0, fc.z); }
        yg.rotation.y = Math.atan2(fc.dir[0], fc.dir[1]); root.add(yg); var lampMesh = null; if(lamp){ lamp.traverse(function(o){ if(o.isMesh && !lampMesh) lampMesh = o; }); }
        world.power = { grp:yg, lever:lever, lamp:lampMesh || lamp, model:!!pg2, x:fc.x, z:fc.z }; }
      else if(k === '#' || k === '%'){
        /* the mosaic band and name plaques run along the hall's long walls; posters go on other tiled faces */
        var hall = !tunnel && p.x >= STATION.x0 && p.x <= STATION.x1 && p.z >= STATION.z0 && p.z <= STATION.z1 && p.dir[0] === 0 && k === '#';
        if(hall){ fc = faceCenter(p, .012); var bkey = p.z+':'+p.dir[1]; root.add(plane(1, .22, SM.band, fc.x, 2.25, fc.z, fc.dir));
          if((p.x - STATION.x0) % 12 === 6 && !bandDone[bkey+p.x]){ bandDone[bkey+p.x] = 1; root.add(plane(3.2, .8, SM.sign, fc.x, 1.75, fc.z, fc.dir)); }
          else if(((p.x*7 + p.z*3) % 11 === 0) && (p.x - STATION.x0) % 12 !== 5 && (p.x - STATION.x0) % 12 !== 7){ root.add(plane(.66, 1, M.poster[posterN++ % M.poster.length], fc.x, 1.45, fc.z, fc.dir)); } }
        else if(!tunnel && k === '#' && p.dir[1] === 0 && (p.x + p.z) % 5 === 0){ fc = faceCenter(p, .012); root.add(plane(.66, 1, M.poster[posterN++ % M.poster.length], fc.x, 1.45, fc.z, fc.dir)); }
        else if(!tunnel && def.wall === 'brick' && p.dir[0] === 0 && p.z >= STATION.z0 && p.z <= STATION.z1 && p.x >= STATION.x0 && p.x <= STATION.x1 && (p.x - STATION.x0) % 12 === 6 && !bandDone[p.z+':'+p.dir[1]+p.x]){ bandDone[p.z+':'+p.dir[1]+p.x] = 1; fc = faceCenter(p, .012); root.add(plane(3.2, .8, SM.sign, fc.x, 1.75, fc.z, fc.dir)); }
      }
    });
    /* bins for life */
    if(!tunnel) [[22.5, 14.6], [40.5, 9.6], [30.5, 3.6], [12.5, 9.6]].forEach(function(b){ if(MAP[b[1]|0][b[0]|0] !== '.') return; var bin = cyl(.28, .24, .8, M.metal, b[0], .4, b[1], 14); root.add(bin); });

    /* ---------- machines: the box (or the chalk outline it left), the Forge, the perk vendors ---------- */
    MACHINES.forEach(function(m){ var g = new THREE.Group(), lit = [], pm;
      if(m.kind === 'box'){ pm = prop('box'); m.here = !!opts.boxHere;
        if(pm){ g.add(pm); m.lid = pm.getObjectByName('Lid'); m.beam = pm.getObjectByName('Beam'); m.bear = pm.getObjectByName('Bear'); m.pedestal = pm.getObjectByName('Pedestal'); m.chest = pm; m.model = true;
          pm.traverse(function(o){ if(o.isMesh && /Rune/.test(o.material.name)) m.gem = o; }); m.beam.visible = false; m.bear.visible = false; m.bearY0 = m.bear.position.y; m.lidRest = m.lid.rotation.x;
          pm.children.forEach(function(c2){ if(c2 !== m.pedestal && c2 !== m.beam && c2 !== m.bear) c2.visible = m.here; }); m.pedestal.visible = !m.here; }
        else { var chest = new THREE.Group(); chest.add(box(.9, .5, .6, M.wood, 0, .25, 0)); var lid = box(.92, .08, .62, M.wood, 0, .54, 0); chest.add(lid); chest.add(box(.94, .06, .64, M.metal, 0, .3, 0)); var qm = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshStandardMaterial({ color:0x8cc7ff, emissive:0x8cc7ff, emissiveIntensity:1.6 })); qm.position.set(0, .66, 0); chest.add(qm); world.dispose.push(qm.geometry); m.lid = lid; m.gem = qm; m.chest = chest; chest.visible = m.here; g.add(chest);
          var ped = box(1.0, .01, .64, new THREE.MeshStandardMaterial({ color:0xe0e0d0, emissive:0x808070, emissiveIntensity:.6 }), 0, .005, 0); ped.visible = !m.here; g.add(ped); m.pedestal = ped; } }
      else if(m.kind === 'forge'){ pm = prop('forge');
        if(pm){ g.add(pm); m.press = pm.getObjectByName('Press'); m.tray = pm.getObjectByName('Tray'); m.sign = pm.getObjectByName('ForgeSign'); m.trayZ0 = m.tray.position.z; m.pressY0 = m.press.position.y; m.model = true; pm.userData.mats.forEach(function(mt){ if(/ForgeGlow|Sign/.test(mt.name)){ lit.push(mt); mt.userData.base = mt.emissiveIntensity; } }); m.glowMats = lit.slice(); lit = []; }
        else { g.add(box(1.1, 1.3, .8, M.metal, 0, .65, 0)); var mouth = box(.6, .36, .1, new THREE.MeshStandardMaterial({ color:0xff6a00, emissive:0xff5a00, emissiveIntensity:2.6 }), 0, .7, .4); g.add(mouth); g.add(box(.3, .5, .3, M.metal, 0, 1.55, 0)); g.add(box(1.2, .1, .9, M.dark, 0, 1.35, 0)); m.mouth = mouth; lit.push(mouth); } }
      else { var pk = PERKS[m.kind], col = new THREE.Color(pk.col); pm = prop('vendor', function(mt){ if(/Panel|Bottle/.test(mt.name)){ mt.color.copy(col); mt.emissive.copy(col); } });
        if(pm){ g.add(pm); m.panelNode = pm.getObjectByName('Panel'); m.bottle = pm.getObjectByName('Bottle'); m.signNode = pm.getObjectByName('Sign'); m.bottle.visible = false; m.bottleY0 = m.bottle.position.y; m.model = true; pm.userData.mats.forEach(function(mt){ if(/Panel/.test(mt.name)){ m.panel = { material:mt }; mt.userData.base = 1.4; } }); }
        else { g.add(box(.8, 1.9, .6, M.metal, 0, .95, 0)); var panel = box(.62, 1.0, .06, new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:1.4, roughness:.4 }), 0, 1.25, .31); g.add(panel); lit.push(panel); m.panel = panel;
          var lt2 = textTex(256, 96, function(x, w, h7){ x.fillStyle = '#111'; x.fillRect(0, 0, w, h7); text(x, pk.name.toUpperCase(), 128, 34, 30, pk.col, 'center', 900); text(x, pk.cost+' PTS', 128, 70, 22, '#fff', 'center', 800); }); g.add(plane(.62, .24, new THREE.MeshBasicMaterial({ map:lt2 }), 0, .55, .32, [0, 1])); }
        var lt3 = textTex(256, 96, function(x, w, h8){ x.fillStyle = '#111'; x.fillRect(0, 0, w, h8); text(x, pk.name.toUpperCase(), 128, 34, 30, pk.col, 'center', 900); text(x, pk.cost+' PTS', 128, 70, 22, '#fff', 'center', 800); }); if(pm) g.add(plane(.62, .24, new THREE.MeshBasicMaterial({ map:lt3 }), 0, .62, .32, [0, 1])); }
      /* face the room: turn toward the nearest open neighbour */
      var f = LOCATE.machines[m.kind]; if(f){ g.rotation.y = Math.atan2(f.x - m.x, f.y - m.y); }
      g.position.set(m.x, floorAt(m.x|0, m.y|0), m.y); root.add(g); m.grp = g; m.lit = lit; world.machines[m.kind] = m; });

    /* ---------- lights: fluorescent tubes over the platforms, bulbs in the rooms and tunnels, two work lamps by the south stairs ---------- */
    var tube = function(x, y, z, along, light, pri){ var t = box(along ? 1.3 : .08, .06, along ? .08 : 1.3, M.tube, x, y, z), hs = box(along ? 1.4 : .16, .05, along ? .16 : 1.4, M.dark, x, y + .05, z); root.add(t); root.add(hs); var o = { mesh:t, x:x, y:y, z:z, light:null, pri:pri || 5 }; if(light){ var L = new THREE.PointLight(0xdfe8ff, 3.6, 14, 1); L.position.set(x, y - .3, z); root.add(L); o.light = L; o.base = 3.6;   /* linear falloff: inverse-square under a 3.4 m ceiling leaves the floor black or the ceiling white */ world.lights.push({ l:L, pri:o.pri }); } world.tubes.push(o); return o; };
    if(!tunnel){
      for(var tx = 11; tx <= 47; tx += 4){ tube(tx + .5, CEIL_HI - .12, 12.5, true, (tx - 11) % 8 === 0, 1); tube(tx + .5, CEIL_HI - .12, 2.5, true, (tx - 11) % 8 === 4, 3); }
      for(var rz2 = 17; rz2 < MH; rz2++) for(var rx2 = 1; rx2 < MW; rx2++){ if(MAP[rz2][rx2] === '.' && (rx2 + rz2) % 9 === 0 && MAP[rz2][rx2 - 1] === '.' && MAP[rz2][rx2 + 1] === '.') tube(rx2 + .5, CEIL_LO - .1, rz2 + .5, true, (rx2 % 2) === 0, 4); }
      tube(4.5, CEIL_LO - .1, 12, false, MAP[12][4] === '.', 6); tube(55.5, CEIL_LO - .1, 12, false, MAP[12][55] === '.', 6); tube(4.5, CEIL_LO - .1, 2.5, false, MAP[2][4] === '.', 6); tube(55.5, CEIL_LO - .1, 2.5, false, MAP[2][55] === '.', 6);
      var bulb = function(x, y, z, pri, col, inten){ var b = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), M.bulb); b.position.set(x, y, z); root.add(b); world.dispose.push(b.geometry); var L = new THREE.PointLight(col || 0xffd6a0, inten || 1.6, 10, 1); L.position.set(x, y - .25, z); root.add(L); world.lights.push({ l:L, pri:pri }); return L; };
      bulb(-4, CEIL_LO - .2, TRACK_Z, 7); bulb(MW + 4, CEIL_LO - .2, TRACK_Z, 7); bulb(4.5, CEIL_LO - .2, TRACK_Z, 8); bulb(MW - 4.5, CEIL_LO - .2, TRACK_Z, 8); bulb(-20, CEIL_LO - .2, TRACK_Z, 12, 0xffd6a0, 1); bulb(MW + 20, CEIL_LO - .2, TRACK_Z, 12, 0xffd6a0, 1);
      for(var bx2 = -36; bx2 <= MW + 36; bx2 += 8){ if(bx2 > 1 && bx2 < MW - 1) continue; var bb = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), M.bulb); bb.position.set(bx2, CEIL_LO - .2, TRACK_Z); root.add(bb); world.dispose.push(bb.geometry); }
      /* work lamps: a halogen on a tripod, warm and a little unsteady, one by each south stair */
      var lamp = function(x, z, ry, pri){ var g = new THREE.Group(); g.add(cyl(.02, .02, 1.5, M.dark, 0, .75, 0, 6)); for(var i = 0; i < 3; i++){ var leg = cyl(.012, .012, .8, M.dark, Math.cos(i*2.1)*.22, .38, Math.sin(i*2.1)*.22, 5); leg.rotation.z = Math.cos(i*2.1)*.3; leg.rotation.x = -Math.sin(i*2.1)*.3; g.add(leg); } g.add(box(.36, .26, .16, M.metal, 0, 1.55, 0)); var face = box(.3, .2, .02, M.work, 0, 1.55, .09); g.add(face); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); var L = new THREE.PointLight(0xffb060, 2.6, 11, 1); L.position.set(x + Math.sin(ry)*.3, 1.55, z + Math.cos(ry)*.3); root.add(L); world.lights.push({ l:L, pri:pri }); world.work = world.work || []; world.work.push({ l:L, face:face, base:2.6 }); };
      var souths = LOCATE.stairs.filter(function(s2){ return s2.y > 12; }); if(souths[0]) lamp(souths[0].x + 2.5, 14.4, -2.2, 2); if(souths[souths.length - 1] && souths.length > 1) lamp(souths[souths.length - 1].x - 2.5, 14.4, 2.2, 2);
    }
    world.lights.sort(function(p, q){ return p.pri - q.pri; });
    root.add(new THREE.HemisphereLight(0x303848, 0x0c0a08, tunnel ? .2 : .45));
    root.add(new THREE.AmbientLight(0x1a1c24, tunnel ? .3 : .6));

    /* ---------- the train: four cars, lit windows, headlights. It lives in the tunnel until the game calls it. The Blender consist
       (blender/train.py, an R160-style NYC set) replaces the box stand-in the moment its .glb arrives; the group, nose, tail and headlight stay. ---------- */
    var tr = new THREE.Group(); var carL = 9.2, cars = 4, nose = (cars - 1)*(carL + .3) + carL/2, stand = new THREE.Group(); tr.add(stand);
    for(var ci = 0; ci < cars; ci++){ var cx0 = ci*(carL + .3); var body = box(carL, 2.3, 2.7, M.train, cx0, PIT_Y + 1.55, 0); stand.add(body); stand.add(box(carL, .3, 2.72, M.trainStripe, cx0, PIT_Y + 1.1, 0)); stand.add(box(carL - .6, .5, 2.5, M.dark, cx0, PIT_Y + 2.85, 0)); stand.add(box(carL, .5, 2.2, M.dark, cx0, PIT_Y + .3, 0));
      for(var wi = 0; wi < 5; wi++){ var wx = cx0 - carL/2 + .9 + wi*1.85; stand.add(box(.95, .62, 2.74, M.window, wx, PIT_Y + 1.95, 0)); } for(var wh = 0; wh < 2; wh++){ stand.add(cyl(.42, .42, .3, M.dark, cx0 - carL/2 + 1.5 + wh*(carL - 3), PIT_Y + .42, .8, 10)); stand.add(cyl(.42, .42, .3, M.dark, cx0 - carL/2 + 1.5 + wh*(carL - 3), PIT_Y + .42, -.8, 10)); } }
    stand.children.forEach(function(m){ if(m.geometry.type === 'CylinderGeometry') m.rotation.x = Math.PI/2; });
    var hl1 = box(.3, .3, .3, M.headlight, nose + .05, PIT_Y + 1.2, .8), hl2 = box(.3, .3, .3, M.headlight, nose + .05, PIT_Y + 1.2, -.8); stand.add(hl1); stand.add(hl2);
    var hlight = new THREE.PointLight(0xfff4e0, 9, 30, 1); hlight.position.set(nose + 1.5, PIT_Y + 1.4, 0); tr.add(hlight);
    var cabin = new THREE.PointLight(0xfff0dc, 0, 12, 1); cabin.position.set(nose/2, PIT_Y + 2.2, 0); tr.add(cabin);   /* the warm car interior, only lit while you ride */
    var tail1 = box(.2, .2, .2, new THREE.MeshStandardMaterial({ color:0xff2020, emissive:0xff2020, emissiveIntensity:3 }), -carL/2 - .05, PIT_Y + 1.2, .8), tail2 = tail1.clone(); tail2.position.z = -.8; stand.add(tail1); stand.add(tail2);
    /* the interior you ride in: the Blender shell is one-sided, so the inside is built here (floor, ceiling, wall panels with the door gaps left open,
       benches, poles, strip lights). Cheap boxes; the shell hides it from the platform except through the doors. */
    var inner = new THREE.Group(), carLights = [], seatA = new THREE.MeshStandardMaterial({ color:0x2a4f8a, roughness:.55 }), seatB = new THREE.MeshStandardMaterial({ color:0xd8742a, roughness:.55 }), wallM = new THREE.MeshStandardMaterial({ map:T.metal, color:0x585c64, emissive:0x0e1014, roughness:.62, metalness:.3 }), ceilM = new THREE.MeshStandardMaterial({ map:T.ceiling, color:0x8a8a92, emissive:0x141620, roughness:.85 }), carTube = new THREE.MeshStandardMaterial({ color:0xf4f6ff, emissive:0xdfe8ff, emissiveIntensity:1.05, roughness:.4 }), winM = new THREE.MeshStandardMaterial({ color:0x0a1020, roughness:.12, metalness:.6, transparent:true, opacity:.8 }), linoM = new THREE.MeshStandardMaterial({ map:T.concrete, color:0x8a8478, roughness:.9 }), adM = new THREE.MeshStandardMaterial({ map:T.posters[1], roughness:.9 });
    for(var ci2 = 0; ci2 < cars; ci2++){ var cx2 = ci2*(carL + .3), fy0 = TRAIN_FLOOR, cy0 = PIT_Y + 3.0;
      inner.add(box(carL - .2, .04, 2.5, linoM, cx2, fy0, 0)); inner.add(box(carL - .2, .04, 2.5, ceilM, cx2, cy0, 0));
      inner.add(box(.05, cy0 - fy0, 2.5, wallM, cx2 - carL/2 + .12, (fy0 + cy0)/2, 0)); inner.add(box(.05, cy0 - fy0, 2.5, wallM, cx2 + carL/2 - .12, (fy0 + cy0)/2, 0));
      [-1, 1].forEach(function(sd){ [[-carL/2 + .1, -3.05], [-1.55, 1.55], [3.05, carL/2 - .1]].forEach(function(sg, si){ var w = sg[1] - sg[0], mx2 = cx2 + (sg[0] + sg[1])/2;
          inner.add(box(w, .95, .04, wallM, mx2, fy0 + .5, sd*1.24)); inner.add(box(w, .28, .04, wallM, mx2, cy0 - .16, sd*1.24)); var wy0 = fy0 + .975, wy1 = cy0 - .30; inner.add(box(w, wy1 - wy0, .03, winM, mx2, (wy0 + wy1)/2, sd*1.25));   /* tinted pane so the shell's bright inner face never shows */
          var bw = w - .25; inner.add(box(bw, .06, .48, si % 2 ? seatA : seatB, mx2, fy0 + .46, sd*.98)); inner.add(box(bw, .46, .06, si % 2 ? seatA : seatB, mx2, fy0 + .72, sd*1.2));
          if(si === 1) inner.add(plane(1.2, .36, adM, mx2, cy0 - .38, sd*1.22, [0, -sd])); }); });
      for(var pl = -1; pl <= 1; pl += 2){ var pole = cyl(.02, .02, cy0 - fy0 - .06, M.rail, cx2 + pl*2.3, (fy0 + cy0)/2, .55, 8); inner.add(pole); }
      for(var lt = 0; lt < 3; lt++){ inner.add(box(2.2, .05, .16, carTube, cx2 - 3 + lt*3, cy0 - .07, -.5)); inner.add(box(2.2, .05, .16, carTube, cx2 - 3 + lt*3, cy0 - .07, .5)); }
      [-2.4, 2.4].forEach(function(lx){ var carL2 = new THREE.PointLight(0xe8ecff, 0, 7, 1); carL2.position.set(cx2 + lx, cy0 - .25, 0); inner.add(carL2); carLights.push(carL2); }); }
    tr.add(inner);
    tr.position.set(-200, 0, TRACK_Z); tr.visible = false; root.add(tr);
    world.train = { grp:tr, tail:-carL/2, nose:nose, hlight:hlight, cabin:cabin, inner:inner, carLights:carLights, model:false, doors:[], carL:carL, cars:cars, floorY:TRAIN_FLOOR };
    world.setTrain = function(sc){ if(world.train.model) return; stand.visible = false; sc.position.set(0, PIT_Y, 0); tr.add(sc); world.train.model = true; world.train.doors = []; sc.traverse(function(o){ if(/^Door[LR]/.test(o.name) && !o.isMesh){   /* the leaf empties only: their meshes carry the same name prefix and must ride along, not slide twice */ if(o.userData.x0 === undefined) o.userData.x0 = o.position.x; o.userData.side = o.name.charAt(4) === 'L' ? -1 : 1; world.train.doors.push(o); } }); };   /* the glb is modelled with car 0 at x=0 and rails at y=0, along +X, so it drops straight onto the stand-in's frame */
    if(MODELS.train) world.setTrain(MODELS.train);
    world.dispose.push({ dispose:function(){ if(MODELS.train && MODELS.train.parent === tr) tr.remove(MODELS.train); } });   /* the consist is shared down the line: unhook it before this chunk's geometry goes */
    world.destroy = function(){ scene.remove(root); world.dispose.forEach(function(o){ if(o.dispose) o.dispose(); }); root.traverse(function(o){ if(o.geometry && o.geometry.dispose && !(o.userData && o.userData.shared)) o.geometry.dispose(); }); };
    return world;
  }
/* tigOS arcade, Nightshift part 03: actors. The dead (the Blender humanoid in blender/humanoid.py, dressed per kind, with the jointed capsule
   body as the stand-in until the model lands), the wraith, the weapon viewmodels (blender/guns.py, with the hands on the grips), particles, tracers,
   blood decals and the muzzle flash. Pure construction and per-frame animation; the rules live in part 05. */
  /* the dead: one rig, many bodies. Kinds: walker (the crowd), runner, brute, wraith (the fog wave), and the transit dead the train lets out:
     mta (vest, hard hat, radio) and nypd (cap, badge). The Conductor haunts the tunnels in his coat with a lantern. Every body is a little different:
     height, hunch, a dropped shoulder, hair or none. Palettes 0-3 are the crowd, 4 the wraith, 5 mta, 6 nypd, 7 the conductor. */
  var PALS = [ { skin:'#7f8f68', skin2:'#4d5a3c', shirt:'#343946', pants:'#232228', hair:'#1c1a18' }, { skin:'#b3ada0', skin2:'#6e6459', shirt:'#5e2b2b', pants:'#2a2830', hair:'#3a3128' }, { skin:'#6f8460', skin2:'#3a4a34', shirt:'#2c4638', pants:'#3a2718', hair:'#101010' }, { skin:'#a08772', skin2:'#5c3f33', shirt:'#4a1e1e', pants:'#1e1e24', hair:'#2a1010' }, { skin:'#dfe9ff', skin2:'#9fb4e6', shirt:'#aebfe8', pants:'#8b9cd0', hair:'#f2f6ff' },
    { skin:'#8f9a78', skin2:'#55603f', shirt:'#e8641b', pants:'#1e2a44', hair:'#1c1a18' }, { skin:'#a39a8a', skin2:'#5e5346', shirt:'#1b2542', pants:'#10131c', hair:'#1a1410' }, { skin:'#c9c3b4', skin2:'#6a6258', shirt:'#2a2530', pants:'#1a1720', hair:'#3a3128' } ];   /* 4 = wraith, 5 = mta, 6 = nypd, 7 = conductor */
  var ZGEO = null, ZTEX = null;
  function zgeo(){ if(ZGEO) return ZGEO; var THREE = window.THREE, pts = [], prof = [[0, .155], [.08, .165], [.2, .15], [.34, .17], [.46, .21], [.56, .225], [.62, .2], [.66, .09]];
    prof.forEach(function(q){ pts.push(new THREE.Vector2(q[1], q[0])); }); var torso = new THREE.LatheGeometry(pts, 12); torso.scale(1, 1, .62);
    ZGEO = { torso:torso, neck:new THREE.CylinderGeometry(.045, .06, .1, 8), head:new THREE.SphereGeometry(.125, 14, 12), jaw:new THREE.SphereGeometry(.06, 10, 8), hair:new THREE.SphereGeometry(.132, 12, 7, 0, Math.PI*2, 0, 1.25),
      eye:new THREE.SphereGeometry(.018, 6, 6), uarm:new THREE.CapsuleGeometry(.052, .26, 3, 8), farm:new THREE.CapsuleGeometry(.042, .25, 3, 8), hand:new THREE.SphereGeometry(.05, 8, 6), thigh:new THREE.CapsuleGeometry(.078, .38, 3, 9), shin:new THREE.CapsuleGeometry(.06, .37, 3, 8), foot:new THREE.BoxGeometry(.1, .06, .21) };
    ZGEO.head.scale(1, 1.12, 1.04); ZGEO.jaw.scale(1.1, .7, 1); ZGEO.hand.scale(.9, .6, 1.2); return ZGEO; }
  function ztex(){ if(ZTEX) return ZTEX; var THREE = window.THREE; ZTEX = PALS.map(function(pal, i){ var wraith = i === 4, uniform = i > 4, mk2 = function(fn){ var c = mk(64, 64), x = c.getContext('2d'); fn(x, 64, 64); var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
      return { skin:mk2(function(x, w, h){ x.fillStyle = pal.skin; x.fillRect(0, 0, w, h); for(var k = 0; k < 140; k++){ x.fillStyle = 'rgba(0,0,0,'+(.04 + srand()*.12)+')'; var r = 1 + srand()*5; x.beginPath(); x.arc(srand()*w, srand()*h, r, 0, 7); x.fill(); } x.strokeStyle = pal.skin2; x.lineWidth = 1; for(var v = 0; v < 9; v++){ x.beginPath(); var vx = srand()*w, vy = srand()*h; x.moveTo(vx, vy); for(var q = 0; q < 4; q++){ vx += srand()*14 - 7; vy += srand()*14 - 7; x.lineTo(vx, vy); } x.globalAlpha = .55; x.stroke(); x.globalAlpha = 1; } if(!wraith && !uniform) for(var wnd = 0; wnd < 3; wnd++){ x.fillStyle = '#3a0a0a'; x.beginPath(); x.ellipse(srand()*w, srand()*h, 2 + srand()*3, 1 + srand()*2, srand()*3, 0, 7); x.fill(); } grain(x, w, h, .22, 500); }),
        cloth:mk2(function(x, w, h){ x.fillStyle = pal.shirt; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; for(var k = 0; k < 64; k += 4) x.fillRect(k, 0, 1, h); for(var k2 = 0; k2 < 40; k2++){ x.fillStyle = 'rgba(30,20,10,'+(.08 + srand()*.25)+')'; x.fillRect(srand()*w, srand()*h, 2 + srand()*10, 2 + srand()*6); } if(!wraith && !uniform){ for(var b = 0; b < 4; b++){ x.fillStyle = 'rgba(70,6,6,'+(.5 + srand()*.4)+')'; x.beginPath(); x.ellipse(srand()*w, srand()*h, 3 + srand()*7, 2 + srand()*5, srand()*3, 0, 7); x.fill(); } } grain(x, w, h, .18, 400); }),
        pants:mk2(function(x, w, h){ x.fillStyle = pal.pants; x.fillRect(0, 0, w, h); for(var k = 0; k < 50; k++){ x.fillStyle = 'rgba('+(srand() < .5 ? '0,0,0' : '90,80,60')+','+(.08 + srand()*.2)+')'; x.fillRect(srand()*w, srand()*h, 1 + srand()*8, 1 + srand()*8); } grain(x, w, h, .2, 400); }) }; }); return ZTEX; }
  /* the wraith proper: the Blender model (blender/wraith.py) when it has arrived. Its named nodes stand in for the capsule zombie's joints so
     animZombie needs no special case: ShoulderL/R and ElbowL/R are the arms (rest pose hangs down and forward, the same convention as the
     capsule arms), Neck tilts the hood, Body is the torso. It has no legs or jaw, so those get inert stand-ins. One clone per wraith, own materials. */
  function makeWraith(){
    var THREE = window.THREE, g = MODELS.wraith.clone(), P = {}, mats = [], byName = {}, seen = {};
    g.traverse(function(o){ byName[o.name] = o; if(o.isMesh){ var m = o.material, k = m.name || m.uuid; if(!seen[k]){ seen[k] = m.clone(); seen[k].name = m.name; seen[k].userData.fixed = m.userData.fixed; mats.push(seen[k]); } o.material = seen[k]; } });
    var dummy = function(){ var d = new THREE.Group(); d.knee = new THREE.Group(); d.add(d.knee); return d; };
    P.torso = byName.Body || g; P.headP = byName.Neck || dummy(); P.jaw = dummy(); P.headP.add(P.jaw);
    P.armL = byName.ShoulderL || dummy(); P.armL.elbow = byName.ElbowL || dummy(); P.armR = byName.ShoulderR || dummy(); P.armR.elbow = byName.ElbowR || dummy();
    P.legL = dummy(); P.legR = dummy();
    mats.sort(function(a, b){ return (a.userData.fixed ? 1 : 0) - (b.userData.fixed ? 1 : 0); });   /* the flash loop skips index 4 and anything marked fixed (void, eyes) */
    var s = 1.0, body = new THREE.Group(); body.add(g);
    return { grp:body, inner:g, P:P, mats:mats, s:s, r:.34, h:2.05, headY:1.78, lop:.1, tilt:.12, hunch:.04, glb:true };
  }
  var KIND_V = { walker:null, runner:null, brute:3, wraith:4, mta:5, nypd:6, conductor:7 };
  /* the Blender humanoid, dressed for its kind. Its joints sit where the capsule body's do (ShoulderL at x -.245 y 1.47, HipL at x -.1 y .9, the
     Neck at 1.56 with the Jaw hung under the Head), so animZombie drives both rigs with the same code. Accessory nodes are toggled, the cloth
     materials get the canvas textures and the palette's colours, and the Conductor carries a lit lantern. */
  function makeHuman(v, kind){
    var THREE = window.THREE, TX = ztex()[v], pal = PALS[v], g = cloneNode(MODELS.zombie, 'Root'), P = {}, by = {}, brute = kind === 'brute', cond = kind === 'conductor';
    g.traverse(function(o){ by[o.name] = o; });
    var show = function(names, on){ names.forEach(function(n){ if(by[n]) by[n].visible = on; }); };
    show(['HardHat', 'Cap', 'Vest', 'Badge', 'Belt', 'Coat', 'Lantern', 'Hair'], false);
    if(kind === 'mta') show(['Vest', 'HardHat', 'Belt'], true); else if(kind === 'nypd') show(['Cap', 'Badge', 'Belt'], true); else if(cond) show(['Coat', 'Cap', 'Lantern', 'Belt'], true); else if(Math.random() < .72) show(['Hair'], true);
    var mats = g.userData.mats; mats.forEach(function(m){ var n = m.name;
      if(n === 'Skin'){ m.map = TX.skin; m.color.set(0xffffff); } else if(n === 'Shirt'){ m.map = TX.cloth; m.color.set(0xffffff); } else if(n === 'Pants'){ m.map = TX.pants; m.color.set(0xffffff); } else if(n === 'Hair'){ m.color.set(pal.hair); }
      else if(n === 'Coat'){ m.color.set(0x1c1f2e); } else if(n === 'Cap'){ m.color.set(cond ? 0x1c1f2e : 0x161c33); } else if(n === 'Eyes'){ m.emissive.setHex(cond ? 0xffb050 : 0xff2a2a); m.emissiveIntensity = cond ? 4 : 3; }
      m.needsUpdate = true; });
    mats.sort(function(a, b){ return (a.userData.fixed ? 1 : 0) - (b.userData.fixed ? 1 : 0); });
    P.torso = by.Torso || g; P.headP = by.Neck; P.jaw = by.Jaw; P.armL = by.ShoulderL; P.armL.elbow = by.ElbowL; P.armR = by.ShoulderR; P.armR.elbow = by.ElbowR; P.legL = by.HipL; P.legL.knee = by.KneeL; P.legR = by.HipR; P.legR.knee = by.KneeR;
    var light = null; if(cond && by.Lantern){ light = new THREE.PointLight(0xffb050, 1.6, 9, 1); light.position.set(0, -.05, .05); by.Lantern.add(light); }
    var s = brute ? 1.28 : cond ? 1.12 : kind === 'runner' ? .96 : .94 + Math.random()*.12; g.scale.set(s*(brute ? 1.18 : 1), s, s*(brute ? 1.1 : 1));
    var body = new THREE.Group(); body.add(g);
    return { grp:body, inner:g, P:P, mats:mats, s:s, r:(brute ? .48 : .34)*s, h:1.9*s, headY:1.5*s, lop:cond ? .05 : Math.random()*.25, tilt:(Math.random() < .5 ? -1 : 1)*(.08 + Math.random()*.14), hunch:cond ? .04 : .12 + Math.random()*.16, glb:true, human:true, light:light, kind:kind };
  }
  function makeZombie(v, brute, kind){
    kind = kind || (v === 4 ? 'wraith' : brute ? 'brute' : 'walker'); if(KIND_V[kind] !== null && KIND_V[kind] !== undefined) v = KIND_V[kind]; brute = kind === 'brute';
    if(kind === 'wraith' && MODELS.wraith) return makeWraith();
    if(kind !== 'wraith' && MODELS.zombie) return makeHuman(v, kind);
    if(v > 4) v = 3;
    var THREE = window.THREE, Z = zgeo(), TX = ztex()[v], pal = PALS[v], wraith = v === 4, std = function(hex, map){ var m = new THREE.MeshStandardMaterial({ color:map ? 0xffffff : hex, map:map || null, roughness:.92 }); if(wraith){ m.transparent = true; m.opacity = .62; m.emissive = new THREE.Color(0x8fa8ff); m.emissiveIntensity = .35; } return m; };
    var mats = { skin:std(pal.skin, TX.skin), shirt:std(pal.shirt, TX.cloth), pants:std(pal.pants, TX.pants), hair:std(pal.hair) }, eyeM = new THREE.MeshStandardMaterial({ color:0xff2020, emissive:0xff2a2a, emissiveIntensity:3 }); eyeM.userData.fixed = true;
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
    return { grp:body, inner:g, P:P, mats:[mats.skin, mats.shirt, mats.pants, mats.hair, eyeM], s:s, r:(brute ? .48 : .34)*s, h:1.9*s, headY:1.5*s, lop:Math.random()*.25, tilt:(Math.random() < .5 ? -1 : 1)*(.08 + Math.random()*.14), hunch:.12 + Math.random()*.16, kind:kind };
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
    var em = z.flash > 0 ? .9 : 0; if(em !== z.emLast){ z.emLast = em; m.mats.forEach(function(mt){ if(mt.userData.fixed) return; if(z.wraith) mt.emissiveIntensity = .35 + em; else { mt.emissive.setHex(em ? 0xffffff : 0); mt.emissiveIntensity = em; } }); }
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
  /* the viewmodel. The Blender gun (blender/guns.py: a node per weapon id in gun space, +X forward, +Y up, +Z right, metres) with the two
     hands: ArmR on the GripR empty, ArmL on GripL, the forearms trailing back toward the camera. Forged guns show their Glow strips and carry an
     ember light. Fallback: the old box guns, so the game plays before the model arrives. opts.bare = no hands (the box display, the wall hooks). */
  function makeGun(id, up, opts){
    var THREE = window.THREE, A = assets(), geos = [], mats = [], g = new THREE.Group(), mz = null, grip = null, spin = null, glb = false;
    var src = MODELS.guns && MODELS.guns.getObjectByName(id);
    if(src){ glb = true; var body = cloneNode(MODELS.guns, id); mats = mats.concat(body.userData.mats);
      body.traverse(function(o){ var n = o.name; if(n.indexOf('Glow') === 0) o.visible = !!up; else if(n.indexOf('Muzzle') === 0) mz = o.position.clone(); else if(n.indexOf('GripR') === 0) grip = o.position.clone(); else if(n === 'Spin') spin = o; });
      g.add(body); mz = mz || new THREE.Vector3(.4, .05, 0); grip = grip || new THREE.Vector3(0, -.05, 0);
      if(!(opts && opts.bare)){ var gl = body.getObjectByName('GripL') || null; body.children.forEach(function(o){ if(o.name.indexOf('GripL') === 0) gl = o; });
        var armR = cloneNode(MODELS.guns, 'ArmR'), armL = cloneNode(MODELS.guns, 'ArmL'); mats = mats.concat(armR.userData.mats, armL.userData.mats);
        armR.position.copy(grip); armR.rotation.set(0, .04, .1); g.add(armR);   /* the arm is modelled already trailing back, down and out; these only settle it */
        if(gl){ var two = Math.abs(gl.position.x - grip.x) < .06; armL.position.set(gl.position.x - (two ? .01 : 0), gl.position.y - (two ? .022 : 0), -Math.abs(gl.position.z) - .014); armL.rotation.set(0, -.16, .12); g.add(armL); } } }   /* the left hand is always on the gun's left; on a pistol it cups under the right */
    else {
      var GM = gunMats(), d = GUN_DEF[id] || GUN_DEF.sidearm;
      d.parts.forEach(function(p){ var geo = new THREE.BoxGeometry(p[3]*.01, p[4]*.01, p[5]*.01), m = new THREE.Mesh(geo, GM[p[6]]); m.position.set(p[0]*.01, p[1]*.01, p[2]*.01); g.add(m); geos.push(geo); });
      (d.rings || []).forEach(function(r){ var geo = new THREE.TorusGeometry(.04, .009, 8, 18), m = new THREE.Mesh(geo, up ? GM.glow : GM.violet); m.position.set(r[0]*.01, r[1]*.01, r[2]*.01); m.rotation.y = Math.PI/2; g.add(m); geos.push(geo); });
      if(up){ d.stripe.forEach(function(s){ var geo = new THREE.BoxGeometry(s[3]*.01, s[4]*.01, s[5]*.01), m = new THREE.Mesh(geo, GM.orange); m.position.set(s[0]*.01, s[1]*.01, s[2]*.01); g.add(m); geos.push(geo); }); }
      else if(id !== 'prism'){ var geo2 = new THREE.BoxGeometry(d.stripe[0][3]*.01*.5, .004, d.stripe[0][5]*.01), m2 = new THREE.Mesh(geo2, GM.teal); m2.position.set(d.stripe[0][0]*.01, d.stripe[0][1]*.01 - .01, 0); g.add(m2); geos.push(geo2); }
      mz = new THREE.Vector3(d.mz[0]*.01, d.mz[1]*.01, d.mz[2]*.01); grip = new THREE.Vector3(d.grip[0]*.01, d.grip[1]*.01, d.grip[2]*.01); }
    if(up){ var L = new THREE.PointLight(0xff8a00, .5, 1.5, 1); L.position.set(.1, .06, 0); g.add(L); }
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), A.mat.flash); fl.position.set(mz.x + .1, mz.y, mz.z); fl.rotation.y = Math.PI/2; fl.visible = false; g.add(fl); geos.push(fl.geometry);
    var fl2 = fl.clone(); fl2.rotation.set(0, 0, Math.PI/4); fl2.position.set(mz.x + .16, mz.y, mz.z); fl2.visible = false; g.add(fl2);
    var ML = new THREE.PointLight(0xffb060, 0, 6, 1); ML.position.copy(mz); g.add(ML);
    return { grp:g, mz:mz, grip:grip, spin:spin, flash:[fl, fl2], light:ML, glb:glb, dispose:function(){ geos.forEach(function(q){ q.dispose(); }); mats.forEach(function(m){ m.dispose(); }); } };
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
/* tigOS arcade, Nightshift part 04: sound. A WebAudio synth with a generated reverb so the station echoes. Every gun is layered (a transient
   click, a body, a tail and the mechanism), casings tink on the tile, footsteps vary, the dead groan through formant filters with breath in them,
   the fluorescents hum, the tunnel drips, and the train is a brown-noise rumble with wheel clack, a brake squeal, a horn, the door chime and a PA
   that nobody can make out. The box has a music box in it, the Forge a hammer, the vendors a bottle. Dying gets its own drone. No audio files. */
  function Synth(){
    var ac = null, muted = false, master, dry, verb, wet, hum, humG, rumble, rumbleG, rumbleF, squeal, squealG, clackT = 0, spinO, spinG, spinF, boxT = 0;
    function ctx(){ if(ac || muted) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5*SET.vol; var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; master.connect(comp); comp.connect(ac.destination);
        dry = ac.createGain(); dry.gain.value = 1; dry.connect(master); verb = ac.createConvolver(); verb.buffer = impulse(2.1, 2.2); wet = ac.createGain(); wet.gain.value = .3; verb.connect(wet); wet.connect(master); } catch(e){ ac = null; } return ac; }
    function impulse(dur, decay){ var n = ac.sampleRate*dur | 0, b = ac.createBuffer(2, n, ac.sampleRate); for(var c = 0; c < 2; c++){ var d = b.getChannelData(c); for(var i = 0; i < n; i++){ var k = i/n; d[i] = (Math.random()*2 - 1)*Math.pow(1 - k, decay)*(i < 2000 ? i/2000 : 1); } } return b; }
    function out(node, send){ node.connect(dry); if(send){ var g = ac.createGain(); g.gain.value = send; node.connect(g); g.connect(verb); } }
    function noise(dur, freq, gain, q, send, type, delay, curve){ var a = ctx(); if(!a) return; var n = a.sampleRate*dur | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, curve || 2); var s = a.createBufferSource(); s.buffer = b; var f = a.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1; var g = a.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); out(g, send); s.start(a.currentTime + (delay || 0)); }
    function tone(type, f0, f1, dur, gain, send, delay, attack){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); if(attack){ g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); } else g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); out(g, send); o.start(t0); o.stop(t0 + dur + .02); }
    function formant(f0, f1, dur, gain, band, q, vib, delay){ var a = ctx(); if(!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(), l = a.createOscillator(), lg = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f1, t0 + dur); l.frequency.value = vib || 6; lg.gain.value = f0*.06; l.connect(lg); lg.connect(o.frequency); f.type = 'bandpass'; f.frequency.setValueAtTime(band, t0); f.frequency.linearRampToValueAtTime(band*.6, t0 + dur); f.Q.value = q || 3; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + dur*.25); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(f); f.connect(g); out(g, .5); o.start(t0); l.start(t0); o.stop(t0 + dur + .02); l.stop(t0 + dur + .02); }
    function casing(delay){ var d = (delay || .3) + Math.random()*.3; tone('sine', 3200 + Math.random()*1200, 2400, .05, .05, .3, d); tone('sine', 4200, 3000, .04, .03, .3, d + .09 + Math.random()*.05); }
    /* every gun: a transient (the crack), a body (the boom), a tail (the room) and its mechanism (bolt, slide, cylinder) */
    function shot(k){
      if(k === 'doorman'){ noise(.02, 6000, 1.2, .5, 0, 'highpass'); noise(.42, 700, 1.3, .6, .8); tone('sine', 140, 38, .34, .75, .5); tone('triangle', 90, 30, .42, .4, .4); noise(.06, 2200, .25, 1, .3, 'bandpass', .55); noise(.05, 1800, .2, 1, .3, 'bandpass', .68); }   /* the pump */
      else if(k === 'longbow'){ noise(.015, 7000, 1, .5, 0, 'highpass'); noise(.34, 1800, .9, .8, .9); tone('sine', 220, 45, .32, .6, .6); tone('square', 60, 30, .2, .15, .5); tone('square', 900, 700, .04, .08, .3, .42); tone('square', 600, 800, .04, .08, .3, .58); }   /* the bolt */
      else if(k === 'reaper'){ noise(.012, 6500, 1.1, .5, 0, 'highpass'); noise(.3, 1100, 1.0, .7, .9); tone('sine', 190, 42, .3, .7, .6); tone('sine', 2400, 1800, .16, .08, .8, .02); tone('square', 1300, 1100, .03, .06, .4, .3); }   /* a big revolver: a ring after the boom */
      else if(k === 'anvil'){ noise(.012, 5000, .8, .5, 0, 'highpass'); noise(.14, 1500, .65, 1, .5); tone('sine', 160, 60, .1, .45, .3); }
      else if(k === 'wasp'){ noise(.008, 7000, .7, .5, 0, 'highpass'); noise(.07, 2800, .4, 1, .5); tone('sine', 320, 110, .06, .25, .3); }
      else if(k === 'vulcan'){ noise(.006, 6000, .6, .5, 0, 'highpass'); noise(.05, 2000, .5, 1, .4); tone('sine', 200, 90, .05, .3, .3); }
      else if(k === 'harpoon'){ noise(.05, 900, 1.2, .7, .4); tone('sine', 110, 40, .25, .6, .5); noise(.3, 3500, .35, 3, .6, 'bandpass', .03, 1); tone('sawtooth', 700, 120, .22, .08, .5, .04); }   /* a pneumatic thump and the cable whipping out */
      else if(k === 'thunder'){ noise(.015, 8000, 1.2, .5, 0, 'highpass'); tone('sawtooth', 1800, 60, .18, .35, .8); noise(.9, 260, 1.1, .4, 1, 'lowpass', .05, 1.4); tone('sine', 70, 28, .8, .6, .9, .06); tone('square', 3200, 200, .1, .06, .6); }   /* electric crack, then the roll */
      else if(k === 'raygun'){ tone('sine', 2200, 180, .28, .3, .7); tone('sine', 3300, 260, .22, .14, .7, .01); tone('sawtooth', 500, 90, .3, .1, .5); tone('square', 90, 70, .18, .1, .4); }
      else if(k === 'prism'){ tone('sawtooth', 900, 200, .25, .3, .6); tone('square', 1400, 300, .18, .12, .4); tone('sine', 3000, 600, .12, .08, .5); }
      else if(k === 'stitcher'){ noise(.01, 6000, .85, .5, 0, 'highpass'); noise(.11, 2400, .5, 1, .6); tone('sine', 260, 80, .09, .32, .4); }
      else { noise(.012, 6000, .9, .5, 0, 'highpass'); noise(.13, 2200, .6, 1, .6); tone('sine', 230, 70, .11, .38, .4); tone('square', 1500, 1000, .025, .05, .2, .08); }   /* the sidearm's slide */
      if(k !== 'prism' && k !== 'raygun' && k !== 'thunder' && k !== 'harpoon') casing(k === 'vulcan' || k === 'wasp' ? .12 : .3);
    }
    function ensureLoops(){ var a = ctx(); if(!a || hum) return;
      hum = a.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 120; var hf = a.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 400; humG = a.createGain(); humG.gain.value = .012; hum.connect(hf); hf.connect(humG); humG.connect(master); hum.start();
      var n = a.sampleRate*2 | 0, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), last = 0; for(var i = 0; i < n; i++){ last = (last + (Math.random()*2 - 1)*.02)*.995; d[i] = last*8; }   /* brown noise */
      rumble = a.createBufferSource(); rumble.buffer = b; rumble.loop = true; rumbleF = a.createBiquadFilter(); rumbleF.type = 'lowpass'; rumbleF.frequency.value = 80; rumbleG = a.createGain(); rumbleG.gain.value = 0; rumble.connect(rumbleF); rumbleF.connect(rumbleG); rumbleG.connect(master); rumbleG.connect(verb); rumble.start();
      squeal = a.createOscillator(); squeal.type = 'sine'; squeal.frequency.value = 2800; squealG = a.createGain(); squealG.gain.value = 0; var sv = a.createOscillator(), svg = a.createGain(); sv.frequency.value = 9; svg.gain.value = 60; sv.connect(svg); svg.connect(squeal.frequency); squeal.connect(squealG); squealG.connect(master); squealG.connect(verb); squeal.start(); sv.start();
      spinO = a.createOscillator(); spinO.type = 'sawtooth'; spinO.frequency.value = 80; spinF = a.createBiquadFilter(); spinF.type = 'bandpass'; spinF.Q.value = 6; spinF.frequency.value = 400; spinG = a.createGain(); spinG.gain.value = 0; spinO.connect(spinF); spinF.connect(spinG); spinG.connect(master); spinO.start(); }
    return {
      toggle:function(){ muted = !muted; if(muted && ac){ try { ac.suspend(); } catch(e){} } else if(ac){ try { ac.resume(); } catch(e){} } return muted; }, isMuted:function(){ return muted; },
      volume:function(v){ if(master) master.gain.value = .5*v; },
      ambient:function(on){ ensureLoops(); if(humG) humG.gain.value = on ? .012 : 0; },
      /* the train: rumble pitched to its speed, wheel clack on the joints, squeal on the brakes; riding inside it is all body and less air */
      train:function(speed, braking, inside){ ensureLoops(); if(!rumbleG) return; var s = clamp(speed/16, 0, 1), on = speed > 0 ? 1 : 0; rumbleG.gain.value = Math.min(.95, s*(inside ? 1.4 : 1.1))*on; rumbleF.frequency.value = (inside ? 40 : 60) + s*(inside ? 140 : 260); squealG.gain.value = braking && speed > 2 ? Math.min(.09, s*.14) : 0; if(squeal) squeal.frequency.value = 2400 + s*900;
        if(speed > 3){ clackT -= s*.06; if(clackT <= 0){ clackT = 1; noise(.03, inside ? 300 : 900, Math.min(.5, s*.5)*(inside ? 1.2 : 1), 1, .2); noise(.03, 700, Math.min(.3, s*.3), 1, .2, 'lowpass', .07); } } },
      horn:function(){ tone('sawtooth', 311, 305, 1.1, .16, .9); tone('sawtooth', 370, 366, 1.1, .12, .9); tone('square', 155, 152, 1.1, .06, .9); },
      brake:function(){ noise(.6, 3200, .25, 8, .8, 'bandpass', 0, 1); tone('sine', 3100, 2500, .55, .06, .8); noise(.25, 200, .6, 1, .5, 'lowpass', .5); },
      chime:function(){ [[659, 0], [523, .32]].forEach(function(p){ tone('sine', p[0], p[0], .6, .16, .8, p[1]); tone('sine', p[0]*2, p[0]*2, .35, .04, .8, p[1]); tone('triangle', p[0]*3, p[0]*3, .2, .02, .6, p[1]); }); },   /* the ding-dong before the doors move */
      announce:function(){ var a = ctx(); if(!a) return; for(var i = 0; i < 7; i++){ var f0 = 180 + Math.random()*120, dur = .09 + Math.random()*.12; formant(f0, f0*(.85 + Math.random()*.3), dur, .06, 900 + Math.random()*900, 5, 4, .7 + i*.16 + Math.random()*.05); } noise(1.9, 2400, .05, 1, .4, 'bandpass', .6, 1); },   /* a PA that says something about the next stop */
      shot:shot, empty:function(){ tone('square', 1200, 900, .05, .08); tone('square', 600, 500, .03, .05, 0, .06); }, laser:function(){ tone('sawtooth', 1700, 240, .16, .2, .5); tone('square', 2600, 520, .09, .06, .4); }, tick:function(){ tone('square', 1100, 900, .035, .07); },
      spin:function(level){ ensureLoops(); if(!spinG) return; spinG.gain.value = level > 0 ? .025 + level*.03 : 0; spinO.frequency.value = 60 + level*260; spinF.frequency.value = 300 + level*1400; },
      reload:function(){ tone('square', 700, 500, .05, .09, .3); noise(.06, 3000, .25, 1, .3, 'bandpass', .05); tone('square', 500, 900, .05, .09, .3, .34); noise(.05, 4000, .3, 1, .3, 'bandpass', .5); },
      swap:function(){ noise(.08, 2500, .3, 1, .3, 'bandpass'); tone('square', 400, 600, .05, .06, .3, .1); },
      step:function(pit){ var v = .8 + Math.random()*.4; if(pit){ noise(.09, 700*v, .2, 1, .3); noise(.05, 1800, .08, 2, .2, 'bandpass', .02); } else { noise(.06, 1500*v, .13, 1, .35, 'bandpass'); tone('sine', 120*v, 60, .05, .05, .2); } },
      hit:function(){ noise(.08, 900, .5, 1, .2); tone('sine', 700, 500, .05, .12); }, kill:function(){ noise(.16, 600, .7, 1, .4); tone('sawtooth', 300, 80, .18, .18, .4); noise(.12, 400, .3, 1, .3, 'lowpass', .05); },
      ricochet:function(){ tone('sine', 3400 + Math.random()*1800, 900, .12, .08, .7); noise(.03, 5000, .4, 1, .3, 'highpass'); },
      hurt:function(){ noise(.25, 500, .8, 1, .3); tone('sawtooth', 120, 60, .3, .4, .3); tone('sine', 55, 40, .3, .3, .2); },
      /* the dead: a formant groan with breath under it; near ones are louder and wetter */
      growl:function(near){ var f = 60 + Math.random()*50; formant(f, f*.8, .7 + Math.random()*.7, near ? .22 : .11, 350 + Math.random()*500, 4, 5 + Math.random()*4); noise(.5 + Math.random()*.4, 900 + Math.random()*600, near ? .07 : .035, 1.5, .4, 'bandpass', .1, 1); if(near && Math.random() < .4) formant(f*1.6, f*1.1, .3, .1, 1100, 5, 8, .5); },
      shriek:function(){ formant(400 + Math.random()*200, 180, 1.4, .14, 1500, 6, 9); noise(.6, 2500, .08, 2, .6, 'bandpass', .2, 1); },
      buy:function(){ tone('sine', 660, 990, .12, .2, .4); tone('sine', 990, 1320, .15, .2, .4, .11); }, deny:function(){ tone('square', 200, 150, .18, .15, .2); },
      gate:function(){ for(var i = 0; i < 14; i++){ noise(.03, 2200 + Math.random()*1500, .25, 3, .5, 'bandpass', i*.055 + Math.random()*.02); } noise(1.0, 500, .45, .6, .7, 'lowpass', .05, 1); tone('square', 70, 55, .9, .08, .5); tone('sine', 900, 700, .2, .1, .6, .95); },   /* chain over a drum, then the latch */
      wave:function(){ tone('sawtooth', 80, 40, 1.4, .4, .9); tone('sine', 55, 30, 1.6, .5, .9); }, wraith:function(){ tone('sine', 520, 180, 2.2, .18, .9); tone('sawtooth', 260, 70, 2.6, .12, .9); noise(2.4, 300, .35, .3, .9); tone('sine', 700, 210, 1.6, .12, .9, .5); },
      power:function(){ noise(.12, 400, 1.2, 1, .5); tone('sine', 80, 30, .5, .8, .6); tone('sawtooth', 60, 480, 1.4, .22, .7, .15); noise(1.2, 3000, .18, 4, .7, 'bandpass', .3, 1); tone('sine', 120, 120, 1.6, .1, .5, 1.0, .6); for(var i = 0; i < 5; i++) noise(.04, 1800, .3, 2, .5, 'bandpass', .9 + i*.22); },   /* the thunk, the surge, the tubes coming on one by one */
      boom:function(){ noise(.7, 400, 1.4, .3, 1); tone('sine', 90, 25, .7, .9, .8); noise(.02, 8000, 1, .5, 0, 'highpass'); },
      pickup:function(){ tone('sine', 880, 1760, .25, .2, .5); tone('sine', 1320, 2640, .3, .15, .5, .1); }, drip:function(){ tone('sine', 1800 + Math.random()*900, 900, .09, .05, .9); },
      /* the box: a music box while it decides, a low hit when the lid closes */
      box:function(){ var notes = [523, 659, 784, 1047, 784, 659, 523, 392, 523, 659, 784, 1047], a = ctx(); if(!a) return; notes.forEach(function(f, i){ tone('sine', f, f, .32, .09, .7, .15 + i*.26); tone('triangle', f*2, f*2, .18, .02, .7, .15 + i*.26); }); tone('sine', 60, 40, .5, .3, .6, 3.3); },
      bear:function(){ [900, 1100, 1300, 1100, 900].forEach(function(f, i){ tone('sine', f, f*.95, .16, .1, .8, i*.11); tone('sine', f*1.01, f*.9, .16, .06, .8, i*.11); }); tone('sawtooth', 120, 30, 1.6, .25, .9, .6); noise(1.4, 200, .4, .5, .9, 'lowpass', .6, 1); },   /* a giggle, then the box goes */
      forge:function(){ noise(.5, 600, .5, 1, .6, 'lowpass', 0, 1); tone('sawtooth', 60, 200, .6, .2, .5); noise(.06, 500, 1.4, 1, .8, 'lowpass', .85); tone('sine', 90, 30, .5, .9, .7, .85); tone('sine', 1400, 900, .5, .1, .8, .86); noise(1.0, 4000, .25, 1, .7, 'highpass', 1.1, 1); tone('sawtooth', 200, 60, .5, .12, .5, 2.0); },   /* hydraulics, the hammer, white heat, the tray */
      vendor:function(){ noise(.05, 900, .8, 1, .4); tone('sine', 220, 60, .18, .3, .4); noise(.06, 1200, .5, 1, .4, 'lowpass', .35); tone('square', 1800, 1200, .03, .08, .4, .6); noise(.9, 5000, .12, 1, .5, 'highpass', .65, 1); tone('sine', 1200, 1800, .12, .08, .5, .7); },   /* the drop, the cap, the fizz */
      /* dying: a drone that goes on under the card, a heartbeat, and the sting when the shift is read back */
      death:function(){ tone('sawtooth', 55, 38, 4.5, .22, .9, 0, .6); tone('sawtooth', 55.7, 39, 4.5, .18, .9, 0, .6); noise(4, 220, .3, .4, .9, 'lowpass', .2, 1); [0, .9, 1.8, 2.8].forEach(function(d){ tone('sine', 60, 35, .22, .5, .4, d); tone('sine', 50, 30, .2, .3, .4, d + .24); }); formant(110, 60, 2.6, .07, 500, 4, 3, .8); },
      endSting:function(){ [110, 116.5, 164.8, 220].forEach(function(f, i){ tone('sawtooth', f, f*.985, 3.2, .06, 1, i*.05, .8); }); tone('sine', 41, 30, 3.6, .3, .9, 0, .4); noise(2.4, 300, .12, .4, 1, 'lowpass', 0, 1); },
      close:function(){ if(ac){ try { ac.close(); } catch(e){} ac = null; hum = null; } } };
  }
/* tigOS arcade, Nightshift part 05: the rules. Waves, points, the economy (grates, wall buys, resupply, the box, perks, power, the Forge),
   the dead and how they move, the guns and how they hit, grenades, the train. nightshift(api) opens here and closes in part 06. */
  var BOX_T = 3.4;   /* seconds the mystery box spins before it hands over a gun */
  /* the guns. cost/wall: what hangs on a station wall; box:true means the box can hand it out (weight biases the roll, rarities are the
     wonder weapons). The Forge (part 05's forge prompt) doubles the damage and stamps the forged name on it. */
  var WEAPONS = {
    sidearm:  { name:'Sidearm',  up:'Mustang',    dmg:60,  rpm:420, mag:8,   res:64,  reload:1.2, spread:.012, auto:false, cost:0,    box:false },
    wasp:     { name:'Wasp',     up:'Hornet',     dmg:34,  rpm:1020,mag:40,  res:240, reload:1.6, spread:.042, auto:true,  cost:1000, box:true },
    stitcher: { name:'Stitcher', up:'Seamripper', dmg:45,  rpm:780, mag:32,  res:192, reload:1.8, spread:.03,  auto:true,  cost:1200, box:true },
    reaper:   { name:'Reaper',   up:'Undertaker', dmg:180, rpm:150, mag:6,   res:48,  reload:2.4, spread:.014, auto:false, cost:1400, box:true, pierce:2 },
    doorman:  { name:'Doorman',  up:'Bouncer',    dmg:38,  rpm:95,  mag:6,   res:36,  reload:2.6, spread:.085, auto:false, cost:1500, box:true, pellets:8, range:9 },
    longbow:  { name:'Longbow',  up:'Skyhook',    dmg:420, rpm:60,  mag:5,   res:40,  reload:2.2, spread:0,    auto:false, cost:1800, box:true, pierce:3 },
    anvil:    { name:'Anvil',    up:'Hammerfall', dmg:66,  rpm:600, mag:100, res:300, reload:4.4, spread:.045, auto:true,  cost:2000, box:true },
    vulcan:   { name:'Vulcan',   up:'Volcano',    dmg:58,  rpm:1100,mag:150, res:450, reload:5.2, spread:.05,  auto:true,  cost:0,    box:true, weight:1.1, spin:.5 },
    harpoon:  { name:'Harpoon',  up:'Leviathan',  dmg:700, rpm:48,  mag:4,   res:28,  reload:2.8, spread:0,    auto:false, cost:0,    box:true, weight:1, pierce:6 },
    thunder:  { name:'Thunder',  up:'Tempest',    dmg:520, rpm:70,  mag:2,   res:20,  reload:3.2, spread:.02,  auto:false, cost:0,    box:true, weight:.9, splash:2.6, knock:8 },
    prism:    { name:'Prism',    up:'Spectrum',   dmg:900, rpm:170, mag:20,  res:80,  reload:2.8, spread:.005, auto:false, cost:0,    box:true, weight:.7, splash:1.4 },
    raygun:   { name:'Ray Gun',  up:'Porter\u2019s X2', dmg:1400, rpm:160, mag:20, res:120, reload:2.6, spread:.006, auto:false, cost:0, box:true, weight:.3, splash:2.4, ray:true }
  };
  var PERKS = { ironhide:{ name:'Ironhide', cost:2500, col:'#ff5f57', blurb:'250 health' }, quickhands:{ name:'Quickhands', cost:3000, col:'#63e6be', blurb:'reload twice as fast' }, fleetfoot:{ name:'Fleetfoot', cost:2000, col:'#8cc7ff', blurb:'faster sprint and regen' }, doubletap:{ name:'Doubletap', cost:2000, col:'#ffd166', blurb:'fire rate +35%, damage +60%' }, deadshot:{ name:'Deadshot', cost:1500, col:'#c084fc', blurb:'headshots hit far harder' } };
  var PU_DEF = { ammo:{ col:'#63e6be', label:'MAX AMMO' }, '2x':{ col:'#ffd166', label:'2X POINTS' }, insta:{ col:'#ff5f57', label:'INSTA-KILL' }, nuke:{ col:'#a7ffb0', label:'NUKE' } };
  var EYE = 1.6;

  function nightshift(api){
    var THREE = window.THREE, A = assets(), M = A.mat; loadModels();
    var g = {}, snd = Synth(), touch = api.touch, flow = new Int16Array(MW*MH), flowKey = '';
    var special, fogK, P, zombies, pickups, grenades, wave, toSpawn, brutes, spawnT, alive, kills, points, total, hp, maxhp, regenT, doors, power, perks, weapons, slot, fireT, reloadT, reloading, held, mouseDown, trigger, shake, flash, hitM, hitKill, dmgFlash, whiteFlash, banner, bannerT, over, puX2, puInsta, gren, grenT, meleeT, melee, msg, msgT, boxRoll, boxName, boxLast, boxPick, swapT, prompt, t, bob, stepPh, between, recoil, dragX, dragY, flick = 0, flickT = 4, flickTube = null, dripT = 5, train, footY, overMsg, mode = 'menu', booted = false, jumpZ = 0, vz = 0, attract = null, lastRun = null;
    var stationIdx = 0, rideOff = 0, boxBear = false, boxSpin = null, heads = 0, shots = 0, rode = 0, walked = 0, chunk = null, opened = {}, boxAt = 0, boxUses = {}, bearT = 0, riding = 0, rideT = 0, rideFrom = 0, transit = 0, transitT = 0, conductor = null, condT = 0, passT = 0, fade = 0, fadeTo = 0, dying = 0, endT = 0, ended = false, stats = null, visited = {}, doorsOpenK = 0, chime = 0, spinUp = 0;
    var R = null;   /* the renderer bag, built in part 06 */
    function walk(x, z){ var c = ch(x, z); if(c === '.' || c === 'P' || c === 'C' || c === 'W') return !MTILE[x+','+z]; if(c === 'F') return true; if(c === '_') return !trainBlocks(x) || (trainOpen() && Math.abs(z + .5 - TRACK_Z) < 1.6); if(isDoor(c)) return !!doors[x+','+z]; return false; }   /* the car floor is walkable while the train stands with its doors open: that is how you board */
    function trainOpen(){ return !!(train && train.grp.visible && train.v < .2 && train.doors > .5); }
    function onTrain(){ return !!(train && train.grp.visible && Math.abs(P.y - TRACK_Z) < 1.45 && P.x > train.x + train.tail + .5 && P.x < train.x + train.nose - .5); }
    function carOk(x, y){ return Math.abs(y - TRACK_Z) < 1.15 && x > train.x + train.tail + .7 && x < train.x + train.nose - .7; }
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
    function moveCircle(o, nx, ny, r, okFn){ var ok = okFn || function(x, y){ return walk((x - r)|0, (y - r)|0) && walk((x + r)|0, (y - r)|0) && walk((x - r)|0, (y + r)|0) && walk((x + r)|0, (y + r)|0); }; if(ok(nx, o.y)) o.x = nx; if(ok(o.x, ny)) o.y = ny;
      /* columns are thin: push out of a .25 m core instead of blocking the tile */
      if(okFn) return; var cx = o.x|0, cy = o.y|0; for(var ox = -1; ox <= 1; ox++) for(var oy = -1; oy <= 1; oy++){ if(ch(cx + ox, cy + oy) !== 'C') continue; var kx = cx + ox + .5, ky = cy + oy + .5, rx = o.x - kx, ry = o.y - ky, d = Math.hypot(rx, ry), need = .26 + r; if(d < need && d > 0){ o.x = kx + rx/d*need; o.y = ky + ry/d*need; } } }
    function computeFlow(){ var px = P.x|0, py = P.y|0, key = px+','+py+':'+Object.keys(doors).length+':'+(train && train.grp.visible && train.v < 1.5 ? (train.x|0) : 'n'); if(key === flowKey) return; flowKey = key; flow.fill(-1); var q = [px + py*MW]; flow[q[0]] = 0; for(var h = 0; h < q.length; h++){ var i = q[h], x = i % MW, y = (i / MW)|0, d = flow[i] + 1; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){ var nx = x + o[0], ny = y + o[1], j = nx + ny*MW; if(nx < 0 || ny < 0 || nx >= MW || ny >= MH || flow[j] > -1 || !walk(nx, ny)) return; flow[j] = d; q.push(j); }); } }
    function stat(w){ var b = WEAPONS[w.id], up = w.up; return { id:w.id, up:!!up, dmg:b.dmg * (up ? 2.5 : 1) * (perks.doubletap ? 1.6 : 1), rpm:b.rpm * (perks.doubletap ? 1.35 : 1), mag:Math.round(b.mag * (up ? 1.5 : 1)), res:Math.round(b.res * (up ? 1.5 : 1)), reload:b.reload / (perks.quickhands ? 2 : 1), spread:b.spread, auto:b.auto, pellets:b.pellets || 1, pierce:b.pierce || 1, splash:(b.splash || 0) * (up ? 1.4 : 1), range:b.range || 40, knock:b.knock || 0, ray:!!b.ray, spin:b.spin || 0, hs:perks.deadshot ? 2.6 : 1.6, name:up ? b.up : b.name }; }
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
      stationIdx = 0; boxAt = 0; boxUses = {}; opened = {}; visited = {}; riding = 0; rideOff = 0; fade = 0; fadeTo = 0; dying = 0; endT = 0; ended = false; stats = null; transit = 0; heads = 0; shots = 0; bearT = 0; boxBear = false; boxSpin = null; conductor = null; condT = 0; passT = 0; rode = 0; walked = 0;
      if(!chunk) chunk = { t:'station', i:0 };
      if(chunk.t !== 'station' || chunk.i !== 0){ loadChunk({ t:'station', i:0 }, null, 0, true); } else { if(!R.fresh){ genMap(STATIONS[0]); R.rebuild({ boxHere:true }); } newTrain(); doors = {}; } R.fresh = false;
      visited[STATIONS[0].id] = 1; P.x = START.x; P.y = START.y; P.a = START.a; footY = 0;
      jumpZ = 0; vz = 0; giveWeapon('sidearm'); fireT = 0; api.score(0); startWave(1); status();
    }
    function newTrain(){ train = { grp:R.world.train.grp, nose:R.world.train.nose, tail:R.world.train.tail, x:-300, v:0, state:'away', next:22, t:0, braking:false, doors:0, released:false, menu:false }; train.grp.visible = false; return train; }
    /* ---------- the line. One chunk is in memory at a time: the station you stand in, or a stretch of tunnel. What the run remembers about a
       place (the gates you paid for) is kept out here, so walking back finds it as you left it, and the browser only ever holds one map. ---------- */
    function chunkDef(c){ return c.t === 'station' ? STATIONS[c.i] : TUNNEL; }
    function stationName(i){ return STATIONS[((i % STATIONS.length) + STATIONS.length) % STATIONS.length].name; }
    function nextName(){ return stationName(stationIdx + 1); }
    function loadChunk(c, place, ride, quiet){
      if(chunk && chunk.t === 'station'){ var was = STATIONS[chunk.i].id, keep = {}; Object.keys(doors).forEach(function(k){ keep[k] = 1; }); opened[was] = keep; }
      chunk = c; var def = chunkDef(c); if(c.t === 'station'){ stationIdx = c.i; visited[def.id] = 1; }
      toSpawn += alive; alive = 0; zombies = []; pickups = []; grenades = []; conductor = null; doors = {}; prompt = null; boxRoll = 0; bearT = 0; jumpZ = 0; vz = 0;
      genMap(def); R.rebuild({ boxHere:c.t === 'station' && boxAt === c.i });
      newTrain();
      var pre = opened[def.id]; if(pre) Object.keys(pre).forEach(function(k){ if(isDoor(ch(+k.split(',')[0], +k.split(',')[1]))){ doors[k] = true; R.openDoor(k, true); } });
      if(power) R.powerOn();
      condT = c.t === 'tunnel' ? 8 : 0; passT = c.t === 'tunnel' ? 16 + Math.random()*12 : 0;
      place = place || { x:START.x, y:START.y, a:START.a };
      P.x = place.x; P.y = place.y; if(place.a !== undefined) P.a = place.a;
      if(ride){ train.state = 'coming'; train.x = -105 - train.nose; train.v = 17; train.grp.visible = true; train.doors = 0; P.x = train.x + ride; P.y = TRACK_Z + rnd(-.5, .5); footY = TRAIN_FLOOR; snd.horn(); }
      else footY = floorAt(P.x|0, P.y|0);
      flowKey = ''; spawnT = Math.max(spawnT, .8); regenT = Math.max(regenT, .5);
      if(!quiet){ banner = (c.t === 'station' ? def.name : 'THE TUNNEL').toUpperCase(); bannerT = 2.6; say(c.t === 'station' ? def.name+'  \u00b7  '+def.sub : 'The tunnel. The train does not stop for you.', 3.2); }
      status();
    }
    /* walking off the end of a platform, or through a tunnel stretch, hands you the next chunk of the loop */
    function travelCheck(){ if(riding || over || dying) return; var c = chunk, n = STATIONS.length;
      if(c.t === 'station'){ if(floorAt(P.x|0, P.y|0) > -.5) return;
        if(P.x < .55){ walked++; loadChunk({ t:'tunnel', from:(c.i + n - 1) % n, seg:TUNNEL_SEGS - 1 }, { x:MW - 2.2, y:TRACK_Z + .5 }); }
        else if(P.x > MW - .55){ walked++; loadChunk({ t:'tunnel', from:c.i, seg:0 }, { x:2.2, y:TRACK_Z + .5 }); } }
      else { if(P.x > MW - .45){ walked++; if(c.seg < TUNNEL_SEGS - 1) loadChunk({ t:'tunnel', from:c.from, seg:c.seg + 1 }, { x:1.6, y:P.y }); else loadChunk({ t:'station', i:(c.from + 1) % n }, { x:1.8, y:TRACK_Z + .5 }); }
        else if(P.x < .45){ walked++; if(c.seg > 0) loadChunk({ t:'tunnel', from:c.from, seg:c.seg - 1 }, { x:MW - 1.6, y:P.y }); else loadChunk({ t:'station', i:c.from }, { x:MW - 1.8, y:TRACK_Z + .5 }); } } }
    /* the transit dead: two or three of them step off the train at every stop once the second wave is up. They wore the uniform once. */
    function releaseTransit(){ var n = 2 + ((Math.random()*2)|0); for(var i = 0; i < n; i++){ var x = train.x + rnd(2.5, train.nose - 2.5), kind = Math.random() < .55 ? 'mta' : 'nypd'; spawnTransit(x, kind); } snd.shriek(); say('Something got off with the train', 2.6); }
    function spawnTransit(x, kind){ var hp0 = zombieHp()*1.7, m = makeZombie(0, false, kind), ty = PIT.z1 + 2.3; alive++; transit++;
      var z = { x:x, y:TRACK_Z + 1.2, tx:x, ty:ty, fx:x, fy:TRACK_Z + 1.2, hp:hp0, maxhp:hp0, speed:kind === 'nypd' ? Math.min(3.2, 2.3 + wave*.04) : Math.min(2.2, 1.4 + wave*.05), dmg:kind === 'nypd' ? 30 : 38, brute:false, wraith:false, runner:kind === 'nypd', transit:true, kind:kind, v:0, anim:Math.random()*6, rise:1.3, rise0:1.3, stairs:false, atk:0, cool:0, dead:false, deadT:0, deadT0:2.2, flash:0, m:m, r:m.r, h:m.h, headY:m.headY, fy2:0, face:Math.PI/2, fallDir:1 };
      m.grp.position.set(z.x, z.fy2, z.y); R.scene.add(m.grp); zombies.push(z); }
    /* the Conductor: he works the tunnels with a lantern, he is faster than you and he does not lose the scent. Put him down and he leaves ammunition. */
    function spawnConductor(){ if(conductor) return; var m = makeZombie(7, false, 'conductor'), hp0 = 2200 + wave*500, x = clamp(P.x + (P.x < MW/2 ? 1 : -1)*rnd(16, 24), 2.5, MW - 2.5);
      var z = { x:x, y:TRACK_Z + .5, tx:x, ty:TRACK_Z + .5, fx:x, fy:TRACK_Z + .5, hp:hp0, maxhp:hp0, speed:2.15, dmg:35, brute:false, wraith:false, runner:false, boss:true, kind:'conductor', v:0, anim:0, rise:.8, rise0:.8, stairs:false, atk:0, cool:0, dead:false, deadT:0, deadT0:2.6, flash:0, m:m, r:m.r, h:m.h, headY:m.headY, fy2:PIT_Y, face:0, fallDir:1 };
      m.grp.position.set(z.x, z.fy2, z.y); R.scene.add(m.grp); zombies.push(z); conductor = z; alive++; snd.wraith(); say('A lantern is coming up the tunnel', 3.4); banner = 'THE CONDUCTOR'; bannerT = 2.6; }
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
    function hurt(d, why){ if(over || dying) return; hp -= d; dmgFlash = .6; regenT = perks.fleetfoot ? 2 : 4; shake = Math.max(shake, .9); snd.hurt();
      if(hp <= 0){ hp = 0; over = true; overMsg = why || 'Overrun'; dying = 2.6; ended = false; riding = 0; fadeTo = 0; trigger = false; mouseDown = false; held = {}; saveRun(); snd.ambient(false); snd.death(); api.status((why ? why.toLowerCase() : 'overrun')+' on wave '+wave+'  \u00b7  '+kills+' kills'); } }
    /* the end of a night: the camera goes down with you, the station goes quiet, and the shift is read back to you before the menu returns.
       No framework game-over card here (no 'press R'): the game hands its own ending over and calls api.save() to keep the best run. */
    function showEnd(){ ended = true; endT = 11; stats = { wave:wave, kills:kills, points:total, heads:heads, shots:shots, acc:shots ? Math.round(100*Math.min(1, heads ? heads/shots + .0 : 0)) : 0, stations:Object.keys(visited).length, rode:rode, walked:walked, why:overMsg, best:runs().best || null };
      fadeTo = 0; fade = 0; api.save(); R.endCard(stats); snd.endSting(); }
    function backToMenu(){ if(!ended && !dying) return; ended = false; dying = 0; endT = 0; over = false; R.endCard(null); resetRun(); enterMenu(); }
    function saveRun(){ try { var o = JSON.parse(localStorage.getItem('tigos.nightshift.runs') || '{}'); o.runs = (o.runs || 0) + 1; o.last = { wave:wave, kills:kills, pts:total, why:overMsg }; if(!o.best || total > o.best.pts) o.best = { wave:wave, kills:kills, pts:total }; if(!o.deep || wave > o.deep) o.deep = wave; localStorage.setItem('tigos.nightshift.runs', JSON.stringify(o)); lastRun = o; } catch(e){} }
    function runs(){ if(lastRun) return lastRun; try { lastRun = JSON.parse(localStorage.getItem('tigos.nightshift.runs') || '{}'); } catch(e){ lastRun = {}; } return lastRun; }
    function killZombie(z, src){ z.dead = true; z.deadT = z.deadT0; z.fallDir = Math.random() < .8 ? 1 : -1; alive--; kills++; hitKill = true;
      if(z.transit) transit = Math.max(0, transit - 1);
      if(z.boss){ conductor = null; condT = 40; addPoints(500); pickups.push({ x:z.x, y:z.y, kind:'ammo', t:40 }); say('The Conductor is down', 3); banner = 'CONDUCTOR DOWN'; bannerT = 2.4; if(z.m.light) z.m.light.intensity = 0; } R.decal(z.x, z.fy2, z.y, .9 + Math.random()*.6); R.blood(z, 18); if(src !== 'train') snd.kill();
      if(special && toSpawn <= 0 && alive <= 0){ pickups.push({ x:z.x, y:z.y, kind:'ammo', t:40 }); say('The last wraith left something behind', 2.5); snd.pickup(); }
      else if(Math.random() < .035 && pickups.length < 2) pickups.push({ x:z.x, y:z.y, kind:['ammo','2x','insta','nuke'][(Math.random()*4)|0], t:22 }); status(); }
    function damage(z, d, hs, src){ if(z.dead || z.rise > .6) return false; if(puInsta > 0 && !z.boss) d = 1e9; z.hp -= d; z.flash = .08; hitM = .14; hitKill = false; if(hs) heads++; addPoints(hs ? 20 : 10); R.blood(z, hs ? 9 : 5);   /* a headshot is worth double, on the hit and on the kill */
      if(z.hp <= 0){ addPoints(src === 'melee' ? 130 : hs ? 120 : 60); killZombie(z, src); } else snd.hit(); return true; }
    /* a shot: the yaw/pitch ray against the grid, the floor and ceiling, and every zombie's capsule. Returns the hit count; draws a tracer and impact sparks. */
    function hitscan(ang, pitch, st){ var dx = Math.cos(ang), dy = Math.sin(ang), tp = Math.tan(pitch), eye = footY + jumpZ + EYE, wall = cast(P.x, P.y, dx, dy, true), tmax = Math.min(wall.dist, st.range), hits = [], kind = wall.ch === 'T' ? 'train' : 'wall';
      if(tp < -1e-4){ var tf = (floorAt(P.x|0, P.y|0) - eye)/tp, fx = P.x + dx*tf, fy = P.y + dy*tf, tf2 = (floorAt(fx|0, fy|0) - eye)/tp; tf = Math.max(tf, tf2); if(tf < tmax){ tmax = tf; kind = 'floor'; } } else if(tp > 1e-4){ var tc = (ceilAt(P.x|0, P.y|0) - eye)/tp; if(tc < tmax){ tmax = tc; kind = 'ceiling'; } }
      zombies.forEach(function(z){ if(z.dead || z.rise > .6) return; var rx = z.x - P.x, ry = z.y - P.y, along = rx*dx + ry*dy; if(along < .1 || along > tmax) return; var lat = Math.abs(rx*dy - ry*dx); if(lat >= z.r) return; var yh = eye + along*tp - z.fy2; if(yh < 0 || yh > z.h) return; hits.push({ z:z, along:along - Math.sqrt(Math.max(0, z.r*z.r - lat*lat)), hs:yh > z.headY }); });
      hits.sort(function(a, b){ return a.along - b.along; }); var n = 0, pt = null;
      hits.slice(0, st.pierce).forEach(function(h, i){ var fall = st.range < 20 ? Math.max(.25, 1 - h.along / st.range) : 1; damage(h.z, st.dmg * fall * (h.hs ? st.hs : 1) * Math.pow(.7, i), h.hs); n++; if(st.knock && !h.z.boss){ var kk = st.knock*.12; moveCircle(h.z, h.z.x + dx*kk, h.z.y + dy*kk, .28); h.z.atk = 0; h.z.cool = .5; } if(!pt) pt = { x:P.x + dx*h.along, y:eye + h.along*tp, z:P.y + dy*h.along }; });
      if(!pt){ var te = Math.max(0, tmax - .05); pt = { x:P.x + dx*te, y:eye + te*tp, z:P.y + dy*te }; if(kind !== 'wall' || wall.dist < st.range) R.sparks(pt, -dx, -dy, kind); }
      R.tracer(pt, st.ray ? '#7bff9a' : st.id === 'thunder' ? '#a8dcff' : st.id === 'prism' ? '#c9a0ff' : st.up ? '#ff8a00' : null);   /* a wonder weapon fires light, not lead */
      if(st.splash){ zombies.forEach(function(z){ if(z.dead) return; var d = Math.hypot(z.x - pt.x, z.y - pt.z); if(d < st.splash && !(hits[0] && hits[0].z === z)) damage(z, st.dmg * .6 * (1 - d/st.splash), false); }); R.burst(pt.x, pt.y, pt.z, st.ray ? 20 : 10, st.ray ? '#7bff9a' : st.id === 'thunder' ? '#a8dcff' : '#ffd166', st.ray ? 3 : 2); if(st.ray || st.knock) R.flashLight(pt.x, pt.y, pt.z, st.ray ? 0x7bff9a : 0xa8dcff); }
      return n; }
    function shoot(){ var w = cur(), st = stat(w); if(reloading || fireT > 0) return false;   /* the box spinning never locks the trigger: you shoot until the new gun is in your hands */ if(w.mag <= 0){ snd.empty(); fireT = .25; if(w.res > 0 && msgT <= 0) say('Empty  \u00b7  R to reload', 1.2); return false; }   /* no auto reload: the trigger clicks on an empty chamber until you press R */
      if(st.spin && spinUp < .999){ spinUp = Math.min(1, spinUp + .17); fireT = .055; snd.spin(spinUp); return false; }   /* the Vulcan has to get its barrels up to speed first */
      w.mag--; shots += st.pellets; fireT = 60 / st.rpm; flash = .07; recoil = 1; shake = Math.max(shake, st.pellets > 1 ? .9 : .25); if(w.up) snd.laser(); else snd.shot(w.id);
      for(var i = 0; i < st.pellets; i++) hitscan(P.a + (Math.random() - .5) * 2 * st.spread * (held.sprint ? 2.2 : 1), P.p + (Math.random() - .5) * 2 * st.spread, st); return true; }
    function reload(){ var w = cur(), st = stat(w); if(reloading || w.mag >= st.mag || w.res <= 0) return; reloading = true; reloadT = st.reload; snd.reload(); }
    function throwGrenade(){ if(gren <= 0 || grenT > 0 || over) return; gren--; grenT = .5; var c = Math.cos(P.p); grenades.push({ x:P.x, y:P.y, z:footY + jumpZ + 1.3, vx:Math.cos(P.a)*7.5*c, vy:Math.sin(P.a)*7.5*c, vz:2.4 + Math.sin(P.p)*7, t:1.35, m:R.grenade() }); }
    function explode(x, y, r, d){ shake = Math.max(shake, 1.6); whiteFlash = .18; snd.boom(); zombies.forEach(function(z){ if(z.dead) return; var k = Math.hypot(z.x - x, z.y - y); if(k < r) damage(z, d * (1 - k/r*.6), false); }); R.burst(x, floorAt(x|0, y|0) + .3, y, 40, '#ffb15c', 4); R.burst(x, floorAt(x|0, y|0) + .3, y, 20, '#555', 3); R.flashLight(x, floorAt(x|0, y|0) + .8, y); if(Math.hypot(P.x - x, P.y - y) < r*.7) hurt(30); }
    function doMelee(){ if(meleeT > 0 || over) return; meleeT = .55; melee = 1; var dx = Math.cos(P.a), dy = Math.sin(P.a), best = null, bd = 1.35; zombies.forEach(function(z){ if(z.dead) return; var rx = z.x - P.x, ry = z.y - P.y, d = Math.hypot(rx, ry); if(d < bd && (rx*dx + ry*dy)/d > .6){ bd = d; best = z; } }); if(best) damage(best, 150, false, 'melee'); snd.swap(); }
    /* the mystery box. Every gun the box can hand out is in the roll and in the pool (the old build showed a dozen and only ever gave four),
       weighted so the wonder weapons are rare and a gun you already carry never comes up. Use it too often and the bear turns up instead: your
       points come back, the box shuts, and it opens again at another station down the line. */
    function boxPool(){ var own = weapons.map(function(w){ return w.id; }), pool = Object.keys(WEAPONS).filter(function(k){ return WEAPONS[k].box !== false && own.indexOf(k) < 0; });
      return pool.length ? pool : Object.keys(WEAPONS).filter(function(k){ return WEAPONS[k].box !== false; }); }
    function rollBox(pool){ var tot = 0, wts = pool.map(function(k){ var w = WEAPONS[k].weight === undefined ? 2.4 : WEAPONS[k].weight; tot += w; return w; }), r = Math.random()*tot;
      for(var i = 0; i < pool.length; i++){ r -= wts[i]; if(r <= 0) return pool[i]; } return pool[pool.length - 1]; }
    function openBox(){ var id = STATIONS[stationIdx].id; boxUses[id] = (boxUses[id] || 0) + 1; var uses = boxUses[id];
      boxSpin = boxPool(); boxBear = uses > 3 && Math.random() < .2 + (uses - 4)*.13; boxPick = boxBear ? boxSpin[0] : rollBox(boxSpin); boxRoll = BOX_T; boxLast = ''; R.boxOpen(true); snd.box(); }
    function bearTick(dt){ bearT -= dt; if(bearT > 0) return; R.boxBear(false); R.boxGone(); if(BOXM) BOXM.here = false;
      var n = STATIONS.length, hop = 1 + ((Math.random()*(n - 1))|0); boxAt = (stationIdx + hop) % n; boxUses[STATIONS[stationIdx].id] = 0;
      say('The box has gone. It is open at another station.', 3.6); banner = 'BOX RELOCATED'; bannerT = 2.6; snd.gate(); }
    function interact(){ if(!prompt || over) return; if(prompt.deny){ snd.deny(); say(prompt.deny); return; } if(points < prompt.cost){ snd.deny(); say('Not enough points ('+prompt.cost+')'); return; } points -= prompt.cost; var act = prompt.act; prompt = null; act(); snd.buy(); status(); }   /* one purchase per prompt: mashing F cannot double-buy */
    function findPrompt(){ prompt = null; var dx = Math.cos(P.a), dy = Math.sin(P.a), c = cast(P.x, P.y, dx, dy), key = c.mx+','+c.my;
      if(c.dist < 1.9){
        if(isDoor(c.ch) && !doors[key]) prompt = { txt:'Open the gate', cost:DOOR_COST[c.ch], act:function(){ doors[key] = true; flowKey = ''; R.openDoor(key); snd.gate(); say('Gate open'); } };
        else if(c.ch === 'X' && BUY_AT[key]){ var wid = BUY_AT[key], base = WEAPONS[wid], own = weapons.filter(function(w){ return w.id === wid; })[0];
          if(own) prompt = { txt:'Ammo for '+stat(own).name, cost:Math.round(base.cost * (own.up ? .8 : .5)), act:function(){ own.res = stat(own).res; own.mag = stat(own).mag; say('Ammo restocked'); } };
          else prompt = { txt:'Buy '+base.name, cost:base.cost, act:function(){ giveWeapon(wid); say(base.name+' equipped'); } }; }
        else if(c.ch === 'K'){ var w0 = cur(), s0 = stat(w0); if(w0.res >= s0.res && w0.mag >= s0.mag) prompt = { txt:'Resupply', deny:'Already full' }; else prompt = { txt:'Resupply '+s0.name, cost:250, act:function(){ w0.res = s0.res; w0.mag = s0.mag; say('Resupplied'); } }; }
        else if(c.ch === 'Y' && !power) prompt = { txt:'Turn on the power', cost:0, act:function(){ power = true; snd.power(); R.powerOn(true); say('Power restored. Perks and the Forge are live.', 3); banner = 'POWER ON'; bannerT = 2.2; shake = Math.max(shake, .5); } };
      }
      if(!prompt) MACHINES.forEach(function(m){ var rx = m.x - P.x, ry = m.y - P.y, d = Math.hypot(rx, ry); if(d > 1.6 || (rx*dx + ry*dy)/d < .55) return;
        if(m.kind === 'box'){ if(!m.here) prompt = { txt:'The box is not here', deny:'The bear moved it down the line' }; else if(boxRoll > 0 || bearT > 0) prompt = null; else prompt = { txt:'Mystery box', cost:950, act:openBox }; }
        else if(m.kind === 'forge'){ if(!power) prompt = { txt:'Forge', deny:'The Forge needs power' }; else if(cur().up) prompt = { txt:stat(cur()).name+' is already forged', deny:'Already forged' }; else prompt = { txt:'Forge '+stat(cur()).name, cost:5000, act:function(){ var w = cur(); w.up = true; var st = stat(w); w.mag = st.mag; w.res = st.res; R.gunFor(w); R.forgeRun(); snd.forge(); whiteFlash = .2; shake = Math.max(shake, .7); say(st.name+' forged', 2.5); banner = st.name.toUpperCase(); bannerT = 2.4; } }; }
        else { var pk = PERKS[m.kind]; if(!power) prompt = { txt:pk.name, deny:'No power yet. Find the switch.' }; else if(!perks[m.kind]) prompt = { txt:pk.name+' ('+pk.blurb+')', cost:pk.cost, act:function(){ perks[m.kind] = true; if(m.kind === 'ironhide'){ maxhp = 250; hp = maxhp; } R.vendorPour(m.kind); snd.vendor(); say(pk.name+' acquired', 2); } }; else prompt = { txt:pk.name, deny:'You already drank that one' }; } });
    }
    /* the train: called from the tunnel every so often once the second wave starts. It brakes to a stop at the platform, waits, then pulls away,
       gathering speed the way a real one does. Anything on the tracks in front of it is gone. */
    /* the train. At a station it brakes to the mark, chimes, opens its doors (and a couple of the transit dead step off), holds, closes and pulls
       away. Stay aboard when the doors close and it takes you down the line to the next platform. In a tunnel it does not stop for anyone: a horn,
       a headlight and then the wall. Anything on the track in front of it is gone, and the maintenance walkways are the only safe ground. */
    function trainCrush(tr){ if(tr.v <= 1.5) return; var x0 = tr.x + tr.tail - .5, x1 = tr.x + tr.nose + 1.2;
      zombies.forEach(function(z){ if(!z.dead && Math.abs(z.y - TRACK_Z) < 2.1 && z.x > x0 && z.x < x1 && ch(z.x|0, z.y|0) !== 'W'){ addPoints(50); killZombie(z, 'train'); z.fallDir = 1; } });
      if(!over && !riding && Math.abs(P.y - TRACK_Z) < 2.1 && P.x > x0 && P.x < x1 && ch(P.x|0, P.y|0) !== 'W' && floorAt(P.x|0, P.y|0) < -.5) hurt(1000, 'Struck by the train'); }
    function board(){ riding = 1; rideOff = P.x - train.x; rode++; snd.chime(); banner = 'NEXT STOP'; bannerT = 2.6; say('Next stop '+nextName(), 3.4); api.status('riding to '+nextName()); }
    function updateTrain(dt){ var tr = train; if(!tr) return; var inTunnel = chunk && chunk.t === 'tunnel', stopAt = STATION.x1 - 1.5;
      if(inTunnel){
        if(tr.state === 'away'){ tr.next -= dt; if(tr.next <= 0){ tr.state = 'through'; tr.x = -160 - tr.nose; tr.v = 21; tr.doors = 0; tr.grp.visible = true; snd.horn(); say('Train in the tunnel  \u00b7  get on a walkway', 3.4); banner = 'CLEAR THE TRACK'; bannerT = 2.4; } }
        else { tr.x += tr.v*dt; tr.grp.position.x = tr.x; trainCrush(tr); if(tr.x + tr.tail > MW + 150){ tr.state = 'away'; tr.v = 0; tr.doors = 0; tr.grp.visible = false; tr.next = 26 + Math.random()*18; } } }
      else if(tr.state === 'away'){ if(tr.menu || wave >= 2 || riding){ tr.next -= dt; if(tr.next <= 0){ tr.state = 'coming'; tr.x = -140 - tr.nose; tr.v = 17; tr.braking = false; tr.released = false; tr.grp.visible = true; snd.horn(); say('Train coming in', 2); } } }
      else {
        if(tr.state === 'coming'){ var left = stopAt - (tr.x + tr.nose), vBrake = Math.sqrt(2*2.6*Math.max(0, left)) + .25; if(tr.v > vBrake){ tr.braking = true; tr.v = vBrake; }   /* v = sqrt(2ad): the classic braking curve, so it always settles exactly at the mark */
          tr.x += tr.v*dt; if(stopAt - (tr.x + tr.nose) <= .06){ tr.x = stopAt - tr.nose; tr.v = 0; tr.state = 'stopped'; tr.t = tr.menu ? 11 : 9; tr.braking = false; shake = Math.max(shake, .4); flowKey = ''; snd.brake(); snd.chime(); } }
        else if(tr.state === 'stopped'){ tr.t -= dt;
          if(tr.t > 1.3) tr.doors = Math.min(1, tr.doors + dt*1.7); else tr.doors = Math.max(0, tr.doors - dt*1.7);
          if(tr.doors >= 1 && !tr.released){ tr.released = true; if(riding === 3){ riding = 0; footY = TRAIN_FLOOR; say('Mind the gap', 2.4); } if(!tr.menu){ snd.announce(); if(wave >= 2 && !special) releaseTransit(); }   /* wraith rounds stay pure: nothing else gets off */ }
          if(tr.t <= 1.3 && tr.doors <= 0 && !tr.closed){ tr.closed = true; if(!tr.menu && !riding && onTrain()) board(); }
          if(tr.t <= 0){ tr.state = 'leaving'; tr.doors = 0; snd.horn(); } }
        else if(tr.state === 'leaving'){ tr.v = Math.min(22, tr.v + 1.35*dt); tr.x += tr.v*dt;
          if(tr.x + tr.tail > MW + 130){ tr.state = 'away'; tr.v = 0; tr.next = tr.menu ? 24 : 62 + Math.random()*40; tr.grp.visible = false; tr.closed = false; tr.released = false; flowKey = ''; }   /* the menu train runs a one-minute loop: ~9 s in, 11 s at the platform, ~17 s out, 24 s away */ }
        tr.grp.position.x = tr.x; if(tr.v > 0 && tr.v < 1.5) flowKey = '';
        trainCrush(tr);
        var near = clamp(1 - Math.abs((tr.x + tr.nose/2) - P.x)/90, 0, 1); shake = Math.max(shake, tr.v/22*.25*near); }
      /* riding: the car carries you, and once it is clear of the platform the line fades and the next station comes up under you */
      if(riding){ P.x += tr.v*dt; footY = TRAIN_FLOOR;
        if(riding === 1 && tr.x + tr.tail > MW + 45){ riding = 2; fadeTo = 1; }
        if(riding === 2 && fade > .93){ loadChunk({ t:'station', i:(stationIdx + 1) % STATIONS.length }, null, rideOff); riding = 3; fadeTo = 0; } }
      snd.train(tr.grp.visible ? tr.v*(.35 + .65*clamp(1 - Math.abs((tr.x + tr.nose/2) - P.x)/120, 0, 1)) : 0, tr.braking, riding ? 1 : 0);
    }
    function ambientTick(dt){ flickT -= dt; if(flickT <= 0){ flick = flick ? 0 : 1; flickT = flick ? rnd(.04, .16) : rnd(2.5, 9); if(!flick && Math.random() < .3) flickTube = null; }   /* the lights in this place are not well */
      dripT -= dt; if(dripT <= 0){ dripT = rnd(3, 9); snd.drip(); } }
    g.update = function(dt){
      if(mode === 'menu'){ t += dt; ambientTick(dt); updateTrain(dt); updateAttract(dt); return; }
      t += dt; fade += (fadeTo - fade)*Math.min(1, dt*2.6);
      if(dying > 0){ dying -= dt; shake = Math.max(shake, dying*.25); if(dying <= 0 && !ended) showEnd(); return; }
      if(ended){ endT -= dt; if(endT <= 0) backToMenu(); return; } fogK += ((special ? .45 : chunk && chunk.t === 'tunnel' ? .62 : 1) - fogK) * Math.min(1, dt*1.5); fireT -= dt; grenT -= dt; meleeT -= dt; melee = Math.max(0, melee - dt*3); flash = Math.max(0, flash - dt); hitM = Math.max(0, hitM - dt); dmgFlash = Math.max(0, dmgFlash - dt); whiteFlash = Math.max(0, whiteFlash - dt); shake = Math.max(0, shake - dt*2.5); recoil = Math.max(0, recoil - dt*6); bannerT -= dt; msgT -= dt; puX2 = Math.max(0, puX2 - dt); puInsta = Math.max(0, puInsta - dt);
      ambientTick(dt); updateTrain(dt);
      if(jumpZ > 0 || vz !== 0){ vz -= 12*dt; jumpZ += vz*dt; if(jumpZ <= 0){ jumpZ = 0; vz = 0; snd.step(floorAt(P.x|0, P.y|0) < -.5); shake = Math.max(shake, .12); } }
      if(over) return;
      var dx = Math.cos(P.a), dy = Math.sin(P.a);
      if(held.L) P.a -= 2.6*dt; if(held.R) P.a += 2.6*dt;
      var fw = (held.W ? 1 : 0) - (held.S ? 1 : 0), sf = (held.D ? 1 : 0) - (held.A ? 1 : 0), sp = 3.1 * (held.sprint && fw > 0 ? (perks.fleetfoot ? 1.75 : 1.45) : 1);
      if(fw || sf){ var l = Math.hypot(fw, sf); fw /= l; sf /= l; var mx = (dx*fw - dy*sf) * sp * dt, my = (dy*fw + dx*sf) * sp * dt; moveCircle(P, P.x + mx, P.y + my, .22, riding ? carOk : null);
        zombies.forEach(function(z){ if(z.dead || z.rise > 0) return; var rx = P.x - z.x, ry = P.y - z.y, d = Math.hypot(rx, ry), r = z.r + .22; if(d < r && d > 0){ P.x = z.x + rx/d*r; P.y = z.y + ry/d*r; } }); bob += dt * sp * 2.2; var ph = Math.floor(bob / Math.PI); if(ph !== stepPh){ stepPh = ph; snd.step(floorAt(P.x|0, P.y|0) < -.5); } }
      var fl = riding || onTrain() ? TRAIN_FLOOR : floorAt(P.x|0, P.y|0); footY += (fl - footY) * Math.min(1, dt*9);
      travelCheck(); if(chunk.t === 'tunnel' && !conductor && condT > 0){ condT -= dt; if(condT <= 0) spawnConductor(); }
      if(bearT > 0) bearTick(dt);
      if(reloading){ reloadT -= dt; if(reloadT <= 0){ var w = cur(), st = stat(w), need = st.mag - w.mag, take = Math.min(need, w.res); w.mag += take; w.res -= take; reloading = false; } }
      if(boxRoll > 0){ boxRoll -= dt; var pool = boxSpin, prog = clamp(1 - boxRoll/BOX_T, 0, 1), idx = Math.floor(26 * (1 - Math.pow(1 - prog, 2.2))); boxName = WEAPONS[pool[idx % pool.length]].name; if(boxRoll < .35) boxName = boxBear ? 'Teddy Bear' : WEAPONS[boxPick].name; if(boxName !== boxLast){ boxLast = boxName; snd.tick(); R.boxShow(boxBear && boxRoll < .35 ? null : boxName); }
        if(boxRoll <= 0){ R.boxOpen(false);
          if(boxBear){ bearT = 3.4; points += 950; R.boxBear(true); snd.bear(); say('The bear was in the box', 2.6); banner = 'THE BEAR'; bannerT = 2.4; }
          else { whiteFlash = .12; R.burst(BOXM.x, .9, BOXM.y, 30, '#8cc7ff', 3); giveWeapon(boxPick); say(WEAPONS[boxPick].name+' from the box', 2); } } }
      var st0 = stat(cur()); if(!((held.F || mouseDown || trigger) && st0.spin)) spinUp = Math.max(0, spinUp - dt*1.4);
      if(trigger){ if(shoot() || reloading || cur().mag <= 0) trigger = false; } else if((held.F || mouseDown) && st0.auto) shoot();   /* a tap is buffered until the gun is ready, so no press is ever swallowed */
      if(regenT > 0) regenT -= dt; else if(hp < maxhp) hp = Math.min(maxhp, hp + dt * (perks.fleetfoot ? 40 : 22));
      computeFlow(); findPrompt();
      /* waves */
      if(toSpawn > 0 && !riding){ spawnT -= dt; if(spawnT <= 0 && alive < Math.min(24, 6 + wave*2)){ spawn(); spawnT = Math.max(.45, 2.1 - wave*.1); } }
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
    var frameDt = 0, gun = null, gunW = null, hud = {}, hudEl = null, last = {}, vw = 2, vh = 2, soft = false, boxGuns = {}, flashLights = [], tmpV = new THREE.Vector3(), menuEl = null, menuPanel = 'main', menuSel = 0, forgeT = 0, vendT = {}, powerSweep = 0, bearShow = false, fadeEl = null, endEl = null;
    (function build(){
      var renderer = new THREE.WebGLRenderer({ canvas:api.canvas, antialias:false, powerPreference:'high-performance', alpha:false, stencil:false });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
      try { var gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), rn = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(rn); } catch(e){}
      if(/[?&]gl=1/.test(location.search)) soft = false;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x04050a); scene.fog = new THREE.FogExp2(0x04050a, .042);
      var camera = new THREE.PerspectiveCamera(SET.fov, 16/9, .04, 200); camera.rotation.order = 'YXZ'; scene.add(camera); var handL = new THREE.PointLight(0xfff0dd, 1.1, 1.3, 1); handL.position.set(.1, .18, -.1); camera.add(handL);   /* a faint fill so the gun reads in a dark station */
      var world = buildWorld(scene, { boxHere:true }); chunk = { t:'station', i:0 };
      var composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(320, 180), .22, .3, 1.05);   /* only what is brighter than white glows: tubes, lamps, eyes, panels */ composer.addPass(bloom); composer.addPass(new THREE.OutputPass());
      var blood = Particles(scene, 320, .075, A.tex.soft), sparks = Particles(scene, 160, .045, A.tex.soft), tracers = Beams(scene, 12, M.tracer, .014), beams = Beams(scene, 8, M.beam, .05), decals = Decals(scene, 48, M.blood), grenGeo = new THREE.SphereGeometry(.07, 10, 8);
      for(var fl = 0; fl < 3; fl++){ var L = new THREE.PointLight(0xffb060, 0, 14, 1); scene.add(L); flashLights.push({ l:L, t:0 }); }
      var puGeo = new THREE.SphereGeometry(.16, 14, 10), puTex = {}; Object.keys(PU_DEF).forEach(function(k){ var c = mk(128, 32); text(c.getContext('2d'), PU_DEF[k].label, 64, 16, 22, PU_DEF[k].col, 'center', 900); var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; puTex[k] = tx; });
      function applyGfx(){ var tier = soft ? 'low' : SET.gfx, dpr = window.devicePixelRatio || 1, pr = soft ? .3 : { low:.55, medium:.8, high:Math.min(1.5, dpr), ultra:Math.min(2, dpr) }[tier]; renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
        bloom.enabled = tier !== 'low' || /[?&]gl=1/.test(location.search); bloom.strength = tier === 'ultra' ? .28 : .22; var nl = { low:8, medium:12, high:17, ultra:99 }[tier]; world.lights.forEach(function(o, i){ o.l.visible = i < nl; }); if(vw > 2) R.resize(vw, vh); }
      R = { scene:scene, camera:camera, renderer:renderer, world:world, fresh:true, soft:function(){ return soft; }, bloom:bloom,
        resize:function(w, h){ vw = w; vh = h; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); },
        applySettings:function(){ camera.fov = SET.fov; camera.updateProjectionMatrix(); applyGfx(); snd.volume(SET.vol); },
        reset:function(){ clearActors(); decals.clear(); paintWorld(); scene.fog.density = .042; fadeEl && (fadeEl.style.opacity = 0); R.endCard(null); },
        /* down the line: throw this chunk away and build the next one. The viewmodel lives on the camera and the particle pools are scene-wide,
           so only the world group and the box's spinning display guns go; one map is in memory at a time. */
        rebuild:function(opts){ clearActors(); decals.clear();
          Object.keys(boxGuns).forEach(function(k){ scene.remove(boxGuns[k].grp); boxGuns[k].dispose(); delete boxGuns[k]; });
          world.destroy(); world = buildWorld(scene, opts || {}); R.world = world; applyGfx(); paintWorld(); forgeT = 0; vendT = {}; powerSweep = power ? 99 : 0; return world; },
        gunFor:function(w){ if(gun){ camera.remove(gun.grp); gun.dispose(); } gun = makeGun(w.id, w.up); gunW = w; gun.grp.rotation.set(0, Math.PI/2 + .1, 0); gun.grp.scale.setScalar(gun.glb ? (gun.mz.x > .42 ? .54 : .62) : .5); camera.add(gun.grp); },
        gunGlb:function(){ return !!(gun && gun.glb); },
        blood:function(z, n){ for(var i = 0; i < n; i++) blood.add(z.x, z.fy2 + z.h*.55 + rnd(-.2, .3), z.y, rnd(-1.6, 1.6), rnd(.3, 2.4), rnd(-1.6, 1.6), rnd(.35, .8), Math.random() < .3 ? '#5a0606' : '#8a0a0a'); },
        decal:function(x, y, z, s){ decals.add(x, y, z, s); },
        sparks:function(pt, nx, nz, kind){ var col = kind === 'floor' || kind === 'ceiling' ? '#777' : '#ffd27a', n = kind === 'wall' || kind === 'train' ? 5 : 3; for(var i = 0; i < n; i++) sparks.add(pt.x, pt.y, pt.z, nx*rnd(.5, 3) + rnd(-1.5, 1.5), rnd(-.5, 2.5), nz*rnd(.5, 3) + rnd(-1.5, 1.5), rnd(.15, .4), col, 7); if((kind === 'wall' || kind === 'train') && Math.random() < .4) snd.ricochet(); },
        tracer:function(pt, col){ if(!gun) return; var mzw = gun.grp.localToWorld(tmpV.copy(gun.mz)); if(col) beams.add({ x:mzw.x, y:mzw.y, z:mzw.z }, pt, .16, col); else tracers.add({ x:mzw.x, y:mzw.y, z:mzw.z }, pt, .06); },
        burst:function(x, y, z, n, col, spd){ for(var i = 0; i < n; i++) sparks.add(x, y, z, rnd(-spd, spd), rnd(0, spd*1.2), rnd(-spd, spd), rnd(.3, .8), col, 6); },
        flashLight:function(x, y, z, col){ var f = flashLights[0]; flashLights.forEach(function(o){ if(o.t < f.t) f = o; }); f.l.position.set(x, y, z); f.l.color.setHex(col === undefined ? 0xffb060 : col); f.t = .5; },
        openDoor:function(key, instant){ var d = world.doors[key]; if(!d) return; if(instant){ d.open = 9; d.grp.visible = false; } else d.open = .001; },
        powerOn:function(animate){ Object.keys(world.machines).forEach(function(k){ setPanel(world.machines[k], true); }); setPower(true); powerSweep = animate ? 0 : 99; },
        forgeRun:function(){ forgeT = 2.6; },
        vendorPour:function(kind){ vendT[kind] = 1.6; var m = world.machines[kind]; if(m && m.bottle){ m.bottle.visible = true; } },
        boxOpen:function(on){ var m = world.machines.box; if(m && m.beam) m.beam.visible = !!on; if(!on) Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = false; }); },
        boxBear:function(on){ var m = world.machines.box; if(!m) return; if(m.bear){ m.bear.visible = !!on; m.bear.position.y = m.bearY0; } bearShow = !!on; },
        boxGone:function(){ var m = world.machines.box; if(!m) return; if(m.chest && m.chest.children){ m.chest.children.forEach(function(c){ if(c !== m.pedestal) c.visible = false; }); } if(m.pedestal) m.pedestal.visible = true; if(m.beam) m.beam.visible = false; if(m.bear) m.bear.visible = false; bearShow = false; },
        boxShow:function(name){ if(!name){ Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = false; }); return; } var id = Object.keys(WEAPONS).filter(function(k){ return WEAPONS[k].name === name; })[0]; if(!id) return; if(!boxGuns[id]){ boxGuns[id] = makeGun(id, false, { bare:true }); boxGuns[id].grp.scale.set(2.2, 2.2, 2.2); scene.add(boxGuns[id].grp); } Object.keys(boxGuns).forEach(function(k){ boxGuns[k].grp.visible = k === id; }); },
        grenade:function(){ var m = new THREE.Mesh(grenGeo, M.dark); scene.add(m); return m; },
        pickupGone:function(p){ if(p.m){ scene.remove(p.m); if(p.lbl) scene.remove(p.lbl); } },
        frame:function(dt){
          var eye = footY + jumpZ + EYE + (Math.abs(Math.sin(bob))*.045), sk = shake*.035;
          if(mode === 'menu'){   /* the security camera: high in the west corner of the platform, a slow pan across the platform and the tracks, a little roll */
            camera.position.set(STATION.x0 + .9, CEIL_HI - .25, STATION.z1 - .8); tmpV.set(30 + Math.sin(t*.13)*7, .4, 7.2); camera.lookAt(tmpV); camera.rotation.z += .035; if(gun) gun.grp.visible = false; }
          else if(dying > 0 || ended){ var dk = clamp(1 - dying/2.6, 0, 1), ez = 1 - Math.pow(1 - dk, 3);   /* the fall: down to the tile, a roll, and it stays there while the shift is read back */
            camera.position.set(P.x, footY + EYE - ez*(EYE - .26), P.y); camera.rotation.set(-.2 - ez*.55, Math.atan2(-Math.cos(P.a), -Math.sin(P.a)) + ez*.3, ez*1.2); if(gun) gun.grp.visible = false; }
          else { var rs = riding ? 1 : 0; camera.position.set(P.x + rnd(-1, 1)*sk + rs*Math.sin(t*5.7)*.012, eye + rnd(-1, 1)*sk + rs*Math.sin(t*8.3)*.014, P.y + rnd(-1, 1)*sk + rs*Math.sin(t*4.1)*.01); camera.rotation.set(P.p + rnd(-1, 1)*sk*.5, Math.atan2(-Math.cos(P.a), -Math.sin(P.a)), Math.sin(bob)*.006 + rnd(-1, 1)*sk*.3 + rs*Math.sin(t*3.3)*.01); if(gun) gun.grp.visible = forgeT <= 0; }
          /* the gun: bob, recoil, reload dip, swap slide, melee shove */
          if(gun && mode !== 'menu'){ var rp = reloading ? Math.sin((1 - reloadT/stat(gunW).reload) * Math.PI) : 0, sw = swapT > 0 ? Math.sin(Math.PI*swapT/.34) : 0;
            var big = gun.glb ? clamp((gun.mz.x - .34)*.6, 0, .12) : 0;   /* the long guns sit further out and lower so they do not fill the frame */
            gun.grp.position.set((gun.glb ? .17 : .2) + big*.3 + Math.sin(bob)*.01 - melee*.1, (gun.glb ? -.15 : -.17) - big*.6 + Math.abs(Math.cos(bob))*.008 - rp*.2 - sw*.4 - recoil*.01, (gun.glb ? -.33 : -.36) - big + recoil*.06 - melee*.18);
            gun.grp.rotation.set(recoil*.09 - rp*.7 - melee*.4, Math.PI/2 + .1 + rp*.3, -rp*.35 + melee*.5);
            if(gun.spin) gun.spin.rotation.x += dt*spinUp*40;
            var on = flash > 0 && !reloading; gun.flash.forEach(function(f){ f.visible = on; if(on){ f.rotation.x = Math.random()*6.28; var s = .7 + Math.random()*.7; f.scale.set(s, s, 1); } }); gun.light.intensity = on ? 3.5 : 0; }
          /* the dead */
          zombies.forEach(function(z){ z.m.grp.position.set(z.x, z.fy2 + (z.climb || 0), z.y); z.m.grp.rotation.y = z.face; animZombie(z, dt, t); if(z.m.light) z.m.light.intensity = z.dead ? Math.max(0, z.deadT/z.deadT0)*1.4 : 1.5 + Math.sin(t*9 + z.x)*.5; });
          if(attract && attract.z){ var az = attract.z; az.m.grp.position.set(az.x, az.fy2, az.y); az.m.grp.rotation.y = az.face; animZombie(az, dt, t); }
          /* grenades, pickups */
          grenades.forEach(function(gr){ gr.m.position.set(gr.x, gr.z, gr.y); gr.m.rotation.x += dt*6; });
          pickups.forEach(function(p){ if(!p.m){ var mat = new THREE.MeshStandardMaterial({ color:PU_DEF[p.kind].col, emissive:PU_DEF[p.kind].col, emissiveIntensity:1.6 }); p.m = new THREE.Mesh(puGeo, mat); scene.add(p.m); var sm = new THREE.SpriteMaterial({ map:puTex[p.kind], transparent:true, depthWrite:false }); p.lbl = new THREE.Sprite(sm); p.lbl.scale.set(1.2, .3, 1); scene.add(p.lbl); } var py = floorAt(p.x|0, p.y|0) + .9 + Math.sin(t*3 + p.x)*.08; p.m.position.set(p.x, py, p.y); p.m.rotation.y += dt*2; p.lbl.position.set(p.x, py + .4, p.y); p.m.visible = p.lbl.visible = !(p.t < 5 && Math.floor(t*6) % 2); });
          /* gates roll up */
          Object.keys(world.doors).forEach(function(k){ var d = world.doors[k]; if(!d.open || !d.grp.visible) return; d.open += dt; var k2 = Math.min(1, d.open/1.1), rk = 1 - Math.pow(1 - k2, 2);
            if(d.slats){ d.gate.scale.y = 1 - rk*.94; if(d.lock){ d.lock.position.y = (d.lock.userData.y0 || .3) - Math.min(1, k2*3)*.28; d.lock.visible = k2 < .5; } }
            else { d.gate.position.y = d.y0 + rk*(d.h - .2); d.gate.scale.y = 1 - rk*.92; }
            d.signs.forEach(function(sg){ sg.visible = k2 < .25; }); if(k2 < 1 && Math.random() < .5) sparks.add(d.grp.position.x + rnd(-.4, .4), d.h - .1, d.grp.position.z + rnd(-.1, .1), 0, rnd(-.6, -.1), 0, rnd(.2, .4), '#999', 3); if(k2 >= 1) d.grp.visible = false; });
          /* the box */
          var bm = world.machines.box; if(bm){ var open = (boxRoll > 0 || bearT > 0) && bm.here, rest = bm.lidRest || 0; bm.lid.rotation.x += ((open ? rest - 1.9 : rest) - bm.lid.rotation.x)*Math.min(1, dt*8); if(bm.gem) bm.gem.material.emissiveIntensity = open ? 3 + Math.sin(t*12) : 1.4;
            if(bm.beam){ bm.beam.visible = open; if(open){ bm.beam.rotation.y += dt*1.3; var bs = .62 + Math.sin(t*6)*.04; bm.beam.scale.set(bs, 1 + Math.min(1, (boxRoll > 0 ? 1 - boxRoll/BOX_T : 1)*2)*.2, bs); } }
            if(bearShow && bm.bear){ var bk = clamp(1 - bearT/3.4, 0, 1); bm.bear.visible = true; bm.bear.rotation.y += dt*2.6; bm.bear.position.y = bm.bearY0 + Math.min(1, bk*1.8)*.6 + Math.sin(t*3)*.03 + Math.max(0, bk - .75)*6; }
            if(open && !bearShow){ var prog = clamp(1 - boxRoll/BOX_T, 0, 1); Object.keys(boxGuns).forEach(function(k){ var bg = boxGuns[k].grp; if(!bg.visible) return; bg.position.set(BOXM.x, floorAt(BOXM.x|0, BOXM.y|0) + .95 + Math.min(1, prog*3)*.5 + Math.sin(t*3)*.04, BOXM.y); bg.rotation.y += dt*(2 + 8*(1 - prog)); }); if(Math.random() < .6) sparks.add(BOXM.x + rnd(-.3, .3), floorAt(BOXM.x|0, BOXM.y|0) + .6, BOXM.y + rnd(-.3, .3), 0, rnd(1, 2.4), 0, rnd(.4, .8), '#8cc7ff', -1); } }
          /* the Forge: tray in, the press comes down with the coils at white heat, sparks, tray out with the forged gun */
          var fm = world.machines.forge; if(fm && forgeT > 0){ forgeT -= dt; var fk = clamp(1 - forgeT/2.6, 0, 1), press = Math.sin(clamp((fk - .22)/.56, 0, 1)*Math.PI), heat = Math.max(0, 1 - Math.abs(fk - .5)*5), trayK = (1 - clamp(fk/.2, 0, 1)) + clamp((fk - .8)/.2, 0, 1);
            if(fm.tray) fm.tray.position.z = fm.trayZ0 + trayK*.42; if(fm.press) fm.press.position.y = fm.pressY0 - press*.44;
            (fm.glowMats || []).forEach(function(mt){ mt.emissiveIntensity = (mt.userData.base || 1.6)*(1 + heat*4); }); if(fm.mouth) fm.mouth.material.emissiveIntensity = 2.6 + heat*8;
            if(press > .95 && Math.random() < .8) sparks.add(fm.x + rnd(-.3, .3), floorAt(fm.x|0, fm.y|0) + 1.0, fm.y + rnd(-.3, .3), rnd(-2.5, 2.5), rnd(1, 4), rnd(-2.5, 2.5), rnd(.2, .5), '#ffd27a', 7);
            if(forgeT <= 0){ if(fm.tray) fm.tray.position.z = fm.trayZ0; if(fm.press) fm.press.position.y = fm.pressY0; setPanel(fm, power); } }
          /* the vendors: a bottle drops into the tray and the panel flickers while it pours */
          Object.keys(vendT).forEach(function(k){ if(vendT[k] <= 0) return; vendT[k] -= dt; var vm = world.machines[k]; if(!vm) return; var vk = 1 - vendT[k]/1.6;
            if(vm.bottle){ vm.bottle.visible = vk < .9; vm.bottle.position.y = vm.bottleY0 - Math.min(1, vk*2.4)*.42 + (vk > .42 && vk < .6 ? Math.abs(Math.sin(vk*40))*.02 : 0); }
            if(vm.panel && vm.panel.material) vm.panel.material.emissiveIntensity = vendT[k] <= 0 ? 1.4 : 1.4 + Math.sin(vk*26)*.9; });
          /* the power: the lever comes over and a surge runs down the tubes */
          if(powerSweep < 1.2){ powerSweep += dt*.5; if(world.power && world.power.lever) world.power.lever.rotation.x = .9 - 1.8*Math.min(1, powerSweep*3.5); }
          if(chunk && chunk.t === 'tunnel') world.signals.forEach(function(sg){ var on = Math.sin(t*2.2 + sg.ph*2.1) > -.35; sg.m.emissiveIntensity = on ? 2.5 : .2; sg.l.intensity = on ? 1.6 : .15; });
          var wt = world.train; if(wt){ var dk2 = train ? train.doors : 0; wt.doors.forEach(function(dr){ dr.position.x = dr.userData.x0 + dr.userData.side*dk2*.72; }); var cab = riding ? 1 : (train && train.doors > .05 ? train.doors : 0); wt.cabin.intensity = cab*.55; wt.carLights.forEach(function(cl){ cl.intensity = cab*1.5; }); if(train) wt.cabin.position.x = clamp(P.x - train.x, 0, wt.nose); }   /* the car light follows you down the consist */
          if(fadeEl) fadeEl.style.opacity = fade;
          /* lights: one tube stutters, the work lamps breathe, explosions fade */
          if(!flickTube && world.tubes.length){ var lit = world.tubes.filter(function(o){ return o.light; }); flickTube = lit[(Math.random()*lit.length)|0]; }
          world.tubes.forEach(function(o){ var off = o === flickTube && flick, srg = powerSweep < 1.2 ? Math.max(0, 1 - Math.abs(o.x/MW - (powerSweep - .1))*5) : 0; o.mesh.material = off ? M.tubeOff : M.tube; if(o.light) o.light.intensity = off ? o.base*.12 : o.base*(1 + srg*1.6); });
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
        endCard:function(st){ endCard(st); },
        menu:function(on){ api.canvas.classList.toggle('cctv', on); if(hudEl) hudEl.hidden = true; if(menuEl){ menuEl.hidden = !on; if(on) showPanel('main'); } if(gun) gun.grp.visible = !on; },
        dispose:function(){ if(gun){ camera.remove(gun.grp); gun.dispose(); } Object.keys(boxGuns).forEach(function(k){ boxGuns[k].dispose(); }); blood.dispose(); sparks.dispose(); tracers.dispose(); beams.dispose(); decals.dispose(); grenGeo.dispose(); puGeo.dispose(); world.dispose.forEach(function(o){ if(o.dispose) o.dispose(); }); scene.traverse(function(o){ if(o.geometry && o.geometry.dispose) o.geometry.dispose(); }); composer.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch(e){} } };
      function floorAt2(x, z){ return floorAt(x|0, z|0); }
      function clearActors(){ (zombies || []).forEach(function(z){ scene.remove(z.m.grp); z.m.mats.forEach(function(m){ m.dispose(); }); }); (grenades || []).forEach(function(gr){ scene.remove(gr.m); }); (pickups || []).forEach(function(p){ R.pickupGone(p); }); }
      function setPanel(m, on){ if(m.panel && m.panel.material) m.panel.material.emissiveIntensity = on ? 1.4 : .05; if(m.mouth) m.mouth.material.emissiveIntensity = on ? 2.6 : .25; (m.glowMats || []).forEach(function(mt){ mt.emissiveIntensity = on ? (mt.userData.base || 1.6) : .12; }); }
      function setPower(on){ if(!world.power) return; var lm = world.power.lamp && world.power.lamp.material; if(lm){ lm.emissive.setHex(on ? 0x30ff60 : 0xff2020); lm.color.setHex(on ? 0x40ff70 : 0xff3030); } if(world.power.lever) world.power.lever.rotation.x = on ? -.9 : .9; }
      /* the chunk as the run remembers it: gates the player paid for are already up (the game re-opens them through openDoor), machines lit only with the power */
      function paintWorld(){ Object.keys(world.doors).forEach(function(k){ var d = world.doors[k]; d.grp.visible = true; d.open = 0; d.gate.scale.y = 1; d.gate.position.y = d.y0; d.signs.forEach(function(sg){ sg.visible = true; }); if(d.lock){ d.lock.visible = true; d.lock.position.y = d.lock.userData.y0 === undefined ? (d.lock.userData.y0 = d.lock.position.y) : d.lock.userData.y0; } });
        Object.keys(world.machines).forEach(function(k){ setPanel(world.machines[k], !!power); }); setPower(!!power); bearShow = false; }
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
      /* the fade to black between chunks and the end-of-shift card sit outside the HUD so they show whatever the HUD is doing */
      fadeEl = document.createElement('div'); fadeEl.className = 'ns-fade'; fadeEl.style.opacity = 0;
      endEl = document.createElement('div'); endEl.className = 'ns-end gm-ui'; endEl.hidden = true;
      endEl.innerHTML = '<div class="ns-end-in"><small>NIGHT SHIFT</small><b>YOU DID NOT MAKE THE LAST TRAIN</b><span data-endwhy></span><div class="ns-end-grid" data-endgrid></div><p>click or press a key</p></div>';
      var ov2 = api.stage.querySelector('.gm-over'); if(ov2){ api.stage.insertBefore(fadeEl, ov2); api.stage.insertBefore(endEl, ov2); } else { api.stage.appendChild(fadeEl); api.stage.appendChild(endEl); }
    })();
    function endCard(st){ if(!endEl) return; if(!st){ endEl.hidden = true; return; } var row = function(k, v){ return '<div><span>'+k+'</span><b>'+v+'</b></div>'; };
      endEl.querySelector('[data-endwhy]').textContent = st.why+' on wave '+st.wave;
      endEl.querySelector('[data-endgrid]').innerHTML = row('Kills', st.kills)+row('Headshots', st.heads)+row('Wave reached', st.wave)+row('Points earned', st.points)+row('Stations reached', st.stations+' of '+STATIONS.length)+row('Rides taken', st.rode)+row('Tunnel stretches walked', st.walked)+row('Best night', st.best && st.best.pts > st.points ? 'wave '+st.best.wave+'  \u00b7  '+st.best.pts+' pts' : 'this one');
      endEl.hidden = false; }
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
      setT('wave', special ? 'THE WRAITHS' : 'WAVE '+(wave < 10 ? '0'+wave : wave)); var inf = alive + toSpawn; setT('inf', riding ? 'IN TRANSIT' : inf ? inf+' INFECTED' : 'CLEAR'); setT('kills', kills+' kill'+(kills === 1 ? '' : 's')+'  \u00b7  '+(riding ? 'to '+nextName() : CUR.tunnel ? 'the tunnel' : CUR.name)+(snd.isMuted() ? '  \u00b7  muted' : ''));
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
    g.key = function(k, down){ if(ended){ if(down) backToMenu(); return true; } if(over || dying) return false; var K = k.length === 1 ? k.toLowerCase() : k;
      if(mode === 'menu') return down ? menuKey(K) : false;
      var map = { ArrowLeft:'L', ArrowRight:'R', ArrowUp:'W', ArrowDown:'S', w:'W', s:'S', a:'A', d:'D', Shift:'sprint', x:'F' }[K];
      if(map){ held[map] = down; if(map === 'F' && down) trigger = true; return true; }
      if(!down) return false;
      if(K === ' '){ jump(); return true; }
      if(K === 'r'){ reload(); return true; } if(K === 'f' || K === 'e' || K === 'Enter'){ interact(); return true; } if(K === 'q'){ swapTo(1 - slot); return true; }
      if(K === '1' || K === '2'){ swapTo(+K - 1); return true; }
      if(K === 'g'){ throwGrenade(); return true; } if(K === 'v'){ doMelee(); return true; } if(K === 'm'){ say(snd.toggle() ? 'Sound off' : 'Sound on', 1); return true; }
      return false; };
    g.pointer = function(type, x, y, e){ if(ended){ if(type === 'down') backToMenu(); return; } if(over || dying || mode === 'menu') return;
      if(type === 'down'){ if(e && e.button === 2){ doMelee(); return; } mouseDown = true; trigger = true; dragX = e ? e.clientX : null; dragY = e ? e.clientY : null; if(e && e.pointerType === 'mouse' && !document.pointerLockElement){ var el = e.currentTarget || e.target; try { var p = el && el.requestPointerLock && el.requestPointerLock(); if(p && p.catch) p.catch(function(){}); } catch(x){} } }
      else if(type === 'up'){ mouseDown = false; dragX = null; dragY = null; }
      else if(type === 'move' && e){ if(document.pointerLockElement){ P.a += (e.movementX || 0) * .0022 * SET.sens; P.p = clamp(P.p - (e.movementY || 0) * .0022 * SET.sens * (SET.inv ? -1 : 1), -1.25, 1.25); } else if(dragX !== null && e.pointerType === 'touch'){ P.a += (e.clientX - dragX) * .006; P.p = clamp(P.p - (e.clientY - dragY) * .005, -1.25, 1.25); dragX = e.clientX; dragY = e.clientY; } } };
    /* settings live on the title and pause cards: the framework rebuilds those, so listen on the stage */
    var onSet = function(e){ var el = e.target; if(!el || !el.getAttribute || !el.getAttribute('data-set')) return; var k = el.getAttribute('data-set'), v = el.value; if(k === 'inv') SET.inv = !!el.checked; else if(k === 'gfx'){ if(GFX.indexOf(v) < 0) return; SET.gfx = v; } else SET[k] = clamp(+v, k === 'sens' ? .3 : k === 'fov' ? 60 : 0, k === 'sens' ? 2.5 : k === 'fov' ? 110 : 1); saveSet(); R.applySettings(); var out = el.parentNode && el.parentNode.querySelector('output'); if(out) out.textContent = k === 'fov' ? SET.fov+'\u00b0' : k === 'vol' ? Math.round(SET.vol*100)+'%' : k === 'sens' ? SET.sens.toFixed(1) : k === 'inv' ? (SET.inv ? 'on' : 'off') : SET.gfx; };
    api.stage.addEventListener('input', onSet); api.stage.addEventListener('change', onSet);
    var wheelT = 0, onWheel = function(e){ if(mode !== 'play' || over) return; e.preventDefault(); var now = Date.now(); if(now - wheelT < 160 || Math.abs(e.deltaY) < 1) return; wheelT = now; swapTo(1 - slot); };   /* two guns, so any notch flips to the other one */
    api.stage.addEventListener('wheel', onWheel, { passive:false });
    var onModel = function(k, sc){ if(k === 'train' && R && R.world && R.world.setTrain) R.world.setTrain(sc); }; MODELS.listeners.push(onModel);
    g.destroy = function(){ try { if(document.pointerLockElement) document.exitPointerLock(); } catch(e){} var li = MODELS.listeners.indexOf(onModel); if(li >= 0) MODELS.listeners.splice(li, 1); api.stage.removeEventListener('input', onSet); api.stage.removeEventListener('change', onSet); api.stage.removeEventListener('wheel', onWheel); if(hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl); if(menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl); [fadeEl, endEl].forEach(function(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }); dropAttract(); snd.close(); if(R) R.dispose(); R = null; };
    /* ---------- what the tests read ---------- */
    function gunScreen(){ if(!gun || !R) return null; var v = gun.grp.localToWorld(tmpV.copy(gun.grip)).project(R.camera), ax = (v.x + 1)/2*vw, ay = (1 - v.y)/2*vh; v = gun.grp.localToWorld(tmpV.copy(gun.mz)).project(R.camera); return { ax:ax, ay:ay, mx:(v.x + 1)/2*vw, my:(1 - v.y)/2*vh, W:vw, H:vh }; }
    g.peek = function(){ return { station:chunk && chunk.t === 'station' ? STATIONS[chunk.i].id : null, stationName:CUR ? CUR.name : null, chunk:chunk ? (chunk.t === 'station' ? 'station:'+chunk.i : 'tunnel:'+chunk.from+':'+chunk.seg) : null, tunnel:!!(CUR && CUR.tunnel), visited:Object.keys(visited).length,
      riding:riding, onTrain:mode === 'play' ? onTrain() : false, doorsOpen:train ? +train.doors.toFixed(2) : 0, transit:transit, conductor:conductor ? { x:+conductor.x.toFixed(1), hp:conductor.hp } : null, fade:+fade.toFixed(2), rode:rode, walked:walked,
      boxAt:boxAt, boxHere:!!(BOXM && BOXM.here), boxUses:boxUses[CUR ? CUR.id : ''] || 0, boxPool:boxSpin ? boxSpin.length : 0, bear:+bearT.toFixed(2), dying:+dying.toFixed(2), ended:ended, end:stats, heads:heads, spinUp:+spinUp.toFixed(2), weaponIds:Object.keys(WEAPONS).length,
      special:special, fogK:+fogK.toFixed(2), wave:wave, kills:kills, points:points, total:total, hp:hp, alive:alive, toSpawn:toSpawn, zombies:zombies.length, weapon:stat(cur()).name, mag:cur().mag, res:cur().res, doors:Object.keys(doors).length, power:power, perks:Object.keys(perks), x:P.x, y:P.y, a:P.a, pitch:P.p, footY:+footY.toFixed(2), over:over, overMsg:overMsg, between:+between.toFixed(2), reloading:reloading, swap:+swapT.toFixed(3), boxRoll:+boxRoll.toFixed(2), boxName:boxName, prompt:prompt ? prompt.txt : null, promptCost:prompt ? prompt.cost : null, dmg:stat(cur()).dmg, beams:R ? R.beamsLive() : 0, gun:gunScreen(), gren:gren, puX2:+puX2.toFixed(1), puInsta:+puInsta.toFixed(1), soft:R ? R.soft() : null, bloom:R ? R.bloom.enabled : null, lights:R ? R.world.lights.filter(function(o){ return o.l.visible; }).length : 0, gfx:SET.gfx, fov:SET.fov, sens:SET.sens, train:train ? { state:train.state, x:+train.x.toFixed(1), v:+train.v.toFixed(2), nose:+(train.x + train.nose).toFixed(1), visible:train.grp.visible, next:+train.next.toFixed(1) } : null, banner:bannerT > 0 ? banner : '', gates:R ? Object.keys(R.world.doors).filter(function(k){ return R.world.doors[k].grp.visible; }).length : 0, hud:hudEl ? !hudEl.hidden : false, models:{ wraith:!!MODELS.wraith, train:!!MODELS.train, zombie:!!MODELS.zombie, guns:!!MODELS.guns, props:!!MODELS.props, trainLive:!!(R && R.world.train.model), gunGlb:!!(R && R.gunGlb()), failed:MODELS.failed }, mode:mode, menu:menuEl ? { open:!menuEl.hidden, panel:menuPanel, sel:menuSel, item:menuItems()[menuSel] ? menuItems()[menuSel].getAttribute('data-act') : null, clock:menuEl.querySelector('[data-clock]').textContent, attract:attract && attract.z ? { x:+attract.z.x.toFixed(2), y:+attract.z.y.toFixed(2), phase:attract.z.phase } : null, cctv:api.canvas.classList.contains('cctv') } : null, jump:+jumpZ.toFixed(2), vz:+vz.toFixed(2), slot:slot, weapons:weapons.map(function(w){ return stat(w).name; }), photo:A.photo, inv:!!SET.inv,
      list:zombies.map(function(z){ return { x:z.x, y:z.y, hp:z.hp, dead:z.dead, rise:z.rise, brute:z.brute, wraith:z.wraith, runner:z.runner, atk:z.atk, fy:+z.fy2.toFixed(2), glb:!!z.m.glb, kind:z.kind || null, human:!!z.m.human }; }) }; };
    g.dbg = { locate:function(){ return LOCATE; }, tick:function(sec){ var n = Math.round((sec || 1)*60); for(var i = 0; i < n; i++) g.update(1/60); return t; }, station:function(i){ loadChunk({ t:'station', i:((i % STATIONS.length) + STATIONS.length) % STATIONS.length }, null, 0, true); return CUR.id; },
      tunnel:function(k, from){ loadChunk({ t:'tunnel', from:from === undefined ? stationIdx : from, seg:k || 0 }, { x:MW/2, y:TRACK_Z + .5 }, 0, true); return CUR.id; },
      stations:function(){ return STATIONS.map(function(d){ return d.id; }); }, ride:function(){ if(!train) return null; train.grp.visible = true; train.state = 'stopped'; train.x = STATION.x1 - 1.5 - train.nose; train.v = 0; train.doors = 1; train.t = 2; train.released = true; train.closed = false; P.x = train.x + train.nose*.5; P.y = TRACK_Z; footY = TRAIN_FLOOR; return { x:+P.x.toFixed(1), aboard:onTrain() }; },
      board:function(){ board(); return riding; }, arrive:function(){ if(riding === 1){ riding = 2; fade = 1; fadeTo = 1; } return riding; },
      die:function(){ hurt(1e6, 'Overrun'); return dying; }, endNow:function(){ if(dying > 0){ dying = 0; showEnd(); } return stats; }, menuNow:function(){ backToMenu(); return mode; },
      box:function(){ if(BOXM) BOXM.here = true; openBox(); return boxSpin.slice(); }, bear:function(){ var id = STATIONS[stationIdx].id; boxUses[id] = 40; if(BOXM) BOXM.here = true; boxSpin = boxPool(); boxBear = true; boxPick = boxSpin[0]; boxRoll = BOX_T; R.boxOpen(true); return true; },
      boxPool:function(){ return boxPool(); }, body:function(kind, x, y, face){ var m = makeZombie(0, false, kind), z = { x:x, y:y, tx:x, ty:y, fx:x, fy:y, hp:9999, maxhp:9999, speed:0, dmg:0, brute:kind === 'brute', wraith:kind === 'wraith', runner:kind === 'runner', kind:kind, v:0, anim:Math.random()*6, rise:0, rise0:1, stairs:false, atk:0, cool:0, dead:false, deadT:0, deadT0:2.2, flash:0, m:m, r:m.r, h:m.h, headY:m.headY, fy2:floorAt(x|0, y|0), face:face || 0, fallDir:1, hold:true }; m.grp.position.set(x, z.fy2, y); R.scene.add(m.grp); zombies.push(z); alive++; return { glb:!!m.glb, human:!!m.human, kind:m.kind }; }, conductor:function(){ condT = .01; return !!conductor; }, transit:function(){ releaseTransit(); return transit; }, pass:function(){ if(train){ train.state = 'away'; train.next = .01; } return true; }, model:function(k, buf, cb){ parseModel(k, buf, cb); }, models:function(){ return MODELS; }, scene:function(){ return R.scene; }, attract:function(){ if(attract){ attract.next = 0; } }, map:function(){ return MAP.map(function(r){ return r.join(''); }); }, points:function(n){ points += n; }, clear:function(){ toSpawn = 0; zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; } }); alive = 0; }, give:function(id, up){ giveWeapon(id); if(up){ cur().up = true; var st = stat(cur()); cur().mag = st.mag; cur().res = st.res; R.gunFor(cur()); } },
      teleport:function(x, y, a, p){ P.x = x; P.y = y; if(a !== undefined) P.a = a; if(p !== undefined) P.p = p; footY = floorAt(x|0, y|0); }, killAll:function(){ zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; alive--; } }); alive = Math.max(0, alive); }, wave:function(n){ zombies.forEach(function(z){ if(!z.dead){ z.dead = true; z.deadT = .1; } }); alive = 0; between = 0; startWave(n); }, hurt:function(n){ hurt(n); }, power:function(){ power = true; R.powerOn(); }, train:function(){ if(train){ train.next = 0; if(wave < 2) wave = 2; } }, trainAt:function(x, v, state){ train.grp.visible = true; train.x = x; train.v = v; train.state = state || 'coming'; }, gfx:function(t){ SET.gfx = t; R.applySettings(); }, spawnAt:function(x, y, hold){ var s = { x:x, y:y, fx:x, fy:y, stairs:false }; var keep = SPAWNS; SPAWNS = [s]; toSpawn++; spawn(); SPAWNS = keep; var z = zombies[zombies.length - 1]; if(z){ z.rise = 0; z.x = x; z.y = y; z.hold = !!hold; } return zombies.length; } };
    return g;
  }

  /* the launcher already knows the name, blurb and icon from the stub in games/14-premium-stubs.js; this is the half that needs the code */
  (window.TIG_REGISTER || function(d){ GAMES.push(d); })({ id:'nightshift', W:W, H:H, ownKeys:true, gl:true, lib:'three', menu:true, make:nightshift });
})();

