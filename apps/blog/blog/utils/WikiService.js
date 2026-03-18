import path from 'node:path';
import fs from 'node:fs';
import { MarkdownService } from './MarkdownService.js';

const wikiDirectory = path.join('markdown', 'wiki');

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

class WikiService {
	constructor() {
		if (WikiService.instance) {
			return WikiService.instance;
		}
		this.readyPromise = this.init().catch((error) => {
			WikiService.instance = null;
			throw error;
		});
		WikiService.instance = this;
	}

	async init() {
		this.tree = await this.#buildTree(wikiDirectory, []);
		this.wikiPagesBySlug = {};
		this.#indexPages(this.tree);
	}

	async waitForReady() {
		await this.readyPromise;
	}

	// Recursively build the wiki tree from the filesystem
	async #buildTree(dirPath, breadcrumbs) {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		const node = { slug: '', title: '', summary: '', contentHtml: '', metaData: {}, children: [], breadcrumbs: [] };

		// Process index.md for this directory
		const indexPath = path.join(dirPath, 'index.md');
		if (fs.existsSync(indexPath)) {
			const raw = fs.readFileSync(indexPath, 'utf8');
			const { props } = await MarkdownService.getRenderedMarkdownAndProps(raw);
			if (props.metaData.hidden) return node; // hidden pages are excluded from the site
			const slugParts = path.relative('markdown', dirPath).split(path.sep);
			node.slug = slugParts.join('/');
			node.title = props.metaData.title || slugParts[slugParts.length - 1];
			node.summary = props.metaData.summary || '';
			node.contentHtml = props.contentHtml;
			node.metaData = props.metaData;
			node.breadcrumbs = [...breadcrumbs, { title: node.title, slug: node.slug }];
		}

		// Process child directories (sections)
		const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
		for (const dir of dirs) {
			const childPath = path.join(dirPath, dir.name);
			const childNode = await this.#buildTree(childPath, node.breadcrumbs);
			if (childNode.slug) {
				node.children.push(childNode);
			}
		}

		// Process child .md files (leaves, excluding index.md)
		const files = entries
			.filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md')
			.sort((a, b) => a.name.localeCompare(b.name));
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			const raw = fs.readFileSync(filePath, 'utf8');
			if (!raw.trimStart().startsWith('---')) continue;
			const { props } = await MarkdownService.getRenderedMarkdownAndProps(raw);
			if (props.metaData.hidden) continue; // hidden pages are excluded from the site
			const slugParts = path.relative('markdown', filePath).replace('.md', '').split(path.sep);
			const leafSlug = slugParts.join('/');
			const leafTitle = props.metaData.title || file.name.replace('.md', '');
			const leaf = {
				slug: leafSlug,
				title: leafTitle,
				summary: props.metaData.summary || '',
				contentHtml: props.contentHtml,
				metaData: props.metaData,
				children: [],
				breadcrumbs: [...node.breadcrumbs, { title: leafTitle, slug: leafSlug }],
			};
			node.children.push(leaf);
		}

		return node;
	}

	// Flatten tree into slug -> page lookup, and generate subtree HTML for index pages
	#indexPages(node) {
		if (!node.slug) return;
		// Generate subtree HTML for pages that have children
		if (node.children.length > 0) {
			node.childTreeHtml = this.#buildTreeHtml(node.children);
		}
		// Serialize for Next.js static props (no circular refs, plain objects)
		this.wikiPagesBySlug[node.slug] = {
			slug: node.slug,
			title: node.title,
			summary: node.summary,
			contentHtml: node.contentHtml,
			metaData: node.metaData,
			breadcrumbs: node.breadcrumbs,
			childTreeHtml: node.childTreeHtml || '',
			children: node.children.map(c => ({
				slug: c.slug,
				title: c.title,
				summary: c.summary,
			})),
		};
		for (const child of node.children) {
			this.#indexPages(child);
		}
	}

	#buildTreeHtml(children) {
		const lines = [];
		this.#collectTreeLines(children, '', lines);
		const items = lines.map(({ prefix, link }) =>
			`<li><span class="tree-prefix">${prefix}</span>${link}</li>`
		).join('\n');
		return `<ul>${items}</ul>`;
	}

	#collectTreeLines(children, indent, lines) {
		children.forEach((child, i) => {
			const isLast = i === children.length - 1;
			const connector = isLast ? '└── ' : '├── ';
			const link = `<a href="/${encodeURI(child.slug)}.html">${escapeHtml(child.title)}</a>`;
			lines.push({ prefix: indent + connector, link });
			if (child.children.length > 0) {
				const childIndent = indent + (isLast ? '    ' : '│   ');
				this.#collectTreeLines(child.children, childIndent, lines);
			}
		});
	}
}

let devWatcher = null;

export async function getWikiService() {
	if (!WikiService.instance) {
		new WikiService();
		if (process.env.NODE_ENV === 'development' && !devWatcher) {
			devWatcher = fs.watch(wikiDirectory, { persistent: false, recursive: true }, () => {
				WikiService.instance = null;
			});
		}
	}
	await WikiService.instance.waitForReady();
	return WikiService.instance;
}
