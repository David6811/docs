const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Configure multer for file uploads - temporarily store in docs root
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCS_PATH);
  },
  filename: function (req, file, cb) {
    // Use a temporary filename to avoid conflicts
    cb(null, 'temp_' + Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow only PDF, HTML, and image files
    const allowedTypes = /\.(pdf|html?|jpe?g|png|gif|webp|svg)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, HTML, and image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Base path for docs directory
const DOCS_PATH = '/Users/weixu/docs';

// Ensure the docs directory exists
fs.mkdir(DOCS_PATH, { recursive: true }).catch(err => {
  if (err.code !== 'EEXIST') {
    console.error('Error creating docs directory:', err);
  }
});

// Recursively scan directory and build file tree
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files and git directory  
      if (entry.name.startsWith('.')) continue;
      
      // Skip file-viewer directory, CLAUDE.md, and generate-static-data.js only in file tree listing
      if ((entry.name === 'file-viewer' || entry.name === 'CLAUDE.md' || entry.name === 'generate-static-data.js') && relativePath === '') continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const relativeFullPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, relativeFullPath);
        items.push({
          name: entry.name,
          path: relativeFullPath,
          isDirectory: true,
          children: children
        });
      } else {
        items.push({
          name: entry.name,
          path: relativeFullPath,
          isDirectory: false
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return items;
}

// API endpoint to get file tree
app.get('/api/files', async (req, res) => {
  try {
    const fileTree = await scanDirectory(DOCS_PATH);
    res.json(fileTree);
  } catch (error) {
    console.error('Error getting file tree:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
});

// API endpoint to get file content
app.get('/api/file-content', async (req, res) => {
  const { filepath } = req.query;
  
  if (!filepath) {
    return res.status(400).json({ error: 'filepath parameter is required' });
  }
  
  try {
    const fullPath = path.join(DOCS_PATH, filepath);
    
    // Security check: ensure the file is within the docs directory
    if (!fullPath.startsWith(DOCS_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }
    
    // For HTML files, send the file directly to render in iframe
    if (filepath.toLowerCase().endsWith('.html') || filepath.toLowerCase().endsWith('.htm')) {
      res.sendFile(fullPath);
    }
    // For text files
    else if (filepath.match(/\.(txt|md|js|ts|json|css)$/i)) {
      const content = await fs.readFile(fullPath, 'utf8');
      res.json({ content, type: 'text' });
    }
    // For images and PDFs, send the file directly
    else if (filepath.match(/\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i)) {
      res.sendFile(fullPath);
    }
    else {
      res.status(415).json({ error: 'Unsupported file type' });
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API endpoint to upload files
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const originalFilename = req.file.originalname;
    const tempFilePath = req.file.path;
    let targetPath = DOCS_PATH;
    let finalPath;
    
    // If targetFolder is specified, use it
    if (req.body.targetFolder && req.body.targetFolder.trim() !== '') {
      const relativePath = req.body.targetFolder.replace(/^\/+/, ''); // Remove leading slashes
      targetPath = path.join(DOCS_PATH, relativePath);
      
      // Security check: ensure the target path is within docs directory
      if (!targetPath.startsWith(DOCS_PATH)) {
        // Clean up temporary file
        await fs.unlink(tempFilePath);
        return res.status(403).json({ error: 'Invalid target folder' });
      }
      
      // Create directory if it doesn't exist
      await fs.mkdir(targetPath, { recursive: true });
      finalPath = path.join(targetPath, originalFilename);
    } else {
      finalPath = path.join(DOCS_PATH, originalFilename);
    }
    
    // Check if file already exists
    try {
      await fs.access(finalPath);
      // File exists, clean up temp file and return error
      await fs.unlink(tempFilePath);
      return res.status(409).json({ error: 'File already exists' });
    } catch (err) {
      // File doesn't exist, proceed with move
    }
    
    // Move the file from temp location to final location
    await fs.rename(tempFilePath, finalPath);
    
    // Calculate the relative path from docs directory for response
    const relativePath = path.relative(DOCS_PATH, finalPath);
    
    res.json({ 
      message: 'File uploaded successfully',
      filename: originalFilename,
      path: relativePath.replace(/\\/g, '/') // Normalize path separators
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Try to clean up temp file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// API endpoint to delete files with password protection
app.delete('/api/delete', async (req, res) => {
  const { filepath, password } = req.body;
  
  if (!filepath) {
    return res.status(400).json({ error: 'filepath parameter is required' });
  }
  
  if (password !== 'xuwei6811') {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  try {
    const fullPath = path.join(DOCS_PATH, filepath);
    
    // Security check: ensure the file is within the docs directory
    if (!fullPath.startsWith(DOCS_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if path exists
    const stats = await fs.stat(fullPath);
    
    if (stats.isFile()) {
      // Delete the file
      await fs.unlink(fullPath);
      res.json({ message: 'File deleted successfully' });
    } else if (stats.isDirectory()) {
      // Delete the directory (recursively)
      await fs.rm(fullPath, { recursive: true, force: true });
      res.json({ message: 'Folder deleted successfully' });
    } else {
      return res.status(400).json({ error: 'Path is neither a file nor a directory' });
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File or folder not found' });
    }
    console.error('Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete file or folder' });
  }
});

// API endpoint to create folders
app.post('/api/create-folder', async (req, res) => {
  const { folderPath, parentFolder } = req.body;
  
  if (!folderPath || !folderPath.trim()) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  
  try {
    let targetPath;
    
    if (parentFolder && parentFolder.trim() !== '') {
      // Create folder inside specified parent folder
      const parentPath = path.join(DOCS_PATH, parentFolder);
      
      // Security check: ensure parent path is within docs directory
      if (!parentPath.startsWith(DOCS_PATH)) {
        return res.status(403).json({ error: 'Invalid parent folder' });
      }
      
      targetPath = path.join(parentPath, folderPath.trim());
    } else {
      // Create folder in root docs directory
      targetPath = path.join(DOCS_PATH, folderPath.trim());
    }
    
    // Security check: ensure target path is within docs directory
    if (!targetPath.startsWith(DOCS_PATH)) {
      return res.status(403).json({ error: 'Invalid folder path' });
    }
    
    // Check if folder already exists
    try {
      const stats = await fs.stat(targetPath);
      if (stats.isDirectory()) {
        return res.status(409).json({ error: 'Folder already exists' });
      } else {
        return res.status(409).json({ error: 'A file with this name already exists' });
      }
    } catch (err) {
      // Folder doesn't exist, proceed with creation
    }
    
    // Create the folder
    await fs.mkdir(targetPath, { recursive: true });
    
    // Calculate relative path for response
    const relativePath = path.relative(DOCS_PATH, targetPath);
    
    res.json({ 
      message: 'Folder created successfully',
      folderName: folderPath.trim(),
      path: relativePath.replace(/\\/g, '/') // Normalize path separators
    });
    
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// API endpoint to get folder contents for deletion preview
app.get('/api/folder-contents', async (req, res) => {
  const { folderPath } = req.query;
  
  if (!folderPath) {
    return res.status(400).json({ error: 'folderPath parameter is required' });
  }
  
  try {
    const fullPath = path.join(DOCS_PATH, folderPath);
    
    // Security check: ensure the path is within docs directory
    if (!fullPath.startsWith(DOCS_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if path exists and is a directory
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
    
    // Count files and folders recursively
    const countContents = async (dirPath) => {
      let fileCount = 0;
      let folderCount = 0;
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip hidden files
          if (entry.name.startsWith('.')) continue;
          
          const entryPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            folderCount++;
            const subCounts = await countContents(entryPath);
            fileCount += subCounts.fileCount;
            folderCount += subCounts.folderCount;
          } else {
            fileCount++;
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
      
      return { fileCount, folderCount };
    };
    
    const contents = await countContents(fullPath);
    
    res.json({
      folderName: path.basename(fullPath),
      path: folderPath,
      fileCount: contents.fileCount,
      folderCount: contents.folderCount
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Folder not found' });
    }
    console.error('Error getting folder contents:', error);
    res.status(500).json({ error: 'Failed to get folder contents' });
  }
});

// API endpoint to move folder contents before deletion
app.post('/api/move-folder-contents', async (req, res) => {
  const { sourceFolderPath, destinationFolderPath, password } = req.body;
  
  if (!sourceFolderPath) {
    return res.status(400).json({ error: 'Source folder path is required' });
  }
  
  if (password !== 'xuwei6811') {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  try {
    const sourceFullPath = path.join(DOCS_PATH, sourceFolderPath);
    let destinationFullPath = DOCS_PATH;
    
    // Security check: ensure source path is within docs directory
    if (!sourceFullPath.startsWith(DOCS_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if source exists and is a directory
    const sourceStats = await fs.stat(sourceFullPath);
    if (!sourceStats.isDirectory()) {
      return res.status(400).json({ error: 'Source path is not a directory' });
    }
    
    // Set destination path
    if (destinationFolderPath && destinationFolderPath.trim() !== '') {
      destinationFullPath = path.join(DOCS_PATH, destinationFolderPath);
      
      // Security check: ensure destination path is within docs directory
      if (!destinationFullPath.startsWith(DOCS_PATH)) {
        return res.status(403).json({ error: 'Access denied to destination' });
      }
      
      // Check if destination exists and is a directory
      try {
        const destStats = await fs.stat(destinationFullPath);
        if (!destStats.isDirectory()) {
          return res.status(400).json({ error: 'Destination path is not a directory' });
        }
      } catch (err) {
        return res.status(404).json({ error: 'Destination folder not found' });
      }
    }
    
    // Move all contents from source to destination
    const moveContents = async (srcDir, destDir) => {
      const entries = await fs.readdir(srcDir, { withFileTypes: true });
      let movedCount = 0;
      
      for (const entry of entries) {
        // Skip hidden files
        if (entry.name.startsWith('.')) continue;
        
        const srcItemPath = path.join(srcDir, entry.name);
        let destItemPath = path.join(destDir, entry.name);
        
        // Handle name conflicts by adding a number suffix
        let counter = 1;
        const originalName = entry.name;
        const nameWithoutExt = path.parse(originalName).name;
        const ext = path.parse(originalName).ext;
        
        while (true) {
          try {
            await fs.access(destItemPath);
            // File exists, try with a number suffix
            const newName = ext 
              ? `${nameWithoutExt}_${counter}${ext}`
              : `${originalName}_${counter}`;
            destItemPath = path.join(destDir, newName);
            counter++;
          } catch (err) {
            // File doesn't exist, we can use this path
            break;
          }
        }
        
        // Move the item
        await fs.rename(srcItemPath, destItemPath);
        movedCount++;
      }
      
      return movedCount;
    };
    
    const movedCount = await moveContents(sourceFullPath, destinationFullPath);
    
    // Now delete the empty source folder
    await fs.rmdir(sourceFullPath);
    
    const destinationRelativePath = path.relative(DOCS_PATH, destinationFullPath);
    
    res.json({
      message: 'Folder contents moved and folder deleted successfully',
      movedCount: movedCount,
      destination: destinationRelativePath || '(root)',
    });
    
  } catch (error) {
    console.error('Error moving folder contents:', error);
    res.status(500).json({ error: 'Failed to move folder contents' });
  }
});

// API endpoint to get available folders for move destination
app.get('/api/folders', async (req, res) => {
  try {
    const getFolders = async (dirPath, relativePath = '') => {
      const folders = [];
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip hidden files and git directory
          if (entry.name.startsWith('.')) continue;
          
          // Skip file-viewer directory, CLAUDE.md, and generate-static-data.js
          if ((entry.name === 'file-viewer' || entry.name === 'CLAUDE.md' || entry.name === 'generate-static-data.js') && relativePath === '') continue;
          
          if (entry.isDirectory()) {
            const fullPath = path.join(dirPath, entry.name);
            const relativeFullPath = path.join(relativePath, entry.name);
            
            folders.push({
              name: entry.name,
              path: relativeFullPath,
            });
            
            // Recursively get subfolders
            const subFolders = await getFolders(fullPath, relativeFullPath);
            folders.push(...subFolders);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
      
      return folders;
    };
    
    const folders = await getFolders(DOCS_PATH);
    res.json(folders);
    
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
});

app.listen(PORT, () => {
  console.log(`File server running on http://localhost:${PORT}`);
});

module.exports = app;