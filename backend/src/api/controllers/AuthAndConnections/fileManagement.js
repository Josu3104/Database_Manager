import { readdir, writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { defaultDBname } from '../../../index.js';


// Where we store all the connection files
const jsonPath = './src/api/controllers/AuthAndConnections/connectionsJSON/';

// Read connection credentials from a JSON file

export const readCredentials = async (credentialsFile) => {
  try {
    const json = await readFile(credentialsFile, 'utf-8');
    const credentials = await JSON.parse(json);
    return credentials;

  } catch (error) {
    console.error('Error reading connection credentials file:', error);
    return null;
  }
};

// Find who owns a connection by its name
export const findCredentialsByConnectionName = async (clickedConnectionName) => { 
  try {
    const files = await readdir(jsonPath);
    let currentOwner = null;
    
    if (files.length === 0) {
      console.log('No files found, cant search for owner');
      return null;
    }

    // Look through all connection files to find the right one
    for (const fileName of files) {
      if (fileName.endsWith('.json')) {
        const filePath = join(jsonPath, fileName);
        const credentials = await readCredentials(filePath);
        if (credentials && credentials.connectionName === clickedConnectionName) {
          currentOwner = credentials.user;
          break;
        }
      }
    }

    return currentOwner;
    
  } catch (error) {
    console.error(`Error, could not find owner of ${clickedConnectionName}:`, error);
    return null;
  }
};



// Save connection credentials to a JSON file
export const saveCredentials = async (credentials) => {
  try {
    const databaseName = credentials.database
    const filename = await getUniqueFileName(databaseName);
    const filePath = join(jsonPath, filename);
     
    const credentialsToSave = { ...credentials };
    
    // Set the connection name to match the filename
    credentialsToSave.connectionName = filename.replace('.json', '');
    
    // Make sure we have all the required fields
    if (!credentialsToSave.host) {
      credentialsToSave.host = 'localhost';
    }
    
    // Hotfix-> SET ENCRYPT TO FALSE SO IT DOESNT WHIMPER WHEN CONNECTING TO AN ALREADY EXISTING DATABASE
    credentialsToSave.options = {
      encrypt: credentialsToSave.encrypt !== undefined ? credentialsToSave.encrypt : false,
      trustServerCertificate: credentialsToSave.trustServerCertificate !== undefined ? credentialsToSave.trustServerCertificate : true
    };
    
    // Clean up the old format
    delete credentialsToSave.encrypt;
    delete credentialsToSave.trustServerCertificate;
    
    await writeFile(filePath, JSON.stringify(credentialsToSave, null, 2), 'utf-8');

    return filePath;

  } catch (error) {
    console.error('Error saving connection JSON:', error);
  }
}

// Delete a connection file
export const deleteCredentials = async (connectionName) => {
  try {
    const filePath = join(jsonPath, `${connectionName}.json`);
    await unlink(filePath);
    console.log(`Successfully deleted connection file: ${connectionName}.json`);
    return true;
  } catch (error) {
    console.error(`Error deleting connection file for ${connectionName}:`, error);
    return false;
  }
};

// Create a unique filename for a new connection
// If "myDB.json" exists, it will return "myDB_1.json", then "myDB_2.json", etc.
export const getUniqueFileName = async (name) => {
  try {
    const files = await readdir(jsonPath);

    if (files.length === 0) {
      console.log('No files found, returning default name');
      return `${defaultDBname}.json`;
    }

    let filename = `${name}.json`;
    let counter = 1;

    while (files.includes(filename)) {
      filename = `${name}_${counter}.json`;
      counter++;
    }

    return filename;
  } catch (error) {
    return `${name}.json`;
  }
};




