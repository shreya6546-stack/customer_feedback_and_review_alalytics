/**
 * Static Asset File Server Middleware
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv; charset=utf-8'
};

function serveStatic(req, res, pathname) {
  let cleanPath = pathname || (req && req.url ? req.url.split('?')[0] : '/');
  // Route aliases
  if (cleanPath === '/' || cleanPath === '') {
    cleanPath = '/index.html';
  } else if (cleanPath === '/welcome') {
    cleanPath = '/welcome.html';
  } else if (cleanPath === '/dashboard') {
    cleanPath = '/dashboard.html';
  } else if (cleanPath === '/login') {
    cleanPath = '/login.html';
  } else if (cleanPath === '/signup') {
    cleanPath = '/signup.html';
  } else if (cleanPath === '/signup/customer') {
    cleanPath = '/signup-customer.html';
  } else if (cleanPath === '/signup/company') {
    cleanPath = '/signup-company.html';
  } else if (cleanPath === '/customer') {
    cleanPath = '/customer.html';
  }

  // Prevent directory traversal
  const safePath = path.normalize(decodeURIComponent(cleanPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return true;
  }

  // Check if file exists in root or public folder
  let targetPath = filePath;
  if (!fs.existsSync(targetPath)) {
    const publicPath = path.join(ROOT_DIR, 'public', safePath);
    if (fs.existsSync(publicPath)) {
      targetPath = publicPath;
    } else if (fs.existsSync(targetPath + '.html')) {
      targetPath = targetPath + '.html';
    } else if (fs.existsSync(publicPath + '.html')) {
      targetPath = publicPath + '.html';
    } else {
      return false;
    }
  }

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const indexPath = path.join(targetPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return serveFile(res, indexPath);
    }
    return false;
  }

  return serveFile(res, targetPath);
}

function serveFile(res, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
    return true;
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
    return true;
  }
}

module.exports = {
  serveStatic
};
