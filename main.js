/* ============================================================
   InAmigos Foundation — main.js
   Core interactivity: counters, carousel, case studies, newsletter
   Runs after DOM is ready — no dependency on partialsReady.
   ============================================================ */
'use strict';

function init() {

  /* ----------------------------------------------------------
     1. Animated counters
     Reads data-target + data-suffix from .counter-num elements.
     Counts up when scrolled into view.
  ---------------------------------------------------------- */
  (function initCounters() {
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nums = document.querySelectorAll('.counter-num[data-target]');
    if (!nums.length) return;

    function easeOut(t) { return t * (2 - t); }

    function formatNumber(n) {
      return n >= 1000
        ? n.toLocaleString('en-IN')
        : String(n);
    }

    function animateCounter(el) {
      const target   = parseInt(el.dataset.target, 10);
      const suffix   = el.dataset.suffix || '';
      const duration = target > 10000 ? 2000 : 1400;
      const start    = performance.now();

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = formatNumber(Math.round(easeOut(progress) * target)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = formatNumber(target) + suffix;
      }
      requestAnimationFrame(step);
    }

    if (REDUCED) {
      nums.forEach((el) => {
        el.textContent = formatNumber(parseInt(el.dataset.target, 10)) + (el.dataset.suffix || '');
      });
      return;
    }

    let fired = false;
    const dashboard = document.querySelector('.about-highlights');
    if (!dashboard) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !fired) {
        fired = true;
        observer.disconnect();
        nums.forEach((el, i) => setTimeout(() => animateCounter(el), i * 80));
      }
    }, { threshold: 0.25 });

    observer.observe(dashboard);
  })();

  /* ----------------------------------------------------------
     2. Testimonial carousel (index.html)
     Auto-advances; prev/next buttons; dot indicators; touch swipe.
  ---------------------------------------------------------- */
  (function initCarousel() {
    const section = document.querySelector('.carousel-section');
    if (!section) return;

    const track   = document.getElementById('carousel-track');
    const slides  = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
    const dotsWrap = document.getElementById('carousel-dots');
    const btnPrev  = document.getElementById('carousel-prev');
    const btnNext  = document.getElementById('carousel-next');
    if (!track || !slides.length || !dotsWrap) return;

    let current = 0, timer = null;
    const DELAY = 6000;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));

    function goTo(index) {
      index = ((index % slides.length) + slides.length) % slides.length;
      slides[current].setAttribute('aria-hidden', 'true');
      slides[index].setAttribute('aria-hidden', 'false');
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
      dots[index].classList.add('active');
      dots[index].setAttribute('aria-selected', 'true');
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      current = index;
    }

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);
    const startTimer = () => { timer = setInterval(next, DELAY); };
    const stopTimer  = () => clearInterval(timer);

    startTimer();
    section.addEventListener('mouseenter', stopTimer);
    section.addEventListener('mouseleave', startTimer);
    section.addEventListener('focusin',    stopTimer);
    section.addEventListener('focusout',   startTimer);
    if (btnPrev) btnPrev.addEventListener('click', () => { stopTimer(); prev(); startTimer(); });
    if (btnNext) btnNext.addEventListener('click', () => { stopTimer(); next(); startTimer(); });
    section.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { stopTimer(); prev(); startTimer(); }
      if (e.key === 'ArrowRight') { stopTimer(); next(); startTimer(); }
    });

    let tx = 0;
    track.addEventListener('touchstart', (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) { stopTimer(); dx < 0 ? next() : prev(); startTimer(); }
    }, { passive: true });
  })();

  /* ----------------------------------------------------------
     3. Case study accordion (initiatives.html)
  ---------------------------------------------------------- */
  (function initCaseStudies() {
    document.querySelectorAll('.case-study-toggle').forEach((btn) => {
      const bodyId = btn.getAttribute('aria-controls');
      const body   = bodyId ? document.getElementById(bodyId) : null;
      if (!body) return;

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          btn.setAttribute('aria-expanded', 'false');
          body.classList.remove('open');
          body.addEventListener('transitionend', () => {
            if (!body.classList.contains('open')) body.hidden = true;
          }, { once: true });
        } else {
          body.hidden = false;
          body.getBoundingClientRect(); // force reflow
          body.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     4. Newsletter form (footer — loaded via partial)
     Re-runs when footer partial is injected.
  ---------------------------------------------------------- */
  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form || form._bound) return;
    form._bound = true;

    const input = form.querySelector('.newsletter-input');
    const msg   = form.querySelector('.newsletter-msg');

    function showMsg(text, type) {
      msg.textContent = text;
      msg.className   = 'newsletter-msg ' + type;
      msg.hidden      = false;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (input ? input.value : '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMsg('Please enter a valid email address.', 'error');
        return;
      }
      const btn = form.querySelector('.newsletter-btn');
      btn.textContent = 'Sending…';
      btn.disabled    = true;
      try {
        const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body:    JSON.stringify({ email }),
        });
        if (res.ok) {
          showMsg('You\'re subscribed!', 'success');
          form.reset();
          btn.textContent = 'Subscribed ✓';
        } else {
          throw new Error();
        }
      } catch {
        showMsg('Something went wrong. Please try again.', 'error');
        btn.textContent = 'Subscribe';
        btn.disabled    = false;
      }
    });

    if (input) {
      input.addEventListener('input', () => {
        if (msg.classList.contains('error')) msg.hidden = true;
      });
    }
  }

  initNewsletter();
  // Also bind after partials inject the footer
  document.addEventListener('partialsReady', initNewsletter);
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
