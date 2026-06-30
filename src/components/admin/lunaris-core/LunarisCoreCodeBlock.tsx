export function LunarisCoreCodeBlock({ code }: { code: string }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
      <code>{code}</code>
    </pre>
  );
}
