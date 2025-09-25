 import { Pool } from 'pg';

//This map will convert most of the mssql data types to postgresql data types
const typesMap = {
    int: 'INTEGER',
    bigint: 'BIGINT',
    smallint: 'SMALLINT',
    tinyint: 'SMALLINT', 
    bit: 'BOOLEAN',
    nvarchar: 'TEXT',
    varchar: 'TEXT',
    nchar: 'TEXT',
    char: 'TEXT',
    text: 'TEXT',
    ntext: 'TEXT',
    datetime: 'TIMESTAMP',
    smalldatetime: 'TIMESTAMP',
    date: 'DATE',
    decimal: 'NUMERIC',
    numeric: 'NUMERIC',
    float: 'DOUBLE PRECISION',
    real: 'REAL'
};

const migrator = {

    //Maps the data type from mssql to postgresql
    convertDataType(mssqlType) {
        if (!mssqlType) {
            console.log('mssql data type does not apply, setting to TEXT');
            return 'TEXT';
        }
        
        const sanitizedType = mssqlType.toLowerCase().trim();
        const pgType = typesMap[sanitizedType];
        
        if (!pgType) {
            console.log(`postgres data type: '${mssqlType}' does not apply, setting it to TEXT`);
            return 'TEXT';
        }
        
        return pgType;
    },

   //This will group the columns by their table name so the postgres query can be built easier
    groupColumnsByTable(columns) {
        const tableGroups = {};
        
        columns.forEach(column => {
            const tableName = column.table_name;
            
            if (!tableGroups[tableName]) {
                tableGroups[tableName] = [];
            }
            
            tableGroups[tableName].push(column);
        });
        
        return tableGroups;
    },
    
    // Extracts table structure from SQL Server database
    //Should look something like this: 
    //{ table_name: "Users", column_name: "id", data_type: "int", is_primary_key: 1 }

    async extractTableStructure(mssqlConnection, databaseName) {      
        try {
            const result = await mssqlConnection.request().query(
            `SELECT 
                t.name as table_name,
                s.name as schema_name,
                c.name as column_name,
                typ.name as data_type,
                CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
            FROM ${databaseName}.sys.tables t
            JOIN ${databaseName}.sys.schemas s ON t.schema_id = s.schema_id
            JOIN ${databaseName}.sys.columns c ON t.object_id = c.object_id
            JOIN ${databaseName}.sys.types typ ON c.user_type_id = typ.user_type_id
            LEFT JOIN (
                SELECT 
                    ic.object_id,
                    ic.column_id
                FROM ${databaseName}.sys.indexes i
                JOIN ${databaseName}.sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                WHERE i.is_primary_key = 1
            ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
            WHERE t.type = 'U' AND s.name != 'dbo'
            ORDER BY s.name, t.name, c.column_id`
            );
            console.log(result.recordset.length + ' columns returned.');
            return result.recordset;
        } catch (error) {
            console.error('Error getting the table structure:', error.message);
            throw error;
        }
    },

    //Extracts foreign key relationships from SQL Server database
    async extractForeignKeys(mssqlConnection, databaseName) {
        try {
            const result = await mssqlConnection.request().query(`
            SELECT 
                fk.name as fk_name,
                OBJECT_NAME(fkc.parent_object_id) as parent_table,
                COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as parent_column,
                OBJECT_NAME(fkc.referenced_object_id) as ref_table,
                COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as ref_column
            FROM ${databaseName}.sys.foreign_keys fk
            JOIN ${databaseName}.sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            ORDER BY fk.name, fkc.constraint_column_id
        `);
            console.log(`Found ${result.recordset.length} foreign keys.`);
            return result.recordset;
        } catch (error) {
            console.error('Error while extracting foreign keys:', error.message);
            return [];
        }
    },

    
     //Builds PostgreSQL CREATE TABLE statements from SQL Server column data.
     //Schemas are ignored
    buildCreateTableStatements(columns) {
        const createStatements = [];
        
        const tableGroups = {};
        columns.forEach(column => {
            const tableName = column.table_name;
            if (!tableGroups[tableName]) {
                tableGroups[tableName] = [];
            }
            tableGroups[tableName].push(column);
        });
        
        // Process each table one by one
        for (const [tableName, tableColumns] of Object.entries(tableGroups)) {
            const columnLines = [];
            const PKcolumns = [];
            
            tableColumns.forEach(column => {
                const columnDefinition = `"${column.column_name}" ${this.convertDataType(column.data_type)}`;
                columnLines.push(columnDefinition);
                if (column.is_primary_key) {
                    PKcolumns.push(`"${column.column_name}"`);
                }
            });
    
            if (PKcolumns.length > 0) {
                const PKConstraint = `PRIMARY KEY (${PKcolumns.join(', ')})`;
                columnLines.push(PKConstraint);
            }
            
            const CREATE = [
                `CREATE TABLE "${tableName}" (`,
                `  ${columnLines.join(',\n  ')}`,
                ');'
            ].join('\n');
            
            createStatements.push(CREATE);
        }
        
        return createStatements;
    },

    //Builds foreign key constraint statements for PostgreSQL
    buildForeignKeyStatements(foreignKeys) {
        const fkStatements = [];
        
        foreignKeys.forEach(fk => {
            const alterStatement = `ALTER TABLE "${fk.parent_table}" ADD CONSTRAINT "${fk.fk_name}" FOREIGN KEY ("${fk.parent_column}") REFERENCES "${fk.ref_table}" ("${fk.ref_column}");`;
            fkStatements.push(alterStatement);
        });
        
        return fkStatements;
    },

    // Copy data from SQL Server to PostgreSQL
    async extractAndInsertData(mssqlConnection, databaseName, pgPool, tableInfo) {
        const results = [];
        
        for (const table of tableInfo) {
            console.log(`Copying data from ${table.schemaName}.${table.tableName}`);
            
            // Get data from SQL Server
            const data = await mssqlConnection.request().query(
                `SELECT * FROM ${table.schemaName}.${table.tableName}`
            );
            
            const rows = data.recordset;
            console.log(`Found ${rows.length} rows`);
            
            if (rows.length === 0) {
                results.push({
                    table: `${table.schemaName}.${table.tableName}`,
                    rowsInserted: 0,
                    success: true,
                    message: 'No data to copy'
                });
                continue;
            }
            
            
            const columns = Object.keys(rows[0]);
            const columnNames = columns.map(col => `"${col}"`).join(', ');
            
            const values = [];
            for (const row of rows) {
                const rowData = [];
                for (const col of columns) {
                    const val = row[col];
                    if (val === null) {
                        rowData.push('NULL');
                    } else if (typeof val === 'string') {
                        rowData.push(`'${val.replace(/'/g, "''")}'`);
                    } else if (typeof val === 'boolean') {
                        rowData.push(val ? 'TRUE' : 'FALSE');
                    } else if (val instanceof Date) {
                        rowData.push(`'${val.toISOString()}'`);
                    } else {
                        rowData.push(val.toString());
                    }
                }
                values.push(`(${rowData.join(', ')})`);
            }
            
        
            
            // Finally, Insert into PotgreSQL
            await pgPool.query(
                `INSERT INTO "${table.tableName}" (${columnNames}) VALUES ${values.join(', ')}`
            );
            console.log(`Copied ${rows.length} rows to ${table.tableName}`);
            
            results.push({
                table: `${table.schemaName}.${table.tableName}`,
                rowsInserted: rows.length,
                success: true,
                message: `Copied ${rows.length} rows`
            });
        }
        
        return results;
    },

    // Main migrate Function function
    async performMigration(mssqlConnection, databaseName, pgCredentials) {
        let pgPool = null;
        
        try {
            //Main connection
            pgPool = new Pool({
                user: pgCredentials.user,
                host: pgCredentials.host,
                database: pgCredentials.database,
                password: pgCredentials.password,
                port: pgCredentials.port || 5432,
            });
            
            try {
                await pgPool.query('SELECT NOW()');
            } catch (connectionError) {
                console.error('Failed to connect to PostgreSQL database:', connectionError.message);
                throw new Error(`PostgreSQL connection failed: ${connectionError.message}`);
            }

            try {
                const dbCheckResult = await pgPool.query(
                    `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`
                );
                
                if (dbCheckResult.rows.length === 0) {    
                    await pgPool.query(`CREATE DATABASE "${databaseName}"`);
                }
            } catch (dbError) {
                console.error(`Failed to create database "${databaseName}":`, dbError.message);
                throw new Error(`Database creation failed: ${dbError.message}`);
            }
            await pgPool.end();
            
            pgPool = new Pool({
                user: pgCredentials.user,
                host: pgCredentials.host,
                database: databaseName, 
                password: pgCredentials.password,
                port: pgCredentials.port || 5432,
            });
            
            const columns = await this.extractTableStructure(mssqlConnection, databaseName);
            const foreignKeys = await this.extractForeignKeys(mssqlConnection, databaseName);
            const createStatements = this.buildCreateTableStatements(columns);
            
            for (let i = 0; i < createStatements.length; i++) {
                const statement = createStatements[i];
                try {
                    const result = await pgPool.query(statement);
                } catch (tableError) {
                    console.error(`Failed to create table ${i}:`, tableError.message);
                    throw new Error(`Failed to create table: ${tableError.message}`);
                }
            }
            
            const fkStatements = this.buildForeignKeyStatements(foreignKeys);
            for (const statement of fkStatements) {
                try {
                    await pgPool.query(statement);
                } catch (fkError) {
                    console.error('Could not add foreign key constraint:', fkError.message);
                }
            }
            
            const tableMap = new Map();
            columns.forEach(col => {
                const key = `${col.schema_name}.${col.table_name}`;
                if (!tableMap.has(key)) {
                    tableMap.set(key, {
                        tableName: col.table_name,
                        schemaName: col.schema_name
                    });
                }
            });
            const tableInfo = Array.from(tableMap.values());
            
            try {
                await this.extractAndInsertData(mssqlConnection, databaseName, pgPool, tableInfo);
            } catch (dataError) {
                console.error('Failed during data insertion:', dataError.message);
                throw new Error(`Data insertion failed: ${dataError.message}`);
            }
            
            return {
                success: true,
                message: 'Migration completed successfully!'
            };
            
        } catch (error) {
            console.error('Migration failed:', error.message);
            return {
                success: false,
                message: `Migration failed: ${error.message}`,
                error: error.message
            };
        } finally {
            if (pgPool) {
                await pgPool.end();
            }
        }
    }

};

export default migrator;