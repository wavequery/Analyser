// import { Relationship } from "../../schemas/relationshipSchema";

// export class TransitiveRelationshipDetector {
//   detect(relationships: Relationship[]): Relationship[] {
//     const transitiveRelationships: Relationship[] = [];
//     const relationshipMap = new Map<string, Set<string>>();

//     // Build relationship map
//     for (const rel of relationships) {
//       const sourceKey = `${rel.sourceTable}:${rel.sourceColumns}`;
//       const targetKey = `${rel.targetTable}:${rel.targetColumns}`;

//       if (!relationshipMap.has(sourceKey)) {
//         relationshipMap.set(sourceKey, new Set());
//       }
//       relationshipMap.get(sourceKey)!.add(targetKey);
//     }

//     // Detect transitive relationships
//     for (const [sourceKey, targetSet] of relationshipMap) {
//       for (const targetKey of targetSet) {
//         const secondaryTargets = relationshipMap.get(targetKey);
//         if (secondaryTargets) {
//           for (const secondaryTargetKey of secondaryTargets) {
//             if (!targetSet.has(secondaryTargetKey)) {
//               const [sourceTable, sourceColumns] = sourceKey.split(":");
//               const [, targetColumns] = targetKey.split(":");
//               const [secondaryTargetTable, secondaryTargetColumns] =
//                 secondaryTargetKey.split(":");

//               transitiveRelationships.push({
//                 sourceTable,
//                 sourceColumns: sourceColumns,
//                 targetTable: secondaryTargetTable,
//                 targetColumns: secondaryTargetColumns,
//                 isInferred: true,
//                 confidence: 0.5, // Lower confidence for transitive relationships
//               });
//             }
//           }
//         }
//       }
//     }

//     return transitiveRelationships;
//   }
// }
