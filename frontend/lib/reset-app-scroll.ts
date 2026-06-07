/** Reset document + in-app scroll after route changes (fixes mobile post-form navigation). */
export function resetAppScroll(mainEl?: HTMLElement | null) {
  if (typeof window === 'undefined') return;

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  mainEl?.scrollTo(0, 0);

  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.body.style.removeProperty('margin-right');
  document.body.removeAttribute('data-scroll-locked');
}
