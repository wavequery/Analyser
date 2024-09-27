// src/schemas/relationshipSchema.ts

export interface Relationship {
  sourceTable: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  isInferred: boolean;
  confidence: number;
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