import { Pool, PoolConfig } from "pg";
import {
  DatabaseConnector,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  ConstraintInfo,
  ProcedureInfo,
  ViewInfo,
} from "./baseConnector";

export class PostgresConnector implements DatabaseConnector {
  private pool: Pool;
  private schema: string;

  constructor(config: PoolConfig & { schema?: string }) {
    this.pool = new Pool(config);
    this.schema = config.schema || 'public';
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
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
    `;
    const result = await this.query<{ table_name: string }>(sql, [this.schema]);
    return result.map((row) => row.table_name);
  }

  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT 
        c.column_name, 
        c.data_type, 
        c.is_nullable,
        CASE 
          WHEN pk.constraint_name IS NOT NULL THEN true 
          ELSE false 
        END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = $2
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = $1
      AND c.table_schema = $2
    `;
    const result = await this.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      is_primary_key: boolean;
    }>(sql, [tableName, this.schema]);
    return result.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      isNullable: row.is_nullable === "YES",
      isPrimaryKey: row.is_primary_key,
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

  async getUniqueKeys(tableName: string): Promise<string[]> {
    const sql = `
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisunique
        AND NOT i.indisprimary
    `;

    try {
      const result = await this.pool.query(sql, [tableName]);
      return result.rows.map((row) => row.column_name);
    } catch (error) {
      console.error(
        `Error fetching unique keys for table ${tableName}:`,
        error
      );
      return [];
    }
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    const sql = `
      SELECT
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = $1
    `;
    const result = await this.query<{
      index_name: string;
      column_name: string;
      is_unique: boolean;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.index_name,
      columnName: row.column_name,
      isUnique: row.is_unique,
    }));
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const sql = `
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        CASE
          WHEN con.contype = 'p' THEN 'PRIMARY KEY'
          WHEN con.contype = 'u' THEN 'UNIQUE'
          WHEN con.contype = 'f' THEN 'FOREIGN KEY'
          WHEN con.contype = 'c' THEN 'CHECK'
          ELSE 'OTHER'
        END AS constraint_type_desc
      FROM
        pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = con.connamespace
      WHERE
        rel.relname = $1
    `;
    const result = await this.query<{
      constraint_name: string;
      constraint_type: string;
      constraint_type_desc: string;
    }>(sql, [tableName]);
    return result.map((row) => ({
      name: row.constraint_name,
      type: row.constraint_type_desc,
    }));
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    const sql = `
      SELECT 
        p.proname AS procedure_name,
        pg_catalog.pg_get_function_result(p.oid) as result_type,
        pg_catalog.pg_get_function_arguments(p.oid) as argument_data_types,
        CASE 
          WHEN p.prokind = 'a' THEN 'AGGREGATE'
          ELSE COALESCE(pg_get_functiondef(p.oid), '')
        END AS procedure_definition,
        p.prokind
      FROM pg_proc p
      INNER JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = $1
      AND p.prokind IN ('f', 'p', 'a')  -- f=function, p=procedure, a=aggregate
    `;

    const result = await this.query<{
      procedure_name: string;
      result_type: string;
      argument_data_types: string;
      procedure_definition: string;
      prokind: string;
    }>(sql, [this.schema]);

    return result.map((row) => {
      let definition = row.procedure_definition;

      // For aggregate functions, construct a descriptive definition
      if (row.prokind === "a") {
        definition =
          `AGGREGATE FUNCTION ${row.procedure_name}(${row.argument_data_types}) ` +
          `RETURNS ${row.result_type}`;
      }

      return {
        name: row.procedure_name,
        definition: definition,
      };
    });
  }

  async getViews(): Promise<ViewInfo[]> {
    const sql = `
      SELECT
        table_name AS view_name,
        view_definition
      FROM
        information_schema.views
      WHERE
        table_schema = $1
    `;
    const result = await this.query<{
      view_name: string;
      view_definition: string;
    }>(sql, [this.schema]);
    return result.map((row) => ({
      name: row.view_name,
      definition: row.view_definition,
    }));
  }
}
