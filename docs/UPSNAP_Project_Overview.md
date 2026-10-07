# UPSNAP --- Project Overview

## 1. Project Summary

**UPSNAP** is a web-based photo booth application that allows users to
take photos directly from a laptop or desktop webcam, preview and retake
captured images, arrange them into photo booth layouts, customize the
result, preview the final composition, and download the generated image.

UPSNAP is designed as a browser-first experience. Core functionality
runs locally in the browser, so the initial product does not require a
user account, database, cloud storage, or backend.

## 2. Goals

-   Provide a simple browser-based photo booth experience.
-   Support built-in and external webcams.
-   Show a live camera preview.
-   Reproduce a countdown-based photo booth flow.
-   Support single-photo and multi-photo sessions.
-   Preview each captured photo before acceptance.
-   Allow individual retakes without restarting the session.
-   Generate customizable photo strips and grids.
-   Preview the exact final composition before export.
-   Download the result as an image.
-   Keep core photo processing on the user's device.
-   Leave room for optional cloud and sharing features later.

## 3. Target Platform

UPSNAP initially targets laptop and desktop browsers with a built-in or
external webcam.

Priority browsers:

-   Google Chrome
-   Microsoft Edge
-   Mozilla Firefox
-   Safari

Camera support depends on the browser's MediaDevices implementation,
camera availability, permission, and secure-context requirements.

## 4. Technology Stack

### Frontend

-   **React** --- component-based UI
-   **TypeScript** --- type-safe development
-   **Vite** --- development/build tooling
-   **Tailwind CSS** --- styling
-   **React Router** --- optional screen/route navigation

### Browser APIs

-   **MediaDevices API** --- webcam discovery and permission
-   **MediaStream API** --- live webcam stream
-   **Canvas API** --- capture, composition, filters, and rendering
-   **Blob/Object URLs** --- temporary captured-image representation
-   **Browser download APIs** --- final image export
-   **IndexedDB** --- optional local history/session persistence

### Testing

-   **Vitest** --- unit testing
-   **React Testing Library** --- component testing
-   **Playwright** --- end-to-end browser testing

### Backend

No backend is required for the MVP. A backend can be introduced later
for accounts, cloud storage, shareable links, QR-based cross-device
downloads, online galleries, synchronization, or server-managed content.

## 5. Core User Journey

``` text
Home
  ↓
Photo Booth Setup
  ↓
Live Camera Preview
  ↓
Countdown
  ↓
Capture
  ↓
Captured Photo Preview
  ↓
Retake / Accept
  ↓
Repeat if necessary
  ↓
Session Review
  ↓
Customize
  ↓
Final Photo Preview
  ↓
Download
  ↓
New Session
```

## 6. Main Screens

### 6.1 Home

The Home screen introduces UPSNAP and provides a clear **Start Photo
Booth** action. Optional future actions include settings and local
history.

### 6.2 Photo Booth Setup

The user configures the session before capture. Possible options include
camera, layout, number of photos, frame/template, orientation, countdown
duration, and mirror mode.

Example:

``` text
Camera:       MacBook Camera
Layout:       4-photo strip
Countdown:    3 seconds
Mirror:       On

[ Start Session ]
```

### 6.3 Camera Preview

Displays a large live webcam feed so the user can position themselves.
It can include camera selection, session progress, mirror control,
Start, and Cancel.

### 6.4 Countdown

A prominent countdown appears before each capture:

``` text
3
2
1
CAPTURE
```

A short visual flash can indicate that a frame was captured.

### 6.5 Captured Photo Preview

Immediately after capture, the resulting still image is displayed
separately from the live preview.

Primary actions:

-   **Retake** --- discard and capture again.
-   **Accept** --- keep the image and continue.

### 6.6 Session Review

After all required photos are captured, the user sees the complete set.
They can retake one photo, retake all, or continue to customization.

### 6.7 Editor

The editor lets users change the layout, frame/background, and basic
filters while continuously previewing the result.

### 6.8 Final Preview

Displays the complete composition as closely as possible to the exported
file. The user can return to editing or download it.

## 7. Photo Customization

### Layouts

Initial layouts may include: - Single photo - Two-photo strip -
Three-photo strip - Four-photo vertical strip - 2 × 2 grid

A layout defines output dimensions, photo positions, spacing, margins,
aspect ratios, and cropping rules.

### Frames and Backgrounds

Users can select frame styles, border/background colors, and predefined
templates.

### Filters

Initial filters can include Normal, Black & White, Warm, Cool, and
Vintage.

### Later Editing Features

Brightness, contrast, saturation, text, dates, stickers, and decorative
overlays can be added after the core editor works.

## 8. Preview Model

UPSNAP contains three distinct visual states:

