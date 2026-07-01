const quickActionGroups = [
  {
    label: "Core",
    actions: [
      "Show Lunaris Core upgrade pack with 30 features and 10 extra ideas",
      "Show Lunaris Core ChatGPT upgrades 1-250",
      "Run Core health check",
      "Summarize this chat into long-term memory",
      "Create a one-click fix plan",
      "Save this as a reusable prompt template",
      "Search inside project files",
      "Generate an admin report",
    ],
  },
  {
    label: "Store",
    actions: [
      "Product builder",
      "Promo code builder",
      "Rank command builder",
      "Bundle builder",
      "Checkout bug scanner",
      "GCash payment checklist",
    ],
  },
  {
    label: "Admin",
    actions: [
      "Order troubleshooting assistant",
      "Order investigator",
      "Player investigator",
      "How many rejected orders?",
      "Customer account investigator",
      "Admin logs summary",
      "Database duplicate checker",
      "Supabase schema scanner",
      "Email and password auth helper",
    ],
  },
  {
    label: "Website",
    actions: [
      "Website health scanner",
      "Cloudflare deploy checker",
      "Database doctor",
      "Checkout doctor",
      "SQL generator",
      "File generation and export",
      "Read uploaded files and answer from them",
      "Analyze uploaded images and screenshots",
      "Knowledge upload system",
      "Mobile admin assistant checklist",
      "PWA iPhone install guide",
    ],
  },
  {
    label: "Minecraft",
    actions: [
      "RCON health checker",
      "Live player list",
      "Check Minecraft server status",
      "Server TPS status monitor",
      "RCON delivery simulator",
      "Server announcement writer",
      "Plugin config knowledge vault",
    ],
  },
  {
    label: "Extra",
    actions: [
      "Discord webhook alerts plan",
      "Admin permissions audit",
      "Supabase backup checklist",
      "Rollback helper",
      "SEO storefront copy generator",
      "Suspicious activity detector",
      "Admin roadmap planner",
    ],
  },
];

export function LunarisCoreQuickActions({ onPick, disabled }: { onPick: (value: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {quickActionGroups.map((group) => (
        <div key={group.label} className="flex shrink-0 items-center gap-2 rounded-2xl border border-purple-200/10 bg-white/[0.04] px-2 py-2">
          <span className="px-2 text-[11px] font-black uppercase tracking-[0.16em] text-purple-100/55">{group.label}</span>
          {group.actions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={disabled}
              onClick={() => onPick(action)}
              className="shrink-0 rounded-full border border-purple-200/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-purple-100 transition hover:border-purple-200/35 hover:bg-purple-200/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
