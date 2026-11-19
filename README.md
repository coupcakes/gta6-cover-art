# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/coupcakes/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/coupcakes/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio: an offline web app that turns your photos and a caption into GTA 6-style cover art — multi-panel poster layouts, bold lettering, a Vice City sunset or neon colour grade — and exports it as a PNG to share.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything runs offline from the static files under `app/`; photos never leave your machine.

## How it works

- **Photos:** three slots — upload your own or use the two bundled samples (`app/samples/`, made with an image model for make.fun and free to use). Each panel shows one slot, so one photo can fill every panel or three photos can mix.
- **Layouts:** Poster (hero + two panels), Split (two panels) and Single (one full photo), each with a caption band or overlay.
- **Any photo:** click a panel in the preview to pick it, drag it to move its photo, zoom it, or centre it again.
- **Caption:** editable caption and tagline, three bold condensed letterings (Anton, Archivo Black, Bebas Neue — all SIL Open Font License, vendored under `app/fonts/`), five colours, adjustable size.
- **Colour grade:** Sunset, Neon or Vice wash over every panel, plus a synthwave sun drawn in code.
- **Export:** PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080, one click.

## About the game, honestly

Grand Theft Auto VI launches **19 November 2026** on PlayStation 5 and Xbox Series X|S, set in Vice City in the fictional state of Leonida, starring Jason Duval and Lucia Caminos (confirmed by Rockstar Games; the date moved twice, from 2025 to 26 May 2026, then to 19 November 2026). Rockstar has **not** announced a PC version, a map size, or online details — anything claiming those is rumor, not fact.

This app is an **unofficial fan-made cover maker**, not affiliated with or endorsed by Rockstar Games. It uses no Rockstar logo, wordmark, artwork or font: the lettering, sun motif and layouts are original work drawn with code.

## Files

- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `app/` — the static web app (`index.html`, `style.css`, `src/`).
- `screenshots/` — 3–4 screenshots: the app with photos loaded, and covers it exported.
- `serve.ts` — a tiny static server for trying the app locally.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t9hqnryj&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
