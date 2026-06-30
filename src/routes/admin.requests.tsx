import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "Requests - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
