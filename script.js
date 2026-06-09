/* ═══════════════════════════════════════════════════════════
   KATHRIN — Zeitgenössische Kunst
   script.js  ·  v2.0
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */

/**
 * Schützt vor XSS beim Einfügen von JSON-Daten ins DOM.
 */
function esc(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Gibt ein Element per ID zurück — mit optionalem Fallback-Log.
 */
function el(id) {
  return document.getElementById(id);
}

/* ─────────────────────────────────────────────────────────
   1. NAVIGATION — Scroll-Verhalten & Sticky-Header
───────────────────────────────────────────────────────── */
(function initNav() {
  const header = el('site-header');
  if (!header) return;

  let lastY = 0;
  let ticking = false;

  function onScroll() {
    lastY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', lastY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initialer Check
})();


/* ─────────────────────────────────────────────────────────
   2. MOBILE NAVIGATION — Burger-Menü
───────────────────────────────────────────────────────── */
(function initMobileNav() {
  const burger  = el('nav-burger');
  const menu    = el('nav-menu');
  const overlay = el('mobile-overlay');
  if (!burger || !menu || !overlay) return;

  function openMenu() {
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Menü schließen');
    menu.classList.add('is-open');
    overlay.classList.add('is-visible');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menü öffnen');
    menu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Schließen bei Klick auf Overlay
  overlay.addEventListener('click', closeMenu);

  // Schließen bei Klick auf Nav-Link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Schließen mit Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      burger.focus();
    }
  });
})();


