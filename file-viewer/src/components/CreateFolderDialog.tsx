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
} from '@mui/material';
import {
  CreateNewFolder,
  Close,
} from '@mui/icons-material';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => Promise<void>;
  parentFolder?: string;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  parentFolder,
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    // Basic validation for folder name
    if (!/^[a-zA-Z0-9\-_\s\.]+$/.test(trimmedName)) {
      setError('Folder name can only contain letters, numbers, spaces, hyphens, underscores, and dots');
      return;
    }

    if (trimmedName.startsWith('.') || trimmedName.includes('..') || trimmedName.includes('/') || trimmedName.includes('\\')) {
      setError('Invalid folder name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await onConfirm(trimmedName);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    setCreating(false);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !creating) {
      handleCreate();
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
            <CreateNewFolder color="primary" />
            <Typography variant="h6" component="span">
              Create New Folder
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {parentFolder && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Create in:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              /{parentFolder}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={creating}
          error={!!error}
          placeholder="Enter folder name"
          helperText="Use letters, numbers, spaces, hyphens, underscores, and dots only"
          sx={{ mt: 1 }}
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={creating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={creating || !folderName.trim()}
          startIcon={<CreateNewFolder />}
        >
          {creating ? 'Creating...' : 'Create Folder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;