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
            const potentialTargetColumn = this.findPotentialTargetColumn(
              potentialTargetTable,
              column
            );
            if (potentialTargetColumn) {
              // Check if this relationship already exists as an explicit one
              const existingRelationship = relationships.find(
                (r) =>
                  r.sourceTable === sourceTable.name &&
                  r.sourceColumn === column.name &&
                  r.targetTable === potentialTargetTable.name &&
                  r.targetColumn === potentialTargetColumn.name
              );
              if (!existingRelationship) {
                relationships.push({
                  sourceTable: sourceTable.name,
                  sourceColumn: column.name,
                  targetTable: potentialTargetTable.name,
                  targetColumn: potentialTargetColumn.name,
                  isInferred: true,
                });
              }
            }
          }
        }
      }
    }

    return relationships;
  }

  private isPotentialForeignKey(column: Column): boolean {
    const name = column.name.toLowerCase();
    return (
      name.endsWith("_id") || name.endsWith("id") || name.startsWith("id_")
    );
  }

  private getPotentialTargetTable(
    columnName: string,
    tables: Table[]
  ): Table | undefined {
    const potentialNames = this.getPotentialTableNames(columnName);
    return tables.find((table) =>
      potentialNames.includes(table.name.toLowerCase())
    );
  }

  private getPotentialTableNames(columnName: string): string[] {
    const name = columnName.toLowerCase();
    if (name === "id") return []; // 'id' is too generic to infer a relationship

    const potentialNames = [];
    if (name.endsWith("_id")) {
      potentialNames.push(name.slice(0, -3)); // remove '_id' suffix
      potentialNames.push(name.slice(0, -3) + "s"); // plural form
    } else if (name.endsWith("id")) {
      potentialNames.push(name.slice(0, -2)); // remove 'id' suffix
      potentialNames.push(name.slice(0, -2) + "s"); // plural form
    } else if (name.startsWith("id_")) {
      potentialNames.push(name.slice(3)); // remove 'id_' prefix
      potentialNames.push(name.slice(3) + "s"); // plural form
    }

    return potentialNames;
  }

  private findPotentialTargetColumn(
    targetTable: Table,
    sourceColumn: Column
  ): Column | undefined {
    // First, check for primary keys
    if (targetTable.primaryKeys && targetTable.primaryKeys.length > 0) {
      const primaryKeyColumn = targetTable.columns.find(
        (col) => col.name === targetTable.primaryKeys[0]
      );
      if (primaryKeyColumn) return primaryKeyColumn;
    }

    // Then, look for an exact match
    const exactMatch = targetTable.columns.find(
      (col) => col.name.toLowerCase() === sourceColumn.name.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Then, look for 'id' or '{table_name}_id'
    const idColumn = targetTable.columns.find(
      (col) =>
        col.name.toLowerCase() === "id" ||
        col.name.toLowerCase() === `${targetTable.name.toLowerCase()}_id`
    );
    if (idColumn) return idColumn;

    // If no match found, return undefined
    return undefined;
  }

  // TODO: TO BE THOUGHT ABOUT
  //
  // private getPotentialTargetTable(
  //   columnName: string,
  //   tables: Table[]
  // ): Table | undefined {
  //   if (columnName.toLowerCase() === "id") return undefined; // 'id' is too generic to infer a relationship

  //   const potentialTableName = columnName.toLowerCase().endsWith("_id")
  //     ? columnName.slice(0, -3) // remove '_id' suffix
  //     : columnName;

  //   // TODO: What are the other scenarios we got to think about?
  //   // We can do categories and category_id
  //   return tables.find(
  //     (table) =>
  //       table.name.toLowerCase() === potentialTableName || // exact match
  //       table.name.toLowerCase() === `${potentialTableName}s` || // plural form
  //       potentialTableName === `${table.name.toLowerCase()}_id` // singular form of table name + '_id'
  //   );
  // }
}
