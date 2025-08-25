/**
 * CreateObjectModal Component
 * 
 * This component provides a modal interface for creating new database objects (tables, views)
 * with a form-based approach and SQL preview functionality.
 * 
 * Features:
 * - Form-based table/view creation
 * - Dynamic column management
 * - SQL preview generation
 * - Validation and error handling
 * - Dark theme styling
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal visibility state
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} props.objectType - Type of object to create ('table' or 'view')
 * @param {string} props.schemaName - Schema name where the object will be created
 * @param {string} props.connectionName - Current connection name
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Delete,
  ContentCopy,
  Preview
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3100/api/database';

const CreateObjectModal = ({ open, onClose, objectType, schemaName, connectionName }) => {
  const [formData, setFormData] = useState({
    objectName: '',
    columns: [
      { name: '', type: 'int', nullable: true, primaryKey: false, defaultValue: '' }
    ]
  });
  const [viewDefinition, setViewDefinition] = useState('');
  const [sqlPreview, setSqlPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // SQL Data Types, hope this is correct. It will give a big ass error if it's not.
  const dataTypes = [
    'int', 'bigint', 'smallint', 'tinyint',
    'decimal', 'numeric', 'float', 'real',
    'char', 'varchar', 'nchar', 'nvarchar', 'text', 'ntext',
    'date', 'datetime', 'datetime2', 'smalldatetime', 'time',
    'bit', 'binary', 'varbinary', 'image',
    'uniqueidentifier', 'xml', 'sql_variant'
  ];

  // Generate SQL preview
  useEffect(() => {
    if (objectType === 'table') {
      generateTableSQL();
    } else if (objectType === 'view') {
      generateViewSQL();
    }
  }, [formData, viewDefinition, objectType]);

  const generateTableSQL = () => {
    if (!formData.objectName || formData.columns.length === 0) {
      setSqlPreview('');
      return;
    }

    const createQueryParams = formData.columns
      .filter(col => col.name.trim())
      .map(col => {
        let definition = `${col.name} ${col.type.toUpperCase()}`;
        
        // Size for string types is 50 by default. Should have settled it to a global variable, but I'm lazy.
        if (['varchar', 'nvarchar', 'char', 'nchar'].includes(col.type.toLowerCase())) {
          definition += '(50)';
        }
        
        if (!col.nullable) {
          definition += ' NOT NULL';
        }
        
        if (col.defaultValue) {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
        
        return definition;
      })
      .join(',\n    ');

    const primaryKeys = formData.columns
      .filter(col => col.primaryKey && col.name.trim())
      .map(col => `${col.name}`)
      .join(', ');

    let sql = `CREATE TABLE ${schemaName}.${formData.objectName} (\n    ${createQueryParams}`;
    
    if (primaryKeys) {
      sql += `,\n    CONSTRAINT PK_${formData.objectName} PRIMARY KEY (${primaryKeys})`;
    }
    
    sql += '\n);';
    
    setSqlPreview(sql);
  };

  const generateViewSQL = () => {
    if (!formData.objectName || !viewDefinition.trim()) {
      setSqlPreview('');
      return;
    }

    const sql = `CREATE VIEW ${schemaName}.${formData.objectName} AS\n${viewDefinition};`;
    setSqlPreview(sql);
  };

  const handleAddColumn = () => {
    setFormData(prev => ({
      ...prev,
      columns: [...prev.columns, { name: '', type: 'int', nullable: true, primaryKey: false, defaultValue: '' }]
    }));
  };

  const handleRemoveColumn = (index) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const handleColumnChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      )
    }));
  };

  const handleCreateObject = async () => {
    if (!formData.objectName.trim()) {
      setError('Object name is required');
      return;
    }

    if (objectType === 'table' && formData.columns.filter(col => col.name.trim()).length === 0) {
      setError('At least one column is required for a table');
      return;
    }

    if (objectType === 'view' && !viewDefinition.trim()) {
      setError('View definition is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/execute-sql`, {
        sql: sqlPreview
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            objectName: '',
            columns: [{ name: '', type: 'int', nullable: true, primaryKey: false, defaultValue: '' }]
          });
          setViewDefinition('');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create object');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to create object');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlPreview);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2d2d2d',
          color: '#ffffff'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #404040'
      }}>
        <Typography variant="h6" sx={{ color: '#90caf9' }}>
          Create New {objectType === 'table' ? 'Table' : 'View'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#888888' }}>
          <Delete />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {objectType === 'table' ? 'Table' : 'View'} created successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, height: '60vh' }}>
          {/* Form Section */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
              {objectType === 'table' ? 'Table' : 'View'} Details
            </Typography>

            <TextField
              label="Object Name"
              value={formData.objectName}
              onChange={(e) => setFormData(prev => ({ ...prev, objectName: e.target.value }))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />

            {objectType === 'table' ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>
                    Columns
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddColumn}
                    size="small"
                    sx={{ color: '#90caf9' }}
                  >
                    Add Column
                  </Button>
                </Box>

                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {formData.columns.map((column, index) => (
                    <Box key={index} sx={{ 
                      p: 2, 
                      border: '1px solid #404040', 
                      borderRadius: 1, 
                      mb: 1,
                      backgroundColor: '#1e1e1e'
                    }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          label="Column Name"
                          value={column.name}
                          onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                          size="small"
                          sx={{ flex: 1, '& .MuiOutlinedInput-root': { color: 'white' } }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel sx={{ color: '#888888' }}>Type</InputLabel>
                          <Select
                            value={column.type}
                            onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                            sx={{ color: 'white' }}
                          >
                            {dataTypes.map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => handleRemoveColumn(index)}
                          size="small"
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={column.nullable}
                              onChange={(e) => handleColumnChange(index, 'nullable', e.target.checked)}
                            />
                          }
                          label="Nullable"
                          sx={{ color: '#888888' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={column.primaryKey}
                              onChange={(e) => handleColumnChange(index, 'primaryKey', e.target.checked)}
                            />
                          }
                          label="Primary Key"
                          sx={{ color: '#888888' }}
                        />
                        <TextField
                          label="Default Value"
                          value={column.defaultValue}
                          onChange={(e) => handleColumnChange(index, 'defaultValue', e.target.value)}
                          size="small"
                          sx={{ flex: 1, '& .MuiOutlinedInput-root': { color: 'white' } }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <TextField
                label="View Definition (SELECT statement)"
                value={viewDefinition}
                onChange={(e) => setViewDefinition(e.target.value)}
                multiline
                rows={8}
                fullWidth
                placeholder="SELECT column1, column2 FROM table_name WHERE condition"
                sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
              />
            )}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ backgroundColor: '#404040' }} />

          {/* SQL Preview Section */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>
                SQL Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleCopySQL}
                  size="small"
                  sx={{ color: '#888888' }}
                >
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>

            <TextField
              value={sqlPreview}
              multiline
              rows={20}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#ffffff',
                  backgroundColor: '#1e1e1e'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#404040' },
                  '&:hover fieldset': { borderColor: '#666666' }
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #404040' }}>
        <Button onClick={onClose} sx={{ color: '#888888' }}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateObject}
          variant="contained"
          disabled={loading || !formData.objectName.trim() || !sqlPreview.trim()}
          sx={{
            backgroundColor: '#90caf9',
            '&:hover': { backgroundColor: '#64b5f6' },
            '&:disabled': { backgroundColor: '#555555' }
          }}
        >
          {loading ? <CircularProgress size={20} /> : `Create ${objectType === 'table' ? 'Table' : 'View'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateObjectModal;
