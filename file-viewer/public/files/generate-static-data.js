const fs = require('fs');
const path = require('path');

// Base path for docs directory - use current working directory in GitHub Actions
const DOCS_PATH = process.env.GITHUB_ACTIONS ? process.cwd() : '/Users/weixu/docs';
// When script runs from file-viewer dir, use ./public, otherwise ./file-viewer/public
const OUTPUT_PATH = process.cwd().endsWith('file-viewer') ? './public/api' : './file-viewer/public/api';

// Recursively scan directory and build file tree
async function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files, git directory, file-viewer directory and CLAUDE.md
      if (entry.name.startsWith('.') || 
          (entry.name === 'file-viewer' && relativePath === '') ||
          (entry.name === 'CLAUDE.md' && relativePath === '')) continue;
      
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

// Copy files to public directory
async function copyFiles(items, basePath = '') {
  const filesDir = process.cwd().endsWith('file-viewer') ? './public/files' : './file-viewer/public/files';
  for (const item of items) {
    const sourcePath = path.join(DOCS_PATH, item.path);
    const targetPath = path.join(filesDir, item.path);
    
    if (item.isDirectory && item.children) {
      // Create directory
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await copyFiles(item.children, item.path);
    } else {
      // Copy file
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      try {
        await fs.promises.copyFile(sourcePath, targetPath);
        console.log(`Copied: ${item.path}`);
      } catch (error) {
        console.error(`Error copying ${item.path}:`, error);
      }
    }
  }
}

async function generateStaticData() {
  try {
    const filesDir = process.cwd().endsWith('file-viewer') ? './public/files' : './file-viewer/public/files';
    
    // Create output directories
    await fs.promises.mkdir(OUTPUT_PATH, { recursive: true });
    await fs.promises.mkdir(filesDir, { recursive: true });
    
    // Generate file tree
    const fileTree = await scanDirectory(DOCS_PATH);
    
    // Write files.json
    await fs.promises.writeFile(
      path.join(OUTPUT_PATH, 'files.json'),
      JSON.stringify(fileTree, null, 2)
    );
    
    // Copy all files to public directory
    await copyFiles(fileTree);
    
    console.log('Static data generated successfully!');
  } catch (error) {
    console.error('Error generating static data:', error);
  }
}

generateStaticData();