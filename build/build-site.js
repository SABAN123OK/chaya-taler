// בונה את כל עמודי האתר מתוך קובץ העיצוב (design/index.html) ונתוני התוכן (assets/content.js).
// הרצה מתוך התיקייה new-site:  node build/build-site.js
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'assets', 'content.js'));
require(path.join(ROOT, 'assets', 'testimonials.js'));
const S = window.SITE;
const TESTIMONIALS = window.TESTIMONIALS;
// פרויקטים מוסתרים כרגע (לא נבנים ולא מקושרים). להחזרה: מוחקים את המספר מהרשימה.
const HIDDEN_PROJECTS = new Set([218, 548]); // "מי קבע שמטרים...", "כמה קטנה ככה חכמה"
const ALL_PROJECTS = S.projects;
S.projects = ALL_PROJECTS.filter(p => !HIDDEN_PROJECTS.has(p.id));
const design = fs.readFileSync(path.join(ROOT, 'design', 'index.html'), 'utf8');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = (n) => String(n).padStart(2, '0');
const ARROW = '<svg class="ct-btn__arrow" viewBox="0 0 40 16" aria-hidden="true"><path d="M40 8H2M9 1L2 8l7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const ARROW_SM = '<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M40 8H2M9 1L2 8l7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const btn = (label, href, cls = '', extra = '') => `<a class="ct-btn ${cls}" href="${href}" data-magnetic${extra}><span class="ct-btn__label">${label}</span>${ARROW}</a>`;
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return s.slice(i, j); };
const projUrl = (p) => `project-${p.id}.html`;
// פרויקטים עסקיים. כל השאר פרטיים. להוספה: מוסיפים את מספר הפרויקט לרשימה.
const BUSINESS = new Set([1889]); // המשרד של בת שבע בורנשטיין
const projType = (p) => (BUSINESS.has(p.id) ? 'business' : 'private');
const postUrl = (p) => `post-${p.id}.html`;
const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${+dd}.${+m}.${y}`; };
const img = (src, alt = '', extra = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;

// עמוד ההדמיות מוסתר בינתיים. לשינוי ל-true הוא ייבנה ויופיע שוב בתפריט ובפוטר.
const SHOW_VIZ = false;

// ---------- shared chrome ----------
const NAV = [['index.html', 'ראשי'], ['about.html', 'אודות'], ['projects.html', 'פרויקטים'], ['testimonials.html', 'לקוחות מספרים'], ...(SHOW_VIZ ? [['visualizations.html', 'הדמיות']] : []), ['blog.html', 'בלוג'], ['contact.html', 'יצירת קשר']];
const MOTION = design.match(/<script>\s*\/\*[\s\S]*?<\/script>/)[0]; // מפעיל אנימציות רק כש-JS רץ

function head(title, desc, current) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><!-- גרסת תצוגה מקדימה: להסיר בעלייה לאוויר -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${MOTION}
<link rel="preload" href="fonts/Plinko_Fs-Black.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/metropolis@5.3.0/400.css"><!-- ניסיון: Metropolis Regular ל-THE PERFECT BALANCE (Fontsource, רישיון פתוח) -->
<link rel="preload" href="fonts/Plinko_Fs-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css?v=${ASSET_V}">
<link rel="stylesheet" href="assets/pages.css?v=${ASSET_V}">
</head>
<body style="margin:0">
${header(current)}
`;
}
function header(current) {
  // ימין: תפריט (וכפתור המבורגר שמחליף אותו בגלילה) · שמאל: הלוגו
  return `<header class="ct-head${current === 'index.html' ? '' : ' ct-head--solid'}" data-head>
  <button class="ct-head__toggle" type="button" aria-controls="ct-nav" aria-expanded="false" aria-label="תפריט"><span></span><span></span><span></span></button>
  <nav class="ct-head__nav" id="ct-nav" aria-label="ניווט ראשי">
    ${NAV.map(([h, t]) => `<a href="${h}"${h === current ? ' aria-current="page"' : ''}>${t}</a>`).join('\n    ')}
  </nav>
  <a class="ct-head__logo" href="index.html" aria-label="טאלר אדריכלות ועיצוב — לדף הבית"><img src="images/logo-taler.png" alt="TALER Architecture &amp; Design" width="353" height="154"></a>
</header>`;
}
const pageOpen = () => `<main class="ct-page" id="ct-page">
  <div class="ct-progressbar" aria-hidden="true"></div>
  <div class="ct-cursor" aria-hidden="true"></div>
  <div class="ct-cursor-ring" aria-hidden="true"></div>
`;
function footer() {
  return `  <footer class="ct-foot" data-reveal="fade">
    <div class="ct-foot__top">
      <div class="ct-foot__brand">
        <a class="ct-foot__logo" href="index.html" aria-label="טאלר אדריכלות ועיצוב — לדף הבית"><img src="images/logo-taler.png" alt="TALER Architecture &amp; Design" width="353" height="154" loading="lazy"></a>
        <p class="ct-foot__about">תכנון ארכיטקטוני מדויק, עיצוב פנים ופיקוח בשטח<br>מהסקיצה הראשונה ועד הבית המושלם.</p>
      </div>
      <nav class="ct-foot__col" aria-label="ניווט באתר">
        <p class="ct-foot__h">ניווט</p>
        ${NAV.map(([h, t]) => `<a href="${h}">${t === 'ראשי' ? 'דף הבית' : t}</a>`).join('')}
      </nav>
      <nav class="ct-foot__col" aria-label="פרויקטים אחרונים">
        <p class="ct-foot__h">פרויקטים</p>
        ${S.projects.slice(0, 4).map(p => `<a href="${projUrl(p)}">${p.title}</a>`).join('')}<a href="projects.html">כל הפרויקטים</a>
      </nav>
      <div class="ct-foot__col">
        <p class="ct-foot__h">יצירת קשר</p>
        <a href="tel:${S.phoneIntl}" class="ct-foot__ph">${S.phone}</a>
        <a href="mailto:${S.email}">${S.email}</a>
        <a href="${S.whatsapp}" target="_blank" rel="noopener">וואטסאפ</a>
      </div>
    </div>
    <div class="ct-foot__bar">
      <p>© ${new Date().getFullYear()} חיה טאלר — אדריכלות ועיצוב פנים. כל הזכויות שמורות.</p>
      <p class="ct-foot__links"><a href="privacy.html">הצהרת פרטיות</a><a href="accessibility.html">הצהרת נגישות</a></p>
      <p class="ct-foot__credit">Made by Studio Saban</p>
      <button class="ct-foot__up" type="button" aria-label="חזרה לראש העמוד"><svg viewBox="0 0 16 40" aria-hidden="true"><path d="M8 40V2M1 9l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
    </div>
  </footer>
`;
}
const pageClose = () => `${footer()}
</main>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="assets/nav.js?v=${ASSET_V}"></script>
<script src="assets/site.js?v=${ASSET_V}"></script>
</body>
</html>
`;

