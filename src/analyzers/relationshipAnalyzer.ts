import { DatabaseConnector } from "../connectors/baseConnector";
import { Table } from "../schemas/tableSchema";
import {Relationship} from "../schemas/relationshipSchema";
import { SchemaConfig, defaultSchemaConfig } from "../schemas/schemaConfig";
import { logger } from "../utils/logger";
import { SamplingStrategy } from "./samplingStrategy/samplingStrategy";
import { ExplicitRelationshipAnalyzer } from "./relationship/explicitRelationshipAnalyzer";
import { ImplicitRelationshipAnalyzer } from "./relationship/implicitRelationshipAnalyzer";
// import { DataDrivenRelationshipAnalyzer } from "./relationship/dataDrivenRelationshipAnalyzer";
// import { TransitiveRelationshipDetector } from "./relationship/transitiveRelationshipDetector";

export class RelationshipAnalyzer {
  private explicitAnalyzer: ExplicitRelationshipAnalyzer;
  private implicitAnalyzer: ImplicitRelationshipAnalyzer;
  // private dataDrivenAnalyzer: DataDrivenRelationshipAnalyzer;
  private config: SchemaConfig;

  constructor(
    private connector: DatabaseConnector,
    private samplingStrategy: SamplingStrategy,
    config: Partial<SchemaConfig> = {}
  ) {
    this.config = { ...defaultSchemaConfig, ...config };
    this.explicitAnalyzer = new ExplicitRelationshipAnalyzer(connector);
    this.implicitAnalyzer = new ImplicitRelationshipAnalyzer(this.config);
    
    //
    // ____ TODO: To be refined on the number of sampling ____
    //
    // this.dataDrivenAnalyzer = new DataDrivenRelationshipAnalyzer(
    //   connector,
    //   samplingStrategy,
    //   this.config
    // );
  }

  async getRelationships(tables: Table[]): Promise<Relationship[]> {
    logger.log("Starting comprehensive relationship analysis...");
    const startTime = Date.now();

    const [
      explicitRelationships,
      implicitRelationships,
      // dataDrivenRelationships,
    ] = await Promise.all([
      this.explicitAnalyzer.analyze(tables),
      this.implicitAnalyzer.analyze(tables),
      // this.dataDrivenAnalyzer.analyze(tables),
    ]);

    const allRelationships = [
      ...explicitRelationships,
      ...implicitRelationships,
      // ...dataDrivenRelationships,
    ];

    const finalRelationships =
      this.deduplicateAndScoreRelationships(allRelationships);

    // const transitiveDetector = new TransitiveRelationshipDetector();
    // const transitiveRelationships = transitiveDetector.detect(finalRelationships);

    const endTime = Date.now();
    logger.log(
      `Relationship analysis completed in ${
        (endTime - startTime) / 1000
      } seconds`
    );
    logger.log(`Found ${finalRelationships.length} direct relationships`);

    return [...finalRelationships]; //, ...transitiveRelationships
  }

  private deduplicateAndScoreRelationships(
    relationships: Relationship[]
  ): Relationship[] {
    const uniqueRelationships = new Map<string, Relationship>();

    for (const rel of relationships) {
      const key = `${rel.sourceTable}:${rel.sourceColumns.join(',')}->${rel.targetTable}:${rel.targetColumns.join(',')}`;
      const existingRel = uniqueRelationships.get(key);

      if (!existingRel) {
        uniqueRelationships.set(key, rel);
      } else if (!rel.isInferred && existingRel.isInferred) {
        uniqueRelationships.set(key, rel);
      } else if (rel.isInferred && existingRel.isInferred) {
        const newConfidence = rel.confidence ?? 0;
        const existingConfidence = existingRel.confidence ?? 0;
        if (newConfidence > existingConfidence) {
          uniqueRelationships.set(key, rel);
        }
      }
    }

    return Array.from(uniqueRelationships.values()).sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );
  }
}