import express from 'express';
import { app } from './index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

async function startDevServer() {
  console.log('[DevServer] Serving production build from dist/');
  
  // Disable caching to ensure fresh content during development
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
  
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.includes('.')) {
      return res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
    next();
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dev server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/jobs`);
    console.log(`🎯 Serving production build`);
  });
}

startDevServer().catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