// ---------- reusable sections from the design ----------
const body = between(design, '<main class="ct-page" id="ct-page">', '</main>')
  // "הבית שלכם ראוי לגימור הטוב ביותר": בלי כפתור "שיחה בוואטסאפ"
  .replace(/\s*<a class="ct-btn ct-btn--ghost"[^>]*>[\s\S]*?<\/a>/, '');
let CTA2 = between(body, '<!-- ===== CTA 2 ===== -->', '<!-- ===== FOOTER ===== -->')
  .replace('https://wa.me/972500000000', S.whatsapp)
  .replace('href="#contact" data-magnetic><span class="ct-btn__label">לתיאום', 'href="contact.html" data-magnetic><span class="ct-btn__label">לתיאום')
  .replace('class="ct-badge" href="#contact"', 'class="ct-badge" href="contact.html"');
const CONTACT = (opts = {}) => {
  let s = between(body, '<!-- ===== CONTACT / CTA ===== -->', '<!-- ===== MANIFESTO ===== -->');
  if (opts.title) s = s.replace(/<h2 class="ct-cta__title">[\s\S]*?<\/h2>/, `<h2 class="ct-cta__title">${opts.title}</h2>`);
  if (opts.business) s = s.replace('value="private" checked', 'value="private"').replace('value="business">', 'value="business" checked>');
  return s;
};
// גרסה לקבצי העיצוב והסקריפטים — משתנה בכל בנייה כדי שהדפדפן לא יציג גרסה ישנה מהמטמון
const ASSET_V = Date.now().toString(36);
const ph = ({ kicker, big, he, lead, crumbs, meta }) => `  <section class="ct-ph ct-wrap" id="top">
    ${crumbs ? `<p class="ct-crumbs">${crumbs}</p>` : ''}
    ${big ? `<div class="ct-ph__row"><h1 class="ct-ph__big ct-split" data-reveal="split">${big}</h1><p class="ct-tm__kicker" data-reveal="kicker">${kicker}</p></div>` : ''}
    ${he ? `<h1 class="ct-ph__he" data-reveal="fade">${he}</h1>` : ''}
    ${meta ? `<p class="ct-ph__meta">${meta}</p>` : ''}
    ${lead ? `<div class="ct-ph__lead ct-body" data-reveal="fade">${lead}</div>` : ''}
  </section>
`;
const stepsSection = (big, steps) => `  <section class="ct-steps">
    <h2 class="ct-steps__big ct-split" data-reveal="split">${big}</h2>
    <ol class="ct-steps__list">
${steps.map(([t, d], i) => `      <li class="ct-step" data-reveal="step" style="--i:${i}">
        <span class="ct-step__label" aria-hidden="true">STEP</span>
        <div class="ct-step__numclip" aria-hidden="true"><div class="ct-step__numwrap" data-px aria-hidden="true"><span class="ct-step__num${i % 2 ? ' ct-step__num--gray' : ''}" data-n="${pad(i + 1)}">${pad(i + 1)}</span></div></div>
        <div class="ct-step__text ct-body">
          <span class="ct-step__sep" aria-hidden="true"></span>
          <h3 class="ct-step__title"><span class="ct-vh">שלב ${i + 1}: </span>${t}</h3>
          <p>${d}</p>
        </div>
        <span class="ct-step__line" aria-hidden="true"></span>
      </li>`).join('\n')}
    </ol>
  </section>
`;
const postRow = (p, i) => `        <li class="ct-post">
          <a class="ct-post__link" href="${postUrl(p)}">
            <span class="ct-post__no">${pad(i + 1)}</span>
            <span class="ct-post__thumbwrap">${img(p.cover, '', ' class="ct-post__thumb"')}</span>
            <span class="ct-post__title">${p.title}</span>
            <span class="ct-post__cat">${p.categories.join(' · ')}<span class="ct-post__date">${fmtDate(p.date)}</span></span>
            <span class="ct-post__go"><span class="ct-vh">למאמר המלא</span>${ARROW_SM}</span>
          </a>
        </li>`;
const projCard = (p, i, opts = {}) => `<a class="ct-proj${opts.cls || ''}" href="${projUrl(p)}" data-type="${projType(p)}" data-view>
          <div class="ct-media ct-proj__img" data-reveal="media">
            <div class="ct-media__inner"${opts.parallax ? ` data-parallax="${opts.parallax}"` : ''}>${img(p.cover, p.title)}</div>
          </div>
          <div class="ct-proj__cap"><span class="ct-proj__no">${pad(i + 1)}</span><span class="ct-proj__name">${p.title}</span><span class="ct-proj__go" aria-hidden="true">VIEW PROJECT${ARROW_SM}</span>${opts.cat && p.categories.length ? `<span class="ct-proj__cat">${p.categories.join(' · ')}</span>` : ''}</div>
        </a>`;

