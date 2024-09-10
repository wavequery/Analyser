// src/index.ts

import { DatabaseConnector } from "./connectors/baseConnector";
import { SchemaAnalyzer } from "./analyzers/schemaAnalyzer";
import { RelationshipAnalyzer } from "./analyzers/relationshipAnalyzer";
import { topologicalSort } from "./utils/topologicalSort";
import { exportToJson } from "./utils/jsonExporter";
import { identifyCircularDependencies } from './utils/dependencyAnalyzer';

export async function analyzeDatabase(
  connector: DatabaseConnector
): Promise<void> {
  try {
    await connector.connect();

    const schemaAnalyzer = new SchemaAnalyzer(connector);
    const tables = await schemaAnalyzer.getTables();

    const relationshipAnalyzer = new RelationshipAnalyzer(connector);
    const relationships = await relationshipAnalyzer.getRelationships(tables);

    const sortedTables = topologicalSort(tables, relationships);

    const schemaData = {
      tables: sortedTables,
      relationships: relationships,
      circularDependencies: identifyCircularDependencies(tables, relationships),
    };
    await exportToJson(schemaData, "database-schema.json");

    console.log("Schema analysis completed successfully.");
  } catch (error) {
    console.error("Error during schema analysis:", error);
    throw error;
  } finally {
    await connector.disconnect();
  }
}

