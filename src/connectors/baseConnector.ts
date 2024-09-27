// src/connectors/baseConnector.ts

import { Table } from "@google-cloud/bigquery";

export interface DatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getTables<T = any>(arg: T): Promise<string[] | Table[]>;
  getColumns(tableName: string | {datasetId: string, tableId: string}): Promise<ColumnInfo[]>;
  getPrimaryKeys(tableName: string): Promise<string[]>;
  getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]>;
  getIndexes(tableName: string): Promise<IndexInfo[]>;
  getConstraints(tableName: string): Promise<ConstraintInfo[]>;
  getStoredProcedures(): Promise<ProcedureInfo[]>;
  getViews(): Promise<ViewInfo[]>;
  getUniqueKeys(tableName: string): Promise<string[]>;
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
