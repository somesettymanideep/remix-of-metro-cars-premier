import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Extract base path from package.json homepage for GitHub Pages deployments
const homepage = typeof import.meta !== "undefined" && import.meta.env?.VITE_HOMEPAGE
  ? import.meta.env.VITE_HOMEPAGE
  : "";
const basepath = homepage ? new URL(homepage).pathname.replace(/\/$/, "") || "/" : "/";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    basepath,
  });

  return router;
};
