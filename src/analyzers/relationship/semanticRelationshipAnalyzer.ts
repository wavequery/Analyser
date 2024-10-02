import { Table, Column } from "../../schemas/tableSchema";
import { Relationship } from "../../schemas/relationshipSchema";

import * as tf from "@tensorflow/tfjs-node";
import * as use from "@tensorflow-models/universal-sentence-encoder";

class SemanticRelationshipAnalyzer {
  private model!: use.UniversalSentenceEncoder;

  constructor() {}

  async initialize() {
    if (!this.model) {
      this.model = await use.load();
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

  private async getTableEmbeddings(tables: Table[]): Promise<tf.Tensor2D[]> {
    if (!this.model) {
      throw new Error("Model not initialized");
    }
    const tableDescriptions = tables.map(
      (table) =>
        `${table.name} ${table.columns.map((col) => col.name).join(" ")}`
    );
    const embeddingTensor = await this.model.embed(tableDescriptions);
    return Array.from(tf.unstack(embeddingTensor)) as tf.Tensor2D[];
  }

  private calculateSimilarity(
    embedding1: tf.Tensor2D,
    embedding2: tf.Tensor2D
  ): number {
    const cosineSimilarity = tf.tidy(() => {
      return tf.losses.cosineDistance(embedding1, embedding2, 0).dataSync()[0];
    });
    return 1 - cosineSimilarity;
  }
}

export { SemanticRelationshipAnalyzer };
