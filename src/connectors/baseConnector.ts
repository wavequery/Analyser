// src/connectors/baseConnector.ts

export interface DatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getTables(): Promise<string[]>;
  getColumns(tableName: string): Promise<ColumnInfo[]>;
  getPrimaryKeys(tableName: string): Promise<string[]>;
  getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]>;
  getIndexes(tableName: string): Promise<IndexInfo[]>;
  getConstraints(tableName: string): Promise<ConstraintInfo[]>;
  getStoredProcedures(): Promise<ProcedureInfo[]>;
  getViews(): Promise<ViewInfo[]>;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface ForeignKeyInfo {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface IndexInfo {
  name: string;
  columnName: string;
  isUnique: boolean;
}

export interface ConstraintInfo {
  name: string;
  type: string;
}

export interface ProcedureInfo {
  name: string;
  definition: string;
}

export interface ViewInfo {
  name: string;
  definition: string;
}
