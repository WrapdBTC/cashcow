#!/usr/bin/env node
/**
 * Cash Cows generative pipeline.
 * Composites transparent 256×256 PNG layers → tokens + metadata.
 * Milk Weight grade is assigned from trait rarity (config milk scores), not OpenSea rank.
 *
 *   node index.js check
 *   node index.js preview
 *   node index.js generate --count N
 *
 * Copy lock: do not say earn / yield / APY.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  SIZE,
  SUPPLY,
  DEFAULT_COUNT,
  LAYERS_REL,
  STACK,
  GRADES,
  SACRED_AUTO_MINT,
  PREVIEW,
  TRAITS,
} from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAYERS_DIR = path.resolve(__dirname, LAYERS_REL);
const OUT_DIR = path.join(__dirname, "out");
const IMAGES_DIR = path.join(OUT_DIR, "images");
const META_DIR = path.join(OUT_DIR, "metadata");

function layerOf(slot) {
  return STACK.find((l) => l.slot === slot);
}

function traitFilePath(slot, file) {
  const layer = layerOf(slot);
  if (!layer) throw new Error(`Unknown slot: ${slot}`);
  return path.join(LAYERS_DIR, layer.dir, file);
}

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function isNoneTrait(trait) {
  return trait.name === "None" || trait.file === "none.png";
}

function inventory() {
  const missingDirs = [];
  const missingFiles = [];
  const presentFiles = [];
  const optionalMissing = [];

  for (const layer of STACK) {
    const dirPath = path.join(LAYERS_DIR, layer.dir);
    if (!exists(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      missingDirs.push(layer.dir);
    }
    const traits = TRAITS[layer.slot] || [];
    for (const trait of traits) {
      const rel = `${layer.dir}/${trait.file}`;
      const abs = traitFilePath(layer.slot, trait.file);
      if (exists(abs)) {
        presentFiles.push({ rel, slot: layer.slot, trait });
      } else if (trait.optional || isNoneTrait(trait)) {
        optionalMissing.push(rel);
      } else {
        missingFiles.push(rel);
      }
    }
  }

  const extraFiles = [];
  const extraDirs = [];
  if (exists(LAYERS_DIR)) {
    const expectedDirs = new Set(STACK.map((l) => l.dir));
    for (const name of fs.readdirSync(LAYERS_DIR)) {
      const full = path.join(LAYERS_DIR, name);
      if (!fs.statSync(full).isDirectory()) continue;
      if (!expectedDirs.has(name)) {
        extraDirs.push(name);
        continue;
      }
      const expectedFiles = new Set(
        (TRAITS[STACK.find((l) => l.dir === name).slot] || []).map((t) => t.file)
      );
      for (const file of fs.readdirSync(full)) {
        if (!file.toLowerCase().endsWith(".png")) continue;
        if (!expectedFiles.has(file)) extraFiles.push(`${name}/${file}`);
      }
    }
  }

  return { missingDirs, missingFiles, presentFiles, optionalMissing, extraFiles, extraDirs };
}

function printCheck() {
  console.log("Cash Cows layer check");
  console.log(`Layers dir: ${LAYERS_DIR}`);
  console.log(`Size: ${SIZE}×${SIZE}  |  Supply later: ${SUPPLY}`);
  console.log("");

  if (!exists(LAYERS_DIR)) {
    console.log("MISSING layers directory entirely.");
    console.log("Expected: 00_sky … 09_special (see ../layers/README.md)");
    return inventory();
  }

  const inv = inventory();

  if (inv.missingDirs.length) {
    console.log("MISSING directories:");
    for (const d of inv.missingDirs) console.log(`  - ${d}`);
    console.log("");
  } else {
    console.log("Directories: all 10 present.");
    console.log("");
  }

  if (inv.missingFiles.length) {
    console.log("MISSING files:");
    for (const f of inv.missingFiles) console.log(`  - ${f}`);
    console.log("");
  } else {
    console.log("Configured (non-optional) files: all present.");
    console.log("");
  }

  if (inv.optionalMissing.length) {
    console.log("Optional / None (ok if absent — slot skipped):");
    for (const f of inv.optionalMissing) console.log(`  - ${f}`);
    console.log("");
  }

  if (inv.presentFiles.length) {
    console.log("PRESENT:");
    for (const p of inv.presentFiles) console.log(`  - ${p.rel}`);
    console.log("");
  } else {
    console.log("PRESENT: (none)");
    console.log("");
  }

  if (inv.extraDirs.length) {
    console.log("Extra directories (not in the folder contract):");
    for (const d of inv.extraDirs) console.log(`  - ${d}`);
    console.log("");
  }
  if (inv.extraFiles.length) {
    console.log("Extra PNGs (not in config.js):");
    for (const f of inv.extraFiles) console.log(`  - ${f}`);
    console.log("");
  }

  const expected = STACK.reduce((n, l) => n + (TRAITS[l.slot] || []).filter((t) => !t.optional && !isNoneTrait(t)).length, 0);
  console.log(
    `Summary: ${inv.presentFiles.length} present, ${inv.missingFiles.length} missing, ${inv.missingDirs.length} dirs missing (${expected} required files in config).`
  );
  console.log("Art is still filling layers — missing files are expected until the set is complete.");
  return inv;
}

function availableTraits(slot) {
  const traits = TRAITS[slot] || [];
  const present = [];
  let noneTrait = null;
  for (const trait of traits) {
    const abs = traitFilePath(slot, trait.file);
    const onDisk = exists(abs);
    if (isNoneTrait(trait) || trait.optional) {
      noneTrait = { ...trait, abs: onDisk ? abs : null, skip: !onDisk };
      if (onDisk) present.push({ ...trait, abs, skip: false });
      else present.push({ ...trait, abs: null, skip: true });
      continue;
    }
    if (onDisk) present.push({ ...trait, abs, skip: false });
  }
  if (!present.length && noneTrait) return [noneTrait];
  return present;
}

function pickWeighted(items, rng) {
  const total = items.reduce((s, t) => s + Math.max(0, t.weight || 0), 0);
  if (total <= 0) return items[0];
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight || 0);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeFromScore(score, remaining, sacredAutoMint) {
  const eligible = GRADES.filter((g) => g.autoMint !== false || sacredAutoMint).slice();
  eligible.sort((a, b) => b.minScore - a.minScore);
  let chosen = eligible[eligible.length - 1];
  for (const g of eligible) {
    if (score >= g.minScore) {
      chosen = g;
      break;
    }
  }
  const byId = Object.fromEntries(GRADES.map((g) => [g.id, g]));
  const order = GRADES.map((g) => g.id);
  let idx = order.indexOf(chosen.id);
  while (idx > 0 && remaining[chosen.id] <= 0) {
    idx -= 1;
    chosen = byId[order[idx]];
  }
  if (chosen.autoMint === false && !sacredAutoMint) {
    idx = order.indexOf("golden");
    while (idx > 0 && remaining[order[idx]] <= 0) idx -= 1;
    chosen = byId[order[idx]];
  }
  remaining[chosen.id] -= 1;
  return chosen;
}

function initRemaining(sacredAutoMint) {
  const remaining = {};
  for (const g of GRADES) {
    remaining[g.id] = g.autoMint === false && !sacredAutoMint ? 0 : g.count;
  }
  return remaining;
}

function dnaOf(picks) {
  return STACK.map((l) => {
    const p = picks[l.slot];
    return p ? `${l.slot}:${p.file}` : `${l.slot}:-`;
  }).join("|");
}

function samplePicks(rng) {
  const picks = {};
  for (const layer of STACK) {
    const avail = availableTraits(layer.slot);
    if (!avail.length) {
      if (layer.required) return { error: `required slot "${layer.slot}" has no layer files in ${layer.dir}` };
      continue;
    }
    picks[layer.slot] = pickWeighted(avail, rng);
  }
  return { picks };
}

function milkScore(picks) {
  let score = 0;
  for (const layer of STACK) {
    const p = picks[layer.slot];
    if (p) score += p.milk || 0;
  }
  return score;
}

function attributesOf(picks, grade) {
  const attrs = [];
  for (const layer of STACK) {
    const p = picks[layer.slot];
    attrs.push({
      trait_type: layer.label,
      value: p ? p.name : "None",
    });
  }
  attrs.push({ trait_type: "Milk Grade", value: grade.name });
  attrs.push({ trait_type: "Milk Weight", value: grade.milkWeight });
  return attrs;
}

function metadataOf(id, picks, grade) {
  const breedPick = picks.breed;
  const breed = breedPick ? breedPick.name : "Unknown";
  return {
    name: `Cash Cow #${id}`,
    description: `Cash Cow #${id}. ${breed}. Milk Weight ${grade.milkWeight}x — ${grade.name}.`,
    image: `images/${id}.png`,
    attributes: attributesOf(picks, grade),
    milkWeight: grade.milkWeight,
    milkGrade: grade.name,
    breed,
  };
}

async function compositePicks(picks) {
  const overlays = [];
  for (const layer of STACK) {
    const p = picks[layer.slot];
    if (!p || p.skip || !p.abs) continue;
    overlays.push({
      input: await sharp(p.abs).ensureAlpha().resize(SIZE, SIZE, { fit: "fill" }).png().toBuffer(),
    });
  }
  const canvas = sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).png();
  if (!overlays.length) {
    return canvas;
  }
  return sharp(await canvas.toBuffer()).composite(overlays).png();
}

async function runPreview() {
  console.log("Preview: Holstein + shirt-tie + mug");
  const picks = {};
  const missing = [];
  const used = [];
  for (const spec of PREVIEW) {
    const abs = traitFilePath(spec.slot, spec.file);
    const traits = TRAITS[spec.slot] || [];
    const trait = traits.find((t) => t.file === spec.file) || {
      file: spec.file,
      name: spec.file.replace(/\.png$/i, ""),
      weight: 1,
      milk: 0,
    };
    if (exists(abs)) {
      picks[spec.slot] = { ...trait, abs, skip: false };
      used.push(`${layerOf(spec.slot).dir}/${spec.file}`);
    } else if (!spec.optional) {
      missing.push(`${layerOf(spec.slot).dir}/${spec.file}`);
    } else {
      console.log(`  skip optional ${layerOf(spec.slot).dir}/${spec.file} (not on disk)`);
    }
  }
  if (missing.length) {
    console.log("Missing preview layers:");
    for (const f of missing) console.log(`  - ${f}`);
  }
  if (!used.length) {
    console.log("No preview layers on disk — not writing out/preview.png");
    return;
  }
  console.log("Compositing:");
  for (const f of used) console.log(`  + ${f}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, "preview.png");
  await (await compositePicks(picks)).toFile(dest);
  console.log(`Wrote ${dest}`);
}

async function runGenerate({ count, seed, sacredAutoMint }) {
  const breedAvail = availableTraits("breed").filter((t) => !t.skip);
  if (!breedAvail.length) {
    console.error("Cannot generate: no breed PNGs in 02_breed/. Fill layers first (see check).");
    process.exitCode = 1;
    return;
  }

  const rng = mulberry32(seed);
  const remaining = initRemaining(sacredAutoMint);
  const seen = new Set();
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });

  console.log(`Generate ${count} (default 20; full supply ${SUPPLY} later)`);
  console.log(`Seed ${seed}  |  Sacred auto-mint: ${sacredAutoMint ? "ON" : "OFF (11 slots reserved)"}`);

  let minted = 0;
  let attempts = 0;
  const maxAttempts = Math.max(count * 50, 200);
  const skippedMissing = new Set();

  while (minted < count && attempts < maxAttempts) {
    attempts += 1;
    const { picks, error } = samplePicks(rng);
    if (error) {
      console.error(error);
      process.exitCode = 1;
      return;
    }
    const dna = dnaOf(picks);
    if (seen.has(dna)) continue;
    seen.add(dna);

    for (const layer of STACK) {
      const p = picks[layer.slot];
      if (p && !p.skip && p.abs) continue;
      if (p && p.skip) skippedMissing.add(`${layer.dir}/${p.file}`);
    }

    const score = milkScore(picks);
    const grade = gradeFromScore(score, remaining, sacredAutoMint);
    const id = minted + 1;
    const img = await compositePicks(picks);
    const imgPath = path.join(IMAGES_DIR, `${id}.png`);
    const metaPath = path.join(META_DIR, `${id}.json`);
    await img.toFile(imgPath);
    const meta = metadataOf(id, picks, grade);
    meta.dna = dna;
    meta.milkScore = score;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
    minted += 1;
    console.log(
      `#${id}  ${meta.breed.padEnd(13)}  ${grade.name.padEnd(12)}  ${grade.milkWeight}x  score=${score}`
    );
  }

  if (minted < count) {
    console.log(`Stopped at ${minted}/${count} unique combos (not enough present layers).`);
  }
  if (skippedMissing.size) {
    console.log("Slots skipped because files were missing:");
    for (const f of [...skippedMissing].sort()) console.log(`  - ${f}`);
  }
  console.log(`Wrote ${minted} images → ${IMAGES_DIR}`);
  console.log(`Wrote ${minted} metadata → ${META_DIR}`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0] || "check";
  let count = DEFAULT_COUNT;
  let seed = (Date.now() ^ (process.pid * 0x9e3779b9)) >>> 0;
  let sacred = SACRED_AUTO_MINT;
  for (let i = 1; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--count" && args[i + 1]) {
      count = Number(args[i + 1]);
      i += 1;
    } else if (a.startsWith("--count=")) {
      count = Number(a.slice("--count=".length));
    } else if (a === "--seed" && args[i + 1]) {
      seed = Number(args[i + 1]) >>> 0;
      i += 1;
    } else if (a === "--sacred") {
      sacred = true;
    }
  }
  if (!Number.isFinite(count) || count < 1) {
    console.error("--count must be a positive number");
    process.exit(1);
  }
  if (count > SUPPLY) count = SUPPLY;
  return { cmd, count, seed, sacred };
}

async function main() {
  const { cmd, count, seed, sacred } = parseArgs(process.argv);
  if (cmd === "check") {
    printCheck();
    return;
  }
  if (cmd === "preview") {
    await runPreview();
    return;
  }
  if (cmd === "generate") {
    await runGenerate({ count, seed, sacredAutoMint: sacred });
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  console.error("Usage: node index.js <check|preview|generate> [--count N] [--seed N] [--sacred]");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
