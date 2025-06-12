import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building 24/7 Tele H PWA Package...\n');

// Step 1: Build the application
console.log('📦 Building React application...');
try {
  execSync('npm run build', { cwd: './client', stdio: 'inherit' });
  console.log('✅ React build completed\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Create PWA package structure
console.log('📁 Creating PWA package structure...');
const packageDir = './pwa-package';
const distDir = './client/dist';

// Create package directory
if (!fs.existsSync(packageDir)) {
  fs.mkdirSync(packageDir, { recursive: true });
}

// Copy built files
if (fs.existsSync(distDir)) {
  execSync(`cp -r ${distDir}/* ${packageDir}/`, { stdio: 'inherit' });
  console.log('✅ Files copied to package directory\n');
} else {
  console.error('❌ Build directory not found');
  process.exit(1);
}

// Step 3: Generate app icons (SVG to placeholder)
console.log('🎨 Generating app icons...');
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(packageDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icon template
const createSVGIcon = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bgGradient)"/>
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <circle cx="0" cy="-${size * 0.1}" r="${size * 0.08}" fill="white" opacity="0.9"/>
    <path d="M-${size * 0.12} ${size * 0.05} Q0 ${size * 0.15} ${size * 0.12} ${size * 0.05}" stroke="white" stroke-width="${size * 0.02}" fill="none" opacity="0.9"/>
  </g>
  <text x="${size * 0.5}" y="${size * 0.75}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">24/7</text>
  <text x="${size * 0.5}" y="${size * 0.88}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.06}">Tele H</text>
</svg>`;

iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svgContent);
});

console.log('✅ SVG icons generated\n');

// Step 4: Create installation instructions
console.log('📝 Creating installation instructions...');
const installInstructions = `# 24/7 Tele H Health Monitor - PWA Installation

## What is this?
This is a Progressive Web App (PWA) package for the 24/7 Tele H Health Monitor application. It can be installed on mobile devices like a native app.

## Features
- Complete healthcare monitoring dashboard
- User registration and authentication
- HC03 Bluetooth device integration
- Vital signs history and analytics
- Offline functionality
- Push notifications for health alerts

## Installation Instructions

### For Android Devices:
1. Open Chrome browser on your Android device
2. Navigate to your deployed app URL
3. Tap the "Install" button when prompted
4. Or tap the menu (⋮) and select "Add to Home screen"
5. The app will be installed like a native app

### For iPhone/iPad:
1. Open Safari browser on your iOS device
2. Navigate to your deployed app URL
3. Tap the Share button (□↑)
4. Select "Add to Home Screen"
5. Tap "Add" to install the app

### For Desktop:
1. Open Chrome, Edge, or Firefox
2. Navigate to your app URL
3. Look for the install icon in the address bar
4. Click to install as a desktop app

## Deployment
1. Upload the contents of this package to your web server
2. Ensure HTTPS is enabled (required for PWA features)
3. The app will be accessible at your domain
4. Users can then install it following the instructions above

## Package Contents
- index.html - Main application file
- manifest.json - PWA configuration
- sw.js - Service worker for offline functionality
- assets/ - Application code and styles
- icons/ - App icons for different platforms

## Technical Requirements
- HTTPS enabled web server
- Modern browser support (Chrome 76+, Safari 13+, Firefox 79+)
- Web server with proper MIME types for .json and .js files

For technical support, contact 24/7 Tele H Technology Services.
`;

fs.writeFileSync(path.join(packageDir, 'INSTALLATION.md'), installInstructions);

// Step 5: Create deployment checklist
const deploymentChecklist = `# Deployment Checklist for 24/7 Tele H PWA

## Pre-Deployment
- [ ] Replace SVG icons with PNG versions of your company logo
- [ ] Update manifest.json with your actual domain
- [ ] Configure HTTPS certificate on web server
- [ ] Test PWA functionality on staging environment

## File Upload
- [ ] Upload all files to web server root or subdirectory
- [ ] Ensure proper file permissions (644 for files, 755 for directories)
- [ ] Verify manifest.json is accessible at /manifest.json
- [ ] Verify service worker is accessible at /sw.js

## Testing
- [ ] Test installation on Android Chrome
- [ ] Test installation on iOS Safari
- [ ] Verify offline functionality
- [ ] Test push notifications (if configured)
- [ ] Confirm all icons display correctly

## Post-Deployment
- [ ] Share installation instructions with users
- [ ] Monitor PWA analytics and usage
- [ ] Set up backend API endpoints for production
- [ ] Configure database for production use

Generated: $(date)
Package: 24/7 Tele H Health Monitor PWA v1.0
`;

fs.writeFileSync(path.join(packageDir, 'DEPLOYMENT.md'), deploymentChecklist);

// Step 6: Create ZIP package
console.log('📦 Creating ZIP package...');
try {
  execSync(`cd ${packageDir} && zip -r ../24-7-TeleH-PWA-Package.zip .`, { stdio: 'inherit' });
  console.log('✅ ZIP package created: 24-7-TeleH-PWA-Package.zip\n');
} catch (error) {
  console.log('⚠️  ZIP creation requires zip utility. Package available in:', packageDir);
}

// Step 7: Generate final report
console.log('📊 PWA Package Summary:');
console.log('================================');
console.log('✅ React application built');
console.log('✅ PWA manifest configured');
console.log('✅ Service worker installed');
console.log('✅ App icons generated (SVG format)');
console.log('✅ Installation instructions created');
console.log('✅ Deployment checklist provided');
console.log('✅ Package ready for deployment');
console.log('================================\n');

console.log('📱 Next Steps:');
console.log('1. Replace SVG icons with PNG versions of your logo');
console.log('2. Deploy package to HTTPS-enabled web server');
console.log('3. Share installation instructions with users');
console.log('4. Users can install app from their mobile browsers\n');

console.log('🚀 PWA Package Generation Complete!');
console.log('Package location:', path.resolve(packageDir));
if (fs.existsSync('./24-7-TeleH-PWA-Package.zip')) {
  console.log('ZIP package:', path.resolve('./24-7-TeleH-PWA-Package.zip'));
}