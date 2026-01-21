// Singleton socket instance
const socket = io();

export function onInit(callback) {
    socket.on("INIT", callback);
}

export function onUpdateState(callback) {
    socket.on("UPDATE_STATE", callback);
}

export function onDrawStart(callback) {
    socket.on("DRAW_START", callback);
}

export function onDrawProgress(callback) {
    socket.on("DRAW_PROGRESS", callback);
}

export function onDrawEnd(callback) {
    socket.on("DRAW_END", callback);
}

export function onCursorMove(callback) {
    socket.on("CURSOR_MOVE", callback);
}

export function onCursorLeave(callback) {
    socket.on("CURSOR_LEAVE", callback);
}

export function onUserCount(callback) {
    socket.on("USER_COUNT", callback);
}

export function emitDrawStart(stroke) {
    socket.emit("DRAW_START", stroke);
}

export function emitDrawProgress(data) {
    socket.emit("DRAW_PROGRESS", data);
}

export function emitDrawEnd(stroke) {
    socket.emit("DRAW_END", stroke);
}

export function emitCursorMove(data) {
    socket.emit("CURSOR_MOVE", data);
}
export function emitUndo() {
    socket.emit("UNDO");
}

export function emitRedo() {
    socket.emit("REDO");
}

export function emitClear() {
    socket.emit("CLEAR_ALL");
}

export function getSocketId() {
    return socket.id;
}