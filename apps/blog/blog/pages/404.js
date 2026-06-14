import Head from 'next/head';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { GlobalContextProvider } from '../utils/GlobalContext';
import { getMarkdownService } from '../utils/MarkdownService';
import { getGitService } from '../utils/GitService';

export async function getStaticProps() {
	const markdownService = await getMarkdownService();
	const gitService = await getGitService();
	return {
		props: {
			categories: markdownService.categories,
			tags: markdownService.tags,
			lastGitCommitHash: gitService.hash,
			siteLastModified: gitService.date,
		},
	};
}

export default function NotFound({
	categories,
	tags,
	lastGitCommitHash,
	siteLastModified,
}) {
	return (
		<GlobalContextProvider
			globalData={{ categories, tags, lastGitCommitHash, siteLastModified }}
		>
			<Head>
				<title>404 — Page Not Found</title>
				<meta name="robots" content="noindex" />
			</Head>
			<PageShell lastModified={siteLastModified} commitHash={lastGitCommitHash}>
				<div className="py-16 text-center sm:py-24">
					<p className="font-mono text-accent text-sm tracking-wide">404</p>
					<h2 className="mt-3 font-mono font-semibold text-3xl text-default">
						Page not found
					</h2>
					<p className="mx-auto mt-3 max-w-md text-muted">
						That page doesn&apos;t exist — it may have moved, or never did. Try the
						blog or the wiki.
					</p>
					<div className="mt-8 flex justify-center gap-3">
						<Button asChild variant="primary">
							<a href="/">← Home</a>
						</Button>
						<Button asChild variant="secondary">
							<a href="/wiki.html">Wiki</a>
						</Button>
					</div>
				</div>
			</PageShell>
		</GlobalContextProvider>
	);
}
