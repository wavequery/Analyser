import { DatabaseConnector } from "../connectors/baseConnector";
import { Table, Relationship, Column } from "../schemas/tableSchema";
import { logger } from "../utils/logger";
import pluralize from "pluralize";

export class RelationshipAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async getRelationships(tables: Table[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    // Get explicit foreign key relationships
    relationships.push(...(await this.getExplicitForeignKeys(tables)));

    // Infer additional relationships based on naming conventions
    relationships.push(...this.getImplicitRelationships(tables));

    // Perform data-driven relationship inference if tables have entities
    if (tables.some((table) => table.columns.length > 0)) {
      relationships.push(...(await this.getDataDrivenRelationships(tables)));
    }

    // Deduplicate and score relationships
    return this.scoreAndDeduplicateRelationships(relationships);
  }

  private async getExplicitForeignKeys(
    tables: Table[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

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
            confidence: 1,
          });
        }
      }
    }

    return relationships;
  }

  private getImplicitRelationships(tables: Table[]): Relationship[] {
    const relationships: Relationship[] = [];

    for (const sourceTable of tables) {
      for (const sourceColumn of sourceTable.columns) {
        if (this.isPotentialForeignKey(sourceColumn)) {
          const potentialTargetTables = this.getPotentialTargetTables(
            sourceColumn.name,
            tables
          );
          for (const potentialTargetTable of potentialTargetTables) {
            if (
              potentialTargetTable.name !== sourceTable.name ||
              this.isSelfReferencing(sourceColumn, sourceTable)
            ) {
              const potentialTargetColumn = this.findPotentialTargetColumn(
                potentialTargetTable,
                sourceColumn
              );
              if (
                potentialTargetColumn &&
                this.areTypesCompatible(sourceColumn, potentialTargetColumn)
              ) {
                const confidence = this.calculateConfidence(
                  sourceColumn,
                  sourceTable,
                  potentialTargetTable,
                  potentialTargetColumn
                );
                relationships.push({
                  sourceTable: sourceTable.name,
                  sourceColumn: sourceColumn.name,
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

  private isArrayType(type: string): boolean {
    return type.toLowerCase().startsWith("array<");
  }

  private isSelfReferencing(column: Column, table: Table): boolean {
    return column.name.toLowerCase().includes(table.name.toLowerCase());
  }

  private areTypesCompatible(
    sourceColumn: Column,
    targetColumn: Column
  ): boolean {
    const sourceType = this.getBaseType(sourceColumn.type);
    const targetType = this.getBaseType(targetColumn.type);
    return sourceType === targetType;
  }

  private isPotentialForeignKey(column: Column): boolean {
    const name = column.name.toLowerCase();
    return (
      name.endsWith("_id") ||
      name.endsWith("id") ||
      name.startsWith("id_") ||
      name.endsWith("_key") ||
      name.endsWith("_code") ||
      name.endsWith("_num") ||
      name.startsWith("fk_") ||
      this.isArrayType(column.type)
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
    const suffixes = ["_id", "id", "_key", "_code", "_num"];
    const prefixes = ["id_", "fk_"];

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

  private getBaseType(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType.startsWith("array<")) {
      return this.getBaseType(lowerType.slice(6, -1));
    }
    if (lowerType.startsWith("struct<")) {
      return "struct";
    }
    return lowerType;
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

  private async getDataDrivenRelationships(
    tables: Table[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    const sampleSize = 1000;

    for (const sourceTable of tables) {
      for (const sourceColumn of sourceTable.columns) {
        if (this.isPotentialForeignKey(sourceColumn)) {
          const sourceData = await this.getSampleData(
            sourceTable.name,
            sourceColumn.name,
            sampleSize
          );

          for (const targetTable of tables) {
            if (
              targetTable.name !== sourceTable.name ||
              this.isSelfReferencing(sourceColumn, sourceTable)
            ) {
              for (const targetColumn of targetTable.columns) {
                if (this.areTypesCompatible(sourceColumn, targetColumn)) {
                  const targetData = await this.getSampleData(
                    targetTable.name,
                    targetColumn.name,
                    sampleSize
                  );

                  const matchPercentage = this.calculateMatchPercentage(
                    sourceData,
                    targetData
                  );

                  if (matchPercentage > 0.1) {
                    // Lower threshold for partial matches
                    relationships.push({
                      sourceTable: sourceTable.name,
                      sourceColumn: sourceColumn.name,
                      targetTable: targetTable.name,
                      targetColumn: targetColumn.name,
                      isInferred: true,
                      confidence: matchPercentage,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    return relationships;
  }

  private async getSampleData(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): Promise<Set<string>> {
    try {
      const query = `SELECT DISTINCT ${columnName} FROM ${tableName} LIMIT ${sampleSize}`;
      const result = await this.connector.query(query);
      return new Set(
        result.flatMap((row) => {
          const value = row[columnName];
          if (Array.isArray(value)) {
            return value.map((v) => v.toString());
          }
          return value?.toString() ?? "";
        })
      );
    } catch (error) {
      logger.error(
        `Error getting sample data for ${tableName}.${columnName}:`,
        error
      );
      return new Set();
    }
  }

  private calculateMatchPercentage(
    sourceData: Set<string>,
    targetData: Set<string>
  ): number {
    const intersection = new Set(
      [...sourceData].filter((x) => targetData.has(x))
    );
    return intersection.size / Math.min(sourceData.size, targetData.size);
  }

  private scoreAndDeduplicateRelationships(
    relationships: Relationship[]
  ): Relationship[] {
    const uniqueRelationships = new Map<string, Relationship>();

    for (const rel of relationships) {
      const key = `${rel.sourceTable}:${rel.sourceColumn}->${rel.targetTable}:${rel.targetColumn}`;
      const existingRel = uniqueRelationships.get(key);

      if (
        !existingRel ||
        (existingRel.isInferred && !rel.isInferred) ||
        (existingRel.isInferred &&
          rel.isInferred &&
          (rel.confidence ?? 0) > (existingRel.confidence ?? 0))
      ) {
        uniqueRelationships.set(key, rel);
      }
    }
    return Array.from(uniqueRelationships.values()).sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );
  }
}
