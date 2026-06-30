import { createFileRoute } from "@tanstack/react-router";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/keys")({
  head: () => ({ meta: [{ title: "Crate Keys - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Crate Keys" subtitle="Add crate key types, connect them to crates, and set delivery commands.">
      <AdminCrudPage config={{ table: "crate_keys", title: "Crate Keys", itemLabel: "Crate Key", jsonFields: ["commands"], extraFields: ["crate_id", "icon", "sort_order"] }} />
    </AdminShell>
  ),
});
