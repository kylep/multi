import { describe, expect, it } from "vitest";
import { processColors, COLOR_PROMPT, COLOR_CODES } from "./colors";

describe("processColors", () => {
  it("converts {r}text{/r} to an inline-styled span", () => {
    const result = processColors("{r}danger{/r}");
    expect(result).toContain("color:#ef4444");
    expect(result).toContain("danger");
  });

  it("handles all color codes with correct hex values", () => {
    for (const [key, val] of Object.entries(COLOR_CODES)) {
      const input = `{${key}}test{/${key}}`;
      const output = processColors(input);
      expect(output).toContain(`color:${val.css}`);
      expect(output).toContain("test");
    }
  });

  it("handles multiple colors in one string", () => {
    const input = "The {r}fire{/r} and the {b}ice{/b} collide.";
    const output = processColors(input);
    expect(output).toContain("#ef4444");
    expect(output).toContain("fire");
    expect(output).toContain("#3b82f6");
    expect(output).toContain("ice");
    expect(output).toContain("The ");
    expect(output).toContain(" collide.");
  });

  it("handles multiline colored text", () => {
    const input = "{g}line one\nline two{/g}";
    const output = processColors(input);
    expect(output).toContain("#22c55e");
    expect(output).toContain("line one\nline two");
  });

  it("applies font-weight to {w} bold", () => {
    const output = processColors("{w}bold text{/w}");
    expect(output).toContain("font-weight:600");
  });

  it("leaves unmatched braces alone", () => {
    const input = "use {x}unknown{/x} and {r}valid{/r}";
    const output = processColors(input);
    expect(output).toContain("{x}unknown{/x}");
    expect(output).toContain("#ef4444");
    expect(output).toContain("valid");
  });

  it("leaves mismatched open/close alone", () => {
    const input = "{r}opened but {/g} wrong close";
    expect(processColors(input)).toBe(input);
  });

  it("returns plain text unchanged", () => {
    const input = "No colors here at all.";
    expect(processColors(input)).toBe(input);
  });
});

describe("COLOR_PROMPT", () => {
  it("contains all codes and usage guidance", () => {
    for (const key of Object.keys(COLOR_CODES)) {
      expect(COLOR_PROMPT).toContain(`{${key}}`);
      expect(COLOR_PROMPT).toContain(`{/${key}}`);
    }
    expect(COLOR_PROMPT).toContain("sparingly");
    expect(COLOR_PROMPT.length).toBeLessThan(300);
  });
});
