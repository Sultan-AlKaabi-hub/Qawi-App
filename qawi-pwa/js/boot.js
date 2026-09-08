/* =============================================================================
   boot.js — runs synchronously in <head>, before first paint.
   -----------------------------------------------------------------------------
   Sets lang / dir / theme from storage so an Arabic user never sees a frame of
   left-to-right layout, and a light-theme user never sees a dark flash.
   It is an external file rather than an inline <script> so the Content Security
   Policy can stay at script-src 'self' with no 'unsafe-inline' and no hashes to
   maintain. Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
   Keep it tiny: it blocks rendering by design.
   ========================================================================== */
(function () {
  try {
    var d = document.documentElement;
    var lang = localStorage.getItem('qawi.lang');
    if (lang !== 'ar' && lang !== 'en') {
      var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      lang = nav.toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
    }
    d.lang = lang;
    d.dir = lang === 'ar' ? 'rtl' : 'ltr';
    d.dataset.theme = localStorage.getItem('qawi.theme') === 'light' ? 'light' : 'dark';
  } catch (e) {
    /* Private mode with storage disabled: fall back to the document defaults. */
  }
})();
