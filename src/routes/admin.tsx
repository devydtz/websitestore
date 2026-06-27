import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Lunaris Craft" },
      { name: "description", content: "Store administration panel" },
      { property: "og:title", content: "Admin - Lunaris Craft" },
    ],
  }),
  component: AdminPanel,
});
