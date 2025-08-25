/**
 * QueryResultsTable Component
 * 
 * This component displays SQL query results in a formatted table with proper styling.
 * It handles different types of results including data rows, row counts, and error messages.
 * 
 * Features:
 * - Displays query results in a structured table format
 * - Handles empty results and error states
 * - Shows row count and execution time
 * - Responsive design with horizontal scrolling for wide tables
 * - Dark theme styling consistent with the application
 * 
 * @param {Object} props - Component props
 * @param {Object|null} props.results - Query results object containing rows and metadata
 * @param {string|null} props.error - Error message if query failed
 * @param {boolean} props.loading - Loading state indicator
 */
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ContentCopy,
  Download,
  Refresh
} from '@mui/icons-material';

const QueryResultsTable = ({ results, error, loading }) => {
  const [copied, setCopied] = useState(false);

  // Handle copying results to clipboard
  const handleCopyResults = () => {
    if (!results || !results.rows || results.rows.length === 0) return;
    
    const headers = Object.keys(results.rows[0]);
    const csvContent = [
      headers.join('\t'),
      ...results.rows.map(row => 
        headers.map(header => 
          typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] || 'NULL')
        ).join('\t')
      )
    ].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle downloading results as CSV
  const handleDownloadCSV = () => {
    if (!results || !results.rows || results.rows.length === 0) return;
    
    const headers = Object.keys(results.rows[0]);
    const csvContent = [
      headers.join(','),
      ...results.rows.map(row => 
        headers.map(header => {
          const value = typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] || 'NULL');
          // Escape commas and quotes in CSV
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Executing query...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {error}
        </Typography>
      </Alert>
    );
  }

  if (!results || !results.rows) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No results to display. Execute a query to see results here.
        </Typography>
      </Box>
    );
  }

  if (results.rows.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Query executed successfully. 
        </Typography>
      </Box>
    );
  }

  const headers = Object.keys(results.rows[0]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Results Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #404040',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#2d2d2d'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            Query Results
          </Typography>
         
          
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Copy to clipboard">
            <IconButton 
              onClick={handleCopyResults}
              size="small"
              sx={{ color: copied ? '#4caf50' : '#888888' }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download as CSV">
            <IconButton 
              onClick={handleDownloadCSV}
              size="small"
              sx={{ color: '#888888' }}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Results Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          flex: 1,
          backgroundColor: '#1e1e1e',
          overflow: 'auto',
          maxHeight: 'calc(100% - 60px)', 
          '& .MuiTable-root': {
            backgroundColor: '#1e1e1e'
          }
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderBottom: '1px solid #404040',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {results.rows.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#2a2a2a'
                  },
                  '&:hover': {
                    backgroundColor: '#404040'
                  }
                }}
              >
                {headers.map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      color: '#ffffff',
                      borderBottom: '1px solid #404040',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      minWidth: 100,
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] || 'NULL')}
                  >
                    {typeof row[header] === 'object' 
                      ? JSON.stringify(row[header]) 
                      : String(row[header] || 'NULL')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QueryResultsTable;
