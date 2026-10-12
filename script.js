/* ==========================================================================
   AIGLE BLANC DÉCORATION
   Script principal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeroTypewriter();
  initCollectionsCarousel();
  initGallerySlider();
  initInstagramVideos();
  initScrollReveal();
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

/* ==========================================================================
   1. MENU MOBILE
   ========================================================================== */

function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('main-nav');

  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  // Ferme le menu quand on clique sur un lien
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   2. EFFET MACHINE À ÉCRIRE — TITRE DU HERO
   Écrit chaque mot lettre par lettre, l'efface, puis passe au mot suivant.
   ========================================================================== */

function initHeroTypewriter() {
  const el = document.getElementById('heroTypewriter');
  if (!el) return;

  // Liste des mots qui défilent (reprend les 4 prestations de la section Collections)
  const words = ['célébrations', 'événements', 'moments'];

  const TYPING_SPEED = 100;       // ms entre chaque lettre tapée
  const ERASING_SPEED = 60;      // ms entre chaque lettre effacée
  const PAUSE_AFTER_WORD = 1600; // ms de pause une fois le mot complet
  const PAUSE_BEFORE_NEXT = 300; // ms de pause une fois le mot effacé

  // Respecte les préférences d'accessibilité : pas d'animation, mot fixe
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    el.textContent = words[0];
    return;
  }

  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      // Phase d'écriture
      charIndex++;
      el.textContent = currentWord.slice(0, charIndex);

      if (charIndex === currentWord.length) {
        isDeleting = true;
        setTimeout(tick, PAUSE_AFTER_WORD);
        return;
      }
      setTimeout(tick, TYPING_SPEED);
    } else {
      // Phase d'effacement
      charIndex--;
      el.textContent = currentWord.slice(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(tick, PAUSE_BEFORE_NEXT);
        return;
      }
      setTimeout(tick, ERASING_SPEED);
    }
  }

  tick();
}

/* ==========================================================================
   3. CARROUSEL COLLECTIONS
   ========================================================================== */

function initCollectionsCarousel() {
  const track = document.querySelector('.carousel__track');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  if (!track || !prevBtn || !nextBtn) return;

  // Distance de défilement = largeur d'une carte + l'espacement (gap)
  function getScrollAmount() {
    const card = track.querySelector('.card');
    if (!card) return 300;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return card.offsetWidth + gap;
  }

  // Active/désactive les flèches selon la position de défilement
  function updateArrowStates() {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const atStart = scrollLeft <= 5;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 5;

    prevBtn.classList.toggle('disabled', atStart);
    nextBtn.classList.toggle('disabled', atEnd);
  }

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateArrowStates, { passive: true });
  window.addEventListener('resize', updateArrowStates);

  updateArrowStates();
}

/* ==========================================================================
   4. SLIDER GALERIE
   ========================================================================== */

function initGallerySlider() {
  const track = document.getElementById('gallery-track');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  if (!track) return;

  const slides = Array.from(track.children);
  let index = 0;

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
  }

  prevBtn?.addEventListener('click', () => goTo(index - 1));
  nextBtn?.addEventListener('click', () => goTo(index + 1));

  // Support du swipe tactile
  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goTo(index - 1) : goTo(index + 1);
    }
  });
}

/* ==========================================================================
   5. LECTURE DES VIDÉOS INSTAGRAM
   ========================================================================== */

function initInstagramVideos() {
  document.querySelectorAll('.ig-card__media').forEach((card) => {
    const video = card.querySelector('video');
    const playBtn = card.querySelector('.ig-card__play');

    if (!video || !playBtn) return;

    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        card.classList.add('is-playing');
      } else {
        video.pause();
        card.classList.remove('is-playing');
      }
    });

    video.addEventListener('click', () => {
      video.pause();
      card.classList.remove('is-playing');
    });
  });
}

/* ==========================================================================
   6. APPARITION AU SCROLL
   ========================================================================== */

function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.carousel, .ig-card, .approach__inner, .review-card, .section__title, .reveal'
  );

  targets.forEach((el) => el.classList.add('reveal'));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   PAGE PRESTATIONS — filtrage des photos par prestation
   À charger APRÈS script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', initCollectionFilters);

