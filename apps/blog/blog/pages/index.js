import Head from 'next/head';
import { PageShell } from '../components/PageShell';
import { PostCard } from '../components/PostCard';
import { Pagination } from '../components/ui/pagination';
import { Grid } from '../components/primitives/grid';
import { getMarkdownService, pageSize, paginate } from '../utils/MarkdownService';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { getGitService } from '../utils/GitService';

const SITE_URL = 'https://kyle.pericak.com';
const SITE_DESCRIPTION =
	"Kyle Pericak's blog about infrastructure, DevOps, security, and software engineering.";

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

export default function Home({
	markdownFiles,
	categories,
	tags,
	pageCount,
	lastGitCommitHash,
	siteLastModified,
}) {
	return (
		<GlobalContextProvider
			globalData={{ categories, tags, lastGitCommitHash, siteLastModified }}
		>
			<Head>
				<title>Kyle Pericak&apos;s Blog</title>
				<meta name="description" content={SITE_DESCRIPTION} />
				<link rel="canonical" href={`${SITE_URL}/`} />
				<meta property="og:title" content="Kyle Pericak's Blog" />
				<meta property="og:description" content={SITE_DESCRIPTION} />
				<meta property="og:url" content={`${SITE_URL}/`} />
				<meta property="og:type" content="website" />
				<meta name="twitter:card" content="summary" />
			</Head>
			<PageShell lastModified={siteLastModified} commitHash={lastGitCommitHash}>
				<Grid min={300} gap={6}>
					{markdownFiles.map((file) => {
						const m = file.metaData;
						return (
							<PostCard
								key={m.slug}
								title={m.title}
								href={`/${m.slug}.html`}
								date={`Created: ${m.date}${m.modified ? `, Modified: ${m.modified}` : ''}`}
								excerpt={m.summary}
								thumbnail={m.thumbnail ? `/images/${m.thumbnail}` : undefined}
							/>
						);
					})}
				</Grid>
				{pageCount > 1 && (
					<div className="mt-8">
						<Pagination
							currentPage={1}
							totalPages={pageCount}
							onPageChange={(p) => {
								window.location.href = `/index${p}.html`;
							}}
						/>
					</div>
				)}
			</PageShell>
		</GlobalContextProvider>
	);
}
