const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

function setMenuOpen(open) {
  if (!toggle || !mobileNav) return;
  mobileNav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}

if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    setMenuOpen(!mobileNav.classList.contains('open'));
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
}

const year = document.getElementById('year');
if (year) {
  year.textContent = new Date().getFullYear();
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileNav?.classList.contains('open')) {
    setMenuOpen(false);
    toggle?.focus();
  }
});
