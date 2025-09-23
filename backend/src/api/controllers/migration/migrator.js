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
    
    //This will build a table that has the columns and their data types, it looks so weird but works, so extra functions might be needed. Plenty.
    async extractTableStructure(mssqlConnection, databaseName) {      
        try {
            const result = await mssqlConnection.request().query(
            `SELECT 
                t.name as table_name,
                c.name as column_name,
                typ.name as data_type,
                CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
            FROM ${databaseName}.sys.tables t
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
            WHERE t.type = 'U'
            ORDER BY t.name, c.column_id`
            );
            console.log(result.recordset.length + ' columns returned.');
            return result.recordset;
        } catch (error) {
            console.error('Error getting the table structure:', error.message);
            throw error;
        }
    },

    //Fetches the foreign keys 
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
            throw error;
        }
    },

    
};

export default migrator;