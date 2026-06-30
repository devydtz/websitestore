export function imageGeneratorTool() {
  return [
    "Image generation needs an image model endpoint connected to Lunaris Core first.",
    "The chat already supports image uploads and previews, but I will not fake generated images.",
    "Best next setup: add a Cloudflare Workers AI image endpoint, then Core can return a generated image preview and download button here.",
  ].join("\n");
}
