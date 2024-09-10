// src/analyzers/schemaAnalyzer.ts

import { DatabaseConnector } from '../connectors/baseConnector';
import { Table, Column } from '../schemas/tableSchema';

export class SchemaAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async getTables(): Promise<Table[]> {
    const tableNames = await this.connector.getTables();
    const tables: Table[] = [];

    for (const tableName of tableNames) {
      const columns = await this.getColumns(tableName);
      const primaryKeys = await this.connector.getPrimaryKeys(tableName);
      tables.push({ name: tableName, columns, primaryKeys });
    }

    return tables;
  }

  private async getColumns(tableName: string): Promise<Column[]> {
    const columnInfos = await this.connector.getColumns(tableName);
    return columnInfos.map(info => ({
      name: info.name,
      type: info.type,
      isNullable: info.isNullable
    }));
  }
}