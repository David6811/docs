import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import { Menu, MenuOpen } from '@mui/icons-material';
import FileTree from './components/FileTree';
import FileViewer from './components/FileViewer';
import { FileType } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const handleFileSelect = (filePath: string, fileType: FileType) => {
    setSelectedFile(filePath);
    setSelectedFileType(fileType);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={toggleSidebar}
              edge="start"
              sx={{ mr: 2 }}
            >
              {sidebarOpen ? <MenuOpen /> : <Menu />}
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Document Viewer
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', gap: 3, height: 'calc(100vh - 64px)' }}>
          {sidebarOpen && (
            <Box sx={{ 
              flex: '0 0 350px', 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
            }}>
              <FileTree onFileSelect={handleFileSelect} />
            </Box>
          )}
          {sidebarOpen && (
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          )}
          <Box sx={{ 
            flex: 1, 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
          }}>
            <FileViewer 
              filePath={selectedFile} 
              fileType={selectedFileType}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
