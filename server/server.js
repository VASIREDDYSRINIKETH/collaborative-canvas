const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path"); // <--- Import path module
const drawingState = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// <--- FIX: Use path.join to correctly locate the client folder
app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
    // 1. Send Initial State
    socket.emit("INIT", drawingState.getOperations());
    io.emit("USER_COUNT", io.engine.clientsCount);

    // 2. Event Stream
    socket.on("DRAW_START", (stroke) => {
        socket.broadcast.emit("DRAW_START", stroke);
    });

    socket.on("DRAW_PROGRESS", (data) => {
        socket.broadcast.emit("DRAW_PROGRESS", data);
    });

    socket.on("DRAW_END", (stroke) => {
        drawingState.addOperation(stroke);
        socket.broadcast.emit("DRAW_END", stroke);
    });

    socket.on("CURSOR_MOVE", (data) => {
        
        socket.broadcast.emit("CURSOR_MOVE", { 
            userId: socket.id, 
            x: data.x, 
            y: data.y,
            color: data.color, // Sync Color
            tool: data.tool  
        });
    });

    // 3. State Management (Global Sync)
    socket.on("UNDO", () => {
        if (drawingState.undo(socket.id)) {
            io.emit("UPDATE_STATE", drawingState.getOperations());
        }
    });

    socket.on("REDO", () => {
        if (drawingState.redo(socket.id)) {
            io.emit("UPDATE_STATE", drawingState.getOperations());
        }
    });

    socket.on("CLEAR_ALL", () => {
        drawingState.clearAll();
        io.emit("UPDATE_STATE", drawingState.getOperations());
    });

    socket.on("disconnect", () => {
        io.emit("USER_COUNT", io.engine.clientsCount);
        // FIX: Tell everyone to remove this user's cursor
        io.emit("CURSOR_LEAVE", socket.id); 
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});