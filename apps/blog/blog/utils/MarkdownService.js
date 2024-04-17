import path from 'path';
import matter from 'gray-matter';
import html from 'remark-html';
import { remark } from 'remark';
import fs from 'fs';


// Singleton, only want to compute everything once in the build
class MarkdownService {
	constructor() {
	  if (!MarkdownService.instance) {
		this.markdownFiles = this.#loadMarkdownFiles();
		this.markdownFilesBySlug = this.#indexMarkdownFilesBySlug(this.markdownFiles);
		MarkdownService.instance = this;
	  }
	}

	static #serializeDates(obj){
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

	static getRenderedMarkdownAndProps(rawMarkdown){
		// contentHtml is the rendered markdown, metaData is the front matter as a flat object
		const { data: metaData, content: markdown } = matter(rawMarkdown);
		MarkdownService.#serializeDates(metaData); 
		const contentHtml = remark().use(html).process(markdown).toString();
		return {props: {contentHtml, metaData},};
	 };
  
	#loadMarkdownFiles() {
	  const markdownDirectory = path.join('markdown', 'posts');
	  // filters out .swp so vim doesn't break dev env
	  const files = fs.readdirSync(markdownDirectory).filter(filename => !filename.endsWith('.swp'));
	  const markdownFiles = files.map(filename => {
		const fullPath = path.join(markdownDirectory, filename);
		const rawMarkdown = fs.readFileSync(fullPath, 'utf8');
		const props = MarkdownService.getRenderedMarkdownAndProps(rawMarkdown);
		props.props.metaData.slug = filename.replace('.md', '');
		return props.props.metaData;
	  });
	  // sorting by date is mostly for the index page
	  markdownFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
	  return markdownFiles;
	}

	#indexMarkdownFilesBySlug(markdownFiles) {
		return markdownFiles.reduce((acc, file) => {
		  acc[file.slug] = file; // Use slug as key
		  return acc;
		}, {});
	}
  
	static getInstance() {
	  if (!MarkdownService.instance) {
		new MarkdownService();
	  }
	  return MarkdownService.instance;
	}
  }
  
  const instance = MarkdownService.getInstance();
  Object.freeze(instance);
  
  export default instance;