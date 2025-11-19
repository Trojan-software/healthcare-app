# 📌 Certificate Pinning Implementation Guide
## SSL Certificate Pinning for Android (ADHCC Critical - 9.1)

---

## Overview

Certificate pinning is a **CRITICAL** security control (ADHCC Score: 9.1) that prevents man-in-the-middle attacks by validating your server's SSL certificate against known trusted pins. This guide explains how to implement it for production deployment.

---

## ⚠️ IMPORTANT: When to Generate Pins

**DO NOT generate certificate pins until:**
1. ✅ Your production domain (`247tech.net`) is live with a valid SSL certificate
2. ✅ Your API endpoint (`api.247tech.net`) has SSL certificate installed
3. ✅ Both domains are accessible via HTTPS

**Why?** The pinning script requires active HTTPS connections to fetch and hash certificates. If you generate pins before SSL setup, the build will work but **all network requests will fail** when the app tries to connect.

---

## 🔄 Certificate Pinning Lifecycle

### Phase 1: Development (Current State)
**Status**: ✅ Infrastructure configured, pins not yet generated

Your `network_security_config.xml` is already set up with:
- HTTPS-only enforcement globally
- Trust anchors configured (system certificates)
- Pin-set placeholder ready
- Development domains (localhost, replit.dev) allowed for testing

**Current behavior**:
- App uses standard SSL validation (system CA certificates)
- Connects to any HTTPS endpoint with valid SSL
- **Safe for development and testing**

### Phase 2: Pre-Production (Before App Store)
**Status**: ⏳ Waiting for production SSL certificates

**Steps**:

1. **Deploy backend with SSL**:
   ```bash
   # Verify your domains have SSL certificates
   curl -I https://247tech.net
   curl -I https://api.247tech.net
   
   # Both should return 200 OK with valid certificates
   ```

2. **Generate certificate pins**:
   ```bash
   cd /path/to/project
   ./scripts/generate-cert-pins.sh 247tech.net
   ```
   
   The script will output something like:
   ```xml
   <pin-set expiration="2027-11-19">
       <pin digest="SHA-256">abcd1234...=</pin>
       <pin digest="SHA-256">efgh5678...=</pin>
   </pin-set>
   ```

3. **Update network_security_config.xml**:
   - Open: `android/app/src/main/res/xml/network_security_config.xml`
   - Find the `<pin-set>` section (lines 27-44)
   - Replace the commented placeholders with your generated pins
   
   **Before**:
   ```xml
   <pin-set expiration="2026-12-31">
       <!-- Production pins to be added before deployment -->
   </pin-set>
   ```
   
   **After**:
   ```xml
   <pin-set expiration="2027-11-19">
       <pin digest="SHA-256">abcd1234efgh5678ijkl9012mnop3456qrst7890=</pin>
       <pin digest="SHA-256">uvwx1234yzab5678cdef9012ghij3456klmn7890=</pin>
   </pin-set>
   ```

4. **Build release APK**:
   ```bash
   cd android
   ./gradlew clean assembleRelease
   ```

5. **Test certificate pinning**:
   ```bash
   # Install on physical device
   adb install app/build/outputs/apk/release/app-release.apk
   
   # App should connect successfully to your domains
   # Try with invalid certificate - should fail
   ```

### Phase 3: Production (App Store Release)
**Status**: Certificate pinning active and enforced

**Behavior**:
- App validates server certificates against pins
- Connections succeed only if certificate matches pins
- Man-in-the-middle attacks are blocked
- User-installed CA certificates are ignored

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Generating Pins Too Early
**Problem**: Pins generated before SSL certificates exist  
**Result**: App builds successfully but all API calls fail  
**Solution**: Wait until production SSL is live, then generate pins

### Pitfall 2: Missing Backup Pin
**Problem**: Only one pin configured  
**Result**: When certificate is renewed, app stops working  
**Solution**: Always include 2 pins (primary + backup)

### Pitfall 3: Expired Pin-Set
**Problem**: `<pin-set expiration>` date passes  
**Result**: Certificate pinning is disabled automatically  
**Solution**: Set expiration 2+ years out, monitor and update

