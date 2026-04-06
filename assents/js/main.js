/* ═══════════════════════════════════════════════════════════
   PORTFÓLIO — YAN CARVALHO
   script.js — Interações, animações e lógica do site
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   UTILITÁRIO: query helpers
   ────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ══════════════════════════════════════════
   1. LOADER
   ══════════════════════════════════════════ */
(function initLoader() {
  const loader = qs('#loader');
  if (!loader) return;

  // Espera o CSS de loading (fill ~1.2s) + pequena pausa visual
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove do DOM após transição para não bloquear eventos
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 1600);
  });
})();


/* ══════════════════════════════════════════
   2. CURSOR CUSTOMIZADO
   Desativa automaticamente em telas touch
   ══════════════════════════════════════════ */
(function initCursor() {
  const cursor    = qs('#cursor');
  const cursorDot = qs('#cursorDot');
  if (!cursor || !cursorDot) return;

  // Não exibe em dispositivos touch
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = 0, mouseY = 0;
  let curX   = 0, curY   = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // O dot segue instantaneamente
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  // O anel segue com leve atraso (efeito elástico via rAF)
  function animateCursor() {
    curX += (mouseX - curX) * 0.12;
    curY += (mouseY - curY) * 0.12;
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Aumenta cursor em elementos interativos
  const hoverTargets = 'a, button, .project-card, .highlight-card, .soft-item, input, textarea';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove('cursor-hover');
    }
  });
})();


/* ══════════════════════════════════════════
   3. NAVBAR — fundo ao rolar + link ativo
   ══════════════════════════════════════════ */
(function initNav() {
  const nav       = qs('#nav');
  const navToggle = qs('#navToggle');
  const navLinks  = qs('#navLinks');
  const links     = qsa('.nav-links a');

  if (!nav) return;

  // Fundo do nav ao rolar
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
  }, { passive: true });

  // Toggle menu mobile
  navToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Fecha o menu mobile ao clicar em um link
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle?.classList.remove('open');
    });
  });

  // Destaca o link ativo baseado na seção visível
  function updateActiveLink() {
    const sections = qsa('section[id]');
    const scrollY  = window.scrollY + window.innerHeight / 3;

    sections.forEach(sec => {
      const top    = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      const id     = sec.getAttribute('id');
      const link   = qs(`.nav-links a[href="#${id}"]`);
      if (!link) return;
      link.classList.toggle('active', scrollY >= top && scrollY < bottom);
    });
  }

  updateActiveLink();
})();


/* ══════════════════════════════════════════
   4. SCROLL REVEAL
   Usa IntersectionObserver para revelar
   elementos com classes .reveal-up e .reveal-fade
   ══════════════════════════════════════════ */
(function initReveal() {
  const elements = qsa('.reveal-up, .reveal-fade');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // só anima uma vez
        }
      });
    },
    {
      threshold: 0.12,      // 12% do elemento visível para disparar
      rootMargin: '0px 0px -40px 0px'
    }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════
   5. BARRAS DE HABILIDADES
   Anima as barras quando ficam visíveis
   ══════════════════════════════════════════ */
(function initSkillBars() {
  const items = qsa('.skill-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const fill  = qs('.skill-fill', entry.target);
        const level = entry.target.dataset.level || '0';

        // Pequeno delay para o CSS reveal terminar antes da barra animar
        setTimeout(() => {
          if (fill) fill.style.width = level + '%';
        }, 200);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  items.forEach(item => observer.observe(item));
})();


/* ══════════════════════════════════════════
   6. FORMULÁRIO DE CONTATO — Formspree
   Envia via fetch (AJAX) mantendo o visual
   do portfólio sem redirecionar de página
   ══════════════════════════════════════════ */
(function initForm() {
  const form     = qs('#contactForm');
  const feedback = qs('#formFeedback');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede reload — usamos fetch abaixo

    const name    = qs('#name', form).value.trim();
    const email   = qs('#email', form).value.trim();
    const message = qs('#message', form).value.trim();
    const btn     = qs('[type="submit"]', form);

    // Validação no front antes de enviar
    if (!name || !email || !message) {
      showFeedback('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showFeedback('Digite um e-mail válido.', 'error');
      return;
    }

    // Estado de carregamento
    btn.disabled = true;
    qs('.btn-text', btn).textContent = 'Enviando...';
    clearFeedback();

    try {
      // Envia para o Formspree via fetch com Accept: application/json
      // para receber resposta JSON em vez de redirecionamento
      const res = await fetch('https://formspree.io/f/manelqjl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, message })
      });

      if (res.ok) {
        onSuccess();
      } else {
        // Formspree retorna erros no corpo JSON
        const data = await res.json();
        const errMsg = data?.errors?.[0]?.message || 'Erro ao enviar.';
        onError(errMsg);
      }
    } catch (err) {
      onError('Falha de conexão. Tente pelo LinkedIn.');
    }

    function onSuccess() {
      showFeedback('✓ Mensagem enviada! Entrarei em contato em breve.', 'success');
      form.reset();
      btn.disabled = false;
      qs('.btn-text', btn).textContent = 'Enviar Mensagem';
    }

    function onError(msg) {
      showFeedback(msg || 'Erro ao enviar. Tente pelo LinkedIn ou e-mail.', 'error');
      btn.disabled = false;
      qs('.btn-text', btn).textContent = 'Enviar Mensagem';
    }
  });

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className   = `form-feedback ${type}`;
  }

  function clearFeedback() {
    feedback.textContent = '';
    feedback.className   = 'form-feedback';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();


/* ══════════════════════════════════════════
   7. SMOOTH SCROLL para âncoras
   (Reforça para browsers antigos)
   ══════════════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ══════════════════════════════════════════
   8. EFEITO PARALLAX SUAVE no hero
   Movimenta levemente o conteúdo ao rolar
   ══════════════════════════════════════════ */
(function initParallax() {
  const heroContent = qs('.hero-content');
  const heroDeco    = qs('.hero-deco-number');
  if (!heroContent) return;

  // Desativa em mobile para performance
  if (window.innerWidth < 768) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroContent.style.transform = `translateY(${y * 0.15}px)`;
    if (heroDeco) heroDeco.style.transform = `translateY(${y * 0.08}px)`;
  }, { passive: true });
})();


/* ══════════════════════════════════════════
   9. TÍTULO DA PÁGINA — easter egg de foco
   Muda o título quando o usuário sai da aba
   ══════════════════════════════════════════ */
(function initTabTitle() {
  const original = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden
      ? '👋 Volte logo! — YC'
      : original;
  });
})();


/* ══════════════════════════════════════════
   10. HIGHLIGHT DOS CARDS DE PROJETO
   Efeito de luz que segue o mouse
   ══════════════════════════════════════════ */
(function initCardGlow() {
  const cards = qsa('.project-card, .highlight-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--glow-x', x + '%');
      card.style.setProperty('--glow-y', y + '%');
      card.style.background = `radial-gradient(
        circle at ${x}% ${y}%,
        rgba(255,255,255,0.04) 0%,
        var(--gray-900) 60%
      )`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
})();


/* ══════════════════════════════════════════
   FIM DO SCRIPT
   ══════════════════════════════════════════ */