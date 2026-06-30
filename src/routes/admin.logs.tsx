import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Logs - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
