import { SchemaAnalyzer } from '../../src/analyzers/schemaAnalyzer';
import { DatabaseConnector } from '../../src/connectors/baseConnector';
import { jest } from '@jest/globals';

describe('SchemaAnalyzer', () => {
  let mockConnector: jest.Mocked<DatabaseConnector>;

  beforeEach(() => {
    mockConnector = {
      getTables: jest.fn(),
      getColumns: jest.fn(),
    } as any;
  });

  it('should get tables and columns correctly', async () => {
    mockConnector.getTables.mockResolvedValue(['users', 'posts']);
    mockConnector.getColumns.mockResolvedValue([
      { name: 'id', type: 'int', isNullable: false, isPrimaryKey: true },
      { name: 'name', type: 'varchar', isNullable: false, isPrimaryKey: false },
    ]);

    const schemaAnalyzer = new SchemaAnalyzer(mockConnector);
    const result = await schemaAnalyzer.getTables();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('users');
    expect(result[0].columns).toHaveLength(2);
    expect(result[0].primaryKeys).toEqual(['id']);
  });

  it('should handle errors when getting tables', async () => {
    mockConnector.getTables.mockRejectedValue(new Error('Database error'));

    const schemaAnalyzer = new SchemaAnalyzer(mockConnector);
    await expect(schemaAnalyzer.getTables()).rejects.toThrow('Database error');
  });

  // Add more test cases for different scenarios
});