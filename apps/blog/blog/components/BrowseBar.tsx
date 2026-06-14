import { useContext, useEffect, useRef, useState } from "react";
import { GlobalContext } from "@/utils/GlobalContext";

interface DropItem {
	href: string;
	label: string;
}

// Categories / Tags browse dropdown. Subtle by default; a filter input
// appears when there are many items (e.g. Tags).
function BrowseDropdown({ label, items }: { label: string; items: DropItem[] }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const searchable = items.length > 8;

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

	useEffect(() => {
		if (open && searchable) inputRef.current?.focus();
		if (!open) setQuery("");
	}, [open, searchable]);

	const q = query.trim().toLowerCase();
	const filtered = q ? items.filter((it) => it.label.toLowerCase().includes(q)) : items;

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				aria-haspopup="true"
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
				className="font-mono text-subtle text-xs uppercase tracking-wide transition-colors hover:text-accent"
			>
				{label}
				<span aria-hidden> ▾</span>
			</button>
			{open ? (
				<div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-md border border-border bg-surface p-2 shadow-lg">
					{searchable ? (
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={`filter ${label.toLowerCase()}…`}
							aria-label={`Filter ${label.toLowerCase()}`}
							className="mb-1 w-full rounded border border-border bg-canvas px-2 py-1 font-mono text-default text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
						/>
					) : null}
					<div className="max-h-72 overflow-auto">
						{filtered.length === 0 ? (
							<p className="px-2 py-1 font-mono text-subtle text-xs">no matches</p>
						) : (
							filtered.map((it) => (
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
				</div>
			) : null}
		</div>
	);
}

// A thin, understated row between the title bar and the page content for
// browsing by category / tag (replaces the removed sidebar; keeps the nav lean).
export function BrowseBar() {
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

	if (categories.length === 0 && tags.length === 0) return null;

	return (
		<div className="border-border border-b bg-canvas">
			<div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2.5 sm:px-6">
				<BrowseDropdown label="Categories" items={categories} />
				<BrowseDropdown label="Tags" items={tags} />
			</div>
		</div>
	);
}
