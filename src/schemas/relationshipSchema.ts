// src/schemas/relationshipSchema.ts

export interface Relationship {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }
  
  export interface RelationshipMap {
    [tableName: string]: TableRelationships;
  }
  
  export interface TableRelationships {
    foreignKeys: ForeignKey[];
    referencedBy: ReferencedBy[];
  }
  
  export interface ForeignKey {
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
  }
  
  export interface ReferencedBy {
    table: string;
    column: string;
  }