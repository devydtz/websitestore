import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/crates")({
  head: () => ({ meta: [{ title: "Crates - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
