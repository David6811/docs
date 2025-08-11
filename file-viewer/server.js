const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Base path for docs directory
const DOCS_PATH = '/Users/weixu/docs';

// Recursively scan directory and build file tree
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files and git directory  
      if (entry.name.startsWith('.')) continue;
      
      // Skip file-viewer directory and CLAUDE.md only in file tree listing
      if ((entry.name === 'file-viewer' || entry.name === 'CLAUDE.md') && relativePath === '') continue;
      
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

app.listen(PORT, () => {
  console.log(`File server running on http://localhost:${PORT}`);
});

module.exports = app;