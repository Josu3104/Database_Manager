
import connectionManager from "../AuthAndConnections/connectionManagement.js";

// Get database objects using the master connection
const dbObjectsGetters = {
    // Get all schemas from a database
    getSchemas: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request()
                .query(`
                    SELECT s.name AS schema_name
                    FROM [${database}].sys.schemas s
                    WHERE s.name NOT IN ('sys', 'INFORMATION_SCHEMA', 'db_accessadmin', 'db_backupoperator', 'db_datareader', 'db_datawriter', 'db_ddladmin', 'db_denydatareader', 'db_denydatawriter', 'db_owner', 'db_securityadmin', 'guest', 'dbo')
                    ORDER BY s.name;
                `);
            console.log('Schemas fetched successfully for DB:', database, result.recordset);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching schemas:', err);
        }
    },

    // Get database info
    getDatabases: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections().find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = [{
                database_name: database
            }];
            console.log('Database for connection:', currentConnection.connectionName, 'Database:', database);
            return result;
        } catch (err) {
            console.error('Error fetching databases:', err);
        }
    },

    // Get all tables from a database
    getTables: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    CASE WHEN s.name = 'dbo' THEN 'default' ELSE s.name END AS schema_name,
                    t.name AS table_name
                FROM [${database}].sys.tables t
                JOIN [${database}].sys.schemas s ON t.schema_id = s.schema_id
                ORDER BY s.name, t.name;
            `);
            console.log('Tables fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching tables:', err);
        }
    },

   

    // Get all views from a database
    getViews: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    CASE WHEN s.name = 'dbo' THEN 'default' ELSE s.name END AS schema_name,
                    v.name AS view_name
                FROM [${database}].sys.views v
                JOIN [${database}].sys.schemas s ON v.schema_id = s.schema_id
                ORDER BY s.name, v.name;
            `);
            console.log('Views fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching views:', err);
        }
    },

    // Get all stored procedures from a database
    getProcedures: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    CASE WHEN s.name = 'dbo' THEN 'default' ELSE s.name END AS schema_name,
                    p.name AS procedure_name
                FROM [${database}].sys.procedures p
                JOIN [${database}].sys.schemas s ON p.schema_id = s.schema_id
                ORDER BY s.name, p.name;
            `);
            console.log('Procedures fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching procedures:', err);
        }
    },

    // Get all functions from a database
    getFunctions: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    CASE WHEN s.name = 'dbo' THEN 'default' ELSE s.name END AS schema_name,
                    o.name AS function_name
                FROM [${database}].sys.objects o
                JOIN [${database}].sys.schemas s ON o.schema_id = s.schema_id
                WHERE o.type IN ('FN','IF','TF','AF','FS','FT')
                ORDER BY s.name, o.name;
            `);
            console.log('Functions fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching functions:', err);
        }
    },

    // Get all sequences from a database
    getSequences: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    s.name AS schema_name,
                    seq.name AS sequence_name
                FROM [${database}].sys.sequences seq
                JOIN [${database}].sys.schemas s ON seq.schema_id = s.schema_id
                ORDER BY s.name, seq.name;
            `);
            console.log('Sequences fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching sequences:', err);
        }
    },

    // Get all triggers from a database
    getTriggers: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    tr.name AS trigger_name
                FROM [${database}].sys.triggers tr
                ORDER BY tr.name;
            `);
            console.log('Triggers fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching triggers:', err);
        }
    },

    // Get all indexes from a database
    getIndexes: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    i.name AS index_name
                FROM [${database}].sys.indexes i
                JOIN [${database}].sys.objects o ON i.object_id = o.object_id
                WHERE o.type IN ('U','V') AND i.index_id > 0
                ORDER BY i.name;
            `);
            console.log('Indexes fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching indexes:', err);
        }
    },

    // Get all tablespaces from a database
    getTableSpaces: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    fg.name AS filegroup_name
                FROM [${database}].sys.filegroups fg
                ORDER BY fg.name;
            `);
            console.log('Tablespaces fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching tablespaces:', err);
        }
    },

    // Get all database users
    getUsers: async (masterConnection, connectionName = null) => {
        try {
            let currentConnection;
            
            if (connectionName) {
                currentConnection = connectionManager.getActiveConnections()
                    .find(conn => conn.connectionName === connectionName);
                if (!currentConnection) {
                    console.error(`Connection ${connectionName} not found in active connections`);
                    return null;
                }
            } else {
                currentConnection = connectionManager.getCurrentConnection();
                if (!currentConnection) {
                    console.error('No current connection set');
                    return null;
                }
            }
            //'S' = SQL user, 'U' = Windows user, 'G' = Windows group
            const database = currentConnection.credentials?.database || currentConnection.database;
            const result = await masterConnection.request().query(`
                SELECT 
                    name AS user_name
                FROM [${database}].sys.database_principals
                WHERE type IN ('S','U','G')
                  AND name NOT IN ('dbo','guest','INFORMATION_SCHEMA','sys')
                ORDER BY name;
            `);
            console.log('Users fetched successfully for DB:', database);
            return result.recordset;
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    },

    // Get SSIS packages from SSISDB catalog
    //This specific function was done totally by ChatGPT, just to forcefullly adapt it to the requirements
    getPackages: async (masterConnection, connectionName = null) => {
        try {
            // Check if SSISDB exists first
            const ssisdbCheck = await masterConnection.request().query(`
                SELECT name FROM sys.databases WHERE name = 'SSISDB'
            `);
            
            if (ssisdbCheck.recordset.length === 0) {
                console.log('SSISDB catalog not found - SSIS is not configured');
                return [];
            }

            const result = await masterConnection.request().query(`
                SELECT 
                    f.name AS folder_name,
                    p.name AS project_name,
                    pkg.name AS package_name
                FROM [SSISDB].[catalog].[folders] f
                JOIN [SSISDB].[catalog].[projects] p ON f.folder_id = p.folder_id
                JOIN [SSISDB].[catalog].[packages] pkg ON p.project_id = pkg.project_id
                ORDER BY f.name, p.name, pkg.name;
            `);
            
            console.log('SSIS packages fetched successfully');
            return result.recordset;
        } catch (err) {
            console.error('Error fetching SSIS packages:', err);
            return [];
        }
    }
};


export default dbObjectsGetters;