// ---------- testimonials (design + existing site + project quotes) ----------
const T_DESIGN = [
  { q: ['מלבד העברה של תשלומים לא עשיתי כלום!', 'באת לפקח, לראות, להעיר, להאיר, לשפר, לתקן, לקבל, לעשות - ואני הרגשתי מפונקת לגמרי…'], who: 'בת שבע בורנשטיין' },
  { q: ['כולם הרחיבו ושיפצו, וטענו ללא יוצא מן הכלל ששלנו יצא כמה רמות מעל כולם', 'לסיכום ציפינו ל100% וקיבלנו <span class="hl">1000%</span>'], who: 'משפחת קצנלבוגן' },
  { q: ['חוויה עיצובית מכוכב אחר!', 'חיה נכנסה באופן מוחלט לנעליים שלנו,', 'הובילה אותנו בחן, בנתה בכשרון והביאה לתוצאה לא פחות ממדהימה!!!'], who: 'משפחת שורין' },
];
const T_SITE_SHORT = [
  { q: ['אני מרגישה שזה נס שפניתי אלייך'], who: "משפ' הסגל, בלבן" },
  { q: ['היה לך באמת אכפת מההצלחה המושלמת של הפרויקט שלי... עם חיוך גדול, סבלנות בלי סוף, נתינת הרגשה טובה בנעימות ועדינות'], who: "משפ' פריאנטי, נווה יעקב" },
  { q: ['עשתה הרבה מעבר לנדרש, הייתה זמינה, ונתנה טיפים נוספים לייעול הפרויקט'], who: "משפ' זולנזיק" },
];
const T_SITE_LONG = [
  { q: ['בכל פעם מחדש כשאני נכנסת למטבח אני מברכת אותך, ומודה לה\' על שהביא לי שליחה מוצלחת ונאמנה כל כך! המטבח יצא מעל ומעבר לכל ציפיה. מצאת פתרונות מושלמים לכל מוקש... במינימום עלות ומקסימום נוחות ועיצוב. עם ניצול מקסימלי של מקום, למרות מורכבות השטח. נוחות מירבית, משטחי שיש מרווחים, פינת אוכל מרווחת נוחה לשימוש. שפע מגירות מותאמות לכל צורך, המוווווווווון מקום לאחסון. והכל בעיצוב נעים לעין, ומותאם לטעמי האישי. פשוט- חוויה של מטבח! היעוץ היה נעים, מקצועי, מותאם לצרכי הלקוח עם זמינות וסבלנות לכל שאלה. אני מרגישה שזה נס שפניתי אלייך'], who: "משפ' הסגל, בלבן" },
  { q: ['לא רק שלמדת את המקצוע, אלא יש לך המון נסיון ואת מוכשרת מאד בתחום הזה והכישרון וההבנה המיוחדת ביופי ובעיצוב השפיעו על העצות הנבונות ועל התוצאה הסופית. לכל שאלה היתה לך תשובה ברורה שאח\'\'כ ראיתי כמה היא היתה גם מדויקת ונכונה. תכננת לי את גודל ומיקום הסלון והחדרים בצורה המושלמת ביותר! לא להאמין מה היתה הדירה לפני!!! כל מי שבא לראות מתפעל מהתכנון המיוחד של הבית. היה לך באמת אכפת מההצלחה המושלמת של הפרויקט שלי ולא מהרווח שלך עם חיוך גדול, סבלנות בלי סוף, נתינת הרגשה טובה בנעימות ועדינות, לא בהתנשאות.'], who: "משפ' פריאנטי, נווה יעקב" },
  { q: ['נהניתי מאוד מהמקצועיות של חיה, היא לא התפשרה על הרמה, עזרה מאוד לכוון ולייעץ חשיבה יצירתית ומחוץ לקופסא, עם ידע וכלים עיצוביים נרחבים. ההדמיה המושקעת שלה הייתה כלי מטורף שעזרה לנו לבחור ולדעת איך התוצר המוגמר ייראה- ואכן המציאות דומה מאוד להדמייה... עשתה הרבה מעבר לנדרש, הייתה זמינה, ונתנה טיפים נוספים והמלצות טובות על בעלי מקצוע וחנויות וליוותה את הפרויקט מתחילתו ועד סופו. גם המחיר היה הוגן לחלוטין ומתחשב. תענוג לעבוד אתה!'], who: "משפ' פריימן, בר יקר" },
];

