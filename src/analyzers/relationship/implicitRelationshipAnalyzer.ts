import pluralize from "pluralize";
import { DatabaseConnector } from "../../connectors/baseConnector";

import { Table, Column } from "../../schemas/tableSchema";
import {Relationship} from '../../schemas/relationshipSchema';
import { SchemaConfig } from "../../schemas/schemaConfig";
import { logger } from "../../utils/logger";

export class ImplicitRelationshipAnalyzer {
  constructor(private config: SchemaConfig) {}

  async analyze(tables: Table[]): Promise<Relationship[]> {
    logger.log("Analyzing implicit relationships...");
    const relationships: Relationship[] = [];

    tables.forEach((sourceTable) => {
      sourceTable.columns
        .filter((column) => this.isPotentialForeignKey(column))
        .forEach((sourceColumn) => {
          const potentialTargetTables = this.getPotentialTargetTables(
            sourceColumn.name,
            tables
          );
          potentialTargetTables.forEach((targetTable) => {
            if (
              targetTable.name !== sourceTable.name ||
              this.isSelfReferencing(sourceColumn, sourceTable)
            ) {
              const targetColumn = this.findPotentialTargetColumn(
                targetTable,
                sourceColumn
              );
              if (
                targetColumn &&
                this.areTypesCompatible(sourceColumn, targetColumn)
              ) {
                const confidence = this.calculateConfidence(
                  sourceColumn,
                  sourceTable,
                  targetTable,
                  targetColumn
                );
                relationships.push({
                  sourceTable: sourceTable.name,
                  sourceColumns: [sourceColumn.name],
                  targetTable: targetTable.name,
                  targetColumns: [targetColumn.name],
                  isInferred: true,
                  confidence: confidence,
                  type: 'implicit'
                });
              }
            }
          });
        });
    });

    logger.log(
      `Implicit analysis complete. Found ${relationships.length} potential relationships.`
    );
    return relationships;
  }

  private isPotentialForeignKey(column: Column): boolean {
    const name = column.name.toLowerCase();
    return (
      this.config.foreignKeySuffixes.some(suffix => name.endsWith(suffix)) ||
      this.config.foreignKeyPrefixes.some(prefix => name.startsWith(prefix))
    );
  }

  private getPotentialTargetTables(
    columnName: string,
    tables: Table[]
  ): Table[] {
    const potentialNames = this.getPotentialTableNames(columnName);
    return tables.filter((table) =>
      potentialNames.includes(table.name.toLowerCase())
    );
  }

  private getPotentialTableNames(columnName: string): string[] {
    const name = columnName.toLowerCase();
    if (name === "id") return []; // 'id' is too generic to infer a relationship

    const potentialNames = new Set<string>();
    const suffixes = this.config.foreignKeySuffixes;
    const prefixes = this.config.foreignKeyPrefixes;

    for (const suffix of suffixes) {
      if (name.endsWith(suffix)) {
        const baseName = name.slice(0, -suffix.length);
        potentialNames.add(baseName);
        potentialNames.add(pluralize(baseName));
        break;
      }
    }

    for (const prefix of prefixes) {
      if (name.startsWith(prefix)) {
        const baseName = name.slice(prefix.length);
        potentialNames.add(baseName);
        potentialNames.add(pluralize(baseName));
        break;
      }
    }

    if (potentialNames.size === 0) {
      potentialNames.add(name);
      potentialNames.add(pluralize(name));
    }

    return Array.from(potentialNames);
  }

  private isSelfReferencing(column: Column, table: Table): boolean {
    return column.name.toLowerCase().includes(table.name.toLowerCase());
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

    return undefined;
  }

  private areTypesCompatible(column1: Column, column2: Column): boolean {
    return this.getBaseType(column1.type) === this.getBaseType(column2.type);
  }

  private getBaseType(type: string): string {
    return type.split("(")[0].toLowerCase();
  }

  private calculateConfidence(
    sourceColumn: Column,
    sourceTable: Table,
    targetTable: Table,
    targetColumn: Column
  ): number {
    let confidence = 0.5;

    if (sourceColumn.name.toLowerCase() === targetColumn.name.toLowerCase()) {
      confidence += 0.3;
    }

    if (
      sourceColumn.name
        .toLowerCase()
        .includes(targetTable.name.toLowerCase()) ||
      targetColumn.name.toLowerCase().includes(sourceTable.name.toLowerCase())
    ) {
      confidence += 0.2;
    }

    if (targetTable.primaryKeys?.includes(targetColumn.name)) {
      confidence += 0.2;
    }

    if (sourceColumn.type === targetColumn.type) {
      confidence += 0.1;
    }

    if (
      sourceColumn.name.toLowerCase() ===
        `${targetTable.name.toLowerCase()}_id` ||
      sourceColumn.name.toLowerCase() === `id_${targetTable.name.toLowerCase()}`
    ) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }
}