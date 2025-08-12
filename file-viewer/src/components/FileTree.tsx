import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  InsertDriveFile,
  Folder,
  Html,
  Image,
  PictureAsPdf,
  OpenInNew,
  Delete,
  CloudUpload,
  ExpandLess,
  Refresh,
  CreateNewFolder,
} from '@mui/icons-material';
import { FileNode, FileType } from '../types';
import { getFileType, buildFileTree } from '../utils/fileUtils';
import FileUpload from './FileUpload';
import DeleteDialog from './DeleteDialog';
import CreateFolderDialog from './CreateFolderDialog';

interface FileTreeProps {
  onFileSelect: (filePath: string, fileType: FileType) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>(''); // Track selected folder for uploads
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file: FileNode | null }>({ open: false, file: null });
  const [createFolderDialog, setCreateFolderDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check if backend features are available (only in localhost development)
  const isBackendAvailable = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const loadFileTree = async () => {
    setLoading(true);
    try {
      const tree = await buildFileTree('/Users/weixu/docs');
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFileTree();
  }, []);

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder color="primary" />;
    
    const fileType = getFileType(fileName);
    switch (fileType) {
      case 'html':
        return <Html color="warning" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'image':
        return <Image color="success" />;
      default:
        return <InsertDriveFile />;
    }
  };

  const handleFileSelect = (filePath: string, fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      // If it's a directory, set it as the selected folder for uploads
      setSelectedFolder(filePath);
      setSelectedFile(''); // Clear file selection when folder is selected
    } else {
      // If it's a file, select it for viewing
      setSelectedFile(filePath);
      setSelectedFolder(''); // Clear folder selection when file is selected
      const fileType = getFileType(fileName);
      onFileSelect(filePath, fileType);
    }
  };

  const handleOpenInNewWindow = (event: React.MouseEvent, filePath: string) => {
    event.stopPropagation();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocalhost
      ? `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`
      : `${process.env.PUBLIC_URL}/files/${filePath}`;
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const handleDeleteClick = (event: React.MouseEvent, file: FileNode) => {
    event.stopPropagation();
    setDeleteDialog({ open: true, file });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteDialog.file) return;

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3001/api/delete' : '/api/delete';
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: deleteDialog.file.path,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Refresh the file tree
      await loadFileTree();
      
      // If the deleted file was selected, clear selection
      if (selectedFile === deleteDialog.file.path) {
        setSelectedFile('');
        onFileSelect('', 'text');
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the dialog
    }
  };

  const handleUploadSuccess = async () => {
    setShowUpload(false);
    await loadFileTree();
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3001/api/create-folder' : '/api/create-folder';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPath: folderName,
          parentFolder: selectedFolder || '', // Create in selected folder or root
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      // Refresh the file tree
      await loadFileTree();
      
    } catch (error) {
      throw error; // Re-throw to be handled by the dialog
    }
  };

  const renderTree = (nodes: FileNode[]): React.ReactElement[] => {
    return nodes.map((node) => (
      <TreeItem
        key={node.path}
        itemId={node.path}
        label={
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={0.5}>
            <Box display="flex" alignItems="center" gap={0.75} flex={1} minWidth={0}>
              <Box sx={{ fontSize: '16px', minWidth: '16px' }}>
                {getFileIcon(node.name, node.isDirectory)}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.8rem',
                  fontWeight: (selectedFile === node.path || selectedFolder === node.path) ? 600 : 400,
                  color: (selectedFile === node.path || selectedFolder === node.path) ? 'primary.main' : 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {node.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {!node.isDirectory && (
                <Tooltip title="Open in new window" arrow>
                  <IconButton
                    size="small"
                    onClick={(event) => handleOpenInNewWindow(event, node.path)}
                    sx={{
                      opacity: 0.6,
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'action.hover',
                      },
                      padding: '2px',
                      minWidth: '20px',
                      height: '20px',
                    }}
                  >
                    <OpenInNew sx={{ fontSize: '14px' }} />
                  </IconButton>
                </Tooltip>
              )}
              {isBackendAvailable && (
                <Tooltip title={node.isDirectory ? "Delete folder" : "Delete file"} arrow>
                  <IconButton
                    size="small"
                    onClick={(event) => handleDeleteClick(event, node)}
                    sx={{
                      opacity: 0.6,
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        color: 'error.main',
                      },
                      padding: '2px',
                      minWidth: '20px',
                      height: '20px',
                    }}
                  >
                    <Delete sx={{ fontSize: '14px' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        }
        onClick={() => handleFileSelect(node.path, node.name, node.isDirectory)}
        sx={{
          '& .MuiTreeItem-content': {
            backgroundColor: (selectedFile === node.path || selectedFolder === node.path) 
              ? 'rgba(25, 118, 210, 0.1)' 
              : 'transparent',
            borderRadius: 0.5,
            margin: '1px 0',
            padding: isMobile ? '4px 6px' : '2px 4px',
            minHeight: isMobile ? '44px' : '32px', // Touch-friendly height on mobile
            '&:hover': {
              backgroundColor: (selectedFile === node.path || selectedFolder === node.path)
                ? 'rgba(25, 118, 210, 0.15)' 
                : 'rgba(0, 0, 0, 0.05)',
            },
            // Touch feedback on mobile
            '@media (max-width: 768px)': {
              '&:active': {
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
              },
            }
          },
          '& .MuiTreeItem-label': {
            padding: isMobile ? '4px 6px' : '2px 4px',
            fontSize: isMobile ? '0.85rem' : '0.8rem',
          }
        }}
      >
        {node.children && renderTree(node.children)}
      </TreeItem>
    ));
  };

  const isMobile = window.innerWidth <= 768;
  
  return (
    <Paper elevation={0} sx={{ 
      height: '100%', 
      p: isMobile ? 1 : 1.5, 
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      backgroundColor: 'background.paper',
      boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
    }}>
      <Box sx={{ 
        mb: 1.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'text.primary',
            fontWeight: 600,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          Documents
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Refresh" arrow>
            <IconButton
              size="small"
              onClick={loadFileTree}
              disabled={loading}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Refresh sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          {isBackendAvailable && (
            <>
              <Tooltip title="Create folder" arrow>
                <IconButton
                  size="small"
                  onClick={() => setCreateFolderDialog(true)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <CreateNewFolder sx={{ fontSize: '18px' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload file" arrow>
                <IconButton
                  size="small"
                  onClick={() => setShowUpload(!showUpload)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    color: showUpload ? 'primary.main' : 'inherit',
                  }}
                >
                  {showUpload ? <ExpandLess sx={{ fontSize: '18px' }} /> : <CloudUpload sx={{ fontSize: '18px' }} />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
      
      {isBackendAvailable && (
        <Collapse in={showUpload}>
          <Box sx={{ mb: 2 }}>
            <FileUpload 
              onUploadSuccess={handleUploadSuccess}
              onClose={() => setShowUpload(false)}
              targetFolder={selectedFolder}
            />
          </Box>
        </Collapse>
      )}
      <SimpleTreeView
        slots={{
          collapseIcon: ExpandMore,
          expandIcon: ChevronRight,
        }}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          '& .MuiTreeItem-root': {
            '& .MuiTreeItem-content': {
              paddingLeft: 0.5,
              paddingY: 0.25,
              minHeight: '32px',
            }
          }
        }}
      >
        {renderTree(fileTree)}
      </SimpleTreeView>
      
      <DeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, file: null })}
        onConfirm={handleDeleteConfirm}
        onMoveSuccess={loadFileTree}
        fileName={deleteDialog.file?.name || ''}
        filePath={deleteDialog.file?.path || ''}
        isDirectory={deleteDialog.file?.isDirectory || false}
      />
      
      <CreateFolderDialog
        open={createFolderDialog}
        onClose={() => setCreateFolderDialog(false)}
        onConfirm={handleCreateFolder}
        parentFolder={selectedFolder}
      />
    </Paper>
  );
};

export default FileTree;