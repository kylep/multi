import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://kyle.pericak.com';
const FEED_TITLE = 'Kyle Pericak';
const FEED_DESCRIPTION = "Kyle Pericak's Blog";
const MAX_ITEMS = 50;

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
    const fileSlug = f.replace('.md', '');
    const frontmatterSlug = data.slug;
    return { ...data, slug: fileSlug, frontmatterSlug };
  }).filter(p => p.status !== 'draft' && p.title && p.date);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRFC822(date) {
  if (!date) return new Date().toUTCString();
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date encountered: ${date}, using current date`);
    return new Date().toUTCString();
  }
  return parsed.toUTCString();
}

function generateRss() {
  const posts = getPosts();

  // Sort by date descending (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const items = posts.slice(0, MAX_ITEMS);
  const lastBuildDate = items.length > 0 ? toRFC822(items[0].date) : toRFC822();

  const itemsXml = items.map(p => {
    const link = `${SITE_URL}/${encodeURIComponent(p.slug)}.html`;
    const categoryXml = p.category
      ? `\n      <category>${escapeXml(p.category)}</category>`
      : '';

    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(p.summary || '')}</description>
      <pubDate>${toRFC822(p.date)}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>${categoryXml}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'feed.xml'), xml);
  console.log(`RSS feed generated with ${items.length} items at out/feed.xml`);
}

generateRss();
