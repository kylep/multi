import * as React from "react";
import { Button } from "@/components/ui/button";

// Flips the design-system theme by toggling data-theme on <html> and
// persisting to localStorage. The no-flash bootstrap in _document.js applies
// the stored value before first paint. Dark (Terminal) is the default.
export function ThemeToggle() {
	const [theme, setTheme] = React.useState<"dark" | "light">("dark");

	React.useEffect(() => {
		const current =
			document.documentElement.getAttribute("data-theme") === "light"
				? "light"
				: "dark";
		setTheme(current);
	}, []);

	function toggle() {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		const root = document.documentElement;
		if (next === "light") {
			root.setAttribute("data-theme", "light");
		} else {
			root.removeAttribute("data-theme");
		}
		try {
			localStorage.setItem("theme", next);
		} catch {
			/* storage unavailable (private mode) — non-fatal */
		}
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggle}
			aria-label="Toggle light/dark theme"
		>
			{theme === "dark" ? "☀ Light" : "☾ Dark"}
		</Button>
	);
}
