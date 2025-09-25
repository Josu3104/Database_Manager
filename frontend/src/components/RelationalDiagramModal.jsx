import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import mermaid from 'mermaid';

const API_URL = 'http://localhost:3100/api/database';

// Simple counter for unique IDs
let chartCounter = 0;

const MermaidChart = ({ chart }) => {
  const containerRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState('');


  //The chart was being generated but took around 2 mins to actually render the chart.
  //This is a workaround to fix the issue. Had a hard time following templates with mermaid, but I gave up on the time issue.
  useEffect(() => {
    if (!chart) return;

    const drawChart = async () => {
      setIsLoading(true);
      setSvgContent('');
      
      try {
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark'
        });

        const uniqueId = `chart-${Date.now()}-${++chartCounter}`;
        const result = await mermaid.render(uniqueId, chart);
        
        setSvgContent(result.svg);
        
      } catch (error) {
        console.error('Chart render failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    drawChart();
  }, [chart]);

  if (!chart) return null;

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        minHeight: '400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        position: 'relative'
      }}
    >
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          color: '#90caf9',
          zIndex: 10,
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          padding: '10px',
          borderRadius: '4px'
        }}>
          Drawing diagram...
        </div>
      )}
      
      {svgContent && !isLoading && (
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

const RelationalDiagramModal = ({ open, onClose, connectionName, databaseName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagramCode, setDiagramCode] = useState('');

  useEffect(() => {
    if (open && connectionName) {
      loadDatabaseSchema();
    }
  }, [open, connectionName]);

  const loadDatabaseSchema = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading schema for:', connectionName);
      const response = await axios.get(`${API_URL}/schema/${connectionName}`);
      const { tables, foreignKeys } = response.data;
      
      console.log('Found tables:', tables?.length || 0);
      console.log('Found relationships:', foreignKeys?.length || 0);
      
      const diagram = createDiagram(tables, foreignKeys);
      console.log('Created diagram');
      setDiagramCode(diagram);
      
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError('Could not load database schema');
    } finally {
      setLoading(false);
    }
  };

  const createDiagram = (tables, foreignKeys) => {
   
    const tableGroups = {};
    tables.forEach(row => {
      if (!tableGroups[row.table_name]) {
        tableGroups[row.table_name] = [];
      }
      tableGroups[row.table_name].push(row);
    });


    const foreignKeyColumns = {};
    foreignKeys.forEach(fk => {
      foreignKeyColumns[`${fk.parent_table}.${fk.parent_column}`] = true;
    });

    let diagram = 'erDiagram\n';


    Object.keys(tableGroups).forEach(tableName => {
      diagram += `${tableName} {\n`;
      
      tableGroups[tableName].forEach(col => {
        let keyType = '';
        if (col.is_primary_key) keyType = ' PK';
        else if (foreignKeyColumns[`${col.table_name}.${col.column_name}`]) keyType = ' FK';
        
        diagram += `${col.data_type} ${col.column_name}${keyType}\n`;
      });
      
      diagram += '}\n';
    });

    //Rels
    foreignKeys.forEach(fk => {
      diagram += `${fk.ref_table} ||--o{ ${fk.parent_table} : ""\n`;
    });

    return diagram;
  };

  const closeModal = () => {
    setError(null);
    setDiagramCode('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={closeModal}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ color: '#90caf9', borderBottom: '1px solid #333' }}>
        Database Diagram - {databaseName}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress sx={{ color: '#90caf9' }} />
            <Typography sx={{ ml: 2, color: '#cccccc' }}>
              Loading diagram...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {diagramCode && !loading && !error && (
          <Box sx={{ 
            width: '100%', 
            minHeight: '500px',
            backgroundColor: '#2a2a2a',
            borderRadius: 1,
            p: 2,
            overflow: 'auto',
            '& svg': {
              maxWidth: '100%',
              height: 'auto',
              backgroundColor: '#2a2a2a'
            }
          }}>
            <MermaidChart chart={diagramCode} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={closeModal}
          sx={{ color: '#90caf9' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationalDiagramModal;