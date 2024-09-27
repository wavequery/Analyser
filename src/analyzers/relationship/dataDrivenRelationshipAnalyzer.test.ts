// import { DataDrivenRelationshipAnalyzer } from "./dataDrivenRelationshipAnalyzer";

// import { DatabaseConnector } from "../../connectors/baseConnector";
// import { SamplingStrategy } from "../samplingStrategy/samplingStrategy";
// import { SchemaConfig } from "../../schemas/schemaConfig";
// import { Table, Column } from "../../schemas/tableSchema";
// import { Relationship } from "../../schemas/relationshipSchema";
// import NodeCache from "node-cache";

// // Mock the external dependencies
// jest.mock("../../../connectors/baseConnector");
// jest.mock("../../samplingStrategy/samplingStrategy");
// jest.mock("../../../utils/logger");
// jest.mock("node-cache");

// describe("DataDrivenRelationshipAnalyzer", () => {
//   let analyzer: DataDrivenRelationshipAnalyzer;
//   let mockConnector: jest.Mocked<DatabaseConnector>;
//   let mockSamplingStrategy: jest.Mocked<SamplingStrategy>;
//   let mockConfig: SchemaConfig;

//   beforeEach(() => {
//     mockConnector = {
//       // Add any methods or properties you need to mock
//     } as jest.Mocked<DatabaseConnector>;
//     mockSamplingStrategy = {
//       // Add any methods or properties you need to mock
//     } as jest.Mocked<SamplingStrategy>;

//     mockConfig = {
//       foreignKeySuffixes: ["_id", "_fk"],
//       foreignKeyPrefixes: ["fk_"],
//       primaryKeySuffixes: ["_id", "_pk"],
//       primaryKeyPrefixes: ["pk_"],
//       manyToManySuffixes: ["_map", "_junction"],
//       ignoredTables: [],
//       ignoredColumns: [],
//     };

//     analyzer = new DataDrivenRelationshipAnalyzer(
//       mockConnector,
//       mockSamplingStrategy,
//       mockConfig,
//       100,
//       0.5,
//       3600
//     );
//   });

//   describe("analyze", () => {
//     it("should analyze relationships between tables", async () => {
//       const tables: Table[] = [
//         {
//           name: "users",
//           columns: [
//             {
//               name: "id",
//               type: "INTEGER",
//               isNullable: false,
//               isPrimaryKey: true,
//             },
//             {
//               name: "name",
//               type: "VARCHAR",
//               isNullable: false,
//               isPrimaryKey: false,
//             },
//           ],
//         },
//         {
//           name: "orders",
//           columns: [
//             { name: "id", type: "INTEGER" },
//             { name: "user_id", type: "INTEGER" },
//           ],
//         },
//       ];

//       mockSamplingStrategy.getSampleQuery.mockReturnValue(
//         "SELECT * FROM table LIMIT 100"
//       );
//       mockConnector.query
//         .mockResolvedValueOnce([{ id: "1" }, { id: "2" }])
//         .mockResolvedValueOnce([{ user_id: "1" }, { user_id: "2" }]);

//       const relationships = await analyzer.analyze(tables);

//       expect(relationships).toHaveLength(1);
//       expect(relationships[0]).toEqual({
//         sourceTable: "orders",
//         sourceColumns: ["user_id"],
//         targetTable: "users",
//         targetColumns: ["id"],
//         isInferred: true,
//         confidence: 1,
//       });
//     });

//     it("should use cached relationships when available", async () => {
//       const tables: Table[] = [
//         {
//           name: "products",
//           columns: [
//             { name: "id", type: "INTEGER" },
//             { name: "category_id", type: "INTEGER" },
//           ],
//         },
//         {
//           name: "categories",
//           columns: [
//             { name: "id", type: "INTEGER" },
//             { name: "name", type: "VARCHAR" },
//           ],
//         },
//       ];

//       const cachedRelationship: Relationship = {
//         sourceTable: "products",
//         sourceColumns: ["category_id"],
//         targetTable: "categories",
//         targetColumns: ["id"],
//         isInferred: true,
//         confidence: 0.8,
//       };

//       (NodeCache.prototype.get as jest.Mock).mockReturnValue(
//         cachedRelationship
//       );

//       const relationships = await analyzer.analyze(tables);

//       expect(relationships).toHaveLength(1);
//       expect(relationships[0]).toEqual(cachedRelationship);
//       expect(mockConnector.query).not.toHaveBeenCalled();
//     });
//   });

//   describe("private methods", () => {
//     it("should identify potential relationships", () => {
//       const tables: Table[] = [
//         {
//           name: "users",
//           columns: [
//             { name: "id", dataType: "INTEGER" },
//             { name: "name", dataType: "VARCHAR" },
//           ],
//         },
//         {
//           name: "orders",
//           columns: [
//             { name: "id", dataType: "INTEGER" },
//             { name: "user_id", dataType: "INTEGER" },
//           ],
//         },
//       ];

//       const potentialRelationships = (
//         analyzer as any
//       ).identifyPotentialRelationships(tables);

//       expect(potentialRelationships).toHaveLength(1);
//       expect(potentialRelationships[0]).toEqual([
//         "orders",
//         "user_id",
//         "users",
//         "id",
//       ]);
//     });

//     it("should identify potential foreign keys", () => {
//       const column1: Column = { name: "user_id", dataType: "INTEGER" };
//       const column2: Column = { name: "name", dataType: "VARCHAR" };

//       expect((analyzer as any).isPotentialForeignKey(column1)).toBe(true);
//       expect((analyzer as any).isPotentialForeignKey(column2)).toBe(false);
//     });

//     it("should identify self-referencing columns", () => {
//       const column: Column = { name: "parent_user_id", dataType: "INTEGER" };
//       const table: Table = { name: "users", columns: [] };

//       expect((analyzer as any).isSelfReferencing(column, table)).toBe(true);
//     });

//     it("should find potential target columns", () => {
//       const table: Table = {
//         name: "users",
//         columns: [
//           { name: "id", dataType: "INTEGER" },
//           { name: "name", dataType: "VARCHAR" },
//         ],
//       };

//       const targetColumn = (analyzer as any).findPotentialTargetColumn(table);

//       expect(targetColumn).toEqual({ name: "id", dataType: "INTEGER" });
//     });

//     it("should calculate match percentage correctly", () => {
//       const sourceData = new Set(["1", "2", "3", "4"]);
//       const targetData = new Set(["2", "3", "4", "5"]);

//       const confidence = (analyzer as any).calculateMatchPercentage(
//         sourceData,
//         targetData
//       );

//       expect(confidence).toBe(0.75);
//     });
//   });
// });
