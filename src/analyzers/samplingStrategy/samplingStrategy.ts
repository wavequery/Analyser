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

class ClickhouseSamplingStrategy implements SamplingStrategy {
  getSampleQuery(
    tableName: string,
    columnName: string,
    sampleSize: number
  ): string {
    // Clickhouse supports two efficient sampling methods:
    // 1. SAMPLE - for tables with sampling key
    // 2. ORDER BY rand() - for tables without sampling key

    // We'll use a combination to ensure we get a good random sample
    // The subquery with SAMPLE helps reduce the initial data set
    // The outer query ensures we get exactly the number of distinct values we want
    return `
      SELECT DISTINCT ${columnName}
      FROM (
        SELECT ${columnName}
        FROM ${tableName}
        SAMPLE ${Math.min(
          (sampleSize * 100) / 1000,
          100
        )} -- Convert desired rows to percentage, max 100%
        ORDER BY rand()
      )
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
    case "clickhouse":
      return new ClickhouseSamplingStrategy();
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
