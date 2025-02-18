import { createClient, ClickHouseClient } from "@clickhouse/client";
import {
  DatabaseConnector,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  ConstraintInfo,
  ProcedureInfo,
  ViewInfo,
} from "./baseConnector";

export interface ClickhouseConnectorConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  protocol?: "http" | "https";
}

export class ClickhouseConnector implements DatabaseConnector {
  private client: ClickHouseClient;
  private database: string;

  constructor(config: ClickhouseConnectorConfig) {
    const protocol = config.protocol || "https";
    const port = config.port || 8443;

    this.client = createClient({
      url: `${protocol}://${config.host}:${port}`,
      username: config.username || "default",
      password: config.password || "",
      database: config.database,
    });

    this.database = config.database;
  }

  async connect(): Promise<void> {
    // Test connection
    await this.query("SELECT 1");
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const resultSet = await this.client.query({
        query: sql,
        format: "JSONEachRow",
        // parameters: params,
      });

      return await resultSet.json<T>();
    } catch (error: any) {
      throw new Error(`Clickhouse query error: ${error.message}`);
    }
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT name
      FROM system.tables
      WHERE database = '${this.database}'
      AND engine NOT LIKE 'MaterializedView'
      AND engine NOT LIKE 'View'
    `;
    try {
      const result = await this.query<{ name: string }>(sql);
      return result.map((row) => row.name);
    } catch (error) {
      console.error("Error getting tables:", error);
      throw error;
    }
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT
        name,
        type,
        default_kind,
        POSITION(name IN (
          SELECT primary_key
          FROM system.tables
          WHERE database = '${this.database}'
          AND name = '${tableName}'
        )) > 0 as is_primary_key
      FROM system.columns
      WHERE database = '${this.database}'
      AND table = '${tableName}'
    `;

    const result = await this.query<{
      name: string;
      type: string;
      default_kind: string | null;
      is_primary_key: number;
    }>(sql);

    return result.map((row) => ({
      name: row.name,
      type: row.type,
      isNullable:
        row.default_kind !== "MATERIALIZED" && row.default_kind !== "DEFAULT",
      isPrimaryKey: Boolean(row.is_primary_key),
    }));
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    const sql = `
      SELECT name
      FROM system.columns
      WHERE database = '${this.database}'
      AND table = '${tableName}'
      AND is_in_primary_key = 1
    `;
    const result = await this.query<{ name: string }>(sql);
    return result.map((row) => row.name);
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    // Clickhouse doesn't support foreign keys natively
    return [];
  }

  async getUniqueKeys(tableName: string): Promise<string[]> {
    // In Clickhouse, unique constraints are implemented through primary keys
    return this.getPrimaryKeys(tableName);
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const sql = `
      SELECT
        name,
        primary_key
      FROM system.tables
      WHERE database = '${this.database}'
      AND name = '${tableName}'
    `;
    const result = await this.query<{
      name: string;
      primary_key: string;
    }>(sql);

    return result.flatMap((row) => {
      const primaryKeys = row.primary_key.split(",").map((k) => k.trim());
      return primaryKeys.map((column) => ({
        name: `${row.name}_${column}_idx`,
        columnName: column,
        isUnique: true,
      }));
    });
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const primaryKeys = await this.getPrimaryKeys(tableName);
    return primaryKeys.map((key) => ({
      name: `${tableName}_${key}_pk`,
      type: "PRIMARY KEY",
    }));
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    // Clickhouse doesn't support stored procedures
    return [];
  }

  async getViews(): Promise<ViewInfo[]> {
    const sql = `
      SELECT
        name,
        create_table_query
      FROM system.tables
      WHERE database = '${this.database}'
      AND engine = 'View'
    `;
    const result = await this.query<{
      name: string;
      create_table_query: string;
    }>(sql);

    return result.map((row) => ({
      name: row.name,
      definition: row.create_table_query,
    }));
  }
}
