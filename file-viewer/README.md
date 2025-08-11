# File Viewer - Docs Explorer

A React TypeScript application with Material-UI 3 design that displays files from the `/Users/weixu/docs` directory in a tree structure with file preview capabilities.

## Features

- **Tree View**: Browse files and directories in a collapsible tree structure on the left sidebar
- **File Preview**: View file contents in the right panel with support for:
  - HTML files (rendered in iframe)
  - Images (PNG, JPG, GIF, WebP, SVG)
  - PDF files (displayed in iframe)
  - Text files (MD, TXT, JS, TS, JSON, CSS)
- **Material-UI 3**: Modern Material Design 3 components and theming
- **TypeScript**: Full type safety throughout the application

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start both the backend server and React app:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - React app on `http://localhost:3000`

## Alternative Commands

- Start only the React app: `npm start`
- Start only the backend server: `npm run server`
- Build for production: `npm run build`