# DB Schema Finder

DB Schema Finder is a powerful tool for analyzing and visualizing database schemas. It supports PostgreSQL, MariaDB, and SQLite databases, providing detailed information about tables, relationships, indexes, constraints, stored procedures, and views.

## Features

- Support for PostgreSQL, MariaDB, and SQLite databases
- Detailed schema analysis including tables, columns, relationships, indexes, and constraints
- Visualization of database schema using D3.js
- Detection of junction tables for many-to-many relationships
- Information about stored procedures and views
- ability to manually add relationships and annotations
- Export schema data as JSON

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/db-schema-finder.git
   cd db-schema-finder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

## Usage

### CLI

To analyze a database and start the visualization server:

```
node dist/cli.js -t <database_type> -h <host> -p <port> -u <username> -P <password> -d <database_name> -s
```

Options:
- `-t, --type`: Database type (postgres, mariadb, sqlite)
- `-h, --host`: Database host
- `-p, --port`: Database port
- `-u, --user`: Database user
- `-P, --password`: Database password
- `-d, --database`: Database name
- `-f, --file`: SQLite database file path (for SQLite only)
- `-s, --serve`: Start the visualization server after analysis
- `--debug`: Enable debug logging

Example:
```
node dist/cli.js -t postgres -h localhost -p 5432 -u myuser -P mypassword -d mydb -s
```

After running the command, open a web browser and navigate to the URL provided in the console output to view the schema visualization.

### As a Library

You can also use DB Schema Finder as a library in your own projects. Here's a basic example:

```javascript
import { analyzeDatabase } from 'db-schema-finder';
import { PostgresConnector } from 'db-schema-finder/connectors';

async function runAnalysis() {
  const connector = new PostgresConnector({
    host: 'localhost',
    port: 5432,
    user: 'myuser',
    password: 'mypassword',
    database: 'mydb'
  });

  try {
    const result = await analyzeDatabase({connector});
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

runAnalysis();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.