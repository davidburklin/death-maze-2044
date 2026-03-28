export interface Combatant {
  id: string;
  initiative: number;
  hp: number;
}

export interface CombatState {
  active: boolean;
  turnOrder: string[];
  turnIndex: number;
  combatants: Record<string, Combatant>;
}

export const enterCombat = (combatants: Combatant[]): CombatState => {
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
  const map: Record<string, Combatant> = {};
  for (const entity of sorted) {
    map[entity.id] = entity;
  }

  return {
    active: sorted.length > 0,
    turnOrder: sorted.map((c) => c.id),
    turnIndex: 0,
    combatants: map
  };
};

export const advanceTurn = (state: CombatState): CombatState => {
  if (!state.active || state.turnOrder.length === 0) {
    return state;
  }

  return {
    ...state,
    turnIndex: (state.turnIndex + 1) % state.turnOrder.length
  };
};

export const applyDamage = (state: CombatState, targetId: string, damage: number): CombatState => {
  const target = state.combatants[targetId];
  if (!target) {
    return state;
  }

  const hp = Math.max(0, target.hp - Math.max(0, damage));
  const nextCombatants = {
    ...state.combatants,
    [targetId]: {
      ...target,
      hp
    }
  };

  const currentId = state.turnOrder[state.turnIndex];
  const aliveOrder = state.turnOrder.filter((id) => (nextCombatants[id]?.hp ?? 0) > 0);

  let newTurnIndex: number;
  if (aliveOrder.length === 0) {
    newTurnIndex = 0;
  } else {
    const currentAliveIdx = currentId ? aliveOrder.indexOf(currentId) : -1;
    if (currentAliveIdx >= 0) {
      newTurnIndex = currentAliveIdx;
    } else {
      let beforeCount = 0;
      for (const id of state.turnOrder) {
        if (id === currentId) break;
        if (aliveOrder.includes(id)) beforeCount++;
      }
      newTurnIndex = beforeCount % aliveOrder.length;
    }
  }

  return {
    ...state,
    active: aliveOrder.length > 1,
    turnOrder: aliveOrder,
    turnIndex: newTurnIndex,
    combatants: nextCombatants
  };
};
