import { Table, Relationship } from "../schemas/tableSchema";

export function detectJunctionTables(
  tables: Table[],
  relationships: Relationship[]
): string[] {
  const junctionTables: string[] = [];

  tables.forEach((table) => {
    // Check if the table has at least two foreign keys
    const foreignKeys = relationships.filter(
      (rel) => rel.sourceTable === table.name
    );
    if (foreignKeys.length >= 2) {
      // Check if the majority of columns are either part of a primary key or a foreign key
      const keyColumns = table.columns.filter(
        (col) =>
          table.primaryKeys.includes(col.name) ||
          foreignKeys.some((fk) => fk.sourceColumn === col.name)
      );

      if (keyColumns.length >= table.columns.length * 0.6) {
        // At least 60% of columns are keys
        junctionTables.push(table.name);
      }
    }
  });

  return junctionTables;
}
