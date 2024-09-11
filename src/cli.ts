#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeDatabase } from './index';
import { PostgresConnector } from './connectors/postgresConnector';
import { MariaDBConnector } from './connectors/mariadbConnector';
import { SQLiteConnector } from './connectors/sqliteConnector';
import { fork, ChildProcess } from 'child_process';
import path from 'path';
import open from 'open';
import { DatabaseConnector } from './connectors/baseConnector';

console.log('CLI script is running');

const program = new Command();

program
  .version('1.0.0')
  .description('A tool to analyze database schemas and relationships')
  .option('-t, --type <type>', 'Database type (postgres, mariadb, sqlite)')
  .option('-h, --host <host>', 'Database host')
  .option('-p, --port <port>', 'Database port')
  .option('-d, --database <database>', 'Database name')
  .option('-u, --user <user>', 'Database user')
  .option('-P, --password <password>', 'Database password')
  .option('-f, --file <file>', 'SQLite database file path')
  .option('-s, --serve', 'Start the visualization server after analysis')
  .action(async (options) => {
    console.log('Action function is running');
    console.log('Options:', options);
    let connector: DatabaseConnector;

    switch (options.type) {
      case 'postgres':
        connector = new PostgresConnector(options);
        break;
      case 'mariadb':
        connector = new MariaDBConnector(options);
        break;
      case 'sqlite':
        connector = new SQLiteConnector(options);
        break;
      default:
        console.error('Unsupported database type');
        process.exit(1);
    }

    try {
      connector = await analyzeDatabase(connector);
      console.log('Database analysis completed successfully.');
    } catch (error) {
      console.error('Failed to analyze database:', error);
      await connector.disconnect();
      process.exit(1);
    }

    console.log('Post-analysis execution reached');
    console.log('Serve option:', options.serve);
    
    if (options.serve) {
      console.log('Starting visualization server...');
      const serverPath = path.join(__dirname, 'server.js');
      console.log('Server path:', serverPath);
      
      try {
        const server: ChildProcess = fork(serverPath);
        
        server.on('message', (message: any) => {
          console.log('Received message from server:', message);
          if (message.type === 'server_start') {
            console.log(`Server started on port ${message.port}`);
            open(`http://localhost:${message.port}`);
          }
        });

        server.on('error', (error) => {
          console.error('Server error:', error);
        });

        server.on('exit', async (code, signal) => {
          console.log(`Server process exited with code ${code} and signal ${signal}`);
          console.log('Disconnecting from database...');
          await connector.disconnect();
          process.exit(0);
        });

        console.log('Server process forked');
      } catch (error) {
        console.error('Error starting server:', error);
        await connector.disconnect();
        process.exit(1);
      }

      // Keep the main process running
      console.log('Keeping main process alive...');
      process.stdin.resume();
    } else {
      console.log('Server not started. Use -s or --serve option to start the server.');
      console.log('Disconnecting from database...');
      await connector.disconnect();
      process.exit(0);
    }
    
    console.log('End of action function reached');
  });

console.log('Parsing command line arguments...');
program.parse(process.argv);
console.log('Command line arguments parsed');