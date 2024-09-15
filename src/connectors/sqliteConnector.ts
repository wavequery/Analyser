// src/connectors/sqliteConnector.ts

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import {
  DatabaseConnector,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  ConstraintInfo,
  ProcedureInfo,
  ViewInfo,
} from "./baseConnector";

export class SQLiteConnector implements DatabaseConnector {
  private db: Database<sqlite3.Database> | null = null;

  constructor(private filename: string) {}

  async connect(): Promise<void> {
    this.db = await open({
      filename: this.filename,
      driver: sqlite3.Database,
    });
  }

  async disconnect(): Promise<void> {
    await this.db?.close();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error("Database not connected");
    return this.db.all(sql, params);
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    `;
    const result = await this.query<{ name: string }>(sql);
    return result.map((row) => row.name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `PRAGMA table_info(?)`;
    const result = await this.query<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.name,
      type: row.type,
      isNullable: row.notnull === 0,
      isPrimaryKey: row.pk > 0,
    }));
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const sql = `PRAGMA table_info(?)`;
    const result = await this.query<{ name: string; pk: number }>(sql, [
      tableName,
    ]);
    return result.filter((row) => row.pk > 0).map((row) => row.name);
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    const sql = `PRAGMA foreign_key_list(?)`;
    const result = await this.query<{
      from: string;
      table: string;
      to: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      columnName: row.from,
      referencedTable: row.table,
      referencedColumn: row.to,
    }));
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const sql = `PRAGMA index_list(?)`;
    const result = await this.query<{ name: string; unique: number }>(sql, [
      tableName,
    ]);
    const indexes: IndexInfo[] = [];
    for (const index of result) {
      const columnsSql = `PRAGMA index_info(?)`;
      const columns = await this.query<{ name: string }>(columnsSql, [
        index.name,
      ]);
      for (const column of columns) {
        indexes.push({
          name: index.name,
          columnName: column.name,
          isUnique: index.unique === 1,
        });
      }
    }
    return indexes;
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    // SQLite doesn't have a straightforward way to get constraints other than primary keys and foreign keys
    // We'll combine primary key and foreign key information
    const primaryKeys = await this.getPrimaryKeys(tableName);
    const foreignKeys = await this.getForeignKeys(tableName);

    const constraints: ConstraintInfo[] = primaryKeys.map((pk) => ({
      name: `${tableName}_${pk}_pk`,
      type: "PRIMARY KEY",
    }));

    foreignKeys.forEach((fk) => {
      constraints.push({
        name: `${tableName}_${fk.columnName}_fk`,
        type: "FOREIGN KEY",
      });
    });

    return constraints;
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    // SQLite doesn't support stored procedures
    return [];
  }

  async getViews(): Promise<ViewInfo[]> {
    const sql = `
      SELECT name, sql
      FROM sqlite_master
      WHERE type = 'view'
    `;
    const result = await this.query<{ name: string; sql: string }>(sql);
    return result.map((row) => ({
      name: row.name,
      definition: row.sql,
    }));
  }
}
