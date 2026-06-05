#!/usr/bin/env bun
/**
 * Static export script for GitHub Pages.
 * Builds the app with a Node.js SSR server, starts it, fetches all routes,
 * and saves prerendered HTML + client assets to `gh-pages-dist/`.
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const homepage = JSON.parse(fs.readFileSync("package.json", "utf-8")).homepage || "";
const basePath = homepage ? new URL(homepage).pathname : "/";
const repoName = basePath.replace(/^\//, "").replace(/\/$/, "") || "";

const routesToPrerender = ["/", "/privacy-policy"];
const outDir = "gh-pages-dist";
const serverDir = "dist";
const port = 3456;

function exec(cmd: string, args: string[], opts?: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
  });
}

async function fetchRoute(route: string): Promise<string> {
  const url = `http://localhost:${port}${route}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function main() {
  // 1. Clean
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 2. Build with Node SSR preset so we can run it locally
  console.log("Building with node-server preset…");
  await exec("bun", ["x", "vite", "build"], {
    env: { ...process.env, NITRO_PRESET: "node-server", GH_PAGES_BASE: basePath },
  });

  // 3. Start SSR server in background
  console.log("Starting SSR server…");
  const server = spawn("node", [path.join(serverDir, "server", "index.mjs")], {
    env: { ...process.env, PORT: String(port), NITRO_PORT: String(port) },
    stdio: "pipe",
  });

  // Wait for server to be ready
  await new Promise<void>((resolve) => {
    server.stdout?.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Listening") || text.includes(port)) resolve();
    });
    server.stderr?.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Listening") || text.includes(port)) resolve();
    });
    setTimeout(resolve, 3000);
  });

  // 4. Fetch each route and save HTML
  console.log("Prerendering routes…");
  for (const route of routesToPrerender) {
    const html = await fetchRoute(route);
    const filePath = route === "/" ? "index.html" : `${route.slice(1)}.html`;
    const fullPath = path.join(outDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, html);
    console.log(`  ✓ ${route} → ${filePath}`);
  }

  // 5. Copy client assets
  const clientAssets = path.join(serverDir, "client", "assets");
  const outAssets = path.join(outDir, "assets");
  if (fs.existsSync(clientAssets)) {
    fs.mkdirSync(outAssets, { recursive: true });
    for (const file of fs.readdirSync(clientAssets)) {
      fs.copyFileSync(path.join(clientAssets, file), path.join(outAssets, file));
    }
    console.log("  ✓ Copied client assets");
  }

  // 6. Copy Lovable assets if present
  const l5eSrc = path.join(serverDir, "client", "__l5e");
  const l5eDst = path.join(outDir, "__l5e");
  if (fs.existsSync(l5eSrc)) {
    fs.mkdirSync(l5eDst, { recursive: true });
    // Recursive copy
    function copyDir(src: string, dst: string) {
      fs.mkdirSync(dst, { recursive: true });
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
      }
    }
    copyDir(l5eSrc, l5eDst);
    console.log("  ✓ Copied Lovable assets");
  }

  // 7. SPA fallback: copy index.html → 404.html
  fs.copyFileSync(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
  console.log("  ✓ Created 404.html for SPA routing");

  // 8. Kill server
  server.kill();

  console.log(`\nStatic export complete in ./${outDir}/`);
  console.log(`Deploy with: npx gh-pages -d ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
