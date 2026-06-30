import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admins - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
