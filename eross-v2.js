(() => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuLinks = document.querySelectorAll('.main-nav a');
  const cursorGlow = document.querySelector('.cursor-glow');
  const heroVisual = document.querySelector('.hero-visual');
  const parallaxCards = document.querySelectorAll('.parallax-card');
  const ecosystemFlow = document.querySelector('.ecosystem-flow');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  menuToggle?.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = Number(el.dataset.delay || 0);
      window.setTimeout(() => el.classList.add('is-visible'), delay);
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.13 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  if (ecosystemFlow) {
    const ecosystemObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ecosystemFlow.classList.add('is-visible');
          ecosystemObserver.disconnect();
        }
      });
    }, { threshold: 0.28 });
    ecosystemObserver.observe(ecosystemFlow);
  }

  const runCounter = (el) => {
    const target = Number(el.dataset.target || 0);
    const duration = 1250;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toLocaleString('es-CR');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.counter').forEach(counter => counterObserver.observe(counter));

  if (!prefersReducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      if (cursorGlow) {
        cursorGlow.style.transform = `translate(${e.clientX - 220}px, ${e.clientY - 220}px)`;
      }
    }, { passive: true });

    heroVisual?.addEventListener('pointermove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      parallaxCards.forEach(card => {
        const depth = Number(card.dataset.depth || 12);
        if (card.classList.contains('device-shell')) {
          card.style.marginLeft = `${x * depth * 0.55}px`;
          card.style.marginTop = `${y * depth * 0.4}px`;
        } else {
          card.style.marginLeft = `${x * depth}px`;
          card.style.marginTop = `${y * depth}px`;
        }
      });
    });

    heroVisual?.addEventListener('pointerleave', () => {
      parallaxCards.forEach(card => {
        card.style.marginLeft = '0px';
        card.style.marginTop = '0px';
      });
    });

    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.08}px,${y * 0.12}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  const activeNodes = document.querySelectorAll('.flow-node');
  activeNodes.forEach((node, index) => {
    node.addEventListener('mouseenter', () => {
      activeNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
    });
    node.addEventListener('focusin', () => {
      activeNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
    });
  });
})();