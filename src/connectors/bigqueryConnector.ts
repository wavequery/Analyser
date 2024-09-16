// src/connectors/bigQueryConnector.ts

import { BigQuery, Table } from "@google-cloud/bigquery";
import {
  DatabaseConnector,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
  ConstraintInfo,
  ProcedureInfo,
  ViewInfo,
} from "./baseConnector";

export class BigQueryConnector implements DatabaseConnector {
  constructor(private bigQueryClient: BigQuery) {}

  async connect(): Promise<void> {
    // BigQuery client is already initialized, so nothing to do here
  }

  async disconnect(): Promise<void> {
    // BigQuery doesn't require explicit disconnection
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.bigQueryClient.query({ query: sql, params });
    return rows as T[];
  }

  async getTables<T = { datasetId: string }>(arg: T): Promise<Table[]> {
    const { datasetId } = arg as { datasetId: string };
    const dataset = this.bigQueryClient.dataset(datasetId);
    const [tables] = await dataset.getTables();
    return tables;
  }

  async getColumns({
    tableId,
    datasetId,
  }: {
    tableId: string;
    datasetId: string;
  }): Promise<ColumnInfo[]> {
    const table = this.bigQueryClient.dataset(datasetId).table(tableId);
    const [metadata] = await table.getMetadata();

    return metadata.schema.fields.map(
      (field: { name: any; type: any; mode: string }) => ({
        name: field.name,
        type: field.type,
        isNullable: field.mode !== "REQUIRED",
        isPrimaryKey: false, // BigQuery doesn't have primary keys
      })
    );
  }

  async getPrimaryKeys(tableName: string): Promise<string[]> {
    // BigQuery doesn't have primary keys
    return [];
  }

  async getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
    // BigQuery doesn't support foreign keys
    return [];
  }

  async getIndexes(tableName: string): Promise<IndexInfo[]> {
    // BigQuery doesn't have traditional indexes
    return [];
  }

  async getConstraints(tableName: string): Promise<ConstraintInfo[]> {
    // BigQuery doesn't have traditional constraints
    return [];
  }

  async getStoredProcedures(): Promise<ProcedureInfo[]> {
    // BigQuery doesn't have stored procedures
    return [];
  }

  async getViews(): Promise<ViewInfo[]> {
    const [datasets] = await this.bigQueryClient.getDatasets();
    const allViews: ViewInfo[] = [];

    for (const dataset of datasets) {
      const [tables] = await dataset.getTables();
      const views = tables.filter((table) => table.metadata.type === "VIEW");

      for (const view of views) {
        const [metadata] = await view.getMetadata();
        allViews.push({
          name: `${dataset.id}.${view.id}`,
          definition: metadata.view.query,
        });
      }
    }

    return allViews;
  }

  // BigQuery-specific methods

  async getDatasets(): Promise<string[]> {
    const [datasets] = await this.bigQueryClient.getDatasets();
    return datasets.map((dataset) => dataset.id || "");
  }

  async getTableSchema({
    tableId,
    datasetId,
  }: {
    tableId: string;
    datasetId: string;
  }): Promise<any> {
    const table = this.bigQueryClient.dataset(datasetId).table(tableId);
    const [metadata] = await table.getMetadata();
    return metadata.schema;
  }

  async getTableInfo({
    tableId,
    datasetId,
  }: {
    tableId: string;
    datasetId: string;
  }): Promise<any> {
    const table = this.bigQueryClient.dataset(datasetId).table(tableId);
    const [metadata] = await table.getMetadata();
    return {
      id: metadata.id,
      name: table.id,
      creationTime: metadata.creationTime,
      lastModifiedTime: metadata.lastModifiedTime,
      numBytes: metadata.numBytes,
      numLongTermBytes: metadata.numLongTermBytes,
      numRows: metadata.numRows,
      type: metadata.type,
    };
  }
}