import { createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

export function getRouter({ queryClient }: { queryClient: import("@tanstack/react-query").QueryClient }) {
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
}
