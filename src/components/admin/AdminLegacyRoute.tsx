import { useLocation } from "@tanstack/react-router";
import { AssistantFloatingButton } from "./AssistantFloatingButton";
import { AdminPanel } from "@/components/admin/AdminPanel";

export function AdminLegacyRoute() {
  const location = useLocation();
  return (
    <>
      <AdminPanel />
      <AssistantFloatingButton currentPage={location.pathname} />
    </>
  );
}
