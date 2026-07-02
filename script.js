/* ============================================================
   InAmigos Foundation — script.js
   Animations & visual effects (separate from main.js logic)

   Features:
   0. HTML partial loader — injects header.html + footer.html
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
   0. HTML partial loader
   Fetches header.html and footer.html and injects them into
   #site-header and #site-footer. After injection it sets the
   correct .active class on the nav link matching data-page on
   <body>, then dispatches a custom "partialsReady" event so
   the rest of the script can safely query the injected DOM.

   NOTE: This requires the page to be served over HTTP (a local
   server or any static host). It will not work when opening
   HTML files directly via file:// due to browser CORS rules.
   Use: npx serve . or python -m http.server 8080
   ------------------------------------------------------------ */
(function loadPartials() {
  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');
  const page       = document.body.dataset.page || '';

  if (!headerSlot && !footerSlot) {
    // Partials already inlined (fallback) — fire event immediately
    document.dispatchEvent(new Event('partialsReady'));
    return;
  }

  const tasks = [];

  if (headerSlot) {
    tasks.push(
      fetch('header.html')
        .then((r) => r.text())
        .then((html) => {
          headerSlot.outerHTML = html;
          // Set active nav link based on data-page attribute
          document.querySelectorAll('[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === page);
          });
        })
        .catch(() => {
          // Silently fail — page still works, just without the nav partial
          console.warn('header.html could not be loaded. Serve via HTTP, not file://.');
        })
    );
  }

  if (footerSlot) {
    tasks.push(
      fetch('footer.html')
        .then((r) => r.text())
        .then((html) => { footerSlot.outerHTML = html; })
        .catch(() => {
          console.warn('footer.html could not be loaded. Serve via HTTP, not file://.');
        })
    );
  }

  Promise.all(tasks).then(() => {
    document.dispatchEvent(new Event('partialsReady'));
  });
})();

/* All subsequent modules wait for partialsReady so they can
   safely query elements injected by the loader above.        */
