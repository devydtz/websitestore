export function hasMarkdown(value: string) {
  return /```|\|.+\||^#{1,6}\s|^\s*[-*]\s/m.test(value);
}
