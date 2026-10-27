/* ==========================================================================
   INSTANT GRAVÉ EVENT — prestations.js
   Script propre à prestations.html (pas besoin de script.js sur cette page).

   Ce que fait ce fichier :
   1. Menu burger mobile (+ bouton « Demander un devis » dans le menu)
   2. Ombre du header au scroll + année du footer
   3. Barre de catégories : lien actif selon la section visible
   4. Carrousels : flèches (en boucle), pastilles, swipe, clavier,
      compteur « 1 / 4 », lien direct (prestations.html#photobooth)
   5. Photos cliquables : agrandissement plein écran (lightbox)
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehavior = () => (reduceMotion.matches ? "auto" : "smooth");

  /** Lit une variable CSS en pixels (ex. --header-height). */
  const cssPx = (name) =>
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name),
    ) || 0;

  /* ======================================================================
     1 + 2. HEADER, MENU MOBILE, ANNÉE
     ====================================================================== */

  function initHeader() {
    const header = $("#site-header");
    const burger = $("#burger");
    const nav = $("#main-nav");

    if (header) {
      const onScroll = () =>
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (!burger || !nav) return;

    // Le bouton devis est masqué dans le header sur mobile : on le met dans le menu
    const list = $(".main-nav__list", nav);
    if (list && !$(".main-nav__cta-item", nav)) {
      const li = document.createElement("li");
      li.className = "main-nav__cta-item";
      li.innerHTML =
        '<a href="devis.html" class="btn btn--gold btn--small">Demander un devis</a>';
      list.appendChild(li);
    }

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };

    burger.addEventListener("click", () =>
      setOpen(burger.getAttribute("aria-expanded") !== "true"),
    );

    // Un clic sur un lien du menu le referme
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    // Échap ou clic en dehors referment aussi le menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        burger.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(e.target) &&
        !burger.contains(e.target)
      ) {
        setOpen(false);
      }
    });

    // Retour en mode desktop : on remet le menu à zéro
    window
      .matchMedia("(min-width: 861px)")
      .addEventListener("change", (e) => e.matches && setOpen(false));
  }

  function initYear() {
    const el = $("#current-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ======================================================================
     3. BARRE DE CATÉGORIES (lien actif)
     ====================================================================== */

  function initCategoryNav() {
    const nav = $("#offers-nav");
    const list = $("#offers-nav-list");
    if (!nav || !list) return;

    const links = $$(".offers-nav__link", list);
    const items = links
      .map((link) => ({
        link,
        section: document.getElementById(link.getAttribute("href").slice(1)),
      }))
      .filter((item) => item.section);

    let current = null;
    let ticking = false;

    const setActive = (link) => {
      if (link === current) return;
      current = link;

      links.forEach((l) => {
        if (l === link) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });

      // Sur mobile, la barre défile : on garde le lien actif au centre
      if (link && list.scrollWidth > list.clientWidth) {
        list.scrollTo({
          left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2,
          behavior: scrollBehavior(),
        });
      }
    };

    const update = () => {
      ticking = false;
      // Ligne de lecture : juste sous le header et la barre de catégories
      const line = cssPx("--header-height") + nav.offsetHeight + 24;
      let active = null;

      items.forEach(({ link, section }) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) active = link;
      });

      setActive(active);
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }

  /* ======================================================================
     4. CARROUSELS
     ====================================================================== */

  /**
   * Un carrousel = une catégorie. La piste est un conteneur en scroll-snap :
   * le swipe tactile est natif, le JS ajoute flèches, pastilles, clavier,
   * compteur et accessibilité (seule la slide visible est atteignable au clavier).
   */
  function initCarousel(root) {
    const viewport = $(".offer-carousel__viewport", root);
    const slides = viewport ? $$(".offer-slide", viewport) : [];
    if (!viewport || !slides.length) return null;

    const controls = $(".offer-carousel__controls", root);
    const prev = $("[data-offer-prev]", root);
    const next = $("[data-offer-next]", root);
    const pillsWrap = $(".offer-pills", root);
    const total = slides.length;

    let index = 0;
    let ready = false;
    let hashTimer = 0;
    let raf = 0;

    // Pastilles : une par prestation, avec son nom
    const pills = slides.map((slide, i) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "offer-pill";
      pill.textContent = slide.dataset.title || `Prestation ${i + 1}`;
      pill.addEventListener("click", () => goTo(i));
      if (pillsWrap) pillsWrap.appendChild(pill);
      return pill;
    });

    // Compteur « 2 / 4 » affiché dans le texte de chaque slide
    if (total > 1) {
      slides.forEach((slide, i) => {
        const body = $(".offer-slide__body", slide);
        if (body) body.dataset.pos = `${i + 1} / ${total}`;
      });
    } else if (controls) {
      controls.hidden = true; // une seule prestation : rien à faire défiler
    }

    const slideWidth = () => viewport.clientWidth || 1;

    function render(i) {
      index = i;

      slides.forEach((slide, k) => {
        const on = k === i;
        slide.classList.toggle("is-active", on);
        // Les slides hors écran ne reçoivent plus le focus clavier
        slide.toggleAttribute("inert", !on);
      });

      pills.forEach((pill, k) => {
        if (k === i) pill.setAttribute("aria-current", "true");
        else pill.removeAttribute("aria-current");
      });

      // Sur petit écran les pastilles défilent : on garde l'active visible
      if (pillsWrap && pillsWrap.scrollWidth > pillsWrap.clientWidth) {
        const pill = pills[i];
        pillsWrap.scrollTo({
          left: pill.offsetLeft - (pillsWrap.clientWidth - pill.offsetWidth) / 2,
          behavior: "auto",
        });
      }
    }

    function goTo(i, { instant = false } = {}) {
      const target = (i + total) % total; // navigation en boucle
      viewport.scrollTo({
        left: target * slideWidth(),
        behavior: instant ? "auto" : scrollBehavior(),
      });
      if (instant) render(target);
    }

    // Garde l'URL à jour pour pouvoir partager un lien vers la prestation affichée
    function scheduleHash() {
      if (!ready) return;
      clearTimeout(hashTimer);
      hashTimer = setTimeout(() => {
        root.classList.add("has-moved");
        try {
          history.replaceState(null, "", `#${slides[index].id}`);
        } catch (_) {
          /* file:// ou contexte restreint : on ignore */
        }
      }, 200);
    }

    viewport.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const i = Math.round(viewport.scrollLeft / slideWidth());
          if (i !== index && i >= 0 && i < total) {
            render(i);
            scheduleHash();
          }
        });
      },
      { passive: true },
    );

    if (prev) prev.addEventListener("click", () => goTo(index - 1));
    if (next) next.addEventListener("click", () => goTo(index + 1));

    // Clavier : flèches / Début / Fin quand la piste a le focus
    viewport.addEventListener("keydown", (e) => {
      if (e.target !== viewport) return;
      const keys = {
        ArrowLeft: () => goTo(index - 1),
        ArrowRight: () => goTo(index + 1),
        Home: () => goTo(0),
        End: () => goTo(total - 1),
      };
      if (keys[e.key]) {
        e.preventDefault();
        keys[e.key]();
      }
    });

    // Si la largeur change (rotation du téléphone…), on recale sur la slide courante
    window.addEventListener("resize", () => {
      viewport.scrollTo({ left: index * slideWidth(), behavior: "auto" });
    });

    render(0);
    ready = true;

    return { root, slides, goTo };
  }

  /* ======================================================================
     5. LIGHTBOX (agrandir les photos)
     ====================================================================== */

  function initLightbox() {
    if (typeof HTMLDialogElement === "undefined") return;

    const arrowPrev = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
    const arrowNext = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    const cross = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Photo agrandie");
    dialog.innerHTML = `
      <button type="button" class="lightbox__btn lightbox__close" aria-label="Fermer">${cross}</button>
      <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--prev" aria-label="Photo précédente">${arrowPrev}</button>
      <img class="lightbox__img" alt="" />
      <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--next" aria-label="Photo suivante">${arrowNext}</button>
      <p class="lightbox__caption"></p>`;
    document.body.appendChild(dialog);

    const imgEl = $(".lightbox__img", dialog);
    const caption = $(".lightbox__caption", dialog);
    const navBtns = $$(".lightbox__nav", dialog);

    let photos = [];
    let pos = 0;
    let title = "";

    const show = (i) => {
      pos = (i + photos.length) % photos.length;
      const photo = photos[pos];
      imgEl.src = photo.currentSrc || photo.src;
      imgEl.alt = photo.alt;
      caption.textContent =
        photos.length > 1 ? `${title} (${pos + 1} / ${photos.length})` : title;
    };

    const open = (figure) => {
      const slide = figure.closest(".offer-slide");
      if (!slide) return;
      photos = $$("figure[data-zoom] img", slide);
      pos = Math.max(0, photos.indexOf($("img", figure)));
      title = slide.dataset.title || "";
      navBtns.forEach((b) => (b.hidden = photos.length < 2));
      show(pos);
      dialog.showModal();
      document.body.classList.add("has-lightbox");
    };

    // Seules les photos réellement chargées sont zoomables
    $$(".offer-slide__media figure").forEach((figure) => {
      const img = $("img", figure);
      if (!img) return;

      const enable = () => {
        if (!img.naturalWidth) return;
        figure.dataset.zoom = "";
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", `Agrandir : ${img.alt}`);
      };

      if (img.complete) enable();
      else img.addEventListener("load", enable, { once: true });
    });

    document.addEventListener("click", (e) => {
      const figure = e.target.closest("figure[data-zoom]");
      if (figure) open(figure);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const figure = e.target.closest && e.target.closest("figure[data-zoom]");
      if (figure && e.target === figure) {
        e.preventDefault();
        open(figure);
      }
    });

    // Fermer : bouton, clic sur le fond, Échap (natif)
    $(".lightbox__close", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("has-lightbox");
      imgEl.removeAttribute("src");
    });

    // Naviguer : boutons, flèches du clavier, swipe
    $(".lightbox__nav--prev", dialog).addEventListener("click", () => show(pos - 1));
    $(".lightbox__nav--next", dialog).addEventListener("click", () => show(pos + 1));

    dialog.addEventListener("keydown", (e) => {
      if (photos.length < 2) return;
      if (e.key === "ArrowLeft") show(pos - 1);
      if (e.key === "ArrowRight") show(pos + 1);
    });

    let touchX = null;
    dialog.addEventListener(
      "touchstart",
      (e) => (touchX = e.changedTouches[0].clientX),
      { passive: true },
    );
    dialog.addEventListener(
      "touchend",
      (e) => {
        if (touchX === null || photos.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) show(dx > 0 ? pos - 1 : pos + 1);
      },
      { passive: true },
    );
  }

  /* ======================================================================
     LIENS DIRECTS : prestations.html#photobooth ouvre la bonne prestation
     ====================================================================== */

  function initDeepLinks(carousels) {
    let userScrolled = false;
    ["wheel", "touchstart", "keydown"].forEach((evt) =>
      window.addEventListener(evt, () => (userScrolled = true), {
        once: true,
        passive: true,
      }),
    );

    const openFromHash = ({ instant }) => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;

      const target = document.getElementById(id);
      const carousel = carousels.find((c) => c.slides.includes(target));
      if (!carousel) return; // un lien vers une catégorie est géré par le navigateur

      carousel.goTo(carousel.slides.indexOf(target), { instant: true });

      const section = target.closest(".offer-cat");
      if (section) {
        section.scrollIntoView({
          behavior: instant ? "auto" : scrollBehavior(),
          block: "start",
        });
      }
    };

    openFromHash({ instant: true });

    // Les images chargent après coup et décalent la mise en page : on recale une fois
    window.addEventListener("load", () => {
      if (!userScrolled) openFromHash({ instant: true });
    });

    window.addEventListener("hashchange", () => openFromHash({ instant: false }));
  }

  /* ======================================================================
     DÉMARRAGE
     ====================================================================== */

  function init() {
    initHeader();
    initYear();

    const carousels = $$("[data-offer-carousel]").map(initCarousel).filter(Boolean);

    initCategoryNav();
    initLightbox();
    initDeepLinks(carousels);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();