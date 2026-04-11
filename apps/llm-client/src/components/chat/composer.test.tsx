import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./composer";

describe("Composer", () => {
  it("Enter sends and clears the input", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSend={onSend} onStop={() => {}} streaming={false} />);
    const input = screen.getByTestId("composer-input") as HTMLTextAreaElement;
    await user.type(input, "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(input.value).toBe("");
  });

  it("Shift+Enter inserts newline and does NOT send", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSend={onSend} onStop={() => {}} streaming={false} />);
    const input = screen.getByTestId("composer-input") as HTMLTextAreaElement;
    await user.type(input, "line1{Shift>}{Enter}{/Shift}line2");
    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toContain("\n");
  });

  it("Send button is disabled when input is empty or whitespace", async () => {
    const user = userEvent.setup();
    render(<Composer onSend={() => {}} onStop={() => {}} streaming={false} />);
    const sendBtn = screen.getByTestId("composer-send");
    expect(sendBtn).toBeDisabled();
    await user.type(screen.getByTestId("composer-input"), "   ");
    expect(sendBtn).toBeDisabled();
  });

  it("shows Stop button and calls onStop when streaming", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSend={() => {}} onStop={onStop} streaming={true} />);
    const stop = screen.getByTestId("composer-stop");
    await user.click(stop);
    expect(onStop).toHaveBeenCalled();
  });
});
