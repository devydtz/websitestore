import { createFileRoute } from "@tanstack/react-router";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/cosmetics")({
  head: () => ({ meta: [{ title: "Cosmetics - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Cosmetics" subtitle="Manage trails, particles, hats, pets, wings, capes, tags, armor, and other cosmetics.">
      <AdminCrudPage config={{ table: "cosmetics", title: "Cosmetics", itemLabel: "Cosmetic", jsonFields: ["commands"], extraFields: ["category", "preview_url"] }} />
    </AdminShell>
  ),
});
