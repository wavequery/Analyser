# WaveQuery Database Analyser

WaveQuery Database Analyser is a powerful tool for analyzing and visualizing database schemas. It supports MySQL, PostgreSQL, MariaDB, BigQuery and SQLite databases, providing detailed information about tables, relationships, indexes, constraints, stored procedures, and views.

![DEMO](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzVpM2xkc2NudnB5ZzE0eXlucHB2dTAwM3VwcjZ6eW92YzU0dXMyNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FK1avllDK14VPt9RnY/giphy.gif)

## Features

- Support for MySQL, PostgreSQL, MariaDB, BigQuery and SQLite databases
- Detailed schema analysis including tables, columns, relationships, indexes, and constraints
- Visualization of database schema using D3.js
- Detection of junction tables for many-to-many relationships
- Information about stored procedures and views
- ability to manually add relationships and annotations
- Export schema data as JSON

## Installation

```
npm install @wavequery/analyser
```

## Usage

### CLI

To analyze a database and start the visualization server:

```
npx @wavequery/analyser -t <database_type> -h <host> -p <port> -u <username> -P <password> -d <database_name> -s -o /path/to/somewhere/
```

Options:
- `-t, --type`: Database type (postgres, mariadb, sqlite)
- `-h, --host`: Database host
- `-p, --port`: Database port
- `-u, --user`: Database user
- `-P, --password`: Database password
- `-d, --database`: Database name
- `-f, --file`: SQLite database file path (for SQLite only)
- `-o, --output <path>`, Path to export the JSON file
- `-s, --serve`: Start the visualization server after analysis
- `--debug`: Enable debug logging

Example:
```
npx @wavequery/analyser -t postgres -h localhost -p 5432 -u myuser -P mypassword -d mydb -s
```

After running the command, open a web browser and navigate to the URL provided in the console output to view the schema visualization.

### As a Library

You can also use DB Schema Finder as a library in your own projects. Here's a basic example:

```javascript
import { analyzeDatabase } from '@wavequery/analyser';
import { PostgresConnector } from '@wavequery/analyser';

async function runAnalysis() {
  const connector = new PostgresConnector({
    host: 'localhost',
    port: 5432,
    user: 'myuser',
    password: 'mypassword',
    database: 'mydb'
  });

  try {
    const result = await analyzeDatabase({connector, exportData});
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

runAnalysis();
```

## Contributing

This is a private package. For contribution guidelines, please contact the package maintainers.

## License

This project is licensed under the MIT License.
For licensing inquiries, please contact the package maintainers.
