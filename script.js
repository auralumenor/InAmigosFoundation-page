/* ============================================================
   InAmigos Foundation — script.js
   Animations & visual effects (separate from main.js logic)

   Features:
   1. Reduced-motion guard (all effects disabled if user prefers)
   2. Scroll-reveal — fade + slide-up for cards and sections
   3. Staggered children — grid items animate in sequence
   4. Nav scroll state — enhanced shadow/blur when scrolled
   5. Hero parallax — subtle vertical shift on scroll
   6. Progress bar reveal — bars animate to target width on scroll
   7. Button ripple — ink-splash feedback on click
   8. Smooth anchor scroll — offset for sticky nav height
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   0. Reduced-motion guard
   Everything below respects prefers-reduced-motion.
   When reduced motion is preferred, elements are made visible
   immediately with no transitions.
   ------------------------------------------------------------ */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   1. Scroll-reveal
   Elements with [data-reveal] fade up from 24 px below their
   final position when they enter the viewport.

   Usage in HTML (added automatically below for all .card elements):
     <section data-reveal> ... </section>

   Variants:
     data-reveal="left"   — slides in from the left
     data-reveal="right"  — slides in from the right
     data-reveal          — (default) fades up
   ------------------------------------------------------------ */
(function initReveal() {
  /* Inject the reveal CSS into <head> so it's available
     before the first paint — no FOUC on fast connections.    */
  const style = document.createElement('style');
  style.textContent = `
    [data-reveal] {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
                  transform 0.55s cubic-bezier(0.22,1,0.36,1);
    }
    [data-reveal="left"]  { transform: translateX(-32px); }
    [data-reveal="right"] { transform: translateX( 32px); }
    [data-reveal].revealed {
      opacity: 1;
      transform: none;
    }
    /* Stagger children inside a [data-stagger] parent */
    [data-stagger] > * {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    [data-stagger] > *.revealed {
      opacity: 1;
      transform: none;
    }
  `;

  if (!REDUCED) document.head.appendChild(style);

  /* Auto-tag every .card with data-reveal so we don't have to
     touch the HTML manually.                                  */
  document.querySelectorAll('.card').forEach((el) => {
    if (!el.hasAttribute('data-reveal') && !el.closest('[data-reveal]')) {
      el.setAttribute('data-reveal', '');
    }
  });

  /* Also auto-tag known grid containers for stagger          */
  const STAGGER_SELECTORS = [
    '.project-grid',
    '.initiative-card-grid',
    '.partner-logo-grid',
    '.social-feed-grid',
    '.highlights-grid',
    '.credentials-grid',
    '.values-grid',
    '.story-grid',
    '.counter-grid',
    '.mission-pillars',
  ];
  document.querySelectorAll(STAGGER_SELECTORS.join(',')).forEach((el) => {
    el.setAttribute('data-stagger', '');
    /* Remove data-reveal from the grid itself so it doesn't
       double-animate — the children handle their own reveal. */
    el.removeAttribute('data-reveal');
  });

  if (REDUCED) {
    /* Skip all animation — just show everything             */
    document.querySelectorAll('[data-reveal],[data-stagger] > *').forEach(
      (el) => { el.classList.add('revealed'); }
    );
    return;
  }

  /* Single shared IntersectionObserver for all reveal targets */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('revealed');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  /* Single shared observer for stagger parents              */
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const children = Array.from(entry.target.children);
        children.forEach((child, i) => {
          setTimeout(() => child.classList.add('revealed'), i * 70);
        });
        staggerObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('[data-reveal]').forEach((el) =>
    revealObserver.observe(el)
  );
  document.querySelectorAll('[data-stagger]').forEach((el) =>
    staggerObserver.observe(el)
  );
})();


/* ------------------------------------------------------------
   2. Nav scroll state
   Adds .site-nav--scrolled when the page has scrolled > 8 px.
   CSS in style.css already handles the visual (shadow + blur).
   ------------------------------------------------------------ */
