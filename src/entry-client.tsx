import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { getRouter } from "@/lib/router-client";
import "@/styles.css";

const queryClient = new QueryClient();
const router = getRouter({ queryClient });

startTransition(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => void registration.unregister()))
    .catch(() => {});
}
