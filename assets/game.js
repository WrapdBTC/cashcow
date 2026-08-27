(function () {
  "use strict";

  var cowBtn = document.getElementById("cow");
  var clipBtn = document.getElementById("clip");
  var card = document.getElementById("card");
  var lot = document.getElementById("lot");
  var veil = document.getElementById("veil");
  var plate = document.getElementById("plate");
  var lamp = document.getElementById("lamp");
  var crt = document.getElementById("crt");
  var muteBtn = document.getElementById("mute");
  var focused = false;

  function currentTag() {
    return document.querySelector(".tag.on") || document.querySelector(".tag");
  }

  function paintCardFrom(tag) {
    if (!tag) return;
    var breed = tag.getAttribute("data-breed") || "Holstein";
    var grade = tag.getAttribute("data-grade") || "Whole";
    var w = tag.getAttribute("data-w") || "1.6×";
    var sacred = tag.getAttribute("data-sacred") !== "0";
    var listed = tag.getAttribute("data-listed") === "1";
    var el;
    el = document.getElementById("card-breed");
    if (el) el.textContent = breed.toUpperCase();
    el = document.getElementById("card-grade");
    if (el) el.textContent = grade;
    el = document.getElementById("card-w");
    if (el) el.textContent = w;
    el = document.getElementById("card-sacred");
    if (el) {
      el.textContent = sacred ? "Sacred" : "No Sacred";
      el.classList.toggle("off", !sacred);
    }
    if (plate) plate.textContent = breed.toUpperCase();
    var art = document.getElementById("cow-art");
    if (art) art.alt = breed;
    if (cowBtn) cowBtn.classList.toggle("matt", listed);
    if (lamp) lamp.classList.toggle("hot", listed);
  }

  function closeSheets() {
    if (card) card.hidden = true;
    if (lot) lot.hidden = true;
    if (veil) veil.hidden = true;
    if (cowBtn) cowBtn.setAttribute("aria-expanded", "false");
    if (clipBtn) clipBtn.setAttribute("aria-expanded", "false");
  }

  function openSheet(which) {
    closeSheets();
    if (veil) veil.hidden = false;
    if (which === "card" && card) {
      paintCardFrom(currentTag());
      card.hidden = false;
      if (cowBtn) cowBtn.setAttribute("aria-expanded", "true");
    }
    if (which === "lot" && lot) {
      lot.hidden = false;
      if (clipBtn) clipBtn.setAttribute("aria-expanded", "true");
    }
  }

  if (cowBtn) {
    cowBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      blurCrt();
      if (card && !card.hidden) closeSheets();
      else openSheet("card");
    });
  }
  if (clipBtn) {
    clipBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      blurCrt();
      if (lot && !lot.hidden) closeSheets();
      else openSheet("lot");
    });
  }
  if (veil) veil.addEventListener("click", function () { closeSheets(); });

  document.querySelectorAll(".tag").forEach(function (tag) {
    tag.addEventListener("click", function (e) {
      e.stopPropagation();
      document.querySelectorAll(".tag").forEach(function (t) { t.classList.remove("on"); });
      tag.classList.add("on");
      paintCardFrom(tag);
    });
  });
  paintCardFrom(currentTag());

  function blurCrt() {
    focused = false;
    if (crt) crt.classList.remove("is-live");
  }
  function focusCrt() {
    focused = true;
    if (crt) {
      crt.classList.add("is-live");
      try { crt.focus(); } catch (e) {}
    }
  }
  if (crt) {
    crt.addEventListener("pointerdown", function (e) {
      if (e.target && e.target.id === "mute") return;
      closeSheets();
      focusCrt();
      armSound();
    });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeSheets();
      blurCrt();
    }
  });

  /* ---------- idle CRT (no runner) ---------- */
  var muted = true;
  var armed = false;
  var actx = null;
  var hum = null;

  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function setMuteLabel() {
    if (!muteBtn) return;
    muteBtn.textContent = muted ? "MUTE" : "SOUND";
    muteBtn.classList.toggle("hot", !muted);
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  }
  setMuteLabel();

  function stopHum() {
    if (hum) {
      try { hum.gain.gain.setValueAtTime(0, actx.currentTime); } catch (e) {}
      hum = null;
    }
  }
  function startHum() {
    stopHum();
    if (muted) return;
    var a = audio();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = "sine";
    o.frequency.value = 78;
    g.gain.value = 0.012;
    o.connect(g);
    g.connect(a.destination);
    o.start();
    hum = { osc: o, gain: g };
  }
  function armSound() {
    audio();
    if (!armed) {
      muted = false;
      armed = true;
      setMuteLabel();
      startHum();
    }
  }
  if (muteBtn) {
    muteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio();
      muted = !muted;
      armed = true;
      setMuteLabel();
      if (muted) stopHum();
      else startHum();
    });
  }
  document.addEventListener("pointerdown", function () {
    if (!armed) armSound();
  }, true);

  var canvas = document.getElementById("line");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var W = 320, H = 200;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  var INK = "#2a180c", PAPER = "#fffcf3", TIE = "#2f6de0";
  var GOLD = "#c9921f", GOLDP = "#f3d789", BROWN = "#6b3a18";
  var PINK = "#e89a8a", CRT = "#0c140e", WALL = "#1a241c";
  var FLOOR = "#cbb890", STEEL = "#8a9aa8", STEEL2 = "#6d7c88";
  var PHOS = "#7ee08a";
  var frame = 0;

  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }
  var GLYPH = {
    "0": "111101101101111", "O": "111101101101111", "N": "101111111101101",
    "T": "111010010010010", "H": "101101111101101", "E": "111100111100111",
    "L": "100100100100111", "I": "111010010010111", " ": "000000000000000",
    "A": "010101111101101", "M": "101111101101101", "K": "101101110101101"
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
          if (g.charAt(r * 3 + c) === "1") ctx.fillRect(cx + c * px, y + r * px, px, px);
        }
      }
      cx += 4 * px;
    }
  }
  function drawCow(x, y, blink) {
    var p = 2, ox = Math.floor(x), oy = Math.floor(y) - 22;
    function px(ix, iy, w, h, c) { rect(ox + ix * p, oy + iy * p, w * p, h * p, c); }
    rect(ox + 4, Math.floor(y) - 2, 22, 2, "rgba(0,0,0,.35)");
    px(3, 4, 9, 6, PAPER);
    px(5, 4, 4, 3, BROWN);
    px(3, 7, 9, 3, PAPER);
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
    px(4, 10, 2, 3, INK);
    px(9, 10, 2, 2, INK);
  }

  function draw() {
    frame++;
    rect(0, 0, W, H, CRT);
    rect(0, 0, W, 160, WALL);
    rect(0, 12, W, 5, STEEL2);
    for (var x = 8; x < W; x += 56) {
      rect(x + 10, 12, 6, 6, STEEL);
      rect(x + 12, 18, 3, 22, STEEL);
      rect(x, 44, 3, 108, "#141c16");
      rect(x + 3, 70, 18, 3, STEEL2);
    }
    rect(0, 160, W, 8, BROWN);
    rect(0, 168, W, 32, FLOOR);
    for (var i = 0; i < W; i += 16) rect(i, 168, 1, 32, INK);

    var bob = ((frame >> 5) & 1) ? 0 : 1;
    var blink = ((frame >> 4) & 1) === 0;
    drawCow(148, 168 - bob, blink);

    drawText("ON THE LINE", 108, 28, 1, PHOS);
    if ((frame >> 5) & 1) rect(248, 28, 6, 6, PHOS);

    /* phosphor wash */
    ctx.fillStyle = "rgba(126,224,138," + (focused ? "0.05" : "0.025") + ")";
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    ctx.imageSmoothingEnabled = false;
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
