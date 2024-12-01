// src/index.ts

import { DatabaseConnector } from "../connectors/baseConnector";
import { SchemaAnalyzer } from "./schemaAnalyzer";
import { RelationshipAnalyzer } from "./relationshipAnalyzer";
import { topologicalSort } from "../utils/topologicalSort";
import { exportToJson } from "../utils/jsonExporter";
import { identifyCircularDependencies } from "../utils/dependencyAnalyzer";
import { detectJunctionTables } from "./junctionTableDetector";
import { Logger } from "../utils/logger";
import { SamplingStrategy } from "./samplingStrategy/samplingStrategy";

export async function analyzeDatabase({
  connector,
  logger,
  outputPath = "database-schema.json",
  samplingStrategy,
  // batchSize = 100,
  // workerPoolSize = 4,
}: {
  connector: DatabaseConnector;
  samplingStrategy: SamplingStrategy;
  logger: Logger;
  outputPath: string;
  // batchSize?: number;
  // workerPoolSize?: number;
}) {
  logger.log("Starting database analysis...");
  try {
    logger.log("Connecting to database...");
    await connector.connect();

    console.log("Analyzing schema...");
    const schemaAnalyzer = new SchemaAnalyzer(connector);
    const tables = await schemaAnalyzer.getTables();
    logger.log(`Found ${tables.length} tables.`);
    
    logger.log("Analyzing relationships...");
    const relationshipAnalyzer = new RelationshipAnalyzer(
      connector,
      samplingStrategy
      // batchSize,
      // workerPoolSize,
    );
    const relationships = await relationshipAnalyzer.getRelationships(tables);
    logger.log(`Found ${relationships.length} relationships.`);

    logger.log("Collecting additional schema information...");
    const enhancedTables = await Promise.all(
      tables.map(async (table) => {
        const indexes = await connector.getIndexes(table.name);
        const constraints = await connector.getConstraints(table.name);
        return { ...table, indexes, constraints };
      })
    );

    logger.log("Retrieving stored procedures and views...");
    const storedProcedures = await connector.getStoredProcedures();
    const views = await connector.getViews();

    logger.log("Performing topological sort...");
    const sortedTables = topologicalSort(enhancedTables, relationships);

    logger.log("Identifying circular dependencies...");
    const circularDependencies = identifyCircularDependencies(
      tables,
      relationships
    );

    logger.log("Detecting junction tables...");
    const junctionTables = detectJunctionTables(enhancedTables, relationships);

    const schemaData = {
      tables: sortedTables,
      relationships: relationships,
      circularDependencies: circularDependencies,
      junctionTables: junctionTables,
      storedProcedures: storedProcedures,
      views: views,
    };

    console.log(`Exporting data to JSON: ${outputPath}`);
    await exportToJson(schemaData, outputPath, logger);

    console.log("Database analysis completed successfully.");
    return schemaData;
  } catch (error) {
    logger.error("Error during schema analysis:", error);
    if (error instanceof Error) {
      logger.error("Error message:", error.message);
      logger.error("Stack trace:", error.stack);
    }
    throw error;
  }
}
