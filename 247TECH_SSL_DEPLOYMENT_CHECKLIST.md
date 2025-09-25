# 247tech.net SSL Deployment Checklist & Troubleshooting Guide

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] **Server Security Headers** - Express server configured with HTTPS enforcement
- [ ] **Production Environment** - NODE_ENV=production set in deployment
- [ ] **Environment Variables** - All production variables configured (see production.env.example)
- [ ] **PWA Manifest** - manifest.json uses relative URLs for portability
- [ ] **Service Worker** - sw.js configured for secure caching and HTTPS-only operation
- [ ] **App Redirect** - app.html enforces HTTPS redirects

### ✅ SSL Certificate Setup
- [ ] **Domain Ownership** - Verify control of 247tech.net domain
- [ ] **SSL Certificate** - Valid certificate installed (Let's Encrypt or commercial)
- [ ] **Certificate Chain** - Complete chain including intermediate certificates
- [ ] **Certificate Expiry** - Valid for at least 30 days (monitor expiration)
- [ ] **Subdomain Coverage** - Certificate covers www.247tech.net if needed

### ✅ Web Server Configuration
- [ ] **HTTPS Redirect** - HTTP automatically redirects to HTTPS (301/308)
- [ ] **Security Headers** - HSTS, CSP, X-Content-Type-Options configured
- [ ] **PWA Headers** - Correct MIME types for manifest.json and sw.js
- [ ] **Static Assets** - All /icons/ and static files served over HTTPS
- [ ] **API Endpoints** - All backend APIs accessible via HTTPS only

## Deployment Process

### Step 1: SSL Certificate Installation

**Option A: Let's Encrypt (Recommended)**
```bash
# Install certbot
sudo apt update && sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d 247tech.net -d www.247tech.net

# Verify auto-renewal
sudo certbot renew --dry-run
```

**Option B: Commercial Certificate**
1. Purchase SSL certificate from trusted CA
2. Generate CSR and private key
3. Install certificate files on web server
4. Configure web server with certificate paths

### Step 2: Web Server Configuration

**Nginx Configuration**
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name 247tech.net www.247tech.net;
    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name 247tech.net www.247tech.net;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/247tech.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/247tech.net/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    
    # PWA specific headers
    location /manifest.json {
        add_header Content-Type application/manifest+json;
    }
    
    location /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache";
    }
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 3: Application Deployment

```bash
# Set production environment
export NODE_ENV=production
export PUBLIC_BASE_URL=https://247tech.net

# Install dependencies
npm install --production

# Build application (if required)
npm run build

# Start application
npm start
```

### Step 4: PWA File Deployment

```bash
# Copy PWA files to web server document root
cp pwa-package/manifest.json /var/www/html/
cp pwa-package/sw.js /var/www/html/
cp pwa-package/app.html /var/www/html/
cp -r pwa-package/icons/ /var/www/html/
```

## Post-Deployment Verification

### ✅ SSL Testing
- [ ] **SSL Labs Test** - Visit https://www.ssllabs.com/ssltest/
  - Enter: 247tech.net
  - Target Grade: A or A+
- [ ] **Security Headers** - Check https://securityheaders.com/
  - Enter: https://247tech.net
  - Verify all security headers present
- [ ] **Mixed Content** - No HTTP resources on HTTPS pages
- [ ] **Certificate Chain** - Complete and valid certificate chain

### ✅ PWA Functionality
- [ ] **Manifest Accessible** - https://247tech.net/manifest.json loads correctly
- [ ] **Service Worker** - https://247tech.net/sw.js loads without errors
- [ ] **Install Prompt** - PWA install prompt appears on mobile devices
- [ ] **Offline Mode** - App works offline after initial load
- [ ] **Icons Display** - All PWA icons load correctly

### ✅ Application Testing
- [ ] **Homepage** - https://247tech.net loads without errors
- [ ] **Dashboard** - https://247tech.net/mobile-dashboard accessible
- [ ] **API Endpoints** - All API calls use HTTPS
- [ ] **WebSocket** - WSS connections work properly
- [ ] **Database** - Secure database connections (SSL mode)

