import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./composer";

function Harness({
  onSend = () => {},
  onStop = () => {},
  streaming = false,
}: {
  onSend?: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <Composer
      value={value}
      onValueChange={setValue}
      onSend={onSend}
      onStop={onStop}
      streaming={streaming}
      usedTokens={0}
      inputBudget={1000}
      usedPercent={0}
      truncated={false}
    />
  );
}

describe("Composer", () => {
  it("Enter sends and clears the input", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSend={onSend} />);
    const input = screen.getByTestId("composer-input") as HTMLTextAreaElement;
    await user.type(input, "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(input.value).toBe("");
  });

  it("Shift+Enter inserts newline and does NOT send", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSend={onSend} />);
    const input = screen.getByTestId("composer-input") as HTMLTextAreaElement;
    await user.type(input, "line1{Shift>}{Enter}{/Shift}line2");
    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toContain("\n");
  });

  it("Send button is disabled when input is empty or whitespace", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const sendBtn = screen.getByTestId("composer-send");
    expect(sendBtn).toBeDisabled();
    await user.type(screen.getByTestId("composer-input"), "   ");
    expect(sendBtn).toBeDisabled();
  });

  it("shows Stop button and calls onStop when streaming", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<Harness streaming onStop={onStop} />);
    const stop = screen.getByTestId("composer-stop");
    await user.click(stop);
    expect(onStop).toHaveBeenCalled();
  });

  it("renders context meter with percent and tokens", () => {
    render(
      <Composer
        value=""
        onValueChange={() => {}}
        onSend={() => {}}
        onStop={() => {}}
        streaming={false}
        usedTokens={300}
        inputBudget={1000}
        usedPercent={30}
        truncated={false}
      />,
    );
    const meter = screen.getByTestId("context-meter");
    expect(meter.textContent).toContain("30%");
    expect(meter.getAttribute("title")).toContain("300");
    expect(meter.getAttribute("title")).toContain("1,000");
  });

  it("shows warning prefix when truncated", () => {
    render(
      <Composer
        value=""
        onValueChange={() => {}}
        onSend={() => {}}
        onStop={() => {}}
        streaming={false}
        usedTokens={1200}
        inputBudget={1000}
        usedPercent={100}
        truncated={true}
      />,
    );
    expect(screen.getByTestId("context-meter").textContent).toContain("⚠");
  });
});
