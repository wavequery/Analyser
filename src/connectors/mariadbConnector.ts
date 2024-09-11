// src/connectors/mariadbConnector.ts

import { createPool, Pool, PoolOptions } from "mysql2/promise";
import {
  DatabaseConnector,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  ConstraintInfo,
  ProcedureInfo,
  ViewInfo,
} from "./baseConnector";

export class MariaDBConnector implements DatabaseConnector {
  private pool: Pool;

  constructor(config: PoolOptions) {
    this.pool = createPool(config);
  }

  async connect(): Promise<void> {
    // Connection is established automatically when needed
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `;
    const result = await this.query<{ TABLE_NAME: string }>(sql);
    return result.map((row) => row.TABLE_NAME);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `;
    const result = await this.query<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.COLUMN_NAME,
      type: row.DATA_TYPE,
      isNullable: row.IS_NULLABLE === "YES",
    }));
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const sql = `
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = DATABASE()
      AND table_name = ?
      AND constraint_name = 'PRIMARY'
    `;
    const result = await this.query<{ COLUMN_NAME: string }>(sql, [tableName]);
    return result.map((row) => row.COLUMN_NAME);
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const sql = `
      SELECT
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = DATABASE()
      AND table_name = ?
      AND referenced_table_name IS NOT NULL
    `;
    const result = await this.query<{
      COLUMN_NAME: string;
      REFERENCED_TABLE_NAME: string;
      REFERENCED_COLUMN_NAME: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      columnName: row.COLUMN_NAME,
      referencedTable: row.REFERENCED_TABLE_NAME,
      referencedColumn: row.REFERENCED_COLUMN_NAME,
    }));
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const sql = `
      SELECT
        index_name,
        column_name,
        non_unique
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `;
    const result = await this.query<{
      INDEX_NAME: string;
      COLUMN_NAME: string;
      NON_UNIQUE: number;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.INDEX_NAME,
      columnName: row.COLUMN_NAME,
      isUnique: row.NON_UNIQUE === 0,
    }));
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const sql = `
      SELECT
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `;
    const result = await this.query<{
      CONSTRAINT_NAME: string;
      CONSTRAINT_TYPE: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.CONSTRAINT_NAME,
      type: row.CONSTRAINT_TYPE,
    }));
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    const sql = `
      SELECT
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = DATABASE()
      AND routine_type = 'PROCEDURE'
    `;
    const result = await this.query<{
      ROUTINE_NAME: string;
      ROUTINE_DEFINITION: string;
    }>(sql);
    return result.map((row) => ({
      name: row.ROUTINE_NAME,
      definition: row.ROUTINE_DEFINITION,
    }));
  }

  async getViews(): Promise<ViewInfo[]> {
    const sql = `
      SELECT
        table_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = DATABASE()
    `;
    const result = await this.query<{
      TABLE_NAME: string;
      VIEW_DEFINITION: string;
    }>(sql);
    return result.map((row) => ({
      name: row.TABLE_NAME,
      definition: row.VIEW_DEFINITION,
    }));
  }
}
