import type { AssistantModel } from "@/lib/assistantApi";

export function AssistantSettings({
  model,
  models,
  onModelChange,
}: {
  model: string;
  models: AssistantModel[];
  onModelChange: (model: string) => void;
}) {
  const fallbackModels = ["qwen2.5-coder:7b", "qwen2.5-coder:3b", "qwen3-coder"];
  const choices = models.length ? models.map((item) => item.name) : fallbackModels;
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.25em] text-purple-200">
      Model
      <select
        value={model}
        onChange={(event) => onModelChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-purple-300/20 bg-slate-950/80 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </label>
  );
}
