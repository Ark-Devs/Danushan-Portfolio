/* ==================================================================
   DHANUVJ — v3 behaviour
   ------------------------------------------------------------------
   Reads window.WORK and window.SITE from work.js. Nothing in here
   needs editing to add projects — edit work.js instead.

   Motion: one rAF loop drives the scroll-linked hero and the tile
   parallax. Discrete reveals are left to IntersectionObserver so
   they cost nothing once fired.
   ================================================================== */

(function () {
  'use strict';

  var WORK = window.WORK || [];
  var SITE = window.SITE || {};

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- links from SITE ---------------- */
  $$('[data-link]').forEach(function (a) {
    var key = a.getAttribute('data-link');
    if (SITE[key]) a.href = SITE[key];
  });

  /* ---------------- nav ---------------- */
  var nav = $('#nav');
  var burger = $('#burger'), sheet = $('#sheet');

  function setSheet(open) {
    if (open) { sheet.hidden = false; sheet.classList.add('is-shown'); void sheet.offsetWidth; }
    sheet.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    if (!open) {
      window.setTimeout(function () {
        if (!sheet.classList.contains('is-open')) { sheet.classList.remove('is-shown'); sheet.hidden = true; }
      }, 380);
    }
  }
  burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setSheet(false); }); });

  /* ---------------- hero reel ----------------
     Try the local file first. If it is missing or cannot play, fall back
     to the YouTube reel so the plate is never empty.

     The plate is 9:16 and the iframe matches it exactly, so a vertical
     film fills it with no pillarbox bars. See the CSS note on .hero__yt. */
  var heroVid = $('#heroVid'), heroMedia = $('#heroMedia'), soundBtn = $('#soundBtn');
  var heroCover = $('#heroCover');
  var usingYT = false, revealed = false;

  // The plate stays covered until the reel is actually running. YouTube's
  // unstarted player shows a channel row, a large play button and its
  // watermark; none of that should ever be the first thing on the page.
  function revealReel() {
    if (revealed || !heroCover) return;
    revealed = true;
    heroCover.classList.add('is-gone');
  }
  if (heroCover && SITE.reelPoster) {
    heroCover.style.backgroundImage = 'url("' + SITE.reelPoster + '")';
  }
  // backstop: never leave the plate covered if playback never reports in
  window.setTimeout(revealReel, 2600);

  function useYouTube() {
    if (usingYT || !SITE.reelYouTube) return;
    usingYT = true;
    if (heroVid && heroVid.parentNode) heroVid.parentNode.removeChild(heroVid);
    var f = document.createElement('iframe');
    f.className = 'hero__yt';
    f.title = 'Showreel';
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    f.src = 'https://www.youtube.com/embed/' + SITE.reelYouTube +
            '?autoplay=1&mute=1&loop=1&playlist=' + SITE.reelYouTube +
            '&controls=0&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3' +
            '&modestbranding=1&enablejsapi=1';
    heroMedia.appendChild(f);
    if (soundBtn) soundBtn.hidden = true;   // no audio control over the embed

    // Ask the player to report its state. It stays silent until sent this
    // handshake, and then posts onStateChange / infoDelivery messages.
    f.addEventListener('load', function () {
      try {
        f.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
          'https://www.youtube.com'
        );
      } catch (e) { /* cross-origin refusal just means we rely on the backstop */ }
    });

    window.addEventListener('message', function (e) {
      if (e.origin !== 'https://www.youtube.com' && e.origin !== 'https://www.youtube-nocookie.com') return;
      var d;
      try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
      if (!d) return;
      var playing =
        (d.event === 'onStateChange' && d.info === 1) ||
        (d.info && d.info.playerState === 1);
      if (playing) revealReel();
    });
  }

  if (heroVid) {
    if (SITE.reelFile) {
      var src = document.createElement('source');
      src.src = SITE.reelFile;
      src.type = 'video/mp4';
      src.addEventListener('error', useYouTube);
      heroVid.appendChild(src);
      heroVid.load();
    } else {
      useYouTube();
    }

    heroVid.addEventListener('playing', revealReel);
    heroVid.addEventListener('error', useYouTube, true);
    // networkState 3 === NO_SOURCE. Also catches a file that never starts.
    window.setTimeout(function () {
      if (!usingYT && (heroVid.networkState === 3 || heroVid.readyState === 0)) useYouTube();
    }, 1600);

    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        heroVid.muted = !heroVid.muted;
        soundBtn.textContent = heroVid.muted ? 'Sound off' : 'Sound on';
        soundBtn.setAttribute('aria-pressed', String(!heroVid.muted));
        if (!heroVid.muted) { var p = heroVid.play(); if (p && p.catch) p.catch(function () {}); }
      });
    }
  }

  /* ---------------- categories build themselves ---------------- */
  var cats = ['All'];
  WORK.forEach(function (w) { if (cats.indexOf(w.cat) === -1) cats.push(w.cat); });

  var catsEl = $('#cats'), gridEl = $('#grid'), emptyEl = $('#empty');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  catsEl.innerHTML = cats.map(function (c, i) {
    var n = c === 'All' ? WORK.length : WORK.filter(function (w) { return w.cat === c; }).length;
    return '<button class="cat' + (i === 0 ? ' is-on' : '') + '" data-cat="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' +
           esc(c) + '<span class="cat__n">' + n + '</span></button>';
  }).join('');

  gridEl.innerHTML = WORK.map(function (w, i) {
    var hue = (i * 47) % 360;
    var art = w.thumb
      ? '<img class="tile__img" src="' + esc(w.thumb) + '" alt="' + esc(w.title) + '" loading="lazy" decoding="async" />'
      : '<span class="tile__ph" style="--h:' + hue + '"><span>' + esc(w.title.charAt(0)) + '</span></span>';
    // stagger by column so a row wipes open left to right
    var delay = (i % 3) * 90;
    return '<button class="tile" data-i="' + i + '" data-cat="' + esc(w.cat) + '" style="--d:' + delay + 'ms" ' +
             'aria-label="Open ' + esc(w.title) + '">' +
             '<span class="tile__frame">' +
               '<span class="tile__inner">' + art + '</span>' +
               '<span class="tile__veil"></span><span class="tile__play"></span>' +
               (w.gallery && w.gallery.length
                 ? '<span class="tile__count">' + w.gallery.length + ' shots</span>' : '') +
             '</span>' +
             '<span class="tile__meta">' +
               '<span class="tile__title">' + esc(w.title) + '</span>' +
               '<span class="tile__cat">' + esc(w.cat) + '</span>' +
             '</span>' +
           '</button>';
  }).join('');

  var tiles = $$('.tile', gridEl);

  // a broken thumb path falls back to the placeholder rather than a torn icon
  $$('.tile__img', gridEl).forEach(function (img) {
    img.addEventListener('error', function () {
      var ph = document.createElement('span');
      ph.className = 'tile__ph';
      ph.innerHTML = '<span>' + esc((img.getAttribute('alt') || '?').charAt(0)) + '</span>';
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    });
  });

  function applyFilter(cat) {
    var shown = 0;
    tiles.forEach(function (t) {
      var on = (cat === 'All') || t.getAttribute('data-cat') === cat;
      t.classList.toggle('is-out', !on);
      if (on) { t.classList.add('is-in'); shown++; }
    });
    emptyEl.hidden = shown > 0;
  }

  catsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.cat');
    if (!btn) return;
    $$('.cat', catsEl).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    applyFilter(btn.getAttribute('data-cat'));
  });

  /* ---------------- reveals ---------------- */
  var revealTargets = $$('[data-rv]').concat($$('[data-rv-mask]')).concat(tiles);

  if ('IntersectionObserver' in window && !reduceMQ.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    revealTargets.forEach(function (el) { io.observe(el); });

    // never strand on-screen content hidden if the observer misfires
    window.setTimeout(function () {
      revealTargets.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 2000);
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- scroll-linked motion ----------------
     One rAF loop, only running while a scroll is settling. The hero plate
     lifts and grows a little while the name drifts up and fades, so the
     two separate as you enter the work. Tile stills drift against their
     frames for depth. */
  var heroEl = $('#hero'), heroReel = $('#heroReel'), wordEl = $('#wordmark');
  var wordInner = wordEl ? wordEl.firstElementChild : null;
  var ghosts = [$('#ghostA'), $('#ghostB')].filter(Boolean);
  var running = false, queued = false;

  // intro runs 0 -> 1 once on load; the hero transform blends it with scroll
  var intro = M.reduced() ? 1 : 0;

  function frame() {
    running = true;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    nav.classList.toggle('is-stuck', y > 20);

    if (heroEl && heroReel && wordInner) {
      var h = heroEl.offsetHeight || 1;
      var p = clamp(y / (h * 0.9), 0, 1);

      // screenshot-scroll-reveal: the plate starts tilted back in 3D on
      // load and stands upright, then keeps lifting as you scroll on
      var tilt = (1 - intro) * 15;
      heroReel.style.transform =
        'translate3d(0,' + (p * 46 + (1 - intro) * 26) + 'px,0) ' +
        'rotateX(' + tilt.toFixed(2) + 'deg) ' +
        'scale(' + ((1 + p * 0.07) * (0.94 + intro * 0.06)).toFixed(4) + ')';

      wordInner.style.transform = 'translate3d(0,' + (p * -84) + 'px,0) scale(' + (1 - p * 0.05) + ')';
      wordInner.style.opacity = String(clamp(1 - p * 1.35, 0, 1));

      // card-stack: the ghosts fan out as the stack settles and on scroll
      for (var g = 0; g < ghosts.length; g++) {
        var k = g + 1;
        var spread = intro * (1 + p * 0.9);
        ghosts[g].style.transform =
          'translate(-50%,-50%) translate3d(' + (k * 17 * spread) + 'px,' + (k * -11 * spread) + 'px,0) ' +
          'rotate(' + (k * 1.7 * spread).toFixed(2) + 'deg) scale(' + (1 - k * 0.045) + ')';
        ghosts[g].style.opacity = String(clamp(intro * (0.5 - g * 0.18) * (1 - p * 0.7), 0, 1));
      }
    }

    // parallax only for tiles currently on screen
    var vh = window.innerHeight;
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      if (t.classList.contains('is-out') || !t.classList.contains('is-in')) continue;
      var r = t.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var img = t.querySelector('.tile__img, .tile__ph');
      if (!img || t.matches(':hover')) continue;
      var mid = (r.top + r.height / 2 - vh / 2) / vh;   // -1 .. 1
      img.style.transform = 'translate3d(0,' + (mid * -14) + 'px,0) scale(1.06)';
      img.style.transitionDelay = '0s';
    }

    if (queued) { queued = false; requestAnimationFrame(frame); }
    else running = false;
  }

  function onScroll() {
    if (reduceMQ.matches) { nav.classList.toggle('is-stuck', window.pageYOffset > 20); return; }
    if (running) { queued = true; return; }
    requestAnimationFrame(frame);
  }

  // Parallax writes an inline transform, which outranks the CSS :hover rule.
  // Clearing it on enter hands the tile back to CSS; the loop skips hovered
  // tiles, then resumes once the pointer leaves.
  tiles.forEach(function (t) {
    t.addEventListener('pointerenter', function () {
      var img = t.querySelector('.tile__img, .tile__ph');
      if (img) img.style.transform = '';
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (!M.reduced()) {
    var introStart = null;
    requestAnimationFrame(function introStep(now) {
      if (introStart === null) introStart = now;
      var k = clamp((now - introStart) / 1150, 0, 1);
      intro = 1 - Math.pow(1 - k, 3);
      onScroll();
      if (k < 1) requestAnimationFrame(introStep);
    });
  }

  /* ---------------- motion.dev patterns ---------------- */
  $$('[data-words]').forEach(function (el) { M.words(el); });
  if (heroReel) M.beam(heroReel, { duration: '7s' });
  // magnetic-pull is deliberately used once, on the single call to action.
  // Applied to a row of controls it reads as noise — every pill lunging at
  // the cursor at the same time — and stops feeling like an affordance.
  var cta = $('#ctaLine a');
  if (cta) M.magnetic(cta, { strength: 0.3, radius: 110 });
  M.footerReveal($('#page'), $('#foot'));

  /* ---------------- lightbox ---------------- */
  var lb = $('#lb'), lbBox = $('#lbBox'), lbCat = $('#lbCat'), lbTitle = $('#lbTitle');
  var lbDesc = $('#lbDesc'), lbTags = $('#lbTags'), lbClose = $('#lbClose');
  var current = -1, lastFocus = null;

  /* ================================================================
     CARD STACK — the resources inside one project
     ----------------------------------------------------------------
     A project almost always holds more than one thing: the film plus
     the stills from the same shoot. So the stack, not a single frame,
     is the normal case. Horizontal moves between projects, the stack
     moves within one.
     ================================================================ */
  var lbRes = $('#lbRes'), lbCount = $('#lbCount'), lbDots = $('#lbDots');
  var VISIBLE_BEHIND = 2;
  var shot = 0, animating = false;

  function resourcesOf(w) {
    var out = [];
    if (w.yt) out.push({ kind: 'film', yt: w.yt });
    (w.gallery || []).forEach(function (src, n) { out.push({ kind: 'photo', src: src, n: n }); });
    if (!out.length) out.push({ kind: 'empty' });
    return out;
  }

  function cardInner(w, it, isFront) {
    if (it.kind === 'film') {
      // only the front card gets a live player, so one project never
      // spins up several iframes at once
      if (!isFront) return '<span class="tile__ph" style="--h:30"></span>';
      return '<iframe src="https://www.youtube.com/embed/' + esc(it.yt) +
             '?autoplay=1&rel=0&playsinline=1&controls=1&iv_load_policy=3" ' +
             'title="' + esc(w.title) + '" ' +
             'allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
             'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    }
    if (it.kind === 'photo') {
      return '<img src="' + esc(it.src) + '" alt="' + esc(w.title + ' — ' + (it.n + 1)) + '" ' +
             'loading="lazy" decoding="async" />' +
             '<span class="lb__ph--card" data-fallback hidden>Photo ' + (it.n + 1) +
             '<br />Drop it at ' + esc(it.src) + '</span>';
    }
    return '<span class="lb__ph--card">Nothing linked yet<br />Add a film or a gallery in work.js</span>';
  }

  function paintStack(w) {
    var items = resourcesOf(w);
    var depth = Math.min(VISIBLE_BEHIND, items.length - 1);
    var html = '';
    for (var d = depth; d >= 0; d--) {              // back to front
      var it = items[(shot + d) % items.length];
      html += '<div class="lb__card" data-i="' + d + '" style="--i:' + d + '">' +
                cardInner(w, it, d === 0) +
              '</div>';
    }
    lbBox.className = 'lb__box' + (w.vertical ? '' : ' is-wide');
    lbBox.innerHTML = html;

    // a missing photo swaps to the note naming its path
    $$('img', lbBox).forEach(function (im) {
      im.addEventListener('error', function () {
        var note = im.parentNode && im.parentNode.querySelector('[data-fallback]');
        im.style.display = 'none';
        if (note) note.hidden = false;
      });
    });

    paintRes(items);
  }

  function paintRes(items) {
    if (items.length < 2) { lbRes.hidden = true; return; }
    lbRes.hidden = false;
    lbCount.textContent = (shot + 1) + ' / ' + items.length;
    lbDots.innerHTML = items.map(function (_, n) {
      return '<span class="lb__dot' + (n === shot ? ' is-on' : '') + '"></span>';
    }).join('');
  }

  function stepShot(dir) {
    var w = WORK[current];
    if (!w || animating) return;
    var items = resourcesOf(w);
    if (items.length < 2) return;

    var front = lbBox.querySelector('.lb__card[data-i="0"]');
    animating = true;

    var advance = function () {
      shot = (shot + dir + items.length) % items.length;
      paintStack(w);
      animating = false;
    };

    if (dir > 0 && front && !M.reduced()) {
      front.classList.add('is-out');       // pop the top card away first
      window.setTimeout(advance, 260);
    } else {
      advance();
    }
  }

  $('#lbShotNext').addEventListener('click', function () { stepShot(1); });
  $('#lbShotPrev').addEventListener('click', function () { stepShot(-1); });

  // clicking the front card advances, except on the film (its own controls)
  lbBox.addEventListener('click', function (e) {
    if (e.target.closest('iframe')) return;
    var card = e.target.closest('.lb__card[data-i="0"]');
    if (card) stepShot(1);
  });

  // drag or swipe the stack
  (function () {
    var sx = 0, sy = 0, down = false;
    lbBox.addEventListener('pointerdown', function (e) {
      if (e.target.closest('iframe')) return;
      down = true; sx = e.clientX; sy = e.clientY;
    });
    lbBox.addEventListener('pointerup', function (e) {
      if (!down) return;
      down = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 55) {
        stepShot((dx < 0 || dy < 0) ? 1 : -1);
      }
    });
    lbBox.addEventListener('pointercancel', function () { down = false; });
  })();

  /* ---------------- coverflow: the neighbouring projects ---------------- */
  var sidePrev = $('#lbSidePrev'), sideNext = $('#lbSideNext');

  function visibleOrder() {
    return tiles.filter(function (t) { return !t.classList.contains('is-out'); })
                .map(function (t) { return +t.getAttribute('data-i'); });
  }

  function paintSide(el, idx) {
    if (!el) return;
    var w = WORK[idx];
    if (!w || idx === current) { el.hidden = true; return; }
    el.hidden = false;
    var hue = (idx * 47) % 360;
    var art = w.thumb
      ? '<img src="' + esc(w.thumb) + '" alt="" />'
      : '<span class="tile__ph" style="--h:' + hue + '"><span>' + esc(w.title.charAt(0)) + '</span></span>';
    el.innerHTML = art + '<span class="lb__sideLabel">' + esc(w.title) + '</span>';
    el.setAttribute('aria-label', 'Open ' + w.title);
  }

  function paintSides() {
    var order = visibleOrder();
    if (order.length < 2) {
      if (sidePrev) sidePrev.hidden = true;
      if (sideNext) sideNext.hidden = true;
      return;
    }
    var at = order.indexOf(current);
    paintSide(sidePrev, order[(at - 1 + order.length) % order.length]);
    paintSide(sideNext, order[(at + 1) % order.length]);
  }

  if (sidePrev) sidePrev.addEventListener('click', function () { step(-1); });
  if (sideNext) sideNext.addEventListener('click', function () { step(1); });

  /* ---------------- paint one project ---------------- */
  function render(i) {
    var w = WORK[i];
    if (!w) return;
    current = i;
    shot = 0;                                  // each project opens on its first item
    paintStack(w);
    lbCat.textContent = w.cat;
    lbTitle.textContent = w.title;
    lbDesc.textContent = w.desc || '';
    var tags = [];
    if (w.client) tags.push(w.client);
    if (w.year) tags.push(w.year);
    lbTags.innerHTML = tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    paintSides();
  }

  function openLb(i, trigger) {
    lastFocus = trigger || document.activeElement;

    // expand-card: measure the tile before the dialog paints over it
    var fromRect = null;
    if (trigger && trigger.classList && trigger.classList.contains('tile')) {
      var f = trigger.querySelector('.tile__frame');
      if (f) fromRect = f.getBoundingClientRect();
    }

    render(i);
    lb.hidden = false;
    lb.classList.add('is-shown');
    // reflow so the fade runs AND the dialog is displayed before focus() —
    // focusing inside a display:none element is silently dropped
    void lb.offsetWidth;
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
    M.flip(fromRect, lbBox);
    lbClose.focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    window.setTimeout(function () {
      lbBox.innerHTML = '';               // unmount so audio stops
      M.unflip(lbBox);
      lb.classList.remove('is-shown');
      lb.hidden = true;
    }, reduceMQ.matches ? 0 : 320);
    if (lastFocus) lastFocus.focus();
  }

  function step(dir) {
    var visible = tiles
      .filter(function (t) { return !t.classList.contains('is-out'); })
      .map(function (t) { return +t.getAttribute('data-i'); });
    if (!visible.length) return;
    var at = visible.indexOf(current);
    render(visible[(at + dir + visible.length) % visible.length]);
  }

  gridEl.addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (t) openLb(+t.getAttribute('data-i'), t);
  });
  lbClose.addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) { setSheet(false); burger.focus(); }
      return;
    }
    if (e.key === 'Escape') closeLb();
    // multi-resource is the common case, so the arrows step through the
    // project's own items; the side cards move between projects
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') stepShot(-1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') stepShot(1);
  });

  // keep tab focus inside the dialog, but still allow reaching the player
  lb.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var stops = $$('button, iframe', lb);
    if (!stops.length) return;
    var first = stops[0], last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------------- portrait ---------------- */
  var portrait = $('#portrait'), portraitPh = $('#portraitPh');
  if (portrait) {
    portrait.addEventListener('load', function () { portrait.hidden = false; if (portraitPh) portraitPh.hidden = true; });
    portrait.addEventListener('error', function () { if (portrait.parentNode) portrait.parentNode.removeChild(portrait); });
  }
})();
