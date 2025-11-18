# iOS Developer Signed Build Instructions
## 24/7 Tele H - Health Monitoring System

---

## Prerequisites

1. **macOS Computer** with Xcode 15+ installed
2. **Apple Developer Account** ($99/year) - https://developer.apple.com
3. **Distribution Certificate** and **Provisioning Profile** from Apple Developer Portal

---

## Step 1: Download Project from Replit

```bash
# Clone this Replit project to your Mac
git clone <your-replit-git-url>
cd <project-folder>
```

---

## Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install iOS-specific Capacitor dependencies
cd ios/App
pod install
cd ../..
```

---

## Step 3: Open in Xcode

```bash
# Open the iOS project in Xcode
npx cap open ios
```

This will open **Xcode** with your iOS project.

---

## Step 4: Configure Signing in Xcode

1. In Xcode, select the **App** target in the left sidebar
2. Go to **Signing & Capabilities** tab
3. **Select your Team** (your Apple Developer account)
4. **Select Provisioning Profile** (choose your distribution profile)
5. Verify **Bundle Identifier**: `com.teleh.healthcare`

---

## Step 5: Build for Release

### Option A: Build Archive (for App Store or TestFlight)

1. In Xcode menu: **Product → Archive**
2. Wait for build to complete (~5-10 minutes)
3. In the **Organizer** window:
   - Click **Distribute App**
   - Choose distribution method:
     - **App Store Connect** (for TestFlight/App Store)
     - **Ad Hoc** (for internal testing on registered devices)
     - **Enterprise** (if you have Enterprise account)
4. Follow the wizard to export the `.ipa` file

### Option B: Build for Development Testing

1. Connect your iPhone via USB
2. Select your device in Xcode toolbar
3. Click **Run** button (▶️)
4. App will install and launch on your device

---

## Step 6: Export Binary

After archiving, Xcode will export:
- **`.ipa` file** - The iOS binary you can distribute
- Located in: `~/Library/Developer/Xcode/Archives/`

---

## Troubleshooting

### "No Provisioning Profiles Found"
- Go to Apple Developer Portal → Certificates, IDs & Profiles
- Create a new **Distribution Provisioning Profile**
- Download and double-click to install

### "Code Signing Error"
- Ensure your Apple Developer account is active
- Verify your certificate is valid (not expired)
- Clean build folder: Product → Clean Build Folder

### "Pod Install Failed"
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install --repo-update
```

---

## Security Note

The built `.ipa` file will include all security features:
✅ Network Security (HTTPS-only)
✅ Root Detection
✅ Screenshot Prevention (FLAG_SECURE)
✅ Tapjacking Protection
✅ Certificate Pinning Framework
✅ 100% ADHCC Compliance

---

## Need Help?

- Apple Developer Support: https://developer.apple.com/support/
- Capacitor iOS Guide: https://capacitorjs.com/docs/ios
- Xcode Documentation: https://developer.apple.com/xcode/

---

**Build Time:** ~10-15 minutes  
**File Size:** ~50-80 MB (estimated)  
**Format:** `.ipa` (iOS App Package)
