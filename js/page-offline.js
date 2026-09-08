/* Offline fallback: translate the copy and retry when the connection returns. */
import { applyLang, detectLang } from './i18n.js';

applyLang(detectLang());

document.querySelector('[data-action="retry"]')
  ?.addEventListener('click', () => location.reload());

// Reload automatically the moment connectivity comes back.
window.addEventListener('online', () => location.reload());
