import { describe, expect, it } from "vitest";
import { processColors, COLOR_PROMPT, STYLE_CODES } from "./colors";

describe("processColors", () => {
  it("converts color codes to inline-styled spans", () => {
    const result = processColors("{r}danger{/r}");
    expect(result).toContain("color:#ef4444");
    expect(result).toContain("danger");
  });

  it("handles all style codes", () => {
    for (const [key, val] of Object.entries(STYLE_CODES)) {
      const input = `{${key}}test{/${key}}`;
      const output = processColors(input);
      expect(output).toContain(val.css);
      expect(output).toContain("test");
    }
  });

  it("handles multiple codes in one string", () => {
    const input = "The {r}fire{/r} and the {b}ice{/b} collide.";
    const output = processColors(input);
    expect(output).toContain("#ef4444");
    expect(output).toContain("#3b82f6");
    expect(output).toContain("The ");
    expect(output).toContain(" collide.");
  });

  it("handles multiline content", () => {
    const input = "{g}line one\nline two{/g}";
    const output = processColors(input);
    expect(output).toContain("#22c55e");
    expect(output).toContain("line one\nline two");
  });

  it("applies italic style for {i}", () => {
    const output = processColors("{i}whispered{/i}");
    expect(output).toContain("font-style:italic");
  });

  it("applies dim style for {d}", () => {
    const output = processColors("{d}faded{/d}");
    expect(output).toContain("opacity:0.5");
  });

  it("applies underline for {u}", () => {
    const output = processColors("{u}important{/u}");
    expect(output).toContain("text-decoration:underline");
  });

  it("applies bold+white for {w}", () => {
    const output = processColors("{w}bright{/w}");
    expect(output).toContain("font-weight:600");
    expect(output).toContain("#f8fafc");
  });

  it("handles new colors: purple, pink, brown, lime, teal, slate, amber", () => {
    const pairs = [
      ["p", "#a855f7"],
      ["k", "#f472b6"],
      ["n", "#a16207"],
      ["l", "#84cc16"],
      ["t", "#2dd4bf"],
      ["s", "#94a3b8"],
      ["a", "#f59e0b"],
    ];
    for (const [code, hex] of pairs) {
      const output = processColors(`{${code}}test{/${code}}`);
      expect(output).toContain(hex);
    }
  });

  it("leaves unmatched codes alone", () => {
    const input = "use {z}unknown{/z} and {r}valid{/r}";
    const output = processColors(input);
    expect(output).toContain("{z}unknown{/z}");
    expect(output).toContain("#ef4444");
  });

  it("leaves mismatched open/close alone", () => {
    const input = "{r}opened but {/g} wrong close";
    expect(processColors(input)).toBe(input);
  });

  it("returns plain text unchanged", () => {
    expect(processColors("No codes here.")).toBe("No codes here.");
  });
});

describe("COLOR_PROMPT", () => {
  it("contains codes, correct example, wrong example, and rules", () => {
    for (const cat of ["r=", "g=", "b=", "o=", "t="]) {
      expect(COLOR_PROMPT).toContain(cat);
    }
    expect(COLOR_PROMPT).toContain("CORRECT");
    expect(COLOR_PROMPT).toContain("WRONG");
    expect(COLOR_PROMPT).toContain("{o}Old Meg{/o}");
    expect(COLOR_PROMPT).toContain("1-2 words per response");
  });
});
