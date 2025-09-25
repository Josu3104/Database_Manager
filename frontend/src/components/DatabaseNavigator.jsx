// Database navigator component - shows all connections and database objects in a tree view
import { useState, useEffect } from 'react';
import { SimpleTreeView as TreeView, TreeItem } from '@mui/x-tree-view';
import { 
  TextField, 
  IconButton, 
  Collapse,
  Box,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Folder,
  Storage,
  TableChart,
  ViewModule,
  Functions,
  Code,
  CheckCircle,
  RadioButtonUnchecked,
  Add,
  MoreVert,
  LinkOff,
  Timeline,
  Bolt,
  Storage as StorageIcon,
  Person,
  Refresh,
  Delete,
  Inventory,
  CloudUpload
} from '@mui/icons-material';
import axios from 'axios';
import CreateObjectModal from './CreateObjectModal';
import MigrationModal from './MigrationModal';

const API_URL = 'http://localhost:3100/api/database';
const DatabaseNavigator = ({ 
  currentConnection, 
  setCurrentConnection, 
  activeTab, 
  setActiveTab 
}) => {
  // All available connections
  const [connections, setConnections] = useState([]);
  
  // Database objects for the selected connection
  const [databases, setDatabases] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [views, setViews] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [indexes, setIndexes] = useState([]);
  const [tablespaces, setTablespaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  
  // UI state
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  
  // Connection operations
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionFeedback, setConnectionFeedback] = useState(null);
  
  // New connection modal
  const [newConnectionModal, setNewConnectionModal] = useState(false);
  const [newConnectionForm, setNewConnectionForm] = useState({
    connectionName: '',
    user: '',
    password: '',
    server: 'sqlserver',
    database: '',
    port: 1433
  });
  const [creatingConnection, setCreatingConnection] = useState(false);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  // Create new table/view modal
  const [createObjectModal, setCreateObjectModal] = useState({
    open: false,
    objectType: 'table',
    schemaName: '',
    connectionName: ''
  });

  // Migration modal
  const [migrationModal, setMigrationModal] = useState({
    open: false,
    connectionName: '',
    databaseName: ''
  });

  // Load connections when component starts
  useEffect(() => {
    loadConnections();
  }, []);

  // Load database objects when user selects a connection
  useEffect(() => {
    if (currentConnection) {
      loadDatabaseObjects();
    }
  }, [currentConnection]);

  // Get all available connections from backend
  const loadConnections = async () => {
    try {
      setBackendError(null);
      const response = await axios.get(`${API_URL}/connections`);
      console.log('Loaded connections:', response.data);
      setConnections(response.data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
      setBackendError('Backend error, this may happen due to the container still starting up.');
      setConnections([]);
    }
  };

  // Get all database objects for the current connection
  const loadDatabaseObjects = async () => {
    if (!currentConnection) return;
    
    setLoading(true);
    try {
      // Get all database objects at once (faster than one by one)
      const [databasesRes, schemasRes, tablesRes, viewsRes, proceduresRes, functionsRes, sequencesRes, triggersRes, indexesRes, tablespacesRes, usersRes, packagesRes] = await Promise.all([
        axios.get(`${API_URL}/databases?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/schemas?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/tables?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/views?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/procedures?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/functions?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/sequences?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/triggers?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/indexes?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/tablespaces?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/users?connectionName=${currentConnection.name}`),
        axios.get(`${API_URL}/packages?connectionName=${currentConnection.name}`)
      ]);

      setDatabases(databasesRes.data.databases || []);
      setSchemas(schemasRes.data.schemas || []);
      setTables(tablesRes.data.tables || []);
      setViews(viewsRes.data.views || []);
      setProcedures(proceduresRes.data.procedures || []);
      setFunctions(functionsRes.data.functions || []);
      setSequences(sequencesRes.data.sequences || []);
      setTriggers(triggersRes.data.triggers || []);
      setIndexes(indexesRes.data.indexes || []);
      setTablespaces(tablespacesRes.data.tablespaces || []);
      setUsers(usersRes.data.users || []);
      setPackages(packagesRes.data.packages || []);
      
      console.log('Loaded database objects for connection:', currentConnection.name, {
        databases: databasesRes.data.databases,
        schemas: schemasRes.data.schemas,
        tables: tablesRes.data.tables,
        views: viewsRes.data.views,
        procedures: proceduresRes.data.procedures,
        functions: functionsRes.data.functions,
        sequences: sequencesRes.data.sequences,
        triggers: triggersRes.data.triggers,
        indexes: indexesRes.data.indexes,
        tablespaces: tablespacesRes.data.tablespaces,
        users: usersRes.data.users,
        packages: packagesRes.data.packages
      });
    } catch (error) {
      console.error('Error loading database objects:', error);
      // Clear all data on error
      setDatabases([]);
      setSchemas([]);
      setTables([]);
      setViews([]);
      setProcedures([]);
      setFunctions([]);
      setSequences([]);
      setTriggers([]);
      setIndexes([]);
      setTablespaces([]);
      setUsers([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Connect to a database when user clicks on it
  const handleConnectionClick = async (connection) => {
    const isAlreadyActive = connections.some(conn => conn.name === connection.name && conn.isActive);
    
    if (isAlreadyActive) {
      // Already connected, just switch to it
      setCurrentConnection({
        name: connection.name,
        user: connection.user,
        database: connection.database
      });
      setActiveTab(connection.name);
      return;
    }

    setConnecting(true);
    try {
      const response = await axios.post(`${API_URL}/connect`, {
        connectionName: connection.name
      });
      
      if (response.data.success) {
        setCurrentConnection(response.data.connection);
        setActiveTab(connection.name);
        
        // Update connection list
        await loadConnections();
        
        // Show success message
        const updatedConnections = await axios.get(`${API_URL}/connections`);
        const isNowActive = updatedConnections.data.some(conn => 
          conn.name === connection.name && conn.isActive
        );
        
        if (isNowActive) {
          setConnectionFeedback({
            type: 'success',
            title: 'Connection Successful',
            message: `Successfully connected to ${connection.name}`
          });
        }
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      setConnectionFeedback({
        type: 'error',
        title: 'Connection Failed',
        message: `Failed to connect to ${connection.name}: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from a database
  const handleDisconnect = async (connection) => {
    setDisconnecting(true);
    try {
      const response = await axios.post(`${API_URL}/disconnect`, {
        connectionName: connection.name
      });
      
      if (response.data.success) {
        // Clear current connection if we disconnected from it
        if (currentConnection?.name === connection.name) {
          setCurrentConnection(null);
          setActiveTab('master');
        }
        
        // Update connection list
        await loadConnections();
        
        setConnectionFeedback({
          type: 'success',
          title: 'Disconnection Successful',
          message: `Successfully disconnected from ${connection.name}`
        });
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      setConnectionFeedback({
        type: 'error',
        title: 'Disconnection Failed',
        message: `Failed to disconnect from ${connection.name}: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Double-click to connect/disconnect
  const handleConnectionDoubleClick = async (connection) => {
    const isActive = connections.some(conn => conn.name === connection.name && conn.isActive);
    
    if (isActive) {
      await handleDisconnect(connection);
    } else {
      await handleConnectionClick(connection);
    }
  };

  // Right-click menu for connections
  const handleContextMenu = (event, connection) => {
    event.preventDefault();
    setSelectedConnection(connection);
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  // Close right-click menu
  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedConnection(null);
  };

  // Disconnect from context menu
  const handleContextMenuDisconnect = async () => {
    if (selectedConnection) {
      await handleDisconnect(selectedConnection);
    }
    handleCloseContextMenu();
  };

  // Refresh database objects
  const handleContextMenuRefresh = async () => {
    if (selectedConnection) {
      await loadDatabaseObjects();
    }
    handleCloseContextMenu();
  };

  // Delete a connection
  const handleContextMenuDelete = async () => {
    if (selectedConnection) {
      try {
        const response = await axios.delete(`${API_URL}/delete-connection`, {
          data: { connectionName: selectedConnection.name }
        });
        
        if (response.data.success) {
          setConnectionFeedback({
            type: 'success',
            title: 'Connection Deleted',
            message: `Successfully deleted connection: ${selectedConnection.name}`
          });
          
          // Clear current connection if we deleted it
          if (currentConnection && currentConnection.name === selectedConnection.name) {
            setCurrentConnection(null);
            setActiveTab('');
          }
          
          // Update connections list
          await loadConnections();
        }
      } catch (error) {
        console.error('Error deleting connection:', error);
        setConnectionFeedback({
          type: 'error',
          title: 'Connection Deletion Failed',
          message: `Failed to delete connection: ${error.response?.data?.error || error.message}`
        });
      }
    }
    handleCloseContextMenu();
  };

  // Open the create table/view modal
  const handleCreateObject = (event, objectType, schemaName, connectionName) => {
    event.preventDefault();
    event.stopPropagation();
    setCreateObjectModal({
      open: true,
      objectType: objectType,
      schemaName: schemaName,
      connectionName: connectionName
    });
  };

  // Close create object modal
  const handleCloseCreateObjectModal = () => {
    setCreateObjectModal(prev => ({ ...prev, open: false }));
  };

  // Open migration modal
  const handleOpenMigrationModal = (connectionName, databaseName) => {
    setMigrationModal({
      open: true,
      connectionName: connectionName,
      databaseName: databaseName
    });
  };

  // Close migration modal
  const handleCloseMigrationModal = () => {
    setMigrationModal({
      open: false,
      connectionName: '',
      databaseName: ''
    });
  };

  // Create a new database connection
  const handleCreateNewConnection = async () => {
    setCreatingConnection(true);
    try {
      const response = await axios.post(`${API_URL}/create-connection`, newConnectionForm);
      
      if (response.data.success) {
        setConnectionFeedback({
          type: 'success',
          title: 'Connection Created',
          message: `Successfully created connection: ${newConnectionForm.connectionName}`
        });
        
        // Reset form and close modal
        setNewConnectionForm({
          connectionName: '',
          user: '',
          password: '',
          server: 'sqlserver',
          database: '',
          port: 1433
        });
        setNewConnectionModal(false);
        
        // Update connections list
        await loadConnections();
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      setConnectionFeedback({
        type: 'error',
        title: 'Connection Creation Failed',
        message: `Failed to create connection: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setCreatingConnection(false);
    }
  };

  // Update form fields
  const handleFormChange = (field, value) => {
    setNewConnectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tree expansion
  const handleExpand = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  // Check if connection is active
  const isConnectionActive = (connectionName) => {
    return connections.some(conn => conn.name === connectionName && conn.isActive);
  };

  // Filter connections by search text
  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="database-navigator">
      <div className="navigator-header">
        <h3 className="navigator-title">
          Database Navigator
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => setNewConnectionModal(true)}
              sx={{ color: '#90caf9' }}
            >
              <Add />
            </IconButton>
            <IconButton size="small">
              <ExpandMore />
            </IconButton>
          </Box>
        </h3>
        <div className="navigator-filter">
          <TextField
            size="small"
            placeholder="Filter connections by name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: '#404040',
                },
                '&:hover fieldset': {
                  borderColor: '#666666',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#888888',
              },
            }}
          />
        </div>
      </div>

      {backendError && (
        <Alert severity="warning" sx={{ margin: 1 }}>
          {backendError}
        </Alert>
      )}

      <div className="navigator-content">
        <TreeView
          expandedItems={expanded}
          onExpandedItemsChange={handleExpand}
        >
          {filteredConnections.map((connection) => (
            <TreeItem
              key={connection.name}
              itemId={connection.name}
              label={
                <Box 
                  className="tree-item"
                  onClick={() => handleConnectionClick(connection)}
                  onDoubleClick={() => handleConnectionDoubleClick(connection)}
                  onContextMenu={(event) => handleContextMenu(event, connection)}
                  sx={{
                    backgroundColor: currentConnection?.name === connection.name ? '#1976d2' : 'transparent',
                    '&:hover': {
                      backgroundColor: currentConnection?.name === connection.name ? '#1976d2' : '#404040',
                    }
                  }}
                >
                  <div className={`connection-status ${connections.some(conn => conn.name === connection.name && conn.isActive) ? 'connected' : 'disconnected'}`} />
                  <Storage className="tree-item-icon" />
                  <Typography className="tree-item-label">
                    {connection.name} {connection.server}:{connection.port}
                  </Typography>
                  {connecting && currentConnection?.name === connection.name && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  )}
                  {isConnectionActive(connection.name) && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, connection);
                      }}
                      sx={{ ml: 'auto', color: '#888888' }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
            >
               {/* Database list */}
               <TreeItem
                 itemId={`${connection.name}-databases`}
                 label={
                   <Box className="tree-item">
                     <Folder className="tree-item-icon" />
                     <Typography className="tree-item-label">Databases</Typography>
                   </Box>
                 }
               >
                 {currentConnection?.name === connection.name && isConnectionActive(connection.name) && databases.map((db) => (
                   <TreeItem
                     key={db.database_name}
                     itemId={`${connection.name}-${db.database_name}`}
                     label={
                       <Box className="tree-item" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                         <Storage className="tree-item-icon" />
                         <Typography className="tree-item-label" sx={{ flexGrow: 1 }}>
                           {db.database_name}
                         </Typography>
                         
                         {loading && <CircularProgress size={12} sx={{ ml: 1 }} />}
                         
                         {/* Migration icon */}
                         <IconButton
                           size="small"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleOpenMigrationModal(connection.name, db.database_name);
                           }}
                           sx={{ 
                             ml: 'auto', 
                             color: '#90caf9',
                             '&:hover': { 
                               backgroundColor: 'rgba(144, 202, 249, 0.1)',
                               color: '#64b5f6'
                             }
                           }}
                           title="Migrate to PostgreSQL"
                         >
                           <CloudUpload fontSize="small" />
                         </IconButton>
                       </Box>
                     }
                   >
                     {/* Schema folders */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-schemas`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Schemas ({schemas.length})</Typography>
                         </Box>
                       }
                     >
                       {schemas.map((schema) => (
                         <TreeItem
                           key={schema.schema_name}
                           itemId={`${connection.name}-${db.database_name}-${schema.schema_name}`}
                           label={
                             <Box className="tree-item">
                               <Folder className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {schema.schema_name}
                               </Typography>
                             </Box>
                           }
                         >
                           {/* Table list */}
                           <TreeItem
                             itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-tables`}
                             label={
                               <Box 
                                 className="tree-item"
                                 onContextMenu={(event) => handleCreateObject(event, 'table', schema.schema_name, connection.name)}
                               >
                                 <Folder className="tree-item-icon" />
                                 <Typography className="tree-item-label">Tables ({tables.filter(table => table.schema_name === schema.schema_name).length})</Typography>
                               </Box>
                             }
                           >
                             {tables
                               .filter(table => table.schema_name === schema.schema_name)
                               .map((table) => (
                                 <TreeItem
                                   key={table.table_name}
                                   itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-${table.table_name}`}
                                   label={
                                     <Box className="tree-item">
                                       <TableChart className="tree-item-icon" />
                                       <Typography className="tree-item-label">
                                         {table.table_name}
                                       </Typography>
                                     </Box>
                                   }
                                 />
                               ))}
                           </TreeItem>

                           {/* View list */}
                           <TreeItem
                             itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-views`}
                             label={
                               <Box 
                                 className="tree-item"
                                 onContextMenu={(event) => handleCreateObject(event, 'view', schema.schema_name, connection.name)}
                               >
                                 <Folder className="tree-item-icon" />
                                 <Typography className="tree-item-label">Views ({views.filter(view => view.schema_name === schema.schema_name).length})</Typography>
                               </Box>
                             }
                           >
                             {views
                               .filter(view => view.schema_name === schema.schema_name)
                               .map((view) => (
                                 <TreeItem
                                   key={view.view_name}
                                   itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-${view.view_name}`}
                                   label={
                                     <Box className="tree-item">
                                       <ViewModule className="tree-item-icon" />
                                       <Typography className="tree-item-label">
                                         {view.view_name}
                                       </Typography>
                                     </Box>
                                   }
                                 />
                               ))}
                           </TreeItem>

                           {/* Stored procedures */}
                           <TreeItem
                             itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-procedures`}
                             label={
                               <Box className="tree-item">
                                 <Folder className="tree-item-icon" />
                                 <Typography className="tree-item-label">Procedures ({procedures.filter(proc => proc.schema_name === schema.schema_name).length})</Typography>
                               </Box>
                             }
                           >
                             {procedures
                               .filter(proc => proc.schema_name === schema.schema_name)
                               .map((proc) => (
                                 <TreeItem
                                   key={proc.procedure_name}
                                   itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-${proc.procedure_name}`}
                                   label={
                                     <Box className="tree-item">
                                       <Functions className="tree-item-icon" />
                                       <Typography className="tree-item-label">
                                         {proc.procedure_name}
                                       </Typography>
                                     </Box>
                                   }
                                 />
                               ))}
                           </TreeItem>

                           {/* User functions */}
                           <TreeItem
                             itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-functions`}
                             label={
                               <Box className="tree-item">
                                 <Folder className="tree-item-icon" />
                                 <Typography className="tree-item-label">Functions ({functions.filter(func => func.schema_name === schema.schema_name).length})</Typography>
                               </Box>
                             }
                           >
                             {functions
                               .filter(func => func.schema_name === schema.schema_name)
                               .map((func) => (
                                 <TreeItem
                                   key={func.function_name}
                                   itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-${func.function_name}`}
                                   label={
                                     <Box className="tree-item">
                                       <Code className="tree-item-icon" />
                                       <Typography className="tree-item-label">
                                         {func.function_name}
                                       </Typography>
                                     </Box>
                                   }
                                 />
                               ))}
                           </TreeItem>

                           {/* Sequence objects */}
                           <TreeItem
                             itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-sequences`}
                             label={
                               <Box className="tree-item">
                                 <Folder className="tree-item-icon" />
                                 <Typography className="tree-item-label">Sequences ({sequences.filter(seq => seq.schema_name === schema.schema_name).length})</Typography>
                               </Box>
                             }
                           >
                             {sequences
                               .filter(seq => seq.schema_name === schema.schema_name)
                               .map((seq) => (
                                 <TreeItem
                                   key={seq.sequence_name}
                                   itemId={`${connection.name}-${db.database_name}-${schema.schema_name}-${seq.sequence_name}`}
                                   label={
                                     <Box className="tree-item">
                                       <Timeline className="tree-item-icon" />
                                       <Typography className="tree-item-label">
                                         {seq.sequence_name}
                                       </Typography>
                                     </Box>
                                   }
                                 />
                               ))}
                           </TreeItem>
                         </TreeItem>
                       ))}
                     </TreeItem>

                     {/* Database triggers */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-triggers-folder`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Triggers ({triggers.length})</Typography>
                         </Box>
                       }
                     >
                       {triggers.map((trigger) => (
                         <TreeItem
                           key={trigger.trigger_name}
                           itemId={`${connection.name}-${db.database_name}-trigger-${trigger.trigger_name}`}
                           label={
                             <Box className="tree-item">
                               <Bolt className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {trigger.trigger_name}
                               </Typography>
                             </Box>
                           }
                         />
                       ))}
                     </TreeItem>

                     {/* Database indexes */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-indexes-folder`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Indexes ({indexes.length})</Typography>
                         </Box>
                       }
                     >
                       {indexes.map((index) => (
                         <TreeItem
                           key={index.index_name}
                           itemId={`${connection.name}-${db.database_name}-index-${index.index_name}`}
                           label={
                             <Box className="tree-item">
                               <StorageIcon className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {index.index_name}
                               </Typography>
                             </Box>
                           }
                         />
                       ))}
                     </TreeItem>

                     {/* File groups */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-tablespaces-folder`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Tablespaces ({tablespaces.length})</Typography>
                         </Box>
                       }
                     >
                       {tablespaces.map((tablespace) => (
                         <TreeItem
                           key={tablespace.filegroup_name}
                           itemId={`${connection.name}-${db.database_name}-tablespace-${tablespace.filegroup_name}`}
                           label={
                             <Box className="tree-item">
                               <StorageIcon className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {tablespace.filegroup_name}
                               </Typography>
                             </Box>
                           }
                         />
                       ))}
                     </TreeItem>

                     {/* Database users */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-users-folder`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Users ({users.length})</Typography>
                         </Box>
                       }
                     >
                       {users.map((user) => (
                         <TreeItem
                           key={user.user_name}
                           itemId={`${connection.name}-${db.database_name}-user-${user.user_name}`}
                           label={
                             <Box className="tree-item">
                               <Person className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {user.user_name}
                               </Typography>
                             </Box>
                           }
                         />
                       ))}
                     </TreeItem>

                     {/* SSIS packages */}
                     <TreeItem
                       itemId={`${connection.name}-${db.database_name}-packages-folder`}
                       label={
                         <Box className="tree-item">
                           <Folder className="tree-item-icon" />
                           <Typography className="tree-item-label">Packages ({packages.length})</Typography>
                         </Box>
                       }
                     >
                       {packages.map((pkg) => (
                         <TreeItem
                           key={`${pkg.folder_name}-${pkg.project_name}-${pkg.package_name}`}
                           itemId={`${connection.name}-${db.database_name}-package-${pkg.folder_name}-${pkg.project_name}-${pkg.package_name}`}
                           label={
                             <Box className="tree-item">
                               <Inventory className="tree-item-icon" />
                               <Typography className="tree-item-label">
                                 {pkg.folder_name}/{pkg.project_name}/{pkg.package_name}
                               </Typography>
                             </Box>
                           }
                         />
                       ))}
                     </TreeItem>

                   </TreeItem>
                 ))}
                 {currentConnection?.name === connection.name && !isConnectionActive(connection.name) && (
                   <TreeItem
                     itemId={`${connection.name}-not-connected`}
                     label={
                       <Box className="tree-item">
                         <Typography className="tree-item-label" sx={{ color: '#888888', fontStyle: 'italic' }}>
                           Click to connect
                         </Typography>
                       </Box>
                     }
                   />
                 )}
               </TreeItem>
            </TreeItem>
          ))}
        </TreeView>
      </div>

      {/* Success/error message popup */}
      <Dialog 
        open={connectionFeedback !== null} 
        onClose={() => setConnectionFeedback(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          color: connectionFeedback?.type === 'success' ? '#4caf50' : '#f44336',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {connectionFeedback?.type === 'success' ? <CheckCircle /> : <RadioButtonUnchecked />}
          {connectionFeedback?.title}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {connectionFeedback?.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConnectionFeedback(null)}
            variant="contained"
            sx={{
              backgroundColor: connectionFeedback?.type === 'success' ? '#4caf50' : '#f44336',
              '&:hover': {
                backgroundColor: connectionFeedback?.type === 'success' ? '#45a049' : '#d32f2f'
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create new connection form */}
      <Dialog 
        open={newConnectionModal} 
        onClose={() => setNewConnectionModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#90caf9' }}>
          Create New Connection
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Connection Name"
              value={newConnectionForm.connectionName}
              onChange={(e) => handleFormChange('connectionName', e.target.value)}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <TextField
              label="Username"
              value={newConnectionForm.user}
              onChange={(e) => handleFormChange('user', e.target.value)}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <TextField
              label="Password"
              type="password"
              value={newConnectionForm.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <TextField
              label="Server"
              value={newConnectionForm.server}
              onChange={(e) => handleFormChange('server', e.target.value)}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <TextField
              label="Database"
              value={newConnectionForm.database}
              onChange={(e) => handleFormChange('database', e.target.value)}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <TextField
              label="Port"
              type="number"
              value={newConnectionForm.port}
              onChange={(e) => handleFormChange('port', parseInt(e.target.value))}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setNewConnectionModal(false)}
            sx={{ color: '#888888' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateNewConnection}
            variant="contained"
            disabled={creatingConnection || !newConnectionForm.connectionName || !newConnectionForm.user || !newConnectionForm.password || !newConnectionForm.database}
            sx={{
              backgroundColor: '#90caf9',
              '&:hover': { backgroundColor: '#64b5f6' },
              '&:disabled': { backgroundColor: '#555555' }
            }}
          >
            {creatingConnection ? <CircularProgress size={20} /> : 'Create Connection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Right-click menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#2d2d2d',
            color: '#ffffff',
            border: '1px solid #404040'
          }
        }}
      >
        <MenuItem onClick={handleContextMenuRefresh} disabled={!selectedConnection}>
          <ListItemIcon>
            <Refresh fontSize="small" sx={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuDisconnect} disabled={!selectedConnection || !isConnectionActive(selectedConnection?.name)}>
          <ListItemIcon>
            <LinkOff fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText>Disconnect</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete} disabled={!selectedConnection}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText>Delete Connection</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create table/view modal */}
      <CreateObjectModal
        open={createObjectModal.open}
        onClose={handleCloseCreateObjectModal}
        objectType={createObjectModal.objectType}
        schemaName={createObjectModal.schemaName}
        connectionName={createObjectModal.connectionName}
      />

      {/* Migration modal */}
      <MigrationModal
        open={migrationModal.open}
        onClose={handleCloseMigrationModal}
        connectionName={migrationModal.connectionName}
        databaseName={migrationModal.databaseName}
      />
    </div>
  );
};

export default DatabaseNavigator;
