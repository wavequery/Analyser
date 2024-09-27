import { Table } from "../schemas/tableSchema";
import { Relationship } from "../schemas/relationshipSchema";

function isLikelyMetadata(columnName: string): boolean {
  const metadataPatterns = [
    /^(created|updated|modified)(_at)?$/i,
    /^(timestamp|date)$/i,
    /^(quantity|amount|price|cost)$/i,
    /^(status|type)$/i,
  ];
  return metadataPatterns.some((pattern) => pattern.test(columnName));
}

function isLikelyIdentifier(columnName: string): boolean {
  return /id$/i.test(columnName) && columnName.toLowerCase() !== "id";
}

export function detectJunctionTables(
  tables: Table[],
  relationships: Relationship[]
): string[] {
  const junctionTables: string[] = [];

  tables.forEach((table) => {
    // Get foreign keys for this table
    const foreignKeys = relationships.filter(
      (rel) => rel.sourceTable === table.name
    );

    // Check if the table has at least two foreign keys
    if (foreignKeys.length >= 2) {
      const totalColumns = table.columns.length;
      const primaryKeyColumns = table.primaryKeys.length;
      const foreignKeyColumns = new Set(
        foreignKeys.flatMap((fk) => fk.sourceColumns)
      ).size;

      // Count likely metadata columns
      const metadataColumns = table.columns.filter(
        (col) =>
          !table.primaryKeys.includes(col.name) &&
          !foreignKeys.some((fk) => fk.sourceColumns.includes(col.name)) &&
          (isLikelyMetadata(col.name) || isLikelyIdentifier(col.name))
      ).length;

      // Calculate the ratio of foreign key columns to total columns
      const foreignKeyRatio = foreignKeyColumns / totalColumns;

      // Calculate the ratio of non-key, non-metadata columns
      const nonKeyNonMetadataRatio =
        (totalColumns -
          primaryKeyColumns -
          foreignKeyColumns -
          metadataColumns) /
        totalColumns;

      // Determine if it's a junction table based on specific criteria
      if (
        foreignKeys.length >= 2 &&
        foreignKeyRatio >= 0.5 &&
        nonKeyNonMetadataRatio <= 0.2 &&
        totalColumns <= 7
      ) {
        junctionTables.push(table.name);
      }
    }
  });

  return junctionTables;
}
