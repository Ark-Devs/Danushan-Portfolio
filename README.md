# Dhanuvj — Portfolio

Live: https://ark-devs.github.io/Danushan-Portfolio/

## Versions

| Branch | What it is |
|---|---|
| `main` | **v3** — light / minimal / premium. Current direction. |
| `v2` | Dark minimal. Kept for reference. |
| `v1` | The first build (retro-brutalist). Kept for reference. |

Each new direction gets its own branch (`v3`, `v4`…) so nothing is lost.

## Structure

```
index.html              page markup only
assets/css/style.css    all styling
assets/js/work.js       ← the projects. This is the file you edit.
assets/js/main.js       behaviour (grid, filters, lightbox, hero reel)
assets/img/             thumbnails, portrait, poster
assets/video/           showreel.mp4
```

## Adding or changing a project

Everything lives in **`assets/js/work.js`**. One block per project:

```js
{
  title:    'Knorr',
  cat:      'Food',                    // the filter button builds itself
  client:   'Knorr',
  year:     '2025',
  thumb:    'assets/img/knorr.jpg',    // square image
  yt:       'dQw4w9WgXcQ',             // YouTube id
  vertical: true,                      // true = 9:16 reel, false = 16:9
  desc:     'What the project was.'
}
```

Notes:

- **Categories are automatic.** Add a project with `cat: 'Travel'` and a Travel
  filter button appears. Remove the last Travel project and it disappears.
- **Thumbnails should be square** (1:1). 1000×1000 is plenty. Leave `thumb: ''`
  and a lettered placeholder is drawn instead, so the grid never looks broken.
- **`yt`** is the id only — from `youtube.com/watch?v=ABC123` use `ABC123`.
  Leave it empty and the lightbox says the video isn't linked yet.
- **`desc`** is the description shown next to the player.

## The hero showreel

The reel is portrait, so it is shown as a portrait plate rather than a
full-bleed background. That is deliberate: a 9:16 film stretched across a
16:9 background is pillarboxed, which is where the black space in v2 came
from. The plate is 9:16 and the player matches it exactly, so there are no
bars at all.

Drop the vertical reel at **`assets/video/showreel.mp4`** and it plays behind
the name automatically. Add `assets/img/showreel-poster.jpg` for the first
frame while it loads.

If that file is missing, the page falls back to the YouTube reel set in
`SITE.reelYouTube` at the bottom of `work.js`, so the hero is never empty.

Keep the MP4 small — 1080×1920, no audio track, under ~8 MB. It is the first
thing that loads.

## Links

Instagram, Behance, WhatsApp and the phone number are set once in `SITE` at the
bottom of `work.js` and applied everywhere on the page.

## Running it locally

```bash
python -m http.server 8899
```

Then open http://localhost:8899. It must be served over http — opening
`index.html` directly from the file system will not load the CSS and JS.

## Still to supply

- [ ] `assets/video/showreel.mp4` — the vertical reel
- [ ] `assets/img/portrait.jpg` — portrait for the About section
- [ ] Square thumbnails for each project
- [ ] YouTube ids for each project
- [ ] Real descriptions — the current ones are drafts written from the
      Behance project titles and need Dhanushan's own words
