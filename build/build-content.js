// Builds new-site/assets/content.js (window.SITE) from the content inventory + live project pages (read-only).
// Usage: node build-content.js <inventoryDir> <outFile>
const fs = require('fs');
const [INV, OUT] = process.argv.slice(2);
const UA = { 'User-Agent': 'content-inventory-script' };
const read = (f) => JSON.parse(fs.readFileSync(`${INV}/data/${f}`, 'utf8'));

const decode = (s) => String(s || '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&rdquo;|&ldquo;/g, '"').replace(/&hellip;/g, '…').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
// origin URL, full size (the Vangus CDN serves placeholders for some files)
const fullUrl = (u) => decodeURI(u).replace('https://vangus-cdn.com/taler-arc.com/', 'https://taler-arc.com/').replace(/-\d+x\d+(?=\.\w+$)/, '').replace(/-scaled(?=\.\w+$)/, '-scaled');
const imgsIn = (html) => [...html.matchAll(/<img\b[^>]*>/gi)].map(m => (m[0].match(/\b(?:data-lazy-src|data-src|src)="([^"]+)"/i) || [])[1]).filter(s => s && /uploads/.test(s)).map(fullUrl);

// keep only simple semantic markup, no attributes
function sanitize(html) {
  let h = String(html || '').replace(/<[^>]*$/, '').replace(/<(script|style|noscript|svg|iframe|form)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  h = h.replace(/<img\b[^>]*>/gi, (t) => { const s = (t.match(/\b(?:data-lazy-src|data-src|src)="([^"]+)"/i) || [])[1]; return s && /uploads/.test(s) ? `\n[[IMG:${fullUrl(s)}]]\n` : ''; });
  h = h.replace(/<(\/?)(h[1-6])\b[^>]*>/gi, (_, c, t) => `<${c}${t.toLowerCase() === 'h1' ? 'h2' : t.toLowerCase()}>`);
  h = h.replace(/<(\/?)(p|ul|ol|li|strong|b|em|i|br|blockquote)\b[^>]*>/gi, (_, c, t) => `<${c}${t.toLowerCase() === 'b' ? 'strong' : t.toLowerCase() === 'i' ? 'em' : t.toLowerCase()}>`);
  h = h.replace(/<(?!\/?(h[2-6]|p|ul|ol|li|strong|em|br|blockquote)>)[^>]+>/gi, ' ');
  h = decode(h).replace(/[ \t ]+/g, ' ').replace(/<p>\s*<\/p>/g, '').replace(/\s*\n\s*/g, '\n').trim();
  return h;
}
// split sanitized html into ordered blocks of {type:'html'} and {type:'image'}
function toBlocks(html) {
  const out = [];
  for (const part of sanitize(html).split(/\n?\[\[IMG:([^\]]+)\]\]\n?/)) {
    if (!part) continue;
    if (/^https?:/.test(part)) out.push({ type: 'image', src: part });
    else if (part.replace(/<[^>]+>/g, '').trim()) out.push({ type: 'html', html: part.trim() });
  }
  return out;
}
const textOf = (html) => decode(String(html || '').replace(/<[^>]*$/, '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
const slugOf = (s) => decodeURIComponent(s);

(async () => {
  const media = read('media.json');
  const tax = read('taxonomies.json');
  const projectsRaw = read('projects.json');
  const postsRaw = read('posts.json');
  const mediaUrl = new Map(media.map(m => [m.id, fullUrl(m.url)]));

  // ---------- projects (JetEngine fields live only in the rendered single template) ----------
  const projects = [];
  for (const p of projectsRaw) {
    const html = await (await fetch(p.link, { headers: UA })).text();
    const s = html.indexOf('data-elementor-type="single');
    const e = html.indexOf('post-comments', s);
    const seg = html.slice(s, e > 0 ? e : undefined);
    const ws = [...seg.matchAll(/data-widget_type="([^"]+)"/g)];
    let summary = [], blocks = [], quote = null, inQuote = false;
    ws.forEach((m, i) => {
      const chunk = seg.slice(m.index, ws[i + 1] ? ws[i + 1].index : undefined);
      const type = m[1].split('.')[0];
      if (type === 'theme-post-title' || type === 'divider' || type === 'jet-listing-grid' || type === 'theme-post-featured-image') return;
      if (type === 'heading') {
        const t = textOf(chunk.slice(chunk.indexOf('>') + 1));
        if (!t.length) return;
        if (/ומה הלקוחות אומרים/.test(t.join(' '))) { inQuote = true; return; }
        if (inQuote) { quote = (quote ? quote + '\n' : '') + t.join('\n'); return; }
        if (!summary.length && !blocks.length) { summary = t; return; }
        blocks.push({ type: 'html', html: `<h3>${t.join(' ')}</h3>` });
        return;
      }
      // dynamic fields / text editors / images: keep order
      const body = chunk.slice(chunk.indexOf('>') + 1);
      for (const b of toBlocks(body)) blocks.push(b);
    });
    // merge consecutive html blocks
    blocks = blocks.reduce((a, b) => { const l = a[a.length - 1]; if (l && l.type === 'html' && b.type === 'html') l.html += '\n' + b.html; else a.push(b); return a; }, []);
    // drop duplicated cover image right at the start
    const cover = mediaUrl.get(p.featured_media) || (blocks.find(b => b.type === 'image') || {}).src || '';
    projects.push({
      id: p.id, slug: slugOf(p.slug), title: decode(p.title.rendered), date: p.date.slice(0, 10),
      categories: (p['cat-pro'] || []).map(id => decode((tax['cat-pro'].find(t => t.id === id) || {}).name)).filter(Boolean),
      cover, summary, blocks, quote: quote ? quote.replace(/\s+\n/g, '\n') : null,
      oldUrl: decodeURI(p.link),
    });
    process.stdout.write('.');
  }
  // newest first (WordPress order); keep the site's menu_order-ish order = date desc
  projects.sort((a, b) => b.date.localeCompare(a.date));

  // ---------- posts ----------
  const posts = postsRaw.map(p => {
    const blocks = toBlocks(p.content.rendered);
    const firstText = textOf((blocks.find(b => b.type === 'html') || {}).html || '').join(' ');
    return {
      id: p.id, slug: slugOf(p.slug), title: decode(p.title.rendered), date: p.date.slice(0, 10),
      categories: (p.categories || []).map(id => decode((tax.categories.find(t => t.id === id) || {}).name)).filter(Boolean),
      cover: mediaUrl.get(p.featured_media) || (blocks.find(b => b.type === 'image') || {}).src || '',
      excerpt: firstText.length > 170 ? firstText.slice(0, 168).replace(/\s+\S*$/, '') + '…' : firstText,
      blocks, oldUrl: decodeURI(p.link),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  // ---------- visualization gallery (titles listed on the old הדמיות page, matched to media) ----------
  const vizTitles = fs.readFileSync(`${INV}/pages/הדמיות.md`, 'utf8').split('\n').filter(l => /^(חיה טאלר|מבט יוקרה|chaya \()/.test(l.trim())).map(l => l.trim());
  const viz = vizTitles.map(t => { const m = media.find(x => x.title === t); return m ? { title: t.replace(/^חיה טאלר[_-]\s?/, '').replace(/_/g, ' · '), src: fullUrl(m.url), w: m.width, h: m.height } : null; }).filter(Boolean);

  const SITE = {
    name: 'חיה טאלר', tagline: 'אדריכלות שרואה אנשים',
    subline: 'תכנון עומק | עיצוב אומנותי | ליווי מקיף',
    phone: '052-763-2772', phoneIntl: '+972527632772', whatsapp: 'https://wa.me/972527632772', email: 'chaya2772@gmail.com',
    projects, posts, viz,
  };
  fs.writeFileSync(OUT, '/* נוצר אוטומטית מהאתר הקיים (taler-arc.com). אפשר לערוך ידנית. */\nwindow.SITE = ' + JSON.stringify(SITE, null, 1) + ';\n', 'utf8');
  console.log('\nprojects', projects.length, 'posts', posts.length, 'viz', viz.length, '/', vizTitles.length);
  for (const p of projects) console.log(' -', p.title, '| summary', p.summary.length, '| blocks', p.blocks.length, '| imgs', p.blocks.filter(b => b.type === 'image').length, '| quote', !!p.quote);
})().catch(e => { console.error(e); process.exit(1); });
