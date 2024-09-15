// src/analyzers/relationshipAnalyzer.ts

import { DatabaseConnector } from "../connectors/baseConnector";
import { Table, Relationship, Column } from "../schemas/tableSchema";
import { logger } from "../utils/logger";

export class RelationshipAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async getRelationships(tables: Table[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    // Get explicit foreign key relationships
    for (const table of tables) {
      logger.log(`Fetching foreign keys for table: ${table.name}`);
      const foreignKeys = await this.connector.getForeignKeys(table.name);
      logger.log(`Foreign keys for ${table.name}:`, foreignKeys);

      for (const fk of foreignKeys) {
        if (fk.columnName && fk.referencedTable && fk.referencedColumn) {
          relationships.push({
            sourceTable: table.name,
            sourceColumn: fk.columnName,
            targetTable: fk.referencedTable,
            targetColumn: fk.referencedColumn,
            isInferred: false,
          });
        }
      }
    }

    // Infer additional relationships based on column names
    for (const sourceTable of tables) {
      for (const column of sourceTable.columns) {
        if (this.isPotentialForeignKey(column)) {
          const potentialTargetTable = this.getPotentialTargetTable(
            column.name,
            tables
          );
          if (potentialTargetTable) {
            const potentialTargetColumn =
              potentialTargetTable.primaryKeys[0] || "id";
            // Check if this relationship already exists as an explicit one
            const existingRelationship = relationships.find(
              (r) =>
                r.sourceTable === sourceTable.name &&
                r.sourceColumn === column.name &&
                r.targetTable === potentialTargetTable.name &&
                r.targetColumn === potentialTargetColumn
            );
            if (!existingRelationship) {
              relationships.push({
                sourceTable: sourceTable.name,
                sourceColumn: column.name,
                targetTable: potentialTargetTable.name,
                targetColumn: potentialTargetColumn,
                isInferred: true,
              });
            }
          }
        }
      }
    }

    return relationships;
  }

  private isPotentialForeignKey(column: Column): boolean {
    return (
      column.name.toLowerCase().endsWith("_id") ||
      column.name.toLowerCase() === "id"
    );
  }

  private getPotentialTargetTable(
    columnName: string,
    tables: Table[]
  ): Table | undefined {
    if (columnName.toLowerCase() === "id") return undefined; // 'id' is too generic to infer a relationship

    const potentialTableName = columnName.toLowerCase().endsWith("_id")
      ? columnName.slice(0, -3) // remove '_id' suffix
      : columnName;

    // TODO: What are the other scenarios we got to think about?
    return tables.find(
      (table) =>
        table.name.toLowerCase() === potentialTableName || // exact match
        table.name.toLowerCase() === `${potentialTableName}s` || // plural form
        potentialTableName === `${table.name.toLowerCase()}_id` // singular form of table name + '_id'
    );
  }
}
