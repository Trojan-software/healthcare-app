# Apple Developer Credentials for Codemagic
## Step-by-Step Guide

---

## 🔑 **What You Need**

To build iOS apps on Codemagic, you need:

1. ✅ **Apple Developer Account** ($99/year)
2. ✅ **App Store Connect API Key** (free - created in App Store Connect)

---

## 📋 **Step 1: Create App Store Connect API Key**

### Go to App Store Connect:

1. Visit: https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Navigate to: **Users and Access** → **Keys** (under "Integrations")
4. Click the **"+" button** (Generate API Key)

### Fill in Details:

- **Name:** `Codemagic CI/CD`
- **Access:** Select **"Developer"**
- Click **"Generate"**

### Download and Save:

1. **Download the `.p8` file** immediately (you can only download ONCE!)
2. **Note the Key ID** (looks like: `AB12CD34EF`)
3. **Note the Issuer ID** (looks like: `12345678-abcd-1234-abcd-123456789abc`)

**⚠️ IMPORTANT:** Save the `.p8` file safely - you cannot download it again!

---

## 📋 **Step 2: Add Credentials to Codemagic**

### In Codemagic Dashboard:

1. After connecting your repository, go to **App Settings**
2. Click **"Integrations"** in the left sidebar
3. Scroll to **"App Store Connect"**
4. Click **"Connect"**

### Enter Your Credentials:

- **Issuer ID:** Paste from App Store Connect (Step 1)
- **Key ID:** Paste from App Store Connect (Step 1)
- **Private Key:** Open the `.p8` file in a text editor, copy ALL content including:
  ```
  -----BEGIN PRIVATE KEY-----
  [content]
  -----END PRIVATE KEY-----
  ```
  Paste everything into Codemagic

### Save Integration:

- Click **"Save"** or **"Connect"**
- Integration name will show as **"codemagic"** (matches your YAML config ✅)

---

## ✅ **Verification**

After adding credentials, you should see:
- ✅ Green checkmark next to "App Store Connect"
- ✅ Integration status: "Connected"

---

## 🎯 **Your YAML Config (Already Set Up)**

In your `codemagic.yaml`, these lines use the credentials:

```yaml
integrations:
  app_store_connect: codemagic  # ← Matches integration name

environment:
  ios_signing:
    distribution_type: app_store
    bundle_identifier: com.teleh.healthcare  # ← Your app ID
```

**This is already configured! ✅**

---

## 🐛 **Troubleshooting**

### "API Key not found"
- Verify you copied the ENTIRE `.p8` file content
- Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### "Invalid Key ID"
- Double-check Key ID from App Store Connect
- Format: 10 characters (letters and numbers)

### "Invalid Issuer ID"
- Double-check Issuer ID from App Store Connect
- Format: UUID (8-4-4-4-12 characters)

### "Certificate not found"
- Codemagic will auto-generate certificates
- Ensure Bundle ID is correct: `com.teleh.healthcare`
- Make sure Bundle ID is registered in App Store Connect

---

## 📝 **Quick Checklist**

Before starting build:
- [ ] Apple Developer Account active ($99/year paid)
- [ ] App Store Connect API Key created
- [ ] `.p8` file downloaded and saved
- [ ] Key ID copied
- [ ] Issuer ID copied
- [ ] Credentials added to Codemagic
- [ ] Integration shows "Connected"
- [ ] Bundle ID matches: `com.teleh.healthcare`

---

## ⏱️ **Total Time**

- Create API Key: 5 minutes
- Add to Codemagic: 2 minutes
- **Total: ~7 minutes**

---

## 🚀 **After This, You're Ready to Build!**

Once credentials are configured, Codemagic will:
- ✅ Auto-generate certificates
- ✅ Auto-create provisioning profiles
- ✅ Sign your iOS app
- ✅ Build the `.ipa` file

**No manual certificate management needed!** 🎉
