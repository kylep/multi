import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import fs from 'fs';
import remarkHtml from 'remark-html'
// Table of Contents: Converts "### Table of Contents"
import remarkToc from 'remark-toc'; 
// GitHub Flavored Markdown: autolink literals, footnotes, strikethrough, tables, tasklists
import remarkGfm from 'remark-gfm'; 




const includeDrafts = false

// used in markdownFilesByPage
export const pageSize = 15;

export function paginate(array, pageSize) {
	return Array.from({ length: Math.ceil(array.length / pageSize) }, (_, i) =>
	  array.slice(i * pageSize, i * pageSize + pageSize)
	);
  }
  

// Singleton, only want to compute everything once in the build
class MarkdownService {
	constructor() {
		if (MarkdownService.instance) {
			return MarkdownService.instance;
		}
		// constuctor cant be async / can't await
		this.markdownFilesLoaded = false;
		this.init().then(() => {this.markdownFilesLoaded = true;}); 
		MarkdownService.instance = this;
	}

	async init(){
		this.markdownDirectory = path.join('markdown', 'posts');
		this.markdownFiles = await this.#loadMarkdownFiles();
		this.markdownFilesBySlug = this.#indexMarkdownFilesBySlug(this.markdownFiles);
		this.categories = await this.#getCountedCategories(this.markdownFiles);
		this.tags = await this.#getCountedTags(this.markdownFiles);
		this.markdownFilesByCategory = await this.#indexMarkdownFilesByCategory(this.markdownFiles);
		this.markdownFilesByTag = await this.#indexMarkdownFilesByTag(this.markdownFiles);
		this.markdownFilesByPage = paginate(this.markdownFiles, pageSize);
	}

	async waitForReady() {
		while (!this.markdownFilesLoaded) {
		  await new Promise(resolve => setTimeout(resolve, 100));
		}
	  }

	static #serializeDates(obj) {
		// matter turns dates into Date objects, want them as YYYY-MM-DD strings
		// todo fix - not a fan of how this pattern mutates props
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				// dates wrapped in quotes wont be instanceof Date
				if (obj[key] instanceof Date) {
					const year = obj[key].getFullYear();
					const month = String(obj[key].getMonth() + 1).padStart(2, '0');
					const day = String(obj[key].getDate()).padStart(2, '0');
					obj[key] = `${year}-${month}-${day}`;
				}
			}
		}
	};

	static async getRenderedMarkdownAndProps(rawMarkdown){
		// contentHtml is the rendered markdown, metaData is the front matter as a flat object
		const { data: metaData, content: markdown } = matter(rawMarkdown);
		MarkdownService.#serializeDates(metaData); 
		const result = await remark()
			.use(remarkGfm)
			.use(remarkToc, {heading: 'Table of contents'})
			.use(remarkHtml)
			.process(markdown);
		const contentHtml = result.toString();
		const props = {props: {contentHtml, metaData},};
		return props;
	 };
  
	async #loadMarkdownFiles() {
	  /*
	  {
		slug: 'my-first-post',
		title: 'My First Post',
		date: '2021-01-01',
		category: 'general',
		tags: foo, bar, baz
		content: 'This is my first post',
		status: draft | published
	  }
	  */
	  // filters out .swp so vim doesn't break dev env
	  const files = fs.readdirSync(this.markdownDirectory).filter(filename => !filename.endsWith('.swp'));
	  let markdownFiles = await Promise.all(files.map( async filename => {
		const fullPath = path.join(this.markdownDirectory, filename);
		const rawMarkdown = fs.readFileSync(fullPath, 'utf8');
		const props = await MarkdownService.getRenderedMarkdownAndProps(rawMarkdown);
		props.props.metaData.slug = filename.replace('.md', '');
		// TODO: I need to not return metadata here, and instead return the promise too that gives the content
		return {metaData: props.props.metaData, contentHtml: props.props.contentHtml};
	  }));
	  // remove drafts
	  if (!includeDrafts) {
		markdownFiles = markdownFiles.filter(file => file.metaData.status !== 'draft');
	  }
	  // sorting by date is mostly for the index page
	  markdownFiles.sort((a, b) => new Date(b.metaData.date) - new Date(a.metaData.date));
	  return markdownFiles;
	}

	#indexMarkdownFilesBySlug(markdownFiles) {
		return markdownFiles.reduce((acc, file) => {
		  acc[file.metaData.slug] = file; // Use slug as key
		  return acc;
		}, {});
	}

	#indexMarkdownFilesByCategory(markdownFiles) {
		return markdownFiles.reduce((acc, file) => {
		  const category = file.metaData.category;
		  if (category) {
			if (acc[category]) {
			  acc[category].push(file);
			} else {
			  acc[category] = [file];
			}
		  }
		  return acc;
		}, {});
	}

	#indexMarkdownFilesByTag(markdownFiles) {
		// get the tags from front matter, trim the white spaces from them
		return markdownFiles.reduce((acc, file) => {
		  const tags = file.metaData.tags;
		  if (tags) {
			tags.split(',').forEach(rawTag => {
			  const tag = rawTag.trim().toLowerCase();
			  if (acc[tag]) {
				acc[tag].push(file);
			  } else {
				acc[tag] = [file];
			  }
			});
		  }
		  return acc;
		}, {});
	}
	  

	#getCountedCategories(markdownFiles) {
		// return an object counting the posts per category, 
		// like { category1: 3, category2: 1}
		return markdownFiles.reduce((acc, file) => {
		  const category = file.metaData.category.toLowerCase();
		  if (category) {
			if (acc[category]) {
			  acc[category] += 1;
			} else {
			  acc[category] = 1;
			}
		  }
		  return acc;
		}, {});
	}

	#getCountedTags(markdownFiles) {
		// return an object counting the posts per tag, 
		// like { tag1: 3, tag2: 1}
		return markdownFiles.reduce((acc, file) => {
		  const tags = file.metaData.tags;
		  if (tags) {
			tags.split(',').forEach(rawTag => {
			  const tag = rawTag.trim().toLowerCase();
			  if (acc[tag]) {
				acc[tag] += 1;
			  } else {
				acc[tag] = 1;
			  }
			});
		  } else {
			return [];
		  }
		  return acc;
		}, {});
	}
  }
  
  export async function getMarkdownService() {
	if (!MarkdownService.instance) {
	  new MarkdownService();
	}
	await MarkdownService.instance.waitForReady(); // Wait for all the markdown files to load...
	return MarkdownService.instance;
  }