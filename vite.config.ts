// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Extract base path from package.json homepage for GitHub Pages deployments
const homepage = process.env.HOMEPAGE || process.env.PUBLIC_URL || "";
const base = process.env.GH_PAGES_BASE || (homepage ? new URL(homepage).pathname : "/");

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    base,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-framer": ["framer-motion"],
            "vendor-router": ["@tanstack/react-router"],
          },
        },
      },
      // Optimize asset sizes
      minify: "terser",
    },
    server: {
      headers: {
        "Cache-Control": "public, max-age=31536000",
      },
    },
  },
});
