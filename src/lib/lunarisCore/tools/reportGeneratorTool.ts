export function reportGeneratorTool(title: string, sections: string[]) {
  return [`# ${title}`, "", ...sections.filter(Boolean)].join("\n\n");
}
