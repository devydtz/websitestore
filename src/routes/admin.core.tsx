import { createFileRoute } from "@tanstack/react-router";
import { LunarisCoreWorkspace } from "@/components/admin/LunarisCoreWorkspace";

export const Route = createFileRoute("/admin/core")({
  head: () => ({ meta: [{ title: "Lunaris Core - Admin AI" }] }),
  component: LunarisCoreWorkspace,
});