### Pitfall 4: Certificate Renewal Without Update
**Problem**: Certificate renewed without updating app pins  
**Result**: All users lose connectivity, must reinstall app  
**Solution**: Follow proper renewal workflow (see below)

---

## 🔄 Certificate Renewal Workflow

When you need to renew your SSL certificate (typically every 1-2 years):

### Step 1: Plan Ahead (1 month before expiration)
Generate new certificate pins **BEFORE** renewing certificate:
```bash
# Get current certificate pin (should match existing)
./scripts/generate-cert-pins.sh 247tech.net
```

### Step 2: Prepare Transition Build
1. Generate pins for your NEW certificate (from certificate provider)
2. Update `network_security_config.xml` to include **BOTH** old and new pins:
   ```xml
   <pin-set expiration="2029-12-31">
       <!-- OLD certificate (current production) -->
       <pin digest="SHA-256">old_pin_here=</pin>
       <!-- NEW certificate (renewal) -->
       <pin digest="SHA-256">new_pin_here=</pin>
   </pin-set>
   ```

### Step 3: Release Transition Build
1. Build and publish app update to Google Play
2. Wait 2-4 weeks for users to update (monitor update adoption)

### Step 4: Renew Certificate
After most users have updated:
1. Install new SSL certificate on server
2. Verify app still connects (using new pin)

### Step 5: Clean Up (Next Release)
Remove old pin from config in next app update:
```xml
<pin-set expiration="2029-12-31">
    <!-- NEW certificate only -->
    <pin digest="SHA-256">new_pin_here=</pin>
    <pin digest="SHA-256">backup_pin_here=</pin>
</pin-set>
```

---

## 🧪 Testing Certificate Pinning

### Test 1: Valid Certificate (Should Succeed)
```bash
# Install release APK
adb install app/build/outputs/apk/release/app-release.apk

# App should connect to your domains successfully
# Check app logs for successful API calls
```

### Test 2: Invalid Certificate (Should Fail)
```bash
# Use proxy with self-signed certificate (e.g., Charles Proxy, Burp Suite)
# App should refuse to connect and show error
# This confirms pinning is working
```

### Test 3: Development Domains (Should Work)
```bash
# Localhost and replit.dev should still work
# These are configured to allow development
```

---

## 📋 Pre-Production Checklist

Before generating pins:
- [ ] Production domain has valid SSL certificate
- [ ] API endpoint has valid SSL certificate
- [ ] Both domains accessible via HTTPS
- [ ] Certificates not expiring soon (at least 1 year validity)

After generating pins:
- [ ] Pins added to `network_security_config.xml`
- [ ] Expiration date set 2+ years from today
- [ ] Backup pin included
- [ ] Release APK built successfully
- [ ] App connects to production domains
- [ ] Invalid certificates are rejected

---

## 🔍 Verification Commands

```bash
# 1. Check if domain has SSL
curl -I https://247tech.net

# 2. View certificate details
openssl s_client -servername 247tech.net -connect 247tech.net:443 | openssl x509 -noout -text

# 3. Generate pin manually
echo | openssl s_client -servername 247tech.net -connect 247tech.net:443 2>/dev/null | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  base64

# 4. Verify pins in config
cat android/app/src/main/res/xml/network_security_config.xml | grep -A 5 "pin-set"
```

---

## 📞 Need Help?

**Certificate Provider Issues**: Contact your SSL certificate provider  
**Domain Not Accessible**: Check DNS and server configuration  
**App Connection Failures**: Verify pins match server certificate  
**Build Errors**: Check Android Studio build output for details

---

## 📚 References

- **ADHCC Audit Finding**: Network Security Misconfiguration (Critical - 9.1)
- **Android Documentation**: [Network Security Config](https://developer.android.com/training/articles/security-config)
- **OWASP**: [Certificate and Public Key Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- **Certificate Generator Script**: `scripts/generate-cert-pins.sh`
- **Security Deployment Checklist**: `docs/SECURITY_DEPLOYMENT_CHECKLIST.md`

---

**Current Status for Your Project**:
- ✅ Certificate pinning infrastructure configured
- ⏳ Waiting for production SSL certificates to generate pins
- 📝 Follow this guide when SSL is ready for production deployment
