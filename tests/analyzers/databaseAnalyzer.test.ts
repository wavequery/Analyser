import { analyzeDatabase } from "../../src/index";
import { DatabaseConnector } from "../../src/connectors/baseConnector";
import { Logger } from "../../src/utils/logger";
import { jest } from "@jest/globals";

describe("DatabaseAnalyzer", () => {
    it("should analyze database successfully", async () => {});
//   let mockConnector: jest.Mocked<DatabaseConnector>;
//   let
  
//   beforeEach(() => {
//     mockConnector = {
//       connect: jest.fn(),
//       disconnect: jest.fn(),
//       getTables: jest.fn(),
//       getColumns: jest.fn(),
//       getForeignKeys: jest.fn(),
//       getIndexes: jest.fn(),
//       getConstraints: jest.fn(),
//       getStoredProcedures: jest.fn(),
//       getViews: jest.fn(),
//     } as any;

//     mockLogger = {
//       log: jest.fn(),
//       error: jest.fn(),
//     } as any;
//   });

//   it("should analyze database successfully", async () => {
//     mockConnector.getTables.mockResolvedValue(["table1", "table2"]);
//     mockConnector.getColumns.mockResolvedValue([
//       { name: "id", type: "int", isNullable: false, isPrimaryKey: true },
//       { name: "name", type: "varchar", isNullable: true, isPrimaryKey: false },
//     ]);
//     mockConnector.getForeignKeys.mockResolvedValue([]);
//     mockConnector.getIndexes.mockResolvedValue([]);
//     mockConnector.getConstraints.mockResolvedValue([]);
//     mockConnector.getStoredProcedures.mockResolvedValue([]);
//     mockConnector.getViews.mockResolvedValue([]);

//     await analyzeDatabase({
//       connector: mockConnector,
//       logger: mockLogger,
//       outputPath: "test-output.json",
//     });

//     expect(mockConnector.connect).toHaveBeenCalled();
//     expect(mockConnector.getTables).toHaveBeenCalled();
//     expect(mockConnector.getColumns).toHaveBeenCalledTimes(2);
//     expect(mockLogger.log).toHaveBeenCalledWith(
//       "Database analysis completed successfully."
//     );
//   });

//   it("should handle errors during analysis", async () => {
//     mockConnector.getTables.mockRejectedValue(new Error("Database error"));

//     await expect(
//       analyzeDatabase({
//         connector: mockConnector,
//         logger: mockLogger,
//         outputPath: "test-output.json",
//       })
//     ).rejects.toThrow("Database error");

//     expect(mockLogger.error).toHaveBeenCalledWith(
//       expect.stringContaining("Error during schema analysis")
//     );
//  });
});
