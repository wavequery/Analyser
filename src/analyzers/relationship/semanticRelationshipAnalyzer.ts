import { Table, Column } from "../../schemas/tableSchema";
import { Relationship } from "../../schemas/relationshipSchema";

import {
  TensorFlowImports,
  loadTensorFlowImports,
} from "../../utils/tfjs-imports";

class SemanticRelationshipAnalyzer {
  private model: any;
  private tfImports!: TensorFlowImports;

  constructor() {}

  async initialize() {
    if (!this.tfImports) {
      this.tfImports = await loadTensorFlowImports();
    }

    if (!this.model) {
      this.model = await this.tfImports.use.load();
    }
  }

  async analyze(tables: Table[]): Promise<Relationship[]> {
    if (!this.model) {
      await this.initialize();
    }

    const relationships: Relationship[] = [];
    const embeddings = await this.getTableEmbeddings(tables);

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const similarity = await this.calculateSimilarity(
          embeddings[i],
          embeddings[j]
        );
        if (similarity > 0.9) {
          relationships.push({
            sourceTable: tables[i].name,
            targetTable: tables[j].name,
            sourceColumns: [],
            targetColumns: [],
            isInferred: true,
            confidence: similarity,
            type: "semantic",
          });
        }
      }
    }

    return relationships;
  }

  private async getTableEmbeddings(tables: Table[]): Promise<any[]> {
    if (!this.model || !this.tfImports) {
      throw new Error("Model or TensorFlow imports not initialized");
    }
    const tableDescriptions = tables.map(
      (table) =>
        `${table.name} ${table.columns.map((col) => col.name).join(" ")}`
    );
    const embeddingTensor = await this.model.embed(tableDescriptions);
    return Array.from(this.tfImports.tf.unstack(embeddingTensor));
  }

  private calculateSimilarity(embedding1: any, embedding2: any): number {
    const cosineSimilarity = this.tfImports.tf.tidy(() => {
      return this.tfImports.tf.losses
        .cosineDistance(embedding1, embedding2, 0)
        .dataSync()[0];
    });
    return 1 - cosineSimilarity;
  }
}

export { SemanticRelationshipAnalyzer };
