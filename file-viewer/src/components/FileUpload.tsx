import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  PictureAsPdf,
  Html,
  Image,
} from '@mui/icons-material';

interface FileUploadProps {
  onUploadSuccess: () => void;
  onClose: () => void;
  targetFolder?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onClose, targetFolder }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if backend features are available (only in localhost development)
  const isBackendAvailable = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = /\.(pdf|html?|jpe?g|png|gif|webp|svg)$/i;
      if (!allowedTypes.test(file.name)) {
        setError('Only PDF, HTML, and image files are allowed');
        return;
      }
      
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    if (!isBackendAvailable) {
      setError('Upload functionality is not available in production');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add target folder if specified
      if (targetFolder) {
        formData.append('targetFolder', targetFolder);
      }

      const apiUrl = 'http://localhost:3001/api/upload';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setSuccess(`File "${result.filename}" uploaded successfully!`);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.match(/\.pdf$/i)) return <PictureAsPdf color="error" />;
    if (filename.match(/\.html?$/i)) return <Html color="warning" />;
    if (filename.match(/\.(jpe?g|png|gif|webp|svg)$/i)) return <Image color="success" />;
    return <CloudUpload />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Don't render the upload component if backend is not available
  if (!isBackendAvailable) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: '2px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Alert severity="info">
          Upload functionality is only available in development mode.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upload File
          </Typography>
          {targetFolder && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Target: /{targetFolder}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          border: '2px dashed',
          borderColor: selectedFile ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.html,.htm,.jpg,.jpeg,.png,.gif,.webp,.svg"
          style={{ display: 'none' }}
        />

        {selectedFile ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              {getFileIcon(selectedFile.name)}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(selectedFile.size)}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={selectedFile.type || 'Unknown'} 
                size="small" 
                variant="outlined" 
                color="primary"
              />
            </Box>
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Drop files here or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports PDF, HTML, and image files (max 50MB)
            </Typography>
            {targetFolder && (
              <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                📁 Uploading to: /{targetFolder}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Uploading...
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={uploading ? <CircularProgress size={18} /> : <CloudUpload />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>
    </Paper>
  );
};

export default FileUpload;