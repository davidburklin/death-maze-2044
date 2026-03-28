export const WORLD_WIDTH = 25;
export const WORLD_HEIGHT = 25;

export interface CellCoord {
  x: number;
  y: number;
}

export type Direction = "north" | "east" | "south" | "west";

export type GateType = "none" | "networkLock" | "sequenceGate" | "credentialGate";

export interface LocalExit {
  isGated: boolean;
  gateType: GateType;
}

export type DoorMode = "two-way" | "one-way";

export interface MacroConnection {
  id: string;
  from: CellCoord;
  to: CellCoord;
  mode: DoorMode;
  sealsOnPass: boolean;
}

export interface MacroCell {
  coord: CellCoord;
  roomCount: number;
  localExit: LocalExit;
}

export type RunContractMode = "override-only" | "override-and-final-exit";

export interface NexusCoreDefinition {
  nexusCoreId: string;
  name: string;
  signalFragmentsRequired: number;
  contractMode: RunContractMode;
}

export interface WorldObjective {
  startCell: CellCoord;
  nexusCoreCell: CellCoord;
  finalExitCell: CellCoord;
}

export interface WorldGraph {
  width: number;
  height: number;
  cells: MacroCell[];
  connections: MacroConnection[];
  nexusCore: NexusCoreDefinition;
  objective: WorldObjective;
  seed: number;
}

export interface RunProgress {
  signalFragmentCount: number;
  nexusCoreFound: boolean;
  atFinalExit: boolean;
}

export const CARDINAL_DIRECTIONS: Direction[] = ["north", "east", "south", "west"];
