import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://kyle.pericak.com';
const postsDir = path.join(__dirname, '..', 'markdown', 'posts');
const outDir = path.join(__dirname, '..', 'out');

function getPosts() {
  const files = fs.readdirSync(postsDir).filter(f => {
    if (!f.endsWith('.md')) return false;
    // nosemgrep: path-join-resolve-traversal -- filename from readdirSync, not user input
    if (!fs.statSync(path.join(postsDir, f)).isFile()) return false;
    const content = fs.readFileSync(path.join(postsDir, f), 'utf8'); // nosemgrep: path-join-resolve-traversal
    return content.trimStart().startsWith('---');
  });

  return files.map(f => {
    const raw = fs.readFileSync(path.join(postsDir, f), 'utf8'); // nosemgrep: path-join-resolve-traversal
    const { data } = matter(raw);
    const slug = f.replace('.md', '');
    return { slug, ...data };
  }).filter(p => p.status !== 'draft');
}

function toISODate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Handle Date objects from gray-matter
  if (dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }
  return String(dateStr);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap() {
  const posts = getPosts();

  // Collect all categories and tags
  const categories = new Set();
  const tags = new Set();
  posts.forEach(p => {
    if (p.category) categories.add(p.category.toLowerCase());
    if (p.tags) {
      p.tags.split(',').forEach(t => {
        tags.add(t.trim().toLowerCase().replace(/\s+/g, '-'));
      });
    }
  });

  const urls = [];

  // Home page
  urls.push({ loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' });

  // About page
  urls.push({ loc: `${SITE_URL}/about.html`, changefreq: 'monthly', priority: '0.5' });

  // Index pages
  const pageSize = 15;
  const pageCount = Math.ceil(posts.length / pageSize);
  for (let i = 1; i <= pageCount; i++) {
    urls.push({ loc: `${SITE_URL}/index${i}.html`, changefreq: 'weekly', priority: '0.8' });
  }

  // Category pages
  for (const cat of categories) {
    urls.push({ loc: `${SITE_URL}/category/${encodeURIComponent(cat)}`, changefreq: 'weekly', priority: '0.6' });
  }

  // Tag pages
  for (const tag of tags) {
    urls.push({ loc: `${SITE_URL}/tag/${encodeURIComponent(tag)}`, changefreq: 'weekly', priority: '0.5' });
  }

  // Post pages
  posts.forEach(p => {
    urls.push({
      loc: `${SITE_URL}/${encodeURIComponent(p.slug)}.html`,
      lastmod: toISODate(p.modified || p.date),
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
  console.log(`Sitemap generated with ${urls.length} URLs at out/sitemap.xml`);
}

generateSitemap();
