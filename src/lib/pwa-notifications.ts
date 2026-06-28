export async function registerLunarisApp() {
  if (!("serviceWorker" in navigator)) {
    return { ok: false as const, error: "This browser does not support app notifications." };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return { ok: true as const, registration };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: message };
  }
}

export async function enableLocalAdminNotifications() {
  const registered = await registerLunarisApp();
  if (!registered.ok) return registered;

  if (!("Notification" in window)) {
    return { ok: false as const, error: "Notifications are not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false as const, error: "Notification permission was not granted." };
  }

  await registered.registration.showNotification("Lunaris Admin alerts enabled", {
    body: "Your admin app can show alerts on this device.",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag: "lunaris-admin-ready",
  });

  return { ok: true as const };
}
