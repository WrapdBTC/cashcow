# Cash Cows art engine

Composites transparent 256x256 PNG layers into tokens and metadata.
Milk Weight grades come from trait rarity in config.js, not marketplace rank.
Layers are incomplete. Full 2222 run comes later.

Copy lock: do not say earn, yield, or APY.

## Layout

cashcows/layers holds PNG trait files (Art fills this).
cashcows/art-engine is this package.
config.js maps each slot to file, sampling weight, and milk contribution.
Generated preview and tokens go to out/ (gitignored).
Folder contract: ../layers/README.md

## How to run

Subcommands on index.js: check, preview, generate.

check lists missing layer directories and files. Extra folders are reported, not used.
preview composites Holstein plus shirt-tie plus mug if those PNGs exist, and writes out/preview.png.
Optional none sky, default eyes, and default mouth are included when present.
generate writes out/images/{id}.png and out/metadata/{id}.json (default 20).
Missing files are skipped. generate will not run if 02_breed has no PNGs.
Flags: count (default 20, cap 2222), seed, sacred (Sacred auto-mint is off; 11 slots reserved).

## Setup

Needs Node 18+. package.json lists sharp for RGBA compositing.

## Milk Weight

Grade is the summed milk contribution of chosen traits, then a remaining-count table so a full run can match census. Sacred is not auto-minted until the sacred flag is on.

- Skim 1.0x — 1111
- 2% Milk 1.25x — 622
- Whole 1.6x — 311
- Extra Heavy 2.2x — 133
- Golden 3.5x — 34
- Sacred 5.0x — 11 (reserved; 1/1s, one per breed except Dexter)

milkGrade is the full string ("2% Milk", not "2%"). milkWeight is the number (1.25).

## Metadata

name: Cash Cow #{id}
attributes: one trait_type per stack slot, plus Milk Grade and Milk Weight
milkWeight: number
milkGrade: string
breed: string

## Stack (bottom to top)

sky, ground, breed, eyes, mouth, horns, head, outfit, accessory, special.

When every layer PNG is on disk, run check, then generate the full set. Still skip Sacred unless the 11 1/1 files are ready.

Examples: node index.js check | node index.js preview | node index.js generate --count 20
package.json scripts: check, preview, generate.
