import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./message-bubble";

describe("MessageBubble", () => {
  it("renders 'User:' label for user messages", () => {
    render(<MessageBubble role="user" content="hi" />);
    expect(screen.getByText("User:")).toBeInTheDocument();
    expect(screen.getByText("hi")).toBeInTheDocument();
  });

  it("renders 'Bot:' label for assistant messages", () => {
    render(<MessageBubble role="assistant" content="hello" />);
    expect(screen.getByText("Bot:")).toBeInTheDocument();
  });

  it("renders markdown bold in assistant messages", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="**hello**" />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("hello");
  });

  it("renders fenced code blocks as <code>", () => {
    const { container } = render(
      <MessageBubble
        role="assistant"
        content={"```ts\nconst x = 1;\n```"}
      />,
    );
    expect(container.querySelector("pre code")).not.toBeNull();
  });

  it("does NOT parse markdown in user messages (preserves raw text)", () => {
    const { container } = render(
      <MessageBubble role="user" content="**not bold**" />,
    );
    expect(container.querySelector("strong")).toBeNull();
    expect(container.textContent).toContain("**not bold**");
  });
});
