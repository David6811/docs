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
      main: '#2563eb',
    },
    secondary: {
      main: '#0ea5e9',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    subtitle1: {
      fontWeight: 500,
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e40af',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '@media (max-width: 768px)': {
            padding: '8px',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          '@media (max-width: 768px)': {
            fontSize: '1rem',
          },
        },
      },
    },
  },
});

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  const handleFileSelect = (filePath: string, fileType: FileType) => {
    setSelectedFile(filePath);
    setSelectedFileType(fileType);
    // Auto-close sidebar on mobile after file selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Auto-select HTML file on load
  useEffect(() => {
    const findHtmlFile = async () => {
      try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let files;
        
        if (isLocalhost) {
          // Local development - use API
          const response = await fetch('http://localhost:3001/api/files');
          files = await response.json();
        } else {
          // Production - use static files
          const response = await fetch(`${process.env.PUBLIC_URL}/api/files.json`);
          files = await response.json();
        }
        
        // Find the first HTML file
        const findHtml = (items: any[]): any => {
          for (const item of items) {
            if (item.isDirectory && item.children) {
              const found = findHtml(item.children);
              if (found) return found;
            } else if (item.name.toLowerCase().endsWith('.html')) {
              return item;
            }
          }
          return null;
        };
        
        const htmlFile = findHtml(files);
        if (htmlFile) {
          setSelectedFile(htmlFile.path);
          setSelectedFileType('html' as FileType);
        }
      } catch (error) {
        console.error('Error finding HTML file:', error);
      }
    };
    
    findHtmlFile();
  }, []);

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
        
        <Box sx={{ 
          flexGrow: 1, 
          p: isMobile ? 0.5 : 1, 
          display: 'flex', 
          gap: isMobile ? 0 : 1, 
          height: 'calc(100vh - 64px)',
          position: 'relative',
        }}>
          {/* Mobile overlay */}
          {isMobile && sidebarOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
              }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          {sidebarOpen && (
            <Box sx={{ 
              flex: isMobile ? 'none' : '0 0 320px',
              width: isMobile ? '280px' : '320px',
              height: '100%',
              position: isMobile ? 'absolute' : 'relative',
              left: isMobile ? 0 : 'auto',
              top: isMobile ? 0 : 'auto',
              zIndex: isMobile ? 1000 : 'auto',
              transition: 'all 0.3s ease-in-out',
              transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
            }}>
              <FileTree onFileSelect={handleFileSelect} />
            </Box>
          )}
          
          {/* Divider - only on desktop */}
          {sidebarOpen && !isMobile && (
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          )}
          
          {/* Main content */}
          <Box sx={{ 
            flex: 1, 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            minWidth: 0, // Prevent flex overflow
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
