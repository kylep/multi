# Silly App — Implementation Specification

> Detailed, feature-by-feature specification for the Claude coding agent.
> Cross-reference with `ARCHITECTURE.md` for technology choices and `spec/tests/*.feature` for acceptance criteria.

---

## 0. Current State

The app is a minimal SwiftUI + SwiftData proof-of-concept:
- Single `Item` model with a `timestamp` property.
- `ContentView` displays a list of items with add/delete.
- No authentication, no networking, no photos, no social features.

**Goal**: Transform this skeleton into the full Silly App described below.

---

## 1. Feature: Identity (Authentication)

### 1.1 Google OAuth Sign-In

**Models:**
- `User` — SwiftData `@Model` caching the Firebase user profile locally.
  - `uid: String` (Firebase UID, primary key)
  - `displayName: String`
  - `email: String`
  - `photoURL: String?`
  - `createdAt: Date`

**Service: `AuthService`**
- Protocol: `AuthServiceProtocol`
  - `func signIn() async throws -> User`
  - `func signOut() throws`
  - `var currentUser: User? { get }`
  - `var isAuthenticated: Bool { get }`
- Implementation uses `GoogleSignIn` SDK to present the native sign-in flow, then exchanges the Google credential for a Firebase Auth credential.
- On first sign-in, creates a `/users/{uid}` Firestore document.
- On subsequent sign-ins, updates `displayName` and `photoURL` if changed.

**ViewModel: `AuthViewModel`**
- `@Published var user: User?`
- `@Published var isLoading: Bool`
- `@Published var error: String?`
- `func signIn()` — calls `AuthService.signIn()`
- `func signOut()` — calls `AuthService.signOut()`, clears local state

**Views:**
- `LoginView` — Centered logo, app name, "Sign in with Google" button.
- `ProfileView` — Shows user photo, name, email; "Sign Out" button.
- `RootView` — Checks `AuthViewModel.isAuthenticated`; shows `LoginView` or main tab bar.

### 1.2 Session Persistence

- Firebase Auth persists sessions automatically.
- On app launch, `AuthService` checks `Auth.auth().currentUser`.
- If present, hydrate `AuthViewModel.user` from Firestore cache, then refresh from server.

---

## 2. Feature: Track Silly Things

### 2.1 Data Model

**`SillyThing` — SwiftData `@Model`**
- `id: String` (Firestore document ID)
- `authorId: String` (FK → User.uid)
- `type: SillyThingType` (enum: `.text`, `.photo`)
- `textContent: String?`
- `photoURL: String?`
- `localPhotoData: Data?` (transient, for upload queue)
- `createdAt: Date`
- `heartCount: Int` (denormalized for leaderboard performance)
- `averageRating: Double` (denormalized)

### 2.2 Add Text Silly Thing

**Flow:**
1. User taps "+" tab or floating action button.
2. `TextEntryView` presents a text field and "Post" button.
3. `CreateViewModel.submitText(content)`:
   - Validates non-empty, max 500 characters.
   - Calls `FirestoreService.createSillyThing(...)`.
   - Caches locally in SwiftData.
4. Dismiss and navigate to Feed.

### 2.3 Add Photo Silly Thing

**Flow — Camera:**
1. User taps camera icon in Create view.
2. `CameraView` wraps `UIImagePickerController` (or `PhotosUI.PhotosPicker` for library).
3. On capture/selection, image is compressed to JPEG (max 1MB).
4. `CreateViewModel.submitPhoto(image, caption?)`:
   - Uploads to Firebase Cloud Storage at `sillyThings/{id}/photo.jpg`.
   - Creates Firestore document with `photoURL`.
   - Caches locally.

**Flow — Share Extension:**
1. User shares an image from Photos or another app.
2. `ShareViewController` receives the image.
3. If authenticated (shared keychain group), uploads directly.
4. If not authenticated, shows a prompt to open the main app.

### 2.4 Service: `FirestoreService`

Protocol: `FirestoreServiceProtocol`

```swift
func createSillyThing(_ st: SillyThing) async throws -> String
func deleteSillyThing(id: String) async throws
func fetchSillyThings(forUser userId: String, limit: Int) async throws -> [SillyThing]
func fetchFriendsFeed(userId: String, friendIds: [String], limit: Int, after: Date?) async throws -> [SillyThing]
func fetchSillyThingOfTheDay(userId: String, friendIds: [String]) async throws -> [SillyThing]
```

### 2.5 Service: `StorageService`

Protocol: `StorageServiceProtocol`

```swift
func uploadImage(data: Data, path: String) async throws -> URL
func deleteImage(path: String) async throws
func downloadURL(path: String) async throws -> URL
```

---

## 3. Feature: Review Silly Things (Feed)

### 3.1 Chronological Feed

**ViewModel: `FeedViewModel`**
- `@Published var sillyThings: [SillyThing]`
- `@Published var isLoading: Bool`
- `@Published var selectedFilter: FeedFilter` (`.all`, `.mine`, `.friend(id)`)
- `func loadFeed()` — fetches from Firestore, merges with local cache.
- Pagination: load 20 items, load more on scroll to bottom.

