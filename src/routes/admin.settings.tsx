import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
