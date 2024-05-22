import SiteLayout from '../components/SiteLayout';
import BlogPostIndexSummary from '../components/BlogPostIndexSummary';
import { getMarkdownService } from '../utils/MarkdownService';
import { GlobalContextProvider } from '../utils/GlobalContext';



export async function getStaticProps() {
	const markdownService = getMarkdownService();
	return { 
		props: { 
			markdownFiles: markdownService.markdownFiles, 
			categories: markdownService.categories,
		}, 
	};
}

function IndexPage({ markdownFiles, categories }) {
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

