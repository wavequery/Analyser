// src/utils/jsonExporter.ts

import fs from 'fs/promises';

export async function exportToJson(data: any, filename: string): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filename, jsonString, 'utf-8');
  console.log(`Data exported to ${filename}`);
}