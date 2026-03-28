import type { RunProgress, WorldGraph } from "../world/types";
import { hasRunCompleted } from "../world/validateWorld";

export interface ObjectiveState {
  progress: RunProgress;
  nexusCoreUsable: boolean;
  completed: boolean;
}

export const createObjectiveState = (): ObjectiveState => ({
  progress: {
    signalFragmentCount: 0,
    nexusCoreFound: false,
    atFinalExit: false
  },
  nexusCoreUsable: false,
  completed: false
});

export const applySignalFragmentFound = (state: ObjectiveState): ObjectiveState => {
  const progress = {
    ...state.progress,
    signalFragmentCount: state.progress.signalFragmentCount + 1
  };
  return {
    ...state,
    progress
  };
};

export const applyNexusCoreFound = (state: ObjectiveState): ObjectiveState => ({
  ...state,
  progress: {
    ...state.progress,
    nexusCoreFound: true
  }
});

export const applyFinalExitReached = (state: ObjectiveState): ObjectiveState => ({
  ...state,
  progress: {
    ...state.progress,
    atFinalExit: true
  }
});

export const evaluateObjective = (world: WorldGraph, state: ObjectiveState): ObjectiveState => {
  const nexusCoreUsable = state.progress.signalFragmentCount >= world.nexusCore.signalFragmentsRequired;
  const completed = hasRunCompleted(world, state.progress);

  return {
    ...state,
    nexusCoreUsable,
    completed
  };
};
