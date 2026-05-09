// Injects WebSite + Person JSON-LD into the static home page after `next export`.
//
// Done as a post-build string transform rather than via the React tree because
// React would HTML-escape JSON content inside <script> children, breaking
// JSON-LD parsers. Pure HTML insertion avoids that.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://kyle.pericak.com';
const SITE_DESCRIPTION =
  "Kyle Pericak's blog about infrastructure, DevOps, security, and software engineering.";

const SAME_AS = [
  'https://github.com/kylep/',
  'https://ca.linkedin.com/in/kpericak',
  'https://twitter.com/kylepericak',
  'https://www.reddit.com/user/kepper/',
];

const personId = `${SITE_URL}/#kyle-pericak`;

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Kyle Pericak's Blog",
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    author: { '@id': personId },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: 'Kyle Pericak',
    url: `${SITE_URL}/`,
    sameAs: SAME_AS,
  },
];

const MARKER = 'data-blog-home-jsonld';

const scriptTag = `<script type="application/ld+json" ${MARKER}>${JSON.stringify(jsonLd)}</script>`;

function inject(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(MARKER)) {
    console.log(`Already injected: ${filePath}`);
    return;
  }
  const headCloseIdx = html.indexOf('</head>');
  if (headCloseIdx === -1) {
    console.error(`No </head> found in ${filePath}`);
    process.exitCode = 1;
    return;
  }
  const out = html.slice(0, headCloseIdx) + scriptTag + html.slice(headCloseIdx);
  fs.writeFileSync(filePath, out);
  console.log(`Injected JSON-LD into ${path.basename(filePath)}`);
}

const outDir = path.join(__dirname, '..', 'out');
inject(path.join(outDir, 'index.html'));
inject(path.join(outDir, 'index1.html'));
