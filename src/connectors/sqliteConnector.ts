// src/connectors/sqliteConnector.ts

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { DatabaseConnector, ColumnInfo, ForeignKeyInfo } from './baseConnector';

export class SQLiteConnector implements DatabaseConnector {
  private db: Database | null = null;

  constructor(private filename: string) {}

  async connect(): Promise<void> {
    this.db = await open({
      filename: this.filename,
      driver: sqlite3.Database
    });
  }

  async disconnect(): Promise<void> {
    await this.db?.close();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not connected');
    return this.db.all(sql, params);
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    `;
    const result = await this.query<{ name: string }>(sql);
    return result.map(row => row.name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `PRAGMA table_info(?)`;
    const result = await this.query<{ name: string, type: string, notnull: number }>(sql, [tableName]);
    return result.map(row => ({
      name: row.name,
      type: row.type,
      isNullable: row.notnull === 0
    }));
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const sql = `PRAGMA table_info(?)`;
    const result = await this.query<{ name: string, pk: number }>(sql, [tableName]);
    return result.filter(row => row.pk > 0).map(row => row.name);
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const sql = `PRAGMA foreign_key_list(?)`;
    const result = await this.query<{ from: string, table: string, to: string }>(sql, [tableName]);
    return result.map(row => ({
      columnName: row.from,
      referencedTable: row.table,
      referencedColumn: row.to
    }));
  }
}