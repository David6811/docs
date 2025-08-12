import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  IconButton,
  Skeleton,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  Delete,
  Close,
  Visibility,
  VisibilityOff,
  DriveFileMove,
} from '@mui/icons-material';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  onMoveSuccess?: () => void;
  fileName: string;
  filePath: string;
  isDirectory?: boolean;
}

interface FolderContents {
  fileCount: number;
  folderCount: number;
}

interface AvailableFolder {
  name: string;
  path: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  onMoveSuccess,
  fileName,
  filePath,
  isDirectory = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [folderContents, setFolderContents] = useState<FolderContents | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'delete' | 'move'>('delete');
  const [availableFolders, setAvailableFolders] = useState<AvailableFolder[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  // Load folder contents and available folders when dialog opens for directories
  React.useEffect(() => {
    if (open && isDirectory && filePath) {
      const loadData = async () => {
        setLoadingContents(true);
        try {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          // Load folder contents
          const contentsUrl = isLocalhost 
            ? `http://localhost:3001/api/folder-contents?folderPath=${encodeURIComponent(filePath)}`
            : `/api/folder-contents?folderPath=${encodeURIComponent(filePath)}`;
          
          const contentsResponse = await fetch(contentsUrl);
          if (contentsResponse.ok) {
            const data = await contentsResponse.json();
            setFolderContents({
              fileCount: data.fileCount,
              folderCount: data.folderCount
            });
          }
          
          // Load available folders for move destination
          const foldersUrl = isLocalhost 
            ? 'http://localhost:3001/api/folders'
            : '/api/folders';
          
          const foldersResponse = await fetch(foldersUrl);
          if (foldersResponse.ok) {
            const folders = await foldersResponse.json();
            // Filter out the current folder being deleted
            const filteredFolders = folders.filter((folder: AvailableFolder) => folder.path !== filePath);
            setAvailableFolders(filteredFolders);
          }
        } catch (err) {
          console.error('Failed to load data:', err);
        } finally {
          setLoadingContents(false);
        }
      };

      loadData();
    } else {
      setFolderContents(null);
      setAvailableFolders([]);
    }
  }, [open, isDirectory, filePath]);

  const handleDelete = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (deleteMode === 'move' && isDirectory) {
      // Validate destination selection
      if (selectedDestination === '' && availableFolders.length > 0) {
        setError('Please select a destination folder');
        return;
      }
    }

    setDeleting(true);
    setError('');

    try {
      if (deleteMode === 'move' && isDirectory) {
        // Call move API instead of delete
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocalhost ? 'http://localhost:3001/api/move-folder-contents' : '/api/move-folder-contents';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceFolderPath: filePath,
            destinationFolderPath: selectedDestination,
            password: password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Move failed');
        }

        // Show success message briefly
        setError('');
        // Notify parent component of successful move
        if (onMoveSuccess) {
          onMoveSuccess();
        }
      } else {
        // Normal delete operation
        await onConfirm(password);
      }
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setDeleting(false);
    setShowPassword(false);
    setFolderContents(null);
    setLoadingContents(false);
    setDeleteMode('delete');
    setAvailableFolders([]);
    setSelectedDestination('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !deleting) {
      handleDelete();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6" component="span">
              Delete {isDirectory ? 'Folder' : 'File'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action cannot be undone. The {isDirectory ? 'folder and all its contents' : 'file'} will be permanently deleted.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {isDirectory ? 'Folder' : 'File'} to delete:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Path: {filePath}
          </Typography>
        </Box>

        {isDirectory && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Folder contents that will be deleted:
            </Typography>
            {loadingContents ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            ) : folderContents ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {folderContents.fileCount > 0 && (
                  <Chip 
                    label={`${folderContents.fileCount} file${folderContents.fileCount !== 1 ? 's' : ''}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
                {folderContents.folderCount > 0 && (
                  <Chip 
                    label={`${folderContents.folderCount} folder${folderContents.folderCount !== 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {folderContents.fileCount === 0 && folderContents.folderCount === 0 && (
                  <Chip 
                    label="Empty folder"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Unable to load folder contents
              </Typography>
            )}
          </Box>
        )}

        {isDirectory && folderContents && (folderContents.fileCount > 0 || folderContents.folderCount > 0) && (
          <Box sx={{ mb: 2 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
                What would you like to do?
              </FormLabel>
              <RadioGroup
                value={deleteMode}
                onChange={(e) => setDeleteMode(e.target.value as 'delete' | 'move')}
              >
                <FormControlLabel
                  value="delete"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Delete folder and all contents permanently
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This action cannot be undone
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="move"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Move contents to another folder, then delete empty folder
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Files will be preserved in the destination folder
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {deleteMode === 'move' && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Move to folder</InputLabel>
                  <Select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    label="Move to folder"
                  >
                    <MenuItem value="">
                      <em>Root directory</em>
                    </MenuItem>
                    {availableFolders.map((folder) => (
                      <MenuItem key={folder.path} value={folder.path}>
                        📁 {folder.path}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {availableFolders.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    No other folders available. Files will be moved to root directory.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={deleting}
          error={!!error}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color={deleteMode === 'move' ? 'primary' : 'error'}
          disabled={deleting || !password.trim()}
          startIcon={deleteMode === 'move' ? <DriveFileMove /> : <Delete />}
        >
          {deleting 
            ? (deleteMode === 'move' ? 'Moving...' : 'Deleting...') 
            : (deleteMode === 'move' ? 'Move & Delete' : 'Delete')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;