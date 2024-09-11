// src/index.ts

import { DatabaseConnector } from "./connectors/baseConnector";
import { SchemaAnalyzer } from "./analyzers/schemaAnalyzer";
import { RelationshipAnalyzer } from "./analyzers/relationshipAnalyzer";
import { topologicalSort } from "./utils/topologicalSort";
import { exportToJson } from "./utils/jsonExporter";
import { identifyCircularDependencies } from "./utils/dependencyAnalyzer";

export async function analyzeDatabase(
  connector: DatabaseConnector
): Promise<DatabaseConnector> {
  console.log("Starting database analysis...");
  try {
    console.log("Connecting to database...");
    await connector.connect();

    console.log("Analyzing schema...");
    const schemaAnalyzer = new SchemaAnalyzer(connector);
    const tables = await schemaAnalyzer.getTables();
    console.log(`Found ${tables.length} tables.`);

    console.log("Analyzing relationships...");
    const relationshipAnalyzer = new RelationshipAnalyzer(connector);
    const relationships = await relationshipAnalyzer.getRelationships(tables);
    console.log(`Found ${relationships.length} relationships.`);

    console.log("Performing topological sort...");
    const sortedTables = topologicalSort(tables, relationships);

    console.log("Identifying circular dependencies...");
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
    await exportToJson(schemaData, "database-schema.json");

    console.log("Database analysis completed successfully.");
    return connector;
  } catch (error) {
    console.error("Error during schema analysis:", error);
    throw error;
  }
}

console.log("index.ts module loaded");
