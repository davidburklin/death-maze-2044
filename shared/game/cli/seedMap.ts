import process from "node:process";
import { generateWorld, type GenerateWorldOptions } from "../index";

interface CliOptions extends GenerateWorldOptions {
  seed: number;
}

const parseNumber = (value: string | undefined, flagName: string): number => {
  if (value === undefined) {
    throw new Error(`Missing value for ${flagName}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${flagName}: ${value}`);
  }

  return parsed;
};

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    seed: Date.now()
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--seed") {
      options.seed = parseNumber(argv[i + 1], "--seed");
      i += 1;
      continue;
    }

    if (arg === "--gated-exit-chance") {
      options.gatedExitChance = parseNumber(argv[i + 1], "--gated-exit-chance");
      i += 1;
      continue;
    }

    if (arg === "--one-way-door-chance") {
      options.oneWayDoorChance = parseNumber(argv[i + 1], "--one-way-door-chance");
      i += 1;
      continue;
    }

    if (arg === "--override-only-chance") {
      options.overrideOnlyChance = parseNumber(argv[i + 1], "--override-only-chance");
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const printHelp = (): void => {
  console.log("Usage: bun run shared/game/cli/seedMap.ts -- [options]");
  console.log("");
  console.log("Options:");
  console.log("  --seed <number>                 Seed for world generation");
  console.log("  --gated-exit-chance <0..1>      Override local exit gate probability");
  console.log("  --one-way-door-chance <0..1>    Override one-way door probability");
  console.log("  --override-only-chance <0..1>   Override override-only contract probability");
  console.log("  -h, --help                      Show this help");
  console.log("");
  console.log("Cell legend: S=start, N=nexusCore, E=final exit, X=overlap, g=gated, .=normal");
  console.log("Link legend: -=two-way east-west, >=east one-way, <=west one-way");
  console.log("             |=two-way north-south, v=south one-way, ^=north one-way");
};

const key = (x: number, y: number): string => `${x},${y}`;

const main = (): void => {
  const options = parseArgs(process.argv.slice(2));
  const world = generateWorld(options);

  const edgeSet = new Set<string>(world.connections.map((c) => `${c.from.x},${c.from.y}->${c.to.x},${c.to.y}`));
  const cellMap = new Map<string, (typeof world.cells)[number]>();
  for (const cell of world.cells) {
    cellMap.set(key(cell.coord.x, cell.coord.y), cell);
  }

  const startKey = key(world.objective.startCell.x, world.objective.startCell.y);
  const nexusCoreKey = key(world.objective.nexusCoreCell.x, world.objective.nexusCoreCell.y);
  const exitKey = key(world.objective.finalExitCell.x, world.objective.finalExitCell.y);

  const hasEdge = (fromX: number, fromY: number, toX: number, toY: number): boolean =>
    edgeSet.has(`${fromX},${fromY}->${toX},${toY}`);

  const cellChar = (x: number, y: number): string => {
    const k = key(x, y);
    const isStart = k === startKey;
    const isNexusCore = k === nexusCoreKey;
    const isExit = k === exitKey;

    const specialCount = Number(isStart) + Number(isNexusCore) + Number(isExit);
    if (specialCount > 1) {
      return "X";
    }
    if (isStart) {
      return "S";
    }
    if (isNexusCore) {
      return "N";
    }
    if (isExit) {
      return "E";
    }

    const gated = cellMap.get(k)?.localExit.isGated ?? false;
    return gated ? "g" : ".";
  };

  console.log("Death Maze 2044 Macro Map");
  console.log("-------------------------");
  console.log(`Seed: ${world.seed}`);
  console.log(`Contract: ${world.nexusCore.contractMode}`);
  console.log(`Nexus Core: ${world.nexusCore.name} | Signal Fragments: ${world.nexusCore.signalFragmentsRequired}`);
  console.log("");

  for (let y = 0; y < world.height; y += 1) {
    let cellLine = "";
    for (let x = 0; x < world.width; x += 1) {
      cellLine += cellChar(x, y);

      if (x < world.width - 1) {
        const east = hasEdge(x, y, x + 1, y);
        const west = hasEdge(x + 1, y, x, y);

        if (east && west) {
          cellLine += "-";
        } else if (east) {
          cellLine += ">";
        } else if (west) {
          cellLine += "<";
        } else {
          cellLine += " ";
        }
      }
    }
    console.log(cellLine);

    if (y < world.height - 1) {
      let verticalLine = "";
      for (let x = 0; x < world.width; x += 1) {
        const south = hasEdge(x, y, x, y + 1);
        const north = hasEdge(x, y + 1, x, y);

        if (south && north) {
          verticalLine += "|";
        } else if (south) {
          verticalLine += "v";
        } else if (north) {
          verticalLine += "^";
        } else {
          verticalLine += " ";
        }

        if (x < world.width - 1) {
          verticalLine += " ";
        }
      }
      console.log(verticalLine);
    }
  }
};

main();
