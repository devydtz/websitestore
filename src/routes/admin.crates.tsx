import { createFileRoute } from "@tanstack/react-router";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/crates")({
  head: () => ({ meta: [{ title: "Crates - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Crates" subtitle="Create crate definitions and reward JSON for future crate systems.">
      <AdminCrudPage config={{ table: "crates", title: "Crates", itemLabel: "Crate", jsonFields: ["rewards"], extraFields: ["color"] }} />
    </AdminShell>
  ),
});
