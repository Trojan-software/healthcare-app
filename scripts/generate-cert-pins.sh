#!/bin/bash

################################################################################
# SSL Certificate Pinning Generator
# 
# Purpose: Generate SHA-256 certificate pins for Android network security config
# Usage: ./scripts/generate-cert-pins.sh <domain>
# Example: ./scripts/generate-cert-pins.sh 247tech.net
#
# ADHCC Compliance: Network Security Misconfiguration (Critical - 9.1)
################################################################################

set -e

DOMAIN=${1:-"247tech.net"}
BACKUP_DOMAIN=${2:-"api.247tech.net"}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Certificate Pinning Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to generate pin for a domain
generate_pin() {
    local domain=$1
    echo "📡 Fetching certificate for: $domain"
    
    # Get the certificate
    local cert=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                 openssl x509 -pubkey -noout 2>/dev/null)
    
    if [ -z "$cert" ]; then
        echo "❌ Error: Could not fetch certificate for $domain"
        echo "   Make sure the domain is accessible and has a valid SSL certificate"
        return 1
    fi
    
    # Generate SHA-256 pin
    local pin=$(echo "$cert" | \
                openssl pkey -pubin -outform der 2>/dev/null | \
                openssl dgst -sha256 -binary | \
                base64)
    
    if [ -z "$pin" ]; then
        echo "❌ Error: Could not generate pin for $domain"
        return 1
    fi
    
    echo "✅ Pin generated: $pin"
    echo ""
    
    # Return the pin
    echo "$pin"
}

echo "Generating pins for production domains..."
echo ""

# Generate primary pin
PRIMARY_PIN=$(generate_pin "$DOMAIN")
if [ $? -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  PRIMARY DOMAIN UNREACHABLE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "The primary domain '$DOMAIN' is not reachable or doesn't have"
    echo "a valid SSL certificate yet."
    echo ""
    echo "OPTIONS:"
    echo "1. Deploy your backend to $DOMAIN with a valid SSL certificate"
    echo "2. Use a staging/testing domain for now"
    echo "3. Generate pins after SSL setup is complete"
    echo ""
    echo "EXAMPLE with staging domain:"
    echo "  ./scripts/generate-cert-pins.sh staging.247tech.net"
    echo ""
    exit 1
fi

# Generate backup pin
echo "Generating backup pin..."
BACKUP_PIN=$(generate_pin "$BACKUP_DOMAIN")
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Could not generate backup pin for $BACKUP_DOMAIN"
    echo "   Proceeding with primary pin only..."
    BACKUP_PIN=""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CERTIFICATE PINS GENERATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Add these pins to: android/app/src/main/res/xml/network_security_config.xml"
echo ""
echo "Replace the <pin-set> section with:"
echo ""
echo "    <pin-set expiration=\"$(date -d '+2 years' +%Y-%m-%d 2>/dev/null || date -v +2y +%Y-%m-%d)\">"
echo "        <!-- Primary Certificate Pin for $DOMAIN -->"
echo "        <pin digest=\"SHA-256\">$PRIMARY_PIN</pin>"

if [ -n "$BACKUP_PIN" ]; then
    echo "        <!-- Backup Certificate Pin for $BACKUP_DOMAIN -->"
    echo "        <pin digest=\"SHA-256\">$BACKUP_PIN</pin>"
fi

echo "    </pin-set>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT SECURITY NOTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 📌 ALWAYS keep a backup pin"
echo "   - If your primary certificate expires, the backup prevents app lockout"
echo "   - Users would need to reinstall the app without backup pins"
echo ""
echo "2. 📅 Monitor expiration dates"
echo "   - Set reminders before <pin-set expiration> date"
echo "   - Regenerate pins 1 month before expiration"
echo ""
echo "3. 🔄 Certificate renewal process:"
echo "   - Generate new pins BEFORE renewing certificates"
echo "   - Release app update with both OLD and NEW pins"
echo "   - After users update (2-4 weeks), renew certificate"
echo "   - Next update can remove old pins"
echo ""
echo "4. ✅ Testing certificate pinning:"
echo "   - Build release APK: cd android && ./gradlew assembleRelease"
echo "   - Install on device: adb install app/build/outputs/apk/release/app-release.apk"
echo "   - Verify app connects successfully"
echo "   - Test with invalid cert to confirm pinning works"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
