// Static gap maps so Tailwind's content scanner sees the literal classes
// (dynamic `gap-${n}` would not be generated). Shared by Stack/Cluster/Grid.
export const GAP = {
	0: "gap-0",
	1: "gap-1",
	2: "gap-2",
	3: "gap-3",
	4: "gap-4",
	6: "gap-6",
	8: "gap-8",
	12: "gap-12",
} as const;

export type Gap = keyof typeof GAP;
