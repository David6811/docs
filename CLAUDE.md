# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript application with Material-UI 3 that provides a file browser and viewer for the docs directory. The application consists of:

- **Frontend**: React TypeScript app with Material-UI components
- **Backend**: Node.js Express server for file system access
- **File Tree**: Left sidebar showing directory structure
- **File Viewer**: Right panel displaying file contents

## Common Development Commands

### Development
```bash
# Start both backend server (port 3001) and React app (port 3000)
npm run dev

# Start only the React development server
npm start

# Start only the backend server
npm run server

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure
```
file-viewer/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── FileTree.tsx   # Left sidebar tree component
│   │   └── FileViewer.tsx # Right panel file display
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and API calls
│   └── App.tsx           # Main application component
├── server.js             # Express backend server
└── package.json          # Dependencies and scripts
```

## Architecture Notes

### Backend API Endpoints
- `GET /api/files` - Returns file tree structure from docs directory
- `GET /api/file-content?filepath=<path>` - Serves file content or files directly

### Security Features
- Path traversal protection in backend
- Files served only from designated docs directory
- CORS enabled for local development

### Supported File Types
- **HTML**: Rendered in iframe
- **Images**: PNG, JPG, GIF, WebP, SVG displayed directly
- **PDF**: Displayed in iframe
- **Text files**: MD, TXT, JS, TS, JSON, CSS shown as plain text

### Key Dependencies
- `@mui/material` - Material-UI components
- `@mui/x-tree-view` - Tree view component
- `express` - Backend server
- `cors` - Cross-origin resource sharing
- `concurrently` - Run multiple commands simultaneously

## Development Notes

The application requires both the backend server and React frontend to run simultaneously. The backend scans the `/Users/weixu/docs` directory and provides file access through a REST API, while the frontend provides the user interface for browsing and viewing files.