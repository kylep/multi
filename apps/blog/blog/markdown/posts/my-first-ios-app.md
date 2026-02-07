---
title: "Making My First Mobile App"
summary: AI made it easy: Building an iPhone app
slug: my-first-ios-app
category: development
tags: iOS,Swift,Mobile,AI
date: 2026-02-01
modified: 2026-02-01
status: published
image: ios-app.png
thumbnail: ios-app-thumb.png
---

I recently heard the term "Learning out Loud". I think that's what I have been doing
with this blog, but now that I've got a label I'm going to lean into it. This post is
not meant to be authoritative, these are my notes while I was learning.


# Why an iPhone App
For years, my wife and I have joked about building "The Silly App", an iphone app to
record and gamify things being silly. It was just a fun idea and while we're both
competent web developers neither of us have made mobile apps, so we never got around to
it. I'm having so much fun with the new AI tooling though that I figured now was time.

The app was made with Claude Code, Cursor, and a Macbook M2 w/ XCode.


---

# Env Setup

Having not made an iPhone app before, need to set up the workstation.

## Install XCode
Just get it from the MacOS App Store.

### Install Command Line Tools
Nav to Xcode > Settings > Locations: In theory Command Line Tools should point to your
XCode. For me it got stuck on `Determining...` and wouldn't budge. To fix, in my
terminal I ran

```bash
xcode-select --install

# gave this error, not sure if --install was required really
# xcode-select: note: Command line tools are already installed. Use "Software Update" in System Settings or the softwareupdate command line interface to install updates

sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# verify
xcode-select -p

# accept license
sudo xcodebuild -license accept

# kill it all
killall Xcode 2>/dev/null
killall xcodebuild 2>/dev/null
killall xcodelauncher 2>/dev/null
```

Then quit and re-open XCode. That fixed it for me.

### Installing Cursor and Claude Code
I'm not including instructions here other than to say I hadn't done it yet on this
laptop and had to set them up too. I'm not using XCode's IDE to author code but I guess
it's needed to build, run, and sign the app.

---

# Init the App

These are the settings I used. Included not to be copied but for context in case
some notes later end up depending on them. Why did I pick these settings? Basically
because ChatGPT told me to after some prompting to pick what would be right...

1. In XCode, File > New > Project > iOS (up top) App
  1. Team: `Add Account`
    1. `Add Apple Account`, sign in.
    1. Click my account
    1. Teams: Personal Team
    1. Close the window, "Team" should be populated now
  1. Product Name: `sillyapp`
  1. Organization Identifier: `com.pericak`
  1. Interface: SwiftUI
  1. Language: Swift
  1. Testing System: Swift Testing with XCTest UI Tests
  1. Storage: SwiftData
  1. Host in CloudKit: False (unchecked)
  1. Next
1. Choosing the location, I picked `multi/apps/sillyapp`.
  1. I double-clicked that and it kinda went off and made a bunch of files...
  1. I unchecked the Git option, this is also in my repo [multi](https://github.com/kylep/multi).