// =========================================================
// 1. HOME — the design with real projects, posts, links and contact details
// =========================================================
function buildHome() {
  let b = body;
  // projects: 4 newest
  const [p1, p2, p3, p4] = S.projects;
  const projGrid = `<div class="ct-projs__grid">
      <div class="ct-projs__col ct-projs__col--a">
        ${projCard(p1, 0, { cls: ' ct-proj--1', parallax: '1' })}
        ${projCard(p3, 2, { cls: ' ct-proj--3', parallax: '1.3' })}
      </div>
      <div class="ct-projs__col ct-projs__col--b">
        ${projCard(p2, 1, { cls: ' ct-proj--2', parallax: '1.6' })}
        ${projCard(p4, 3, { cls: ' ct-proj--4', parallax: '1.2' })}
      </div>
    </div>
    <div class="ct-ctas ct-projs__ctas">${btn('לפרויקטים פרטיים', 'projects.html?type=private', 'ct-btn--solid')}${btn('לפרויקטים עסקיים', 'projects.html?type=business')}</div>`;
  b = b.replace(between(b, '<div class="ct-projs__grid">', '</section>'), projGrid + '\n  ');
  // testimonials slider: design cards + short quotes from the current site
  const cards = [...T_DESIGN, { q: ['היה לך באמת אכפת מההצלחה המושלמת של הפרויקט שלי, עם סבלנות בלי סוף והרגשה טובה.'], who: '' }, ...T_SITE_SHORT];
  const n = cards.length;
  const track = cards.map((c, i) => `<figure class="ct-tm-card" style="--i:${i}">
          <img class="ct-tm-card__img" src="images/hero-kitchen-2.jpg" alt="" aria-hidden="true" loading="lazy">
          <div class="ct-tm-card__shade" aria-hidden="true"></div>
          <svg class="ct-frame-line" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true"><rect x="0" y="0" width="100" height="100" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
          <span class="ct-tm-card__num" aria-hidden="true">${pad(i + 1)} / ${pad(n)}</span>
          <span class="ct-tm-card__mark" aria-hidden="true">&rdquo;</span>
          <blockquote class="ct-quote ct-body">${c.q.map(l => `<p>${l}</p>`).join('')}</blockquote>
          <span class="ct-tm-card__sep" aria-hidden="true"></span>
          ${c.who ? `<figcaption class="ct-tm-card__name ct-body">${c.who}</figcaption>` : ''}
        </figure>`).join('\n        ');
  const trackOpen = '<div class="ct-tm__track" data-lenis-prevent tabindex="0" aria-label="המלצות — אפשר לגלול לצדדים">';
  b = b.replace(between(b, trackOpen, '<div class="ct-tm__ctrl">'), `${trackOpen}\n        ${track}\n      </div>\n    </div>\n    `);
  b = b.replace('<span class="ct-tm__cur">01</span> / 04', `<span class="ct-tm__cur">01</span> / ${pad(n)}`);
  // כותרת שלב 5: ירידת שורה אחרי "ופיקוח"
  b = b.replace('נוכחות בשטח ופיקוח בהתאמה מלאה לתוכניות', 'נוכחות בשטח ופיקוח<br>בהתאמה מלאה לתוכניות');
  // חתימת חיה מתחת לפסקת המיצוב (THE TALER STANDARD)
  b = b.replace(/(<p class="ct-man__text"[\s\S]*?<\/p>)/, '$1\n    <img class="ct-man__sign" src="images/signature-chaya.png" alt="חתימה: חיה טאלר" width="526" height="176" loading="lazy">');
  // step buttons, all-testimonials, blog
  b = b.replace('href="#" data-magnetic><span class="ct-btn__label">לפרויקטים פרטיים', 'href="projects.html?type=private" data-magnetic><span class="ct-btn__label">לפרויקטים פרטיים');
  b = b.replace('href="#" data-magnetic><span class="ct-btn__label">לפרויקטים עסקיים', 'href="projects.html?type=business" data-magnetic><span class="ct-btn__label">לפרויקטים עסקיים');
  b = b.replace('href="#" data-magnetic><span class="ct-btn__label">לכל ההמלצות', 'href="testimonials.html" data-magnetic><span class="ct-btn__label">לכל ההמלצות');
  b = b.replace(between(b, '<ol class="ct-blog__list" data-reveal="fade">', '</ol>'), `<ol class="ct-blog__list" data-reveal="fade">\n${S.posts.slice(0, 3).map(postRow).join('\n')}\n    `);
  b = b.replace('href="#" data-magnetic><span class="ct-btn__label">לכל המאמרים', 'href="blog.html" data-magnetic><span class="ct-btn__label">לכל המאמרים');
  b = b.replace('https://wa.me/972500000000', S.whatsapp);
  // hero lead: line break after "נפגשים"
  b = b.replace('מהפנט נפגשים בתכנון', 'מהפנט נפגשים<br>בתכנון');
  // hero: six photos (images/hero), no slide counter, no scroll hint
  // [file, object-position in the mobile frame, object-position of the full-size photo (desktop: blur + sharp window share it so they stay aligned)]
  // מתחילים בתמונה רחבה — בחלון (צד ימין של התמונה) רואים את הנושא שלה. בתמונות לאורך החלון מראה רק רצועה.
  // מתוך התיקייה "תמונות למסך הפתיחה": ספה_1 (כמו בפיגמה), קיר כוח סלון 3, 3, קליניקה סופי, כתביה, מיטה copy
  const HERO = [
    ['hero-1.webp', '72% 55%', '50% 55%'], ['hero-2.jpg', '74% 50%', '50% 50%'], ['hero-3.webp', '55% 55%', '50% 50%'],
    ['hero-5.webp', '62% 50%', '50% 50%'], ['hero-6.jpg', '55% 50%', '50% 50%'],
  ];
  const slides = (layer) => HERO.map(([f, posFrame, posFull], i) => `<img class="ct-slide" src="images/hero/${f}" alt="${layer === 'sharp' && i === 0 ? 'עיצוב פנים של חיה טאלר' : ''}" style="object-position:${layer === 'frame' ? posFrame : posFull}"${i ? ' loading="lazy"' : ''}>`).join('\n      ');
  for (const layer of ['blur', 'sharp', 'frame'])
    b = b.replace(new RegExp(`(<div class="ct-slides ct-slides--${layer}" aria-hidden="true">)[\\s\\S]*?(</div>)`), `$1\n      ${slides(layer)}\n    $2`);
  b = b.replace(/\s*<div class="ct-counter"[\s\S]*?<\/span><span>03<\/span><\/div>/, '');
  b = b.replace(/\s*<div class="ct-scroll"[^>]*>[\s\S]*?<\/div>/, '');
  // the tagline flows under the lead text instead of sitting at a fixed spot (the 22px text is taller than the design's)
  b = b.replace(/(<div class="ct-hero__lead ct-body"[^>]*>[\s\S]*?)(\s*<\/div>)\s*<p class="ct-tagline ct-body"[^>]*>([^<]*)<\/p>/, '$1\n          <a class="ct-btn ct-hero__btn" href="projects.html" data-magnetic><span class="ct-btn__label">$3</span>' + ARROW + '</a>$2');
  b = b.replace(/\s*<!-- תמונה מתחת למשפט[\s\S]*?<div class="ct-man__pic"[\s\S]*?<\/div>/, ''); // design placeholder image that doesn't exist
  // "מוכנים להפוך את הבית..." — בלי טופס: טקסט וכפתור שמובילים לעמוד השאלון הנפרד (questionnaire.html)
  b = b.replace(between(b, '<!-- ===== CONTACT / CTA ===== -->', '<!-- ===== MANIFESTO ===== -->'), `<!-- ===== CONTACT / CTA ===== -->
  <section class="ct-cta ct-cta--cta" id="contact" aria-label="שאלון התאמה">
    <div class="ct-cta__box">
      <div class="ct-cta__floats" aria-hidden="true">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2026/02/מטבח-חכם-שפשוט-עובד-1-768x1152.jpg" alt="" loading="lazy" decoding="async" style="--x:10;--w:185;--h:240;--D:1580;--dur:52.67s;--delay:0.00s">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2025/03/7-768x512.jpg" alt="" loading="lazy" decoding="async" style="--x:10;--w:185;--h:150;--D:1580;--dur:52.67s;--delay:-17.56s">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2024/11/1מטבח-כפרי-1-768x432.jpg" alt="" loading="lazy" decoding="async" style="--x:10;--w:185;--h:120;--D:1580;--dur:52.67s;--delay:-35.11s">
        <img class="ct-cta__float ct-cta__float--b" src="https://taler-arc.com/wp-content/uploads/2025/12/מטבח-עגול-2-768x1152.jpg" alt="" loading="lazy" decoding="async" style="--x:210;--w:185;--h:240;--D:1087;--dur:40.26s;--delay:-20.13s">
        <img class="ct-cta__float ct-cta__float--b" src="https://taler-arc.com/wp-content/uploads/2024/07/סלון-1-768x512.webp" alt="" loading="lazy" decoding="async" style="--x:210;--w:185;--h:150;--D:1087;--dur:40.26s;--delay:0.00s">
        <img class="ct-cta__float ct-cta__float--b" src="https://taler-arc.com/wp-content/uploads/2023/08/חיה-טאלר_מטבח-מודרני-חם-768x966.webp" alt="" loading="lazy" decoding="async" style="--x:1251;--w:185;--h:240;--D:1087;--dur:33.97s;--delay:-8.49s">
        <img class="ct-cta__float ct-cta__float--b" src="https://taler-arc.com/wp-content/uploads/2023/05/חיה-טאלר_רמת-אשכול_סלון--768x512.webp" alt="" loading="lazy" decoding="async" style="--x:1251;--w:185;--h:150;--D:1087;--dur:33.97s;--delay:-25.48s">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2025/09/סלון-ספות_1-1-768x432.jpg" alt="" loading="lazy" decoding="async" style="--x:1451;--w:185;--h:120;--D:1520;--dur:52.41s;--delay:-36.69s">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2023/11/חיה-טאלר-מטבח-יוקרה-768x526.png" alt="" loading="lazy" decoding="async" style="--x:1451;--w:185;--h:150;--D:1520;--dur:52.41s;--delay:-1.75s">
        <img class="ct-cta__float ct-cta__float--a" src="https://taler-arc.com/wp-content/uploads/2023/05/חיה-טאלר_משה-סנה-21-768x512.webp" alt="" loading="lazy" decoding="async" style="--x:1451;--w:185;--h:150;--D:1520;--dur:52.41s;--delay:-19.22s">
      </div>
      <div class="ct-cta__content" data-reveal="fade">
        <h2 class="ct-cta__title">מוכנים להפוך את הבית<br>שלכם ליצירה עוצרת נשימה?</h2>
        <p class="ct-cta__p">מגיע לכם להנות מתוצאה מושלמת ומגימור ללא פשרות.<br>מלאו שאלון התאמה לקראת הבית עם הגימור הטוב ביותר שראיתם אי פעם!</p>
        <a class="ct-btn ct-btn--light ct-cta__btn" href="questionnaire.html"><span class="ct-btn__label">לחצו כאן לשאלון ההתאמה</span>${ARROW}</a>
      </div>
    </div>
  </section>

  `);
  // move CTA after projects: אזור "מוכנים להפוך את הבית..." מופיע מיד אחרי הפרויקטים (בקשת הלקוחה)
  { const cta = between(b, '<!-- ===== CONTACT / CTA ===== -->', '<!-- ===== MANIFESTO ===== -->');
    b = b.replace(cta, '').replace('<!-- ===== TESTIMONIALS ===== -->', cta + '<!-- ===== TESTIMONIALS ===== -->'); }
  // replace design footer with the shared one
  b = b.replace(b.slice(b.indexOf('<!-- ===== FOOTER ===== -->')), '');
  b = b.replace('<main class="ct-page" id="ct-page">', '');
  return head('חיה טאלר | אדריכלות ועיצוב פנים', 'חיה טאלר — תכנון ארכיטקטוני מדויק, עיצוב פנים ופיקוח בשטח. ' + S.subline, 'index.html')
    + '<main class="ct-page" id="ct-page">' + b + pageClose();
}

