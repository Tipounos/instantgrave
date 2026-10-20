/* ==========================================================================
   INSTANT GRAVÉ EVENT — cartes des prestations
   Tarifs et textes issus du catalogue 2026.
   Pour modifier un prix ou un texte : change uniquement la liste ci-dessous.
   À charger AVANT script.js (le carrousel a besoin que les cartes existent).
   ========================================================================== */

const PRESTATIONS = [
  { slug: 'photobooth', title: 'Photobooth', price: 'À partir de 420 €',
    text: "Classique et simple d'utilisation : capturez vos souvenirs avec un visuel personnalisé, impression instantanée ou envoi par QR-code / mail." },
  { slug: 'photobooth-v2', title: 'Photobooth V2', price: 'À partir de 480 €',
    text: 'Design et moderne, il capture vos souvenirs avec un visuel personnalisé. Impression instantanée, QR-code ou mail.' },
  { slug: 'videobooth', title: 'Vidéobooth', price: 'À partir de 420 €',
    text: 'Filmez-vous à 360° en qualité 4K, seul ou à plusieurs, et recevez vos vidéos en instantané avec visuel et fond sonore personnalisés.' },
  { slug: 'miroirbooth', title: 'Miroirbooth', price: 'À partir de 600 €',
    text: 'Élégant et prestigieux (cadre doré baroque, éclairage Hollywood) : idéal pour apporter du prestige à vos événements.' },
  { slug: 'livre-d-or-audio', title: "Livre d'or audio", price: 'À partir de 120 €',
    text: 'Vos invités enregistrent des messages vocaux pendant l’événement, et vous les recevez en fichier audio.' },
  { slug: 'livre-d-or-video', title: "Livre d'or vidéo", price: 'À partir de 150 €',
    text: 'Vos invités enregistrent des messages vidéo pendant l’événement, et vous les recevez en fichier vidéo.' },
  { slug: 'panneau-fontaine', title: 'Panneau fontaine', price: 'À partir de 350 €',
    text: 'Un support de communication chic et personnalisable : message d’accueil, plan de table, logo…' },
  { slug: 'poteaux-led', title: 'Poteaux LED', price: 'À partir de 100 €',
    text: 'Pour animer lumineusement vos événements.' },
  { slug: 'mur-de-fond', title: 'Mur de fond', price: 'À partir de 20 €',
    text: "Dissimule l'arrière-plan et met davantage en valeur vos photos." },
  { slug: 'enclos', title: 'Enclos', price: 'À partir de 80 €', cutout: true,
    text: "Dissimule l'arrière-plan et met davantage en valeur vos vidéos." },
  { slug: 'granita', title: 'Granita', price: 'À partir de 250 €', cutout: true,
    text: 'Des granités colorés et rafraîchissants pour le bonheur des enfants comme des adultes.' },
  { slug: 'gaufres', title: 'Gaufres', price: 'À partir de 250 €', cutout: true,
    text: 'Une note chaleureuse et gourmande, avec sucre, Nutella, caramel et toppings.' },
  { slug: 'barbe-a-papa', title: 'Barbe à papa', price: 'À partir de 250 €', cutout: true,
    text: 'Symbole incontournable des fêtes, elle séduit toutes les générations.' }
];

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('prestations-track');
  if (!track) return;

  track.innerHTML = PRESTATIONS.map((p) => `
    <article class="card">
      <div class="card__image">
        <img src="assets/images/prestations/${p.slug}.webp" alt="${p.title} — Instant Gravé Event" loading="lazy"
             class="${p.cutout ? 'is-cutout' : ''}"
             onerror="this.parentElement.classList.add('is-placeholder')" />
      </div>
      <div class="card__body">
        <h3 class="card__title">${p.title}</h3>
        <p class="card__price">${p.price}</p>
        <p class="card__text">${p.text}</p>
        <a href="devis.html?presta=${p.slug}" class="card__link">
          Demander un devis
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </a>
      </div>
    </article>`).join('');
});
