/* ============================================================
   InAmigos Foundation — main.js
   Handles: counter animation · testimonial carousel · case study toggles
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   Utility: easing function (ease-out-quad)
   ------------------------------------------------------------ */
function easeOutQuad(t) {
  return t * (2 - t);
}

/* ------------------------------------------------------------
   1. Animated counter dashboard
   Reads data-target (integer) and data-suffix from each .counter-num.
   Fires once when the .counter-dashboard scrolls into view.
   ------------------------------------------------------------ */
(function initCounters() {
  const dashboard = document.querySelector('.counter-dashboard');
  if (!dashboard) return;

  const nums = dashboard.querySelectorAll('.counter-num[data-target]');
  if (!nums.length) return;

  let fired = false;

  function formatNumber(n) {
    // Compact formatting: 500000 → "500,000"
    return n.toLocaleString('en-IN');
  }

  function animateCounter(el) {
    const target  = parseInt(el.dataset.target, 10);
    const suffix  = el.dataset.suffix || '';
    const duration = target > 10000 ? 2000 : 1400; // longer for big numbers
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuad(progress);
      const current  = Math.round(eased * target);

      el.textContent = formatNumber(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target) + suffix;
        el.classList.add('counted');
      }
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !fired) {
          fired = true;
          observer.disconnect();
          // Stagger each tile by 80 ms so they cascade
          nums.forEach((el, i) => {
            setTimeout(() => animateCounter(el), i * 80);
          });
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(dashboard);
})();


/* ------------------------------------------------------------
   2. Testimonial carousel
   Auto-advances every 6 s. Pauses on hover / focus.
   Keyboard: left/right arrows while focus is inside.
   ------------------------------------------------------------ */
(function initCarousel() {
  const section = document.querySelector('.carousel-section');
  if (!section) return;

  const track     = document.getElementById('carousel-track');
  const slides    = Array.from(track ? track.querySelectorAll('.carousel-slide') : []);
  const dotsWrap  = document.getElementById('carousel-dots');
  const btnPrev   = document.getElementById('carousel-prev');
  const btnNext   = document.getElementById('carousel-next');

  if (!track || !slides.length || !dotsWrap) return;

  let current  = 0;
  let timer    = null;
  const DELAY  = 6000;

  /* Build dot buttons */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className   = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));

  function goTo(index) {
    // Wrap around
    index = ((index % slides.length) + slides.length) % slides.length;

    // Update ARIA on slides
    slides[current].setAttribute('aria-hidden', 'true');
    slides[index].setAttribute('aria-hidden', 'false');

    // Update dots
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');
    dots[index].classList.add('active');
    dots[index].setAttribute('aria-selected', 'true');

    // Move track
    track.style.transform = `translateX(-${index * 100}%)`;

    current = index;
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* Auto-advance */
  function startTimer() { timer = setInterval(next, DELAY); }
  function stopTimer()  { clearInterval(timer); }

  startTimer();

  /* Pause on hover / focus-within */
  section.addEventListener('mouseenter', stopTimer);
  section.addEventListener('mouseleave', startTimer);
  section.addEventListener('focusin',    stopTimer);
  section.addEventListener('focusout',   startTimer);

  /* Button clicks */
  if (btnPrev) btnPrev.addEventListener('click', () => { stopTimer(); prev(); startTimer(); });
  if (btnNext) btnNext.addEventListener('click', () => { stopTimer(); next(); startTimer(); });

  /* Keyboard navigation inside the section */
  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { stopTimer(); prev(); startTimer(); }
    if (e.key === 'ArrowRight') { stopTimer(); next(); startTimer(); }
  });

  /* Touch / swipe support */
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      stopTimer();
      dx < 0 ? next() : prev();
      startTimer();
    }
  }, { passive: true });
})();


/* ------------------------------------------------------------
   3. Case study expand / collapse
   Toggles aria-expanded + adds/removes .open on the body div.
   Uses grid-template-rows animation (CSS handles the transition).
   ------------------------------------------------------------ */
(function initCaseStudies() {
  const toggles = document.querySelectorAll('.case-study-toggle');
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    const bodyId = btn.getAttribute('aria-controls');
    const body   = bodyId ? document.getElementById(bodyId) : null;
    if (!body) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';

      if (expanded) {
        // Collapse
        btn.setAttribute('aria-expanded', 'false');
        body.classList.remove('open');
        // Re-add hidden after transition ends so it's properly inert
        body.addEventListener('transitionend', () => {
          if (!body.classList.contains('open')) body.hidden = true;
        }, { once: true });
      } else {
        // Expand — remove hidden first so CSS transition can run
        body.hidden = false;
        // Force reflow before adding .open so transition fires
        body.getBoundingClientRect();
        body.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();


/* ------------------------------------------------------------
   4. Newsletter form — client-side validation + success state
   Submits to Formspree (static-site friendly, no backend needed).
   Replace FORM_ID in the action URL with your real Formspree ID.
   ------------------------------------------------------------ */
(function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const input = form.querySelector('.newsletter-input');
  const msg   = form.querySelector('.newsletter-msg');

  function showMsg(text, type) {
    msg.textContent = text;
    msg.className   = 'newsletter-msg ' + type;
    msg.hidden      = false;
  }

  function isValidEmail(val) {
    // RFC-5322 simplified — matches 99% of real addresses
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();

    if (!email) {
      showMsg('Please enter your email address.', 'error');
      input.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showMsg('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    const btn = form.querySelector('.newsletter-btn');
    btn.textContent = 'Sending…';
    btn.disabled    = true;

    try {
      // Formspree endpoint — swap YOUR_FORM_ID for your real Formspree form ID
      // Sign up free at https://formspree.io to get one.
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({ email }),
      });

      if (res.ok) {
        showMsg('You\'re subscribed! We\'ll be in touch soon.', 'success');
        form.reset();
        btn.textContent = 'Subscribed ✓';
      } else {
        const data = await res.json().catch(() => ({}));
        const err  = data?.errors?.[0]?.message || 'Submission failed. Please try again.';
        showMsg(err, 'error');
        btn.textContent = 'Subscribe';
        btn.disabled    = false;
      }
    } catch {
      showMsg('Network error. Please check your connection and try again.', 'error');
      btn.textContent = 'Subscribe';
      btn.disabled    = false;
    }
  });

  // Clear error on input
  input.addEventListener('input', () => {
    if (msg.classList.contains('error')) {
      msg.hidden = true;
    }
  });
})();
