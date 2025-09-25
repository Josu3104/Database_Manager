import express from 'express';
import connectionManager from '../controllers/AuthAndConnections/connectionManagement.js';
import dbObjectsGetters from '../controllers/databaseObjects/dbObjects.js';
import DDL from '../controllers/databaseObjects/dbDLL.js';
import { readCredentials, deleteCredentials } from '../controllers/AuthAndConnections/fileManagement.js';
import { readdir } from 'fs/promises';
import { join } from 'path';
import migrator from '../controllers/migration/migrator.js';

const router = express.Router();

// Get active connections
router.get('/active-connections', (req, res) => {
  try {
    const active = connectionManager.getActiveConnections().map(conn => ({
      name: conn.connectionName,
      user: conn.user,
      database: conn.database
    }));
    
    res.json({ connections: active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available connections with active status
router.get('/connections', async (req, res) => {
  try {
    const connectionsPath = './src/api/controllers/AuthAndConnections/connectionsJSON/';
    const files = await readdir(connectionsPath);
    const connections = [];
    const activeConnections = connectionManager.getActiveConnections();
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const creds = await readCredentials(join(connectionsPath, file));
        if (creds && creds.connectionName !== 'master') { 
          const isActive = activeConnections.some(active => active.connectionName === creds.connectionName);
          connections.push({
            name: creds.connectionName,
            user: creds.user,
            database: creds.database,
            server: creds.server || 'sqlserver',
            port: creds.port || 1433,
            isActive: isActive
          });
        }
      }
    }
    
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to a specific database
router.post('/connect', async (req, res) => {
  try {
    const { connectionName } = req.body;
    const creds = await readCredentials(`./src/api/controllers/AuthAndConnections/connectionsJSON/${connectionName}.json`);
    const connectionMetadata = await connectionManager.connectWith(creds);
    
    res.json({
      success: true,
      connection: {
        name: connectionMetadata.connectionName,
        user: connectionMetadata.user,
        database: connectionMetadata.database
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from a specific database
router.post('/disconnect', async (req, res) => {
  try {
    const { connectionName } = req.body;
    const activeConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === connectionName);
    
    if (activeConnection) {
      await connectionManager.disconnectFrom(activeConnection);
      res.json({ success: true, message: `Disconnected from ${connectionName}` });
    } else {
      res.status(404).json({ error: `Connection ${connectionName} not found or already disconnected` });
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new database connection
router.post('/create-connection', async (req, res) => {
  try {
    const credentials = req.body;
    
    // Validate required fields
    const requiredFields = ['connectionName', 'user', 'password', 'server', 'database'];
    for (const field of requiredFields) {
      if (!credentials[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Get the master connection from active connections
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available for creating new connections' });
    }
    
    // Create the connection using the existing createConnection function
    const success = await connectionManager.createConnection(credentials, masterConnection);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Connection ${credentials.connectionName} created successfully` 
      });
    } else {
      res.status(500).json({ error: 'Failed to create connection' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current connection
router.get('/current-connection', (req, res) => {
  try {
    const current = connectionManager.getCurrentConnection();
    if (!current) {
      return res.json({ connection: null });
    }
    
    res.json({
      connection: {
        name: current.connectionName,
        user: current.user,
        database: current.database
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database objects endpoints
router.get('/databases', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const databases = await dbObjectsGetters.getDatabases(masterConnection, connectionName);
    res.json({ databases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/schemas', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const schemas = await dbObjectsGetters.getSchemas(masterConnection, connectionName);
    res.json({ schemas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tables', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const tables = await dbObjectsGetters.getTables(masterConnection, connectionName);
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/views', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const views = await dbObjectsGetters.getViews(masterConnection, connectionName);
    res.json({ views });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/procedures', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const procedures = await dbObjectsGetters.getProcedures(masterConnection, connectionName);
    res.json({ procedures });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/functions', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const functions = await dbObjectsGetters.getFunctions(masterConnection, connectionName);
    res.json({ functions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sequences', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const sequences = await dbObjectsGetters.getSequences(masterConnection, connectionName);
    res.json({ sequences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/triggers', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const triggers = await dbObjectsGetters.getTriggers(masterConnection, connectionName);
    res.json({ triggers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/indexes', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const indexes = await dbObjectsGetters.getIndexes(masterConnection, connectionName);
    res.json({ indexes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tablespaces', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const tablespaces = await dbObjectsGetters.getTableSpaces(masterConnection, connectionName);
    res.json({ tablespaces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const users = await dbObjectsGetters.getUsers(masterConnection, connectionName);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/packages', async (req, res) => {
  try {
    const { connectionName } = req.query;
    const masterConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === 'master')?.pool;
    
    if (!masterConnection) {
      return res.status(500).json({ error: 'Master connection not available' });
    }
    
    const packages = await dbObjectsGetters.getPackages(masterConnection, connectionName);
    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute SQL query
router.post('/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body;
    const currentConnection = connectionManager.getCurrentConnection();
    
    if (!currentConnection) {
      return res.status(400).json({ error: 'No active connection' });
    }
    
    const result = await DDL.executeSql(currentConnection, sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Delete a database connection
router.delete('/delete-connection', async (req, res) => {
  try {
    const { connectionName } = req.body;
    
    // First disconnect if the connection is active
    const activeConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === connectionName);
    
    if (activeConnection) {
      await connectionManager.disconnectFrom(activeConnection);
    }
    
    // Delete the connection file
    const deleted = await deleteCredentials(connectionName);
    
    if (deleted) {
      res.json({ success: true, message: `Connection ${connectionName} deleted successfully` });
    } else {
      res.status(404).json({ error: `Connection ${connectionName} not found or could not be deleted` });
    }
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrator route
router.post('/migrate', async (req, res) => {
  try {
    const { connectionName, pgCredentials } = req.body;
    
    const requiredPgFields = ['user', 'host', 'database', 'password'];
    for (const field of requiredPgFields) {
      if (!pgCredentials[field]) {
        return res.status(400).json({ error: `Missing required PostgreSQL field: ${field}` });
      }
    }
    
    if (!connectionName) {
      return res.status(400).json({ error: 'Missing required field: connectionName' });
    }
    
    // Get the source MSSQL connection
    const sourceConnection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === connectionName);
    
    if (!sourceConnection) {
      return res.status(400).json({ error: `Connection ${connectionName} not found or not active` });
    }
    
    
    const databaseName = sourceConnection.database;
    // Migrate.
    const result = await migrator.performMigration(
      sourceConnection.pool, 
      databaseName, 
      pgCredentials
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false,
      error: `Migration failed: ${error.message}` 
    });
  }
});

// Get database schema for relational diagram
router.get('/schema/:connectionName', async (req, res) => {
  try {
    const { connectionName } = req.params;
    
    const connection = connectionManager.getActiveConnections()
      .find(conn => conn.connectionName === connectionName);
      
    if (!connection) {
      return res.status(400).json({ error: `Connection ${connectionName} not found` });
    }
    
    const databaseName = connection.database;
    

    const tablesResult = await connection.pool.request().query(`
      SELECT 
        t.name as table_name,
        c.name as column_name,
        tp.name as data_type,
        CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
      FROM ${databaseName}.sys.tables t
      JOIN ${databaseName}.sys.columns c ON t.object_id = c.object_id
      JOIN ${databaseName}.sys.types tp ON c.user_type_id = tp.user_type_id
      LEFT JOIN ${databaseName}.sys.index_columns pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id 
        AND pk.index_id = (SELECT index_id FROM ${databaseName}.sys.indexes WHERE object_id = t.object_id AND is_primary_key = 1)
      ORDER BY t.name, c.column_id
    `);
    
    // Get foreign keys
    const fkResult = await connection.pool.request().query(`
      SELECT 
        OBJECT_NAME(fkc.parent_object_id) as parent_table,
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as parent_column,
        OBJECT_NAME(fkc.referenced_object_id) as ref_table,
        COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as ref_column
      FROM ${databaseName}.sys.foreign_keys fk
      JOIN ${databaseName}.sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    `);
    
    res.json({
      tables: tablesResult.recordset,
      foreignKeys: fkResult.recordset
    });
    
  } catch (error) {
    console.error('Schema endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to get schema', details: error.message });
  }
});

export default router;
