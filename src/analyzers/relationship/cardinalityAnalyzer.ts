// export class CardinalityAnalyzer {
//     constructor(
//       private connector: DatabaseConnector,
//       private samplingStrategy: SamplingStrategy
//     ) {}
  
//     async analyze(tables: Table[]): Promise<Map<string, { uniqueCount: number, totalCount: number }>> {
//       const cardinalityInfo = new Map<string, { uniqueCount: number, totalCount: number }>();
  
//       for (const table of tables) {
//         const sampleSize = this.samplingStrategy.getSampleSize(table);
        
//         for (const column of table.columns) {
//           const query = `
//             SELECT 
//               COUNT(DISTINCT ${column.name}) as unique_count,
//               COUNT(*) as total_count
//             FROM (
//               SELECT ${column.name}
//               FROM ${table.name}
//               LIMIT ${sampleSize}
//             ) subquery
//           `;
  
//           const result = await this.connector.executeQuery(query);
//           cardinalityInfo.set(`${table.name}.${column.name}`, {
//             uniqueCount: result[0].unique_count,
//             totalCount: result[0].total_count
//           });
//         }
//       }
  
//       return cardinalityInfo;
//     }
//   }