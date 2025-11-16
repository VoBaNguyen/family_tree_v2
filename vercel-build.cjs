const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Function to copy file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Copy necessary files and directories for deployment
try {
  // Copy main index.html
  copyFile('index.html', path.join(distDir, 'index.html'));
  
  // Copy trees directory
  copyDirectory('trees', path.join(distDir, 'trees'));
  
  // Copy js directory
  copyDirectory('js', path.join(distDir, 'js'));
  
  // Copy src directory (for CSS and other assets)
  copyDirectory('src', path.join(distDir, 'src'));
  
  // Copy backend data (for static JSON files)
  copyDirectory('backend/data', path.join(distDir, 'backend/data'));
  copyDirectory('backend/images', path.join(distDir, 'backend/images'));
  
  console.log('✅ Build completed successfully for Vercel deployment');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
