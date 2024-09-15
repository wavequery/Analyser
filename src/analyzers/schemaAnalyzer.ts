// src/analyzers/schemaAnalyzer.ts

import { DatabaseConnector } from "../connectors/baseConnector";
import { Table, Column } from "../schemas/tableSchema";
import { logger } from "../utils/logger";

export class SchemaAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async getTables(): Promise<Table[]> {
    const tableNames = await this.connector.getTables();
    logger.log("Table names received in SchemaAnalyzer:", tableNames);
    const tables: Table[] = [];

    for (const tableName of tableNames) {
      logger.log(`Processing table: ${tableName}`);
      try {
        const columns = await this.getColumns(tableName);
        const primaryKeys = this.getPrimaryKeys(tableName, columns);
        tables.push({ name: tableName, columns, primaryKeys });
      } catch (error) {
        logger.error(`Error processing table ${tableName}:`, error);
      }
    }

    return tables;
  }

  private async getColumns(tableName: string): Promise<Column[]> {
    const columnInfos = await this.connector.getColumns(tableName);
    return columnInfos.map((info) => ({
      name: info.name || "",
      type: info.type || "",
      isNullable: info.isNullable || false,
      isPrimaryKey: info.isPrimaryKey || false,
    }));
  }

  private getPrimaryKeys(tableName: string, columns: Column[]): string[] {
    const primaryKeys = columns
      .filter((col) => col.isPrimaryKey)
      .map((col) => col.name);

    if (primaryKeys.length === 0) {
      // If no primary key is explicitly defined, check if there's an 'id' column
      const idColumn = columns.find(
        (column) => column.name && column.name.toLowerCase() === "id"
      );
      if (idColumn) {
        logger.log(`Inferred primary key 'id' for ${tableName}`);
        return [idColumn.name];
      }
    }

    logger.log(`Primary keys for ${tableName}:`, primaryKeys);
    return primaryKeys;
  }
}
