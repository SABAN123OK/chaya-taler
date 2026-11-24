/* עמוד הפרויקטים: סינון פרטיים / עסקיים (גם מהכתובת: projects.html?type=business) */
(function () {
  var bar = document.querySelector('[data-filter]');
  if (!bar) return;
  var cards = document.querySelectorAll('.ct-pgrid .ct-proj');
  var apply = function (type, push) {
    if (['all', 'private', 'business'].indexOf(type) < 0) type = 'all';
    bar.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.type === type ? 'true' : 'false'); });
    cards.forEach(function (c) { c.hidden = type !== 'all' && c.dataset.type !== type; });
    if (push) history.replaceState(null, '', type === 'all' ? location.pathname : location.pathname + '?type=' + type);
  };
  bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) apply(b.dataset.type, true); });
  apply(new URLSearchParams(location.search).get('type') || 'all', false);
})();

/* כותרת עליונה: תפריט נייד + רקע מלא אחרי גלילה */
(function () {
  var head = document.querySelector('[data-head]');
  if (!head) return;
  var toggle = head.querySelector('.ct-head__toggle');
  var setOpen = function (open) {
    head.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', function () { setOpen(!head.classList.contains('is-open')); });
  head.querySelectorAll('.ct-head__nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  // לחיצה מחוץ לחלונית הצדדית סוגרת אותה
  document.addEventListener('click', function (e) { if (head.classList.contains('is-open') && !e.target.closest('.ct-head__nav') && !e.target.closest('.ct-head__toggle')) setOpen(false); });
  var desk = matchMedia('(min-width:1100px)');
  var onScroll = function () {
    var y = scrollY || pageYOffset;
    head.classList.toggle('is-solid', y > 40);
    // במחשב: בראש העמוד התפריט פתוח; אחרי גלילה הוא מתחלף בכפתור המבורגר
    var compact = y > 80;
    if (!compact && desk.matches && head.classList.contains('is-open')) setOpen(false);
    head.classList.toggle('is-compact', compact);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* רוחב פס הגלילה — כדי ששולי מסך הפתיחה יהיו בדיוק 2.5% מרוחב המסך הנראה */
(function(){
  function setSbw(){ document.documentElement.style.setProperty('--sbw', (window.innerWidth - document.documentElement.clientWidth) + 'px'); }
  setSbw(); window.addEventListener('resize', setSbw); window.addEventListener('load', setSbw);
})();
