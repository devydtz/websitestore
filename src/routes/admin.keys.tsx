import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/keys")({
  head: () => ({ meta: [{ title: "Crate Keys - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
