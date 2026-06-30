export function casualChatTool(message: string) {
  const text = message.toLowerCase();
  if (/what'?s happening|whats happening|what is happening/.test(text)) {
    return "I am here with you. The Core is awake, the chat is saving locally, and I can help you debug, build, research, check Minecraft status, scan admin data, or just talk through the next move.";
  }
  if (/how are you/.test(text)) {
    return "I am good, locked in, and ready to work. Tell me what we are fixing or building next.";
  }
  if (/you there/.test(text)) {
    return "Yeah, I am here. Send me the thing and I will handle it with you.";
  }
  return "I am here. Ask me anything about Lunaris Craft or whatever you are trying to figure out, and I will use the tools I actually have instead of guessing.";
}
