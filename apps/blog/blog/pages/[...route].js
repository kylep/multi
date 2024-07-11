import SiteLayout from '../components/SiteLayout';
import IndexPage from '../components/IndexPage';
import BlogPostContentPage from '../components/BlogPostContentPage';
import { getMarkdownService, pageSize, paginate } from '../utils/MarkdownService';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { getGitService } from '../utils/GitService';


export async function getStaticPaths() {
	/* 
	NextJS function to determine the paths to be pre-rendered at build time...
	I had originally done this across lots of files but it wasn't very DRY.
	I didn't find a good way to have a common getStaticProps so I wound up loading 
	the same code to load sidebar content over and over again in different files.

	[...route] is a catch-all route that will match any path that hasn't been defined:
	Each path has a structure of { params: { route: ['<route>', '<route>'] } where
	the elements of route: [] are url segments that get delimited by /,
	for example:  ['abc', 'def'] -> /abc/def.html
	*/ 
 
	const paths = [];

	// Load all the markdown content so we can define the routes from it
	const markdownService = await getMarkdownService();
	const markdownFiles = markdownService.markdownFiles;
	
	// Index pages are paginated, I want a route for each like index1.html, index2.html, etc
	paths.push({ params: { route: ['index'] } }); // default index page
	const indexPageCount = Math.ceil(markdownFiles.length / pageSize); 
	const indexPagePaths = Array.from({ length: indexPageCount }, (_, i) => ({
	  params: { route: [`index${i + 1}`]},
	}));
	paths.push(...indexPagePaths);
	

	// Routes for each category, ex category/development.html
	const categories = Object.keys(markdownService.categories);
	const categoryPaths = categories.map(category => ({params: { route: ['category', (category.toLowerCase())] }}));
	paths.push(...categoryPaths);

	// Routes for each tag
	const tags = Object.keys(markdownService.tags);
	const tagPaths = tags.map(tag => ({ params: { route: ['tag', (tag.trim().toLowerCase())] } }));
	paths.push(...tagPaths);

	// Routes for each post
	const slugs = Object.keys(markdownService.markdownFilesBySlug);
	const postPaths = slugs.map(slug => ({ params: { route: [slug] } }));
	paths.push(...postPaths);

	return { paths, fallback: false };
}

export async function getStaticProps({params}) {
	/* Define the data that the pages will be pre-rendered with 
	   Pagination is only supported on index page for now.
	*/

	const markdownService = await getMarkdownService();
	let route = params.route;
	route[route.length - 1] = route[route.length - 1];
	const markdownFilesBeforePagination = markdownService.markdownFiles;
	const paginatedMarkdownFiles = paginate(markdownFilesBeforePagination, pageSize);
	let indexPageCount = Math.ceil(markdownFilesBeforePagination.length / pageSize); 
	let markdownFiles = [];
	let postContent = {};
	let pageNumber = 0; // varies by filtered size of markdownFiles
	if (route[0] == 'index') { // default index page, treat like index1
		markdownFiles = paginatedMarkdownFiles[0];
	} else if (route[0].startsWith('index')) { // index1.html, index2.html, etc
		pageNumber = parseInt(route[0].replace('index', ''));
		markdownFiles = paginatedMarkdownFiles[pageNumber - 1];
	} else if  (route[0] == 'category') { // category/<category>.html
		const category = route[1]; // [1] is the <category> in /category/<category>
		markdownFiles = markdownService.markdownFilesByCategory[category];
		indexPageCount = 1; // hack to hide pagination, temporary
	} else if (route[0] == 'tag') { // tag/<tag>.html
		const tag = route[1]; // [1] is the <tag> in /tag/<tag>
		markdownFiles = markdownService.markdownFilesByTag[tag];
		indexPageCount = 1; // hack to hide pagination, temporary
	} else { // /<slug>.html
		postContent = markdownService.markdownFilesBySlug[route[0]];
	}
	const gitService = await getGitService();
	return {
		props: {
			route: route,
			markdownFiles: markdownFiles,
			categories: markdownService.categories,
			tags: markdownService.tags,
			currentPageIndexNumber: pageNumber,
			pageCount: indexPageCount,
			postContent: postContent,
			lastGitCommitHash: gitService.hash,
			siteLastModified: gitService.date,
		},
	};
}

function BaseSiteComponent({ 
		route, 
		markdownFiles, 
		categories, 
		tags, 
		currentPageIndexNumber, 
		pageCount, 
		postContent,
		lastGitCommitHash,
		siteLastModified
	}) {
	/* 
		Decide which component to render based on the route.
		Each route has a different set of props that it needs to render.
	*/
	// "unefined" was a product of bad markdown processing
	//if (route == "undefined") { route = ['index']; }
	let pageContent = <></>;
	if (route[0].startsWith('index') || route[0] == 'category' || route[0] == 'tag' || route[0] == "/") {
		if (route == '/') {
			route = 'index';
		}
		pageContent = <IndexPage markdownFiles={markdownFiles} categories={categories} currentPageIndexNumber={currentPageIndexNumber} pageCount={pageCount} />;
	} else {
		pageContent =  <BlogPostContentPage contentHtml={postContent.contentHtml} metaData={postContent.metaData}/>;
	}
	return (
		<GlobalContextProvider globalData={{ 
			categories, 
			tags,
			lastGitCommitHash,
			siteLastModified
		}}>
			<SiteLayout>
				{pageContent}
			</SiteLayout>
		</GlobalContextProvider>
	);
}

export default BaseSiteComponent;

