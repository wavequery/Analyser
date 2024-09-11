// src/utils/jsonExporter.ts

import fs from 'fs/promises';
import { Logger } from './logger';

export async function exportToJson(data: any, filename: string, logger: Logger): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filename, jsonString, 'utf-8');
  logger.log(`Data exported to ${filename}`);
}