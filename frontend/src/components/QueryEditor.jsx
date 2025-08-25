import { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  IconButton, 
  Box,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  PlayArrowOutlined,
  Save,
  OpenInNew,
  Close,
  Add,
  ContentCopy,
  Delete
} from '@mui/icons-material';
import axios from 'axios';
import QueryResultsTable from './QueryResultsTable';

const API_BASE_URL = 'http://localhost:3100/api/database';

/**
 * QueryEditor Component
 * 
 * Enhanced query editor with multiple script tabs, text selection execution,
 * and connection association for each script.
 * 
 * Features:
 * - Multiple script tabs with individual content
 * - Execute full script or selected text only
 * - Associate scripts with specific connections and databases
 * - Save/load script functionality
 * - Copy script content to clipboard
 * - Tab management (add, close, rename)
 */
const QueryEditor = ({ currentConnection, activeTab: connectionTab, connections }) => {
  // State for managing multiple script tabs
  const [tabs, setTabs] = useState([
    {
      id: 'script-1',
      name: 'Script-1',
      content: '',
      connectionName: currentConnection?.name || '',
      database: currentConnection?.database || '',
      isActive: true
    }
  ]);
  
  const [activeTabId, setActiveTabId] = useState('script-1');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for new script dialog
  const [newScriptDialog, setNewScriptDialog] = useState(false);
  const [newScriptForm, setNewScriptForm] = useState({
    name: '',
    connectionName: '',
    database: ''
  });
  const [availableDatabases, setAvailableDatabases] = useState([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  
  // State for rename dialog
  const [renameDialog, setRenameDialog] = useState(false);
  const [renameForm, setRenameForm] = useState({ name: '' });
  const [tabToRename, setTabToRename] = useState(null);
  
  // Refs for textarea to handle selection
  const textareaRef = useRef(null);

  // Update tabs when currentConnection changes
  useEffect(() => {
    if (currentConnection) {
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.isActive 
            ? { ...tab, connectionName: currentConnection.name, database: currentConnection.database }
            : tab
        )
      );
    }
  }, [currentConnection]);

  // Load databases when new script dialog opens with a pre-selected connection
  useEffect(() => {
    if (newScriptDialog && newScriptForm.connectionName) {
      loadDatabasesForConnection(newScriptForm.connectionName);
    }
  }, [newScriptDialog]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S for Save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveScript();
      }
      // Ctrl+O for Open
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        openScript();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Gets the currently active tab
   */
  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId);
  };

  /**
   * Gets the selected text from the textarea
   */
  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return '';
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return ''; // No selection
    
    return textarea.value.substring(start, end);
  };

  /**
   * Executes a SQL query
   * @param {string} sql - The SQL query to execute
   */
  const executeQuery = async (sql) => {
    if (!sql.trim() || !currentConnection) {
      setError('Please enter a SQL query and ensure you have an active connection.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/execute-sql`, {
        sql: sql
      });

      if (response.data.success) {
        setResults({
          rows: response.data.rows || [],
          rowsAffected: response.data.rowsAffected || 0
        });
      } else {
        setError(response.data.message || 'Query execution failed');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Executes the full script content
   */
  const executeFullScript = async () => {
    const activeTab = getActiveTab();
    if (activeTab) {
      await executeQuery(activeTab.content);
    }
  };

  /**
   * Executes only the selected text
   */
  const executeSelectedQuery = async () => {
    const selectedText = getSelectedText();
    if (!selectedText.trim()) {
      setError('Please select some text to execute.');
      return;
    }
    await executeQuery(selectedText);
  };

  /**
   * Clears the results panel
   */
  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  /**
   * Adds a new script tab
   */
  const addNewScript = () => {
    const newTabId = `script-${Date.now()}`;
    const newTab = {
      id: newTabId,
      name: newScriptForm.name || `Script-${tabs.length + 1}`,
      content: '',
      connectionName: newScriptForm.connectionName || currentConnection?.name || '',
      database: newScriptForm.database || currentConnection?.database || '',
      isActive: false
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
    setNewScriptDialog(false);
    setNewScriptForm({ name: '', connectionName: '', database: '' });
  };

  /**
   * Closes a script tab
   */
  const closeTab = (tabId) => {
    if (tabs.length <= 1) {
      // Don't close the last tab
      return;
    }
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // If we're closing the active tab, switch to another tab
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      }
    }
  };

  /**
   * Renames a script tab
   */
  const renameTab = () => {
    if (!tabToRename || !renameForm.name.trim()) return;
    
    setTabs(prev => 
      prev.map(tab => 
        tab.id === tabToRename.id 
          ? { ...tab, name: renameForm.name }
          : tab
      )
    );
    
    setRenameDialog(false);
    setRenameForm({ name: '' });
    setTabToRename(null);
  };

  /**
   * Updates the content of the active tab
   */
  const updateActiveTabContent = (content) => {
    setTabs(prev => 
      prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content }
          : tab
      )
    );
  };

  /**
   * Copies the active tab content to clipboard
   */
  const copyScriptContent = () => {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.content) {
      navigator.clipboard.writeText(activeTab.content);
    }
  };

  /**
   * Saves the current script to a file
   */
  const saveScript = () => {
    const activeTab = getActiveTab();
    if (!activeTab) {
      setError('No active tab to save.');
      return;
    }

    try {
      // Create a file name based on the script name or default
      const fileName = activeTab.name || 'script';
      const fileExtension = '.sql';
      const fullFileName = fileName + fileExtension;

      // Create the file content with metadata
      const fileContent = {
        name: activeTab.name,
        content: activeTab.content,
        connectionName: activeTab.connectionName,
        database: activeTab.database,
        created: new Date().toISOString()
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(fileContent, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fullFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success feedback
      setResults({
        rows: [{ message: `Script "${activeTab.name}" saved successfully as ${fullFileName}` }],
        rowsAffected: 0
      });
    } catch (error) {
      setError(`Failed to save script: ${error.message}`);
    }
  };



  /**
   * Opens a script from a file
   */
  const openScript = () => {
    try {
      // Create a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.sql';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const content = await file.text();
          let scriptData;

          // Try to parse as JSON first (our saved format)
          try {
            scriptData = JSON.parse(content);
          } catch {
            // If not JSON, treat as plain SQL
            scriptData = {
              name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              content: content,
              connectionName: currentConnection?.name || '',
              database: currentConnection?.database || ''
            };
          }

          // Create a new tab with the loaded script
          const newTabId = `script-${Date.now()}`;
          const newTab = {
            id: newTabId,
            name: scriptData.name || `Script-${tabs.length + 1}`,
            content: scriptData.content || '',
            connectionName: scriptData.connectionName || currentConnection?.name || '',
            database: scriptData.database || currentConnection?.database || '',
            isActive: false
          };

          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newTabId);

          // Show success feedback
          setResults({
            rows: [{ message: `Script "${newTab.name}" loaded successfully` }],
            rowsAffected: 0
          });

        } catch (error) {
          setError(`Failed to load script: ${error.message}`);
        }

        // Clean up
        document.body.removeChild(input);
      };

      // Trigger file selection
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      setError(`Failed to open file dialog: ${error.message}`);
    }
  };

  /**
   * Loads available databases for the selected connection
   * @param {string} connectionName - The connection name to load databases for
   */
  const loadDatabasesForConnection = async (connectionName) => {
    if (!connectionName) {
      setAvailableDatabases([]);
      return;
    }

    setLoadingDatabases(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/databases?connectionName=${connectionName}`);
      if (response.data.databases) {
        setAvailableDatabases(response.data.databases);
      } else {
        setAvailableDatabases([]);
      }
    } catch (error) {
      console.error('Error loading databases:', error);
      setAvailableDatabases([]);
    } finally {
      setLoadingDatabases(false);
    }
  };

  /**
   * Handles connection selection change in the new script form
   * @param {string} connectionName - The selected connection name
   */
  const handleConnectionChange = (connectionName) => {
    setNewScriptForm(prev => ({ ...prev, connectionName, database: '' }));
    loadDatabasesForConnection(connectionName);
  };

  const activeTab = getActiveTab();

  return (
    <div className="query-editor">
      {/* Script Tabs Header */}
      <div className="editor-header">
        <Tabs 
          value={activeTabId} 
          onChange={(e, newValue) => setActiveTabId(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: '#888888',
              minHeight: '40px',
              textTransform: 'none',
              fontSize: '12px'
            },
            '& .Mui-selected': {
              color: '#90caf9'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#90caf9'
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{tab.name}</Typography>
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    sx={{ 
                      color: '#888888',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      p: 0.5,
                      borderRadius: '4px',
                      '&:hover': { 
                        color: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)'
                      }
                    }}
                  >
                    <Close fontSize="small" />
                  </Box>
                </Box>
              }
            />
          ))}
        </Tabs>
        
                 <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
           <IconButton
             size="small"
             onClick={() => {
               // Pre-populate with current connection if available
               if (currentConnection) {
                 setNewScriptForm({
                   name: '',
                   connectionName: currentConnection.name,
                   database: currentConnection.database
                 });
                 loadDatabasesForConnection(currentConnection.name);
               } else {
                 setNewScriptForm({ name: '', connectionName: '', database: '' });
               }
               setNewScriptDialog(true);
             }}
             sx={{ color: '#90caf9' }}
           >
             <Add />
           </IconButton>
         </Box>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={executeFullScript}
          disabled={loading || !currentConnection}
          size="small"
          sx={{ 
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#45a049' }
          }}
        >
          Execute
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<PlayArrowOutlined />}
          onClick={executeSelectedQuery}
          disabled={loading || !currentConnection}
          size="small"
          sx={{
            borderColor: '#666666',
            color: '#ffffff',
            '&:hover': {
              borderColor: '#90caf9',
              backgroundColor: 'rgba(144, 202, 249, 0.1)'
            }
          }}
        >
          Execute Selected
        </Button>

        <Button
          variant="outlined"
          startIcon={<Save />}
          onClick={saveScript}
          size="small"
          sx={{
            borderColor: '#666666',
            color: '#ffffff',
            '&:hover': {
              borderColor: '#90caf9',
              backgroundColor: 'rgba(144, 202, 249, 0.1)'
            }
          }}
          title="Save script (Ctrl+S)"
        >
          Save
        </Button>

        <Button
          variant="outlined"
          startIcon={<OpenInNew />}
          onClick={openScript}
          size="small"
          sx={{
            borderColor: '#666666',
            color: '#ffffff',
            '&:hover': {
              borderColor: '#90caf9',
              backgroundColor: 'rgba(144, 202, 249, 0.1)'
            }
          }}
          title="Open script (Ctrl+O)"
        >
          Open
        </Button>

        <Button
          variant="outlined"
          startIcon={<ContentCopy />}
          onClick={copyScriptContent}
          size="small"
          sx={{
            borderColor: '#666666',
            color: '#ffffff',
            '&:hover': {
              borderColor: '#90caf9',
              backgroundColor: 'rgba(144, 202, 249, 0.1)'
            }
          }}
        >
          Copy
        </Button>

        {results && (
          <Button
            variant="outlined"
            onClick={clearResults}
            size="small"
            sx={{
              borderColor: '#666666',
              color: '#ffffff',
              '&:hover': {
                borderColor: '#90caf9',
                backgroundColor: 'rgba(144, 202, 249, 0.1)'
              }
            }}
          >
            Clear Results
          </Button>
        )}

        {activeTab && (
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 'auto', 
              color: '#888888',
              fontSize: '12px'
            }}
          >
            {activeTab.connectionName && `Connected to: ${activeTab.connectionName}`}
            {activeTab.database && ` (${activeTab.database})`}
          </Typography>
        )}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        <textarea
          ref={textareaRef}
          className="sql-editor"
          placeholder="Enter your SQL query here..."
          value={activeTab?.content || ''}
          onChange={(e) => updateActiveTabContent(e.target.value)}
          disabled={loading}
        />
        
        {(results || error || loading) && (
          <div className="results-panel">
            <QueryResultsTable 
              results={results}
              error={error}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* New Script Dialog */}
      <Dialog 
        open={newScriptDialog} 
        onClose={() => setNewScriptDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ color: '#90caf9' }}>
          Create New Script
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Script Name"
              value={newScriptForm.name}
              onChange={(e) => setNewScriptForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
                         <FormControl fullWidth>
               <InputLabel sx={{ color: '#888888' }}>Connection</InputLabel>
               <Select
                 value={newScriptForm.connectionName}
                 onChange={(e) => handleConnectionChange(e.target.value)}
                 sx={{ color: 'white' }}
               >
                 {connections?.map((conn) => (
                   <MenuItem key={conn.name} value={conn.name}>
                     {conn.name} ({conn.database})
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
             <FormControl fullWidth>
               <InputLabel sx={{ color: '#888888' }}>Database</InputLabel>
               <Select
                 value={newScriptForm.database}
                 onChange={(e) => setNewScriptForm(prev => ({ ...prev, database: e.target.value }))}
                 disabled={loadingDatabases || !newScriptForm.connectionName}
                 sx={{ color: 'white' }}
               >
                 {loadingDatabases ? (
                   <MenuItem disabled>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <CircularProgress size={16} />
                       Loading databases...
                     </Box>
                   </MenuItem>
                 ) : availableDatabases.length > 0 ? (
                   availableDatabases.map((db) => (
                     <MenuItem key={db.database_name} value={db.database_name}>
                       {db.database_name}
                     </MenuItem>
                   ))
                 ) : (
                   <MenuItem disabled>
                     No databases available
                   </MenuItem>
                 )}
               </Select>
             </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setNewScriptDialog(false)}
            sx={{ color: '#888888' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={addNewScript}
            variant="contained"
            sx={{
              backgroundColor: '#90caf9',
              '&:hover': { backgroundColor: '#64b5f6' }
            }}
          >
            Create Script
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog 
        open={renameDialog} 
        onClose={() => setRenameDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ color: '#90caf9' }}>
          Rename Script
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Script Name"
            value={renameForm.name}
            onChange={(e) => setRenameForm({ name: e.target.value })}
            fullWidth
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { color: 'white' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRenameDialog(false)}
            sx={{ color: '#888888' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={renameTab}
            variant="contained"
            sx={{
              backgroundColor: '#90caf9',
              '&:hover': { backgroundColor: '#64b5f6' }
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QueryEditor;
