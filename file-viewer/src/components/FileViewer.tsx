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
        const htmlSrc = process.env.NODE_ENV === 'development' 
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <Box sx={{ height: '100%', width: '100%' }}>
            <iframe
              src={htmlSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="HTML Content"
            />
          </Box>
        );

      case 'image':
        const imageSrc = process.env.NODE_ENV === 'development' 
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
            <img
              src={imageSrc}
              alt="File content"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </Box>
        );

      case 'pdf':
        const pdfSrc = process.env.NODE_ENV === 'development' 
          ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
          : `${process.env.PUBLIC_URL}/files/${filePath}`;
        return (
          <Box sx={{ height: '100%', width: '100%' }}>
            <iframe
              src={pdfSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Content"
            />
          </Box>
        );

      case 'text':
        return (
          <Box sx={{ p: 2 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
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
      const url = `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`;
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
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {filePath && (
        <Box sx={{ 
          p: 2.5, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {filePath.split('/').pop()}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {fileType && (
                <Chip
                  label={fileType.toUpperCase()}
                  size="small"
                  color={getFileTypeColor(fileType)}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              <Typography variant="caption" color="text.secondary">
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
        overflow: 'auto',
        backgroundColor: filePath ? 'background.paper' : 'background.default',
      }}>
        {renderContent()}
      </Box>
    </Paper>
  );
};

export default FileViewer;