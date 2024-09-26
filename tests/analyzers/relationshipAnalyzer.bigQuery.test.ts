import { RelationshipAnalyzer } from "../../src/analyzers/relationshipAnalyzer";
import { BigQueryConnector } from "../../src/connectors/bigQueryConnector";
import { Table, Column } from "../../src/schemas/tableSchema";
import { jest } from "@jest/globals";
import {
  BigQuery,
  Dataset,
  GetTablesResponse,
  GetDatasetsResponse,
} from "@google-cloud/bigquery";

jest.mock("@google-cloud/bigquery");

describe("RelationshipAnalyzer - BigQuery", () => {
  let mockBigQueryClient: jest.Mocked<BigQuery>;
  let bigQueryConnector: BigQueryConnector;
  let relationshipAnalyzer: RelationshipAnalyzer;

  beforeEach(() => {
    mockBigQueryClient = {
      query: jest.fn(),
      dataset: jest.fn(),
      getDatasets: jest.fn(),
    } as unknown as jest.Mocked<BigQuery>;

    bigQueryConnector = new BigQueryConnector(mockBigQueryClient);
    relationshipAnalyzer = new RelationshipAnalyzer(bigQueryConnector);
  });

  const createTable = (name: string, columns: Column[]): Table => ({
    name,
    columns,
    primaryKeys: [], // BigQuery doesn't have primary keys
  });

  describe("Dataset and Table Handling", () => {
    it("should handle multiple datasets", async () => {
      const mockDatasets = [
        { id: "dataset1" },
        { id: "dataset2" },
      ] as Dataset[];

      const mockTables1 = [
        { id: "table1", metadata: { type: "TABLE" } },
        { id: "table2", metadata: { type: "TABLE" } },
      ];

      const mockTables2 = [{ id: "table3", metadata: { type: "TABLE" } }];

      mockBigQueryClient.getDatasets.mockResolvedValue([
        mockDatasets,
      ] as GetDatasetsResponse);

      const mockDatasetFn = jest
        .fn()
        .mockImplementation((datasetId: string) => ({
          getTables: jest
            .fn()
            .mockResolvedValue([
              datasetId === "dataset1" ? mockTables1 : mockTables2,
            ] as GetTablesResponse),
          table: jest.fn().mockReturnValue({
            getMetadata: jest
              .fn()
              .mockResolvedValue([{ schema: { fields: [] } }]),
          }),
        }));

      mockBigQueryClient.dataset =
        mockDatasetFn as unknown as BigQuery["dataset"];

      const result = await relationshipAnalyzer.getRelationships([]);

      expect(mockBigQueryClient.getDatasets).toHaveBeenCalled();
      expect(mockDatasetFn).toHaveBeenCalledWith("dataset1");
      expect(mockDatasetFn).toHaveBeenCalledWith("dataset2");
    });
  });

  describe("Column Type Handling", () => {
    it("should handle BigQuery-specific data types", async () => {
      const mockTable = createTable("events", [
        {
          name: "event_id",
          type: "STRING",
          isNullable: false,
          isPrimaryKey: false,
        },
        {
          name: "timestamp",
          type: "TIMESTAMP",
          isNullable: false,
          isPrimaryKey: false,
        },
        {
          name: "user_id",
          type: "INTEGER",
          isNullable: false,
          isPrimaryKey: false,
        },
        { name: "data", type: "JSON", isNullable: true, isPrimaryKey: false },
      ]);

      mockBigQueryClient.query.mockResolvedValue([[]] as any);

      const result = await relationshipAnalyzer.getRelationships([mockTable]);

      // Assert that the analyzer correctly handles BigQuery-specific types
      expect(result).toEqual([]);
    });
  });

  describe("View Handling", () => {
    it("should handle views correctly", async () => {
      const mockDatasets = [{ id: "dataset1" }] as Dataset[];
      const mockTables = [
        { id: "table1", metadata: { type: "TABLE" } },
        {
          id: "view1",
          metadata: {
            type: "VIEW",
            view: { query: "SELECT * FROM dataset1.table1" },
          },
        },
      ];

      mockBigQueryClient.getDatasets.mockResolvedValue([
        mockDatasets,
      ] as GetDatasetsResponse);

      const mockDatasetFn = jest.fn().mockReturnValue({
        getTables: jest
          .fn()
          .mockResolvedValue([mockTables] as GetTablesResponse),
        table: jest.fn().mockReturnValue({
          getMetadata: jest.fn().mockResolvedValue([
            {
              schema: {
                fields: [{ name: "id", type: "INTEGER", mode: "REQUIRED" }],
              },
              view: { query: "SELECT * FROM dataset1.table1" },
            },
          ]),
        }),
      });

      mockBigQueryClient.dataset =
        mockDatasetFn as unknown as BigQuery["dataset"];

      const result = await relationshipAnalyzer.getRelationships([]);

      // Assert that views are correctly identified and handled
      expect(result).toEqual([]);
    });
  });

  describe("Data-Driven Relationship Inference", () => {
    it("should infer relationships based on data sampling", async () => {
      const tables = [
        createTable("users", [
          {
            name: "user_id",
            type: "INTEGER",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "name",
            type: "STRING",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("orders", [
          {
            name: "order_id",
            type: "INTEGER",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "user_id",
            type: "INTEGER",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockBigQueryClient.query
        .mockResolvedValueOnce([
          [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }],
        ] as any)
        .mockResolvedValueOnce([
          [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }, { user_id: 4 }],
        ] as any);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual(
        expect.objectContaining({
          sourceTable: "orders",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "user_id",
          isInferred: true,
          confidence: expect.any(Number),
        })
      );
      expect(result[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle tables with no columns", async () => {
      const emptyTable = createTable("empty", []);
      const result = await relationshipAnalyzer.getRelationships([emptyTable]);
      expect(result).toEqual([]);
    });

    it("should handle tables with only one column", async () => {
      const singleColumnTable = createTable("single_column", [
        { name: "id", type: "INTEGER", isNullable: false, isPrimaryKey: false },
      ]);
      const result = await relationshipAnalyzer.getRelationships([
        singleColumnTable,
      ]);
      expect(result).toEqual([]);
    });

    it("should not infer relationships for tables in different datasets", async () => {
      const table1 = createTable("dataset1.table1", [
        { name: "id", type: "INTEGER", isNullable: false, isPrimaryKey: false },
      ]);
      const table2 = createTable("dataset2.table2", [
        {
          name: "table1_id",
          type: "INTEGER",
          isNullable: false,
          isPrimaryKey: false,
        },
      ]);

      const result = await relationshipAnalyzer.getRelationships([
        table1,
        table2,
      ]);
      expect(result).toEqual([]);
    });
  });
});
