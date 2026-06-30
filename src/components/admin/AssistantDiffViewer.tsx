export function AssistantDiffViewer({ diff }: { diff?: string }) {
  if (!diff) return null;
  return (
    <div className="rounded-3xl border border-purple-300/20 bg-black/50 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-purple-200">Proposed diff</div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-purple-50">{diff}</pre>
    </div>
  );
}
