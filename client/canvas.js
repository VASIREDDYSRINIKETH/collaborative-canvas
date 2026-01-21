/**
 * Handles all direct Canvas API interactions.
 * Pure function style where possible.
 */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND_COLOR = "#ffffff";

// State needed for rendering
let canvasState = {
    width: 0,
    height: 0,
    scale: 1
};

export function initCanvas() {
    const resize = () => {
        canvasState.scale = window.devicePixelRatio || 1;
        canvasState.width = window.innerWidth;
        canvasState.height = window.innerHeight;

        canvas.width = canvasState.width * canvasState.scale;
        canvas.height = canvasState.height * canvasState.scale;

        canvas.style.width = canvasState.width + "px";
        canvas.style.height = canvasState.height + "px";
        
        // Reset scale prevents drift on multiple resizes
        ctx.setTransform(canvasState.scale, 0, 0, canvasState.scale, 0, 0);
    };

    window.addEventListener("resize", () => {
        resize();
        // Dispatch event so main.js knows to redraw
        window.dispatchEvent(new CustomEvent('canvas-resize'));
    });
    
    resize();
}

export function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
}

export function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Use physical pixels to clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// "Canvas Mastery": Smooth line rendering
export function drawStroke(stroke) {
    if (!stroke.points || stroke.points.length === 0) return;

    const width = canvasState.width;
    const height = canvasState.height;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.width;

    if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();

    if (stroke.points.length < 3) {
        // Dot for single click
        const p = stroke.points[0];
        ctx.moveTo(p.x * width, p.y * height);
        ctx.lineTo(p.x * width, p.y * height);
    } else {
        // Quadratic Curve Smoothing
        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        
        for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            
            // Calculate mid-point
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            ctx.quadraticCurveTo(
                p1.x * width, p1.y * height, 
                midX * width, midY * height
            );
        }
    }

    ctx.stroke();
    ctx.restore();
}

export function drawCursor(cursor) {
    ctx.save();
    
    // 1. Set Color (Syncs with user's selection)
    ctx.fillStyle = cursor.tool === 'eraser' ? '#ffffff' : cursor.color;
    ctx.strokeStyle = '#000000'; // Border for visibility
    ctx.lineWidth = 1;

    ctx.beginPath();
    
    // 2. Change Shape based on Tool
    const x = cursor.x * canvasState.width;
    const y = cursor.y * canvasState.height;

    if (cursor.tool === "eraser") {
        // Draw a square for Eraser
        ctx.rect(x - 5, y - 5, 10, 10);
    } else {
        // Draw a circle for Pen
        ctx.arc(x, y, 5, 0, Math.PI * 2);
    }
    
    ctx.fill();
    ctx.stroke(); // Draw border
    
    // Optional: Draw User ID text
    ctx.fillStyle = "#555";
    ctx.font = "10px Arial";
    ctx.fillText(cursor.userId.slice(0, 4), x + 8, y);
    
    ctx.restore();
}