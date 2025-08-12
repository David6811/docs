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
  Switch,
  Chip,
} from '@mui/material';
import { 
  Menu, 
  MenuOpen, 
  LightMode, 
  DarkMode,
  AccountCircle,
} from '@mui/icons-material';
import FileTree from './components/FileTree';
import FileViewer from './components/FileViewer';
import { FileType } from './types';

const createAppTheme = (isDark: boolean) => createTheme({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#06b6d4',
      light: '#67e8f9',
      dark: '#0891b2',
    },
    background: {
      default: isDark ? '#0f172a' : '#f8fafc',
      paper: isDark ? '#1e293b' : '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      700: '#374151',
      800: '#1f2937',
      900: '#0f172a',
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
          background: isDark 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(99,102,241,0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: isDark 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 2px 10px rgba(0,0,0,0.1)',
          backgroundImage: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
            transform: 'scale(1.05)',
          },
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = createAppTheme(isDarkMode);

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

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
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
          <Toolbar sx={{ py: 1 }}>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={toggleSidebar}
              edge="start"
              sx={{ mr: 2 }}
            >
              {sidebarOpen ? <MenuOpen /> : <Menu />}
            </IconButton>
            
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                Documents
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircle sx={{ fontSize: 20 }} />
                <Chip
                  label="Welcome, Wei Xu"
                  variant="outlined"
                  size="small"
                  sx={{
                    color: 'inherit',
                    borderColor: 'rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiChip-label': {
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightMode sx={{ fontSize: 18, opacity: isDarkMode ? 0.5 : 1 }} />
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              />
              <DarkMode sx={{ fontSize: 18, opacity: isDarkMode ? 1 : 0.5 }} />
            </Box>
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
