// Inyecta partials compartidos (header/footer) y marca el enlace activo del nav.
async function injectIncludes() {
  const nodes = document.querySelectorAll('[data-include]');
  await Promise.all([...nodes].map(async (el) => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url);
      el.innerHTML = await res.text();
    } catch (e) {
      console.error('No se pudo cargar el partial:', url, e);
    }
  }));
  markActiveNav();
  document.dispatchEvent(new CustomEvent('includes:loaded'));
}

function markActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === path || (path === 'index.html' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });
}

document.addEventListener('DOMContentLoaded', injectIncludes);