// =========================================================
// 2. PROJECTS archive
// =========================================================
function buildProjects() {
  return head('פרויקטים | חיה טאלר', 'פרויקטים נבחרים של חיה טאלר — אדריכלות ועיצוב פנים לבתים, מטבחים ומשרדים.', 'projects.html') + pageOpen()
    + ph({ kicker: 'פרויקטים נבחרים', big: 'SELECTED<br><span>PROJECTS</span>', lead: '<p>כל בית מתחיל ברשימת חלומות ואתגרים, ממשיך בתכנון עומק ומסתיים בבית שעובד בשבילכם כל יום. הנה חלק מהסיפורים.</p>' })
    + `  <section class="ct-wrap ct-sec">
      <div class="ct-filter" role="group" aria-label="סינון פרויקטים" data-filter>
        <button type="button" data-type="all" aria-pressed="true">כל הפרויקטים</button>
        <button type="button" data-type="private" aria-pressed="false">פרויקטים פרטיים</button>
        <button type="button" data-type="business" aria-pressed="false">פרויקטים עסקיים</button>
      </div>
      <div class="ct-pgrid">
        ${S.projects.map((p, i) => projCard(p, i, { cat: true })).join('\n        ')}
      </div>
  </section>
` + CTA2 + pageClose();
}

