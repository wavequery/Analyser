// src/index.ts

import { DatabaseConnector } from "../connectors/baseConnector";
import { SchemaAnalyzer } from "./schemaAnalyzer";
import { RelationshipAnalyzer } from "./relationshipAnalyzer";
import { topologicalSort } from "../utils/topologicalSort";
import { exportToJson } from "../utils/jsonExporter";
import { identifyCircularDependencies } from "../utils/dependencyAnalyzer";
import { detectJunctionTables } from "./junctionTableDetector";
import { Logger } from "../utils/logger";

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
