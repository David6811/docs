import { FileNode } from '../types';

// Since this is running in the browser, we need to create a mock file system
// In a real implementation, you would need a backend API to scan the file system

export const scanDocsDirectory = async (): Promise<FileNode[]> => {
  // For demonstration, we'll create a mock structure
  // In production, you'd need an Express.js backend or Electron app to access the file system
  
  const mockFileTree: FileNode[] = [
    {
      name: 'ANDROID_LIFECYCLE.html',
      path: '/Users/weixu/docs/ANDROID_LIFECYCLE.html',
      isDirectory: false
    },
    {
      name: 'assets',
      path: '/Users/weixu/docs/assets',
      isDirectory: true,
      children: [
        {
          name: 'image1.png',
          path: '/Users/weixu/docs/assets/image1.png',
          isDirectory: false
        },
        {
          name: 'document.pdf',
          path: '/Users/weixu/docs/assets/document.pdf',
          isDirectory: false
        }
      ]
    }
  ];

  return mockFileTree;
};