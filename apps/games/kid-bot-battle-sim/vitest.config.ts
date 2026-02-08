import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@kid-bot-battle-sim/game-core": path.resolve(
        import.meta.dirname,
        "packages/game-core/src/index.ts"
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
  },
});
