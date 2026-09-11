# UNICORN FLIP

A one-button gravity-flip runner for **js13kGames 2026** (theme: *Unicorns and Rainbows*).
No images, no audio files, no fonts, no external requests — every pixel and every note is
generated in code at runtime.

**9,560 bytes zipped** (limit: 13,312).

## Play

Tap, or press `Space` / `↑` / `↓` / `W` / `S`, to flip gravity. `P` or `ESC` pauses and shows
the full rules; `R` restarts; `M` toggles sound; `C` copies your result to the clipboard.
The title screen is an attract mode — the game plays itself until you touch it.

Thread the cloud gates. Passing one *close* to its edge is a GRAZE: time dilates around you
while your own control stays sharp, the combo climbs, a second rainbow band lights up behind
your trail, and the soundtrack drops an octave. The tighter the miss, the deeper the slowdown
and the bigger the score — NEAR, GREAT, PERFECT. Roughly four in ten stars are parked out on
an edge line, ringed and worth 2.5×, so the safe line and the greedy line are never the same.

Four pickups, none of them ever wasted: stars, a shield gem, a PRISM that doubles score for
eight seconds, and a heart. A gem you cannot use pays points instead.

Cross four skies to reach the end of the rainbow — then the same meter becomes a nine-rung
rank gauge running all the way to **COUNTER STOP at 13,312**, this competition's own byte
limit used as the score cap. Five badges persist between sessions, and the result screen
redraws your entire flight as one rainbow ribbon, so no two result cards look alike.

## Build

```bash
node tools/build.js src.html build/index.html
```

`src.html` is the readable source and the only file to edit. `build/index.html` is the
minified artifact that ships; the zip contains it alone, at the top level.

## Verify

```bash
node tools/verify.js build/index.html   # 94 checks against the shipped artifact
node tools/cur.js    build/index.html   # difficulty curve, by simulated tap rate
node tools/items.js  build/index.html   # pickup distribution over full runs
node tools/endless.js build/index.html  # score ceiling past the ending
node tools/serve.js                     # http://localhost:8791
```

`tools/harness.js` loads the game with a stubbed Canvas / WebAudio / localStorage environment
so the logic runs in plain Node — no jsdom, no browser. The checks cover the fixed timestep at
nine refresh rates, background-tab recovery, storage being blocked outright, every screen
rendering without `undefined`/`NaN`, object lifetimes over 20k steps, gate geometry, the key
bindings (including input stacks that deliver an empty `e.code`), attract mode scoring nothing,
and the rank ladder firing in order all the way to the counter stop.

The build keeps ~30 internal names unmangled so the file under test is byte-for-byte the file
that ships.

## Notes

- Fixed 60 Hz logic step decoupled from the display refresh rate; verified from 30 Hz to 240 Hz.
- Difficulty rides on distance travelled, never on score.
- `localStorage` keys are namespaced `unicornFlip13k.*` and every access is wrapped.
- Honours `prefers-reduced-motion`; auto-pauses when the window loses focus.

## Licence

© 2026 syu-san Games.
