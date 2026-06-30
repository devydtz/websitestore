import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import {
  Boxes,
  ClipboardList,
  Gem,
  Home,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Logs,
  Package,
  Settings,
  Shield,
  Sparkles,
  UserCog,
} from "lucide-react";
import { AssistantFloatingButton } from "./AssistantFloatingButton";
import { getCurrentAdminProfile, type AdminProfile } from "@/lib/adminData";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/requests", label: "Requests", icon: ClipboardList },
  { to: "/admin/ranks", label: "Ranks", icon: Shield },
  { to: "/admin/crates", label: "Crates", icon: Boxes },
  { to: "/admin/keys", label: "Keys", icon: KeyRound },
  { to: "/admin/bundles", label: "Bundles", icon: Package },
  { to: "/admin/cosmetics", label: "Cosmetics", icon: Gem },
  { to: "/admin/admins", label: "Admins", icon: UserCog },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/logs", label: "Logs", icon: Logs },
  { to: "/admin/assistant", label: "Assistant", icon: Sparkles },
] as const;

export function AdminShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const location = useLocation();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getCurrentAdminProfile().then((result) => {
      if (!mounted) return;
      if (result.ok) setProfile(result.profile);
      else setError(result.error);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060211] text-white">
        <AdminSpaceBackground />
        <div className="relative z-10 grid min-h-screen place-items-center">
          <div className="flex items-center gap-3 rounded-3xl border border-purple-300/20 bg-black/40 px-6 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-purple-200" />
            Loading private admin panel...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#060211] text-white">
        <AdminSpaceBackground />
        <div className="relative z-10 grid min-h-screen place-items-center px-6">
          <div className="max-w-lg rounded-[2rem] border border-red-300/25 bg-red-950/20 p-8 text-center shadow-2xl">
            <Shield className="mx-auto h-12 w-12 text-red-200" />
            <h1 className="mt-4 text-3xl font-black">Admin access required</h1>
            <p className="mt-3 text-purple-100/75">
              {error || "Sign in with a Supabase user that has an admin profile."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/account" className="rounded-full bg-purple-200 px-5 py-3 font-bold text-slate-950">
                Sign in
              </Link>
              <Link to="/" className="rounded-full border border-white/15 px-5 py-3 font-bold">
                Store home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060211] text-white">
      <AdminSpaceBackground />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-purple-300/10 bg-black/25 p-5 backdrop-blur-xl lg:block">
          <Link to="/" className="mb-8 flex items-center gap-3 text-lg font-black">
            <Sparkles className="h-6 w-6 text-purple-200" />
            Lunaris Admin
          </Link>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    active ? "bg-purple-200 text-slate-950" : "text-purple-100/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 rounded-[2rem] border border-purple-300/15 bg-black/30 p-5 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link to="/" className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-purple-200">
                  <Home className="h-3 w-3" />
                  mclunaris.store
                </Link>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
                {subtitle && <p className="mt-2 text-purple-100/70">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-sm font-bold text-purple-50">
                  {profile.display_name || "Admin"}
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100">
                  {profile.role}
                </span>
              </div>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {nav.map((item) => (
                <Link key={item.to} to={item.to} className="shrink-0 rounded-full border border-purple-300/15 bg-white/5 px-4 py-2 text-sm font-bold">
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          {children}
        </main>
      </div>
      <AssistantFloatingButton currentPage={location.pathname} />
    </div>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[2rem] border border-purple-300/15 bg-black/30 p-5 shadow-xl shadow-purple-950/10 backdrop-blur-xl ${className}`}>{children}</section>;
}

function AdminSpaceBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,87,255,0.25),transparent_32%),linear-gradient(180deg,#15113d_0%,#070311_55%,#04020b_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1.5px),radial-gradient(circle,rgba(205,188,255,0.75)_1px,transparent_1.3px)] [background-position:0_0,42px_70px] [background-size:120px_120px,190px_190px]" />
      <div className="absolute left-[8%] top-[18%] h-px w-40 rotate-[22deg] animate-pulse bg-gradient-to-r from-transparent via-purple-100 to-transparent shadow-[0_0_24px_rgba(216,198,255,0.9)]" />
      <div className="absolute right-[14%] top-[35%] h-px w-56 rotate-[18deg] animate-pulse bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_24px_rgba(216,198,255,0.9)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}
