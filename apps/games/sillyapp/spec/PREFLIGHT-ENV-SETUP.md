# Preflight Environment Setup Guide

Step-by-step instructions for every check in `scripts/preflight-check.sh`.  
Work through each section until the preflight script exits 0.

```bash
# Run at any time to see what's left:
./scripts/preflight-check.sh
```

---

## Table of Contents

1. [CLI Tools](#1-cli-tools)
   - [Xcode CLI Tools](#11-xcode-cli-tools)
   - [xcodebuild & xcrun](#12-xcodebuild--xcrun)
   - [curl](#13-curl)
   - [jq](#14-jq)
   - [sips](#15-sips)
2. [Environment Variables](#2-environment-variables)
   - [NANO_BANANA_API_KEY](#21-nano_banana_api_key)
   - [NANO_BANANA_ENDPOINT](#22-nano_banana_endpoint)
   - [FIREBASE_PROJECT_ID](#23-firebase_project_id)
3. [Config Files](#3-config-files)
   - [GoogleService-Info.plist](#31-googleservice-infoplist)
   - [REVERSED_CLIENT_ID](#32-reversed_client_id)
4. [Xcode Project](#4-xcode-project)
   - [sillyapp.xcodeproj](#41-sillyappxcodeproj)
   - [Scheme 'sillyapp'](#42-scheme-sillyapp)
5. [Simulator](#5-simulator)
   - [iPhone 17 Pro Simulator](#51-iphone-17-pro-simulator)
6. [.env File (Optional)](#6-env-file-optional)

---

## 1. CLI Tools

### 1.1 Xcode CLI Tools

**What the preflight checks:** `xcode-select -p` returns a valid path.

**How to install:**

1. Open Terminal and run:
   ```bash
   xcode-select --install
   ```
2. A system dialog appears — click **Install**, then **Agree** to the license.
3. Wait for the download (~2 GB) to complete.
4. Verify:
   ```bash
   xcode-select -p
   # Expected: /Applications/Xcode.app/Contents/Developer
   ```

If you have Xcode installed but the path points elsewhere, reset it:
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### 1.2 xcodebuild & xcrun

**What the preflight checks:** Both commands are on `$PATH` and `xcodebuild -version` returns a version string.

**How to install:**

These ship with Xcode. If missing, you need full Xcode (not just CLI tools):

1. Download **Xcode 26** from the Mac App Store or [developer.apple.com/xcode](https://developer.apple.com/xcode/).
2. Open Xcode once to accept the license and install components:
   ```bash
   sudo xcodebuild -runFirstLaunch
   ```
3. Verify:
   ```bash
   xcodebuild -version
   # Expected: Xcode 26.x
   xcrun --version
   ```

### 1.3 curl

**What the preflight checks:** `curl` is on `$PATH`.

**How to install:**

`curl` is pre-installed on macOS. If somehow missing:
```bash
brew install curl
```

Verify:
```bash
curl --version
# Expected: curl 8.x.x
```

### 1.4 jq

**What the preflight checks:** `jq` is on `$PATH`.

**How to install:**

`jq` is a lightweight JSON processor used by the image generation pipeline.

```bash
brew install jq
```

If you don't have Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install jq
```

Verify:
```bash
jq --version
# Expected: jq-1.7.x
```

### 1.5 sips

**What the preflight checks:** `sips` is on `$PATH`.

**How to install:**

`sips` (Scriptable Image Processing System) is a macOS built-in. It ships with every macOS installation and cannot be installed separately. If it's missing, your macOS installation may be corrupted.

Verify:
```bash
sips --help
```

---

## 2. Environment Variables

You can set these in your shell profile (`~/.zshrc`) or in a project-level `.env` file (see [section 6](#6-env-file-optional)).

### 2.1 NANO_BANANA_API_KEY

**What the preflight checks:** The variable is set, non-empty, and doesn't look like a placeholder.

**What it's for:** Authenticates requests to the Nano Banana image generation API (Google's Gemini image generation models) used to produce all app artwork.

**How to get it:**

1. Go to **Google AI Studio**: [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account.
3. Click **"Get API key"** in the left sidebar.
4. Click **"Create API key"** and select a Google Cloud project (or create a new one).
5. Copy the generated key.

> **Note:** New Google Cloud accounts get $300 in free credits. Nano Banana image generation
> costs ~$0.04–$0.24 per image depending on resolution, so the free tier covers hundreds of
> generations.

**Set it:**
```bash
# In your shell (temporary, current session only):
export NANO_BANANA_API_KEY="AIzaSy...your-key-here"

# Or permanently in ~/.zshrc:
echo 'export NANO_BANANA_API_KEY="AIzaSy...your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Security:** Never commit this key. The preflight script warns if `.env` isn't in `.gitignore`.

### 2.2 NANO_BANANA_ENDPOINT

**What the preflight checks:** Warns if unset (optional — defaults are used).

**What it's for:** The base URL for the Nano Banana API. Only needed if you're using a non-default endpoint (e.g., a proxy, Vertex AI, or a third-party provider).

**Default values by provider:**

| Provider | Endpoint |
|---|---|
| Google AI Studio (default) | `https://generativelanguage.googleapis.com/v1beta` |
| Vertex AI | `https://{region}-aiplatform.googleapis.com/v1` |
| Third-party proxies | Varies — check provider docs |

**Set it (only if using a non-default provider):**
```bash
export NANO_BANANA_ENDPOINT="https://generativelanguage.googleapis.com/v1beta"
```

If you're using Google AI Studio with a standard API key, you can leave this unset — the generation script will default appropriately.

### 2.3 FIREBASE_PROJECT_ID

**What the preflight checks:** The variable is set and non-empty.

**What it's for:** Identifies your Firebase project in scripts, Firestore rules deployment, and Cloud Storage paths.

**How to get it:**

1. Go to the **Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)
2. If you don't have a project yet, click **"Create a project"**:
   - Enter a project name (e.g., "silly-app").
   - Optionally customize the Project ID — **this cannot be changed later**.
   - Choose whether to enable Google Analytics (optional for this app).
   - Click **Create project**.
3. Once in your project, find the Project ID in one of these places:
   - **Project Settings** (gear icon → Project settings) → "Project ID" field at the top.
   - It's also visible in the URL: `console.firebase.google.com/project/YOUR-PROJECT-ID/...`
4. Alternatively, if you have the Firebase CLI:
   ```bash
   npm install -g firebase-tools   # or: curl -sL https://firebase.tools | bash
   firebase login
   firebase projects:list
   ```

**Set it:**
```bash
export FIREBASE_PROJECT_ID="silly-app-abc123"
```

---

## 3. Config Files

### 3.1 GoogleService-Info.plist

**What the preflight checks:** The file exists at `sillyapp/GoogleService-Info.plist` and contains a valid `PROJECT_ID` key.

**What it's for:** Contains your Firebase project's configuration metadata — API keys, project ID, storage bucket, etc. Required for Firebase Auth, Firestore, Cloud Storage, and FCM to connect to your project.

**How to get it:**

1. Open the **Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Select your project (or create one per [section 2.3](#23-firebase_project_id)).
3. Click the **gear icon** (top-left) → **Project settings**.
4. Under **"Your apps"**, click the **iOS icon** (if you haven't registered an iOS app yet):
   - Enter your **Bundle ID** — find yours in Xcode under the target's "General" tab (e.g., `com.yourname.sillyapp`).
   - Optionally enter an App nickname and App Store ID.
   - Click **Register app**.
5. Click **"Download GoogleService-Info.plist"**.
6. Move the downloaded file into the project:
   ```bash
   mv ~/Downloads/GoogleService-Info.plist sillyapp/GoogleService-Info.plist
   ```
7. **Add to Xcode**: Open the project in Xcode, drag `GoogleService-Info.plist` into the `sillyapp/` group, and make sure **"Add to targets: sillyapp"** is checked.

**Enable required Firebase services** (do this now so the plist is fully populated):

1. **Authentication**: Firebase Console → Build → Authentication → Get started → Sign-in method → Enable **Google**.
2. **Cloud Firestore**: Firebase Console → Build → Firestore Database → Create database → Start in **test mode** → Choose a region close to your users.
3. **Cloud Storage**: Firebase Console → Build → Storage → Get started → Start in **test mode**.
4. **Cloud Messaging**: Firebase Console → Build → Cloud Messaging (enabled by default).

After enabling Google Auth, **re-download** `GoogleService-Info.plist` to get the updated `REVERSED_CLIENT_ID` and OAuth client fields:
- Firebase Console → Project settings → Your apps → iOS app → download button.

### 3.2 REVERSED_CLIENT_ID

**What the preflight checks:** The `REVERSED_CLIENT_ID` key exists inside `GoogleService-Info.plist`.

**What it's for:** A URL scheme that Google Sign-In uses to redirect back to your app after the user authenticates with Google.

**How it works:**

The `REVERSED_CLIENT_ID` is **automatically included** in `GoogleService-Info.plist` once you enable Google as an Authentication provider in Firebase. You should not need to set it manually.

**If the preflight check fails** (key missing from plist):

1. Make sure Google Sign-In is enabled:
   - Firebase Console → Authentication → Sign-in method → Google → **Enable** → Save.
2. Re-download `GoogleService-Info.plist` (see [section 3.1](#31-googleservice-infoplist)).
3. Verify it contains the key:
   ```bash
   /usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" sillyapp/GoogleService-Info.plist
   # Expected: something like com.googleusercontent.apps.123456789-abcdefg
   ```

**Additionally**, you must register this value as a URL Type in Xcode:

1. Open the project in Xcode.
2. Select the **sillyapp** target → **Info** tab → **URL Types**.
3. Click **+** to add a new URL type.
4. Paste the `REVERSED_CLIENT_ID` value into the **URL Schemes** field.
5. Leave the other fields (Identifier, Role) at defaults.

This allows iOS to route the Google OAuth callback back to your app.

---

## 4. Xcode Project

### 4.1 sillyapp.xcodeproj

**What the preflight checks:** The directory `sillyapp.xcodeproj` exists at the project root.

**How to fix if missing:**

This file is part of the repository. If it's missing, your clone is incomplete:
```bash
cd /path/to/multi
git checkout -- apps/games/sillyapp/sillyapp.xcodeproj
```

Or re-clone the repository:
```bash
git clone <repo-url>
```

### 4.2 Scheme 'sillyapp'

**What the preflight checks:** `xcodebuild -project sillyapp.xcodeproj -list` includes a scheme called `sillyapp`.

**How to fix if missing:**

The scheme should exist in the repo. If it's not showing up:

1. Open `sillyapp.xcodeproj` in Xcode.
2. Go to **Product → Scheme → Manage Schemes...**.
3. If `sillyapp` is listed but unchecked, check the **Shared** box.
4. If it's not listed at all, click **+**, select the `sillyapp` target, and create the scheme.
5. Make sure **Shared** is checked so it's committed to the repo.

---

## 5. Simulator

### 5.1 iPhone 17 Pro Simulator

**What the preflight checks:** An "iPhone 17 Pro" device appears in `xcrun simctl list devices`, and optionally whether it's booted.

**How to install the simulator runtime:**

1. **Via Xcode UI** (easiest):
   - Open Xcode → **Settings** (Cmd+,) → **Platforms** tab.
   - Click the **+** button at the bottom-left.
   - Select **iOS** and download the latest iOS runtime (iOS 26.x).
   - Once installed, Xcode automatically creates default simulator devices including iPhone 17 Pro.

2. **Via command line:**
   ```bash
   # Set the active developer directory (if not already set)
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

   # Run first launch tasks (installs components)
   sudo xcodebuild -runFirstLaunch

   # Download all platform simulators
   xcodebuild -downloadAllPlatforms

   # Or download just iOS
   xcodebuild -downloadPlatform iOS
   ```

3. **Verify the device exists:**
   ```bash
   xcrun simctl list devices | grep "iPhone 17 Pro"
   # Expected: iPhone 17 Pro (XXXXXXXX-XXXX-...) (Shutdown)
   ```

4. **If the runtime is installed but the device doesn't exist**, create it manually:
   ```bash
   # List available runtimes
   xcrun simctl list runtimes

   # Create the device (use the correct runtime identifier)
   xcrun simctl create "iPhone 17 Pro" "iPhone 17 Pro" com.apple.CoreSimulator.SimRuntime.iOS-26-2
   ```

5. **Boot the simulator** (needed before running tests):
   ```bash
   xcrun simctl boot 'iPhone 17 Pro'
   ```

6. **Shut down when done** (saves resources):
   ```bash
   xcrun simctl shutdown all
   ```

---

## 6. .env File (Optional)

**What the preflight checks:** Whether `.env` exists at the project root, and whether it's listed in `.gitignore`.

**What it's for:** A convenience file that lets you keep all environment variables in one place instead of scattering `export` lines across your shell profile. Useful if you work on multiple projects with different keys.

**How to set it up:**

1. Create the file:
   ```bash
   cat > .env << 'EOF'
   # Silly App — Environment Variables
   # This file is gitignored. NEVER commit it.

   # Nano Banana (Google Gemini image generation)
   NANO_BANANA_API_KEY=AIzaSy...your-key-here
   NANO_BANANA_ENDPOINT=https://generativelanguage.googleapis.com/v1beta

   # Firebase
   FIREBASE_PROJECT_ID=silly-app-abc123
   EOF
   ```

2. Add to `.gitignore` (critical — prevents committing secrets):
   ```bash
   echo '.env' >> .gitignore
   ```

3. Load it in your shell session:
   ```bash
   # Manual (current session):
   export $(grep -v '^#' .env | xargs)

   # Or add this to ~/.zshrc to auto-load when you cd into the project:
   # (requires direnv — brew install direnv)
   ```

4. **Using direnv (recommended for automatic loading):**
   ```bash
   brew install direnv

   # Add to ~/.zshrc:
   echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
   source ~/.zshrc

   # Rename .env to .envrc:
   mv .env .envrc

   # Allow direnv for this directory:
   direnv allow .
   ```
   Now variables are loaded/unloaded automatically when you enter/leave the project directory.

---

## Quick Checklist

Run through this to go from zero to green preflight:

| # | Action | Time Estimate |
|---|---|---|
| 1 | Install Xcode from App Store (if not installed) | 20–40 min |
| 2 | `sudo xcodebuild -runFirstLaunch` | 1 min |
| 3 | `xcodebuild -downloadPlatform iOS` | 5–15 min |
| 4 | `brew install jq` | 1 min |
| 5 | Create Firebase project + enable Auth, Firestore, Storage | 5 min |
| 6 | Download `GoogleService-Info.plist` → `sillyapp/` | 2 min |
| 7 | Add `REVERSED_CLIENT_ID` as URL Type in Xcode | 2 min |
| 8 | Get Nano Banana API key from Google AI Studio | 2 min |
| 9 | Create `.env` with all variables | 2 min |
| 10 | `./scripts/preflight-check.sh` — should exit 0 | 30 sec |

**Total from scratch: ~40–70 minutes** (mostly waiting for Xcode/simulator downloads).
