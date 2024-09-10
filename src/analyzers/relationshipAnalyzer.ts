// src/analyzers/relationshipAnalyzer.ts

import { DatabaseConnector } from '../connectors/baseConnector';
import { Table, Relationship } from '../schemas/tableSchema';

export class RelationshipAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async getRelationships(tables: Table[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    for (const table of tables) {
      const foreignKeys = await this.connector.getForeignKeys(table.name);
      for (const fk of foreignKeys) {
        relationships.push({
          sourceTable: table.name,
          sourceColumn: fk.columnName,
          targetTable: fk.referencedTable,
          targetColumn: fk.referencedColumn
        });
      }
    }

    return relationships;
  }
}