import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DatabaseNavigator from './components/DatabaseNavigator';
import QueryEditor from './components/QueryEditor';
import axios from 'axios';
import './App.css';

// Dark theme for the application
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
  },
});

const API_BASE_URL = 'http://localhost:3100/api/database';

function App() {
  const [currentConnection, setCurrentConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('master');
  const [connections, setConnections] = useState([]);

  // Load connections on component mount
  useEffect(() => {
    loadConnections();
  }, []);

  /**
   * Loads all available database connections from the backend
   */
  const loadConnections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/connections`);
      setConnections(response.data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
      setConnections([]);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="app">
        <DatabaseNavigator 
          currentConnection={currentConnection}
          setCurrentConnection={setCurrentConnection}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <QueryEditor 
          currentConnection={currentConnection}
          activeTab={activeTab}
          connections={connections}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
