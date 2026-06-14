import { useContext, useEffect, useRef, useState } from "react";
import { GlobalContext } from "@/utils/GlobalContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

// Site chrome — nav + title bar, tokenized (Terminal). Preserves the
// Playwright contracts: a <header>, data-testid="Nav-Toolbar", and links
// named Blog/Wiki/About plus a home link at href="/".

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

interface DropItem {
	href: string;
	label: string;
}

// Categories / Tags dropdown — replaces the old sidebar's browse lists. Full
// label on desktop ("Categories"), compact ("[C]") on mobile.
function NavDropdown({
	label,
	short,
	items,
}: {
	label: string;
	short: string;
	items: DropItem[];
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onDocClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		function onEsc(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onEsc);
		};
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				aria-haspopup="true"
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
				className="font-mono text-muted text-sm transition-colors hover:text-accent"
			>
				<span className="hidden sm:inline">{label}</span>
				<span className="sm:hidden">{short}</span>
				<span aria-hidden> ▾</span>
			</button>
			{open ? (
				<div className="absolute left-0 top-full z-20 mt-2 max-h-80 w-56 overflow-auto rounded-md border border-border bg-surface p-2 shadow-lg">
					{items.length === 0 ? (
						<p className="px-2 py-1 font-mono text-subtle text-xs">none</p>
					) : (
						items.map((it) => (
							<a
								key={it.href}
								href={it.href}
								className="block rounded px-2 py-1 font-mono text-muted text-sm no-underline transition-colors hover:bg-raised hover:text-accent"
							>
								{it.label}
							</a>
						))
					)}
				</div>
			) : null}
		</div>
	);
}

export function SiteHeader() {
	const ctx = useContext(GlobalContext) as
		| { data?: { categories?: Record<string, number>; tags?: Record<string, number> } }
		| undefined;
	const data = ctx?.data ?? {};

	const categories: DropItem[] = Object.entries(data.categories ?? {})
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([cat, count]) => ({
			href: `/category/${cat.toLowerCase()}.html`,
			label: `${cat} (${count})`,
		}));

	const tags: DropItem[] = Object.entries(data.tags ?? {})
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([tag, count]) => ({
			href: `/tag/${tag.trim().toLowerCase()}.html`,
			label: `${tag} (${count})`,
		}));

	return (
		<header className="border-border border-b bg-surface">
			<nav
				data-testid="Nav-Toolbar"
				className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6"
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
				<NavDropdown label="Categories" short="[C]" items={categories} />
				<NavDropdown label="Tags" short="[T]" items={tags} />
				<div className={cn("ml-auto flex items-center gap-2 sm:gap-3")}>
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
