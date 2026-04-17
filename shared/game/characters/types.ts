export const ATTRIBUTE_KEYS = ["strength", "perception", "agility", "intelligence"] as const;

export type AttributeKey = typeof ATTRIBUTE_KEYS[number];

export interface CharacterAttributes {
  strength: number;
  perception: number;
  agility: number;
  intelligence: number;
}

export interface SurvivalBiasOption {
  key: AttributeKey;
  title: string;
  implantSignal: string;
  description: string;
}

export interface MvpCharacter {
  survivalBias: AttributeKey;
  attributes: CharacterAttributes;
}

