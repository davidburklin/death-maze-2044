import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("cleanup inactive lobby members", { minutes: 1 }, internal.lobbies.cleanupInactiveMembers, {});

export default crons;