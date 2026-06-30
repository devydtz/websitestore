export type LunarisCitation = {
  label: string;
  url?: string;
  detail?: string;
};

export function citationLine(citation: LunarisCitation) {
  const url = citation.url ? ` - ${citation.url}` : "";
  const detail = citation.detail ? ` (${citation.detail})` : "";
  return `${citation.label}${detail}${url}`;
}
