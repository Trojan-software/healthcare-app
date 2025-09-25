# HTTPS Security Deployment Checklist for 247tech.net

## Pre-Deployment Server Security ✅

### Express Server Configuration
- [x] Security headers middleware added to server/index.ts
- [x] HTTPS redirect enforcement in production
- [x] HSTS headers configured (without preload for safety)
- [x] Content Security Policy implemented
- [x] X-Frame-Options and other security headers set
- [x] Trust proxy configuration enabled

### PWA Configuration
- [x] manifest.json uses relative URLs for portability
- [x] Service worker caches only static assets securely
- [x] HTTPS enforcement in app.html redirect
- [x] No mixed content in PWA files

## SSL Certificate Setup Required

### Domain Verification
- [ ] Verify ownership of 247tech.net
- [ ] Check DNS configuration points to your server
- [ ] Ensure www.247tech.net also resolves if needed

### Certificate Installation (Choose One)

#### Option A: Let's Encrypt (Recommended - Free)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 247tech.net -d www.247tech.net
```

#### Option B: Commercial SSL Certificate
- [ ] Purchase SSL certificate from trusted provider
- [ ] Generate CSR and install certificate files
- [ ] Configure web server with certificate paths

### Web Server Configuration (Choose Your Server)

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name 247tech.net www.247tech.net;
    
    ssl_certificate /etc/letsencrypt/live/247tech.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/247tech.net/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache Configuration  
```apache
<VirtualHost *:443>
    ServerName 247tech.net
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/247tech.net/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/247tech.net/privkey.pem
    
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```

## Application Deployment

### Environment Configuration
- [ ] Copy production.env.example to .env
- [ ] Set NODE_ENV=production
- [ ] Set PUBLIC_BASE_URL=https://247tech.net
- [ ] Configure secure database connection string
- [ ] Set strong SESSION_SECRET

### Application Start
```bash
NODE_ENV=production npm start
```

## Post-Deployment Testing

### SSL Validation
- [ ] Visit https://247tech.net - should load without warnings
- [ ] Check certificate details in browser (click lock icon)
- [ ] Test http://247tech.net - should redirect to HTTPS
- [ ] Verify SSL Labs grade A/A+: https://www.ssllabs.com/ssltest/

### PWA Testing
- [ ] Manifest.json loads at https://247tech.net/manifest.json
- [ ] Service worker registers without errors
- [ ] Install prompt appears on mobile Chrome
- [ ] "Add to Home Screen" works on iPhone Safari
- [ ] App works offline after first load

### Security Headers
- [ ] Check security headers: https://securityheaders.com/
- [ ] Verify HSTS header present
- [ ] Confirm CSP policy active
- [ ] Test all security headers configured

### Application Functionality
- [ ] All pages load over HTTPS
- [ ] API endpoints work correctly
- [ ] WebSocket connections use WSS if applicable
- [ ] No mixed content warnings in browser console

## Monitoring Setup

### Certificate Expiry
- [ ] Set up certificate renewal (Let's Encrypt auto-renews)
- [ ] Configure monitoring for certificate expiry alerts

### Health Checks
- [ ] Monitor HTTPS availability
- [ ] Set up SSL certificate monitoring
- [ ] Configure uptime monitoring

## Troubleshooting

### Common Issues

**Certificate Not Trusted**
- Verify certificate chain is complete
- Check intermediate certificates installed
- Test with multiple browsers

**Mixed Content Warnings**
- Update all HTTP URLs to HTTPS in code
- Check manifest.json and service worker URLs
- Verify API endpoints use HTTPS

**HSTS Issues**
- Start without preload flag initially
- Test thoroughly before adding preload
- Clear browser HSTS if needed for testing

**PWA Installation Problems**
- Verify all PWA requirements met over HTTPS
- Check service worker registration
- Ensure manifest.json is valid and accessible

## Success Criteria

✅ **SSL Certificate Valid**: No browser security warnings
✅ **Perfect Security Score**: SSL Labs A+ rating  
✅ **PWA Functional**: Installs on all devices
✅ **Headers Configured**: All security headers present
✅ **Redirects Working**: HTTP automatically redirects to HTTPS
✅ **Monitoring Active**: Certificate expiry and uptime monitoring

Once all items are checked, your 247tech.net website will be fully secured with HTTPS and ready for production use.