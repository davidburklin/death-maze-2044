import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["shared/game/__tests__/**/*.test.ts"]
  }
});
