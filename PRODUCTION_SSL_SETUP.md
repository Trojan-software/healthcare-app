# SSL/TLS Setup Guide for 247tech.net Production Deployment

## Overview
This guide provides step-by-step instructions to resolve SSL security issues and configure proper HTTPS for your healthcare PWA at 247tech.net.

## Prerequisites
- Domain ownership of 247tech.net
- Web server access (Apache/Nginx/CDN)
- Node.js application deployed

## SSL Certificate Setup

### Option 1: Let's Encrypt (Free SSL Certificate)

1. **Install Certbot**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

2. **Obtain SSL Certificate**
```bash
# For Nginx
sudo certbot --nginx -d 247tech.net -d www.247tech.net

# For Apache
sudo certbot --apache -d 247tech.net -d www.247tech.net
```

3. **Auto-renewal Setup**
```bash
sudo crontab -e
# Add this line for auto-renewal:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Commercial SSL Certificate

1. **Purchase SSL certificate** from providers like:
   - DigiCert
   - Sectigo
   - GoDaddy
   - Namecheap

2. **Generate Certificate Signing Request (CSR)**
```bash
openssl req -new -newkey rsa:2048 -nodes -keyout 247tech.net.key -out 247tech.net.csr
```

3. **Install certificate files** on your web server (refer to provider documentation)

## Web Server Configuration

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/247tech.net
server {
    listen 80;
    server_name 247tech.net www.247tech.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 247tech.net www.247tech.net;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/247tech.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/247tech.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # PWA specific headers
    location /manifest.json {
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=3600";
    }

    location /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache";
    }

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache Configuration
```apache
# /etc/apache2/sites-available/247tech.net.conf
<VirtualHost *:80>
    ServerName 247tech.net
    ServerAlias www.247tech.net
    Redirect permanent / https://247tech.net/
</VirtualHost>

<VirtualHost *:443>
    ServerName 247tech.net
    ServerAlias www.247tech.net

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/247tech.net/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/247tech.net/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/247tech.net/chain.pem

    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Proxy to Node.js application
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # WebSocket support
    ProxyPass /ws/ ws://localhost:5000/ws/
    ProxyPassReverse /ws/ ws://localhost:5000/ws/
</VirtualHost>
```

## Application Configuration

### Environment Variables
Copy `production.env.example` to `.env` and configure:

```bash
NODE_ENV=production
PUBLIC_BASE_URL=https://247tech.net
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=your-secure-session-secret
SESSION_SECURE_COOKIES=true
ALLOWED_ORIGINS=https://247tech.net,https://www.247tech.net
```

### Start Application in Production
```bash
npm install --production
npm run build  # if you have a build step
NODE_ENV=production npm start
```

## CDN/Load Balancer Setup (Alternative)

### Cloudflare Setup
1. **Add your domain** to Cloudflare
2. **Set SSL/TLS mode** to "Full (strict)"
3. **Enable security features**:
   - Always Use HTTPS: ON
   - HTTP Strict Transport Security (HSTS): Enable
   - Automatic HTTPS Rewrites: ON
4. **Configure Page Rules** for PWA caching

### AWS CloudFront + Certificate Manager
1. **Request SSL certificate** via AWS Certificate Manager
2. **Create CloudFront distribution** with HTTPS redirect
3. **Configure origin** to point to your EC2/ELB
4. **Set security headers** via CloudFront functions

## SSL Testing and Validation

### Online SSL Checkers
1. **SSL Labs Test**: https://www.ssllabs.com/ssltest/
   - Enter: 247tech.net
   - Target grade: A or A+

2. **Security Headers Test**: https://securityheaders.com/
   - Enter: https://247tech.net
   - Check for all security headers

3. **PWA Test**: https://web.dev/measure/
   - Verify PWA requirements are met
   - Check HTTPS compliance

### Command Line Testing
```bash
# Check certificate validity
openssl s_client -connect 247tech.net:443 -servername 247tech.net

# Check certificate chain
curl -I https://247tech.net

# Test HSTS header
curl -I https://247tech.net | grep -i strict-transport-security
```

## Troubleshooting Common Issues

### Certificate Not Trusted
- **Problem**: Self-signed or expired certificate
- **Solution**: Install valid SSL certificate from trusted CA

### Mixed Content Warnings
- **Problem**: HTTP resources on HTTPS page
- **Solution**: Update all URLs to HTTPS in manifest.json, service worker, and app code

### HSTS Preload Issues
- **Problem**: HSTS preload causing access issues
- **Solution**: Initially deploy without preload, add after testing

### Certificate Chain Issues
- **Problem**: Incomplete certificate chain
- **Solution**: Install intermediate certificates

### CSP Violations
- **Problem**: Content Security Policy blocking resources
- **Solution**: Update CSP directives to allow necessary resources

## Post-Deployment Checklist

- [ ] SSL certificate is valid and trusted
- [ ] HTTPS redirect is working (HTTP → HTTPS)
- [ ] Security headers are present
- [ ] PWA installs correctly on all devices
- [ ] Service worker loads over HTTPS
- [ ] Manifest.json is accessible via HTTPS
- [ ] No mixed content warnings
- [ ] SSL Labs grade A or A+
- [ ] All API endpoints use HTTPS
- [ ] Database connections use SSL
- [ ] Session cookies are secure
- [ ] WebSocket connections use WSS

## Monitoring and Maintenance

### Certificate Expiry Monitoring
```bash
# Check certificate expiry
echo | openssl s_client -servername 247tech.net -connect 247tech.net:443 2>/dev/null | openssl x509 -noout -dates
```

### Automated Health Checks
Set up monitoring for:
- SSL certificate expiry (30 days before)
- HTTPS availability
- Security headers presence
- PWA functionality

### Log Monitoring
Monitor for SSL-related errors in:
- Web server logs
- Application logs
- CDN logs (if using CDN)

## Support Resources

- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/
- **Mozilla SSL Configuration Generator**: https://ssl-config.mozilla.org/
- **OWASP Transport Layer Protection**: https://owasp.org/www-project-cheat-sheets/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html
- **PWA Requirements**: https://web.dev/pwa-checklist/

For immediate assistance with 247tech.net SSL issues, contact your hosting provider or system administrator with this guide.