function initCollectionFilters() {
  const section = document.getElementById('collection');
  const tabs = Array.from(document.querySelectorAll('.filters__tab'));
  const items = Array.from(document.querySelectorAll('.collection__item'));
  const intro = document.getElementById('collection-intro');

  if (!section || !tabs.length) return;

  // Phrase d'intro affichée sous les onglets selon la prestation choisie
  const intros = {
    all: 'Un aperçu de nos décorations, toutes prestations confondues.',
    mariage: 'Arches, tables et ambiances élégantes pour sublimer votre grand jour.',
    anniversaire: 'Des scénographies imaginées selon votre univers et vos envies.',
    babyshower: 'Des univers doux et harmonieux pour célébrer l’arrivée de bébé.',
    bapteme: 'Une décoration pleine de délicatesse pour célébrer votre baptême.',
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu déroulant des filtres (mobile uniquement)
  const toggle = document.getElementById('filters-toggle');
  const list = document.getElementById('filters-list');
  const current = document.getElementById('filters-current');
  const mobileMq = window.matchMedia('(max-width: 700px)');

  function setMenu(open) {
    if (!toggle || !list) return;
    toggle.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
  }

  toggle?.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Ferme le menu : clic ailleurs, touche Échap, ou passage en mode desktop
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filters')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  mobileMq.addEventListener('change', () => setMenu(false));

  // Remonte au début de la galerie : après un choix de filtre si on l'a dépassée,
  // ou toujours (force) quand on arrive par un lien direct comme prestations.html#mariage
  function scrollToGallery({ force = false, instant = false } = {}) {
    const header = document.getElementById('site-header');
    const bar = document.querySelector('.filters');
    const offset = (header?.offsetHeight || 0) + (bar?.offsetHeight || 0);
    const top = section.getBoundingClientRect().top;
    if (force || top < offset) {
      window.scrollTo({ top: window.scrollY + top - offset, behavior: instant || reducedMotion ? 'auto' : 'smooth' });
    }
  }

  function select(filter, { animate = true, updateHash = true, closeMenu = true } = {}) {
    if (!tabs.some((t) => t.dataset.filter === filter)) filter = 'all';

    tabs.forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      // Garde l'onglet actif visible dans la barre scrollable (mobile)
      if (active && animate && !mobileMq.matches) {
        tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    });

    items.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.hidden = !show;
      item.classList.remove('is-entering');
      if (show && animate && !reducedMotion) {
        void item.offsetWidth; // relance l'animation
        item.classList.add('is-entering');
      }
    });

    section.dataset.active = filter;
    const activeTab = tabs.find((t) => t.dataset.filter === filter);
    if (current && activeTab) current.textContent = activeTab.textContent.trim();

    if (animate && closeMenu && mobileMq.matches) {
      setMenu(false);
      scrollToGallery();
    }
    if (intro) intro.textContent = intros[filter] || intros.all;

    if (updateHash) {
      const hash = filter === 'all' ? location.pathname + location.search : '#' + filter;
      history.replaceState(null, '', hash);
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.filter));

    // Navigation clavier : flèches, Début, Fin
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const next = tabs[(keys[e.key] + tabs.length) % tabs.length];
      next.focus();
      select(next.dataset.filter, { closeMenu: false });
    });
  });

  // Permet des liens directs : prestations.html#mariage
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    select(hash, { updateHash: false });
    if (tabs.some((t) => t.dataset.filter === hash)) scrollToGallery({ force: true });
  });

  const initial = location.hash.slice(1);
  select(initial || 'all', { animate: false, updateHash: false });

  // Les cards des prestations sont au-dessus de la galerie : avec un lien direct,
  // on descend jusqu'aux photos de la prestation choisie
  if (tabs.some((t) => t.dataset.filter === initial)) {
    const goToGallery = () => scrollToGallery({ force: true, instant: true });
    if (document.readyState === 'complete') goToGallery();
    else window.addEventListener('load', goToGallery, { once: true });
  }
}