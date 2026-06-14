import type * as React from "react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange?: (page: number) => void;
	className?: string;
}

function PageButton({
	active,
	disabled,
	onClick,
	label,
	children,
}: {
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	label?: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			aria-label={label}
			aria-current={active ? "page" : undefined}
			className={cn(
				"inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-sm transition-colors",
				active
					? "border-accent bg-accent text-on-accent"
					: "border-border bg-surface text-muted hover:border-accent hover:text-accent",
				disabled && "pointer-events-none opacity-40",
			)}
		>
			{children}
		</button>
	);
}

// Tokenized pagination. Renders prev/next + numbered pages; the active page
// is highlighted. onPageChange fires with the target page number.
export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	className,
}: PaginationProps) {
	const go = (p: number) => {
		if (p >= 1 && p <= totalPages && p !== currentPage) onPageChange?.(p);
	};

	// Windowed page list — first, last, current ±1, with "…" gaps — so it stays
	// compact on mobile no matter how many pages there are.
	const shown = [
		...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
	]
		.filter((p) => p >= 1 && p <= totalPages)
		.sort((a, b) => a - b);
	const items: (number | "gap")[] = [];
	let prev = 0;
	for (const p of shown) {
		if (p - prev > 1) items.push("gap");
		items.push(p);
		prev = p;
	}

	return (
		<nav
			aria-label="Pagination"
			className={cn("flex items-center justify-center gap-1.5 sm:gap-2", className)}
		>
			<PageButton
				label="Previous page"
				disabled={currentPage === 1}
				onClick={() => go(currentPage - 1)}
			>
				←
			</PageButton>
			{items.map((it, i) =>
				it === "gap" ? (
					<span
						key={`gap-${i}`}
						aria-hidden
						className="px-0.5 font-mono text-subtle text-sm"
					>
						…
					</span>
				) : (
					<PageButton
						key={it}
						active={it === currentPage}
						onClick={() => go(it)}
						label={`Page ${it}`}
					>
						{it}
					</PageButton>
				),
			)}
			<PageButton
				label="Next page"
				disabled={currentPage === totalPages}
				onClick={() => go(currentPage + 1)}
			>
				→
			</PageButton>
		</nav>
	);
}