/* ─────────────────────────────────────────────────────────
   3. FOOTER — Aktuelles Jahr
───────────────────────────────────────────────────────── */
(function initFooterYear() {
  const yearEl = el('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ─────────────────────────────────────────────────────────
   4. GALERIE — Kunstwerke laden & rendern
───────────────────────────────────────────────────────── */

/** Aktuell geöffnetes Werk (für Lightbox-Anfragen-Link) */
let activeWerk = null;

/**
 * Erstellt eine einzelne Artwork-Karte als HTMLElement.
 * @param {Object} werk  — Datensatz aus kunstwerke.json
 * @param {number} index — Position im Array
 * @returns {HTMLElement}
 */
function buildCard(werk, index) {
  const article = document.createElement('article');
  article.className = 'artwork-card';
  article.setAttribute('role', 'listitem');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `${esc(werk.titel)} — ${esc(werk.preis)}`);

  /* ── Bild-Wrapper ── */
  const imgWrap = document.createElement('div');
  imgWrap.className = 'artwork-image-wrap';

  const img = document.createElement('img');
  img.className = 'artwork-img';
  img.src     = werk.bild;
  img.alt     = esc(werk.titel);
  img.loading = index === 0 ? 'eager' : 'lazy';
  img.decoding = 'async';

  // Fallback bei fehlenden lokalen Bildern
  img.onerror = function () {
    this.src = `https://picsum.photos/seed/${encodeURIComponent(werk.titel)}/800/1000`;
    this.onerror = null;
  };

  /* ── Hover-Overlay ── */
  const overlay = document.createElement('div');
  overlay.className = 'artwork-hover-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <p class="overlay-titel">${esc(werk.titel)}</p>
    <p class="overlay-preis">${esc(werk.preis)}</p>
    <span class="overlay-cta">
      Werk ansehen
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" stroke-width="1.2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  `;

  imgWrap.appendChild(img);
  imgWrap.appendChild(overlay);

  /* ── Text unter dem Bild ── */
  const info = document.createElement('div');
  info.className = 'artwork-info';
  info.innerHTML = `
    <p class="artwork-info-titel">${esc(werk.titel)}</p>
    <p class="artwork-info-preis">${esc(werk.preis)}</p>
  `;

  article.appendChild(imgWrap);
  article.appendChild(info);

  /* ── Lightbox-Trigger ── */
  function openLightbox() {
    showLightbox(werk);
  }

  article.addEventListener('click', openLightbox);

  // Tastatur: Enter/Space öffnet Lightbox
  article.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox();
    }
  });

  return article;
}

/**
 * IntersectionObserver: Fade-In für jede Karte,
 * sobald sie in den Viewport scrollt.
 */
function setupCardFadeIn(cards) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: direkt sichtbar
    cards.forEach(c => c.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach(card => observer.observe(card));
}

/**
 * Fehler-Zustand im Grid rendern.
 */
function renderGalerieError(grid, message) {
  grid.innerHTML = `
    <p
      role="alert"
      style="
        grid-column: 1 / -1;
        padding: 3rem 0;
        font-family: var(--f-italic);
        font-style: italic;
        font-size: 1rem;
        color: var(--c-grey);
        text-align: center;
      "
    >${esc(message)}</p>
  `;
}

/**
 * Lädt kunstwerke.json und rendert das Grid.
 */
async function loadGalerie() {
  const grid = el('galerie-grid');
  if (!grid) return;

  try {
    const res = await fetch('content/kunstwerke.json', { cache: 'no-cache' });

    if (!res.ok) {
      throw new Error(`Ladefehler: HTTP ${res.status}`);
    }

    const data = await res.json();

    // Flexibel: unterstützt `{ "kunstwerke": [...] }` und direkte Arrays `[...]`
    const werke = Array.isArray(data)
      ? data
      : Array.isArray(data.kunstwerke)
        ? data.kunstwerke
        : null;

    if (!werke || werke.length === 0) {
      renderGalerieError(grid, 'Noch keine Werke hinterlegt.');
      return;
    }

    // Skeleton entfernen, Karten einfügen
    grid.innerHTML = '';

    const cards = werke.map((werk, i) => buildCard(werk, i));
    const fragment = document.createDocumentFragment();
    cards.forEach(card => fragment.appendChild(card));
    grid.appendChild(fragment);

    // Fade-In starten
    setupCardFadeIn(cards);

  } catch (err) {
    console.error('[Galerie] Fehler beim Laden:', err);
    renderGalerieError(
      grid,
      'Die Werke konnten nicht geladen werden. Bitte versuchen Sie es später erneut.'
    );
  }
}


/* ─────────────────────────────────────────────────────────
   5. LIGHTBOX
───────────────────────────────────────────────────────── */
(function initLightbox() {
  const lightbox  = el('lightbox');
  const backdrop  = el('lightbox-backdrop');
  const closeBtn  = el('lightbox-close');
  const imgEl     = el('lightbox-img');
  const titelEl   = el('lightbox-titel');
  const beschrEl  = el('lightbox-beschreibung');
  const preisEl   = el('lightbox-preis');
  const anfrageEl = el('lightbox-anfrage');

  if (!lightbox) return;

  // Exponiere showLightbox global (wird von buildCard genutzt)
  window.showLightbox = function (werk) {
    activeWerk = werk;

    imgEl.src     = werk.bild;
    imgEl.alt     = esc(werk.titel);
    titelEl.textContent   = werk.titel    || '';
    beschrEl.textContent  = werk.beschreibung || '';
    preisEl.textContent   = werk.preis    || '';

    if (anfrageEl) {
      anfrageEl.href = `#kontakt?werk=${encodeURIComponent(werk.titel)}`;
    }

    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Fokus auf Schließen-Button setzen
    setTimeout(() => closeBtn?.focus(), 50);
  };

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeWerk = null;
  }

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);

  // Schließen bei Klick auf „Werk anfragen" → scrollt zu Kontakt
  anfrageEl?.addEventListener('click', () => {
    closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
      closeLightbox();
    }
  });

  // Fokusfalle im Lightbox-Dialog
  lightbox.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...lightbox.querySelectorAll(
      'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.disabled);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
})();