// =========================================================
// 3. PROJECT single (one file per project)
// =========================================================
function storyRows(blocks) {
  const rows = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i], n = blocks[i + 1];
    if (b.type === 'image' && n && n.type === 'html') { rows.push(`<div class="ct-row" data-reveal="fade"><figure class="ct-row__img">${img(b.src)}</figure><div class="ct-row__text ct-body">${n.html}</div></div>`); i++; }
    else if (b.type === 'image') rows.push(`<div class="ct-row ct-row--solo" data-reveal="fade"><figure class="ct-row__img">${img(b.src)}</figure></div>`);
    else rows.push(`<div class="ct-row ct-row--text" data-reveal="fade"><div class="ct-row__text ct-body">${b.html}</div></div>`);
  }
  return rows.join('\n      ');
}
function buildProject(p, i) {
  const prev = S.projects[(i - 1 + S.projects.length) % S.projects.length], next = S.projects[(i + 1) % S.projects.length];
  const blocks = p.blocks.filter(b => !(b.type === 'image' && b.src === p.cover));
  const desc = p.summary.join(' ').slice(0, 155);
  return head(`${p.title} | פרויקטים | חיה טאלר`, desc, 'projects.html') + pageOpen()
    + ph({ crumbs: `<a href="projects.html">פרויקטים</a> / ${p.categories.join(' · ') || 'פרויקט'}`, he: p.title })
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-sum">
      <div class="ct-sum__text ct-body" data-reveal="fade">${p.summary.map(l => `<p>${l}</p>`).join('')}</div>
      <figure class="ct-sum__cover">${img(p.cover, p.title, ' fetchpriority="high"').replace(' loading="lazy"', '')}</figure>
    </div>
    <div class="ct-story">
      ${storyRows(blocks)}
    </div>
    ${p.quote ? `<blockquote class="ct-quote-box${p.quote.length > 420 ? ' ct-quote-box--long' : ''}" data-reveal="fade"><span class="ct-tm-card__mark" aria-hidden="true">&rdquo;</span><p class="ct-quote-box__text">${p.quote.split('\n').map(esc).join('<br>')}</p><p class="ct-quote-box__by">מה הלקוחות אומרים</p></blockquote>` : ''}
    <nav class="ct-pnav" aria-label="פרויקטים נוספים">
      <a href="${projUrl(prev)}"><small>לפרויקט הקודם</small><strong>${prev.title}</strong></a>
      <a href="${projUrl(next)}"><small>לפרויקט הבא</small><strong>${next.title}</strong></a>
    </nav>
  </section>
` + CTA2 + pageClose();
}

// =========================================================
// 4. BLOG + posts
// =========================================================
function buildBlog() {
  return head('בלוג | חיה טאלר', 'מאמרים וטיפים על תכנון ועיצוב הבית, מטבחים, תאורה והדמיות — מאת חיה טאלר.', 'blog.html') + pageOpen()
    + ph({ kicker: 'ידע ששווה <span class="ct-blog__gold">זהב</span>', big: 'THE<br><span>JOURNAL</span>', lead: '<p>טיפים, תובנות וסיפורים מהשטח — כדי שהשיפוץ או הבנייה שלכם יתוכננו נכון מההתחלה.</p>' })
    + `  <section class="ct-blog ct-blog--page">
    <ol class="ct-blog__list" data-reveal="fade">
${S.posts.map(postRow).join('\n')}
    </ol>
  </section>
` + CTA2 + pageClose();
}
function articleHtml(blocks) {
  return blocks.map(b => b.type === 'image' ? `<figure>${img(b.src)}</figure>` : b.html).join('\n');
}
function buildPost(p) {
  const related = S.posts.filter(x => x.id !== p.id && x.categories.some(c => p.categories.includes(c))).slice(0, 3);
  const blocks = p.blocks.filter(b => !(b.type === 'image' && b.src === p.cover));
  return head(`${p.title} | בלוג | חיה טאלר`, p.excerpt, 'blog.html') + pageOpen()
    + ph({ crumbs: `<a href="blog.html">בלוג</a> / ${p.categories.join(' · ')}`, he: p.title, meta: `<span>${fmtDate(p.date)}</span><span>חיה טאלר</span>` })
    + `  <section class="ct-wrap ct-sec">
    ${p.cover ? `<figure class="ct-post-cover">${img(p.cover, p.title).replace(' loading="lazy"', '')}</figure>` : ''}
    <div class="ct-layout">
      <article class="ct-article ct-body">
${articleHtml(blocks)}
      </article>
      <aside class="ct-aside">
        <p class="ct-aside__h">LET'S TALK</p>
        <p class="ct-aside__t">רוצים בית שתוכנן נכון מההתחלה?</p>
        <p class="ct-body">${S.subline}. ספרו לי על הבית, ואחזור אליכם לתיאום פגישת היכרות.</p>
        ${btn('לתיאום פגישת היכרות', 'contact.html', 'ct-btn--solid')}
      </aside>
    </div>
  </section>
${related.length ? `  <section class="ct-blog">
    <div class="ct-tm__head ct-projs__head">
      <h2 class="ct-tm__big ct-split" data-reveal="split">MORE<br><span style="color:var(--gray)">READING</span></h2>
      <p class="ct-tm__kicker" data-reveal="kicker">מאמרים נוספים</p>
    </div>
    <ol class="ct-blog__list" data-reveal="fade">
${related.map(postRow).join('\n')}
    </ol>
  </section>
` : ''}` + pageClose();
}

// =========================================================
// 5. ABOUT
// =========================================================
function buildAbout() {
  return head('אודות | חיה טאלר', 'חיה טאלר — הנדסאית אדריכלות ומעצבת פנים. תכנון עומק, עיצוב אומנותי וליווי מקיף.', 'about.html') + pageOpen()
    + `  <section class="ct-ab" id="top">
    <div class="ct-ab__grid">
      <h1 class="ct-ab__title ct-ph__big">CHAYA<br><span>TALER</span></h1>
      <div class="ct-ab__colA">
        <figure class="ct-ab__img ct-ab__img--kitchen"><img src="images/proj-2.jpg" alt="מטבח בעיצוב חיה טאלר"></figure>
        <figure class="ct-ab__img ct-ab__img--green"><img src="images/wide-room.jpg" alt="סלון עם קיר ירוק בעיצוב חיה טאלר" loading="lazy"></figure>
      </div>
      <div class="ct-ab__colB">
        <figure class="ct-ab__img ct-ab__img--dining"><img src="images/hero/hero-2.jpg" alt="פינת אוכל וסלון בעיצוב חיה טאלר"></figure>
        <div class="ct-ab__text ct-ab__text--2 ct-body">
          <p><strong>נעים להכיר, אני חיה טאלר.</strong><br>כבר מעל עשור שאני מובילה פרויקטים של אדריכלות ועיצוב פנים ללקוחות שלא מוכנים להתפשר על פחות מהטוב ביותר. כציירת ויוצרת, כל פרויקט עבורי הוא חדש ובלעדי, לעולם לא תמצאו בפרויקטים שלי 2 בתים דומים. עוד לפני שאנחנו מדברים על צבעים או חומרים, חשוב לי להכיר אתכם: איך נראה היום שלכם, מה גורם לכם להרגיש בבית, ואיזו תחושה הייתם רוצים לחוות בכל פעם שאתם פותחים את הדלת.</p>
        </div>
      </div>
      <div class="ct-ab__colC">
        <div class="ct-ab__text ct-ab__text--1 ct-body">
          <p><strong>מכירים את הבית הזה?</strong><br>שכשנכנסים אליו, מרגישים מיד משהו אחר?<br>האור נופל בדיוק בזווית המושלמת וכל עלה בעציץ מונח מושלם כאילו מתוך יצירה. האווירה משדרת חדשנות לצד אמירה אישית משלכם. בית כזה הוא לא תוצאה של טרנד חולף אלא של חיבור נדיר בין אמנות, עכשוויות ועוצמה של הקשבה לאנשים שחיים בו.</p>
        </div>
      </div>
      <h2 class="ct-ab__vision ct-ph__big">THE<br><span>VISION</span></h2>
      <div class="ct-ab__text ct-ab__text--3 ct-body">
        <p><strong>החזון שלי:</strong><br>מעבר לבית מתוכנן טוב עד לפרטים הקטנים ומעוצב בסטנדרט בינלאומי. חשוב לי ברמה האישית שתעברו את תקופת הבניה כחוויה רגועה ומשמחת.<br>תהליך בנייה או שיפוץ לא חייבים להיות תקופה של מתח ובלבול. המטרה שלי היא להעניק לכם שקט נפשי, ביטחון וסדר.<br>התוצאה? בית אחר, מואר ופותח דלת לרגעים מלאי נחת ונשימה של אמנות. בית שמתאים בדיוק למי שאתם, לאורחים שלכם ולמה שאתם מתרגשים ממנו כל יום מחדש.</p>
      </div>
    </div>
  </section>
` + stepsSection('THE<br><span style="color:var(--gray)">METHOD</span>', [
      ['תכנון עומק', 'חלוקת השטח בצורה מנצלת ואיכותית, תוך שמירה על אסתטיקה ומרחב. בתהליך התכנון נבנה רשימת צרכים, חלומות ונתונים שתואמים בדיוק לחיים שלכם, עם חשיבה קדימה וראש גדול לטווח רחב.'],
      ['עיצוב אומנותי', 'נזהה את השפה העיצובית והמשיכה הטבעית לסגנון שלכם, ונלביש את החלל באלמנטים שיעשו לכם טוב לחזור הביתה: לוחות השראה, בחירת חומרים מותאמים מקרמיקה, תאורה ועד לדקורציה שעל מדף הכניסה.'],
      ['ליווי מקיף', 'סט תכניות מקיף לביצוע הקבלן: חשמל, בנייה, הריסה, אינסטלציה חכמה וגבס. חוזה שיחסוך לכם כסף מול הקבלן, בחירת אנשי המקצוע המתאימים לתקציב, וימי רכישות לבחירת חיפויים, כלים סניטריים, תאורה וריהוט.'],
    ])
    + CTA2 + pageClose();
}

// =========================================================
// 6. VISUALIZATIONS (הדמיות)
// =========================================================
function buildViz() {
  return head('הדמיות אדריכליות | חיה טאלר', 'הדמיות אדריכליות שמייצרות מציאות — ליזמים, לבתי כנסת ולאדריכלים. חיה טאלר, כ-10 שנים של הדמיות.', 'visualizations.html') + pageOpen()
    + ph({ kicker: 'הדמיות אדריכליות', big: 'THE<br><span>RENDERS</span>', lead: '<p><strong>יזם, רוצה קונים לפרויקט? איש ציבור, חייב תורמים לחזון שלך? אדריכלית, רוצה תיק עבודות שידבר ללקוחות?</strong></p><p>הכלי השיווקי החזק ביותר לשרותכם: הדמיות שמייצרות מציאות. חיה טאלר, אדריכלית ויוצרת הדמיות כ-10 שנים, עומדת בענווה מאחורי הדמיות שיצרו פרויקטים מצליחים יותר. כי הדמיה יוצרת אמון. ואמון יוצר עתיד.</p>' })
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-gal">
      ${S.viz.map(v => `<figure>${img(v.src, v.title, v.w ? ` width="${v.w}" height="${v.h}"` : '')}<figcaption>${v.title}</figcaption></figure>`).join('\n      ')}
    </div>
  </section>
  <section class="ct-wrap ct-sec">
    <div class="ct-tm__head">
      <h2 class="ct-tm__big ct-split" data-reveal="split">FROM THE<br><span style="color:var(--gray)">FIELD</span></h2>
      <p class="ct-tm__kicker" data-reveal="kicker">איך זה עובד בשטח</p>
    </div>
    <div class="ct-cases">
      <article class="ct-case ct-body" data-reveal="fade">
        <p class="ct-case__no">01</p>
        <h3 class="ct-case__t">הדמיה של הרחוב הזה שעשיתי לו 7 מבטים, והעסקה נחתמה</h3>
        <p>"אנחנו לקראת ועדה מחוזית, מוכרחים לקבל אור ירוק על התכנית. אם הועדה לא תתרשם מהחזון, עבודה של חודשים, ועתיד של מיליונים, יורדים לנו לטמיון. תוכלי לשבת עבורנו על סט הדמיות הכי טובות שיש?"</p>
        <p>לא יכלתי, אבל אני לא אומרת "לא" להובי ועצרתי את העולם לשלושה שבועות. יצרתי 7 מבטים שהבטיחו מציאות מרגשת. בדקת האפס, כשהתיישבו סביב השולחן, שלחתי את המבט האחרון. הועדה התרשמה מההדמיות ומהגשר המדויק ואישרה ברוחב לב.</p>
        <div class="ct-case__q"><b>מילה מהשטח</b>ההדמיות - במיוחד של הגשר - היו על המסך הרבה זמן ונראה שעזרו לעשות להם חשק לקבל את הגשר הזה ואולי אפילו להגדיל אותו.</div>
        <p class="ct-case__tip"><b>טיפ לקיצור דרך:</b> המוח מעבד מידע חזותי במהירות של פי 60,000 ממשך עיבוד מילה. אם ברצונכם לתפוס את הקשב, המנעו משרטוטים ומלל רב, והגישו תמונת הדמיה איכותית.</p>
      </article>
      <article class="ct-case ct-body" data-reveal="fade">
        <p class="ct-case__no">02</p>
        <h3 class="ct-case__t">הדמיות לבית כנסת</h3>
        <p>סט הדמיות לבית כנסת, הוא דבר שתמיד יעביר בי רטט. גם הסט הזה, נפחתי בו נשמה, וירדתי לפרטים הקטנים שייצרו את ההבדל. היזם קיבל את התמונות, וחווה רגע של עתיד, ושלח את ההדמיות לתורם.</p>
        <p>התורם- אדם ריאלי לחלוטין, שפשף עיניים, הוציא צ'ק וחתם על 50,000 ₪ לבנית ארון קודש. זהו. תמונה אחת שווה אלף שרטוטים.</p>
        <div class="ct-case__q"><b>מילה מהשטח</b>"לא תאמיני כמה ההדמיות שלך היו מוצלחות ופשוט קלעו בול לייעוד שלהם. הגבאים של בית הכנסת פנו לתורם והציגו לו את ההדמיות המקצועיות והיפות שלך. התורם התלהב מאד ובמקום תרם ארון קודש."</div>
        <p class="ct-case__tip"><b>טיפ לקיצור דרך:</b> התמונה מדלגת על מחסומי שפה והבדלי תרבות ומהדהדת זכרונות ותקוות. דייקו מטרה, ורק אחרי צרו תמונת הדמיה ממוקדת מטרה.</p>
      </article>
    </div>
  </section>
` + stepsSection('THE<br><span style="color:var(--gray)">PROCESS</span>', [
      ['חומרי הגלם', 'שלחתם שרטוט מעולה, תמונות השראה ופירוט חומרים. האדריכלית שבי מפענחת שרטוטים מורכבים בקלילות, ולכם יש ראש שקט ופנוי לדברים הגדולים.'],
      ['עבודת שטח', 'אני מתחילה לחקור את השטח הכללי עד הדקויות הקטנות: ניואנסים, מנטליות, וחזון. לפעמים בשקט קופצת לאתר להרגיש.'],
      ['כאן בונים', 'שרטוט עולה קומה והופך למידול תלת מימד ב-3dsmax. כאן מתגלות פעמים רבות סתירות קריטיות, והמידול מתברר כקופת חיסכון שמונעת מכם לשרוף זמן וכסף על טעויות שיתבררו בשטח.'],
      ['חומרים וגוונים', 'שלושה סבבי תיקונים של חומרים על פי לוח ההשראה שסגרנו. החומרים יוצאים אותנטיים, כאלה שמזמינים למשש.'],
      ['שפכטל וגימורים', 'הגיע הרגע להפיק ברזולציה גבוהה, עם עיבודים איכותיים ומראה תמונה אותנטי. ככה הפרויקט שלכם יראה!'],
      ['זה הבית', 'קיבלתם לידיים הדמיות יוקרתיות ואיכותיות, ואיתן משמעות וכוח לאישורים, להוצאות ולשאר האתגרים שבדרך. תכף התמונות יעברו ידיים, הלקוחות יתרשמו, והתורמים ירצו חלק.'],
    ])
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-tm__head">
      <h2 class="ct-tm__big ct-split" data-reveal="split">THE<br><span style="color:var(--gray)">FAQ</span></h2>
      <p class="ct-tm__kicker" data-reveal="kicker">שאלות ששואלים אותי</p>
    </div>
    <div class="ct-faq ct-body">
      <details><summary>איך תצליחי לכוון בדיוק לחלומות שלי?</summary><div><p>זה מאתגר, ופיתח בי שיטה מדורגת לבניית ההדמיה שלכם. היום אני יוצרת שלוש סקיצות לכל מבט, ועוקבת בזהירות אכפתית אחרי החלומות שלך, עד שנגיע לאישור הסופי.</p></div></details>
      <details><summary>האם את כאדריכלית וכמעצבת מתערבת בשיקולים?</summary><div><p>התשובה היא תלוי. אם אתם אוהבים לשתף אנשים ביצירה, הניסיון שלי יכול לתת לכם כוח רציני. לא פעם נתתי רעיונות חדשים מראיית המאקרו שלי, שהעלו את ערך הפרויקט באחוזים יפים. אוהבים ניהול בלעדי? אני כאן כדי לתת לכם הדמיות שיווקיות איכותיות.</p></div></details>
      <details><summary>אני אדריכלית ורוצה תיק עבודות. לחכות לתוצר ולצלם, או לפנות לממדלת?</summary><div><p>השאלה היא כמה אנרגיה וסבלנות יש לך, וכמה את רוצה תיק עבודות נחשק כבר עכשיו. יש לך סבלנות? חכי, אין כמו תמונות אותנטיות. אבל אם את צריכה עכשיו להגדיל מעגל לקוחות או תורמים, לכי על הדמיה שהכי קרובה לתמונה.</p></div></details>
      <details><summary>תכלס, מה צריך כדי להתניע?</summary><div><p>כמה שיותר מידע. יסודות טובים יוצרים בניין גדול. אנחנו סוגרים לוח השראה, חומרים וסגנון עיצובי, יורדים לעומק למטרת המידול, ו-קובץ אוטוקד או רוויט פתוח. משהו טוב מתחיל להיבנות!</p></div></details>
    </div>
  </section>
` + CONTACT({ title: 'השרטוט שלך חייב <span>הדמיות מקצועיות?</span>', business: true }) + pageClose();
}

// =========================================================
// 7. CONTACT
// =========================================================
function buildContact() {
  return head('יצירת קשר | חיה טאלר', `צרו קשר עם חיה טאלר — אדריכלות ועיצוב פנים. טלפון ${S.phone}, ${S.email}.`, 'contact.html') + pageOpen()
    + ph({ kicker: 'יצירת קשר', big: "LET'S<br><span>TALK</span>", lead: '<p>רוצה לדבר איתי על הפרויקט שלך? מזמינה אותך למלא את הטופס, להתקשר או לשלוח הודעה, ואחזור אליך בהקדם.</p>' })
    + `  <section class="ct-wrap">
    <div class="ct-contact-list" data-reveal="fade">
      <a href="tel:${S.phoneIntl}"><small>טלפון</small><strong>${S.phone}</strong></a>
      <a href="mailto:${S.email}"><small>אימייל</small><strong>${S.email}</strong></a>
      <a href="${S.whatsapp}" target="_blank" rel="noopener"><small>וואטסאפ</small><strong>שליחת הודעה</strong></a>
    </div>
  </section>
` + CONTACT() + pageClose();
}

// =========================================================
// 7b. לקוחות מספרים — ההמלצות המלאות (assets/testimonials.js)
// =========================================================
function storyHtml(text) {
  return text.trim().split(/\n\s*\n/).map(par => `<p>${par.split('\n').map(l => esc(l.trim())).join('<br>')}</p>`).join('');
}
function buildTestimonials() {
  const byId = new Map(ALL_PROJECTS.map(p => [p.id, p]));
  const items = TESTIMONIALS.map(t => {
    const proj = t.project ? byId.get(t.project) : null;
    const text = t.fromProject ? (proj && proj.quote) : t.text;
    if (!text) return '';
    const shown = proj && !HIDDEN_PROJECTS.has(proj.id); // לפרויקט מוסתר: ההמלצה נשארת, בלי קישור
    const projLink = shown ? `<a class="ct-story__proj" href="${projUrl(proj)}">לפרויקט: ${esc(proj.title)}</a>` : '';
    const who = t.name || (shown ? 'לקוחות הפרויקט' : '');
    return `      <article class="ct-story ct-body" data-reveal="fade" id="${t.id}">
        <span class="ct-tm-card__mark" aria-hidden="true">&rdquo;</span>
        <div class="ct-story__text">${storyHtml(text)}</div>
        ${who || projLink ? `<footer class="ct-story__by">${who ? `<strong>${esc(who)}</strong>` : ''}${projLink}</footer>` : ''}
      </article>`;
  }).filter(Boolean);
  return head('לקוחות מספרים | חיה טאלר', 'ההמלצות המלאות של לקוחות חיה טאלר — במילים שלהם, כמו שנכתבו.', 'testimonials.html') + pageOpen()
    + ph({ kicker: 'לקוחות מספרים', big: 'KIND<br><span>WORDS</span>', lead: '<p>ההמלצות המלאות, במילים של הלקוחות עצמם — כמו שנכתבו לחיה.</p>' })
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-stories">
${items.join('\n')}
    </div>
  </section>
` + CTA2 + pageClose();
}

