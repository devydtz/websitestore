import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/cosmetics")({
  head: () => ({ meta: [{ title: "Cosmetics - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
