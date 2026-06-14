import Head from "next/head";
import { PostCard } from "@/components/PostCard";
import { Grid } from "@/components/primitives/grid";
import { Pagination } from "@/components/ui/pagination";

const SITE_URL = "https://kyle.pericak.com";
const SITE_DESCRIPTION =
	"Kyle Pericak's blog about infrastructure, DevOps, security, and software engineering.";

type Route = string[] | string;

function seg(route: Route): string[] {
	return Array.isArray(route) ? route : [route];
}

function getCanonicalUrl(route: Route): string {
	const r = seg(route);
	if (!r[0] || r[0] === "index" || r[0].startsWith("index")) return `${SITE_URL}/`;
	if (r[0] === "category") return `${SITE_URL}/category/${encodeURIComponent(r[1])}`;
	if (r[0] === "tag") return `${SITE_URL}/tag/${encodeURIComponent(r[1])}`;
	return `${SITE_URL}/${encodeURIComponent(r[0])}.html`;
}

function getPageTitle(route: Route): string {
	const r = seg(route);
	if (!r[0] || r[0].startsWith("index")) return "Kyle Pericak's Blog";
	if (r[0] === "category" || r[0] === "tag") return `${r[1]} - Kyle Pericak's Blog`;
	return "Kyle Pericak's Blog";
}

interface FileMeta {
	slug: string;
	title: string;
	date: string;
	modified?: string;
	summary: string;
	thumbnail?: string;
}

export interface IndexPageProps {
	markdownFiles: { metaData: FileMeta }[];
	currentPageIndexNumber?: number;
	pageCount: number;
	route: Route;
}

// Tokenized listing page (blog index / category / tag): a PostCard grid plus
// pagination. Used by [...route].js; the route wraps it in PageShell.
export function IndexPage({
	markdownFiles,
	currentPageIndexNumber,
	pageCount,
	route,
}: IndexPageProps) {
	const canonicalUrl = getCanonicalUrl(route);
	const pageTitle = getPageTitle(route);
	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<meta name="description" content={SITE_DESCRIPTION} />
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={SITE_DESCRIPTION} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:type" content="website" />
				<meta name="twitter:card" content="summary" />
			</Head>
			<Grid min={300} gap={6}>
				{markdownFiles.map((file) => {
					const m = file.metaData;
					return (
						<PostCard
							key={m.slug}
							title={m.title}
							href={`/${m.slug}.html`}
							created={m.date}
							modified={m.modified}
							excerpt={m.summary}
							thumbnail={m.thumbnail ? `/images/${m.thumbnail}` : undefined}
						/>
					);
				})}
			</Grid>
			{pageCount > 1 ? (
				<div className="mt-8">
					<Pagination
						currentPage={currentPageIndexNumber || 1}
						totalPages={pageCount}
						onPageChange={(p) => {
							window.location.href = `/index${p}.html`;
						}}
					/>
				</div>
			) : null}
		</>
	);
}

export default IndexPage;
