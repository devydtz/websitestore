import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lunarisSupabase: ["@supabase/supabase-js"],
          lunarisRouter: ["@tanstack/react-router", "@tanstack/react-query"],
          lunarisUi: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "lucide-react",
          ],
        },
      },
    },
  },
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react(),
    tsConfigPaths(),
  ],
});
