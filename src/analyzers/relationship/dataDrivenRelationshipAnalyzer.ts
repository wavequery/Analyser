import NodeCache from "node-cache";

import { DatabaseConnector } from "../../connectors/baseConnector";
import { Table, Column } from "../../schemas/tableSchema";
import { Relationship } from "../../schemas/relationshipSchema";
import { SamplingStrategy } from "../samplingStrategy/samplingStrategy";
import { SchemaConfig } from "../../schemas/schemaConfig";

import { logger } from "../../utils/logger";

export class DataDrivenRelationshipAnalyzer {
  private cache: NodeCache;

  constructor(
    private connector: DatabaseConnector,
    private samplingStrategy: SamplingStrategy,
    private config: SchemaConfig,
    private sampleSize: number = 100,
    private confidenceThreshold: number = 0.5,
    private cacheTTL: number = 3600
  ) {
    this.cache = new NodeCache({ stdTTL: this.cacheTTL, checkperiod: 120 });
    logger.log("DataDrivenRelationshipAnalyzer initialized");
  }

  async analyze(tables: Table[]): Promise<Relationship[]> {
    logger.log("Starting data-driven relationship analysis...");
    const startTime = Date.now();
    const relationships: Relationship[] = [];

    try {
      const potentialRelationships =
        this.identifyPotentialRelationships(tables);
      logger.log(
        `Identified ${potentialRelationships.length} potential relationships for analysis.`
      );

      for (const [
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
      ] of potentialRelationships) {
        const cacheKey = `${sourceTable}:${sourceColumn}:${targetTable}:${targetColumn}`;
        const cachedRelationship = this.cache.get<Relationship>(cacheKey);

        if (cachedRelationship) {
          logger.log(`Using cached relationship for ${cacheKey}`);
          relationships.push(cachedRelationship);
          continue;
        }

        logger.log(`Checking relationship: ${cacheKey}`);
        const confidence = await this.checkRelationship(
          sourceTable,
          sourceColumn,
          targetTable,
          targetColumn
        );

        if (confidence > this.confidenceThreshold) {
          const relationship: Relationship = {
            sourceTable,
            sourceColumns: [sourceColumn],
            targetTable,
            targetColumns: [targetColumn],
            isInferred: true,
            confidence,
          };
          relationships.push(relationship);
          this.cache.set(cacheKey, relationship);
          logger.log(
            `Found relationship: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn} (confidence: ${confidence.toFixed(
              2
            )})`
          );
        } else {
          logger.log(
            `Relationship not found: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn} (confidence: ${confidence.toFixed(
              2
            )})`
          );
        }
      }
    } catch (error) {
      logger.error("Error during data-driven relationship analysis:", error);
    }

    const endTime = Date.now();
    logger.log(
      `Data-driven analysis complete. Found ${
        relationships.length
      } relationships in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`
    );
    return relationships;
  }

  private identifyPotentialRelationships(
    tables: Table[]
  ): [string, string, string, string][] {
    logger.log("Identifying potential relationships");
    const potentialRelationships: [string, string, string, string][] = [];

    tables.forEach((sourceTable) => {
      sourceTable.columns
        .filter(this.isPotentialForeignKey.bind(this))
        .forEach((sourceColumn) => {
          tables.forEach((targetTable) => {
            if (
              sourceTable.name !== targetTable.name ||
              this.isSelfReferencing(sourceColumn, sourceTable)
            ) {
              const targetColumn = this.findPotentialTargetColumn(targetTable);
              if (targetColumn) {
                potentialRelationships.push([
                  sourceTable.name,
                  sourceColumn.name,
                  targetTable.name,
                  targetColumn.name,
                ]);
                logger.log(
                  `Potential relationship identified: ${sourceTable.name}.${sourceColumn.name} -> ${targetTable.name}.${targetColumn.name}`
                );
              }
            }
          });
        });
    });

    logger.log(`Identified ${potentialRelationships.length} potential relationships`);
    return potentialRelationships;
  }

