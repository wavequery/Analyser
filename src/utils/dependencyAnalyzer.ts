// src/utils/dependencyAnalyzer.ts

import { Table, Relationship } from "../schemas/tableSchema";

export function identifyCircularDependencies(
  tables: Table[],
  relationships: Relationship[]
): string[][] {
  const graph: Map<string, string[]> = new Map();
  tables.forEach((table) => graph.set(table.name, []));

  // Only use explicit relationships for circular dependency detection
  relationships
    .filter((rel) => !rel.isInferred)
    .forEach((rel) => {
      if (graph.has(rel.sourceTable)) {
        graph.get(rel.sourceTable)!.push(rel.targetTable);
      }
    });

  const cycles: string[][] = [];
  const visited: Set<string> = new Set();
  const recursionStack: Set<string> = new Set();

  function dfs(node: string, path: string[] = []): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycle = path.slice(path.indexOf(neighbor));
        cycles.push(cycle);
      }
    }

    recursionStack.delete(node);
  }

  tables.forEach((table) => {
    if (!visited.has(table.name)) {
      dfs(table.name);
    }
  });

  return cycles;
}
