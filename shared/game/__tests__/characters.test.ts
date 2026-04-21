import { describe, expect, it } from "vitest";
import {
  ATTRIBUTE_KEYS,
  createMvpCharacter,
  validateMvpCharacter,
  type CharacterAttributes
} from "../index";

describe("MVP character creation", () => {
  it("starts every attribute at base one except the selected survival bias", () => {
    for (const survivalBias of ATTRIBUTE_KEYS) {
      const character = createMvpCharacter(survivalBias);

      expect(character.survivalBias).toBe(survivalBias);

      for (const attributeKey of ATTRIBUTE_KEYS) {
        const expectedValue = attributeKey === survivalBias ? 2 : 1;
        expect(character.attributes[attributeKey]).toBe(expectedValue);
      }
    }
  });

  it("accepts a generated MVP character", () => {
    const character = createMvpCharacter("perception");

    expect(validateMvpCharacter(character)).toEqual([]);
  });

  it("rejects attributes that do not match the selected survival bias", () => {
    const invalidAttributes: CharacterAttributes = {
      strength: 2,
      perception: 2,
      agility: 1,
      intelligence: 1
    };

    expect(validateMvpCharacter({
      survivalBias: "strength",
      attributes: invalidAttributes
    })).toContain("perception must match the selected survival bias.");
  });
});
