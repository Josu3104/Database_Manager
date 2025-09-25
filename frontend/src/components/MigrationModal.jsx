import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Close
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:3100/api/database';

 
//This modal allows users to migrate a SQL Server database to PostgreSQL.
const MigrationModal = ({ open, onClose, connectionName, databaseName }) => {
  // PostgreSQL connection form
  const [pgCredentials, setPgCredentials] = useState({
    user: 'postgres',           
    host: 'postgres',   // use postgres in this case because its inside of a container, localhost will break the connection
    database: 'postgres',      
    password: 'admin123',       
    port: 5432         
  });

  const [migrating, setMigrating] = useState(false);        
  const [migrationResult, setMigrationResult] = useState(null);  
  const [migrationError, setMigrationError] = useState(null);    

  const handleInputChange = (field, value) => {
    setPgCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);
    setMigrationError(null);

    try {
      const response = await axios.post(`${API_URL}/migrate`, {
        connectionName: connectionName,
        pgCredentials: pgCredentials
      });

      if (response.data.success) {
        setMigrationResult(response.data);
        console.log('Migration completed successfully!');
      } else {
        setMigrationError(response.data.error || 'Migration failed for unknown reason');
      }
    } catch (error) {
      console.error('Migration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Migration failed due to network or server error';
      setMigrationError(errorMessage);
    } finally {
  
      setMigrating(false);
    }
  };

  
  const handleClose = () => {
    if (!migrating) {
      setPgCredentials({
        user: '',
        host: 'postgres',
        database: '',
        password: '',
        port: 5432
      });
      setMigrationResult(null);
      setMigrationError(null);
      onClose();
    }
  };

  
  const isFormValid = () => {
    return pgCredentials.user.trim() && 
           pgCredentials.host.trim() && 
           pgCredentials.database.trim() && 
           pgCredentials.password.trim();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={migrating}
    >
      <DialogTitle sx={{ 
        color: '#90caf9',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <CloudUpload />
        Migrate Database to PostgreSQL
        {!migrating && (
          <Button
            onClick={handleClose}
            sx={{ ml: 'auto', minWidth: 'auto', p: 0.5 }}
          >
            <Close />
          </Button>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#cccccc', mb: 2 }}>
            Migrating from: <strong>{databaseName}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: '#cccccc', mb: 3 }}>
            Warning: Migration might fail if the database was partially migrated before.
          </Typography>
        </Box>

        {!migrationResult && !migrationError && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ color: '#90caf9', mb: 1 }}>
              PostgreSQL Database Credentials
            </Typography>
            
            <TextField
              label="Username"
              value={pgCredentials.user}
              onChange={(e) => handleInputChange('user', e.target.value)}
              fullWidth
              required
              disabled={migrating}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            
            <TextField
              label="Host"
              value={pgCredentials.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              fullWidth
              required
              disabled={migrating}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            
            <TextField
              label="Database Name"
              value={pgCredentials.database}
              onChange={(e) => handleInputChange('database', e.target.value)}
              fullWidth
              required
              disabled={migrating}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            
            <TextField
              label="Password"
              type="password"
              value={pgCredentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              fullWidth
              required
              disabled={migrating}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            
            <TextField
              label="Port"
              type="number"
              value={pgCredentials.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
              fullWidth
              disabled={migrating}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
          </Box>
        )}

        {/* Show simple loading message during migration */}
        {migrating && (
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2,
            py: 4
          }}>
            <CircularProgress size={60} sx={{ color: '#90caf9' }} />
            <Typography variant="h6" sx={{ color: '#90caf9' }}>
              Migrating Database...
            </Typography>
            <Typography variant="body2" sx={{ color: '#cccccc', textAlign: 'center' }}>
              Please wait while we migrate your SQL Server database to PostgreSQL.
              <br />
              This may take a few minutes depending on the size of your database.
            </Typography>
  
          </Box>
        )}


        {migrationResult && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              sx={{ mb: 2 }}
            >
              Migration completed successfully!
            </Alert>
            
            <Typography variant="body2" sx={{ color: '#cccccc', mb: 2 }}>
              {migrationResult.message}
            </Typography>
            
          </Box>
        )}

        {migrationError && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ mb: 2 }}
            >
              Migration FAILED
            </Alert>
            
            <Typography variant="body2" sx={{ color: '#f44336' }}>
              {migrationError}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!migrationResult && !migrationError && (
          <>
            <Button 
              onClick={handleClose}
              disabled={migrating}
              sx={{ color: '#888888' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartMigration}
              variant="contained"
              disabled={migrating || !isFormValid()}
              sx={{
                backgroundColor: '#90caf9',
                '&:hover': { backgroundColor: '#64b5f6' },
                '&:disabled': { backgroundColor: '#555555' }
              }}
            >
              {migrating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Migrating...
                </>
              ) : (
                'Start Migration'
              )}
            </Button>
          </>
        )}
        
        {(migrationResult || migrationError) && (
          <Button 
            onClick={handleClose}
            variant="contained"
            sx={{
              backgroundColor: migrationResult ? '#4caf50' : '#f44336',
              '&:hover': { 
                backgroundColor: migrationResult ? '#45a049' : '#d32f2f' 
              }
            }}
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MigrationModal;
