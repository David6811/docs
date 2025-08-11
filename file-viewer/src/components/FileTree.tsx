import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
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
} from '@mui/icons-material';
import { FileNode, FileType } from '../types';
import { getFileType, buildFileTree } from '../utils/fileUtils';

interface FileTreeProps {
  onFileSelect: (filePath: string, fileType: FileType) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');

  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const tree = await buildFileTree('/Users/weixu/docs');
        setFileTree(tree);
      } catch (error) {
        console.error('Failed to load file tree:', error);
      }
    };

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
    if (!isDirectory) {
      setSelectedFile(filePath);
      const fileType = getFileType(fileName);
      onFileSelect(filePath, fileType);
    }
  };

  const handleOpenInNewWindow = (event: React.MouseEvent, filePath: string) => {
    event.stopPropagation();
    const url = `http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`;
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const renderTree = (nodes: FileNode[]): React.ReactElement[] => {
    return nodes.map((node) => (
      <TreeItem
        key={node.path}
        itemId={node.path}
        label={
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={1}>
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              {getFileIcon(node.name, node.isDirectory)}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.875rem',
                  fontWeight: selectedFile === node.path ? 600 : 400,
                  color: selectedFile === node.path ? 'primary.main' : 'text.primary',
                }}
              >
                {node.name}
              </Typography>
            </Box>
            {!node.isDirectory && (
              <Tooltip title="Open in new window" arrow>
                <IconButton
                  size="small"
                  onClick={(event) => handleOpenInNewWindow(event, node.path)}
                  sx={{
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'action.hover',
                    },
                    padding: '4px',
                  }}
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        onClick={() => handleFileSelect(node.path, node.name, node.isDirectory)}
        sx={{
          '& .MuiTreeItem-content': {
            backgroundColor: selectedFile === node.path ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
            borderRadius: 1,
            margin: '2px 0',
            '&:hover': {
              backgroundColor: selectedFile === node.path 
                ? 'rgba(25, 118, 210, 0.12)' 
                : 'rgba(0, 0, 0, 0.04)',
            }
          },
          '& .MuiTreeItem-label': {
            padding: '4px 8px',
          }
        }}
      >
        {node.children && renderTree(node.children)}
      </TreeItem>
    ));
  };

  return (
    <Paper elevation={0} sx={{ 
      height: '100%', 
      p: 2, 
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          color: 'text.primary',
          fontWeight: 600,
          fontSize: '1.1rem',
        }}
      >
        📁 Documents
      </Typography>
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
              paddingLeft: 1,
            }
          }
        }}
      >
        {renderTree(fileTree)}
      </SimpleTreeView>
    </Paper>
  );
};

export default FileTree;