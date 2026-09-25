# Interview Preparation

Anticipated interview questions organized by topic, with concise answers.

---

## Architecture & Technology Choices

### Why Next.js instead of plain React (Create React App)?

Next.js provides file-system routing, server-side rendering capabilities, built-in optimization, and a structured project layout. For a multi-page application like a video conferencing platform, App Router's layout system is a natural fit. CRA is no longer actively maintained and lacks built-in routing.

### Why the App Router instead of Pages Router?

App Router is the current recommended architecture by the Next.js team. It provides React Server Components, nested layouts, and a more intuitive file-system routing pattern. Since this is a new project, there's no reason to use the legacy approach.

### Why FastAPI instead of Django or Flask?

FastAPI is required by the assignment. Beyond that, FastAPI offers automatic request validation through Pydantic, auto-generated API documentation (Swagger), async support, and modern Python type hints. Django would be heavier than needed (includes an ORM, admin panel, auth — much of which we don't use). Flask would require more manual setup for validation and documentation.

### Why SQLite instead of PostgreSQL?

The assignment requires SQL but not a specific database server. SQLite eliminates infrastructure complexity — no database server installation, no connection management, no credentials. SQLAlchemy abstracts the SQL dialect, so migration to PostgreSQL requires only changing the connection string.

### Why SQLAlchemy instead of raw SQL?

SQLAlchemy provides a declarative model layer that maps Python classes to database tables. This makes the code more readable and maintainable than string-based SQL queries. It also provides database-agnostic query building, meaning the same code works with SQLite and PostgreSQL.

### Why REST instead of GraphQL?

REST is the simplest, most widely understood API pattern. This application has well-defined resources (meetings, participants) with predictable operations (create, read, join). GraphQL adds complexity that isn't justified — there's no need for flexible queries, no deeply nested data, and no mobile client that would benefit from reduced over-fetching.

### Why TypeScript instead of JavaScript?

TypeScript catches errors at compile time, provides better IDE support, and serves as inline documentation through type annotations. It's the industry standard for professional Next.js projects. The small overhead in verbosity is outweighed by the reduction in runtime errors.

### Why Tailwind CSS?

Tailwind enables rapid UI development with consistent design tokens. Instead of writing custom CSS files and naming classes, utility classes are applied directly in JSX. This reduces context-switching and produces a smaller production bundle through automatic purging of unused styles.

---

## Project Structure

### Why a monorepo instead of separate repositories?

A monorepo keeps the entire project in a single Git history, making atomic commits possible (e.g., changing an API endpoint and its frontend consumer in one commit). It simplifies development setup and code review. The `frontend/` and `backend/` separation still provides clear boundaries.

### Why separate `frontend/` and `backend/` directories?

They use different runtimes (Node.js vs Python), different dependency systems (`package.json` vs `requirements.txt`), and will be deployed to different platforms. Mixing them in one directory would create confusion about which files belong to which system.

### Why centralize API calls in `lib/api.ts`?

If API calls are scattered across components, changing the backend URL, adding authentication headers, or modifying error handling requires updating every component. A centralized client ensures consistency and makes refactoring a one-file change.

### Why the layered backend architecture (routes → services → models)?

This separation of concerns ensures that:
- Routes are thin (parse request, return response)
- Business logic lives in services (testable independently)
- Database access is isolated in models
This makes the code easier to test, debug, and extend.

---

## Database

### Why are participants separate from users?

A participant is a session-level concept (someone in a specific meeting), while a user is an account-level concept. Guests can join meetings without creating an account — they're participants but not users. This distinction is important for the join-with-display-name feature.

### Why use foreign keys?

Foreign keys enforce referential integrity at the database level. For example, a participant's `meeting_id` must reference an existing meeting. Without foreign keys, orphaned records could accumulate, leading to data inconsistency.

### Why is `meeting_code` separate from the database `id`?

The database `id` is an auto-incrementing integer — an internal implementation detail. Exposing it would reveal how many meetings have been created (information leakage) and produce predictable, guessable identifiers. `meeting_code` is a human-readable, randomly generated string designed for sharing.

### What are the limitations of SQLite?

- Single-writer concurrency (one write at a time, reads are concurrent)
- No network access (runs in-process only)
- Limited data types (no native DATETIME, JSON types)
- No user/role-based access control
- File-based storage is problematic in ephemeral deployment environments

---

## Deployment

### How will you deploy a Next.js + FastAPI application?

The frontend deploys to Vercel (designed for Next.js). The backend deploys separately to a Python-compatible platform (Railway, Render, or Fly.io). The frontend communicates with the backend via the `NEXT_PUBLIC_API_URL` environment variable.

### What happens to SQLite in production?

SQLite stores data in a local file. In ephemeral serverless environments, the file may be lost on redeployment. Options include:
- Using a persistent volume (Railway supports this)
- Migrating to Turso (hosted SQLite-compatible database)
- Migrating to PostgreSQL (requires only changing the connection string due to SQLAlchemy)

---

## WebRTC Video Call Architecture

### What is RTCPeerConnection and what does it do?
`RTCPeerConnection` is the core WebRTC API in the browser that handles direct peer-to-peer audio, video, and data communication between two browsers. It handles:
- Codec selection and media encoding/decoding (VP8, VP9, H.264, Opus)
- Encryption (mandatory SRTP/DTLS)
- Network transport and bandwidth estimation (RTP/RTCP, TWCC)
- NAT and firewall traversal via ICE (Interactive Connectivity Establishment) using STUN and TURN servers
- Media synchronization (lip sync between audio and video tracks)

### What does getUserMedia do?
`navigator.mediaDevices.getUserMedia({ video: true, audio: true })` requests user authorization to capture real-time audio and video from the local device's microphone and camera. It returns a promise resolving to a `MediaStream` containing `MediaStreamTrack` objects (`audio` track and `video` track). These tracks can be inspected, stopped, enabled/disabled (muted), or passed into an `RTCPeerConnection`.

### What does SDP Offer/Answer mean?
SDP (Session Description Protocol) is a text-based format describing the multimedia capabilities and network addresses of a session. WebRTC uses the Offer/Answer model:
- **Offer**: The initiating peer calls `pc.createOffer()`, generating an SDP string specifying supported codecs (e.g. VP8, Opus), encryption parameters (DTLS fingerprints), and media sections (`m=audio`, `m=video`). The initiator stores this in its local state (`setLocalDescription(offer)`) and sends it across the signaling channel.
- **Answer**: The receiving peer takes the offer (`setRemoteDescription(offer)`), calls `pc.createAnswer()`, generates an SDP answer indicating which codecs and formats it agrees to use, sets its local state (`setLocalDescription(answer)`), and transmits it back.
Once both peers have set their local and remote descriptions, the parameters of the peer-to-peer session are negotiated.

### What are ICE Candidates?
ICE (Interactive Connectivity Establishment) candidates represent potential network transport paths (IP address, port, protocol UDP/TCP, candidate type: host, server-reflexive via STUN, or relay via TURN) through which two peers can communicate.
Because devices are often behind NAT routers or cellular firewalls, peers cannot simply connect to each other's local IP. As the browser discovers viable communication endpoints via STUN/TURN, it fires `pc.onicecandidate`. These candidate objects are trickled through the signaling server to the remote peer, which adds them via `pc.addIceCandidate()`. The ICE agent then performs connectivity checks (STUN binding requests) to select the lowest-latency viable path.

### What does signaling do?
WebRTC intentionally does not prescribe a signaling protocol. Signaling is the out-of-band communication channel used by peers to:
1. Discover each other in a room
2. Exchange SDP offers and answers
3. Exchange ICE candidates
4. Synchronize room presence (join, leave) and media states (mute, camera toggle)
In Voom, signaling is implemented via a dual-engine FastAPI backend:
- High-efficiency WebSocket signaling (`/ws/meeting/{code}/{participant_id}`) for low-latency duplex transmission
- Fallback HTTP signaling (`POST /api/meetings/{code}/signal` and long-polling `GET /api/meetings/{code}/signal`) with normalized lowercase room codes to ensure rock-solid reliability through restrictive proxies and single-port tunnels.

### How do participants discover each other?
1. When a user enters `/meeting/[meetingId]`, the client generates a unique persistent session ID (`participantId`).
2. The client sends a `join` signal to the room code with their display name.
3. The backend registers the participant in the room dictionary and broadcasts a `peer-joined` signal to all existing room participants.
4. When existing peers receive `peer-joined` or query active participants via signaling, they discover the new peer's presence.

### How are local tracks added to RTCPeerConnection?
Local tracks obtained from `getUserMedia()` are added using the modern WebRTC Unified Plan standard:
- If local media is ready when initializing the connection:
  ```typescript
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  ```
- If local media permissions are pending or not yet resolved, the peer creates transceivers with `direction: "recvonly"`.
- When `localStream` arrives or updates, the client inspects `pc.getTransceivers()`. If a transceiver already exists for that media kind, it sets `transceiver.direction = "sendrecv"` and calls `transceiver.sender.replaceTrack(track)`. If not, it invokes `pc.addTrack(track, localStream)`.
This guarantees that each media track (audio, video) maps to exactly one media section (`m-line`) without duplicate transceivers.

### How are remote tracks received?
When the remote peer sends tracks, the receiver's `RTCPeerConnection` fires the `ontrack` event (`pc.ontrack = (event) => ...`):
- `event.track`: The received `MediaStreamTrack` (audio or video).
- `event.streams`: Array of remote `MediaStream` instances associated with the track.
- `event.transceiver`: The `RTCRtpTransceiver` handling this media section.

### How does the remote video element get its MediaStream?
1. In the `ontrack` callback, the handler maintains a persistent `remoteStreamRef` accumulator.
2. It purges any obsolete tracks of the same kind to prevent track collision, adds the incoming track, and also incorporates any tracks bundled in `event.streams[0]`.
3. To notify React and trigger a clean re-render, it creates a fresh `new MediaStream(tracks)` wrapper and calls `setRemoteStream(freshStream)`.
4. The JSX attaches a callback ref:
   ```tsx
   <video
     ref={(el) => {
       remoteVideoRef.current = el;
       if (el && remoteStream && el.srcObject !== remoteStream) {
         el.srcObject = remoteStream;
         el.play().catch(console.warn);
       }
     }}
     autoPlay
     playsInline
   />
   ```
5. An additional `event.track.onunmute` listener ensures that as soon as the first RTP packets arrive over the network, `videoElement.play()` is called, bypassing browser autoplay limitations.

---

### Why did the original bug occur?
**Root Cause Analysis:**
In the original implementation, `getOrCreatePeerConnection` was adding blank transceivers with direction `"sendrecv"`:
```typescript
pc.addTransceiver("video", { direction: "sendrecv" });
pc.addTransceiver("audio", { direction: "sendrecv" });
```
and then immediately followed with:
```typescript
activeLocal.getTracks().forEach((track) => pc.addTrack(track, activeLocal));
```
In WebRTC Unified Plan, calling `addTransceiver("video", { direction: "sendrecv" })` creates a transceiver whose `sender.track` is `null`. Because its direction is already `"sendrecv"` (rather than `"recvonly"` or `"inactive"`), subsequent calls to `addTrack` **cannot reuse it**; instead, `addTrack` creates a *second* video transceiver and a *second* audio transceiver.

As a result, Device A's SDP offer contained **4 media sections (m-sections)**:
- `m0`: video (`sendrecv`) with NO sender track (dummy)
- `m1`: audio (`sendrecv`) with NO sender track (dummy)
- `m2`: video (`sendrecv`) containing Device A's REAL video track
- `m3`: audio (`sendrecv`) containing Device A's REAL audio track

### Why did the bug affect one device but not the other?
WebRTC negotiation is asymmetric in how offers and answers match media sections:
1. **Device B (The Answerer):**
   - When Device B received Device A's offer and called `setRemoteDescription(offer)`, WebRTC matched Device B's local tracks to the first available m-sections (`m0` for video and `m1` for audio).
   - In Device B's answer, `m0` was filled with Device B's real video track.
   - For Device B, `ontrack` fired for `m0` (the dummy section from Device A), creating a receiver that never received RTP packets from Device A. Device B accumulated `m0` into its stream.
   - HTML5 `<video>` elements only render the first video track in a `MediaStream` (`getVideoTracks()[0]`). Because `m0` was index 0 and had no video frames, Device B's remote video element stayed completely black/frozen. Device B could never see Device A.
2. **Device A (The Offerer):**
   - When Device A received Device B's answer, Device B had bound its camera to `m0`.
   - Device A's browser received incoming RTP frames on `m0` and successfully rendered Device B's video.
   - Therefore, Device A saw Device B, but Device B saw a dead track from Device A.

Furthermore, there was a second bug: **Signaling Glare**. Both participants attempted to call `startCallAsInitiator()` simultaneously upon seeing `peer-joined`, causing offer collisions that failed on the peer that did not handle rollback.

### What exact change fixed it?
1. **Eliminated Dummy Sendrecv Transceivers:**
   If `activeLocal` has media tracks, we directly attach them with `pc.addTrack(track, activeLocal)`. We only add transceivers if local media is pending, and crucially set their direction to `"recvonly"`, allowing `replaceTrack` to reuse the existing m-section when permissions resolve.
2. **Deterministic Initiator & Perfect Negotiation:**
   We enforce deterministic calling: only the peer with the lexicographically smaller ID (`participantId < peer.id`) creates and sends the offer. The other peer acts as polite answerer (`isPolite = participantId > msg.sender_id`), rolling back via `pc.setLocalDescription({ type: "rollback" })` if glare occurs.
3. **Clean Track Accumulation & React Reference Refresh:**
   In `ontrack`, we purge any stale track of the same kind, accumulate all active tracks into `remoteStreamRef`, and create a fresh `MediaStream` wrapper for `setRemoteStream(freshStream)`. This ensures React re-renders and re-binds `srcObject` whenever a new track (video or audio) is received.
4. **Autoplay Safeguards:**
   Added `event.track.onunmute` handlers and explicit `.play().catch(...)` handlers on the remote video element to prevent browser autoplay policies from pausing the incoming stream.

---

*This document is maintained for architectural reference and technical interviews.*