**View: `FeedView`**
- Vertical scrolling list of `SillyThingCard` views.
- Pull-to-refresh.
- Filter picker (segmented control or sheet): All, Mine, by Friend.
- Each card shows:
  - Author avatar + name
  - Photo (if photo type) with async loading
  - Text content
  - Timestamp (relative: "2 hours ago")
  - Heart count + heart button
  - Average rating badge

### 3.2 Silly Thing Detail

**View: `SillyThingDetailView`**
- Full-screen photo (if photo type) with pinch-to-zoom.
- Text content.
- Rating slider (0-100).
- Heart button with animation.
- Heart History link.
- `...` menu: Delete (if author), Report (future).

### 3.3 Silly Thing of the Day

**Logic:** Query Firestore for SillyThings created on this calendar day (month + day) in any prior year, authored by the current user or their friends.

**View: `SillyThingOfTheDayView`**
- Card carousel of matching SillyThings.
- Shows the year: "From 2 years ago!"
- Empty state: "No silly memories from this day yet."

**Notification:** FCM push at 9:00 AM local time if there are matches.

### 3.4 Filter by Friend

- `FeedView` filter picker includes each friend's name.
- `FeedViewModel.loadFeed()` applies Firestore query filter on `authorId`.

---

## 4. Feature: Rate Silly Things

### 4.1 Rating (0-100)

**Model: `Rating`**
- `id: String`
- `sillyThingId: String`
- `userId: String`
- `score: Int` (0-100)
- `updatedAt: Date`

**ViewModel: `RatingViewModel`**
- `func updateRating(sillyThingId: String, score: Int)` — upserts.
- `func fetchMyRating(sillyThingId: String) -> Int?`

**UI:** Custom slider in `SillyThingDetailView`. Label shows the numeric value. On release, saves.

### 4.2 Hearts

**Model: `Heart`**
- `id: String`
- `sillyThingId: String`
- `userId: String`
- `heartDate: Date` (date-only, no time component)
- `createdAt: Date`

**Rules:**
- One heart per user per SillyThing per calendar day.
- User can remove their heart for today.
- Hearts from prior days are permanent.

**ViewModel (in `RatingViewModel`):**
- `func toggleHeart(sillyThingId: String)` — checks today's heart, adds or removes.
- `func fetchHeartHistory(sillyThingId: String) -> [Heart]`

**UI:**
- Heart button with filled/unfilled state.
- Tap animates (scale bounce).
- `HeartHistoryView` — list of dates and users who hearted, grouped by date.

---

## 5. Feature: Friends

### 5.1 Data Model

**`Friendship`**
- `id: String`
- `requesterId: String`
- `receiverId: String`
- `status: FriendshipStatus` (`.pending`, `.accepted`, `.declined`)
- `createdAt: Date`
- `updatedAt: Date`

### 5.2 Invite Friend

**Flow:**
1. User taps "Invite Friend" in Friends tab.
2. Enters friend's email address.
3. `FriendsViewModel.sendInvite(email:)`:
   - Looks up user by email in `/users` collection.
   - If found, creates `Friendship` document with status `.pending`.
   - If not found, shows "User not found" error.

### 5.3 Accept / Decline / Review Invites

**View: `InviteResponseView`**
- Lists pending invites where `receiverId == currentUser.uid`.
- Each row: requester name, avatar, Accept / Decline buttons.
- Accept: updates status to `.accepted`.
- Decline: updates status to `.declined`.

### 5.4 Remove Friend

- In `FriendsListView`, swipe-to-delete on a friend.
- Confirmation alert.
- Deletes the `Friendship` document.

### 5.5 Friends List

**View: `FriendsListView`**
- Shows all accepted friends with avatar + name.
- Tap navigates to that friend's SillyThings feed (filtered).
- "Invite Friend" button at top.
- Pending invites section (badge count on tab).

---

## 6. Feature: Leaderboard

### 6.1 Views

**View: `LeaderboardView`**
- Segmented control: "Most Hearts" | "Most Silly"
- Time period picker: Week, Month, Year, All Time
- Ranked list of SillyThings with:
  - Rank number (1, 2, 3 with trophy icons, then 4, 5, ...)
  - Thumbnail (if photo) or text preview
  - Author name
  - Heart count or average rating
- Scope: current user's SillyThings + friends' SillyThings.

### 6.2 Query Strategy

**Most Hearts:**
- Firestore query on `sillyThings` collection, filtered by `authorId in [user + friends]`, ordered by `heartCount` descending.
- Time filter: `createdAt >= startOfPeriod`.

**Most Silly (by rating):**
- Same filter, ordered by `averageRating` descending.

**Denormalization:**
- `heartCount` and `averageRating` on the `SillyThing` document are updated via Firestore transactions when ratings/hearts change.
- This avoids expensive aggregation queries.

---

## 7. Feature: Delete Silly Things

### 7.1 Swipe to Delete

