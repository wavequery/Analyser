import { DatabaseConnector } from "../../connectors/baseConnector";
import { Table } from "../../schemas/tableSchema";
import { Relationship } from "../../schemas/relationshipSchema";
import { logger } from "../../utils/logger";

export class ExplicitRelationshipAnalyzer {
  constructor(private connector: DatabaseConnector) {}

  async analyze(tables: Table[]): Promise<Relationship[]> {
    logger.log("Analyzing explicit relationships...");
    const relationships: Relationship[] = [];

    await Promise.all(
      tables.map(async (table) => {
        try {
          logger.log(`Fetching foreign keys for table: ${table.name}`);
          const foreignKeys = await this.connector.getForeignKeys(table.name);
          logger.log(
            `Found ${foreignKeys.length} foreign keys for ${table.name}`
          );

          foreignKeys.forEach((fk) => {
            if (fk.columnName && fk.referencedTable && fk.referencedColumn) {
              relationships.push({
                sourceTable: table.name,
                sourceColumns: [fk.columnName],
                targetTable: fk.referencedTable,
                targetColumns: [fk.referencedColumn],
                isInferred: false,
                confidence: 1,
              });
            }
          });
        } catch (error) {
          logger.error(
            `Error fetching foreign keys for table ${table.name}:`,
            error
          );
        }
      })
    );

    logger.log(
      `Explicit analysis complete. Found ${relationships.length} relationships.`
    );

    return relationships;
  }
}
