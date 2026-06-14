import { ThemeToggle } from "./ThemeToggle";

// Site chrome — nav + title bar, tokenized (Terminal). Preserves the
// Playwright contracts: a <header>, data-testid="Nav-Toolbar", and links
// named Blog/Wiki/About plus a home link at href="/". Category/Tag browsing
// lives in the BrowseBar below the title, not here, to keep the nav lean.

const NAV = [
	{ href: "/index1.html", label: "Blog" },
	{ href: "/wiki.html", label: "Wiki" },
	{ href: "/about.html", label: "About" },
];

function NavLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			className="font-mono text-muted text-sm no-underline transition-colors hover:text-accent"
		>
			{label}
		</a>
	);
}

export function SiteHeader() {
	return (
		<header className="border-border border-b bg-surface">
			<nav
				data-testid="Nav-Toolbar"
				className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:gap-5 sm:px-6"
			>
				<a
					href="/"
					aria-label="Home"
					className="font-mono font-semibold text-accent no-underline"
				>
					kp<span className="text-subtle">~</span>
				</a>
				{NAV.map((n) => (
					<NavLink key={n.href} {...n} />
				))}
				<div className="ml-auto flex items-center gap-2 sm:gap-3">
					<ThemeToggle />
					<a
						href="/feed.xml"
						aria-label="RSS feed"
						className="hidden font-mono text-subtle text-xs no-underline transition-colors hover:text-accent sm:inline"
					>
						RSS
					</a>
				</div>
			</nav>
		</header>
	);
}

export interface SiteTitleProps {
	title?: string;
	tagline?: string;
}

export function SiteTitle({
	title = "Kyle Pericak",
	tagline = '"It works in my environment"',
}: SiteTitleProps) {
	return (
		<div className="border-border border-b bg-canvas">
			<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
				<h1 className="font-mono font-semibold text-4xl text-default">{title}</h1>
				<p className="mt-2 font-mono text-muted text-sm">{tagline}</p>
			</div>
		</div>
	);
}
