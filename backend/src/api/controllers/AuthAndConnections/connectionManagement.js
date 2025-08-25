import sql from 'mssql';
import { saveCredentials } from './fileManagement.js';

// Keep track of all active database connections
let activeConnections = [];
let currentConnection = null;

const connectionManager = {
  getActiveConnections: () => {
    return activeConnections;
  },

  setCurrentConnection: (connectionMetadata) => {
    currentConnection = connectionMetadata;
    console.log(`Current connection set to: ${connectionMetadata.connectionName}`);
  },
  
  // Get the current connection info
  getCurrentConnection: () => {
    return currentConnection;
  },

  // Connect to a database and add it to active connections
  connectWith: async (connectionCredentials)=> {
    try {
      const connectionPool = await new sql.ConnectionPool(connectionCredentials).connect();
      console.log(`Connection Name: ${connectionCredentials.connectionName} `);
      console.log(`Owned by: ${connectionCredentials.user} `);
      
      // Create connection info
      const connectionMetadata = {
        pool: connectionPool,
        connectionName: connectionCredentials.connectionName,
        user: connectionCredentials.user,
        database: connectionCredentials.database,
        credentials: connectionCredentials
      };
      
      activeConnections.push(connectionMetadata);
      connectionManager.setCurrentConnection(connectionMetadata);
      return connectionMetadata;

    } catch (err) {
      console.error(`Error at connecting  connection Name: ${connectionCredentials.database}`, err);
    }
  },

  // Disconnect from a database and remove it from active connections
  disconnectFrom: async (connectionMetadata) => {
    try {
      await connectionMetadata.pool.close();
      activeConnections = activeConnections.filter(conn => conn !== connectionMetadata);
      console.log(`Disconnected from connection Name: ${connectionMetadata.connectionName}`);
    } catch (error) {
      console.error(`Error disconnecting from connection Name: ${connectionMetadata.connectionName}`, error);
    }
  },

  // Create a new user and database in SQL Server
  createConnection: async (credentials, masterConn) => {
    const user = credentials.user;
    const password = credentials.password;
    const database = credentials.database;

    try {
      console.log(`Starting to create login and database for user: ${user}`);
      console.log(`Using master connection:`, masterConn ? 'Available' : 'Not available');
      
      // SQL Server needs several steps to create a user and database:
      // 1. Create login (server level)
      // 2. Create database
      // 3. Create user in database
      // 4. Give user permissions
      const request = masterConn.request();
      console.log('Executing login and database creation batch...');
      await request.batch(`
        
        IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = '${user}')
        BEGIN
            CREATE LOGIN [${user}] WITH PASSWORD = '${password}';
        END;

        IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${database}')
        BEGIN
            CREATE DATABASE [${database}];
        END;
      `);
      console.log('Login and database creation batch completed successfully');

      // Create user in the database and give permissions
      const userRequest = masterConn.request();
      console.log('Executing user creation and role assignment batch...');

      await userRequest.batch(`
        USE [${database}];
        CREATE USER [${user}] FOR LOGIN [${user}];
        ALTER ROLE db_owner ADD MEMBER [${user}];
      `);

      
      if (validation.recordset.length > 0) {
        console.log(`Login and DB created/verified for user: ${user}`);
        
        await saveCredentials(credentials);
        return true;
      } else {
        console.error(`Failed to create login for user: ${user} - validation query returned no results`);
        return false;
      }

    } catch (error) {
      // If user already exists, that's fine - just return true
      if (error.message.includes('already exists') || error.message.includes('already an object')) {
        console.log(`User/database already exists for: ${user}`);
        await saveCredentials(credentials);
        return true;
      }
      
      console.error(`Error CREATING connection for user ${user}:`, error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error object:', error);
      return false;
    }
  }
};

export default connectionManager;

/*
This is an reference for the required connection credentials:
{
    "user": "sa",
    "password": "BakaBaka25-1",
    "host": "localhost",
    "server": "sqlserver",
    "database": "master",
    "port": 1433,
    "options": {
      "encrypt": false,
      "trustServerCertificate": true
    },
    "connectionName": "uniqueConnectionName"
     This will be the name of the connection on the UI, which, indeed is the same as the database, BUT
     Since the database name is optional, the dafault name is SQL Server, which will be the database name.
                                              
      ***HOWEVER***
      
      "database": "SQL Server",                                              
      The connecion name WILL ACTUALLY BE the UNIQUE version of it,example:
      "connectionName": "SQL Server"
                                                This will cause issues if there is more than one  default named connection since it will be difficult to map
                                                it to the user

                                                --Solution--
                                                "database": "SQL Server",                                              
                                                "connectionName": "SQL Server 1"

                                               

}

*/