import { Table, Relationship } from "../schemas/tableSchema";

export function detectJunctionTables(
  tables: Table[],
  relationships: Relationship[]
): string[] {
  const junctionTables: string[] = [];

  tables.forEach((table) => {
    // Check if the table has exactly two foreign keys
    const foreignKeys = relationships.filter(
      (rel) => rel.sourceTable === table.name
    );
    if (foreignKeys.length === 2) {
      // Check if the table has no other columns besides the primary key and foreign keys
      const nonKeyColumns = table.columns.filter(
        (col) =>
          !table.primaryKeys.includes(col.name) &&
          !foreignKeys.some((fk) => fk.sourceColumn === col.name)
      );

      if (nonKeyColumns.length === 0) {
        junctionTables.push(table.name);
      }
    }
  });

  return junctionTables;
}
