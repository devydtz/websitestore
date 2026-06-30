import { dataAnalysisTool } from "./tools/dataAnalysisTool";

export async function scanDatabase(message: string) {
  return dataAnalysisTool(message);
}
