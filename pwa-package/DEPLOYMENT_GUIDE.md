# 24/7 Tele H Health Monitor - Deployment Guide

## Quick Deployment Steps

### 1. Upload Files to Web Server
Upload all files from this package to your web server:
```
your-domain.com/
├── index.html          (Landing/Install page)
├── app.html           (App redirect page)
├── manifest.json      (PWA configuration)
├── sw.js             (Service worker)
├── icons/            (App icons folder)
└── INSTALLATION_GUIDE.md
```

### 2. Configure Your Domain
**Important**: Update these files with your actual domain:

**In manifest.json:**
```json
{
  "start_url": "https://your-domain.com/",
  "scope": "https://your-domain.com/"
}
```

**In app.html:**
Update the redirect URL to point to your actual app:
```javascript
const targetUrl = 'https://your-domain.com/mobile-dashboard';
```

### 3. SSL Certificate Required
PWAs require HTTPS. Ensure your web server has:
- Valid SSL certificate
- HTTPS redirect from HTTP
- Proper security headers

### 4. Test PWA Installation
After deployment, test on different devices:
- **Android Chrome**: Look for install prompt
- **iPhone Safari**: Test "Add to Home Screen"
- **Desktop**: Verify install icon appears

### 5. Backend Integration
This package provides the PWA shell. Connect it to your backend:
- Update API endpoints in the actual app
- Configure authentication services
- Set up database connections
- Configure HC03 device integration

## Server Configuration

### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<Files "manifest.json">
    Header set Content-Type "application/manifest+json"
</Files>

<Files "sw.js">
    Header set Content-Type "application/javascript"
    Header set Cache-Control "no-cache"
</Files>
```

### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location /manifest.json {
        add_header Content-Type application/manifest+json;
    }
    
    location /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control no-cache;
    }
}
```

## Customization Options

### Replace Icons
Replace SVG icons in `/icons/` folder with PNG versions:
- Use your company logo
- Maintain square aspect ratio
- Provide all required sizes (16x16 to 512x512)

### Update Branding
Modify `index.html` to match your branding:
- Company colors
- Logo placement
- App description
- Contact information

### Configure Features
Update `manifest.json` for your app:
- App name and description
- Theme colors
- Display options
- Orientation preferences

## Security Checklist

- [ ] HTTPS certificate installed and valid
- [ ] HTTP to HTTPS redirect configured
- [ ] Service worker serves over HTTPS
- [ ] Manifest.json accessible via HTTPS
- [ ] All icon files serve with correct MIME types
- [ ] CSP headers configured for security
- [ ] CORS settings configured for API endpoints

## Testing Checklist

- [ ] PWA installs successfully on Android Chrome
- [ ] PWA installs successfully on iPhone Safari
- [ ] PWA installs successfully on desktop browsers
- [ ] App icons display correctly on all devices
- [ ] Service worker registers without errors
- [ ] App works offline (cached resources)
- [ ] App redirects properly to main application
- [ ] All PWA features function as expected

## Troubleshooting

### Install Prompt Not Showing
- Verify HTTPS is working
- Check manifest.json is valid JSON
- Ensure service worker registers successfully
- Confirm app meets PWA requirements

### Icons Not Displaying
- Verify icon files are accessible via HTTPS
- Check file permissions (644 for files, 755 for directories)
- Ensure correct MIME types are served
- Clear browser cache and test again

### Service Worker Errors
- Check browser console for errors
- Verify sw.js is accessible and valid
- Ensure proper Content-Type headers
- Test service worker registration manually

## Production Deployment

1. **Staging Environment**: Test full deployment on staging server
2. **Performance**: Optimize images and assets for mobile
3. **Analytics**: Add tracking for PWA installation rates
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Backup**: Ensure regular backups of app data
6. **Updates**: Plan for seamless app updates via service worker

---
**Deployment Support**: Contact your technical team for server configuration assistance.