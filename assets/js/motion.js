/* ==================================================================
   DHANUVJ — motion engine
   ------------------------------------------------------------------
   Hand-rolled rather than pulled from a library, so the site stays a
   zero-dependency static build. The patterns follow motion.dev/ui:

     screenshot-scroll-reveal  hero plate tilts up out of 3D
     card-stack               ghost plates fanned behind the reel
     border-beam              light travelling a masked border
     scroll-word-reveal       per-word opacity, 0.15 -> 1
     magnetic-pull            controls drift toward the cursor
     expand-card              FLIP from tile into the lightbox
     coverflow                neighbours at rotateY 22, scale .82
     footer-reveal            sticky footer under an opaque page

   One rAF ticker drives everything continuous. It idles when the tab
   is hidden and skips work that is off screen.
   ================================================================== */

window.M = (function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fns = [];
  var ticking = false;
  var ready = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // The dimmed starting states (words at .15, footer at .25) only apply
  // once the ticker has actually produced a frame. Without this, a page
  // that never gets a frame — loaded in a background tab, rAF throttled,
  // script blocked — would render its own content greyed out and stay
  // that way. No frame, no dimming.
  function loop() {
    if (!ready) {
      ready = true;
      document.documentElement.classList.add('motion-ready');
    }
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](); } catch (e) { /* one bad effect must not stop the rest */ }
    }
    requestAnimationFrame(loop);
  }
  // No document.hidden guard here: rAF is already paused by the browser
  // while the tab is hidden, and a manual guard only desyncs `ticking`.
  function start() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(loop);
  }
  function add(fn) { fns.push(fn); start(); }

  /* ---------- progress of an element through the viewport ----------
     0 when its top hits `startAt` down the screen, 1 when its bottom
     reaches `endAt`. Mirrors motion's ["start 0.85", "end 0.35"]. */
  function progressOf(el, startAt, endAt) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var from = vh * (startAt == null ? 0.85 : startAt);
    var to   = vh * (endAt   == null ? 0.35 : endAt);
    var span = (r.height + (from - to)) || 1;
    return clamp((from - r.top) / span, 0, 1);
  }

  /* ================================================================
     scroll-word-reveal
     Per-word opacity only. startOpacity .15, spread .8, window .2.
     The source text stays the accessible name; the split words are
     hidden from assistive tech so it is not read one word per node.
     ================================================================ */
  function words(el, opts) {
    opts = opts || {};
    var startOpacity = opts.startOpacity == null ? 0.15 : opts.startOpacity;
    var spread       = opts.spread       == null ? 0.8  : opts.spread;
    var win          = opts.wordDuration == null ? 0.2  : opts.wordDuration;

    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    el.setAttribute('aria-label', text);
    var parts = text.split(' ');
    el.textContent = '';
    var spans = parts.map(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w + (i < parts.length - 1 ? ' ' : '');
      el.appendChild(s);
      return s;
    });

    if (reduceMQ.matches) {
      spans.forEach(function (s) { s.style.opacity = 1; });
      return;
    }

    var n = spans.length;
    add(function () {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > (window.innerHeight + 100)) return;
      var p = progressOf(el, 0.85, 0.35);
      for (var i = 0; i < n; i++) {
        // every word keeps the same window length, last one lands by 1
        var startP = n > 1 ? (i / (n - 1)) * spread : 0;
        var local = clamp((p - startP) / win, 0, 1);
        spans[i].style.opacity = String(startOpacity + (1 - startOpacity) * local);
      }
    });
  }

  /* ================================================================
     magnetic-pull
     ================================================================ */
  var fineMQ = window.matchMedia('(hover:hover) and (pointer:fine)');

  function magnetic(el, opts) {
    // Read both media queries live rather than once at attach time: a
    // pointer can become fine long after load (tablet plus mouse, an
    // external display, devtools emulation), and a one-time check leaves
    // the effect permanently dead when it does.
    opts = opts || {};
    var strength = opts.strength == null ? 0.34 : opts.strength;
    var radius   = opts.radius   == null ? 90   : opts.radius;
    var tx = 0, ty = 0, cx = 0, cy = 0, active = false;

    document.addEventListener('pointermove', function (e) {
      if (reduceMQ.matches || !fineMQ.matches) return;
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      var mx = r.left + r.width / 2, my = r.top + r.height / 2;
      var dx = e.clientX - mx, dy = e.clientY - my;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var reach = Math.max(r.width, r.height) / 2 + radius;
      if (dist < reach) { active = true; tx = dx * strength; ty = dy * strength; }
      else if (active) { tx = 0; ty = 0; }
    }, { passive: true });

    add(function () {
      if (!active && Math.abs(cx) < 0.01 && Math.abs(cy) < 0.01) return;
      cx = lerp(cx, tx, 0.16);
      cy = lerp(cy, ty, 0.16);
      if (Math.abs(cx) < 0.01 && Math.abs(cy) < 0.01) { cx = 0; cy = 0; active = false; }
      el.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
    });
  }

  /* ================================================================
     border-beam — a light travelling the edge of a box
     ================================================================ */
  function beam(el, opts) {
    if (reduceMQ.matches) return;
    opts = opts || {};
    var b = document.createElement('span');
    b.className = 'beam';
    b.setAttribute('aria-hidden', 'true');
    if (opts.duration) b.style.animationDuration = opts.duration;
    if (opts.delay) b.style.animationDelay = opts.delay;
    el.appendChild(b);
  }

  /* ================================================================
     expand-card — FLIP a source rect onto a destination element
     ================================================================ */
  function flip(fromRect, toEl, opts) {
    if (reduceMQ.matches || !fromRect) return;
    opts = opts || {};
    var to = toEl.getBoundingClientRect();
    if (!to.width || !to.height) return;

    var dx = (fromRect.left + fromRect.width / 2) - (to.left + to.width / 2);
    var dy = (fromRect.top + fromRect.height / 2) - (to.top + to.height / 2);
    var sx = fromRect.width / to.width;
    var sy = fromRect.height / to.height;

    toEl.style.transition = 'none';
    toEl.style.transformOrigin = 'center center';
    toEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toEl.style.transition = 'transform ' + (opts.duration || '.62s') + ' cubic-bezier(.16,.84,.34,1)';
        toEl.style.transform = 'none';
      });
    });
  }
  function unflip(el) {
    el.style.transition = 'none';
    el.style.transform = 'none';
  }

  /* ================================================================
     footer-reveal — the footer sits under an opaque page layer
     ================================================================ */
  function footerReveal(pageEl, footEl) {
    if (!pageEl || !footEl) return;

    function size() {
      // the page needs exactly the footer's height of runway beneath it
      pageEl.style.marginBottom = footEl.offsetHeight + 'px';
    }
    size();
    window.addEventListener('resize', size, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(size).observe(footEl);

    if (reduceMQ.matches) { footEl.style.opacity = 1; return; }

    add(function () {
      var h = footEl.offsetHeight || 1;
      var doc = document.documentElement;
      var left = doc.scrollHeight - (window.pageYOffset + window.innerHeight);
      var p = clamp(1 - (left / h), 0, 1);
      footEl.style.opacity = String(0.25 + 0.75 * p);
      footEl.style.transform = 'scale(' + (0.965 + 0.035 * p) + ')';
    });
  }

  return {
    add: add,
    lerp: lerp,
    clamp: clamp,
    progressOf: progressOf,
    words: words,
    magnetic: magnetic,
    beam: beam,
    flip: flip,
    unflip: unflip,
    footerReveal: footerReveal,
    reduced: function () { return reduceMQ.matches; }
  };
})();