1.  **Live camera preview** --- continuous webcam video before capture.
2.  **Captured image preview** --- the still image immediately after
    capture, with Retake and Accept.
3.  **Final composition preview** --- the complete photo strip/grid with
    frames, filters, and decorations before download.

The final preview should use the same rendering logic as export so the
downloaded image matches what the user sees.

## 9. Image Export Pipeline

``` text
Captured Images
       ↓
Layout Configuration
       ↓
Cropping / Positioning
       ↓
Filters
       ↓
Frame / Background
       ↓
Text / Decorations
       ↓
Canvas Rendering
       ↓
PNG/JPEG Blob
       ↓
Final Preview
       ↓
Download
```

PNG is sufficient for the initial version. JPEG and configurable quality
can be added later.

## 10. Camera Architecture

``` text
React Component
      ↓
useCamera Hook
      ↓
Camera Service
      ↓
MediaDevices API
      ↓
Webcam
```

The camera layer handles permission, device enumeration, stream
creation, camera switching, stream cleanup, and camera errors. UI
components should not contain low-level camera management logic.

## 11. Capture Architecture

``` text
MediaStream
     ↓
<video>
     ↓
drawImage()
     ↓
<canvas>
     ↓
Blob / Object URL
     ↓
Captured Photo
```

Conceptual model:

``` ts
interface CapturedPhoto {
  id: string;
  imageUrl: string;
  capturedAt: Date;
  width: number;
  height: number;
}
```

## 12. Session State

A session represents one complete booth experience.

``` ts
interface PhotoSession {
  id: string;
  photos: CapturedPhoto[];
  layout: Layout;
  selectedCameraId?: string;
  countdownSeconds: number;
  mirror: boolean;
  filter?: Filter;
  frame?: Frame;
}
```

Session state should remain independent of individual presentation
components.

## 13. Suggested Project Structure

