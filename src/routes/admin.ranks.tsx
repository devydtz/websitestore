import { createFileRoute } from "@tanstack/react-router";
import { AdminLegacyRoute } from "@/components/admin/AdminLegacyRoute";

export const Route = createFileRoute("/admin/ranks")({
  head: () => ({ meta: [{ title: "Ranks - Lunaris Admin" }] }),
  component: AdminLegacyRoute,
});
