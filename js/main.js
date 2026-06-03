// main.js — interacción del sitio LatinShare (vanilla JS, sin dependencias).

document.addEventListener('includes:loaded', () => {
  initMobileMenu();
});
document.addEventListener('DOMContentLoaded', () => {
  initCarousels();
  initAccordions();
});

/* ---- Menú móvil ---- */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ---- Carruseles horizontales (data-carousel) ---- */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('[data-carousel-track]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (!track) return;
    const scrollBy = () => Math.min(track.clientWidth * 0.8, 600);
    prev && prev.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));
  });
}

/* ---- Acordeón FAQ (data-accordion) ---- */
function initAccordions() {
  document.querySelectorAll('[data-accordion-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (panel) panel.classList.toggle('hidden', isOpen);
      const icon = btn.querySelector('[data-accordion-icon]');
      if (icon) icon.classList.toggle('rotate-180', !isOpen);
    });
  });
}

/* ---- Envío de formularios (Formspree/Web3Forms) ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.js-contact-form, .js-newsletter').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.js-form-status');
      const btn = form.querySelector('button[type="submit"]');
      if (form.action.includes('REEMPLAZAR')) {
        if (status) status.textContent = 'Configura el endpoint del formulario antes de publicar.';
        return;
      }
      btn && (btn.disabled = true);
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          form.reset();
          if (status) { status.textContent = '¡Gracias! Te responderemos a la brevedad.'; status.style.color = '#225640'; }
        } else {
          throw new Error('Error de envío');
        }
      } catch (err) {
        if (status) { status.textContent = 'No se pudo enviar. Inténtalo de nuevo o escríbenos a contacto@latinshare.com.'; status.style.color = '#F26522'; }
      } finally {
        btn && (btn.disabled = false);
      }
    });
  });
});
