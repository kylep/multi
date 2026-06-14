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
	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
	const go = (p: number) => {
		if (p >= 1 && p <= totalPages) onPageChange?.(p);
	};
	return (
		<nav
			aria-label="Pagination"
			className={cn("flex items-center justify-center gap-2", className)}
		>
			<PageButton
				label="Previous page"
				disabled={currentPage === 1}
				onClick={() => go(currentPage - 1)}
			>
				←
			</PageButton>
			{pages.map((p) => (
				<PageButton
					key={p}
					active={p === currentPage}
					onClick={() => go(p)}
					label={`Page ${p}`}
				>
					{p}
				</PageButton>
			))}
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
