export function casualChatTool(message: string) {
  const text = message.toLowerCase();
  if (/^(wsp|wsup|wassup|sup|yo|hey|hi|hello)\b/.test(text.trim())) {
    return "Yo, I am here. What are we fixing or building next?";
  }
  if (/^(wyd|what you doing)\b/.test(text.trim())) {
    return "I am locked in on Lunaris Core. Send the next thing and I will work it out with you.";
  }
  if (/\b(good\s*boy|goodboy|nice|cool|thanks|thank you|ty)\b/.test(text)) {
    return "Appreciate you. I am here and ready for the next thing.";
  }
  if (/\b(what are u repeating|what are you repeating|why repeat|repeating)\b/.test(text)) {
    return "You are right. That repeat guard was firing wrong. I will answer the actual message now instead of looping that line.";
  }
  if (/what'?s happening|whats happening|what is happening/.test(text)) {
    return "I am here with you. The Core is awake, the chat is saving locally, and I can help you debug, build, research, check Minecraft status, scan admin data, or just talk through the next move.";
  }
  if (/how are you/.test(text)) {
    return "I am good, locked in, and ready to work. Tell me what we are fixing or building next.";
  }
  if (/you there/.test(text)) {
    return "Yeah, I am here. Send me the thing and I will handle it with you.";
  }
  return "Yeah, I got you. Say it however you want, even slang or typos, and I will figure out what you mean.";
}
