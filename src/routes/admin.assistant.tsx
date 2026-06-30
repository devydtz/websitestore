import { createFileRoute } from "@tanstack/react-router";
import { AssistantFullPage } from "@/components/admin/AssistantFullPage";

export const Route = createFileRoute("/admin/assistant")({
  head: () => ({ meta: [{ title: "Lunaris Assistant - Admin" }] }),
  component: AssistantFullPage,
});
