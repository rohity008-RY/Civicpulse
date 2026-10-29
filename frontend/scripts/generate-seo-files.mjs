import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_LANGUAGES, SEO_PAGES, SITE_URL, getAlternates, getLocalizedUrl } from '../src/utils/seoContent.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = SEO_LANGUAGES.flatMap((language) => SEO_PAGES.map((page) => {
    const alternates = getAlternates(page.path)
      .map((alternate) => `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}" />`)
      .join('\n');

    return `  <url>
    <loc>${xmlEscape(getLocalizedUrl(page.path, language.code))}</loc>
${alternates}
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || '0.7'}</priority>
  </url>`;
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Disallow: /rep$
Disallow: /rep/
Disallow: /rep?
Disallow: /reset-password

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function buildManifest() {
  return JSON.stringify({
    name: 'CivicsPulse',
    short_name: 'CivicsPulse',
    description: 'Mumbai civic reporting, public issue tracking, and ward representative mapping.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, 'sitemap.xml'), buildSitemap());
await writeFile(join(publicDir, 'robots.txt'), buildRobots());
await writeFile(join(publicDir, 'site.webmanifest'), `${buildManifest()}\n`);

console.log(`Generated SEO files for ${SEO_PAGES.length} routes across ${SEO_LANGUAGES.length} languages.`);
