import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { deleteAdminRow, listAdminRows, saveAdminRow, type AdminProfile, type AdminRole } from "@/lib/adminData";

const roles: AdminRole[] = ["owner", "admin", "staff", "viewer"];

export function AdminAdminsPage() {
  const [rows, setRows] = useState<AdminProfile[]>([]);
  const [id, setId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRole>("viewer");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await listAdminRows<AdminProfile>("admin_profiles");
    if (result.ok) setRows(result.rows);
    else setMessage(result.error);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await saveAdminRow("admin_profiles", { id, display_name: displayName, role, avatar_url: null });
    setMessage(result.ok ? "Admin profile saved." : result.error);
    await load();
  }

  async function remove(adminId: string) {
    const result = await deleteAdminRow("admin_profiles", adminId);
    setMessage(result.ok ? "Admin access removed." : result.error);
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <AdminCard>
        <h2 className="text-2xl font-black">Admin Profiles</h2>
        {message && <div className="mt-4 rounded-2xl border border-purple-300/20 bg-purple-300/10 p-3 text-sm">{message}</div>}
        <div className="mt-5 space-y-3">
          {rows.length === 0 && <div className="rounded-3xl border border-dashed border-purple-300/20 p-8 text-center text-purple-100/55">No admin profiles yet.</div>}
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black">{row.display_name || row.id}</p>
                <p className="text-sm text-purple-100/60">{row.role} · {row.id}</p>
              </div>
              <button onClick={() => remove(row.id)} className="rounded-full border border-red-300/20 px-3 py-2 text-red-100 hover:bg-red-400/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </AdminCard>
      <AdminCard>
        <h2 className="text-xl font-black">Add admin role</h2>
        <p className="mt-2 text-sm text-purple-100/60">Paste the Supabase auth user UUID. Only owners can save this because RLS protects it.</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Input label="User UUID" value={id} onChange={setId} required />
          <Input label="Display name" value={displayName} onChange={setDisplayName} />
          <label className="block text-xs font-bold uppercase tracking-[0.2em] text-purple-100/65">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as AdminRole)} className="mt-2 w-full rounded-2xl border border-purple-300/20 bg-black/35 px-4 py-3 text-sm outline-none">
              {roles.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="w-full rounded-full bg-purple-200 px-4 py-3 font-black text-slate-950">
            <Plus className="mr-2 inline h-4 w-4" />
            Save admin
          </button>
        </form>
      </AdminCard>
    </div>
  );
}

function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-purple-100/65">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-2 w-full rounded-2xl border border-purple-300/20 bg-black/35 px-4 py-3 text-sm outline-none" />
    </label>
  );
}
