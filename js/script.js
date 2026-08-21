function initApp() {
  // Dynamic seamless marquee with zero gaps and smooth loop
  function initMarquees() {
    document.querySelectorAll('.marquee').forEach(marquee => {
      const track = marquee.querySelector('.marquee-track');
      if (!track) return;

      if (!track.dataset.originalHtml) {
        track.dataset.originalHtml = track.innerHTML;
      }
      const baseHTML = track.dataset.originalHtml;

      // Reset and build one half until it exceeds viewport width + safety buffer
      track.innerHTML = baseHTML;
      while (track.scrollWidth < (window.innerWidth + 600)) {
        track.innerHTML += baseHTML;
      }

      // Duplicate the filled half to create 2 perfectly identical halves
      const halfHTML = track.innerHTML;
      track.innerHTML = halfHTML + halfHTML;

      // Set consistent scrolling speed proportional to content width (~45px per second)
      const halfWidth = track.scrollWidth / 2;
      const speed = 45;
      track.style.animationDuration = `${Math.max(halfWidth / speed, 12)}s`;
    });
  }
  initMarquees();
  window.addEventListener('resize', initMarquees);

  // Scroll-based header glass effect
  const siteHeader = document.querySelector('header.site-header');
  if (siteHeader) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // mobile nav toggle — swap SVG icons
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const iconMenu = document.getElementById('icon-menu');
  const iconClose = document.getElementById('icon-close');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      if (iconMenu) iconMenu.style.display = isOpen ? 'none' : '';
      if (iconClose) iconClose.style.display = isOpen ? '' : 'none';
    });
    // close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('header.site-header') && links.classList.contains('open')) {
        links.classList.remove('open');
        if (iconMenu) iconMenu.style.display = '';
        if (iconClose) iconClose.style.display = 'none';
      }
    });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // animated stat counters
  const counters = document.querySelectorAll('.num[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCount(e.target);
          counterIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterIO.observe(el));
  }
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // double-tap / double-click heart pop on feed posts
  document.querySelectorAll('.feed-post').forEach(post => {
    post.addEventListener('dblclick', () => triggerHeart(post));
    let lastTap = 0;
    post.addEventListener('touchend', () => {
      const now = Date.now();
      if (now - lastTap < 350) triggerHeart(post);
      lastTap = now;
    });
  });
  function triggerHeart(post) {
    post.classList.remove('pop');
    void post.offsetWidth;
    post.classList.add('pop');
  }

  // ---- WhatsApp helpers ----
  const WA_PHONE = '919825922470';
  function waLink(text) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const base = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
    return base + '?phone=' + WA_PHONE + '&text=' + encodeURIComponent(text);
  }

  // quick-query WhatsApp buttons on service cards
  document.querySelectorAll('.wa-quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const service = btn.dataset.service || 'your services';
      const text = "Hi, I'm interested in " + service;
      window.open(waLink(text), '_blank');
    });
  });

  // mobile & touch devices: tap to reveal feed-post overlay (hover doesn't exist on touch)
  const isMobileOrTouch = (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse), (max-width: 860px)').matches) || ('ontouchstart' in window);
  if (isMobileOrTouch) {
    document.querySelectorAll('.feed-post').forEach(post => {
      // visible "Tap for details" affordance so info isn't hidden with no clue it exists
      if (!post.querySelector('.tap-hint')) {
        const hint = document.createElement('span');
        hint.className = 'tap-hint';
        hint.textContent = 'Tap for details';
        post.appendChild(hint);
      }

      post.setAttribute('tabindex', '0');
      post.setAttribute('role', 'button');
      post.setAttribute('aria-expanded', 'false');

      function toggle() {
        document.querySelectorAll('.feed-post.tap-open').forEach(p => {
          if (p !== post) { p.classList.remove('tap-open'); p.setAttribute('aria-expanded', 'false'); }
        });
        const open = post.classList.toggle('tap-open');
        post.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      post.addEventListener('click', (e) => {
        if (e.target.closest('.wa-quick-btn') || e.target.closest('.ig-post-btn')) return;
        toggle();
      });
      post.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    // tapping anywhere outside a card closes any open one
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.feed-post')) {
        document.querySelectorAll('.feed-post.tap-open').forEach(p => {
          p.classList.remove('tap-open');
          p.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // contact form — validates, then sends full message via WhatsApp
  const form = document.querySelector('#contact-form');
  if (form) {
    const fields = {
      name: { el: document.getElementById('name'), validate: v => v.trim().length > 0 },
      email: { el: document.getElementById('email'), validate: v => v.trim().length >= 5 },
      message: { el: document.getElementById('message'), validate: v => v.trim().length > 0 }
    };

    // clear error state as the person types
    Object.values(fields).forEach(({ el }) => {
      el.addEventListener('input', () => {
        const group = el.closest('.field-group');
        if (group) group.classList.remove('invalid');
        el.classList.remove('is-invalid');
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      Object.values(fields).forEach(({ el, validate }) => {
        const group = el.closest('.field-group');
        const ok = validate(el.value);
        if (!ok) {
          isValid = false;
          if (group) group.classList.add('invalid');
          el.classList.add('is-invalid');
        } else {
          if (group) group.classList.remove('invalid');
          el.classList.remove('is-invalid');
        }
      });

      if (!isValid) {
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const brand = document.getElementById('brand').value.trim();
      const service = document.getElementById('service').value;
      const message = document.getElementById('message').value.trim();

      const lines = [
        'New Inquiry — Udaan Creations',
        '',
        'Name       : ' + name,
        'Contact    : ' + email,
        'Brand/IG   : ' + (brand || '—'),
        'Service    : ' + service,
        '',
        'Message    :',
        message
      ];
      const text = lines.join('\n');

      window.open(waLink(text), '_blank');

      form.style.display = 'none';
      const thankYou = document.getElementById('thank-you-card');
      if (thankYou) thankYou.style.display = 'block';
    });
  }

  // Dynamic WhatsApp FAB URL
  const waFab = document.getElementById('wa-fab');
  if (waFab) {
    waFab.href = waLink("Hi Udaan Creations, I'd like to talk about custom social media growth!");
  }

  // Dynamic footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Interactive 3D tilt & parallax for hero collage
  const collage = document.querySelector('.collage');
  if (collage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const hero = collage.closest('.hero') || collage;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let isHovered = false;
    let rafId = null;

    function updateTilt() {
      currentRotateX += (targetRotateX - currentRotateX) * 0.12;
      currentRotateY += (targetRotateY - currentRotateY) * 0.12;

      collage.style.transform = `perspective(1200px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;

      if (isHovered || Math.abs(targetRotateX - currentRotateX) > 0.02 || Math.abs(targetRotateY - currentRotateY) > 0.02) {
        rafId = requestAnimationFrame(updateTilt);
      } else {
        collage.style.transform = '';
        rafId = null;
      }
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      targetRotateX = -y * 16;
      targetRotateY = x * 20;
      isHovered = true;

      if (!rafId) {
        rafId = requestAnimationFrame(updateTilt);
      }
    });

    hero.addEventListener('mouseleave', () => {
      targetRotateX = 0;
      targetRotateY = 0;
      isHovered = false;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

