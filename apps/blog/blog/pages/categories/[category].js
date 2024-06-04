import SiteLayout from '../../components/SiteLayout';
import BlogPostIndexSummary from '../../components/BlogPostIndexSummary';
import { getMarkdownService } from '../../utils/MarkdownService';
import { GlobalContextProvider } from '../../utils/GlobalContext';

export async function getStaticPaths() {
	const categories = Object.keys(getMarkdownService().categories);
	const paths = categories.map(category => ({ params: { category } }));
	return {paths, fallback: false,};
}

export async function getStaticProps({ params: { category } }) {
	const markdownService = getMarkdownService();
	const markdownFiles = markdownService.markdownFilesByCategory[category];
	console.log(markdownFiles);
	return {
		props: {
			markdownFiles: markdownFiles,
			categories: markdownService.categories,
		},
	};
}

function IndexPage({ markdownFiles, categories }) {
	console.log(markdownFiles);
	return (
		<GlobalContextProvider globalData={{ categories }}>
			<SiteLayout>
			{markdownFiles.map((file) => (
					<BlogPostIndexSummary key={file.slug} file={file} />
			))}
			</SiteLayout>
		</GlobalContextProvider>
	);
}

export default IndexPage;