/* ─────────────────────────────────────────────────────────
   6. KONTAKT-FORMULAR
───────────────────────────────────────────────────────── */
(function initForm() {
  const form      = el('kontakt-form');
  const submitBtn = el('btn-submit');
  const successEl = el('form-success');
  if (!form) return;

  /* ── Validierung ── */
  const rules = {
    'f-name': {
      validate: v => v.trim().length >= 2,
      message:  'Bitte geben Sie Ihren Namen ein (mind. 2 Zeichen).',
    },
    'f-email': {
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message:  'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    },
    'f-nachricht': {
      validate: v => v.trim().length >= 10,
      message:  'Bitte schreiben Sie mindestens 10 Zeichen.',
    },
  };

  function showFieldError(id, message) {
    const input   = el(id);
    const errorEl = el(`${id}-error`);
    if (input)   input.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(id) {
    const input   = el(id);
    const errorEl = el(`${id}-error`);
    if (input)   input.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  function validateAll() {
    let valid = true;
    for (const [id, rule] of Object.entries(rules)) {
      const input = el(id);
      if (!input) continue;
      if (!rule.validate(input.value)) {
        showFieldError(id, rule.message);
        valid = false;
      } else {
        clearFieldError(id);
      }
    }
    return valid;
  }

  // Live-Validierung bei Verlassen eines Feldes
  Object.keys(rules).forEach(id => {
    const input = el(id);
    if (!input) return;
    input.addEventListener('blur', () => {
      if (input.value) {
        rules[id].validate(input.value)
          ? clearFieldError(id)
          : showFieldError(id, rules[id].message);
      }
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('has-error')) {
        rules[id].validate(input.value) && clearFieldError(id);
      }
    });
  });

  /* ── Submit ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      // Erstes Fehlerfeld fokussieren
      const firstError = form.querySelector('.has-error');
      firstError?.focus();
      return;
    }

    // Loading-State
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      /*
       * HIER: Echtes Backend / Formspree / Netlify Forms einbinden.
       * Beispiel mit Formspree:
       *   const res = await fetch('https://formspree.io/f/IHRE_ID', {
       *     method: 'POST',
       *     body: new FormData(form),
       *     headers: { 'Accept': 'application/json' }
       *   });
       *   if (!res.ok) throw new Error('Sende-Fehler');
       *
       * Für GitHub Pages ohne Backend: mailto-Fallback oder Formspree empfohlen.
       * Aktuell: simuliertes Delay für Demo-Zwecke.
       */
      await new Promise(r => setTimeout(r, 900));

      // Erfolg
      form.reset();
      Object.keys(rules).forEach(id => clearFieldError(id));

      if (successEl) {
        successEl.style.display = 'flex';
        // Minimale Verzögerung, damit display:flex greift, bevor die Transition startet
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            successEl.classList.add('is-visible');
            successEl.removeAttribute('aria-hidden');
          });
        });
      }

    } catch (err) {
      console.error('[Formular] Sende-Fehler:', err);
      alert('Beim Senden ist ein Fehler aufgetreten. Bitte schreiben Sie direkt an studio@kathrin-art.de');
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
})();


/* ─────────────────────────────────────────────────────────
   7. SMOOTH REVEAL — Allgemeine Scroll-Animationen
   (Über-Sektion, Kontakt-Sektion, Timeline etc.)
───────────────────────────────────────────────────────── */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.ueber-inner, .ueber-timeline, .kontakt-inner, .timeline-item, .stat-item'
  );

  // Startzustand per JS setzen (vermeidet FOUC, wenn CSS-Animation noch lädt)
  targets.forEach(t => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(24px)';
    t.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  targets.forEach((t, i) => {
    // Leichte Stagger-Verzögerung für Gruppen
    t.style.transitionDelay = `${i * 0.05}s`;
    observer.observe(t);
  });
})();


/* ─────────────────────────────────────────────────────────
   8. ACTIVE NAV-LINK — Hebt den aktuellen Abschnitt hervor
───────────────────────────────────────────────────────── */
(function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.style.color = isActive
            ? 'var(--c-text)'
            : '';
          // Unterstrich-Linie aktivieren
          link.style.setProperty('--link-active', isActive ? '1' : '0');
        });
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(section => observer.observe(section));
})();


/* ─────────────────────────────────────────────────────────
   9. PARALLAX — Subtiler Tiefeneffekt im Hero
───────────────────────────────────────────────────────── */
(function initHeroParallax() {
  const circle = document.querySelector('.hero-bg-circle');
  const decoLine = document.querySelector('.hero-deco-line');
  if (!circle && !decoLine) return;

  // Nur auf Desktop (reduziert CPU auf Mobile)
  const mq = window.matchMedia('(min-width: 769px) and (prefers-reduced-motion: no-preference)');
  if (!mq.matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (circle)   circle.style.transform   = `translateY(${y * 0.15}px)`;
        if (decoLine) decoLine.style.transform  = `translateY(${y * 0.05}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────
   10. INIT — DOMContentLoaded
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadGalerie();
});
