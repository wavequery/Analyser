import { neon, neonConfig } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { DatabaseConnector } from "./baseConnector";

export interface PostgresConfig {
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string | null;
  description?: string | null;
}

export interface ForeignKeyInfo {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface IndexInfo {
  name: string;
  columnName: string;
  isUnique: boolean;
  indexType?: string;
  isPrimary?: boolean;
}

export interface ConstraintInfo {
  name: string;
  type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK" | "EXCLUDE";
  definition?: string;
}

export interface ProcedureInfo {
  name: string;
  definition: string;
  language?: string;
  returnType?: string;
  arguments?: Array<{
    name: string;
    type: string;
    mode?: "IN" | "OUT" | "INOUT" | "VARIADIC";
  }>;
}

export interface ViewInfo {
  name: string;
  definition: string;
  isMaterialized: boolean;
}

type QueryResultRow = Record<string, unknown>;
type SQL = NeonQueryFunction<false, false>;

export class PostgresBrowserConnector {
  private sql: SQL;
  private config: PostgresConfig;
  private isConnected: boolean = false;

  constructor(config: PostgresConfig) {
    this.config = config;
    neonConfig.fetchConnectionCache = true;

    const connectionString = `postgres://${config.user}:${config.password}@${
      config.host
    }:${config.port || 5432}/${config.database}${
      config.ssl ? "?sslmode=require" : ""
    }`;
    this.sql = neon(connectionString);
  }

  async connect(): Promise<void> {
    try {
      await this.sql`SELECT 1`;
      this.isConnected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to PostgreSQL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async query<T = QueryResultRow>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.sql(sql, params) as unknown as T[];
    return result;
  }

  private checkConnection(): void {
    if (!this.isConnected) {
      throw new Error("Not connected to database");
    }
  }

  async getTables(): Promise<string[]> {
    this.checkConnection();

    type TableResult = { table_name: string };
    const result = (await this.sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `) as TableResult[];

    return result.map((row) => row.table_name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    this.checkConnection();

    type ColumnResult = {
      column_name: string;
      data_type: string;
      is_nullable: string;
      is_primary_key: boolean;
      column_default: string | null;
      description: string | null;
    };

    const result = (await this.sql`
      SELECT 
        c.column_name, 
        c.data_type,
        c.is_nullable,
        c.column_default,
        pd.description,
        CASE WHEN pk.constraint_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = ${tableName}
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN pg_description pd
        ON pd.objoid = ${tableName}::regclass::oid
        AND pd.objsubid = c.ordinal_position
      WHERE c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `) as ColumnResult[];

    return result.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      isNullable: row.is_nullable === "YES",
      isPrimaryKey: row.is_primary_key,
      defaultValue: row.column_default,
      description: row.description,
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
    this.checkConnection();

    type ForeignKeyResult = {
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      on_delete: string;
      on_update: string;
    };

    const result = (await this.sql`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule AS on_delete,
        rc.update_rule AS on_update
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName}
    `) as ForeignKeyResult[];

    return result.map((row) => ({
      columnName: row.column_name,
      referencedTable: row.foreign_table_name,
      referencedColumn: row.foreign_column_name,
      onDelete: row.on_delete,
      onUpdate: row.on_update,
    }));
  }

  async getUniqueKeys(tableName: string): Promise<string[]> {
    this.checkConnection();

    type UniqueKeyResult = {
      column_name: string;
    };

    const result = (await this.sql`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${tableName}::regclass
        AND i.indisunique
        AND NOT i.indisprimary
    `) as UniqueKeyResult[];

    return result.map((row) => row.column_name);
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    this.checkConnection();

    type IndexResult = {
      index_name: string;
      column_name: string;
      is_unique: boolean;
      index_type: string;
      is_primary: boolean;
    };

    const result = (await this.sql`
      SELECT
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique,
        am.amname AS index_type,
        ix.indisprimary AS is_primary
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a,
        pg_am am
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND i.relam = am.oid
        AND t.relkind = 'r'
        AND t.relname = ${tableName}
      ORDER BY
        i.relname,
        a.attnum
    `) as IndexResult[];

    return result.map((row) => ({
      name: row.index_name,
      columnName: row.column_name,
      isUnique: row.is_unique,
      indexType: row.index_type,
      isPrimary: row.is_primary,
    }));
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    this.checkConnection();

    type ConstraintResult = {
      constraint_name: string;
      constraint_type: string;
      definition: string;
    };

    const result = (await this.sql`
      SELECT
        con.conname AS constraint_name,
        CASE
          WHEN con.contype = 'p' THEN 'PRIMARY KEY'
          WHEN con.contype = 'f' THEN 'FOREIGN KEY'
          WHEN con.contype = 'u' THEN 'UNIQUE'
          WHEN con.contype = 'c' THEN 'CHECK'
          WHEN con.contype = 'x' THEN 'EXCLUDE'
        END AS constraint_type,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = con.connamespace
      WHERE rel.relname = ${tableName}
    `) as ConstraintResult[];

    return result.map((row) => ({
      name: row.constraint_name,
      type: row.constraint_type as ConstraintInfo["type"],
      definition: row.definition,
    }));
  }

  async getViews(): Promise<ViewInfo[]> {
    this.checkConnection();

    type ViewResult = {
      view_name: string;
      definition: string;
      is_materialized: boolean;
    };

    const result = (await this.sql`
      SELECT 
        viewname AS view_name,
        definition,
        is_materialized
      FROM pg_views
      LEFT JOIN pg_matviews ON pg_views.viewname = pg_matviews.matviewname
      WHERE schemaname = 'public'
      UNION
      SELECT 
        matviewname AS view_name,
        definition,
        true AS is_materialized
      FROM pg_matviews
      WHERE schemaname = 'public'
    `) as ViewResult[];

    return result.map((row) => ({
      name: row.view_name,
      definition: row.definition,
      isMaterialized: row.is_materialized,
    }));
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    this.checkConnection();

    type ProcedureResult = {
      proc_name: string;
      definition: string;
      language: string;
      return_type: string;
      arg_names: string[];
      arg_types: string[];
      arg_modes: string[];
    };

    const result = (await this.sql`
      SELECT
        p.proname AS proc_name,
        pg_get_functiondef(p.oid) AS definition,
        l.lanname AS language,
        pg_get_function_result(p.oid) AS return_type,
        COALESCE(p.proargnames, ARRAY[]::text[]) AS arg_names,
        ARRAY(
          SELECT typname 
          FROM unnest(p.proargtypes) WITH ORDINALITY AS t(typid, ord)
          JOIN pg_type ON typid = pg_type.oid
          ORDER BY ord
        ) AS arg_types,
        COALESCE(p.proargmodes, ARRAY[]::text[]) AS arg_modes
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    `) as ProcedureResult[];

    return result.map((row) => ({
      name: row.proc_name,
      definition: row.definition,
      language: row.language,
      returnType: row.return_type,
      arguments: row.arg_names.map((name, i) => ({
        name: name || `arg${i + 1}`,
        type: row.arg_types[i],
        mode: row.arg_modes[i] as
          | "IN"
          | "OUT"
          | "INOUT"
          | "VARIADIC"
          | undefined,
      })),
    }));
  }
}
