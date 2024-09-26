import { RelationshipAnalyzer } from "../../src/analyzers/relationshipAnalyzer";
import { PostgresConnector } from "../../src/connectors/postgresConnector";
import { Table, Column } from "../../src/schemas/tableSchema";
import { jest } from "@jest/globals";

describe("RelationshipAnalyzer - PostgreSQL", () => {
  let mockPostgresConnector: jest.Mocked<PostgresConnector>;
  let relationshipAnalyzer: RelationshipAnalyzer;

  beforeEach(() => {
    mockPostgresConnector = {
      query: jest.fn(),
      getForeignKeys: jest.fn(),
      getColumns: jest.fn(),
      getPrimaryKeys: jest.fn(),
      getIndexes: jest.fn(),
      getConstraints: jest.fn(),
    } as any;
    relationshipAnalyzer = new RelationshipAnalyzer(mockPostgresConnector);
  });

  const createTable = (name: string, columns: Column[]): Table => ({
    name,
    columns,
    primaryKeys: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
  });

  describe("Explicit Foreign Key Detection", () => {
    it("should detect standard foreign key relationships", async () => {
      const tables = [
        createTable("users", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("orders", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "user_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([
        {
          columnName: "user_id",
          referencedTable: "users",
          referencedColumn: "id",
        },
      ]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual({
        sourceTable: "orders",
        sourceColumn: "user_id",
        targetTable: "users",
        targetColumn: "id",
        isInferred: false,
        confidence: 1,
      });
    });

    it("should handle composite foreign keys", async () => {
      const tables = [
        createTable("order_items", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "order_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "product_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("orders", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
        ]),
        createTable("products", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([
        {
          columnName: "order_id",
          referencedTable: "orders",
          referencedColumn: "id",
        },
        {
          columnName: "product_id",
          referencedTable: "products",
          referencedColumn: "id",
        },
      ]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual({
        sourceTable: "order_items",
        sourceColumn: "order_id",
        targetTable: "orders",
        targetColumn: "id",
        isInferred: false,
        confidence: 1,
      });
      expect(result).toContainEqual({
        sourceTable: "order_items",
        sourceColumn: "product_id",
        targetTable: "products",
        targetColumn: "id",
        isInferred: false,
        confidence: 1,
      });
    });
  });

  describe("Inferred Relationship Detection", () => {
    it("should infer relationships based on naming conventions", async () => {
      const tables = [
        createTable("users", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("posts", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "user_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "title",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual(
        expect.objectContaining({
          sourceTable: "posts",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "id",
          isInferred: true,
        })
      );
    });

    it("should handle plural and singular table names", async () => {
      const tables = [
        createTable("category", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("products", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "category_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual(
        expect.objectContaining({
          sourceTable: "products",
          sourceColumn: "category_id",
          targetTable: "category",
          targetColumn: "id",
          isInferred: true,
        })
      );
    });
  });

  describe("Data-Driven Relationship Inference", () => {
    it("should infer relationships based on data sampling", async () => {
      const tables = [
        createTable("users", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("orders", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "user_id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query
        .mockResolvedValueOnce([{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }])
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual(
        expect.objectContaining({
          sourceTable: "orders",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "id",
          isInferred: true,
          confidence: expect.any(Number),
        })
      );
      expect(result[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe("PostgreSQL-specific features", () => {
    it("should handle schemas", async () => {
      const tables = [
        createTable("public.users", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("auth.users", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toEqual([]);
    });

    it("should handle PostgreSQL-specific data types", async () => {
      const tables = [
        createTable("events", [
          { name: "id", type: "uuid", isNullable: false, isPrimaryKey: true },
          {
            name: "data",
            type: "jsonb",
            isNullable: true,
            isPrimaryKey: false,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle self-referential relationships", async () => {
      const tables = [
        createTable("employees", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "manager_id",
            type: "integer",
            isNullable: true,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([
        {
          columnName: "manager_id",
          referencedTable: "employees",
          referencedColumn: "id",
        },
      ]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toContainEqual({
        sourceTable: "employees",
        sourceColumn: "manager_id",
        targetTable: "employees",
        targetColumn: "id",
        isInferred: false,
        confidence: 1,
      });
    });

    it("should handle tables with no relationships", async () => {
      const tables = [
        createTable("standalone_table", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toEqual([]);
    });

    it("should not infer relationships for columns with mismatched types", async () => {
      const tables = [
        createTable("table1", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
        createTable("table2", [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "table1_id",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ]),
      ];

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const result = await relationshipAnalyzer.getRelationships(tables);

      expect(result).toEqual([]);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle a large number of tables", async () => {
      const tables = Array.from({ length: 100 }, (_, i) =>
        createTable(`table_${i}`, [
          {
            name: "id",
            type: "integer",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ])
      );

      mockPostgresConnector.getForeignKeys.mockResolvedValue([]);
      mockPostgresConnector.query.mockResolvedValue([]);

      const startTime = Date.now();
      await relationshipAnalyzer.getRelationships(tables);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Assuming less than 5 seconds for 100 tables
    });
  });
});
