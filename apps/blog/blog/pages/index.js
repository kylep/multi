import SiteLayout from '../components/SiteLayout';
import BlogPostIndexSummary from '../components/BlogPostIndexSummary';
import markdownService from '../utils/MarkdownService';


export async function getStaticProps() {
	const markdownFiles = markdownService.markdownFiles;
	return { props: { markdownFiles }, };
}

function IndexPage({ markdownFiles }) {
	return (
		<SiteLayout>
			{markdownFiles.map((file) => (
				<BlogPostIndexSummary key={file.slug} file={file} />
			))}
		</SiteLayout>
	);
}

export default IndexPage;

