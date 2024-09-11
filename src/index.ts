// src/index.ts

export { analyzeDatabase } from './analyzers/analyzeDatabase';
export { DatabaseConnector } from './connectors/baseConnector';
export { PostgresConnector } from './connectors/postgresConnector';
export { MariaDBConnector } from './connectors/mariadbConnector';
export { SQLiteConnector } from './connectors/sqliteConnector';
export { SchemaAnalyzer } from './analyzers/schemaAnalyzer';
export { RelationshipAnalyzer } from './analyzers/relationshipAnalyzer';
export { detectJunctionTables } from './analyzers/junctionTableDetector';
export { topologicalSort } from './utils/topologicalSort';
export { identifyCircularDependencies } from './utils/dependencyAnalyzer';