(function () {
  "use strict";

  var CFG = {
    chainId: 4663,
    chainHex: "0x1237",
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    explorer: "https://robinhoodchain.blockscout.com",
    nft: "",
    lot: "",
    milk: ""
  };
  if (window.CASHCOWS) {
    for (var k in window.CASHCOWS) CFG[k] = window.CASHCOWS[k];
  }

  var SEL = {
    balanceOf: "70a08231",
    tokenOfOwnerByIndex: "2f745c59",
    milkWeight: "a6556447",
    gradeOf: "1ac9a7d2",
    onLine: "ecdcefb2",
    milk: "0f6c431e",
    dry: "fe0e2cd6",
    setApprovalForAll: "a22cb465",
    isApprovedForAll: "e985e9c5",
    claim: "6ba4c138",
    pending: "af6e6238",
    topByWeight: "f802f5df",
    claimable: "22d95eac",
    liveW: "349aa51b"
  };

  var GRADES = [
    { id: 0, name: "Skim", w: "1.0\u00d7" },
    { id: 1, name: "2% Milk", w: "1.25\u00d7" },
    { id: 2, name: "Whole", w: "1.6\u00d7" },
    { id: 3, name: "Extra Heavy", w: "2.2\u00d7" },
    { id: 4, name: "Golden", w: "3.5\u00d7" },
    { id: 5, name: "Sacred", w: "5.0\u00d7" }
  ];

  function pad64(hex) {
    hex = String(hex).replace(/^0x/, "").toLowerCase();
    while (hex.length < 64) hex = "0" + hex;
    return hex.slice(-64);
  }
  function encAddr(a) { return pad64(a); }
  function encUint(n) {
    var h = BigInt(n).toString(16);
    return pad64(h);
  }
  function strip(hex) { return String(hex || "0x").replace(/^0x/, ""); }
  function hexToBig(hex) {
    hex = strip(hex);
    if (!hex) return 0n;
    return BigInt("0x" + hex);
  }

  function eth() { return window.ethereum || null; }

  function rpc(method, params) {
    var e = eth();
    if (!e) return Promise.reject(new Error("No wallet"));
    return e.request({ method: method, params: params || [] });
  }

  function call(to, data) {
    if (!to) return Promise.resolve("0x");
    var payload = { to: to, data: data };
    if (eth()) return rpc("eth_call", [payload, "latest"]);
    return fetch(CFG.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [payload, "latest"] })
    }).then(function (r) { return r.json(); }).then(function (j) { return j.result; });
  }

  function send(to, data) {
    return rpc("eth_requestAccounts").then(function (acc) {
      return rpc("eth_sendTransaction", [{ from: acc[0], to: to, data: data }]);
    });
  }

  function ensureChain() {
    if (!eth()) return Promise.resolve();
    return rpc("eth_chainId").then(function (id) {
      if (String(id).toLowerCase() === CFG.chainHex) return;
      return rpc("wallet_switchEthereumChain", [{ chainId: CFG.chainHex }]).catch(function () {
        return rpc("wallet_addEthereumChain", [{
          chainId: CFG.chainHex,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [CFG.rpc],
          blockExplorerUrls: [CFG.explorer]
        }]);
      });
    });
  }

  function connect() {
    return ensureChain().then(function () { return rpc("eth_requestAccounts"); })
      .then(function (a) { return a && a[0]; });
  }

  function decodeUintArray(hex) {
    hex = strip(hex);
    if (!hex || hex.length < 128) return [];
    var offset = Number(BigInt("0x" + hex.slice(0, 64)));
    var start = offset * 2;
    var len = Number(BigInt("0x" + hex.slice(start, start + 64)));
    var out = [];
    for (var i = 0; i < len; i++) {
      var s = start + 64 + i * 64;
      out.push(BigInt("0x" + hex.slice(s, s + 64)));
    }
    return out;
  }

  function encUintArray(ids) {
    var data = encUint(32) + encUint(ids.length);
    for (var i = 0; i < ids.length; i++) data += encUint(ids[i]);
    return data;
  }

  function gradeName(id) {
    return (GRADES[id] || GRADES[0]).name;
  }

  function fmtWei(v) {
    if (v === undefined || v === null) return "0";
    var n = Number(v) / 1e18;
    if (!isFinite(n) || n === 0) return "0";
    if (n < 0.0001) return "~0";
    if (n < 1) return n.toFixed(4);
    return n.toFixed(4);
  }

  function milkTap() {
    var root = document.querySelector("[data-milk-desk]");
    if (!root) return;
    var status = root.querySelector("[data-status]");
    var list = root.querySelector("[data-cows]");
    var connectBtn = root.querySelector("[data-connect]");
    var withdrawBtn = root.querySelector("[data-withdraw]");
    var pendingEl = root.querySelector("[data-pending]");
    var account = null;

    function setStatus(t) { if (status) status.textContent = t; }

    function loadCows() {
      if (!CFG.nft || !account) {
        setStatus("Unmilked = 0. Lot is not live.");
        return;
      }
      setStatus("On the line\u2026");
      var data = "0x" + SEL.balanceOf + encAddr(account);
      call(CFG.nft, data).then(function (balHex) {
        var n = Number(hexToBig(balHex));
        if (!n) {
          list.innerHTML = "";
          setStatus("No cows on this wallet. Unmilked = 0.");
          return [];
        }
        var reads = [];
        for (var i = 0; i < n; i++) {
          reads.push(call(CFG.nft, "0x" + SEL.tokenOfOwnerByIndex + encAddr(account) + encUint(i)));
        }
        return Promise.all(reads);
      }).then(function (idHexes) {
        if (!idHexes || !idHexes.length) return;
        var ids = idHexes.map(function (h) { return hexToBig(h); });
        return Promise.all(ids.map(function (id) {
          var jobs = [
            call(CFG.nft, "0x" + SEL.milkWeight + encUint(id)),
            call(CFG.nft, "0x" + SEL.gradeOf + encUint(id))
          ];
          if (CFG.lot) {
            jobs.push(call(CFG.lot, "0x" + SEL.onLine + encUint(id)));
            jobs.push(call(CFG.lot, "0x" + SEL.pending + encUint(id)));
            jobs.push(call(CFG.lot, "0x" + SEL.liveW + encUint(id)));
          }
          return Promise.all(jobs).then(function (r) {
            var on = CFG.lot ? hexToBig(r[2]) !== 0n : false;
            var liveWeight = CFG.lot ? hexToBig(r[4]) : 0n;
            return {
              id: id,
              weight: hexToBig(r[0]),
              grade: Number(hexToBig(r[1])),
              on: on,
              pending: CFG.lot ? hexToBig(r[3]) : 0n,
              live: on ? liveWeight : 0n
            };
          });
        }));
      }).then(function (rows) {
        if (!rows) return;
        list.innerHTML = "";
        var ids = [];
        var pendingSum = 0n;
        rows.forEach(function (row) {
          ids.push(row.id);
          pendingSum += row.pending;
          var li = document.createElement("li");
          li.className = "cow-row";
          var live = row.on ? String(row.live) : "0";
          li.innerHTML =
            "<div style='flex:1'><p class='display' style='margin:0'>Cow #" + row.id.toString() + "</p>" +
            "<p class='hint' style='margin:2px 0 0'>" + gradeName(row.grade) + " \u00b7 card " + row.weight.toString() +
            " \u00b7 live " + live + (row.on ? "" : " \u00b7 DRY") + "</p></div>";
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn " + (row.on ? "" : "gold");
          btn.textContent = row.on ? "DRY" : "MILK";
          btn.disabled = !CFG.lot;
          btn.addEventListener("click", function () {
            act(row.on ? "dry" : "milk", row.id);
          });
          li.appendChild(btn);
          list.appendChild(li);
        });
        if (pendingEl) pendingEl.textContent = fmtWei(pendingSum);
        withdrawBtn.disabled = !CFG.lot || ids.length === 0;
        withdrawBtn.onclick = function () { pull(ids); };
        setStatus("Milk. She's heavy. Unmilked = 0.");
      }).catch(function (err) {
        setStatus(String(err.message || err));
      });
    }

    function act(kind, id) {
      if (!CFG.lot) return;
      var sel = kind === "milk" ? SEL.milk : SEL.dry;
      setStatus(kind === "milk" ? "Milking\u2026" : "Drying\u2026");
      ensureChain().then(function () {
        return send(CFG.lot, "0x" + sel + encUint(id));
      }).then(function () {
        setStatus("On chain.");
        loadCows();
      }).catch(function (err) {
        setStatus(String(err.message || err));
      });
    }

    function pull(ids) {
      if (!CFG.lot) return;
      setStatus("Withdraw\u2026");
      ensureChain().then(function () {
        return send(CFG.lot, "0x" + SEL.claim + encUintArray(ids));
      }).then(function () {
        setStatus("Pulled.");
        loadCows();
      }).catch(function (err) {
        setStatus(String(err.message || err));
      });
    }

    if (connectBtn) {
      connectBtn.addEventListener("click", function () {
        connect().then(function (a) {
          account = a;
          connectBtn.textContent = a.slice(0, 6) + "\u2026" + a.slice(-4);
          loadCows();
        }).catch(function (err) {
          setStatus(String(err.message || err));
        });
      });
    }

    if (!CFG.nft || !CFG.lot) {
      setStatus("Unmilked = 0. Lot is not live.");
    }
  }

  function lotBoard() {
    var body = document.querySelector("[data-lot-body]");
    if (!body) return;
    var note = document.querySelector("[data-lot-note]");
    function empty(msg) {
      if (note) note.textContent = msg;
      body.innerHTML = "";
      for (var i = 1; i <= 10; i++) {
        var tr = document.createElement("tr");
        tr.className = "empty";
        tr.innerHTML = "<td>" + (i < 10 ? "0" + i : i) + "</td><td>\u2014</td><td>\u2014</td><td>0</td>";
        body.appendChild(tr);
      }
    }
    if (!CFG.lot || !CFG.nft) {
      empty("Lot is empty. Milk a cow. Unmilked = 0.");
      return;
    }
    call(CFG.lot, "0x" + SEL.topByWeight + encUint(25)).then(function (hex) {
      var ids = decodeUintArray(hex);
      if (!ids.length) {
        empty("Nobody on the line. Unmilked = 0.");
        return [];
      }
      return Promise.all(ids.map(function (id) {
        return Promise.all([
          call(CFG.nft, "0x" + SEL.milkWeight + encUint(id)),
          call(CFG.nft, "0x" + SEL.gradeOf + encUint(id)),
          call(CFG.lot, "0x" + SEL.liveW + encUint(id))
        ]).then(function (r) {
          return { id: id, grade: Number(hexToBig(r[1])), live: hexToBig(r[2]) };
        });
      }));
    }).then(function (rows) {
      if (!rows || !rows.length) return;
      rows.sort(function (a, b) { return a.live === b.live ? 0 : (a.live > b.live ? -1 : 1); });
      body.innerHTML = "";
      rows.forEach(function (row, i) {
        var n = i + 1;
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + (n < 10 ? "0" + n : n) + "</td><td>#" + row.id.toString() +
          "</td><td>" + gradeName(row.grade) + "</td><td>" + row.live.toString() + "</td>";
        body.appendChild(tr);
      });
      if (note) note.textContent = "Heaviest milk on the line.";
    }).catch(function () {
      empty("Lot is empty. Milk a cow. Unmilked = 0.");
    });
  }

  function runBoard() {
    var body = document.querySelector("[data-run-body]");
    if (!body) return;
    var note = document.querySelector("[data-run-note]");
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem("cashcows-milk-run-board") || "[]"); } catch (e) { rows = []; }
    if (!Array.isArray(rows)) rows = [];
    body.innerHTML = "";
    if (!rows.length) {
      if (note) note.textContent = "No runs on this CRT. Play Milk Run in the parlor.";
      for (var i = 1; i <= 8; i++) {
        var tr = document.createElement("tr");
        tr.className = "empty";
        tr.innerHTML = "<td>" + (i < 10 ? "0" + i : i) + "</td><td>\u2014</td><td>\u2014</td>";
        body.appendChild(tr);
      }
      return;
    }
    if (note) note.textContent = "This CRT. Not the lot.";
    rows.slice(0, 20).forEach(function (row, i) {
      var n = i + 1;
      var tr = document.createElement("tr");
      var run = row && row.run != null ? row.run : 0;
      var coffee = row && row.coffee != null ? row.coffee : 0;
      tr.innerHTML = "<td>" + (n < 10 ? "0" + n : n) + "</td><td>" + run + "</td><td>" + coffee + "</td>";
      body.appendChild(tr);
    });
  }

  milkTap();
  lotBoard();
  runBoard();
})();
