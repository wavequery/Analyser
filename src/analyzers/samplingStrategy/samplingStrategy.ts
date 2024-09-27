interface SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string;
}

class MariaDBSamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    return `
      SELECT DISTINCT ${columnName}
      FROM ${tableName}
      ORDER BY RAND()
      LIMIT ${sampleSize}
    `;
  }
}

class MySQLSamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    return `
      SELECT DISTINCT ${columnName}
      FROM ${tableName}
      ORDER BY RAND()
      LIMIT ${sampleSize}
    `;
  }
}

class SQLiteSamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    return `
      SELECT DISTINCT ${columnName}
      FROM ${tableName}
      ORDER BY RANDOM()
      LIMIT ${sampleSize}
    `;
  }
}

class PostgresSamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    return `
      SELECT DISTINCT ${columnName}
      FROM ${tableName}
      ORDER BY RANDOM()
      LIMIT ${sampleSize}
    `;
  }
}

class BigQuerySamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    // BigQuery uses a different approach for sampling
    const samplingRate = Math.min(sampleSize / 1000, 1);
    return `
      SELECT DISTINCT ${columnName}
      FROM \`${tableName}\`
      WHERE RAND() < ${samplingRate}
      LIMIT ${sampleSize}
    `;
  }
}

function createSamplingStrategy(databaseType: string): SamplingStrategy {
  switch (databaseType.toLowerCase()) {
    case "mariadb":
      return new MariaDBSamplingStrategy();
    case "mysql":
      return new MySQLSamplingStrategy();
    case "sqlite":
      return new SQLiteSamplingStrategy();
    case "postgres":
      return new PostgresSamplingStrategy();
    case "bigquery":
      return new BigQuerySamplingStrategy();
    default:
      throw new Error(`Unsupported database type: ${databaseType}`);
  }
}

export {
  SamplingStrategy,
  MariaDBSamplingStrategy,
  PostgresSamplingStrategy,
  BigQuerySamplingStrategy,
  createSamplingStrategy,
};
