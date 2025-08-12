import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { OpenInNew, Description } from '@mui/icons-material';
import { FileType } from '../types';

interface FileViewerProps {
  filePath: string | null;
  fileType: FileType | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath, fileType }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!filePath || !fileType) {
      setContent('');
      setError('');
      return;
    }

    const loadFile = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (fileType === 'text') {
          const { readFileContent } = await import('../utils/fileUtils');
          const fileContent = await readFileContent(filePath);
          setContent(fileContent);
        } else {
          setContent('');
        }
      } catch (err) {
        setError(`Failed to load file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath, fileType]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!filePath) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          height="100%" 
          sx={{ color: 'text.secondary' }}
        >
          <Description sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            No document selected
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
            Choose a file from the sidebar to view its contents here
          </Typography>
        </Box>
      );
    }

    switch (fileType) {
      case 'html':
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const htmlSrc = isLocalhost
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <iframe
            src={htmlSrc}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            title="HTML Content"
          />
        );

      case 'image':
        const isLocalhostImg = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const imageSrc = isLocalhostImg
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              p: 1, // Minimal padding for images
            }}
          >
            <img
              src={imageSrc}
              alt="File content"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </Box>
        );

      case 'pdf':
        const isLocalhostPdf = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const pdfSrc = isLocalhostPdf
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <iframe
            src={pdfSrc}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            title="PDF Content"
          />
        );

      case 'text':
        const isLocalhostText = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isLocalhostText) {
          // In production, show text files in iframe
          const textSrc = `${process.env.PUBLIC_URL}/files/${filePath}`;
          return (
            <iframe
              src={textSrc}
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              title="Text Content"
            />
          );
        }
        
        return (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            p: 1, // Minimal padding
            overflow: 'auto',
          }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '14px',
              margin: 0,
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            }}>
              {content}
            </pre>
          </Box>
        );

      default:
        return (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            File type not supported: {fileType}
          </Typography>
        );
    }
  };

  const handleOpenInNewWindow = () => {
    if (filePath) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const url = isLocalhost
        ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
        : `${process.env.PUBLIC_URL}/files/${filePath}`;
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  const getFileTypeColor = (type: FileType | null) => {
    switch (type) {
      case 'html': return 'warning';
      case 'pdf': return 'error';
      case 'image': return 'success';
      case 'text': return 'info';
      default: return 'default';
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden', // Prevent content overflow
      }}
    >
      {filePath && (
        <Box sx={{ 
          p: window.innerWidth <= 768 ? 1 : 1.5, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa',
          minHeight: window.innerWidth <= 768 ? '48px' : '56px',
        }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.95rem' }}>
              {filePath.split('/').pop()}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {fileType && (
                <Chip
                  label={fileType.toUpperCase()}
                  size="small"
                  color={getFileTypeColor(fileType)}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {filePath}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Open in new window" arrow>
            <IconButton
              onClick={handleOpenInNewWindow}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden', // Change to hidden to let iframe fill completely
        backgroundColor: filePath ? 'background.paper' : 'background.default',
        position: 'relative',
      }}>
        {renderContent()}
      </Box>
    </Paper>
  );
};

export default FileViewer;