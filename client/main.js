import * as Canvas from './canvas.js';
import * as Socket from './websocket.js';

// Application State
let operations = [];
let remoteStrokes = {}; // Map of ID -> Stroke
let remoteCursors = {}; // Map of UserID -> Pos
let currentStroke = null;

let appState = {
    tool: "pen",
    color: "#000000",
    width: 2
};

// --- Initialization ---
Canvas.initCanvas();

// --- Main Render Loop ---
function render() {
    Canvas.clearCanvas();

    // 1. Draw Committed Operations
    operations.forEach(op => {
        if (!op.deleted) Canvas.drawStroke(op);
    });

    // 2. Draw Remote Strokes (In-Progress)
    Object.values(remoteStrokes).forEach(stroke => {
        Canvas.drawStroke(stroke);
    });

    // 3. Draw Local Current Stroke
    if (currentStroke) {
        Canvas.drawStroke(currentStroke);
    }

    // 4. Draw Remote Cursors (With Timeout Logic)
    const now = Date.now();
    Object.values(remoteCursors).forEach(cursor => {
        // FIX: Only draw if updated in the last 3000ms (3 seconds)
        if (cursor.lastUpdate && (now - cursor.lastUpdate < 3000)) {
            // FIX: Use cursor.color to match the "sync options" requirement
            Canvas.drawCursor(cursor, cursor.color || "#ff0055");
        }
    });
}

// Ensure resize redraws content
window.addEventListener('canvas-resize', render);

// --- UI Controls ---
document.getElementById("colorPicker").addEventListener("input", (e) => appState.color = e.target.value);
document.getElementById("brushSize").addEventListener("input", (e) => appState.width = parseInt(e.target.value));
document.getElementById("penBtn").onclick = () => { appState.tool = "pen"; updateActiveButton("penBtn"); };
document.getElementById("eraserBtn").onclick = () => { appState.tool = "eraser"; updateActiveButton("eraserBtn"); };
document.getElementById("undoBtn").onclick = () => Socket.emitUndo();
document.getElementById("redoBtn").onclick = () => Socket.emitRedo();
document.getElementById("clearBtn").onclick = () => Socket.emitClear();

function updateActiveButton(id) {
    document.querySelectorAll(".tool-group button").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// --- Input Handling ---
const canvasEl = document.getElementById("canvas");

canvasEl.addEventListener("mousedown", (e) => {
    const pos = Canvas.getMousePos(e);
    const id = Socket.getSocketId();
    
    currentStroke = {
        id: id + Date.now(), // Globally Unique ID
        userId: id,
        tool: appState.tool,
        color: appState.tool === "eraser" ? null : appState.color,
        width: appState.tool === "eraser" ? appState.width * 5 : appState.width,
        points: [pos],
        deleted: false
    };

    Socket.emitDrawStart(currentStroke);
    render();
});

canvasEl.addEventListener("mousemove", (e) => {
    const pos = Canvas.getMousePos(e);
    
    Socket.emitCursorMove({
        x: pos.x,
        y: pos.y,
        color: appState.color,
        tool: appState.tool
    });

    if (!currentStroke) return;

    currentStroke.points.push(pos);
    Socket.emitDrawProgress({ id: currentStroke.id, point: pos });
    render();
});

window.addEventListener("mouseup", () => {
    if (!currentStroke) return;
    
    // Optimistic Update: Add locally immediately
    operations.push(currentStroke);
    Socket.emitDrawEnd(currentStroke);
    
    currentStroke = null;
    render();
});

// --- Socket Event Responses ---

Socket.onInit((serverOps) => {
    operations = serverOps;
    render();
});

Socket.onUpdateState((serverOps) => {
    operations = serverOps;
    // Critical: Clear remote ghosts on state refresh
    remoteStrokes = {}; 
    render();
});

Socket.onDrawStart((stroke) => {
    if (stroke.userId !== Socket.getSocketId()) {
        remoteStrokes[stroke.id] = stroke;
    }
});

Socket.onDrawProgress(({ id, point }) => {
    if (remoteStrokes[id]) {
        remoteStrokes[id].points.push(point);
        render();
    }
});

Socket.onDrawEnd((stroke) => {
    delete remoteStrokes[stroke.id];
    // Only add if not ours (we already added ours in mouseup)
    if (stroke.userId !== Socket.getSocketId()) {
        operations.push(stroke);
    }
    render();
});

// FIX: Update the listener to add the timestamp
Socket.onCursorMove((data) => {
    // Add 'lastUpdate' timestamp so render() knows when to expire it
    remoteCursors[data.userId] = { ...data, lastUpdate: Date.now() };
    render();
});

Socket.onUserCount((count) => {
    document.getElementById("userCount").innerText = count;
});

Socket.onCursorLeave((userId) => {
    delete remoteCursors[userId];
    render();
});