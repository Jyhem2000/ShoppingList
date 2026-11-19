import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { iconSvg } from "./scripts/iconSvg.ts";

export default defineConfig({
  plugins: [iconSvg()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