``` text
upsnap/
├── public/
│   ├── frames/
│   ├── stickers/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Countdown/
│   │   └── PhotoPreview/
│   ├── features/
│   │   ├── camera/
│   │   │   ├── CameraPreview.tsx
│   │   │   ├── CameraSelector.tsx
│   │   │   └── cameraService.ts
│   │   ├── capture/
│   │   │   ├── CaptureScreen.tsx
│   │   │   └── captureService.ts
│   │   ├── session/
│   │   │   ├── SessionReview.tsx
│   │   │   └── sessionStore.ts
│   │   ├── editor/
│   │   │   ├── PhotoEditor.tsx
│   │   │   ├── FilterSelector.tsx
│   │   │   ├── FrameSelector.tsx
│   │   │   └── LayoutSelector.tsx
│   │   └── export/
│   │       ├── FinalPreview.tsx
│   │       └── exportService.ts
│   ├── hooks/
│   │   └── useCamera.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── SetupPage.tsx
│   │   ├── CapturePage.tsx
│   │   ├── ReviewPage.tsx
│   │   ├── EditorPage.tsx
│   │   └── ResultPage.tsx
│   ├── types/
│   │   ├── camera.ts
│   │   ├── photo.ts
│   │   ├── session.ts
│   │   └── template.ts
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── tests/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 14. Detailed User Requirements

### Camera

-   The user can grant camera permission.
-   The user can view a real-time webcam preview.
-   The user can select another camera when multiple devices exist.
-   The user can mirror/unmirror the preview.
-   The app clearly reports permission and camera errors.
-   The app handles camera disconnection without crashing.

### Capture

-   The user can start a photo booth session.
-   The app displays a countdown before capture.
-   The app captures a still frame from the webcam.
-   The app gives visual feedback when capture occurs.
-   The app supports multi-photo sessions.
-   The user can see capture progress.

### Captured Image Preview

-   The user can preview every captured image.
-   The user can accept it.
-   The user can retake it.
-   A retake replaces the previous image for that slot.

### Review

-   The user can review all session photos.
-   The user can retake an individual photo.
-   The user can restart the entire session.
-   The user can accept the photo set and continue.

### Customization

-   The user can select a layout.
-   The user can select a frame/template.
-   The user can select a background.
-   The user can apply basic filters.
-   Changes are reflected in the preview.

### Final Preview and Export

-   The user can preview the fully composed output.
-   The preview reflects the exported result.
-   The user can return to editing.
-   The user can download the final image.
-   The app reports export failures without losing the session.

### Session

-   The user can cancel a session.
-   The user can immediately start another session.
-   Core functionality requires no account.
-   Core functionality requires no server upload.

## 15. Privacy

Because UPSNAP accesses a camera, privacy should be explicit:

-   Camera access occurs only after browser permission.
-   Camera streams are stopped when no longer needed.
-   Core captured photos remain client-side.
-   Core functionality does not automatically upload images.
-   Temporary object URLs and image resources are released when
    appropriate.
-   Future cloud features must clearly indicate when an upload occurs.

## 16. Error Handling

UPSNAP should handle at least:

-   **Permission denied** --- explain that camera access is required and
    can be changed in browser settings.
-   **No camera found** --- allow retry after connecting a device.
-   **Camera unavailable/in use** --- explain that another application
    or tab may be using it.
-   **Camera disconnected** --- stop capture safely and allow
    reconnection or selection.
-   **Capture failure** --- retry without destroying the session.
-   **Export failure** --- preserve the session and allow another
    attempt.
-   **Unsupported browser/API** --- clearly indicate that required
    camera functionality is unavailable.

## 17. Non-Functional Requirements

### Performance

-   Live preview should feel responsive.
-   Countdown animation should remain smooth.
-   Capture should occur with minimal perceived delay.
-   Editing changes should update quickly.
-   Final rendering should complete in a reasonable time.

### Usability

-   The main workflow should be understandable without documentation.
-   Primary actions should be visually prominent.
-   Retake and Accept should be unambiguous.
-   Users should understand the current session stage.

### Reliability

-   Camera errors must not crash the app.
-   Individual retakes must not affect unrelated photos.
-   Moving between Editor and Final Preview must preserve session state.
-   Export failure must not destroy captured work.

### Compatibility

-   Support common modern desktop browsers.
-   Test browser-specific webcam behavior.
-   Detect missing/unsupported camera APIs where possible.

### Security and Privacy

-   Use browser-controlled camera permission.
-   Do not transmit photos for core functionality.
-   Clean up camera streams and temporary object URLs.

## 18. MVP Scope

### Included

-   Webcam permission
-   Camera selection
-   Live preview
-   Mirror preview
-   Layout selection
-   Countdown
-   Single/multi-photo capture
-   Captured image preview
-   Accept/Retake
-   Session review
-   Individual retake
-   Basic strip/grid generation
-   Basic frames/backgrounds
-   Basic filters
-   Final preview
-   PNG download
-   New session
-   Camera/export error handling

### Not Required for MVP

-   Accounts
-   Backend
-   Database
-   Cloud storage
-   Online gallery
-   Social media integration
-   Email delivery
-   QR sharing
-   AI generation
-   Advanced editing
-   Payments
-   Printer integration

## 19. Development Stages

### Stage 1 --- Camera Prototype

Prove the basic browser pipeline:

``` text
Permission → Webcam → <video> → Capture → Preview → Retake
```

Deliverable: capture one photo, preview it, accept or retake.

### Stage 2 --- Photo Booth Session

Add countdown, multiple captures, progress, accept/retake, review, and
restart.

Deliverable: complete multi-photo capture flow.

### Stage 3 --- Photo Strip Generator

Add layout definitions, cropping, positioning, margins, borders, Canvas
composition, and PNG generation.

Deliverable: multiple photos combine into a downloadable strip/grid.

### Stage 4 --- Customization

Add filters, backgrounds, frames, templates, and live final preview.

Deliverable: customizable output whose preview matches export.

### Stage 5 --- Polish and Testing

Add responsive behavior, transitions, accessibility, keyboard support,
robust error states, unit tests, browser tests, and end-to-end tests.

Deliverable: stable release-ready application.

## 20. Future Extensions

Possible later additions:

-   QR code for phone download
-   Temporary cloud sharing
-   Shareable URLs
-   Accounts and personal galleries
-   Saved templates
-   Event-specific themes and branding
-   GIF/boomerang creation
-   Short video capture
-   Background removal
-   AI backgrounds
-   Collaborative event galleries
-   Direct printing
-   Mobile/tablet booth mode

A backend can be introduced only when these features require server-side
storage, authentication, synchronization, or sharing.

## 21. Architectural Principle

Keep responsibilities separated:

``` text
UI
 ↓
React Components
 ↓
Hooks / Application State
 ↓
Services
 ↓
Browser APIs
```

Camera access, capture, image processing, session state, and export
logic should not be tightly coupled to presentation components.

## 22. Initial Product Definition

The initial product is complete when a user can:

1.  Open UPSNAP in a supported browser.
2.  Grant camera permission.
3.  See the live webcam feed.
4.  Select a photo layout.
5.  Start a session.
6.  See a countdown.
7.  Capture all required photos.
8.  Preview, accept, and retake photos.
9.  Review the full session.
10. Apply basic customization.
11. Preview the final composition.
12. Download the generated image.
13. Start another session.

This is the core UPSNAP product. Online services can later be built
around this workflow without becoming dependencies of the basic photo
booth experience.
