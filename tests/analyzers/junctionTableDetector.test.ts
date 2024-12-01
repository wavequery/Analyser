import { detectJunctionTables } from "../../src/analyzers/junctionTableDetector";
import { Table } from "../../src/schemas/tableSchema";
import { Relationship } from "../../src/schemas/relationshipSchema";

describe("JunctionTableDetector", () => {
  it("should detect a simple junction table", () => {
    const tables: Table[] = [
      {
        name: "user_roles",
        columns: [
          {
            name: "user_id",
            type: "int",
            isNullable: false,
            isPrimaryKey: true,
          },
          {
            name: "role_id",
            type: "int",
            isNullable: false,
            isPrimaryKey: true,
          },
        ],
        primaryKeys: ["user_id", "role_id"],
      },
    ];

    const relationships: Relationship[] = [
      {
        sourceTable: "user_roles",
        sourceColumns: ["user_id"],
        targetTable: "users",
        targetColumns: ["id"],
        isInferred: false,
        confidence: 1,
        type: "implicit"
      },
      {
        sourceTable: "user_roles",
        sourceColumns: ["role_id"],
        targetTable: "roles",
        targetColumns: ["id"],
        isInferred: false,
        confidence: 1,
         type: "implicit"
      },
    ];

    const result = detectJunctionTables(tables, relationships);
    expect(result).toContain("user_roles");
  });

  it("should not detect a regular table as a junction table", () => {
    const tables: Table[] = [
      {
        name: "users",
        columns: [
          { name: "id", type: "int", isNullable: false, isPrimaryKey: true },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: false,
            isPrimaryKey: false,
          },
        ],
        primaryKeys: ["id"],
      },
    ];

    const relationships: Relationship[] = [];

    const result = detectJunctionTables(tables, relationships);
    expect(result).not.toContain("users");
  });

  // Add more test cases for different scenarios
});
