import { DatabaseType } from "./schemaConfig";

interface TypeMapping {
  [key: string]: string[];
}

const typeCompatibility: Record<DatabaseType, TypeMapping> = {
  mysql: {
    int: ["tinyint", "smallint", "mediumint", "bigint", "bit"],
    decimal: ["float", "double", "numeric"],
    varchar: [
      "char",
      "text",
      "tinytext",
      "mediumtext",
      "longtext",
      "enum",
      "set",
    ],
    datetime: ["timestamp", "date", "time", "year"],
    blob: ["tinyblob", "mediumblob", "longblob", "binary", "varbinary"],
    json: ["json"],
    geometry: [
      "point",
      "linestring",
      "polygon",
      "multipoint",
      "multilinestring",
      "multipolygon",
      "geometrycollection",
    ],
  },
  postgres: {
    integer: ["smallint", "bigint", "serial", "smallserial", "bigserial"],
    numeric: ["decimal", "real", "double precision", "money"],
    "character varying": ["character", "text", "name", "varchar"],
    timestamp: [
      "date",
      "time",
      "timestamp with time zone",
      "timestamp without time zone",
      "time with time zone",
      "time without time zone",
      "interval",
    ],
    bytea: ["bit", "bit varying"],
    json: ["jsonb"],
    boolean: ["bool"],
    uuid: ["uuid"],
    cidr: ["inet", "macaddr", "macaddr8"],
    point: ["line", "lseg", "box", "path", "polygon", "circle"],
    tsquery: ["tsvector"],
    xml: ["xml"],
  },
  bigquery: {
    INT64: ["INT", "SMALLINT", "INTEGER", "BIGINT", "TINYINT", "BYTEINT"],
    FLOAT64: ["FLOAT", "DOUBLE", "DECIMAL", "NUMERIC", "BIGNUMERIC"],
    STRING: ["CHAR", "VARCHAR", "CLOB", "TEXT"],
    BOOL: ["BOOLEAN"],
    BYTES: ["BINARY", "VARBINARY", "BLOB"],
    DATE: ["DATE"],
    TIME: ["TIME"],
    DATETIME: ["DATETIME"],
    TIMESTAMP: ["TIMESTAMP"],
    ARRAY: ["ARRAY"],
    STRUCT: ["STRUCT", "RECORD"],
    GEOGRAPHY: ["GEOGRAPHY"],
    JSON: ["JSON"],
  },
};

function getBaseType(type: string): string {
  return type.split("(")[0].toLowerCase();
}

function areTypesCompatible(
  type1: string,
  type2: string,
  dbType: DatabaseType
): boolean {
  const baseType1 = getBaseType(type1);
  const baseType2 = getBaseType(type2);

  if (baseType1 === baseType2) return true;

  const compatibleTypes = typeCompatibility[dbType][baseType1] || [];
  return compatibleTypes.includes(baseType2);
}

export { areTypesCompatible };
