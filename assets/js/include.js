/**
 * Lightweight HTML include — fetches partials/header.html and partials/footer.html
 * into <div data-include="header"></div> / <div data-include="footer"></div>
 * placeholders, then marks the active nav link based on data-page on <body>.
 *
 * Requires being served over http(s) — fetch() does not work on file://
 * Use:  python3 -m http.server 8000
 */
(function () {
  'use strict';

  const slots = document.querySelectorAll('[data-include]');
  const fetches = Array.from(slots).map((slot) => {
    const name = slot.getAttribute('data-include');
    return fetch(`partials/${name}.html`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load partials/${name}.html`);
        return r.text();
      })
      .then((html) => {
        slot.outerHTML = html;
      })
      .catch((err) => console.error(err));
  });

  Promise.all(fetches).then(() => {
    // Mark active nav link
    const page = document.body.dataset.page;
    if (!page) return;
    const link = document.querySelector(`.site-nav a[data-nav="${page}"]`);
    if (link) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
})();