## Troubleshooting Common Issues

### Issue: "Not Secure" Warning Still Appears

**Possible Causes & Solutions:**

1. **Invalid/Expired Certificate**
   ```bash
   # Check certificate validity
   openssl s_client -connect 247tech.net:443 -servername 247tech.net
   ```
   - **Solution**: Renew or reinstall SSL certificate

2. **Mixed Content (HTTP resources on HTTPS page)**
   - **Check**: Browser DevTools > Security tab
   - **Solution**: Update all HTTP URLs to HTTPS in code

3. **Incomplete Certificate Chain**
   ```bash
   # Verify certificate chain
   curl -I https://247tech.net
   ```
   - **Solution**: Install intermediate certificates

4. **Incorrect Domain**
   - **Check**: Certificate covers exact domain being accessed
   - **Solution**: Ensure certificate includes www.247tech.net if needed

### Issue: PWA Install Prompt Not Showing

**Troubleshooting Steps:**

1. **Verify HTTPS**: PWAs require HTTPS to install
2. **Check Manifest**: Ensure manifest.json is valid JSON and accessible
3. **Service Worker**: Verify sw.js registers without errors
4. **Browser Console**: Check for PWA-related errors

### Issue: Service Worker Errors

**Common Fixes:**

1. **Update Cache Version**: Change CACHE_NAME in sw.js
2. **Clear Browser Cache**: Force refresh (Ctrl+Shift+R)
3. **Check File Paths**: Ensure all cached files exist and are accessible

### Issue: Security Headers Missing

**Verification:**
```bash
curl -I https://247tech.net | grep -i security
```

**Expected Headers:**
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy

### Issue: Database Connection Errors

**SSL Database Configuration:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## Monitoring & Maintenance

### SSL Certificate Monitoring

**Set up monitoring for:**
- Certificate expiration (30-day warning)
- SSL Labs grade changes
- Mixed content detection
- PWA functionality

**Automated Certificate Renewal:**
```bash
# Add to crontab for Let's Encrypt
0 12 * * * /usr/bin/certbot renew --quiet
```

### Performance Monitoring

**Key Metrics:**
- Page load times over HTTPS
- PWA installation rates
- Service worker performance
- API response times

### Security Monitoring

**Regular Checks:**
- SSL Labs monthly scans
- Security headers verification
- Dependency security updates
- Access log monitoring

## Emergency Procedures

### SSL Certificate Expiry

1. **Immediate**: Get new certificate from Let's Encrypt or CA
2. **Install**: Update web server configuration
3. **Test**: Verify certificate installation
4. **Monitor**: Confirm site shows as secure

### Security Breach

1. **Immediate**: Review access logs for suspicious activity
2. **Update**: Change all passwords and API keys
3. **Patch**: Update all dependencies and system packages
4. **Monitor**: Implement additional security monitoring

## Support Contacts

**Technical Issues:**
- Web hosting provider support
- Domain registrar support
- SSL certificate provider support

**Healthcare Compliance:**
- HIPAA compliance officer
- Security audit team
- Legal compliance team

## Quick Reference Commands

```bash
# Test SSL certificate
openssl s_client -connect 247tech.net:443 -servername 247tech.net

# Check HTTP to HTTPS redirect
curl -I http://247tech.net

# Verify security headers
curl -I https://247tech.net

# Test PWA manifest
curl https://247tech.net/manifest.json

# Check service worker
curl https://247tech.net/sw.js

# Monitor certificate expiry
echo | openssl s_client -servername 247tech.net -connect 247tech.net:443 2>/dev/null | openssl x509 -noout -dates
```

---

**Last Updated**: $(date)
**For Support**: Contact your technical team or hosting provider with this checklist.

## Success Criteria

✅ **SSL Labs Grade A/A+**
✅ **No "Not Secure" warnings**
✅ **PWA installs successfully**
✅ **All security headers present**
✅ **Healthcare data transmitted securely**
✅ **HIPAA compliance maintained**