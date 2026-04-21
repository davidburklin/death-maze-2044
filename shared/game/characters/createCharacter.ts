import { ATTRIBUTE_KEYS, type AttributeKey, type CharacterAttributes, type MvpCharacter, type SurvivalBiasOption } from "./types";

export const BASE_CHARACTER_ATTRIBUTES: CharacterAttributes = {
  strength: 1,
  perception: 1,
  agility: 1,
  intelligence: 1
};

export const SURVIVAL_BIAS_OPTIONS: SurvivalBiasOption[] = [
  {
    key: "strength",
    title: "Force Bias",
    implantSignal: "Muscle graft harmonics elevated",
    description: "The implant favors hard impact, braced doors, and the stubborn physics of staying upright."
  },
  {
    key: "perception",
    title: "Signal Bias",
    implantSignal: "Threat-scan lattice widened",
    description: "The implant sharpens the edge between static and warning, turning faint traces into decisions."
  },
  {
    key: "agility",
    title: "Reflex Bias",
    implantSignal: "Motor prediction loop accelerated",
    description: "The implant trims hesitation from the body before the mind can name what moved."
  },
  {
    key: "intelligence",
    title: "Pattern Bias",
    implantSignal: "Cognitive splice channel primed",
    description: "The implant feeds structure into panic, making locks, routes, and failures easier to read."
  }
];

export function isAttributeKey(value: string): value is AttributeKey {
  return ATTRIBUTE_KEYS.includes(value as AttributeKey);
}

export function createMvpCharacter(survivalBias: AttributeKey): MvpCharacter {
  return {
    survivalBias,
    attributes: {
      ...BASE_CHARACTER_ATTRIBUTES,
      [survivalBias]: BASE_CHARACTER_ATTRIBUTES[survivalBias] + 1
    }
  };
}

export function validateMvpCharacter(character: MvpCharacter): string[] {
  const issues: string[] = [];

  if (!isAttributeKey(character.survivalBias)) {
    issues.push("Survival bias is invalid.");
  }

  for (const attributeKey of ATTRIBUTE_KEYS) {
    const value = character.attributes[attributeKey];
    if (!Number.isInteger(value)) {
      issues.push(`${attributeKey} must be an integer.`);
    }
  }

  const expectedCharacter = isAttributeKey(character.survivalBias)
    ? createMvpCharacter(character.survivalBias)
    : null;

  if (!expectedCharacter) {
    return issues;
  }

  for (const attributeKey of ATTRIBUTE_KEYS) {
    if (character.attributes[attributeKey] !== expectedCharacter.attributes[attributeKey]) {
      issues.push(`${attributeKey} must match the selected survival bias.`);
    }
  }

  return issues;
}

