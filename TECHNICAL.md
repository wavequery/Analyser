# DB Schema Finder - Technical Documentation

## Architecture

DB Schema Finder is built with a modular architecture, consisting of the following main components:

1. Database Connectors
2. Schema Analyzer
3. Relationship Analyzer
4. Topological Sort Utility
5. Junction Table Detector
6. Visualization (D3.js)

## Algorithms

### Topological Sort

We use a topological sort algorithm to order the tables based on their dependencies. This helps in visualizing the schema in a logical order.

The algorithm works as follows:
1. Build a graph representation of table dependencies.
2. Perform a depth-first search (DFS) on the graph.
3. Add each node to the result list after all its dependencies have been visited.

Time Complexity: O(V + E), where V is the number of tables and E is the number of relationships.

### Junction Table Detection

To detect potential junction tables for many-to-many relationships, we use the following heuristic:

1. Identify tables with exactly two foreign keys.
2. Check if these tables have no other columns besides the primary key and foreign keys.

Time Complexity: O(N), where N is the number of tables.

## Constraints and Limitations

1. Database Support: Currently limited to PostgreSQL, MariaDB, and SQLite.
2. Schema Size: Large schemas with many tables and relationships may become difficult to visualize effectively.
3. Performance: For very large databases, the analysis process may take considerable time.
4. Security: The tool requires database credentials, which need to be handled securely.
5. SQLite Limitations: SQLite doesn't support stored procedures and has limited constraint information.

## Potential Improvements

1. Caching: Implement caching of schema analysis results to improve performance for repeated analyses.
2. Incremental Updates: Allow for incremental schema updates instead of full re-analysis.
3. Advanced Visualization: Implement more advanced visualization techniques, such as force-directed layouts or hierarchical views.
4. Query Analysis: Incorporate analysis of common queries to identify frequently used table joins and access patterns.
5. Schema Diff: Add functionality to compare and visualize differences between two schema versions.
6. Performance Optimization: Optimize the analysis process for very large schemas.
7. Additional Database Support: Extend support to other database systems like Oracle, SQL Server, etc.
8. Security Enhancements: Implement more robust security measures for handling database credentials.
9. Machine Learning Integration: Use machine learning techniques to suggest schema optimizations or identify potential issues.
10. API Documentation: Generate comprehensive API documentation for library usage.

## Testing Strategy


## Contribution Guidelines

1. Code Style: Follow the established code style (e.g., use of TypeScript, naming conventions).
2. Documentation: Update relevant documentation when adding or modifying features.
3. Testing: Add appropriate tests for new features or bug fixes.
4. Pull Requests: Create detailed pull requests describing the changes and their rationale.
5. Issue Tracking: Use GitHub Issues for bug reports, feature requests, and discussions.