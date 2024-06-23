import path from 'path';
import matter from 'gray-matter';
import html from 'remark-html';
import { remark } from 'remark';
import fs from 'fs';

// used in markdownFilesByPage
export const pageSize = 15;

function paginate(array, pageSize) {
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
		this.markdownDirectory = path.join('markdown', 'posts');
		this.markdownFiles = this.#loadMarkdownFiles();
		// if this ever gets slow, can refactor to do it all in one pass
		this.markdownFilesBySlug = this.#indexMarkdownFilesBySlug(this.markdownFiles);
		this.categories = this.#getCountedCategories(this.markdownFiles);
		this.markdownFilesByCategory = this.#indexMarkdownFilesByCategory(this.markdownFiles);
		this.markdownFilesByPage = paginate(this.markdownFiles, pageSize);
		MarkdownService.instance = this;
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

	static getRenderedMarkdownAndProps(rawMarkdown){
		// contentHtml is the rendered markdown, metaData is the front matter as a flat object
		const { data: metaData, content: markdown } = matter(rawMarkdown);
		MarkdownService.#serializeDates(metaData); 
		const contentHtml = remark().use(html).process(markdown).toString();
		return {props: {contentHtml, metaData},};
	 };
  
	#loadMarkdownFiles() {
	  /*
	  {
		slug: 'my-first-post',
		title: 'My First Post',
		date: '2021-01-01',
		category: 'general',
		content: 'This is my first post',
	  }
	  */
	  // filters out .swp so vim doesn't break dev env
	  const files = fs.readdirSync(this.markdownDirectory).filter(filename => !filename.endsWith('.swp'));
	  const markdownFiles = files.map(filename => {
		const fullPath = path.join(this.markdownDirectory, filename);
		const rawMarkdown = fs.readFileSync(fullPath, 'utf8');
		const props = MarkdownService.getRenderedMarkdownAndProps(rawMarkdown);
		props.props.metaData.slug = filename.replace('.md', '');
		// TODO: I need to not return metadata here, and instead return the promise too that gives the content
		return {metaData: props.props.metaData, contentHtml: props.props.contentHtml};
	  });
	  // sorting by date is mostly for the index page
	  markdownFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
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

	#getCountedCategories(markdownFiles) {
		// return an object counting the posts per category, 
		// like { category1: 3, category2: 1}
		return markdownFiles.reduce((acc, file) => {
		  const category = file.metaData.category;
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
  
	static getInstance() {
	  if (!MarkdownService.instance) {
		new MarkdownService();
	  }
	  return MarkdownService.instance;
	}
  }
  
  export function getMarkdownService() {
	if (!MarkdownService.instance) {
	  new MarkdownService();
	}
	return MarkdownService.instance;
  }