const quickActions = [
  "What time is it?",
  "What is today's date?",
  "Calculate 10% of 499",
  "Scan orders",
  "Analyze all admin data",
  "Find duplicates and anomalies",
  "Scan accounts",
  "Scan promos",
  "Scan ranks keys bundles",
  "Make a weekly sales report",
  "Explain current admin panel",
  "Find risky code",
  "Suggest next store upgrades",
  "What do you know?",
  "Minecraft RCON help",
  "Search Modrinth plugins",
  "Heavy coding debug help",
  "Security checklist",
  "Where is checkout code?",
  "Where is admin code?",
  "Why would Cloudflare build fail?",
];

export function LunarisCoreQuickActions({ onPick, disabled }: { onPick: (value: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {quickActions.map((action) => (
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
  );
}
