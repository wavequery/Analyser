// src/schemas/tableSchema.ts

export interface Table {
    name: string;
    columns: Column[];
    primaryKeys: string[];
  }
  
  export interface Column {
    name: string;
    type: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
  }
  
  export interface Relationship {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    isInferred: boolean;
    confidence?: number;
  }