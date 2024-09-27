import { Table } from "../schemas/tableSchema";
import { Relationship } from "../schemas/relationshipSchema";

export function topologicalSort(
  tables: Table[],
  relationships: Relationship[]
): Table[] {
  const graph: Map<string, Set<string>> = new Map();
  const inDegree: Map<string, number> = new Map();

  // Initialize graph and inDegree
  for (const table of tables) {
    graph.set(table.name, new Set());
    inDegree.set(table.name, 0);
  }

  // Build the graph
  for (const rel of relationships) {
    if (rel.sourceTable !== rel.targetTable) {
      // Ignore self-references
      graph.get(rel.sourceTable)!.add(rel.targetTable);
      inDegree.set(rel.targetTable, (inDegree.get(rel.targetTable) || 0) + 1);
    }
  }

  // Find all sources (tables with inDegree 0)
  const queue: string[] = [];
  for (const [tableName, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(tableName);
  }

  const result: string[] = [];
  const visited: Set<string> = new Set();

  // Process the queue
  while (queue.length > 0) {
    const tableName = queue.shift()!;
    result.push(tableName);
    visited.add(tableName);

    for (const dependent of graph.get(tableName)!) {
      inDegree.set(dependent, inDegree.get(dependent)! - 1);
      if (inDegree.get(dependent) === 0) {
        queue.push(dependent);
      }
    }
  }

  // Handle remaining tables (those involved in cycles)
  for (const table of tables) {
    if (!visited.has(table.name)) {
      result.push(table.name);
    }
  }

  // Return the sorted tables
  return result.map((name) => tables.find((t) => t.name === name)!);
}
