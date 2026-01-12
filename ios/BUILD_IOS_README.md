# 24/7 Tele H - iOS Build Guide

## Prerequisites

1. **Mac computer** with macOS 12.0 or later
2. **Xcode 15+** from App Store
3. **Apple Developer Account** ($99/year) - https://developer.apple.com
4. **CocoaPods** installed

## Step 1: Install CocoaPods

Open Terminal and run:
```bash
sudo gem install cocoapods
```

## Step 2: Download Project

Download this entire project to your Mac.

## Step 3: Install Dependencies

```bash
cd /path/to/project/ios/App
pod install
```

## Step 4: Open in Xcode

```bash
open App.xcworkspace
```

**Important:** Open `App.xcworkspace` (NOT `App.xcodeproj`)

## Step 5: Configure Signing

1. In Xcode, select the **App** project in the navigator
2. Select **App** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (Apple Developer account)
6. Change **Bundle Identifier** if needed (e.g., `com.yourcompany.teleh`)

## Step 6: Build for Device

1. Connect your iPhone via USB
2. Select your device in the top device selector
3. Press **Cmd + R** to build and run

## Step 7: Archive for Distribution

1. Select **Any iOS Device** as build target
2. Go to **Product → Archive**
3. After archiving, the Organizer window opens
4. Click **Distribute App**
5. Choose distribution method:
   - **App Store Connect** - for TestFlight/App Store
   - **Ad Hoc** - for direct installation (up to 100 devices)
   - **Enterprise** - for internal distribution

## Bluetooth Permissions

The app is configured with these Bluetooth permissions in `Info.plist`:
- `NSBluetoothAlwaysUsageDescription` - For HC03 device connection
- `NSBluetoothPeripheralUsageDescription` - For device pairing
- `UIBackgroundModes` - `bluetooth-central` for background connectivity

## App Configuration

| Setting | Value |
|---------|-------|
| Bundle ID | `com.teleh.healthcare` |
| Display Name | 24/7 Tele H |
| Minimum iOS | 13.0 |
| API Server | https://247tech.net |

## Troubleshooting

### Pod install fails
```bash
pod repo update
pod install --repo-update
```

### Signing issues
- Ensure your Apple ID is added in Xcode Preferences → Accounts
- Your Bundle ID must be unique on App Store

### Build errors
- Clean build: **Cmd + Shift + K**
- Clean build folder: **Cmd + Option + Shift + K**

## Files Included

- `App/` - Main iOS app
- `App/Plugins/HC03Bluetooth/` - Bluetooth plugin for HC03 device
- `App/public/` - Web assets (synced from main project)
- `Podfile` - CocoaPods dependencies

## Support

For issues, contact: support@247tech.net
