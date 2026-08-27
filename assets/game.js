(function () {
  "use strict";

  var canvas = document.getElementById("milk-run");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var W = 384;
  var H = 128;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  var HS_KEY = "cashcows-milk-run";
  var BOARD_KEY = "cashcows-milk-run-board";
  var GROUND = 108;

  var INK = "#2a180c";
  var PAPER = "#fffcf3";
  var CREAM = "#f8f0d8";
  var TIE = "#2f6de0";
  var GOLD = "#c9921f";
  var GOLDP = "#f3d789";
  var BROWN = "#6b3a18";
  var PINK = "#e89a8a";
  var MUG = "#c45c2a";
  var CRT = "#0e1610";
  var WALL = "#2a3228";
  var FLOOR = "#cbb890";
  var STEEL = "#8a9aa8";
  var STEEL2 = "#6d7c88";

  var state = "boot";
  var bootT = 0;
  var frame = 0;
  var score = 0;
  var coffee = 0;
  var best = 0;
  try { best = parseInt(localStorage.getItem(HS_KEY) || "0", 10) || 0; } catch (e) { best = 0; }

  var speed = 2;
  var spawn = 0;
  var dist = 0;
  var cam = 0;
  var cow = { x: 34, y: GROUND, vy: 0, w: 26, h: 20, on: true };
  var things = [];
  var muted = true;
  var armed = false;
  var actx = null;
  var muteBtn = document.getElementById("mute");

  function setMuteLabel() {
    if (!muteBtn) return;
    muteBtn.textContent = muted ? "MUTED" : "SOUND";
    muteBtn.classList.toggle("hot", !muted);
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  }
  setMuteLabel();

  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function beep(freq, dur, vol) {
    if (muted) return;
    var a = audio();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = vol == null ? 0.07 : vol;
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio();
      muted = !muted;
      armed = true;
      setMuteLabel();
      if (!muted) beep(440, 0.05, 0.05);
    });
  }

  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  var GLYPH = {
    "0": "111101101101111",
    "1": "010110010010111",
    "2": "111001111100111",
    "3": "111001111001111",
    "4": "101101111001001",
    "5": "111100111001111",
    "6": "111100111101111",
    "7": "111001001001001",
    "8": "111101111101111",
    "9": "111101111001111",
    " ": "000000000000000",
    "S": "111100111001111",
    "C": "111100100100111",
    "O": "111101101101111",
    "R": "111101110101101",
    "E": "111100111100111",
    "B": "110101110101110",
    "T": "111010010010010",
    "A": "010101111101101",
    ".": "000000000000010",
    ":": "000010000010000",
    "-": "000000111000000",
    "M": "101111101101101",
    "I": "111010010010111",
    "L": "100100100100111",
    "K": "101101110101101",
    "U": "101101101101111",
    "N": "101111111101101",
    "W": "101101101111010",
    "H": "101101111101101",
    "F": "111100111100100",
    "P": "111101111100100",
    "V": "101101101101010",
    "Y": "101101010010010",
    "G": "111100101101111",
    "D": "110101101101110",
    "J": "001001001101010",
    "X": "101101010101101",
    "/": "001001010100100",
    "×": "101010111010101",
    "·": "000000010000000"
  };

  function drawText(str, x, y, px, col) {
    px = px || 1;
    ctx.fillStyle = col || PAPER;
    var cx = x;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i).toUpperCase();
      if (ch === " ") { cx += 4 * px; continue; }
      var g = GLYPH[ch];
      if (!g) { cx += 4 * px; continue; }
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (g.charAt(r * 3 + c) === "1") {
            ctx.fillRect(cx + c * px, y + r * px, px, px);
          }
        }
      }
      cx += 4 * px;
    }
  }

  function drawCow(x, y, fr, blink) {
    var p = 2;
    var ox = Math.floor(x);
    var oy = Math.floor(y) - 22;
    function px(ix, iy, w, h, c) {
      rect(ox + ix * p, oy + iy * p, w * p, h * p, c);
    }
    rect(ox + 4, Math.floor(y) - 2, 22, 2, "rgba(0,0,0,.35)");
    px(3, 4, 9, 6, PAPER);
    px(5, 4, 4, 3, BROWN);
    px(3, 7, 9, 3, PAPER);
    px(4, 8, 7, 1, "#dfe6f2");
    px(11, 3, 5, 5, PAPER);
    px(12, 4, 2, 2, BROWN);
    px(15, 5, 2, 2, PINK);
    px(13, 4, 1, 1, blink ? PAPER : INK);
    px(12, 2, 2, 1, INK);
    px(14, 1, 1, 2, INK);
    px(16, 2, 1, 1, INK);
    px(11, 8, 3, 1, TIE);
    px(12, 9, 1, 3, TIE);
    px(2, 5, 2, 1, INK);
    px(1, 6, 1, 2, BROWN);
    if (fr === 0) {
      px(4, 10, 2, 3, INK);
      px(9, 10, 2, 2, INK);
    } else {
      px(5, 10, 2, 2, INK);
      px(8, 10, 2, 3, INK);
    }
  }

  function drawStool(x, y) {
    var ox = Math.floor(x);
    var base = Math.floor(y);
    rect(ox + 2, base - 12, 14, 4, INK);
    rect(ox + 3, base - 11, 12, 2, BROWN);
    rect(ox + 4, base - 8, 2, 8, INK);
    rect(ox + 12, base - 8, 2, 8, INK);
    rect(ox + 7, base - 8, 3, 8, STEEL2);
  }

  function drawChair(x, y) {
    var ox = Math.floor(x);
    var base = Math.floor(y);
    rect(ox + 2, base - 22, 3, 16, INK);
    rect(ox + 3, base - 21, 1, 14, STEEL);
    rect(ox + 2, base - 10, 14, 3, INK);
    rect(ox + 3, base - 9, 12, 1, BROWN);
    rect(ox + 4, base - 7, 2, 7, INK);
    rect(ox + 12, base - 7, 2, 7, INK);
  }

  function drawMug(x, y, steam) {
    var ox = Math.floor(x);
    var oy = Math.floor(y);
    rect(ox, oy, 8, 8, MUG);
    ctx.strokeStyle = INK;
    ctx.strokeRect(ox + 0.5, oy + 0.5, 8, 8);
    rect(ox + 8, oy + 2, 3, 4, INK);
    rect(ox + 1, oy + 1, 6, 2, "#e8d0a0");
    if (steam) {
      rect(ox + 2, oy - 4, 1, 3, PAPER);
      rect(ox + 5, oy - 5, 1, 3, PAPER);
    }
  }

  function resetRun() {
    score = 0;
    coffee = 0;
    speed = 2;
    spawn = 70;
    dist = 0;
    cam = 0;
    things = [];
    cow.y = GROUND;
    cow.vy = 0;
    cow.on = true;
  }

  function jump() {
    if (state === "boot") return;
    if (state === "ready") {
      resetRun();
      state = "run";
      beep(520, 0.06);
      return;
    }
    if (state === "over") {
      state = "ready";
      beep(330, 0.05);
      return;
    }
    if (state === "run" && cow.on) {
      cow.vy = -6.4;
      cow.on = false;
      beep(660, 0.05, 0.06);
    }
  }

  function armSound() {
    audio();
    if (!armed) {
      muted = false;
      armed = true;
      setMuteLabel();
    }
  }

  function onAction(e) {
    if (e && e.target && e.target.id === "mute") return;
    if (e && e.preventDefault) e.preventDefault();
    armSound();
    jump();
  }

  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      armSound();
      jump();
    }
  });
  canvas.addEventListener("pointerdown", onAction);

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnThing() {
    var r = Math.random();
    if (r < 0.38) {
      things.push({ kind: "stool", x: W + 8, y: GROUND, w: 16, h: 14, hit: true });
    } else if (r < 0.72) {
      things.push({ kind: "chair", x: W + 8, y: GROUND, w: 16, h: 22, hit: true });
    } else {
      things.push({ kind: "mug", x: W + 8, y: GROUND - 28 - Math.floor(Math.random() * 18), w: 10, h: 10, hit: false });
    }
    spawn = 48 + Math.floor(Math.random() * 42) - Math.min(18, score / 40);
  }

  function saveBoard() {
    try {
      if (score > best) {
        best = score;
        localStorage.setItem(HS_KEY, String(best));
      }
      var board = [];
      try { board = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]"); } catch (e) { board = []; }
      if (!Array.isArray(board)) board = [];
      board.unshift({ run: score, coffee: coffee, t: Date.now() });
      localStorage.setItem(BOARD_KEY, JSON.stringify(board.slice(0, 20)));
    } catch (e) {}
  }

  function step() {
    frame++;
    if (state === "boot") {
      bootT++;
      if (bootT > 110) state = "ready";
      return;
    }

    if (state === "run") {
      cam += speed;
      dist += speed;
      score = Math.floor(dist / 4);
      speed = 2 + Math.min(2.4, dist / 1400);
      spawn--;
      if (spawn <= 0) spawnThing();

      cow.vy += 0.42;
      cow.y += cow.vy;
      if (cow.y >= GROUND) {
        cow.y = GROUND;
        cow.vy = 0;
        cow.on = true;
      }

      var hitbox = { x: cow.x + 4, y: cow.y - 18, w: 16, h: 16 };
      for (var i = things.length - 1; i >= 0; i--) {
        var t = things[i];
        t.x -= speed;
        if (t.x < -30) { things.splice(i, 1); continue; }
        var tb = { x: t.x, y: t.y - t.h, w: t.w, h: t.h };
        if (aabb(hitbox, tb)) {
          if (t.kind === "mug") {
            things.splice(i, 1);
            coffee++;
            dist += 40;
            beep(880, 0.07, 0.07);
            beep(1170, 0.05, 0.05);
          } else {
            state = "over";
            saveBoard();
            beep(140, 0.18, 0.09);
          }
        }
      }
    }
  }

  function drawBg() {
    rect(0, 0, W, H, CRT);
    rect(0, 0, W, GROUND - 8, WALL);
    rect(0, 8, W, 5, STEEL2);
    var gx = -((cam | 0) % 56);
    for (var x = gx; x < W + 56; x += 56) {
      rect(x + 10, 8, 6, 6, STEEL);
      rect(x + 12, 14, 3, 22, STEEL);
      rect(x, 36, 3, GROUND - 44, "#1a221c");
      rect(x + 3, 52, 18, 3, STEEL2);
    }
    rect(0, GROUND - 8, W, 8, BROWN);
    rect(0, GROUND, W, H - GROUND, FLOOR);
    var fx = -((cam | 0) % 16);
    for (var i = fx; i < W; i += 16) {
      rect(i, GROUND, 1, H - GROUND, INK);
      rect(i, GROUND + ((i / 16) % 2 ? 8 : 0), 16, 1, "rgba(42,24,12,.25)");
    }
  }

  function drawBoot() {
    rect(0, 0, W, H, "#050806");
    var fr = (frame >> 4) & 1;
    drawCow(W / 2 - 16, 78, fr, false);
    drawText("MILK RUN", 126, 22, 2, GOLDP);
    var barW = Math.min(160, Math.floor(bootT * 1.6));
    rect(112, 92, 160, 8, INK);
    rect(112, 92, barW, 8, TIE);
    ctx.strokeStyle = PAPER;
    ctx.strokeRect(112.5, 92.5, 159, 7);
    drawText("ON THE LINE", 140, 106, 1, PAPER);
  }

  function pad(n, w) {
    var s = String(n);
    while (s.length < w) s = "0" + s;
    return s;
  }

  function drawHUD(dry) {
    drawText("MILK", 6, 4, 1, GOLDP);
    drawText("COFFEE X" + pad(coffee, 2), 78, 4, 1, PAPER);
    drawText("WEIGHT " + pad(score, 4), 178, 4, 1, PAPER);
    drawText("NOT A RETURN", 178, 12, 1, GOLD);
    drawText(dry ? "DRY" : "LINE", 350, 4, 1, dry ? GOLD : TIE);
  }

  function draw() {
    if (state === "boot") {
      drawBoot();
      return;
    }
    drawBg();
    for (var i = 0; i < things.length; i++) {
      var t = things[i];
      if (t.kind === "stool") drawStool(t.x, t.y);
      else if (t.kind === "chair") drawChair(t.x, t.y);
      else drawMug(t.x, t.y - t.h, (frame >> 3) & 1);
    }
    var fr = state === "run" ? (frame >> 3) & 1 : 0;
    var blink = state === "ready" && ((frame >> 4) & 1);
    drawCow(cow.x, cow.y, fr, blink);

    if (state === "ready") {
      rect(70, 28, 244, 44, "rgba(14,22,16,.85)");
      ctx.strokeStyle = GOLD;
      ctx.strokeRect(70.5, 28.5, 243, 43);
      drawText("MILK RUN", 132, 36, 2, GOLDP);
      drawText("SPACE / TAP", 148, 56, 1, PAPER);
      drawHUD(true);
    } else if (state === "over") {
      rect(48, 24, 288, 64, "#050806");
      ctx.strokeStyle = GOLD;
      ctx.strokeRect(48.5, 24.5, 287, 63);
      drawText("DRY", 176, 34, 2, GOLD);
      drawText("COFFEE X" + coffee + "   BEST " + best, 108, 52, 1, GOLDP);
      drawText("SPACE / TAP", 148, 66, 1, PAPER);
    } else {
      drawHUD(false);
    }
  }

  function loop() {
    step();
    ctx.imageSmoothingEnabled = false;
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
