import { describe, expect, it } from "vitest";
import { extractChoices } from "./extract-choices";

describe("extractChoices", () => {
  it("extracts standard numbered choices at end of response", () => {
    const content = `You enter the cave. Three paths diverge.

1. Take the left path into darkness
2. Follow the right path toward the light
3. Go straight ahead through the narrow gap`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(3);
    expect(result.choices[0].number).toBe(1);
    expect(result.choices[0].text).toBe("Take the left path into darkness");
    expect(result.choices[2].text).toBe(
      "Go straight ahead through the narrow gap",
    );
    expect(result.cleanedText).toBe("You enter the cave. Three paths diverge.");
  });

  it("handles N) format", () => {
    const content = `What do you do?

1) Fight
2) Flee
3) Negotiate`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(3);
    expect(result.choices[0].text).toBe("Fight");
  });

  it("returns empty choices when list is mid-paragraph with text after", () => {
    const content = `Here are some tips:

1. Always carry water
2. Watch for snakes
3. Travel light

Remember to stay safe out there!`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
    expect(result.cleanedText).toBe(content);
  });

  it("returns empty choices when more than 5 items", () => {
    const items = Array.from({ length: 6 }, (_, i) => `${i + 1}. Item ${i + 1}`);
    const content = `Pick one:\n\n${items.join("\n")}`;
    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
  });

  it("returns empty choices when fewer than 2 items", () => {
    const content = `Only one option:\n\n1. Do the thing`;
    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
  });

  it("returns empty choices when item text exceeds 200 chars", () => {
    const longText = "A".repeat(201);
    const content = `Choose:\n\n1. ${longText}\n2. Short option`;
    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
  });

  it("returns empty choices when no numbered list exists", () => {
    const content = "Just a normal response with no options.";
    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
    expect(result.cleanedText).toBe(content);
  });

  it("strips markdown formatting from choice text", () => {
    const content = `Options:

1. **Attack** the goblin
2. *Sneak* past quietly
3. __Run__ away fast`;

    const result = extractChoices(content);
    expect(result.choices[0].text).toBe("Attack the goblin");
    expect(result.choices[1].text).toBe("Sneak past quietly");
    expect(result.choices[2].text).toBe("Run away fast");
  });

  it("strips colour codes from choice text", () => {
    const content = `What next?

1. {r}Attack{/r} the dragon
2. {g}Pick up{/g} the sword
3. {t}Flee to{/t} the village`;

    const result = extractChoices(content);
    expect(result.choices[0].text).toBe("Attack the dragon");
    expect(result.choices[1].text).toBe("Pick up the sword");
    expect(result.choices[2].text).toBe("Flee to the village");
  });

  it("skips items with empty text", () => {
    const content = `Choose:

1.
2. Valid option
3. Another option`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
  });

  it("handles trailing blank lines after choices", () => {
    const content = `Pick one:

1. Option A
2. Option B

`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(2);
    expect(result.cleanedText).toBe("Pick one:");
  });

  it("rejects non-sequential numbering", () => {
    const content = `Choose:

1. First
3. Third
5. Fifth`;

    const result = extractChoices(content);
    expect(result.choices).toHaveLength(0);
  });

  it("handles empty/null content", () => {
    expect(extractChoices("").choices).toHaveLength(0);
  });
});
