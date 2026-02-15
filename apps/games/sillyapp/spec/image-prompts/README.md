# Image Prompts — Generation Pipeline

This directory contains prompt definitions for every image asset the Silly App needs.  
Each `.md` file defines one image: its filename, dimensions, format, and the Nano Banana prompt to generate it.

---

## Image Manifest

| File | Asset | Size | Format |
|---|---|---|---|
| `app-icon.md` | App Icon | 1024×1024 | PNG (no alpha) |
| `launch-background.md` | Splash Screen Background | 1284×2778 | PNG |
| `empty-feed.md` | Empty Feed Illustration | 600×600 | PNG (alpha) |
| `empty-friends.md` | Empty Friends Illustration | 600×600 | PNG (alpha) |
| `stotd-banner.md` | Silly Thing of the Day Banner | 800×300 | PNG (alpha) |
| `trophy-gold.md` | Leaderboard 1st Place | 200×200 | PNG (alpha) |
| `trophy-silver.md` | Leaderboard 2nd Place | 200×200 | PNG (alpha) |
| `trophy-bronze.md` | Leaderboard 3rd Place | 200×200 | PNG (alpha) |
| `heart.md` | Heart Icon | 200×200 | PNG (alpha) |
| `default-avatar.md` | Default User Avatar | 400×400 | PNG (alpha) |
| `invite-illustration.md` | Friend Invite Screen Art | 600×600 | PNG (alpha) |
| `background-pattern.md` | Tileable Background Pattern | 400×400 | PNG (no alpha) |
| `tab-feed.md` | Tab Bar: Feed | 60×60 | PNG (alpha, template) |
| `tab-create.md` | Tab Bar: Create | 60×60 | PNG (alpha, template) |
| `tab-leaderboard.md` | Tab Bar: Leaderboard | 60×60 | PNG (alpha, template) |
| `tab-friends.md` | Tab Bar: Friends | 60×60 | PNG (alpha, template) |
| `tab-profile.md` | Tab Bar: Profile | 60×60 | PNG (alpha, template) |
| `delete-confirmation.md` | Delete Confirmation Dialog Art | 400×400 | PNG (alpha) |

**Total: 18 images**

---

## Script Generation Prompt

> Use the following prompt with a Claude coding agent to generate the `generate-images.sh` script
> that reads these prompt files and produces actual images via Nano Banana.

```
You are a build-automation engineer. Write a bash script called `generate-images.sh` that:

1. **Reads each `.md` file** (excluding README.md) in the `spec/image-prompts/` directory.

2. **Parses each file** to extract:
   - `Filename` from the `**Filename:**` line (e.g., `app-icon.png`)
   - `Size` from the `**Size:**` line (e.g., `1024×1024` → width=1024, height=1024)
   - `Format` from the `**Format:**` line
   - `Prompt` from the text under the `## Prompt` heading (everything after that heading until EOF or next heading)

3. **Calls the Nano Banana API** for each image:
   - Endpoint: `${NANO_BANANA_ENDPOINT}/generate` (default: `https://api.nanobanana.com/v1/generate`)
   - Method: POST
   - Headers:
     - `Authorization: Bearer ${NANO_BANANA_API_KEY}`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "prompt": "<extracted prompt text>",
       "width": <extracted width>,
       "height": <extracted height>,
       "format": "png",
       "num_images": 1
     }
     ```
   - The API returns a JSON response with `{"images": [{"url": "https://..."}]}`.

4. **Downloads each generated image** to `output/<filename>` using curl.

5. **Post-processes for iOS Asset Catalog:**
   - For each image, create 1x, 2x, 3x versions by resizing with `sips` (macOS built-in).
   - 3x = original size, 2x = 2/3 size, 1x = 1/3 size.
   - Exception: `app-icon.md` — only needs the 1024×1024 original (Xcode generates all variants).
   - Exception: `background-pattern.md` — only needs 1x (tileable).
   - Tab bar icons: generate 25×25 (1x), 50×50 (2x), 75×75 (3x) from the 60×60 source.

6. **Creates Xcode Asset Catalog structure** at `output/Assets.xcassets/Images/`:
   - For each image, create a `<name>.imageset/` directory.
   - Inside, place the 1x/2x/3x PNGs and a `Contents.json` with the standard Xcode format:
     ```json
     {
       "images": [
         { "filename": "<name>.png", "idiom": "universal", "scale": "1x" },
         { "filename": "<name>@2x.png", "idiom": "universal", "scale": "2x" },
         { "filename": "<name>@3x.png", "idiom": "universal", "scale": "3x" }
       ],
       "info": { "author": "xcode", "version": 1 }
     }
     ```

7. **Environment variables required:**
   - `NANO_BANANA_API_KEY` (required, exit with error if missing)
   - `NANO_BANANA_ENDPOINT` (optional, defaults to `https://api.nanobanana.com/v1`)

8. **Error handling:**
   - If any API call fails, log the error and continue with the next image.
   - At the end, print a summary: X succeeded, Y failed.
   - Exit with code 1 if any images failed.

9. **Idempotency:**
   - If `output/<filename>` already exists and is non-empty, skip generation (print "Skipping <filename>, already exists").
   - Add a `--force` flag to regenerate all images.

10. **Dependencies:**
    - `curl` (for API calls and downloads)
    - `jq` (for JSON parsing)
    - `sips` (macOS built-in for image resizing)
    - Check for these at script start, exit with helpful error if missing.

The script should be well-commented, use `set -euo pipefail`, and print progress for each image.
Make it executable with proper shebang (#!/usr/bin/env bash).
```

---

## Usage

1. Set environment variables:
   ```bash
   export NANO_BANANA_API_KEY="your-key-here"
   export NANO_BANANA_ENDPOINT="https://api.nanobanana.com/v1"  # optional
   ```

2. Generate the script (using the prompt above with a coding agent).

3. Run the script:
   ```bash
   cd /path/to/sillyapp
   chmod +x generate-images.sh
   ./generate-images.sh
   ```

4. Copy generated assets:
   ```bash
   cp -R output/Assets.xcassets/Images/* sillyapp/Assets.xcassets/Images/
   ```

5. Open Xcode and verify all images appear in the Asset Catalog.
