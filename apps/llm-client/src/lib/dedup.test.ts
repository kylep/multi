import { describe, expect, it } from "vitest";
import { isDuplicateResponse } from "./dedup";

describe("isDuplicateResponse", () => {
  it("returns false for short/empty content", () => {
    expect(isDuplicateResponse("", [])).toBe(false);
    expect(isDuplicateResponse("hi", [])).toBe(false);
  });

  it("detects exact duplicate of the last assistant message", () => {
    const history = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "This is a test response that is long enough to check." },
    ];
    expect(
      isDuplicateResponse(
        "This is a test response that is long enough to check.",
        history,
      ),
    ).toBe(true);
  });

  it("detects near-duplicate with minor differences", () => {
    const history = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "The quick brown fox jumps over the lazy dog repeatedly" },
    ];
    expect(
      isDuplicateResponse(
        "The quick brown fox jumps over the lazy dog repeatedly!",
        history,
      ),
    ).toBe(true);
  });

  it("returns false for genuinely different responses", () => {
    const history = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "The quick brown fox jumps over the lazy dog" },
    ];
    expect(
      isDuplicateResponse(
        "A completely different response about something else entirely",
        history,
      ),
    ).toBe(false);
  });

  it("checks multiple recent assistant messages, not just the last", () => {
    const history = [
      { role: "user", content: "a" },
      { role: "assistant", content: "First response that was unique and interesting" },
      { role: "user", content: "b" },
      { role: "assistant", content: "Second response that is totally different here" },
    ];
    expect(
      isDuplicateResponse(
        "First response that was unique and interesting",
        history,
      ),
    ).toBe(true);
  });
});
