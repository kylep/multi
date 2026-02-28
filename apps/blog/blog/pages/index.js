import SiteLayout from '../components/SiteLayout';
import IndexPage from '../components/IndexPage';
import { getMarkdownService, pageSize, paginate } from '../utils/MarkdownService';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { getGitService } from '../utils/GitService';

export async function getStaticProps() {
	const markdownService = await getMarkdownService();
	const allFiles = markdownService.markdownFiles;
	const paginated = paginate(allFiles, pageSize);
	const pageCount = Math.ceil(allFiles.length / pageSize);
	const gitService = await getGitService();
	return {
		props: {
			markdownFiles: paginated[0],
			categories: markdownService.categories,
			tags: markdownService.tags,
			pageCount,
			lastGitCommitHash: gitService.hash,
			siteLastModified: gitService.date,
		},
	};
}

export default function Home({ markdownFiles, categories, tags, pageCount, lastGitCommitHash, siteLastModified }) {
	return (
		<GlobalContextProvider globalData={{ categories, tags, lastGitCommitHash, siteLastModified }}>
			<SiteLayout>
				<IndexPage
					markdownFiles={markdownFiles}
					categories={categories}
					currentPageIndexNumber={1}
					pageCount={pageCount}
				/>
			</SiteLayout>
		</GlobalContextProvider>
	);
}
