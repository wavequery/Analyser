// src/index.ts

export { analyzeDatabase } from "./analyzers/databaseAnalyzer";
export { DatabaseConnector } from "./connectors/baseConnector";
export { PostgresConnector } from "./connectors/postgresConnector";
export { MariaDBConnector } from "./connectors/mariadbConnector";
export { MySQLConnector } from "./connectors/mysqlConnector";
export { SQLiteConnector } from "./connectors/sqliteConnector";
export { BigQueryConnector } from "./connectors/bigqueryConnector";
export { SchemaAnalyzer } from "./analyzers/schemaAnalyzer";
export { RelationshipAnalyzer } from "./analyzers/relationshipAnalyzer";
export { detectJunctionTables } from "./analyzers/junctionTableDetector";
export { topologicalSort } from "./utils/topologicalSort";
export { identifyCircularDependencies } from "./utils/dependencyAnalyzer";
export { Relationship, Table, Column } from "./schemas/tableSchema";
