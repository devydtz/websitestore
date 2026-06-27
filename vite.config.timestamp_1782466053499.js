// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
var vite_config_default = defineConfig({
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react(),
    tsConfigPaths()
  ]
});
export {
  vite_config_default as default
};
