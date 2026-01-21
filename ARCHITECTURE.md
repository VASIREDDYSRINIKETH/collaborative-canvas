# 🏗️ Architecture & Technical Decisions

This document outlines how the **Collaborative Canvas** works under the hood. We focused on keeping the architecture clean, modular, and scalable for real-time interaction.

## 1. Data Flow: How Drawing Works
We use a **Client-Server** model powered by WebSockets. Here is the lifecycle of a single brush stroke:



1.  **Input (Client):** The user clicks and drags. We capture raw mouse coordinates.
2.  **Normalization:** We convert pixels (`x: 500`) into relative ratios (`x: 0.5`). This ensures the drawing looks the same on a phone and a desktop monitor.
3.  **Optimistic Rendering:** The client draws the line immediately. We don't wait for the server to say "okay." This makes the app feel instant (zero latency).
4.  **Streaming:** As the mouse moves, we emit `DRAW_PROGRESS` events to the server containing the new points.
5.  **Broadcast:** The server immediately broadcasts these points to all other connected clients.
6.  **Remote Rendering:** Other clients receive the data and draw it into a temporary "Remote Layer" so they see the line growing in real-time.
7.  **Commit:** When the user releases the mouse (`mouseup`), the full stroke object is saved to the server's history.

## 2. The Tricky Part: Global Undo/Redo
Standard "Ctrl+Z" doesn't work in a multiplayer environment. If User A draws a line, and then User B draws a line, we don't want User A's "Undo" to delete User B's work.

**Our Solution: User-Centric History**
Instead of a simple stack, we treat the canvas history as a database of operations.

* **The Logic:** When you click Undo, the server looks at the history list *backwards*.
* **The Filter:** It searches for the most recent operation where `op.userId === YOUR_ID`.
* **Soft Delete:** We don't remove the data. We flag it as `deleted: true`. This allows us to "Redo" it later if needed.
* **Sync:** The server sends the updated state to everyone. Clients wipe their canvas and redraw the list (skipping deleted items).

## 3. Performance Optimizations
Drawing on the web can get slow if you aren't careful. We made a few specific choices to keep it fast:

* **Quadratic Smoothing:** Raw mouse movement is jagged. We use `quadraticCurveTo` to calculate control points between mouse events, creating organic, smooth curves instead of sharp polygons.
* **DPI Scaling:** We use `window.devicePixelRatio` to scale the internal canvas resolution. This keeps lines sharp on Retina displays without breaking coordinate math.
* **Ghost Layer:** We separate "committed" strokes from "in-progress" remote strokes in memory (`remoteStrokes`). This prevents flickering and makes managing state updates much cleaner.

## 4. Conflict Resolution
What happens if two people draw in the same spot at the same time?
* **Painter's Algorithm:** We render strokes in chronological order. Newer strokes simply float on top of older ones.
* **Unique IDs:** Every stroke gets a composite ID (`socket.id + timestamp`). This guarantees that even if two users click at the exact same millisecond, their strokes are treated as unique objects and won't merge or crash the app.