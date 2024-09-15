// src/utils/jsonExporter.ts

import fs from "fs/promises";
import path from "path";
import { Logger } from "./logger";

export async function exportToJson(
  data: any,
  filename: string,
  logger: Logger
): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);

  // Ensure the directory exists
  const dir = path.dirname(filename);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filename, jsonString, "utf-8");
  logger.log(`Data exported to ${filename}`);
}
