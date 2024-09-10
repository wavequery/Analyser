// src/connectors/postgresConnector.ts

import { Pool, PoolConfig } from "pg";
import { DatabaseConnector, ColumnInfo, ForeignKeyInfo } from "./baseConnector";

export class PostgresConnector implements DatabaseConnector {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  async connect(): Promise<void> {
    await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;
    const result = await this.query<{ table_name: string }>(sql);
    return result.map((row) => row.table_name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
    `;
    const result = await this.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      isNullable: row.is_nullable === "YES",
    }));
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const sql = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
      AND i.indisprimary
    `;
    const result = await this.query<{ attname: string }>(sql, [tableName]);
    return result.map((row) => row.attname);
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const sql = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
    `;
    const result = await this.query<{
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      columnName: row.column_name,
      referencedTable: row.foreign_table_name,
      referencedColumn: row.foreign_column_name,
    }));
  }
}
