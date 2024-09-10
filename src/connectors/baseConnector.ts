// src/connectors/baseConnector.ts

export interface DatabaseConnector {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    getTables(): Promise<string[]>;
    getColumns(tableName: string): Promise<ColumnInfo[]>;
    getPrimaryKeys(tableName: string): Promise<string[]>;
    getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]>;
  }
  
  export interface ColumnInfo {
    name: string;
    type: string;
    isNullable: boolean;
  }
  
  export interface ForeignKeyInfo {
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
  }