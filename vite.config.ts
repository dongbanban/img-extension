import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/img-extension/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
