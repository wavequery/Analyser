export type DatabaseType = "mysql" | "postgres" | "bigquery";

export interface SchemaConfig {
  foreignKeySuffixes: string[];
  foreignKeyPrefixes: string[];
  primaryKeySuffixes: string[];
  primaryKeyPrefixes: string[];
  manyToManySuffixes: string[];
  ignoredTables: string[];
  ignoredColumns: string[];
}

export const defaultSchemaConfig: SchemaConfig = {
  foreignKeySuffixes: [
    "_id",
    "_key",
    "_code",
    "_fk",
    "_ref",
    "_uuid",
    "_no",
    "_number",
    "_identifier",
  ],
  foreignKeyPrefixes: ["fk_", "foreign_", "ref_", "external_", "linked_"],
  primaryKeySuffixes: [
    "_id",
    "_key",
    "_pk",
    "_uuid",
    "_code",
    "_identifier",
    "_serial",
    "_sequence",
  ],
  primaryKeyPrefixes: ["pk_", "primary_", "id_", "main_", "key_"],
  manyToManySuffixes: [
    "_mapping",
    "_map",
    "_junction",
    "_link",
    "_bridge",
    "_xref",
    "_relation",
    "_association",
    "_pivot",
    "_join",
  ],
  ignoredTables: [
    "migrations",
    "seeds",
    "schema_migrations",
    "flyway_schema_history",
    "ar_internal_metadata",
    "django_migrations",
    "alembic_version",
    "knex_migrations",
    "sequelize_meta",
    "changelog",
  ],
  ignoredColumns: [
    "created_at",
    "updated_at",
    "deleted_at",
    "modified_at",
    "timestamp",
    "version",
    "created_by",
    "updated_by",
    "is_deleted",
    "is_active",
    "last_modified",
    "revision",
  ],
};
