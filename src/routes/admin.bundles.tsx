import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/bundles")({
  head: () => ({ meta: [{ title: "Bundles - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
