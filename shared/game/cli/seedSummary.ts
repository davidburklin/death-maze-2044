import { generateWorld, validateWorld, type GenerateWorldOptions } from "../index";

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
  console.log("Usage: bun run shared/game/cli/seedSummary.ts -- [options]");
  console.log("");
  console.log("Options:");
  console.log("  --seed <number>                 Seed for world generation");
  console.log("  --gated-exit-chance <0..1>      Override local exit gate probability");
  console.log("  --one-way-door-chance <0..1>    Override one-way door probability");
  console.log("  --override-only-chance <0..1>   Override override-only contract probability");
  console.log("  -h, --help                      Show this help");
};

const formatCoord = (coord: { x: number; y: number }): string => `(${coord.x}, ${coord.y})`;

const main = (): void => {
  const options = parseArgs(process.argv.slice(2));
  const world = generateWorld(options);
  const issues = validateWorld(world);

  const oneWayCount = world.connections.filter((c) => c.mode === "one-way").length;
  const gatedExitCount = world.cells.filter((c) => c.localExit.isGated).length;

  console.log("Death Maze 2044 Seed Summary");
  console.log("----------------------------");
  console.log(`Seed: ${world.seed}`);
  console.log(`Grid: ${world.width}x${world.height}`);
  console.log(`Nexus Core: ${world.nexusCore.name} (${world.nexusCore.nexusCoreId})`);
  console.log(`Contract: ${world.nexusCore.contractMode}`);
  console.log(`Signal Fragments Required: ${world.nexusCore.signalFragmentsRequired}`);
  console.log(`Start Cell: ${formatCoord(world.objective.startCell)}`);
  console.log(`Nexus Core Cell: ${formatCoord(world.objective.nexusCoreCell)}`);
  console.log(`Final Exit Cell: ${formatCoord(world.objective.finalExitCell)}`);
  console.log(`Macro Cells: ${world.cells.length}`);
  console.log(`Connections: ${world.connections.length} (${oneWayCount} one-way)`);
  console.log(`Gated Local Exits: ${gatedExitCount}`);

  if (issues.length > 0) {
    console.log("");
    console.log("Validation: FAILED");
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("Validation: OK");
};

main();
