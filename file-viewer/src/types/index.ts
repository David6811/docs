export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export type FileType = 'html' | 'pdf' | 'image' | 'text' | 'unknown';