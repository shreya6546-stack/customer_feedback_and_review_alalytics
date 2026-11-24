/**
 * FeedbackPro Static Asset Build & Sync Script
 * Prepares the public/ directory for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy static folders
const folders = ['css', 'js', 'assets', 'data'];
for (const folder of folders) {
  const src = path.join(rootDir, folder);
  const dst = path.join(publicDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dst, { recursive: true, force: true });
  }
}

// Copy static pages
const files = [
  'welcome.html',
  'index.html',
  'dashboard.html',
  'login.html',
  'signup.html',
  'signup-customer.html',
  'signup-company.html',
  'customer.html',
  'customer-portal.html',
  'feedback.html',
  '404.html'
];
for (const file of files) {
  const src = path.join(rootDir, file);
  const dst = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
}

console.log('Build complete: Static assets synchronized to public directory.');
