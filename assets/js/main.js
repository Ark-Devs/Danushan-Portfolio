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
  var usingYT = false;

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
            '&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1';
    heroMedia.appendChild(f);
    if (soundBtn) soundBtn.hidden = true;   // no audio control over the embed
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
  var running = false, queued = false;

  function frame() {
    running = true;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    nav.classList.toggle('is-stuck', y > 20);

    if (heroEl && heroReel && wordInner) {
      var h = heroEl.offsetHeight || 1;
      var p = clamp(y / (h * 0.9), 0, 1);
      heroReel.style.transform = 'translate3d(0,' + (p * 46) + 'px,0) scale(' + (1 + p * 0.07) + ')';
      wordInner.style.transform = 'translate3d(0,' + (p * -84) + 'px,0) scale(' + (1 - p * 0.05) + ')';
      wordInner.style.opacity = String(clamp(1 - p * 1.35, 0, 1));
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

  /* ---------------- lightbox ---------------- */
  var lb = $('#lb'), lbBox = $('#lbBox'), lbCat = $('#lbCat'), lbTitle = $('#lbTitle');
  var lbDesc = $('#lbDesc'), lbTags = $('#lbTags'), lbClose = $('#lbClose');
  var current = -1, lastFocus = null;

  function render(i) {
    var w = WORK[i];
    if (!w) return;
    current = i;
    lbBox.className = 'lb__box' + (w.vertical ? '' : ' is-wide');
    lbBox.innerHTML = w.yt
      ? '<iframe src="https://www.youtube.com/embed/' + esc(w.yt) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" ' +
        'title="' + esc(w.title) + '" ' +
        'allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
      : '<div class="lb__ph">Video not linked yet<br />Add a YouTube id in work.js</div>';
    lbCat.textContent = w.cat;
    lbTitle.textContent = w.title;
    lbDesc.textContent = w.desc || '';
    var tags = [];
    if (w.client) tags.push(w.client);
    if (w.year) tags.push(w.year);
    lbTags.innerHTML = tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  }

  function openLb(i, trigger) {
    lastFocus = trigger || document.activeElement;
    render(i);
    lb.hidden = false;
    lb.classList.add('is-shown');
    // reflow so the fade runs AND the dialog is displayed before focus() —
    // focusing inside a display:none element is silently dropped
    void lb.offsetWidth;
    lb.classList.add('is-open');
    document.body.classList.add('is-locked');
    lbClose.focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    window.setTimeout(function () {
      lbBox.innerHTML = '';               // unmount so audio stops
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
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
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
