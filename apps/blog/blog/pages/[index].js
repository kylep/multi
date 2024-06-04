import SiteLayout from '../components/SiteLayout';
import BlogPostIndexSummary from '../components/BlogPostIndexSummary';
import { getMarkdownService } from '../utils/MarkdownService';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { Pagination } from '@mui/material';

const pageSize = 15;

export async function getStaticProps({params}) {
	const markdownService = getMarkdownService();
	const markdownFiles = markdownService.markdownFiles;
	// paginate so I dont load every post ever, every time
	// ... I mostly don't want to pay for serving all the thumbnails every time
	const radix = 10;
	const pageNumber = parseInt(params.index.replace('index', ''), radix);
	const start = (pageNumber - 1) * pageSize;
	const end = start + pageSize;
	const paginatedMarkdownFiles = markdownFiles.slice(start, end);
	return {
		props: {
			markdownFiles: paginatedMarkdownFiles,
			categories: markdownService.categories,
			currentPageIndexNumber: pageNumber,
			pageCount: Math.ceil(markdownFiles.length / pageSize),
		},
	};
}


export async function getStaticPaths() {
	const allMarkdownFiles = getMarkdownService().markdownFiles;
	const pageCount = Math.ceil(allMarkdownFiles.length / pageSize); 
	const paths = Array.from({ length: pageCount }, (_, i) => ({
	  params: { index: `index${i + 1}` },
	}));
	return { paths, fallback: false };
}

const handlePageChange = (_, page) => {
    window.location.href = `/index${page}.html`;
};

function IndexPage({ markdownFiles, categories, currentPageIndexNumber, pageCount }) {
	return (
		<GlobalContextProvider globalData={{ categories }}>
			<SiteLayout>
				{markdownFiles.map((file) => (
					<BlogPostIndexSummary key={file.metaData.slug} file={file.metaData} />
				))}
				<Pagination 
					page={currentPageIndexNumber} 
					count={pageCount} 
					shape="rounded"
					onChange={handlePageChange}
					sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
				/>
			</SiteLayout>
		</GlobalContextProvider>
	);
}

export default IndexPage;

