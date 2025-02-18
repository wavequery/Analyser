# WaveQuery Database Analyser


<div align="center">
  <p>
    <h3>Visualize and Master Your Database Schemas with Ease</h3>
    <p>
      <a href="https://www.npmjs.com/package/@wavequery/analyser">
        <img src="https://img.shields.io/npm/v/@wavequery/analyser.svg" alt="npm version" />
      </a>
      <a href="https://github.com/wavequery/analyser">
        <img src="https://img.shields.io/github/stars/wavequery/analyser?style=social" alt="GitHub Stars" />
      </a>
      <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready" />
      <img src="https://img.shields.io/badge/Node.js-%3E%3D16-green" alt="Node.js Version" />
    </p>
  </p>
</div>
<p align="center">
  <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzVpM2xkc2NudnB5ZzE0eXlucHB2dTAwM3VwcjZ6eW92YzU0dXMyNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FK1avllDK14VPt9RnY/giphy.gif" alt="WaveQuery Demo">
</p>
<div align="center">
  <p>
    <a href="https://beta.dashboard.wavequery.com/playground">Try Live Demo</a> •
    <a href="https://github.com/wavequery/analyser">GitHub</a> 
    <!-- <a href="https://discord.gg/wavequery">Discord</a> -->
    <!-- <a href="https://docs.wavequery.com">Documentation</a> • -->
  </p>
</div>


## 🚀 Features

- Support for major databases:
  - PostgreSQL
  - Clickhouse
  - MariaDB
  - BigQuery
  - MySQL
  - SQLite
- Comprehensive schema analysis
- Interactive visualization using D3.js
- Smart relationship detection
- Junction table identification
- Stored procedures and views analysis
- Manual relationship mapping
- Schema export as JSON

## 🎮 Try it Live

Experience WaveQuery Database Analyser instantly at [WaveQuery Playground](https://beta.dashboard.wavequery.com/playground):
- Explore sample database schemas
- Test with live databases
- Visualize complex relationships
- No setup required

## Installation

```
npm install @wavequery/analyser
```

## Usage

#### CLI

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

#### As a Library

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

Feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

[MIT](https://github.com/wavequery/analyser/blob/main/LICENSE) © [WaveQuery](https://github.com/wavequery)




