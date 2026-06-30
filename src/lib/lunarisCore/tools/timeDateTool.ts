import { dateTool } from "./dateTool";
import { timeTool } from "./timeTool";

export function timeDateTool(message: string) {
  return [`Time: ${timeTool()} Asia/Manila`, `Date: ${dateTool(message)}`].join("\n");
}
