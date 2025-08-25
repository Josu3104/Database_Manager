import express from 'express';
import cors from 'cors';
import connectionManager from './api/controllers/AuthAndConnections/connectionManagement.js';
import { readCredentials, saveCredentials } from './api/controllers/AuthAndConnections/fileManagement.js';
import DDL from './api/controllers/databaseObjects/dbDLL.js';
import databaseRoutes from './api/routes/databaseRoutes.js';
const masterJSONpath = './src/api/controllers/AuthAndConnections/connectionsJSON/master.json';

const masterJSON = await readCredentials(masterJSONpath);
export const defaultDBname = 'SQL Server';
const PORT = 3100;
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/database', databaseRoutes);

app.listen(PORT, () => {
  console.log(`Backend listening on Port: ${PORT}`);
});

//This connections will be used to connect to the database by default because its treated as 'sa', is attached to the master database and 
//will be the one who queries the system tables (sometimes).
const masterConnectionMetadata = await connectionManager.connectWith(masterJSON);
const masterConnection = masterConnectionMetadata.pool; // Extract the pool for backward compatibility