(function initNavScroll() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  /* Inject the scrolled style */
  const style = document.createElement('style');
  style.textContent = `
    .site-nav--scrolled {
      background: rgba(253, 249, 243, 0.97) !important;
      box-shadow: 0 2px 24px rgba(72, 48, 25, 0.12) !important;
    }
  `;
  document.head.appendChild(style);

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('site-nav--scrolled', window.scrollY > 8);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();


/* ------------------------------------------------------------
   3. Hero parallax
   The hero's main photo shifts up at 25% of the scroll offset
   for a subtle depth effect. Disabled on mobile (< 768 px)
   and when reduced motion is preferred.
   ------------------------------------------------------------ */
(function initParallax() {
  if (REDUCED) return;

  const wrap = document.querySelector('.visual-main-wrap');
  if (!wrap) return;

  const img = wrap.querySelector('.visual-main');
  if (!img) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.innerWidth < 768) {
          img.style.transform = '';
          ticking = false;
          return;
        }
        const rect   = wrap.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (window.innerHeight / 2 - center) * 0.12;
        img.style.transform = `translateY(${offset.toFixed(2)}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ------------------------------------------------------------
   4. Progress bar reveal
   Each .initiative-progress-fill starts at width 0 (overriding
   the --fill CSS variable) and animates to its target when
   the parent scrolls into view.
   ------------------------------------------------------------ */
(function initProgressBars() {
  const bars = document.querySelectorAll('.initiative-progress-fill');
  if (!bars.length) return;

  if (REDUCED) {
    /* Skip animation — already at correct width via CSS var  */
    return;
  }

  /* Temporarily set width to 0 so we can animate in         */
  bars.forEach((bar) => { bar.style.width = '0%'; });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const bar    = entry.target;
        const target = getComputedStyle(bar).getPropertyValue('--fill').trim() || '0%';
        /* Small delay so the card reveal animation finishes first */
        setTimeout(() => {
          bar.style.transition = 'width 1s cubic-bezier(0.22, 1, 0.36, 1)';
          bar.style.width      = target;
        }, 300);
        observer.unobserve(bar);
      });
    },
    { threshold: 0.5 }
  );

  bars.forEach((bar) => observer.observe(bar));
})();


/* ------------------------------------------------------------
   5. Button ripple effect
   Adds a circular ink-splash animation on mousedown/touchstart
   for every .btn element across all pages.
   ------------------------------------------------------------ */
(function initRipple() {
  if (REDUCED) return;

  /* Inject ripple CSS                                        */
  const style = document.createElement('style');
  style.textContent = `
    .btn { position: relative; overflow: hidden; }
    .btn-ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-anim 0.55s linear;
      background: rgba(255, 255, 255, 0.28);
      pointer-events: none;
    }
    @keyframes ripple-anim {
      to { transform: scale(4); opacity: 0; }
    }
    /* Darker ripple on light buttons                        */
    .btn.secondary .btn-ripple,
    .btn.initiative-cta .btn-ripple {
      background: rgba(99, 64, 33, 0.14);
    }
  `;
  document.head.appendChild(style);

  function spawnRipple(e) {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    /* Use touch position or mouse position                  */
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const size   = Math.max(rect.width, rect.height) * 1.4;
    const x      = clientX - rect.left - size / 2;
    const y      = clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /* Attach to all current buttons and use event delegation
     for any buttons added dynamically (e.g., carousel dots). */
  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.btn');
    if (btn) spawnRipple(Object.assign(e, { currentTarget: btn }));
  });
  document.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('.btn');
    if (btn) spawnRipple(Object.assign(e, { currentTarget: btn }));
  }, { passive: true });
})();


/* ------------------------------------------------------------
   6. Smooth anchor scroll with nav offset
   Intercepts all internal [href^="#"] links and scrolls
   smoothly, subtracting the sticky nav height so the target
   isn't hidden underneath it.
   ------------------------------------------------------------ */
(function initAnchorScroll() {
  const nav = document.querySelector('.site-nav');

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id     = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    e.preventDefault();

    const navH   = nav ? nav.getBoundingClientRect().height : 0;
    const top    = target.getBoundingClientRect().top + window.scrollY - navH - 12;

    if (REDUCED) {
      window.scrollTo({ top, behavior: 'instant' });
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }

    /* Move focus to the target for accessibility            */
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
})();


/* ------------------------------------------------------------
   7. Pillar icon bounce
   Mission pillars get a subtle bounce animation on hover
   triggered by adding/removing a class (keeps CSS in one place).
   ------------------------------------------------------------ */
(function initPillarBounce() {
  if (REDUCED) return;

  const style = document.createElement('style');
  style.textContent = `
    .pillar-icon {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .mission-pillar:hover .pillar-icon {
      transform: scale(1.18) rotate(-4deg);
    }
  `;
  document.head.appendChild(style);
})();


/* ------------------------------------------------------------
   8. Timeline item slide-in
   Each .timeline-item slides in from the right with increasing
   delay as the timeline scrolls into view.
   ------------------------------------------------------------ */
(function initTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;

  if (REDUCED) return;

  const style = document.createElement('style');
  style.textContent = `
    .timeline-item {
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
                  transform 0.5s cubic-bezier(0.22,1,0.36,1);
    }
    .timeline-item.revealed {
      opacity: 1;
      transform: none;
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item  = entry.target;
        const index = Array.from(items).indexOf(item);
        setTimeout(() => item.classList.add('revealed'), index * 80);
        observer.unobserve(item);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -20px 0px' }
  );

  items.forEach((item) => observer.observe(item));
})();


/* ------------------------------------------------------------
   9. Partner tile shimmer on hover
   Injects a one-time shimmer sweep across the logo box when
   the tile is hovered.
   ------------------------------------------------------------ */
(function initPartnerShimmer() {
  if (REDUCED) return;

  const style = document.createElement('style');
  style.textContent = `
    .partner-logo-wrap {
      position: relative;
      overflow: hidden;
    }
    .partner-logo-wrap::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(255,255,255,0.55) 50%,
        transparent 60%
      );
      transform: translateX(-100%);
      transition: transform 0s;
    }
    .partner-tile:hover .partner-logo-wrap::after {
      transform: translateX(100%);
      transition: transform 0.45s ease;
    }
  `;
  document.head.appendChild(style);
})();
