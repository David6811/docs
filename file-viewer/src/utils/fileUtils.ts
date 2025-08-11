import { FileNode, FileType } from '../types';

export const getFileType = (filename: string): FileType => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'html':
    case 'htm':
      return 'html';
    case 'pdf':
      return 'pdf';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'image';
    case 'txt':
    case 'md':
    case 'js':
    case 'ts':
    case 'json':
    case 'css':
      return 'text';
    default:
      return 'unknown';
  }
};

export const buildFileTree = async (basePath: string): Promise<FileNode[]> => {
  try {
    const response = await fetch('http://localhost:3001/api/files');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching file tree:', error);
    // Fallback to mock data if API is not available
    return [
      {
        name: 'ANDROID_LIFECYCLE.html',
        path: 'ANDROID_LIFECYCLE.html',
        isDirectory: false
      }
    ];
  }
};

export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    const response = await fetch(`http://localhost:3001/api/file-content?filepath=${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if response is JSON or direct file
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data.content;
    } else {
      return await response.text();
    }
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
};