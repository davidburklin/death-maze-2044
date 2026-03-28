import { describe, expect, it } from "vitest";
import {
  enterCombat,
  advanceTurn,
  applyDamage,
  type Combatant
} from "../index";

const makeCombatant = (id: string, initiative: number, hp: number): Combatant => ({
  id,
  initiative,
  hp
});

describe("combat turn management", () => {
  it("orders combatants by initiative descending", () => {
    const state = enterCombat([
      makeCombatant("a", 5, 10),
      makeCombatant("b", 15, 10),
      makeCombatant("c", 10, 10)
    ]);

    expect(state.turnOrder).toEqual(["b", "c", "a"]);
    expect(state.turnIndex).toBe(0);
    expect(state.active).toBe(true);
  });

  it("advances turn index cyclically", () => {
    let state = enterCombat([
      makeCombatant("a", 3, 10),
      makeCombatant("b", 2, 10),
      makeCombatant("c", 1, 10)
    ]);

    expect(state.turnOrder[state.turnIndex]).toBe("a");
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("b");
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("c");
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("a");
  });

  it("removes dead combatants from turn order", () => {
    let state = enterCombat([
      makeCombatant("a", 3, 10),
      makeCombatant("b", 2, 5),
      makeCombatant("c", 1, 10)
    ]);

    state = applyDamage(state, "b", 5);
    expect(state.combatants["b"]!.hp).toBe(0);
    expect(state.turnOrder).toEqual(["a", "c"]);
    expect(state.active).toBe(true);
  });

  it("ends combat when one combatant remains", () => {
    let state = enterCombat([
      makeCombatant("a", 3, 10),
      makeCombatant("b", 2, 5)
    ]);

    state = applyDamage(state, "b", 5);
    expect(state.active).toBe(false);
    expect(state.turnOrder).toEqual(["a"]);
  });

  it("preserves turn index when combatant before current dies", () => {
    let state = enterCombat([
      makeCombatant("a", 4, 10),
      makeCombatant("b", 3, 10),
      makeCombatant("c", 2, 5),
      makeCombatant("d", 1, 10)
    ]);

    // Advance to b's turn (index 1)
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("b");

    // b kills c (index 2, after b)
    state = applyDamage(state, "c", 5);
    expect(state.turnOrder).toEqual(["a", "b", "d"]);
    // b should still be the active combatant
    expect(state.turnOrder[state.turnIndex]).toBe("b");
  });

  it("advances correctly when current combatant dies", () => {
    let state = enterCombat([
      makeCombatant("a", 4, 10),
      makeCombatant("b", 3, 5),
      makeCombatant("c", 2, 10),
      makeCombatant("d", 1, 10)
    ]);

    // Advance to b's turn (index 1)
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("b");

    // b dies (e.g. from a counter-effect)
    state = applyDamage(state, "b", 5);
    expect(state.turnOrder).toEqual(["a", "c", "d"]);
    // turn should advance to c (the next combatant after b)
    expect(state.turnOrder[state.turnIndex]).toBe("c");
  });

  it("preserves turn when combatant before current index dies", () => {
    let state = enterCombat([
      makeCombatant("a", 4, 5),
      makeCombatant("b", 3, 10),
      makeCombatant("c", 2, 10),
      makeCombatant("d", 1, 10)
    ]);

    // Advance to c's turn (index 2)
    state = advanceTurn(state);
    state = advanceTurn(state);
    expect(state.turnOrder[state.turnIndex]).toBe("c");

    // c kills a (index 0, before c)
    state = applyDamage(state, "a", 5);
    expect(state.turnOrder).toEqual(["b", "c", "d"]);
    // c should still be the active combatant
    expect(state.turnOrder[state.turnIndex]).toBe("c");
  });

  it("clamps damage to zero minimum", () => {
    let state = enterCombat([
      makeCombatant("a", 2, 10),
      makeCombatant("b", 1, 10)
    ]);

    state = applyDamage(state, "b", -5);
    expect(state.combatants["b"]!.hp).toBe(10);
  });

  it("ignores damage to unknown target", () => {
    const state = enterCombat([
      makeCombatant("a", 2, 10),
      makeCombatant("b", 1, 10)
    ]);

    const result = applyDamage(state, "unknown", 5);
    expect(result).toBe(state);
  });
});
