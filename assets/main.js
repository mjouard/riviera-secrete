// Menu mobile (hamburger) — replie/déplie la nav sous le header en dessous de 700px.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-toggle').forEach((btn) => {
    const nav = btn.closest('header')?.querySelector('nav');
    if (!nav) return;
    const close = () => {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
    };
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  });
});

// Apparition douce des cartes au scroll
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(c => io.observe(c));
  } else {
    cards.forEach(c => c.classList.add('visible'));
  }
});

// Carousel hero sur les pages de lieux
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.detail-hero');
  if (!hero) return;
  const img = hero.querySelector('img');
  if (!img) return;

  let slideSrcs;
  const carouselSrcs = img.dataset.carouselSrcs;
  const localCount = parseInt(img.dataset.slides, 10);

  if (carouselSrcs) {
    slideSrcs = carouselSrcs.split(',').map(s => s.trim());
  } else if (localCount > 1) {
    const base = img.src.slice(0, img.src.lastIndexOf('/') + 1);
    slideSrcs = [img.src];
    for (let i = 2; i <= localCount; i++) slideSrcs.push(base + 'hero-' + i + '.jpg');
  } else if (localCount === 1) {
    return;
  } else {
    const match = img.src.match(/picsum\.photos\/seed\/([^/]+)\//);
    if (!match) return;
    const seed = match[1];
    slideSrcs = [img.src,
      `https://picsum.photos/seed/${seed}-2/1200/800`,
      `https://picsum.photos/seed/${seed}-3/1200/800`,
      `https://picsum.photos/seed/${seed}-4/1200/800`,
      `https://picsum.photos/seed/${seed}-5/1200/800`
    ];
  }

  const track = document.createElement('div');
  track.className = 'carousel-track';
  slideSrcs.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    const si = document.createElement('img');
    si.src = src;
    si.alt = img.alt;
    si.loading = i === 0 ? 'eager' : 'lazy';
    slide.appendChild(si);
    track.appendChild(slide);
  });
  img.parentNode.replaceChild(track, img);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-btn carousel-prev';
  prevBtn.setAttribute('aria-label', 'Image précédente');
  prevBtn.innerHTML = '&#8249;';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-btn carousel-next';
  nextBtn.setAttribute('aria-label', 'Image suivante');
  nextBtn.innerHTML = '&#8250;';

  const dotsEl = document.createElement('div');
  dotsEl.className = 'carousel-dots';
  const dots = slideSrcs.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dotsEl.appendChild(dot);
    return dot;
  });

  hero.appendChild(prevBtn);
  hero.appendChild(nextBtn);
  hero.appendChild(dotsEl);

  let current = 0;
  function goTo(n) {
    current = ((n % slideSrcs.length) + slideSrcs.length) % slideSrcs.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  let startX = 0;
  hero.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
  });
});