// =========================================================
// 8. PRIVACY + ACCESSIBILITY (placeholders — the legal text must be supplied before launch)
// =========================================================
// עמוד השאלון / הטופס — זמני, יעוצב בהמשך יחד עם הלקוחה
function buildQuestionnaire() {
  return head('שאלון התאמה | חיה טאלר', 'שאלון ההתאמה של חיה טאלר — אדריכלות ועיצוב פנים. מלאו את הפרטים ונחזור אליכם.', 'questionnaire.html') + pageOpen()
    + ph({ he: 'שאלון התאמה' })
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-article ct-body">
      <p>כאן יופיע שאלון ההתאמה — העמוד בעיצוב.</p>
      <p>בינתיים אפשר לפנות אלינו: <a class="ct-home-link" href="tel:${S.phoneIntl}">${S.phone}</a> או <a class="ct-home-link" href="mailto:${S.email}">${S.email}</a>.</p>
    </div>
  </section>
` + pageClose();
}
function buildLegal(title, desc) {
  return head(`${title} | חיה טאלר`, desc, '') + pageOpen()
    + ph({ he: title })
    + `  <section class="ct-wrap ct-sec">
    <div class="ct-article ct-body">
      <p>הנוסח המלא של ${title} יתפרסם כאן בקרוב.</p>
      <p>לכל שאלה בנושא אפשר לפנות אלינו: <a class="ct-home-link" href="mailto:${S.email}">${S.email}</a> או בטלפון <a class="ct-home-link" href="tel:${S.phoneIntl}">${S.phone}</a>.</p>
    </div>
  </section>
` + pageClose();
}

// ---------- write ----------
const out = (f, html) => fs.writeFileSync(path.join(ROOT, f), html, 'utf8');
out('index.html', buildHome());
out('projects.html', buildProjects());
S.projects.forEach((p, i) => out(projUrl(p), buildProject(p, i)));
for (const id of HIDDEN_PROJECTS) { const f = path.join(ROOT, `project-${id}.html`); if (fs.existsSync(f)) fs.unlinkSync(f); }
out('blog.html', buildBlog());
S.posts.forEach(p => out(postUrl(p), buildPost(p)));
out('about.html', buildAbout());
if (SHOW_VIZ) out('visualizations.html', buildViz());
else if (fs.existsSync(path.join(ROOT, 'visualizations.html'))) fs.unlinkSync(path.join(ROOT, 'visualizations.html'));
out('contact.html', buildContact());
out('testimonials.html', buildTestimonials());
out('questionnaire.html', buildQuestionnaire());
out('privacy.html', buildLegal('הצהרת פרטיות', 'הצהרת הפרטיות של אתר חיה טאלר — אדריכלות ועיצוב פנים.'));
out('accessibility.html', buildLegal('הצהרת נגישות', 'הצהרת הנגישות של אתר חיה טאלר — אדריכלות ועיצוב פנים.'));
console.log('built', 7 + S.projects.length + S.posts.length, 'pages');
