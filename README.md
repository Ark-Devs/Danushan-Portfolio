# Dhanuvj — Portfolio

Live: https://ark-devs.github.io/Danushan-Portfolio/

## Versions

| Branch | What it is |
|---|---|
| `main` | **v4.05** — light / minimal / premium, motion + card-stack galleries. Current. |
| `v3` | Light theme, portrait hero plate. Kept for reference. |
| `v2` | Dark minimal. Kept for reference. |
| `v1` | The first build (retro-brutalist). Kept for reference. |

Each new direction gets its own branch (`v3`, `v4`…) so nothing is lost.

## Structure

```
index.html              page markup only
assets/css/style.css    all styling
assets/js/work.js       ← the projects. This is the file you edit.
assets/js/motion.js     motion engine (one rAF ticker, all effects)
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
- **`gallery`** turns a project into a photo library. List the paths:

  ```js
  gallery: [
    'assets/img/luxe-pods/01.jpg',
    'assets/img/luxe-pods/02.jpg'
  ]
  ```

  The project opens as a **card stack** — the film plus every still from
  that shoot, fanned one behind the next. Advance it by clicking the top
  card, swiping, the up/down buttons, or the arrow keys. The tile gets an
  "8 shots" badge.

  **Every project has a gallery**, because a shoot almost always produces
  more than one usable frame. The counts in `work.js` are scaffolding, not
  real numbers — add or remove lines to match what each project actually
  has. List the paths before the photos exist; each missing one draws a
  placeholder naming the file to drop in.

  A project can have both a film and a gallery; the film sits first.

### Cache

Asset URLs carry `?v=4.05`. **Bump that number in `index.html` whenever you
edit the CSS or JS**, otherwise returning visitors keep the old cached copy.
This bit me during development — the browser served a stale `work.js` and the
new galleries silently did not appear.

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

**The local MP4 is still the better answer.** A YouTube embed shows its own
furniture before it starts playing — channel row, big play button, watermark.
Two things hold that back: the plate stays covered until playback actually
reports in, and the player is over-scaled 1.22× so its title bar and
watermark sit outside the frame and get clipped. A self-hosted MP4 has none
of that and does not need either workaround. Add
`assets/img/showreel-poster.jpg` and it is used as the holding image.

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

## Motion

Patterns follow the motion.dev/ui vocabulary, hand-rolled in `motion.js` so
the site stays a zero-dependency static build.

| Pattern | Where it is used |
|---|---|
| screenshot-scroll-reveal | hero plate tilts up out of 3D on load |
| card-stack | ghost plates fanned behind the reel |
| border-beam | light travelling the plate edge |
| scroll-word-reveal | About bio, per-word `0.15 → 1` |
| expand-card | tile FLIPs into the lightbox |
| coverflow | neighbouring projects at `rotateY 22°`, `scale .82` |
| card-stack | a project's own resources, `gap 16px` / `scale −.05` / `4°` |
| footer-reveal | footer sits under the page and is uncovered |
| magnetic-pull | **the one call to action, nothing else** |

Magnetic pull is deliberately used exactly once. On a row of controls every
pill lunges at the cursor at the same time, which reads as noise rather than
as an affordance.

All motion is dropped under `prefers-reduced-motion`, and the dimmed starting
states only apply once the ticker has produced a real frame — so a page that
never animates shows its copy at full strength rather than greyed out.

## Mobile

Fixed in v4.01, all measured at 390px:

- The category filter was a **133px block of six wrapping pills**. It is now a
  single scrollable rail bled to the page edges — 52px.
- The card-stack ghosts overflowed the viewport edge on a small screen, so
  they are hidden below 820px. They read as depth on desktop and as clutter
  on a phone.
- Tile title and category fought for room on a 171px tile; they now stack.
- Wide letter-spacing on 10px type was most of the remaining visual noise, so
  tracking is reduced across the micro text below 540px.

## Two axes in the lightbox

- **Across** — the angled cards either side move between *projects*, as do
  the arrows at the top left.
- **Down the stack** — the arrow keys, the up/down buttons, a click on the
  top card or a swipe move between the *resources inside one project*.

The arrow keys drive the stack rather than the projects because a project
holding several frames is the normal case, not the exception.
