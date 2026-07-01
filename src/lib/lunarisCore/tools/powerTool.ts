type ToolCard = {
  title: string;
  body: string[];
};

import { renderCoreFeatureRegistry } from "../coreFeatureRegistry";

function render(title: string, cards: ToolCard[]) {
  return [
    title,
    ...cards.map((card) => [`\n${card.title}`, ...card.body.map((line) => `- ${line}`)].join("\n")),
  ].join("\n");
}

const extraIdeas = [
  "Discord/webhook alerts for new orders, failed delivery, and low stock.",
  "Role-based admin permissions audit with owner/admin/staff/viewer checks.",
  "One-click backup checklist for Supabase tables and product configs.",
  "Rollback helper that explains exactly what changed in the last deploy.",
  "SEO/storefront copy generator for ranks, bundles, and announcements.",
  "Suspicious activity detector for repeated GCash refs, duplicate accounts, and spam signups.",
  "RCON delivery simulator that previews commands before running them.",
  "Server announcement writer for Discord, website banners, and in-game broadcasts.",
  "Plugin/config knowledge vault for LuckPerms, Geyser, Floodgate, crates, and economy docs.",
  "Admin roadmap planner that turns ideas into prioritized build tasks.",
];

export function corePowerTool(message: string) {
  const text = message.toLowerCase();

  if (/250|1-250|two hundred fifty|100|chatgpt upgrades|1-100|one hundred/.test(text)) {
    return `Lunaris Core ChatGPT-style 1-250 upgrade registry\n\n${renderCoreFeatureRegistry()}`;
  }

  if (/30|suggestion|ideas|upgrade|what.*add/.test(text)) {
    return render("Lunaris Core upgrade pack", [
      {
        title: "Selected upgrades",
        body: [
          "Server-side memory in Supabase.",
          "Generated image library with permanent storage.",
          "Uploaded image analysis.",
          "File generation and export.",
          "SQL generator.",
          "RCON health checker.",
          "Live player list.",
          "Server TPS/status monitor.",
          "Order troubleshooting assistant.",
          "Checkout bug scanner.",
          "Product builder.",
          "Promo code builder.",
          "Rank command builder.",
          "Bundle builder.",
          "Admin logs summary.",
          "Website health scanner.",
          "Cloudflare deploy checker.",
          "Supabase schema scanner.",
          "Database duplicate checker.",
          "Customer account investigator.",
          "Email/password auth helper.",
          "GCash payment checklist.",
          "AI-generated admin reports.",
          "Knowledge upload system.",
          "Search inside project files.",
          "Auto-summarized chat memory.",
          "Saved prompts/templates.",
          "One-click fix plan generator.",
          "Mobile-friendly admin assistant page.",
        ],
      },
      { title: "10 extra upgrades that fit Lunaris best", body: extraIdeas },
    ]);
  }

  if (/sql/.test(text)) {
    return render("SQL generator mode", [
      {
        title: "How to use it",
        body: [
          "Tell Core the table and goal, for example: `make SQL to add a promo usage table`.",
          "Core should return safe SQL only, with `create table if not exists`, indexes, and RLS notes.",
          "It should not run SQL automatically. You paste it into Supabase SQL Editor after review.",
        ],
      },
    ]);
  }

  if (/product builder|add product|rank builder|key builder|bundle builder|promo code builder|rank command builder/.test(text)) {
    return render("Store builder mode", [
      {
        title: "Product fields Core should collect",
        body: ["Name", "Slug", "Category", "Price", "Description", "Commands", "Sort order", "Active/coming soon state"],
      },
      {
        title: "Approval flow",
        body: [
          "Core drafts the product JSON.",
          "Admin reviews the commands and price.",
          "Core gives Supabase insert/update SQL or admin form values.",
          "Nothing destructive happens without admin approval.",
        ],
      },
    ]);
  }

  if (/order troubleshoot|checkout|gcash|payment|account investigator|auth helper|password reset/.test(text)) {
    return render("Customer/order investigation mode", [
      {
        title: "Checks Core should run",
        body: [
          "Order status, total, item list, payment method, and reference number.",
          "Duplicate payment references or missing reference numbers.",
          "Account email verification and disabled state.",
          "Delivery log and failed RCON commands.",
          "Promo discount math and final total.",
        ],
      },
    ]);
  }

  if (/health|cloudflare|supabase|schema|duplicate|admin logs|deploy/.test(text)) {
    return render("Website health scanner", [
      {
        title: "Checks",
        body: [
          "Cloudflare build output directory and function routes.",
          "Missing Supabase env vars.",
          "Broken SPA redirects or asset MIME errors.",
          "Duplicate database rows and bad totals.",
          "Recent admin logs and risky changes.",
          "Checkout errors, image storage quota issues, and Core routing problems.",
        ],
      },
    ]);
  }

  if (/rcon|live player|players|tps|server status|minecraft/.test(text)) {
    return render("Minecraft operations mode", [
      {
        title: "Server checks",
        body: [
          "Public online/offline status and player count.",
          "RCON connection test.",
          "TPS command suggestion if supported by server plugins.",
          "LuckPerms rank command preview.",
          "Delivery simulator before approving commands.",
        ],
      },
    ]);
  }

  if (/knowledge upload|search.*project|memory|saved prompt|template|fix plan|mobile/.test(text)) {
    return render("Core productivity mode", [
      {
        title: "Features",
        body: [
          "Upload notes/configs/docs and save them as searchable knowledge.",
          "Search repo files by route, component, feature, or exact error.",
          "Summarize chat history into long-term memory.",
          "Save reusable prompts for reports, fixes, SQL, and product creation.",
          "Generate one-click fix plans with clear steps.",
          "Keep the mobile Core page clean and fixed-bottom input friendly.",
        ],
      },
    ]);
  }

  return render("Lunaris Core power tools", [
    {
      title: "Available tool groups",
      body: [
        "Store builders: products, ranks, promos, bundles, commands.",
        "Admin scanners: orders, accounts, logs, checkout, duplicates.",
        "Minecraft tools: status, players, RCON health, TPS checklist.",
        "Website tools: Cloudflare, Supabase, schema, project search.",
        "Creative tools: image generation, files, reports, saved prompts.",
      ],
    },
  ]);
}
