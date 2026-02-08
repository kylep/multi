# sillyapp - iOS App

## Build

```sh
xcodebuild -project sillyapp.xcodeproj -scheme sillyapp -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -quiet build
```

## Test

The simulator must be booted before running tests. Boot it once, then run:

```sh
xcrun simctl boot 'iPhone 17 Pro'
xcodebuild -project sillyapp.xcodeproj -scheme sillyapp -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -quiet test
```

Shut down simulators after testing to avoid multiple clones eating resources:

```sh
xcrun simctl shutdown all
```

Note: xcodebuild may spawn multiple simulator clones for parallel test execution (unit tests + UI tests run on separate clones). This is normal but heavy — shut them down when done.

## Project Structure

- SwiftUI app (sillyapp.xcodeproj)
- Source files in `sillyapp/` (ContentView.swift, Item.swift, sillyappApp.swift)
- Unit tests in `sillyappTests/` (uses Swift Testing framework with `@Test`)
- UI tests in `sillyappUITests/` (uses XCTest/XCUIApplication)
