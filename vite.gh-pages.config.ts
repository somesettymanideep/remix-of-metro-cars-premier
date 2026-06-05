import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const base = process.env.GH_PAGES_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  build: {
    outDir: "dist/static",
    emptyOutDir: true,
  },
});
