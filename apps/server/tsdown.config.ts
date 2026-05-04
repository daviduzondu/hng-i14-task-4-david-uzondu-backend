import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/server.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@hng-i14-task-0-david-uzondu\/.*/],
});
