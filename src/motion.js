// Hero timing and easing mirror Midu's published Framer appear settings.
const ease = 'cubic-bezier(.11,.06,.18,1)';
const clamp = (value) => Math.min(1, Math.max(0, value));

export function initMotion() {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup = () => {};

  function setup() {
    cleanup();
    if (preference.matches) return;

    const animations = [];
    const enter = (element, distance = 40, delay = 0, duration = 1000) => {
      if (!element) return;
      const animation = element.animate([
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration, delay, easing: ease, fill: 'backwards' });
      animations.push(animation);
    };

    [
      ['.nav', 40, 1150],
      ['.hero-top', 60, 900],
      ['.hero-statement', 40, 1050],
      ['h1.glow-word', 80, 750],
      ['.hero-bottom', 60, 900],
    ].forEach(([selector, distance, delay]) => enter(document.querySelector(selector), distance, delay));

    // Group related items so each section has a short, deliberate stagger.
    const groups = [
      ...document.querySelectorAll('.section-heading, .about-content, .community-grid, .footer-top'),
      document.querySelector('.project-grid'),
      document.querySelector('.experience-list'),
    ].filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        Array.from(target.children).forEach((child, index) => enter(child, 40, index * 100, 850));
        observer.unobserve(target);
      });
    }, { threshold: 0.08 });
    groups.forEach((group) => observer.observe(group));

    const manifesto = document.querySelector('.manifesto h2');
    const original = manifesto.innerHTML;
    // Preserve the original DOM for preference changes, and the full accessible text.
    const text = manifesto.textContent;
    const words = text.trim().split(/\s+/).map((word) => {
      const span = document.createElement('span');
      span.className = 'reveal-word';
      span.textContent = `${word} `;
      span.setAttribute('aria-hidden', 'true');
      return span;
    });
    manifesto.setAttribute('aria-label', text);
    manifesto.replaceChildren(...words);

    const hero = document.querySelector('.hero');
    const footer = document.querySelector('footer');
    const heroWord = hero.querySelector('.glow-word');
    const footerWord = footer.querySelector('.glow-word');
    const active = new Set();
    let frame = 0;
    let dirty = true;
    const markDirty = () => {
      dirty = true;
      if (active.size && !frame && !document.hidden) frame = requestAnimationFrame(update);
    };
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) active.add(target);
        else active.delete(target);
      });
      dirty = true;
      if (active.size && !frame && !document.hidden) frame = requestAnimationFrame(update);
    });
    [hero, footer, manifesto].forEach((element) => visibility.observe(element));

    function update(time) {
      frame = 0;
      const height = window.innerHeight;
      if (dirty) {
        if (active.has(manifesto)) {
          const rect = manifesto.getBoundingClientRect();
          const progress = clamp((height * .85 - rect.top) / (height * .55 + rect.height * .3));
          words.forEach((word, index) => {
            word.style.opacity = String(.22 + .78 * clamp(progress * (words.length + 4) - index));
          });
        }
        if (active.has(hero)) {
          const progress = clamp(-hero.getBoundingClientRect().top / hero.offsetHeight);
          heroWord.style.setProperty('--scroll-offset', `${progress * 65}px`);
        }
        if (active.has(footer)) {
          const progress = clamp((height - footer.getBoundingClientRect().top) / height);
          footerWord.style.setProperty('--scroll-offset', `${(1 - progress) * 55}px`);
        }
        dirty = false;
      }
      // Animate the light within the type rather than moving the text itself.
      [hero, footer].forEach((element) => {
        if (!active.has(element)) return;
        const phase = time / 2400 + (element === footer ? 2 : 0);
        element.style.setProperty('--light-left', `${12 + Math.sin(phase) * 17}%`);
        element.style.setProperty('--light-right', `${88 + Math.cos(phase * .8) * 15}%`);
      });
      if ((active.has(hero) || active.has(footer)) && !document.hidden) frame = requestAnimationFrame(update);
    }
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (active.size && !frame) {
        dirty = true;
        frame = requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', markDirty, { passive: true });
    window.addEventListener('resize', markDirty);
    document.addEventListener('visibilitychange', onVisibility);
    document.documentElement.classList.add('motion-enabled');

    cleanup = () => {
      animations.forEach((animation) => animation.cancel());
      observer.disconnect();
      visibility.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', markDirty);
      window.removeEventListener('resize', markDirty);
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.classList.remove('motion-enabled');
      manifesto.innerHTML = original;
      manifesto.removeAttribute('aria-label');
      [heroWord, footerWord].forEach((word) => word.style.removeProperty('--scroll-offset'));
      [hero, footer].forEach((element) => {
        element.style.removeProperty('--light-left');
        element.style.removeProperty('--light-right');
      });
    };
  }

  setup();
  preference.addEventListener('change', setup);
}
