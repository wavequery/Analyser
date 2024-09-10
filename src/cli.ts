// src/cli.ts

import { Command } from "commander";
import { analyzeDatabase } from "./index";
import { PostgresConnector } from "./connectors/postgresConnector";
import { MariaDBConnector } from "./connectors/mariadbConnector";
import { SQLiteConnector } from "./connectors/sqliteConnector";

const program = new Command();

program
  .version("1.0.0")
  .description("A tool to analyze database schemas and relationships")
  .option("-t, --type <type>", "Database type (postgres, mariadb, sqlite)")
  .option("-h, --host <host>", "Database host")
  .option("-p, --port <port>", "Database port")
  .option("-d, --database <database>", "Database name")
  .option("-U, --user <user>", "Database user")
  .option("-P, --password <password>", "Database password")
  .option("-f, --file <file>", "SQLite database file path")
  .action(async (options) => {
    let connector;

    switch (options.type) {
      case "postgres":
        connector = new PostgresConnector(options);
        break;
      case "mariadb":
        connector = new MariaDBConnector(options);
        break;
      case "sqlite":
        connector = new SQLiteConnector(options);
        break;
      default:
        console.error("Unsupported database type");
        process.exit(1);
    }

    try {
      await analyzeDatabase(connector);
    } catch (error) {
      console.error("Failed to analyze database:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