- In `FeedView`, left-swipe on own SillyThings reveals delete button.
- Tap shows confirmation alert: "Delete this Silly Thing? This can't be undone."
- On confirm:
  - Delete from Firestore.
  - Delete photo from Cloud Storage (if exists).
  - Delete associated ratings and hearts (batch delete).
  - Remove from local SwiftData cache.

### 7.2 Detail View Delete

- In `SillyThingDetailView`, `...` menu includes "Delete" option (only for author).
- Same confirmation flow as swipe.

---

## 8. UI/UX Specification

### 8.1 Color Palette

| Name | Hex | Usage |
|---|---|---|
| Silly Blue | `#ADD9FF` | Primary background (current) |
| Silly Pink | `#FFB6C1` | Accent, hearts |
| Silly Yellow | `#FFE066` | Stars, ratings |
| Silly Purple | `#C3A6FF` | Buttons, highlights |
| Silly Green | `#A8E6CF` | Success states |
| Dark Text | `#2D2D2D` | Primary text |
| Light Text | `#8E8E93` | Secondary text |

### 8.2 Typography

- Title: `.largeTitle`, bold
- Heading: `.title2`, semibold
- Body: `.body`
- Caption: `.caption`, light text color

### 8.3 Navigation

- **Tab Bar** (5 tabs):
  1. Feed (house icon)
  2. Create (plus.circle icon)
  3. Leaderboard (trophy icon)
  4. Friends (person.2 icon)
  5. Profile (person.circle icon)

### 8.4 Animations

- Heart tap: scale 1.0 → 1.3 → 1.0 with spring animation.
- Card appearance: fade-in + slide-up on scroll.
- Delete: slide-out left with fade.
- Navigation: default SwiftUI push transitions.

### 8.5 Empty States

Each list view has a custom empty state with:
- Illustration (from Nano Banana).
- Descriptive text.
- Action button (e.g., "Add your first Silly Thing!").

### 8.6 Accessibility

- All images have `accessibilityLabel`.
- All interactive elements have `accessibilityIdentifier` (for UI tests).
- Dynamic Type supported (no fixed font sizes).
- VoiceOver-friendly navigation order.

---

## 9. Implementation Order

> This order minimizes unresolved dependencies at each step.

| Phase | Feature | Dependencies | Estimated Files |
|---|---|---|---|
| 1 | Models (all SwiftData entities) | None | 5 |
| 2 | Service protocols + mock implementations | Models | 8 |
| 3 | Auth (Google Sign-In + Firebase Auth) | Services | 4 |
| 4 | Create Text Silly Thing | Auth, Services | 3 |
| 5 | Feed (chronological) | Create, Services | 4 |
| 6 | Create Photo Silly Thing + Camera | Create, Services | 3 |
| 7 | Rating & Hearts | Feed, Services | 4 |
| 8 | Silly Thing Detail View | Feed, Rating | 2 |
| 9 | Friends (invite, accept, list) | Auth, Services | 4 |
| 10 | Feed Filtering + STOTD | Feed, Friends | 2 |
| 11 | Leaderboard | Rating, Friends | 2 |
| 12 | Delete flows | Feed, Detail | 1 |
| 13 | Share Extension | Create, Auth | 2 |
| 14 | Polish (assets, animations, empty states) | All | ~5 |

---

## 10. Migration from Current Code

### What to Keep
- `sillyapp.xcodeproj` — modify, don't recreate.
- `sillyappApp.swift` — extend with Firebase init and updated schema.
- `Assets.xcassets` — add new assets, keep structure.
- Test targets — extend with real tests.

### What to Replace
- `Item.swift` → replaced by `SillyThing.swift` + other models.
- `ContentView.swift` → replaced by `RootView.swift` + tab-based navigation.

### Migration Steps
1. Add SPM packages (Firebase, GoogleSignIn).
2. Add `GoogleService-Info.plist` to project.
3. Delete `Item.swift`.
4. Create all new model files.
5. Update `sillyappApp.swift` with new schema and `FirebaseApp.configure()`.
6. Replace `ContentView` body with `RootView`.
7. Build and verify clean compilation.
8. Proceed with feature implementation per Phase order above.

---

## 11. Error Handling Strategy

| Error Type | Handling |
|---|---|
| Network offline | Show cached data + "Offline" banner; queue writes for retry |
| Auth expired | Auto-refresh Firebase token; if fails, redirect to LoginView |
| Upload failed | Retry with exponential backoff (3 attempts); show error toast |
| Firestore write failed | Show error toast with retry button |
| Photo too large | Compress further; if still too large, show size error |
| User not found (invite) | Show "No user with that email" message |
| Rate limit | Show "Slow down!" toast |

---

## 12. Performance Considerations

- **Image loading**: Use `AsyncImage` with placeholder and cache (`URLCache` or `NSCache`).
- **Feed pagination**: Firestore cursor-based pagination (`.start(afterDocument:)`).
- **Denormalized counts**: `heartCount` and `averageRating` on `SillyThing` avoid aggregation queries.
- **Local cache**: SwiftData stores recently viewed items for instant feed render.
- **Photo compression**: Max 1MB JPEG before upload; resize to 1200px max dimension.