document.addEventListener('partialsReady', function onReady() {

/* ============================================================
   Everything below is wrapped in the partialsReady handler
   ============================================================ */

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
    /* Exclude timeline card — it has its own per-item animation
       and double-hiding causes items to stay invisible.       */
    if (el.classList.contains('about-timeline')) return;
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
   2.5 Mobile Menu Toggle
   Toggles the .open class on the mobile nav and updates aria-expanded.
   ------------------------------------------------------------ */
(function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.site-nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', function() {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggleBtn.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }
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
   Each .timeline-item slides in from the right with staggered
   delay as the timeline scrolls into view.

   Strategy: items start opacity:1 in CSS (safe default).
   JS hides them only AFTER attaching observers, so there's
   no window where items are hidden but unobserved.
   ------------------------------------------------------------ */
(function initTimeline() {
  const items = Array.from(document.querySelectorAll('.timeline-item'));
  if (!items.length) return;
  if (REDUCED) return;
  if (!('IntersectionObserver' in window)) return;

  /* Inject animation styles */
  const style = document.createElement('style');
  style.textContent = `
    .timeline-item.tl-hidden {
      opacity: 0;
      transform: translateX(28px);
      transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
                  transform 0.55s cubic-bezier(0.22,1,0.36,1);
    }
    .timeline-item.tl-visible {
      opacity: 1 !important;
      transform: none !important;
      transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
                  transform 0.55s cubic-bezier(0.22,1,0.36,1);
    }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item  = entry.target;
        const index = items.indexOf(item);
        setTimeout(() => {
          item.classList.remove('tl-hidden');
          item.classList.add('tl-visible');
        }, index * 100);
        observer.unobserve(item);
      });
    },
    /* Lower threshold + no bottom margin so items near the
       fold are caught even on short viewports               */
    { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
  );

  /* Hide items AFTER observers are attached — zero gap      */
  items.forEach((item) => {
    observer.observe(item);
    item.classList.add('tl-hidden');
  });
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

}); /* end partialsReady */


/* ============================================================
   SECTION B — Additional animations & interactive effects
   All run after partialsReady via a second listener so they
   integrate cleanly with the partial-loader timing.
   ============================================================ */
document.addEventListener('partialsReady', function onInteractive() {

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     10. Scroll progress bar
     A thin accent-colored bar at the very top of the viewport
     that fills as the user scrolls down the page.
     ---------------------------------------------------------- */
  (function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    const style = document.createElement('style');
    style.textContent = `
      #scroll-progress {
        position: fixed;
        top: 0; left: 0;
        height: 3px;
        width: 0%;
        background: linear-gradient(90deg, var(--accent) 0%, var(--green) 100%);
        z-index: 9999;
        pointer-events: none;
        transition: width 0.1s linear;
        box-shadow: 0 0 8px rgba(138, 90, 43, 0.4);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const total    = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = total > 0 ? ((scrolled / total) * 100).toFixed(2) + '%' : '0%';
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  })();


  /* ----------------------------------------------------------
     11. Active section nav highlight
     Watches each section with an id and marks the matching
     nav link [data-nav] as active while that section is the
     most visible in the viewport.
     ---------------------------------------------------------- */
  (function initActiveSection() {
    const sections = Array.from(document.querySelectorAll('main [id]'));
    const navLinks = Array.from(document.querySelectorAll('.site-nav-links a[data-nav]'));
    if (!sections.length || !navLinks.length) return;

    /* Map section id → nav key: we match by checking if the
       nav link's href contains the section id              */
    const navHeight = (document.querySelector('.site-nav')?.offsetHeight || 60) + 20;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id   = entry.target.id;
          /* Find the link whose href ends with #id          */
          navLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const active = href.endsWith('#' + id) || href.endsWith('/' + id);
            if (active) link.classList.add('section-active');
            else link.classList.remove('section-active');
          });
        });
      },
      { rootMargin: `-${navHeight}px 0px -55% 0px`, threshold: 0 }
    );

    const style = document.createElement('style');
    style.textContent = `
      .site-nav-links a.section-active {
        background: rgba(138, 90, 43, 0.1) !important;
        color: var(--accent-dark) !important;
      }
    `;
    document.head.appendChild(style);
    sections.forEach((s) => observer.observe(s));
  })();


  /* ----------------------------------------------------------
     12. 3D card tilt
     .card elements tilt toward the mouse on hover using
     CSS transforms (perspective). Resets smoothly on mouseleave.
     Disabled on touch devices and reduced-motion.
     ---------------------------------------------------------- 
  (function initCardTilt() {
    if (REDUCED) return;
    if (window.matchMedia('(hover: none)').matches) return; // touch device

    const style = document.createElement('style');
    style.textContent = `
      .card {
        transform-style: preserve-3d;
        will-change: transform;
        transition: transform 0.08s ease, box-shadow 0.08s ease !important;
      }
      .card.tilt-reset {
        transition: transform 0.45s cubic-bezier(0.22,1,0.36,1),
                    box-shadow 0.45s ease !important;
      }
    `;
    document.head.appendChild(style);

    const MAX_TILT   = 6;   // degrees
    const SCALE      = 1.012;

    document.querySelectorAll('.card').forEach((card) => {
      /* Skip very tall cards — tilt looks odd on them       */
      /*
      if (card.classList.contains('impact-band')) return;
      if (card.classList.contains('counter-dashboard')) return;

      card.addEventListener('mousemove', (e) => {
        card.classList.remove('tilt-reset');
        const rect   = card.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);
        const rotateX = (-dy * MAX_TILT).toFixed(2);
        const rotateY = ( dx * MAX_TILT).toFixed(2);
        card.style.transform =
          `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${SCALE})`;
      });

      card.addEventListener('mouseleave', () => {
        card.classList.add('tilt-reset');
        card.style.transform = '';
        setTimeout(() => card.classList.remove('tilt-reset'), 450);
      });
    });
  })();
*/

  /* ----------------------------------------------------------
     13. Magnetic buttons
     Primary and donate buttons slightly follow the cursor
     within a radius, snapping back on leave.
     ---------------------------------------------------------- */
  (function initMagneticBtns() {
    if (REDUCED) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const style = document.createElement('style');
    style.textContent = `
      .btn.primary, .btn.donate, .btn-band-donate, .btn-band-volunteer {
        transition:
          transform 0.2s cubic-bezier(0.22,1,0.36,1),
          background var(--dur-fast),
          box-shadow var(--dur-fast) !important;
      }
    `;
    document.head.appendChild(style);

    const STRENGTH = 0.3;
    const RADIUS   = 80;

    document.querySelectorAll(
      '.btn.primary, .btn.donate, .btn-band-donate, .btn-band-volunteer'
    ).forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS) {
          btn.style.transform =
            `translate(${(dx * STRENGTH).toFixed(1)}px, ${(dy * STRENGTH).toFixed(1)}px)`;
        }
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  })();


  /* ----------------------------------------------------------
     14. Cursor spotlight
     A soft warm glow follows the cursor on `.page-shell`,
     giving sections depth on desktop.
     ---------------------------------------------------------- */
  (function initCursorSpotlight() {
    if (REDUCED) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const shell = document.querySelector('.page-shell');
    if (!shell) return;

    const spotlight = document.createElement('div');
    spotlight.id = 'cursor-spotlight';
    const style = document.createElement('style');
    style.textContent = `
      #cursor-spotlight {
        position: fixed;
        pointer-events: none;
        z-index: 0;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(138, 90, 43, 0.055) 0%,
          transparent 70%
        );
        transform: translate(-50%, -50%);
        transition: opacity 0.4s;
        opacity: 0;
        top: 0; left: 0;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(spotlight);

    let mx = 0, my = 0, raf = null;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      spotlight.style.opacity = '1';
      if (!raf) {
        raf = requestAnimationFrame(() => {
          spotlight.style.left = mx + 'px';
          spotlight.style.top  = my + 'px';
          raf = null;
        });
      }
    });

    document.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
    });
  })();


  /* ----------------------------------------------------------
     15. Hero canvas particles
     Lightweight canvas overlay on the hero section with slowly
     drifting dots — organic, not distracting.
     ---------------------------------------------------------- */
  (function initHeroParticles() {
    if (REDUCED) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas  = document.createElement('canvas');
    canvas.id     = 'hero-particles';
    const style   = document.createElement('style');
    style.textContent = `
      #hero-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        z-index: 0;
        opacity: 0.55;
      }
      .hero { position: relative; overflow: hidden; }
      .hero > * { position: relative; z-index: 1; }
    `;
    document.head.appendChild(style);
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    const COUNT = 28;
    let W, H, dots;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }

    function makeDot() {
      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    Math.random() * 2.2 + 0.8,
        vx:   (Math.random() - 0.5) * 0.28,
        vy:   (Math.random() - 0.5) * 0.28,
        a:    Math.random() * 0.6 + 0.2,
      };
    }

    function init() {
      resize();
      dots = Array.from({ length: COUNT }, makeDot);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -5) d.x = W + 5;
        if (d.x > W + 5) d.x = -5;
        if (d.y < -5) d.y = H + 5;
        if (d.y > H + 5) d.y = -5;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 90, 43, ${d.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    init();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(hero);
  })();


  /* ----------------------------------------------------------
     16. Image blur-up lazy load
     Images with loading="lazy" start blurred and transition to
     sharp once the browser has loaded them.
     ---------------------------------------------------------- */
  (function initBlurUp() {
    if (REDUCED) return;

    const style = document.createElement('style');
    style.textContent = `
      img[loading="lazy"] {
        filter: blur(8px) saturate(0.6);
        transition: filter 0.55s cubic-bezier(0.22,1,0.36,1);
      }
      img[loading="lazy"].img-loaded {
        filter: none;
      }
    `;
    document.head.appendChild(style);

    function markLoaded(img) {
      img.classList.add('img-loaded');
    }

    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        markLoaded(img);
      } else {
        img.addEventListener('load', () => markLoaded(img), { once: true });
      }
    });
  })();


  /* ----------------------------------------------------------
     17. Counter flip (slot machine digits)
     Wraps each counter number in a CSS 3D flip container so
     digits tick upward like an old scoreboard.
     ---------------------------------------------------------- */
  (function initCounterFlip() {
    if (REDUCED) return;

    const style = document.createElement('style');
    style.textContent = `
      .counter-tile {
        perspective: 600px;
      }
      .counter-num {
        display: inline-block;
        transition: color 0.3s;
      }
      @keyframes flip-in {
        0%   { opacity: 0; transform: rotateX(-60deg) translateY(-8px); }
        100% { opacity: 1; transform: rotateX(0deg)   translateY(0); }
      }
      .counter-num.flip-tick {
        animation: flip-in 0.18s cubic-bezier(0.22,1,0.36,1) both;
      }
    `;
    document.head.appendChild(style);

    /* Patch the existing counter animation (from main.js) to
       add a flip-tick class each time the number changes.
       We do this by wrapping requestAnimationFrame callbacks. */
    const origRAF = window.requestAnimationFrame.bind(window);
    let lastValues = new Map();

    function watchCounters() {
      document.querySelectorAll('.counter-num').forEach((el) => {
        const val = el.textContent;
        if (lastValues.get(el) !== val) {
          lastValues.set(el, val);
          el.classList.remove('flip-tick');
          /* Force reflow then re-add the class               */
          void el.offsetWidth;
          el.classList.add('flip-tick');
        }
      });
      origRAF(watchCounters);
    }

    /* Only start watching when the dashboard is visible      */
    const dashboard = document.querySelector('.counter-dashboard');
    if (dashboard) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          origRAF(watchCounters);
          io.disconnect();
        }
      }, { threshold: 0.25 });
      io.observe(dashboard);
    }
  })();


  /* ----------------------------------------------------------
     18. Project card color accent on hover
     Each project card gets a left border color flash that
     cycles through the brand palette on mouseenter.
     ---------------------------------------------------------- */
  (function initProjectCardAccent() {
    if (REDUCED) return;

    const ACCENTS = [
      'var(--accent)',
      'var(--green)',
      '#3b82f6',   // blue — Seva
      '#f97316',   // orange — Jeev
      '#8b5cf6',   // purple — Udaan
      '#10b981',   // teal — Prakriti
    ];

    const style = document.createElement('style');
    style.textContent = `
      .project-card {
        border-left: 3px solid transparent;
        transition:
          transform var(--dur-base) var(--ease-out),
          box-shadow var(--dur-base),
          border-color 0.2s ease !important;
      }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.project-card').forEach((card, i) => {
      const color = ACCENTS[i % ACCENTS.length];
      card.addEventListener('mouseenter', () => {
        card.style.borderLeftColor = color;
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderLeftColor = 'transparent';
      });
    });
  })();


  /* ----------------------------------------------------------
     19. Photo gallery hover zoom focus
     When hovering a photo item, its siblings dim slightly to
     draw attention to the hovered image.
     ---------------------------------------------------------- */
  (function initGalleryFocus() {
    if (REDUCED) return;

    const style = document.createElement('style');
    style.textContent = `
      .photo-gallery-grid.has-hover .photo-item:not(:hover) {
        opacity: 0.72;
        transform: scale(0.985);
        transition: opacity 0.25s, transform 0.25s ease;
      }
      .photo-gallery-grid.has-hover .photo-item:hover {
        transition: opacity 0.15s, transform 0.15s ease;
      }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.photo-gallery-grid').forEach((grid) => {
      grid.addEventListener('mouseenter', () => grid.classList.add('has-hover'));
      grid.addEventListener('mouseleave', () => grid.classList.remove('has-hover'));
    });
  })();


  /* ----------------------------------------------------------
     20. Testimonial card hover lift with quote mark color
     On hover the opening quote mark animates to the green
     accent for a subtle interactive cue.
     ---------------------------------------------------------- */
  (function initTestimonialHover() {
    if (REDUCED) return;

    const style = document.createElement('style');
    style.textContent = `
      .testimonial-card,
      .story-card {
        transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
                    box-shadow 0.25s ease !important;
      }
      .testimonial-card:hover .testimonial-quote::before,
      .story-card:hover .story-quote::before {
        color: var(--green) !important;
        transition: color 0.25s;
      }
      .carousel-slide-inner {
        transition: box-shadow 0.25s ease;
      }
      .carousel-slide[aria-hidden="false"] .carousel-slide-inner {
        box-shadow: 0 16px 48px rgba(72, 48, 25, 0.13);
      }
    `;
    document.head.appendChild(style);
  })();

}); /* end onInteractive */


/* ============================================================
   PAGE TRANSITIONS
   Runs immediately (not inside partialsReady) so the entrance
   animation plays as early as possible on every page load.

   Flow:
     ENTRANCE  — overlay starts covering the screen, then
                 slides up/off revealing the new page.
     EXIT      — on internal link click the overlay slides
                 down covering the page, then the browser
                 navigates.

   The overlay is a full-viewport div with the brand gradient.
   A progress line inside it grows from 0→100% during the exit
   so the user knows the page is loading.
   ============================================================ */
(function initPageTransitions() {

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) return;

  /* ----------------------------------------------------------
     CSS — injected once, works across all pages
     ---------------------------------------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    /* Overlay panel */
    #page-transition-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: linear-gradient(
        145deg,
        #1e5c3a 0%,
        #296642 40%,
        #8a5a2b 100%
      );
      /* Start covering the screen from the bottom           */
      transform: translateY(100%);
      transition: transform 0.55s cubic-bezier(0.86, 0, 0.07, 1);
      will-change: transform;
    }

    /* Visible state — slides to fill screen                 */
    #page-transition-overlay.pt-visible {
      transform: translateY(0%);
      pointer-events: all;
    }

    /* Hidden state — slid up above viewport (for entrance)  */
    #page-transition-overlay.pt-above {
      transform: translateY(-100%);
      transition: none; /* snap above instantly on load      */
    }

    /* Logo / brand mark inside overlay                      */
    .pt-brand {
      font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
      font-size: clamp(1.4rem, 4vw, 2.2rem);
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
      letter-spacing: -0.02em;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s 0.15s, transform 0.3s 0.15s;
    }

    #page-transition-overlay.pt-visible .pt-brand {
      opacity: 1;
      transform: none;
    }

    /* Tagline below brand */
    .pt-tagline {
      font-family: "Arial", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      opacity: 0;
      transition: opacity 0.3s 0.25s;
    }

    #page-transition-overlay.pt-visible .pt-tagline {
      opacity: 1;
    }

    /* Progress track */
    .pt-progress-track {
      width: min(260px, 60vw);
      height: 2px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s 0.2s;
    }

    #page-transition-overlay.pt-visible .pt-progress-track {
      opacity: 1;
    }

    .pt-progress-fill {
      height: 100%;
      width: 0%;
      background: rgba(255, 255, 255, 0.75);
      border-radius: 999px;
      transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* Entrance — page body starts slightly below, fades in  */
    body.pt-enter-start {
      opacity: 0;
      transform: translateY(14px);
      transition: none;
    }

    body.pt-enter-active {
      opacity: 1;
      transform: none;
      transition:
        opacity 0.52s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.52s cubic-bezier(0.22, 1, 0.36, 1);
    }
  `;
  document.head.appendChild(style);

  /* ----------------------------------------------------------
     Build the overlay DOM
     ---------------------------------------------------------- */
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';
  overlay.innerHTML = `
    <span class="pt-brand">InAmigos Foundation</span>
    <span class="pt-tagline">Together for People, Animals &amp; the Planet</span>
    <div class="pt-progress-track">
      <div class="pt-progress-fill" id="pt-fill"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const fill = document.getElementById('pt-fill');

  /* ----------------------------------------------------------
     ENTRANCE ANIMATION
     On every page load: overlay starts at translateY(-100%)
     (above viewport, invisible), then transitions down and off
     to translateY(-100%) again — revealing the page from top.

     Actually simpler: we use a slide-from-top-off approach:
       1. Overlay snaps to cover screen (no transition, class pt-above removed)
       2. Page body is hidden (pt-enter-start)
       3. On next frame, overlay transitions off upward
       4. Simultaneously, body fades + slides up into view
     ---------------------------------------------------------- */
  function playEntrance() {
    /* 1. Overlay positioned covering screen, no animation yet */
    overlay.style.transition = 'none';
    overlay.style.transform  = 'translateY(0%)';
    overlay.classList.remove('pt-visible', 'pt-above');

    /* 2. Body starts hidden/offset                           */
    document.body.classList.add('pt-enter-start');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        /* 3. Slide overlay upward off-screen                 */
        overlay.style.transition = 'transform 0.6s cubic-bezier(0.86, 0, 0.07, 1)';
        overlay.style.transform  = 'translateY(-105%)';

        /* 4. Fade/slide body in — slight delay so it starts
              as the overlay is halfway gone                  */
        setTimeout(() => {
          document.body.classList.remove('pt-enter-start');
          document.body.classList.add('pt-enter-active');
          setTimeout(() => {
            document.body.classList.remove('pt-enter-active');
          }, 600);
        }, 120);
      });
    });
  }

  /* ----------------------------------------------------------
     EXIT ANIMATION
     On internal link click: overlay slides up from bottom
     covering the page. While visible the progress bar grows.
     After the animation completes the browser navigates.
     ---------------------------------------------------------- */
  function playExit(href) {
    /* Prevent double-firing                                  */
    if (overlay.classList.contains('pt-visible')) return;

    /* Reset progress bar                                     */
    fill.style.transition = 'none';
    fill.style.width      = '0%';

    /* Slide overlay in from bottom                           */
    overlay.style.transition = '';
    overlay.style.transform  = '';
    overlay.classList.add('pt-visible');

    /* Grow progress bar — gives tactile feedback             */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.transition = 'width 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
        fill.style.width      = '85%';
      });
    });

    /* Navigate after the overlay has covered the screen     */
    setTimeout(() => {
      /* Snap fill to 100% just before navigation            */
      fill.style.transition = 'width 0.1s linear';
      fill.style.width      = '100%';
      setTimeout(() => {
        window.location.href = href;
      }, 80);
    }, 520);
  }

  /* ----------------------------------------------------------
     Link interception
     Catches all internal same-origin anchor clicks that are:
       - Not #hash links (those use smooth scroll, not navigation)
       - Not opening in a new tab
       - Not modified (ctrl/cmd/shift/alt + click)
       - Not pointing to external domains
     ---------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    /* Ignore if modifier key held — user wants new tab       */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    /* Skip hash-only links, empty, javascript:, mailto:, tel:  */
    if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) return;

    /* Skip external links                                    */
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      /* Skip if navigating to the same page (just a #hash)  */
      if (url.pathname === window.location.pathname && url.hash) return;
    } catch {
      return;
    }

    /* Skip target="_blank" or other non-self targets         */
    const target = link.getAttribute('target');
    if (target && target !== '_self') return;

    e.preventDefault();
    playExit(href);
  }, true); /* useCapture so we intercept before other handlers */

  /* ----------------------------------------------------------
     Back/forward navigation (popstate)
     When the user hits browser back/forward, play the entrance
     animation on the newly loaded page.
     ---------------------------------------------------------- */
  window.addEventListener('pageshow', (e) => {
    /* e.persisted = true means the page came from bfcache    */
    if (e.persisted) playEntrance();
  });

  /* Play the entrance animation on initial page load        */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playEntrance);
  } else {
    playEntrance();
  }

})();


/* ============================================================
   HEADER & FOOTER ANIMATIONS
   Runs after partialsReady — the injected nav and footer are
   guaranteed to be in the DOM at this point.
   ============================================================ */
document.addEventListener('partialsReady', function onHeaderFooterAnim() {

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     HEADER ANIMATIONS
     ---------------------------------------------------------- */
  (function initHeaderAnimations() {

    /* --- Inject all header animation CSS --- */
    const style = document.createElement('style');
    style.textContent = `

      /* 1. Nav entrance — slides down from above on load */
      @keyframes nav-slide-in {
        from {
          opacity: 0;
          transform: translateY(-100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .site-nav {
        animation: ${REDUCED ? 'none' : 'nav-slide-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both'};
      }

      /* 2. Brand name — fades in with a slight upward drift */
      @keyframes brand-fade-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0);    }
      }

      .site-nav-brand {
        animation: ${REDUCED ? 'none' : 'brand-fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both'};
        position: relative;
      }

      /* Brand subtle shimmer on hover */
      .site-nav-brand::after {
        content: '';
        position: absolute;
        left: 0; bottom: -2px;
        width: 0%; height: 1.5px;
        background: var(--accent);
        transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        border-radius: 999px;
      }
      .site-nav-brand:hover::after { width: 100%; }

      /* 3. Nav links — stagger in from above */
      @keyframes nav-link-drop {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0);      }
      }

      .site-nav-links a:nth-child(1) {
        animation: ${REDUCED ? 'none' : 'nav-link-drop 0.45s cubic-bezier(0.22,1,0.36,1) 0.30s both'};
      }
      .site-nav-links a:nth-child(2) {
        animation: ${REDUCED ? 'none' : 'nav-link-drop 0.45s cubic-bezier(0.22,1,0.36,1) 0.38s both'};
      }
      .site-nav-links a:nth-child(3) {
        animation: ${REDUCED ? 'none' : 'nav-link-drop 0.45s cubic-bezier(0.22,1,0.36,1) 0.46s both'};
      }
      .site-nav-links a:nth-child(4) {
        animation: ${REDUCED ? 'none' : 'nav-link-drop 0.45s cubic-bezier(0.22,1,0.36,1) 0.54s both'};
      }

      /* 4. Active link — animated bottom indicator line */
      .site-nav-links a {
        position: relative;
      }
      .site-nav-links a:not(.nav-cta)::after {
        content: '';
        position: absolute;
        bottom: 2px; left: 14px; right: 14px;
        height: 2px;
        background: var(--accent);
        border-radius: 999px;
        transform: scaleX(0);
        transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        transform-origin: center;
      }
      .site-nav-links a.active:not(.nav-cta)::after,
      .site-nav-links a:hover:not(.nav-cta)::after {
        transform: scaleX(1);
      }

      /* 5. CTA "Get Involved" — gentle pulse ring */
      @keyframes cta-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(138, 90, 43, 0.45); }
        70%  { box-shadow: 0 0 0 8px rgba(138, 90, 43, 0);   }
        100% { box-shadow: 0 0 0 0 rgba(138, 90, 43, 0);     }
      }

      .site-nav-links a.nav-cta {
        animation:
          ${REDUCED ? 'none' : 'nav-link-drop 0.45s cubic-bezier(0.22,1,0.36,1) 0.54s both, cta-pulse 2.8s ease-out 1.8s 3'};
      }

      /* 6. Nav border highlight that expands from center on scroll */
      .site-nav::after {
        content: '';
        position: absolute;
        bottom: 0; left: 50%;
        width: 0%; height: 1px;
        background: var(--accent);
        transform: translateX(-50%);
        opacity: 0.25;
        transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .site-nav--scrolled::after {
        width: 80%;
      }

      /* 7. Hamburger / mobile: nav inner slides right on load */
      @keyframes inner-slide {
        from { opacity: 0; transform: translateX(-8px); }
        to   { opacity: 1; transform: none; }
      }
      .site-nav-inner {
        animation: ${REDUCED ? 'none' : 'inner-slide 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both'};
      }
    `;
    document.head.appendChild(style);
  })();


  /* ----------------------------------------------------------
     FOOTER ANIMATIONS
     ---------------------------------------------------------- */
  (function initFooterAnimations() {

    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    /* --- Inject footer animation CSS --- */
    const style = document.createElement('style');
    style.textContent = `

      /* 1. Footer columns — start hidden, stagger up */
      .footer-col {
        opacity: 0;
        transform: translateY(28px);
        transition:
          opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .footer-col.ft-revealed { opacity: 1; transform: none; }

      /* 2. Footer bottom bar — fades in last */
      .footer-bottom {
        opacity: 0;
        transform: translateY(12px);
        transition:
          opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .footer-bottom.ft-revealed { opacity: 1; transform: none; }

      /* 3. Social links — individual slide-in from left */
      .footer-social-links a {
        opacity: 0;
        transform: translateX(-12px);
        transition:
          opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
          color var(--dur-fast);
      }
      .footer-social-links a.ft-revealed {
        opacity: 1;
        transform: none;
      }

      /* 4. Footer heading underline draw */
      .footer-heading {
        position: relative;
        display: inline-block;
      }
      .footer-heading::after {
        content: '';
        position: absolute;
        left: 0; bottom: -4px;
        width: 0; height: 1.5px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 999px;
        transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .footer-col.ft-revealed .footer-heading::after {
        width: 100%;
      }

      /* 5. Newsletter input — beam focus effect */
      .newsletter-field-wrap::before {
        content: '';
        position: absolute;
        bottom: 0; left: 0;
        width: 0%; height: 100%;
        background: rgba(255, 255, 255, 0.04);
        transition: width 0.3s ease;
        pointer-events: none;
        border-radius: inherit;
        z-index: 0;
      }
      .newsletter-field-wrap:focus-within::before { width: 100%; }
      .newsletter-field-wrap { position: relative; }

      /* 6. Quick links — hover arrow slide */
      .footer-links a {
        position: relative;
        transition: color var(--dur-fast), padding-left var(--dur-base);
      }
      .footer-links a:hover {
        padding-left: 4px;
      }

      /* 7. Social link icon badge pop on hover */
      .footer-social-links a span {
        transition:
          background var(--dur-fast),
          transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .footer-social-links a:hover span {
        transform: scale(1.2) rotate(-5deg);
      }

      /* 8. Footer bottom — subtle divider line draws in */
      .footer-bottom {
        position: relative;
      }
    `;

    if (!REDUCED) document.head.appendChild(style);

    if (REDUCED) {
      /* Skip: make everything visible immediately           */
      footer.querySelectorAll('.footer-col, .footer-bottom, .footer-social-links a')
        .forEach((el) => el.classList.add('ft-revealed'));
      return;
    }

    /* --- Trigger column reveals via IntersectionObserver --- */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);

          const cols    = footer.querySelectorAll('.footer-col');
          const bottom  = footer.querySelector('.footer-bottom');
          const socials = footer.querySelectorAll('.footer-social-links a');

          /* Stagger columns: 0ms, 110ms, 220ms             */
          cols.forEach((col, i) => {
            setTimeout(() => col.classList.add('ft-revealed'), i * 110);
          });

          /* Social links stagger after first column reveals */
          socials.forEach((link, i) => {
            setTimeout(() => link.classList.add('ft-revealed'), 120 + i * 70);
          });

          /* Bottom bar last                                */
          const lastDelay = cols.length * 110 + 80;
          setTimeout(() => {
            if (bottom) bottom.classList.add('ft-revealed');
          }, lastDelay);
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(footer);
  })();

}); /* end onHeaderFooterAnim */
