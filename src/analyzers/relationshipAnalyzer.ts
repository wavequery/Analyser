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
        if (this.isPotentialForeignKey(column) || this.isNameMatch(column, tables)) {
          const potentialTargetTable = this.getPotentialTargetTable(column.name, tables);
          if (potentialTargetTable && potentialTargetTable.name !== sourceTable.name) {
            const potentialTargetColumn = this.findPotentialTargetColumn(potentialTargetTable, column);
            if (potentialTargetColumn) {
              const confidence = this.calculateConfidence(column.name, potentialTargetTable.name);
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
                  confidence: confidence,
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
    return name.endsWith("_id") || name.endsWith("id") || name.startsWith("id_");
  }

  private isNameMatch(column: Column, tables: Table[]): boolean {
    const name = column.name.toLowerCase();
    return tables.some(table => 
      name === table.name.toLowerCase() || 
      name === table.name.toLowerCase().slice(0, -1) // singular form
    );
  }

  private getPotentialTargetTable(columnName: string, tables: Table[]): Table | undefined {
    const potentialNames = this.getPotentialTableNames(columnName);
    return tables.find((table) => potentialNames.includes(table.name.toLowerCase()));
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
    } else {
      potentialNames.push(name);
      potentialNames.push(name + "s"); // plural form
    }

    return potentialNames;
  }

  private findPotentialTargetColumn(targetTable: Table, sourceColumn: Column): Column | undefined {
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

  private calculateConfidence(columnName: string, tableName: string): number {
    const columnLower = columnName.toLowerCase();
    const tableLower = tableName.toLowerCase();

    if (columnLower === tableLower + "_id" || columnLower === "id_" + tableLower) {
      return 1; // Highest confidence for exact match with _id prefix/suffix
    }

    if (columnLower === tableLower || columnLower === tableLower.slice(0, -1)) {
      return 0.9; // High confidence for exact name match or singular form
    }

    if (columnLower.includes(tableLower) || tableLower.includes(columnLower)) {
      return 0.7; // Medium confidence for partial matches
    }

    return 0.5; // Low confidence for other inferred relationships
  }
}