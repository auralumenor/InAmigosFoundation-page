/* ============================================================
   InAmigos Foundation — main.js
   Core interactivity: forms, counters, carousels, toggles
   
   Features:
   1. Newsletter form — Formspree submission handler
   2. Counter reveal — animated counter animations on scroll
   3. Carousel — testimonials auto-advance
   4. Case studies — accordion toggles for success stories
   ============================================================ */

'use strict';

document.addEventListener('partialsReady', function onReady() {

/* ============================================================
   1. Newsletter form handler (Formspree)
   ============================================================ */
(function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Subscribing...';

      // Replace YOUR_FORM_ID with your Formspree form ID (e.g., xabc1234)
      const response = await fetch(
        'https://formspree.io/f/YOUR_FORM_ID',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        submitBtn.textContent = '✓ Subscribed!';
        form.reset();
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 3000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      submitBtn.textContent = 'Try again';
      submitBtn.disabled = false;
    }
  });
})();

/* ============================================================
   2. Counter animations
   Numbers count up from 0 to target when the element enters
   the viewport. Respects prefers-reduced-motion.
   ============================================================ */
(function initCounters() {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));

  function animateCounter(el) {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target)) return;

    if (REDUCED) {
      el.textContent = target;
      return;
    }

    let current = 0;
    const duration = 1500; // ms
    const start = Date.now();

    function frame() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(target * progress);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }
})();

/* ============================================================
   3. Carousel / Testimonials
   Auto-advance through items; pause on hover.
   ============================================================ */
(function initCarousel() {
  const carousels = document.querySelectorAll('[data-carousel]');
  if (carousels.length === 0) return;

  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll('[data-slide]');
    if (slides.length === 0) return;

    let current = 0;
    let interval;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
    }

    function nextSlide() {
      current = (current + 1) % slides.length;
      showSlide(current);
    }

    function startAutoAdvance() {
      // Don't auto-advance if user prefers reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      interval = setInterval(nextSlide, 4000);
    }

    carousel.addEventListener('mouseenter', () => clearInterval(interval));
    carousel.addEventListener('mouseleave', startAutoAdvance);

    showSlide(0);
    startAutoAdvance();
  });
})();

/* ============================================================
   4. Case studies — accordion toggles
   Buttons with aria-expanded toggle hidden case-study-body divs.
   ============================================================ */
(function initCaseStudies() {
  const toggles = document.querySelectorAll('.case-study-toggle');
  if (toggles.length === 0) return;

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      const targetId = toggle.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;

      if (!target) return;

      toggle.setAttribute('aria-expanded', !isExpanded);
      target.hidden = isExpanded;

      // Smooth scroll into view if opening
      if (!isExpanded) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  });
})();

}); // End partialsReady handler
