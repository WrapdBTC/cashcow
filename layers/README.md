# Cash Cows layers

Folder contract for 256x256 RGBA PNG traits. Art fills these folders. The engine in ../art-engine reads them, skips missing files, and prints what is absent.

Copy lock: do not say earn, yield, or APY.

## Folders (bottom to top)

00_sky
01_ground
02_breed
03_eyes
04_mouth
05_horns
06_head
07_outfit
08_accessory
09_special

Each file: kebab-case.png, 256x256, RGBA, transparent where the layer does not draw.

Do not use 01_body. Breed coats go in 02_breed. _proof is for Art comps only; the engine ignores it.

## Files (on disk plus still-expected)

00_sky: none.png (optional), office-window.png, gold-wash.png
01_ground: none.png (optional), office-tile.png, marble.png
02_breed: holstein.png, angus.png, jersey.png, highland.png, galloway.png, longhorn.png, brahman.png, ankole.png, dexter.png, buffalo.png, yak.png, belgian-blue.png
03_eyes: default.png, sleepy.png, side.png, bags.png
04_mouth: default.png, open.png, smirk.png
05_horns: none.png (optional), stub.png, long.png, gold.png
06_head: none.png (optional), headset.png, visor.png, paperclip.png
07_outfit: none.png (optional), shirt-tie.png, security-polo.png (still expected)
08_accessory: none.png (optional), mug.png, money-bag.png, clipboard.png, coffee.png
09_special: none.png (optional), gold-outline.png, halo.png (still expected)

none.png may be omitted. The engine treats a missing None as skip-layer.

Weights and milk contributions live in ../art-engine/config.js, not in the filenames.

## Preview trio

preview wants:
- 02_breed/holstein.png
- 07_outfit/shirt-tie.png
- 08_accessory/mug.png

## Sacred

11 Sacred 1/1s, one per breed except Dexter. Do not auto-drop those into the common folders. Leave them until the sacred flag is turned on in the engine.
