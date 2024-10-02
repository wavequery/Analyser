// import { Apriori } from 'node-apriori';
// export class AssociationRuleAnalyzer {
//     constructor(
//       private connector: DatabaseConnector,
//       private samplingStrategy: SamplingStrategy,
//       private config: SchemaConfig
//     ) {}
  
//     async analyze(tables: Table[]): Promise<Relationship[]> {
//       const relationships: Relationship[] = [];
  
//       for (const table of tables) {
//         const transactions = await this.getTransactions(table);
//         const apriori = new Apriori(0.01);  // 1% support threshold
//         const freqItemsets = apriori.exec(transactions);
  
//         for (const itemset of freqItemsets) {
//           if (itemset.items.length === 2) {  // Only consider pairs
//             const [col1, col2] = itemset.items;
//             relationships.push({
//               sourceTable: table.name,
//               targetTable: table.name,
//               sourceColumns: [col1],
//               targetColumns: [col2],
//               confidence: itemset.support,
//               isInferred: true,
//               type: 'association'
//             });
//           }
//         }
//       }
  
//       return relationships;
//     }
  
//     private async getTransactions(table: Table): Promise<string[][]> {
//       const sampleSize = this.samplingStrategy.getSampleSize(table);
//       const query = `SELECT ${table.columns.map(c => c.name).join(', ')} FROM ${table.name} LIMIT ${sampleSize}`;
//       const results = await this.connector.executeQuery(query);
      
//       return results.map(row => 
//         Object.entries(row)
//           .filter(([_, value]) => value !== null)
//           .map(([col, value]) => `${col}:${value}`)
//       );
//     }
//   }