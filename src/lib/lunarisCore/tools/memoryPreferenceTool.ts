import { savePinnedCoreNote } from "../memoryStore";

export function memoryPreferenceTool(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean) savePinnedCoreNote(clean);

  if (/\b(don'?t|do not|stop|never)\s+(repeat|copy|say the same|loop)\b/i.test(message)) {
    return "Got it. I will stop repeating the same response and I will change the answer when you correct me.";
  }

  if (/\b(call me|my name is)\b/i.test(message)) {
    return "Got it. I saved that as a chat preference for this browser.";
  }

  return "Got it. I saved that preference for future replies in this browser.";
}
