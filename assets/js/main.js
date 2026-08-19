/* ==================================================================
   DHANUVJ — v2 behaviour
   ------------------------------------------------------------------
   Reads window.WORK and window.SITE from work.js. Nothing in here
   needs editing to add projects — edit work.js instead.
   ================================================================== */

(function () {
  'use strict';

  var WORK = window.WORK || [];
  var SITE = window.SITE || {};

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- links from SITE ---------------- */
  $$('[data-link]').forEach(function (a) {
    var key = a.getAttribute('data-link');
    if (SITE[key]) a.href = SITE[key];
  });

  /* ---------------- nav ---------------- */
  var nav = $('#nav');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('is-stuck', window.scrollY > 20);
  }, { passive: true });

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
  burger.addEventListener('click', function () {
    setSheet(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setSheet(false); }); });

  /* ---------------- hero reel ----------------
     Try the local file first. If it is missing or cannot play, fall back
     to the YouTube reel so the hero is never a dead rectangle. */
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
    return '<button class="tile" data-i="' + i + '" data-cat="' + esc(w.cat) + '" aria-label="Open ' + esc(w.title) + '">' +
             '<span class="tile__frame">' + art +
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

  /* ---------------- reveal ---------------- */
  if ('IntersectionObserver' in window && !reduceMQ.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    $$('[data-rv]').concat(tiles).forEach(function (el) { io.observe(el); });

    // never strand on-screen content hidden if the observer misfires
    window.setTimeout(function () {
      $$('[data-rv]:not(.is-in), .tile:not(.is-in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 2000);
  } else {
    $$('[data-rv]').concat(tiles).forEach(function (el) { el.classList.add('is-in'); });
  }

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
    // reflow so the fade actually runs AND the dialog is displayed before
    // focus() — focusing a display:none element is silently dropped
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
    }, reduceMQ.matches ? 0 : 300);
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
