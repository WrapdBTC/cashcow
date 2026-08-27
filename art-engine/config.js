/**
 * Cash Cows art-engine config.
 *
 * Milk Weight grades come from trait rarity (this table), not OpenSea rank.
 * Sacred 1/1s are reserved: one per breed except Dexter. Auto-mint is off.
 *
 * Copy lock: do not say earn / yield / APY.
 */

export const SIZE = 256;
export const SUPPLY = 2222;
export const DEFAULT_COUNT = 20;

/** Layer PNGs live next to this package, at ../layers */
export const LAYERS_REL = "../layers";

/** Bottom to top composite order. dir names are the on-disk folder contract. */
export const STACK = [
  { slot: "sky", dir: "00_sky", label: "Sky" },
  { slot: "ground", dir: "01_ground", label: "Ground" },
  { slot: "breed", dir: "02_breed", label: "Breed", required: true },
  { slot: "eyes", dir: "03_eyes", label: "Eyes" },
  { slot: "mouth", dir: "04_mouth", label: "Mouth" },
  { slot: "horns", dir: "05_horns", label: "Horns" },
  { slot: "head", dir: "06_head", label: "Head" },
  { slot: "outfit", dir: "07_outfit", label: "Outfit" },
  { slot: "accessory", dir: "08_accessory", label: "Accessory" },
  { slot: "special", dir: "09_special", label: "Special" },
];

/**
 * Census for the 2222 later. milkWeight is the on-chain multiplier (1.0x = 1.0).
 * minScore maps summed trait `milk` contributions to grade.
 * Sacred stays out of auto-mint until sacredAutoMint is flipped.
 */
export const GRADES = [
  { id: "skim", name: "Skim", milkWeight: 1.0, count: 1111, minScore: 0 },
  { id: "twoPercent", name: "2% Milk", milkWeight: 1.25, count: 622, minScore: 16 },
  { id: "whole", name: "Whole", milkWeight: 1.6, count: 311, minScore: 28 },
  { id: "extraHeavy", name: "Extra Heavy", milkWeight: 2.2, count: 133, minScore: 42 },
  { id: "golden", name: "Golden", milkWeight: 3.5, count: 34, minScore: 58 },
  {
    id: "sacred",
    name: "Sacred",
    milkWeight: 5.0,
    count: 11,
    minScore: 80,
    autoMint: false,
    onePerBreedExcept: "Dexter",
  },
];

/** Leave 11 Sacred slots empty. Flip true (or pass --sacred) when 1/1 art is ready. */
export const SACRED_AUTO_MINT = false;

/** Preview stack: Holstein + shirt-tie + mug. Other slots used only if the default file exists. */
export const PREVIEW = [
  { slot: "sky", file: "none.png", optional: true },
  { slot: "breed", file: "holstein.png" },
  { slot: "eyes", file: "default.png", optional: true },
  { slot: "mouth", file: "default.png", optional: true },
  { slot: "outfit", file: "shirt-tie.png" },
  { slot: "accessory", file: "mug.png" },
];

/**
 * Per-file sampling `weight` (higher = more common) and `milk` contribution.
 * optional: missing file is not an error; treated as no layer (None).
 * Filenames follow what Art has dropped so far; still-expected files stay listed.
 */
export const TRAITS = {
  sky: [
    { file: "none.png", name: "None", weight: 30, milk: 0, optional: true },
    { file: "office-window.png", name: "Office Window", weight: 45, milk: 2 },
    { file: "gold-wash.png", name: "Gold Wash", weight: 10, milk: 12 },
  ],
  ground: [
    { file: "none.png", name: "None", weight: 30, milk: 0, optional: true },
    { file: "office-tile.png", name: "Office Tile", weight: 40, milk: 2 },
    { file: "marble.png", name: "Marble", weight: 15, milk: 8 },
  ],
  breed: [
    { file: "holstein.png", name: "Holstein", weight: 22, milk: 0 },
    { file: "angus.png", name: "Angus", weight: 14, milk: 1 },
    { file: "jersey.png", name: "Jersey", weight: 12, milk: 2 },
    { file: "highland.png", name: "Highland", weight: 10, milk: 3 },
    { file: "galloway.png", name: "Galloway", weight: 8, milk: 4 },
    { file: "longhorn.png", name: "Longhorn", weight: 8, milk: 5 },
    { file: "brahman.png", name: "Brahman", weight: 6, milk: 6 },
    { file: "ankole.png", name: "Ankole", weight: 5, milk: 7 },
    { file: "dexter.png", name: "Dexter", weight: 5, milk: 7 },
    { file: "buffalo.png", name: "Buffalo", weight: 4, milk: 9 },
    { file: "yak.png", name: "Yak", weight: 3, milk: 11 },
    { file: "belgian-blue.png", name: "Belgian Blue", weight: 3, milk: 12 },
  ],
  eyes: [
    { file: "default.png", name: "Default", weight: 45, milk: 0 },
    { file: "sleepy.png", name: "Sleepy", weight: 20, milk: 3 },
    { file: "side.png", name: "Side", weight: 20, milk: 4 },
    { file: "bags.png", name: "Bags", weight: 15, milk: 5 },
  ],
  mouth: [
    { file: "default.png", name: "Default", weight: 45, milk: 0 },
    { file: "open.png", name: "Open", weight: 30, milk: 3 },
    { file: "smirk.png", name: "Smirk", weight: 25, milk: 4 },
  ],
  horns: [
    { file: "none.png", name: "None", weight: 30, milk: 0, optional: true },
    { file: "stub.png", name: "Stub", weight: 30, milk: 2 },
    { file: "long.png", name: "Long", weight: 25, milk: 5 },
    { file: "gold.png", name: "Gold", weight: 8, milk: 14 },
  ],
  head: [
    { file: "none.png", name: "None", weight: 40, milk: 0, optional: true },
    { file: "headset.png", name: "Headset", weight: 20, milk: 6 },
    { file: "visor.png", name: "Visor", weight: 18, milk: 5 },
    { file: "paperclip.png", name: "Paperclip", weight: 12, milk: 7 },
  ],
  outfit: [
    { file: "none.png", name: "None", weight: 35, milk: 0, optional: true },
    { file: "shirt-tie.png", name: "Shirt Tie", weight: 40, milk: 2 },
    { file: "security-polo.png", name: "Security Polo", weight: 25, milk: 5 },
  ],
  accessory: [
    { file: "none.png", name: "None", weight: 30, milk: 0, optional: true },
    { file: "mug.png", name: "Mug", weight: 25, milk: 2 },
    { file: "money-bag.png", name: "Money Bag", weight: 20, milk: 4 },
    { file: "clipboard.png", name: "Clipboard", weight: 15, milk: 5 },
    { file: "coffee.png", name: "Coffee", weight: 10, milk: 6 },
  ],
  special: [
    { file: "none.png", name: "None", weight: 85, milk: 0, optional: true },
    { file: "halo.png", name: "Halo", weight: 10, milk: 14 },
    { file: "gold-outline.png", name: "Gold Outline", weight: 5, milk: 22 },
  ],
};
