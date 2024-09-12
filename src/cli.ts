#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import open from "open";
import { fork, ChildProcess } from "child_process";

import { analyzeDatabase } from "./analyzers/databaseAnalyzer";

import { PostgresConnector } from "./connectors/postgresConnector";
import { MariaDBConnector } from "./connectors/mariadbConnector";
import { SQLiteConnector } from "./connectors/sqliteConnector";
import { MySQLConnector } from './connectors/mysqlConnector';
import { DatabaseConnector } from "./connectors/baseConnector";

import { logger } from "./utils/logger";

const program = new Command();

program
  .version("1.0.0")
  .description("A tool to analyze database schemas and relationships")
  .option("-t, --type <type>", "Database type (postgres, mariadb, sqlite)")
  .option("-h, --host <host>", "Database host")
  .option("-p, --port <port>", "Database port")
  .option("-d, --database <database>", "Database name")
  .option("-u, --user <user>", "Database user")
  .option("-P, --password <password>", "Database password")
  .option("-f, --file <file>", "SQLite database file path")
  .option("-s, --serve", "Start the visualization server after analysis")
  .option("--debug", "Enable debug logging", false)
  .action(async (options) => {
    logger.setDebugMode(options.debug);
    logger.log("CLI script is running");
    logger.log("Action function is running");
    logger.log("Options:", options);
    let connector: DatabaseConnector;


    const connectorOptions = {
      host: options.host,
      port: parseInt(options.port),
      user: options.user,
      password: options.password,
      database: options.database
    };

    switch (options.type) {
      case "postgres":
        connector = new PostgresConnector(connectorOptions);
        break;
      case "mysql":
        connector = new MySQLConnector(connectorOptions);
        break;
      case "mariadb":
        connector = new MariaDBConnector(connectorOptions);
        break;
      case "sqlite":
        connector = new SQLiteConnector(options.file);
        break;
      default:
        logger.error("Unsupported database type");
        process.exit(1);
    }

    try {
      connector = await analyzeDatabase({ connector, logger });
      logger.log("Database analysis completed successfully.");
    } catch (error) {
      logger.error("Failed to analyze database:", error);
      await connector.disconnect();
      process.exit(1);
    }

    logger.log("Post-analysis execution reached");

    if (options.serve) {
      logger.log("Starting visualization server...");
      const serverPath = path.join(__dirname, "server.js");
      logger.log("Server path:", serverPath);

      try {
        const server: ChildProcess = fork(serverPath, [], {
          env: { ...process.env, DEBUG: options.debug ? "true" : "false" },
        });

        server.on("message", (message: any) => {
          logger.log("Received message from server:", message);
          if (message.type === "server_start") {
            logger.log(`Server started on port ${message.port}`);
            open(`http://localhost:${message.port}`);
          }
        });

        server.on("error", (error) => {
          logger.error("Server error:", error);
        });

        server.on("exit", async (code, signal) => {
          logger.log(
            `Server process exited with code ${code} and signal ${signal}`
          );
          logger.log("Disconnecting from database...");
          await connector.disconnect();
          process.exit(0);
        });

        logger.log("Server process forked");
      } catch (error) {
        logger.error("Error starting server:", error);
        await connector.disconnect();
        process.exit(1);
      }

      // Keep the main process running
      logger.log("Keeping main process alive...");
      process.stdin.resume();
    } else {
      logger.log("Disconnecting from database...");
      process.exit(0);
    }

    await connector.disconnect();
  });

logger.log("Parsing command line arguments...");
program.parse(process.argv);
logger.log("Command line arguments parsed");