  private isPotentialForeignKey(column: Column): boolean {
    const name = column.name.toLowerCase();
    const isPotential = this.config.foreignKeySuffixes.some((suffix) => name.endsWith(suffix)) ||
      this.config.foreignKeyPrefixes.some((prefix) => name.startsWith(prefix));
    logger.log(`Column ${column.name} is${isPotential ? '' : ' not'} a potential foreign key`);
    return isPotential;
  }

  private isSelfReferencing(column: Column, table: Table): boolean {
    const isSelf = column.name.toLowerCase().includes(table.name.toLowerCase());
    logger.log(`Column ${column.name} is${isSelf ? '' : ' not'} self-referencing in table ${table.name}`);
    return isSelf;
  }

  private findPotentialTargetColumn(table: Table): Column | undefined {
    const targetColumn = table.columns.find(
      (column) =>
        this.config.primaryKeySuffixes.some((suffix) =>
          column.name.toLowerCase().endsWith(suffix)
        ) ||
        this.config.primaryKeyPrefixes.some((prefix) =>
          column.name.toLowerCase().startsWith(prefix)
        )
    );
    if (targetColumn) {
      logger.log(`Found potential target column ${targetColumn.name} in table ${table.name}`);
    } else {
      logger.log(`No potential target column found in table ${table.name}`);
    }
    return targetColumn;
  }

  private async checkRelationship(
    sourceTable: string,
    sourceColumn: string,
    targetTable: string,
    targetColumn: string
  ): Promise<number> {
    try {
      logger.log(`Checking relationship: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn}`);
      const sourceData = await this.getSampleData(sourceTable, sourceColumn);
      const targetData = await this.getSampleData(targetTable, targetColumn);
      const confidence = this.calculateMatchPercentage(sourceData, targetData);
      logger.log(`Relationship confidence: ${confidence.toFixed(2)}`);
      return confidence;
    } catch (error) {
      logger.error(
        `Error checking relationship between ${sourceTable}.${sourceColumn} and ${targetTable}.${targetColumn}:`,
        error
      );
      return 0;
    }
  }

  private async getSampleData(
    tableName: string,
    columnName: string,
    timeoutSeconds: number = 5
  ): Promise<Set<string>> {
    const cacheKey = `sample:${tableName}:${columnName}`;
    const cachedSample = this.cache.get<string[]>(cacheKey);

    if (cachedSample) {
      logger.log(`Using cached sample data for ${tableName}.${columnName}`);
      return new Set(cachedSample);
    }

    try {
      logger.log(`Fetching sample data for ${tableName}.${columnName}`);
      const startTime = Date.now();
      const query = this.samplingStrategy.getSampleQuery(
        tableName,
        columnName,
        this.sampleSize
      );
      logger.log(`Sample query: ${query}`);

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutSeconds * 1000)
      );
      const queryPromise = this.connector.query(query);

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result === null) {
        throw new Error('Query timeout');
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      const sampleData = new Set(
        result.map((row: any) => String(row[columnName])).filter(Boolean)
      );

      this.cache.set(cacheKey, Array.from(sampleData));
      logger.log(`Fetched and cached ${sampleData.size} sample data points for ${tableName}.${columnName} in ${duration.toFixed(2)} seconds`);
      return sampleData;
    } catch (error) {
      if ((error as Error)?.message === 'Query timeout') {
        logger.warn(`Timeout fetching sample data for ${tableName}.${columnName} after ${timeoutSeconds} seconds`);
      } else {
        logger.error(
          `Error getting sample data for ${tableName}.${columnName}:`,
          error
        );
      }
      return new Set();
    }
  }

  private calculateMatchPercentage(
    sourceData: Set<string>,
    targetData: Set<string>
  ): number {
    if (sourceData.size === 0 || targetData.size === 0) {
      logger.log("One or both data sets are empty, returning 0 confidence");
      return 0;
    }
    const intersection = new Set(
      [...sourceData].filter((x) => targetData.has(x))
    );
    const confidence = intersection.size / Math.min(sourceData.size, targetData.size);
    logger.log(`Calculated match percentage: ${confidence.toFixed(2)}`);
    return confidence;
  }
}
