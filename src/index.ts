// src/index.ts

import { DatabaseConnector } from "./connectors/baseConnector";
import { SchemaAnalyzer } from "./analyzers/schemaAnalyzer";
import { RelationshipAnalyzer } from "./analyzers/relationshipAnalyzer";
import { topologicalSort } from "./utils/topologicalSort";
import { exportToJson } from "./utils/jsonExporter";
import { identifyCircularDependencies } from "./utils/dependencyAnalyzer";
import { Logger } from "./utils/logger";

export async function analyzeDatabase({
  connector,
  logger,
}: {
  connector: DatabaseConnector;
  logger: Logger;
}): Promise<DatabaseConnector> {
  logger.log("Starting database analysis...");
  try {
    logger.log("Connecting to database...");
    await connector.connect();

    console.log("Analyzing schema...");
    const schemaAnalyzer = new SchemaAnalyzer(connector);
    const tables = await schemaAnalyzer.getTables();
    logger.log(`Found ${tables.length} tables.`);

    logger.log("Analyzing relationships...");
    const relationshipAnalyzer = new RelationshipAnalyzer(connector);
    const relationships = await relationshipAnalyzer.getRelationships(tables);
    logger.log(`Found ${relationships.length} relationships.`);

    logger.log("Performing topological sort...");
    const sortedTables = topologicalSort(tables, relationships);

    logger.log("Identifying circular dependencies...");
    const circularDependencies = identifyCircularDependencies(
      tables,
      relationships
    );

    const schemaData = {
      tables: sortedTables,
      relationships: relationships,
      circularDependencies: circularDependencies,
    };

    console.log("Exporting data to JSON...");
    // TODO: The name should get more dynamic
    await exportToJson(schemaData, "database-schema.json", logger);

    console.log("Database analysis completed successfully.");
    return connector;
  } catch (error) {
    logger.error("Error during schema analysis:", error);
    throw error;
  }
}